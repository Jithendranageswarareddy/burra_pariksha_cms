/**
 * BURRA PARIKSHA CMS — Stage 11 Page & Route Contract Automated Verification Suite
 *
 * Verifies that the Page & Route contracts established in 11-PAGE-ROUTE-CONTRACT.md and
 * src/types/route-contracts.ts are strictly enforced:
 * 1. Exactly 14 Canonical Production Routes defined with complete schema.
 * 2. Route-to-Hub Ownership Consistency with Stage 10 Frontend IA (6 Core Hubs).
 * 3. Route-to-Workflow Step Alignment with Stage 07 Canonical Workflow (15 Steps).
 * 4. Strict RBAC Capability Binding with Stage 09 RBAC (RESOURCE:ACTION syntax).
 * 5. UI State Matrices (Loading, Empty, Error, 403, Success) fully populated.
 * 6. Brownfield 78-Route Migration Disposition Ledger fully cataloged.
 * 7. Cross-platform direct CLI execution runner included.
 *
 * ZERO PRODUCTION DATA MUTATION: Deterministic in-memory test suite.
 */

import {
  CanonicalRouteId,
  CANONICAL_ROUTE_IDS,
  CANONICAL_ROUTE_CONTRACTS,
  BROWNFIELD_ROUTE_MIGRATION_REGISTRY,
} from '../types/route-contracts';

import { NavigationHubId } from '../types/frontend-ia';
import {
  CANONICAL_RESOURCES,
  CANONICAL_ACTIONS,
  parseCapability,
} from '../types/rbac-models';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[STAGE 11 ROUTE CONTRACT VIOLATION] ${msg}`);
  }
}

export async function runStage11PageRouteContractTests() {
  console.log('============================================================');
  console.log('RUNNING STAGE 11 PAGE & ROUTE CONTRACT VERIFICATION SUITE');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: 14 Canonical Routes Registry & Schema Completeness
  // --------------------------------------------------------------------------
  console.log('Checking Check 1: 14 Canonical Production Routes Completeness...');
  assert(CANONICAL_ROUTE_IDS.length === 14, `Expected exactly 14 route IDs, found ${CANONICAL_ROUTE_IDS.length}`);

  const registeredKeys = Object.keys(CANONICAL_ROUTE_CONTRACTS) as CanonicalRouteId[];
  assert(registeredKeys.length === 14, `Expected 14 registered contracts, found ${registeredKeys.length}`);

  const expectedRoutes: Record<CanonicalRouteId, string> = {
    [CanonicalRouteId.DASHBOARD]: '/dashboard',
    [CanonicalRouteId.MY_WORK]: '/my-work',
    [CanonicalRouteId.QUESTIONS_LIBRARY]: '/questions',
    [CanonicalRouteId.QUESTION_STUDIO]: '/studio',
    [CanonicalRouteId.QUESTION_VERIFICATION]: '/questions/:id/verify',
    [CanonicalRouteId.RECORDING_QUEUE]: '/queue',
    [CanonicalRouteId.PRODUCTION_BAY]: '/production',
    [CanonicalRouteId.VIDEO_DETAIL]: '/videos/:id',
    [CanonicalRouteId.SOCIAL_REVIEW]: '/social-review',
    [CanonicalRouteId.PUBLISHING_HUB]: '/publishing',
    [CanonicalRouteId.PLATFORM_PACKAGES]: '/platform-packages',
    [CanonicalRouteId.ANALYTICS_ENGAGEMENT]: '/analytics/engagement',
    [CanonicalRouteId.ANALYTICS_INTELLIGENCE]: '/analytics/intelligence',
    [CanonicalRouteId.MANAGEMENT_SETTINGS]: '/settings',
  };

  for (const [routeId, expectedPattern] of Object.entries(expectedRoutes)) {
    const contract = CANONICAL_ROUTE_CONTRACTS[routeId as CanonicalRouteId];
    assert(contract !== undefined, `Missing contract for ${routeId}`);
    assert(contract.id === routeId, `Contract ID mismatch: ${contract.id} vs ${routeId}`);
    assert(contract.routePattern === expectedPattern, `Route pattern mismatch for ${routeId}: ${contract.routePattern} vs ${expectedPattern}`);
    assert(typeof contract.name === 'string' && contract.name.length > 0, `Route ${routeId} missing name`);
    assert(typeof contract.workflowStepName === 'string' && contract.workflowStepName.length > 0, `Route ${routeId} missing step name`);
    assert(Array.isArray(contract.requiredViewCapabilities) && contract.requiredViewCapabilities.length > 0, `Route ${routeId} missing requiredViewCapabilities`);
    assert(Array.isArray(contract.permittedActions) && contract.permittedActions.length > 0, `Route ${routeId} missing permittedActions`);
    assert(contract.uiStates !== undefined, `Route ${routeId} missing uiStates`);
  }
  console.log('  -> PASSED: All 14 canonical production routes verified.\n');

  // --------------------------------------------------------------------------
  // TEST 2: Route-to-Hub Ownership Consistency (Stage 10)
  // --------------------------------------------------------------------------
  console.log('Checking Check 2: Route-to-Hub Ownership Consistency...');
  const validHubs = Object.values(NavigationHubId);

  for (const contract of Object.values(CANONICAL_ROUTE_CONTRACTS)) {
    assert(
      validHubs.includes(contract.hubId),
      `Route ${contract.id} references invalid hub: ${contract.hubId}`
    );
  }

  // Check specific hub placements
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.DASHBOARD].hubId === NavigationHubId.HOME, 'Dashboard in HOME');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.MY_WORK].hubId === NavigationHubId.HOME, 'My Work in HOME');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.QUESTION_STUDIO].hubId === NavigationHubId.QUESTIONS, 'Studio in QUESTIONS');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.RECORDING_QUEUE].hubId === NavigationHubId.PRODUCTION, 'Queue in PRODUCTION');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.PUBLISHING_HUB].hubId === NavigationHubId.PUBLISHING, 'Publishing in PUBLISHING');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.ANALYTICS_ENGAGEMENT].hubId === NavigationHubId.ANALYTICS, 'Analytics in ANALYTICS');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.MANAGEMENT_SETTINGS].hubId === NavigationHubId.MANAGEMENT_SYSTEM, 'Settings in MANAGEMENT_SYSTEM');
  console.log('  -> PASSED: All routes strictly assigned to Stage 10 frozen hubs.\n');

  // --------------------------------------------------------------------------
  // TEST 3: Route-to-Workflow Step Alignment (Stage 07)
  // --------------------------------------------------------------------------
  console.log('Checking Check 3: Route-to-Workflow Step Alignment (Stage 07)...');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.QUESTION_STUDIO].workflowStep === 1, 'Studio is Step 01');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.QUESTION_VERIFICATION].workflowStep === 2, 'Verify is Step 02');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.QUESTION_VERIFICATION].isHumanGated === true, 'Verify is human-gated');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.RECORDING_QUEUE].workflowStep === 4, 'Recording Queue is Step 04');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.PRODUCTION_BAY].workflowStep === 6, 'Production Bay is Step 06');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.SOCIAL_REVIEW].workflowStep === 9, 'Social Review is Step 09');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.SOCIAL_REVIEW].isHumanGated === true, 'Social Review is human-gated');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.PUBLISHING_HUB].workflowStep === 10, 'Publishing Hub is Step 10');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.PUBLISHING_HUB].isHumanGated === true, 'Publishing Hub is human-gated');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.PLATFORM_PACKAGES].workflowStep === 12, 'Platform Packages is Step 12');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.ANALYTICS_ENGAGEMENT].workflowStep === 13, 'Analytics Engagement is Step 13');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.ANALYTICS_INTELLIGENCE].workflowStep === 15, 'Intelligence Loop is Step 15');
  assert(CANONICAL_ROUTE_CONTRACTS[CanonicalRouteId.ANALYTICS_INTELLIGENCE].isHumanGated === true, 'Intelligence Loop is human-gated');
  console.log('  -> PASSED: Workflow steps and AP-009 human gates aligned.\n');

  // --------------------------------------------------------------------------
  // TEST 4: Strict RBAC Capability Binding (Stage 09)
  // --------------------------------------------------------------------------
  console.log('Checking Check 4: Strict RBAC Capability Binding (Stage 09)...');
  for (const contract of Object.values(CANONICAL_ROUTE_CONTRACTS)) {
    // Primary resource must be valid canonical resource
    assert(
      CANONICAL_RESOURCES.includes(contract.primaryResource),
      `Route ${contract.id} has non-canonical primary resource: ${contract.primaryResource}`
    );

    // Required view capabilities must satisfy strict RESOURCE:ACTION syntax
    for (const cap of contract.requiredViewCapabilities) {
      const parsed = parseCapability(cap);
      assert(parsed.isValid, `Route ${contract.id} has invalid capability: ${cap}`);
    }

    // Permitted actions must all be canonical actions
    for (const action of contract.permittedActions) {
      assert(
        CANONICAL_ACTIONS.includes(action),
        `Route ${contract.id} has non-canonical action: ${action}`
      );
    }
  }
  console.log('  -> PASSED: All route capabilities strictly bound to Stage 09 RBAC vocabulary.\n');

  // --------------------------------------------------------------------------
  // TEST 5: UI State Matrices (Loading, Empty, Error, 403, Success)
  // --------------------------------------------------------------------------
  console.log('Checking Check 5: UI State Matrices Completeness...');
  for (const contract of Object.values(CANONICAL_ROUTE_CONTRACTS)) {
    const states = contract.uiStates;
    assert(typeof states.loading === 'string' && states.loading.length > 5, `${contract.id} missing loading state`);
    assert(typeof states.empty === 'string' && states.empty.length > 5, `${contract.id} missing empty state`);
    assert(typeof states.error === 'string' && states.error.length > 5, `${contract.id} missing error state`);
    assert(typeof states.forbidden403 === 'string' && states.forbidden403.length > 5, `${contract.id} missing forbidden403 state`);
    assert(typeof states.success === 'string' && states.success.length > 5, `${contract.id} missing success state`);
  }
  console.log('  -> PASSED: Universal 5-dimensional UI state pattern verified on all routes.\n');

  // --------------------------------------------------------------------------
  // TEST 6: Brownfield 78-Route Migration Disposition Ledger
  // --------------------------------------------------------------------------
  console.log('Checking Check 6: Brownfield 78-Route Migration Disposition...');
  assert(
    BROWNFIELD_ROUTE_MIGRATION_REGISTRY.length === 78,
    `Expected exactly 78 brownfield routes, found ${BROWNFIELD_ROUTE_MIGRATION_REGISTRY.length}`
  );

  const validDispositions = ['PRESERVED', 'ALIAS', 'CONSOLIDATE', 'RETIRE'];

  for (const entry of BROWNFIELD_ROUTE_MIGRATION_REGISTRY) {
    assert(typeof entry.route === 'string' && entry.route.length > 0, 'Entry route missing');
    assert(
      validDispositions.includes(entry.disposition),
      `Invalid disposition for ${entry.route}: ${entry.disposition}`
    );
    assert(entry.targetRoute.startsWith('/'), `Target route must start with /: ${entry.targetRoute}`);
    assert(typeof entry.notes === 'string' && entry.notes.length > 0, `Entry ${entry.route} missing notes`);
  }
  console.log('  -> PASSED: All 78 brownfield routes cataloged with authoritative migration disposition.\n');

  console.log('============================================================');
  console.log('ALL STAGE 11 PAGE & ROUTE CONTRACT VERIFICATIONS PASSED (6/6)');
  console.log('============================================================\n');
}

// Cross-platform direct CLI execution guard
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('stage11')) {
  runStage11PageRouteContractTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
