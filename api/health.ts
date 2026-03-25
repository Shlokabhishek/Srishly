import type { VercelRequest, VercelResponse } from '@vercel/node';

import { ApiError, assertMethod, sendJson } from './_lib/http';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    assertMethod(request.method, ['GET']);

    const { checkMongoHealth } = await import('./_lib/mongodb');
    const mongodb = await checkMongoHealth();
    return sendJson(response, 200, {
      ok: true,
      mongodb: {
        ok: true,
        ...mongodb,
      },
    });
  } catch (error) {
    const statusCode = error instanceof ApiError ? error.statusCode : 503;
    const message = error instanceof ApiError ? error.message : 'MongoDB connection failed.';

    return sendJson(response, statusCode, {
      ok: false,
      mongodb: {
        ok: false,
        error: message,
      },
    });
  }
}
