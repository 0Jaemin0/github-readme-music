import 'server-only';

import { createHash } from 'node:crypto';
import { isVideoThumbnailUrl } from '../lib/youtube-thumbnail';
import { isSvgVideoId, parseSvgCardData, serializeSvgCardData } from '../lib/svg-card';

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

export function createStoredCardContentHash(videoId: string, cardData: StoredCardData) {
  const sortedParams = Object.fromEntries(
    Object.entries(cardData.params).sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0)),
  );
  const payload = JSON.stringify({ videoId, params: sortedParams });

  return createHash('sha256').update(payload).digest('hex');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.keys(value).length <= 30 &&
    Object.values(value).every((item) => typeof item === 'string' && item.length <= 512)
  );
}
