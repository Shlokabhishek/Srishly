export type ApiRequest = {
  method?: string;
  body?: unknown;
};

export type ApiResponse = {
  status: (statusCode: number) => {
    json: (body: unknown) => void;
  };
};

type ApiErrorLike = Error & {
  statusCode: number;
};

export function createApiError(statusCode: number, message: string): ApiErrorLike {
  const error = new Error(message) as ApiErrorLike;
  error.name = 'ApiError';
  error.statusCode = statusCode;
  return error;
}

export function isApiError(error: unknown): error is ApiErrorLike {
  if (!(error instanceof Error)) {
    return false;
  }

  return typeof (error as { statusCode?: unknown }).statusCode === 'number';
}

export function sendJson(response: ApiResponse, statusCode: number, body: unknown) {
  response.status(statusCode).json(body);
}

export function sendError(response: ApiResponse, error: unknown) {
  if (isApiError(error)) {
    return sendJson(response, error.statusCode, {
      error: error.message,
    });
  }

  console.error('[api] unhandled error', error);
  return sendJson(response, 500, {
    error: 'An unexpected server error occurred.',
  });
}

export function assertMethod(method: string | undefined, allowedMethods: string[]) {
  if (!method || !allowedMethods.includes(method)) {
    throw createApiError(405, `Method not allowed. Expected one of: ${allowedMethods.join(', ')}.`);
  }
}
