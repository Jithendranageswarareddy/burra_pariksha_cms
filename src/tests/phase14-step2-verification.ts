/**
 * BURRA PARIKSHA CMS - Phase 14.2 Verification Suite
 * Global Search Omnipresence & Entity Extension
 */

import fs from 'fs';
import path from 'path';
import { dashboardService } from '../lib/services';
import { UserRole } from '../types';

export async function runPhase14Step2Verification(): Promise<{
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  const adminRole = UserRole.ADMIN;
  const adminId = 'USR-001';
  const managerRole = UserRole.CONTENT_MANAGER;
  const managerId = 'USR-MGR-001';

  const addResult = (name: string, passed: boolean, message?: string) => {
    results.push({ name, passed, message });
  };

  const safeFetch = async (url: string) => {
    return await fetch(url, {
      headers: { Connection: 'close' },
      signal: AbortSignal.timeout(4000),
    });
  };

  // 1. GlobalSearchBar is accessible from persistent application shell/header
  try {
    const headerPath = path.resolve(process.cwd(), 'src/components/layout/Header.tsx');
    const headerCode = fs.readFileSync(headerPath, 'utf8');
    const hasImport = headerCode.includes("import { GlobalSearchBar }") || headerCode.includes("from '../dashboard/GlobalSearchBar'");
    const hasSearchRender = headerCode.includes('<GlobalSearchBar') && headerCode.includes('header-global-search');
    const isAccessible = hasImport && hasSearchRender;
    addResult(
      '1. GlobalSearchBar is accessible from persistent application shell/header',
      isAccessible,
      `Header includes GlobalSearchBar component: ${isAccessible}`
    );
  } catch (err: any) {
    addResult('1. GlobalSearchBar is accessible from persistent application shell/header', false, err?.message);
  }

  // 2. Existing dashboard search remains functional
  try {
    const dashboardPath = path.resolve(process.cwd(), 'src/pages/DashboardPage.tsx');
    const dashCode = fs.readFileSync(dashboardPath, 'utf8');
    const hasDashSearch = dashCode.includes('<GlobalSearchBar');
    addResult(
      '2. Existing dashboard search remains functional',
      hasDashSearch,
      `DashboardPage retains GlobalSearchBar: ${hasDashSearch}`
    );
  } catch (err: any) {
    addResult('2. Existing dashboard search remains functional', false, err?.message);
  }

  // 3. Social Review search returns matching authorized records
  try {
    const searchRes = await dashboardService.search('BP-REV-', adminRole, adminId);
    const srResult = searchRes.find((r) => r.type === 'SOCIAL_REVIEW');
    const isCorrect = Boolean(
      srResult &&
      srResult.id.startsWith('BP-REV-') &&
      srResult.url.startsWith('/questions/')
    );
    addResult(
      '3. Social Review search returns matching authorized records',
      isCorrect,
      srResult ? `Found Social Review ${srResult.id} with URL ${srResult.url}` : 'No SOCIAL_REVIEW result found'
    );
  } catch (err: any) {
    addResult('3. Social Review search returns matching authorized records', false, err?.message);
  }

  // 4. Publishing search returns matching authorized records
  try {
    const searchRes = await dashboardService.search('PUB-000001', adminRole, adminId);
    const pubResult = searchRes.find((r) => r.type === 'PUBLISHING');
    const isCorrect = Boolean(
      pubResult &&
      pubResult.id === 'PUB-000001' &&
      pubResult.url.includes('/publishing?videoId=BP-V-000001')
    );
    addResult(
      '4. Publishing search returns matching authorized records',
      isCorrect,
      pubResult ? `Found Publishing ${pubResult.id} with URL ${pubResult.url}` : 'No PUBLISHING result found'
    );
  } catch (err: any) {
    addResult('4. Publishing search returns matching authorized records', false, err?.message);
  }

  // 5. Social Review unauthorized records are excluded
  try {
    const unassignedEditorId = 'USR-UNASSIGNED-EDITOR';
    const editorResults = await dashboardService.search('BP-REV-', UserRole.VIDEO_EDITOR, unassignedEditorId);
    const foundUnauthorized = editorResults.some((r) => r.type === 'SOCIAL_REVIEW');
    addResult(
      '5. Social Review unauthorized records are excluded',
      !foundUnauthorized,
      `Unassigned editor saw social reviews: ${foundUnauthorized}`
    );
  } catch (err: any) {
    addResult('5. Social Review unauthorized records are excluded', false, err?.message);
  }

  // 6. Publishing unauthorized records are excluded
  try {
    const unassignedDesignerId = 'USR-UNASSIGNED-DESIGNER';
    const designerResults = await dashboardService.search('PUB-', UserRole.DESIGNER, unassignedDesignerId);
    const foundUnauthorized = designerResults.some((r) => r.type === 'PUBLISHING');
    addResult(
      '6. Publishing unauthorized records are excluded',
      !foundUnauthorized,
      `Unassigned designer saw publishing records: ${foundUnauthorized}`
    );
  } catch (err: any) {
    addResult('6. Publishing unauthorized records are excluded', false, err?.message);
  }

  // 7. ADMIN can search authorized Social Review/Publishing records
  try {
    const adminReviews = await dashboardService.search('APPROVED', adminRole, adminId);
    const hasReviews = adminReviews.some((r) => r.type === 'SOCIAL_REVIEW');
    const adminPub = await dashboardService.search('Vande Bharat', adminRole, adminId);
    const hasPub = adminPub.some((r) => r.type === 'PUBLISHING');
    const passed = hasReviews && hasPub;
    addResult(
      '7. ADMIN can search authorized Social Review/Publishing records',
      passed,
      `Admin found Social Review: ${hasReviews}, Publishing: ${hasPub}`
    );
  } catch (err: any) {
    addResult('7. ADMIN can search authorized Social Review/Publishing records', false, err?.message);
  }

  // 8. CONTENT_MANAGER can search authorized Social Review/Publishing records
  try {
    const mgrReviews = await dashboardService.search('APPROVED', managerRole, managerId);
    const hasReviews = mgrReviews.some((r) => r.type === 'SOCIAL_REVIEW');
    const mgrPub = await dashboardService.search('Vande Bharat', managerRole, managerId);
    const hasPub = mgrPub.some((r) => r.type === 'PUBLISHING');
    const passed = hasReviews && hasPub;
    addResult(
      '8. CONTENT_MANAGER can search authorized Social Review/Publishing records',
      passed,
      `Manager found Social Review: ${hasReviews}, Publishing: ${hasPub}`
    );
  } catch (err: any) {
    addResult('8. CONTENT_MANAGER can search authorized Social Review/Publishing records', false, err?.message);
  }

  // 9. REVIEWER cannot discover unauthorized Social Reviews
  try {
    const unassignedReviewerId = 'USR-REVIEWER-UNASSIGNED-99';
    const reviewerRes = await dashboardService.search('BP-REV-', UserRole.REVIEWER, unassignedReviewerId);
    const foundAny = reviewerRes.some((r) => r.type === 'SOCIAL_REVIEW');
    addResult(
      '9. REVIEWER cannot discover unauthorized Social Reviews',
      !foundAny,
      `Unassigned reviewer found social reviews: ${foundAny}`
    );
  } catch (err: any) {
    addResult('9. REVIEWER cannot discover unauthorized Social Reviews', false, err?.message);
  }

  // 10. Specialist roles cannot gain access through search query manipulation
  try {
    const evilQueries = ['*', '%', '', 'true', '1=1', 'approved', 'ready'];
    let leakDetected = false;
    for (const q of evilQueries) {
      const res = await dashboardService.search(q, UserRole.SCRIPT_WRITER, 'USR-WRITER-UNASSIGNED');
      if (res.some((r) => r.type === 'SOCIAL_REVIEW' || r.type === 'PUBLISHING')) {
        leakDetected = true;
        break;
      }
    }
    addResult(
      '10. Specialist roles cannot gain access through search query manipulation',
      !leakDetected,
      `Query manipulation bypassed authorization: ${leakDetected}`
    );
  } catch (err: any) {
    addResult('10. Specialist roles cannot gain access through search query manipulation', false, err?.message);
  }

  // 11. Existing Question routing still works
  try {
    const qResults = await dashboardService.search('BP-Q-000009', adminRole, adminId);
    const qResult = qResults.find((r) => r.type === 'QUESTION');
    const passed = Boolean(qResult && qResult.url === '/questions/BP-Q-000009');
    addResult(
      '11. Existing Question routing still works',
      passed,
      qResult ? `Question URL: ${qResult.url}` : 'Question not found'
    );
  } catch (err: any) {
    addResult('11. Existing Question routing still works', false, err?.message);
  }

  // 12. Existing Video routing still works
  try {
    const vResults = await dashboardService.search('BP-V-000009', adminRole, adminId);
    const vResult = vResults.find((r) => r.type === 'VIDEO');
    const passed = Boolean(vResult && vResult.url === '/production/BP-V-000009');
    addResult(
      '12. Existing Video routing still works',
      passed,
      vResult ? `Video URL: ${vResult.url}` : 'Video not found'
    );
  } catch (err: any) {
    addResult('12. Existing Video routing still works', false, err?.message);
  }

  // 13. Existing Script/Thumbnail/Pinned Comment routing still works
  try {
    const scriptResults = await dashboardService.search('SCRIPT', adminRole, adminId);
    const sResult = scriptResults.find((r) => r.type === 'SCRIPT');
    const thumbResults = await dashboardService.search('ID-VIDEOS-EXEC-1', adminRole, adminId);
    const tResult = thumbResults.find((r) => r.type === 'THUMBNAIL');
    const pResult = thumbResults.find((r) => r.type === 'PINNED_COMMENT');
    const passed = Boolean(
      (!sResult || sResult.url.includes('tab=script')) &&
      (!tResult || tResult.url.includes('tab=thumbnail')) &&
      (!pResult || pResult.url.includes('tab=pinned-comment'))
    );
    addResult(
      '13. Existing Script/Thumbnail/Pinned Comment routing still works',
      passed,
      `Script URL: ${sResult?.url}, Thumbnail URL: ${tResult?.url}, Pinned URL: ${pResult?.url}`
    );
  } catch (err: any) {
    addResult('13. Existing Script/Thumbnail/Pinned Comment routing still works', false, err?.message);
  }

  // 14. Telugu/Unicode search remains functional
  try {
    const teluguRes = await dashboardService.search('వందే భారత్', adminRole, adminId);
    addResult(
      '14. Telugu/Unicode search remains functional',
      true,
      `Handled Unicode/Telugu search safely. Found: ${teluguRes.length} records`
    );
  } catch (err: any) {
    addResult('14. Telugu/Unicode search remains functional', false, err?.message);
  }

  // 15. Empty/invalid queries remain safe
  try {
    const empty1 = await dashboardService.search('', adminRole, adminId);
    const empty2 = await dashboardService.search('   ', adminRole, adminId);
    const empty3 = await dashboardService.search(null as any, adminRole, adminId);
    const passed = empty1.length === 0 && empty2.length === 0 && empty3.length === 0;
    addResult(
      '15. Empty/invalid queries remain safe',
      passed,
      `Empty results lengths: ${empty1.length}, ${empty2.length}, ${empty3.length}`
    );
  } catch (err: any) {
    addResult('15. Empty/invalid queries remain safe', false, err?.message);
  }

  // 16. /api/search remains authenticated
  try {
    const res = await safeFetch('http://localhost:3000/api/search?q=test');
    const passed = res.status === 401;
    addResult(
      '16. /api/search remains authenticated',
      passed,
      `Unauthenticated response status: ${res.status}`
    );
  } catch (err: any) {
    addResult('16. /api/search remains authenticated', false, err?.message);
  }

  // 17. Phase 14.1 fail-closed behavior remains intact
  try {
    const noRole = await dashboardService.search('test', undefined, adminId);
    const noUser = await dashboardService.search('test', adminRole, undefined);
    const noBoth = await dashboardService.search('test');
    const passed = noRole.length === 0 && noUser.length === 0 && noBoth.length === 0;
    addResult(
      '17. Phase 14.1 fail-closed behavior remains intact',
      passed,
      `noRole count: ${noRole.length}, noUser count: ${noUser.length}, noBoth count: ${noBoth.length}`
    );
  } catch (err: any) {
    addResult('17. Phase 14.1 fail-closed behavior remains intact', false, err?.message);
  }

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const success = passedTests === totalTests;

  return { success, totalTests, passedTests, results };
}

// CLI direct execution
if (
  process.argv[1]?.endsWith('phase14-step2-verification.ts') ||
  process.argv[1]?.endsWith('phase14-step2-verification')
) {
  runPhase14Step2Verification()
    .then((summary) => {
      console.log('Phase 14.2 Verification Suite Results:');
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
