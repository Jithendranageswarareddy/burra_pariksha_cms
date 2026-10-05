/**
 * BURRA PARIKSHA CMS — Central Authorization Service (Sprint 3)
 *
 * Single authoritative service for:
 * 1. Page Access & Navigation Resolution
 * 2. Dynamic UI Action Resolution (VISIBLE, HIDDEN, READ_ONLY, ENABLED, DISABLED)
 * 3. Data Scope Resolution (ALL, ASSIGNED, TEAM, STAGE, RESTRICTED, OWN)
 * 4. Workflow Stage Eligibility & Responsibilities
 * 5. Audited Administrative Overrides
 *
 * Implements the 8-tier canonical model:
 * User -> Roles -> Capabilities -> Page Access -> Action Access -> Data Scope -> Workflow Eligibility -> Admin Override
 */

import {
  AuthorizationResource,
  AuthorizationAction,
  CanonicalRbacRole,
  CapabilityString,
  DataScope,
  UiActionState,
  UiActionDecision,
  AdministrativeOverrideContext,
  ROLE_DEFAULT_DATA_SCOPES,
  STAGE_WORKFLOW_REGISTRY,
  formatCapability,
  parseCapability,
  resolveBrownfieldRole,
  roleHasCapability,
  getRoleCapabilities,
} from '../../types/rbac-models';
import {
  evaluateAuthorization,
  evaluateSegregationOfDuties,
  AuthorizationActor,
  TargetResourceContext,
  AuthorizationDecision,
  AuthorizationErrorCode,
} from '../auth/rbac-evaluator';
import { NAVIGATION_HUBS_REGISTRY, NavigationHubId } from '../../types/frontend-ia';

export interface RecordScopeMetadata {
  authorId?: string;
  createdBy?: string;
  assigneeId?: string;
  stageNumber?: number;
  status?: string;
}

export class CentralAuthorizationService {
  private static instance: CentralAuthorizationService | null = null;

  public static getInstance(): CentralAuthorizationService {
    if (!CentralAuthorizationService.instance) {
      CentralAuthorizationService.instance = new CentralAuthorizationService();
    }
    return CentralAuthorizationService.instance;
  }

  /**
   * Resolves effective canonical roles for an actor.
   */
  public getActorRoles(actor?: AuthorizationActor | null): CanonicalRbacRole[] {
    if (!actor || !actor.id) return [CanonicalRbacRole.QUESTION_AUTHOR];

    const rolesSet = new Set<CanonicalRbacRole>();
    if (actor.role) {
      rolesSet.add(resolveBrownfieldRole(actor.role));
    }
    if (Array.isArray(actor.roles)) {
      actor.roles.forEach((r) => {
        if (r) rolesSet.add(resolveBrownfieldRole(r));
      });
    }

    if (rolesSet.size === 0) {
      rolesSet.add(CanonicalRbacRole.QUESTION_AUTHOR);
    }

    return Array.from(rolesSet);
  }

  /**
   * Helper: checks if actor has Administrator authority.
   */
  public isAdmin(actor?: AuthorizationActor | null): boolean {
    const roles = this.getActorRoles(actor);
    return roles.includes(CanonicalRbacRole.ADMIN);
  }

  /**
   * Tier 3: Evaluates whether actor holds a specific capability across any active role.
   */
  public hasCapability(actor: AuthorizationActor, capability: CapabilityString): boolean {
    if (!actor || !actor.id) return false;
    const roles = this.getActorRoles(actor);
    return roles.some((r) => roleHasCapability(r, capability));
  }

  /**
   * Tier 4: Page Access Resolution
   */
  public canAccessPage(actor: AuthorizationActor, path: string): boolean {
    if (!actor || !actor.id) return false;
    if (this.isAdmin(actor)) return true;

    const normalizedPath = path.toLowerCase().split('?')[0];

    // Home / Dashboard
    if (normalizedPath === '/' || normalizedPath === '/dashboard' || normalizedPath === '/my-work') {
      return true;
    }

    // Question routes
    if (normalizedPath.startsWith('/questions') || normalizedPath.startsWith('/studio')) {
      return this.hasCapability(actor, 'QUESTION:VIEW');
    }

    // Video / Production routes
    if (normalizedPath.startsWith('/production') || normalizedPath.startsWith('/videos')) {
      return this.hasCapability(actor, 'VIDEO:VIEW') || this.hasCapability(actor, 'SCRIPT:VIEW');
    }

    // Publishing routes
    if (normalizedPath.startsWith('/publishing') || normalizedPath.startsWith('/platform-packages') || normalizedPath.startsWith('/social-review')) {
      return (
        this.hasCapability(actor, 'PUBLISHING_PACKAGE:VIEW') ||
        this.hasCapability(actor, 'SOCIAL_REVIEW:REVIEW') ||
        this.hasCapability(actor, 'PLATFORM:VIEW')
      );
    }

    // Analytics routes
    if (normalizedPath.startsWith('/analytics')) {
      return this.hasCapability(actor, 'ANALYTICS_SNAPSHOT:VIEW') || this.hasCapability(actor, 'PERFORMANCE_RECORD:VIEW');
    }

    // Management System / Users / Config
    if (normalizedPath.startsWith('/users') || normalizedPath.startsWith('/audit-logs') || normalizedPath.startsWith('/settings')) {
      return this.hasCapability(actor, 'USER:VIEW') || this.hasCapability(actor, 'CONFIGURATION:ADMINISTER');
    }

    return false;
  }

  /**
   * Tier 5: Dynamic UI Action Resolution
   * Resolves VISIBLE, HIDDEN, READ_ONLY, ENABLED, or DISABLED for UI controls.
   */
  public getUiActionState(
    actor: AuthorizationActor,
    resource: AuthorizationResource,
    action: AuthorizationAction,
    targetContext?: TargetResourceContext
  ): UiActionDecision {
    const capability = formatCapability(resource, action);
    const hasCap = this.hasCapability(actor, capability);

    // 1. If actor completely lacks the capability, hide the control
    if (!hasCap) {
      return {
        state: UiActionState.HIDDEN,
        capability,
        reason: `Role lacks capability: ${capability}`,
      };
    }

    // 2. Evaluate Segregation of Duties / Anti-Self-Approval (GAR-02)
    const sodResult = evaluateSegregationOfDuties(actor, targetContext, action);
    if (!sodResult.allowed) {
      const isAdmin = this.isAdmin(actor);
      if (isAdmin) {
        // Admin can perform audited override
        return {
          state: UiActionState.DISABLED,
          capability,
          isOverrideEligible: true,
          reason: 'Self-approval prohibited (GAR-02). System Administrator override available with mandatory justification.',
        };
      }

      return {
        state: UiActionState.DISABLED,
        capability,
        isOverrideEligible: false,
        reason: sodResult.errorMessage || 'Self-approval prohibited: Creator cannot approve their own artifact (GAR-02).',
      };
    }

    // 3. Evaluate Business Preconditions (e.g. editing locked content)
    if (action === AuthorizationAction.EDIT && (targetContext?.status === 'APPROVED' || targetContext?.status === 'LOCKED')) {
      return {
        state: UiActionState.READ_ONLY,
        capability,
        reason: 'Artifact is locked or approved. Create a new revision to edit.',
      };
    }

    // 4. Action is fully enabled
    return {
      state: UiActionState.ENABLED,
      capability,
      isOverrideEligible: false,
    };
  }

  /**
   * Tier 6: Data Scope Resolution
   */
  public getDataScope(actor: AuthorizationActor): DataScope {
    if (!actor || !actor.id) return DataScope.RESTRICTED;
    if (this.isAdmin(actor)) return DataScope.ALL;

    const roles = this.getActorRoles(actor);

    // If any role has ALL scope, actor receives ALL scope
    for (const r of roles) {
      if (ROLE_DEFAULT_DATA_SCOPES[r] === DataScope.ALL) {
        return DataScope.ALL;
      }
    }

    // If any role has STAGE scope
    for (const r of roles) {
      if (ROLE_DEFAULT_DATA_SCOPES[r] === DataScope.STAGE) {
        return DataScope.STAGE;
      }
    }

    // If any role has ASSIGNED scope
    for (const r of roles) {
      if (ROLE_DEFAULT_DATA_SCOPES[r] === DataScope.ASSIGNED) {
        return DataScope.ASSIGNED;
      }
    }

    return DataScope.OWN;
  }

  /**
   * Tier 6: Record-Level Data Access Guard
   */
  public canAccessRecord(actor: AuthorizationActor, meta: RecordScopeMetadata): boolean {
    const scope = this.getDataScope(actor);

    if (scope === DataScope.ALL) {
      return true;
    }

    const authorId = meta.authorId || meta.createdBy;
    if (scope === DataScope.OWN) {
      return Boolean(authorId && authorId === actor.id);
    }

    if (scope === DataScope.ASSIGNED) {
      return Boolean(
        (meta.assigneeId && meta.assigneeId === actor.id) ||
        (authorId && authorId === actor.id)
      );
    }

    if (scope === DataScope.STAGE && meta.stageNumber !== undefined) {
      const stageEligibility = STAGE_WORKFLOW_REGISTRY[meta.stageNumber];
      if (!stageEligibility) return false;
      const roles = this.getActorRoles(actor);
      return roles.some((r) => stageEligibility.eligibleRoles.includes(r));
    }

    return false;
  }

  /**
   * Tier 6: Filters an array of records by the actor's data scope
   */
  public filterRecordsByScope<T>(
    actor: AuthorizationActor,
    records: T[],
    extractMeta: (item: T) => RecordScopeMetadata
  ): T[] {
    const scope = this.getDataScope(actor);
    if (scope === DataScope.ALL) {
      return records;
    }
    return records.filter((item) => this.canAccessRecord(actor, extractMeta(item)));
  }

  /**
   * Tier 7: Stage Workflow Eligibility Check
   */
  public isWorkflowStageEligible(
    actor: AuthorizationActor,
    stageNumber: number
  ): { eligible: boolean; primaryRole: CanonicalRbacRole; canAdminOverride: boolean } {
    const config = STAGE_WORKFLOW_REGISTRY[stageNumber];
    if (!config) {
      return { eligible: false, primaryRole: CanonicalRbacRole.QUESTION_AUTHOR, canAdminOverride: false };
    }

    if (this.isAdmin(actor)) {
      return { eligible: true, primaryRole: config.primaryRole, canAdminOverride: true };
    }

    const roles = this.getActorRoles(actor);
    const eligible = roles.some((r) => config.eligibleRoles.includes(r));
    return {
      eligible,
      primaryRole: config.primaryRole,
      canAdminOverride: config.canAdminOverride,
    };
  }

  /**
   * Authoritative Backend Request Evaluation
   */
  public evaluateRequest(
    actor: AuthorizationActor,
    resource: AuthorizationResource,
    action: AuthorizationAction,
    targetContext?: TargetResourceContext
  ): AuthorizationDecision {
    return evaluateAuthorization({
      actor,
      resource,
      action,
      targetContext,
    });
  }
}

export const centralAuthorizationService = CentralAuthorizationService.getInstance();
