/**
 * BURRA PARIKSHA CMS — Request ID & Distributed Tracing Correlation Middleware
 * Stage 27 Feature Contract: FC-004 (Audit Ledger & Observability)
 * Stage 21 Architectural Specification: BP-ARCH-21-AUDIT-OBSERVABILITY (Section 12)
 *
 * Guarantees every incoming API request has a verified correlation chain:
 * - Injects/validates X-Request-ID
 * - Injects/validates X-Trace-ID for distributed tracing
 * - Sets outbound correlation response headers
 * - Attaches correlation identifiers to Request context
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 1. Request ID correlation
  const existingReqId = (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string);
  const requestId = existingReqId && existingReqId.trim() !== '' ? existingReqId.trim() : `req_${randomUUID().slice(0, 8)}`;

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  (req as any).requestId = requestId;

  // 2. Distributed Trace ID correlation
  const existingTraceId = (req.headers['x-trace-id'] as string) || (req.headers['x-cloud-trace-context'] as string);
  const traceId = existingTraceId && existingTraceId.trim() !== '' ? existingTraceId.trim().split('/')[0] : `trc_${randomUUID().slice(0, 8)}`;

  req.headers['x-trace-id'] = traceId;
  res.setHeader('X-Trace-Id', traceId);
  (req as any).traceId = traceId;

  next();
}
