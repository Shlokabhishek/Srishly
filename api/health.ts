import { assertMethod, isApiError, sendJson, type ApiRequest, type ApiResponse } from './lib/apiHttp';

export default async function handler(request: ApiRequest, response: ApiResponse) {
  try {
    assertMethod(request.method, ['GET']);

    const { checkMongoHealth } = await import('./lib/mongodb');
    const mongodb = await checkMongoHealth();
    return sendJson(response, 200, {
      ok: true,
      mongodb: {
        ok: true,
        ...mongodb,
      },
    });
  } catch (error) {
    const statusCode = isApiError(error) ? error.statusCode : 503;
    const message = isApiError(error) ? error.message : 'MongoDB connection failed.';

    return sendJson(response, statusCode, {
      ok: false,
      mongodb: {
        ok: false,
        error: message,
      },
    });
  }
}
