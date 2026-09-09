/**
 * BURRA PARIKSHA CMS - Task 3F.5.5 Global Search & RBAC Hardening Verification Suite
 * Combined Suite: Original Search/Routing Regressions + Phase 14.1 Security Suite
 */

import { dashboardService } from '../lib/services';
import { UserRole } from '../types';

export async function runTask3F55GlobalSearchVerification(): Promise<{
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  const adminRole = UserRole.ADMIN;
  const adminId = 'USR-001';

  const addResult = (name: string, passed: boolean, message?: string) => {
    results.push({ name, passed, message });
  };

  // Helper for fast non-hanging HTTP requests
  const safeFetch = async (url: string) => {
    return await fetch(url, {
      headers: { Connection: 'close' },
      signal: AbortSignal.timeout(4000),
    });
  };

  // =========================================================================
  // SECTION A: ORIGINAL 10 SEARCH & ROUTING REGRESSION ASSERTIONS
  // =========================================================================

  // 1. Search Video -> correct Production Tracker destination
  try {
    const searchResults = await dashboardService.search('BP-V-000009', adminRole, adminId);
    const videoResult = searchResults.find((r) => r.type === 'VIDEO');
    const isCorrect = Boolean(
      videoResult &&
      videoResult.id === 'BP-V-000009' &&
      videoResult.url === '/production/BP-V-000009'
    );
    addResult(
      '1. Search Video -> correct Production Tracker destination',
      isCorrect,
      videoResult ? `Found video with URL ${videoResult.url}` : 'Video BP-V-000009 not found'
    );
  } catch (err: any) {
    addResult('1. Search Video -> correct Production Tracker destination', false, err?.message);
  }

  // 2. Search Question -> correct Question destination
  try {
    const searchResults = await dashboardService.search('BP-Q-000009', adminRole, adminId);
    const questionResult = searchResults.find((r) => r.type === 'QUESTION');
    const isCorrect = Boolean(
      questionResult &&
      questionResult.id === 'BP-Q-000009' &&
      questionResult.url === '/questions/BP-Q-000009'
    );
    addResult(
      '2. Search Question -> correct Question destination',
      isCorrect,
      questionResult ? `Found question with URL ${questionResult.url}` : 'Question BP-Q-000009 not found'
    );
  } catch (err: any) {
    addResult('2. Search Question -> correct Question destination', false, err?.message);
  }

  // 3. Search Thumbnail -> correct tab destination
  try {
    const searchResults = await dashboardService.search('Thumbnail', adminRole, adminId);
    const thumbResult = searchResults.find((r) => r.type === 'THUMBNAIL');
    const isCorrect = Boolean(
      thumbResult &&
      thumbResult.url.startsWith('/production/') &&
      thumbResult.url.includes('tab=thumbnail')
    );
    addResult(
      '3. Search Thumbnail -> correct tab destination',
      isCorrect,
      thumbResult ? `Found thumbnail destination: ${thumbResult.url}` : 'Thumbnail result not found'
    );
  } catch (err: any) {
    addResult('3. Search Thumbnail -> correct tab destination', false, err?.message);
  }

  // 4. Search Pinned Comment -> correct tab destination
  try {
    const searchResults = await dashboardService.search('Pinned', adminRole, adminId);
    const pinnedResult = searchResults.find((r) => r.type === 'PINNED_COMMENT');
    const isCorrect = Boolean(
      pinnedResult &&
      pinnedResult.url.startsWith('/production/') &&
      pinnedResult.url.includes('tab=pinned-comment')
    );
    addResult(
      '4. Search Pinned Comment -> correct tab destination',
      isCorrect,
      pinnedResult ? `Found pinned comment destination: ${pinnedResult.url}` : 'Pinned comment result not found'
    );
  } catch (err: any) {
    addResult('4. Search Pinned Comment -> correct tab destination', false, err?.message);
  }

  // 5. Invalid entity ID returns empty array safely
  try {
    const searchResults = await dashboardService.search('BP-NONEXISTENT-999999', adminRole, adminId);
    const isEmpty = Array.isArray(searchResults) && searchResults.length === 0;
    addResult(
      '5. Invalid entity ID returns empty array safely',
      isEmpty,
      `Returned count: ${searchResults.length}`
    );
  } catch (err: any) {
    addResult('5. Invalid entity ID returns empty array safely', false, err?.message);
  }

  // 6. Arbitrary query string handled without error
  try {
    const specialQuery = '!@#$%^&*()_+ special characters and telugu తెలుగు';
    const searchResults = await dashboardService.search(specialQuery, adminRole, adminId);
    const isSafe = Array.isArray(searchResults);
    addResult(
      '6. Arbitrary query string handled without error',
      isSafe,
      `Handled query gracefully, result count: ${searchResults.length}`
    );
  } catch (err: any) {
    addResult('6. Arbitrary query string handled without error', false, err?.message);
  }

  // 7. RBAC search filtering enforces role boundaries
  try {
    const designerResults = await dashboardService.search('BP', UserRole.DESIGNER, 'USR-UNASSIGNED-DESIGNER');
    const hasScript = designerResults.some((r) => r.type === 'SCRIPT');
    const writerResults = await dashboardService.search('BP', UserRole.SCRIPT_WRITER, 'USR-UNASSIGNED-WRITER');
    const hasThumbnail = writerResults.some((r) => r.type === 'THUMBNAIL');
    const isEnforced = !hasScript && !hasThumbnail;
    addResult(
      '7. RBAC search filtering enforces role boundaries',
      isEnforced,
      `Designer saw scripts: ${hasScript}, Writer saw thumbnails: ${hasThumbnail}`
    );
  } catch (err: any) {
    addResult('7. RBAC search filtering enforces role boundaries', false, err?.message);
  }

  // 8. Authoritative route isolation (No Video/Question cross-routing)
  try {
    const allResults = await dashboardService.search('BP', adminRole, adminId);
    const videoResults = allResults.filter((r) => r.type === 'VIDEO');
    const questionResults = allResults.filter((r) => r.type === 'QUESTION');

    const videoRoutingValid = videoResults.every((v) => v.url.startsWith('/production/'));
    const questionRoutingValid = questionResults.every((q) => q.url.startsWith('/questions/'));
    const noCrossRouting = videoRoutingValid && questionRoutingValid;

    addResult(
      '8. Authoritative route isolation (No Video/Question cross-routing)',
      noCrossRouting,
      `Checked ${videoResults.length} videos and ${questionResults.length} questions`
    );
  } catch (err: any) {
    addResult('8. Authoritative route isolation (No Video/Question cross-routing)', false, err?.message);
  }

  // 9. Sub-workspace query parameters deep-link correctly
  try {
    const allResults = await dashboardService.search('BP', adminRole, adminId);
    const scriptResults = allResults.filter((r) => r.type === 'SCRIPT');
    const thumbResults = allResults.filter((r) => r.type === 'THUMBNAIL');
    const pinResults = allResults.filter((r) => r.type === 'PINNED_COMMENT');

    const scriptParamsValid = scriptResults.length === 0 || scriptResults.every((s) => s.url.includes('tab=script'));
    const thumbParamsValid = thumbResults.length === 0 || thumbResults.every((t) => t.url.includes('tab=thumbnail'));
    const pinParamsValid = pinResults.length === 0 || pinResults.every((p) => p.url.includes('tab=pinned-comment'));
    const deepLinksValid = scriptParamsValid && thumbParamsValid && pinParamsValid;

    addResult(
      '9. Sub-workspace query parameters deep-link correctly',
      deepLinksValid,
      `Script params valid: ${scriptParamsValid}, Thumb params valid: ${thumbParamsValid}, Pin params valid: ${pinParamsValid}`
    );
  } catch (err: any) {
    addResult('9. Sub-workspace query parameters deep-link correctly', false, err?.message);
  }

  // 10. Search performance under 1000ms
  try {
    // Warm up repository cache
    await dashboardService.search('BP', adminRole, adminId);
    const start = performance.now();
    await dashboardService.search('BP', adminRole, adminId);
    const duration = performance.now() - start;
    const isPerformant = duration < 1000;
    addResult(
      '10. Search performance under 1000ms',
      isPerformant,
      `Warm search duration: ${duration.toFixed(2)}ms (target: < 1000ms)`
    );
  } catch (err: any) {
    addResult('10. Search performance under 1000ms', false, err?.message);
  }

  // =========================================================================
  // SECTION B: PHASE 14.1 SECURITY & RBAC HARDENING ASSERTIONS
  // =========================================================================

  // 11. unauthenticated /api/search rejected (HTTP 401)
  try {
    const res = await safeFetch('http://127.0.0.1:3000/api/search?q=BP');
    const isProtected = res.status === 401;
    addResult(
      '11. unauthenticated /api/search rejected (HTTP 401)',
      isProtected,
      `Response status: ${res.status}`
    );
  } catch (err: any) {
    addResult('11. unauthenticated /api/search rejected (HTTP 401)', false, err?.message);
  }

  // 12. ADMIN search -> authorized results
  try {
    const adminResults = await dashboardService.search('BP', UserRole.ADMIN, 'USR-001');
    const hasResults = Array.isArray(adminResults) && adminResults.length > 0;
    addResult(
      '12. ADMIN search -> authorized results',
      hasResults,
      `Returned ${adminResults.length} authorized items for ADMIN`
    );
  } catch (err: any) {
    addResult('12. ADMIN search -> authorized results', false, err?.message);
  }

  // 13. CONTENT_MANAGER search -> authorized results
  try {
    const cmResults = await dashboardService.search('BP', UserRole.CONTENT_MANAGER, 'USR-CM-001');
    const hasResults = Array.isArray(cmResults) && cmResults.length > 0;
    addResult(
      '13. CONTENT_MANAGER search -> authorized results',
      hasResults,
      `Returned ${cmResults.length} authorized items for CONTENT_MANAGER`
    );
  } catch (err: any) {
    addResult('13. CONTENT_MANAGER search -> authorized results', false, err?.message);
  }

  // 14. VIDEO_EDITOR unauthorized script hidden
  try {
    const editorResults = await dashboardService.search('BP', UserRole.VIDEO_EDITOR, 'USR-UNASSIGNED-EDITOR');
    const hasScript = editorResults.some((r) => r.type === 'SCRIPT');
    addResult(
      '14. VIDEO_EDITOR unauthorized script hidden',
      !hasScript,
      `Found SCRIPT results: ${hasScript}`
    );
  } catch (err: any) {
    addResult('14. VIDEO_EDITOR unauthorized script hidden', false, err?.message);
  }

  // 15. DESIGNER unauthorized script hidden
  try {
    const designerResults = await dashboardService.search('BP', UserRole.DESIGNER, 'USR-UNASSIGNED-DESIGNER');
    const hasScript = designerResults.some((r) => r.type === 'SCRIPT');
    addResult(
      '15. DESIGNER unauthorized script hidden',
      !hasScript,
      `Found SCRIPT results: ${hasScript}`
    );
  } catch (err: any) {
    addResult('15. DESIGNER unauthorized script hidden', false, err?.message);
  }

  // 16. SCRIPT_WRITER unauthorized thumbnail hidden
  try {
    const writerResults = await dashboardService.search('BP', UserRole.SCRIPT_WRITER, 'USR-UNASSIGNED-WRITER');
    const hasThumbnail = writerResults.some((r) => r.type === 'THUMBNAIL');
    addResult(
      '16. SCRIPT_WRITER unauthorized thumbnail hidden',
      !hasThumbnail,
      `Found THUMBNAIL results: ${hasThumbnail}`
    );
  } catch (err: any) {
    addResult('16. SCRIPT_WRITER unauthorized thumbnail hidden', false, err?.message);
  }

  // 17. unauthorized assignment hidden
  try {
    const specialistResults = await dashboardService.search('Assignment', UserRole.DESIGNER, 'USR-SOME-DESIGNER');
    const hasForeignAssignment = specialistResults.some(
      (r) => r.type === 'ASSIGNMENT' && !r.title.includes('USR-SOME-DESIGNER')
    );
    addResult(
      '17. unauthorized assignment hidden',
      !hasForeignAssignment,
      `Found foreign assignments: ${hasForeignAssignment}`
    );
  } catch (err: any) {
    addResult('17. unauthorized assignment hidden', false, err?.message);
  }

  // 18. unauthorized video hidden
  try {
    const writerResults = await dashboardService.search('BP', UserRole.SCRIPT_WRITER, 'USR-UNASSIGNED-WRITER');
    const videos = writerResults.filter((r) => r.type === 'VIDEO');
    addResult(
      '18. unauthorized video hidden',
      videos.length === 0,
      `Unassigned writer video count: ${videos.length}`
    );
  } catch (err: any) {
    addResult('18. unauthorized video hidden', false, err?.message);
  }

  // 19. unauthorized question hidden
  try {
    const editorResults = await dashboardService.search('BP', UserRole.VIDEO_EDITOR, 'USR-UNASSIGNED-EDITOR');
    const questions = editorResults.filter((r) => r.type === 'QUESTION');
    addResult(
      '19. unauthorized question hidden',
      questions.length === 0,
      `Unassigned video editor question count: ${questions.length}`
    );
  } catch (err: any) {
    addResult('19. unauthorized question hidden', false, err?.message);
  }

  // 20. missing role fails closed
  try {
    const noRoleResults = await dashboardService.search('BP', undefined, 'USR-001');
    const noAuthResults = await dashboardService.search('BP', undefined, undefined);
    const failsClosed = noRoleResults.length === 0 && noAuthResults.length === 0;
    addResult(
      '20. missing role fails closed',
      failsClosed,
      `noRole count: ${noRoleResults.length}, noAuth count: ${noAuthResults.length}`
    );
  } catch (err: any) {
    addResult('20. missing role fails closed', false, err?.message);
  }

  // 21. CREATOR/EDITOR restricted
  try {
    const creatorResults = await dashboardService.search('BP', UserRole.CREATOR, 'USR-CREATOR');
    const hasSensitiveData = creatorResults.some(
      (r) => r.type === 'SCRIPT' || r.type === 'THUMBNAIL' || r.type === 'PINNED_COMMENT'
    );
    addResult(
      '21. CREATOR/EDITOR restricted',
      !hasSensitiveData,
      `Creator exposed sensitive data: ${hasSensitiveData}`
    );
  } catch (err: any) {
    addResult('21. CREATOR/EDITOR restricted', false, err?.message);
  }

  // 22. direct script endpoint unauthorized access blocked
  try {
    const res = await safeFetch('http://127.0.0.1:3000/api/videos/BP-V-000009/script');
    const isBlocked = res.status === 401 || res.status === 403;
    addResult(
      '22. direct script endpoint unauthorized access blocked',
      isBlocked,
      `Response status: ${res.status}`
    );
  } catch (err: any) {
    addResult('22. direct script endpoint unauthorized access blocked', false, err?.message);
  }

  // 23. direct thumbnail endpoint unauthorized access blocked
  try {
    const res = await safeFetch('http://127.0.0.1:3000/api/videos/BP-V-000009/thumbnail');
    const isBlocked = res.status === 401 || res.status === 403;
    addResult(
      '23. direct thumbnail endpoint unauthorized access blocked',
      isBlocked,
      `Response status: ${res.status}`
    );
  } catch (err: any) {
    addResult('23. direct thumbnail endpoint unauthorized access blocked', false, err?.message);
  }

  // 24. direct pinned-comment endpoint unauthorized access blocked
  try {
    const res = await safeFetch('http://127.0.0.1:3000/api/videos/BP-V-000009/pinned-comment');
    const isBlocked = res.status === 401 || res.status === 403;
    addResult(
      '24. direct pinned-comment endpoint unauthorized access blocked',
      isBlocked,
      `Response status: ${res.status}`
    );
  } catch (err: any) {
    addResult('24. direct pinned-comment endpoint unauthorized access blocked', false, err?.message);
  }

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const success = passedTests === totalTests;

  return {
    success,
    totalTests,
    passedTests,
    results,
  };
}

// CLI direct execution entry point
if (
  process.argv[1]?.endsWith('task3f55-global-search-routing-verification.ts') ||
  process.argv[1]?.endsWith('task3f55-global-search-routing-verification')
) {
  runTask3F55GlobalSearchVerification()
    .then((summary) => {
      console.log('Task 3F.5.5 Combined Verification Suite Results:');
      console.log(`PASSED: ${summary.passedTests} / ${summary.totalTests}`);
      console.log(`STATUS: ${summary.success ? 'PASS' : 'FAIL'}\n`);
      for (const r of summary.results) {
        console.log(`${r.passed ? '✅' : '❌'} ${r.name}: ${r.message || ''}`);
      }
      if (!summary.success) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}
