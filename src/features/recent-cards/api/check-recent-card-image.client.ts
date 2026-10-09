export const isRecentCardImageMissing = async (cardId: string) => {
  try {
    const response = await fetch(`/card/${encodeURIComponent(cardId)}.svg`, { cache: 'no-store' });
    if (response.status === 404) return true;

    await response.body?.cancel();
  } catch {
    // A network failure does not mean the stored card is missing.
  }

  return false;
};
