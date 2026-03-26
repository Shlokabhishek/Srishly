import { getDb } from './mongodb';
import { createApiError } from './apiHttp';
import { seedAssignmentNotifications, seedDeliveryThreads, seedParcels, seedTrips, seedVerificationCases } from './seedData';
import { validateOtp, validateParcelDraft, sanitizeParcelDraft } from './validation';
import { createId } from './utils';
import type { AssignmentNotification, DeliveryThread, Parcel, ParcelDraftInput, ReviewAction, Trip, VerificationCase } from '../src/types';

const COLLECTIONS = {
  parcels: 'parcels',
  trips: 'trips',
  verificationCases: 'verificationCases',
  assignmentNotifications: 'assignmentNotifications',
  deliveryThreads: 'deliveryThreads',
} as const;

async function seedCollectionIfEmpty<T extends { id: string }>(collection: any, seedData: T[]) {
  const count = await collection.countDocuments();
  if (count === 0 && seedData.length > 0) {
    await collection.insertMany(seedData);
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

export async function listParcels() {
  const collection = await getParcelsCollection();
  return collection.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
}

export async function createParcelRecord(draft: ParcelDraftInput) {
  const errors = validateParcelDraft(draft);
  if (Object.keys(errors).length > 0) {
    throw createApiError(400, 'The parcel form contains invalid values.');
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
    throw createApiError(404, 'Parcel could not be found.');
  }

  return result;
}

export async function completeParcelDeliveryRecord(id: string, otp: string) {
  if (!validateOtp(otp)) {
    throw createApiError(400, 'Enter a valid 4-digit delivery code.');
  }

  const collection = await getParcelsCollection();
  const parcel = await collection.findOne({ id }, { projection: { _id: 0 } });

  if (!parcel) {
    throw createApiError(404, 'Parcel could not be found.');
  }

  if (parcel.otpCode !== otp) {
    throw createApiError(400, 'The delivery code does not match this parcel.');
  }

  const updated = await collection.findOneAndUpdate(
    { id },
    { $set: { status: 'delivered' as const } },
    { returnDocument: 'after', projection: { _id: 0 } },
  );

  if (!updated) {
    throw createApiError(404, 'Parcel could not be found.');
  }

  return updated;
}

export async function acceptParcelRequestRecord(id: string, travelerName: string) {
  const trimmedTravelerName = travelerName.trim();

  if (trimmedTravelerName.length < 2) {
    throw createApiError(400, 'Traveler name is required to accept this request.');
  }

  const parcelsCollection = await getParcelsCollection();
  const parcel = await parcelsCollection.findOne({ id }, { projection: { _id: 0 } });

  if (!parcel) {
    throw createApiError(404, 'Parcel could not be found.');
  }

  const updated = await parcelsCollection.findOneAndUpdate(
    { id },
    { $set: { status: 'matched' as const, travelerName: trimmedTravelerName } },
    { returnDocument: 'after', projection: { _id: 0 } },
  );

  if (!updated) {
    throw createApiError(404, 'Parcel could not be found.');
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

export async function reviewVerificationCaseRecord(id: string, action: ReviewAction) {
  const collection = await getVerificationCasesCollection();
  const result = await collection.findOneAndUpdate(
    { id },
    { $set: { status: action } },
    { returnDocument: 'after', projection: { _id: 0 } },
  );

  if (!result) {
    throw createApiError(404, 'Verification case could not be found.');
  }

  return result;
}

export async function getDashboardSnapshotRecord() {
  const [parcels, trips, verificationCases, assignmentNotifications, deliveryThreads] = await Promise.all([
    listParcels(),
    listTrips(),
    listVerificationCases(),
    getAssignmentNotificationsCollection().then((c) => c.find({}, { projection: { _id: 0 } }).toArray()),
    getDeliveryThreadsCollection().then((c) => c.find({}, { projection: { _id: 0 } }).toArray()),
  ]);

  return {
    parcels,
    trips,
    verificationCases,
    assignmentNotifications,
    deliveryThreads,
  };
}
