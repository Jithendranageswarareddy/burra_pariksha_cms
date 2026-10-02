/**
 * BURRA PARIKSHA CMS — Stage 10 Frontend & Information Architecture Automated Verification Suite
 *
 * Verifies that the Frontend IA contracts established in 10-FRONTEND-IA.md and
 * src/types/frontend-ia.ts are strictly enforced:
 * 1. All 6 Frozen Navigation Hubs exist with complete registry metadata.
 * 2. All 15 Canonical Workflow Step-to-Workspace Routing Contracts are strictly sequenced (1 to 15).
 * 3. Human-gated boundaries (AP-009) are flagged for Steps 02, 07, 09, 10, 14, 15.
 * 4. Capability-aware navigation visibility resolver correctly filters hubs and items.
 * 5. Role-based navigation projections conform to Stage 09 capability boundaries.
 * 6. Prohibited navigation anti-patterns (ANTI-09 contract) are cataloged.
 * 7. Route topology and non-authoritative UI security axiom (AP-004, AP-006).
 *
 * ZERO PRODUCTION DATA MUTATION: Deterministic in-memory test suite.
 */

import {
  NavigationHubId,
  NAVIGATION_HUBS_REGISTRY,
  CANONICAL_STEP_ROUTES,
  PROHIBITED_NAVIGATION_ANTI_PATTERNS,
  canAccessHub,
  canAccessNavItem,
  resolveVisibleNavigation,
} from '../types/frontend-ia';

import {
  CanonicalRbacRole,
  getRoleCapabilities,
} from '../types/rbac-models';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[STAGE 10 FRONTEND IA VIOLATION] ${msg}`);
  }
}

export async function runStage10FrontendIaTests() {
  console.log('============================================================');
  console.log('RUNNING STAGE 10 FRONTEND & INFORMATION ARCHITECTURE TEST SUITE');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: The Six Frozen Navigation Hubs & Registry Metadata
  // --------------------------------------------------------------------------
  console.log('Checking Check 1: 6 Frozen Navigation Hubs Integrity...');
  const expectedHubIds = [
    NavigationHubId.HOME,
    NavigationHubId.QUESTIONS,
    NavigationHubId.PRODUCTION,
    NavigationHubId.PUBLISHING,
    NavigationHubId.ANALYTICS,
    NavigationHubId.MANAGEMENT_SYSTEM,
  ];

  assert(expectedHubIds.length === 6, 'Must define exactly 6 navigation hubs');

  const registryKeys = Object.keys(NAVIGATION_HUBS_REGISTRY) as NavigationHubId[];
  assert(registryKeys.length === 6, `Expected 6 hubs in registry, found ${registryKeys.length}`);

  for (const hubId of expectedHubIds) {
    const hub = NAVIGATION_HUBS_REGISTRY[hubId];
    assert(hub !== undefined, `Missing hub in registry: ${hubId}`);
    assert(hub.id === hubId, `Hub ID mismatch for ${hubId}`);
    assert(typeof hub.label === 'string' && hub.label.length > 0, `Hub ${hubId} missing label`);
    assert(typeof hub.description === 'string' && hub.description.length > 0, `Hub ${hubId} missing description`);
    assert(typeof hub.iconName === 'string' && hub.iconName.length > 0, `Hub ${hubId} missing iconName`);
    assert(typeof hub.primaryRoute === 'string' && hub.primaryRoute.startsWith('/'), `Hub ${hubId} has invalid primaryRoute`);
    assert(Array.isArray(hub.requiredCapabilities) && hub.requiredCapabilities.length > 0, `Hub ${hubId} missing requiredCapabilities`);
    assert(Array.isArray(hub.items) && hub.items.length > 0, `Hub ${hubId} must have at least one navigation item`);

    for (const item of hub.items) {
      assert(typeof item.id === 'string' && item.id.length > 0, `Item in ${hubId} missing id`);
      assert(typeof item.label === 'string' && item.label.length > 0, `Item ${item.id} missing label`);
      assert(typeof item.route === 'string' && item.route.startsWith('/'), `Item ${item.id} invalid route: ${item.route}`);
      assert(typeof item.description === 'string', `Item ${item.id} missing description`);
      assert(Array.isArray(item.requiredCapabilities) && item.requiredCapabilities.length > 0, `Item ${item.id} missing requiredCapabilities`);
    }
  }
  console.log('  -> PASSED: All 6 frozen navigation hubs verified with complete registry.\n');

  // --------------------------------------------------------------------------
  // TEST 2: 15 Canonical Workflow Step-to-Workspace Routing Contracts
  // --------------------------------------------------------------------------
  console.log('Checking Check 2: 15 Canonical Step Routing Contracts (AP-001)...');
  assert(CANONICAL_STEP_ROUTES.length === 15, `Expected 15 canonical step routes, found ${CANONICAL_STEP_ROUTES.length}`);

  for (let i = 0; i < 15; i++) {
    const contract = CANONICAL_STEP_ROUTES[i];
    const expectedStepNum = i + 1;
    assert(contract.stepNumber === expectedStepNum, `Expected stepNumber ${expectedStepNum}, got ${contract.stepNumber}`);
    assert(typeof contract.stepName === 'string' && contract.stepName.length > 0, `Step ${expectedStepNum} missing name`);
    assert(typeof contract.canonicalRoutePattern === 'string' && contract.canonicalRoutePattern.startsWith('/'), `Step ${expectedStepNum} invalid route pattern`);
    assert(Array.isArray(contract.requiredCapabilities) && contract.requiredCapabilities.length > 0, `Step ${expectedStepNum} missing requiredCapabilities`);
    assert(expectedHubIds.includes(contract.hubId), `Step ${expectedStepNum} references invalid hubId: ${contract.hubId}`);
  }
  console.log('  -> PASSED: All 15 canonical step routes sequenced and mapped.\n');

  // --------------------------------------------------------------------------
  // TEST 3: Human-Gated Step UI Boundary Flags (AP-009)
  // --------------------------------------------------------------------------
  console.log('Checking Check 3: Human-Gated Step UI Boundaries (AP-009)...');
  const humanGatedSteps = [2, 7, 9, 10, 14, 15];

  for (const contract of CANONICAL_STEP_ROUTES) {
    const shouldBeGated = humanGatedSteps.includes(contract.stepNumber);
    assert(
      contract.isHumanGated === shouldBeGated,
      `Step ${contract.stepNumber} (${contract.stepName}) human-gate mismatch: expected ${shouldBeGated}, got ${contract.isHumanGated}`
    );
  }
  console.log('  -> PASSED: Human-gated boundaries strictly validated on Steps 02, 07, 09, 10, 14, 15.\n');

  // --------------------------------------------------------------------------
  // TEST 4: Capability-Aware Navigation Visibility Resolver
  // --------------------------------------------------------------------------
  console.log('Checking Check 4: Capability-Aware Navigation Visibility Resolver...');
  // 1. Empty capabilities yield zero visible hubs
  const emptyCaps = new Set<string>();
  const zeroHubs = resolveVisibleNavigation(emptyCaps);
  assert(zeroHubs.length === 0, 'Empty capabilities must resolve to zero visible hubs');

  // 2. Question View capability grants Questions hub and Library item
  const questionViewCaps = new Set<string>(['QUESTION:VIEW']);
  assert(canAccessHub(NAVIGATION_HUBS_REGISTRY[NavigationHubId.QUESTIONS], questionViewCaps), 'QUESTION:VIEW must grant Questions hub access');
  const questionsResolved = resolveVisibleNavigation(questionViewCaps);
  assert(questionsResolved.length === 1, 'Should resolve exactly 1 hub for QUESTION:VIEW only');
  assert(questionsResolved[0].id === NavigationHubId.QUESTIONS, 'Resolved hub should be QUESTIONS');
  assert(questionsResolved[0].items.length === 1, 'Should resolve only Question Library item');
  assert(questionsResolved[0].items[0].id === 'questions-library', 'Resolved item should be questions-library');

  // 3. Question Author with CREATE/EDIT also unlocks Question Studio
  const authorCaps = new Set<string>(['CONTENT:VIEW', 'NOTIFICATION:VIEW', 'QUESTION:VIEW', 'QUESTION:CREATE', 'QUESTION:EDIT']);
  const authorResolved = resolveVisibleNavigation(authorCaps);
  const authorQuestionsHub = authorResolved.find(h => h.id === NavigationHubId.QUESTIONS);
  assert(authorQuestionsHub !== undefined, 'Author must see Questions hub');
  assert(authorQuestionsHub?.items.length === 2, 'Author must see both Library and Studio items');
  console.log('  -> PASSED: Capability-aware visibility resolver successfully filters hubs and items.\n');

  // --------------------------------------------------------------------------
  // TEST 5: Role-based Navigation Projections
  // --------------------------------------------------------------------------
  console.log('Checking Check 5: Role-based Navigation Projections...');
  // 1. ADMIN possesses full suite of capabilities -> sees all 6 hubs
  const adminCaps = new Set<string>(getRoleCapabilities(CanonicalRbacRole.ADMIN));
  const adminHubs = resolveVisibleNavigation(adminCaps);
  assert(adminHubs.length === 6, `ADMIN must have access to all 6 hubs, saw ${adminHubs.length}`);
  const hasMgmt = adminHubs.some(h => h.id === NavigationHubId.MANAGEMENT_SYSTEM);
  assert(hasMgmt, 'ADMIN must see MANAGEMENT_SYSTEM hub');

  // 2. QUESTION_AUTHOR should NOT see MANAGEMENT_SYSTEM, PRODUCTION, or PUBLISHING
  const authorRoleCaps = new Set<string>(getRoleCapabilities(CanonicalRbacRole.QUESTION_AUTHOR));
  const authorRoleHubs = resolveVisibleNavigation(authorRoleCaps);
  const authorHubIds = authorRoleHubs.map(h => h.id);
  assert(!authorHubIds.includes(NavigationHubId.MANAGEMENT_SYSTEM), 'Author must NOT see MANAGEMENT_SYSTEM');
  assert(!authorHubIds.includes(NavigationHubId.PRODUCTION), 'Author must NOT see PRODUCTION');
  assert(!authorHubIds.includes(NavigationHubId.PUBLISHING), 'Author must NOT see PUBLISHING');

  // 3. ANALYST should see HOME and ANALYTICS, not PRODUCTION or MANAGEMENT_SYSTEM
  const analystCaps = new Set<string>(getRoleCapabilities(CanonicalRbacRole.ANALYST));
  const analystHubs = resolveVisibleNavigation(analystCaps);
  const analystHubIds = analystHubs.map(h => h.id);
  assert(analystHubIds.includes(NavigationHubId.ANALYTICS), 'Analyst must see ANALYTICS');
  assert(!analystHubIds.includes(NavigationHubId.MANAGEMENT_SYSTEM), 'Analyst must NOT see MANAGEMENT_SYSTEM');
  assert(!analystHubIds.includes(NavigationHubId.PRODUCTION), 'Analyst must NOT see PRODUCTION');
  console.log('  -> PASSED: Role projections strictly mapped to Stage 09 capabilities.\n');

  // --------------------------------------------------------------------------
  // TEST 6: Prohibited Navigation Anti-Patterns (ANTI-09 Contract)
  // --------------------------------------------------------------------------
  console.log('Checking Check 6: Prohibited Navigation Anti-Patterns (ANTI-09)...');
  assert(Array.isArray(PROHIBITED_NAVIGATION_ANTI_PATTERNS), 'Anti-patterns must be an array');
  assert(PROHIBITED_NAVIGATION_ANTI_PATTERNS.length === 6, 'Must define exactly 6 anti-patterns');
  assert(PROHIBITED_NAVIGATION_ANTI_PATTERNS.includes('ANTI_PAT_01_FLOATING_ORPHAN_NAV'), 'Must include ANTI_PAT_01');
  assert(PROHIBITED_NAVIGATION_ANTI_PATTERNS.includes('ANTI_PAT_02_STATE_CONFLATED_BADGES'), 'Must include ANTI_PAT_02');
  assert(PROHIBITED_NAVIGATION_ANTI_PATTERNS.includes('ANTI_PAT_03_CLIENT_ONLY_AUTHORIZATION'), 'Must include ANTI_PAT_03');
  assert(PROHIBITED_NAVIGATION_ANTI_PATTERNS.includes('ANTI_PAT_04_UNLINKED_STEP_JUMP'), 'Must include ANTI_PAT_04');
  assert(PROHIBITED_NAVIGATION_ANTI_PATTERNS.includes('ANTI_PAT_05_LOST_CRUMB_CONTEXT'), 'Must include ANTI_PAT_05');
  assert(PROHIBITED_NAVIGATION_ANTI_PATTERNS.includes('ANTI_PAT_06_SILENT_FAILURE_TOASTS'), 'Must include ANTI_PAT_06');
  console.log('  -> PASSED: All 6 prohibited navigation anti-patterns verified.\n');

  // --------------------------------------------------------------------------
  // TEST 7: Route Topology & Non-Authoritative UI Axiom (AP-004, AP-006)
  // --------------------------------------------------------------------------
  console.log('Checking Check 7: Route Topology & Non-Authoritative Security Axiom...');
  // All navigation routes must be valid relative paths
  for (const hub of Object.values(NAVIGATION_HUBS_REGISTRY)) {
    assert(hub.primaryRoute.startsWith('/'), `Hub route must start with /: ${hub.primaryRoute}`);
    for (const item of hub.items) {
      assert(item.route.startsWith('/'), `Item route must start with /: ${item.route}`);
    }
  }

  // Non-authoritative UI axiom assertion: canAccessHub only checks capabilities,
  // it is not a cryptographic token or server authorization permit.
  const sampleHub = NAVIGATION_HUBS_REGISTRY[NavigationHubId.MANAGEMENT_SYSTEM];
  const fakeClientToken = new Set<string>(['USER:ADMINISTER']);
  const clientCanSee = canAccessHub(sampleHub, fakeClientToken);
  assert(clientCanSee === true, 'Client resolver evaluates cosmetic visibility only');
  console.log('  -> PASSED: Route topology and non-authoritative UI security axiom confirmed.\n');

  console.log('============================================================');
  console.log('ALL STAGE 10 FRONTEND IA VERIFICATION CHECKS PASSED (7/7)');
  console.log('============================================================\n');
}

// Cross-platform direct CLI execution guard
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('stage10')) {
  runStage10FrontendIaTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
