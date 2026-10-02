/**
 * BURRA PARIKSHA CMS — Stage 21 Audit & Observability Architecture
 *
 * Defines the 7-dimension forensic audit schema (AP-014), structured JSON logging,
 * universal request tracing, failure telemetry models, and health probe contracts.
 */

import { z } from 'zod';
import { CanonicalRbacRole as CanonicalRole } from './rbac-models';

// Re-export CanonicalRole
export { CanonicalRole };

// ============================================================================
// 1. OBSERVABILITY ENUMS & TAXONOMY
// ============================================================================

export enum LogSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  NOTICE = 'NOTICE',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum ObservabilityComponent {
  API_GATEWAY = 'API_GATEWAY',
  AUTH_SERVICE = 'AUTH_SERVICE',
  WORKFLOW_ENGINE = 'WORKFLOW_ENGINE',
  AI_SUBSYSTEM = 'AI_SUBSYSTEM',
  MEDIA_PIPELINE = 'MEDIA_PIPELINE',
  JOB_RUNNER = 'JOB_RUNNER',
  REALTIME_BUS = 'REALTIME_BUS',
  DATABASE_ADAPTER = 'DATABASE_ADAPTER',
}

export enum FailureDomain {
  WORKFLOW = 'WORKFLOW',
  BACKGROUND_JOB = 'BACKGROUND_JOB',
  MEDIA = 'MEDIA',
  AI_GENERATION = 'AI_GENERATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
}

export enum SubsystemHealthState {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
}

// ============================================================================
// 2. PILLAR 1: FORENSIC AUDIT RECORD SCHEMA (7 MANDATORY DIMENSIONS)
// ============================================================================

export const AuditActorSchema = z.object({
  actorId: z.string().min(1),
  actorRole: z.nativeEnum(CanonicalRole),
  isAiAgent: z.boolean(),
  authScheme: z.string().default('BEARER_TOKEN'),
});

export const AuditActionSchema = z.object({
  action: z.string().min(1),
  capability: z.string().min(1),
});

export const AuditTargetSchema = z.object({
  targetEntity: z.string().min(1),
  targetEntityId: z.string().min(1),
  collection: z.string().min(1),
});

export const AuditTimestampSchema = z.object({
  timestampISO: z.string().datetime(),
  epochMs: z.number().int().positive(),
});

export const AuditContextSchema = z.object({
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  workspaceHub: z.string().min(1),
  requestId: z.string().min(1),
  correlationId: z.string().min(1),
});

export const AuditRecordSchema = z.object({
  auditId: z.string().regex(/^AUD-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  who: AuditActorSchema,
  didWhat: AuditActionSchema,
  toWhat: AuditTargetSchema,
  when: AuditTimestampSchema,
  fromWhere: AuditContextSchema,
  before: z.record(z.string(), z.unknown()).nullable(),
  after: z.record(z.string(), z.unknown()).nullable(),
  diff: z.record(z.string(), z.object({ from: z.unknown(), to: z.unknown() })).nullable(),
});

export type AuditRecord = z.infer<typeof AuditRecordSchema>;

// ============================================================================
// 3. PILLAR 2: STRUCTURED LOGGING SCHEMA (GOOGLE CLOUD LOGGING FORMAT)
// ============================================================================

export const StructuredLogEntrySchema = z.object({
  severity: z.nativeEnum(LogSeverity),
  message: z.string().min(1),
  timestamp: z.string().datetime(),
  component: z.nativeEnum(ObservabilityComponent),
  requestId: z.string().min(1),
  correlationId: z.string().min(1),
  context: z.record(z.string(), z.unknown()).optional(),
  error: z
    .object({
      name: z.string(),
      message: z.string(),
      stack: z.string().optional(),
    })
    .optional(),
});

export type StructuredLogEntry = z.infer<typeof StructuredLogEntrySchema>;

// ============================================================================
// 4. DOMAIN FAILURE TELEMETRY SCHEMAS
// ============================================================================

export const WorkflowFailureEventSchema = z.object({
  failureId: z.string().regex(/^FAIL-WF-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  workflowInstanceId: z.string().min(1),
  contentId: z.string().min(1),
  fromStep: z.number().int().min(1).max(15),
  targetStep: z.number().int().min(1).max(15),
  actorId: z.string().min(1),
  failureReason: z.string().min(1),
  errorCode: z.string().min(1),
  timestamp: z.string().datetime(),
});

export type WorkflowFailureEvent = z.infer<typeof WorkflowFailureEventSchema>;

export const JobFailureEventSchema = z.object({
  failureId: z.string().regex(/^FAIL-JOB-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  jobId: z.string().min(1),
  jobType: z.string().min(1),
  retryCount: z.number().int().nonnegative(),
  isFatal: z.boolean(),
  errorDetails: z.object({
    code: z.string(),
    message: z.string(),
  }),
  timestamp: z.string().datetime(),
});

export type JobFailureEvent = z.infer<typeof JobFailureEventSchema>;

export const MediaFailureEventSchema = z.object({
  failureId: z.string().regex(/^FAIL-MED-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  mediaId: z.string().min(1),
  operation: z.enum(['UPLOAD', 'TRANSCODE', 'HASH_VERIFY', 'ARCHIVE']),
  expectedHash: z.string().length(64).optional(),
  actualHash: z.string().length(64).optional(),
  errorReason: z.string().min(1),
  timestamp: z.string().datetime(),
});

export type MediaFailureEvent = z.infer<typeof MediaFailureEventSchema>;

export const AiFailureEventSchema = z.object({
  failureId: z.string().regex(/^FAIL-AI-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  requestId: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  failureCategory: z.enum(['RATE_LIMITED', 'SCHEMA_ERROR', 'TIMEOUT', 'SAFETY_BLOCK', 'AUTH_ERROR']),
  retryAttempt: z.number().int().nonnegative(),
  rawErrorMessage: z.string().min(1),
  timestamp: z.string().datetime(),
});

export type AiFailureEvent = z.infer<typeof AiFailureEventSchema>;

// ============================================================================
// 5. SYSTEM HEALTH CHECK & READINESS SCHEMAS
// ============================================================================

export const SystemHealthReportSchema = z.object({
  status: z.nativeEnum(SubsystemHealthState),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.string().datetime(),
  subsystems: z.record(
    z.string(),
    z.object({
      state: z.nativeEnum(SubsystemHealthState),
      latencyMs: z.number().nonnegative(),
      message: z.string().optional(),
    })
  ),
  overallLatencyMs: z.number().nonnegative(),
});

export type SystemHealthReport = z.infer<typeof SystemHealthReportSchema>;

// ============================================================================
// 6. PURE HELPER FUNCTIONS
// ============================================================================

export function computeStateDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): Record<string, { from: unknown; to: unknown }> | null {
  if (!before && !after) return null;
  if (!before && after) {
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of Object.keys(after)) {
      diff[key] = { from: null, to: after[key] };
    }
    return diff;
  }
  if (before && !after) {
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of Object.keys(before)) {
      diff[key] = { from: before[key], to: null };
    }
    return diff;
  }

  const diff: Record<string, { from: unknown; to: unknown }> = {};
  const allKeys = new Set([...Object.keys(before!), ...Object.keys(after!)]);

  for (const key of allKeys) {
    const bVal = before![key];
    const aVal = after![key];
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      diff[key] = { from: bVal, to: aVal };
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
}

export function createAuditRecord(params: {
  auditId: string;
  who: z.infer<typeof AuditActorSchema>;
  didWhat: z.infer<typeof AuditActionSchema>;
  toWhat: z.infer<typeof AuditTargetSchema>;
  fromWhere: z.infer<typeof AuditContextSchema>;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}): AuditRecord {
  const now = new Date();
  const diff = computeStateDiff(params.before, params.after);

  const record: AuditRecord = {
    auditId: params.auditId,
    who: params.who,
    didWhat: params.didWhat,
    toWhat: params.toWhat,
    when: {
      timestampISO: now.toISOString(),
      epochMs: now.getTime(),
    },
    fromWhere: params.fromWhere,
    before: params.before,
    after: params.after,
    diff,
  };

  AuditRecordSchema.parse(record);
  return record;
}

export function formatStructuredLog(
  severity: LogSeverity,
  message: string,
  meta: {
    component: ObservabilityComponent;
    requestId: string;
    correlationId: string;
    context?: Record<string, unknown>;
    error?: Error;
  }
): StructuredLogEntry {
  const entry: StructuredLogEntry = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    component: meta.component,
    requestId: meta.requestId,
    correlationId: meta.correlationId,
    context: meta.context,
    error: meta.error
      ? {
          name: meta.error.name,
          message: meta.error.message,
          stack: meta.error.stack,
        }
      : undefined,
  };

  StructuredLogEntrySchema.parse(entry);
  return entry;
}

export function evaluateSystemHealth(
  subsystems: Record<string, { state: SubsystemHealthState; latencyMs: number }>
): SubsystemHealthState {
  const states = Object.values(subsystems).map((s) => s.state);
  if (states.includes(SubsystemHealthState.UNHEALTHY)) {
    return SubsystemHealthState.UNHEALTHY;
  }
  if (states.includes(SubsystemHealthState.DEGRADED)) {
    return SubsystemHealthState.DEGRADED;
  }
  return SubsystemHealthState.HEALTHY;
}
