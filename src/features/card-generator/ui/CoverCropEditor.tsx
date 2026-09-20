'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { CoverPosition } from '@/entities/music-card';
import { cn } from '@/shared/lib/utils';
import { clampCropValue, getCropFrame, MIN_CROP_SCALE, toCropPosition } from '../model/cover-crop';

type DragMode = 'move' | 'resize' | null;

type CoverCropEditorProps = {
  cover: string;
  position: CoverPosition;
  onPositionChange: (position: CoverPosition) => void;
};

export const CoverCropEditor = ({ cover, position, onPositionChange }: CoverCropEditorProps) => {
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const cropFrameRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, side: 0, left: 0, top: 0 });
  const dragModeRef = useRef<DragMode>(null);
  const [ratio, setRatio] = useState(position.aspectRatio);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const crop = getCropFrame(ratio, position);

  const stopAdjusting = (event?: ReactPointerEvent<HTMLDivElement>) => {
    if (event && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragModeRef.current = null;
    setDragMode(null);
  };

  const startMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    const cropRect = cropFrameRef.current?.getBoundingClientRect();
    const frame = imageFrameRef.current;
    if (!cropRect || !frame) return;

    dragOffsetRef.current = { x: event.clientX - cropRect.left, y: event.clientY - cropRect.top };
    frame.setPointerCapture(event.pointerId);
    dragModeRef.current = 'move';
    setDragMode('move');
  };

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
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
    dragModeRef.current = 'resize';
    setDragMode('resize');
  };

  const updateCrop = (event: ReactPointerEvent<HTMLDivElement>) => {
    const mode = dragModeRef.current;
    const frame = imageFrameRef.current;
    if (!mode || !frame) return;

    const rect = frame.getBoundingClientRect();
    if (
      mode === 'move' &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    ) {
      stopAdjusting(event);
      return;
    }

    if (mode === 'resize') {
      const maxSide = Math.min(rect.right - resizeStartRef.current.left, rect.bottom - resizeStartRef.current.top);
      const delta = Math.min(event.clientX - resizeStartRef.current.x, event.clientY - resizeStartRef.current.y);
      const requestedSide = resizeStartRef.current.side + delta;
      const minimumSide = Math.min((Math.min(rect.width, rect.height) * MIN_CROP_SCALE) / 100, maxSide);
      const side = clampCropValue(requestedSide, minimumSide, maxSide);
      const scale = clampCropValue((side / Math.min(rect.width, rect.height)) * 100, MIN_CROP_SCALE, 100);
      const nextCrop = getCropFrame(ratio, { ...position, scale });
      const left = resizeStartRef.current.left - rect.left;
      const top = resizeStartRef.current.top - rect.top;

      onPositionChange({
        ...position,
        scale,
        x: toCropPosition(left, rect.width * (nextCrop.width / 100), rect.width),
        y: toCropPosition(top, rect.height * (nextCrop.height / 100), rect.height),
      });
      return;
    }

    const cropWidth = rect.width * (crop.width / 100);
    const cropHeight = rect.height * (crop.height / 100);
    const left = clampCropValue(event.clientX - rect.left - dragOffsetRef.current.x, 0, rect.width - cropWidth);
    const top = clampCropValue(event.clientY - rect.top - dragOffsetRef.current.y, 0, rect.height - cropHeight);

    onPositionChange({
      ...position,
      x: toCropPosition(left, cropWidth, rect.width),
      y: toCropPosition(top, cropHeight, rect.height),
    });
  };

  return (
    <div className="mt-5">
      <p className="mb-1.5 text-[13px] font-medium text-muted-foreground">앨범 커버</p>
      <p className="text-[12px] leading-5 text-muted-foreground">
        정사각형 프레임을 드래그하여 위치를 옮기고, 오른쪽 아래 모서리를 드래그하여 크기를 조절해 주세요.
      </p>
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
              if (Math.abs(nextRatio - position.aspectRatio) > 0.001) {
                onPositionChange({ ...position, aspectRatio: nextRatio });
              }
            }}
          />
          <div
            ref={cropFrameRef}
            role="presentation"
            onPointerDown={startMove}
            className={cn(
              'absolute select-none border-2 border-white shadow-[0_0_0_999px_rgb(0_0_0_/_0.35)]',
              dragMode === 'resize' ? 'cursor-se-resize' : dragMode === 'move' ? 'cursor-grabbing' : 'cursor-grab',
            )}
            style={{ width: `${crop.width}%`, height: `${crop.height}%`, left: `${crop.left}%`, top: `${crop.top}%` }}
          >
            <button
              type="button"
              aria-label="앨범 프레임 크기 조절"
              onPointerDown={startResize}
              className="absolute bottom-1 right-1 size-6 cursor-se-resize rounded-sm border-2 border-background bg-primary shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
