type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (statusCode: number) => {
    json: (body: unknown) => void;
  };
};

type VerificationCaseRecord = {
  id: string;
  travelerName: string;
  route: string;
  idType: string;
  submittedAt: string;
  city: string;
  status: 'pending' | 'approved' | 'rejected';
};

type VerificationPatchBody = {
  id?: string;
  action?: VerificationCaseRecord['status'];
};

declare global {
  // eslint-disable-next-line no-var
  var __srishlyVerificationCases__: VerificationCaseRecord[] | undefined;
}

function getVerificationCasesStore() {
  if (!global.__srishlyVerificationCases__) {
    global.__srishlyVerificationCases__ = [
      {
        id: 'verify-001',
        travelerName: 'Amit R.',
        route: 'Delhi -> Lucknow',
        idType: 'Aadhaar Card',
        submittedAt: new Date().toISOString(),
        city: 'New Delhi',
        status: 'pending',
      },
    ];
  }

  return global.__srishlyVerificationCases__;
}

export default function handler(request: ApiRequest, response: ApiResponse) {
  if (!request.method || !['GET', 'PATCH'].includes(request.method)) {
    return response.status(405).json({ error: 'Method not allowed. Expected one of: GET, PATCH.' });
  }

  const records = getVerificationCasesStore();

  if (request.method === 'GET') {
    return response.status(200).json(records);
  }

  const body = (request.body ?? {}) as VerificationPatchBody;
  if (!body.id || !body.action) {
    return response.status(400).json({ error: 'Verification case id and action are required.' });
  }

  const item = records.find((record) => record.id === body.id);
  if (!item) {
    return response.status(404).json({ error: 'Verification case could not be found.' });
  }

  item.status = body.action;
  return response.status(200).json(item);
}
