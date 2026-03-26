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
        status: 'posted',
      },
    ],
    trips: [
      {
        id: 'trip-001',
        status: 'active',
      },
    ],
    verificationCases: [
      {
        id: 'verify-001',
        status: 'pending',
      },
    ],
    assignmentNotifications: [],
    deliveryThreads: [],
  });
}
