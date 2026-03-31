export type AppMode = 'sender' | 'traveler';

export type ParcelSize = 'Small' | 'Medium' | 'Large';
export type ParcelStatus = 'requested' | 'accepted' | 'picked' | 'in_transit' | 'delivered';
export type TripMode = 'flight' | 'train' | 'bus' | 'car';
export type ReviewAction = 'approved' | 'rejected';
export type UserRole = 'sender' | 'traveler';
export type DeliveryChatActor = 'user' | 'traveler' | 'system';
export type DeliveryCheckpointStatus = 'completed' | 'active' | 'upcoming';
export type VerificationStatus = 'student_verified' | 'aadhaar_verified' | 'pending';

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
  pickupLocation: string;
  description: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  photoNames: string[];
  termsAccepted: boolean;
}

export interface Parcel {
  id: string;
  senderName: string;
  senderPhone: string;
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
  pickupLocation: string;
  createdAt: string;
  description: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  photoNames: string[];
  travelerName?: string;
  travelerPhone?: string;
  travelerVerificationStatus?: VerificationStatus;
  travelerRating?: number;
  orderStartedAt?: string;
  pickedAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  otpCode?: string;
}

export interface Trip {
  id: string;
  travelerName: string;
  travelerPhone: string;
  verificationStatus: VerificationStatus;
  rating: number;
  successfulDeliveries: number;
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
  email?: string;
  userId?: string;
  route: string;
  idType: string;
  submittedAt: string;
  city: string;
  status: 'pending' | ReviewAction;
}

export interface DeliveryChatMessage {
  id: string;
  actor: DeliveryChatActor;
  text: string;
  sentAt: string;
}

export interface DeliveryCheckpoint {
  id: string;
  label: string;
  location: string;
  etaLabel: string;
  status: DeliveryCheckpointStatus;
}

export interface DeliveryThread {
  id: string;
  parcelId: string;
  routeId: string;
  travelerName: string;
  userName: string;
  fromCity: string;
  toCity: string;
  securityGroupTag: string;
  pickupSummary: string;
  dropoffSummary: string;
  currentLocation: string;
  lastUpdated: string;
  progress: number;
  responsibilitySummary: string;
  isHighValue: boolean;
  chat: DeliveryChatMessage[];
  checkpoints: DeliveryCheckpoint[];
}

export interface AssignmentNotification {
  id: string;
  parcelId: string;
  travelerName: string;
  audience: UserRole;
  route: string;
  message: string;
  createdAt: string;
}

export interface AuthRegisterInput {
  email: string;
  password: string;
  phone: string;
  name: string;
  studentIdNumber: string;
  idCardImageName: string;
}

export interface AuthLoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  studentIdNumber: string;
  emailVerified: boolean;
  idVerified: boolean;
  isAdmin?: boolean;
  idCardImageName: string;
  rolePreference: UserRole;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
}

export interface AuthRegisterResult {
  session: AuthSession | null;
  requiresEmailVerification: boolean;
  email: string;
}

export interface ParsedIdCard {
  extractedName: string;
  extractedStudentId: string;
  extractedEmail?: string;
  confidence: number;
  rawText: string;
}

export interface StatItem {
  label: string;
  value: string;
  description: string;
}

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;
