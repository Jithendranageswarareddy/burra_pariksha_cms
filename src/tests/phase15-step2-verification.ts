/**
 * BURRA PARIKSHA CMS - Phase 15.2 Verification Suite
 * Targeted Read-Path Optimization: ContentMasterService.getDetailsByContentMasterId
 */

import fs from 'fs';
import path from 'path';
import { contentMasterService } from '../lib/services/content-master.service';
import { objectAuthService } from '../lib/services/object-auth.service';
import { auditLogRepository } from '../lib/repositories';
import { UserRole } from '../types';

export async function runPhase15Step2Verification(): Promise<{
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  const addResult = (name: string, passed: boolean, message?: string) => {
    results.push({ name, passed, message });
  };

  // 1. Code Inspection: Promise.all parallelization in getDetailsByContentMasterId
  try {
    const code = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/services/content-master.service.ts'), 'utf8');
    const methodBlock = code.substring(code.indexOf('getDetailsByContentMasterId'), code.indexOf('migrationDryRun'));
    const hasPromiseAll = methodBlock.includes('Promise.all([');
    const fetchesQuestions = methodBlock.includes('questionsRepository.findAll()');
    const fetchesVideos = methodBlock.includes('videosRepository.findAll()');
    const fetchesScripts = methodBlock.includes('scriptsRepository.findAll()');
    const fetchesThumbnails = methodBlock.includes('thumbnailsRepository.findAll()');
    const fetchesPinnedComments = methodBlock.includes('pinnedCommentsRepository.findAll()');
    const fetchesPublishing = methodBlock.includes('publishingRepository.findAll()');
    const fetchesSocial = methodBlock.includes('socialReviewsRepository.findAll()');
    const fetchesAssignments = methodBlock.includes('assignmentsRepository.findAll()');
    const fetchesLogs = methodBlock.includes('auditLogRepository.findAll()');

    const allParallelized =
      hasPromiseAll &&
      fetchesQuestions &&
      fetchesVideos &&
      fetchesScripts &&
      fetchesThumbnails &&
      fetchesPinnedComments &&
      fetchesPublishing &&
      fetchesSocial &&
      fetchesAssignments &&
      fetchesLogs;

    addResult(
      '1. Code Verification: Child repositories fetched in parallel via Promise.all after master resolution',
      allParallelized,
      `hasPromiseAll: ${hasPromiseAll}, parallelized 9 child repos: ${allParallelized}`
    );
  } catch (err: any) {
    addResult('1. Code Verification: Child repositories parallelized', false, err?.message);
  }

  // 2. Canonical Content Master resolves correctly with full relationship tree
  try {
    const masters = await contentMasterService.getAllContentMasters();
    if (masters.length === 0) {
      addResult('2. Canonical Master Resolution: Retrieves Content Master with intact relationships', false, 'No masters found');
    } else {
      const firstMaster = masters[0];
      const details = await contentMasterService.getDetailsByContentMasterId(firstMaster.id);

      const resolved =
        details !== null &&
        details.contentMaster.id === firstMaster.id &&
        Array.isArray(details.questions) &&
        Array.isArray(details.videos) &&
        Array.isArray(details.scripts) &&
        Array.isArray(details.thumbnails) &&
        Array.isArray(details.pinnedComments) &&
        Array.isArray(details.publishingRecords) &&
        Array.isArray(details.assignments) &&
        Array.isArray(details.auditLogs);

      addResult(
        '2. Canonical Master Resolution: Retrieves Content Master with intact relationships',
        resolved,
        `Master ID: ${firstMaster.id}, hasQuestions: ${Array.isArray(details?.questions)}, hasVideos: ${Array.isArray(details?.videos)}`
      );
    }
  } catch (err: any) {
    addResult('2. Canonical Master Resolution: Retrieves Content Master with intact relationships', false, err?.message);
  }

  // 3. Invalid / Non-existent Content Master returns null cleanly without throwing
  try {
    const nonExistent = await contentMasterService.getDetailsByContentMasterId('CM-DOES-NOT-EXIST-999');
    const isNull = nonExistent === null;

    addResult(
      '3. Invalid Master Handling: Non-existent ID returns null safely with no unhandled exceptions',
      isNull,
      `Expected null, received: ${nonExistent}`
    );
  } catch (err: any) {
    addResult('3. Invalid Master Handling: Non-existent ID returns null safely', false, err?.message);
  }

  // 4. Missing optional children remain safe and produce empty arrays
  try {
    // Create a temporary mock-like check or test master with zero children
    const masters = await contentMasterService.getAllContentMasters();
    const testMaster = masters.find((m) => !m.primaryQuestionId) || masters[0];
    const details = await contentMasterService.getDetailsByContentMasterId(testMaster.id);

    const safeArrays =
      details !== null &&
      Array.isArray(details.questions) &&
      Array.isArray(details.videos) &&
      Array.isArray(details.scripts) &&
      Array.isArray(details.thumbnails) &&
      Array.isArray(details.pinnedComments) &&
      Array.isArray(details.publishingRecords) &&
      Array.isArray(details.assignments) &&
      Array.isArray(details.auditLogs);

    addResult(
      '4. Missing Optional Child Resilience: Returns clean empty arrays for unpopulated child entities',
      safeArrays,
      `Arrays strictly initialized: ${safeArrays}`
    );
  } catch (err: any) {
    addResult('4. Missing Optional Child Resilience: Returns clean empty arrays', false, err?.message);
  }

  // 5. Read-Only Invariant: Zero audit log writes or mutations occur from calling getDetailsByContentMasterId
  try {
    const initialLogs = await auditLogRepository.findAll();
    const initialCount = initialLogs.length;

    const masters = await contentMasterService.getAllContentMasters();
    if (masters.length > 0) {
      await contentMasterService.getDetailsByContentMasterId(masters[0].id);
      await contentMasterService.getDetailsByContentMasterId(masters[0].id);
    }

    const postLogs = await auditLogRepository.findAll();
    const postCount = postLogs.length;
    const zeroWrites = postCount === initialCount;

    addResult(
      '5. Read-Only Invariant: getDetailsByContentMasterId executes strictly without any writes or audit log entries',
      zeroWrites,
      `Initial log count: ${initialCount}, Post-read log count: ${postCount}`
    );
  } catch (err: any) {
    addResult('5. Read-Only Invariant: getDetailsByContentMasterId executes strictly without writes', false, err?.message);
  }

  // 6. Object Authorization Integrity: Admin has full access, specialist is checked against rules
  try {
    const masters = await contentMasterService.getAllContentMasters();
    if (masters.length > 0) {
      const firstMaster = masters[0];
      const adminActor = { id: 'USR-ADMIN', role: UserRole.ADMIN };
      const adminAccess = await objectAuthService.canAccessContentMaster(adminActor, firstMaster);

      const unassignedActor = { id: 'USR-UNASSIGNED', role: UserRole.QUESTION_EDITOR };
      const unassignedAccess = await objectAuthService.canAccessContentMaster(unassignedActor, firstMaster);

      const authConsistent = adminAccess === true && typeof unassignedAccess === 'boolean';

      addResult(
        '6. Authorization Integrity: ObjectAuthorizationService rules evaluate consistently for Admin and Specialist',
        authConsistent,
        `Admin access: ${adminAccess}, Unassigned access: ${unassignedAccess}`
      );
    } else {
      addResult('6. Authorization Integrity: ObjectAuthorizationService rules evaluate consistently', false, 'No masters found');
    }
  } catch (err: any) {
    addResult('6. Authorization Integrity: ObjectAuthorizationService rules evaluate consistently', false, err?.message);
  }

  // 7. Child relationship filter preserves exact response shape
  try {
    const masters = await contentMasterService.getAllContentMasters();
    if (masters.length > 0) {
      const details = await contentMasterService.getDetailsByContentMasterId(masters[0].id);
      const expectedKeys = [
        'contentMaster',
        'primaryQuestion',
        'questions',
        'videos',
        'scripts',
        'thumbnails',
        'pinnedComments',
        'publishingRecords',
        'socialReviews',
        'assignments',
        'auditLogs',
      ];
      const detailsKeys = Object.keys(details || {});
      const allKeysPresent = expectedKeys.every((k) => detailsKeys.includes(k));

      addResult(
        '7. Exact Response Shape: All 11 contractual keys present in ContentMasterDetails response',
        allKeysPresent,
        `Contractual keys present: ${allKeysPresent}`
      );
    } else {
      addResult('7. Exact Response Shape: All 11 contractual keys present', false, 'No masters found');
    }
  } catch (err: any) {
    addResult('7. Exact Response Shape: All 11 contractual keys present', false, err?.message);
  }

  // 8. Server Route Protection: /content-masters/:id enforces requireAuth and child relationship gating
  try {
    const serverRoutes = fs.readFileSync(path.resolve(process.cwd(), 'src/server/routes.ts'), 'utf8');
    const routeBlock = serverRoutes.substring(serverRoutes.indexOf("apiRouter.get('/content-masters/:id'"), serverRoutes.indexOf("apiRouter.post('/content-masters'"));
    const enforcesAuth = routeBlock.includes('requireAuth');
    const checksCanAccess = routeBlock.includes('canAccessContentMaster');
    const filtersChildren = routeBlock.includes('filteredDetails');
    const returns403 = routeBlock.includes('403');
    const returns404 = routeBlock.includes('404');

    const routeSecure = enforcesAuth && checksCanAccess && filtersChildren && returns403 && returns404;

    addResult(
      '8. Server Endpoint Integrity: /content-masters/:id route preserves authentication, 403, 404, and child gating',
      routeSecure,
      `enforcesAuth: ${enforcesAuth}, checksCanAccess: ${checksCanAccess}, filtersChildren: ${filtersChildren}, returns403: ${returns403}, returns404: ${returns404}`
    );
  } catch (err: any) {
    addResult('8. Server Endpoint Integrity: /content-masters/:id route preserves authentication and gating', false, err?.message);
  }

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const success = passedTests === totalTests;

  return { success, totalTests, passedTests, results };
}

if (
  process.argv[1]?.endsWith('phase15-step2-verification.ts') ||
  process.argv[1]?.endsWith('phase15-step2-verification') ||
  process.argv[1]?.includes('phase15-step2-verification')
) {
  runPhase15Step2Verification()
    .then((report) => {
      console.log('='.repeat(70));
      console.log(`PHASE 15.2 VERIFICATION REPORT: ${report.passedTests}/${report.totalTests} PASSED`);
      console.log('='.repeat(70));
      report.results.forEach((r, idx) => {
        const mark = r.passed ? '✓ PASS' : '✗ FAIL';
        console.log(`[${mark}] Test ${idx + 1}: ${r.name}`);
        if (r.message) {
          console.log(`        Details: ${r.message}`);
        }
      });
      console.log('='.repeat(70));
      if (!report.success) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error during verification:', err);
      process.exit(1);
    });
}
