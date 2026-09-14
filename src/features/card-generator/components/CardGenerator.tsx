"use client";

import { useEffect } from "react";
import { useCardGenerator } from "../hooks/useCardGenerator";
import { CardResult } from "./CardResult";
import { LoadingPreview } from "./LoadingPreview";
import { RecentCards } from "./RecentCards";
import { YouTubeUrlForm } from "./YouTubeUrlForm";
import { useRecentCards } from "../hooks/useRecentCards";
import { cn } from "@/lib/utils";

export function CardGenerator({ onLandingChange }: { onLandingChange?: (isLanding: boolean) => void }) {
  const recentCards = useRecentCards();
  const cardGenerator = useCardGenerator({ onStoredCardCreated: recentCards.addCardId });
  const isLanding = !cardGenerator.track && cardGenerator.status === "idle";

  useEffect(() => {
    onLandingChange?.(isLanding);
  }, [isLanding, onLandingChange]);

  return (
    <div className={cn("w-full", isLanding && "flex min-h-0 flex-1 flex-col")}>
      <YouTubeUrlForm
        url={cardGenerator.url}
        error={cardGenerator.error}
        isLoading={cardGenerator.status === "loading"}
        onUrlChange={cardGenerator.updateUrl}
        onSubmit={cardGenerator.generate}
      />

      {isLanding ? <RecentCards cardIds={recentCards.cardIds} isLoaded={recentCards.isLoaded} fillRemainingSpace /> : null}

      {!isLanding ? (
        <div className="mt-8">
          {cardGenerator.status === "loading" && !cardGenerator.track ? <LoadingPreview /> : null}
          {cardGenerator.track ? (
            <CardResult
              track={cardGenerator.track}
              meta={cardGenerator.meta}
              onCoverPositionChange={cardGenerator.updateCoverPosition}
              style={cardGenerator.style}
              progressSeconds={cardGenerator.progressSeconds}
              theme={cardGenerator.theme}
              markdown={cardGenerator.markdown}
              hasPendingMarkdownChanges={cardGenerator.hasPendingMarkdownChanges}
              markdownSaveStatus={cardGenerator.saveStatus}
              markdownSaveError={cardGenerator.saveError}
              isFallbackMarkdown={cardGenerator.isFallbackMarkdown}
              copied={cardGenerator.copied}
              copyFeedback={cardGenerator.copyFeedback}
              isRefreshing={cardGenerator.status === "loading"}
              onMetaChange={cardGenerator.setMeta}
              onStyleChange={cardGenerator.setStyle}
              onProgressChange={cardGenerator.setProgressSeconds}
              onThemeChange={cardGenerator.setTheme}
              onCopy={cardGenerator.copyMarkdown}
              onGenerateMarkdown={cardGenerator.generateMarkdown}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
