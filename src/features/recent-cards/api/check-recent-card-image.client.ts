type RecentCardImageCheck = { status: 'missing' } | { status: 'recovered'; image: Blob } | { status: 'failed' };

export const checkRecentCardImage = async (cardId: string): Promise<RecentCardImageCheck> => {
  try {
    const response = await fetch(`/card/${encodeURIComponent(cardId)}.svg`, { cache: 'no-store' });
    if (response.status === 404) return { status: 'missing' };

    if (response.ok && response.headers.get('content-type')?.startsWith('image/svg+xml')) {
      return { status: 'recovered', image: await response.blob() };
    }

    await response.body?.cancel();
  } catch {
    // A network failure does not mean the stored card is missing.
  }

  return { status: 'failed' };
};
