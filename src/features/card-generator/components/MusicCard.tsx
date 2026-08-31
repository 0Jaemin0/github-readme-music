"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { mixHex, withAlpha } from "../lib/color";
import { durationToSeconds, formatDuration } from "../lib/time";
import { compactTickerGap } from "../lib/ticker";
import type { CardMeta, CardStyleId, CardTheme, Track } from "../model/types";

const CARD_STYLE = { player: "flex h-[181px] flex-col p-5", playerCover: "size-[60px]", title: "text-base leading-6", artist: "text-[13px]", progress: "h-1.5", duration: "text-[12px]", controls: "gap-10 [&>svg]:size-[30px]", compact: "h-12 gap-3 px-4 py-2", compactCover: "size-[30px]", compactTitle: "text-[13px]", vertical: "h-[416px] p-5", verticalTitle: "text-base leading-6" } as const;
const GRADIENT_ANGLES = { "top-left": 315, "top-right": 45, "bottom-left": 225, "bottom-right": 135 } as const;

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
    background: theme.gradient ? `linear-gradient(${GRADIENT_ANGLES[theme.gradientDirection ?? "bottom-right"]}deg in srgb, ${theme.background} 0%, ${mixHex(theme.background, theme.accent, theme.gradientIntensity / 100)} 100%)` : theme.background,
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
  return <figure className={cn("w-full overflow-hidden border", sizeStyle.player, className)} style={shellStyle}>
    <div className="flex min-w-0 items-center gap-4">
      <CoverImage track={track} title={meta.title} className={cn("shrink-0", sizeStyle.playerCover)} />
      <TrackDetails meta={meta} theme={theme} titleClassName={sizeStyle.title} artistClassName={sizeStyle.artist} />
      <PlayingBars waveform={track.waveform.slice(0, 6)} accent={theme.accent} className="h-5 w-6 shrink-0" />
    </div>
    <div className="mt-3 flex flex-col">
      <PlaybackTimeline track={track} theme={theme} progressSeconds={progressSeconds} durationClassName={sizeStyle.duration} progressClassName={sizeStyle.progress} />
      <PlaybackControls color={theme.text} className={cn("mt-[18px]", sizeStyle.controls)} />
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
  return <figure className={cn("flex w-full flex-col overflow-hidden border", sizeStyle.vertical, className)} style={shellStyle}>
    <CoverImage track={track} title={meta.title} className="size-[200px] shrink-0 self-center" />
    <TrackDetails meta={meta} theme={theme} titleClassName={sizeStyle.verticalTitle} artistClassName={cn("mt-0.5", sizeStyle.artist)} className="mt-5" fillAvailableSpace={false} />
    <VerticalPlaybackTimeline track={track} theme={theme} progressSeconds={progressSeconds} durationClassName={sizeStyle.duration} progressClassName={sizeStyle.progress} className="mt-3" />
    <PlaybackControls color={theme.text} className={cn("mt-auto", sizeStyle.controls)} />
  </figure>;
}

function TrackDetails({ meta, theme, titleClassName, artistClassName, className, fillAvailableSpace = true }: { meta: CardMeta; theme: CardTheme; titleClassName: string; artistClassName: string; className?: string; fillAvailableSpace?: boolean }) {
  return <div className={cn("min-w-0", fillAvailableSpace && "flex-1", className)}><FlowingText text={meta.title} className={cn("font-semibold tracking-[-0.015em]", titleClassName)} /><FlowingText text={meta.artist} className={artistClassName} color={theme.muted} /></div>;
}

function PlaybackTimeline({ track, theme, progressSeconds, durationClassName, progressClassName, className }: { track: Track; theme: CardTheme; progressSeconds: number; durationClassName: string; progressClassName: string; className?: string }) {
  const totalSeconds = durationToSeconds(track.duration);
  const currentSeconds = Math.min(progressSeconds, totalSeconds);
  const progress = totalSeconds ? (currentSeconds / totalSeconds) * 100 : 0;

  return <div className={cn("flex items-center gap-3", className)}><span className={cn("shrink-0", durationClassName)} style={{ color: theme.muted }}>{formatDuration(currentSeconds)}</span><div className="min-w-0 flex-1"><ProgressBar color={theme.muted} heightClassName={progressClassName} progress={progress} /></div><span className={cn("shrink-0", durationClassName)} style={{ color: theme.muted }}>-{formatDuration(totalSeconds - currentSeconds)}</span></div>;
}

function VerticalPlaybackTimeline({ track, theme, progressSeconds, durationClassName, progressClassName, className }: { track: Track; theme: CardTheme; progressSeconds: number; durationClassName: string; progressClassName: string; className?: string }) {
  const totalSeconds = durationToSeconds(track.duration);
  const currentSeconds = Math.min(progressSeconds, totalSeconds);
  const progress = totalSeconds ? (currentSeconds / totalSeconds) * 100 : 0;

  return <div className={className}><ProgressBar color={theme.muted} heightClassName={progressClassName} progress={progress} /><div className="mt-2 flex justify-between"><span className={durationClassName} style={{ color: theme.muted }}>{formatDuration(currentSeconds)}</span><span className={durationClassName} style={{ color: theme.muted }}>-{formatDuration(totalSeconds - currentSeconds)}</span></div></div>;
}

function PlaybackControls({ color, className }: { color: string; className: string }) {
  return <div className={cn("flex items-center justify-center", className)} style={{ color }} aria-hidden="true"><SkipIcon direction="back" /><PauseIcon /><SkipIcon direction="forward" /></div>;
}

function PauseIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" className="scale-125"><rect x="14" y="3" width="4" height="18" rx="1" /><rect x="5" y="3" width="4" height="18" rx="1" /></svg>;
}

function SkipIcon({ direction }: { direction: "back" | "forward" }) {
  const triangle = "M1 0Q0 0 0 1v15q0 1 1 1l12.47-7.2q1.25-1.3 0-2.6Z";
  const positions = direction === "back" ? ["translate(15.22 3.5) scale(-1 1)", "translate(31.5 3.5) scale(-1 1)"] : ["translate(.5 3.5)", "translate(16.78 3.5)"];
  return <svg viewBox="0 0 32 24" overflow="visible" fill="currentColor" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{positions.map((transform) => <path key={transform} d={triangle} transform={transform} />)}</svg>;
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
  return <div className={cn("flex items-center justify-between gap-0.5 overflow-hidden", className)} aria-hidden="true">{waveform.map((value, index) => <span key={`${value}-${index}`} className="animate-wave min-w-[2px] flex-1 rounded-full" style={{ height: `${Math.max(12, value)}%`, backgroundColor: withAlpha(accent, 0.75), animationDelay: `${index * 90}ms` }} />)}</div>;
}

function TrackTicker({ title, artist, titleClassName, artistClassName, mutedColor }: { title: string; artist: string; titleClassName: string; artistClassName: string; mutedColor: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstCopyRef = useRef<HTMLSpanElement>(null);
  const [ticker, setTicker] = useState({ distance: 0, gap: 48 });

  useEffect(() => {
    const update = () => {
      const contentWidth = firstCopyRef.current?.getBoundingClientRect().width ?? 0;
      const gap = compactTickerGap(viewportRef.current?.clientWidth ?? 0, contentWidth);
      setTicker({ distance: contentWidth + gap, gap });
    };
    update();
    const observer = new ResizeObserver(update);
    if (firstCopyRef.current) observer.observe(firstCopyRef.current);
    if (viewportRef.current) observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [title, artist]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || ticker.distance <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animation = track.animate(
      [{ transform: "translateX(0)" }, { transform: `translateX(-${ticker.distance}px)` }],
      { duration: 12_000, delay: 1_000, easing: "linear", iterations: Infinity },
    );
    return () => animation.cancel();
  }, [ticker.distance]);

  const tickerStyle = { columnGap: `${ticker.gap}px` } as React.CSSProperties;

  return <div ref={viewportRef} className="min-w-0 flex-1 overflow-hidden" aria-label={`${title} - ${artist}`}><div ref={trackRef} className="flex w-max items-baseline whitespace-nowrap" style={tickerStyle}>{[0, 1].map((copy) => <span ref={copy === 0 ? firstCopyRef : undefined} key={copy} className="flex items-baseline gap-2" aria-hidden={copy === 1}><span className={cn("font-semibold leading-5 tracking-[-0.01em]", titleClassName)}>{title}</span><span className={cn("shrink-0", artistClassName)} style={{ color: mutedColor }}>{artist}</span></span>)}</div></div>;
}
