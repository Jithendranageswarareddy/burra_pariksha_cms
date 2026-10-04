/**
 * BURRA PARIKSHA CMS — Application Error Model
 * Stage 27 Feature Contract: FC-003 (Database Abstraction & Universal API Envelopes)
 *
 * Implements authoritative application error hierarchy:
 * - AppError (Base operational error class)
 * - NotFoundError (HTTP 404)
 * - ValidationError (HTTP 400)
 * - ConcurrencyConflictError (HTTP 409)
 * - UnauthorizedError (HTTP 401)
 * - ForbiddenError (HTTP 403)
 * - BusinessInvariantError (HTTP 422)
 * - RateLimitExceededError (HTTP 429)
 * - InternalServerError (HTTP 500)
 *
 * Prevents information leakage: Stack traces & low-level driver errors sanitized in production.
 */

export interface FieldValidationError {
  field: string;
  issue: string;
}

export type ErrorDetails =
  | FieldValidationError[]
  | Record<string, unknown>
  | null;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: ErrorDetails;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    options: {
      statusCode: number;
      code: string;
      details?: ErrorDetails;
      isOperational?: boolean;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details ?? null;
    this.isOperational = options.isOperational ?? true;

    // Maintain V8 stack trace capture
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = 'Requested resource not found or has been deleted.',
    details?: ErrorDetails
  ) {
    super(message, {
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND',
      details,
    });
  }
}

export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed for the supplied input.',
    details?: ErrorDetails
  ) {
    super(message, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details,
    });
  }
}

export class ConcurrencyConflictError extends AppError {
  public readonly resourceName?: string;
  public readonly resourceId?: string;
  public readonly expectedVersion?: number;
  public readonly currentVersion?: number;

  constructor(
    resourceOrMessage: string,
    idOrExpectedVersion?: string | number,
    expectedOrCurrentVersion?: number,
    currentVersion?: number
  ) {
    if (typeof idOrExpectedVersion === 'string') {
      const resource = resourceOrMessage;
      const id = idOrExpectedVersion;
      const expVer = expectedOrCurrentVersion as number;
      const curVer = currentVersion as number;
      const message = `Optimistic concurrency conflict on '${resource}' [${id}]: expected version ${expVer}, but current version is ${curVer}.`;

      super(message, {
        statusCode: 409,
        code: 'CONFLICT_OPTIMISTIC_LOCK',
        details: {
          resource,
          id,
          expectedVersion: expVer,
          currentVersion: curVer,
        },
      });
      this.resourceName = resource;
      this.resourceId = id;
      this.expectedVersion = expVer;
      this.currentVersion = curVer;
    } else {
      const message = resourceOrMessage || 'Optimistic concurrency conflict: entity was modified concurrently.';
      const expVer = typeof idOrExpectedVersion === 'number' ? idOrExpectedVersion : undefined;
      const curVer = typeof expectedOrCurrentVersion === 'number' ? expectedOrCurrentVersion : undefined;

      super(message, {
        statusCode: 409,
        code: 'CONFLICT_OPTIMISTIC_LOCK',
        details: expVer !== undefined || curVer !== undefined ? { expectedVersion: expVer, currentVersion: curVer } : null,
      });
      this.expectedVersion = expVer;
      this.currentVersion = curVer;
    }
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = 'Authentication required. Verified session context is missing or invalid.',
    details?: ErrorDetails
  ) {
    super(message, {
      statusCode: 401,
      code: 'UNAUTHENTICATED',
      details,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = 'Forbidden: insufficient capability or role permissions for this resource.',
    details?: ErrorDetails
  ) {
    super(message, {
      statusCode: 403,
      code: 'FORBIDDEN_LACKS_CAPABILITY',
      details,
    });
  }
}

export class BusinessInvariantError extends AppError {
  constructor(
    message = 'Business rule invariant violation.',
    details?: ErrorDetails
  ) {
    super(message, {
      statusCode: 422,
      code: 'BUSINESS_RULE_VIOLATION',
      details,
    });
  }
}

export class InvalidWorkflowTransitionError extends AppError {
  constructor(
    message = 'Invalid workflow state transition.',
    details?: ErrorDetails
  ) {
    super(message, {
      statusCode: 422,
      code: 'INVALID_WORKFLOW_TRANSITION',
      details,
    });
  }
}

export class RateLimitExceededError extends AppError {
  constructor(
    message = 'Too many requests. Rate limit exceeded, please retry later.',
    details?: ErrorDetails
  ) {
    super(message, {
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      details,
    });
  }
}

export class InternalServerError extends AppError {
  constructor(
    message = 'An internal server error occurred.',
    details?: ErrorDetails
  ) {
    super(message, {
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      details,
      isOperational: false,
    });
  }
}
