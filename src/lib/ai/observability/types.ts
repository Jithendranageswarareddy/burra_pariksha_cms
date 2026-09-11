/**
 * BURRA PARIKSHA CMS - AI Observability & Quota Tracking Types
 * Phase 23: AI Quota Tracking & Daily Usage Observability
 * 
 * Canonical contracts for tracking actual AI usage, physical attempts,
 * logical operations, token accounting, and quota ceilings.
 * 
 * STRICT PRIVACY & ZERO-SECRET GUARANTEES:
 * Telemetry NEVER stores API keys, auth headers, raw prompts, completions, or PII.
 */

import { AIErrorClassification } from '../error';

export type AIUsageOperation = 'GENERATION' | 'VERIFICATION';

/**
 * Canonical AI Usage Event
 * Represents a single physical HTTP attempt to an upstream provider.
 */
export interface AIUsageEvent {
  /** Unique identifier for the telemetry event */
  eventId: string;
  /** ISO 8601 UTC timestamp of the attempt */
  timestamp: string;
  /** Optional correlation/request ID if available from the caller */
  requestId?: string | null;
  /** Logical operation type: GENERATION or VERIFICATION */
  operation: AIUsageOperation;
  /** Provider identifier (e.g., 'gemini', 'groq', 'xai') */
  providerId: string;
  /** Upstream model identifier (e.g., 'gemini-3.1-flash-lite', 'openai/gpt-oss-120b') */
  modelId: string;
  /** 1-based physical attempt number within this provider call cycle */
  attemptNumber: number;
  /** Whether this invocation occurred as a secondary/fallback provider */
  fallbackUsed: boolean;
  /** Whether the physical upstream call succeeded */
  success: boolean;
  /** Upstream HTTP status code if available (e.g., 200, 429, 500, 503) */
  httpStatus?: number | null;
  /** Canonical error classification if call failed */
  errorCategory?: AIErrorClassification | null;
  /** Round-trip execution latency in milliseconds */
  latencyMs: number;
  /** Input/prompt tokens consumed if provider reported it; null otherwise */
  inputTokens: number | null;
  /** Output/completion tokens consumed if provider reported it; null otherwise */
  outputTokens: number | null;
  /** Total tokens consumed if provider reported it; null otherwise */
  totalTokens: number | null;
}

/**
 * Aggregated physical metrics for a specific provider and model.
 */
export interface ProviderModelAggregate {
  /** Total physical upstream attempts executed */
  totalAttempts: number;
  /** Successful physical upstream calls */
  successfulAttempts: number;
  /** Failed physical upstream calls */
  failedAttempts: number;
  /** Physical attempts after the initial attempt within the same provider (attemptNumber > 1) */
  retryAttempts: number;
  /** Invocations occurring on fallback/secondary providers */
  fallbackInvocations: number;
  /** Cumulative known input tokens (excludes null values) */
  totalInputTokens: number;
  /** Cumulative known output tokens (excludes null values) */
  totalOutputTokens: number;
  /** Cumulative known total tokens (excludes null values) */
  totalTokens: number;
  /** Average latency across all physical attempts in milliseconds */
  averageLatencyMs: number;
  /** Error counts broken down by canonical classification */
  errorCounts: Partial<Record<AIErrorClassification, number>>;
}

/**
 * Operation-level logical request metrics.
 * A single logical request may execute multiple physical attempts across multiple
 * providers during failover, and is counted exactly once here.
 */
export interface OperationLogicalMetrics {
  /** Total logical requests initiated */
  logicalRequests: number;
  /** Logical requests that ultimately succeeded */
  logicalSuccesses: number;
  /** Logical requests that terminated in complete failure */
  logicalFailures: number;
}

/**
 * Daily usage aggregate for a single IST calendar day.
 */
export interface AIDailyUsageAggregate {
  /** Date in IST format: YYYY-MM-DD */
  date: string;
  /** Operation-level logical request statistics */
  operations: Record<AIUsageOperation, OperationLogicalMetrics>;
  /**
   * Provider-level physical aggregates.
   * Keyed by providerId -> modelId -> ProviderModelAggregate
   */
  providers: Record<string, Record<string, ProviderModelAggregate>>;
}

/**
 * Sanitized representation of a failed attempt for safe diagnostic review.
 * Strictly free of prompts, credentials, or full payload dumps.
 */
export interface SanitizedAIFailure {
  timestamp: string;
  requestId?: string | null;
  operation: AIUsageOperation;
  providerId: string;
  modelId: string;
  attemptNumber: number;
  fallbackUsed: boolean;
  success: false;
  httpStatus?: number | null;
  errorCategory?: AIErrorClassification | null;
  latencyMs: number;
}

/**
 * Provider quota evaluation status.
 */
export type QuotaStatus = 'NORMAL' | 'WARNING' | 'EXHAUSTED' | 'UNBOUNDED';

export interface ProviderQuotaEvaluation {
  providerId: string;
  dailyLimit: number | null;
  currentRequests: number;
  usagePercentage: number | null;
  status: QuotaStatus;
}

/**
 * Comprehensive summary of AI usage for diagnostic inspection.
 */
export interface AIUsageSummary {
  date: string;
  operations: Record<AIUsageOperation, OperationLogicalMetrics>;
  providers: Record<string, {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    retryAttempts: number;
    fallbackInvocations: number;
    totalTokens: number;
    averageLatencyMs: number;
    models: Record<string, ProviderModelAggregate>;
  }>;
  quotas: Record<string, ProviderQuotaEvaluation>;
  recentFailures: SanitizedAIFailure[];
}
