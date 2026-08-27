"use client";

import { useMemo, useState, useTransition } from "react";
import { buildMarkdown } from "../lib/markdown";
import { parseYouTubeId, suggestArtist, suggestTitle } from "../lib/youtube";
import { getMockTrack } from "../mocks/tracks";
import { DEFAULT_THEME } from "../model/options";
import type { CardMeta, CardStyleId, CardTheme, Track } from "../model/types";

type Status = "idle" | "loading" | "ready";

const INITIAL_META: CardMeta = {
  title: "",
  artist: "",
};

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

  const markdown = useMemo(
    () => (track ? buildMarkdown(track, style, meta, theme, progressSeconds) : ""),
    [meta, progressSeconds, style, theme, track],
  );

  function updateUrl(value: string) {
    setUrl(value);
    if (error) setError(null);
  }

  function generate() {
    const videoId = parseYouTubeId(url);

    if (!videoId) {
      setError("YouTube 링크를 입력해 주세요. youtube.com/watch?v= 또는 youtu.be/ 형식을 사용할 수 있습니다.");
      return;
    }

    setError(null);
    setStatus("loading");
    setCopied(false);

    window.setTimeout(() => {
      const nextTrack = getMockTrack(videoId);

      startTransition(() => {
        setTrack(nextTrack);
        setProgressSeconds(0);
        setMeta({
          title: suggestTitle(nextTrack.title),
          artist: suggestArtist(nextTrack.channel, nextTrack.title),
        });
        setStatus("ready");
      });
    }, 900);
  }

  async function copyMarkdown() {
    if (!markdown) return;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("클립보드를 사용할 수 없어요. 코드를 직접 선택해 복사해 주세요.");
    }
  }

  return {
    url,
    status,
    error,
    track,
    meta,
    style,
    progressSeconds,
    theme,
    copied,
    markdown,
    setMeta,
    setStyle,
    setProgressSeconds,
    setTheme,
    updateUrl,
    generate,
    copyMarkdown,
  };
}
