'use client';

import { useCallback, useEffect, useState } from 'react';
import { readRecentCardIds, removeRecentCardId, saveRecentCardId } from '../lib/recent-cards';

export const useRecentCards = () => {
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

  const removeCardId = useCallback((cardId: string) => {
    removeRecentCardId(cardId);
    setCardIds((current) => current.filter((id) => id !== cardId));
  }, []);

  return { cardIds, isLoaded, addCardId, removeCardId };
};
