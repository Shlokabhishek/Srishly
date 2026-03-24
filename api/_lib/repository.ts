import type { Collection } from 'mongodb';

import { getDb } from './mongodb';
import { ApiError } from './http';
import { seedAssignmentNotifications, seedDeliveryThreads, seedParcels, seedTrips, seedVerificationCases } from '../../src/data/mockData';
import { validateOtp, validateParcelDraft, sanitizeParcelDraft } from '../../src/lib/validation';
import { createId } from '../../src/lib/utils';
import type {
  AssignmentNotification,
  DeliveryThread,
  AuthUser,
  Parcel,
  ParcelDraftInput,
  ReviewAction,
  Trip,
  VerificationCase,
} from '../../src/types';

const COLLECTIONS = {
  parcels: 'parcels',
  trips: 'trips',
  verificationCases: 'verificationCases',
  assignmentNotifications: 'assignmentNotifications',
  deliveryThreads: 'deliveryThreads',
  users: 'users',
} as const;

async function seedCollectionIfEmpty<T extends { id: string }>(collection: Collection<T>, seedData: T[]) {
  const count = await collection.countDocuments();
  if (count === 0 && seedData.length > 0) {
    await collection.insertMany(seedData as unknown as Parameters<Collection<T>['insertMany']>[0]);
  }
}

export async function getParcelsCollection() {
  const db = await getDb();
  const collection = db.collection<Parcel>(COLLECTIONS.parcels);
  await seedCollectionIfEmpty(collection, seedParcels);
  return collection;
}

export async function getTripsCollection() {
  const db = await getDb();
  const collection = db.collection<Trip>(COLLECTIONS.trips);
  await seedCollectionIfEmpty(collection, seedTrips);
  return collection;
}

export async function getVerificationCasesCollection() {
  const db = await getDb();
  const collection = db.collection<VerificationCase>(COLLECTIONS.verificationCases);
  await seedCollectionIfEmpty(collection, seedVerificationCases);
  return collection;
}

export async function getAssignmentNotificationsCollection() {
  const db = await getDb();
  const collection = db.collection<AssignmentNotification>(COLLECTIONS.assignmentNotifications);
  await seedCollectionIfEmpty(collection, seedAssignmentNotifications);
  return collection;
}

export async function getDeliveryThreadsCollection() {
  const db = await getDb();
  const collection = db.collection<DeliveryThread>(COLLECTIONS.deliveryThreads);
  await seedCollectionIfEmpty(collection, seedDeliveryThreads);
  return collection;
}

function createDeliveryThread(parcel: Parcel, travelerName: string, pickupPoint: string, dropPoint: string): DeliveryThread {
  const isHighValue = parcel.declaredValue === 'More than Rs 5,000' || parcel.declaredValue === 'Rs 2,000 - Rs 5,000';
  const tagStart = parcel.fromCity.slice(0, 3).toUpperCase();
  const tagEnd = parcel.toCity.slice(0, 3).toUpperCase();

  return {
    id: createId('thread'),
    parcelId: parcel.id,
    routeId: `route-${parcel.id}`,
    travelerName,
    userName: parcel.senderName,
    fromCity: parcel.fromCity,
    toCity: parcel.toCity,
    securityGroupTag: `SG-${tagStart}-${tagEnd}-${Math.floor(10 + Math.random() * 90)}`,
    pickupSummary: pickupPoint,
    dropoffSummary: dropPoint,
    currentLocation: `Awaiting pickup scan in ${parcel.fromCity}`,
    lastUpdated: new Date().toISOString(),
    progress: 8,
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
    checkpoints: [
      {
        id: createId('checkpoint'),
        label: 'Pickup plan',
        location: parcel.fromCity,
        etaLabel: 'Waiting for traveler confirmation',
        status: 'active',
      },
      {
        id: createId('checkpoint'),
        label: 'In transit',
        location: `${parcel.fromCity} -> ${parcel.toCity}`,
        etaLabel: 'Starts after pickup',
        status: 'upcoming',
      },
      {
        id: createId('checkpoint'),
        label: 'Drop + OTP handoff',
        location: parcel.toCity,
        etaLabel: `ETA on ${parcel.pickupDate}`,
        status: 'upcoming',
      },
    ],
  };
}

export interface StoredUser extends AuthUser {
  passwordHash: string;
}

export async function getUsersCollection() {
  const db = await getDb();
  return db.collection<StoredUser>(COLLECTIONS.users);
}

export async function listParcels() {
  const collection = await getParcelsCollection();
  return collection.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
}

export async function createParcelRecord(draft: ParcelDraftInput) {
  const errors = validateParcelDraft(draft);
  if (Object.keys(errors).length > 0) {
    throw new ApiError(400, 'The parcel form contains invalid values.');
  }

  const sanitized = sanitizeParcelDraft(draft);
  const parcel: Parcel = {
    id: createId('parcel'),
    senderName: 'Current Sender',
    parcelCategory: sanitized.parcelCategory,
    weight: Number(sanitized.weight),
    dimensions: sanitized.dimensions as Parcel['dimensions'],
    declaredValue: sanitized.declaredValue,
    pickupAddress: sanitized.pickupAddress || 'Selected by traveler after acceptance',
    dropoffAddress: sanitized.dropoffAddress || 'Selected by traveler after acceptance',
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

  const collection = await getParcelsCollection();
  await collection.insertOne(parcel);
  return parcel;
}

export async function updateParcelStatusRecord(id: string, status: Parcel['status']) {
  const collection = await getParcelsCollection();
  const result = await collection.findOneAndUpdate(
    { id },
    { $set: { status } },
    { returnDocument: 'after', projection: { _id: 0 } },
  );

  if (!result) {
    throw new ApiError(404, 'Parcel could not be found.');
  }

  return result;
}

export async function completeParcelDeliveryRecord(id: string, otp: string) {
  if (!validateOtp(otp)) {
    throw new ApiError(400, 'Enter a valid 4-digit delivery code.');
  }

  const collection = await getParcelsCollection();
  const parcel = await collection.findOne({ id }, { projection: { _id: 0 } });

  if (!parcel) {
    throw new ApiError(404, 'Parcel could not be found.');
  }

  if (parcel.otpCode !== otp) {
    throw new ApiError(400, 'The delivery code does not match this parcel.');
  }

  const updated = await collection.findOneAndUpdate(
    { id },
    { $set: { status: 'delivered' as const } },
    { returnDocument: 'after', projection: { _id: 0 } },
  );

  if (!updated) {
    throw new ApiError(404, 'Parcel could not be found.');
  }

  return updated;
}

export async function acceptParcelRequestRecord(id: string, travelerName: string, pickupPoint: string, dropPoint: string) {
  const trimmedTravelerName = travelerName.trim();
  const trimmedPickupPoint = pickupPoint.trim();
  const trimmedDropPoint = dropPoint.trim();

  if (trimmedTravelerName.length < 2) {
    throw new ApiError(400, 'Traveler name is required to accept this request.');
  }

  if (trimmedPickupPoint.length < 8 || trimmedDropPoint.length < 8) {
    throw new ApiError(400, 'Traveler must choose pickup and drop points before accepting the request.');
  }

  const parcelsCollection = await getParcelsCollection();
  const parcel = await parcelsCollection.findOne({ id }, { projection: { _id: 0 } });

  if (!parcel) {
    throw new ApiError(404, 'Parcel could not be found.');
  }

  if (parcel.status !== 'posted') {
    throw new ApiError(400, 'This parcel request is no longer open for acceptance.');
  }

  const updated = await parcelsCollection.findOneAndUpdate(
    { id },
    {
      $set: {
        status: 'matched' as const,
        travelerName: trimmedTravelerName,
      },
    },
    { returnDocument: 'after', projection: { _id: 0 } },
  );

  if (!updated) {
    throw new ApiError(404, 'Parcel could not be found.');
  }

  const notificationsCollection = await getAssignmentNotificationsCollection();
  const notification: AssignmentNotification = {
    id: createId('notification'),
    parcelId: parcel.id,
    travelerName: trimmedTravelerName,
    route: `${parcel.fromCity} -> ${parcel.toCity}`,
    message: `${trimmedTravelerName} accepted your request for ${parcel.fromCity} to ${parcel.toCity}.`,
    createdAt: new Date().toISOString(),
  };

  await notificationsCollection.insertOne(notification);

  const deliveryThreadsCollection = await getDeliveryThreadsCollection();
  const existingThread = await deliveryThreadsCollection.findOne({ parcelId: parcel.id }, { projection: { _id: 0 } });

  if (!existingThread) {
    await deliveryThreadsCollection.insertOne(
      createDeliveryThread(
        { ...parcel, travelerName: trimmedTravelerName, status: 'matched' },
        trimmedTravelerName,
        trimmedPickupPoint,
        trimmedDropPoint,
      ),
    );
  }

  return updated;
}

export async function listTrips() {
  const collection = await getTripsCollection();
  return collection.find({}, { projection: { _id: 0 } }).sort({ date: 1 }).toArray();
}

export async function listVerificationCases() {
  const collection = await getVerificationCasesCollection();
  return collection.find({}, { projection: { _id: 0 } }).sort({ submittedAt: -1 }).toArray();
}

export async function listAssignmentNotifications() {
  const collection = await getAssignmentNotificationsCollection();
  return collection.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
}

export async function listDeliveryThreads() {
  const collection = await getDeliveryThreadsCollection();
  return collection.find({}, { projection: { _id: 0 } }).sort({ lastUpdated: -1 }).toArray();
}

export async function reviewVerificationCaseRecord(id: string, action: ReviewAction) {
  const collection = await getVerificationCasesCollection();
  const result = await collection.findOneAndUpdate(
    { id },
    { $set: { status: action } },
    { returnDocument: 'after', projection: { _id: 0 } },
  );

  if (!result) {
    throw new ApiError(404, 'Verification case could not be found.');
  }

  return result;
}

export async function getDashboardSnapshotRecord() {
  const [parcels, trips, verificationCases, assignmentNotifications, deliveryThreads] = await Promise.all([
    listParcels(),
    listTrips(),
    listVerificationCases(),
    listAssignmentNotifications(),
    listDeliveryThreads(),
  ]);

  return {
    parcels,
    trips,
    verificationCases,
    assignmentNotifications,
    deliveryThreads,
  };
}
