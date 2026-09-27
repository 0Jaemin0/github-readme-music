'use client';

import { Input } from '@/shared/ui/input';
import { useTranslations } from 'next-intl';
import type { CardMeta, CoverPosition, Track } from '@/entities/music-card';
import { CoverCropEditor } from './CoverCropEditor';

const MAX_META_LENGTH = 120;

interface CardMetadataFieldsProps {
  meta: CardMeta;
  track: Track;
  onChange: (nextMeta: CardMeta) => void;
  onCoverPositionChange: (position: CoverPosition) => void;
}

export const CardMetadataFields = ({ meta, track, onChange, onCoverPositionChange }: CardMetadataFieldsProps) => {
  const t = useTranslations('CardEditor.content');
  const updateField = (field: keyof CardMeta, value: string) => {
    onChange({ ...meta, [field]: value });
  };

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="mb-4">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t('heading')}
        </p>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{t('description')}</p>
        <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
          {track.source === 'youtube'
            ? t('youtubeInfo', { title: track.title, artist: track.channel })
            : t('storedInfo', { title: meta.title, artist: meta.artist })}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetadataField
          id="card-title"
          label={t('title')}
          value={meta.title}
          onChange={(value) => updateField('title', value)}
        />
        <MetadataField
          id="card-artist"
          label={t('artist')}
          value={meta.artist}
          onChange={(value) => updateField('artist', value)}
        />
      </div>
      {track.source === 'youtube' ? (
        <p className="mt-2.5 text-[12px] leading-5 text-muted-foreground">{t('artistHint')}</p>
      ) : null}
      <CoverCropEditor cover={track.cover} position={track.coverPosition} onPositionChange={onCoverPositionChange} />
    </section>
  );
};

interface MetadataFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const MetadataField = ({ id, label, value, onChange }: MetadataFieldProps) => {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex justify-between text-[13px] font-medium text-muted-foreground">
        <span>{label}</span>
        <span className="font-normal">
          {value.length}/{MAX_META_LENGTH}
        </span>
      </label>
      <Input
        id={id}
        value={value}
        maxLength={MAX_META_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg text-sm md:text-sm"
      />
    </div>
  );
};
