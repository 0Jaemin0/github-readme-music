'use client';

import { useState } from 'react';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { normalizeHex } from '@/entities/music-card';
import { ColorPicker } from './ColorPicker';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

export const ColorField = ({ label, value, onChange }: ColorFieldProps) => {
  const [draft, setDraft] = useState(value);

  const commitDraft = (next: string) => {
    setDraft(next);
    const normalized = normalizeHex(next);
    if (normalized) onChange(normalized);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1 pr-2">
        <Popover>
          <PopoverTrigger
            aria-label={`${label} 색 선택`}
            className="size-6 shrink-0 cursor-pointer rounded-md border border-border/80 ring-offset-background transition-shadow hover:ring-2 hover:ring-ring/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ backgroundColor: value }}
          />
          <PopoverContent align="end" className="w-64 p-3">
            <ColorPicker
              value={value}
              onChange={(next) => {
                setDraft(next);
                onChange(next);
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
  );
};
