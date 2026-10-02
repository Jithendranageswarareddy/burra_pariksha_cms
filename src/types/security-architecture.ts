/**
 * BURRA PARIKSHA CMS — Stage 19 Security Architecture & Contracts
 *
 * Defines the 13 security dimensions, session state schemas, CORS/CSRF policies,
 * multi-tier rate limits, media access policies, and audit ledger contracts.
 */

import { z } from 'zod';
import {
  CanonicalRbacRole,
  CapabilityString,
  parseCapability,
  roleHasCapability,
} from './rbac-models';
import { ApiErrorCode } from './api-contracts';

// Re-export CanonicalRole for clean domain aliasing
export { CanonicalRbacRole as CanonicalRole };

// ============================================================================
// 1. SECURITY ENUMS & TAXONOMY
// ============================================================================

export enum AuthScheme {
  BEARER_TOKEN = 'BEARER_TOKEN',
  HTTP_ONLY_COOKIE = 'HTTP_ONLY_COOKIE',
}

export enum RateLimitTier {
  AUTH_BURST = 'AUTH_BURST',
  STANDARD_API = 'STANDARD_API',
  AI_GENERATION = 'AI_GENERATION',
  MEDIA_INGESTION = 'MEDIA_INGESTION',
}

export enum MediaAccessLevel {
  PUBLIC_PREVIEW = 'PUBLIC_PREVIEW',
  WATERMARKED_REVIEW = 'WATERMARKED_REVIEW',
  RESTRICTED_RAW = 'RESTRICTED_RAW',
  INTERNAL_MASTER = 'INTERNAL_MASTER',
}

export enum AuditActionType {
  AUTHENTICATION_SUCCESS = 'AUTHENTICATION_SUCCESS',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  ENTITY_CREATED = 'ENTITY_CREATED',
  ENTITY_MODIFIED = 'ENTITY_MODIFIED',
  ENTITY_DELETED = 'ENTITY_DELETED',
  WORKFLOW_TRANSITIONED = 'WORKFLOW_TRANSITIONED',
  MEDIA_ACCESSED = 'MEDIA_ACCESSED',
}

// ============================================================================
// 2. SESSION STATE & TOKEN SCHEMAS
// ============================================================================

export const SecuritySessionRecordSchema = z.object({
  sessionId: z.string().regex(/^SES-[a-zA-Z0-9_-]{16,32}$/),
  userId: z.string().min(1),
  role: z.nativeEnum(CanonicalRbacRole),
  sessionVersion: z.number().int().nonnegative(),
  authScheme: z.nativeEnum(AuthScheme),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  lastActivityAt: z.string().datetime(),
  isRevoked: z.boolean(),
});

export type SecuritySessionRecord = z.infer<typeof SecuritySessionRecordSchema>;

// ============================================================================
// 3. CORS & CSRF CONFIGURATION
// ============================================================================

export const CorsConfigSchema = z.object({
  allowedOrigins: z.array(z.string().url()).min(1),
  allowedMethods: z.array(z.string()).min(1),
  allowedHeaders: z.array(z.string()).min(1),
  allowCredentials: z.boolean(),
  maxAgeSeconds: z.number().int().positive(),
});

export type CorsConfig = z.infer<typeof CorsConfigSchema>;

export const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [
    'https://bp-cms.web.app',
    'https://burra-pariksha-cms.web.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-BP-Requested-With',
    'X-Request-ID',
    'X-Idempotency-Key',
    'Last-Event-ID',
  ],
  allowCredentials: true,
  maxAgeSeconds: 86400, // 24 hours
};

// ============================================================================
// 4. RATE LIMITING POLICY REGISTRY
// ============================================================================

export interface RateLimitPolicy {
  tier: RateLimitTier;
  windowMs: number;
  maxRequests: number;
  message: string;
}

export const RATE_LIMIT_POLICIES: Record<RateLimitTier, RateLimitPolicy> = {
  [RateLimitTier.AUTH_BURST]: {
    tier: RateLimitTier.AUTH_BURST,
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many login attempts. Please wait before retrying.',
  },
  [RateLimitTier.AI_GENERATION]: {
    tier: RateLimitTier.AI_GENERATION,
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // Stays strictly within Gemini 15 RPM free tier!
    message: 'AI generation quota rate limit reached. Please wait 1 minute.',
  },
  [RateLimitTier.MEDIA_INGESTION]: {
    tier: RateLimitTier.MEDIA_INGESTION,
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Media upload rate limit reached.',
  },
  [RateLimitTier.STANDARD_API]: {
    tier: RateLimitTier.STANDARD_API,
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: 'API rate limit exceeded. Please throttle requests.',
  },
};

// ============================================================================
// 5. MEDIA ACCESS & TAMPER DETECTION
// ============================================================================

export const MediaAccessPolicySchema = z.object({
  mediaId: z.string().min(1),
  accessLevel: z.nativeEnum(MediaAccessLevel),
  signedUrlDurationSeconds: z.number().int().min(60).max(3600),
  sha256Checksum: z.string().length(64),
  requireWatermark: z.boolean(),
});

export type MediaAccessPolicy = z.infer<typeof MediaAccessPolicySchema>;

// ============================================================================
// 6. IMMUTABLE AUDIT LEDGER SCHEMA (AP-014)
// ============================================================================

export const SecurityAuditEventSchema = z.object({
  eventId: z.string().regex(/^AUD-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  timestamp: z.string().datetime(),
  actorId: z.string().min(1),
  actorRole: z.nativeEnum(CanonicalRbacRole),
  capability: z.string().min(3),
  resource: z.string().min(1),
  resourceId: z.string().min(1),
  action: z.nativeEnum(AuditActionType),
  ipAddress: z.string(),
  userAgent: z.string(),
  success: z.boolean(),
  errorCode: z.string().optional(),
  diff: z.record(z.string(), z.unknown()).nullable(),
});

export type SecurityAuditEvent = z.infer<typeof SecurityAuditEventSchema>;

// ============================================================================
// 7. PURE SECURITY EVALUATORS & HELPERS
// ============================================================================

export function validateSessionState(
  session: SecuritySessionRecord,
  activeUserSessionVersion: number
): { isValid: boolean; reason?: string } {
  if (session.isRevoked) {
    return { isValid: false, reason: 'Session explicitly revoked' };
  }

  const now = new Date();
  const expiresAt = new Date(session.expiresAt);
  if (now > expiresAt) {
    return { isValid: false, reason: 'Session expired' };
  }

  // Real-time global revocation check
  if (session.sessionVersion !== activeUserSessionVersion) {
    return { isValid: false, reason: 'Session invalidated by global password/session reset' };
  }

  return { isValid: true };
}

export function validateCorsOrigin(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin);
}

/**
 * The Golden Axiom: Frontend Permissions are UX. Backend Permissions are Security.
 */
export function enforceFrontendVsBackendSecurityAxiom(
  isBackendCheck: boolean,
  actorHasCapability: boolean
): { allowed: boolean; code?: ApiErrorCode } {
  if (!isBackendCheck) {
    // Frontend logic: purely determines whether to show or hide UI elements
    return { allowed: actorHasCapability };
  }

  // Backend logic: authoritative security boundary
  if (!actorHasCapability) {
    return {
      allowed: false,
      code: ApiErrorCode.FORBIDDEN_LACKS_CAPABILITY,
    };
  }

  return { allowed: true };
}

export function evaluateBackendSecurityGuard(
  actor: { role: CanonicalRbacRole; capabilities: string[] },
  requiredCapability: string
): { authorized: boolean; errorCode?: ApiErrorCode } {
  // 1. Role capability possession check
  const hasCap =
    actor.capabilities.includes(requiredCapability) ||
    roleHasCapability(actor.role, requiredCapability as CapabilityString);
  if (!hasCap) {
    return {
      authorized: false,
      errorCode: ApiErrorCode.FORBIDDEN_LACKS_CAPABILITY,
    };
  }

  return { authorized: true };
}

export function generateSecureToken(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return `${prefix}-${randomPart}`;
}
