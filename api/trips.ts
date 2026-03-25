import { assertMethod, sendError, sendJson, type ApiRequest, type ApiResponse } from './lib/apiHttp';

export default async function handler(request: ApiRequest, response: ApiResponse) {
  try {
    assertMethod(request.method, ['GET']);
    const { listTrips } = await import('./lib/repository');
    return sendJson(response, 200, await listTrips());
  } catch (error) {
    return sendError(response, error);
  }
}
