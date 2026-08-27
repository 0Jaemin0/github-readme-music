import type { CardStyle, CardStyleId, CardTheme } from "./types";

export const CARD_STYLES: CardStyle[] = [
  { id: "player", name: "일반형", hint: "재생 플레이어처럼" },
  { id: "compact", name: "가로형", hint: "한 줄로 간결하게" },
  { id: "vertical", name: "세로형", hint: "앨범 커버를 중심으로" },
];

export const CARD_OUTPUT_WIDTHS: Record<CardStyleId, number> = {
  player: 380,
  compact: 460,
  vertical: 260,
};

export const DEFAULT_THEME: CardTheme = {
  background: "#12161c",
  border: "#262d38",
  borderWidth: 1,
  radius: 22,
  text: "#e9edf2",
  muted: "#8c95a3",
  accent: "#f5b544",
  gradient: false,
};
