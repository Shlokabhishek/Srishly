import { assertMethod, sendError, sendJson, type ApiRequest, type ApiResponse } from '../server/apiHttp';
import { getDashboardSnapshotRecord } from '../server/repository';

export default async function handler(request: ApiRequest, response: ApiResponse) {
  try {
    assertMethod(request.method, ['GET']);
    return sendJson(response, 200, await getDashboardSnapshotRecord());
  } catch (error) {
    return sendError(response, error);
  }
}
