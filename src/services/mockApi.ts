import { seedAssignmentNotifications, seedDeliveryThreads, seedParcels, seedTrips, seedVerificationCases } from '@/data/mockData';
import { readLocalStorage, writeLocalStorage } from '@/lib/storage';
import { createId, sleep } from '@/lib/utils';
import { validateOtp, validateParcelDraft, sanitizeParcelDraft } from '@/lib/validation';
import { syncLocalUserVerification } from '@/lib/localAuth';
import { STORAGE_KEYS, TRAVELER_CANCELLATION_FINE } from '@/constants';
import type { AssignmentNotification, DeliveryThread, Parcel, ParcelDraftInput, ReviewAction, Trip, VerificationCase } from '@/types';

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
const LOCAL_FALLBACK_API_ENABLED = import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL;
const SHARED_API_UNAVAILABLE_MESSAGE =
  'Shared parcel data is unavailable right now. Please reconnect the API so requests sync across devices.';
const RETRY_DELAYS_MS = [250, 700] as const;
const REQUEST_TIMEOUT_MS = 12000;

function isRetryableMethod(method: string | undefined) {
  const normalized = (method ?? 'GET').toUpperCase();
  return normalized === 'GET' || normalized === 'HEAD';
}

function isRetryableStatus(status: number) {
  return status === 429 || status >= 500;
}

function isNetworkError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  return error instanceof TypeError;
}

async function waitFor(ms: number) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: init?.signal ?? controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function shouldUseFallbackApi(error: unknown) {
  return LOCAL_FALLBACK_API_ENABLED && error instanceof Error;
}

function toAppError(error: unknown) {
  if (error instanceof AppValidationError) {
    return error;
  }

  if (!LOCAL_FALLBACK_API_ENABLED) {
    return new AppValidationError(SHARED_API_UNAVAILABLE_MESSAGE);
  }

  if (error instanceof Error) {
    return error;
  }

  return new AppValidationError('Request failed.');
}

async function requestApi<T>(path: string, init?: RequestInit): Promise<T> {
  const retryableRequest = isRetryableMethod(init?.method);
  const maxAttempts = retryableRequest ? RETRY_DELAYS_MS.length + 1 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
        ...init,
      });

      if (response.ok) {
        return (await response.json()) as T;
      }

      if (attempt < maxAttempts - 1 && isRetryableStatus(response.status)) {
        await waitFor(RETRY_DELAYS_MS[attempt]);
        continue;
      }

      const errorBody = (await response.json().catch(() => ({}))) as ApiErrorResponse;
      const message =
        errorBody.error || (!LOCAL_FALLBACK_API_ENABLED && response.status >= 404 ? SHARED_API_UNAVAILABLE_MESSAGE : 'Request failed.');
      throw new AppValidationError(message);
    } catch (error) {
      if (attempt < maxAttempts - 1 && isNetworkError(error)) {
        await waitFor(RETRY_DELAYS_MS[attempt]);
        continue;
      }

      throw error;
    }
  }

  throw new AppValidationError('Request failed.');
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

function mergeVerificationCases(primary: VerificationCase[], secondary: VerificationCase[]) {
  const merged = new Map<string, VerificationCase>();

  [...secondary, ...primary].forEach((item) => {
    merged.set(item.id, item);
  });

  return Array.from(merged.values()).sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
}

function getStoredAssignmentNotifications() {
  return readLocalStorage<AssignmentNotification[]>(STORAGE_KEYS.assignmentNotifications, seedAssignmentNotifications);
}

function setStoredAssignmentNotifications(notifications: AssignmentNotification[]) {
  writeLocalStorage(STORAGE_KEYS.assignmentNotifications, notifications);
}

function getStoredDeliveryThreads() {
  return readLocalStorage<DeliveryThread[]>(STORAGE_KEYS.deliveryThreads, seedDeliveryThreads);
}

function setStoredDeliveryThreads(threads: DeliveryThread[]) {
  writeLocalStorage(STORAGE_KEYS.deliveryThreads, threads);
}

function clearTravelerAssignment(parcel: Parcel): Parcel {
  return {
    ...parcel,
    status: 'requested',
    travelerName: undefined,
    travelerPhone: undefined,
    travelerVerificationStatus: undefined,
    travelerRating: undefined,
    orderStartedAt: undefined,
    pickedAt: undefined,
    inTransitAt: undefined,
    deliveredAt: undefined,
    otpCode: undefined,
  };
}

function createOtpCode() {
  return `${Math.floor(1000 + Math.random() * 9000)}`;
}

function buildCheckpoints(parcel: Parcel, pickupPoint: string, dropPoint: string): DeliveryThread['checkpoints'] {
  const stages: Array<{ key: Parcel['status']; label: string; location: string; etaLabel: string }> = [
    {
      key: 'requested',
      label: 'Requested',
      location: parcel.fromCity,
      etaLabel: 'Request created',
    },
    {
      key: 'accepted',
      label: 'Accepted',
      location: pickupPoint,
      etaLabel: 'Traveler accepted the request',
    },
    {
      key: 'picked',
      label: 'Picked',
      location: pickupPoint,
      etaLabel: parcel.otpCode ? `OTP ${parcel.otpCode} generated` : 'Waiting for parcel pickup',
    },
    {
      key: 'in_transit',
      label: 'In Transit',
      location: `${parcel.fromCity} -> ${parcel.toCity}`,
      etaLabel: parcel.inTransitAt ? 'Live tracking active' : 'Tracking starts after pickup',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      location: dropPoint,
      etaLabel: parcel.deliveredAt ? 'OTP verified and handoff completed' : 'Receiver OTP handoff pending',
    },
  ];

  const currentIndex = stages.findIndex((stage) => stage.key === parcel.status);

  return stages.map((stage, index) => ({
    id: createId('checkpoint'),
    label: stage.label,
    location: stage.location,
    etaLabel: stage.etaLabel,
    status: index < currentIndex ? 'completed' : index === currentIndex ? 'active' : 'upcoming',
  }));
}

function deriveTrackingState(parcel: Parcel, pickupPoint: string, dropPoint: string) {
  if (parcel.status === 'delivered') {
    return {
      currentLocation: dropPoint,
      progress: 100,
      checkpoints: buildCheckpoints(parcel, pickupPoint, dropPoint).map((checkpoint) => ({
        ...checkpoint,
        status: 'completed' as const,
      })),
    };
  }

  if (parcel.status === 'in_transit') {
    return {
      currentLocation: `Live on route to ${parcel.toCity}`,
      progress: 76,
      checkpoints: buildCheckpoints(parcel, pickupPoint, dropPoint),
    };
  }

  if (parcel.status === 'picked') {
    return {
      currentLocation: pickupPoint,
      progress: 44,
      checkpoints: buildCheckpoints(parcel, pickupPoint, dropPoint),
    };
  }

  if (parcel.status === 'accepted') {
    return {
      currentLocation: `Pickup pending at ${pickupPoint}`,
      progress: 22,
      checkpoints: buildCheckpoints(parcel, pickupPoint, dropPoint),
    };
  }

  return {
    currentLocation: `Awaiting traveler confirmation in ${parcel.fromCity}`,
    progress: 6,
    checkpoints: buildCheckpoints(parcel, pickupPoint, dropPoint),
  };
}

function syncDeliveryThreadsWithParcel(parcel: Parcel) {
  const threads = getStoredDeliveryThreads().map((thread) => {
    if (thread.parcelId !== parcel.id) {
      return thread;
    }

    const nextRuntime = deriveTrackingState(parcel, thread.pickupSummary, thread.dropoffSummary);

    return {
      ...thread,
      travelerName: parcel.travelerName ?? thread.travelerName,
      currentLocation: nextRuntime.currentLocation,
      progress: nextRuntime.progress,
      lastUpdated: new Date().toISOString(),
      checkpoints: nextRuntime.checkpoints,
    };
  });

  setStoredDeliveryThreads(threads);
}

function createDeliveryThread(parcel: Parcel, travelerName: string, pickupPoint: string, dropPoint: string): DeliveryThread {
  const isHighValue = parcel.declaredValue === 'More than Rs 5,000' || parcel.declaredValue === 'Rs 2,000 - Rs 5,000';
  const tagStart = parcel.fromCity.slice(0, 3).toUpperCase();
  const tagEnd = parcel.toCity.slice(0, 3).toUpperCase();
  const threadId = createId('thread');
  const runtime = deriveTrackingState(parcel, pickupPoint, dropPoint);

  return {
    id: threadId,
    parcelId: parcel.id,
    routeId: `route-${parcel.id}`,
    travelerName,
    userName: parcel.senderName,
    fromCity: parcel.fromCity,
    toCity: parcel.toCity,
    securityGroupTag: `SG-${tagStart}-${tagEnd}-${Math.floor(10 + Math.random() * 90)}`,
    pickupSummary: pickupPoint,
    dropoffSummary: dropPoint,
    currentLocation: runtime.currentLocation,
    lastUpdated: new Date().toISOString(),
    progress: runtime.progress,
    responsibilitySummary: isHighValue
      ? 'High-value item protocol is active. Keep the parcel sealed, verify the tag at pickup, and complete OTP handoff together.'
      : 'Traveler is responsible for carrying the sealed parcel on the agreed route and completing handoff only after OTP confirmation.',
    isHighValue,
    chat: [
      {
        id: createId('message'),
        actor: 'system',
        text: `Security group tag created for ${parcel.senderName} and ${travelerName}.`,
        sentAt: new Date().toISOString(),
      },
      {
        id: createId('message'),
        actor: 'traveler',
        text: `I accepted this request for ${parcel.fromCity} to ${parcel.toCity}. Pickup point: ${pickupPoint}. Drop point: ${dropPoint}.`,
        sentAt: new Date().toISOString(),
      },
    ],
    checkpoints: runtime.checkpoints,
  };
}

function recordAcceptanceSideEffects(parcel: Parcel, travelerName: string, pickupPoint: string, dropPoint: string) {
  const senderNotification: AssignmentNotification = {
    id: createId('notification'),
    parcelId: parcel.id,
    travelerName,
    audience: 'sender',
    route: `${parcel.fromCity} -> ${parcel.toCity}`,
    message: `${travelerName} accepted your parcel request.`,
    createdAt: new Date().toISOString(),
  };

  const travelerNotification: AssignmentNotification = {
    id: createId('notification'),
    parcelId: parcel.id,
    travelerName,
    audience: 'traveler',
    route: `${parcel.fromCity} -> ${parcel.toCity}`,
    message: `Order ${parcel.id} is now active.`,
    createdAt: new Date().toISOString(),
  };

  setStoredAssignmentNotifications([senderNotification, travelerNotification, ...getStoredAssignmentNotifications()]);

  const currentThreads = getStoredDeliveryThreads();
  if (!currentThreads.some((thread) => thread.parcelId === parcel.id)) {
    setStoredDeliveryThreads([createDeliveryThread(parcel, travelerName, pickupPoint, dropPoint), ...currentThreads]);
  }
}

function recordCancellationSideEffects(parcel: Parcel, travelerName: string) {
  const senderNotification: AssignmentNotification = {
    id: createId('notification'),
    parcelId: parcel.id,
    travelerName,
    audience: 'sender',
    route: `${parcel.fromCity} -> ${parcel.toCity}`,
    message: `${travelerName} canceled this order. Fine: Rs ${TRAVELER_CANCELLATION_FINE}.`,
    createdAt: new Date().toISOString(),
  };

  const travelerNotification: AssignmentNotification = {
    id: createId('notification'),
    parcelId: parcel.id,
    travelerName,
    audience: 'traveler',
    route: `${parcel.fromCity} -> ${parcel.toCity}`,
    message: `Order canceled. Fine noted: Rs ${TRAVELER_CANCELLATION_FINE}.`,
    createdAt: new Date().toISOString(),
  };

  setStoredAssignmentNotifications([senderNotification, travelerNotification, ...getStoredAssignmentNotifications()]);
  setStoredDeliveryThreads(getStoredDeliveryThreads().filter((thread) => thread.parcelId !== parcel.id));
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
    senderPhone: '98******10',
    parcelCategory: sanitized.parcelCategory,
    weight: Number(sanitized.weight),
    dimensions: sanitized.dimensions as Parcel['dimensions'],
    declaredValue: sanitized.declaredValue,
    pickupAddress: sanitized.pickupAddress || 'Selected by traveler after acceptance',
    dropoffAddress: sanitized.dropoffAddress || 'Selected by traveler after acceptance',
    reward: Number(sanitized.reward),
    status: 'requested',
    fromCity: sanitized.fromCity,
    toCity: sanitized.toCity,
    pickupDate: sanitized.pickupDate,
    pickupLocation: sanitized.pickupLocation,
    createdAt: new Date().toISOString(),
    description: sanitized.description,
    receiverName: sanitized.receiverName,
    receiverPhone: sanitized.receiverPhone,
    receiverAddress: sanitized.receiverAddress,
    photoNames: sanitized.photoNames,
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

  if (currentParcel.status !== 'in_transit') {
    throw new AppValidationError('Delivery can be completed only after the parcel is in transit.');
  }

  if (currentParcel.otpCode !== otp) {
    throw new AppValidationError('The delivery code does not match this parcel.');
  }

  const nextParcels = parcels.map((parcel) =>
    parcel.id === id
      ? {
          ...parcel,
          status: 'delivered' as const,
          deliveredAt: new Date().toISOString(),
        }
      : parcel,
  );

  setStoredParcels(nextParcels);
  const deliveredParcel = nextParcels.find((parcel) => parcel.id === id);
  if (deliveredParcel) {
    syncDeliveryThreadsWithParcel(deliveredParcel);
  }
  await sleep();
  return nextParcels;
}

async function acceptFallbackParcelRequest(id: string, travelerName: string, pickupPoint: string, dropPoint: string) {
  const trimmedTravelerName = travelerName.trim();
  const trimmedPickupPoint = pickupPoint.trim();
  const trimmedDropPoint = dropPoint.trim();

  if (trimmedTravelerName.length < 2) {
    throw new AppValidationError('Traveler name is required to accept this request.');
  }

  if (trimmedPickupPoint.length < 8 || trimmedDropPoint.length < 8) {
    throw new AppValidationError('Traveler must choose pickup and drop points before accepting the request.');
  }

  const parcels = getStoredParcels();
  const currentParcel = parcels.find((parcel) => parcel.id === id);

  if (!currentParcel) {
    throw new AppValidationError('Parcel could not be found.');
  }

  if (currentParcel.status !== 'requested') {
    throw new AppValidationError('This parcel request is no longer open for acceptance.');
  }

  const nextParcels = parcels.map((parcel) =>
    parcel.id === id
      ? {
          ...parcel,
          status: 'accepted' as const,
          travelerName: trimmedTravelerName,
          travelerPhone: '98******32',
          travelerVerificationStatus: 'aadhaar_verified' as const,
          travelerRating: 4.7,
          orderStartedAt: new Date().toISOString(),
        }
      : parcel,
  );

  setStoredParcels(nextParcels);
  recordAcceptanceSideEffects(
    {
      ...currentParcel,
      travelerName: trimmedTravelerName,
      travelerPhone: '98******32',
      travelerVerificationStatus: 'aadhaar_verified',
      travelerRating: 4.7,
      status: 'accepted',
      orderStartedAt: new Date().toISOString(),
    },
    trimmedTravelerName,
    trimmedPickupPoint,
    trimmedDropPoint,
  );

  await sleep();
  return nextParcels;
}

async function cancelFallbackParcelAssignment(id: string) {
  const parcels = getStoredParcels();
  const currentParcel = parcels.find((parcel) => parcel.id === id);

  if (!currentParcel) {
    throw new AppValidationError('Parcel could not be found.');
  }

  if (currentParcel.status !== 'accepted' || !currentParcel.travelerName) {
    throw new AppValidationError('Only accepted orders can be canceled.');
  }

  const nextParcels = parcels.map((parcel) => (parcel.id === id ? clearTravelerAssignment(parcel) : parcel));
  setStoredParcels(nextParcels);
  recordCancellationSideEffects(currentParcel, currentParcel.travelerName);
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

    throw toAppError(error);
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

    throw toAppError(error);
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

    syncDeliveryThreadsWithParcel(updated);

    return (await getParcels()).map((parcel) => (parcel.id === updated.id ? updated : parcel));
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      const parcels = getStoredParcels();
      const currentParcel = parcels.find((parcel) => parcel.id === id);

      if (!currentParcel) {
        throw new AppValidationError('Parcel could not be found.');
      }

      if (status === 'picked' && currentParcel.status !== 'accepted') {
        throw new AppValidationError('Pickup can start only after a traveler accepts the request.');
      }

      if (status === 'in_transit' && currentParcel.status !== 'picked') {
        throw new AppValidationError('Start transit only after pickup is confirmed.');
      }

      const nextTimestamp = new Date().toISOString();
      const nextParcels = parcels.map((parcel) =>
        parcel.id === id
          ? {
              ...parcel,
              status,
              otpCode: status === 'picked' ? createOtpCode() : parcel.otpCode,
              pickedAt: status === 'picked' ? nextTimestamp : parcel.pickedAt,
              inTransitAt: status === 'in_transit' ? nextTimestamp : parcel.inTransitAt,
            }
          : parcel,
      );

      setStoredParcels(nextParcels);
      const updatedParcel = nextParcels.find((parcel) => parcel.id === id);
      if (updatedParcel) {
        syncDeliveryThreadsWithParcel(updatedParcel);
      }
      await sleep();
      return nextParcels;
    }

    throw toAppError(error);
  }
}

export async function cancelParcelAssignment(parcel: Parcel) {
  try {
    const updated = await requestApi<Parcel>('/parcels', {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'cancelRequest',
        id: parcel.id,
      }),
    });

    if (parcel.travelerName) {
      recordCancellationSideEffects(parcel, parcel.travelerName);
    }

    return (await getParcels()).map((item) => (item.id === updated.id ? updated : item));
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      return cancelFallbackParcelAssignment(parcel.id);
    }

    throw toAppError(error);
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

    syncDeliveryThreadsWithParcel(updated);

    return (await getParcels()).map((parcel) => (parcel.id === updated.id ? updated : parcel));
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      return completeFallbackParcelDelivery(id, otp);
    }

    throw toAppError(error);
  }
}

export async function acceptParcelRequest(id: string, travelerName: string, pickupPoint: string, dropPoint: string) {
  try {
    const updated = await requestApi<Parcel>('/parcels', {
      method: 'PATCH',
      body: JSON.stringify({
        action: 'acceptRequest',
        id,
        travelerName,
        pickupPoint,
        dropPoint,
      }),
    });

    recordAcceptanceSideEffects(
      {
        ...updated,
        travelerName,
        travelerPhone: updated.travelerPhone ?? '98******32',
        travelerVerificationStatus: updated.travelerVerificationStatus ?? 'aadhaar_verified',
        travelerRating: updated.travelerRating ?? 4.7,
      },
      travelerName,
      pickupPoint.trim(),
      dropPoint.trim(),
    );

    return updated;
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      const nextParcels = await acceptFallbackParcelRequest(id, travelerName, pickupPoint, dropPoint);
      const updated = nextParcels.find((parcel) => parcel.id === id);

      if (!updated) {
        throw new AppValidationError('Parcel could not be found.');
      }

      return updated;
    }

    throw toAppError(error);
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

    throw toAppError(error);
  }
}

export async function getVerificationCases() {
  try {
    const remoteCases = await requestApi<VerificationCase[]>('/verification-cases');
    const mergedCases = mergeVerificationCases(remoteCases, getStoredVerificationCases());
    setStoredVerificationCases(mergedCases);
    return mergedCases;
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      return getFallbackVerificationCases();
    }

    throw toAppError(error);
  }
}

export async function getAssignmentNotifications() {
  await sleep(200);
  return getStoredAssignmentNotifications();
}

export async function getDeliveryThreads() {
  await sleep(200);
  return getStoredDeliveryThreads();
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

    const nextCases = (await getVerificationCases()).map((item) => (item.id === updated.id ? { ...item, ...updated } : item));
    setStoredVerificationCases(nextCases);
    const reviewedCase = nextCases.find((item) => item.id === id);
    if (reviewedCase) {
      syncLocalUserVerification(reviewedCase);
    }
    return nextCases;
  } catch (error) {
    if (shouldUseFallbackApi(error)) {
      const nextCases = await reviewFallbackVerificationCase(id, action);
      const reviewedCase = nextCases.find((item) => item.id === id);
      if (reviewedCase) {
        syncLocalUserVerification(reviewedCase);
      }
      return nextCases;
    }

    throw toAppError(error);
  }
}

export async function getDashboardSnapshot(): Promise<{
  parcels: Parcel[];
  trips: Trip[];
  verificationCases: VerificationCase[];
  assignmentNotifications: AssignmentNotification[];
  deliveryThreads: DeliveryThread[];
}> {
  const [parcels, trips, verificationCases, assignmentNotifications, deliveryThreads] = await Promise.all([
    getParcels(),
    getTrips(),
    getVerificationCases(),
    getAssignmentNotifications(),
    getDeliveryThreads(),
  ]);

  return {
    parcels,
    trips,
    verificationCases,
    assignmentNotifications,
    deliveryThreads,
  };
}
