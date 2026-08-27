import { Input } from "@/components/ui/input";
import type { CardMeta, Track } from "../model/types";

type CardMetadataFieldsProps = {
  meta: CardMeta;
  track: Track;
  onChange: (nextMeta: CardMeta) => void;
};

export function CardMetadataFields({ meta, track, onChange }: CardMetadataFieldsProps) {
  function updateField(field: keyof CardMeta, value: string) {
    onChange({ ...meta, [field]: value });
  }

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="mb-4">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">콘텐츠</p>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">카드에 표시할 정보를 다듬어보세요.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetadataField id="card-title" label="제목" value={meta.title} onChange={(value) => updateField("title", value)} />
        <MetadataField id="card-artist" label="아티스트" value={meta.artist} onChange={(value) => updateField("artist", value)} />
      </div>
      <p className="mt-2.5 text-[13px] leading-5 text-muted-foreground">
        YouTube 원본: {track.title} · {track.channel}
      </p>
    </section>
  );
}

function MetadataField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-muted-foreground">
        {label}
      </label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg text-sm md:text-sm"
      />
    </div>
  );
}
