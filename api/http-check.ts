import { assertMethod, sendJson, type ApiRequest, type ApiResponse } from './lib/http';

export default function handler(request: ApiRequest, response: ApiResponse) {
  assertMethod(request.method, ['GET']);
  return sendJson(response, 200, {
    ok: true,
    source: 'http-check',
  });
}
