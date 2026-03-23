import type { ParcelDraftInput, StatItem } from '@/types';

export const APP_NAME = 'Srishly';
export const SUPPORT_EMAIL = 'team.srishly@gmail.com';

export const ROUTES = {
  home: '/',
  auth: '/auth',
  sendParcel: '/send',
  findTrip: '/find',
  findTraveler: '/find-traveler',
  trustCenter: '/trust',
  verificationHub: '/verification-hub',
  dashboard: '/dashboard',
  howItWorks: '/how-it-works',
} as const;

export const CITIES = [
  'Delhi',
  'Noida',
  'Gurgaon',
  'Kanpur',
  'Lucknow',
  'Mumbai',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
] as const;

export const CATEGORIES = ['Documents', 'Electronics', 'Clothing', 'Footwear', 'Books', 'Others'] as const;
export const DIMENSIONS = ['Small', 'Medium', 'Large'] as const;
export const DECLARED_VALUES = ['Up to Rs 500', 'Rs 500 - Rs 2,000', 'Rs 2,000 - Rs 5,000', 'More than Rs 5,000'] as const;

export const INITIAL_PARCEL_DRAFT: ParcelDraftInput = {
  parcelCategory: '',
  weight: '',
  dimensions: '',
  declaredValue: '',
  pickupAddress: '',
  dropoffAddress: '',
  fromCity: '',
  toCity: '',
  reward: '',
  pickupDate: '',
  description: '',
  photoNames: [],
  termsAccepted: false,
};

export const HOME_STATS: StatItem[] = [
  {
    label: 'Avg. savings',
    value: '60%',
    description: 'Compared with premium courier alternatives on the same route.',
  },
  {
    label: 'Verified coverage',
    value: '14 cities',
    description: 'Core city network with trust-led onboarding and route validation.',
  },
  {
    label: 'Escrow-first flow',
    value: '100%',
    description: 'Every sender reward is held until the delivery confirmation step is complete.',
  },
];

export const TRUST_PILLARS = [
  {
    title: 'Identity verification',
    description: 'Government ID review, selfie checks, and manual approval before route posting.',
  },
  {
    title: 'Escrow release controls',
    description: 'Rewards are held until the sender confirms delivery through the final handoff step.',
  },
  {
    title: 'Route-level matching',
    description: 'Every request is matched by city pair, weight, and trip availability before acceptance.',
  },
];

export const STORAGE_KEYS = {
  appMode: 'srishly.app-mode',
  parcels: 'srishly.parcels',
  verificationCases: 'srishly.verification-cases',
} as const;
