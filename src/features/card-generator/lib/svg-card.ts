import { durationToSeconds, formatDuration } from "./time";
import type { CardMeta, CardStyleId, CardTheme, CoverPosition, Track } from "../model/types";

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const STYLE_IDS: CardStyleId[] = ["player", "compact", "vertical"];

type SvgCardData = {
  style: CardStyleId;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  coverPosition: CoverPosition;
  theme: CardTheme;
  progressSeconds: number;
};

export function createSvgCardParams(track: Track, style: CardStyleId, meta: CardMeta, theme: CardTheme, progressSeconds: number) {
  return new URLSearchParams({
    style,
    title: meta.title,
    artist: meta.artist,
    duration: track.duration,
    cover: track.cover,
    coverX: String(track.coverPosition.x),
    coverY: String(track.coverPosition.y),
    bg: theme.background.replace("#", ""),
    border: theme.border.replace("#", ""),
    text: theme.text.replace("#", ""),
    muted: theme.muted.replace("#", ""),
    accent: theme.accent.replace("#", ""),
    gradient: theme.gradient ? "1" : "0",
    bw: String(theme.borderWidth),
    r: String(theme.radius),
    progress: String(Math.floor(progressSeconds)),
  });
}

export function isSvgVideoId(value: string) {
  return VIDEO_ID_PATTERN.test(value);
}

export function parseSvgCardData(params: URLSearchParams): SvgCardData {
  const style = readStyle(params.get("style"));
  const duration = readDuration(params.get("duration"));
  const totalSeconds = durationToSeconds(duration);

  return {
    style,
    title: readText(params.get("title"), "Untitled track", 120),
    artist: readText(params.get("artist"), "Unknown artist", 80),
    duration,
    cover: readCover(params.get("cover")),
    coverPosition: { x: readNumber(params.get("coverX"), 50, 0, 100), y: readNumber(params.get("coverY"), 50, 0, 100) },
    theme: {
      background: readColor(params.get("bg"), "#0a0a0a"),
      border: readColor(params.get("border"), "#262626"),
      borderWidth: readNumber(params.get("bw"), 1, 0, 5),
      radius: readNumber(params.get("r"), 22, 0, 40),
      text: readColor(params.get("text"), "#fafafa"),
      muted: readColor(params.get("muted"), "#a3a3a3"),
      accent: readColor(params.get("accent"), "#fafafa"),
      gradient: params.get("gradient") === "1",
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

  return svgDocument(width, height, `
    ${cardGradient(data, "player-gradient")}
    <rect x="0.5" y="0.5" width="379" height="180" rx="${data.theme.radius}" fill="${backgroundFill(data)}" stroke="${data.theme.border}" stroke-width="${data.theme.borderWidth}" />
    ${coverImage(data, 20, 20, coverSize, "player-cover")}
    ${text(data.title, 96, 47, 16, data.theme.text, 600, 242)}
    ${text(data.artist, 96, 67, 13, data.theme.muted, 400, 242)}
    ${waveform(data.theme.accent, 338, 30)}
    ${text(formatDuration(data.progressSeconds), 20, 113, 12, data.theme.muted, 500)}
    ${progressBar(data, 72, 105, 236, 6, progress)}
    ${text(`-${formatDuration(totalSeconds - data.progressSeconds)}`, 320, 113, 12, data.theme.muted, 500)}
    ${playerControls(data.theme.text, 190, 148, 1)}
  `);
}

function renderCompactCard(data: SvgCardData) {
  const width = 460;
  const height = 64;

  return svgDocument(width, height, `
    ${cardGradient(data, "compact-gradient")}
    <rect x="0.5" y="0.5" width="459" height="63" rx="${Math.min(data.theme.radius, 20)}" fill="${backgroundFill(data)}" stroke="${data.theme.border}" stroke-width="${data.theme.borderWidth}" />
    ${coverImage(data, 16, 16, 32, "compact-cover")}
    ${text(data.title, 62, 30, 13, data.theme.text, 600, 290)}
    ${text(data.artist, 62, 47, 13, data.theme.muted, 400, 290)}
    ${text(data.duration, 422, 37, 12, data.theme.muted, 500, 26, "end")}
  `);
}

function renderVerticalCard(data: SvgCardData) {
  const width = 260;
  const height = 416;
  const coverSize = 198;
  const totalSeconds = durationToSeconds(data.duration);
  const progress = totalSeconds ? Math.max(1, (data.progressSeconds / totalSeconds) * 100) : 1;

  return svgDocument(width, height, `
    ${cardGradient(data, "vertical-gradient")}
    <rect x="0.5" y="0.5" width="259" height="415" rx="${data.theme.radius}" fill="${backgroundFill(data)}" stroke="${data.theme.border}" stroke-width="${data.theme.borderWidth}" />
    ${coverImage(data, 31, 22, coverSize, "vertical-cover")}
    ${text(data.title, 22, 248, 18, data.theme.text, 600, 216)}
    ${text(data.artist, 22, 269, 13, data.theme.muted, 400, 216)}
    ${progressBar(data, 22, 294, 216, 6, progress)}
    ${text(formatDuration(data.progressSeconds), 22, 319, 12, data.theme.muted, 500)}
    ${text(`-${formatDuration(totalSeconds - data.progressSeconds)}`, 238, 319, 12, data.theme.muted, 500, 80, "end")}
    ${playerControls(data.theme.text, 130, 365, 1.1)}
  `);
}

function svgDocument(width: number, height: number, content: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Music card"><style>text{font-family:'Noto Sans KR',Arial,sans-serif}</style>${content}</svg>`;
}

function cardGradient(data: SvgCardData, id: string) {
  if (!data.theme.gradient) return "";
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${data.theme.background}"/><stop offset="1" stop-color="${withAlpha(data.theme.accent, 0.18)}"/></linearGradient></defs>`;
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
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}"><path d="M-82 -11v22l-17-11zM-61 -11v22l-17-11z"/><rect x="-9" y="-15" width="7" height="30" rx="2"/><rect x="3" y="-15" width="7" height="30" rx="2"/><path d="M82 -11v22l17-11l-17-11zM61 -11v22l17-11z"/></g>`;
}

function waveform(color: string, x: number, y: number) {
  return [10, 18, 27, 15, 24, 12].map((height, index) => `<rect x="${x + index * 6}" y="${y + (28 - height) / 2}" width="3" height="${height}" rx="1.5" fill="${withAlpha(color, 0.75)}"/>`).join("");
}

function text(value: string, x: number, y: number, fontSize: number, color: string, weight: number, maxWidth?: number, anchor = "start") {
  const clipped = truncate(value, maxWidth ? Math.floor(maxWidth / (fontSize * 0.82)) : 80);
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${fontSize}" font-weight="${weight}" text-anchor="${anchor}">${escapeXml(clipped)}</text>`;
}

function readStyle(value: string | null): CardStyleId {
  return STYLE_IDS.includes(value as CardStyleId) ? value as CardStyleId : "player";
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
