/**
 * BURRA PARIKSHA CMS - Google Sheets Error Definitions
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

export class GoogleSheetsError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string = 'GOOGLE_SHEETS_ERROR', statusCode: number = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = 'GoogleSheetsError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GoogleAuthError extends GoogleSheetsError {
  constructor(message: string = 'Google Service Account credentials missing or invalid', details?: Record<string, unknown>) {
    super(message, 'GOOGLE_AUTH_ERROR', 401, details);
    this.name = 'GoogleAuthError';
  }
}

export class SpreadsheetNotFoundError extends GoogleSheetsError {
  constructor(spreadsheetId: string) {
    super(
      `Google Spreadsheet with ID "${spreadsheetId}" was not found or the service account does not have edit access.`,
      'SPREADSHEET_NOT_FOUND',
      404,
      { spreadsheetId }
    );
    this.name = 'SpreadsheetNotFoundError';
  }
}

export class WorksheetNotFoundError extends GoogleSheetsError {
  constructor(sheetName: string) {
    super(
      `Worksheet tab "${sheetName}" does not exist in the configured spreadsheet.`,
      'WORKSHEET_NOT_FOUND',
      404,
      { sheetName }
    );
    this.name = 'WorksheetNotFoundError';
  }
}

export class MissingHeaderError extends GoogleSheetsError {
  constructor(sheetName: string, missingHeaders: string[]) {
    super(
      `Worksheet "${sheetName}" is missing required header(s): ${missingHeaders.join(', ')}`,
      'MISSING_HEADER_ERROR',
      400,
      { sheetName, missingHeaders }
    );
    this.name = 'MissingHeaderError';
  }
}

export class SchemaMismatchError extends GoogleSheetsError {
  constructor(sheetName: string, reason: string, details?: Record<string, unknown>) {
    super(
      `Schema mismatch in worksheet "${sheetName}": ${reason}`,
      'SCHEMA_MISMATCH_ERROR',
      400,
      { sheetName, ...details }
    );
    this.name = 'SchemaMismatchError';
  }
}

export class ReferenceIntegrityError extends GoogleSheetsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'REFERENCE_INTEGRITY_ERROR', 400, details);
    this.name = 'ReferenceIntegrityError';
  }
}

export class ValidationError extends GoogleSheetsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends GoogleSheetsError {
  constructor(message: string = 'Resource not found', details?: Record<string, unknown>) {
    super(message, 'NOT_FOUND_ERROR', 404, details);
    this.name = 'NotFoundError';
  }
}

export class SequenceAllocationError extends GoogleSheetsError {
  constructor(entityType: string, reason: string) {
    super(
      `Failed to allocate sequence ID for entity type "${entityType}": ${reason}`,
      'SEQUENCE_ALLOCATION_ERROR',
      500,
      { entityType, reason }
    );
    this.name = 'SequenceAllocationError';
  }
}

export class RateLimitError extends GoogleSheetsError {
  constructor(retryAfterMs?: number) {
    super(
      'Google Sheets API rate limit reached. Please retry after a few moments.',
      'RATE_LIMIT_ERROR',
      429,
      { retryAfterMs }
    );
    this.name = 'RateLimitError';
  }
}

export class GoogleSheetsApiError extends GoogleSheetsError {
  constructor(message: string, statusCode: number = 500, details?: Record<string, unknown>) {
    super(message, 'GOOGLE_SHEETS_API_ERROR', statusCode, details);
    this.name = 'GoogleSheetsApiError';
  }
}

export class RequestTimeoutError extends GoogleSheetsError {
  constructor(timeoutMs: number, operation?: string) {
    super(
      `Google Sheets request timed out after ${timeoutMs}ms${operation ? ` during ${operation}` : ''}.`,
      'REQUEST_TIMEOUT_ERROR',
      504,
      { timeoutMs, operation }
    );
    this.name = 'RequestTimeoutError';
  }
}

export class TransientGoogleSheetsError extends GoogleSheetsError {
  constructor(message: string, statusCode: number = 503, details?: Record<string, unknown>) {
    super(
      message || 'Temporary Google Sheets service disruption. The operation will be automatically retried.',
      'TRANSIENT_GOOGLE_SHEETS_ERROR',
      statusCode,
      details
    );
    this.name = 'TransientGoogleSheetsError';
  }
}

export class ConfigurationError extends GoogleSheetsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 400, details);
    this.name = 'ConfigurationError';
  }
}

export class RecoveryOperationError extends GoogleSheetsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RECOVERY_OPERATION_ERROR', 500, details);
    this.name = 'RecoveryOperationError';
  }
}

export class AuthorizationError extends GoogleSheetsError {
  constructor(message: string = 'Unauthorized operation', details?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
    this.name = 'AuthorizationError';
  }
}

export type ErrorClassification = 'TRANSIENT' | 'NON_TRANSIENT';

/**
 * Sanitizes messages to guarantee private keys, tokens, or credentials are NEVER exposed.
 */
export function sanitizeErrorMessage(message: string): string {
  if (!message || typeof message !== 'string') return '';
  return message
    // Redact RSA private keys
    .replace(/-----BEGIN[ A-Z_-]*KEY-----[\s\S]*?-----END[ A-Z_-]*KEY-----/gi, '[REDACTED_PRIVATE_KEY]')
    .replace(/private_?key["':\s=]+("[^"]+"|[^\s,]+)/gi, 'private_key: [REDACTED]')
    // Redact Bearer tokens, Google ya29 tokens, and API keys
    .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED]')
    .replace(/ya29\.[A-Za-z0-9-_.]+/gi, '[REDACTED_TOKEN]')
    .replace(/token["':\s=]+("[^"]+"|[^\s,]+)/gi, 'token: [REDACTED]')
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
    .replace(/client_?secret["':\s=]+("[^"]+"|[^\s,]+)/gi, 'client_secret: [REDACTED]')
    .replace(/access_?token["':\s=]+("[^"]+"|[^\s,]+)/gi, 'access_token: [REDACTED]');
}

/**
 * Classifies an error as TRANSIENT (safe to retry with backoff) vs NON_TRANSIENT (fail-fast).
 */
export function classifyError(err: unknown): ErrorClassification {
  if (!err) return 'NON_TRANSIENT';

  if (err instanceof RateLimitError || err instanceof TransientGoogleSheetsError || err instanceof RequestTimeoutError) {
    return 'TRANSIENT';
  }

  if (
    err instanceof GoogleAuthError ||
    err instanceof SpreadsheetNotFoundError ||
    err instanceof WorksheetNotFoundError ||
    err instanceof MissingHeaderError ||
    err instanceof SchemaMismatchError ||
    err instanceof ReferenceIntegrityError ||
    err instanceof ValidationError ||
    err instanceof AuthorizationError ||
    err instanceof ConfigurationError
  ) {
    return 'NON_TRANSIENT';
  }

  const anyErr = err as any;
  const status = Number(anyErr?.statusCode || anyErr?.status || anyErr?.code);
  const msg = String(anyErr?.message || anyErr || '').toLowerCase();

  // Status-based classification
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return 'TRANSIENT';
  }
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return 'NON_TRANSIENT';
  }

  // Pattern-based classification
  if (
    msg.includes('rate limit') ||
    msg.includes('quota exceeded') ||
    msg.includes('user rate limit exceeded') ||
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

  const code = anyErr?.code || (err instanceof GoogleSheetsError ? err.code : 'UNKNOWN_ERROR');
  const statusCode = Number(anyErr?.statusCode || anyErr?.status || 500);
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

