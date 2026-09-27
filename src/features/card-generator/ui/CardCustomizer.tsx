'use client';

import { ColorField } from './ColorField';
import { useTranslations } from 'next-intl';
import { ArrowDownLeft, ArrowDownRight, ArrowUpLeft, ArrowUpRight, X } from 'lucide-react';
import { contrastRatio, type CardTheme, type GradientDirection } from '@/entities/music-card';

const GRADIENT_DIRECTIONS = [
  { value: 'top-left', label: 'gradient.topLeft', Icon: ArrowUpLeft },
  { value: 'top-right', label: 'gradient.topRight', Icon: ArrowUpRight },
  { value: 'bottom-left', label: 'gradient.bottomLeft', Icon: ArrowDownLeft },
  { value: 'bottom-right', label: 'gradient.bottomRight', Icon: ArrowDownRight },
] as const satisfies ReadonlyArray<{
  value: Exclude<GradientDirection, null>;
  label: string;
  Icon: typeof ArrowUpLeft;
}>;

interface CardCustomizerProps {
  theme: CardTheme;
  onChange: (theme: CardTheme) => void;
}

export const CardCustomizer = ({ theme, onChange }: CardCustomizerProps) => {
  const t = useTranslations('CardEditor.style');
  const lowContrastRoles = [
    { name: t('title'), color: theme.text },
    { name: t('artist'), color: theme.muted },
    { name: t('accent'), color: theme.accent },
  ].filter(({ color }) => contrastRatio(theme.background, color) < 1.8);

  const set = <K extends keyof CardTheme>(key: K, value: CardTheme[K]) => {
    onChange({ ...theme, [key]: value });
  };

  const setGradientDirection = (direction: GradientDirection) => {
    onChange({ ...theme, gradient: direction !== null, gradientDirection: direction });
  };

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="text-[13px] font-medium text-muted-foreground">{t('colors')}</p>
        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 sm:gap-x-8">
          <ColorField label={t('background')} value={theme.background} onChange={(v) => set('background', v)} />
          <ColorField label={t('border')} value={theme.border} onChange={(v) => set('border', v)} />
          <ColorField label={t('title')} value={theme.text} onChange={(v) => set('text', v)} />
          <ColorField label={t('artist')} value={theme.muted} onChange={(v) => set('muted', v)} />
          <ColorField label={t('accent')} value={theme.accent} onChange={(v) => set('accent', v)} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[13px] text-muted-foreground">{t('gradient.label')}</span>
          <div role="radiogroup" aria-label={t('gradient.direction')} className="flex items-center gap-1.5">
            <button
              type="button"
              role="radio"
              aria-checked={!theme.gradient}
              aria-label={t('gradient.none')}
              onClick={() => setGradientDirection(null)}
              className={`flex size-8 cursor-pointer items-center justify-center rounded-md border transition-colors ${!theme.gradient ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`}
            >
              <X className="size-4" />
            </button>
            {GRADIENT_DIRECTIONS.map(({ value, label, Icon }) => {
              const selected = theme.gradient && theme.gradientDirection === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={t(label)}
                  onClick={() => setGradientDirection(value)}
                  className={`flex size-8 cursor-pointer items-center justify-center rounded-md border transition-colors ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
          </div>
        </div>
        {theme.gradient ? (
          <div className="mt-3">
            <RangeRow
              id="range-gradient-intensity"
              label={t('gradient.intensity')}
              value={theme.gradientIntensity}
              min={0}
              max={100}
              suffix="%"
              onChange={(value) => set('gradientIntensity', value)}
            />
          </div>
        ) : null}
        {theme.gradient ? (
          <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{t('gradient.hint')}</p>
        ) : null}
        {lowContrastRoles.length > 0 ? (
          <p role="status" className="mt-2.5 text-[13px] leading-5 text-destructive">
            {t('contrastWarning', { roles: lowContrastRoles.map(({ name }) => name).join(', ') })}
          </p>
        ) : null}
      </section>

      <section>
        <p className="text-[13px] font-medium text-muted-foreground">{t('shape')}</p>
        <div className="mt-3 flex flex-col gap-4">
          <RangeRow
            id="range-border-width"
            label={t('borderWidth')}
            value={theme.borderWidth}
            min={0}
            max={6}
            suffix="px"
            onChange={(value) => set('borderWidth', value)}
          />
          <RangeRow
            id="range-corner-radius"
            label={t('cornerRadius')}
            value={theme.radius}
            min={0}
            max={28}
            suffix="px"
            onChange={(value) => set('radius', value)}
          />
        </div>
      </section>
    </div>
  );
};

interface RangeRowProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}

const RangeRow = ({ id, label, value, min, max, suffix, onChange }: RangeRowProps) => {
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
  );
};
