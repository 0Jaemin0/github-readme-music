"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImageOff, Pause, SkipBack, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { withAlpha } from "../lib/color";
import { durationToSeconds, formatDuration } from "../lib/time";
import type { CardMeta, CardStyleId, CardTheme, Track } from "../model/types";

const CARD_STYLE = { player: "flex aspect-[2.1/1] flex-col p-5", playerCover: "size-15", title: "text-base leading-6", artist: "text-[13px]", progress: "h-1.5", duration: "text-[12px]", controls: "gap-10 [&>svg]:size-[30px]", compact: "gap-3 px-4 py-2", compactCover: "size-8", compactTitle: "text-[13px]", vertical: "aspect-[1/1.6] gap-5 p-5", verticalTitle: "text-lg" } as const;

type CardProps = {
  track: Track;
  meta: CardMeta;
  theme: CardTheme;
  sizeStyle: typeof CARD_STYLE;
  className?: string;
  shellStyle: React.CSSProperties;
  progressSeconds: number;
};

export function MusicCard({ track, meta, style, theme, progressSeconds = 0, className }: { track: Track; meta: CardMeta; style: CardStyleId; theme: CardTheme; progressSeconds?: number; className?: string }) {
  const shellStyle: React.CSSProperties = {
    background: theme.gradient ? `linear-gradient(135deg, ${theme.background} 0%, ${withAlpha(theme.accent, 0.18)} 100%)` : theme.background,
    borderColor: theme.border,
    borderWidth: theme.borderWidth,
    borderRadius: theme.radius,
    color: theme.text,
  };
  const props = { track, meta, theme, sizeStyle: CARD_STYLE, className, shellStyle, progressSeconds };

  if (style === "compact") return <CompactCard {...props} />;
  if (style === "vertical") return <VerticalCard {...props} />;
  return <PlayerCard {...props} />;
}

function PlayerCard({ track, meta, theme, sizeStyle, className, shellStyle, progressSeconds }: CardProps) {
  const totalSeconds = durationToSeconds(track.duration);
  const currentSeconds = Math.min(progressSeconds, totalSeconds);
  const progress = totalSeconds ? (currentSeconds / totalSeconds) * 100 : 0;

  return <figure className={cn("w-full overflow-hidden border", sizeStyle.player, className)} style={shellStyle}>
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <CoverImage track={track} title={meta.title} className={cn("shrink-0", sizeStyle.playerCover)} />
      <div className="min-w-0 flex-1">
        <FlowingText text={meta.title} className={cn("font-semibold tracking-[-0.015em]", sizeStyle.title)} />
        <FlowingText text={meta.artist} className={sizeStyle.artist} color={theme.muted} />
      </div>
      <PlayingBars waveform={track.waveform.slice(0, 6)} accent={theme.accent} className="h-10 w-8 shrink-0" />
    </div>
    <div className="mt-3 flex flex-col">
      <div className="flex items-center gap-3">
        <span className={cn("shrink-0", sizeStyle.duration)} style={{ color: theme.muted }}>{formatDuration(currentSeconds)}</span>
        <div className="min-w-0 flex-1"><ProgressBar color={theme.muted} heightClassName={sizeStyle.progress} progress={progress} /></div>
        <span className={cn("shrink-0", sizeStyle.duration)} style={{ color: theme.muted }}>-{formatDuration(totalSeconds - currentSeconds)}</span>
      </div>
      <div className={cn("mt-[18px] flex items-center justify-center", sizeStyle.controls)} style={{ color: theme.text }} aria-hidden="true"><SkipBack fill="currentColor" /><Pause fill="currentColor" className="scale-125" /><SkipForward fill="currentColor" /></div>
    </div>
  </figure>;
}

function CompactCard({ track, meta, theme, sizeStyle, className, shellStyle }: CardProps) {
  return <figure className={cn("flex w-full items-center overflow-hidden border", sizeStyle.compact, className)} style={shellStyle}>
    <CoverImage track={track} title={meta.title} className={cn("shrink-0", sizeStyle.compactCover)} />
    <TrackTicker title={meta.title} artist={meta.artist} titleClassName={sizeStyle.compactTitle} artistClassName={sizeStyle.artist} mutedColor={theme.muted} />
    <span className={cn("shrink-0", sizeStyle.duration)} style={{ color: theme.muted }}>{track.duration}</span>
  </figure>;
}

function VerticalCard({ track, meta, theme, sizeStyle, className, shellStyle, progressSeconds }: CardProps) {
  const totalSeconds = durationToSeconds(track.duration);
  const currentSeconds = Math.min(progressSeconds, totalSeconds);
  const progress = totalSeconds ? (currentSeconds / totalSeconds) * 100 : 0;

  return <figure className={cn("flex w-full flex-col overflow-hidden border", sizeStyle.vertical, className)} style={shellStyle}>
    <CoverImage track={track} title={meta.title} className="aspect-square w-[92%] self-center" />
    <div className="min-w-0">
      <div className="min-w-0 flex-1">
        <FlowingText text={meta.title} className={cn("font-semibold tracking-[-0.015em]", sizeStyle.verticalTitle)} />
        <FlowingText text={meta.artist} className={cn("mt-0.5", sizeStyle.artist)} color={theme.muted} />
      </div>
    </div>
    <ProgressBar color={theme.muted} heightClassName={sizeStyle.progress} progress={progress} />
    <div className={cn("-mt-3 flex justify-between", sizeStyle.duration)} style={{ color: theme.muted }}><span>{formatDuration(currentSeconds)}</span><span>-{formatDuration(totalSeconds - currentSeconds)}</span></div>
    <div className={cn("mt-2 flex items-center justify-center", sizeStyle.controls)} style={{ color: theme.text }} aria-hidden="true"><SkipBack fill="currentColor" /><Pause fill="currentColor" className="scale-125" /><SkipForward fill="currentColor" /></div>
  </figure>;
}

function CoverImage({ track, title, className }: { track: Track; title: string; className: string }) {
  const [failedCover, setFailedCover] = useState<string | null>(null);
  const hasImageError = failedCover === track.cover;

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded-[8px] bg-muted/60", className)}>
      {track.cover && !hasImageError ? (
        <Image
          src={track.cover}
          alt={`${title} cover art`}
          fill
          sizes="(max-width: 640px) 320px, 384px"
          className="object-cover"
          style={{ objectPosition: `${track.coverPosition.x}% ${track.coverPosition.y}%` }}
          onError={() => setFailedCover(track.cover)}
        />
      ) : (
        <ImageOff className="size-1/3 text-muted-foreground/70" aria-label="앨범 커버를 불러올 수 없습니다" />
      )}
    </div>
  );
}

function ProgressBar({ color, heightClassName, progress }: { color: string; heightClassName: string; progress: number }) {
  const visibleProgress = progress <= 0 ? 1 : Math.min(100, progress);

  return <div className={cn("relative w-full overflow-visible rounded-full", heightClassName)} style={{ backgroundColor: withAlpha(color, 0.32) }} aria-hidden="true"><span className="block h-full rounded-full" style={{ width: `${visibleProgress}%`, backgroundColor: color }} /><span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm" style={{ left: `${visibleProgress}%`, backgroundColor: color }} /></div>;
}

function FlowingText({ text, className, color }: { text: string; className: string; color?: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [shouldFlow, setShouldFlow] = useState(false);

  useEffect(() => {
    const update = () => setShouldFlow((contentRef.current?.scrollWidth ?? 0) > (viewportRef.current?.clientWidth ?? 0));
    update();
    const observer = new ResizeObserver(update);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [text]);

  return <div ref={viewportRef} className="relative min-w-0 overflow-hidden" style={{ color }}>
    <span ref={contentRef} className={cn("pointer-events-none absolute invisible whitespace-nowrap", className)}>{text}</span>
    {shouldFlow ? <div className="animate-track-ticker flex w-max gap-8 whitespace-nowrap"><span className={className}>{text}</span><span className={className} aria-hidden="true">{text}</span></div> : <span className={cn("block truncate", className)}>{text}</span>}
  </div>;
}

function PlayingBars({ waveform, accent, className }: { waveform: number[]; accent: string; className: string }) {
  return <div className={cn("flex items-end justify-between gap-1 overflow-hidden", className)} aria-hidden="true">{waveform.map((value, index) => <span key={`${value}-${index}`} className="animate-wave min-w-[2px] flex-1 rounded-full" style={{ height: `${Math.max(12, value)}%`, backgroundColor: withAlpha(accent, 0.75), animationDelay: `${index * 90}ms` }} />)}</div>;
}

function TrackTicker({ title, artist, titleClassName, artistClassName, mutedColor }: { title: string; artist: string; titleClassName: string; artistClassName: string; mutedColor: string }) {
  return <div className="min-w-0 flex-1 overflow-hidden" aria-label={`${title} - ${artist}`}><div className="animate-track-ticker flex w-max items-baseline gap-8 whitespace-nowrap">{[0, 1].map((copy) => <span key={copy} className="flex items-baseline gap-2" aria-hidden={copy === 1}><span className={cn("font-semibold leading-5 tracking-[-0.01em]", titleClassName)}>{title}</span><span className={cn("shrink-0", artistClassName)} style={{ color: mutedColor }}>{artist}</span></span>)}</div></div>;
}
