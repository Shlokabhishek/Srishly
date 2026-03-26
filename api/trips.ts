import { assertMethod, sendError, sendJson, type ApiRequest, type ApiResponse } from '../server/apiHttp';
import { listTrips } from '../server/repository';

export default async function handler(request: ApiRequest, response: ApiResponse) {
  try {
    assertMethod(request.method, ['GET']);
    return sendJson(response, 200, await listTrips());
  } catch (error) {
    return sendError(response, error);
  }
}
