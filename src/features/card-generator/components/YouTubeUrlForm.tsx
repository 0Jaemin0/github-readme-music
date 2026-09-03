"use client";

import { ArrowRight, Link2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type YouTubeUrlFormProps = {
  url: string;
  error: string | null;
  isLoading: boolean;
  onUrlChange: (value: string) => void;
  onSubmit: () => void;
};

export function YouTubeUrlForm({ url, error, isLoading, onUrlChange, onSubmit }: YouTubeUrlFormProps) {
  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Link2
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="youtube-url" className="sr-only">
            YouTube 링크
          </label>
          <Input
            id="youtube-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="https://youtube.com/watch?v=..."
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "youtube-url-error" : undefined}
            className="h-13 rounded-xl bg-card pl-11 font-mono text-[13px] tracking-[-0.01em] md:text-[13px]"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="h-13 rounded-xl px-6 text-sm font-semibold tracking-[-0.01em] hover:bg-primary-hover"
        >
          {isLoading ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              불러오는 중
            </>
          ) : (
            <>
              카드 만들기
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-3 flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-5">
        {error ? (
          <p id="youtube-url-error" role="alert" className="text-destructive">
            {error}
          </p>
        ) : (
          <p className="text-muted-foreground">
            YouTube 링크를 입력하시면 제목과 아티스트를 확인한 뒤 카드를 만들 수 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}
