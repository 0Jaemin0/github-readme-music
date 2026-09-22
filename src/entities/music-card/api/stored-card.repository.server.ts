import 'server-only';

import { createServerSupabaseClient } from '@/shared/api/supabase/server';
import type { StoredCardData } from '../model/stored-card.server';

export const createStoredCardRepository = () => {
  const supabase = createServerSupabaseClient();

  const findIdByContentHash = async (contentHash: string) => {
    const { data, error } = await supabase.from('cards').select('id').eq('content_hash', contentHash).maybeSingle();

    if (error) throw error;
    return typeof data?.id === 'string' ? data.id : null;
  };

  const insert = async (id: string, videoId: string, cardData: StoredCardData, contentHash: string) => {
    return supabase.from('cards').insert({ id, video_id: videoId, card_data: cardData, content_hash: contentHash });
  };

  return { findIdByContentHash, insert };
};
