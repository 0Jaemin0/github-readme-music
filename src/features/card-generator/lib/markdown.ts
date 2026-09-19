import {
  CARD_OUTPUT_WIDTHS,
  createSvgCardParams,
  type CardMeta,
  type CardStyleId,
  type CardTheme,
  type Track,
} from "@/entities/music-card";

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
  const cardUrl = buildCardImageUrl(track, style, meta, theme, progressSeconds, origin);
  const alt = escapeHtmlAttribute([meta.title.trim(), meta.artist.trim()].filter(Boolean).join(" — ") || "음악 카드");

  return `<a href="${youtubeUrl.toString()}"><img src="${cardUrl}" alt="${alt}" width="${CARD_OUTPUT_WIDTHS[style]}" /></a>`;
}

export function buildCardImageUrl(
  track: Track,
  style: CardStyleId,
  meta: CardMeta,
  theme: CardTheme,
  progressSeconds: number,
  origin: string,
) {
  const params = createSvgCardParams(track, style, meta, theme, progressSeconds);
  return `${origin.replace(/\/$/, "")}/card/${track.videoId}.svg?${params.toString()}`;
}

export function buildStoredCardMarkdown(
  track: Track,
  style: CardStyleId,
  meta: CardMeta,
  progressSeconds: number,
  cardId: string,
  origin: string,
): string {
  const youtubeUrl = new URL(`https://www.youtube.com/watch?v=${track.videoId}`);
  if (progressSeconds > 0) youtubeUrl.searchParams.set("t", String(Math.floor(progressSeconds)));
  const cardUrl = `${origin.replace(/\/$/, "")}/card/${cardId}.svg`;
  const alt = escapeHtmlAttribute([meta.title.trim(), meta.artist.trim()].filter(Boolean).join(" — ") || "음악 카드");

  return `<a href="${youtubeUrl.toString()}"><img src="${cardUrl}" alt="${alt}" width="${CARD_OUTPUT_WIDTHS[style]}" /></a>`;
}

function escapeHtmlAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
