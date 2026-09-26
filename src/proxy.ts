import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Keep API, SVG cards, Sentry tunneling, and static files outside locale routing.
  matcher: '/((?!api(?:/|$)|card(?:/|$)|monitoring(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|.*\\..*).*)',
};
