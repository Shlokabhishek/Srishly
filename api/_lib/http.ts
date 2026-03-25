import type { VercelResponse } from '@vercel/node';

export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function sendJson(response: VercelResponse, statusCode: number, body: unknown) {
  response.status(statusCode).json(body);
}

export function sendError(response: VercelResponse, error: unknown) {
  if (error instanceof ApiError) {
    if (error.statusCode >= 500) {
      console.error('[api] handled ApiError', {
        statusCode: error.statusCode,
        message: error.message,
      });
    }

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
    throw new ApiError(405, `Method not allowed. Expected one of: ${allowedMethods.join(', ')}.`);
  }
}
