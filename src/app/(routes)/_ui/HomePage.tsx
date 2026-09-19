"use client";

import Image from "next/image";
import { useState } from "react";
import brandMark from "@/shared/assets/brand-mark.png";
import { ThemeToggle } from "@/features/theme-toggle";
import { CardGeneratorWorkspace } from "@/widgets/card-generator-workspace";

export function HomePage() {
  const [generatorKey, setGeneratorKey] = useState(0);
  const [isLanding, setIsLanding] = useState(true);

  return (
    <div className={isLanding ? "flex h-dvh flex-col overflow-hidden" : "flex min-h-dvh flex-col"}>
      <header className="shrink-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2"
            onClick={() => {
              setIsLanding(true);
              setGeneratorKey((current) => current + 1);
            }}
            aria-label="github-readme-music 홈으로 돌아가기"
          >
            <Image src={brandMark} alt="" priority className="size-7" />
            <span className="font-mono text-[13px] font-semibold tracking-[-0.02em]">github-readme-music</span>
          </button>
          <nav className="flex items-center" aria-label="보조 메뉴">
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <section className="mx-auto w-full max-w-3xl shrink-0 px-5 pb-4 pt-16 text-center sm:pt-24">
          <h1 className="text-balance text-[2rem] font-semibold leading-[1.16] tracking-[-0.04em] sm:text-[3.25rem]">
            좋아하는 음악을,
            <br />
            <span className="text-primary">README에 담아 보세요.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground sm:max-w-none sm:text-base">
            YouTube 링크 하나로 나를 소개하는 음악 카드를 만들어 README에 남겨 보세요.
          </p>
        </section>

        <section className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-5 pb-8 pt-8">
          <CardGeneratorWorkspace key={generatorKey} onLandingChange={setIsLanding} />
        </section>
      </main>
    </div>
  );
}
