/**
 * BURRA PARIKSHA CMS — Request ID & Observability Correlation Middleware
 * Stage 27 Feature Contract: FC-003 (Database Abstraction & Universal API Envelopes)
 *
 * Guarantees every incoming API request has a verified correlation ID:
 * - Reads X-Request-ID header if supplied
 * - Generates canonical request ID if absent
 * - Echoes X-Request-ID response header
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string);
  const requestId = existingId && existingId.trim() !== '' ? existingId.trim() : `req_${randomUUID().slice(0, 8)}`;

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}
