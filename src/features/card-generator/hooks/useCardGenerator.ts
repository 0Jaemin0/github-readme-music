"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { buildMarkdown, buildStoredCardMarkdown } from "../lib/markdown";
import { createSvgCardParams } from "../lib/svg-card";
import { parseYouTubeId, suggestArtist, suggestTitle } from "../lib/youtube";
import { DEFAULT_THEME } from "../model/options";
import type { CardMeta, CardStyleId, CardTheme, CoverPosition, Track, YouTubeMetadata } from "../model/types";
import { captureMonitoringError } from "@/lib/sentry-monitoring";

type Status = "idle" | "loading" | "ready" | "error";
type SaveStatus = "idle" | "saving" | "error";
type MetadataResponse = { data?: YouTubeMetadata; error?: { code?: string } };
type CreateCardResponse = { data?: { id?: string }; error?: { code?: string } };

const INITIAL_META: CardMeta = { title: "", artist: "" };
const INITIAL_COVER_POSITION: CoverPosition = { x: 50, y: 50, scale: 100, aspectRatio: 16 / 9 };
const CARD_ORIGIN = "https://github-readme-music.vercel.app";
const FALLBACK_AFTER_FAILURES = 5;
const METADATA_ERROR_MESSAGES = {
  INVALID_REQUEST: "YouTube 영상 링크를 확인해 주세요.",
  INVALID_URL: "YouTube 영상 링크를 확인해 주세요.",
  SERVER_CONFIGURATION_ERROR: "일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  VIDEO_NOT_FOUND: "영상을 찾을 수 없거나 해당 영상은 카드에 사용할 수 없습니다.",
  YOUTUBE_QUOTA_EXCEEDED: "현재 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  RATE_LIMITED: "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  REQUEST_TOO_LARGE: "요청 내용이 너무 큽니다. YouTube 링크만 입력해 주세요.",
  YOUTUBE_UNAVAILABLE: "영상 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
} as const;
const CARD_STORAGE_ERROR_MESSAGES = {
  INVALID_REQUEST: "카드 설정을 확인할 수 없습니다. 다시 시도해 주세요.",
  REQUEST_TOO_LARGE: "카드 설정 내용이 너무 큽니다. 다시 시도해 주세요.",
  RATE_LIMITED: "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  CARD_STORAGE_UNAVAILABLE: "카드를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
} as const;
const FALLBACK_ERROR_MESSAGE = METADATA_ERROR_MESSAGES.YOUTUBE_UNAVAILABLE;

export function useCardGenerator() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [meta, setMeta] = useState<CardMeta>(INITIAL_META);
  const [style, setStyle] = useState<CardStyleId>("player");
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_THEME);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [markdownKind, setMarkdownKind] = useState<"stored" | "fallback" | null>(null);
  const [failedSnapshot, setFailedSnapshot] = useState<string | null>(null);
  const [storageFailureCount, setStorageFailureCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<"success" | "error" | null>(null);
  const [, startTransition] = useTransition();
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const copyFeedbackTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    abortControllerRef.current?.abort();
    if (copyFeedbackTimerRef.current) window.clearTimeout(copyFeedbackTimerRef.current);
  }, []);

  const currentSnapshot = useMemo(() => {
    if (!track) return "";
    return createSvgCardParams(track, style, meta, theme, progressSeconds).toString();
  }, [meta, progressSeconds, style, theme, track]);
  const hasPendingMarkdownChanges = Boolean(generatedMarkdown && savedSnapshot !== currentSnapshot);
  const isFallbackMarkdown = markdownKind === "fallback" && savedSnapshot === currentSnapshot;

  function updateUrl(value: string) {
    setUrl(value);
    if (error) {
      setError(null);
      setStatus("idle");
    }
  }

  async function generate() {
    if (!parseYouTubeId(url)) {
      setError(METADATA_ERROR_MESSAGES.INVALID_URL);
      setStatus("error");
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setError(null);
    setCopyFeedback(null);
    setStatus("loading");
    setCopied(false);
    let receivedResponse = false;

    try {
      const response = await fetch("/api/youtube/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      receivedResponse = true;
      const body = await response.json().catch(() => null) as MetadataResponse | null;

      if (!body || (response.ok && !body.data)) {
        captureMonitoringError({
          message: "영상 정보 응답을 처리할 수 없습니다",
          errorCode: "client_metadata_invalid_response",
          operation: "youtube_metadata",
          layer: "client",
          httpStatus: response.status,
        });
        throw new Error(FALLBACK_ERROR_MESSAGE);
      }

      if (!response.ok || !body.data) throw new Error(getMetadataErrorMessage(body.error?.code));
      if (requestId !== requestIdRef.current) return;

      const nextTrack: Track = {
        ...body.data,
        coverPosition: INITIAL_COVER_POSITION,
        waveform: createWaveform(body.data.videoId),
      };

      startTransition(() => {
        setTrack(nextTrack);
        setGeneratedMarkdown(null);
        setSavedSnapshot(null);
        setMarkdownKind(null);
        setFailedSnapshot(null);
        setStorageFailureCount(0);
        setSaveStatus("idle");
        setSaveError(null);
        setProgressSeconds(0);
        setMeta({
          title: limitMetaText(suggestTitle(nextTrack.title)),
          artist: limitMetaText(suggestArtist(nextTrack.channel, nextTrack.title)),
        });
        setStatus("ready");
      });
    } catch (requestError) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      if (!receivedResponse) {
        captureMonitoringError({
          message: "영상 정보를 불러오는 네트워크 요청에 실패했습니다",
          errorCode: "client_metadata_network_failed",
          operation: "youtube_metadata",
          layer: "client",
        });
      }
      setError(!receivedResponse ? FALLBACK_ERROR_MESSAGE : requestError instanceof Error ? requestError.message : FALLBACK_ERROR_MESSAGE);
      setStatus("error");
    }
  }

  function updateCoverPosition(coverPosition: CoverPosition) {
    resetStorageFailures();
    setTrack((currentTrack) => currentTrack ? { ...currentTrack, coverPosition } : currentTrack);
  }

  function updateMeta(nextMeta: CardMeta) {
    resetStorageFailures();
    setMeta(nextMeta);
  }

  function updateStyle(nextStyle: CardStyleId) {
    resetStorageFailures();
    setStyle(nextStyle);
  }

  function updateProgressSeconds(nextProgressSeconds: number) {
    resetStorageFailures();
    setProgressSeconds(nextProgressSeconds);
  }

  function updateTheme(nextTheme: CardTheme) {
    resetStorageFailures();
    setTheme(nextTheme);
  }

  function resetStorageFailures() {
    setFailedSnapshot(null);
    setStorageFailureCount(0);
  }

  async function generateMarkdown() {
    if (!track || saveStatus === "saving") return;

    const snapshot = createSvgCardParams(track, style, meta, theme, progressSeconds);
    const snapshotKey = snapshot.toString();
    if (generatedMarkdown && savedSnapshot === snapshotKey && markdownKind === "stored") return;

    setSaveStatus("saving");
    setSaveError(null);
    setCopied(false);
    setCopyFeedback(null);

    let receivedResponse = false;
    let canUseCompatibilityFallback = false;
    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: track.videoId, params: Object.fromEntries(snapshot) }),
      });
      receivedResponse = true;
      const body = await response.json().catch(() => null) as CreateCardResponse | null;
      const cardId = body?.data?.id;

      if (!body || (response.ok && !cardId)) {
        canUseCompatibilityFallback = true;
        captureMonitoringError({
          message: "카드 저장 응답을 처리할 수 없습니다",
          errorCode: "client_card_storage_invalid_response",
          operation: "card_create",
          layer: "client",
          httpStatus: response.status,
        });
        throw new Error(CARD_STORAGE_ERROR_MESSAGES.CARD_STORAGE_UNAVAILABLE);
      }

      if (!response.ok || !cardId) {
        canUseCompatibilityFallback = body.error?.code === "CARD_STORAGE_UNAVAILABLE";
        throw new Error(getCardStorageErrorMessage(body.error?.code));
      }

      setGeneratedMarkdown(buildStoredCardMarkdown(track, style, meta, progressSeconds, cardId, CARD_ORIGIN));
      setSavedSnapshot(snapshotKey);
      setMarkdownKind("stored");
      setFailedSnapshot(null);
      setStorageFailureCount(0);
      setSaveStatus("idle");
    } catch (requestError) {
      if (!receivedResponse) {
        canUseCompatibilityFallback = true;
        captureMonitoringError({
          message: "카드 저장 네트워크 요청에 실패했습니다",
          errorCode: "client_card_storage_network_failed",
          operation: "card_create",
          layer: "client",
        });
      }

      if (!canUseCompatibilityFallback) {
        setFailedSnapshot(null);
        setStorageFailureCount(0);
        setSaveError(requestError instanceof Error ? requestError.message : CARD_STORAGE_ERROR_MESSAGES.CARD_STORAGE_UNAVAILABLE);
        setSaveStatus("error");
        return;
      }

      const nextFailureCount = failedSnapshot === snapshotKey ? storageFailureCount + 1 : 1;
      setFailedSnapshot(snapshotKey);
      setStorageFailureCount(nextFailureCount);

      if (nextFailureCount % FALLBACK_AFTER_FAILURES === 0) {
        setGeneratedMarkdown(buildMarkdown(track, style, meta, theme, progressSeconds, CARD_ORIGIN));
        setSavedSnapshot(snapshotKey);
        setMarkdownKind("fallback");
        setSaveError(null);
        setSaveStatus("idle");
        return;
      }

      setSaveError(requestError instanceof Error ? requestError.message : CARD_STORAGE_ERROR_MESSAGES.CARD_STORAGE_UNAVAILABLE);
      setSaveStatus("error");
    }
  }

  async function copyMarkdown() {
    if (!generatedMarkdown) return;

    try {
      await navigator.clipboard.writeText(generatedMarkdown);
      setCopied(true);
      showCopyFeedback("success");
    } catch {
      showCopyFeedback("error");
    }
  }

  function showCopyFeedback(feedback: "success" | "error") {
    if (copyFeedbackTimerRef.current) window.clearTimeout(copyFeedbackTimerRef.current);
    setCopyFeedback(feedback);
    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      setCopyFeedback(null);
      copyFeedbackTimerRef.current = null;
    }, 1800);
  }

  return {
    url, status, error, track, meta, style, progressSeconds, theme, copied, copyFeedback,
    markdown: generatedMarkdown, hasPendingMarkdownChanges, saveStatus, saveError, isFallbackMarkdown,
    setMeta: updateMeta, setStyle: updateStyle, setProgressSeconds: updateProgressSeconds, setTheme: updateTheme,
    updateUrl, generate, updateCoverPosition, generateMarkdown, copyMarkdown,
  };
}

function getMetadataErrorMessage(code: string | undefined) {
  if (code && code in METADATA_ERROR_MESSAGES) return METADATA_ERROR_MESSAGES[code as keyof typeof METADATA_ERROR_MESSAGES];
  return FALLBACK_ERROR_MESSAGE;
}

function getCardStorageErrorMessage(code: string | undefined) {
  if (code && code in CARD_STORAGE_ERROR_MESSAGES) return CARD_STORAGE_ERROR_MESSAGES[code as keyof typeof CARD_STORAGE_ERROR_MESSAGES];
  return CARD_STORAGE_ERROR_MESSAGES.CARD_STORAGE_UNAVAILABLE;
}

function createWaveform(videoId: string) {
  let seed = [...videoId].reduce((total, character) => total + character.charCodeAt(0), 0);
  return Array.from({ length: 20 }, () => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fffffff;
    return 18 + (seed % 63);
  });
}

function limitMetaText(value: string) {
  return value.slice(0, 120);
}
