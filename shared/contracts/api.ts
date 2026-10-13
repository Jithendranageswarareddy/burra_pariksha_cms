/**
 * BURRA PARIKSHA CMS — Universal API Envelopes & Response Contracts
 * Stage 27 Feature Contract: FC-003 (Universal API Response Envelope)
 */

export interface ResponsePaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponseMeta {
  requestId: string;
  timestamp: string;
  pagination?: ResponsePaginationMeta;
  executionDurationMs?: number;
  version?: number;
  [key: string]: unknown;
}

export type ApiSuccessMeta = ApiResponseMeta;

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Array<{ field: string; issue: string }> | Record<string, unknown> | null;
  timestamp?: string;
  requestId?: string;
}

export type ApiErrorDetails = ApiErrorPayload;

/**
 * Authoritative FC-003 Universal REST API Response Envelope
 */
export interface ApiResponseEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  meta?: ApiResponseMeta;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
  meta?: ApiResponseMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export enum ApiErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN_LACKS_CAPABILITY = 'FORBIDDEN_LACKS_CAPABILITY',
  FORBIDDEN_BY_SEGREGATION_OF_DUTIES = 'FORBIDDEN_BY_SEGREGATION_OF_DUTIES',
  FORBIDDEN_BY_AI_GATING = 'FORBIDDEN_BY_AI_GATING',
  FORBIDDEN_BY_BUSINESS_RULE = 'FORBIDDEN_BY_BUSINESS_RULE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT_OPTIMISTIC_LOCK = 'CONFLICT_OPTIMISTIC_LOCK',
  CONCURRENCY_CONFLICT = 'CONCURRENCY_CONFLICT',
  INVALID_WORKFLOW_TRANSITION = 'INVALID_WORKFLOW_TRANSITION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export const API_ERROR_HTTP_STATUS: Record<ApiErrorCode, number> = {
  [ApiErrorCode.UNAUTHENTICATED]: 401,
  [ApiErrorCode.FORBIDDEN_LACKS_CAPABILITY]: 403,
  [ApiErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES]: 403,
  [ApiErrorCode.FORBIDDEN_BY_AI_GATING]: 403,
  [ApiErrorCode.FORBIDDEN_BY_BUSINESS_RULE]: 400,
  [ApiErrorCode.VALIDATION_ERROR]: 400,
  [ApiErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ApiErrorCode.CONFLICT_OPTIMISTIC_LOCK]: 409,
  [ApiErrorCode.CONCURRENCY_CONFLICT]: 409,
  [ApiErrorCode.INVALID_WORKFLOW_TRANSITION]: 422,
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ApiErrorCode.INTERNAL_SERVER_ERROR]: 500,
};

export function createSuccessResponse<T>(
  data: T,
  requestId: string,
  extraMeta?: Partial<ApiResponseMeta>
): ApiSuccessResponse<T> {
  const timestamp = new Date().toISOString();
  return {
    success: true,
    data,
    meta: {
      timestamp,
      requestId,
      ...extraMeta,
    },
  };
}

export function createErrorResponse(
  code: ApiErrorCode | string,
  message: string,
  requestId: string,
  details?: Array<{ field: string; issue: string }> | Record<string, unknown> | null
): ApiErrorResponse {
  const timestamp = new Date().toISOString();
  return {
    success: false,
    error: {
      code,
      message,
      details: details ?? null,
      timestamp,
      requestId,
    },
    meta: {
      requestId,
      timestamp,
    },
  };
}
