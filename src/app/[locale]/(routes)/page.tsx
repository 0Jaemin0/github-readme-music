import { HomePage } from './_ui/HomePage';
import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getLocaleHomeUrl, LANGUAGE_ALTERNATES } from '@/i18n/seo';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'SEO' });
  const title = t('title');
  const description = t('description');
  const url = getLocaleHomeUrl(locale);
  const images = [{ url: '/og-cover.png', width: 1672, height: 941, alt: t('imageAlt') }];

  return {
    title,
    description,
    alternates: { canonical: url, languages: LANGUAGE_ALTERNATES },
    openGraph: {
      type: 'website',
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      alternateLocale: locale === 'ko' ? ['en_US'] : ['ko_KR'],
      url,
      siteName: 'github-readme-music',
      title,
      description,
      images,
    },
    twitter: { card: 'summary_large_image', title, description, images },
  };
};

const Page = () => {
  return <HomePage />;
};

export default Page;
