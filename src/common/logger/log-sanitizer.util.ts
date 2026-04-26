const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function sanitizeForLogging<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLogging(item)) as T;
  }

  if (!isObject(value)) {
    return value;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    sanitized[key] = sanitizeForLogging(nestedValue);
  }

  return sanitized as T;
}