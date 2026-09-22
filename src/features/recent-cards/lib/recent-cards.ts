const RECENT_CARD_IDS_STORAGE_KEY = 'github-readme-music-recent-card-ids';
const MAX_RECENT_CARDS = 3;
const STORED_CARD_ID_PATTERN = /^c_[A-Za-z0-9_-]{16}$/;

export const readRecentCardIds = () => {
  try {
    const storedValue = window.localStorage.getItem(RECENT_CARD_IDS_STORAGE_KEY);
    if (!storedValue) return [];

    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return [];

    return [...new Set(parsedValue.filter(isStoredCardId))].slice(0, MAX_RECENT_CARDS);
  } catch {
    return [];
  }
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

const isStoredCardId = (value: unknown): value is string => {
  return typeof value === 'string' && STORED_CARD_ID_PATTERN.test(value);
};
