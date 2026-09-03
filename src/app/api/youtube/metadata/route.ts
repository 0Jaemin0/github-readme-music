import { NextResponse } from "next/server";
import { parseYouTubeId } from "@/features/card-generator/lib/youtube";
import type { YouTubeMetadata } from "@/features/card-generator/model/types";
import { captureMonitoringError } from "@/lib/sentry-monitoring";

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/videos";
const MAX_REQUEST_BODY_BYTES = 4_096;
const YOUTUBE_REQUEST_TIMEOUT_MS = 5_000;
const METADATA_CACHE_TTL_MS = 60 * 60 * 1_000;
const METADATA_CACHE_MAX_ENTRIES = 200;
const RATE_LIMIT_WINDOW_MS = 60 * 1_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_MAX_ENTRIES = 500;

const metadataCache = new Map<string, { expiresAt: number; data: YouTubeMetadata }>();
const requestWindows = new Map<string, { startedAt: number; count: number }>();

type YouTubeApiResponse = {
  items?: Array<{
    id?: unknown;
    snippet?: {
      title?: unknown;
      channelTitle?: unknown;
      thumbnails?: Record<string, { url?: unknown } | undefined>;
    };
    contentDetails?: { duration?: unknown };
  }>;
  error?: { errors?: Array<{ reason?: unknown }> };
};

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = JSON.parse(await readRequestBody(request));
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return errorResponse(413, "REQUEST_TOO_LARGE", "요청 내용이 너무 큽니다. YouTube 링크만 입력해 주세요.");
    }

    return errorResponse(400, "INVALID_REQUEST", "YouTube 영상 링크를 확인해 주세요.");
  }

  if (!isRecord(payload)) return errorResponse(400, "INVALID_REQUEST", "YouTube 영상 링크를 확인해 주세요.");

  const videoId = typeof payload.url === "string" ? parseYouTubeId(payload.url) : null;
  if (!videoId) return errorResponse(400, "INVALID_URL", "YouTube 영상 링크를 확인해 주세요.");

  const cachedMetadata = readCachedMetadata(videoId);
  if (cachedMetadata) return NextResponse.json({ data: cachedMetadata });

  if (!isRequestAllowed(getRequestKey(request))) {
    return errorResponse(429, "RATE_LIMITED", "요청이 많습니다. 잠시 후 다시 시도해 주세요.");
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    captureMonitoringError({
      message: "YouTube API 서버 설정을 확인할 수 없습니다",
      errorCode: "youtube_api_configuration_error",
      operation: "youtube_metadata",
      layer: "server",
      httpStatus: 500,
    });
    return errorResponse(500, "SERVER_CONFIGURATION_ERROR", "일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), YOUTUBE_REQUEST_TIMEOUT_MS);
  let upstreamResponse: Response;
  try {
    const query = new URLSearchParams({ part: "snippet,contentDetails", id: videoId, key: apiKey });
    upstreamResponse = await fetch(`${YOUTUBE_API_URL}?${query.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    clearTimeout(timeout);
    captureMonitoringError({
      message: "YouTube 메타데이터 요청에 실패했습니다",
      errorCode: controller.signal.aborted ? "youtube_metadata_request_timed_out" : "youtube_metadata_request_failed",
      operation: "youtube_metadata",
      layer: "server",
    });
    return errorResponse(503, "YOUTUBE_UNAVAILABLE", "영상 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const upstreamBody = (await upstreamResponse.json().catch(() => null)) as YouTubeApiResponse | null;
  clearTimeout(timeout);
  if (!upstreamResponse.ok) {
    const reason = upstreamBody?.error?.errors?.[0]?.reason;
    if (upstreamResponse.status === 403 && reason === "quotaExceeded") {
      return errorResponse(429, "YOUTUBE_QUOTA_EXCEEDED", "현재 요청이 많습니다. 잠시 후 다시 시도해 주세요.");
    }
    captureMonitoringError({
      message: "YouTube 메타데이터 요청에 실패했습니다",
      errorCode: "youtube_metadata_request_failed",
      operation: "youtube_metadata",
      layer: "server",
      httpStatus: upstreamResponse.status,
    });
    return errorResponse(503, "YOUTUBE_UNAVAILABLE", "영상 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  if (!upstreamBody || !Array.isArray(upstreamBody.items)) {
    captureMonitoringError({
      message: "YouTube 메타데이터 응답 형식을 처리할 수 없습니다",
      errorCode: "youtube_metadata_invalid_response",
      operation: "youtube_metadata",
      layer: "server",
      httpStatus: upstreamResponse.status,
    });
    return errorResponse(503, "YOUTUBE_UNAVAILABLE", "영상 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  if (upstreamBody.items.length === 0) {
    return errorResponse(404, "VIDEO_NOT_FOUND", "영상을 찾을 수 없거나 이 영상은 카드에 사용할 수 없습니다.");
  }

  const metadata = normalizeMetadata(upstreamBody, videoId);
  if (!metadata) {
    captureMonitoringError({
      message: "YouTube 메타데이터 응답 형식을 처리할 수 없습니다",
      errorCode: "youtube_metadata_invalid_response",
      operation: "youtube_metadata",
      layer: "server",
      httpStatus: upstreamResponse.status,
    });
    return errorResponse(503, "YOUTUBE_UNAVAILABLE", "영상 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  writeCachedMetadata(videoId, metadata);
  return NextResponse.json({ data: metadata });
}

class RequestBodyTooLargeError extends Error {}

async function readRequestBody(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_REQUEST_BODY_BYTES)) {
    throw new RequestBodyTooLargeError();
  }

  const reader = request.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BODY_BYTES) {
        await reader.cancel();
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function readCachedMetadata(videoId: string) {
  const cached = metadataCache.get(videoId);
  if (!cached) return null;
  if (cached.expiresAt > Date.now()) return cached.data;
  metadataCache.delete(videoId);
  return null;
}

function writeCachedMetadata(videoId: string, data: YouTubeMetadata) {
  const now = Date.now();
  for (const [key, value] of metadataCache) {
    if (value.expiresAt <= now) metadataCache.delete(key);
  }
  if (metadataCache.size >= METADATA_CACHE_MAX_ENTRIES) {
    const oldestKey = metadataCache.keys().next().value;
    if (oldestKey) metadataCache.delete(oldestKey);
  }
  metadataCache.set(videoId, { data, expiresAt: now + METADATA_CACHE_TTL_MS });
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeMetadata(response: YouTubeApiResponse | null, requestedVideoId: string): YouTubeMetadata | null {
  const item = response?.items?.[0];
  const title = item?.snippet?.title;
  const channel = item?.snippet?.channelTitle;
  const duration = item?.contentDetails?.duration;
  const thumbnail = selectThumbnail(item?.snippet?.thumbnails);

  if (
    item?.id !== requestedVideoId ||
    typeof title !== "string" || !title.trim() ||
    typeof channel !== "string" || !channel.trim() ||
    typeof duration !== "string" || !thumbnail
  ) return null;

  const formattedDuration = formatIsoDuration(duration);
  if (!formattedDuration) return null;

  return { videoId: requestedVideoId, title: title.trim(), channel: channel.trim(), duration: formattedDuration, cover: thumbnail };
}

function selectThumbnail(thumbnails: Record<string, { url?: unknown } | undefined> | undefined) {
  for (const size of ["maxres", "standard", "high", "medium", "default"]) {
    const url = thumbnails?.[size]?.url;
    if (typeof url === "string" && isYouTubeThumbnail(url)) return url;
  }
  return null;
}

function isYouTubeThumbnail(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "i.ytimg.com";
  } catch {
    return false;
  }
}

function formatIsoDuration(value: string) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value);
  if (!match) return null;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  if (![hours, minutes, seconds].every(Number.isSafeInteger)) return null;

  const totalMinutes = hours * 60 + minutes;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${totalMinutes}:${String(seconds).padStart(2, "0")}`;
}
