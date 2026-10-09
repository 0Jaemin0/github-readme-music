'use client';

import { useSyncExternalStore } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, Laptop, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';

const STORAGE_KEY = 'github-readme-music-theme';
const THEME_CHANGE_EVENT = 'github-readme-music-theme-change';

type Theme = 'system' | 'light' | 'dark';

const options: { value: Theme; labelKey: 'system' | 'light' | 'dark'; icon: typeof Laptop }[] = [
  { value: 'system', labelKey: 'system', icon: Laptop },
  { value: 'light', labelKey: 'light', icon: Sun },
  { value: 'dark', labelKey: 'dark', icon: Moon },
];

const getTheme = (): Theme => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
};

const applyTheme = (theme: Theme) => {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const subscribe = (onStoreChange: () => void) => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const synchronizeSystemTheme = () => {
    if (getTheme() === 'system') applyTheme('system');
    onStoreChange();
  };
  const synchronizeStorageTheme = () => onStoreChange();

  media.addEventListener('change', synchronizeSystemTheme);
  window.addEventListener('storage', synchronizeStorageTheme);
  window.addEventListener(THEME_CHANGE_EVENT, synchronizeStorageTheme);

  return () => {
    media.removeEventListener('change', synchronizeSystemTheme);
    window.removeEventListener('storage', synchronizeStorageTheme);
    window.removeEventListener(THEME_CHANGE_EVENT, synchronizeStorageTheme);
  };
};

export const ThemeToggle = () => {
  const t = useTranslations('ThemeToggle');
  const theme = useSyncExternalStore<Theme>(subscribe, getTheme, () => 'system');
  const CurrentIcon = options.find(({ value }) => value === theme)?.icon ?? Laptop;

  const selectTheme = (next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <>
      <Menu.Root modal={false}>
        <Menu.Trigger
          aria-label={`${t('label')}: ${t(theme)}`}
          title={`${t('label')}: ${t(theme)}`}
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-1 rounded-md px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent data-popup-open:text-foreground sm:hidden"
        >
          <CurrentIcon className="size-4" aria-hidden="true" />
          <ChevronDown className="size-3" aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={8} className="z-50">
            <Menu.Popup className="min-w-32 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-md outline-none">
              <Menu.RadioGroup
                value={theme}
                onValueChange={(value) => {
                  if (value === 'system' || value === 'light' || value === 'dark') selectTheme(value);
                }}
                aria-label={t('label')}
              >
                {options.map(({ value, labelKey, icon: Icon }) => (
                  <Menu.RadioItem
                    key={value}
                    value={value}
                    label={t(labelKey)}
                    closeOnClick
                    className="flex cursor-pointer items-center justify-between gap-5 rounded-md px-3 py-2 text-[13px] outline-none data-checked:font-semibold data-checked:text-primary data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="size-3.5" aria-hidden="true" />
                      {t(labelKey)}
                    </span>
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
      <div
        className="hidden items-center rounded-lg border border-border bg-card p-0.5 shadow-none sm:inline-flex"
        role="group"
        aria-label={t('label')}
      >
        {options.map(({ value, labelKey, icon: Icon }) => {
          const active = theme === value;
          const label = t(labelKey);

          return (
            <button
              key={value}
              type="button"
              onClick={() => selectTheme(value)}
              aria-pressed={active}
              aria-label={`${label} ${t('label')}`}
              title={`${label} ${t('label')}`}
              className={cn(
                'inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-[11px] font-medium transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                active
                  ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                  : 'text-muted-foreground',
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </>
  );
};
