import type { Session, User } from '@supabase/supabase-js';

import { isShardaEmail, normalizeEmail } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { AuthLoginInput, AuthRegisterInput, AuthSession } from '@/types';

export class AuthApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthApiError';
  }
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

export function mapSupabaseSession(session: Session): AuthSession {
  return {
    user: mapUser(session.user),
  };
}

function ensureShardaEmail(email: string) {
  if (!isShardaEmail(email)) {
    throw new AuthApiError('Use your official @sharda.ac.in email address.');
  }
}

export async function registerUser(input: AuthRegisterInput) {
  const email = normalizeEmail(input.email);
  ensureShardaEmail(email);

  const { data, error } = await supabase.auth.signUp({
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
    throw new AuthApiError(error.message);
  }

  if (!data.session) {
    throw new AuthApiError('Check your Sharda email inbox to confirm your account, then sign in.');
  }

  return mapSupabaseSession(data.session);
}

export async function loginUser(input: AuthLoginInput) {
  const email = normalizeEmail(input.email);
  ensureShardaEmail(email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    throw new AuthApiError(error.message);
  }

  if (!data.session) {
    throw new AuthApiError('We could not create a session. If your account is new, confirm your email and try again.');
  }

  return mapSupabaseSession(data.session);
}

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new AuthApiError(error.message);
  }

  return session ? mapSupabaseSession(session) : null;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthApiError(error.message);
  }

  return { success: true as const };
}
