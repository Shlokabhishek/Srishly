import type { VercelRequest, VercelResponse } from '@vercel/node';

import { assertMethod, sendError, sendJson } from './_lib/http';
import { listTrips } from './_lib/repository';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    assertMethod(request.method, ['GET']);
    return sendJson(response, 200, await listTrips());
  } catch (error) {
    return sendError(response, error);
  }
}
