export type AppMode = 'sender' | 'traveler';

export type ParcelSize = 'Small' | 'Medium' | 'Large';
export type ParcelStatus = 'posted' | 'matched' | 'in_transit' | 'delivered';
export type TripMode = 'flight' | 'train' | 'bus' | 'car';
export type ReviewAction = 'approved' | 'rejected';

export interface ParcelDraftInput {
  parcelCategory: string;
  weight: string;
  dimensions: string;
  declaredValue: string;
  pickupAddress: string;
  dropoffAddress: string;
  fromCity: string;
  toCity: string;
  reward: string;
  pickupDate: string;
  description: string;
  photoNames: string[];
  termsAccepted: boolean;
}

export interface Parcel {
  id: string;
  senderName: string;
  parcelCategory: string;
  weight: number;
  dimensions: ParcelSize;
  declaredValue: string;
  pickupAddress: string;
  dropoffAddress: string;
  reward: number;
  status: ParcelStatus;
  fromCity: string;
  toCity: string;
  pickupDate: string;
  createdAt: string;
  description: string;
  photoNames: string[];
  travelerName?: string;
  otpCode?: string;
}

export interface Trip {
  id: string;
  travelerName: string;
  fromCity: string;
  toCity: string;
  date: string;
  mode: TripMode;
  availableSpace: number;
  status: 'active' | 'completed';
  isVerified: boolean;
  trustScore: number;
}

export interface VerificationCase {
  id: string;
  travelerName: string;
  route: string;
  idType: string;
  submittedAt: string;
  city: string;
  status: 'pending' | ReviewAction;
}

export interface StatItem {
  label: string;
  value: string;
  description: string;
}

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;
