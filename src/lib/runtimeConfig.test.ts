import { describe, expect, it } from 'vitest';

import { getSupabaseConfig, getSupabaseConfigErrorMessage } from '@/lib/runtimeConfig';

describe('runtimeConfig', () => {
  it('marks Supabase as configured when both values are real', () => {
    const config = getSupabaseConfig({
      VITE_SUPABASE_URL: 'https://example-project.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'real-anon-key',
    });

    expect(config.configured).toBe(true);
    expect(config.missingKeys).toEqual([]);
  });

  it('treats empty or placeholder values as missing', () => {
    const config = getSupabaseConfig({
      VITE_SUPABASE_URL: 'https://your-project-ref.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'your-public-anon-key',
    });

    expect(config.configured).toBe(false);
    expect(config.missingKeys).toEqual(['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']);
    expect(getSupabaseConfigErrorMessage(config.missingKeys)).toContain('VITE_SUPABASE_URL');
  });
});
