/**
 * BURRA PARIKSHA CMS - Canonical Role & Capability Mapping
 * Phase UX-05 & Implementation 01: Global Application Shell
 *
 * Grounded in backend UserRole enum and verified permissions.
 */

import { UserRole } from '../types';

export enum CanonicalRole {
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

export interface RoleDescriptor {
  canonicalRole: CanonicalRole;
  label: string; // User-facing terminology (e.g. "System Administrator")
  description: string;
  badgeColor: string;
}

export const CANONICAL_ROLE_DESCRIPTORS: Record<CanonicalRole, RoleDescriptor> = {
  [CanonicalRole.ADMIN]: {
    canonicalRole: CanonicalRole.ADMIN,
    label: 'System Administrator',
    description: 'Full platform, database restore, and system management control',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  [CanonicalRole.CONTENT_LEAD]: {
    canonicalRole: CanonicalRole.CONTENT_LEAD,
    label: 'Content & Editorial Lead',
    description: 'Pipeline oversight, editorial approval, team operations, and planning',
    badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  },
  [CanonicalRole.PUBLISHING_LEAD]: {
    canonicalRole: CanonicalRole.PUBLISHING_LEAD,
    label: 'Publishing & Social Lead',
    description: 'Quality signoff, multi-platform publishing, and distribution scheduling',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  [CanonicalRole.QA_REVIEWER]: {
    canonicalRole: CanonicalRole.QA_REVIEWER,
    label: 'Quality Assurance Reviewer',
    description: 'Question accuracy verification, script signoff, and social review',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  [CanonicalRole.QUESTION_AUTHOR]: {
    canonicalRole: CanonicalRole.QUESTION_AUTHOR,
    label: 'Question Author / SME',
    description: 'Question generation studio and candidate drafting',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  [CanonicalRole.QUESTION_EDITOR]: {
    canonicalRole: CanonicalRole.QUESTION_EDITOR,
    label: 'Question Proofreader / Editor',
    description: 'Question refinement, explanation enhancement, and pedagogical edits',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  [CanonicalRole.SCRIPTWRITER]: {
    canonicalRole: CanonicalRole.SCRIPTWRITER,
    label: 'Video Scriptwriter',
    description: 'Telugu script authoring, hooks, and teleprompter cues',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  [CanonicalRole.PRESENTER]: {
    canonicalRole: CanonicalRole.PRESENTER,
    label: 'Studio Presenter / Talent',
    description: 'Studio recording queue, teleprompter, and raw footage submission',
    badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  },
  [CanonicalRole.VIDEO_EDITOR]: {
    canonicalRole: CanonicalRole.VIDEO_EDITOR,
    label: 'Post-Production Video Editor',
    description: 'Video timeline editing, visual graphics, audio mastering, and master renders',
    badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  },
  [CanonicalRole.DESIGNER]: {
    canonicalRole: CanonicalRole.DESIGNER,
    label: 'Visual Asset Designer',
    description: 'Thumbnail design candidates, concept generation, and visual assets',
    badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  },
  [CanonicalRole.ANALYST]: {
    canonicalRole: CanonicalRole.ANALYST,
    label: 'Performance Analyst',
    description: 'Multi-platform analytics, audience retention, and intelligence reports',
    badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  },
};

/**
 * Resolves any backend UserRole enum or raw role string alias to its canonical role.
 */
export function resolveCanonicalRole(rawRole?: UserRole | string | null): CanonicalRole {
  if (!rawRole) return CanonicalRole.QUESTION_AUTHOR;
  const normalized = String(rawRole).trim().toUpperCase();

  switch (normalized) {
    case UserRole.ADMIN:
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return CanonicalRole.ADMIN;

    case UserRole.CONTENT_MANAGER:
    case 'CONTENT_MANAGER':
    case 'CONTENT_LEAD':
    case 'EDITORIAL_LEAD':
      return CanonicalRole.CONTENT_LEAD;

    case UserRole.PUBLISHING_MANAGER:
    case 'PUBLISHING_MANAGER':
    case UserRole.PUBLISHER:
    case 'PUBLISHER':
      return CanonicalRole.PUBLISHING_LEAD;

    case UserRole.REVIEWER:
    case 'REVIEWER':
    case 'QA':
    case 'QA_REVIEWER':
      return CanonicalRole.QA_REVIEWER;

    case UserRole.QUESTION_CREATOR:
    case 'QUESTION_CREATOR':
    case UserRole.CREATOR:
    case 'CREATOR':
    case 'QUESTION_AUTHOR':
    case 'SME':
      return CanonicalRole.QUESTION_AUTHOR;

    case UserRole.QUESTION_EDITOR:
    case 'QUESTION_EDITOR':
    case UserRole.EDITOR:
    case 'EDITOR':
      return CanonicalRole.QUESTION_EDITOR;

    case UserRole.SCRIPT_WRITER:
    case 'SCRIPT_WRITER':
    case UserRole.CONTENT_WRITER:
    case 'CONTENT_WRITER':
    case 'SCRIPTWRITER':
      return CanonicalRole.SCRIPTWRITER;

    case UserRole.STUDIO_PRESENTER:
    case 'STUDIO_PRESENTER':
    case UserRole.SPEAKER:
    case 'SPEAKER':
    case 'PRESENTER':
    case 'TALENT':
      return CanonicalRole.PRESENTER;

    case UserRole.VIDEO_EDITOR:
    case 'VIDEO_EDITOR':
      return CanonicalRole.VIDEO_EDITOR;

    case UserRole.THUMBNAIL_DESIGNER:
    case 'THUMBNAIL_DESIGNER':
    case UserRole.DESIGNER:
    case 'DESIGNER':
      return CanonicalRole.DESIGNER;

    case UserRole.ANALYTICS_VIEWER:
    case 'ANALYTICS_VIEWER':
    case 'ANALYST':
      return CanonicalRole.ANALYST;

    case UserRole.TOPIC_LEAD:
    case 'TOPIC_LEAD':
      // Scoped content lead capability
      return CanonicalRole.CONTENT_LEAD;

    default:
      return CanonicalRole.QUESTION_AUTHOR;
  }
}

/**
 * Returns the human-readable user-facing title for a given raw role or canonical role.
 */
export function getRoleDisplayName(rawRole?: UserRole | string | null): string {
  const canonical = resolveCanonicalRole(rawRole);
  return CANONICAL_ROLE_DESCRIPTORS[canonical]?.label || 'Team Member';
}

/**
 * Navigation capabilities enum
 */
export type NavigationCapability =
  | 'VIEW_HOME'
  | 'VIEW_MY_WORK'
  | 'VIEW_QUESTIONS'
  | 'VIEW_QUESTION_STUDIO'
  | 'VIEW_PRODUCTION'
  | 'VIEW_RECORDING_QUEUE'
  | 'VIEW_PUBLISHING'
  | 'VIEW_QUALITY_SIGNOFF'
  | 'VIEW_ANALYTICS'
  | 'VIEW_MANAGEMENT'
  | 'VIEW_PLANNING'
  | 'VIEW_TEAM'
  | 'VIEW_CONTENT_MASTERS'
  | 'VIEW_SYSTEM_HEALTH'
  | 'VIEW_DISASTER_RECOVERY';

/**
 * Evaluates whether a role possesses a navigation capability.
 */
export function hasNavigationCapability(
  rawRole: UserRole | string | undefined | null,
  capability: NavigationCapability
): boolean {
  const canonical = resolveCanonicalRole(rawRole);

  // System Administrator has all capabilities
  if (canonical === CanonicalRole.ADMIN) {
    return true;
  }

  // Disaster Recovery is strictly ADMIN only
  if (capability === 'VIEW_DISASTER_RECOVERY') {
    return false;
  }

  switch (capability) {
    case 'VIEW_HOME':
    case 'VIEW_MY_WORK':
      // All authenticated team members see Home & My Work
      return true;

    case 'VIEW_QUESTIONS':
      return [
        CanonicalRole.ADMIN,
        CanonicalRole.CONTENT_LEAD,
        CanonicalRole.QA_REVIEWER,
        CanonicalRole.QUESTION_AUTHOR,
        CanonicalRole.QUESTION_EDITOR,
        CanonicalRole.SCRIPTWRITER,
        CanonicalRole.ANALYST,
      ].includes(canonical);

    case 'VIEW_QUESTION_STUDIO':
      return [
        CanonicalRole.ADMIN,
        CanonicalRole.CONTENT_LEAD,
        CanonicalRole.QA_REVIEWER,
        CanonicalRole.QUESTION_AUTHOR,
        CanonicalRole.QUESTION_EDITOR,
      ].includes(canonical);

    case 'VIEW_PRODUCTION':
      return [
        CanonicalRole.ADMIN,
        CanonicalRole.CONTENT_LEAD,
        CanonicalRole.QA_REVIEWER,
        CanonicalRole.SCRIPTWRITER,
        CanonicalRole.PRESENTER,
        CanonicalRole.VIDEO_EDITOR,
        CanonicalRole.DESIGNER,
      ].includes(canonical);

    case 'VIEW_RECORDING_QUEUE':
      return [
        CanonicalRole.ADMIN,
        CanonicalRole.CONTENT_LEAD,
        CanonicalRole.PRESENTER,
        CanonicalRole.VIDEO_EDITOR,
      ].includes(canonical);

    case 'VIEW_PUBLISHING':
      return [
        CanonicalRole.ADMIN,
        CanonicalRole.CONTENT_LEAD,
        CanonicalRole.PUBLISHING_LEAD,
        CanonicalRole.QA_REVIEWER,
      ].includes(canonical);

    case 'VIEW_QUALITY_SIGNOFF':
      return [
        CanonicalRole.ADMIN,
        CanonicalRole.CONTENT_LEAD,
        CanonicalRole.PUBLISHING_LEAD,
        CanonicalRole.QA_REVIEWER,
      ].includes(canonical);

    case 'VIEW_ANALYTICS':
      return [
        CanonicalRole.ADMIN,
        CanonicalRole.CONTENT_LEAD,
        CanonicalRole.PUBLISHING_LEAD,
        CanonicalRole.ANALYST,
      ].includes(canonical);

    case 'VIEW_MANAGEMENT':
    case 'VIEW_PLANNING':
    case 'VIEW_TEAM':
    case 'VIEW_CONTENT_MASTERS':
      return [
        CanonicalRole.ADMIN,
        CanonicalRole.CONTENT_LEAD,
      ].includes(canonical);

    case 'VIEW_SYSTEM_HEALTH':
      return [
        CanonicalRole.ADMIN,
        CanonicalRole.CONTENT_LEAD,
      ].includes(canonical);

    default:
      return false;
  }
}
