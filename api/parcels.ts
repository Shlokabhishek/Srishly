type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (statusCode: number) => {
    json: (body: unknown) => void;
  };
};

type ParcelRecord = {
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

type ParcelPatchBody = {
  action?: 'acceptRequest' | 'completeDelivery' | 'updateStatus';
  id?: string;
  otp?: string;
  status?: ParcelRecord['status'];
  travelerName?: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __srishlyParcels__: ParcelRecord[] | undefined;
}

function getParcelsStore() {
  if (!global.__srishlyParcels__) {
    global.__srishlyParcels__ = [
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
        createdAt: new Date().toISOString(),
        description: 'Urgent paperwork for same-day handoff.',
        photoNames: ['invoice-front.jpg'],
        otpCode: '1934',
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
      parcelCategory: body.parcelCategory ?? 'General',
      weight: Number(body.weight ?? 1),
      dimensions: body.dimensions ?? 'Small',
      declaredValue: body.declaredValue ?? 'Up to Rs 500',
      pickupAddress: body.pickupAddress ?? 'Pending',
      dropoffAddress: body.dropoffAddress ?? 'Pending',
      reward: Number(body.reward ?? 200),
      status: 'posted',
      fromCity: body.fromCity ?? 'Delhi',
      toCity: body.toCity ?? 'Noida',
      pickupDate: body.pickupDate ?? new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      description: body.description ?? '',
      photoNames: Array.isArray(body.photoNames) ? (body.photoNames as string[]) : [],
      otpCode: `${Math.floor(1000 + Math.random() * 9000)}`,
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
    if (!body.otp || body.otp !== target.otpCode) {
      return response.status(400).json({ error: 'The delivery code does not match this parcel.' });
    }
    target.status = 'delivered';
    return response.status(200).json(target);
  }

  if (body.action === 'acceptRequest') {
    target.status = 'matched';
    target.travelerName = body.travelerName ?? 'Traveler';
    return response.status(200).json(target);
  }

  if (body.action === 'updateStatus' && body.status) {
    target.status = body.status;
    return response.status(200).json(target);
  }

  return response.status(400).json({ error: 'Unsupported parcel update action.' });
}
