/**
 * BURRA PARIKSHA CMS — Stage 10 Frontend & Information Architecture
 *
 * Implements the authoritative frontend navigation topology, 6 frozen hubs,
 * 15-step canonical workflow route contracts, and capability-aware visibility resolvers.
 *
 * Grounded in:
 * - Stage 04 Architecture Principles (AP-001, AP-004, AP-006, AP-009)
 * - Stage 07 Canonical 15-Step Workflow (Step 01 through Step 15)
 * - Stage 08 State Model (5 Decoupled Dimensions in UI)
 * - Stage 09 RBAC & Capability Model (AuthorizationResource, CapabilityString)
 * - Stage 10 Frontend IA (docs/architecture/10-FRONTEND-IA.md)
 */

import { AuthorizationResource, AuthorizationAction, type CapabilityString } from './rbac-models';

// ============================================================================
// 1. THE SIX FROZEN NAVIGATION HUBS
// ============================================================================

export enum NavigationHubId {
  HOME = 'HOME',
  QUESTIONS = 'QUESTIONS',
  PRODUCTION = 'PRODUCTION',
  PUBLISHING = 'PUBLISHING',
  ANALYTICS = 'ANALYTICS',
  MANAGEMENT_SYSTEM = 'MANAGEMENT_SYSTEM',
}

export interface NavigationItem {
  id: string;
  label: string;
  route: string;
  description: string;
  requiredCapabilities: readonly CapabilityString[];
  badgeKey?: string;
  isExternal?: boolean;
}

export interface NavigationHub {
  id: NavigationHubId;
  label: string;
  description: string;
  iconName: string;
  primaryRoute: string;
  requiredCapabilities: readonly CapabilityString[]; // Any match grants hub visibility
  items: readonly NavigationItem[];
}

// ============================================================================
// 2. FROZEN HUB REGISTRY (MAPPING THE 6 HUBS & SUB-WORKSPACES)
// ============================================================================

export const NAVIGATION_HUBS_REGISTRY: Record<NavigationHubId, NavigationHub> = {
  [NavigationHubId.HOME]: {
    id: NavigationHubId.HOME,
    label: 'Home',
    description: 'Central operational launchpad and personal task coordination center',
    iconName: 'Home',
    primaryRoute: '/dashboard',
    requiredCapabilities: ['CONTENT:VIEW', 'NOTIFICATION:VIEW'],
    items: [
      {
        id: 'home-overview',
        label: 'Overview',
        route: '/dashboard',
        description: 'Operations pulse, daily metrics, and 15-stage bottleneck radar',
        requiredCapabilities: ['CONTENT:VIEW'],
      },
      {
        id: 'home-my-work',
        label: 'My Work',
        route: '/my-work',
        description: 'Personal assignment queue and pending review tasks',
        requiredCapabilities: ['CONTENT:VIEW', 'NOTIFICATION:VIEW'],
      },
    ],
  },

  [NavigationHubId.QUESTIONS]: {
    id: NavigationHubId.QUESTIONS,
    label: 'Questions',
    description: 'Management and creation of the pedagogical curriculum core',
    iconName: 'HelpCircle',
    primaryRoute: '/questions',
    requiredCapabilities: ['QUESTION:VIEW'],
    items: [
      {
        id: 'questions-library',
        label: 'Question Library',
        route: '/questions',
        description: 'Curriculum repository, search, and topic taxonomy filtering',
        requiredCapabilities: ['QUESTION:VIEW'],
      },
      {
        id: 'questions-studio',
        label: 'Question Studio',
        route: '/studio',
        description: 'Pedagogical authoring, mathematical proofs, and AI assistance',
        requiredCapabilities: ['QUESTION:CREATE', 'QUESTION:EDIT'],
      },
    ],
  },

  [NavigationHubId.PRODUCTION]: {
    id: NavigationHubId.PRODUCTION,
    label: 'Production',
    description: 'End-to-end media manufacturing from scripts to master video cuts',
    iconName: 'Video',
    primaryRoute: '/production',
    requiredCapabilities: ['VIDEO:VIEW', 'SCRIPT:VIEW'],
    items: [
      {
        id: 'production-queue',
        label: 'Recording Queue',
        route: '/queue',
        description: 'Studio filming schedule, teleprompter, and camera take intake',
        requiredCapabilities: ['VIDEO:VIEW', 'SCRIPT:VIEW'],
      },
      {
        id: 'production-bay',
        label: 'Production Bay',
        route: '/production',
        description: 'Post-production cuts, timeline edits, and master MP4 renders',
        requiredCapabilities: ['VIDEO:EDIT', 'VIDEO_EDIT:CREATE'],
      },
    ],
  },

  [NavigationHubId.PUBLISHING]: {
    id: NavigationHubId.PUBLISHING,
    label: 'Publishing',
    description: 'Quality gate certification and multi-platform social distribution',
    iconName: 'Share2',
    primaryRoute: '/publishing',
    requiredCapabilities: ['PUBLISHING_PACKAGE:VIEW', 'SOCIAL_REVIEW:REVIEW'],
    items: [
      {
        id: 'publishing-quality-signoff',
        label: 'Quality Signoff',
        route: '/social-review',
        description: 'Stage 09 9:16 mobile simulator and final editorial sign-off',
        requiredCapabilities: ['SOCIAL_REVIEW:REVIEW', 'SOCIAL_REVIEW:APPROVE'],
      },
      {
        id: 'publishing-hub',
        label: 'Publishing Hub',
        route: '/publishing',
        description: 'Multi-platform packaging, scheduling, and live channel sync',
        requiredCapabilities: ['PUBLISHING_PACKAGE:VIEW', 'PUBLICATION:SCHEDULE', 'PUBLICATION:PUBLISH'],
      },
    ],
  },

  [NavigationHubId.ANALYTICS]: {
    id: NavigationHubId.ANALYTICS,
    label: 'Analytics',
    description: 'Audience retention analysis and pedagogical intelligence synthesis',
    iconName: 'BarChart3',
    primaryRoute: '/analytics/engagement',
    requiredCapabilities: ['ANALYTICS_SNAPSHOT:VIEW'],
    items: [
      {
        id: 'analytics-hub',
        label: 'Analytics Hub',
        route: '/analytics/engagement',
        description: 'View metrics, watch time, and 3-second hook drop-off curves',
        requiredCapabilities: ['ANALYTICS_SNAPSHOT:VIEW'],
      },
      {
        id: 'analytics-intelligence',
        label: 'Intelligence Loop',
        route: '/analytics/intelligence',
        description: 'Pedagogical curriculum recommendations looping back to Studio',
        requiredCapabilities: ['INTELLIGENCE_INSIGHT:VIEW'],
      },
    ],
  },

  [NavigationHubId.MANAGEMENT_SYSTEM]: {
    id: NavigationHubId.MANAGEMENT_SYSTEM,
    label: 'Management & System',
    description: 'Administrative platform control, syllabus planning, and disaster recovery',
    iconName: 'Shield',
    primaryRoute: '/planning',
    requiredCapabilities: ['USER:ADMINISTER', 'ROLE:ADMINISTER', 'CONFIGURATION:ADMINISTER', 'CONTENT:CREATE'],
    items: [
      {
        id: 'mgmt-planning',
        label: 'Planning & Batches',
        route: '/planning',
        description: 'Syllabus topic coverage radar and sprint batch scheduling',
        requiredCapabilities: ['CONTENT:CREATE'],
      },
      {
        id: 'mgmt-team',
        label: 'Team Workload',
        route: '/team',
        description: 'Operator assignments and production capacity dashboard',
        requiredCapabilities: ['USER:ADMINISTER', 'ROLE:ADMINISTER'],
      },
      {
        id: 'mgmt-content-explorer',
        label: 'Content Explorer',
        route: '/content-masters',
        description: 'Global aggregate lifecycle explorer across all 28 entities',
        requiredCapabilities: ['CONTENT:VIEW'],
      },
      {
        id: 'mgmt-settings',
        label: 'System Health',
        route: '/settings',
        description: 'Taxonomies, API keys, and external integration health',
        requiredCapabilities: ['CONFIGURATION:ADMINISTER'],
      },
      {
        id: 'mgmt-recovery',
        label: 'Disaster Recovery',
        route: '/recovery',
        description: 'Database snapshot backups, dry-run restore, and verification',
        requiredCapabilities: ['CONFIGURATION:ADMINISTER'],
      },
    ],
  },
};

// ============================================================================
// 3. CANONICAL 15-STEP ROUTING CONTRACT (STAGE 07 MAPPING)
// ============================================================================

export interface WorkflowStepRouteContract {
  stepNumber: number;
  stepName: string;
  canonicalRoutePattern: string;
  requiredCapabilities: readonly CapabilityString[];
  isHumanGated: boolean;
  hubId: NavigationHubId;
}

export const CANONICAL_STEP_ROUTES: readonly WorkflowStepRouteContract[] = [
  {
    stepNumber: 1,
    stepName: 'Question Generation',
    canonicalRoutePattern: '/studio',
    requiredCapabilities: ['QUESTION:CREATE', 'QUESTION:EDIT'],
    isHumanGated: false,
    hubId: NavigationHubId.QUESTIONS,
  },
  {
    stepNumber: 2,
    stepName: 'Question Verification',
    canonicalRoutePattern: '/questions/:id/verify',
    requiredCapabilities: ['QUESTION_REVIEW:VERIFY', 'QUESTION:APPROVE'],
    isHumanGated: true,
    hubId: NavigationHubId.QUESTIONS,
  },
  {
    stepNumber: 3,
    stepName: 'Audience Script',
    canonicalRoutePattern: '/videos/:id?tab=script',
    requiredCapabilities: ['SCRIPT:CREATE', 'SCRIPT:EDIT'],
    isHumanGated: false,
    hubId: NavigationHubId.PRODUCTION,
  },
  {
    stepNumber: 4,
    stepName: 'Teleprompter & Filming',
    canonicalRoutePattern: '/videos/:id?tab=recording',
    requiredCapabilities: ['SCRIPT:VIEW', 'VIDEO:EDIT', 'VIDEO_TAKE:CREATE'],
    isHumanGated: false,
    hubId: NavigationHubId.PRODUCTION,
  },
  {
    stepNumber: 5,
    stepName: 'Raw Video',
    canonicalRoutePattern: '/videos/:id?tab=recording',
    requiredCapabilities: ['MEDIA_REFERENCE:UPLOAD'],
    isHumanGated: false,
    hubId: NavigationHubId.PRODUCTION,
  },
  {
    stepNumber: 6,
    stepName: 'Editing Bay',
    canonicalRoutePattern: '/videos/:id?tab=editing',
    requiredCapabilities: ['VIDEO_EDIT:CREATE', 'VIDEO_EDIT:EDIT'],
    isHumanGated: false,
    hubId: NavigationHubId.PRODUCTION,
  },
  {
    stepNumber: 7,
    stepName: 'Final QC',
    canonicalRoutePattern: '/videos/:id?tab=final-review',
    requiredCapabilities: ['VIDEO_EDIT:APPROVE'],
    isHumanGated: true,
    hubId: NavigationHubId.PRODUCTION,
  },
  {
    stepNumber: 8,
    stepName: 'Thumbnail',
    canonicalRoutePattern: '/videos/:id?tab=thumbnail',
    requiredCapabilities: ['THUMBNAIL:CREATE', 'THUMBNAIL:EDIT'],
    isHumanGated: false,
    hubId: NavigationHubId.PRODUCTION,
  },
  {
    stepNumber: 9,
    stepName: 'Social Review',
    canonicalRoutePattern: '/social-review/:reviewId',
    requiredCapabilities: ['SOCIAL_REVIEW:APPROVE'],
    isHumanGated: true,
    hubId: NavigationHubId.PUBLISHING,
  },
  {
    stepNumber: 10,
    stepName: 'Publishing Setup',
    canonicalRoutePattern: '/publishing',
    requiredCapabilities: ['PUBLISHING_PACKAGE:APPROVE'],
    isHumanGated: true,
    hubId: NavigationHubId.PUBLISHING,
  },
  {
    stepNumber: 11,
    stepName: 'Published',
    canonicalRoutePattern: '/publishing',
    requiredCapabilities: ['PUBLICATION:PUBLISH'],
    isHumanGated: false,
    hubId: NavigationHubId.PUBLISHING,
  },
  {
    stepNumber: 12,
    stepName: 'Platform Sync',
    canonicalRoutePattern: '/platform-packages',
    requiredCapabilities: ['PUBLICATION:SYNC'],
    isHumanGated: false,
    hubId: NavigationHubId.PUBLISHING,
  },
  {
    stepNumber: 13,
    stepName: 'Analytics',
    canonicalRoutePattern: '/analytics/engagement',
    requiredCapabilities: ['ANALYTICS_SNAPSHOT:VIEW'],
    isHumanGated: false,
    hubId: NavigationHubId.ANALYTICS,
  },
  {
    stepNumber: 14,
    stepName: 'Performance Review',
    canonicalRoutePattern: '/analytics/engagement',
    requiredCapabilities: ['PERFORMANCE_RECORD:REVIEW'],
    isHumanGated: true,
    hubId: NavigationHubId.ANALYTICS,
  },
  {
    stepNumber: 15,
    stepName: 'Intelligence Loop',
    canonicalRoutePattern: '/analytics/intelligence',
    requiredCapabilities: ['INTELLIGENCE_INSIGHT:APPROVE'],
    isHumanGated: true,
    hubId: NavigationHubId.ANALYTICS,
  },
] as const;

// ============================================================================
// 4. CAPABILITY-AWARE NAVIGATION VISIBILITY RESOLVER
// Note: Frontend visibility optimizes UX; backend server is authoritative (AP-004).
// ============================================================================

export function canAccessHub(hub: NavigationHub, userCapabilities: ReadonlySet<string>): boolean {
  return hub.requiredCapabilities.some(cap => userCapabilities.has(cap));
}

export function canAccessNavItem(item: NavigationItem, userCapabilities: ReadonlySet<string>): boolean {
  return item.requiredCapabilities.some(cap => userCapabilities.has(cap));
}

export interface VisibleHubView {
  id: NavigationHubId;
  label: string;
  iconName: string;
  primaryRoute: string;
  items: readonly NavigationItem[];
}

export function resolveVisibleNavigation(userCapabilities: ReadonlySet<string>): VisibleHubView[] {
  const visibleHubs: VisibleHubView[] = [];

  for (const hub of Object.values(NAVIGATION_HUBS_REGISTRY)) {
    if (!canAccessHub(hub, userCapabilities)) {
      continue;
    }

    const accessibleItems = hub.items.filter(item => canAccessNavItem(item, userCapabilities));
    if (accessibleItems.length > 0) {
      visibleHubs.push({
        id: hub.id,
        label: hub.label,
        iconName: hub.iconName,
        primaryRoute: accessibleItems[0].route,
        items: accessibleItems,
      });
    }
  }

  return visibleHubs;
}

// ============================================================================
// 5. PROHIBITED NAVIGATION ANTI-PATTERNS (ANTI-09 CONTRACT)
// ============================================================================

export const PROHIBITED_NAVIGATION_ANTI_PATTERNS = [
  'ANTI_PAT_01_FLOATING_ORPHAN_NAV', // Competing navigation sidebars
  'ANTI_PAT_02_STATE_CONFLATED_BADGES', // Blending business step with job/media state
  'ANTI_PAT_03_CLIENT_ONLY_AUTHORIZATION', // Hiding a button without server check
  'ANTI_PAT_04_UNLINKED_STEP_JUMP', // Jumping workflow steps without transition check
  'ANTI_PAT_05_LOST_CRUMB_CONTEXT', // Navigating into sub-workbenches without breadcrumbs
  'ANTI_PAT_06_SILENT_FAILURE_TOASTS', // Masking editorial rejection as a technical error
] as const;
