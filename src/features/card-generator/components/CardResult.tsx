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
  copyFeedback: "success" | "error" | null;
  isRefreshing: boolean;
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
  copyFeedback,
  isRefreshing,
  onMetaChange,
  onCoverPositionChange,
  onStyleChange,
  onProgressChange,
  onThemeChange,
  onCopy,
}: CardResultProps) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card/40 p-4 sm:p-8">
      {isRefreshing ? <p className="text-[13px] text-muted-foreground" role="status">새 영상 정보를 불러오고 있습니다. 현재 카드는 그대로 유지됩니다.</p> : null}
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
      <MarkdownSnippet markdown={markdown} copied={copied} feedback={copyFeedback} onCopy={onCopy} />
    </div>
  );
}
