import { CARD_OUTPUT_WIDTHS } from "../model/options";
import type { CardMeta, CardStyleId, CardTheme, Track } from "../model/types";

export function buildMarkdown(
  track: Track,
  style: CardStyleId,
  meta: CardMeta,
  theme: CardTheme,
  progressSeconds: number,
): string {
  const youtubeUrl = `https://www.youtube.com/watch?v=${track.videoId}`;
  const params = new URLSearchParams({
    style,
    title: meta.title,
    artist: meta.artist,
    bg: theme.background.replace("#", ""),
    border: theme.border.replace("#", ""),
    text: theme.text.replace("#", ""),
    accent: theme.accent.replace("#", ""),
    gradient: theme.gradient ? "1" : "0",
    bw: String(theme.borderWidth),
    r: String(theme.radius),
    progress: String(Math.floor(progressSeconds)),
  });
  const cardUrl = `https://readme.fm/card/${track.videoId}.svg?${params.toString()}`;
  const alt = escapeHtmlAttribute(`${meta.title} — ${meta.artist}`);

  return `<a href="${youtubeUrl}"><img src="${cardUrl}" alt="${alt}" width="${CARD_OUTPUT_WIDTHS[style]}" /></a>`;
}

function escapeHtmlAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
