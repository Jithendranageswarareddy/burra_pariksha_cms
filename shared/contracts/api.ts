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
