"use client";

import { useCardGenerator } from "../hooks/useCardGenerator";
import { CardResult } from "./CardResult";
import { LoadingPreview } from "./LoadingPreview";
import { YouTubeUrlForm } from "./YouTubeUrlForm";

export function CardGenerator() {
  const cardGenerator = useCardGenerator();

  return (
    <div className="w-full">
      <YouTubeUrlForm
        url={cardGenerator.url}
        error={cardGenerator.error}
        isLoading={cardGenerator.status === "loading"}
        onUrlChange={cardGenerator.updateUrl}
        onSubmit={cardGenerator.generate}
      />

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
            copied={cardGenerator.copied}
            copyFeedback={cardGenerator.copyFeedback}
            isRefreshing={cardGenerator.status === "loading"}
            onMetaChange={cardGenerator.setMeta}
            onStyleChange={cardGenerator.setStyle}
            onProgressChange={cardGenerator.setProgressSeconds}
            onThemeChange={cardGenerator.setTheme}
            onCopy={cardGenerator.copyMarkdown}
          />
        ) : null}
      </div>
    </div>
  );
}
