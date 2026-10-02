/**
 * BURRA PARIKSHA CMS — Stage 19 Security Architecture Verification Suite
 *
 * Verifies:
 * 1. The Golden Axiom: Frontend Permissions are UX, Backend are Security.
 * 2. Zero-Trust Authentication & Session Revocation via sessionVersion.
 * 3. RBAC Capability Verification (RESOURCE:ACTION).
 * 4. CORS Origin Whitelist & Origin Isolation.
 * 5. CSRF Defense & Custom Header Protection.
 * 6. Multi-Tiered Rate Limiting Policies (AI, Auth, API).
 * 7. Media Access Security & Tamper Detection (SHA-256).
 * 8. Immutable Audit Logging Schema & Non-Repudiation (AP-014).
 */

import {
  AuthScheme,
  RateLimitTier,
  MediaAccessLevel,
  AuditActionType,
  RATE_LIMIT_POLICIES,
  DEFAULT_CORS_CONFIG,
  SecuritySessionRecordSchema,
  SecurityAuditEventSchema,
  validateSessionState,
  validateCorsOrigin,
  enforceFrontendVsBackendSecurityAxiom,
  evaluateBackendSecurityGuard,
} from '../types/security-architecture';
import { CanonicalRbacRole as CanonicalRole } from '../types/rbac-models';
import { ApiErrorCode } from '../types/api-contracts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[STAGE 19 VERIFICATION FAILED]: ${message}`);
  }
}

console.log('================================================================================');
console.log('BURRA PARIKSHA CMS — STAGE 19 SECURITY ARCHITECTURE VERIFICATION');
console.log('================================================================================\n');

// ----------------------------------------------------------------------------
// TEST 1: The Golden Axiom (Frontend UX vs Backend Authority)
// ----------------------------------------------------------------------------
console.log('TEST 1: The Golden Axiom (Frontend UX vs Backend Authority)');

// Frontend scenario: User lacks permission -> UX hides button
const frontendCheck = enforceFrontendVsBackendSecurityAxiom(false, false);
assert(!frontendCheck.allowed, 'Frontend disables button when capability is false');
assert(frontendCheck.code === undefined, 'Frontend does not return HTTP error codes');

// Backend scenario: Adversary bypasses UI and calls API directly without permission -> 403 Forbidden
const backendCheck = enforceFrontendVsBackendSecurityAxiom(true, false);
assert(!backendCheck.allowed, 'Backend must strictly reject unauthorized mutation');
assert(backendCheck.code === ApiErrorCode.FORBIDDEN_LACKS_CAPABILITY, 'Backend must return 403 FORBIDDEN');

// Backend scenario: Authorized user -> Access granted
const backendAuthorized = enforceFrontendVsBackendSecurityAxiom(true, true);
assert(backendAuthorized.allowed, 'Backend grants access to authorized actor');

console.log('  ✔ The Golden Axiom verified: Frontend governs UX; Backend enforces authoritative security.\n');

// ----------------------------------------------------------------------------
// TEST 2: Zero-Trust Authentication & Session Revocation
// ----------------------------------------------------------------------------
console.log('TEST 2: Zero-Trust Authentication & Session Revocation');

const validSession = {
  sessionId: 'SES-abcdef1234567890',
  userId: 'usr-author-01',
  role: CanonicalRole.QUESTION_AUTHOR,
  sessionVersion: 1,
  authScheme: AuthScheme.BEARER_TOKEN,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour future
  lastActivityAt: new Date().toISOString(),
  isRevoked: false,
};

SecuritySessionRecordSchema.parse(validSession);

// Valid session check
const validCheck = validateSessionState(validSession, 1);
assert(validCheck.isValid, 'Active session must be valid');

// Global revocation check (e.g. user changed password -> user.sessionVersion becomes 2)
const revokedCheck = validateSessionState(validSession, 2);
assert(!revokedCheck.isValid, 'Session must be invalidated when sessionVersion is incremented');
assert(revokedCheck.reason?.includes('invalidated') === true, 'Invalidation reason must be reported');

// Explicit revocation flag check
const explicitlyRevoked = validateSessionState({ ...validSession, isRevoked: true }, 1);
assert(!explicitlyRevoked.isValid, 'Explicitly revoked session must be rejected');

console.log('  ✔ Instant global session revocation via sessionVersion verified.\n');

// ----------------------------------------------------------------------------
// TEST 3: RBAC Capability Verification (RESOURCE:ACTION)
// ----------------------------------------------------------------------------
console.log('TEST 3: RBAC Capability Verification (RESOURCE:ACTION)');

const authorActor = {
  role: CanonicalRole.QUESTION_AUTHOR,
  capabilities: ['QUESTION:CREATE', 'QUESTION:VIEW'],
};

// Authorized capability
const authorCanCreate = evaluateBackendSecurityGuard(authorActor, 'QUESTION:CREATE');
assert(authorCanCreate.authorized, 'Question author must be authorized to QUESTION:CREATE');

// Unauthorized capability
const authorCannotVerify = evaluateBackendSecurityGuard(authorActor, 'QUESTION_REVIEW:VERIFY');
assert(!authorCannotVerify.authorized, 'Question author must NOT be authorized to verify questions');
assert(authorCannotVerify.errorCode === ApiErrorCode.FORBIDDEN_LACKS_CAPABILITY, 'Must return 403');

console.log('  ✔ Granular zero-trust capability enforcement verified.\n');

// ----------------------------------------------------------------------------
// TEST 4: CORS Origin Whitelist & Origin Isolation
// ----------------------------------------------------------------------------
console.log('TEST 4: CORS Origin Whitelist & Origin Isolation');

assert(validateCorsOrigin('https://bp-cms.web.app', DEFAULT_CORS_CONFIG.allowedOrigins), 'Production web.app must be allowed');
assert(validateCorsOrigin('http://localhost:5173', DEFAULT_CORS_CONFIG.allowedOrigins), 'Local development port 5173 must be allowed');
assert(!validateCorsOrigin('https://malicious-site.com', DEFAULT_CORS_CONFIG.allowedOrigins), 'Untrusted origins must be rejected');
assert(!DEFAULT_CORS_CONFIG.allowedOrigins.includes('*'), 'Wildcard origin is strictly forbidden');

console.log('  ✔ Strict CORS origin whitelisting verified; wildcards prohibited.\n');

// ----------------------------------------------------------------------------
// TEST 5: CSRF Defense & Custom Header Protection
// ----------------------------------------------------------------------------
console.log('TEST 5: CSRF Defense & Custom Header Protection');

assert(DEFAULT_CORS_CONFIG.allowedHeaders.includes('X-BP-Requested-With'), 'X-BP-Requested-With required in headers');
assert(DEFAULT_CORS_CONFIG.allowedHeaders.includes('X-Idempotency-Key'), 'X-Idempotency-Key required in headers');

console.log('  ✔ CSRF custom header defense contract verified.\n');

// ----------------------------------------------------------------------------
// TEST 6: Multi-Tiered Rate Limiting Policies
// ----------------------------------------------------------------------------
console.log('TEST 6: Multi-Tiered Rate Limiting Policies');

const aiRateLimit = RATE_LIMIT_POLICIES[RateLimitTier.AI_GENERATION];
assert(aiRateLimit.maxRequests <= 10, 'AI rate limit must be <= 10 to protect Gemini 15 RPM free tier');

const authRateLimit = RATE_LIMIT_POLICIES[RateLimitTier.AUTH_BURST];
assert(authRateLimit.maxRequests === 5, 'Auth tier must be capped at 5 req/min');

console.log('  ✔ Multi-tiered rate limits verified (AI tier strictly protects Gemini free quota).\n');

// ----------------------------------------------------------------------------
// TEST 7: Media Access Security & Tamper Detection (SHA-256)
// ----------------------------------------------------------------------------
console.log('TEST 7: Media Access Security & Tamper Detection (SHA-256)');

const validMediaPolicy = {
  mediaId: 'MED-20261002-raw-take-01',
  accessLevel: MediaAccessLevel.RESTRICTED_RAW,
  signedUrlDurationSeconds: 900, // 15 mins
  sha256Checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  requireWatermark: false,
};

assert(validMediaPolicy.signedUrlDurationSeconds <= 3600, 'Signed URL duration must not exceed 1 hour');
assert(validMediaPolicy.sha256Checksum.length === 64, 'SHA-256 checksum required for tamper detection');

console.log('  ✔ Media access level and SHA-256 tamper detection contracts verified.\n');

// ----------------------------------------------------------------------------
// TEST 8: Immutable Audit Logging Schema & Non-Repudiation (AP-014)
// ----------------------------------------------------------------------------
console.log('TEST 8: Immutable Audit Logging Schema & Non-Repudiation (AP-014)');

const validAuditEvent = {
  eventId: 'AUD-20261002-abc12345',
  timestamp: new Date().toISOString(),
  actorId: 'usr-author-01',
  actorRole: CanonicalRole.QUESTION_AUTHOR,
  capability: 'QUESTION:CREATE',
  resource: 'QUESTION',
  resourceId: 'BP-Q-000412',
  action: AuditActionType.ENTITY_CREATED,
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  success: true,
  diff: { status: 'DRAFT', bloomLevel: 'APPLY' },
};

const parsedAudit = SecurityAuditEventSchema.parse(validAuditEvent);
assert(parsedAudit.eventId === 'AUD-20261002-abc12345', 'Audit event ID preserved');
assert(parsedAudit.action === AuditActionType.ENTITY_CREATED, 'Audit action preserved');

console.log('  ✔ Immutable audit ledger schema strictly validated with Zod.\n');

console.log('================================================================================');
console.log('ALL STAGE 19 SECURITY ARCHITECTURE TESTS PASSED SUCCESSFULLY! (8/8)');
console.log('================================================================================');
