import { Skeleton } from "@/components/ui/skeleton";

export function LoadingPreview() {
  return (
    <div role="status" aria-live="polite" className="rounded-2xl border border-border bg-card/40 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 items-end gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((bar) => (
            <span
              key={bar}
              className="h-6 w-[3px] rounded-full bg-primary animate-bar"
              style={{ animationDelay: `${bar * 120}ms` }}
            />
          ))}
        </div>
        <p className="text-[13px] leading-5 text-muted-foreground">영상 정보를 읽고 있어요…</p>
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
