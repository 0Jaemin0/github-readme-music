import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
});

const siteTitle = 'github-readme-music | GitHub README 음악 카드 만들기';
const siteDescription =
  'YouTube 링크로 나만의 음악 카드를 만들고 GitHub README에 담아 보세요. 카드 디자인을 꾸민 뒤 SVG 카드와 Markdown 코드를 사용할 수 있습니다.';
const siteImageAlt = 'github-readme-music — README에 좋아하는 음악을 담아 보세요';

export const metadata: Metadata = {
  metadataBase: new URL('https://github-readme-music.vercel.app'),
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: 'github-readme-music',
    title: siteTitle,
    description: siteDescription,
    images: [{ url: '/og-cover.png', width: 1672, height: 941, alt: siteImageAlt }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [{ url: '/og-cover.png', alt: siteImageAlt }],
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#f8f9fb',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="ko" suppressHydrationWarning className={notoSansKr.variable}>
      <head>
        <Script
          id="github-readme-music-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('github-readme-music-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light'}catch(e){}})()",
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
