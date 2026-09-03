'use client'

import { ColorField } from './ColorField'
import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight, X } from 'lucide-react'
import { contrastRatio } from '../lib/color'
import type { CardTheme, GradientDirection } from '../model/types'

const GRADIENT_DIRECTIONS = [
  { value: 'top-left', label: '왼쪽 위', Icon: ArrowUpLeft },
  { value: 'top-right', label: '오른쪽 위', Icon: ArrowUpRight },
  { value: 'bottom-left', label: '왼쪽 아래', Icon: ArrowDownLeft },
  { value: 'bottom-right', label: '오른쪽 아래', Icon: ArrowDownRight },
] as const satisfies ReadonlyArray<{ value: Exclude<GradientDirection, null>; label: string; Icon: typeof ArrowUpLeft }>;

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

  function setGradientDirection(direction: GradientDirection) {
    onChange({ ...theme, gradient: direction !== null, gradientDirection: direction })
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
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[13px] text-muted-foreground">포인트 색 그라데이션</span>
          <div role="radiogroup" aria-label="그라데이션 방향" className="flex items-center gap-1.5">
            <button type="button" role="radio" aria-checked={!theme.gradient} aria-label="없음" onClick={() => setGradientDirection(null)} className={`flex size-8 cursor-pointer items-center justify-center rounded-md border transition-colors ${!theme.gradient ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`}><X className="size-4" /></button>
            {GRADIENT_DIRECTIONS.map(({ value, label, Icon }) => {
              const selected = theme.gradient && theme.gradientDirection === value
              return <button key={value} type="button" role="radio" aria-checked={selected} aria-label={label} onClick={() => setGradientDirection(value)} className={`flex size-8 cursor-pointer items-center justify-center rounded-md border transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`}><Icon className="size-4" /></button>
            })}
          </div>
        </div>
        {theme.gradient ? (
          <div className="mt-3">
            <RangeRow
              label="그라데이션 강도"
              value={theme.gradientIntensity}
              min={0}
              max={100}
              suffix="%"
              onChange={(value) => set('gradientIntensity', value)}
            />
          </div>
        ) : null}
        {theme.gradient ? <p className="mt-2 text-[12px] leading-5 text-muted-foreground">선택한 방향의 밝은 영역에서는 텍스트가 다르게 보일 수 있습니다.</p> : null}
        {lowContrastRoles.length > 0 ? (
          <p role="status" className="mt-2.5 text-[13px] leading-5 text-destructive">
            {lowContrastRoles.map(({ name }) => name).join(', ')} 색의 대비가 매우 낮습니다. README에서 읽기 어려울 수 있습니다.
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
