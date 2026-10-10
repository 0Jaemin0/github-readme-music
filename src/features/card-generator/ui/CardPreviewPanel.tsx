'use client';

import { useLayoutEffect, useRef, useState } from 'react';
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
} from '@/entities/music-card';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useTranslations } from 'next-intl';
import { CardCustomizer } from './CardCustomizer';

interface CardPreviewPanelProps {
  track: Track;
  meta: CardMeta;
  style: CardStyleId;
  progressSeconds: number;
  theme: CardTheme;
  onStyleChange: (style: CardStyleId) => void;
  onProgressChange: (progressSeconds: number) => void;
  onThemeChange: (theme: CardTheme) => void;
}

export const CardPreviewPanel = ({
  track,
  meta,
  style,
  progressSeconds,
  theme,
  onStyleChange,
  onProgressChange,
  onThemeChange,
}: CardPreviewPanelProps) => {
  const t = useTranslations('CardEditor.preview');
  const styleLabels = { player: t('styles.player'), compact: t('styles.compact'), vertical: t('styles.vertical') };
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);
  const cardWidth = CARD_OUTPUT_WIDTHS[style];
  const scale = previewSize ? Math.min(1, previewSize.width / cardWidth) : 1;

  useLayoutEffect(() => {
    const viewport = previewViewportRef.current;
    const card = cardRef.current;
    if (!viewport || !card) return;

    const updatePreviewSize = () => {
      const width = viewport.clientWidth;
      const height = card.offsetHeight;
      setPreviewSize((current) =>
        current?.width === width && current.height === height ? current : { width, height },
      );
    };

    updatePreviewSize();
    const observer = new ResizeObserver(updatePreviewSize);
    observer.observe(viewport);
    observer.observe(card);
    return () => observer.disconnect();
  }, [style]);

  return (
    <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
      <div className="mb-3">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t('title')}
        </p>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{t('description')}</p>
      </div>
      <Tabs value={style} onValueChange={(value) => onStyleChange(value as CardStyleId)}>
        <TabsList className="mb-4 grid w-full grid-cols-3">
          {CARD_STYLES.map((option) => (
            <TabsTrigger key={option.id} value={option.id}>
              {styleLabels[option.id]}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="py-2 sm:px-6 sm:py-4">
          <div ref={previewViewportRef} className="w-full min-w-0 overflow-hidden">
            <div className="mx-auto" style={{ width: cardWidth * scale, height: (previewSize?.height ?? 0) * scale }}>
              <div
                ref={cardRef}
                style={{
                  width: cardWidth,
                  transform: scale < 1 ? `scale(${scale})` : undefined,
                  transformOrigin: 'top left',
                  visibility: previewSize ? 'visible' : 'hidden',
                }}
              >
                <MusicCard track={track} meta={meta} style={style} theme={theme} progressSeconds={progressSeconds} />
              </div>
            </div>
          </div>
          {style !== 'compact' ? (
            <PlaybackPosition value={progressSeconds} duration={track.duration} onChange={onProgressChange} />
          ) : null}
        </div>
      </Tabs>
      <section className="mt-6" aria-label={t('settingsLabel')}>
        <CardCustomizer theme={theme} onChange={onThemeChange} />
      </section>
    </section>
  );
};

interface PlaybackPositionProps {
  value: number;
  duration: string;
  onChange: (value: number) => void;
}

const PlaybackPosition = ({ value, duration, onChange }: PlaybackPositionProps) => {
  const t = useTranslations('CardEditor.preview');
  const totalSeconds = durationToSeconds(duration);

  return (
    <div className="mx-auto mt-5 max-w-[27.5rem]">
      <div className="flex items-center justify-between text-[12px] text-muted-foreground">
        <span>{t('playbackPosition')}</span>
        <span>
          {formatDuration(value)} / {duration}
        </span>
      </div>
      <input
        aria-label={t('playbackPosition')}
        type="range"
        min="0"
        max={totalSeconds}
        value={Math.min(value, totalSeconds)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
      />
    </div>
  );
};
