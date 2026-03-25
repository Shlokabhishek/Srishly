import type { VercelRequest, VercelResponse } from '@vercel/node';

import { assertMethod, sendError, sendJson } from './_lib/http';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    assertMethod(request.method, ['GET']);
    const { listTrips } = await import('./_lib/repository');
    return sendJson(response, 200, await listTrips());
  } catch (error) {
    return sendError(response, error);
  }
}
