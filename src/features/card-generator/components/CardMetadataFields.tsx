"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CardMeta, CoverPosition, Track } from "../model/types";

const MIN_CROP_SCALE = 40;
const MAX_META_LENGTH = 120;

type CardMetadataFieldsProps = {
  meta: CardMeta;
  track: Track;
  onChange: (nextMeta: CardMeta) => void;
  onCoverPositionChange: (position: CoverPosition) => void;
};

type DragMode = "move" | "resize" | null;

export function CardMetadataFields({ meta, track, onChange, onCoverPositionChange }: CardMetadataFieldsProps) {
  function updateField(field: keyof CardMeta, value: string) {
    onChange({ ...meta, [field]: value });
  }

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="mb-4">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">콘텐츠</p>
        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">카드에 표시할 정보를 확인하고, 필요한 부분을 수정해 주세요.</p>
        <p className="mt-2 text-[12px] leading-5 text-muted-foreground">YouTube에서 가져온 정보: {track.title} · {track.channel}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetadataField id="card-title" label="제목" value={meta.title} onChange={(value) => updateField("title", value)} />
        <MetadataField id="card-artist" label="아티스트" value={meta.artist} onChange={(value) => updateField("artist", value)} />
      </div>
      <p className="mt-2.5 text-[12px] leading-5 text-muted-foreground">아티스트는 업로드 채널명을 기준으로 입력됩니다. 필요한 경우 수정해 주세요.</p>
      <CoverCropEditor cover={track.cover} position={track.coverPosition} onPositionChange={onCoverPositionChange} />
    </section>
  );
}

function CoverCropEditor({ cover, position, onPositionChange }: { cover: string; position: CoverPosition; onPositionChange: (position: CoverPosition) => void }) {
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, side: 0, left: 0, top: 0 });
  const dragModeRef = useRef<DragMode>(null);
  const [ratio, setRatio] = useState(position.aspectRatio);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const crop = getCropFrame(ratio, position);

  function stopAdjusting(event?: ReactPointerEvent<HTMLDivElement>) {
    if (event && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragModeRef.current = null;
    setDragMode(null);
  }

  function startMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const cropRect = cropFrameRef.current?.getBoundingClientRect();
    const frame = imageFrameRef.current;
    if (!cropRect || !frame) return;

    dragOffsetRef.current = { x: event.clientX - cropRect.left, y: event.clientY - cropRect.top };
    frame.setPointerCapture(event.pointerId);
    dragModeRef.current = "move";
    setDragMode("move");
  }

  function startResize(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const cropRect = cropFrameRef.current?.getBoundingClientRect();
    const frame = imageFrameRef.current;
    if (!cropRect || !frame) return;

    resizeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      side: cropRect.width,
      left: cropRect.left,
      top: cropRect.top,
    };
    frame.setPointerCapture(event.pointerId);
    dragModeRef.current = "resize";
    setDragMode("resize");
  }

  function updateCrop(event: ReactPointerEvent<HTMLDivElement>) {
    const mode = dragModeRef.current;
    const frame = imageFrameRef.current;
    if (!mode || !frame) return;

    const rect = frame.getBoundingClientRect();
    if (mode === "move" && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) {
      stopAdjusting(event);
      return;
    }

    if (mode === "resize") {
      const maxSide = Math.min(rect.right - resizeStartRef.current.left, rect.bottom - resizeStartRef.current.top);
      const delta = Math.min(event.clientX - resizeStartRef.current.x, event.clientY - resizeStartRef.current.y);
      const requestedSide = resizeStartRef.current.side + delta;
      const minimumSide = Math.min((Math.min(rect.width, rect.height) * MIN_CROP_SCALE) / 100, maxSide);
      const side = clamp(requestedSide, minimumSide, maxSide);
      const scale = clamp((side / Math.min(rect.width, rect.height)) * 100, MIN_CROP_SCALE, 100);
      const nextCrop = getCropFrame(ratio, { ...position, scale });
      const left = resizeStartRef.current.left - rect.left;
      const top = resizeStartRef.current.top - rect.top;

      onPositionChange({
        ...position,
        scale,
        x: toPosition(left, rect.width * (nextCrop.width / 100), rect.width),
        y: toPosition(top, rect.height * (nextCrop.height / 100), rect.height),
      });
      return;
    }

    const cropWidth = rect.width * (crop.width / 100);
    const cropHeight = rect.height * (crop.height / 100);
    const left = clamp(event.clientX - rect.left - dragOffsetRef.current.x, 0, rect.width - cropWidth);
    const top = clamp(event.clientY - rect.top - dragOffsetRef.current.y, 0, rect.height - cropHeight);

    onPositionChange({
      ...position,
      x: toPosition(left, cropWidth, rect.width),
      y: toPosition(top, cropHeight, rect.height),
    });
  }

  return (
    <div className="mt-5">
      <p className="mb-1.5 text-[13px] font-medium text-muted-foreground">앨범 커버</p>
      <p className="text-[12px] leading-5 text-muted-foreground">정사각형 프레임을 드래그하여 위치를 옮기고, 오른쪽 아래 핸들을 드래그하여 크기를 조절해 주세요.</p>
      <div className="mt-3">
        <div
          ref={imageFrameRef}
          className="relative w-full max-w-md touch-none select-none overflow-hidden rounded-lg bg-muted"
          style={{ aspectRatio: ratio }}
          onPointerMove={updateCrop}
          onPointerUp={stopAdjusting}
          onPointerCancel={stopAdjusting}
          onLostPointerCapture={stopAdjusting}
        >
          {/* YouTube thumbnails are external URLs, so this editor intentionally uses a plain image element. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt="앨범 커버 영역 선택"
            draggable={false}
            className="size-full select-none object-contain"
            onLoad={(event) => {
              const nextRatio = event.currentTarget.naturalWidth / event.currentTarget.naturalHeight;
              setRatio(nextRatio);
              if (Math.abs(nextRatio - position.aspectRatio) > 0.001) onPositionChange({ ...position, aspectRatio: nextRatio });
            }}
          />
          <div
            ref={cropFrameRef}
            role="presentation"
            onPointerDown={startMove}
            className={cn(
              "absolute select-none border-2 border-white shadow-[0_0_0_999px_rgb(0_0_0_/_0.35)]",
              dragMode === "resize" ? "cursor-se-resize" : dragMode === "move" ? "cursor-grabbing" : "cursor-grab",
            )}
            style={{ width: crop.width + "%", height: crop.height + "%", left: crop.left + "%", top: crop.top + "%" }}
          >
            <button
              type="button"
              aria-label="크롭 프레임 크기 조절"
              onPointerDown={startResize}
              className="absolute bottom-1 right-1 size-6 cursor-se-resize rounded-sm border-2 border-background bg-primary shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function getCropFrame(ratio: number, position: CoverPosition) {
  const scale = clamp(position.scale, MIN_CROP_SCALE, 100) / 100;
  const width = ratio >= 1 ? (scale / ratio) * 100 : scale * 100;
  const height = ratio >= 1 ? scale * 100 : scale * ratio * 100;

  return {
    width,
    height,
    left: (100 - width) * (position.x / 100),
    top: (100 - height) * (position.y / 100),
  };
}

function toPosition(offset: number, cropSize: number, frameSize: number) {
  const availableSpace = frameSize - cropSize;
  return availableSpace > 0 ? clamp((offset / availableSpace) * 100, 0, 100) : 50;
}

function MetadataField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div><label htmlFor={id} className="mb-1.5 flex justify-between text-[13px] font-medium text-muted-foreground"><span>{label}</span><span className="font-normal">{value.length}/{MAX_META_LENGTH}</span></label><Input id={id} value={value} maxLength={MAX_META_LENGTH} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg text-sm md:text-sm" /></div>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
