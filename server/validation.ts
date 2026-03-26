import type { FieldErrors, ParcelDraftInput } from '../src/types';
import { CATEGORIES, CITIES, DECLARED_VALUES, DIMENSIONS } from './constants';
import { sanitizeText } from './utils';

type ParcelDraftField = keyof ParcelDraftInput;

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

  if (!(CATEGORIES as readonly string[]).includes(sanitizedDraft.parcelCategory)) {
    errors.parcelCategory = 'Select a parcel category.';
  }

  const weight = Number(sanitizedDraft.weight);
  if (!Number.isFinite(weight) || weight < 0.1 || weight > 15) {
    errors.weight = 'Weight must be between 0.1 kg and 15 kg.';
  }

  if (!(DIMENSIONS as readonly string[]).includes(sanitizedDraft.dimensions)) {
    errors.dimensions = 'Select a parcel size.';
  }

  if (!(DECLARED_VALUES as readonly string[]).includes(sanitizedDraft.declaredValue)) {
    errors.declaredValue = 'Choose a declared value range.';
  }

  if (!(CITIES as readonly string[]).includes(sanitizedDraft.fromCity)) {
    errors.fromCity = 'Choose a supported origin city.';
  }

  if (!(CITIES as readonly string[]).includes(sanitizedDraft.toCity)) {
    errors.toCity = 'Choose a supported destination city.';
  }

  if (sanitizedDraft.fromCity && sanitizedDraft.toCity && sanitizedDraft.fromCity === sanitizedDraft.toCity) {
    errors.toCity = 'Origin and destination must be different.';
  }

  const reward = Number(sanitizedDraft.reward);
  if (!Number.isFinite(reward) || reward < 100 || reward > 5000) {
    errors.reward = 'Reward must be between Rs 100 and Rs 5,000.';
  }

  if (!sanitizedDraft.pickupDate) {
    errors.pickupDate = 'Choose a pickup date.';
  }

  if (!sanitizedDraft.termsAccepted) {
    errors.termsAccepted = 'Accept the delivery and escrow terms to continue.';
  }

  return errors;
}

export function validateOtp(value: string) {
  return /^\d{4}$/.test(value);
}
