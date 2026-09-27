'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useCardGenerator } from '@/features/card-generator';
import { useRecentCards } from '@/features/recent-cards';

interface CardGeneratorContextValue {
  cardGenerator: ReturnType<typeof useCardGenerator>;
  recentCards: ReturnType<typeof useRecentCards>;
  isLanding: boolean;
  isBusy: boolean;
  resetEditor: () => void;
}

const CardGeneratorContext = createContext<CardGeneratorContextValue | null>(null);

interface CardGeneratorProviderProps {
  children: ReactNode;
}

interface CardEditingSessionProps extends CardGeneratorProviderProps {
  resetEditor: () => void;
}

const CardEditingSession = ({ children, resetEditor }: CardEditingSessionProps) => {
  const recentCards = useRecentCards();
  const cardGenerator = useCardGenerator({ onStoredCardCreated: recentCards.addCardId });
  const isLanding = !cardGenerator.track && cardGenerator.status === 'idle';
  const isBusy = cardGenerator.status === 'loading' || cardGenerator.saveStatus === 'saving';

  return (
    <CardGeneratorContext.Provider value={{ cardGenerator, recentCards, isLanding, isBusy, resetEditor }}>
      {children}
    </CardGeneratorContext.Provider>
  );
};

export const CardGeneratorProvider = ({ children }: CardGeneratorProviderProps) => {
  const [sessionKey, setSessionKey] = useState(0);
  const resetEditor = useCallback(() => setSessionKey((current) => current + 1), []);

  return (
    <CardEditingSession key={sessionKey} resetEditor={resetEditor}>
      {children}
    </CardEditingSession>
  );
};

export const useCardGeneratorContext = () => {
  const context = useContext(CardGeneratorContext);
  if (!context) throw new Error('useCardGeneratorContext must be used within CardGeneratorProvider');
  return context;
};
