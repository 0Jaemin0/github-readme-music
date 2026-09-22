const METADATA_ERROR_MESSAGES = {
  INVALID_REQUEST: 'YouTube 영상 링크를 확인해 주세요.',
  INVALID_URL: 'YouTube 영상 링크를 확인해 주세요.',
  SERVER_CONFIGURATION_ERROR: '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  VIDEO_NOT_FOUND: '영상을 찾을 수 없거나 해당 영상은 카드에 사용할 수 없습니다.',
  YOUTUBE_QUOTA_EXCEEDED: '현재 요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  RATE_LIMITED: '요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  REQUEST_TOO_LARGE: '요청 내용이 너무 큽니다. YouTube 링크만 입력해 주세요.',
  YOUTUBE_UNAVAILABLE: '영상 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
} as const;
const CARD_STORAGE_ERROR_MESSAGES = {
  INVALID_REQUEST: '카드 설정을 확인할 수 없습니다. 다시 시도해 주세요.',
  REQUEST_TOO_LARGE: '카드 설정 내용이 너무 큽니다. 다시 시도해 주세요.',
  RATE_LIMITED: '요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  CARD_STORAGE_UNAVAILABLE: '카드를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
} as const;
const CARD_RESTORE_ERROR_MESSAGES = {
  INVALID_CARD_ID: '카드 요청이 올바르지 않습니다.',
  CARD_NOT_FOUND: '카드를 찾을 수 없어요. 최근 생성 카드가 삭제되었을 수 있습니다.',
  CARD_DATA_INVALID: '카드 설정을 처리할 수 없습니다.',
  CARD_READ_UNAVAILABLE: '카드 설정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
} as const;
const FALLBACK_ERROR_MESSAGE = METADATA_ERROR_MESSAGES.YOUTUBE_UNAVAILABLE;

const getMetadataErrorMessage = (code: string | undefined) => {
  if (code && code in METADATA_ERROR_MESSAGES)
    return METADATA_ERROR_MESSAGES[code as keyof typeof METADATA_ERROR_MESSAGES];
  return FALLBACK_ERROR_MESSAGE;
};

const getCardStorageErrorMessage = (code: string | undefined) => {
  if (code && code in CARD_STORAGE_ERROR_MESSAGES)
    return CARD_STORAGE_ERROR_MESSAGES[code as keyof typeof CARD_STORAGE_ERROR_MESSAGES];
  return CARD_STORAGE_ERROR_MESSAGES.CARD_STORAGE_UNAVAILABLE;
};

const getCardRestoreErrorMessage = (code: string | undefined) => {
  if (code && code in CARD_RESTORE_ERROR_MESSAGES)
    return CARD_RESTORE_ERROR_MESSAGES[code as keyof typeof CARD_RESTORE_ERROR_MESSAGES];
  return CARD_RESTORE_ERROR_MESSAGES.CARD_READ_UNAVAILABLE;
};

export {
  CARD_RESTORE_ERROR_MESSAGES,
  CARD_STORAGE_ERROR_MESSAGES,
  FALLBACK_ERROR_MESSAGE,
  getCardRestoreErrorMessage,
  getCardStorageErrorMessage,
  getMetadataErrorMessage,
  METADATA_ERROR_MESSAGES,
};
