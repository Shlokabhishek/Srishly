import type { VercelRequest, VercelResponse } from '@vercel/node';

import { assertMethod, sendError, sendJson } from './_lib/http';
import { listVerificationCases, reviewVerificationCaseRecord } from './_lib/repository';
import type { ReviewAction } from '../src/types';

interface VerificationPatchBody {
  id?: string;
  action?: ReviewAction;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    assertMethod(request.method, ['GET', 'PATCH']);

    if (request.method === 'GET') {
      return sendJson(response, 200, await listVerificationCases());
    }

    const body = (request.body ?? {}) as VerificationPatchBody;

    if (!body.id || !body.action) {
      return sendJson(response, 400, { error: 'Verification case id and action are required.' });
    }

    const reviewed = await reviewVerificationCaseRecord(body.id, body.action);
    return sendJson(response, 200, reviewed);
  } catch (error) {
    return sendError(response, error);
  }
}
