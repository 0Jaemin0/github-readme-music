const RECENT_CARD_IDS_STORAGE_KEY = 'github-readme-music-recent-card-ids';
const MAX_RECENT_CARDS = 3;
const STORED_CARD_ID_PATTERN = /^c_[A-Za-z0-9_-]{16}$/;

export const readRecentCardIds = () => {
  let storedValue: string | null;
  try {
    storedValue = window.localStorage.getItem(RECENT_CARD_IDS_STORAGE_KEY);
  } catch {
    return [];
  }
  if (storedValue === null) return [];

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(storedValue);
  } catch {
    parsedValue = [];
  }

  const cardIds = Array.isArray(parsedValue)
    ? [...new Set(parsedValue.filter(isStoredCardId))].slice(0, MAX_RECENT_CARDS)
    : [];
  const normalizedValue = JSON.stringify(cardIds);

  if (storedValue !== normalizedValue) {
    try {
      window.localStorage.setItem(RECENT_CARD_IDS_STORAGE_KEY, normalizedValue);
    } catch {
      // A blocked write should not prevent valid cards from appearing in this session.
    }
  }

  return cardIds;
};

export const saveRecentCardId = (cardId: string) => {
  if (!isStoredCardId(cardId)) return [];

  const nextCardIds = [cardId, ...readRecentCardIds().filter((id) => id !== cardId)].slice(0, MAX_RECENT_CARDS);

  try {
    window.localStorage.setItem(RECENT_CARD_IDS_STORAGE_KEY, JSON.stringify(nextCardIds));
  } catch {
    // Browsers can block localStorage. The current session can still show the new card.
  }

  return nextCardIds;
};

export const removeRecentCardId = (cardId: string) => {
  if (!isStoredCardId(cardId)) return;

  const nextCardIds = readRecentCardIds().filter((id) => id !== cardId);

  try {
    window.localStorage.setItem(RECENT_CARD_IDS_STORAGE_KEY, JSON.stringify(nextCardIds));
  } catch {
    // The current session can still hide the missing card if storage is unavailable.
  }
};

const isStoredCardId = (value: unknown): value is string => {
  return typeof value === 'string' && STORED_CARD_ID_PATTERN.test(value);
};
