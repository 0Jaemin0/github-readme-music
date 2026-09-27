const METADATA_ERROR_KEYS = {
  INVALID_REQUEST: 'metadata.invalidLink',
  INVALID_URL: 'metadata.invalidLink',
  SERVER_CONFIGURATION_ERROR: 'metadata.configuration',
  VIDEO_NOT_FOUND: 'metadata.notFound',
  YOUTUBE_QUOTA_EXCEEDED: 'metadata.quota',
  RATE_LIMITED: 'common.rateLimited',
  REQUEST_TOO_LARGE: 'metadata.tooLarge',
  YOUTUBE_UNAVAILABLE: 'metadata.unavailable',
} as const;
const CARD_STORAGE_ERROR_KEYS = {
  INVALID_REQUEST: 'storage.invalid',
  REQUEST_TOO_LARGE: 'storage.tooLarge',
  RATE_LIMITED: 'common.rateLimited',
  CARD_STORAGE_UNAVAILABLE: 'storage.unavailable',
} as const;
const CARD_RESTORE_ERROR_KEYS = {
  INVALID_CARD_ID: 'restore.invalidId',
  CARD_NOT_FOUND: 'restore.notFound',
  CARD_DATA_INVALID: 'restore.invalidData',
  CARD_READ_UNAVAILABLE: 'restore.unavailable',
} as const;
const FALLBACK_ERROR_KEY = METADATA_ERROR_KEYS.YOUTUBE_UNAVAILABLE;

const getMetadataErrorKey = (code: string | undefined) => {
  if (code && Object.hasOwn(METADATA_ERROR_KEYS, code))
    return METADATA_ERROR_KEYS[code as keyof typeof METADATA_ERROR_KEYS];
  return FALLBACK_ERROR_KEY;
};

const getCardStorageErrorKey = (code: string | undefined) => {
  if (code && Object.hasOwn(CARD_STORAGE_ERROR_KEYS, code))
    return CARD_STORAGE_ERROR_KEYS[code as keyof typeof CARD_STORAGE_ERROR_KEYS];
  return CARD_STORAGE_ERROR_KEYS.CARD_STORAGE_UNAVAILABLE;
};

const getCardRestoreErrorKey = (code: string | undefined) => {
  if (code && Object.hasOwn(CARD_RESTORE_ERROR_KEYS, code))
    return CARD_RESTORE_ERROR_KEYS[code as keyof typeof CARD_RESTORE_ERROR_KEYS];
  return CARD_RESTORE_ERROR_KEYS.CARD_READ_UNAVAILABLE;
};

export type CardGeneratorErrorKey =
  | (typeof METADATA_ERROR_KEYS)[keyof typeof METADATA_ERROR_KEYS]
  | (typeof CARD_STORAGE_ERROR_KEYS)[keyof typeof CARD_STORAGE_ERROR_KEYS]
  | (typeof CARD_RESTORE_ERROR_KEYS)[keyof typeof CARD_RESTORE_ERROR_KEYS];

const errorKeys: ReadonlySet<string> = new Set([
  ...Object.values(METADATA_ERROR_KEYS),
  ...Object.values(CARD_STORAGE_ERROR_KEYS),
  ...Object.values(CARD_RESTORE_ERROR_KEYS),
]);

// Never display arbitrary exception messages or pass them to the translator.
export const getRequestErrorKey = (error: unknown, fallback: CardGeneratorErrorKey): CardGeneratorErrorKey =>
  error instanceof Error && errorKeys.has(error.message) ? (error.message as CardGeneratorErrorKey) : fallback;

export {
  CARD_RESTORE_ERROR_KEYS,
  CARD_STORAGE_ERROR_KEYS,
  FALLBACK_ERROR_KEY,
  getCardRestoreErrorKey,
  getCardStorageErrorKey,
  getMetadataErrorKey,
  METADATA_ERROR_KEYS,
};
