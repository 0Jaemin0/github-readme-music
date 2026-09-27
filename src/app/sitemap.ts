import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getLocaleHomeUrl, LANGUAGE_ALTERNATES } from '@/i18n/seo';

const sitemap = (): MetadataRoute.Sitemap =>
  routing.locales.map((locale) => ({
    url: getLocaleHomeUrl(locale),
    alternates: { languages: LANGUAGE_ALTERNATES },
  }));

export default sitemap;
