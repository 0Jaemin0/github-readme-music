import type { YouTubeMetadata } from '@/entities/music-card';

interface ApiError {
  code?: string;
}

interface StoredCardIdentifier {
  id?: string;
}

interface StoredCardPayload {
  videoId?: unknown;
  params?: unknown;
}

export interface MetadataResponse {
  data?: YouTubeMetadata;
  error?: ApiError;
}
export interface CreateCardResponse {
  data?: StoredCardIdentifier;
  error?: ApiError;
}
export interface ReadCardResponse {
  data?: StoredCardPayload;
  error?: ApiError;
}

interface ApiResult<T> {
  response: Response;
  body: T | null;
}

const readJsonResponse = async <T>(response: Response): Promise<ApiResult<T>> => {
  const body = (await response.json().catch(() => null)) as T | null;
  return { response, body };
};

export const requestYouTubeMetadata = async (url: string, signal: AbortSignal) => {
  const response = await fetch('/api/youtube/metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    signal,
  });

  return readJsonResponse<MetadataResponse>(response);
};

export const requestStoredCard = async (cardId: string, signal: AbortSignal) => {
  const response = await fetch(`/api/cards/${encodeURIComponent(cardId)}`, { signal });
  return readJsonResponse<ReadCardResponse>(response);
};

export const requestStoredCardCreation = async (videoId: string, params: Record<string, string>) => {
  const response = await fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId, params }),
  });

  return readJsonResponse<CreateCardResponse>(response);
};
