interface ClientEnv {
  readonly [key: string]: string | boolean | undefined;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

function isConfiguredValue(value: string | undefined, knownPlaceholder: string) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return false;
  }

  return !normalizedValue.includes(knownPlaceholder);
}

export function getSupabaseConfig(env: ClientEnv) {
  const url = env.VITE_SUPABASE_URL?.trim() ?? '';
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
  const missingKeys: string[] = [];

  if (!isConfiguredValue(url, 'your-project-ref.supabase.co')) {
    missingKeys.push('VITE_SUPABASE_URL');
  }

  if (!isConfiguredValue(anonKey, 'your-public-anon-key')) {
    missingKeys.push('VITE_SUPABASE_ANON_KEY');
  }

  return {
    url,
    anonKey,
    configured: missingKeys.length === 0,
    missingKeys,
  };
}

export function getSupabaseConfigErrorMessage(missingKeys: string[]) {
  if (missingKeys.length === 0) {
    return '';
  }

  return `Authentication is unavailable right now. Configure ${missingKeys.join(', ')} with real Supabase values.`;
}
