import { sendJson, type ApiRequest, type ApiResponse } from './_lib/http';

export default async function handler(_request: ApiRequest, response: ApiResponse) {
  try {
    await import('./_lib/mongodb');
    return sendJson(response, 200, {
      ok: true,
      source: 'mongodb-check',
      import: 'ok',
    });
  } catch (error) {
    return sendJson(response, 500, {
      ok: false,
      source: 'mongodb-check',
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
