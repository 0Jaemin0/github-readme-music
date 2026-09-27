'use client';

import { Check, Code2, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CardGeneratorErrorKey } from '../model/card-generator-errors';
import { Button } from '@/shared/ui/button';

interface MarkdownSnippetProps {
  markdown: string | null;
  hasPendingChanges: boolean;
  saveStatus: 'idle' | 'saving' | 'error';
  saveError: CardGeneratorErrorKey | null;
  isFallbackMarkdown: boolean;
  copied: boolean;
  feedback: 'success' | 'error' | null;
  onCopy: () => void;
  onGenerate: () => void;
}

export const MarkdownSnippet = ({
  markdown,
  hasPendingChanges,
  saveStatus,
  saveError,
  isFallbackMarkdown,
  copied,
  feedback,
  onCopy,
  onGenerate,
}: MarkdownSnippetProps) => {
  const t = useTranslations('Markdown');
  const tErrors = useTranslations('Errors');
  const hasMarkdown = Boolean(markdown);
  const buttonLabel =
    saveStatus === 'saving'
      ? t('buttons.saving')
      : hasMarkdown && hasPendingChanges
        ? t('buttons.regenerate')
        : isFallbackMarkdown
          ? t('buttons.retryShortUrl')
          : t('buttons.generate');

  return (
    <section className="rounded-xl border border-border bg-background p-4 sm:p-5" aria-labelledby="markdown-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            id="markdown-heading"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
          >
            {t('title')}
          </p>
          <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
            {hasMarkdown ? t('readyDescription') : t('prepareDescription')}
          </p>
        </div>
        <Button type="button" onClick={onGenerate} disabled={saveStatus === 'saving'} className="gap-2 sm:shrink-0">
          <Code2 className="size-4" aria-hidden="true" />
          {buttonLabel}
        </Button>
      </div>

      {saveError ? (
        <p className="mt-3 text-[12px] leading-5 text-destructive" role="alert">
          {tErrors(saveError)}
        </p>
      ) : null}

      {hasMarkdown ? (
        <div className="mt-5">
          {hasPendingChanges ? (
            <p
              className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[12px] leading-5 text-muted-foreground"
              role="status"
            >
              {t('pendingChanges')}
            </p>
          ) : null}
          {isFallbackMarkdown ? (
            <p
              className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[12px] leading-5 text-muted-foreground"
              role="status"
            >
              {t('fallbackNotice')}
            </p>
          ) : null}
          <div className="relative">
            <pre className="whitespace-pre-wrap break-all rounded-xl border border-border bg-background p-5 pr-14 font-mono text-[13px] leading-6 tracking-[-0.01em] text-muted-foreground">
              <code>{markdown}</code>
            </pre>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCopy}
              aria-label={t('copy.label')}
              className="absolute right-2 top-2"
            >
              {copied ? (
                <Check className="size-4 text-primary" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {feedback === 'success' ? t('copy.success') : feedback === 'error' ? t('copy.failure') : ''}
          </span>
          {feedback === 'error' ? (
            <p className="mt-2 text-[12px] leading-5 text-destructive">{t('copy.failure')}</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-background/50 px-5 py-8 text-center">
          <Code2 className="mx-auto size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-[13px] font-medium text-foreground">{t('empty.title')}</p>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{t('empty.hint')}</p>
        </div>
      )}
    </section>
  );
};
