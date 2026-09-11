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
 * Sanitizes any potential API key or provider credential from error messages.
 * Matches Google/Gemini (AIza...), Anthropic (sk-ant-...), Groq (gsk_...),
 * and OpenAI/generic (sk-...) keys.
 */
export function sanitizeKeyInMessage(message: string): string {
  if (!message || typeof message !== 'string') return '';
  return message
    .replace(/AIza[0-9A-Za-z\-_]{35}/g, '[REDACTED_KEY]')
    .replace(/sk-ant-[0-9A-Za-z\-_]{16,}/g, '[REDACTED_KEY]')
    .replace(/gsk_[0-9A-Za-z\-_]{16,}/g, '[REDACTED_KEY]')
    .replace(/sk-[0-9A-Za-z\-_]{16,}/g, '[REDACTED_KEY]');
}

/**
 * Classifies AI provider errors and determines if the error is retryable.
 * Quota and auth errors are explicitly non-retryable to prevent rapid hammering.
 */
export function classifyAIError(err: any): ClassifiedAIError {
  const rawMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err || 'Unknown error'));
  const causeStr = err?.cause ? (typeof err.cause === 'object' ? (err.cause.message || err.cause.code || JSON.stringify(err.cause)) : String(err.cause)) : '';
  const sanitizedMessage = sanitizeKeyInMessage(rawMsg);
  const errStr = (sanitizedMessage + ' ' + causeStr + ' ' + (err?.status || '') + ' ' + (err?.code || '')).toLowerCase();

  // 1. Quota / Rate Limit (strictly non-retryable)
  if (
    errStr.includes('429') ||
    errStr.includes('resource_exhausted') ||
    errStr.includes('quota') ||
    errStr.includes('exceeded your current quota') ||
    errStr.includes('rate_limit') ||
    errStr.includes('rate limit') ||
    errStr.includes('too many requests')
  ) {
    if ((errStr.includes('rate_limit') || errStr.includes('rate limit') || errStr.includes('too many requests')) && !errStr.includes('quota') && !errStr.includes('resource_exhausted')) {
      return {
        classification: 'RATE_LIMIT',
        isRetryable: false, // strictly non-retryable
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

  // 4. Common Network / Connection Failures (ECONNRESET, ETIMEDOUT, socket timeout, etc.) & Transient Provider Errors
  if (
    errStr.includes('econnreset') ||
    errStr.includes('etimedout') ||
    errStr.includes('connection reset') ||
    errStr.includes('socket timeout') ||
    errStr.includes('socket hung up') ||
    errStr.includes('econnrefused') ||
    errStr.includes('ehostunreach') ||
    errStr.includes('enetunreach') ||
    errStr.includes('wsarecv') ||
    errStr.includes('wsasend') ||
    errStr.includes('network error') ||
    errStr.includes('fetch failed') ||
    errStr.includes('500') ||
    errStr.includes('503') ||
    errStr.includes('unavailable') ||
    errStr.includes('high demand') ||
    errStr.includes('internal')
  ) {
    const isTimeout = errStr.includes('etimedout') || errStr.includes('socket timeout');
    return {
      classification: 'TRANSIENT_ERROR',
      isRetryable: true,
      statusCode: errStr.includes('503') ? 503 : (isTimeout ? 504 : 500),
      sanitizedMessage,
      originalError: err,
    };
  }

  // 5. Generic Timeout
  if (errStr.includes('timeout') || errStr.includes('timed out') || errStr.includes('deadline_exceeded')) {
    return {
      classification: 'TIMEOUT',
      isRetryable: true,
      statusCode: 504,
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
