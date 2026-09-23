import 'server-only';

export const FIVE_MINUTES_SECONDS = 5 * 60;
export const THIRTY_MINUTES_SECONDS = 30 * 60;
export const ONE_HOUR_SECONDS = 60 * 60;
export const ONE_HOUR_MS = ONE_HOUR_SECONDS * 1_000;
export const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export const FIVE_MINUTES_CACHE_CONTROL = `public, max-age=${FIVE_MINUTES_SECONDS}, s-maxage=${FIVE_MINUTES_SECONDS}`;
export const THIRTY_DAYS_IMMUTABLE_CACHE_CONTROL = `public, max-age=${THIRTY_DAYS_SECONDS}, s-maxage=${THIRTY_DAYS_SECONDS}, immutable`;
export const NO_STORE_CACHE_CONTROL = 'no-store';
