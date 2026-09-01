'use client'

import { useSyncExternalStore } from 'react'
import { Laptop, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'github-readme-music-theme'
const THEME_CHANGE_EVENT = 'github-readme-music-theme-change'

type Theme = 'system' | 'light' | 'dark'

const options: { value: Theme; label: string; icon: typeof Laptop }[] = [
  { value: 'system', label: '시스템', icon: Laptop },
  { value: 'light', label: '라이트', icon: Sun },
  { value: 'dark', label: '다크', icon: Moon },
]

function getTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function applyTheme(theme: Theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const synchronizeSystemTheme = () => {
    if (getTheme() === 'system') applyTheme('system')
    onStoreChange()
  }
  const synchronizeStorageTheme = () => onStoreChange()

  media.addEventListener('change', synchronizeSystemTheme)
  window.addEventListener('storage', synchronizeStorageTheme)
  window.addEventListener(THEME_CHANGE_EVENT, synchronizeStorageTheme)

  return () => {
    media.removeEventListener('change', synchronizeSystemTheme)
    window.removeEventListener('storage', synchronizeStorageTheme)
    window.removeEventListener(THEME_CHANGE_EVENT, synchronizeStorageTheme)
  }
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'system')

  function selectTheme(next: Theme) {
    window.localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  return (
    <div
      className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 shadow-none"
      role="group"
      aria-label="화면 테마 선택"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value

        return (
          <button
            key={value}
            type="button"
            onClick={() => selectTheme(value)}
            aria-pressed={active}
            aria-label={`${label} 모드`}
            title={`${label} 모드`}
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
        )
      })}
    </div>
  )
}
