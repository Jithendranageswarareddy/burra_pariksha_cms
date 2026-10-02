/**
 * BURRA PARIKSHA CMS — Stage 11 Page & Route Contracts
 *
 * Implements the authoritative, strongly typed Page & Route Contract:
 * - 14 Canonical Production Routes
 * - 5-Dimensional UI State Pattern (Loading, Empty, Error, 403 Forbidden, Success)
 * - Stage 06 Domain Resource & Stage 07 Workflow Step Bindings
 * - Stage 09 RBAC Capabilities & Permitted Actions
 * - Brownfield 78-Route Migration Registry
 *
 * Grounded in:
 * - Stage 04 Architecture Principles (AP-001, AP-004, AP-006, AP-009)
 * - Stage 06 Domain Model (28 Canonical Resources)
 * - Stage 07 Canonical 15-Step Workflow (Steps 01 through 15)
 * - Stage 08 State Model (5 Decoupled Dimensions)
 * - Stage 09 RBAC Model (Strict RESOURCE:ACTION Capabilities)
 * - Stage 10 Frontend IA (6 Core Hubs)
 * - Stage 11 Page & Route Contract (docs/architecture/11-PAGE-ROUTE-CONTRACT.md)
 */

import {
  AuthorizationResource,
  AuthorizationAction,
  type CapabilityString,
} from './rbac-models';
import { NavigationHubId } from './frontend-ia';

// ============================================================================
// 1. CANONICAL ROUTE IDENTIFIERS (14 PRODUCTION ROUTES)
// ============================================================================

export enum CanonicalRouteId {
  DASHBOARD = 'DASHBOARD',
  MY_WORK = 'MY_WORK',
  QUESTIONS_LIBRARY = 'QUESTIONS_LIBRARY',
  QUESTION_STUDIO = 'QUESTION_STUDIO',
  QUESTION_VERIFICATION = 'QUESTION_VERIFICATION',
  RECORDING_QUEUE = 'RECORDING_QUEUE',
  PRODUCTION_BAY = 'PRODUCTION_BAY',
  VIDEO_DETAIL = 'VIDEO_DETAIL',
  SOCIAL_REVIEW = 'SOCIAL_REVIEW',
  PUBLISHING_HUB = 'PUBLISHING_HUB',
  PLATFORM_PACKAGES = 'PLATFORM_PACKAGES',
  ANALYTICS_ENGAGEMENT = 'ANALYTICS_ENGAGEMENT',
  ANALYTICS_INTELLIGENCE = 'ANALYTICS_INTELLIGENCE',
  MANAGEMENT_SETTINGS = 'MANAGEMENT_SETTINGS',
}

export const CANONICAL_ROUTE_IDS = Object.values(CanonicalRouteId);

// ============================================================================
// 2. UI STATE PATTERN INTERFACE (Section 12)
// Enforces 5 distinct UI states for every canonical production route.
// ============================================================================

export interface UiStatePattern {
  loading: string;      // Skeleton loader & progressive hydration strategy
  empty: string;        // Contextual call-to-action without dead ends
  error: string;        // Actionable failure recovery with retry affordance
  forbidden403: string; // Explanatory capability missing notification (AP-004)
  success: string;      // Full interactive production canvas / table / workbench
}

// ============================================================================
// 3. CANONICAL ROUTE CONTRACT INTERFACE
// ============================================================================

export interface CanonicalRouteContract {
  id: CanonicalRouteId;
  name: string;
  routePattern: string;
  hubId: NavigationHubId;
  primaryResource: AuthorizationResource;
  workflowStep: number | null; // 1 to 15 or null if cross-cutting
  workflowStepName: string;
  requiredViewCapabilities: readonly CapabilityString[];
  permittedActions: readonly AuthorizationAction[];
  isHumanGated: boolean;
  uiStates: UiStatePattern;
}

// ============================================================================
// 4. CANONICAL ROUTE CONTRACTS REGISTRY (14 PRODUCTION WORKBENCHES)
// ============================================================================

export const CANONICAL_ROUTE_CONTRACTS: Record<CanonicalRouteId, CanonicalRouteContract> = {
  [CanonicalRouteId.DASHBOARD]: {
    id: CanonicalRouteId.DASHBOARD,
    name: 'Executive Dashboard & Operations Radar',
    routePattern: '/dashboard',
    hubId: NavigationHubId.HOME,
    primaryResource: AuthorizationResource.CONTENT,
    workflowStep: null,
    workflowStepName: 'Cross-Cutting Operational Pulse',
    requiredViewCapabilities: ['CONTENT:VIEW'],
    permittedActions: [AuthorizationAction.VIEW],
    isHumanGated: false,
    uiStates: {
      loading: 'Skeleton radar cards and KPI metric placeholders',
      empty: 'No active production batches. Initialize a batch in Planning.',
      error: 'Failed to aggregate production radar. Click to retry.',
      forbidden403: 'Access denied: Requires CONTENT:VIEW capability.',
      success: 'Active 15-stage bottleneck radar, throughput velocity, and active counts.',
    },
  },

  [CanonicalRouteId.MY_WORK]: {
    id: CanonicalRouteId.MY_WORK,
    name: 'My Assigned Work & Personal Queue',
    routePattern: '/my-work',
    hubId: NavigationHubId.HOME,
    primaryResource: AuthorizationResource.CONTENT,
    workflowStep: null,
    workflowStepName: 'Cross-Cutting Personal Task Handoff',
    requiredViewCapabilities: ['CONTENT:VIEW', 'NOTIFICATION:VIEW'],
    permittedActions: [AuthorizationAction.VIEW],
    isHumanGated: false,
    uiStates: {
      loading: 'Skeleton list of personalized assignment rows',
      empty: 'All caught up! Zero pending assignments in your queue.',
      error: 'Unable to load personal task queue. Click to retry.',
      forbidden403: 'Access denied: Requires NOTIFICATION:VIEW capability.',
      success: 'Prioritized table of authored drafts, reviews, takes, and QC items.',
    },
  },

  [CanonicalRouteId.QUESTIONS_LIBRARY]: {
    id: CanonicalRouteId.QUESTIONS_LIBRARY,
    name: 'Question Library & Curriculum Repository',
    routePattern: '/questions',
    hubId: NavigationHubId.QUESTIONS,
    primaryResource: AuthorizationResource.QUESTION,
    workflowStep: null,
    workflowStepName: 'Master Curriculum Repository',
    requiredViewCapabilities: ['QUESTION:VIEW'],
    permittedActions: [AuthorizationAction.VIEW],
    isHumanGated: false,
    uiStates: {
      loading: 'Skeleton tabular view with category filter badges',
      empty: 'No questions match the current filter criteria.',
      error: 'Failed to retrieve question inventory. Click to refresh.',
      forbidden403: 'Access denied: Requires QUESTION:VIEW capability.',
      success: 'Faceted curriculum table with Telugu proof previews and status tags.',
    },
  },

  [CanonicalRouteId.QUESTION_STUDIO]: {
    id: CanonicalRouteId.QUESTION_STUDIO,
    name: 'Question Studio & Pedagogical Authoring',
    routePattern: '/studio',
    hubId: NavigationHubId.QUESTIONS,
    primaryResource: AuthorizationResource.QUESTION,
    workflowStep: 1,
    workflowStepName: 'Question Generation',
    requiredViewCapabilities: ['QUESTION:CREATE', 'QUESTION:EDIT'],
    permittedActions: [
      AuthorizationAction.CREATE,
      AuthorizationAction.EDIT,
      AuthorizationAction.SUBMIT,
      AuthorizationAction.GENERATE,
    ],
    isHumanGated: false,
    uiStates: {
      loading: 'Editor canvas skeleton with prompt assistant dock',
      empty: 'Studio ready. Click "Create Question" or use AI Draft Assistant.',
      error: 'Draft state synchronization error. Reconnect to cloud storage.',
      forbidden403: 'Access denied: Requires QUESTION:CREATE or QUESTION:EDIT capability.',
      success: 'Full authoring studio with Telugu typography and mathematical proof builder.',
    },
  },

  [CanonicalRouteId.QUESTION_VERIFICATION]: {
    id: CanonicalRouteId.QUESTION_VERIFICATION,
    name: 'Question Verification & Pedagogical Audit',
    routePattern: '/questions/:id/verify',
    hubId: NavigationHubId.QUESTIONS,
    primaryResource: AuthorizationResource.QUESTION,
    workflowStep: 2,
    workflowStepName: 'Question Verification',
    requiredViewCapabilities: ['QUESTION_REVIEW:VERIFY', 'QUESTION:APPROVE'],
    permittedActions: [
      AuthorizationAction.VERIFY,
      AuthorizationAction.APPROVE,
      AuthorizationAction.REJECT,
    ],
    isHumanGated: true,
    uiStates: {
      loading: '10-point audit checklist skeleton and math proof loader',
      empty: 'No question selected for pedagogical verification.',
      error: 'Failed to load question verification docket. Click to reload.',
      forbidden403: 'Access denied: Requires QUESTION_REVIEW:VERIFY capability (GAR-02 applies).',
      success: '10-point pedagogical audit checklist with mandatory feedback fields.',
    },
  },

  [CanonicalRouteId.RECORDING_QUEUE]: {
    id: CanonicalRouteId.RECORDING_QUEUE,
    name: 'Recording Queue & Studio Intake',
    routePattern: '/queue',
    hubId: NavigationHubId.PRODUCTION,
    primaryResource: AuthorizationResource.VIDEO,
    workflowStep: 4,
    workflowStepName: 'Teleprompter & Filming',
    requiredViewCapabilities: ['VIDEO:VIEW', 'SCRIPT:VIEW'],
    permittedActions: [
      AuthorizationAction.VIEW,
      AuthorizationAction.EDIT,
      AuthorizationAction.CREATE,
      AuthorizationAction.UPLOAD,
    ],
    isHumanGated: false,
    uiStates: {
      loading: 'Teleprompter queue cards skeleton with prompter preview',
      empty: 'No scripted questions queued for filming in this studio slot.',
      error: 'Unable to stream filming queue. Check local studio network.',
      forbidden403: 'Access denied: Requires VIDEO:VIEW and SCRIPT:VIEW capability.',
      success: 'Teleprompter display, take logger, and camera Drive upload dropzone.',
    },
  },

  [CanonicalRouteId.PRODUCTION_BAY]: {
    id: CanonicalRouteId.PRODUCTION_BAY,
    name: 'Production Pipeline Bay',
    routePattern: '/production',
    hubId: NavigationHubId.PRODUCTION,
    primaryResource: AuthorizationResource.VIDEO,
    workflowStep: 6,
    workflowStepName: 'Editing Bay',
    requiredViewCapabilities: ['VIDEO:EDIT', 'VIDEO_EDIT:CREATE'],
    permittedActions: [
      AuthorizationAction.EDIT,
      AuthorizationAction.CREATE,
      AuthorizationAction.SUBMIT,
      AuthorizationAction.UPLOAD,
    ],
    isHumanGated: false,
    uiStates: {
      loading: 'Post-production Kanban timeline skeleton',
      empty: 'Zero videos currently in editing or QC phase.',
      error: 'Failed to load video production bay pipeline.',
      forbidden403: 'Access denied: Requires VIDEO:EDIT capability.',
      success: 'Interactive video edit cut tracker and master MP4 staging canvas.',
    },
  },

  [CanonicalRouteId.VIDEO_DETAIL]: {
    id: CanonicalRouteId.VIDEO_DETAIL,
    name: 'Unified Video Production Workbench',
    routePattern: '/videos/:id',
    hubId: NavigationHubId.PRODUCTION,
    primaryResource: AuthorizationResource.VIDEO,
    workflowStep: 6,
    workflowStepName: 'Editing Bay (Tabbed)',
    requiredViewCapabilities: ['VIDEO:VIEW'],
    permittedActions: [
      AuthorizationAction.VIEW,
      AuthorizationAction.EDIT,
      AuthorizationAction.APPROVE,
      AuthorizationAction.REJECT,
    ],
    isHumanGated: true,
    uiStates: {
      loading: 'Multi-tab video project skeleton (Script, Takes, Cut, QC, Cover)',
      empty: 'Video project container not found.',
      error: 'Error resolving video project assets. Verify Google Drive permissions.',
      forbidden403: 'Access denied: Requires VIDEO:VIEW capability.',
      success: 'Unified 5-tab editor canvas with teleprompter, takes, renders, QC, and cover.',
    },
  },

  [CanonicalRouteId.SOCIAL_REVIEW]: {
    id: CanonicalRouteId.SOCIAL_REVIEW,
    name: 'Social Review & 9:16 Mobile Framing Simulator',
    routePattern: '/social-review',
    hubId: NavigationHubId.PUBLISHING,
    primaryResource: AuthorizationResource.SOCIAL_REVIEW,
    workflowStep: 9,
    workflowStepName: 'Social Review',
    requiredViewCapabilities: ['SOCIAL_REVIEW:REVIEW', 'SOCIAL_REVIEW:APPROVE'],
    permittedActions: [
      AuthorizationAction.REVIEW,
      AuthorizationAction.APPROVE,
      AuthorizationAction.REJECT,
    ],
    isHumanGated: true,
    uiStates: {
      loading: 'Mobile simulator viewport skeleton and safe-zone overlay',
      empty: 'No completed master cuts currently awaiting social review.',
      error: 'Failed to stream master MP4 into simulator canvas.',
      forbidden403: 'Access denied: Requires SOCIAL_REVIEW:APPROVE capability.',
      success: 'Interactive 9:16 smartphone simulator with TikTok/Shorts/Reels overlay masks.',
    },
  },

  [CanonicalRouteId.PUBLISHING_HUB]: {
    id: CanonicalRouteId.PUBLISHING_HUB,
    name: 'Publishing & Broadcast Staging Hub',
    routePattern: '/publishing',
    hubId: NavigationHubId.PUBLISHING,
    primaryResource: AuthorizationResource.PUBLISHING_PACKAGE,
    workflowStep: 10,
    workflowStepName: 'Publishing Setup & Live Dispatch',
    requiredViewCapabilities: [
      'PUBLISHING_PACKAGE:VIEW',
      'PUBLICATION:SCHEDULE',
      'PUBLICATION:PUBLISH',
    ],
    permittedActions: [
      AuthorizationAction.APPROVE,
      AuthorizationAction.SCHEDULE,
      AuthorizationAction.PUBLISH,
    ],
    isHumanGated: true,
    uiStates: {
      loading: 'Broadcast calendar and staging card skeleton',
      empty: 'No publishing packages staged for release this week.',
      error: 'Failed to connect to YouTube/Meta release scheduler.',
      forbidden403: 'Access denied: Requires PUBLISHING_PACKAGE:APPROVE capability.',
      success: 'Cross-platform distribution dashboard with YouTube and Instagram staging.',
    },
  },

  [CanonicalRouteId.PLATFORM_PACKAGES]: {
    id: CanonicalRouteId.PLATFORM_PACKAGES,
    name: 'Cross-Platform Channel Sync Hub',
    routePattern: '/platform-packages',
    hubId: NavigationHubId.PUBLISHING,
    primaryResource: AuthorizationResource.PUBLICATION,
    workflowStep: 12,
    workflowStepName: 'Platform Sync',
    requiredViewCapabilities: ['PUBLICATION:SYNC'],
    permittedActions: [AuthorizationAction.SYNC, AuthorizationAction.VIEW],
    isHumanGated: false,
    uiStates: {
      loading: 'Platform synchronization status grid skeleton',
      empty: 'Zero broadcast publications awaiting platform synchronization.',
      error: 'Platform sync check failed. Check OAuth tokens in Settings.',
      forbidden403: 'Access denied: Requires PUBLICATION:SYNC capability.',
      success: 'Real-time sync matrix comparing internal publication state to platform URLs.',
    },
  },

  [CanonicalRouteId.ANALYTICS_ENGAGEMENT]: {
    id: CanonicalRouteId.ANALYTICS_ENGAGEMENT,
    name: 'Audience Retention & Performance Analytics',
    routePattern: '/analytics/engagement',
    hubId: NavigationHubId.ANALYTICS,
    primaryResource: AuthorizationResource.ANALYTICS_SNAPSHOT,
    workflowStep: 13,
    workflowStepName: 'Analytics & Performance Review',
    requiredViewCapabilities: ['ANALYTICS_SNAPSHOT:VIEW'],
    permittedActions: [
      AuthorizationAction.VIEW,
      AuthorizationAction.EXPORT,
      AuthorizationAction.REVIEW,
    ],
    isHumanGated: true,
    uiStates: {
      loading: 'Retention graph skeleton and drop-off point loader',
      empty: 'No analytics telemetry captured yet. Check back 24h after publishing.',
      error: 'Failed to aggregate external engagement metrics.',
      forbidden403: 'Access denied: Requires ANALYTICS_SNAPSHOT:VIEW capability.',
      success: 'Second-by-second retention curve with 3-second hook survival rates.',
    },
  },

  [CanonicalRouteId.ANALYTICS_INTELLIGENCE]: {
    id: CanonicalRouteId.ANALYTICS_INTELLIGENCE,
    name: 'Pedagogical Intelligence & Curriculum Loopback',
    routePattern: '/analytics/intelligence',
    hubId: NavigationHubId.ANALYTICS,
    primaryResource: AuthorizationResource.INTELLIGENCE_INSIGHT,
    workflowStep: 15,
    workflowStepName: 'Intelligence Loop',
    requiredViewCapabilities: ['INTELLIGENCE_INSIGHT:VIEW'],
    permittedActions: [AuthorizationAction.VIEW, AuthorizationAction.APPROVE],
    isHumanGated: true,
    uiStates: {
      loading: 'AI insight synthesis card skeleton',
      empty: 'Zero recommendations generated. More retention data required.',
      error: 'Failed to synthesize pedagogical intelligence insights.',
      forbidden403: 'Access denied: Requires INTELLIGENCE_INSIGHT:VIEW capability.',
      success: 'Curriculum optimization cards ready to inject into Question Studio.',
    },
  },

  [CanonicalRouteId.MANAGEMENT_SETTINGS]: {
    id: CanonicalRouteId.MANAGEMENT_SETTINGS,
    name: 'System Settings, Taxonomies & Integrations',
    routePattern: '/settings',
    hubId: NavigationHubId.MANAGEMENT_SYSTEM,
    primaryResource: AuthorizationResource.CONFIGURATION,
    workflowStep: null,
    workflowStepName: 'Platform Governance & Taxonomies',
    requiredViewCapabilities: ['CONFIGURATION:ADMINISTER'],
    permittedActions: [AuthorizationAction.ADMINISTER, AuthorizationAction.VIEW],
    isHumanGated: false,
    uiStates: {
      loading: 'Configuration drawer skeleton and integration status badges',
      empty: 'All system settings populated and active.',
      error: 'Failed to save configuration updates. Administrator permission required.',
      forbidden403: 'Access denied: Requires CONFIGURATION:ADMINISTER capability (Admin only).',
      success: 'Taxonomy controls, LLM prompt templates, Google Drive roots, and API keys.',
    },
  },
};

// ============================================================================
// 5. BROWNFIELD ROUTE DISPOSITION & MIGRATION REGISTRY (78 ROUTES)
// ============================================================================

export type BrownfieldRouteDispositionType =
  | 'PRESERVED'
  | 'ALIAS'
  | 'CONSOLIDATE'
  | 'RETIRE';

export interface BrownfieldRouteMigrationEntry {
  route: string;
  disposition: BrownfieldRouteDispositionType;
  targetRoute: string;
  notes: string;
}

export const BROWNFIELD_ROUTE_MIGRATION_REGISTRY: readonly BrownfieldRouteMigrationEntry[] = [
  { route: '/', disposition: 'PRESERVED', targetRoute: '/', notes: 'Root Shell redirect to role-specific landing route' },
  { route: '/dashboard', disposition: 'PRESERVED', targetRoute: '/dashboard', notes: 'Operational pulse & metrics' },
  { route: '/planning', disposition: 'PRESERVED', targetRoute: '/planning', notes: 'Syllabus coverage & sprint batches' },
  { route: '/questions', disposition: 'PRESERVED', targetRoute: '/questions', notes: 'Master curriculum repository' },
  { route: '/content-masters', disposition: 'PRESERVED', targetRoute: '/content-masters', notes: 'Global aggregate lifecycle explorer' },
  { route: '/content-masters/:id', disposition: 'PRESERVED', targetRoute: '/content-masters/:id', notes: 'Canonical aggregate root detail view' },
  { route: '/social-review', disposition: 'PRESERVED', targetRoute: '/social-review', notes: 'Stage 09 mobile preview sign-off queue' },
  { route: '/social-review/:reviewId', disposition: 'PRESERVED', targetRoute: '/social-review/:reviewId', notes: '9:16 mobile review simulator' },
  { route: '/studio', disposition: 'PRESERVED', targetRoute: '/studio', notes: 'Unified question authoring studio' },
  { route: '/questions/new', disposition: 'ALIAS', targetRoute: '/studio', notes: 'Redirects to /studio' },
  { route: '/questions/improve', disposition: 'ALIAS', targetRoute: '/studio?mode=improve', notes: 'Redirects to /studio with improve mode' },
  { route: '/questions/:id/improve', disposition: 'ALIAS', targetRoute: '/studio?id=:id&mode=improve', notes: 'Redirects to /studio with question ID' },
  { route: '/questions/verify', disposition: 'ALIAS', targetRoute: '/questions?filter=verify', notes: 'Redirects to /questions with verify filter' },
  { route: '/questions/:id/verify', disposition: 'PRESERVED', targetRoute: '/questions/:id/verify', notes: 'Stage 02 pedagogical audit workbench' },
  { route: '/questions/:id', disposition: 'PRESERVED', targetRoute: '/questions/:id', notes: 'Question detail & version ledger' },
  { route: '/generate', disposition: 'ALIAS', targetRoute: '/studio', notes: 'Redirects to unified Question Studio' },
  { route: '/queue', disposition: 'PRESERVED', targetRoute: '/queue', notes: 'Studio filming schedule & prompter' },
  { route: '/production', disposition: 'PRESERVED', targetRoute: '/production', notes: 'Multi-stage production bay' },
  { route: '/production-tracker', disposition: 'ALIAS', targetRoute: '/production', notes: 'Redirects to unified Production Bay' },
  { route: '/production-board', disposition: 'ALIAS', targetRoute: '/production?view=kanban', notes: 'Redirects to Kanban view of Production' },
  { route: '/videos/create-script', disposition: 'ALIAS', targetRoute: '/queue', notes: 'Redirects to Queue' },
  { route: '/videos/:videoId/script', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=script', notes: 'Consolidated into tabbed workbench' },
  { route: '/production/:videoId/script', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=script', notes: 'Consolidated into tabbed workbench' },
  { route: '/videos/:videoId/create-script', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=script', notes: 'Consolidated into tabbed workbench' },
  { route: '/production/:videoId/create-script', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=script', notes: 'Consolidated into tabbed workbench' },
  { route: '/videos/review-script', disposition: 'ALIAS', targetRoute: '/production', notes: 'Redirects to Production Bay' },
  { route: '/videos/:videoId/review-script', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=script', notes: 'Consolidated into tabbed workbench' },
  { route: '/production/:videoId/review-script', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=script', notes: 'Consolidated into tabbed workbench' },
  { route: '/videos/record', disposition: 'ALIAS', targetRoute: '/queue', notes: 'Redirects to Studio Queue' },
  { route: '/videos/:videoId/record', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=recording', notes: 'Consolidated into tabbed workbench' },
  { route: '/production/:videoId/record', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=recording', notes: 'Consolidated into tabbed workbench' },
  { route: '/videos/edit-video', disposition: 'ALIAS', targetRoute: '/production', notes: 'Redirects to Production Bay' },
  { route: '/videos/:videoId/edit-video', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=editing', notes: 'Consolidated into tabbed workbench' },
  { route: '/production/:videoId/edit-video', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=editing', notes: 'Consolidated into tabbed workbench' },
  { route: '/videos/final-video', disposition: 'ALIAS', targetRoute: '/production', notes: 'Redirects to Production Bay' },
  { route: '/videos/:videoId/final-video', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=final-review', notes: 'Consolidated into tabbed workbench' },
  { route: '/production/:videoId/final-video', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=final-review', notes: 'Consolidated into tabbed workbench' },
  { route: '/videos/thumbnail', disposition: 'ALIAS', targetRoute: '/production', notes: 'Redirects to Production Bay' },
  { route: '/videos/:videoId/thumbnail', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=thumbnail', notes: 'Consolidated into tabbed workbench' },
  { route: '/production/:videoId/thumbnail', disposition: 'CONSOLIDATE', targetRoute: '/videos/:videoId?tab=thumbnail', notes: 'Consolidated into tabbed workbench' },
  { route: '/videos/pinned-comment', disposition: 'ALIAS', targetRoute: '/social-review', notes: 'Redirects to Social Review' },
  { route: '/videos/:videoId/pinned-comment', disposition: 'ALIAS', targetRoute: '/social-review', notes: 'Redirects to Social Review' },
  { route: '/production/:videoId/pinned-comment', disposition: 'ALIAS', targetRoute: '/social-review', notes: 'Redirects to Social Review' },
  { route: '/videos/:videoId/social-review', disposition: 'ALIAS', targetRoute: '/social-review/:reviewId', notes: 'Redirects to mobile simulator review' },
  { route: '/production/:videoId/social-review', disposition: 'ALIAS', targetRoute: '/social-review/:reviewId', notes: 'Redirects to mobile simulator review' },
  { route: '/production/:videoId', disposition: 'ALIAS', targetRoute: '/videos/:videoId', notes: 'Redirects to canonical video detail workbench' },
  { route: '/videos/:videoId', disposition: 'PRESERVED', targetRoute: '/videos/:videoId', notes: 'Unified video post-production workbench' },
  { route: '/platform-packages', disposition: 'PRESERVED', targetRoute: '/platform-packages', notes: 'Stage 12 multi-platform sync hub' },
  { route: '/videos/platform-packages', disposition: 'ALIAS', targetRoute: '/platform-packages', notes: 'Redirects to Platform Sync Hub' },
  { route: '/videos/:videoId/platform-packages', disposition: 'ALIAS', targetRoute: '/platform-packages', notes: 'Redirects to Platform Sync Hub' },
  { route: '/production/:videoId/platform-packages', disposition: 'ALIAS', targetRoute: '/platform-packages', notes: 'Redirects to Platform Sync Hub' },
  { route: '/publishing-package', disposition: 'ALIAS', targetRoute: '/publishing', notes: 'Redirects to Publishing Hub' },
  { route: '/videos/publishing-package', disposition: 'ALIAS', targetRoute: '/publishing', notes: 'Redirects to Publishing Hub' },
  { route: '/videos/:videoId/publishing-package', disposition: 'ALIAS', targetRoute: '/publishing', notes: 'Redirects to Publishing Hub' },
  { route: '/production/:videoId/publishing-package', disposition: 'ALIAS', targetRoute: '/publishing', notes: 'Redirects to Publishing Hub' },
  { route: '/publishing', disposition: 'PRESERVED', targetRoute: '/publishing', notes: 'Publishing staging and live dispatch' },
  { route: '/videos/:videoId/publish', disposition: 'ALIAS', targetRoute: '/publishing', notes: 'Redirects to Publishing Hub' },
  { route: '/production/:videoId/publish', disposition: 'ALIAS', targetRoute: '/publishing', notes: 'Redirects to Publishing Hub' },
  { route: '/analytics', disposition: 'ALIAS', targetRoute: '/analytics/engagement', notes: 'Redirects to Engagement Analytics' },
  { route: '/analytics/overview', disposition: 'ALIAS', targetRoute: '/analytics/engagement', notes: 'Redirects to Engagement Analytics' },
  { route: '/analytics/video', disposition: 'ALIAS', targetRoute: '/analytics/engagement?view=video', notes: 'Redirects with video query filter' },
  { route: '/analytics/platform', disposition: 'ALIAS', targetRoute: '/analytics/engagement?view=platform', notes: 'Redirects with platform query filter' },
  { route: '/analytics/topic', disposition: 'ALIAS', targetRoute: '/analytics/engagement?view=topic', notes: 'Redirects with topic query filter' },
  { route: '/analytics/subtopic', disposition: 'ALIAS', targetRoute: '/analytics/engagement?view=subtopic', notes: 'Redirects with subtopic query filter' },
  { route: '/analytics/difficulty', disposition: 'ALIAS', targetRoute: '/analytics/engagement?view=difficulty', notes: 'Redirects with difficulty query filter' },
  { route: '/analytics/engagement', disposition: 'PRESERVED', targetRoute: '/analytics/engagement', notes: 'Watch time and retention drop-offs' },
  { route: '/analytics/retention', disposition: 'ALIAS', targetRoute: '/analytics/engagement?view=retention', notes: 'Redirects with retention view' },
  { route: '/analytics/intelligence', disposition: 'PRESERVED', targetRoute: '/analytics/intelligence', notes: 'Pedagogical intelligence loopback' },
  { route: '/analytics/strategy', disposition: 'ALIAS', targetRoute: '/analytics/intelligence?view=strategy', notes: 'Redirects to Intelligence view' },
  { route: '/social-analytics', disposition: 'ALIAS', targetRoute: '/analytics/engagement?view=social', notes: 'Redirects to Engagement Analytics' },
  { route: '/social-analytics/:contentId', disposition: 'ALIAS', targetRoute: '/analytics/engagement?contentId=:contentId', notes: 'Redirects with content ID filter' },
  { route: '/my-work', disposition: 'PRESERVED', targetRoute: '/my-work', notes: 'Personal work queue' },
  { route: '/team', disposition: 'PRESERVED', targetRoute: '/team', notes: 'Operator assignments and capacity' },
  { route: '/team-work', disposition: 'ALIAS', targetRoute: '/team', notes: 'Redirects to Team view' },
  { route: '/settings', disposition: 'PRESERVED', targetRoute: '/settings', notes: 'Taxonomy and system configurations' },
  { route: '/recovery', disposition: 'PRESERVED', targetRoute: '/recovery', notes: 'Disaster recovery and database restore' },
  { route: '/admin', disposition: 'ALIAS', targetRoute: '/recovery', notes: 'Redirects to Recovery Console' },
  { route: '*', disposition: 'RETIRE', targetRoute: '/404', notes: 'Catch-all redirect to 404 handler' },
];
