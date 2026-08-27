'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { clamp, hexToHsv, hsvToHex, normalizeHex, type Hsv } from '../lib/color'
import { cn } from '@/lib/utils'

const PALETTE = [
  '#0d1117',
  '#161b22',
  '#21262d',
  '#30363d',
  '#8b949e',
  '#e6edf3',
  '#ffffff',
  '#f5b544',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#3b82f6',
  '#22d3ee',
  '#10b981',
  '#a3e635',
]

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (hex: string) => void
}) {
  const [draft, setDraft] = useState(value)

  function commitDraft(next: string) {
    setDraft(next)
    const normalized = normalizeHex(next)
    if (normalized) onChange(normalized)
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1 pr-2">
        <Popover>
          <PopoverTrigger
            aria-label={`${label} 색 선택`}
            className="size-6 shrink-0 rounded-md border border-border/80 ring-offset-background transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ backgroundColor: value }}
          />
          <PopoverContent align="end" className="w-64 p-3">
            <ColorPicker
              value={value}
              onChange={(next) => {
                setDraft(next)
                onChange(next)
              }}
            />
          </PopoverContent>
        </Popover>
        <Input
          value={draft}
          onChange={(event) => commitDraft(event.target.value)}
          onBlur={() => setDraft(value)}
          spellCheck={false}
          aria-label={`${label} 색상 코드`}
          className="h-6 w-20 border-0 bg-transparent px-0 font-mono text-[12px] uppercase shadow-none focus-visible:ring-0 md:text-[12px] dark:bg-transparent"
        />
      </div>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value))
  const areaRef = useRef<HTMLDivElement>(null)

  function update(next: Hsv) {
    setHsv(next)
    onChange(hsvToHex(next))
  }

  function handleArea(event: React.PointerEvent<HTMLDivElement>) {
    const node = areaRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    update({
      ...hsv,
      s: clamp((event.clientX - rect.left) / rect.width),
      v: 1 - clamp((event.clientY - rect.top) / rect.height),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={areaRef}
        role="presentation"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          handleArea(event)
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) handleArea(event)
        }}
        className="relative h-32 w-full cursor-crosshair touch-none rounded-lg border border-border"
        style={{
          backgroundImage:
            'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
          backgroundColor: hsvToHex({ h: hsv.h, s: 1, v: 1 }),
        }}
      >
        <span
          className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md shadow-black/50"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
        />
      </div>

      <label className="sr-only" htmlFor="hue-slider">
        색조
      </label>
      <input
        id="hue-slider"
        type="range"
        min={0}
        max={360}
        value={Math.round(hsv.h)}
        onChange={(event) => update({ ...hsv, h: Number(event.target.value) })}
        className="h-3 w-full cursor-pointer appearance-none rounded-full border border-border [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow-md"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
        }}
      />

      <div className="grid grid-cols-8 gap-1.5">
        {PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => {
              setHsv(hexToHsv(swatch))
              onChange(swatch)
            }}
            aria-label={swatch}
            className={cn(
              'size-5 rounded-md border transition-transform hover:scale-110',
              swatch === value ? 'border-primary' : 'border-border/70',
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
    </div>
  )
}
