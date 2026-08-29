const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);
const SHORT_HOST = "youtu.be";
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (!value || value.length > 2_048) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  let videoId: string | null = null;

  if (host === SHORT_HOST) {
    const pathParts = url.pathname.split("/").filter(Boolean);
    videoId = pathParts.length === 1 ? pathParts[0] : null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === "/watch") videoId = url.searchParams.get("v");
    if (url.pathname.startsWith("/shorts/")) videoId = url.pathname.split("/")[2] ?? null;
  }

  return videoId && VIDEO_ID_PATTERN.test(videoId) ? videoId : null;
}

export function suggestTitle(rawTitle: string): string {
  return rawTitle.replace(/\s{2,}/g, " ").trim() || rawTitle.trim();
}

export function suggestArtist(channel: string, title: string): string {
  const titleParts = title.split(/\s[-|]\s/);
  if (titleParts.length > 1) return titleParts[0].trim();

  return channel
    .replace(/\s*-\s*Topic$/i, "")
    .replace(/\s*VEVO$/i, "")
    .replace(/\s*Official$/i, "")
    .trim();
}
