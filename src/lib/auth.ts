import type { AuthRegisterInput, ParsedIdCard } from '@/types';
import { sanitizeText } from '@/lib/utils';

const SHARDA_DOMAIN = 'sharda.ac.in';

export function isShardaEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [, domain = ''] = normalizedEmail.split('@');

  return domain === SHARDA_DOMAIN || domain.endsWith(`.${SHARDA_DOMAIN}`);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '').slice(-10);
}

export function normalizeName(name: string) {
  return sanitizeText(name.toUpperCase(), 80);
}

export function normalizeStudentId(studentIdNumber: string) {
  return sanitizeText(studentIdNumber.toUpperCase().replace(/\s+/g, ''), 32);
}

export function validateRegistrationInput(input: AuthRegisterInput) {
  const errors: Partial<Record<keyof AuthRegisterInput, string>> = {};

  if (!isShardaEmail(input.email)) {
    errors.email = 'Use your official Sharda University email address.';
  }

  if (input.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (normalizePhone(input.phone).length !== 10) {
    errors.phone = 'Enter a valid 10-digit phone number.';
  }

  if (normalizeName(input.name).length < 3) {
    errors.name = 'Name must be at least 3 characters.';
  }

  if (normalizeStudentId(input.studentIdNumber).length < 5) {
    errors.studentIdNumber = 'Student ID looks incomplete.';
  }

  if (!input.idCardImageName) {
    errors.idCardImageName = 'Upload a valid ID card image.';
  }

  return errors;
}

export function parseIdCardText(rawText: string): ParsedIdCard {
  const normalizedText = rawText.replace(/\r/g, '').replace(/[^\S\n]+/g, ' ');
  const upperText = normalizedText.toUpperCase();

  const emailMatch = upperText.match(/[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)*SHARDA\.AC\.IN/);
  const idMatch =
    upperText.match(/\b(?:STUDENT\s*ID|ENROLLMENT|ENROLMENT|ID\s*NO|ID)\s*[:\-]?\s*([A-Z0-9-]{5,})\b/) ||
    upperText.match(/\b[0-9]{6,}\b/);

  const lines = normalizedText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const candidateName = lines.find((line) => {
    const value = line.toUpperCase();
    if (value.includes('SHARDA') || value.includes('UNIVERSITY') || value.includes('STUDENT')) {
      return false;
    }

    return /^[A-Z .]{4,}$/i.test(line) && line.split(' ').length >= 2;
  });

  const confidence =
    (upperText.includes('SHARDA') ? 35 : 0) +
    (candidateName ? 35 : 0) +
    (idMatch ? 20 : 0) +
    (emailMatch ? 10 : 0);

  return {
    extractedName: normalizeName(candidateName ?? ''),
    extractedStudentId: normalizeStudentId(Array.isArray(idMatch) ? idMatch[1] ?? idMatch[0] ?? '' : ''),
    extractedEmail: emailMatch?.[0]?.toLowerCase(),
    confidence,
    rawText: normalizedText,
  };
}
