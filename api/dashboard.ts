type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  status: (statusCode: number) => {
    json: (body: unknown) => void;
  };
};

export default function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed. Expected one of: GET.' });
  }

  return response.status(200).json({
    parcels: [
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
        status: 'accepted',
        fromCity: 'Delhi',
        toCity: 'Lucknow',
        pickupDate: '2026-03-25',
        pickupLocation: 'Gate 3, Rajiv Chowk Metro, Delhi',
        createdAt: '2026-03-22T09:00:00.000Z',
        description: 'Urgent paperwork for same-day handoff.',
        receiverName: 'Raghav Sharma',
        receiverPhone: '9988776655',
        receiverAddress: 'Gomti Nagar Extension, Lucknow',
        photoNames: ['invoice-front.jpg'],
        travelerName: 'Amit R.',
        travelerPhone: '9812345678',
        travelerVerificationStatus: 'student_verified',
        travelerRating: 4.8,
        orderStartedAt: '2026-03-22T09:30:00.000Z',
      },
      {
        id: 'parcel-002',
        senderName: 'Priya Malhotra',
        senderPhone: '9955123456',
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
        pickupLocation: 'Noida Sector 62 Metro Exit 1',
        createdAt: '2026-03-21T15:30:00.000Z',
        description: 'Compact audio device in original packaging.',
        receiverName: 'Ananya Joshi',
        receiverPhone: '9900112233',
        receiverAddress: 'Indiranagar 100ft Road, Bangalore',
        photoNames: ['device-box.png', 'seal-check.png'],
        travelerName: 'Rahul S.',
        travelerPhone: '9822011122',
        travelerVerificationStatus: 'aadhaar_verified',
        travelerRating: 4.7,
        orderStartedAt: '2026-03-21T16:00:00.000Z',
        pickedAt: '2026-03-24T08:20:00.000Z',
        inTransitAt: '2026-03-24T09:40:00.000Z',
        otpCode: '4721',
      },
    ],
    trips: [
      {
        id: 'trip-001',
        travelerName: 'Amit R.',
        travelerPhone: '9812345678',
        verificationStatus: 'student_verified',
        rating: 4.8,
        successfulDeliveries: 18,
        fromCity: 'Noida',
        toCity: 'Kanpur',
        date: '2026-03-25',
        mode: 'car',
        availableSpace: 12,
        status: 'active',
        isVerified: true,
        trustScore: 92,
      },
    ],
    verificationCases: [
      {
        id: 'verify-001',
        travelerName: 'Amit R.',
        route: 'Noida -> Kanpur',
        idType: 'Aadhaar Card',
        submittedAt: '2026-03-23T13:15:00.000Z',
        city: 'Greater Noida',
        status: 'pending',
      },
    ],
    assignmentNotifications: [],
    deliveryThreads: [],
  });
}
