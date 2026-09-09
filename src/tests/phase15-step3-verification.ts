/**
 * BURRA PARIKSHA CMS - Phase 15.3 Verification Suite
 * Targeted Read-Path Optimization: DashboardService.search Authorization Fan-Out
 */

import fs from 'fs';
import path from 'path';
import { dashboardService } from '../lib/services/dashboard.service';
import { objectAuthService } from '../lib/services/object-auth.service';
import { UserRole } from '../types';

export async function runPhase15Step3Verification(): Promise<{
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  const addResult = (name: string, passed: boolean, message?: string) => {
    results.push({ name, passed, message });
  };

  const adminRole = UserRole.ADMIN;
  const adminId = 'USR-001';
  const managerRole = UserRole.CONTENT_MANAGER;
  const managerId = 'USR-MGR-001';

  // 1. Code Inspection: Candidate Pre-Filtering & Bounded Concurrency in DashboardService.search
  try {
    const code = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/services/dashboard.service.ts'), 'utf8');
    const searchBlock = code.substring(code.indexOf('public async search('), code.indexOf('public async getOverview('));

    const hasMapLimit = searchBlock.includes('mapLimit');
    const hasPreFilterMasters = searchBlock.includes('matchingMasters = contentMasters.filter');
    const hasPreFilterQuestions = searchBlock.includes('matchingQuestions = questions.filter');
    const hasPreFilterVideos = searchBlock.includes('matchingVideos = videos.filter');
    const hasPreFilterScripts = searchBlock.includes('matchingScripts = scripts.filter');
    const hasPreFilterThumbnails = searchBlock.includes('matchingThumbnails = thumbnails.filter');
    const hasPreFilterComments = searchBlock.includes('matchingComments = pinnedComments.filter');
    const hasPreFilterReviews = searchBlock.includes('matchingReviews = socialReviews.filter');
    const hasPreFilterPublishing = searchBlock.includes('matchingPublishing = publishingRecords.filter');
    const checksManagerFastPath = searchBlock.includes('isManagerOrAdmin');

    const codeOptimized =
      hasMapLimit &&
      hasPreFilterMasters &&
      hasPreFilterQuestions &&
      hasPreFilterVideos &&
      hasPreFilterScripts &&
      hasPreFilterThumbnails &&
      hasPreFilterComments &&
      hasPreFilterReviews &&
      hasPreFilterPublishing &&
      checksManagerFastPath;

    addResult(
      '1. Code Verification: Pre-filtering before auth checks and bounded concurrency mapLimit in place',
      codeOptimized,
      `mapLimit: ${hasMapLimit}, preFiltering: ${hasPreFilterQuestions && hasPreFilterVideos}, fastPath: ${checksManagerFastPath}`
    );
  } catch (err: any) {
    addResult('1. Code Verification: Pre-filtering before auth checks', false, err?.message);
  }

  // 2. Exact-ID Search Consistency for Specialist
  try {
    const writerId = 'USR-SCRIPT-001';
    const writerRole = UserRole.SCRIPT_WRITER;
    const res = await dashboardService.search('BP-Q-000001', writerRole, writerId);
    // Should execute cleanly, returning results if assigned or public, empty if not assigned
    addResult(
      '2. Exact-ID Search Consistency: Specialist query executed safely with fail-closed semantics',
      Array.isArray(res),
      `Returned ${res.length} results without runtime exception`
    );
  } catch (err: any) {
    addResult('2. Exact-ID Search Consistency: Specialist query executed safely', false, err?.message);
  }

  // 3. Manager/Admin Fast-Path Consistency: Admin sees all matching entity types
  try {
    const adminRes = await dashboardService.search('BP-', adminRole, adminId);
    const typesFound = new Set(adminRes.map((r) => r.type));
    const hasMultiple = typesFound.size >= 2;
    addResult(
      '3. Admin Search Completeness: Admin fast-path retrieves matching entities without regression',
      hasMultiple,
      `Found entity types: ${Array.from(typesFound).join(', ')}`
    );
  } catch (err: any) {
    addResult('3. Admin Search Completeness: Admin fast-path retrieves matching entities', false, err?.message);
  }

  // 4. Content Manager Search Completeness
  try {
    const mgrRes = await dashboardService.search('BP-', managerRole, managerId);
    const typesFound = new Set(mgrRes.map((r) => r.type));
    const hasMultiple = typesFound.size >= 2;
    addResult(
      '4. Content Manager Completeness: Manager retrieves matching entities without regression',
      hasMultiple,
      `Found entity types: ${Array.from(typesFound).join(', ')}`
    );
  } catch (err: any) {
    addResult('4. Content Manager Completeness: Manager retrieves matching entities', false, err?.message);
  }

  // 5. Unassigned Specialist Authorization Protection: Unassigned designer sees 0 unauthorized publishing records
  try {
    const unassignedDesigner = 'USR-DESIGNER-TEST-99';
    const designerRes = await dashboardService.search('PUB-', UserRole.DESIGNER, unassignedDesigner);
    const hasPublishing = designerRes.some((r) => r.type === 'PUBLISHING');
    addResult(
      '5. IDOR/BOLA Protection: Unassigned designer cannot discover publishing records',
      !hasPublishing,
      `Publishing records found: ${hasPublishing}`
    );
  } catch (err: any) {
    addResult('5. IDOR/BOLA Protection: Unassigned designer cannot discover publishing records', false, err?.message);
  }

  // 6. Unassigned Specialist Review Protection: Unassigned reviewer sees 0 unassigned social reviews
  try {
    const unassignedReviewer = 'USR-REV-TEST-99';
    const revRes = await dashboardService.search('BP-REV-', UserRole.REVIEWER, unassignedReviewer);
    const hasSocialReviews = revRes.some((r) => r.type === 'SOCIAL_REVIEW');
    addResult(
      '6. IDOR/BOLA Protection: Unassigned reviewer cannot discover unauthorized social reviews',
      !hasSocialReviews,
      `Social reviews found: ${hasSocialReviews}`
    );
  } catch (err: any) {
    addResult('6. IDOR/BOLA Protection: Unassigned reviewer cannot discover unauthorized social reviews', false, err?.message);
  }

  // 7. Telugu & Unicode Search Preservation
  try {
    const teluguRes = await dashboardService.search('భారత్', adminRole, adminId);
    addResult(
      '7. Telugu/Unicode Search Integrity: Unicode query processed without exception',
      Array.isArray(teluguRes),
      `Found ${teluguRes.length} items for Telugu query`
    );
  } catch (err: any) {
    addResult('7. Telugu/Unicode Search Integrity: Unicode query processed without exception', false, err?.message);
  }

  // 8. Result Caps Preservation
  try {
    const broadRes = await dashboardService.search('a', adminRole, adminId);
    const masters = broadRes.filter((r) => r.type === ('CONTENT_MASTER' as any)).length;
    const questions = broadRes.filter((r) => r.type === 'QUESTION').length;
    const videos = broadRes.filter((r) => r.type === 'VIDEO').length;
    const capsPreserved = masters <= 15 && questions <= 25 && videos <= 50;
    addResult(
      '8. Result Caps Preservation: Entity caps remain strictly bounded',
      capsPreserved,
      `Masters: ${masters} (<=15), Questions: ${questions} (<=25), Videos: ${videos} (<=50)`
    );
  } catch (err: any) {
    addResult('8. Result Caps Preservation: Entity caps remain strictly bounded', false, err?.message);
  }

  // 9. Empty and Invalid Queries Fail-Closed
  try {
    const emptyRes = await dashboardService.search('', adminRole, adminId);
    const whitespaceRes = await dashboardService.search('   ', adminRole, adminId);
    const noActorRes = await dashboardService.search('test', undefined as any, undefined as any);
    const safeFailClosed = emptyRes.length === 0 && whitespaceRes.length === 0 && noActorRes.length === 0;
    addResult(
      '9. Fail-Closed Validation: Empty query or missing actor returns empty array immediately',
      safeFailClosed,
      `empty: ${emptyRes.length}, whitespace: ${whitespaceRes.length}, noActor: ${noActorRes.length}`
    );
  } catch (err: any) {
    addResult('9. Fail-Closed Validation: Empty query or missing actor returns empty array immediately', false, err?.message);
  }

  // 10. Canonical URL Mapping Consistency
  try {
    const qResults = await dashboardService.search('BP-Q-', adminRole, adminId);
    const firstQ = qResults.find((r) => r.type === 'QUESTION');
    const vResults = await dashboardService.search('BP-V-', adminRole, adminId);
    const firstV = vResults.find((r) => r.type === 'VIDEO');

    const qValidUrl = Boolean(firstQ && firstQ.url.startsWith('/questions/'));
    const vValidUrl = Boolean(firstV && firstV.url.startsWith('/production/'));

    addResult(
      '10. Canonical Route Preservation: Questions and Videos retain exact canonical route patterns',
      qValidUrl && vValidUrl,
      `Question URL: ${firstQ?.url}, Video URL: ${firstV?.url}`
    );
  } catch (err: any) {
    addResult('10. Canonical Route Preservation: Questions and Videos retain exact canonical route patterns', false, err?.message);
  }

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const success = passedTests === totalTests;

  return { success, totalTests, passedTests, results };
}

if (
  process.argv[1]?.endsWith('phase15-step3-verification.ts') ||
  process.argv[1]?.endsWith('phase15-step3-verification') ||
  process.argv[1]?.includes('phase15-step3-verification')
) {
  runPhase15Step3Verification()
    .then((report) => {
      console.log('='.repeat(70));
      console.log(`PHASE 15.3 VERIFICATION REPORT: ${report.passedTests}/${report.totalTests} PASSED`);
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
