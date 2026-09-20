export const getStorageFailureCount = (
  failedSnapshot: string | null,
  storageFailureCount: number,
  snapshotKey: string,
) => {
  return failedSnapshot === snapshotKey ? storageFailureCount + 1 : 1;
};

export const shouldUseCompatibilityFallback = (failureCount: number) => {
  return failureCount % 5 === 0;
};
