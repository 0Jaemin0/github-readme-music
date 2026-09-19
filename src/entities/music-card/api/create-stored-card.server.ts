import "server-only";

import { randomBytes } from "node:crypto";
import { createServerSupabaseClient } from "@/shared/api/supabase/server";
import {
  createStoredCardContentHash,
  type StoredCardData,
} from "../model/stored-card.server";

export async function findOrCreateStoredCard(videoId: string, cardData: StoredCardData) {
  const supabase = createServerSupabaseClient();
  const contentHash = createStoredCardContentHash(videoId, cardData);
  const existingId = await findCardIdByContentHash(contentHash);
  if (existingId) return { id: existingId, created: false };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = `c_${randomBytes(12).toString("base64url")}`;
    const { error } = await supabase
      .from("cards")
      .insert({ id, video_id: videoId, card_data: cardData, content_hash: contentHash });

    if (!error) return { id, created: true };
    if (error.code !== "23505") throw error;

    const duplicatedId = await findCardIdByContentHash(contentHash);
    if (duplicatedId) return { id: duplicatedId, created: false };
  }

  return null;

  async function findCardIdByContentHash(hash: string) {
    const { data, error } = await supabase
      .from("cards")
      .select("id")
      .eq("content_hash", hash)
      .maybeSingle();

    if (error) throw error;
    return typeof data?.id === "string" ? data.id : null;
  }
}
