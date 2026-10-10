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

export class ReferenceIntegrityError extends AppError {
  constructor(message = 'Reference integrity violation.', details?: ErrorDetails) {
    super(message, {
      statusCode: 400,
      code: 'REFERENCE_INTEGRITY_ERROR',
      details,
    });
  }
}

export class SequenceAllocationError extends AppError {
  constructor(entityType: string, reason: string) {
    super(`Failed to allocate sequence ID for entity type "${entityType}": ${reason}`, {
      statusCode: 500,
      code: 'SEQUENCE_ALLOCATION_ERROR',
      details: { entityType, reason },
    });
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, {
      statusCode: 400,
      code: 'CONFIGURATION_ERROR',
      details,
    });
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Unauthorized operation', details?: ErrorDetails) {
    super(message, {
      statusCode: 403,
      code: 'AUTHORIZATION_ERROR',
      details,
    });
  }
}

export class IdempotencyConflictError extends AppError {
  constructor(
    message = 'Idempotency key has already been used with a different request payload',
    details?: ErrorDetails
  ) {
    super(message, {
      statusCode: 409,
      code: 'IDEMPOTENCY_CONFLICT',
      details,
    });
  }
}

export class RecoveryOperationError extends AppError {
  constructor(message: string, details?: ErrorDetails) {
    super(message, {
      statusCode: 500,
      code: 'RECOVERY_OPERATION_ERROR',
      details,
    });
  }
}

export class GoogleAuthError extends AppError {
  constructor(
    message = 'Google credentials missing or invalid',
    details?: ErrorDetails
  ) {
    super(message, {
      statusCode: 401,
      code: 'GOOGLE_AUTH_ERROR',
      details,
    });
  }
}

export type ErrorClassification = 'TRANSIENT' | 'NON_TRANSIENT';

/**
 * Sanitizes messages to guarantee private keys, tokens, or credentials are NEVER exposed.
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') return '';
  return message
    .replace(/-----BEGIN[ A-Z_-]*KEY-----[\s\S]*?-----END[ A-Z_-]*KEY-----/gi, '[REDACTED_PRIVATE_KEY]')
    .replace(/private_?key["':\s=]+("[^"]+"|[^\s,]+)/gi, 'private_key: [REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED]')
    .replace(/ya29\.[A-Za-z0-9-_.]+/gi, '[REDACTED_TOKEN]')
    .replace(/token["':\s=]+("[^"]+"|[^\s,]+)/gi, 'token: [REDACTED]')
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
    .replace(/client_?secret["':\s=]+("[^"]+"|[^\s,]+)/gi, 'client_secret: [REDACTED]')
    .replace(/access_?token["':\s=]+("[^"]+"|[^\s,]+)/gi, 'access_token: [REDACTED]');
}

/**
 * Classifies an error as TRANSIENT vs NON_TRANSIENT.
 */
export function classifyError(err: unknown): ErrorClassification {
  if (!err) return 'NON_TRANSIENT';

  if (err instanceof RateLimitExceededError) {
    return 'TRANSIENT';
  }

  if (
    err instanceof GoogleAuthError ||
    err instanceof ReferenceIntegrityError ||
    err instanceof ValidationError ||
    err instanceof IdempotencyConflictError ||
    err instanceof AuthorizationError ||
    err instanceof ConfigurationError ||
    err instanceof ForbiddenError ||
    err instanceof UnauthorizedError ||
    err instanceof NotFoundError
  ) {
    return 'NON_TRANSIENT';
  }

  const anyErr = err as any;
  const status = Number(anyErr?.statusCode || anyErr?.status || anyErr?.code);
  const msg = String(anyErr?.message || anyErr || '').toLowerCase();

  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return 'TRANSIENT';
  }
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return 'NON_TRANSIENT';
  }

  if (
    msg.includes('rate limit') ||
    msg.includes('quota exceeded') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('econnrefused') ||
    msg.includes('network error') ||
    msg.includes('socket hang up') ||
    msg.includes('backend error') ||
    msg.includes('service unavailable') ||
    msg.includes('timed out') ||
    msg.includes('timeout')
  ) {
    return 'TRANSIENT';
  }

  return 'NON_TRANSIENT';
}

/**
 * Sanitizes an error for safe exposure to clients and logs.
 */
export function sanitizeError(err: unknown): {
  name: string;
  code: string;
  statusCode: number;
  message: string;
  isTransient: boolean;
  classification: ErrorClassification;
} {
  const isErr = err instanceof Error;
  const rawMsg = isErr ? err.message : String(err);
  const sanitizedMsg = sanitizeErrorMessage(rawMsg);
  const classification = classifyError(err);
  const anyErr = err as any;

  const code = anyErr?.code || (err instanceof AppError ? err.code : 'UNKNOWN_ERROR');
  const statusCode = Number(anyErr?.statusCode || anyErr?.status || (err instanceof AppError ? err.statusCode : 500));
  const name = isErr ? err.name : 'UnknownError';

  return {
    name,
    code,
    statusCode,
    message: sanitizedMsg,
    isTransient: classification === 'TRANSIENT',
    classification,
  };
}

