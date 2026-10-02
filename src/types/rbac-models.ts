/**
 * BURRA PARIKSHA CMS — Stage 09 Canonical RBAC & Capability Model
 *
 * Implements the authoritative zero-trust authorization pipeline:
 * User -> Role -> Capabilities -> Resource -> Action -> Authorization Decision
 *
 * Grounded in:
 * - Stage 04 Architecture Principles (AP-004, AP-006, AP-009, AP-014)
 * - Stage 06 Domain Model (28 Canonical Resources)
 * - Stage 07 Canonical 15-Step Workflow (Human-gated boundaries)
 * - Stage 08 State Model (Decoupled state dimensions)
 * - Stage 09 RBAC & Capability Matrix (docs/architecture/09-RBAC-CAPABILITY-MATRIX.md)
 */

// ============================================================================
// 1. CANONICAL RESOURCE TAXONOMY (28 RESOURCES — TRACED TO STAGE 06)
// ============================================================================

export enum AuthorizationResource {
  USER = 'USER',
  ROLE = 'ROLE',
  CAPABILITY = 'CAPABILITY',
  QUESTION = 'QUESTION',
  QUESTION_VERSION = 'QUESTION_VERSION',
  QUESTION_REVIEW = 'QUESTION_REVIEW',
  CONTENT = 'CONTENT',
  SCRIPT = 'SCRIPT',
  SCRIPT_VERSION = 'SCRIPT_VERSION',
  VIDEO = 'VIDEO',
  VIDEO_TAKE = 'VIDEO_TAKE',
  VIDEO_EDIT = 'VIDEO_EDIT',
  MEDIA_ASSET = 'MEDIA_ASSET',
  MEDIA_REFERENCE = 'MEDIA_REFERENCE',
  ARCHIVE_REFERENCE = 'ARCHIVE_REFERENCE',
  THUMBNAIL = 'THUMBNAIL',
  SOCIAL_REVIEW = 'SOCIAL_REVIEW',
  PUBLISHING_PACKAGE = 'PUBLISHING_PACKAGE',
  PUBLICATION = 'PUBLICATION',
  PLATFORM = 'PLATFORM',
  ANALYTICS_SNAPSHOT = 'ANALYTICS_SNAPSHOT',
  PERFORMANCE_RECORD = 'PERFORMANCE_RECORD',
  INTELLIGENCE_INSIGHT = 'INTELLIGENCE_INSIGHT',
  WORKFLOW_INSTANCE = 'WORKFLOW_INSTANCE',
  WORKFLOW_TRANSITION = 'WORKFLOW_TRANSITION',
  NOTIFICATION = 'NOTIFICATION',
  AUDIT_EVENT = 'AUDIT_EVENT',
  CONFIGURATION = 'CONFIGURATION',
}

export const CANONICAL_RESOURCES = Object.values(AuthorizationResource);

// ============================================================================
// 2. CANONICAL ACTION VOCABULARY (23 ACTIONS)
// ============================================================================

export enum AuthorizationAction {
  // Primary Actions (10)
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  PUBLISH = 'PUBLISH',
  ARCHIVE = 'ARCHIVE',
  RESTORE = 'RESTORE',
  DELETE = 'DELETE',
  ADMINISTER = 'ADMINISTER',

  // Specialized Operational Actions (13)
  ASSIGN = 'ASSIGN',
  SUBMIT = 'SUBMIT',
  VERIFY = 'VERIFY',
  REVIEW = 'REVIEW',
  GENERATE = 'GENERATE',
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  EXPORT = 'EXPORT',
  SYNC = 'SYNC',
  SCHEDULE = 'SCHEDULE',
  CANCEL = 'CANCEL',
  RETRY = 'RETRY',
  TRANSITION = 'TRANSITION',
}

export const CANONICAL_ACTIONS = Object.values(AuthorizationAction);

// ============================================================================
// 3. CAPABILITY SYNTAX & TYPE
// Format strictly: RESOURCE:ACTION
// ============================================================================

export type CapabilityString = `${AuthorizationResource}:${AuthorizationAction}`;

export function formatCapability(
  resource: AuthorizationResource,
  action: AuthorizationAction
): CapabilityString {
  return `${resource}:${action}` as CapabilityString;
}

export function parseCapability(capability: string): {
  resource: AuthorizationResource;
  action: AuthorizationAction;
  isValid: boolean;
} {
  const parts = capability.split(':');
  if (parts.length !== 2) {
    return { resource: '' as any, action: '' as any, isValid: false };
  }
  const [resStr, actStr] = parts;
  const isValidResource = CANONICAL_RESOURCES.includes(resStr as AuthorizationResource);
  const isValidAction = CANONICAL_ACTIONS.includes(actStr as AuthorizationAction);
  return {
    resource: resStr as AuthorizationResource,
    action: actStr as AuthorizationAction,
    isValid: isValidResource && isValidAction,
  };
}

// ============================================================================
// 4. CANONICAL ROLES (11 ROLES)
// ============================================================================

export enum CanonicalRbacRole {
  ADMIN = 'ADMIN',
  CONTENT_LEAD = 'CONTENT_LEAD',
  PUBLISHING_LEAD = 'PUBLISHING_LEAD',
  QA_REVIEWER = 'QA_REVIEWER',
  QUESTION_AUTHOR = 'QUESTION_AUTHOR',
  QUESTION_EDITOR = 'QUESTION_EDITOR',
  SCRIPTWRITER = 'SCRIPTWRITER',
  PRESENTER = 'PRESENTER',
  VIDEO_EDITOR = 'VIDEO_EDITOR',
  DESIGNER = 'DESIGNER',
  ANALYST = 'ANALYST',
}

export const CANONICAL_RBAC_ROLES = Object.values(CanonicalRbacRole);

// ============================================================================
// 5. HUMAN-GATED BOUNDARIES (AP-009)
// Steps 02, 07, 09, 10, 14, 15 require human sign-off; AI cannot approve.
// ============================================================================

export const HUMAN_GATED_STAGES = [2, 7, 9, 10, 14, 15] as const;
export type HumanGatedStageNumber = (typeof HUMAN_GATED_STAGES)[number];

export const HUMAN_GATED_CAPABILITIES: readonly CapabilityString[] = [
  'QUESTION_REVIEW:VERIFY',
  'QUESTION:APPROVE',
  'QUESTION:REJECT',
  'VIDEO_EDIT:APPROVE',
  'VIDEO_EDIT:REJECT',
  'SOCIAL_REVIEW:APPROVE',
  'SOCIAL_REVIEW:REJECT',
  'PUBLISHING_PACKAGE:APPROVE',
  'PERFORMANCE_RECORD:REVIEW',
  'INTELLIGENCE_INSIGHT:APPROVE',
] as const;

export const HUMAN_GATED_APPROVAL_CAPABILITIES = HUMAN_GATED_CAPABILITIES;

export function isHumanGatedCapability(capability: string): boolean {
  return HUMAN_GATED_CAPABILITIES.includes(capability as CapabilityString);
}

export function isHumanGatedStage(stage: number): stage is HumanGatedStageNumber {
  return HUMAN_GATED_STAGES.includes(stage as HumanGatedStageNumber);
}

// ============================================================================
// 6. ADMINISTRATIVE CAPABILITIES (Section 13)
// Privileged capabilities strictly segregated to ADMIN.
// ============================================================================

export const ADMINISTRATIVE_CAPABILITIES: readonly CapabilityString[] = [
  'USER:ADMINISTER',
  'ROLE:ADMINISTER',
  'CAPABILITY:ADMINISTER',
  'CONFIGURATION:ADMINISTER',
  'AUDIT_EVENT:VIEW',
  'CONTENT:ARCHIVE',
  'MEDIA_ASSET:RESTORE',
  'QUESTION:DELETE',
] as const;

export function isAdministrativeCapability(capability: string): boolean {
  return ADMINISTRATIVE_CAPABILITIES.includes(capability as CapabilityString);
}

// ============================================================================
// 7. ROLE -> CAPABILITIES BINDING MATRIX (Section 08)
// ============================================================================

export const BASE_UNIVERSAL_CAPABILITIES: readonly CapabilityString[] = [
  'CONTENT:VIEW',
  'NOTIFICATION:VIEW',
];

export const ROLE_CAPABILITIES_MAP: Record<CanonicalRbacRole, readonly CapabilityString[]> = {
  [CanonicalRbacRole.QUESTION_AUTHOR]: [
    ...BASE_UNIVERSAL_CAPABILITIES,
    'QUESTION:VIEW',
    'QUESTION:CREATE',
    'QUESTION:EDIT',
    'QUESTION:SUBMIT',
    'QUESTION_VERSION:CREATE',
  ],
  [CanonicalRbacRole.QUESTION_EDITOR]: [
    ...BASE_UNIVERSAL_CAPABILITIES,
    'QUESTION:VIEW',
    'QUESTION:EDIT',
    'QUESTION:SUBMIT',
    'QUESTION_VERSION:CREATE',
  ],
  [CanonicalRbacRole.QA_REVIEWER]: [
    ...BASE_UNIVERSAL_CAPABILITIES,
    'QUESTION:VIEW',
    'QUESTION_REVIEW:VERIFY',
    'QUESTION:APPROVE',
    'QUESTION:REJECT',
    'SOCIAL_REVIEW:REVIEW',
    'SOCIAL_REVIEW:APPROVE',
    'SOCIAL_REVIEW:REJECT',
  ],
  [CanonicalRbacRole.SCRIPTWRITER]: [
    ...BASE_UNIVERSAL_CAPABILITIES,
    'QUESTION:VIEW',
    'SCRIPT:VIEW',
    'SCRIPT:CREATE',
    'SCRIPT:EDIT',
    'SCRIPT:SUBMIT',
    'SCRIPT_VERSION:CREATE',
  ],
  [CanonicalRbacRole.PRESENTER]: [
    ...BASE_UNIVERSAL_CAPABILITIES,
    'SCRIPT:VIEW',
    'VIDEO:VIEW',
    'VIDEO:EDIT',
    'VIDEO_TAKE:CREATE',
    'MEDIA_REFERENCE:UPLOAD',
  ],
  [CanonicalRbacRole.VIDEO_EDITOR]: [
    ...BASE_UNIVERSAL_CAPABILITIES,
    'VIDEO:VIEW',
    'VIDEO:EDIT',
    'VIDEO_TAKE:VIEW',
    'VIDEO_EDIT:CREATE',
    'VIDEO_EDIT:EDIT',
    'VIDEO_EDIT:SUBMIT',
    'MEDIA_REFERENCE:UPLOAD',
  ],
  [CanonicalRbacRole.CONTENT_LEAD]: [
    ...BASE_UNIVERSAL_CAPABILITIES,
    'CONTENT:CREATE',
    'CONTENT:EDIT',
    'QUESTION:VIEW',
    'QUESTION:APPROVE',
    'QUESTION:REJECT',
    'VIDEO_EDIT:APPROVE',
    'VIDEO_EDIT:REJECT',
    'WORKFLOW_INSTANCE:TRANSITION',
    'PERFORMANCE_RECORD:REVIEW',
    'INTELLIGENCE_INSIGHT:APPROVE',
  ],
  [CanonicalRbacRole.DESIGNER]: [
    ...BASE_UNIVERSAL_CAPABILITIES,
    'THUMBNAIL:VIEW',
    'THUMBNAIL:CREATE',
    'THUMBNAIL:EDIT',
    'THUMBNAIL:SUBMIT',
    'MEDIA_REFERENCE:UPLOAD',
  ],
  [CanonicalRbacRole.PUBLISHING_LEAD]: [
    ...BASE_UNIVERSAL_CAPABILITIES,
    'PUBLISHING_PACKAGE:VIEW',
    'PUBLISHING_PACKAGE:CREATE',
    'PUBLISHING_PACKAGE:EDIT',
    'PUBLISHING_PACKAGE:APPROVE',
    'PUBLICATION:SCHEDULE',
    'PUBLICATION:PUBLISH',
    'PUBLICATION:SYNC',
    'SOCIAL_REVIEW:REVIEW',
    'SOCIAL_REVIEW:APPROVE',
    'SOCIAL_REVIEW:REJECT',
    'PLATFORM:VIEW',
  ],
  [CanonicalRbacRole.ANALYST]: [
    ...BASE_UNIVERSAL_CAPABILITIES,
    'ANALYTICS_SNAPSHOT:VIEW',
    'ANALYTICS_SNAPSHOT:EXPORT',
    'PERFORMANCE_RECORD:VIEW',
    'INTELLIGENCE_INSIGHT:VIEW',
  ],
  [CanonicalRbacRole.ADMIN]: [
    ...BASE_UNIVERSAL_CAPABILITIES,
    'USER:ADMINISTER',
    'ROLE:ADMINISTER',
    'CAPABILITY:ADMINISTER',
    'CONFIGURATION:ADMINISTER',
    'AUDIT_EVENT:VIEW',
    'CONTENT:ARCHIVE',
    'MEDIA_ASSET:RESTORE',
    'QUESTION:DELETE',
    // Oversight and supervisory capabilities across all 6 hubs
    'QUESTION:VIEW',
    'QUESTION:CREATE',
    'QUESTION:EDIT',
    'QUESTION:APPROVE',
    'QUESTION:REJECT',
    'SCRIPT:VIEW',
    'VIDEO:VIEW',
    'VIDEO:EDIT',
    'VIDEO_EDIT:CREATE',
    'VIDEO_EDIT:APPROVE',
    'VIDEO_EDIT:REJECT',
    'THUMBNAIL:VIEW',
    'SOCIAL_REVIEW:REVIEW',
    'SOCIAL_REVIEW:APPROVE',
    'SOCIAL_REVIEW:REJECT',
    'PUBLISHING_PACKAGE:VIEW',
    'PUBLISHING_PACKAGE:APPROVE',
    'PUBLICATION:SCHEDULE',
    'PUBLICATION:PUBLISH',
    'PUBLICATION:SYNC',
    'PLATFORM:VIEW',
    'ANALYTICS_SNAPSHOT:VIEW',
    'PERFORMANCE_RECORD:VIEW',
    'INTELLIGENCE_INSIGHT:VIEW',
    'CONTENT:CREATE',
    'CONTENT:EDIT',
    'WORKFLOW_INSTANCE:TRANSITION',
  ],
};

export const ROLE_CAPABILITY_REGISTRY = ROLE_CAPABILITIES_MAP;

// ============================================================================
// 8. BROWNFIELD 20-ROLE DISPOSITION MAPPING (Section 07)
// ============================================================================

export interface BrownfieldRoleDisposition {
  brownfieldRole: string;
  canonicalRole: CanonicalRbacRole;
  disposition: 'PRESERVE' | 'MODIFY' | 'CONSOLIDATE' | 'DEFER_DECISION';
  description: string;
}

export const BROWNFIELD_ROLE_DISPOSITIONS: Record<string, BrownfieldRoleDisposition> = {
  ADMIN: {
    brownfieldRole: 'ADMIN',
    canonicalRole: CanonicalRbacRole.ADMIN,
    disposition: 'PRESERVE',
    description: 'Core administrative role',
  },
  CONTENT_MANAGER: {
    brownfieldRole: 'CONTENT_MANAGER',
    canonicalRole: CanonicalRbacRole.CONTENT_LEAD,
    disposition: 'PRESERVE',
    description: 'Editorial leadership and workflow management',
  },
  PUBLISHING_MANAGER: {
    brownfieldRole: 'PUBLISHING_MANAGER',
    canonicalRole: CanonicalRbacRole.PUBLISHING_LEAD,
    disposition: 'PRESERVE',
    description: 'Distribution, packaging, and release scheduling',
  },
  REVIEWER: {
    brownfieldRole: 'REVIEWER',
    canonicalRole: CanonicalRbacRole.QA_REVIEWER,
    disposition: 'PRESERVE',
    description: 'Pedagogical and social quality assurance',
  },
  QUESTION_CREATOR: {
    brownfieldRole: 'QUESTION_CREATOR',
    canonicalRole: CanonicalRbacRole.QUESTION_AUTHOR,
    disposition: 'PRESERVE',
    description: 'Curriculum question drafting',
  },
  QUESTION_EDITOR: {
    brownfieldRole: 'QUESTION_EDITOR',
    canonicalRole: CanonicalRbacRole.QUESTION_EDITOR,
    disposition: 'PRESERVE',
    description: 'Pedagogical refinement and formatting',
  },
  SCRIPT_WRITER: {
    brownfieldRole: 'SCRIPT_WRITER',
    canonicalRole: CanonicalRbacRole.SCRIPTWRITER,
    disposition: 'PRESERVE',
    description: 'Short-form presenter script authoring',
  },
  STUDIO_PRESENTER: {
    brownfieldRole: 'STUDIO_PRESENTER',
    canonicalRole: CanonicalRbacRole.PRESENTER,
    disposition: 'PRESERVE',
    description: 'Studio teleprompter and camera takes',
  },
  VIDEO_EDITOR: {
    brownfieldRole: 'VIDEO_EDITOR',
    canonicalRole: CanonicalRbacRole.VIDEO_EDITOR,
    disposition: 'PRESERVE',
    description: 'Master cut video post-production',
  },
  DESIGNER: {
    brownfieldRole: 'DESIGNER',
    canonicalRole: CanonicalRbacRole.DESIGNER,
    disposition: 'PRESERVE',
    description: 'Cover artwork and visual assets',
  },
  ANALYTICS_VIEWER: {
    brownfieldRole: 'ANALYTICS_VIEWER',
    canonicalRole: CanonicalRbacRole.ANALYST,
    disposition: 'PRESERVE',
    description: 'Audience metrics and performance insights',
  },
  TOPIC_LEAD: {
    brownfieldRole: 'TOPIC_LEAD',
    canonicalRole: CanonicalRbacRole.CONTENT_LEAD,
    disposition: 'MODIFY',
    description: 'Scoped curriculum category review',
  },
  TELUGU_TRANSLATOR: {
    brownfieldRole: 'TELUGU_TRANSLATOR',
    canonicalRole: CanonicalRbacRole.QUESTION_EDITOR,
    disposition: 'MODIFY',
    description: 'Specialized Telugu linguistic localization',
  },
  PUBLISHER: {
    brownfieldRole: 'PUBLISHER',
    canonicalRole: CanonicalRbacRole.PUBLISHING_LEAD,
    disposition: 'CONSOLIDATE',
    description: 'Aliased into publishing leadership',
  },
  THUMBNAIL_DESIGNER: {
    brownfieldRole: 'THUMBNAIL_DESIGNER',
    canonicalRole: CanonicalRbacRole.DESIGNER,
    disposition: 'CONSOLIDATE',
    description: 'Aliased into visual design',
  },
  CREATOR: {
    brownfieldRole: 'CREATOR',
    canonicalRole: CanonicalRbacRole.QUESTION_AUTHOR,
    disposition: 'CONSOLIDATE',
    description: 'Legacy alias consolidated',
  },
  EDITOR: {
    brownfieldRole: 'EDITOR',
    canonicalRole: CanonicalRbacRole.QUESTION_EDITOR,
    disposition: 'CONSOLIDATE',
    description: 'Legacy alias consolidated',
  },
  SPEAKER: {
    brownfieldRole: 'SPEAKER',
    canonicalRole: CanonicalRbacRole.PRESENTER,
    disposition: 'CONSOLIDATE',
    description: 'Legacy alias consolidated',
  },
  CONTENT_WRITER: {
    brownfieldRole: 'CONTENT_WRITER',
    canonicalRole: CanonicalRbacRole.SCRIPTWRITER,
    disposition: 'CONSOLIDATE',
    description: 'Legacy alias consolidated',
  },
  COMMUNITY_MANAGER: {
    brownfieldRole: 'COMMUNITY_MANAGER',
    canonicalRole: CanonicalRbacRole.ANALYST,
    disposition: 'DEFER_DECISION',
    description: 'Audience interaction scope deferred',
  },
};

export function resolveBrownfieldRole(rawRole?: string | null): CanonicalRbacRole {
  if (!rawRole) return CanonicalRbacRole.QUESTION_AUTHOR;
  const normalized = String(rawRole).trim().toUpperCase();
  const mapping = BROWNFIELD_ROLE_DISPOSITIONS[normalized];
  if (mapping) return mapping.canonicalRole;

  // Direct canonical check
  if (CANONICAL_RBAC_ROLES.includes(normalized as CanonicalRbacRole)) {
    return normalized as CanonicalRbacRole;
  }

  return CanonicalRbacRole.QUESTION_AUTHOR;
}

export function getRoleCapabilities(role: CanonicalRbacRole): readonly CapabilityString[] {
  return ROLE_CAPABILITIES_MAP[role] || BASE_UNIVERSAL_CAPABILITIES;
}

export function roleHasCapability(
  role: CanonicalRbacRole,
  capability: CapabilityString
): boolean {
  const caps = getRoleCapabilities(role);
  return caps.includes(capability);
}
