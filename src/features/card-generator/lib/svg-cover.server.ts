import "server-only";

import type { SvgCardData } from "./svg-card";

const MAX_COVER_BYTES = 1_000_000;
const COVER_TIMEOUT_MS = 4_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function embedSvgCover(data: SvgCardData, videoId: string) {
  const embeddedCover = await fetchEmbeddedCover(data.cover, videoId);
  return {
    data: embeddedCover ? { ...data, cover: embeddedCover } : { ...data, cover: "" },
    hasEmbeddedCover: Boolean(embeddedCover),
  };
}

async function fetchEmbeddedCover(coverUrl: string, videoId: string) {
  if (!isVideoThumbnailUrl(coverUrl, videoId)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COVER_TIMEOUT_MS);

  try {
    const response = await fetch(coverUrl, {
      signal: controller.signal,
      redirect: "error",
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    if (!isVideoThumbnailUrl(response.url, videoId)) return null;

    const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (!contentType || !ALLOWED_IMAGE_TYPES.has(contentType)) return null;

    const contentLength = response.headers.get("content-length");
    if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_COVER_BYTES)) return null;

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_COVER_BYTES || !hasExpectedImageSignature(bytes, contentType)) return null;

    return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function hasExpectedImageSignature(bytes: Uint8Array, contentType: string) {
  if (contentType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (contentType === "image/png") return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  return bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
}

function isVideoThumbnailUrl(value: string, videoId: string) {
  try {
    const url = new URL(value);
    const path = url.pathname.split("/").filter(Boolean);
    return url.protocol === "https:"
      && url.hostname === "i.ytimg.com"
      && path.length === 3
      && path[0] === "vi"
      && path[1] === videoId;
  } catch {
    return false;
  }
}
