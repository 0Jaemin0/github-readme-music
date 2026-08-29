"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CardMeta, CoverPosition, Track } from "../model/types";

type CardMetadataFieldsProps = {
  meta: CardMeta;
  track: Track;
  onChange: (nextMeta: CardMeta) => void;
  onCoverPositionChange: (position: CoverPosition) => void;
};

export function CardMetadataFields({ meta, track, onChange, onCoverPositionChange }: CardMetadataFieldsProps) {
  function updateField(field: keyof CardMeta, value: string) {
    onChange({ ...meta, [field]: value });
  }

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="mb-4">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">콘텐츠</p>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">카드에 표시할 정보를 다듬어 보세요.</p>
        <p className="mt-2 text-[12px] leading-5 text-muted-foreground">YouTube 원본: {track.title} · {track.channel}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetadataField id="card-title" label="제목" value={meta.title} onChange={(value) => updateField("title", value)} />
        <MetadataField id="card-artist" label="아티스트" value={meta.artist} onChange={(value) => updateField("artist", value)} />
      </div>
      <p className="mt-2.5 text-[12px] leading-5 text-muted-foreground">아티스트는 업로드 채널명 기준이며, 필요하면 수정하세요.</p>
      <CoverCropEditor cover={track.cover} position={track.coverPosition} onPositionChange={onCoverPositionChange} />
    </section>
  );
}

function CoverCropEditor({ cover, position, onPositionChange }: { cover: string; position: CoverPosition; onPositionChange: (position: CoverPosition) => void }) {
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const [ratio, setRatio] = useState(16 / 9);
  const [isDragging, setIsDragging] = useState(false);
  const cropWidthPercent = ratio >= 1 ? 100 / ratio : 100;
  const cropHeightPercent = ratio >= 1 ? 100 : ratio * 100;
  const cropLeftPercent = ratio > 1 ? position.x * (1 - 1 / ratio) : 0;
  const cropTopPercent = ratio < 1 ? position.y * (1 - ratio) : 0;

  function updateCropPosition(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    const frame = imageFrameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const isOutsideFrame = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (isOutsideFrame) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      isDraggingRef.current = false;
      setIsDragging(false);
      return;
    }
    const cropWidth = rect.width * (cropWidthPercent / 100);
    const cropHeight = rect.height * (cropHeightPercent / 100);
    const left = clamp(event.clientX - rect.left - dragOffsetRef.current.x, 0, rect.width - cropWidth);
    const top = clamp(event.clientY - rect.top - dragOffsetRef.current.y, 0, rect.height - cropHeight);

    onPositionChange({
      x: ratio > 1 ? (left / (rect.width - cropWidth)) * 100 : 50,
      y: ratio < 1 ? (top / (rect.height - cropHeight)) * 100 : 50,
    });
  }

  return (
    <div className="mt-5">
      <p className="mb-1.5 text-[13px] font-medium text-muted-foreground">앨범 커버</p>
      <p className="text-[12px] leading-5 text-muted-foreground">YouTube 썸네일을 기본으로 사용해요. 정사각형 프레임을 드래그해 카드에 보일 영역을 조절하세요.</p>
      <div className="mt-3">
        <div ref={imageFrameRef} className="relative w-full max-w-md overflow-hidden rounded-lg bg-muted" style={{ aspectRatio: ratio }}>
          {/* YouTube thumbnails are external URLs, so this editor intentionally uses a plain image element. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt="앨범 커버 영역 선택"
            className="size-full object-contain"
            onLoad={(event) => setRatio(event.currentTarget.naturalWidth / event.currentTarget.naturalHeight)}
          />
          <div
            role="presentation"
            onPointerDown={(event) => {
              const cropRect = event.currentTarget.getBoundingClientRect();
              dragOffsetRef.current = { x: event.clientX - cropRect.left, y: event.clientY - cropRect.top };
              event.currentTarget.setPointerCapture(event.pointerId);
              isDraggingRef.current = true;
              setIsDragging(true);
            }}
            onPointerMove={updateCropPosition}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
              isDraggingRef.current = false;
              setIsDragging(false);
            }}
            onPointerCancel={() => {
              isDraggingRef.current = false;
              setIsDragging(false);
            }}
            className={cn("absolute border-2 border-white shadow-[0_0_0_999px_rgb(0_0_0_/_0.35)]", isDragging ? "cursor-grabbing" : "cursor-grab")}
            style={{ width: `${cropWidthPercent}%`, height: `${cropHeightPercent}%`, left: `${cropLeftPercent}%`, top: `${cropTopPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MetadataField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div><label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-muted-foreground">{label}</label><Input id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg text-sm md:text-sm" /></div>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
