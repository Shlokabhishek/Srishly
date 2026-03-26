type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  status: (statusCode: number) => {
    json: (body: unknown) => void;
  };
};

type DashboardParcel = {
  id: string;
  senderName: string;
  parcelCategory: string;
  weight: number;
  dimensions: string;
  declaredValue: string;
  pickupAddress: string;
  dropoffAddress: string;
  reward: number;
  status: 'posted' | 'matched' | 'in_transit' | 'delivered';
  fromCity: string;
  toCity: string;
  pickupDate: string;
  createdAt: string;
  description: string;
  photoNames: string[];
  travelerName?: string;
  otpCode: string;
};

type DashboardTrip = {
  id: string;
  travelerName: string;
  fromCity: string;
  toCity: string;
  date: string;
  mode: 'flight' | 'train' | 'bus' | 'car';
  availableSpace: number;
  status: 'active' | 'completed';
  isVerified: boolean;
  trustScore: number;
};

type DashboardVerificationCase = {
  id: string;
  travelerName: string;
  route: string;
  idType: string;
  submittedAt: string;
  city: string;
  status: 'pending' | 'approved' | 'rejected';
};

export default function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed. Expected one of: GET.' });
  }

  const parcels: DashboardParcel[] = [
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
      status: 'matched',
      fromCity: 'Delhi',
      toCity: 'Lucknow',
      pickupDate: '2026-03-25',
      createdAt: '2026-03-22T09:00:00.000Z',
      description: 'Urgent paperwork for same-day handoff.',
      photoNames: ['invoice-front.jpg'],
      travelerName: 'Amit R.',
      otpCode: '1934',
    },
    {
      id: 'parcel-002',
      senderName: 'Priya Malhotra',
      parcelCategory: 'Electronics',
      weight: 1.8,
      dimensions: 'Medium',
      declaredValue: 'Rs 2,000 - Rs 5,000',
      pickupAddress: 'Noida Sector 62, Noida',
      dropoffAddress: 'Indiranagar, Bangalore',
      reward: 1300,
      status: 'in_transit',
      fromCity: 'Noida',
      toCity: 'Bangalore',
      pickupDate: '2026-03-24',
      createdAt: '2026-03-21T15:30:00.000Z',
      description: 'Compact audio device in original packaging.',
      photoNames: ['device-box.png', 'seal-check.png'],
      travelerName: 'Rahul S.',
      otpCode: '4721',
    },
  ];

  const trips: DashboardTrip[] = [
    {
      id: 'trip-001',
      travelerName: 'Amit R.',
      fromCity: 'Noida',
      toCity: 'Kanpur',
      date: '2026-03-25',
      mode: 'car',
      availableSpace: 12,
      status: 'active',
      isVerified: true,
      trustScore: 92,
    },
  ];

  const verificationCases: DashboardVerificationCase[] = [
    {
      id: 'verify-001',
      travelerName: 'Amit R.',
      route: 'Noida -> Kanpur',
      idType: 'Aadhaar Card',
      submittedAt: '2026-03-23T13:15:00.000Z',
      city: 'Greater Noida',
      status: 'pending',
    },
  ];

  return response.status(200).json({
    parcels,
    trips,
    verificationCases,
    assignmentNotifications: [],
    deliveryThreads: [],
  });
}
