const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{6,})/i,
  /(?:youtu\.be\/)([\w-]{6,})/i,
  /(?:youtube\.com\/shorts\/)([\w-]{6,})/i,
  /(?:music\.youtube\.com\/watch\?(?:.*&)?v=)([\w-]{6,})/i,
];

export function parseYouTubeId(input: string): string | null {
  const value = input.trim();

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = value.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export function suggestTitle(rawTitle: string): string {
  return (
    rawTitle
      .replace(/[([{][^\])}]*?(?:official|audio|video|mv|lyric|visualizer|4k|hd|feat\.?).*?[\])}]/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/[\s\-–—]+$/, "")
      .trim() || rawTitle.trim()
  );
}

export function suggestArtist(channel: string, title: string): string {
  const titleParts = title.split(/\s[-–—]\s/);
  if (titleParts.length > 1) return titleParts[0].trim();

  return channel
    .replace(/\s*-\s*Topic$/i, "")
    .replace(/\s*VEVO$/i, "")
    .replace(/\s*Official$/i, "")
    .trim();
}
