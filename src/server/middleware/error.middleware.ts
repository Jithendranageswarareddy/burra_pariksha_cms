/**
 * BURRA PARIKSHA CMS — Universal Global API Error Handler
 * Stage 27 Feature Contract: FC-003 (Database Abstraction & Universal API Envelopes)
 *
 * Catches all synchronous and asynchronous route exceptions:
 * - Maps AppError hierarchy deterministically to HTTP status codes
 * - Formats all errors into canonical ApiResponseEnvelope
 * - Sanitizes database drivers and stack traces in production
 * - Enforces standard FC-003 status code contract:
 *     400 -> VALIDATION_ERROR
 *     401 -> UNAUTHENTICATED
 *     403 -> FORBIDDEN_LACKS_CAPABILITY
 *     404 -> RESOURCE_NOT_FOUND
 *     409 -> CONFLICT_OPTIMISTIC_LOCK / CONCURRENCY_CONFLICT
 *     422 -> BUSINESS_RULE_VIOLATION
 *     429 -> RATE_LIMIT_EXCEEDED
 *     500 -> INTERNAL_SERVER_ERROR (Sanitized)
 */

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../lib/errors';
import { createErrorResponse, ApiErrorCode } from '../../types/api-contracts';

export const globalErrorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const requestId =
    (req.headers['x-request-id'] as string) ||
    (res.getHeader('X-Request-Id') as string) ||
    `req_${Date.now()}`;

  let statusCode = 500;
  let errorCode: string = ApiErrorCode.INTERNAL_SERVER_ERROR;
  let message = 'An internal server error occurred.';
  let details: any = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = ApiErrorCode.VALIDATION_ERROR;
    message = 'Validation failed for the supplied input.';
    details = err.issues.map((i) => ({
      field: i.path.join('.') || 'root',
      issue: i.message,
    }));
  } else if (err?.statusCode || err?.status) {
    statusCode = err.statusCode || err.status;
    errorCode = err.code || (statusCode === 409 ? ApiErrorCode.CONFLICT_OPTIMISTIC_LOCK : 'API_ERROR');
    message = err.message || message;
    details = err.details || null;
  } else if (err?.name === 'UnauthenticatedActorError') {
    statusCode = 401;
    errorCode = ApiErrorCode.UNAUTHENTICATED;
    message = err.message;
  } else {
    // Non-operational or unhandled exception
    console.error(`[UnhandledError][${requestId}]`, err);
    if (process.env.NODE_ENV !== 'production' && err?.message) {
      message = err.message;
    }
  }

  const envelope = createErrorResponse(errorCode, message, requestId, details);
  res.status(statusCode).json(envelope);
};
