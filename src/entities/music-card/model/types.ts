export type CardStyleId = 'player' | 'compact' | 'vertical';
export type GradientDirection = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

export interface CardStyle {
  id: CardStyleId;
  name: string;
  hint: string;
}

export interface CardTheme {
  background: string;
  border: string;
  borderWidth: number;
  radius: number;
  text: string;
  muted: string;
  accent: string;
  gradient: boolean;
  gradientDirection: GradientDirection;
  gradientIntensity: number;
}

export interface CoverPosition {
  x: number;
  y: number;
  scale: number;
  aspectRatio: number;
}

export interface Track {
  source: 'youtube' | 'stored';
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  cover: string;
  coverPosition: CoverPosition;
  waveform: number[];
}

export type YouTubeMetadata = Pick<Track, 'videoId' | 'title' | 'channel' | 'duration' | 'cover'>;

export interface CardMeta {
  title: string;
  artist: string;
}
