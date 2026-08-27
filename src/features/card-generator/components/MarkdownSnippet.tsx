"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type MarkdownSnippetProps = {
  markdown: string;
  copied: boolean;
  onCopy: () => void;
};

export function MarkdownSnippet({ markdown, copied, onCopy }: MarkdownSnippetProps) {
  return (
    <div className="pt-2">
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Markdown</p>
      <div className="relative mt-3">
        <pre className="whitespace-pre-wrap break-all rounded-xl border border-border bg-background p-5 pr-14 font-mono text-[13px] leading-6 tracking-[-0.01em] text-muted-foreground">
          <code>{markdown}</code>
        </pre>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCopy}
          aria-label="Markdown 복사"
          className="absolute right-2 top-2"
        >
          {copied ? <Check className="size-4 text-primary" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        </Button>
        <span className="sr-only" role="status">
          {copied ? "Markdown을 복사했어요." : ""}
        </span>
      </div>
    </div>
  );
}
