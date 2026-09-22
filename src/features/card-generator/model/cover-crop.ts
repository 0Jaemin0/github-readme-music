import type { CoverPosition } from '@/entities/music-card';

export const MIN_CROP_SCALE = 40;

export const clampCropValue = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

export const getCropFrame = (ratio: number, position: CoverPosition) => {
  const scale = clampCropValue(position.scale, MIN_CROP_SCALE, 100) / 100;
  const width = ratio >= 1 ? (scale / ratio) * 100 : scale * 100;
  const height = ratio >= 1 ? scale * 100 : scale * ratio * 100;

  return {
    width,
    height,
    left: (100 - width) * (position.x / 100),
    top: (100 - height) * (position.y / 100),
  };
};

export const toCropPosition = (offset: number, cropSize: number, frameSize: number) => {
  const availableSpace = frameSize - cropSize;
  return availableSpace > 0 ? clampCropValue((offset / availableSpace) * 100, 0, 100) : 50;
};
