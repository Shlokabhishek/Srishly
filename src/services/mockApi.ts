import { seedParcels, seedTrips, seedVerificationCases } from '@/data/mockData';
import { readLocalStorage, writeLocalStorage } from '@/lib/storage';
import { createId, sleep } from '@/lib/utils';
import { validateOtp, validateParcelDraft, sanitizeParcelDraft } from '@/lib/validation';
import { STORAGE_KEYS } from '@/constants';
import type { Parcel, ParcelDraftInput, ReviewAction, Trip, VerificationCase } from '@/types';

export class AppValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppValidationError';
  }
}

interface ApiErrorResponse {
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api';

function shouldUseFallbackApi(error: unknown) {
  return import.meta.env.DEV && error instanceof Error;
}

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    throw new AppValidationError(errorBody.error || 'Request failed.');
  }

  return (await response.json()) as T;
}

function getStoredParcels() {
  return readLocalStorage<Parcel[]>(STORAGE_KEYS.parcels, seedParcels);
}

function setStoredParcels(parcels: Parcel[]) {
  writeLocalStorage(STORAGE_KEYS.parcels, parcels);
}

function getStoredVerificationCases() {
  return readLocalStorage<VerificationCase[]>(STORAGE_KEYS.verificationCases, seedVerificationCases);
}

function setStoredVerificationCases(cases: VerificationCase[]) {
  writeLocalStorage(STORAGE_KEYS.verificationCases, cases);
}

async function getFallbackParcels() {
  await sleep();
  return getStoredParcels();
}

async function createFallbackParcel(draft: ParcelDraftInput) {
  const errors = validateParcelDraft(draft);
  if (Object.keys(errors).length > 0) {
    throw new AppValidationError('The parcel form contains invalid values.');
  }

  const sanitized = sanitizeParcelDraft(draft);
  const nextParcel: Parcel = {
    id: createId('parcel'),
    senderName: 'Current Sender',
    parcelCategory: sanitized.parcelCategory,
    weight: Number(sanitized.weight),
    dimensions: sanitized.dimensions as Parcel['dimensions'],
    declaredValue: sanitized.declaredValue,
    pickupAddress: sanitized.pickupAddress,
    dropoffAddress: sanitized.dropoffAddress,
    reward: Number(sanitized.reward),
    status: 'posted',
    fromCity: sanitized.fromCity,
    toCity: sanitized.toCity,
    pickupDate: sanitized.pickupDate,
    createdAt: new Date().toISOString(),
    description: sanitized.description,
    photoNames: sanitized.photoNames,
    otpCode: `${Math.floor(1000 + Math.random() * 9000)}`,
  };

  const parcels = [nextParcel, ...getStoredParcels()];
  setStoredParcels(parcels);
  await sleep(450);
  return nextParcel;
}

async function completeFallbackParcelDelivery(id: string, otp: string) {
  if (!validateOtp(otp)) {
    throw new AppValidationError('Enter a valid 4-digit delivery code.');
  }

  const parcels = getStoredParcels();
  const currentParcel = parcels.find((parcel) => parcel.id === id);

  if (!currentParcel) {
    throw new AppValidationError('Parcel could not be found.');
  }

  if (currentParcel.otpCode !== otp) {
    throw new AppValidationError('The delivery code does not match this parcel.');
  }

  const nextParcels = parcels.map((parcel) =>
    parcel.id === id ? { ...parcel, status: 'delivered' as const } : parcel,
  );

  setStoredParcels(nextParcels);
  await sleep();
  return nextParcels;
}

async function getFallbackVerificationCases() {
  await sleep();
  return getStoredVerificationCases();
}

async function reviewFallbackVerificationCase(id: string, action: ReviewAction) {
  const nextCases = getStoredVerificationCases().map((item) =>
    item.id === id ? { ...item, status: action } : item,
  );

  setStoredVerificationCases(nextCases);
  await sleep();
  return nextCases;
}

export async function getParcels() {
  try {
    return await requestApi<Parcel[]>('/parcels');
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      return getFallbackParcels();
    }

    throw error;
  }
}

export async function createParcel(draft: ParcelDraftInput) {
  try {
    return await requestApi<Parcel>('/parcels', {
      method: 'POST',
      body: JSON.stringify(draft),
    });
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      return createFallbackParcel(draft);
    }

    throw error;
  }
}

export async function updateParcelStatus(id: string, status: Parcel['status']) {
  try {
    const updated = await requestApi<Parcel>('/parcels', {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'updateStatus',
        id,
        status,
      }),
    });

    return (await getParcels()).map((parcel) => (parcel.id === updated.id ? updated : parcel));
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      const nextParcels = getStoredParcels().map((parcel) =>
        parcel.id === id ? { ...parcel, status } : parcel,
      );

      setStoredParcels(nextParcels);
      await sleep();
      return nextParcels;
    }

    throw error;
  }
}

export async function completeParcelDelivery(id: string, otp: string) {
  try {
    const updated = await requestApi<Parcel>('/parcels', {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'completeDelivery',
        id,
        otp,
      }),
    });

    return (await getParcels()).map((parcel) => (parcel.id === updated.id ? updated : parcel));
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      return completeFallbackParcelDelivery(id, otp);
    }

    throw error;
  }
}

export async function getTrips() {
  try {
    return await requestApi<Trip[]>('/trips');
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      await sleep();
      return seedTrips;
    }

    throw error;
  }
}

export async function getVerificationCases() {
  try {
    return await requestApi<VerificationCase[]>('/verification-cases');
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      return getFallbackVerificationCases();
    }

    throw error;
  }
}

export async function reviewVerificationCase(id: string, action: ReviewAction) {
  try {
    const updated = await requestApi<VerificationCase>('/verification-cases', {
      method: 'PATCH',
      body: JSON.stringify({
        id,
        action,
      }),
    });

    return (await getVerificationCases()).map((item) => (item.id === updated.id ? updated : item));
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      return reviewFallbackVerificationCase(id, action);
    }

    throw error;
  }
}

export async function getDashboardSnapshot(): Promise<{
  parcels: Parcel[];
  trips: Trip[];
  verificationCases: VerificationCase[];
}> {
  try {
    return await requestApi<{
      parcels: Parcel[];
      trips: Trip[];
      verificationCases: VerificationCase[];
    }>('/dashboard');
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      const [parcels, trips, verificationCases] = await Promise.all([
        getFallbackParcels(),
        getTrips(),
        getFallbackVerificationCases(),
      ]);

      return {
        parcels,
        trips,
        verificationCases,
      };
    }

    throw error;
  }
}
