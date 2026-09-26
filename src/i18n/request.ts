import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const candidate = locale ?? (await requestLocale);
  // The root not-found page has no locale segment. LocaleLayout rejects
  // unsupported route segments while the common root can use the default.
  const requestedLocale = hasLocale(routing.locales, candidate) ? candidate : routing.defaultLocale;

  const messages =
    requestedLocale === 'ko'
      ? (await import('./messages/ko.json')).default
      : (await import('./messages/en.json')).default;

  return { locale: requestedLocale, messages };
});
