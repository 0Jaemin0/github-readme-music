import { durationToSeconds, formatDuration } from "./time";
import { mixHex } from "./color";
import { compactTickerGap } from "./ticker";
import type { CardMeta, CardStyleId, CardTheme, CoverPosition, GradientDirection, Track } from "../model/types";

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const STYLE_IDS: CardStyleId[] = ["player", "compact", "vertical"];
const GRADIENT_DIRECTIONS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;

type GradientCorner = Exclude<GradientDirection, null>;

type SvgCardData = {
  style: CardStyleId;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  coverPosition: CoverPosition;
  waveform: number[];
  titleWidth: number;
  artistWidth: number;
  playerProgress: { x: number; y: number; width: number; height: number };
  theme: CardTheme;
  progressSeconds: number;
};

export function createSvgCardParams(track: Track, style: CardStyleId, meta: CardMeta, theme: CardTheme, progressSeconds: number) {
  const textWidths = measureTickerTextWidths(style, meta);
  const playerProgress = measurePlayerProgress(track.duration, progressSeconds, theme.borderWidth);

  return new URLSearchParams({
    v: "19",
    style,
    title: meta.title,
    artist: meta.artist,
    duration: track.duration,
    cover: track.cover,
    coverX: String(track.coverPosition.x),
    coverY: String(track.coverPosition.y),
    waveform: track.waveform.slice(0, 6).join(","),
    tw: String(textWidths.title),
    aw: String(textWidths.artist),
    pbx: String(playerProgress.x),
    pby: String(playerProgress.y),
    pbw: String(playerProgress.width),
    pbh: String(playerProgress.height),
    bg: theme.background.replace("#", ""),
    border: theme.border.replace("#", ""),
    text: theme.text.replace("#", ""),
    muted: theme.muted.replace("#", ""),
    accent: theme.accent.replace("#", ""),
    gradient: theme.gradient ? "1" : "0",
    ...(theme.gradient ? {
      gradientDirection: theme.gradientDirection ?? "bottom-right",
      gradientIntensity: String(Math.round(theme.gradientIntensity)),
    } : {}),
    bw: String(theme.borderWidth),
    r: String(theme.radius),
    progress: String(Math.floor(progressSeconds)),
  });
}

function measureTickerTextWidths(style: CardStyleId, meta: CardMeta) {
  const titleStyle = style === "vertical"
    ? { fontSize: 16, fontWeight: 600, letterSpacing: -0.015 }
    : style === "compact"
      ? { fontSize: 13, fontWeight: 600, letterSpacing: -0.01 }
      : { fontSize: 16, fontWeight: 600, letterSpacing: -0.015 };

  return {
    title: measureTextWidth(meta.title, titleStyle),
    artist: measureTextWidth(meta.artist, { fontSize: 13, fontWeight: 400, letterSpacing: 0 }),
  };
}

function measureTextWidth(value: string, style: { fontSize: number; fontWeight: number; letterSpacing: number }) {
  if (typeof document === "undefined") return 0;

  const element = document.createElement("span");
  element.textContent = value;
  element.style.cssText = `position:fixed;visibility:hidden;white-space:pre;pointer-events:none;font-family:'Noto Sans KR',sans-serif;font-size:${style.fontSize}px;font-weight:${style.fontWeight};letter-spacing:${style.letterSpacing}em;`;
  document.body.append(element);
  const width = element.getBoundingClientRect().width;
  element.remove();
  return width;
}

function measurePlayerProgress(duration: string, progressSeconds: number, borderWidth: number) {
  const totalSeconds = durationToSeconds(duration);
  const currentSeconds = Math.min(progressSeconds, totalSeconds);
  const timeStyle = { fontSize: 12, fontWeight: 400, letterSpacing: 0 };
  const startWidth = measureTextWidth(formatDuration(currentSeconds), timeStyle);
  const endWidth = measureTextWidth(`-${formatDuration(totalSeconds - currentSeconds)}`, timeStyle);
  const gap = 12;
  const contentX = 20 + borderWidth;
  const contentWidth = 340 - borderWidth * 2;

  return {
    x: contentX + startWidth + gap,
    y: 98 + borderWidth,
    width: contentWidth - startWidth - endWidth - gap * 2,
    height: 6,
  };
}

export function isSvgVideoId(value: string) {
  return VIDEO_ID_PATTERN.test(value);
}

export function parseSvgCardData(params: URLSearchParams): SvgCardData {
  const style = readStyle(params.get("style"));
  const duration = readDuration(params.get("duration"));
  const totalSeconds = durationToSeconds(duration);
  const gradient = params.get("gradient") === "1";

  return {
    style,
    title: readText(params.get("title"), "Untitled track", 120),
    artist: readText(params.get("artist"), "Unknown artist", 80),
    duration,
    cover: readCover(params.get("cover")),
    coverPosition: { x: readNumber(params.get("coverX"), 50, 0, 100), y: readNumber(params.get("coverY"), 50, 0, 100) },
    waveform: readWaveform(params.get("waveform")),
    titleWidth: readNumber(params.get("tw"), 0, 0, 1_200),
    artistWidth: readNumber(params.get("aw"), 0, 0, 1_200),
    playerProgress: {
      x: readNumber(params.get("pbx"), 60, 0, 380),
      y: readNumber(params.get("pby"), 98, 0, 181),
      width: readNumber(params.get("pbw"), 248, 1, 380),
      height: readNumber(params.get("pbh"), 6, 1, 20),
    },
    theme: {
      background: readColor(params.get("bg"), "#0a0a0a"),
      border: readColor(params.get("border"), "#262626"),
      borderWidth: readNumber(params.get("bw"), 1, 0, 6),
      radius: readNumber(params.get("r"), 22, 0, 40),
      text: readColor(params.get("text"), "#fafafa"),
      muted: readColor(params.get("muted"), "#a3a3a3"),
      accent: readColor(params.get("accent"), "#fafafa"),
      gradient,
      gradientDirection: gradient ? readGradientDirection(params.get("gradientDirection")) ?? "bottom-right" : null,
      gradientIntensity: readNumber(params.get("gradientIntensity"), 14, 0, 100),
    },
    progressSeconds: Math.min(readNumber(params.get("progress"), 0, 0, totalSeconds), totalSeconds),
  };
}

export function renderSvgCard(data: SvgCardData) {
  if (data.style === "compact") return renderCompactCard(data);
  if (data.style === "vertical") return renderVerticalCard(data);
  return renderPlayerCard(data);
}

function renderPlayerCard(data: SvgCardData) {
  const width = 380;
  const height = 181;
  const coverSize = 60;
  const totalSeconds = durationToSeconds(data.duration);
  const progress = totalSeconds ? Math.max(1, (data.progressSeconds / totalSeconds) * 100) : 1;
  const card = cardRect(data, width, height);
  const inset = data.theme.borderWidth;

  return svgDocument(width, height, `
    ${cardGradient(data, "player-gradient", width, height)}
    ${cardSurface(data, card, width, height)}
    ${coverImage(data, 20 + inset, 20 + inset, coverSize, "player-cover")}
    ${tickerText(data.title, 96 + inset, 47 + inset, 16, data.theme.text, 600, 224 - inset * 2, "player-title", data.titleWidth, -0.015)}
    ${tickerText(data.artist, 96 + inset, 67 + inset, 13, data.theme.muted, 400, 224 - inset * 2, "player-artist", data.artistWidth)}
    ${waveform(data.waveform, data.theme.accent, 336 - inset, 40 + inset)}
    ${text(formatDuration(data.progressSeconds), 20 + inset, data.playerProgress.y + 8, 12, data.theme.muted, 400)}
    ${progressBar(data, data.playerProgress.x, data.playerProgress.y, data.playerProgress.width, data.playerProgress.height, progress)}
    ${text(`-${formatDuration(totalSeconds - data.progressSeconds)}`, 360 - inset, data.playerProgress.y + 8, 12, data.theme.muted, 400, 80, "end")}
    ${playerControls(data.theme.text, 190, 143.435 + inset, 1)}
  `);
}

function renderCompactCard(data: SvgCardData) {
  const width = 460;
  const height = 48;
  const card = cardRect(data, width, height);
  const inset = data.theme.borderWidth;

  return svgDocument(width, height, `
    ${cardGradient(data, "compact-gradient", width, height)}
    ${cardSurface(data, card, width, height)}
    ${coverImage(data, 16 + inset, 9, 30, "compact-cover")}
    ${compactTicker(data.title, data.artist, data.titleWidth, data.artistWidth, 58 + inset, 29, 350 - inset * 2, data.theme.text, data.theme.muted)}
    ${text(data.duration, 444 - inset, 29, 12, data.theme.muted, 500, undefined, "end")}
  `);
}

function renderVerticalCard(data: SvgCardData) {
  const width = 260;
  const height = 416;
  const coverSize = 200;
  const totalSeconds = durationToSeconds(data.duration);
  const progress = totalSeconds ? Math.max(1, (data.progressSeconds / totalSeconds) * 100) : 1;
  const card = cardRect(data, width, height);
  const inset = data.theme.borderWidth;
  const metadataTop = 23 + inset + coverSize + 20;
  const titleY = metadataTop + 16;
  const artistY = metadataTop + 38;
  const progressY = metadataTop + 54;
  const timeY = progressY + 28;

  return svgDocument(width, height, `
    ${cardGradient(data, "vertical-gradient", width, height)}
    ${cardSurface(data, card, width, height)}
    ${coverImage(data, 30, 20 + inset, coverSize, "vertical-cover")}
    ${tickerText(data.title, 20 + inset, titleY, 16, data.theme.text, 600, 220 - inset * 2, "vertical-title", data.titleWidth, -0.015)}
    ${tickerText(data.artist, 20 + inset, artistY, 13, data.theme.muted, 400, 220 - inset * 2, "vertical-artist", data.artistWidth)}
    ${progressBar(data, 20 + inset, progressY, 220 - inset * 2, 6, progress)}
    ${text(formatDuration(data.progressSeconds), 20 + inset, timeY, 12, data.theme.muted, 500)}
    ${text(`-${formatDuration(totalSeconds - data.progressSeconds)}`, 240 - inset, timeY, 12, data.theme.muted, 500, 80, "end")}
    ${playerControls(data.theme.text, 130, verticalControlsY(height, inset), 1)}
  `);
}

function svgDocument(width: number, height: number, content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Music card"><style>text{font-family:'Noto Sans KR',Arial,sans-serif}</style>${content}</svg>`;
}

function cardRect(data: SvgCardData, width: number, height: number) {
  const borderWidth = data.theme.borderWidth;
  const outerRadius = Math.min(data.theme.radius, width / 2, height / 2);

  return {
    x: formatCoordinate(borderWidth / 2),
    y: formatCoordinate(borderWidth / 2),
    width: formatCoordinate(width - borderWidth),
    height: formatCoordinate(height - borderWidth),
    outerRadius: formatCoordinate(outerRadius),
    radius: formatCoordinate(Math.max(0, outerRadius - borderWidth / 2)),
  };
}

function verticalControlsY(height: number, borderWidth: number) {
  const paddingBottom = 20;
  const controlsHeight = 30;
  return height - borderWidth - paddingBottom - controlsHeight / 2;
}

function cardSurface(data: SvgCardData, card: ReturnType<typeof cardRect>, width: number, height: number) {
  return `<rect x="0" y="0" width="${width}" height="${height}" rx="${card.outerRadius}" fill="${backgroundFill(data)}"/><rect x="${card.x}" y="${card.y}" width="${card.width}" height="${card.height}" rx="${card.radius}" fill="none" stroke="${data.theme.border}" stroke-width="${data.theme.borderWidth}"/>`;
}

function cardGradient(data: SvgCardData, id: string, width: number, height: number) {
  if (!data.theme.gradient) return "";
  const { x1, y1, x2, y2 } = cssGradientCoordinates(data.theme.gradientDirection ?? "bottom-right", width, height);
  const endColor = mixHex(data.theme.background, data.theme.accent, data.theme.gradientIntensity / 100);

  return `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" color-interpolation="sRGB"><stop stop-color="${data.theme.background}"/><stop offset="1" stop-color="${endColor}"/></linearGradient></defs>`;
}

function cssGradientCoordinates(direction: GradientCorner, width: number, height: number) {
  const angles: Record<GradientCorner, number> = {
    "top-left": 315,
    "top-right": 45,
    "bottom-left": 225,
    "bottom-right": 135,
  };
  const radians = (angles[direction] * Math.PI) / 180;
  const horizontal = Math.sin(radians);
  const vertical = -Math.cos(radians);
  const centerX = width / 2;
  const centerY = height / 2;
  const halfLength = (Math.abs(horizontal) * width + Math.abs(vertical) * height) / 2;

  return {
    x1: formatCoordinate(centerX - horizontal * halfLength),
    y1: formatCoordinate(centerY - vertical * halfLength),
    x2: formatCoordinate(centerX + horizontal * halfLength),
    y2: formatCoordinate(centerY + vertical * halfLength),
  };
}

function formatCoordinate(value: number) {
  return Number(value.toFixed(3));
}

function backgroundFill(data: SvgCardData) {
  return data.theme.gradient ? `url(#${data.style}-gradient)` : data.theme.background;
}

function coverImage(data: SvgCardData, x: number, y: number, size: number, id: string) {
  const radius = 8;
  if (!data.cover) return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" fill="${withAlpha(data.theme.muted, 0.25)}"/>`;

  const imageWidth = size * (16 / 9);
  const imageX = x - ((imageWidth - size) * data.coverPosition.x) / 100;
  return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}"/></clipPath></defs><image href="${escapeXml(data.cover)}" x="${imageX.toFixed(2)}" y="${y}" width="${imageWidth.toFixed(2)}" height="${size}" preserveAspectRatio="none" clip-path="url(#${id})"/>`;
}

function progressBar(data: SvgCardData, x: number, y: number, width: number, height: number, progress: number) {
  const knobX = x + (width * progress) / 100;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${withAlpha(data.theme.muted, 0.32)}"/><rect x="${x}" y="${y}" width="${(width * progress) / 100}" height="${height}" rx="${height / 2}" fill="${data.theme.muted}"/><circle cx="${knobX}" cy="${y + height / 2}" r="5" fill="${data.theme.muted}"/>`;
}

function playerControls(color: string, x: number, y: number, scale: number) {
  return `<g transform="translate(${x} ${y}) scale(${scale * 0.94})" fill="${color}" stroke="${color}" stroke-linecap="round" stroke-linejoin="round"><path d="M-53.5 -10Q-52.5 -10 -52.5 -9V9Q-52.5 10 -53.5 10L-68.5 1.35Q-70.9 0 -68.5 -1.35Z" transform="translate(-64.354 0) scale(0.88) translate(64.354 0) translate(-2.5 0)" stroke-width="2.5"/><path d="M-73.5 -10Q-72.5 -10 -72.5 -9V9Q-72.5 10 -73.5 10L-88.5 1.35Q-90.9 0 -88.5 -1.35Z" transform="translate(-79.046 0) scale(0.88) translate(79.046 0)" stroke-width="2.5"/><rect x="-9.405" y="-12.815" width="5" height="28.13" rx="1" stroke-width="5"/><rect x="5.5" y="-12.815" width="5" height="28.13" rx="1" stroke-width="5"/><path d="M53.5 -10Q52.5 -10 52.5 -9V9Q52.5 10 53.5 10L68.5 1.35Q70.9 0 68.5 -1.35Z" transform="translate(64.354 0) scale(0.88) translate(-64.354 0) translate(2.5 0)" stroke-width="2.5"/><path d="M73.5 -10Q72.5 -10 72.5 -9V9Q72.5 10 73.5 10L88.5 1.35Q90.9 0 88.5 -1.35Z" transform="translate(79.046 0) scale(0.88) translate(-79.046 0)" stroke-width="2.5"/></g>`;
}

function waveform(values: number[], color: string, x: number, y: number) {
  const containerWidth = 24;
  const containerHeight = 20;
  const gap = 2;
  const barWidth = (containerWidth - gap * (values.length - 1)) / values.length;
  const step = barWidth + gap;

  return values.map((value, index) => {
    const height = Math.max(2.4, (Math.max(12, value) / 100) * containerHeight);
    const low = height * 0.68;
    const delay = (index * 0.09).toFixed(2);
    const lowY = y + (containerHeight - low) / 2;
    const highY = y + (containerHeight - height) / 2;
    return `<rect x="${(x + index * step).toFixed(2)}" y="${lowY.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${low.toFixed(2)}" rx="1" fill="${withAlpha(color, 0.75)}" opacity="0.55"><animate attributeName="height" values="${low};${height};${low}" dur="1.8s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/><animate attributeName="y" values="${lowY};${highY};${lowY}" dur="1.8s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/><animate attributeName="opacity" values="0.55;1;0.55" dur="1.8s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/></rect>`;
  }).join("");
}

function text(value: string, x: number, y: number, fontSize: number, color: string, weight: number, maxWidth?: number, anchor = "start") {
  const clipped = truncate(value, maxWidth ? Math.floor(maxWidth / (fontSize * 0.82)) : 80);
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${fontSize}" font-weight="${weight}" text-anchor="${anchor}">${escapeXml(clipped)}</text>`;
}

function tickerText(value: string, x: number, y: number, fontSize: number, color: string, weight: number, width: number, id: string, measuredWidth: number, letterSpacing = 0) {
  const clipY = y - fontSize * 1.05;
  const estimatedWidth = measuredWidth || value.length * fontSize * 0.82;
  const content = escapeXml(value);
  const tracking = letterSpacing ? ` letter-spacing="${letterSpacing}em"` : "";
  if (estimatedWidth <= width) return `<text x="${x}" y="${y}" fill="${color}" font-size="${fontSize}" font-weight="${weight}"${tracking}>${content}</text>`;

  const gap = 32;
  const distance = Math.ceil(estimatedWidth + gap);
  return `<defs><clipPath id="${id}-clip"><rect x="${x}" y="${clipY}" width="${width}" height="${fontSize * 1.4}"/></clipPath></defs><g clip-path="url(#${id}-clip)"><g><animateTransform attributeName="transform" type="translate" from="0 0" to="-${distance} 0" dur="12s" begin="1s" repeatCount="indefinite"/><text x="${x}" y="${y}" fill="${color}" font-size="${fontSize}" font-weight="${weight}"${tracking}>${content}</text><text x="${x + distance}" y="${y}" fill="${color}" font-size="${fontSize}" font-weight="${weight}"${tracking}>${content}</text></g></g>`;
}

function compactTicker(title: string, artist: string, measuredTitleWidth: number, measuredArtistWidth: number, x: number, y: number, width: number, textColor: string, mutedColor: string) {
  const titleWidth = measuredTitleWidth || title.length * 13 * 0.82;
  const artistX = x + titleWidth + 8;
  const artistWidth = measuredArtistWidth || artist.length * 13 * 0.82;
  const contentWidth = titleWidth + 8 + artistWidth;
  const gap = compactTickerGap(width, contentWidth);
  const distance = contentWidth + gap;
  const duration = 12;

  return `<defs><clipPath id="compact-ticker-clip"><rect x="${x}" y="${y - 15}" width="${width}" height="20"/></clipPath></defs><g clip-path="url(#compact-ticker-clip)"><g><animateTransform attributeName="transform" type="translate" from="0 0" to="-${distance} 0" dur="${duration}s" begin="1s" repeatCount="indefinite"/><text x="${x}" y="${y}" fill="${textColor}" font-size="13" font-weight="600" letter-spacing="-0.01em">${escapeXml(title)}</text><text x="${artistX}" y="${y}" fill="${mutedColor}" font-size="13" font-weight="400">${escapeXml(artist)}</text><text x="${x + distance}" y="${y}" fill="${textColor}" font-size="13" font-weight="600" letter-spacing="-0.01em">${escapeXml(title)}</text><text x="${artistX + distance}" y="${y}" fill="${mutedColor}" font-size="13" font-weight="400">${escapeXml(artist)}</text></g></g>`;
}

function readStyle(value: string | null): CardStyleId {
  return STYLE_IDS.includes(value as CardStyleId) ? value as CardStyleId : "player";
}

function readGradientDirection(value: string | null): GradientCorner | null {
  return GRADIENT_DIRECTIONS.includes(value as GradientCorner) ? value as GradientCorner : null;
}

function readText(value: string | null, fallback: string, maxLength: number) {
  const text = value?.trim().slice(0, maxLength);
  return text || fallback;
}

function readDuration(value: string | null) {
  if (!value || !/^(?:\d+:)?[0-5]?\d:\d{2}$/.test(value)) return "0:00";
  return durationToSeconds(value) <= 86_399 ? value : "0:00";
}

function readCover(value: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "i.ytimg.com" ? url.toString() : "";
  } catch {
    return "";
  }
}

function readWaveform(value: string | null) {
  const fallback = [28, 46, 68, 38, 60, 32];
  if (!value) return fallback;
  const values = value.split(",").map((item) => Number(item));
  return values.length === 6 && values.every((item) => Number.isFinite(item) && item >= 0 && item <= 100) ? values : fallback;
}

function readColor(value: string | null, fallback: string) {
  const color = value ? `#${value.replace("#", "")}` : fallback;
  return HEX_COLOR_PATTERN.test(color) ? color.toLowerCase() : fallback;
}

function readNumber(value: string | null, fallback: number, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function withAlpha(hex: string, alpha: number) {
  const value = hex.slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, Math.max(1, maxLength - 1))}…` : value;
}

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}
