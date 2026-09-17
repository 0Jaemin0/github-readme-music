import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  createStoredCardContentHash,
  normalizeStoredCardData,
  type StoredCardData,
} from "@/features/card-generator/lib/stored-card";
import { isSvgVideoId } from "@/features/card-generator/lib/svg-card";
import { captureMonitoringError } from "@/lib/sentry-monitoring";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MAX_REQUEST_BODY_BYTES = 16_384;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_MAX_ENTRIES = 500;

const requestWindows = new Map<string, { startedAt: number; count: number }>();

type CreateCardPayload = {
  videoId?: unknown;
  params?: unknown;
};

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_REQUEST_BODY_BYTES)) {
    return errorResponse(413, "REQUEST_TOO_LARGE", "카드 설정 내용이 너무 큽니다. 다시 시도해 주세요.");
  }

  let payload: CreateCardPayload;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BODY_BYTES) {
      return errorResponse(413, "REQUEST_TOO_LARGE", "카드 설정 내용이 너무 큽니다. 다시 시도해 주세요.");
    }
    payload = JSON.parse(rawBody) as CreateCardPayload;
  } catch {
    return errorResponse(400, "INVALID_REQUEST", "카드 설정을 확인할 수 없습니다. 다시 시도해 주세요.");
  }

  if (!payload || typeof payload.videoId !== "string" || !isSvgVideoId(payload.videoId)) {
    return errorResponse(400, "INVALID_REQUEST", "카드 설정을 확인할 수 없습니다. 다시 시도해 주세요.");
  }

  const cardData = normalizeStoredCardData({ params: payload.params }, payload.videoId);
  if (!cardData) return errorResponse(400, "INVALID_REQUEST", "카드 설정을 확인할 수 없습니다. 다시 시도해 주세요.");

  if (!isRequestAllowed(getRequestKey(request))) {
    return errorResponse(429, "RATE_LIMITED", "요청이 많습니다. 잠시 후 다시 시도해 주세요.");
  }

  try {
    const supabase = createServerSupabaseClient();
    const contentHash = createStoredCardContentHash(payload.videoId, cardData);
    const result = await findOrCreateCard(supabase, payload.videoId, cardData, contentHash);
    if (!result) throw new Error("Unable to allocate a unique card id");
    return NextResponse.json({ data: { id: result.id } }, { status: result.created ? 201 : 200 });
  } catch {
    captureMonitoringError({
      message: "카드 설정 저장에 실패했습니다",
      errorCode: "card_storage_create_failed",
      operation: "card_create",
      layer: "server",
      httpStatus: 503,
    });
    return errorResponse(503, "CARD_STORAGE_UNAVAILABLE", "카드를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
}

async function findOrCreateCard(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  videoId: string,
  cardData: StoredCardData,
  contentHash: string,
) {
  const existingId = await findCardIdByContentHash(supabase, contentHash);
  if (existingId) return { id: existingId, created: false };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = `c_${randomBytes(12).toString("base64url")}`;
    const { error } = await supabase
      .from("cards")
      .insert({ id, video_id: videoId, card_data: cardData, content_hash: contentHash });
    if (!error) return { id, created: true };
    if (error.code !== "23505") throw error;

    const duplicatedId = await findCardIdByContentHash(supabase, contentHash);
    if (duplicatedId) return { id: duplicatedId, created: false };
  }
  return null;
}

async function findCardIdByContentHash(
  supabase: ReturnType<typeof createServerSupabaseClient>,
  contentHash: string,
) {
  const { data, error } = await supabase
    .from("cards")
    .select("id")
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (error) throw error;
  return typeof data?.id === "string" ? data.id : null;
}

function getRequestKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

function isRequestAllowed(key: string) {
  const now = Date.now();
  const window = requestWindows.get(key);
  if (!window || now - window.startedAt >= RATE_LIMIT_WINDOW_MS) {
    pruneRequestWindows(now);
    requestWindows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (window.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  window.count += 1;
  return true;
}

function pruneRequestWindows(now: number) {
  for (const [key, window] of requestWindows) {
    if (now - window.startedAt >= RATE_LIMIT_WINDOW_MS) requestWindows.delete(key);
  }
  if (requestWindows.size < RATE_LIMIT_MAX_ENTRIES) return;
  const oldestKey = requestWindows.keys().next().value;
  if (oldestKey) requestWindows.delete(oldestKey);
}
