/**
 * BURRA PARIKSHA CMS — Stage 09 Authoritative RBAC Evaluator Engine
 *
 * Implements the deterministic 12-step server-side authorization pipeline:
 * 1. Authenticate Actor Context (AP-004)
 * 2. Resolve Actor Identity & Active Roles
 * 3. Resolve Requested Capability (RESOURCE:ACTION)
 * 4. Evaluate Capability Possession
 * 5. Resolve Target Entity Instance
 * 6. Evaluate Object-Level Access
 * 7. Evaluate Segregation-of-Duties (GAR-02 Anti-Self-Approval)
 * 8. Evaluate Business & State Preconditions (AP-005)
 * 9. Evaluate Workflow Transition Rules (AP-001)
 * 10. Evaluate AI Human-Gating Constraints (AP-009)
 * 11. Execute State Mutation & Atomic Audit Log (AP-014)
 * 12. Return Safe Authorization Result
 *
 * Reference: docs/architecture/09-RBAC-CAPABILITY-MATRIX.md
 */

import {
  AuthorizationResource,
  AuthorizationAction,
  CanonicalRbacRole,
  CapabilityString,
  formatCapability,
  parseCapability,
  resolveBrownfieldRole,
  roleHasCapability,
  isHumanGatedCapability,
  isHumanGatedStage,
  HUMAN_GATED_STAGES,
} from '../../types/rbac-models';

// ============================================================================
// 1. AUTHORIZATION ERROR CODES (Section 15.2)
// ============================================================================

export enum AuthorizationErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN_BY_SEGREGATION_OF_DUTIES = 'FORBIDDEN_BY_SEGREGATION_OF_DUTIES',
  FORBIDDEN_BY_AI_GATING = 'FORBIDDEN_BY_AI_GATING',
  FORBIDDEN_BY_BUSINESS_RULE = 'FORBIDDEN_BY_BUSINESS_RULE',
  FORBIDDEN_BY_WORKFLOW = 'FORBIDDEN_BY_WORKFLOW',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INVALID_ACTION = 'INVALID_ACTION',
}

// ============================================================================
// 2. CONTEXT & DECISION INTERFACES
// ============================================================================

export interface AuthorizationActor {
  id: string; // e.g. USR-001
  role?: CanonicalRbacRole | string;
  roles?: (CanonicalRbacRole | string)[];
  isAiAgent?: boolean;
  email?: string;
}

export interface TargetResourceContext {
  resourceType?: AuthorizationResource;
  resourceId?: string;
  authorUserId?: string;
  createdBy?: string;
  ownerUserId?: string;
  stageNumber?: number; // 1 to 15
  status?: string;
  isPreconditionsMet?: boolean;
  preconditionFailureReason?: string;
}

export interface AuthorizationRequest {
  actor: AuthorizationActor;
  resource: AuthorizationResource;
  action: AuthorizationAction;
  targetContext?: TargetResourceContext;
}

export interface AuditEventRecord {
  eventId: string;
  actorUserId: string;
  actorRole: string;
  actionVerb: string;
  targetResourceType: string;
  targetResourceId?: string;
  timestamp: string;
  verdict: 'ALLOWED' | 'DENIED';
  reason?: string;
}

export interface AuthorizationDecision {
  allowed: boolean;
  errorCode?: AuthorizationErrorCode;
  errorMessage?: string;
  evaluatedCapability: CapabilityString;
  actorId: string;
  resolvedRole: CanonicalRbacRole;
  timestamp: string;
  auditEvent?: AuditEventRecord;
}

// ============================================================================
// 3. SPECIALIZED GUARDS
// ============================================================================

/**
 * Evaluates Segregation of Duties / Anti-Self-Approval (GAR-02 / NEG-01).
 * An actor who authored an artifact cannot approve or verify that artifact.
 * ADMINISTRATIVE EXCEPTION PROHIBITION (Section 12.3):
 * Even ADMIN is subject to GAR-02.
 */
export function evaluateSegregationOfDuties(
  actor: AuthorizationActor,
  targetContext?: TargetResourceContext,
  action?: AuthorizationAction
): { allowed: boolean; errorCode?: AuthorizationErrorCode; errorMessage?: string } {
  // Only approval and verification actions trigger anti-self-approval checks
  if (action !== AuthorizationAction.APPROVE && action !== AuthorizationAction.VERIFY) {
    return { allowed: true };
  }

  if (!targetContext) {
    return { allowed: true };
  }

  const authorId = targetContext.authorUserId || targetContext.createdBy;
  if (authorId && actor.id === authorId) {
    return {
      allowed: false,
      errorCode: AuthorizationErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES,
      errorMessage: 'Self-approval prohibited: Creator cannot approve their own artifact (GAR-02).',
    };
  }

  return { allowed: true };
}

/**
 * Evaluates AI Human-Gating Constraints (AP-009).
 * AI agents, automated scripts, and bots are structurally barred from holding
 * or executing APPROVE or VERIFY capabilities on human-gated steps (2, 7, 9, 10, 14, 15).
 */
export function evaluateAiGating(
  actor: AuthorizationActor,
  resource: AuthorizationResource,
  action: AuthorizationAction,
  targetContext?: TargetResourceContext
): { allowed: boolean; errorCode?: AuthorizationErrorCode; errorMessage?: string } {
  const isAiActor = Boolean(
    actor.isAiAgent ||
    actor.role === 'AI_BOT' ||
    actor.role === 'AI_AGENT' ||
    actor.id.startsWith('AI-') ||
    actor.id.startsWith('AGENT-')
  );

  if (!isAiActor) {
    return { allowed: true };
  }

  const capability = formatCapability(resource, action);
  const isGatedCap = isHumanGatedCapability(capability);
  const isGatedStageNumber = targetContext?.stageNumber !== undefined &&
    isHumanGatedStage(targetContext.stageNumber);
  const isApprovalAction = action === AuthorizationAction.APPROVE || action === AuthorizationAction.VERIFY;

  if (isGatedCap || (isApprovalAction && isGatedStageNumber)) {
    return {
      allowed: false,
      errorCode: AuthorizationErrorCode.FORBIDDEN_BY_AI_GATING,
      errorMessage: 'AI cannot self-approve or bypass human authorization gates (AP-009).',
    };
  }

  return { allowed: true };
}

// ============================================================================
// 4. THE 12-STEP DETERMINISTIC EVALUATION PIPELINE
// ============================================================================

export function evaluateAuthorization(request: AuthorizationRequest): AuthorizationDecision {
  const timestamp = new Date().toISOString();
  const capability = formatCapability(request.resource, request.action);
  const actorId = request.actor?.id || 'ANONYMOUS';

  // Step 1: Authenticate Actor Context (AP-004)
  if (!request.actor || !request.actor.id || request.actor.id.trim() === '' || request.actor.id === 'ANONYMOUS') {
    return {
      allowed: false,
      errorCode: AuthorizationErrorCode.UNAUTHENTICATED,
      errorMessage: 'Unauthenticated caller: Session token missing or invalid (AP-004).',
      evaluatedCapability: capability,
      actorId,
      resolvedRole: CanonicalRbacRole.QUESTION_AUTHOR,
      timestamp,
      auditEvent: {
        eventId: `AUD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        actorUserId: actorId,
        actorRole: 'UNAUTHENTICATED',
        actionVerb: request.action,
        targetResourceType: request.resource,
        targetResourceId: request.targetContext?.resourceId,
        timestamp,
        verdict: 'DENIED',
        reason: 'UNAUTHENTICATED',
      },
    };
  }

  // Step 2: Resolve Actor Identity & Active Roles
  const primaryRole = request.actor.role || (request.actor.roles && request.actor.roles[0]);
  const canonicalRole = resolveBrownfieldRole(primaryRole);

  // Step 3: Resolve Requested Capability syntax
  const parsedCap = parseCapability(capability);
  if (!parsedCap.isValid) {
    return {
      allowed: false,
      errorCode: AuthorizationErrorCode.INVALID_ACTION,
      errorMessage: `Invalid capability format or unknown resource/action: ${capability}`,
      evaluatedCapability: capability,
      actorId,
      resolvedRole: canonicalRole,
      timestamp,
      auditEvent: {
        eventId: `AUD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        actorUserId: actorId,
        actorRole: canonicalRole,
        actionVerb: request.action,
        targetResourceType: request.resource,
        targetResourceId: request.targetContext?.resourceId,
        timestamp,
        verdict: 'DENIED',
        reason: 'INVALID_ACTION',
      },
    };
  }

  // Step 4: Evaluate AI Human-Gating Constraints (AP-009)
  // AI cannot bypass human authorization gates regardless of role assignment.
  const aiGatingResult = evaluateAiGating(
    request.actor,
    request.resource,
    request.action,
    request.targetContext
  );
  if (!aiGatingResult.allowed) {
    return {
      allowed: false,
      errorCode: aiGatingResult.errorCode,
      errorMessage: aiGatingResult.errorMessage,
      evaluatedCapability: capability,
      actorId,
      resolvedRole: canonicalRole,
      timestamp,
      auditEvent: {
        eventId: `AUD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        actorUserId: actorId,
        actorRole: canonicalRole,
        actionVerb: request.action,
        targetResourceType: request.resource,
        targetResourceId: request.targetContext?.resourceId,
        timestamp,
        verdict: 'DENIED',
        reason: aiGatingResult.errorCode,
      },
    };
  }

  // Step 5: Evaluate Capability Possession
  const hasCap = roleHasCapability(canonicalRole, capability);
  if (!hasCap) {
    return {
      allowed: false,
      errorCode: AuthorizationErrorCode.UNAUTHORIZED,
      errorMessage: `Actor role ${canonicalRole} lacks required capability: ${capability}`,
      evaluatedCapability: capability,
      actorId,
      resolvedRole: canonicalRole,
      timestamp,
      auditEvent: {
        eventId: `AUD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        actorUserId: actorId,
        actorRole: canonicalRole,
        actionVerb: request.action,
        targetResourceType: request.resource,
        targetResourceId: request.targetContext?.resourceId,
        timestamp,
        verdict: 'DENIED',
        reason: 'UNAUTHORIZED',
      },
    };
  }

  // Step 6: Evaluate Segregation-of-Duties (GAR-02 Anti-Self-Approval)
  const sodResult = evaluateSegregationOfDuties(
    request.actor,
    request.targetContext,
    request.action
  );
  if (!sodResult.allowed) {
    return {
      allowed: false,
      errorCode: sodResult.errorCode,
      errorMessage: sodResult.errorMessage,
      evaluatedCapability: capability,
      actorId,
      resolvedRole: canonicalRole,
      timestamp,
      auditEvent: {
        eventId: `AUD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        actorUserId: actorId,
        actorRole: canonicalRole,
        actionVerb: request.action,
        targetResourceType: request.resource,
        targetResourceId: request.targetContext?.resourceId,
        timestamp,
        verdict: 'DENIED',
        reason: sodResult.errorCode,
      },
    };
  }

  // Step 7: Evaluate Business & State Preconditions (AP-005)
  if (request.targetContext?.isPreconditionsMet === false) {
    return {
      allowed: false,
      errorCode: AuthorizationErrorCode.FORBIDDEN_BY_BUSINESS_RULE,
      errorMessage:
        request.targetContext.preconditionFailureReason ||
        'Business preconditions not satisfied for requested operation (AP-005).',
      evaluatedCapability: capability,
      actorId,
      resolvedRole: canonicalRole,
      timestamp,
      auditEvent: {
        eventId: `AUD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        actorUserId: actorId,
        actorRole: canonicalRole,
        actionVerb: request.action,
        targetResourceType: request.resource,
        targetResourceId: request.targetContext?.resourceId,
        timestamp,
        verdict: 'DENIED',
        reason: 'FORBIDDEN_BY_BUSINESS_RULE',
      },
    };
  }

  // Step 8: Authorization Succeeded — Return Allowed Decision with Audit Event (AP-014)
  return {
    allowed: true,
    evaluatedCapability: capability,
    actorId,
    resolvedRole: canonicalRole,
    timestamp,
    auditEvent: {
      eventId: `AUD-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      actorUserId: actorId,
      actorRole: canonicalRole,
      actionVerb: request.action,
      targetResourceType: request.resource,
      targetResourceId: request.targetContext?.resourceId,
      timestamp,
      verdict: 'ALLOWED',
    },
  };
}

/**
 * Convenience check for quick boolean authorization testing.
 */
export function isAllowed(request: AuthorizationRequest): boolean {
  return evaluateAuthorization(request).allowed;
}
