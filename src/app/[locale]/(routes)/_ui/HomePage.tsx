'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import brandMark from '@/shared/assets/brand-mark.png';
import { ThemeToggle } from '@/features/theme-toggle';
import { LocaleSwitcher } from '@/features/locale-switcher';
import { CardGeneratorWorkspace, useCardGeneratorContext } from '@/widgets/card-generator-workspace';

export const HomePage = () => {
  const t = useTranslations('Home');
  const { isLanding, isBusy, resetEditor } = useCardGeneratorContext();
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);

  return (
    <div className={isLanding ? 'flex h-dvh flex-col overflow-hidden' : 'flex min-h-dvh flex-col'}>
      <header className="shrink-0">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2"
            onClick={resetEditor}
            aria-label={t('homeLabel')}
          >
            <Image src={brandMark} alt="" priority className="size-7" />
            <span className="font-mono text-[13px] font-semibold tracking-[-0.02em]">github-readme-music</span>
          </button>
          <nav className="flex items-center" aria-label={t('navigationLabel')}>
            <LocaleSwitcher disabled={isBusy} onPendingChange={setIsLanguageChanging} />
            <span aria-hidden="true" className="mx-3 h-4 w-px bg-border" />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <section className="mx-auto w-full max-w-3xl shrink-0 px-5 pb-4 pt-16 text-center sm:pt-24">
          <h1 className="text-balance text-[2rem] font-semibold leading-[1.16] tracking-[-0.04em] sm:text-[3.25rem]">
            {t('heading')}
            <br />
            <span className="text-primary">{t('headingAccent')}</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground sm:max-w-none sm:text-base">
            {t('description')}
          </p>
        </section>

        <section
          inert={isLanguageChanging}
          aria-busy={isLanguageChanging}
          className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-5 pb-8 pt-8"
        >
          <CardGeneratorWorkspace />
        </section>
      </main>
    </div>
  );
};
