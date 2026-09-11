/**
 * PHASE 17.1 — SOCIAL ENHANCEMENT ROUTE AUTHENTICATION & SHADOW HANDLER REMOVAL
 *
 * Verification suite testing:
 * 1. hooks/generate unauthenticated -> Expected 401, AI generation service must not execute.
 * 2. hooks/generate authenticated unauthorized role -> Expected 403, AI generation service must not execute.
 * 3. hooks/generate authenticated authorized role -> Expected 200, authoritative handler executes.
 * 4. hooks/generate duplicate/shadow verification -> Exactly 1 route registration, authenticated handler not shadowed.
 * 5. quality-assessment/generate unauthenticated -> Expected 401, AI evaluation service must not execute.
 * 6. quality-assessment/generate authenticated unauthorized role -> Expected 403, AI evaluation service must not execute.
 * 7. quality-assessment/generate authenticated authorized role -> Expected 200, AI evaluation executes.
 * 8. No accidental AI execution on rejected requests -> Mocked AI call counts remain strictly 0 for rejected requests.
 */

import express from 'express';
import http from 'http';
import { apiRouter } from '../server/routes';
import { authService } from '../lib/services/auth.service';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { questionService } from '../lib/services/question.service';
import { SocialEnhancementService } from '../lib/services/social-enhancement.service';
import { Question, QuestionLanguage, QuestionStatus, UserRole, VideoProductionStatus } from '../types';

export interface TestResult {
  testId: number;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export async function runPhase17Step1SocialEnhancementAuthSecurityVerification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: TestResult[];
}> {
  console.log('\n===============================================================');
  console.log('PHASE 17.1: SOCIAL ENHANCEMENT AUTHENTICATION & SHADOW REMOVAL');
  console.log('===============================================================\n');

  const results: TestResult[] = [];

  // Track AI call invocations
  let hookAiCallCount = 0;
  let qualityAiCallCount = 0;

  // Mock Question fixture
  const mockQuestion: Question = {
    id: 'BP-Q-009901',
    contentMasterId: 'BP-MST-000001',
    categoryId: 'BP-CAT-000001',
    categoryName: 'General Studies',
    topicId: 'BP-TOP-000001',
    topicName: 'Polity',
    subtopicId: 'BP-SUB-000001',
    subtopicName: 'Constitution',
    questionText: 'Which Article of the Indian Constitution provides for the Finance Commission?',
    options: { a: 'Article 280', b: 'Article 324', c: 'Article 356', d: 'Article 370' },
    correctAnswer: 'A',
    explanation: 'Article 280 specifies the constitution of a Finance Commission every five years.',
    difficulty: 'MEDIUM',
    language: QuestionLanguage.TELUGU,
    status: QuestionStatus.APPROVED,
    videoStatus: VideoProductionStatus.NOT_STARTED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Preserve original methods
  const origFindById = questionsRepository.findById;
  const origGetQuestionById = questionService.getQuestionById;
  const origGenerateDraft = SocialEnhancementService.generateSocialEnhancementDraft;
  const origAssessQuality = SocialEnhancementService.assessQuality;

  // Mock repository / service methods
  questionsRepository.findById = async (id: string) => {
    if (id === mockQuestion.id) return mockQuestion;
    return null;
  };
  questionService.getQuestionById = async (id: string) => {
    if (id === mockQuestion.id) return mockQuestion;
    return null;
  };

  // Mock AI generation draft method
  SocialEnhancementService.generateSocialEnhancementDraft = async (input: any) => {
    hookAiCallCount++;
    return {
      payload: {
        questionId: input.question.id,
        hooks: [
          {
            hookText: 'Did you know how the Finance Commission is formed?',
            hookStyle: 'CURIOSITY' as any,
            targetAudience: 'Exam aspirants',
            estimatedDropOffRisk: 'LOW',
            callToAction: 'Watch to find out!',
          },
        ],
        targetLanguage: QuestionLanguage.TELUGU,
        presentationStrategy: {
          recommendedVisualFormat: 'TALKING_HEAD' as any,
          pacingGuide: 'MEDIUM',
          teleprompterTone: 'CONFIDENT',
        },
        aiCallsCount: 1,
      } as any,
      isEligible: true,
      reason: 'Eligible for social enhancement',
      aiCallsCount: 1,
    };
  };

  // Mock Quality assessment method
  SocialEnhancementService.assessQuality = async () => {
    qualityAiCallCount++;
    return {
      overallScore: 92,
      hookStrengthScore: 95,
      pedagogicalClarityScore: 90,
      engagementPotentialScore: 91,
      formatComplianceScore: 92,
      recommendation: 'APPROVE_AS_IS' as any,
      actionableFeedback: ['Excellent hook retention potential.'],
      aiCallsCount: 1,
    } as any;
  };

  // Setup express test server
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  let server: http.Server;
  let baseUrl: string;

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });

  // Auth tokens for test roles
  const writerToken = authService.generateSessionToken({
    userId: 'USR-WRITER-01',
    name: 'Script Writer User',
    role: UserRole.SCRIPT_WRITER,
  });
  const editorRoleToken = authService.generateSessionToken({
    userId: 'USR-QEDITOR-01',
    name: 'Question Editor User',
    role: UserRole.QUESTION_EDITOR,
  });
  const unauthorizedToken = authService.generateSessionToken({
    userId: 'USR-SPEAKER-01',
    name: 'Speaker User',
    role: UserRole.SPEAKER,
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: hooks/generate unauthenticated -> 401, AI call count unchanged (0)
    // -------------------------------------------------------------------------
    const res1 = await fetch(`${baseUrl}/social-enhancement/hooks/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: mockQuestion.id }),
    });
    const data1 = await res1.json();
    const passed1 = res1.status === 401 && hookAiCallCount === 0;
    results.push({
      testId: 1,
      name: 'hooks/generate unauthenticated rejected with 401, AI generation not executed',
      status: passed1 ? 'PASS' : 'FAIL',
      details: passed1
        ? `HTTP ${res1.status} returned, AI generation call count remained ${hookAiCallCount}.`
        : `Failed: HTTP ${res1.status}, AI calls: ${hookAiCallCount}, response: ${JSON.stringify(data1)}`,
    });

    // -------------------------------------------------------------------------
    // TEST 2: hooks/generate authenticated unauthorized role -> 403, AI call count 0
    // -------------------------------------------------------------------------
    const res2 = await fetch(`${baseUrl}/social-enhancement/hooks/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${unauthorizedToken}`,
      },
      body: JSON.stringify({ questionId: mockQuestion.id }),
    });
    const data2 = await res2.json();
    const passed2 = res2.status === 403 && hookAiCallCount === 0;
    results.push({
      testId: 2,
      name: 'hooks/generate authenticated unauthorized role rejected with 403, AI generation not executed',
      status: passed2 ? 'PASS' : 'FAIL',
      details: passed2
        ? `HTTP ${res2.status} returned, error: "${data2.error}", AI call count remained ${hookAiCallCount}.`
        : `Failed: HTTP ${res2.status}, AI calls: ${hookAiCallCount}, response: ${JSON.stringify(data2)}`,
    });

    // -------------------------------------------------------------------------
    // TEST 3: hooks/generate authenticated authorized role -> 200, AI executes
    // -------------------------------------------------------------------------
    const preCallCount3 = hookAiCallCount;
    const res3 = await fetch(`${baseUrl}/social-enhancement/hooks/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${writerToken}`,
      },
      body: JSON.stringify({ questionId: mockQuestion.id }),
    });
    const data3 = await res3.json();
    const passed3 = res3.status === 200 && data3.success === true && hookAiCallCount === preCallCount3 + 1;
    results.push({
      testId: 3,
      name: 'hooks/generate authenticated authorized role succeeds with 200, authoritative handler executes',
      status: passed3 ? 'PASS' : 'FAIL',
      details: passed3
        ? `HTTP 200 returned, success=true, AI calls incremented to ${hookAiCallCount}, received data with hooks.`
        : `Failed: HTTP ${res3.status}, AI calls: ${hookAiCallCount}, response: ${JSON.stringify(data3)}`,
    });

    // -------------------------------------------------------------------------
    // TEST 4: hooks/generate duplicate/shadow verification -> exactly 1 registration
    // -------------------------------------------------------------------------
    const matchingLayers = apiRouter.stack.filter(
      (layer: any) =>
        layer.route &&
        layer.route.path === '/social-enhancement/hooks/generate' &&
        layer.route.methods &&
        Boolean(layer.route.methods.post)
    );
    const passed4 = matchingLayers.length === 1;
    results.push({
      testId: 4,
      name: 'hooks/generate duplicate/shadow removal verified: exactly 1 effective route registration',
      status: passed4 ? 'PASS' : 'FAIL',
      details: passed4
        ? `Confirmed exactly ${matchingLayers.length} route registration for POST /social-enhancement/hooks/generate. Shadow handler eliminated.`
        : `Failed: Found ${matchingLayers.length} conflicting registrations for POST /social-enhancement/hooks/generate!`,
    });

    // -------------------------------------------------------------------------
    // TEST 5: quality-assessment/generate unauthenticated -> 401, AI call count 0
    // -------------------------------------------------------------------------
    const res5 = await fetch(`${baseUrl}/social-enhancement/quality-assessment/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: mockQuestion.id,
        enhancementPackage: { hooks: [] },
      }),
    });
    const data5 = await res5.json();
    const passed5 = res5.status === 401 && qualityAiCallCount === 0;
    results.push({
      testId: 5,
      name: 'quality-assessment/generate unauthenticated rejected with 401, AI evaluation not executed',
      status: passed5 ? 'PASS' : 'FAIL',
      details: passed5
        ? `HTTP ${res5.status} returned, AI evaluation call count remained ${qualityAiCallCount}.`
        : `Failed: HTTP ${res5.status}, AI calls: ${qualityAiCallCount}, response: ${JSON.stringify(data5)}`,
    });

    // -------------------------------------------------------------------------
    // TEST 6: quality-assessment/generate authenticated unauthorized role -> 403, AI call count 0
    // -------------------------------------------------------------------------
    const res6 = await fetch(`${baseUrl}/social-enhancement/quality-assessment/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${unauthorizedToken}`,
      },
      body: JSON.stringify({
        questionId: mockQuestion.id,
        enhancementPackage: { hooks: [] },
      }),
    });
    const data6 = await res6.json();
    const passed6 = res6.status === 403 && qualityAiCallCount === 0;
    results.push({
      testId: 6,
      name: 'quality-assessment/generate authenticated unauthorized role rejected with 403, AI evaluation not executed',
      status: passed6 ? 'PASS' : 'FAIL',
      details: passed6
        ? `HTTP ${res6.status} returned, error: "${data6.error}", AI call count remained ${qualityAiCallCount}.`
        : `Failed: HTTP ${res6.status}, AI calls: ${qualityAiCallCount}, response: ${JSON.stringify(data6)}`,
    });

    // -------------------------------------------------------------------------
    // TEST 7: quality-assessment/generate authenticated authorized role -> 200, AI executes
    // -------------------------------------------------------------------------
    const preCallCount7 = qualityAiCallCount;
    const res7 = await fetch(`${baseUrl}/social-enhancement/quality-assessment/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${editorRoleToken}`,
      },
      body: JSON.stringify({
        questionId: mockQuestion.id,
        enhancementPackage: { hooks: [] },
      }),
    });
    const data7 = await res7.json();
    const passed7 = res7.status === 200 && data7.success === true && qualityAiCallCount === preCallCount7 + 1;
    results.push({
      testId: 7,
      name: 'quality-assessment/generate authenticated authorized role succeeds with 200, AI evaluation executed',
      status: passed7 ? 'PASS' : 'FAIL',
      details: passed7
        ? `HTTP 200 returned, overallScore=${data7.data?.overallScore}, AI calls incremented to ${qualityAiCallCount}.`
        : `Failed: HTTP ${res7.status}, AI calls: ${qualityAiCallCount}, response: ${JSON.stringify(data7)}`,
    });

    // -------------------------------------------------------------------------
    // TEST 8: No accidental AI execution on rejected requests
    // -------------------------------------------------------------------------
    // In tests 1, 2, 5, 6, all requests were rejected (401 / 403).
    // Total successful executions across the test run should be strictly 1 for hooks (test 3)
    // and strictly 1 for quality assessment (test 7).
    const passed8 = hookAiCallCount === 1 && qualityAiCallCount === 1;
    results.push({
      testId: 8,
      name: 'No accidental AI execution on rejected requests: zero calls on unauthenticated/unauthorized paths',
      status: passed8 ? 'PASS' : 'FAIL',
      details: passed8
        ? `Verified: exactly 1 legitimate hook call and 1 legitimate quality call executed across all tests. Zero AI calls on 401/403 rejections.`
        : `Failed: hookAiCallCount=${hookAiCallCount} (expected 1), qualityAiCallCount=${qualityAiCallCount} (expected 1).`,
    });
  } finally {
    // Restore repository / service methods
    questionsRepository.findById = origFindById;
    questionService.getQuestionById = origGetQuestionById;
    SocialEnhancementService.generateSocialEnhancementDraft = origGenerateDraft;
    SocialEnhancementService.assessQuality = origAssessQuality;

    // Close server
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  // Print Summary
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
  console.log(`RESULT: ${passed ? 'ALL PHASE 17.1 SECURITY CHECKS PASSED' : 'VERIFICATION FAILED'}`);
  console.log('===============================================================\n');

  return {
    passed,
    totalChecks,
    passedChecks,
    failedChecks,
    results,
  };
}

const isDirectRun = process.argv[1] && (
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
  import.meta.url.endsWith('phase17-step1-social-enhancement-auth-security.ts')
);

if (isDirectRun) {
  runPhase17Step1SocialEnhancementAuthSecurityVerification()
    .then((res) => {
      process.exit(res.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
