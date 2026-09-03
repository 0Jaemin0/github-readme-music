"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { buildMarkdown } from "../lib/markdown";
import { parseYouTubeId, suggestArtist, suggestTitle } from "../lib/youtube";
import { DEFAULT_THEME } from "../model/options";
import type { CardMeta, CardStyleId, CardTheme, CoverPosition, Track, YouTubeMetadata } from "../model/types";
import { captureMonitoringError } from "@/lib/sentry-monitoring";

type Status = "idle" | "loading" | "ready" | "error";
type MetadataResponse = { data?: YouTubeMetadata; error?: { code?: string } };

const INITIAL_META: CardMeta = { title: "", artist: "" };
const INITIAL_COVER_POSITION: CoverPosition = { x: 50, y: 50, scale: 100, aspectRatio: 16 / 9 };
const CARD_ORIGIN = "https://github-readme-music.vercel.app";
const USER_ERROR_MESSAGES = {
  INVALID_REQUEST: "YouTube 영상 링크를 확인해 주세요.",
  INVALID_URL: "YouTube 영상 링크를 확인해 주세요.",
  SERVER_CONFIGURATION_ERROR: "일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  VIDEO_NOT_FOUND: "영상을 찾을 수 없거나 이 영상은 카드에 사용할 수 없습니다.",
  YOUTUBE_QUOTA_EXCEEDED: "현재 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  RATE_LIMITED: "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  REQUEST_TOO_LARGE: "요청 내용이 너무 큽니다. YouTube 링크만 입력해 주세요.",
  YOUTUBE_UNAVAILABLE: "영상 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
} as const;
const FALLBACK_ERROR_MESSAGE = USER_ERROR_MESSAGES.YOUTUBE_UNAVAILABLE;

export function useCardGenerator() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [meta, setMeta] = useState<CardMeta>(INITIAL_META);
  const [style, setStyle] = useState<CardStyleId>("player");
  const [progressSeconds, setProgressSeconds] = useState(0);
  const [theme, setTheme] = useState<CardTheme>(DEFAULT_THEME);
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

  const markdown = useMemo(
    () => (track ? buildMarkdown(track, style, meta, theme, progressSeconds, CARD_ORIGIN) : ""),
    [meta, progressSeconds, style, theme, track],
  );

  function updateUrl(value: string) {
    setUrl(value);
    if (error) {
      setError(null);
      setStatus("idle");
    }
  }

  async function generate() {
    if (!parseYouTubeId(url)) {
      setError(USER_ERROR_MESSAGES.INVALID_URL);
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

      if (!body) {
        captureMonitoringError({
          message: "영상 정보 응답을 처리할 수 없습니다",
          errorCode: "client_metadata_invalid_response",
          operation: "youtube_metadata",
          layer: "client",
          httpStatus: response.status,
        });
        throw new Error(FALLBACK_ERROR_MESSAGE);
      }

      if (response.ok && !body.data) {
        captureMonitoringError({
          message: "영상 정보 응답을 처리할 수 없습니다",
          errorCode: "client_metadata_invalid_response",
          operation: "youtube_metadata",
          layer: "client",
          httpStatus: response.status,
        });
        throw new Error(FALLBACK_ERROR_MESSAGE);
      }

      if (!response.ok || !body.data) throw new Error(getUserErrorMessage(body.error?.code));
      if (requestId !== requestIdRef.current) return;

      const nextTrack: Track = {
        ...body.data,
        coverPosition: INITIAL_COVER_POSITION,
        waveform: createWaveform(body.data.videoId),
      };

      startTransition(() => {
        setTrack(nextTrack);
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
    setTrack((currentTrack) => currentTrack ? { ...currentTrack, coverPosition } : currentTrack);
  }

  async function copyMarkdown() {
    if (!markdown) return;

    try {
      await navigator.clipboard.writeText(markdown);
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
    url, status, error, track, meta, style, progressSeconds, theme, copied, copyFeedback, markdown,
    setMeta, setStyle, setProgressSeconds, setTheme, updateUrl, generate, updateCoverPosition, copyMarkdown,
  };
}

function getUserErrorMessage(code: string | undefined) {
  if (code && code in USER_ERROR_MESSAGES) {
    return USER_ERROR_MESSAGES[code as keyof typeof USER_ERROR_MESSAGES];
  }
  return FALLBACK_ERROR_MESSAGE;
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
