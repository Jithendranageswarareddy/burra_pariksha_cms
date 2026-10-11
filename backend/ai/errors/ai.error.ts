/**
 * BURRA PARIKSHA CMS - AI Provider Error Classification
 * Phase 6: AI Provider / Multi-Model Orchestration
 */

export type AIErrorClassification =
  | 'AUTH_ERROR'
  | 'INVALID_REQUEST'
  | 'QUOTA_EXHAUSTED'
  | 'RATE_LIMIT'
  | 'TRANSIENT_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN_ERROR';

export interface ClassifiedAIError {
  classification: AIErrorClassification;
  isRetryable: boolean;
  statusCode?: number;
  sanitizedMessage: string;
  originalError?: any;
}

/**
 * Sanitizes any potential API key from error messages.
 */
export function sanitizeKeyInMessage(message: string): string {
  if (!message) return '';
  return message
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]')
    .replace(/sk-[0-9A-Za-z-_]{32,}/g, '[REDACTED_KEY]');
}

/**
 * Classifies AI provider errors and determines if the error is retryable.
 * Quota and auth errors are explicitly non-retryable to prevent rapid hammering.
 */
export function classifyAIError(err: any): ClassifiedAIError {
  const rawMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err || 'Unknown error'));
  const sanitizedMessage = sanitizeKeyInMessage(rawMsg);
  const errStr = (sanitizedMessage + ' ' + (err?.status || '') + ' ' + (err?.code || '')).toLowerCase();

  // 1. Quota / Rate Limit
  if (
    errStr.includes('429') ||
    errStr.includes('resource_exhausted') ||
    errStr.includes('quota') ||
    errStr.includes('exceeded your current quota') ||
    errStr.includes('rate_limit')
  ) {
    if (errStr.includes('rate_limit') && !errStr.includes('quota')) {
      return {
        classification: 'RATE_LIMIT',
        isRetryable: false,
        statusCode: 429,
        sanitizedMessage,
        originalError: err,
      };
    }
    return {
      classification: 'QUOTA_EXHAUSTED',
      isRetryable: false, // NON-RETRYABLE on the same model to prevent rapid hammering
      statusCode: 429,
      sanitizedMessage,
      originalError: err,
    };
  }

  // 2. Auth / Permissions
  if (
    errStr.includes('401') ||
    errStr.includes('403') ||
    errStr.includes('unauthorized') ||
    errStr.includes('forbidden') ||
    errStr.includes('api_key') ||
    errStr.includes('api key') ||
    errStr.includes('invalid key') ||
    errStr.includes('permission_denied') ||
    errStr.includes('permission denied')
  ) {
    return {
      classification: 'AUTH_ERROR',
      isRetryable: false,
      statusCode: errStr.includes('403') ? 403 : 401,
      sanitizedMessage,
      originalError: err,
    };
  }

  // 3. Invalid Request
  if (
    errStr.includes('400') ||
    errStr.includes('invalid_argument') ||
    errStr.includes('bad request') ||
    errStr.includes('schema')
  ) {
    return {
      classification: 'INVALID_REQUEST',
      isRetryable: false,
      statusCode: 400,
      sanitizedMessage,
      originalError: err,
    };
  }

  // 4. Timeout
  if (errStr.includes('timeout') || errStr.includes('timed out') || errStr.includes('deadline_exceeded')) {
    return {
      classification: 'TIMEOUT',
      isRetryable: true,
      statusCode: 504,
      sanitizedMessage,
      originalError: err,
    };
  }

  // 5. Transient Provider Errors
  if (
    errStr.includes('500') ||
    errStr.includes('503') ||
    errStr.includes('unavailable') ||
    errStr.includes('high demand') ||
    errStr.includes('internal')
  ) {
    return {
      classification: 'TRANSIENT_ERROR',
      isRetryable: true,
      statusCode: errStr.includes('503') ? 503 : 500,
      sanitizedMessage,
      originalError: err,
    };
  }

  return {
    classification: 'UNKNOWN_ERROR',
    isRetryable: false,
    sanitizedMessage,
    originalError: err,
  };
}

export class AIProviderError extends Error {
  public readonly classification: AIErrorClassification;
  public readonly providerId: string;
  public readonly modelId: string;
  public readonly isRetryable: boolean;
  public readonly statusCode?: number;

  constructor(
    message: string,
    providerId: string,
    modelId: string,
    classification: AIErrorClassification,
    isRetryable: boolean,
    statusCode?: number
  ) {
    super(sanitizeKeyInMessage(message));
    this.name = 'AIProviderError';
    this.providerId = providerId;
    this.modelId = modelId;
    this.classification = classification;
    this.isRetryable = isRetryable;
    this.statusCode = statusCode;
  }
}
