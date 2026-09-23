const COMPATIBILITY_FALLBACK_INTERVAL = 3;

export const getStorageFailureCount = (
  failedSnapshot: string | null,
  storageFailureCount: number,
  snapshotKey: string,
) => {
  return failedSnapshot === snapshotKey ? storageFailureCount + 1 : 1;
};

export const shouldUseCompatibilityFallback = (failureCount: number) => {
  return failureCount % COMPATIBILITY_FALLBACK_INTERVAL === 0;
};
