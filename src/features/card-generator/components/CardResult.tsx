import { CardCustomizer } from "./CardCustomizer";
import { CardMetadataFields } from "./CardMetadataFields";
import { CardPreviewPanel } from "./CardPreviewPanel";
import { MarkdownSnippet } from "./MarkdownSnippet";
import type { CardMeta, CardStyleId, CardTheme, CoverPosition, Track } from "../model/types";

type CardResultProps = {
  track: Track;
  meta: CardMeta;
  style: CardStyleId;
  progressSeconds: number;
  theme: CardTheme;
  markdown: string;
  copied: boolean;
  onMetaChange: (meta: CardMeta) => void;
  onCoverPositionChange: (position: CoverPosition) => void;
  onStyleChange: (style: CardStyleId) => void;
  onProgressChange: (progressSeconds: number) => void;
  onThemeChange: (theme: CardTheme) => void;
  onCopy: () => void;
};

export function CardResult({
  track,
  meta,
  style,
  progressSeconds,
  theme,
  markdown,
  copied,
  onMetaChange,
  onCoverPositionChange,
  onStyleChange,
  onProgressChange,
  onThemeChange,
  onCopy,
}: CardResultProps) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card/40 p-4 sm:p-8">
      <CardMetadataFields
        meta={meta}
        track={track}
        onChange={onMetaChange}
        onCoverPositionChange={onCoverPositionChange}
      />
      <CardPreviewPanel
        track={track}
        meta={meta}
        style={style}
        progressSeconds={progressSeconds}
        theme={theme}
        onStyleChange={onStyleChange}
        onProgressChange={onProgressChange}
      />
      <CardCustomizer theme={theme} onChange={onThemeChange} />
      <MarkdownSnippet markdown={markdown} copied={copied} onCopy={onCopy} />
    </div>
  );
}
