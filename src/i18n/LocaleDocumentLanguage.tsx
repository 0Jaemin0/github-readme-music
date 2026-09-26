'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';

// The common root survives navigation; initial HTML uses the server locale.
export const LocaleDocumentLanguage = () => {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
};
