import 'server-only';

import { randomBytes } from 'node:crypto';
import { createStoredCardContentHash, type StoredCardData } from '../model/stored-card.server';
import { createStoredCardRepository } from './stored-card.repository.server';

export const findOrCreateStoredCard = async (videoId: string, cardData: StoredCardData) => {
  const repository = createStoredCardRepository();
  const contentHash = createStoredCardContentHash(videoId, cardData);
  const existingId = await repository.findIdByContentHash(contentHash);
  if (existingId) return { id: existingId, created: false };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = `c_${randomBytes(12).toString('base64url')}`;
    const { error } = await repository.insert(id, videoId, cardData, contentHash);

    if (!error) return { id, created: true };
    if (error.code !== '23505') throw error;

    const duplicatedId = await repository.findIdByContentHash(contentHash);
    if (duplicatedId) return { id: duplicatedId, created: false };
  }

  return null;
};
