'use client';

import { Input } from '@/shared/ui/input';
import type { CardMeta, CoverPosition, Track } from '@/entities/music-card';
import { CoverCropEditor } from './CoverCropEditor';

const MAX_META_LENGTH = 120;

type CardMetadataFieldsProps = {
  meta: CardMeta;
  track: Track;
  onChange: (nextMeta: CardMeta) => void;
  onCoverPositionChange: (position: CoverPosition) => void;
};

export const CardMetadataFields = ({ meta, track, onChange, onCoverPositionChange }: CardMetadataFieldsProps) => {
  const updateField = (field: keyof CardMeta, value: string) => {
    onChange({ ...meta, [field]: value });
  };

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="mb-4">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">콘텐츠</p>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
          카드에 표시할 정보를 확인하고, 필요한 부분을 수정해 주세요.
        </p>
        <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
          {track.source === 'youtube'
            ? `YouTube에서 가져온 정보: ${track.title} · ${track.channel}`
            : `저장된 카드 정보: ${meta.title} · ${meta.artist}`}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetadataField
          id="card-title"
          label="제목"
          value={meta.title}
          onChange={(value) => updateField('title', value)}
        />
        <MetadataField
          id="card-artist"
          label="아티스트"
          value={meta.artist}
          onChange={(value) => updateField('artist', value)}
        />
      </div>
      {track.source === 'youtube' ? (
        <p className="mt-2.5 text-[12px] leading-5 text-muted-foreground">
          아티스트는 업로드 채널명을 기준으로 입력됩니다. 필요한 경우 수정해 주세요.
        </p>
      ) : null}
      <CoverCropEditor cover={track.cover} position={track.coverPosition} onPositionChange={onCoverPositionChange} />
    </section>
  );
};

const MetadataField = ({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => {
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
