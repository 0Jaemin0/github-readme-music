'use client'

import { ColorField } from './ColorField'
import { contrastRatio } from '../lib/color'
import type { CardTheme } from '../model/types'

export function CardCustomizer({
  theme,
  onChange,
}: {
  theme: CardTheme
  onChange: (theme: CardTheme) => void
}) {
  const lowContrastRoles = [
    { name: '제목', color: theme.text },
    { name: '가수', color: theme.muted },
    { name: '포인트', color: theme.accent },
  ].filter(({ color }) => contrastRatio(theme.background, color) < 1.8)

  function set<K extends keyof CardTheme>(key: K, value: CardTheme[K]) {
    onChange({ ...theme, [key]: value })
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <p className="mb-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          색상
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-x-8">
          <ColorField
            label="카드 배경"
            value={theme.background}
            onChange={(v) => set('background', v)}
          />
          <ColorField label="카드 테두리" value={theme.border} onChange={(v) => set('border', v)} />
          <ColorField label="제목" value={theme.text} onChange={(v) => set('text', v)} />
          <ColorField label="가수" value={theme.muted} onChange={(v) => set('muted', v)} />
          <ColorField label="포인트" value={theme.accent} onChange={(v) => set('accent', v)} />
        </div>
        <label className="mt-3 inline-flex w-fit cursor-pointer items-center gap-2 text-[13px] leading-5 text-muted-foreground">
          <input
            type="checkbox"
            checked={theme.gradient}
            onChange={(event) => set('gradient', event.target.checked)}
            className="size-4 cursor-pointer accent-primary"
          />
          배경에 포인트 컬러 그라데이션 사용
        </label>
        {lowContrastRoles.length > 0 ? (
          <p role="status" className="mt-2.5 text-[13px] leading-5 text-destructive">
            {lowContrastRoles.map(({ name }) => name).join(', ')} 색의 대비가 매우 낮아요. README에서 읽기 어려울 수 있어요.
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          모양
        </p>
        <RangeRow
          label="Border width"
          value={theme.borderWidth}
          min={0}
          max={6}
          suffix="px"
          onChange={(value) => set('borderWidth', value)}
        />
        <RangeRow
          label="Corner radius"
          value={theme.radius}
          min={0}
          max={28}
          suffix="px"
          onChange={(value) => set('radius', value)}
        />
      </section>
    </div>
  )
}

function RangeRow({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix: string
  onChange: (value: number) => void
}) {
  const id = `range-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="w-28 shrink-0 text-[13px] text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
      />
      <span className="w-12 shrink-0 text-right font-mono text-[12px] text-muted-foreground">
        {value}
        {suffix}
      </span>
    </div>
  )
}
