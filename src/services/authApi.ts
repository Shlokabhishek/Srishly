import type { Session, User } from '@supabase/supabase-js';

import { ROUTES, STORAGE_KEYS } from '@/constants';
import { isValidEmail, normalizeEmail } from '@/lib/auth';
import {
  LOCAL_ADMIN_EMAIL,
  createVerificationCaseForUser,
  getLocalAuthSession,
  loginLocalAuthUser,
  registerLocalAuthUser,
  resetLocalAuthPassword,
  clearLocalAuthSession,
} from '@/lib/localAuth';
import { readLocalStorage, writeLocalStorage } from '@/lib/storage';
import { isSupabaseConfigured, supabase, supabaseConfigError } from '@/lib/supabase';
import type { AuthLoginInput, AuthRegisterInput, AuthRegisterResult, AuthSession, VerificationCase } from '@/types';

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
    return 'Too many sign-up attempts were made. Wait a minute and try again.';
  }

  if (lowerMessage.includes('user already registered')) {
    return 'This email is already registered. Try logging in instead.';
  }

  if (lowerMessage.includes('email rate limit exceeded')) {
    return 'Too many reset or verification emails were requested. Wait a minute and try again.';
  }

  if (lowerMessage.includes('email not confirmed')) {
    return 'Check your email and confirm your account first.';
  }

  if (lowerMessage.includes('invalid login credentials')) {
    return 'The email or password is incorrect.';
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
    isAdmin: Boolean(user.user_metadata.isAdmin),
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

function ensureValidEmail(email: string) {
  if (!isValidEmail(email)) {
    throw new AuthApiError('Enter a valid email address.');
  }
}

function queueVerificationCase(session: AuthSession) {
  const cases = readLocalStorage<VerificationCase[]>(STORAGE_KEYS.verificationCases, []);
  const alreadyQueued = cases.some((item) => item.userId === session.user.id || item.email === session.user.email);

  if (!alreadyQueued && !session.user.isAdmin) {
    writeLocalStorage(STORAGE_KEYS.verificationCases, [createVerificationCaseForUser(session.user), ...cases]);
  }
}

export function mapSupabaseSession(session: Session): AuthSession {
  return {
    user: mapUser(session.user),
  };
}

export async function registerUser(input: AuthRegisterInput): Promise<AuthRegisterResult> {
  const email = normalizeEmail(input.email);
  ensureValidEmail(email);

  if (!isSupabaseConfigured) {
    try {
      const session = registerLocalAuthUser(input);
      queueVerificationCase(session);
      return {
        session,
        requiresEmailVerification: false,
        email,
      };
    } catch (error) {
      throw new AuthApiError(error instanceof Error ? error.message : 'Registration failed.');
    }
  }

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
        idVerified: false,
        isAdmin: false,
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
  ensureValidEmail(email);

  if (email === LOCAL_ADMIN_EMAIL || !isSupabaseConfigured) {
    try {
      return loginLocalAuthUser(input);
    } catch (error) {
      throw new AuthApiError(error instanceof Error ? error.message : 'Login failed.');
    }
  }

  const supabaseClient = getSupabaseClient();
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    throw new AuthApiError(mapAuthErrorMessage(error.message));
  }

  if (!data.session) {
    throw new AuthApiError('We could not create a session. Try again.');
  }

  return mapSupabaseSession(data.session);
}

export async function requestPasswordReset(email: string, nextPassword?: string) {
  const normalizedEmail = normalizeEmail(email);
  ensureValidEmail(normalizedEmail);

  if (normalizedEmail === LOCAL_ADMIN_EMAIL || !isSupabaseConfigured) {
    if (!nextPassword || nextPassword.length < 8) {
      throw new AuthApiError('Enter a new password with at least 8 characters.');
    }

    try {
      resetLocalAuthPassword(normalizedEmail, nextPassword);
      return 'Password updated. You can log in now.';
    } catch (error) {
      throw new AuthApiError(error instanceof Error ? error.message : 'Password reset failed.');
    }
  }

  const supabaseClient = getSupabaseClient();
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}${ROUTES.auth}` : undefined;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(normalizedEmail, redirectTo ? { redirectTo } : undefined);

  if (error) {
    throw new AuthApiError(mapAuthErrorMessage(error.message));
  }

  return 'Check your email for the reset link.';
}

export async function getCurrentSession() {
  const localSession = getLocalAuthSession();
  if (localSession?.user.isAdmin || !isSupabaseConfigured) {
    return localSession;
  }

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
  clearLocalAuthSession();

  if (!isSupabaseConfigured) {
    return { success: true as const };
  }

  const supabaseClient = getSupabaseClient();
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    throw new AuthApiError(mapAuthErrorMessage(error.message));
  }

  return { success: true as const };
}
