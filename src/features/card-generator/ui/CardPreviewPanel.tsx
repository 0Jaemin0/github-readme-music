"use client";

import {
  CARD_OUTPUT_WIDTHS,
  CARD_STYLES,
  durationToSeconds,
  formatDuration,
  MusicCard,
  type CardMeta,
  type CardStyleId,
  type CardTheme,
  type Track,
} from "@/entities/music-card";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { CardCustomizer } from "./CardCustomizer";

type CardPreviewPanelProps = {
  track: Track;
  meta: CardMeta;
  style: CardStyleId;
  progressSeconds: number;
  theme: CardTheme;
  onStyleChange: (style: CardStyleId) => void;
  onProgressChange: (progressSeconds: number) => void;
  onThemeChange: (theme: CardTheme) => void;
};

export function CardPreviewPanel({
  track,
  meta,
  style,
  progressSeconds,
  theme,
  onStyleChange,
  onProgressChange,
  onThemeChange,
}: CardPreviewPanelProps) {
  return (
    <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
      <div className="mb-3">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">미리보기</p>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">README에 표시될 카드 모습을 확인해 주세요.</p>
      </div>
      <Tabs value={style} onValueChange={(value) => onStyleChange(value as CardStyleId)}>
        <TabsList className="mb-4 grid w-full grid-cols-3">
          {CARD_STYLES.map((option) => (
            <TabsTrigger key={option.id} value={option.id}>
              {option.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="py-2 sm:px-6 sm:py-4">
          <div className="mx-auto max-w-full" style={{ width: CARD_OUTPUT_WIDTHS[style] }}>
            <MusicCard track={track} meta={meta} style={style} theme={theme} progressSeconds={progressSeconds} />
          </div>
          {style !== "compact" ? <PlaybackPosition value={progressSeconds} duration={track.duration} onChange={onProgressChange} /> : null}
        </div>
      </Tabs>
      <section className="mt-6" aria-label="스타일 설정">
        <CardCustomizer theme={theme} onChange={onThemeChange} />
      </section>
    </section>
  );
}

function PlaybackPosition({ value, duration, onChange }: { value: number; duration: string; onChange: (value: number) => void }) {
  const totalSeconds = durationToSeconds(duration);

  return <div className="mx-auto mt-5 max-w-[27.5rem]">
    <div className="flex items-center justify-between text-[12px] text-muted-foreground"><span>재생 위치</span><span>{formatDuration(value)} / {duration}</span></div>
    <input aria-label="재생 위치" type="range" min="0" max={totalSeconds} value={Math.min(value, totalSeconds)} onChange={(event) => onChange(Number(event.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary" />
  </div>;
}
