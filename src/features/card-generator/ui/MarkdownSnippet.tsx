"use client";

import { Check, Code2, Copy } from "lucide-react";
import { Button } from "@/shared/ui/button";

type MarkdownSnippetProps = {
  markdown: string | null;
  hasPendingChanges: boolean;
  saveStatus: "idle" | "saving" | "error";
  saveError: string | null;
  isFallbackMarkdown: boolean;
  copied: boolean;
  feedback: "success" | "error" | null;
  onCopy: () => void;
  onGenerate: () => void;
};

export function MarkdownSnippet({
  markdown,
  hasPendingChanges,
  saveStatus,
  saveError,
  isFallbackMarkdown,
  copied,
  feedback,
  onCopy,
  onGenerate,
}: MarkdownSnippetProps) {
  const hasMarkdown = Boolean(markdown);
  const buttonLabel = saveStatus === "saving"
    ? "카드 저장 중..."
    : hasMarkdown && hasPendingChanges
      ? "새 Markdown 코드 생성"
      : isFallbackMarkdown
        ? "짧은 URL로 다시 생성"
        : "Markdown 코드 생성";

  return (
    <section className="rounded-xl border border-border bg-background p-4 sm:p-5" aria-labelledby="markdown-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p id="markdown-heading" className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Markdown 코드</p>
          <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
            {hasMarkdown ? "생성된 코드를 GitHub README에 붙여 넣어 카드를 표시할 수 있습니다." : "현재 설정으로 GitHub README에 붙여 넣을 Markdown 코드를 준비합니다."}
          </p>
        </div>
        <Button type="button" onClick={onGenerate} disabled={saveStatus === "saving"} className="gap-2 sm:shrink-0">
          <Code2 className="size-4" aria-hidden="true" />
          {buttonLabel}
        </Button>
      </div>

      {saveError ? <p className="mt-3 text-[12px] leading-5 text-destructive" role="alert">{saveError}</p> : null}

      {hasMarkdown ? (
        <div className="mt-5">
          {hasPendingChanges ? (
            <p className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[12px] leading-5 text-muted-foreground" role="status">
              변경사항이 있습니다. 현재 미리보기를 반영하려면 새 Markdown 코드를 생성해 주세요.
            </p>
          ) : null}
          {isFallbackMarkdown ? (
            <p className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[12px] leading-5 text-muted-foreground" role="status">
              카드 저장 서버의 응답이 지연되어, 현재 설정을 바로 사용할 수 있는 호환 URL 코드로 생성했습니다. 나중에 다시 생성하면 짧은 URL 코드로 바꿀 수 있습니다.
            </p>
          ) : null}
          <div className="relative">
            <pre className="whitespace-pre-wrap break-all rounded-xl border border-border bg-background p-5 pr-14 font-mono text-[13px] leading-6 tracking-[-0.01em] text-muted-foreground">
              <code>{markdown}</code>
            </pre>
            <Button type="button" variant="ghost" size="icon" onClick={onCopy} aria-label="Markdown 복사" className="absolute right-2 top-2">
              {copied ? <Check className="size-4 text-primary" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            </Button>
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {feedback === "success" ? "README 삽입 코드를 복사했습니다." : feedback === "error" ? "복사하지 못했습니다. 코드를 직접 선택해 복사해 주세요." : ""}
          </span>
          {feedback === "error" ? <p className="mt-2 text-[12px] leading-5 text-destructive">복사하지 못했습니다. 코드를 직접 선택해 복사해 주세요.</p> : null}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-background/50 px-5 py-8 text-center">
          <Code2 className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-[13px] font-medium text-foreground">Markdown 코드를 아직 생성하지 않았습니다.</p>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">커스텀을 마친 뒤 버튼을 눌러 카드를 저장하고 코드를 생성해 주세요.</p>
        </div>
      )}
    </section>
  );
}
