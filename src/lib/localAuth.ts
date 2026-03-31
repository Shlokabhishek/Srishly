import { STORAGE_KEYS } from '@/constants';
import { normalizeEmail, normalizeName, normalizePhone, normalizeStudentId } from '@/lib/auth';
import { readLocalStorage, writeLocalStorage } from '@/lib/storage';
import { createId } from '@/lib/utils';
import type { AuthLoginInput, AuthRegisterInput, AuthSession, AuthUser, VerificationCase } from '@/types';

interface LocalAuthUserRecord extends AuthUser {
  password: string;
}

export const LOCAL_ADMIN_EMAIL = 'admin@srishly.in';
export const LOCAL_ADMIN_PASSWORD = 'Admin@12345';

function buildAdminUser(): LocalAuthUserRecord {
  return {
    id: 'admin-001',
    email: LOCAL_ADMIN_EMAIL,
    password: LOCAL_ADMIN_PASSWORD,
    name: 'Srishly Admin',
    phone: '9999999999',
    studentIdNumber: 'ADMIN001',
    emailVerified: true,
    idVerified: true,
    isAdmin: true,
    idCardImageName: 'admin-access',
    rolePreference: 'sender',
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function sanitizeUsers(users: LocalAuthUserRecord[]) {
  if (users.some((user) => user.email === LOCAL_ADMIN_EMAIL)) {
    return users;
  }

  return [buildAdminUser(), ...users];
}

function toSession(user: AuthUser): AuthSession {
  return { user };
}

function withoutPassword(user: LocalAuthUserRecord): AuthUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function getLocalAuthUsers() {
  return sanitizeUsers(readLocalStorage<LocalAuthUserRecord[]>(STORAGE_KEYS.authUsers, [buildAdminUser()]));
}

export function setLocalAuthUsers(users: LocalAuthUserRecord[]) {
  writeLocalStorage(STORAGE_KEYS.authUsers, sanitizeUsers(users));
}

export function getLocalAuthSession() {
  return readLocalStorage<AuthSession | null>(STORAGE_KEYS.authSession, null);
}

export function setLocalAuthSession(session: AuthSession | null) {
  writeLocalStorage(STORAGE_KEYS.authSession, session);
}

export function clearLocalAuthSession() {
  setLocalAuthSession(null);
}

export function findLocalAuthUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  return getLocalAuthUsers().find((user) => user.email === normalizedEmail);
}

export function createVerificationCaseForUser(user: AuthUser): VerificationCase {
  return {
    id: createId('verify'),
    travelerName: user.name,
    email: user.email,
    userId: user.id,
    route: 'Trust approval',
    idType: user.idCardImageName ? 'Student ID / ID proof' : 'Manual review',
    submittedAt: new Date().toISOString(),
    city: 'Profile onboarding',
    status: 'pending',
  };
}

export function registerLocalAuthUser(input: AuthRegisterInput) {
  const normalizedEmail = normalizeEmail(input.email);
  const users = getLocalAuthUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('This email is already registered. Try logging in instead.');
  }

  const record: LocalAuthUserRecord = {
    id: createId('user'),
    email: normalizedEmail,
    password: input.password,
    name: normalizeName(input.name),
    phone: normalizePhone(input.phone),
    studentIdNumber: normalizeStudentId(input.studentIdNumber),
    emailVerified: true,
    idVerified: false,
    isAdmin: false,
    idCardImageName: input.idCardImageName,
    rolePreference: 'sender',
    createdAt: new Date().toISOString(),
  };

  setLocalAuthUsers([record, ...users]);
  const session = toSession(withoutPassword(record));
  setLocalAuthSession(session);
  return session;
}

export function loginLocalAuthUser(input: AuthLoginInput) {
  const normalizedEmail = normalizeEmail(input.email);
  const user = getLocalAuthUsers().find((item) => item.email === normalizedEmail && item.password === input.password);

  if (!user) {
    throw new Error('The email or password is incorrect.');
  }

  const session = toSession(withoutPassword(user));
  setLocalAuthSession(session);
  return session;
}

export function resetLocalAuthPassword(email: string, nextPassword: string) {
  const normalizedEmail = normalizeEmail(email);
  const users = getLocalAuthUsers();
  const user = users.find((item) => item.email === normalizedEmail);

  if (!user) {
    throw new Error('We could not find an account for this email.');
  }

  const nextUsers = users.map((item) => (item.email === normalizedEmail ? { ...item, password: nextPassword } : item));
  setLocalAuthUsers(nextUsers);
}

export function syncLocalUserVerification(caseRecord: VerificationCase) {
  if (!caseRecord.userId && !caseRecord.email) {
    return;
  }

  const users = getLocalAuthUsers();
  const nextUsers = users.map((user) => {
    const matchesUser = caseRecord.userId ? user.id === caseRecord.userId : user.email === normalizeEmail(caseRecord.email ?? '');

    if (!matchesUser) {
      return user;
    }

    return {
      ...user,
      idVerified: caseRecord.status === 'approved',
    };
  });

  setLocalAuthUsers(nextUsers);

  const activeSession = getLocalAuthSession();
  if (activeSession && (caseRecord.userId === activeSession.user.id || normalizeEmail(caseRecord.email ?? '') === activeSession.user.email)) {
    const updatedUser = nextUsers.find((user) => user.id === activeSession.user.id);
    if (updatedUser) {
      setLocalAuthSession(toSession(withoutPassword(updatedUser)));
    }
  }
}
