export type CardStyleId = "player" | "compact" | "vertical";

export type CardStyle = {
  id: CardStyleId;
  name: string;
  hint: string;
};

export type CardTheme = {
  background: string;
  border: string;
  borderWidth: number;
  radius: number;
  text: string;
  muted: string;
  accent: string;
  gradient: boolean;
};

export type Track = {
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  views: string;
  cover: string;
  waveform: number[];
};

export type CardMeta = {
  title: string;
  artist: string;
};
