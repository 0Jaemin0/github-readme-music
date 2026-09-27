'use client';

import { useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocaleNavigation } from '../model/useLocaleNavigation';

interface LocaleSwitcherProps {
  disabled?: boolean;
  onPendingChange?: (isPending: boolean) => void;
}

const languages = [
  { locale: 'ko', label: '한국어' },
  { locale: 'en', label: 'English' },
] as const;

export const LocaleSwitcher = ({ disabled = false, onPendingChange }: LocaleSwitcherProps) => {
  const t = useTranslations('LocaleSwitcher');
  const [open, setOpen] = useState(false);
  const { locale, isDisabled, prefetchOtherLocale, changeLocale } = useLocaleNavigation({
    disabled,
    onPendingChange,
    onNavigationStart: () => setOpen(false),
  });

  return (
    <Menu.Root open={open && !isDisabled} onOpenChange={setOpen} modal={false}>
      <Menu.Trigger
        openOnHover
        delay={100}
        closeDelay={150}
        disabled={isDisabled}
        onMouseEnter={prefetchOtherLocale}
        onFocus={prefetchOtherLocale}
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
            <Menu.RadioGroup value={locale} onValueChange={changeLocale} aria-label={t('label')}>
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
