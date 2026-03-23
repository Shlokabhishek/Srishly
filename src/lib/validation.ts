import { CATEGORIES, CITIES, DECLARED_VALUES, DIMENSIONS } from '@/constants';
import type { FieldErrors, ParcelDraftInput } from '@/types';
import { sanitizeText } from '@/lib/utils';

type ParcelDraftField = keyof ParcelDraftInput;

function isValidCity(city: string) {
  return (CITIES as readonly string[]).includes(city);
}

function isValidCategory(category: string) {
  return (CATEGORIES as readonly string[]).includes(category);
}

function isValidDimension(size: string) {
  return (DIMENSIONS as readonly string[]).includes(size);
}

function isValidDeclaredValue(value: string) {
  return (DECLARED_VALUES as readonly string[]).includes(value);
}

export function validateRouteSelection(fromCity: string, toCity: string): FieldErrors<'fromCity' | 'toCity'> {
  const errors: FieldErrors<'fromCity' | 'toCity'> = {};

  if (!isValidCity(fromCity)) {
    errors.fromCity = 'Choose a supported origin city.';
  }

  if (!isValidCity(toCity)) {
    errors.toCity = 'Choose a supported destination city.';
  }

  if (fromCity && toCity && fromCity === toCity) {
    errors.toCity = 'Origin and destination must be different.';
  }

  return errors;
}

export function sanitizeParcelDraft(draft: ParcelDraftInput): ParcelDraftInput {
  return {
    ...draft,
    pickupAddress: sanitizeText(draft.pickupAddress, 200),
    dropoffAddress: sanitizeText(draft.dropoffAddress, 200),
    description: sanitizeText(draft.description, 280),
    photoNames: draft.photoNames.map((name) => sanitizeText(name, 80)),
  };
}

export function validateParcelDraft(draft: ParcelDraftInput): FieldErrors<ParcelDraftField> {
  const sanitizedDraft = sanitizeParcelDraft(draft);
  const errors: FieldErrors<ParcelDraftField> = {};
  const routeErrors = validateRouteSelection(sanitizedDraft.fromCity, sanitizedDraft.toCity);

  if (!isValidCategory(sanitizedDraft.parcelCategory)) {
    errors.parcelCategory = 'Select a parcel category.';
  }

  const weight = Number(sanitizedDraft.weight);
  if (!Number.isFinite(weight) || weight < 0.1 || weight > 15) {
    errors.weight = 'Weight must be between 0.1 kg and 15 kg.';
  }

  if (!isValidDimension(sanitizedDraft.dimensions)) {
    errors.dimensions = 'Select a parcel size.';
  }

  if (!isValidDeclaredValue(sanitizedDraft.declaredValue)) {
    errors.declaredValue = 'Choose a declared value range.';
  }

  if (routeErrors.fromCity) {
    errors.fromCity = routeErrors.fromCity;
  }

  if (routeErrors.toCity) {
    errors.toCity = routeErrors.toCity;
  }

  if (sanitizedDraft.pickupAddress.length < 12) {
    errors.pickupAddress = 'Pickup address must be at least 12 characters.';
  }

  if (sanitizedDraft.dropoffAddress.length < 12) {
    errors.dropoffAddress = 'Drop-off address must be at least 12 characters.';
  }

  const reward = Number(sanitizedDraft.reward);
  if (!Number.isFinite(reward) || reward < 100 || reward > 5000) {
    errors.reward = 'Reward must be between Rs 100 and Rs 5,000.';
  }

  if (!sanitizedDraft.pickupDate) {
    errors.pickupDate = 'Choose a pickup date.';
  } else {
    const pickupDate = new Date(`${sanitizedDraft.pickupDate}T00:00:00`);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (pickupDate < now) {
      errors.pickupDate = 'Pickup date cannot be in the past.';
    }
  }

  if (!sanitizedDraft.termsAccepted) {
    errors.termsAccepted = 'Accept the delivery and escrow terms to continue.';
  }

  if (sanitizedDraft.photoNames.length > 4) {
    errors.photoNames = 'Upload up to 4 reference images only.';
  }

  if (sanitizedDraft.description.length > 280) {
    errors.description = 'Description must be 280 characters or fewer.';
  }

  return errors;
}

export function isStepValid(
  step: number,
  errors: FieldErrors<ParcelDraftField>,
): boolean {
  const stepFields: Record<number, ParcelDraftField[]> = {
    1: ['parcelCategory', 'weight', 'dimensions', 'declaredValue', 'description', 'photoNames'],
    2: ['fromCity', 'toCity', 'pickupAddress', 'dropoffAddress', 'pickupDate'],
    3: ['reward', 'termsAccepted'],
  };

  return !stepFields[step].some((field) => errors[field]);
}

export function validateOtp(value: string) {
  return /^\d{4}$/.test(value);
}
