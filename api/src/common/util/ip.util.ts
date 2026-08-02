import { Request } from 'express';

/**
 * Extract the real client IP, respecting reverse-proxy X-Forwarded-For headers.
 * Requires `app.set('trust proxy', 1)` in main.ts so Express populates req.ip correctly.
 */
export function extractClientIp(req: Request): string {
  return (
    req.ip ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '0.0.0.0'
  );
}
