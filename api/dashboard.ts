import { assertMethod, sendError, sendJson, type ApiRequest, type ApiResponse } from './lib/http';

export default async function handler(request: ApiRequest, response: ApiResponse) {
  try {
    assertMethod(request.method, ['GET']);
    const { getDashboardSnapshotRecord } = await import('./lib/repository');
    return sendJson(response, 200, await getDashboardSnapshotRecord());
  } catch (error) {
    return sendError(response, error);
  }
}
