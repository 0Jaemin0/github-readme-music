export function durationToSeconds(duration: string) {
  const parts = duration.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part) || part < 0)) return 0;

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3_600 + minutes * 60 + seconds;
  }

  const [minutes = 0, seconds = 0] = parts;
  return minutes * 60 + seconds;
}

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3_600);
  const minutes = Math.floor((safeSeconds % 3_600) / 60);
  const seconds = String(safeSeconds % 60).padStart(2, "0");

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}
