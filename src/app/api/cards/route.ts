import { NextResponse } from 'next/server';
import { findOrCreateStoredCard, isSvgVideoId, normalizeStoredCardData } from '@/entities/music-card/server';
import { captureMonitoringError } from '@/shared/lib/sentry-monitoring';
import { createRequestRateLimiter } from '@/shared/lib/server/request-rate-limit';

const MAX_REQUEST_BODY_BYTES = 16_384;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_MAX_ENTRIES = 500;

const isRequestAllowed = createRequestRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: RATE_LIMIT_MAX_REQUESTS,
  maxEntries: RATE_LIMIT_MAX_ENTRIES,
});

interface CreateCardPayload {
  videoId?: unknown;
  params?: unknown;
}

const errorResponse = (status: number, code: string, message: string) => {
  return NextResponse.json({ error: { code, message } }, { status });
};

export const POST = async (request: Request) => {
  const contentLength = request.headers.get('content-length');
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_REQUEST_BODY_BYTES)) {
    return errorResponse(413, 'REQUEST_TOO_LARGE', '카드 설정 내용이 너무 큽니다. 다시 시도해 주세요.');
  }

  let payload: CreateCardPayload;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BODY_BYTES) {
      return errorResponse(413, 'REQUEST_TOO_LARGE', '카드 설정 내용이 너무 큽니다. 다시 시도해 주세요.');
    }
    payload = JSON.parse(rawBody) as CreateCardPayload;
  } catch {
    return errorResponse(400, 'INVALID_REQUEST', '카드 설정을 확인할 수 없습니다. 다시 시도해 주세요.');
  }

  if (!payload || typeof payload.videoId !== 'string' || !isSvgVideoId(payload.videoId)) {
    return errorResponse(400, 'INVALID_REQUEST', '카드 설정을 확인할 수 없습니다. 다시 시도해 주세요.');
  }

  const cardData = normalizeStoredCardData({ params: payload.params }, payload.videoId);
  if (!cardData) return errorResponse(400, 'INVALID_REQUEST', '카드 설정을 확인할 수 없습니다. 다시 시도해 주세요.');

  if (!isRequestAllowed(request)) {
    return errorResponse(429, 'RATE_LIMITED', '요청이 많습니다. 잠시 후 다시 시도해 주세요.');
  }

  try {
    const result = await findOrCreateStoredCard(payload.videoId, cardData);
    if (!result) throw new Error('Unable to allocate a unique card id');
    return NextResponse.json({ data: { id: result.id } }, { status: result.created ? 201 : 200 });
  } catch {
    captureMonitoringError({
      message: '카드 설정 저장에 실패했습니다',
      errorCode: 'card_storage_create_failed',
      operation: 'card_create',
      layer: 'server',
      httpStatus: 503,
    });
    return errorResponse(503, 'CARD_STORAGE_UNAVAILABLE', '카드를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
};
