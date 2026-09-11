/**
 * BURRA PARIKSHA CMS - AI Observability Telemetry Hooks
 * Phase 23: AI Quota Tracking & Daily Usage Observability
 * 
 * Internal adapter helpers enabling Gemini, Groq, and Blind Verifiers to construct
 * and emit canonical AIUsageEvents without coupling or mutating provider logic.
 */

import { AIUsageEvent, AIUsageOperation, SanitizedAIFailure } from './types';
import { AIErrorClassification } from '../error';
import { aiUsageStore, AIUsageStore } from './store';

export interface RecordAttemptParams {
  operation: AIUsageOperation;
  providerId: string;
  modelId: string;
  attemptNumber: number;
  fallbackUsed: boolean;
  success: boolean;
  latencyMs: number;
  requestId?: string | null;
  httpStatus?: number | null;
  errorCategory?: AIErrorClassification | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  timestamp?: string;
}

/**
 * Constructs a fully normalized canonical AIUsageEvent.
 * Enforces token nullability and ISO UTC timestamp formatting.
 */
export function buildUsageEvent(params: RecordAttemptParams): AIUsageEvent {
  const eventId = `ai_evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = params.timestamp || new Date().toISOString();

  // Normalize tokens: null if undefined or null, never estimate
  const inputTokens = params.inputTokens !== undefined ? params.inputTokens : null;
  const outputTokens = params.outputTokens !== undefined ? params.outputTokens : null;
  let totalTokens = params.totalTokens !== undefined ? params.totalTokens : null;

  if (totalTokens === null && inputTokens !== null && outputTokens !== null) {
    totalTokens = inputTokens + outputTokens;
  }

  return {
    eventId,
    timestamp,
    requestId: params.requestId ?? null,
    operation: params.operation,
    providerId: params.providerId.trim().toLowerCase(),
    modelId: params.modelId.trim(),
    attemptNumber: Math.max(1, params.attemptNumber),
    fallbackUsed: !!params.fallbackUsed,
    success: !!params.success,
    httpStatus: params.httpStatus !== undefined ? params.httpStatus : null,
    errorCategory: params.errorCategory || null,
    latencyMs: Math.max(0, Math.round(params.latencyMs)),
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

/**
 * Records a physical upstream attempt into the AI usage store.
 */
export function recordUsageAttempt(
  params: RecordAttemptParams,
  store: AIUsageStore = aiUsageStore
): AIUsageEvent {
  const event = buildUsageEvent(params);
  store.recordEvent(event);
  return event;
}

/**
 * Records an operation-level logical request into the AI usage store.
 */
export function recordLogicalRequest(
  operation: AIUsageOperation,
  success: boolean,
  requestId?: string | null,
  timestamp?: string,
  store: AIUsageStore = aiUsageStore
): void {
  store.recordLogicalRequest(operation, success, requestId, timestamp);
}

/**
 * Safely derives a SanitizedAIFailure from an event.
 */
export function sanitizeFailureEvent(event: AIUsageEvent): SanitizedAIFailure | null {
  if (event.success) return null;

  return {
    timestamp: event.timestamp,
    requestId: event.requestId || null,
    operation: event.operation,
    providerId: event.providerId,
    modelId: event.modelId,
    attemptNumber: event.attemptNumber,
    fallbackUsed: event.fallbackUsed,
    success: false,
    httpStatus: event.httpStatus || null,
    errorCategory: event.errorCategory || null,
    latencyMs: event.latencyMs,
  };
}
