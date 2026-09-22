import 'server-only';

import { normalizeStoredCardData, type StoredCardData } from '../model/stored-card.server';
import { createServerSupabaseClient } from '@/shared/api/supabase/server';

export type StoredCardReadResult =
  { type: 'found'; videoId: string; cardData: StoredCardData } | { type: 'not_found' } | { type: 'invalid_data' };

export const readStoredCard = async (id: string): Promise<StoredCardReadResult> => {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from('cards').select('video_id, card_data').eq('id', id).maybeSingle();

  if (error) throw error;
  if (!data) return { type: 'not_found' };

  const videoId = typeof data.video_id === 'string' ? data.video_id : '';
  const cardData = normalizeStoredCardData(data.card_data, videoId);
  if (!cardData) return { type: 'invalid_data' };

  return { type: 'found', videoId, cardData };
};
