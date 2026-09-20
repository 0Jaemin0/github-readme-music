type RequestRateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  maxEntries: number;
};

type RequestWindow = {
  startedAt: number;
  count: number;
};

export const createRequestRateLimiter = ({ windowMs, maxRequests, maxEntries }: RequestRateLimitOptions) => {
  const requestWindows = new Map<string, RequestWindow>();

  const getRequestKey = (request: Request) => {
    return (
      request.headers.get('x-forwarded-for')?.split(',', 1)[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
    );
  };

  const pruneExpiredWindows = (now: number) => {
    for (const [key, window] of requestWindows) {
      if (now - window.startedAt >= windowMs) requestWindows.delete(key);
    }
    if (requestWindows.size < maxEntries) return;

    const oldestKey = requestWindows.keys().next().value;
    if (oldestKey) requestWindows.delete(oldestKey);
  };

  return (request: Request) => {
    const now = Date.now();
    const key = getRequestKey(request);
    const window = requestWindows.get(key);
    if (!window || now - window.startedAt >= windowMs) {
      pruneExpiredWindows(now);
      requestWindows.set(key, { startedAt: now, count: 1 });
      return true;
    }
    if (window.count >= maxRequests) return false;
    window.count += 1;
    return true;
  };
};
