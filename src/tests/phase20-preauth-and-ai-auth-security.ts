/**
 * PHASE 20 — TEST RUNNER BOUNDARY & AI ROUTE ROLE-GATING VERIFICATION SUITE
 *
 * Verifies:
 * 1. Test runner security boundary for ALL /test/task4 (production 404, non-prod 401/403/ADMIN pass)
 * 2. Duplicate /tests/phase9 removal and production 404 guard
 * 3. AI routes authentication barrier (401 on anonymous)
 * 4. AI routes role gating (403 on unauthorized specialist roles)
 * 5. Legacy role barrier (403 on CREATOR and EDITOR)
 * 6. Authorized roles pass role gate with stubbed AI responses
 * 7. Resource abuse invariant: 0 AI calls executed on rejected requests
 */

import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { apiRouter } from '../server/routes';
import { authService } from '../lib/services/auth.service';
import { aiOrchestrator } from '../lib/ai/orchestrator';
import { geminiService } from '../lib/ai/gemini.service';
import { UserRole } from '../types';

export interface TestResult {
  testId: number;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export async function runPhase20SecurityVerification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: TestResult[];
}> {
  console.log('\n===============================================================');
  console.log('PHASE 20: TEST RUNNER BOUNDARY & AI ROUTE ROLE-GATING SECURITY');
  console.log('===============================================================\n');

  const results: TestResult[] = [];

  // Track AI call counts
  let orchestratorCallCount = 0;
  let geminiRefineCallCount = 0;
  let geminiScriptCallCount = 0;
  let geminiPlanCallCount = 0;

  // Stubs for AI services to prevent live provider calls
  const origGenerateCandidate = aiOrchestrator.generateQuestionCandidate;
  const origRefineCandidate = geminiService.refineCandidate;
  const origGenerateScript = geminiService.generateTeluguScript;
  const origGeneratePlan = geminiService.generateContentPlanRecommendation;

  (aiOrchestrator as any).generateQuestionCandidate = async (input: any) => {
    orchestratorCallCount++;
    return {
      success: true,
      candidate: {
        questionText: 'Mock Question Text',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'A',
        explanation: 'Mock explanation',
        metadata: { provider: 'mock', latencyMs: 1 },
      } as any,
    };
  };

  (geminiService as any).refineCandidate = async (input: any) => {
    geminiRefineCallCount++;
    return {
      success: true,
      refinedQuestion: {
        questionText: 'Refined Question Text',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'B',
        explanation: 'Refined explanation',
      } as any,
    };
  };

  (geminiService as any).generateTeluguScript = async (input: any) => {
    geminiScriptCallCount++;
    return {
      success: true,
      script: {
        title: 'Mock Script',
        hook: 'Mock Hook',
        body: 'Mock Body',
        callToAction: 'Mock CTA',
      } as any,
    };
  };

  (geminiService as any).generateContentPlanRecommendation = async (input: any) => {
    geminiPlanCallCount++;
    return {
      planSummary: 'Mock Plan Summary',
      batches: [],
    } as any;
  };

  // Build test Express server
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address() as any;
  const baseUrl = `http://127.0.0.1:${addr.port}/api`;

  // Helper function for making requests
  async function request(
    routePath: string,
    method: 'GET' | 'POST' = 'GET',
    token?: string | null,
    body?: any
  ): Promise<{ status: number; body: any }> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${baseUrl}${routePath}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status: res.status, body: json };
  }

  // Create session tokens for various roles
  const adminToken = authService.generateSessionToken({
    userId: 'USR-ADMIN',
    name: 'Admin User',
    role: UserRole.ADMIN,
  });

  const contentManagerToken = authService.generateSessionToken({
    userId: 'USR-MGR',
    name: 'Content Manager User',
    role: UserRole.CONTENT_MANAGER,
  });

  const questionEditorToken = authService.generateSessionToken({
    userId: 'USR-QE',
    name: 'Question Editor User',
    role: UserRole.QUESTION_EDITOR,
  });

  const contentWriterToken = authService.generateSessionToken({
    userId: 'USR-CW',
    name: 'Content Writer User',
    role: UserRole.CONTENT_WRITER,
  });

  const scriptWriterToken = authService.generateSessionToken({
    userId: 'USR-SW',
    name: 'Script Writer User',
    role: UserRole.SCRIPT_WRITER,
  });

  const videoEditorToken = authService.generateSessionToken({
    userId: 'USR-VE',
    name: 'Video Editor User',
    role: UserRole.VIDEO_EDITOR,
  });

  const designerToken = authService.generateSessionToken({
    userId: 'USR-DES',
    name: 'Designer User',
    role: UserRole.DESIGNER,
  });

  const speakerToken = authService.generateSessionToken({
    userId: 'USR-SPK',
    name: 'Speaker User',
    role: UserRole.SPEAKER,
  });

  const creatorToken = authService.generateSessionToken({
    userId: 'USR-CREATOR',
    name: 'Legacy Creator User',
    role: UserRole.CREATOR,
  });

  const editorToken = authService.generateSessionToken({
    userId: 'USR-EDITOR',
    name: 'Legacy Editor User',
    role: UserRole.EDITOR,
  });

  const origNodeEnv = process.env.NODE_ENV;
  const initialGoogleSheetsId = process.env.GOOGLE_SHEETS_ID;

  try {
    // =========================================================================
    // 1. TEST RUNNER SECURITY BOUNDARY (/test/task4 & /tests/phase9)
    // =========================================================================

    // Test 1: Production anonymous GET /api/test/task4 -> 404
    process.env.NODE_ENV = 'production';
    const res1 = await request('/test/task4', 'GET', null);
    const pass1 = res1.status === 404;
    results.push({
      testId: 1,
      name: 'Production anonymous GET /api/test/task4 -> 404',
      status: pass1 ? 'PASS' : 'FAIL',
      details: `Status=${res1.status} (expected 404). Details: ${JSON.stringify(res1.body)}`,
    });

    // Test 2: Production anonymous POST /api/test/task4 -> 404
    const res2 = await request('/test/task4', 'POST', null, { dummy: true });
    const pass2 = res2.status === 404;
    results.push({
      testId: 2,
      name: 'Production anonymous POST /api/test/task4 -> 404',
      status: pass2 ? 'PASS' : 'FAIL',
      details: `Status=${res2.status} (expected 404). Details: ${JSON.stringify(res2.body)}`,
    });

    // Switch back to non-production for authentication and RBAC checks
    process.env.NODE_ENV = 'test';

    // Test 3: Non-production anonymous GET /api/test/task4 -> 401
    const res3 = await request('/test/task4', 'GET', null);
    const pass3 = res3.status === 401;
    results.push({
      testId: 3,
      name: 'Non-production anonymous GET /api/test/task4 -> 401',
      status: pass3 ? 'PASS' : 'FAIL',
      details: `Status=${res3.status} (expected 401). Details: ${JSON.stringify(res3.body)}`,
    });

    // Test 4: Non-production authenticated QUESTION_EDITOR -> 403
    const res4 = await request('/test/task4', 'GET', questionEditorToken);
    const pass4 = res4.status === 403;
    results.push({
      testId: 4,
      name: 'Non-production authenticated QUESTION_EDITOR on /test/task4 -> 403',
      status: pass4 ? 'PASS' : 'FAIL',
      details: `Status=${res4.status} (expected 403). Details: ${JSON.stringify(res4.body)}`,
    });

    // Verify process.env.GOOGLE_SHEETS_ID has not been mutated by blocked attempts
    const envUnmutated = process.env.GOOGLE_SHEETS_ID === initialGoogleSheetsId;
    if (!envUnmutated) {
      console.error('CRITICAL WARNING: process.env.GOOGLE_SHEETS_ID was mutated by a blocked task4 request!');
    }

    // Test 5: Non-production authenticated ADMIN -> passes the security barrier
    // Mock the verification function to avoid heavy execution during test
    let task4RunnerExecuted = false;
    // We test that ADMIN gets past auth & role middleware (it will execute handler)
    // To verify cleanly without executing full sheets tests, we make request with admin token:
    const res5 = await request('/test/task4', 'GET', adminToken);
    // res5 will either be 200 (if runTask4 succeeds in memory mode) or 500 (if runner throws), but NOT 401/403/404
    const pass5 = res5.status === 200 || res5.status === 500;
    results.push({
      testId: 5,
      name: 'Non-production authenticated ADMIN on /test/task4 -> passes security barrier (not 401/403/404)',
      status: pass5 ? 'PASS' : 'FAIL',
      details: `Status=${res5.status} (allowed through auth/role gate). Body=${JSON.stringify(res5.body).slice(0, 100)}`,
    });

    // Test 6: Confirm duplicate /tests/phase9 registration no longer exists in routes.ts
    const routesContent = fs.readFileSync(path.resolve(process.cwd(), 'src/server/routes.ts'), 'utf8');
    const phase9Matches = routesContent.match(/apiRouter\.get\(\s*['"]\/tests\/phase9['"]/g) || [];
    const pass6 = phase9Matches.length === 1;
    results.push({
      testId: 6,
      name: 'Confirm duplicate /tests/phase9 route registration removed from routes.ts',
      status: pass6 ? 'PASS' : 'FAIL',
      details: `Found ${phase9Matches.length} registration(s) of /tests/phase9 in routes.ts (expected strictly 1).`,
    });

    // Test 7: Production request to /api/tests/phase9 -> 404 through authoritative guarded route
    process.env.NODE_ENV = 'production';
    const res7 = await request('/tests/phase9', 'GET', null);
    const pass7 = res7.status === 404;
    results.push({
      testId: 7,
      name: 'Production request to /api/tests/phase9 -> 404',
      status: pass7 ? 'PASS' : 'FAIL',
      details: `Status=${res7.status} (expected 404). Details: ${JSON.stringify(res7.body)}`,
    });

    // Reset back to test environment for remaining AI tests
    process.env.NODE_ENV = 'test';

    // =========================================================================
    // 2. AI AUTHENTICATION (Anonymous -> 401)
    // =========================================================================

    // Test 8: Anonymous /api/ai/generate -> 401
    const res8 = await request('/ai/generate', 'POST', null, { topic: 'Math' });
    const pass8 = res8.status === 401;
    results.push({
      testId: 8,
      name: 'Anonymous POST /api/ai/generate -> 401',
      status: pass8 ? 'PASS' : 'FAIL',
      details: `Status=${res8.status} (expected 401).`,
    });

    // Test 9: Anonymous /api/ai/refine -> 401
    const res9 = await request('/ai/refine', 'POST', null, { question: 'Sample' });
    const pass9 = res9.status === 401;
    results.push({
      testId: 9,
      name: 'Anonymous POST /api/ai/refine -> 401',
      status: pass9 ? 'PASS' : 'FAIL',
      details: `Status=${res9.status} (expected 401).`,
    });

    // Test 10: Anonymous /api/ai/script/generate -> 401
    const res10 = await request('/ai/script/generate', 'POST', null, { questionText: 'Sample' });
    const pass10 = res10.status === 401;
    results.push({
      testId: 10,
      name: 'Anonymous POST /api/ai/script/generate -> 401',
      status: pass10 ? 'PASS' : 'FAIL',
      details: `Status=${res10.status} (expected 401).`,
    });

    // Test 11: Anonymous /api/planning/ai-recommendation -> 401
    const res11 = await request('/planning/ai-recommendation', 'POST', null, {
      topicId: 'BP-TOP-001',
      categoryId: 'BP-CAT-001',
      targetQuestionCount: 5,
    });
    const pass11 = res11.status === 401;
    results.push({
      testId: 11,
      name: 'Anonymous POST /api/planning/ai-recommendation -> 401',
      status: pass11 ? 'PASS' : 'FAIL',
      details: `Status=${res11.status} (expected 401).`,
    });

    // =========================================================================
    // 3. AI UNAUTHORIZED CANONICAL ROLES (403 Forbidden)
    // =========================================================================

    // Test 12: SPEAKER -> /ai/generate -> 403
    const res12 = await request('/ai/generate', 'POST', speakerToken, { topic: 'Math' });
    const pass12 = res12.status === 403;
    results.push({
      testId: 12,
      name: 'SPEAKER -> POST /api/ai/generate -> 403',
      status: pass12 ? 'PASS' : 'FAIL',
      details: `Status=${res12.status} (expected 403).`,
    });

    // Test 13: VIDEO_EDITOR -> /ai/generate -> 403
    const res13 = await request('/ai/generate', 'POST', videoEditorToken, { topic: 'Math' });
    const pass13 = res13.status === 403;
    results.push({
      testId: 13,
      name: 'VIDEO_EDITOR -> POST /api/ai/generate -> 403',
      status: pass13 ? 'PASS' : 'FAIL',
      details: `Status=${res13.status} (expected 403).`,
    });

    // Test 14: DESIGNER -> /ai/script/generate -> 403
    const res14 = await request('/ai/script/generate', 'POST', designerToken, { questionText: 'Sample' });
    const pass14 = res14.status === 403;
    results.push({
      testId: 14,
      name: 'DESIGNER -> POST /api/ai/script/generate -> 403',
      status: pass14 ? 'PASS' : 'FAIL',
      details: `Status=${res14.status} (expected 403).`,
    });

    // Test 15: QUESTION_EDITOR -> /ai/script/generate -> 403
    const res15 = await request('/ai/script/generate', 'POST', questionEditorToken, { questionText: 'Sample' });
    const pass15 = res15.status === 403;
    results.push({
      testId: 15,
      name: 'QUESTION_EDITOR -> POST /api/ai/script/generate -> 403',
      status: pass15 ? 'PASS' : 'FAIL',
      details: `Status=${res15.status} (expected 403).`,
    });

    // Test 16: SCRIPT_WRITER -> /planning/ai-recommendation -> 403
    const res16 = await request('/planning/ai-recommendation', 'POST', scriptWriterToken, {
      topicId: 'BP-TOP-001',
      categoryId: 'BP-CAT-001',
      targetQuestionCount: 5,
    });
    const pass16 = res16.status === 403;
    results.push({
      testId: 16,
      name: 'SCRIPT_WRITER -> POST /api/planning/ai-recommendation -> 403',
      status: pass16 ? 'PASS' : 'FAIL',
      details: `Status=${res16.status} (expected 403).`,
    });

    // =========================================================================
    // 4. LEGACY ROLE BARRIER (CREATOR / EDITOR -> 403)
    // =========================================================================

    // Test 17: CREATOR -> /ai/generate -> 403
    const res17 = await request('/ai/generate', 'POST', creatorToken, { topic: 'Math' });
    const pass17 = res17.status === 403;
    results.push({
      testId: 17,
      name: 'CREATOR (legacy) -> POST /api/ai/generate -> 403',
      status: pass17 ? 'PASS' : 'FAIL',
      details: `Status=${res17.status} (expected 403).`,
    });

    // Test 18: EDITOR -> /ai/generate -> 403
    const res18 = await request('/ai/generate', 'POST', editorToken, { topic: 'Math' });
    const pass18 = res18.status === 403;
    results.push({
      testId: 18,
      name: 'EDITOR (legacy) -> POST /api/ai/generate -> 403',
      status: pass18 ? 'PASS' : 'FAIL',
      details: `Status=${res18.status} (expected 403).`,
    });

    // Test 19: CREATOR -> /ai/script/generate -> 403
    const res19 = await request('/ai/script/generate', 'POST', creatorToken, { questionText: 'Sample' });
    const pass19 = res19.status === 403;
    results.push({
      testId: 19,
      name: 'CREATOR (legacy) -> POST /api/ai/script/generate -> 403',
      status: pass19 ? 'PASS' : 'FAIL',
      details: `Status=${res19.status} (expected 403).`,
    });

    // Test 20: EDITOR -> /ai/script/generate -> 403
    const res20 = await request('/ai/script/generate', 'POST', editorToken, { questionText: 'Sample' });
    const pass20 = res20.status === 403;
    results.push({
      testId: 20,
      name: 'EDITOR (legacy) -> POST /api/ai/script/generate -> 403',
      status: pass20 ? 'PASS' : 'FAIL',
      details: `Status=${res20.status} (expected 403).`,
    });

    // Verify zero calls so far to downstream AI providers across tests 8-20
    const zeroCallsSoFar =
      orchestratorCallCount === 0 &&
      geminiRefineCallCount === 0 &&
      geminiScriptCallCount === 0 &&
      geminiPlanCallCount === 0;

    // =========================================================================
    // 5. AUTHORIZED ROLES (Passes Role Gate -> 200 with Mock Response)
    // =========================================================================

    // Test 21: QUESTION_EDITOR -> /ai/generate passes role gate
    const res21 = await request('/ai/generate', 'POST', questionEditorToken, {
      topic: 'Quantitative Aptitude',
      difficulty: 'MEDIUM',
    });
    const pass21 = res21.status === 200 && res21.body?.success === true;
    results.push({
      testId: 21,
      name: 'QUESTION_EDITOR -> POST /api/ai/generate passes role gate (200)',
      status: pass21 ? 'PASS' : 'FAIL',
      details: `Status=${res21.status}, success=${res21.body?.success}.`,
    });

    // Test 22: CONTENT_WRITER -> /ai/refine passes role gate
    const res22 = await request('/ai/refine', 'POST', contentWriterToken, {
      candidate: { questionText: 'Draft', options: { a: '1', b: '2', c: '3', d: '4' }, correctAnswer: 'A' },
      action: 'SIMPLIFY_LANGUAGE',
    });
    const pass22 = res22.status === 200 && res22.body?.success === true;
    results.push({
      testId: 22,
      name: 'CONTENT_WRITER -> POST /api/ai/refine passes role gate (200)',
      status: pass22 ? 'PASS' : 'FAIL',
      details: `Status=${res22.status}, success=${res22.body?.success}.`,
    });

    // Test 23: SCRIPT_WRITER -> /ai/script/generate passes role gate
    const res23 = await request('/ai/script/generate', 'POST', scriptWriterToken, {
      questionText: 'Test Telugu Question',
    });
    const pass23 = res23.status === 200 && res23.body?.success === true;
    results.push({
      testId: 23,
      name: 'SCRIPT_WRITER -> POST /api/ai/script/generate passes role gate (200)',
      status: pass23 ? 'PASS' : 'FAIL',
      details: `Status=${res23.status}, success=${res23.body?.success}.`,
    });

    // Test 24: CONTENT_MANAGER -> /planning/ai-recommendation passes role gate
    const res24 = await request('/planning/ai-recommendation', 'POST', contentManagerToken, {
      topicId: 'BP-TOP-001',
      categoryId: 'BP-CAT-001',
      targetQuestionCount: 5,
    });
    const pass24 = res24.status === 200;
    results.push({
      testId: 24,
      name: 'CONTENT_MANAGER -> POST /api/planning/ai-recommendation passes role gate (200)',
      status: pass24 ? 'PASS' : 'FAIL',
      details: `Status=${res24.status}.`,
    });

    // Test 25: ADMIN -> all four AI endpoints pass role gate
    const a1 = await request('/ai/generate', 'POST', adminToken, { topic: 'Math' });
    const a2 = await request('/ai/refine', 'POST', adminToken, { candidate: { questionText: 'T' } });
    const a3 = await request('/ai/script/generate', 'POST', adminToken, { questionText: 'T' });
    const a4 = await request('/planning/ai-recommendation', 'POST', adminToken, {
      topicId: 'BP-TOP-001',
      categoryId: 'BP-CAT-001',
      targetQuestionCount: 5,
    });
    const pass25 = a1.status === 200 && a2.status === 200 && a3.status === 200 && a4.status === 200;
    results.push({
      testId: 25,
      name: 'ADMIN -> all four AI endpoints pass role gate (200)',
      status: pass25 ? 'PASS' : 'FAIL',
      details: `Statuses: generate=${a1.status}, refine=${a2.status}, script=${a3.status}, plan=${a4.status}.`,
    });

    // =========================================================================
    // 6. RESOURCE ABUSE INVARIANT
    // =========================================================================

    // Test 26: Resource abuse invariant: Exactly the authorized tests executed AI stubs
    // In tests 8-20, all requests were rejected (401/403) and must NOT have touched AI stubs.
    // Tests 21-24 executed exactly 1 call each to their respective endpoints.
    // Test 25 executed 1 call each to all 4 endpoints.
    // Expected totals:
    // orchestratorCallCount = 2 (test 21, test 25 a1)
    // geminiRefineCallCount = 2 (test 22, test 25 a2)
    // geminiScriptCallCount = 2 (test 23, test 25 a3)
    // geminiPlanCallCount = 2 (test 24, test 25 a4)
    const pass26 =
      zeroCallsSoFar &&
      orchestratorCallCount === 2 &&
      geminiRefineCallCount === 2 &&
      geminiScriptCallCount === 2 &&
      geminiPlanCallCount === 2;

    results.push({
      testId: 26,
      name: 'Resource abuse invariant: Zero AI invocations on all 401/403 rejected requests',
      status: pass26 ? 'PASS' : 'FAIL',
      details: pass26
        ? `Verified: exactly 2 calls each executed for authorized tests (1 specialist + 1 admin). Zero calls on unauthorized/unauthenticated attempts.`
        : `Failed: orchestrator=${orchestratorCallCount} (exp 2), refine=${geminiRefineCallCount} (exp 2), script=${geminiScriptCallCount} (exp 2), plan=${geminiPlanCallCount} (exp 2). zeroCallsSoFar=${zeroCallsSoFar}.`,
    });
  } finally {
    // Restore environment variables
    process.env.NODE_ENV = origNodeEnv;

    // Restore stubbed AI methods
    aiOrchestrator.generateQuestionCandidate = origGenerateCandidate;
    geminiService.refineCandidate = origRefineCandidate;
    geminiService.generateTeluguScript = origGenerateScript;
    geminiService.generateContentPlanRecommendation = origGeneratePlan;

    // Close test server
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  const totalChecks = results.length;
  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = totalChecks - passedChecks;
  const passed = failedChecks === 0;

  console.log('Test Results:');
  console.log('---------------------------------------------------------------');
  results.forEach((r) => {
    const icon = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`[${String(r.testId).padStart(2, ' ')}] ${icon} - ${r.name}`);
    console.log(`     Details: ${r.details}\n`);
  });

  console.log('===============================================================');
  console.log(`TOTAL: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
  console.log(`RESULT: ${passed ? 'ALL PHASE 20 SECURITY CHECKS PASSED' : 'VERIFICATION FAILED'}`);
  console.log('===============================================================\n');

  return {
    passed,
    totalChecks,
    passedChecks,
    failedChecks,
    results,
  };
}

const isDirectRun =
  process.argv[1] &&
  (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    import.meta.url.endsWith('phase20-preauth-and-ai-auth-security.ts'));

if (isDirectRun) {
  runPhase20SecurityVerification()
    .then((res) => {
      process.exit(res.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
