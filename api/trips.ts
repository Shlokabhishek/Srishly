import { assertMethod, sendError, sendJson, type ApiRequest, type ApiResponse } from './_lib/http';

export default async function handler(request: ApiRequest, response: ApiResponse) {
  try {
    assertMethod(request.method, ['GET']);
    const { listTrips } = await import('./_lib/repository');
    return sendJson(response, 200, await listTrips());
  } catch (error) {
    return sendError(response, error);
  }
}
