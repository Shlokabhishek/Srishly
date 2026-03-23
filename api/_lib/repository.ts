import type { Collection } from 'mongodb';

import { getDb } from './mongodb';
import { ApiError } from './http';
import { seedParcels, seedTrips, seedVerificationCases } from '../../src/data/mockData';
import { validateOtp, validateParcelDraft, sanitizeParcelDraft } from '../../src/lib/validation';
import { createId } from '../../src/lib/utils';
import type { Parcel, ParcelDraftInput, ReviewAction, Trip, VerificationCase } from '../../src/types';

const COLLECTIONS = {
  parcels: 'parcels',
  trips: 'trips',
  verificationCases: 'verificationCases',
} as const;

async function seedCollectionIfEmpty<T extends { id: string }>(collection: Collection<T>, seedData: T[]) {
  const count = await collection.countDocuments();
  if (count === 0) {
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
    throw new ApiError(404, 'Verification case could not be found.');
  }

  return result;
}

export async function getDashboardSnapshotRecord() {
  const [parcels, trips, verificationCases] = await Promise.all([
    listParcels(),
    listTrips(),
    listVerificationCases(),
  ]);

  return {
    parcels,
    trips,
    verificationCases,
  };
}
