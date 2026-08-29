"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { buildMarkdown } from "../lib/markdown";
import { parseYouTubeId, suggestArtist, suggestTitle } from "../lib/youtube";
import { DEFAULT_THEME } from "../model/options";
import type { CardMeta, CardStyleId, CardTheme, CoverPosition, Track, YouTubeMetadata } from "../model/types";

type Status = "idle" | "loading" | "ready" | "error";
type MetadataResponse = { data?: YouTubeMetadata; error?: { message?: string } };

const INITIAL_META: CardMeta = { title: "", artist: "" };
const INITIAL_COVER_POSITION: CoverPosition = { x: 50, y: 50 };
const INVALID_URL_MESSAGE = "지원하는 YouTube 링크를 입력해 주세요.";
const FALLBACK_ERROR_MESSAGE = "영상 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";

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
  const [, startTransition] = useTransition();
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const markdown = useMemo(
    () => (track ? buildMarkdown(track, style, meta, theme, progressSeconds) : ""),
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
      setError(INVALID_URL_MESSAGE);
      setStatus("error");
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setError(null);
    setStatus("loading");
    setCopied(false);

    try {
      const response = await fetch("/api/youtube/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      const body = (await response.json()) as MetadataResponse;

      if (!response.ok || !body.data) throw new Error(body.error?.message || FALLBACK_ERROR_MESSAGE);
      if (requestId !== requestIdRef.current) return;

      const nextTrack: Track = {
        ...body.data,
        coverPosition: INITIAL_COVER_POSITION,
        waveform: createWaveform(body.data.videoId),
      };

      startTransition(() => {
        setTrack(nextTrack);
        setProgressSeconds(0);
        setMeta({ title: suggestTitle(nextTrack.title), artist: suggestArtist(nextTrack.channel, nextTrack.title) });
        setStatus("ready");
      });
    } catch (requestError) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setError(requestError instanceof Error ? requestError.message : FALLBACK_ERROR_MESSAGE);
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
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("클립보드를 사용할 수 없어 코드를 직접 선택해 복사해 주세요.");
    }
  }

  return {
    url, status, error, track, meta, style, progressSeconds, theme, copied, markdown,
    setMeta, setStyle, setProgressSeconds, setTheme, updateUrl, generate, updateCoverPosition, copyMarkdown,
  };
}

function createWaveform(videoId: string) {
  let seed = [...videoId].reduce((total, character) => total + character.charCodeAt(0), 0);

  return Array.from({ length: 20 }, () => {
    seed = (seed * 1_103_515_245 + 12_345) & 0x7fffffff;
    return 18 + (seed % 63);
  });
}
