/**
 * BURRA PARIKSHA CMS — Zod Request Validation Middleware
 * Stage 27 Feature Contract: FC-003 (Database Abstraction & Universal API Envelopes)
 *
 * Enforces strict input validation on HTTP request body, query, and params:
 * - Collects field-level issues into structured { field, issue } array
 * - Rejects malformed requests with HTTP 400 and VALIDATION_ERROR code
 * - Strips unknown malicious properties
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError, FieldValidationError } from '../../lib/errors';
import { createErrorResponse, ApiErrorCode } from '../../types/api-contracts';

export interface ValidationSchemas {
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
  params?: ZodSchema<any>;
}

export function validateRequest(schemas: ValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId =
      (req.headers['x-request-id'] as string) ||
      (res.getHeader('X-Request-Id') as string) ||
      `req_${Date.now()}`;
    const issues: FieldValidationError[] = [];

    if (schemas.params) {
      const result = await schemas.params.safeParseAsync(req.params);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          issues.push({
            field: `params.${issue.path.join('.') || 'root'}`,
            issue: issue.message,
          });
        });
      } else {
        req.params = result.data;
      }
    }

    if (schemas.query) {
      const result = await schemas.query.safeParseAsync(req.query);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          issues.push({
            field: `query.${issue.path.join('.') || 'root'}`,
            issue: issue.message,
          });
        });
      } else {
        req.query = result.data;
      }
    }

    if (schemas.body) {
      const result = await schemas.body.safeParseAsync(req.body);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          issues.push({
            field: issue.path.join('.') || 'body',
            issue: issue.message,
          });
        });
      } else {
        req.body = result.data;
      }
    }

    if (issues.length > 0) {
      const errorEnvelope = createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        'Validation failed for the supplied input.',
        requestId,
        issues
      );
      res.status(400).json(errorEnvelope);
      return;
    }

    next();
  };
}
