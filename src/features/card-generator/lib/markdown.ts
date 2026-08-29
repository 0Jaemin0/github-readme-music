import { CARD_OUTPUT_WIDTHS } from "../model/options";
import type { CardMeta, CardStyleId, CardTheme, Track } from "../model/types";
import { createSvgCardParams } from "./svg-card";

export function buildMarkdown(
  track: Track,
  style: CardStyleId,
  meta: CardMeta,
  theme: CardTheme,
  progressSeconds: number,
  origin: string,
): string {
  const youtubeUrl = new URL(`https://www.youtube.com/watch?v=${track.videoId}`);
  if (progressSeconds > 0) youtubeUrl.searchParams.set("t", String(Math.floor(progressSeconds)));
  const params = createSvgCardParams(track, style, meta, theme, progressSeconds);
  const cardUrl = `${origin.replace(/\/$/, "")}/card/${track.videoId}.svg?${params.toString()}`;
  const alt = escapeHtmlAttribute(`${meta.title} — ${meta.artist}`);

  return `<a href="${youtubeUrl.toString()}" target="_blank" rel="noopener noreferrer"><img src="${cardUrl}" alt="${alt}" width="${CARD_OUTPUT_WIDTHS[style]}" /></a>`;
}

function escapeHtmlAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
