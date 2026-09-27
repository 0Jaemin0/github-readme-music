'use client';

import { useEffect, useState, useTransition } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { hasLocale, useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

interface LocaleSwitcherProps {
  disabled?: boolean;
  onPendingChange?: (isPending: boolean) => void;
}

const languages = [
  { locale: 'ko', label: '한국어' },
  { locale: 'en', label: 'English' },
] as const;

export const LocaleSwitcher = ({ disabled = false, onPendingChange }: LocaleSwitcherProps) => {
  const locale = useLocale();
  const t = useTranslations('LocaleSwitcher');
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isDisabled = disabled || isPending;

  useEffect(() => {
    onPendingChange?.(isPending);
  }, [isPending, onPendingChange]);

  const selectLocale = (nextLocale: unknown) => {
    if (isDisabled || !hasLocale(routing.locales, nextLocale) || nextLocale === locale) return;

    onPendingChange?.(true);
    setOpen(false);
    const suffix = `${window.location.search}${window.location.hash}`;
    startTransition(() => {
      router.replace(`${pathname}${suffix}`, { locale: nextLocale, scroll: false });
    });
  };

  return (
    <Menu.Root open={open && !isDisabled} onOpenChange={setOpen} modal={false}>
      <Menu.Trigger
        openOnHover
        delay={100}
        closeDelay={150}
        disabled={isDisabled}
        aria-label={t('label')}
        title={isDisabled ? t('busy') : t('label')}
        className="inline-flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-50 data-popup-open:bg-accent data-popup-open:text-foreground"
      >
        <Languages className="size-4" aria-hidden="true" />
        <ChevronDown className="size-3" aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
          <Menu.Popup className="min-w-32 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-md outline-none">
            <Menu.RadioGroup value={locale} onValueChange={selectLocale} aria-label={t('label')}>
              {languages.map((language) => (
                <Menu.RadioItem
                  key={language.locale}
                  value={language.locale}
                  lang={language.locale}
                  label={language.label}
                  closeOnClick
                  disabled={isDisabled}
                  className="flex cursor-pointer items-center justify-between gap-5 rounded-md px-3 py-2 text-[13px] outline-none data-checked:font-semibold data-checked:text-primary data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {language.label}
                  <Menu.RadioItemIndicator>
                    <Check className="size-3.5" aria-hidden="true" />
                  </Menu.RadioItemIndicator>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
