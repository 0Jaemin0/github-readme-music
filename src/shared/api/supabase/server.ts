import 'server-only';

import { createClient } from '@supabase/supabase-js';

export function createServerSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) throw new Error('Supabase server environment variables are missing');

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
