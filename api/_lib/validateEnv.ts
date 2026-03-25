import { ApiError } from './http';

const REQUIRED_ENV_VARS = ['MONGODB_URI'] as const;

export function validateEnvironment() {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new ApiError(500, `Missing required environment variables: ${missing.join(', ')}.`);
  }
}
