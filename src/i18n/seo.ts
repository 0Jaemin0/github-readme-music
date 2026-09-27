import { routing } from './routing';

export const SITE_URL = 'https://github-readme-music.vercel.app';

export const getLocaleHomeUrl = (locale: (typeof routing.locales)[number]) =>
  new URL(locale === routing.defaultLocale ? '/' : `/${locale}`, SITE_URL).href;

export const LANGUAGE_ALTERNATES = {
  ...Object.fromEntries(routing.locales.map((locale) => [locale, getLocaleHomeUrl(locale)])),
  'x-default': getLocaleHomeUrl(routing.defaultLocale),
};
