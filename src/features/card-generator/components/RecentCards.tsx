"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type RecentCardsProps = {
  cardIds: string[];
  isLoaded: boolean;
  fillRemainingSpace?: boolean;
};

export function RecentCards({ cardIds, isLoaded, fillRemainingSpace = false }: RecentCardsProps) {
  const [failedCardIds, setFailedCardIds] = useState<Set<string>>(() => new Set());
  const [loadedCardIds, setLoadedCardIds] = useState<Set<string>>(() => new Set());
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  if (!isLoaded || cardIds.length === 0) return null;

  return (
    <section className={cn("mt-7", fillRemainingSpace && "flex min-h-0 flex-1 flex-col")} aria-labelledby="recent-cards-heading">
      <h2 id="recent-cards-heading" className="text-sm font-semibold tracking-[-0.02em]">
        최근 생성한 카드
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        카드 형식별 비율을 유지한 축소 미리보기입니다.
      </p>
      <div className={cn("mt-2 grid grid-cols-3 gap-2.5 sm:gap-3", fillRemainingSpace && "min-h-0 flex-1")}>
        {cardIds.map((cardId) => {
          const hasFailed = failedCardIds.has(cardId);
          const hasLoaded = loadedCardIds.has(cardId);

          return (
            <div
              key={cardId}
              className={cn("relative flex items-center justify-center overflow-hidden rounded-xl border border-border bg-card/40 p-2 sm:p-2.5", hasLoaded ? "cursor-zoom-in" : "cursor-wait", fillRemainingSpace ? "h-full" : "h-[104px] sm:h-[112px]")}
              onMouseEnter={() => {
                if (hasLoaded) setHoveredCardId(cardId);
              }}
              onMouseLeave={() => setHoveredCardId((current) => current === cardId ? null : current)}
            >
              {hasFailed ? (
                <ImageOff className="size-4 text-muted-foreground" aria-label="카드를 불러오지 못했습니다" />
              ) : (
                <>
                  {!hasLoaded ? <div className="absolute inset-2.5 animate-pulse rounded-lg bg-muted" aria-hidden="true" /> : null}
                  {/* SVG uses the saved card ID and keeps its original aspect ratio inside the fixed preview slot. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/card/${encodeURIComponent(cardId)}.svg`}
                    alt="최근 생성한 카드"
                    className={cn("relative max-h-full max-w-full object-contain transition-opacity duration-200", hasLoaded ? "opacity-100" : "opacity-0")}
                    onLoad={() => setLoadedCardIds((current) => new Set(current).add(cardId))}
                    onError={() => setFailedCardIds((current) => new Set(current).add(cardId))}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
      {hoveredCardId && !failedCardIds.has(hoveredCardId) ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-5" aria-hidden="true">
          {/* The SVG keeps its original dimensions unless it would exceed the viewport. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/card/${encodeURIComponent(hoveredCardId)}.svg`}
            alt=""
            className="max-h-[calc(100dvh-2.5rem)] max-w-[calc(100vw-2.5rem)] drop-shadow-[0_20px_40px_rgba(0,0,0,0.28)]"
          />
        </div>
      ) : null}
    </section>
  );
}
