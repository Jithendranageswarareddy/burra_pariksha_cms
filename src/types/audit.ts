/**
 * BURRA PARIKSHA CMS — Audit & Observability Contracts
 * Stage 27 Feature Contract: FC-004 (Audit Ledger & Observability)
 * Stage 21 Architectural Specification: BP-ARCH-21-AUDIT-OBSERVABILITY
 *
 * Implements the authoritative 7-dimensional AuditEvent schema:
 * 1. WHO: actorId, actorRole, actorName, impersonatorId
 * 2. WHAT: action (e.g. QUESTION.CREATE, ROLE_UPDATED)
 * 3. TO WHAT: resourceType, resourceId, resourceVersion
 * 4. WHEN: timestamp (ISO 8601 UTC)
 * 5. FROM WHERE: ipAddress, userAgent
 * 6. CONTEXT: requestId, traceId, workflowStep, jobId
 * 7. STATE CHANGE: beforeState, afterState, diff, status, errorMessage
 *
 * Enforces sensitive data redaction & immutability invariants.
 */

import { z } from 'zod';

export type AuditEventResult = 'SUCCESS' | 'FAILURE' | 'DENIED';

export interface AuditActor {
  actorId: string;
  actorRole: string;
  actorName?: string;
  impersonatorId?: string;
}

export interface AuditResource {
  resourceType: string;
  resourceId: string;
  resourceVersion?: number;
}

export interface AuditContext {
  requestId: string;
  traceId?: string;
  ipAddress?: string;
  userAgent?: string;
  workflowStep?: number;
  jobId?: string;
  aiRequestId?: string;
}

export interface AuditStateChange {
  changeType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE' | 'TRANSITION';
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  diff?: Record<string, unknown> | null;
}

export interface AuditEvent {
  id: string; // aud_ + UUIDv4
  timestamp: string; // ISO 8601 UTC
  actor: AuditActor;
  action: string;
  resource: AuditResource;
  context: AuditContext;
  result: AuditEventResult;
  reason?: string;
  stateChange?: AuditStateChange;
  errorMessage?: string;
}

export interface CreateAuditEventInput {
  id?: string;
  timestamp?: string;
  actor: AuditActor;
  action: string;
  resource: AuditResource;
  context: AuditContext;
  result?: AuditEventResult;
  reason?: string;
  stateChange?: AuditStateChange;
  errorMessage?: string;
}

export interface AuditQueryFilters {
  resourceType?: string;
  resourceId?: string;
  actorId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// SENSITIVE DATA REDACTION ENGINE
// ============================================================================

export const REDACTION_PATTERNS = [
  'password',
  'secret',
  'token',
  'auth',
  'credential',
  'private_key',
  'session_secret',
  'api_key',
  'apikey',
  'cookie',
  'bearer',
];

export const SAFE_IDENTIFIER_EXEMPTIONS = new Set([
  'id',
  'requestid',
  'traceid',
  'actorid',
  'resourceid',
  'userid',
  'jobid',
  'authorid',
  'idempotencykey',
]);

/**
 * Recursively redacts sensitive fields from objects and arrays.
 * Exempts safe tracing and identity keys.
 */
export function redactSensitiveData<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  // Handle header key-value objects: { key: 'Authorization', value: '...' }
  const obj = input as Record<string, any>;
  const headerPropName = obj.key || obj.name || obj.header;
  if (typeof headerPropName === 'string') {
    const lowerHeader = headerPropName.toLowerCase();
    const isSensitiveHeader = REDACTION_PATTERNS.some((pat) => lowerHeader.includes(pat));
    if (isSensitiveHeader && 'value' in obj) {
      return {
        ...obj,
        value: '[REDACTED]',
      } as unknown as T;
    }
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const normalizedKey = lowerKey.replace(/[-_]/g, '');

    // Check if key is explicitly safe
    const isExempt =
      SAFE_IDENTIFIER_EXEMPTIONS.has(lowerKey) ||
      SAFE_IDENTIFIER_EXEMPTIONS.has(normalizedKey);

    const isSensitive =
      !isExempt &&
      REDACTION_PATTERNS.some((pat) => {
        const normPat = pat.replace(/[-_]/g, '');
        return lowerKey.includes(pat) || normalizedKey.includes(normPat);
      });

    if (isSensitive) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string' && (value.startsWith('Bearer ') || value.includes('bp_session='))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveData(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const AuditActorSchema = z.object({
  actorId: z.string().min(1, 'actorId is required'),
  actorRole: z.string().min(1, 'actorRole is required'),
  actorName: z.string().optional(),
  impersonatorId: z.string().optional(),
});

export const AuditResourceSchema = z.object({
  resourceType: z.string().min(1, 'resourceType is required'),
  resourceId: z.string().min(1, 'resourceId is required'),
  resourceVersion: z.number().int().optional(),
});

export const AuditContextSchema = z.object({
  requestId: z.string().min(1, 'requestId is required'),
  traceId: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  workflowStep: z.number().int().min(1).max(15).optional(),
  jobId: z.string().optional(),
  aiRequestId: z.string().optional(),
});

export const AuditStateChangeSchema = z.object({
  changeType: z.enum(['CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'TRANSITION']).optional(),
  before: z.record(z.string(), z.unknown()).nullable().optional(),
  after: z.record(z.string(), z.unknown()).nullable().optional(),
  diff: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const CreateAuditEventInputSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  actor: AuditActorSchema,
  action: z.string().min(1, 'action is required'),
  resource: AuditResourceSchema,
  context: AuditContextSchema,
  result: z.enum(['SUCCESS', 'FAILURE', 'DENIED']).optional().default('SUCCESS'),
  reason: z.string().optional(),
  stateChange: AuditStateChangeSchema.optional(),
  errorMessage: z.string().optional(),
});

export const AuditEventSchema = z.object({
  id: z.string().regex(/^aud_[0-9a-f-]{36}$/i, 'Must be valid aud_ UUID canonical ID'),
  timestamp: z.string().datetime(),
  actor: AuditActorSchema,
  action: z.string().min(1),
  resource: AuditResourceSchema,
  context: AuditContextSchema,
  result: z.enum(['SUCCESS', 'FAILURE', 'DENIED']),
  reason: z.string().optional(),
  stateChange: AuditStateChangeSchema.optional(),
  errorMessage: z.string().optional(),
});
