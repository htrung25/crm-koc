import { Request } from 'express';

export function extractClientIp(req: Request): string {
  return (
    req.ip ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '0.0.0.0'
  );
}
