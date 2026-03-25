import type { Session, User } from '@supabase/supabase-js';

import { isShardaEmail, normalizeEmail } from '@/lib/auth';
import { isSupabaseConfigured, supabase, supabaseConfigError } from '@/lib/supabase';
import type { AuthLoginInput, AuthRegisterInput, AuthRegisterResult, AuthSession } from '@/types';

export class AuthApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthApiError';
  }
}

function mapAuthErrorMessage(message: string) {
  const normalized = message.trim();
  const lowerMessage = normalized.toLowerCase();

  if (lowerMessage.includes('only request this after')) {
    return 'Too many sign-up attempts were made for this email. Wait a minute, then try again, or switch to Login if the account already exists.';
  }

  if (lowerMessage.includes('user already registered')) {
    return 'This Sharda email is already registered. Switch to Login and sign in instead.';
  }

  if (lowerMessage.includes('email rate limit exceeded')) {
    return 'Too many verification emails were requested. Wait a minute and try again.';
  }

  if (lowerMessage.includes('invalid login credentials')) {
    return 'The email or password is incorrect. Check your details and try again.';
  }

  return normalized;
}

function mapUser(user: User) {
  return {
    id: user.id,
    email: user.email ?? '',
    name: String(user.user_metadata.name ?? user.user_metadata.full_name ?? '').trim(),
    phone: String(user.user_metadata.phone ?? '').trim(),
    studentIdNumber: String(user.user_metadata.studentIdNumber ?? '').trim(),
    emailVerified: Boolean(user.email_confirmed_at),
    idVerified: Boolean(user.user_metadata.idVerified),
    idCardImageName: String(user.user_metadata.idCardImageName ?? '').trim(),
    rolePreference: 'sender' as const,
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

function getSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new AuthApiError(supabaseConfigError || 'Authentication is unavailable right now.');
  }

  return supabase;
}

export function mapSupabaseSession(session: Session): AuthSession {
  return {
    user: mapUser(session.user),
  };
}

function ensureShardaEmail(email: string) {
  if (!isShardaEmail(email)) {
    throw new AuthApiError('Use your official Sharda University email address.');
  }
}

export async function registerUser(input: AuthRegisterInput): Promise<AuthRegisterResult> {
  const email = normalizeEmail(input.email);
  ensureShardaEmail(email);
  const supabaseClient = getSupabaseClient();

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        phone: input.phone,
        studentIdNumber: input.studentIdNumber,
        idCardImageName: input.idCardImageName,
        idVerified: true,
      },
    },
  });

  if (error) {
    throw new AuthApiError(mapAuthErrorMessage(error.message));
  }

  if (!data.session) {
    return {
      session: null,
      requiresEmailVerification: true,
      email,
    };
  }

  return {
    session: mapSupabaseSession(data.session),
    requiresEmailVerification: false,
    email,
  };
}

export async function loginUser(input: AuthLoginInput) {
  const email = normalizeEmail(input.email);
  ensureShardaEmail(email);
  const supabaseClient = getSupabaseClient();

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    throw new AuthApiError(mapAuthErrorMessage(error.message));
  }

  if (!data.session) {
    throw new AuthApiError('We could not create a session. If your account is new, confirm your email and try again.');
  }

  return mapSupabaseSession(data.session);
}

export async function getCurrentSession() {
  const supabaseClient = getSupabaseClient();
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();

  if (error) {
    throw new AuthApiError(mapAuthErrorMessage(error.message));
  }

  return session ? mapSupabaseSession(session) : null;
}

export async function logoutUser() {
  const supabaseClient = getSupabaseClient();
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    throw new AuthApiError(mapAuthErrorMessage(error.message));
  }

  return { success: true as const };
}
