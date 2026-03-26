import type { AssignmentNotification, DeliveryThread, Parcel, Trip, VerificationCase } from '../src/types';

export const seedParcels: Parcel[] = [
  {
    id: 'parcel-001',
    senderName: 'Jaydeep Kumar',
    parcelCategory: 'Documents',
    weight: 0.6,
    dimensions: 'Small',
    declaredValue: 'Up to Rs 500',
    pickupAddress: 'Connaught Place, New Delhi',
    dropoffAddress: 'Gomti Nagar, Lucknow',
    reward: 420,
    status: 'posted',
    fromCity: 'Delhi',
    toCity: 'Lucknow',
    pickupDate: '2026-03-28',
    createdAt: '2026-03-26T00:00:00.000Z',
    description: 'Urgent paperwork for same-day handoff.',
    photoNames: ['invoice-front.jpg'],
    otpCode: '1934',
  },
];

export const seedTrips: Trip[] = [
  {
    id: 'trip-001',
    travelerName: 'Amit R.',
    fromCity: 'Delhi',
    toCity: 'Lucknow',
    date: '2026-03-28',
    mode: 'train',
    availableSpace: 10,
    status: 'active',
    isVerified: true,
    trustScore: 92,
  },
];

export const seedVerificationCases: VerificationCase[] = [
  {
    id: 'verify-001',
    travelerName: 'Amit R.',
    route: 'Delhi -> Lucknow',
    idType: 'Aadhaar Card',
    submittedAt: '2026-03-26T00:00:00.000Z',
    city: 'New Delhi',
    status: 'pending',
  },
];

export const seedAssignmentNotifications: AssignmentNotification[] = [];
export const seedDeliveryThreads: DeliveryThread[] = [];
