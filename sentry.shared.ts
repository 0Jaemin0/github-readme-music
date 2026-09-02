import type { ErrorEvent, TransactionEvent } from "@sentry/core";

export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
  beforeSend(event: ErrorEvent) {
    event.user = undefined;
    event.extra = undefined;
    event.breadcrumbs = event.breadcrumbs?.map((breadcrumb) => ({ ...breadcrumb, data: undefined }));

    if (!event.request) return event;

    event.request.data = undefined;

    if (event.request.url) {
      try {
        const url = new URL(event.request.url);
        event.request.url = `${url.origin}${url.pathname}`;
      } catch {
        event.request.url = undefined;
      }
    }

    event.request.headers = undefined;

    return event;
  },
  beforeSendTransaction(event: TransactionEvent) {
    event.user = undefined;
    event.extra = undefined;
    event.request = undefined;
    event.spans = event.spans?.map((span) => ({ ...span, data: {} }));
    return event;
  },
};
