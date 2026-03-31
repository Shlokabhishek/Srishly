type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (statusCode: number) => {
    json: (body: unknown) => void;
  };
};

type ParcelStatus = 'requested' | 'accepted' | 'picked' | 'in_transit' | 'delivered';

type ParcelRecord = {
  id: string;
  senderName: string;
  senderPhone: string;
  parcelCategory: string;
  weight: number;
  dimensions: string;
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
  travelerVerificationStatus?: 'student_verified' | 'aadhaar_verified' | 'pending';
  travelerRating?: number;
  orderStartedAt?: string;
  pickedAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  otpCode?: string;
};

type ParcelPatchBody = {
  action?: 'acceptRequest' | 'completeDelivery' | 'updateStatus';
  id?: string;
  otp?: string;
  status?: ParcelStatus;
  travelerName?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __srishlyParcels__: ParcelRecord[] | undefined;
}

function createOtp() {
  return `${Math.floor(1000 + Math.random() * 9000)}`;
}

function getParcelsStore() {
  if (!global.__srishlyParcels__) {
    global.__srishlyParcels__ = [
      {
        id: 'parcel-001',
        senderName: 'Jaydeep Kumar',
        senderPhone: '9876501234',
        parcelCategory: 'Documents',
        weight: 0.6,
        dimensions: 'Small',
        declaredValue: 'Up to Rs 500',
        pickupAddress: 'Connaught Place, New Delhi',
        dropoffAddress: 'Gomti Nagar, Lucknow',
        reward: 420,
        status: 'requested',
        fromCity: 'Delhi',
        toCity: 'Lucknow',
        pickupDate: '2026-03-28',
        pickupLocation: 'Gate 3, Rajiv Chowk Metro, Delhi',
        createdAt: new Date().toISOString(),
        description: 'Urgent paperwork for same-day handoff.',
        receiverName: 'Raghav Sharma',
        receiverPhone: '9988776655',
        receiverAddress: 'Gomti Nagar Extension, Lucknow',
        photoNames: ['invoice-front.jpg'],
      },
    ];
  }

  return global.__srishlyParcels__;
}

export default function handler(request: ApiRequest, response: ApiResponse) {
  if (!request.method || !['GET', 'POST', 'PATCH'].includes(request.method)) {
    return response.status(405).json({ error: 'Method not allowed. Expected one of: GET, POST, PATCH.' });
  }

  const parcels = getParcelsStore();

  if (request.method === 'GET') {
    return response.status(200).json(parcels);
  }

  if (request.method === 'POST') {
    const body = (request.body ?? {}) as Partial<ParcelRecord>;
    const parcel: ParcelRecord = {
      id: `parcel-${Date.now()}`,
      senderName: 'Current Sender',
      senderPhone: '9876500011',
      parcelCategory: body.parcelCategory ?? 'General',
      weight: Number(body.weight ?? 1),
      dimensions: body.dimensions ?? 'Small',
      declaredValue: body.declaredValue ?? 'Up to Rs 500',
      pickupAddress: body.pickupAddress ?? 'Pending',
      dropoffAddress: body.dropoffAddress ?? 'Pending',
      reward: Number(body.reward ?? 200),
      status: 'requested',
      fromCity: body.fromCity ?? 'Delhi',
      toCity: body.toCity ?? 'Noida',
      pickupDate: body.pickupDate ?? new Date().toISOString().slice(0, 10),
      pickupLocation: body.pickupLocation ?? 'Pending pickup point',
      createdAt: new Date().toISOString(),
      description: body.description ?? '',
      receiverName: body.receiverName ?? 'Receiver',
      receiverPhone: body.receiverPhone ?? '9876543210',
      receiverAddress: body.receiverAddress ?? 'Pending receiver address',
      photoNames: Array.isArray(body.photoNames) ? (body.photoNames as string[]) : [],
    };

    parcels.unshift(parcel);
    return response.status(201).json(parcel);
  }

  const body = (request.body ?? {}) as ParcelPatchBody;
  if (!body.id) {
    return response.status(400).json({ error: 'Parcel id is required.' });
  }

  const target = parcels.find((item) => item.id === body.id);
  if (!target) {
    return response.status(404).json({ error: 'Parcel could not be found.' });
  }

  if (body.action === 'completeDelivery') {
    if (target.status !== 'in_transit') {
      return response.status(400).json({ error: 'Delivery can be completed only after transit has started.' });
    }

    if (!body.otp || body.otp !== target.otpCode) {
      return response.status(400).json({ error: 'The delivery code does not match this parcel.' });
    }

    target.status = 'delivered';
    target.deliveredAt = new Date().toISOString();
    return response.status(200).json(target);
  }

  if (body.action === 'acceptRequest') {
    if (target.status !== 'requested') {
      return response.status(400).json({ error: 'This parcel request is no longer open for acceptance.' });
    }

    target.status = 'accepted';
    target.travelerName = body.travelerName ?? 'Traveler';
    target.travelerPhone = '9876500022';
    target.travelerVerificationStatus = 'aadhaar_verified';
    target.travelerRating = 4.7;
    target.orderStartedAt = new Date().toISOString();
    return response.status(200).json(target);
  }

  if (body.action === 'updateStatus' && body.status) {
    if (body.status === 'delivered') {
      return response.status(400).json({ error: 'Use OTP verification to complete delivery.' });
    }

    if (body.status === 'picked' && target.status !== 'accepted') {
      return response.status(400).json({ error: 'Pickup can start only after a traveler accepts the request.' });
    }

    if (body.status === 'in_transit' && target.status !== 'picked') {
      return response.status(400).json({ error: 'Start transit only after pickup is confirmed.' });
    }

    if (body.status !== 'picked' && body.status !== 'in_transit') {
      return response.status(400).json({ error: 'Unsupported parcel status transition.' });
    }

    target.status = body.status;

    if (body.status === 'picked') {
      target.pickedAt = new Date().toISOString();
      target.otpCode = createOtp();
    }

    if (body.status === 'in_transit') {
      target.inTransitAt = new Date().toISOString();
    }

    return response.status(200).json(target);
  }

  return response.status(400).json({ error: 'Unsupported parcel update action.' });
}
