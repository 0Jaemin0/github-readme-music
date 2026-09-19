'use client';

import { useCallback, useEffect, useState } from 'react';
import { readRecentCardIds, saveRecentCardId } from '../lib/recent-cards';

export function useRecentCards() {
  const [cardIds, setCardIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCardIds(readRecentCardIds());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const addCardId = useCallback((cardId: string) => {
    setCardIds(saveRecentCardId(cardId));
  }, []);

  return { cardIds, isLoaded, addCardId };
}
