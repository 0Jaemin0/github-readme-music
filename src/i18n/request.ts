import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import * as rootParams from 'next/root-params';
import { notFound } from 'next/navigation';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  const requestedLocale = locale ?? (await rootParams.locale());
  if (!hasLocale(routing.locales, requestedLocale)) notFound();

  const messages =
    requestedLocale === 'ko'
      ? (await import('./messages/ko.json')).default
      : (await import('./messages/en.json')).default;

  return { locale: requestedLocale, messages };
});
