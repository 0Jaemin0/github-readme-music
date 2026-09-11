import "server-only";

import { isVideoThumbnailUrl } from "./svg-cover.server";
import { isSvgVideoId, parseSvgCardData, serializeSvgCardData } from "./svg-card";

const CARD_ID_PATTERN = /^c_[A-Za-z0-9_-]{16}$/;

export type StoredCardData = {
  params: Record<string, string>;
};

export function isStoredCardId(value: string) {
  return CARD_ID_PATTERN.test(value);
}

export function normalizeStoredCardData(value: unknown, videoId: string): StoredCardData | null {
  if (!isSvgVideoId(videoId) || !isRecord(value) || !isStringRecord(value.params)) return null;

  const params = new URLSearchParams(value.params);
  const card = parseSvgCardData(params);
  if (card.cover && !isVideoThumbnailUrl(card.cover, videoId)) return null;

  return { params: serializeSvgCardData(card) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value)
    && Object.keys(value).length <= 30
    && Object.values(value).every((item) => typeof item === "string" && item.length <= 512);
}
