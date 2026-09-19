'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type RecentCardsProps = {
  cardIds: string[];
  isLoaded: boolean;
  isRestoring: boolean;
  fillRemainingSpace?: boolean;
  onSelectCard: (cardId: string) => void;
};

export const RecentCards = ({
  cardIds,
  isLoaded,
  isRestoring,
  fillRemainingSpace = false,
  onSelectCard,
}: RecentCardsProps) => {
  const [failedCardIds, setFailedCardIds] = useState<Set<string>>(() => new Set());
  const [loadedCardIds, setLoadedCardIds] = useState<Set<string>>(() => new Set());
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  if (!isLoaded || cardIds.length === 0) return null;

  return (
    <section
      className={cn('mt-7', fillRemainingSpace && 'flex min-h-0 flex-1 flex-col')}
      aria-labelledby="recent-cards-heading"
    >
      <h2 id="recent-cards-heading" className="text-sm font-semibold tracking-[-0.02em]">
        최근 생성한 카드
      </h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        카드를 선택하면 이전 설정을 불러와 이어서 수정할 수 있어요.
      </p>
      <div className={cn('mt-2 grid grid-cols-3 gap-2.5 sm:gap-3', fillRemainingSpace && 'min-h-0 flex-1')}>
        {cardIds.map((cardId) => {
          const hasFailed = failedCardIds.has(cardId);
          const hasLoaded = loadedCardIds.has(cardId);

          return (
            <button
              key={cardId}
              type="button"
              disabled={!hasLoaded || isRestoring}
              className={cn(
                'relative flex items-center justify-center overflow-hidden rounded-xl border border-border bg-card/40 p-2 transition-colors duration-200 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none sm:p-2.5',
                hasLoaded ? 'cursor-zoom-in hover:border-primary/60 hover:bg-muted/70' : 'cursor-wait',
                fillRemainingSpace ? 'h-full' : 'h-[104px] sm:h-[112px]',
              )}
              onMouseEnter={() => {
                if (hasLoaded) setHoveredCardId(cardId);
              }}
              onMouseLeave={() => setHoveredCardId((current) => (current === cardId ? null : current))}
              onClick={() => onSelectCard(cardId)}
              aria-label="저장된 카드 설정 불러오기"
              aria-busy={isRestoring || undefined}
            >
              {hasFailed ? (
                <ImageOff className="size-4 text-muted-foreground" aria-label="카드를 불러오지 못했습니다" />
              ) : (
                <>
                  {!hasLoaded ? (
                    <div className="absolute inset-2.5 animate-pulse rounded-lg bg-muted" aria-hidden="true" />
                  ) : null}
                  {/* SVG uses the saved card ID and keeps its original aspect ratio inside the fixed preview slot. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/card/${encodeURIComponent(cardId)}.svg`}
                    alt="최근 생성한 카드"
                    className={cn(
                      'relative max-h-full max-w-full object-contain transition-opacity duration-200',
                      hasLoaded ? 'opacity-100' : 'opacity-0',
                    )}
                    onLoad={() => setLoadedCardIds((current) => new Set(current).add(cardId))}
                    onError={() => setFailedCardIds((current) => new Set(current).add(cardId))}
                  />
                </>
              )}
            </button>
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
};
