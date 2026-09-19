export function isVideoThumbnailUrl(value: string, videoId: string) {
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
