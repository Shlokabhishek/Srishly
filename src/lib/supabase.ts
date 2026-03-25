import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseConfig, getSupabaseConfigErrorMessage } from '@/lib/runtimeConfig';

const supabaseConfig = getSupabaseConfig(import.meta.env);

export const supabaseConfigError = getSupabaseConfigErrorMessage(supabaseConfig.missingKeys);
export const isSupabaseConfigured = supabaseConfig.configured;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
