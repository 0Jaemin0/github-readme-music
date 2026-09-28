'use client';

import { useEffect, useRef, useTransition } from 'react';
import { hasLocale, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { PrefetchKind } from 'next/dist/client/components/router-reducer/router-reducer-types';
import { usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

type Locale = (typeof routing.locales)[number];

interface LocaleNavigationTarget {
  locale: Locale;
  href: string;
}

interface UseLocaleNavigationOptions {
  disabled: boolean;
  onPendingChange?: (isPending: boolean) => void;
  onNavigationStart: () => void;
}

// The locale subtree remounts during navigation. Only this short-lived URL
// survives that boundary; editor state remains in its existing Provider.
let pendingNavigation: LocaleNavigationTarget | null = null;

const getLocaleHref = (pathname: string, locale: Locale) => {
  const localePath = pathname === '/' ? '' : pathname;
  const targetPathname = locale === routing.defaultLocale ? pathname : `/${locale}${localePath}`;

  return `${targetPathname}${window.location.search}${window.location.hash}`;
};

const completeNavigation = (locale: Locale) => {
  const target = pendingNavigation;
  if (!target || target.locale !== locale) return;

  const expectedUrl = new URL(target.href, window.location.origin);
  const isDestination =
    window.location.pathname === expectedUrl.pathname && window.location.search === expectedUrl.search;
  if (!isDestination) return;

  // Next can append a hash already present in a reused page's URL.
  if (window.location.hash !== expectedUrl.hash) {
    window.history.replaceState(window.history.state, '', target.href);
  }

  pendingNavigation = null;
};

export const useLocaleNavigation = ({ disabled, onPendingChange, onNavigationStart }: UseLocaleNavigationOptions) => {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const prefetchedHref = useRef<string | null>(null);
  const isDisabled = disabled || isPending;

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  useEffect(() => {
    if (!isPending) completeNavigation(locale);
  }, [isPending, locale]);

  const prefetchOtherLocale = () => {
    if (isDisabled) return;

    const otherLocale = routing.locales.find((candidate) => candidate !== locale);
    if (!otherLocale) return;

    const href = getLocaleHref(pathname, otherLocale);
    if (prefetchedHref.current === href) return;

    prefetchedHref.current = href;

    try {
      router.prefetch(href, {
        // Next 16.3 needs FULL to prepare dynamic page data, not just its shell.
        kind: PrefetchKind.FULL,
        onInvalidate: () => {
          if (prefetchedHref.current === href) prefetchedHref.current = null;
        },
      });
    } catch {
      // An optional prefetch failure must not block normal navigation.
      prefetchedHref.current = null;
    }
  };

  const changeLocale = (nextLocale: unknown) => {
    if (isDisabled || !hasLocale(routing.locales, nextLocale) || nextLocale === locale) return;

    const href = getLocaleHref(pathname, nextLocale);
    pendingNavigation = { locale: nextLocale, href };
    onPendingChange?.(true);
    onNavigationStart();

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  return { locale, isDisabled, prefetchOtherLocale, changeLocale };
};
