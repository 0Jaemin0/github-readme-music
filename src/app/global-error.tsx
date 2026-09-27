'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect, useSyncExternalStore } from 'react';
import ko from '@/i18n/messages/ko.json';
import en from '@/i18n/messages/en.json';

interface GlobalErrorProps {
  error: Error & { digest?: string };
}

const subscribeToNavigation = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
};

const getFallbackLocale = () => (window.location.pathname.split('/')[1] === 'en' ? 'en' : 'ko');

const GlobalError = ({ error }: GlobalErrorProps) => {
  // The root error boundary replaces the layout and cannot rely on its
  // translation provider. Read the URL and bundled messages independently.
  const locale = useSyncExternalStore(subscribeToNavigation, getFallbackLocale, () => 'ko');
  const messages = (locale === 'en' ? en : ko).GlobalError;
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang={locale}>
      <body>
        <main style={{ display: 'grid', minHeight: '100vh', placeItems: 'center', padding: '24px' }}>
          <section style={{ maxWidth: '360px', textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>{messages.title}</h1>
            <p style={{ margin: '12px 0 20px', color: '#525252', lineHeight: 1.6 }}>{messages.description}</p>
            <button type="button" onClick={() => window.location.reload()}>
              {messages.reload}
            </button>
          </section>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
