import { NextResponse } from "next/server";
import { parseYouTubeId } from "@/features/card-generator/lib/youtube";
import type { YouTubeMetadata } from "@/features/card-generator/model/types";
import { captureMonitoringError } from "@/lib/sentry-monitoring";

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/videos";

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
    payload = await request.json();
  } catch {
    return errorResponse(400, "INVALID_REQUEST", "YouTube 영상 링크를 확인해 주세요.");
  }

  if (!isRecord(payload)) return errorResponse(400, "INVALID_REQUEST", "YouTube 영상 링크를 확인해 주세요.");

  const videoId = typeof payload.url === "string" ? parseYouTubeId(payload.url) : null;
  if (!videoId) return errorResponse(400, "INVALID_URL", "YouTube 영상 링크를 확인해 주세요.");

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    captureMonitoringError({
      message: "YouTube API 서버 설정을 확인할 수 없습니다",
      errorCode: "youtube_api_configuration_error",
      operation: "youtube_metadata",
      layer: "server",
      httpStatus: 500,
    });
    return errorResponse(500, "SERVER_CONFIGURATION_ERROR", "일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
  }

  let upstreamResponse: Response;
  try {
    const query = new URLSearchParams({ part: "snippet,contentDetails", id: videoId, key: apiKey });
    upstreamResponse = await fetch(`${YOUTUBE_API_URL}?${query.toString()}`, { next: { revalidate: 0 } });
  } catch {
    captureMonitoringError({
      message: "YouTube 메타데이터 요청에 실패했습니다",
      errorCode: "youtube_metadata_request_failed",
      operation: "youtube_metadata",
      layer: "server",
    });
    return errorResponse(503, "YOUTUBE_UNAVAILABLE", "영상 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  const upstreamBody = (await upstreamResponse.json().catch(() => null)) as YouTubeApiResponse | null;
  if (!upstreamResponse.ok) {
    const reason = upstreamBody?.error?.errors?.[0]?.reason;
    if (upstreamResponse.status === 403 && reason === "quotaExceeded") {
      return errorResponse(429, "YOUTUBE_QUOTA_EXCEEDED", "현재 요청이 많아요. 잠시 후 다시 시도해 주세요.");
    }
    captureMonitoringError({
      message: "YouTube 메타데이터 요청에 실패했습니다",
      errorCode: "youtube_metadata_request_failed",
      operation: "youtube_metadata",
      layer: "server",
      httpStatus: upstreamResponse.status,
    });
    return errorResponse(503, "YOUTUBE_UNAVAILABLE", "영상 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  if (!upstreamBody || !Array.isArray(upstreamBody.items)) {
    captureMonitoringError({
      message: "YouTube 메타데이터 응답 형식을 처리할 수 없습니다",
      errorCode: "youtube_metadata_invalid_response",
      operation: "youtube_metadata",
      layer: "server",
      httpStatus: upstreamResponse.status,
    });
    return errorResponse(503, "YOUTUBE_UNAVAILABLE", "영상 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  if (upstreamBody.items.length === 0) {
    return errorResponse(404, "VIDEO_NOT_FOUND", "영상을 찾을 수 없거나 이 영상은 카드에 사용할 수 없어요.");
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
    return errorResponse(503, "YOUTUBE_UNAVAILABLE", "영상 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  return NextResponse.json({ data: metadata });
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
