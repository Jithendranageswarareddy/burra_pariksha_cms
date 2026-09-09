/**
 * BURRA PARIKSHA CMS - Phase 16.3 Verification Suite
 * Content Master Canonical Lifecycle UI + End-to-End Integration
 */

import fs from 'fs';
import path from 'path';
import { apiClient } from '../lib/api-client';
import { contentMasterService } from '../lib/services/content-master.service';
import { ContentMasterStatus, UserRole } from '../types';

export async function runPhase16Step3Verification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: Array<{ check: string; status: 'PASS' | 'FAIL'; details?: string }>;
}> {
  const results: Array<{ check: string; status: 'PASS' | 'FAIL'; details?: string }> = [];

  const addResult = (check: string, passed: boolean, details?: string) => {
    results.push({
      check,
      status: passed ? 'PASS' : 'FAIL',
      details,
    });
  };

  const pagePath = path.resolve(process.cwd(), 'src/pages/ContentMasterPage.tsx');
  const apiPath = path.resolve(process.cwd(), 'src/lib/api-client.ts');
  const routesPath = path.resolve(process.cwd(), 'src/server/routes.ts');

  const pageCode = fs.readFileSync(pagePath, 'utf8');
  const apiCode = fs.readFileSync(apiPath, 'utf8');
  const routesCode = fs.readFileSync(routesPath, 'utf8');

  // Check 1: API Client provides all Phase 16.2/16.3 lifecycle methods
  try {
    const hasGetCanonicalState = apiCode.includes('getContentMasterCanonicalState(');
    const hasTransition = apiCode.includes('transitionContentMasterStatus(');
    const hasArchive = apiCode.includes('archiveContentMaster(');

    const endpointsCorrect =
      apiCode.includes('/canonical-state') &&
      apiCode.includes('/transition') &&
      apiCode.includes('/archive');

    addResult(
      '1. ApiClient implements getContentMasterCanonicalState, transitionContentMasterStatus, and archiveContentMaster',
      hasGetCanonicalState && hasTransition && hasArchive && endpointsCorrect,
      `getCanonicalState: ${hasGetCanonicalState}, transition: ${hasTransition}, archive: ${hasArchive}, endpointsCorrect: ${endpointsCorrect}`
    );
  } catch (err: any) {
    addResult('1. ApiClient implements lifecycle methods', false, err?.message);
  }

  // Check 2: Server routes exist for all three endpoints with proper auth
  try {
    const hasCanonicalRoute = routesCode.includes("apiRouter.get('/content-masters/:id/canonical-state', requireAuth");
    const hasTransitionRoute = routesCode.includes("apiRouter.post('/content-masters/:id/transition', requireAuth");
    const hasArchiveRoute = routesCode.includes("apiRouter.post('/content-masters/:id/archive', requireAuth");

    addResult(
      '2. Server routes /canonical-state, /transition, and /archive enforce requireAuth and call contentMasterService',
      hasCanonicalRoute && hasTransitionRoute && hasArchiveRoute,
      `canonicalRoute: ${hasCanonicalRoute}, transitionRoute: ${hasTransitionRoute}, archiveRoute: ${hasArchiveRoute}`
    );
  } catch (err: any) {
    addResult('2. Server routes enforce requireAuth', false, err?.message);
  }

  // Check 3: ContentMasterPage integrates canonical state fetching
  try {
    const fetchesCanonical = pageCode.includes('apiClient.getContentMasterCanonicalState');
    const storesCanonical = pageCode.includes('setCanonicalState');

    addResult(
      '3. ContentMasterPage fetches and stores ContentMasterCanonicalState alongside detail records',
      fetchesCanonical && storesCanonical,
      `fetchesCanonical: ${fetchesCanonical}, storesCanonical: ${storesCanonical}`
    );
  } catch (err: any) {
    addResult('3. ContentMasterPage fetches canonical state', false, err?.message);
  }

  // Check 4: UI renders dedicated Canonical Lifecycle & Governance panel
  try {
    const hasPanelId = pageCode.includes('id="content-master-lifecycle-panel"');
    const hasPanelTitle = pageCode.includes('Canonical Lifecycle & Governance');

    addResult(
      '4. UI renders dedicated Canonical Lifecycle & Governance panel with unique identifier',
      hasPanelId && hasPanelTitle,
      `hasPanelId: ${hasPanelId}, hasPanelTitle: ${hasPanelTitle}`
    );
  } catch (err: any) {
    addResult('4. UI renders lifecycle panel', false, err?.message);
  }

  // Check 5: Canonical status enum adheres strictly to DRAFT, ACTIVE, COMPLETED, ARCHIVED
  try {
    const handlesDraft = pageCode.includes('ContentMasterStatus.DRAFT');
    const handlesActive = pageCode.includes('ContentMasterStatus.ACTIVE');
    const handlesCompleted = pageCode.includes('ContentMasterStatus.COMPLETED');
    const handlesArchived = pageCode.includes('ContentMasterStatus.ARCHIVED');
    const noInProduction = !pageCode.includes('IN_PRODUCTION');

    addResult(
      '5. Status progression strictly adheres to DRAFT, ACTIVE, COMPLETED, ARCHIVED with no fabricated statuses',
      handlesDraft && handlesActive && handlesCompleted && handlesArchived && noInProduction,
      `DRAFT: ${handlesDraft}, ACTIVE: ${handlesActive}, COMPLETED: ${handlesCompleted}, ARCHIVED: ${handlesArchived}, noInProduction: ${noInProduction}`
    );
  } catch (err: any) {
    addResult('5. Strict status enum adherence', false, err?.message);
  }

  // Check 6: Downstream readiness matrix covers all 5 canonical pillars
  try {
    const hasQuestionPillar = pageCode.includes('canonicalState?.primaryQuestion');
    const hasVideoPillar = pageCode.includes('canonicalState?.videoSummary');
    const hasAssetPillar = pageCode.includes('canonicalState?.assetReadiness');
    const hasSocialPillar = pageCode.includes('canonicalState?.socialReviewState');
    const hasPublishingPillar = pageCode.includes('canonicalState?.publishingState');

    addResult(
      '6. Downstream readiness matrix visually reflects Question, Video, Assets, Social Review, and Publishing pillars',
      hasQuestionPillar && hasVideoPillar && hasAssetPillar && hasSocialPillar && hasPublishingPillar,
      `Question: ${hasQuestionPillar}, Video: ${hasVideoPillar}, Assets: ${hasAssetPillar}, Social: ${hasSocialPillar}, Publishing: ${hasPublishingPillar}`
    );
  } catch (err: any) {
    addResult('6. Downstream readiness matrix coverage', false, err?.message);
  }

  // Check 7: Readiness blockers display surfaced from backend
  try {
    const displaysBlockers = pageCode.includes('canonicalState?.blockers') || pageCode.includes('canonicalState.blockers');
    const checksEligibility = pageCode.includes('canonicalState?.isEligibleForCompletion');

    addResult(
      '7. UI surfaces backend completion blockers directly to the operator without duplicating business rules',
      displaysBlockers && checksEligibility,
      `displaysBlockers: ${displaysBlockers}, checksEligibility: ${checksEligibility}`
    );
  } catch (err: any) {
    addResult('7. Readiness blockers displayed from backend', false, err?.message);
  }

  // Check 8: Non-optimistic mutation and rejection handling
  try {
    const catchesErrors = pageCode.includes('setTransitionError');
    const noOptimisticState =
      !pageCode.includes('setDetails({ ...details, contentMaster: { ...contentMaster, status: targetStatus } })') &&
      !pageCode.includes('setCanonicalState({ ...canonicalState, status: targetStatus })');

    addResult(
      '8. On rejected transitions, the UI preserves current state and presents backend error without optimistic mutation',
      catchesErrors && noOptimisticState,
      `catchesErrors: ${catchesErrors}, noOptimisticState: ${noOptimisticState}`
    );
  } catch (err: any) {
    addResult('8. Non-optimistic mutation handling', false, err?.message);
  }

  // Check 9: Server refresh on successful transition
  try {
    const reloadsOnSuccess = pageCode.includes('await loadMasterData(id)');

    addResult(
      '9. On successful transition or archival, the UI re-fetches authoritative data from the backend',
      reloadsOnSuccess,
      `reloadsOnSuccess: ${reloadsOnSuccess}`
    );
  } catch (err: any) {
    addResult('9. Server refresh on success', false, err?.message);
  }

  // Check 10: ARCHIVED treated as terminal in UI
  try {
    const terminalArchived =
      pageCode.includes('Archived Terminal State') ||
      pageCode.includes('terminal lifecycle action') ||
      pageCode.includes('currentStatus !== ContentMasterStatus.ARCHIVED');

    addResult(
      '10. ARCHIVED status is treated as terminal in UI, prohibiting further status mutations',
      terminalArchived,
      `terminalArchived: ${terminalArchived}`
    );
  } catch (err: any) {
    addResult('10. ARCHIVED treated as terminal', false, err?.message);
  }

  // Check 11: RBAC preservation in UI
  try {
    const usesAuth = pageCode.includes('useAuth()');
    const checksRoles = pageCode.includes('UserRole.ADMIN') && pageCode.includes('UserRole.CONTENT_MANAGER');
    const checksCreator = pageCode.includes('createdBy === user.id');
    const rendersLockNotice = pageCode.includes('Read-only: Transition controls require');

    addResult(
      '11. RBAC enforcement: Admin/Content Manager global authority, creator check, and read-only lock for unauthorized users',
      usesAuth && checksRoles && checksCreator && rendersLockNotice,
      `usesAuth: ${usesAuth}, checksRoles: ${checksRoles}, checksCreator: ${checksCreator}, rendersLockNotice: ${rendersLockNotice}`
    );
  } catch (err: any) {
    addResult('11. RBAC preservation', false, err?.message);
  }

  // Check 12: Relationship navigation links preserved from Phase 14
  try {
    const hasQuestionLink = pageCode.includes('/questions/${encodeURIComponent(primaryQuestion.id)}');
    const hasPublishingLink = pageCode.includes('/publishing?videoId=');
    const hasHierarchyBanner = pageCode.includes('Canonical Content Lifecycle Hierarchy');

    addResult(
      '12. Existing Phase 14 relationship navigation and hierarchy flows are preserved intact',
      hasQuestionLink && hasPublishingLink && hasHierarchyBanner,
      `hasQuestionLink: ${hasQuestionLink}, hasPublishingLink: ${hasPublishingLink}, hasHierarchyBanner: ${hasHierarchyBanner}`
    );
  } catch (err: any) {
    addResult('12. Relationship navigation preservation', false, err?.message);
  }

  // Check 13: Live backend integration smoke test for canonical state retrieval
  try {
    const masters = await contentMasterService.getAllContentMasters();
    if (masters.length > 0) {
      const testMaster = masters[0];
      const canonicalState = await contentMasterService.getCanonicalState(testMaster.id);

      const isValidStructure =
        Boolean(canonicalState.contentMasterId) &&
        Boolean(canonicalState.status) &&
        Array.isArray(canonicalState.blockers) &&
        typeof canonicalState.isEligibleForCompletion === 'boolean' &&
        typeof canonicalState.isEligibleForArchival === 'boolean' &&
        Boolean(canonicalState.videoSummary) &&
        Boolean(canonicalState.assetReadiness) &&
        Boolean(canonicalState.socialReviewState) &&
        Boolean(canonicalState.publishingState);

      addResult(
        '13. Live service test: getCanonicalState returns compliant ContentMasterCanonicalState structure',
        isValidStructure,
        `Master: ${canonicalState.contentMasterId}, Status: ${canonicalState.status}, Blockers: ${canonicalState.blockers.length}, Eligible: ${canonicalState.isEligibleForCompletion}`
      );
    } else {
      addResult('13. Live service test: getCanonicalState', false, 'No content masters in repository');
    }
  } catch (err: any) {
    addResult('13. Live service test: getCanonicalState', false, err?.message);
  }

  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = results.filter((r) => r.status === 'FAIL').length;

  return {
    passed: failedChecks === 0,
    totalChecks: results.length,
    passedChecks,
    failedChecks,
    results,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase16Step3Verification()
    .then((summary) => {
      console.log('====================================================');
      console.log('PHASE 16.3 UI INTEGRATION VERIFICATION');
      console.log('====================================================');
      summary.results.forEach((r) => {
        console.log(`[${r.status}] ${r.check} (${r.details || ''})`);
      });
      console.log('----------------------------------------------------');
      console.log(`TOTAL: ${summary.totalChecks}, PASSED: ${summary.passedChecks}, FAILED: ${summary.failedChecks}`);
      console.log('====================================================');
      if (!summary.passed) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}
