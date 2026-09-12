/**
 * BURRA PARIKSHA CMS - Phase 9 Content Workflow Verification Test Suite
 * 
 * Verifies the core cross-domain workflow foundation, hard safety gates (Gates A-F),
 * canonical aggregate state calculations, edit invalidations, and security enforcement.
 */

import { questionsRepository } from '../lib/repositories/questions.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { assignmentsRepository } from '../lib/repositories/assignments.repository';
import { usersRepository } from '../lib/repositories/users.repository';
import { assignmentService } from '../lib/services/assignment.service';
import { objectAuthService } from '../lib/services/object-auth.service';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { AssignmentStatus } from '../types';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { workflowOrchestrationService, CanonicalWorkflowState } from '../lib/services/workflow-orchestration.service';
import { QuestionStatus, QuestionValidationStatus, VideoProductionStatus, SocialReviewStatus, UserRole, QuestionLanguage, PriorityLevel } from '../types';
import { ActorContext } from '../lib/services/object-auth.service';
import { questionService } from '../lib/services/question.service';
import { SocialReviewService } from '../lib/services/social-review.service';
import { publishingService } from '../lib/services/publishing.service';
import { ScriptService } from '../lib/services/script.service';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { thumbnailService } from '../lib/services/thumbnail.service';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { workflowRepository } from '../lib/repositories/workflow.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { SocialPublishStatus } from '../types';
import { GeminiService } from '../lib/ai/gemini.service';

import { googleSheetsClient } from '../lib/google-sheets/client';

export interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED';
  error?: string;
}

export async function runPhase9WorkflowVerification(): Promise<{
  success: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
}> {
  const origIsConfigured = googleSheetsClient.isConfigured.bind(googleSheetsClient);
  googleSheetsClient.isConfigured = () => false;

  const geminiInstance = GeminiService.getInstance();
  const origGenerateHooks = geminiInstance.generateSocialHooksAndStrategy.bind(geminiInstance);
  geminiInstance.generateSocialHooksAndStrategy = async (question: any, styles: any, lang: any) => {
    const fallback = (geminiInstance as any).createFallbackSocialHooksAndStrategy(question, styles, lang);
    return {
      ...fallback,
      metadata: {
        modelUsed: 'mock-fallback',
        generationDurationMs: 1,
        isMockFallback: true,
        aiCallsCount: 0,
      },
    };
  };

  const results: TestResult[] = [];
  const testActors = {
    admin: { id: 'ADM-001', role: UserRole.ADMIN, name: 'Admin User' },
    contentManager: { id: 'CM-001', role: UserRole.CONTENT_MANAGER, name: 'Manager User' },
    questionEditor: { id: 'QE-001', role: UserRole.QUESTION_EDITOR, name: 'Question Editor' },
    unauthorizedUser: { id: 'GUEST-001', role: UserRole.SPEAKER, name: 'Unauthorized Guest' },
  };

  const runTest = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results.push({ name, status: 'PASSED' });
    } catch (err: any) {
      results.push({ name, status: 'FAILED', error: err?.message || String(err) });
    }
  };

  const createTestQuestionPayload = (overrides: Record<string, any> = {}) => {
    return {
      questionText: 'What is the speed of light in vacuum?',
      options: {
        a: '300,000 km/s',
        b: '150,000 km/s',
        c: '1,000 km/s',
        d: '30,000 km/s',
      },
      optionA: '300,000 km/s',
      optionB: '150,000 km/s',
      optionC: '1,000 km/s',
      optionD: '30,000 km/s',
      correctAnswer: 'A',
      explanation: 'Speed of light in vacuum is approx 300,000 km/s.',
      language: 'ENGLISH',
      difficulty: 'EASY',
      categoryId: 'CAT-TEST',
      categoryName: 'Science',
      topicId: 'TOP-TEST',
      topicName: 'Physics',
      subtopicId: 'SUB-TEST',
      subtopicName: 'Optics',
      status: QuestionStatus.GENERATED,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      validationStatus: QuestionValidationStatus.VALID,
      validationScore: 95,
      authorId: testActors.questionEditor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  };

  // --------------------------------------------------------------------------
  // TEST 1: Valid Question Approval
  // --------------------------------------------------------------------------
  await runTest('1. Valid Question Approval (Validation == VALID)', async () => {
    const qId = `Q-P9-TEST-1-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        authorId: testActors.questionEditor.id,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    const updated = await workflowOrchestrationService.validateQuestionTransition(
      testActors.admin,
      qId,
      QuestionStatus.APPROVED,
      'Valid approval'
    );

    if (updated.status !== QuestionStatus.APPROVED) {
      throw new Error(`Expected Question status APPROVED, got ${updated.status}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 2: Invalid Question Approval Blocked (Gate A)
  // --------------------------------------------------------------------------
  await runTest('2. Invalid Question Approval Blocked (Gate A)', async () => {
    const qId = `Q-P9-TEST-2-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.DRAFT,
        validationStatus: QuestionValidationStatus.NOT_VALIDATED,
        validationScore: 0,
        authorId: testActors.admin.id,
      }),
    } as any);

    let thrown = false;
    try {
      await workflowOrchestrationService.validateQuestionTransition(
        testActors.admin,
        qId,
        QuestionStatus.APPROVED
      );
    } catch (err: any) {
      thrown = true;
      if (!err.message.includes('validation status must be "VALID"')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }

    if (!thrown) {
      throw new Error('Approval of NOT_VALIDATED question should have thrown an error.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 3: Invalid Transition Path Blocked
  // --------------------------------------------------------------------------
  await runTest('3. Invalid Transition Path Blocked', async () => {
    const qId = `Q-P9-TEST-3-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.REJECTED,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.admin.id,
      }),
    } as any);

    let thrown = false;
    try {
      await questionService.updateStatus(qId, QuestionStatus.APPROVED, testActors.admin);
    } catch {
      thrown = true;
    }

    if (!thrown) {
      throw new Error('Direct transition REJECTED -> APPROVED should be blocked.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 4: Unauthorized Role Blocked
  // --------------------------------------------------------------------------
  await runTest('4. Unauthorized Role Blocked', async () => {
    const qId = `Q-P9-TEST-4-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.DRAFT,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.admin.id,
      }),
    } as any);

    let thrown = false;
    try {
      await workflowOrchestrationService.validateQuestionTransition(
        testActors.unauthorizedUser,
        qId,
        QuestionStatus.APPROVED
      );
    } catch {
      thrown = true;
    }

    if (!thrown) {
      throw new Error('Unauthorized role should be blocked from question transition.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 5: Object Authorization Enforced
  // --------------------------------------------------------------------------
  await runTest('5. Object Authorization Enforced', async () => {
    const qId = `Q-P9-TEST-5-${Date.now()}`;
    const otherEditor: ActorContext = { id: 'QE-999', role: UserRole.QUESTION_EDITOR, name: 'Other Editor' };

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.GENERATED,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.questionEditor.id, // Authored by QE-001, NOT QE-999
      }),
    } as any);

    let thrown = false;
    try {
      await workflowOrchestrationService.validateQuestionTransition(
        otherEditor,
        qId,
        QuestionStatus.APPROVED
      );
    } catch (err: any) {
      thrown = true;
      if (!err.message.includes('Forbidden')) {
        throw new Error(`Expected forbidden error, got: ${err.message}`);
      }
    }

    if (!thrown) {
      throw new Error('Editor without author/assignment should be blocked by object auth.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 6: Video Queue Prerequisite (Gate B)
  // --------------------------------------------------------------------------
  await runTest('6. Video Queue Prerequisite (Gate B)', async () => {
    const qId = `Q-P9-TEST-6-${Date.now()}`;
    const vId = `BP-V-P9-TEST-6-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.DRAFT,
        validationStatus: QuestionValidationStatus.NOT_VALIDATED,
        authorId: testActors.admin.id,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Video Title Test',
      status: VideoProductionStatus.NOT_STARTED,
      assignedEditor: testActors.admin.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    let thrown = false;
    try {
      await workflowOrchestrationService.validateVideoTransition(
        testActors.admin,
        vId,
        VideoProductionStatus.QUEUED
      );
    } catch (err: any) {
      thrown = true;
      if (!err.message.includes('must be APPROVED')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }

    if (!thrown) {
      throw new Error('Queueing video for unapproved/unvalidated question should be blocked.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 7: Stale Social Review Approval Blocked (Gate C)
  // --------------------------------------------------------------------------
  await runTest('7. Stale Social Review Approval Blocked (Gate C)', async () => {
    const qId = `Q-P9-TEST-7-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.questionEditor.id,
      }),
    } as any);

    const fakeStaleHash = '0000000000000000000000000000000000000000000000000000000000000000';

    let thrown = false;
    try {
      await workflowOrchestrationService.validateSocialReviewTransition(
        testActors.admin,
        qId,
        SocialReviewStatus.APPROVED,
        fakeStaleHash
      );
    } catch (err: any) {
      thrown = true;
      if (!err.message.includes('Version hash mismatch')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }

    if (!thrown) {
      throw new Error('Social review submission with stale version hash should be blocked.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 8: Publishing with Stale / Unapproved Review Blocked (Gate D)
  // --------------------------------------------------------------------------
  await runTest('8. Publishing with Stale / Unapproved Review Blocked (Gate D)', async () => {
    const qId = `Q-P9-TEST-8-${Date.now()}`;
    const vId = `BP-V-P9-TEST-8-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.admin.id,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Publish Test Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 45,
      actualDurationSeconds: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    const readiness = await publishingService.validatePublishReadiness(vId);

    if (readiness.isReady) {
      throw new Error('Publishing should be blocked when Social Review is missing or unapproved.');
    }

    const hasReviewBlocker = readiness.blockers.some((b) => b.toLowerCase().includes('social review'));
    if (!hasReviewBlocker) {
      throw new Error(`Expected social review blocker, got: ${JSON.stringify(readiness.blockers)}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 9: Client State Injection Blocked via Material Edit Reset
  // --------------------------------------------------------------------------
  await runTest('9. Client State Injection Blocked via Material Edit Reset', async () => {
    const qId = `Q-P9-TEST-9-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        validationScore: 90,
        authorId: testActors.admin.id,
      }),
    } as any);

    const updated = await questionService.updateQuestion(
      qId,
      { questionText: 'Mutated question text materially modified by client.' },
      testActors.admin
    );

    if (updated.status === QuestionStatus.APPROVED) {
      throw new Error('Question should return to EDITING on material edit, but remained APPROVED.');
    }
    if (updated.validationStatus === QuestionValidationStatus.VALID) {
      throw new Error('Validation status should reset to NOT_VALIDATED on material edit.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 10: Archive Protection (Gate E)
  // --------------------------------------------------------------------------
  await runTest('10. Archive Protection (Gate E)', async () => {
    const cmId = `CM-P9-TEST-10-${Date.now()}`;
    const qId = `Q-P9-TEST-10-${Date.now()}`;
    const vId = `BP-V-P9-TEST-10-${Date.now()}`;

    await contentMastersRepository.appendRecord({
      id: cmId,
      title: 'Active Content Master',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    await questionsRepository.appendRecord({
      id: qId,
      contentMasterId: cmId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        videoStatus: VideoProductionStatus.RECORDING,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.admin.id,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Active Recording Video',
      status: VideoProductionStatus.RECORDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    let thrown = false;
    try {
      await workflowOrchestrationService.validateArchiveTransition(testActors.admin, cmId);
    } catch (err: any) {
      thrown = true;
      if (!err.message.includes('actively in production')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }

    if (!thrown) {
      throw new Error('Archiving ContentMaster with active video production should be blocked.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 11: Idempotent Transition
  // --------------------------------------------------------------------------
  await runTest('11. Idempotent Transition', async () => {
    const qId = `Q-P9-TEST-11-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.admin.id,
      }),
    } as any);

    const result = await workflowOrchestrationService.validateQuestionTransition(
      testActors.admin,
      qId,
      QuestionStatus.APPROVED
    );

    if (result.status !== QuestionStatus.APPROVED) {
      throw new Error('Idempotent call should return question with status APPROVED.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 12: Canonical State Calculation
  // --------------------------------------------------------------------------
  await runTest('12. Canonical State Calculation', async () => {
    const qId = `Q-P9-TEST-12-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.DRAFT,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.admin.id,
      }),
    } as any);

    const summary = await workflowOrchestrationService.getCanonicalWorkflowState(qId);

    if (summary.canonicalState !== CanonicalWorkflowState.VALIDATED) {
      throw new Error(`Expected canonical state VALIDATED, got ${summary.canonicalState}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 13: No Circular Dependency
  // --------------------------------------------------------------------------
  await runTest('13. No Circular Dependency Verification', async () => {
    const qId = `Q-P9-TEST-13-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.GENERATED,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.admin.id,
      }),
    } as any);

    // 1. Question can be APPROVED without social package
    const approvedQ = await workflowOrchestrationService.validateQuestionTransition(
      testActors.admin,
      qId,
      QuestionStatus.APPROVED
    );

    if (approvedQ.status !== QuestionStatus.APPROVED) {
      throw new Error('Question approval failed.');
    }

    // 2. Canonical state can be calculated smoothly
    const stateSummary = await workflowOrchestrationService.getCanonicalWorkflowState(qId);
    if (stateSummary.canonicalState !== CanonicalWorkflowState.APPROVED) {
      throw new Error(`Expected APPROVED canonical state, got ${stateSummary.canonicalState}`);
    }
  });

  // ==========================================================================
  // PHASE 9 STEP 2: EDIT INVALIDATION & DOWNSTREAM STALENESS TESTS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // TEST 14: Question text edit invalidates validation
  // --------------------------------------------------------------------------
  await runTest('14. Step 2 - Question text edit invalidates validation', async () => {
    const qId = `Q-P9-STEP2-14-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        validationScore: 95,
        authorId: testActors.admin.id,
      }),
    } as any);

    const updated = await questionService.updateQuestion(
      qId,
      { questionText: 'What is the exact speed of light in a vacuum in km/s?' },
      testActors.admin
    );

    if (updated.validationStatus !== QuestionValidationStatus.NOT_VALIDATED) {
      throw new Error(`Expected NOT_VALIDATED, got ${updated.validationStatus}`);
    }
    if (updated.validationScore !== 0) {
      throw new Error(`Expected validationScore 0, got ${updated.validationScore}`);
    }
    if (updated.status !== QuestionStatus.EDITING) {
      throw new Error(`Expected status EDITING, got ${updated.status}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 15: Options edit invalidates validation
  // --------------------------------------------------------------------------
  await runTest('15. Step 2 - Options edit invalidates validation', async () => {
    const qId = `Q-P9-STEP2-15-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        validationScore: 90,
        authorId: testActors.admin.id,
      }),
    } as any);

    const updated = await questionService.updateQuestion(
      qId,
      {
        options: {
          a: '299,792 km/s',
          b: '150,000 km/s',
          c: '1,000 km/s',
          d: '30,000 km/s',
        },
      },
      testActors.admin
    );

    if (updated.validationStatus !== QuestionValidationStatus.NOT_VALIDATED) {
      throw new Error(`Expected NOT_VALIDATED, got ${updated.validationStatus}`);
    }
    if (updated.status !== QuestionStatus.EDITING) {
      throw new Error(`Expected status EDITING, got ${updated.status}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 16: Correct-answer edit invalidates validation
  // --------------------------------------------------------------------------
  await runTest('16. Step 2 - Correct-answer edit invalidates validation', async () => {
    const qId = `Q-P9-STEP2-16-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        validationScore: 88,
        authorId: testActors.admin.id,
      }),
    } as any);

    const updated = await questionService.updateQuestion(
      qId,
      { correctAnswer: 'B' },
      testActors.admin
    );

    if (updated.validationStatus !== QuestionValidationStatus.NOT_VALIDATED) {
      throw new Error(`Expected NOT_VALIDATED, got ${updated.validationStatus}`);
    }
    if (updated.status !== QuestionStatus.EDITING) {
      throw new Error(`Expected status EDITING, got ${updated.status}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 17: Explanation edit invalidates validation
  // --------------------------------------------------------------------------
  await runTest('17. Step 2 - Explanation edit invalidates validation', async () => {
    const qId = `Q-P9-STEP2-17-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        validationScore: 92,
        authorId: testActors.admin.id,
      }),
    } as any);

    const updated = await questionService.updateQuestion(
      qId,
      { explanation: 'Updated comprehensive physical explanation.' },
      testActors.admin
    );

    if (updated.validationStatus !== QuestionValidationStatus.NOT_VALIDATED) {
      throw new Error(`Expected NOT_VALIDATED, got ${updated.validationStatus}`);
    }
    if (updated.status !== QuestionStatus.EDITING) {
      throw new Error(`Expected status EDITING, got ${updated.status}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 18: Material question edit makes old social review stale
  // --------------------------------------------------------------------------
  await runTest('18. Step 2 - Material question edit makes old social review stale', async () => {
    const qId = `Q-P9-STEP2-18-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.admin.id,
      }),
    } as any);

    const initialBundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: initialBundle.currentVersionHash,
        reason: 'Initial approval',
      },
      testActors.admin
    );

    const approvedBundle = await SocialReviewService.getReviewPackageBundle(qId);
    if (approvedBundle.currentReviewStatus !== SocialReviewStatus.APPROVED) {
      throw new Error(`Expected initial social review APPROVED, got ${approvedBundle.currentReviewStatus}`);
    }

    // Material edit
    await questionService.updateQuestion(
      qId,
      { questionText: 'Completely altered material text for stale test' },
      testActors.admin
    );

    const staleBundle = await SocialReviewService.getReviewPackageBundle(qId);
    if (staleBundle.currentReviewStatus !== SocialReviewStatus.STALE_REVISION_REQUIRED) {
      throw new Error(`Expected review status STALE_REVISION_REQUIRED, got ${staleBundle.currentReviewStatus}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 19: Stale review blocks publishing
  // --------------------------------------------------------------------------
  await runTest('19. Step 2 - Stale review blocks publishing', async () => {
    const qId = `Q-P9-STEP2-19-${Date.now()}`;
    const vId = `BP-V-STEP2-19-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.admin.id,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Stale Review Video Test',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Test pinned comment',
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    // Initial approval
    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
        reason: 'Pre-edit approval',
      },
      testActors.admin
    );

    // Material edit
    await questionService.updateQuestion(
      qId,
      { questionText: 'Mutated question text to test publishing blocker' },
      testActors.admin
    );

    const readiness = await publishingService.validatePublishReadiness(vId);
    if (readiness.isReady) {
      throw new Error('Expected publishing readiness to be blocked, but it passed.');
    }
    const hasBlocker = readiness.blockers.some(
      (b) => b.includes('validation status') || b.includes('STALE') || b.includes('APPROVED')
    );
    if (!hasBlocker) {
      throw new Error(`Expected stale review / validation blocker, got: ${readiness.blockers.join('; ')}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 20: Material script edit cannot preserve stale approval
  // --------------------------------------------------------------------------
  await runTest('20. Step 2 - Material script edit cannot preserve stale approval', async () => {
    const qId = `Q-P9-STEP2-20-${Date.now()}`;
    const vId = `BP-V-STEP2-20-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.admin.id,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Script Edit Video Test',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Test pinned comment',
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    // Initial script save & social review approval
    await ScriptService.getInstance().saveScript(
      vId,
      {
        hookText: 'Initial Hook Text',
        problemStatement: 'Initial Problem',
        stepByStepSolution: 'Initial Solution',
        speedTrickOrTakeaway: 'Initial Trick',
        callToAction: 'Initial CTA',
      },
      testActors.admin
    );

    const initialBundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: initialBundle.currentVersionHash,
        reason: 'Approved with initial script',
      },
      testActors.admin
    );

    // Edit script
    await ScriptService.getInstance().saveScript(
      vId,
      {
        hookText: 'Altered Hook Text',
        problemStatement: 'Altered Problem',
        stepByStepSolution: 'Altered Solution',
        speedTrickOrTakeaway: 'Altered Trick',
        callToAction: 'Altered CTA',
        createNewVersion: true,
      },
      testActors.admin
    );

    const readiness = await publishingService.validatePublishReadiness(vId);
    if (readiness.isReady) {
      throw new Error('Expected publishing readiness to be blocked after script edit, but passed.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 21: Generic client status injection cannot bypass invalidation
  // --------------------------------------------------------------------------
  await runTest('21. Step 2 - Generic client status injection cannot bypass invalidation', async () => {
    const qId = `Q-P9-STEP2-21-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        validationScore: 95,
        authorId: testActors.admin.id,
      }),
    } as any);

    // Client passes status: APPROVED and validationStatus: VALID alongside material edit
    const updated = await questionService.updateQuestion(
      qId,
      {
        questionText: 'Injecting material edit with fake approval parameters',
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        validationScore: 100,
      } as any,
      testActors.admin
    );

    if (updated.validationStatus !== QuestionValidationStatus.NOT_VALIDATED) {
      throw new Error(`Expected validationStatus NOT_VALIDATED, got ${updated.validationStatus}`);
    }
    if (updated.validationScore !== 0) {
      throw new Error(`Expected validationScore 0, got ${updated.validationScore}`);
    }
    if (updated.status !== QuestionStatus.EDITING) {
      throw new Error(`Expected status EDITING, got ${updated.status}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 22: Non-material update does not unnecessarily invalidate unrelated workflow state
  // --------------------------------------------------------------------------
  await runTest('22. Step 2 - Non-material update does not unnecessarily invalidate unrelated state', async () => {
    const qId = `Q-P9-STEP2-22-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        validationScore: 98,
        authorId: testActors.admin.id,
      }),
    } as any);

    const updated = await questionService.updateQuestion(
      qId,
      { tags: ['physics', 'science', 'constants'] },
      testActors.admin
    );

    if (updated.validationStatus !== QuestionValidationStatus.VALID) {
      throw new Error(`Expected validationStatus VALID, got ${updated.validationStatus}`);
    }
    if (updated.validationScore !== 98) {
      throw new Error(`Expected validationScore 98, got ${updated.validationScore}`);
    }
    if (updated.status !== QuestionStatus.APPROVED) {
      throw new Error(`Expected status APPROVED, got ${updated.status}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 23: Repeated invalidation is idempotent
  // --------------------------------------------------------------------------
  await runTest('23. Step 2 - Repeated invalidation is idempotent', async () => {
    const qId = `Q-P9-STEP2-23-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
        authorId: testActors.admin.id,
      }),
    } as any);

    // First material edit
    await questionService.updateQuestion(
      qId,
      { questionText: 'First material edit' },
      testActors.admin
    );

    // Second material edit
    const updated2 = await questionService.updateQuestion(
      qId,
      { questionText: 'Second material edit' },
      testActors.admin
    );

    if (updated2.validationStatus !== QuestionValidationStatus.NOT_VALIDATED) {
      throw new Error(`Expected NOT_VALIDATED on second edit, got ${updated2.validationStatus}`);
    }
    if (updated2.status !== QuestionStatus.EDITING) {
      throw new Error(`Expected EDITING on second edit, got ${updated2.status}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 24: canonical DRAFT state
  // --------------------------------------------------------------------------
  await runTest('24. canonical DRAFT state', async () => {
    const qId = `Q-P9-STEP3-24-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.DRAFT,
        validationStatus: QuestionValidationStatus.NOT_VALIDATED,
      }),
    } as any);

    const summary = await workflowOrchestrationService.getCanonicalWorkflowState(qId);
    if (summary.canonicalState !== CanonicalWorkflowState.DRAFT) {
      throw new Error(`Expected DRAFT canonical state, got ${summary.canonicalState}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 25: canonical READY_FOR_REVIEW state
  // --------------------------------------------------------------------------
  await runTest('25. canonical READY_FOR_REVIEW state', async () => {
    const qId = `Q-P9-STEP3-25-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.DRAFT,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    // Seed social review record with PENDING_REVIEW
    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.PENDING_REVIEW,
        versionHash: bundle.currentVersionHash,
        reason: 'Ready',
      } as any,
      testActors.admin
    );

    const summary = await workflowOrchestrationService.getCanonicalWorkflowState(qId);
    if (summary.canonicalState !== CanonicalWorkflowState.READY_FOR_REVIEW) {
      throw new Error(`Expected READY_FOR_REVIEW, got ${summary.canonicalState}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 26: canonical CHANGES_REQUESTED state
  // --------------------------------------------------------------------------
  await runTest('26. canonical CHANGES_REQUESTED state', async () => {
    const qId = `Q-P9-STEP3-26-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.DRAFT,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.CHANGES_REQUESTED,
        versionHash: bundle.currentVersionHash,
        reason: 'Typo in caption',
      } as any,
      testActors.admin
    );

    const summary = await workflowOrchestrationService.getCanonicalWorkflowState(qId);
    if (summary.canonicalState !== CanonicalWorkflowState.CHANGES_REQUESTED) {
      throw new Error(`Expected CHANGES_REQUESTED, got ${summary.canonicalState}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 27: canonical APPROVED state
  // --------------------------------------------------------------------------
  await runTest('27. canonical APPROVED state', async () => {
    const qId = `Q-P9-STEP3-27-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
        reason: 'Looks great',
      } as any,
      testActors.admin
    );

    const summary = await workflowOrchestrationService.getCanonicalWorkflowState(qId);
    if (summary.canonicalState !== CanonicalWorkflowState.APPROVED) {
      throw new Error(`Expected APPROVED, got ${summary.canonicalState}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 28: canonical SCHEDULED state
  // --------------------------------------------------------------------------
  await runTest('28. canonical SCHEDULED state', async () => {
    const qId = `Q-P9-STEP3-28-${Date.now()}`;
    const vId = `V-P9-STEP3-28-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Valid Test Video Title 28',
      status: VideoProductionStatus.READY_TO_UPLOAD,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Nice trick',
      isApproved: true,
    } as any);

    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    // Transition to scheduled via service
    await workflowOrchestrationService.transitionToCanonicalState(
      testActors.admin,
      qId,
      CanonicalWorkflowState.SCHEDULED,
      'Scheduling'
    );

    const summary = await workflowOrchestrationService.getCanonicalWorkflowState(qId);
    if (summary.canonicalState !== CanonicalWorkflowState.SCHEDULED) {
      throw new Error(`Expected SCHEDULED canonical state, got ${summary.canonicalState}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 29: canonical PUBLISHED state
  // --------------------------------------------------------------------------
  await runTest('29. canonical PUBLISHED state', async () => {
    const qId = `Q-P9-STEP3-29-${Date.now()}`;
    const vId = `V-P9-STEP3-29-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Valid Test Video Title 29',
      status: VideoProductionStatus.READY_TO_UPLOAD,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Awesome short',
      isApproved: true,
    } as any);

    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    await workflowOrchestrationService.transitionToCanonicalState(
      testActors.admin,
      qId,
      CanonicalWorkflowState.PUBLISHED,
      'Published now!',
      { platform: 'youtube', postUrl: 'https://youtube.com/watch?v=BP-V29' }
    );

    const summary = await workflowOrchestrationService.getCanonicalWorkflowState(qId);
    if (summary.canonicalState !== CanonicalWorkflowState.PUBLISHED) {
      throw new Error(`Expected PUBLISHED canonical state, got ${summary.canonicalState}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 30: canonical ARCHIVED state
  // --------------------------------------------------------------------------
  await runTest('30. canonical ARCHIVED state', async () => {
    const cmId = `CM-P9-STEP3-30-${Date.now()}`;
    const qId = `Q-P9-STEP3-30-${Date.now()}`;
    await contentMastersRepository.appendRecord({
      id: cmId,
      status: 'ARCHIVED',
    } as any);

    await questionsRepository.appendRecord({
      id: qId,
      contentMasterId: cmId,
      ...createTestQuestionPayload(),
    } as any);

    const summary = await workflowOrchestrationService.getCanonicalWorkflowState(qId);
    if (summary.canonicalState !== CanonicalWorkflowState.ARCHIVED) {
      throw new Error(`Expected ARCHIVED canonical state, got ${summary.canonicalState}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 31: invalid canonical transition blocked
  // --------------------------------------------------------------------------
  await runTest('31. invalid canonical transition blocked', async () => {
    const qId = `Q-P9-STEP3-31-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.DRAFT,
        validationStatus: QuestionValidationStatus.NOT_VALIDATED,
      }),
    } as any);

    let thrown = false;
    try {
      await workflowOrchestrationService.transitionToCanonicalState(
        testActors.questionEditor,
        qId,
        CanonicalWorkflowState.APPROVED,
        'Trying to skip review steps'
      );
    } catch (err: any) {
      thrown = true;
      if (!err.message.includes('Invalid transition')) {
        throw new Error(`Unexpected error message: ${err.message}`);
      }
    }

    if (!thrown) {
      throw new Error('Expected invalid transition from DRAFT to APPROVED to be blocked.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 32: APPROVED blocked by stale review
  // --------------------------------------------------------------------------
  await runTest('32. APPROVED blocked by stale review', async () => {
    const qId = `Q-P9-STEP3-32-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.DRAFT,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    // Initial draft review approved
    const initialBundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: initialBundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    // Update question materially to make review stale
    await questionService.updateQuestion(
      qId,
      { questionText: 'Completely different question text now' },
      testActors.admin
    );

    // Trying to transition to APPROVED state with the old/stale versionHash must fail
    let thrown = false;
    try {
      await workflowOrchestrationService.transitionToCanonicalState(
        testActors.admin,
        qId,
        CanonicalWorkflowState.APPROVED,
        'Approve with stale hash',
        { versionHash: initialBundle.currentVersionHash }
      );
    } catch (err: any) {
      thrown = true;
    }

    if (!thrown) {
      throw new Error('Transition to APPROVED should have been blocked by the stale review hash.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 33: SCHEDULED blocked when publishing readiness fails
  // --------------------------------------------------------------------------
  await runTest('33. SCHEDULED blocked when publishing readiness fails', async () => {
    const qId = `Q-P9-STEP3-33-${Date.now()}`;
    const vId = `V-P9-STEP3-33-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      status: VideoProductionStatus.READY_TO_UPLOAD,
    } as any);

    // Do NOT create thumbnail and pinned comment approved records (readiness fails)
    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    let thrown = false;
    try {
      await workflowOrchestrationService.transitionToCanonicalState(
        testActors.admin,
        qId,
        CanonicalWorkflowState.SCHEDULED,
        'Should fail due to missing thumbnails'
      );
    } catch (err: any) {
      thrown = true;
    }

    if (!thrown) {
      throw new Error('Expected SCHEDULED transition to fail when publishing readiness fails.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 34: PUBLISHED blocked without successful publication
  // --------------------------------------------------------------------------
  await runTest('34. PUBLISHED blocked without successful publication', async () => {
    const qId = `Q-P9-STEP3-34-${Date.now()}`;
    const vId = `V-P9-STEP3-34-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      status: VideoProductionStatus.RECORDING, // Not ready
    } as any);

    let thrown = false;
    try {
      await workflowOrchestrationService.transitionToCanonicalState(
        testActors.admin,
        qId,
        CanonicalWorkflowState.PUBLISHED,
        'Direct publish'
      );
    } catch (err: any) {
      thrown = true;
    }

    if (!thrown) {
      throw new Error('Expected PUBLISHED transition to be blocked if video is not ready for publish.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 35: unauthorized canonical transition blocked
  // --------------------------------------------------------------------------
  await runTest('35. unauthorized canonical transition blocked', async () => {
    const qId = `Q-P9-STEP3-35-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.DRAFT,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    let thrown = false;
    try {
      // Guest actor trying to approve
      await workflowOrchestrationService.transitionToCanonicalState(
        testActors.unauthorizedUser,
        qId,
        CanonicalWorkflowState.APPROVED,
        'Hack approve'
      );
    } catch (err: any) {
      thrown = true;
    }

    if (!thrown) {
      throw new Error('Unauthorized role must be blocked from transition.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 36: repeated canonical transition is idempotent
  // --------------------------------------------------------------------------
  await runTest('36. repeated canonical transition is idempotent', async () => {
    const qId = `Q-P9-STEP3-36-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    // Transition to APPROVED
    const summary1 = await workflowOrchestrationService.transitionToCanonicalState(
      testActors.admin,
      qId,
      CanonicalWorkflowState.APPROVED,
      'First approve'
    );

    // Repeated transition
    const summary2 = await workflowOrchestrationService.transitionToCanonicalState(
      testActors.admin,
      qId,
      CanonicalWorkflowState.APPROVED,
      'Duplicate approve'
    );

    if (summary1.canonicalState !== summary2.canonicalState) {
      throw new Error('Expected idempotent state results to be identical.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 37: no circular dependency between question approval and social review
  // --------------------------------------------------------------------------
  await runTest('37. no circular dependency between question approval and social review', async () => {
    const qId = `Q-P9-STEP3-37-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED, // Approved on question side
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    // Assert question status remains APPROVED despite review status
    const question = await questionsRepository.findById(qId);
    if (question?.status !== QuestionStatus.APPROVED) {
      throw new Error('QuestionStatus must not depend on SocialReviewStatus.');
    }
  });

  // ==========================================================================
  // PHASE 9 STEP 4: PUBLISHING READINESS & SCHEDULING INTEGRITY TESTS (38-52)
  // ==========================================================================

  // --------------------------------------------------------------------------
  // TEST 38: Publishing readiness accepts a fully valid package.
  // --------------------------------------------------------------------------
  await runTest('38. Publishing readiness accepts a fully valid package.', async () => {
    const qId = `Q-P9-STEP4-38-${Date.now()}`;
    const vId = `V-P9-STEP4-38-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Valid Package Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    // Approve social review
    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    const check = await publishingService.validatePublishReadiness(vId);
    if (!check.isReady) {
      throw new Error(`Expected publishing readiness to be true, got false with blockers: ${check.blockers.join(', ')}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 39: Publishing readiness rejects invalid Question.
  // --------------------------------------------------------------------------
  await runTest('39. Publishing readiness rejects invalid Question.', async () => {
    const qId = `Q-P9-STEP4-39-${Date.now()}`;
    const vId = `V-P9-STEP4-39-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.NOT_VALIDATED,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Invalid Question Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    const check = await publishingService.validatePublishReadiness(vId);
    if (check.isReady) {
      throw new Error('Expected publishing readiness to be false for NOT_VALIDATED question.');
    }
    const hasBlocker = check.blockers.some(b => b.includes('validation status'));
    if (!hasBlocker) {
      throw new Error(`Expected validation status blocker, got: ${check.blockers.join(', ')}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 40: Publishing readiness rejects unapproved Question.
  // --------------------------------------------------------------------------
  await runTest('40. Publishing readiness rejects unapproved Question.', async () => {
    const qId = `Q-P9-STEP4-40-${Date.now()}`;
    const vId = `V-P9-STEP4-40-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.DRAFT,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Draft Question Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    const check = await publishingService.validatePublishReadiness(vId);
    if (check.isReady) {
      throw new Error('Expected publishing readiness to be false for unapproved question.');
    }
    const hasBlocker = check.blockers.some(b => b.includes('must be APPROVED'));
    if (!hasBlocker) {
      throw new Error(`Expected must be APPROVED blocker, got: ${check.blockers.join(', ')}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 41: Publishing readiness rejects stale Social Review.
  // --------------------------------------------------------------------------
  await runTest('41. Publishing readiness rejects stale Social Review.', async () => {
    const qId = `Q-P9-STEP4-41-${Date.now()}`;
    const vId = `V-P9-STEP4-41-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Stale Review Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    // Initial approval
    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    // Modify question text to invalidate version hash
    const question = await questionsRepository.findById(qId);
    await questionsRepository.updateRecord(qId, {
      ...question,
      questionText: 'Changed Question Text 41',
    });

    const check = await publishingService.validatePublishReadiness(vId);
    if (check.isReady) {
      throw new Error('Expected publishing readiness to be false for stale review.');
    }
    const hasBlocker = check.blockers.some(b => b.includes('STALE'));
    if (!hasBlocker) {
      throw new Error(`Expected STALE review blocker, got: ${check.blockers.join(', ')}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 42: Publishing readiness rejects unapproved Thumbnail.
  // --------------------------------------------------------------------------
  await runTest('42. Publishing readiness rejects unapproved Thumbnail.', async () => {
    const qId = `Q-P9-STEP4-42-${Date.now()}`;
    const vId = `V-P9-STEP4-42-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Unapproved Thumbnail Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'DRAFT', // Not approved
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    // Approve social review
    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    const check = await publishingService.validatePublishReadiness(vId);
    if (check.isReady) {
      throw new Error('Expected publishing readiness to be false for unapproved thumbnail.');
    }
    const hasBlocker = check.blockers.some(b => b.includes('Thumbnail'));
    if (!hasBlocker) {
      throw new Error(`Expected thumbnail blocker, got: ${check.blockers.join(', ')}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 43: Publishing readiness rejects unapproved Pinned Comment.
  // --------------------------------------------------------------------------
  await runTest('43. Publishing readiness rejects unapproved Pinned Comment.', async () => {
    const qId = `Q-P9-STEP4-43-${Date.now()}`;
    const vId = `V-P9-STEP4-43-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Unapproved Comment Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: false, // Not approved
    } as any);

    // Approve social review
    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    const check = await publishingService.validatePublishReadiness(vId);
    if (check.isReady) {
      throw new Error('Expected publishing readiness to be false for unapproved pinned comment.');
    }
    const hasBlocker = check.blockers.some(b => b.includes('Pinned comment'));
    if (!hasBlocker) {
      throw new Error(`Expected pinned comment blocker, got: ${check.blockers.join(', ')}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 44: Publishing readiness rejects invalid invariance.
  // --------------------------------------------------------------------------
  await runTest('44. Publishing readiness rejects invalid invariance.', async () => {
    const qId = `Q-P9-STEP4-44-${Date.now()}`;
    const vId = `V-P9-STEP4-44-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Factual Invariance Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    // Approve social review so the package exists
    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    // Mock SocialReviewService.getReviewPackageBundle to return an invariance blocker
    const originalGetBundle = SocialReviewService.getReviewPackageBundle.bind(SocialReviewService);
    SocialReviewService.getReviewPackageBundle = async (id, questionObj) => {
      const b = await originalGetBundle(id, questionObj);
      return {
        ...b,
        blockers: [...b.blockers, 'Factual invariance check failed between source question and social presentation.'],
      };
    };

    try {
      const check = await publishingService.validatePublishReadiness(vId);
      if (check.isReady) {
        throw new Error('Expected publishing readiness to be false when factual invariance fails.');
      }
      const hasBlocker = check.blockers.some(b => b.includes('Factual invariance'));
      if (!hasBlocker) {
        throw new Error(`Expected factual invariance blocker, got: ${check.blockers.join(', ')}`);
      }
    } finally {
      SocialReviewService.getReviewPackageBundle = originalGetBundle;
    }
  });

  // --------------------------------------------------------------------------
  // TEST 45: Scheduling rejects stale content.
  // --------------------------------------------------------------------------
  await runTest('45. Scheduling rejects stale content.', async () => {
    const qId = `Q-P9-STEP4-45-${Date.now()}`;
    const vId = `V-P9-STEP4-45-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Stale Scheduling Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    // Modify question text to invalidate version hash
    const question = await questionsRepository.findById(qId);
    await questionsRepository.updateRecord(qId, {
      ...question,
      questionText: 'Changed Question Text 45',
    });

    let thrown = false;
    try {
      await workflowOrchestrationService.transitionToCanonicalState(
        testActors.admin,
        qId,
        CanonicalWorkflowState.SCHEDULED
      );
    } catch (err: any) {
      thrown = true;
      if (!err.message.includes('STALE') && !err.message.includes('readiness')) {
        throw new Error(`Unexpected error message during scheduling stale content: ${err.message}`);
      }
    }

    if (!thrown) {
      throw new Error('Expected scheduling of stale content to fail.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 46: Scheduling rejects unauthorized actor.
  // --------------------------------------------------------------------------
  await runTest('46. Scheduling rejects unauthorized actor.', async () => {
    const qId = `Q-P9-STEP4-46-${Date.now()}`;
    const vId = `V-P9-STEP4-46-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Unauthorized Scheduling Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    // Approve social review so the canonical state becomes APPROVED
    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    let thrown = false;
    try {
      await workflowOrchestrationService.transitionToCanonicalState(
        testActors.unauthorizedUser as any,
        qId,
        CanonicalWorkflowState.SCHEDULED
      );
    } catch (err: any) {
      thrown = true;
      if (!err.message.includes('authorized') && !err.message.includes('role') && !err.message.includes('Forbidden')) {
        throw new Error(`Unexpected unauthorized error message: ${err.message}`);
      }
    }

    if (!thrown) {
      throw new Error('Expected unauthorized actor scheduling to be blocked.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 47: Scheduling is idempotent.
  // --------------------------------------------------------------------------
  await runTest('47. Scheduling is idempotent.', async () => {
    const qId = `Q-P9-STEP4-47-${Date.now()}`;
    const vId = `V-P9-STEP4-47-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Idempotent Scheduling Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    // Perform scheduling transition
    const summary1 = await workflowOrchestrationService.transitionToCanonicalState(
      testActors.admin,
      qId,
      CanonicalWorkflowState.SCHEDULED,
      'First Schedule'
    );

    // Call scheduling transition again (idempotent)
    const summary2 = await workflowOrchestrationService.transitionToCanonicalState(
      testActors.admin,
      qId,
      CanonicalWorkflowState.SCHEDULED,
      'Duplicate Schedule'
    );

    if (summary1.canonicalState !== CanonicalWorkflowState.SCHEDULED || summary2.canonicalState !== CanonicalWorkflowState.SCHEDULED) {
      throw new Error('Expected states to be SCHEDULED.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 48: Publishing completion rejects stale version.
  // --------------------------------------------------------------------------
  await runTest('48. Publishing completion rejects stale version.', async () => {
    const qId = `Q-P9-STEP4-48-${Date.now()}`;
    const vId = `V-P9-STEP4-48-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Stale Publish Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    // Transition to SCHEDULED
    await workflowOrchestrationService.transitionToCanonicalState(
      testActors.admin,
      qId,
      CanonicalWorkflowState.SCHEDULED
    );

    // Now edit the question content to render the version hash stale
    const question = await questionsRepository.findById(qId);
    await questionsRepository.updateRecord(qId, {
      ...question,
      questionText: 'Changed Question Text 48',
    });

    let thrown = false;
    try {
      await publishingService.markPlatformPublished(
        vId,
        'youtube',
        'https://youtube.com/shorts/test48',
        testActors.admin
      );
    } catch (err: any) {
      thrown = true;
      if (!err.message.includes('STALE') && !err.message.includes('readiness')) {
        throw new Error(`Unexpected error message during stale platform publication: ${err.message}`);
      }
    }

    if (!thrown) {
      throw new Error('Expected platform publication to be rejected due to stale version hash.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 49: Publishing completion requires successful upload state.
  // --------------------------------------------------------------------------
  await runTest('49. Publishing completion requires successful upload state.', async () => {
    const qId = `Q-P9-STEP4-49-${Date.now()}`;
    const vId = `V-P9-STEP4-49-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Not Ready Video',
      status: VideoProductionStatus.NOT_STARTED, // NOT ready to upload
      targetDurationSeconds: 30,
      actualDurationSeconds: 0,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    let thrown = false;
    try {
      await publishingService.markPlatformPublished(
        vId,
        'youtube',
        'https://youtube.com/shorts/test49',
        testActors.admin
      );
    } catch (err: any) {
      thrown = true;
      if (!err.message.includes('READY_TO_UPLOAD') && !err.message.includes('readiness')) {
        throw new Error(`Unexpected video upload status error: ${err.message}`);
      }
    }

    if (!thrown) {
      throw new Error('Expected publishing completion to fail for non-uploadable video.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 50: Failed publishing remains retryable.
  // --------------------------------------------------------------------------
  await runTest('50. Failed publishing remains retryable.', async () => {
    const qId = `Q-P9-STEP4-50-${Date.now()}`;
    const vId = `V-P9-STEP4-50-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Failed/Retry Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    // Mark platform failed
    await publishingService.markPlatformFailed(vId, 'youtube', 'API timeout error', testActors.admin);

    const record1 = await publishingService.getPublishingByVideoId(vId);
    if (record1?.youtube?.status !== SocialPublishStatus.FAILED) {
      throw new Error(`Expected youtube status to be FAILED, got ${record1?.youtube?.status}`);
    }

    // Retry publishing successfully
    await publishingService.markPlatformPublished(
      vId,
      'youtube',
      'https://youtube.com/shorts/retry50',
      testActors.admin
    );

    const record2 = await publishingService.getPublishingByVideoId(vId);
    if (record2?.youtube?.status !== SocialPublishStatus.PUBLISHED) {
      throw new Error(`Expected youtube status to be PUBLISHED after retry, got ${record2?.youtube?.status}`);
    }
  });

  // --------------------------------------------------------------------------
  // TEST 51: Client cannot inject SCHEDULED/PUBLISHED state.
  // --------------------------------------------------------------------------
  await runTest('51. Client cannot inject SCHEDULED/PUBLISHED state.', async () => {
    const qId = `Q-P9-STEP4-51-${Date.now()}`;
    const vId = `V-P9-STEP4-51-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Injection Protection Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    // Attempt direct state update via updatePublishingRecord (simulating generic route PUT)
    const pub = await publishingService.getPublishingByVideoId(vId);
    if (!pub) {
      throw new Error('Publishing record should exist.');
    }

    let thrown = false;
    try {
      await publishingService.updatePublishingRecord(pub.id, {
        youtube: { status: SocialPublishStatus.PUBLISHED } as any,
      }, testActors.admin);
    } catch (err: any) {
      thrown = true;
      if (!err.message.includes('prohibited') && !err.message.includes('Prohibited') && !err.message.includes('transition')) {
        throw new Error(`Unexpected injection protection error: ${err.message}`);
      }
    }

    if (!thrown) {
      throw new Error('Expected direct injection of PUBLISHED status to be blocked.');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 52: Publishing transition records audit/workflow information.
  // --------------------------------------------------------------------------
  await runTest('52. Publishing transition records audit/workflow information.', async () => {
    const qId = `Q-P9-STEP4-52-${Date.now()}`;
    const vId = `V-P9-STEP4-52-${Date.now()}`;

    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      }),
    } as any);

    await videosRepository.appendRecord({
      id: vId,
      questionId: qId,
      title: 'Audit Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      targetDurationSeconds: 30,
      actualDurationSeconds: 28,
    } as any);

    await thumbnailsRepository.appendRecord({
      id: `THM-${vId}`,
      videoId: vId,
      status: 'APPROVED',
    } as any);

    await pinnedCommentsRepository.appendRecord({
      id: `PIN-${vId}`,
      videoId: vId,
      commentText: 'Valid comment',
      isApproved: true,
    } as any);

    const bundle = await SocialReviewService.getReviewPackageBundle(qId);
    await SocialReviewService.submitReviewDecision(
      qId,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle.currentVersionHash,
      } as any,
      testActors.admin
    );

    // Transition to SCHEDULED
    await workflowOrchestrationService.transitionToCanonicalState(
      testActors.admin,
      qId,
      CanonicalWorkflowState.SCHEDULED,
      'Audit Trail Verification'
    );

    const pub = await publishingService.getPublishingByVideoId(vId);
    if (!pub) {
      throw new Error('Publishing record not found.');
    }

    // Inspect workflows
    const workflows = await workflowRepository.findByEntity('QUESTION', qId);
    if (workflows.length === 0) {
      throw new Error('Expected workflow history entry for scheduling.');
    }

    // Inspect audit logs
    const audits = await auditLogRepository.findByEntity('QUESTION', qId);
    if (audits.length === 0) {
      throw new Error('Expected audit log entry for scheduling.');
    }
  });

  // --------------------------------------------------------------------------
  // TESTS 53-62: ASSIGNMENT & WORKFLOW COORDINATION (Phase 9 Step 5)
  // --------------------------------------------------------------------------

  await runTest('53. Authorized assignment creation', async () => {
    // Ensure test actors exist in USERS repository
    const usersToSeed = [testActors.admin, testActors.contentManager, testActors.questionEditor, testActors.unauthorizedUser];
    for (const actor of usersToSeed) {
      const u = await usersRepository.findById(actor.id);
      if (!u) {
        await usersRepository.appendRecord({
          id: actor.id,
          name: actor.name,
          email: `${actor.id.toLowerCase()}@test.com`,
          role: actor.role as any,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const qId = `Q-P9-ASN-53-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload(),
      language: QuestionLanguage.ENGLISH,
      correctAnswer: 'A' as any,
    });

    const asn = await assignmentService.createAssignment({
      entityType: 'QUESTION',
      entityId: qId,
      assigneeId: testActors.questionEditor.id,
      taskType: 'QUESTION_REVIEW',
      priority: PriorityLevel.NORMAL,
    }, testActors.admin);

    if (!asn || asn.status !== AssignmentStatus.ASSIGNED) {
      throw new Error('Expected assignment to be created with status ASSIGNED.');
    }
  });

  await runTest('54. Unauthorized assignment creation blocked', async () => {
    const qId = `Q-P9-ASN-54-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload(),
      language: QuestionLanguage.ENGLISH,
      correctAnswer: 'A' as any,
    });

    try {
      await assignmentService.createAssignment({
        entityType: 'QUESTION',
        entityId: qId,
        assigneeId: testActors.questionEditor.id,
        taskType: 'QUESTION_REVIEW',
        priority: PriorityLevel.NORMAL,
      }, testActors.unauthorizedUser);
      throw new Error('Expected unauthorized assignment creation to fail.');
    } catch (err: any) {
      if (err.message.includes('Expected unauthorized assignment creation to fail')) {
        throw err;
      }
      // Passed: creation was blocked
    }
  });

  await runTest('55. Object-level assignment authorization', async () => {
    const qId = `Q-P9-ASN-55-${Date.now()}`;
    const question = await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload({ authorId: 'OTHER-AUTHOR' }), // ensure not author
      language: QuestionLanguage.ENGLISH,
      correctAnswer: 'A' as any,
    });

    const asn = await assignmentService.createAssignment({
      entityType: 'QUESTION',
      entityId: qId,
      assigneeId: testActors.questionEditor.id,
      taskType: 'QUESTION_REVIEW',
      priority: PriorityLevel.NORMAL,
    }, testActors.admin);

    const hasAccess = await objectAuthService.canAccessQuestion(
      { id: testActors.questionEditor.id, role: UserRole.QUESTION_EDITOR, name: testActors.questionEditor.name },
      question
    );

    if (!hasAccess) {
      throw new Error('Expected assignee to have object-level access to the assigned question.');
    }

    const guestAccess = await objectAuthService.canAccessQuestion(
      { id: testActors.unauthorizedUser.id, role: UserRole.SPEAKER, name: testActors.unauthorizedUser.name },
      question
    );

    if (guestAccess) {
      throw new Error('Expected guest/unrelated user to not have access to the assigned question.');
    }
  });

  await runTest('56. ASSIGNED -> IN_PROGRESS valid transition', async () => {
    const qId = `Q-P9-ASN-56-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload(),
      language: QuestionLanguage.ENGLISH,
      correctAnswer: 'A' as any,
    });

    const asn = await assignmentService.createAssignment({
      entityType: 'QUESTION',
      entityId: qId,
      assigneeId: testActors.questionEditor.id,
      taskType: 'QUESTION_REVIEW',
      priority: PriorityLevel.NORMAL,
    }, testActors.admin);

    const started = await assignmentService.startAssignment(asn.id, {
      id: testActors.questionEditor.id,
      name: testActors.questionEditor.name,
      role: UserRole.QUESTION_EDITOR,
    });

    if (started.status !== AssignmentStatus.IN_PROGRESS) {
      throw new Error(`Expected assignment status to be IN_PROGRESS, got: ${started.status}`);
    }
  });

  await runTest('57. IN_PROGRESS -> COMPLETED valid transition', async () => {
    const qId = `Q-P9-ASN-57-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload(),
      language: QuestionLanguage.ENGLISH,
      correctAnswer: 'A' as any,
    });

    const asn = await assignmentService.createAssignment({
      entityType: 'QUESTION',
      entityId: qId,
      assigneeId: testActors.questionEditor.id,
      taskType: 'QUESTION_REVIEW',
      priority: PriorityLevel.NORMAL,
    }, testActors.admin);

    await assignmentService.startAssignment(asn.id, {
      id: testActors.questionEditor.id,
      name: testActors.questionEditor.name,
      role: UserRole.QUESTION_EDITOR,
    });

    const completed = await assignmentService.completeAssignment(asn.id, {}, {
      id: testActors.questionEditor.id,
      name: testActors.questionEditor.name,
      role: UserRole.QUESTION_EDITOR,
    });

    if (completed.status !== AssignmentStatus.COMPLETED) {
      throw new Error(`Expected status COMPLETED, got: ${completed.status}`);
    }
  });

  await runTest('58. BLOCKED assignment cannot advance workflow', async () => {
    const vId = `V-P9-ASN-58-${Date.now()}`;
    await videosRepository.appendRecord({
      id: vId,
      questionId: 'SOME-Q',
      title: 'Blocked Test Video',
      status: VideoProductionStatus.SCRIPT_REQUIRED,
      priority: PriorityLevel.NORMAL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const asn = await assignmentService.createAssignment({
      entityType: 'VIDEO',
      entityId: vId,
      assigneeId: testActors.questionEditor.id,
      taskType: 'SCRIPT',
      priority: PriorityLevel.NORMAL,
    }, testActors.admin);

    await assignmentService.startAssignment(asn.id, {
      id: testActors.questionEditor.id,
      role: UserRole.QUESTION_EDITOR,
    });

    const blocked = await assignmentService.blockAssignment(asn.id, 'Waiting for raw assets', {
      id: testActors.questionEditor.id,
      role: UserRole.QUESTION_EDITOR,
    });

    if (blocked.status !== AssignmentStatus.BLOCKED) {
      throw new Error('Expected assignment to be BLOCKED.');
    }

    const currentVideo = await videosRepository.findById(vId);
    if (currentVideo?.status !== VideoProductionStatus.SCRIPT_REQUIRED) {
      throw new Error('Expected video production status to remain SCRIPT_REQUIRED.');
    }
  });

  await runTest('59. CANCELLED assignment cannot advance workflow', async () => {
    const vId = `V-P9-ASN-59-${Date.now()}`;
    await videosRepository.appendRecord({
      id: vId,
      questionId: 'SOME-Q',
      title: 'Cancelled Test Video',
      status: VideoProductionStatus.SCRIPT_REQUIRED,
      priority: PriorityLevel.NORMAL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const asn = await assignmentService.createAssignment({
      entityType: 'VIDEO',
      entityId: vId,
      assigneeId: testActors.questionEditor.id,
      taskType: 'SCRIPT',
      priority: PriorityLevel.NORMAL,
    }, testActors.admin);

    const cancelled = await assignmentService.cancelAssignment(asn.id, { reason: 'No longer needed' }, testActors.admin);

    if (cancelled.status !== AssignmentStatus.CANCELLED) {
      throw new Error('Expected assignment to be CANCELLED.');
    }

    const currentVideo = await videosRepository.findById(vId);
    if (currentVideo?.status !== VideoProductionStatus.SCRIPT_REQUIRED) {
      throw new Error('Expected video production status to remain SCRIPT_REQUIRED.');
    }
  });

  await runTest('60. Duplicate active assignment handled safely', async () => {
    const qId = `Q-P9-ASN-60-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload(),
      language: QuestionLanguage.ENGLISH,
      correctAnswer: 'A' as any,
    });

    await assignmentService.createAssignment({
      entityType: 'QUESTION',
      entityId: qId,
      assigneeId: testActors.questionEditor.id,
      taskType: 'QUESTION_REVIEW',
      priority: PriorityLevel.NORMAL,
    }, testActors.admin);

    try {
      await assignmentService.createAssignment({
        entityType: 'QUESTION',
        entityId: qId,
        assigneeId: testActors.questionEditor.id,
        taskType: 'QUESTION_REVIEW',
        priority: PriorityLevel.NORMAL,
      }, testActors.admin);
      throw new Error('Expected duplicate active assignment to be rejected.');
    } catch (err: any) {
      if (err.message.includes('Expected duplicate active assignment to be rejected')) {
        throw err;
      }
      // Passed
    }
  });

  await runTest('61. Repeated completion is idempotent', async () => {
    const qId = `Q-P9-ASN-61-${Date.now()}`;
    await questionsRepository.appendRecord({
      id: qId,
      ...createTestQuestionPayload(),
      language: QuestionLanguage.ENGLISH,
      correctAnswer: 'A' as any,
    });

    const asn = await assignmentService.createAssignment({
      entityType: 'QUESTION',
      entityId: qId,
      assigneeId: testActors.questionEditor.id,
      taskType: 'QUESTION_REVIEW',
      priority: PriorityLevel.NORMAL,
    }, testActors.admin);

    await assignmentService.startAssignment(asn.id, {
      id: testActors.questionEditor.id,
      role: UserRole.QUESTION_EDITOR,
    });

    const completed1 = await assignmentService.completeAssignment(asn.id, {}, {
      id: testActors.questionEditor.id,
      role: UserRole.QUESTION_EDITOR,
    });

    const completed2 = await assignmentService.completeAssignment(asn.id, {}, {
      id: testActors.questionEditor.id,
      role: UserRole.QUESTION_EDITOR,
    });

    if (completed1.status !== AssignmentStatus.COMPLETED || completed2.status !== AssignmentStatus.COMPLETED) {
      throw new Error('Expected both outcomes to be COMPLETED.');
    }
  });

  await runTest('62. Assignment/workflow transition does not create circular dependency', async () => {
    const vId = `V-P9-ASN-62-${Date.now()}`;
    await videosRepository.appendRecord({
      id: vId,
      questionId: 'SOME-Q',
      title: 'Circular Dependency Test Video',
      status: VideoProductionStatus.SCRIPT_REQUIRED,
      priority: PriorityLevel.NORMAL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create a complete script record
    const sId = `S-P9-ASN-62-${Date.now()}`;
    await scriptsRepository.appendRecord({
      id: sId,
      videoId: vId,
      questionId: 'SOME-Q',
      hookText: 'Perfect speed hook!',
      problemStatement: 'Optics speed mismatch',
      stepByStepSolution: 'Simple explanation speed',
      speedTrickOrTakeaway: 'Focus on index calculation',
      callToAction: 'Subscribe for more speed runs',
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const asn = await assignmentService.createAssignment({
      entityType: 'SCRIPT',
      entityId: sId,
      assigneeId: testActors.questionEditor.id,
      taskType: 'SCRIPT',
      priority: PriorityLevel.NORMAL,
    }, testActors.admin);

    await assignmentService.startAssignment(asn.id, {
      id: testActors.questionEditor.id,
      role: UserRole.QUESTION_EDITOR,
    });

    const completed = await assignmentService.completeAssignment(asn.id, {}, {
      id: testActors.questionEditor.id,
      role: UserRole.QUESTION_EDITOR,
    });

    if (completed.status !== AssignmentStatus.COMPLETED) {
      throw new Error('Expected script assignment to be completed.');
    }

    const finalVideo = await videosRepository.findById(vId);
    if (finalVideo?.status !== VideoProductionStatus.SCRIPT_READY) {
      throw new Error(`Expected video status to advance to SCRIPT_READY, got: ${finalVideo?.status}`);
    }
  });

  await runTest('63. Thumbnail Binary Upload & Drive Metadata', async () => {
    const videoId = `V-P9-T-${Date.now()}`;
    const contentId = `BP-CNT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Seed parent video record
    await videosRepository.appendRecord({
      id: videoId,
      contentId,
      contentMasterId: contentId,
      questionId: 'Q-P9-T-1',
      title: 'Drive Metadata Test Video',
      status: VideoProductionStatus.EDITED,
      priority: PriorityLevel.NORMAL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const mockBuffer = Buffer.from('fake-image-binary-bytes');
    
    // First upload
    const result1 = await thumbnailService.uploadThumbnailAsset({
      videoId,
      fileName: 'cool_thumbnail_v1.png',
      mimeType: 'image/png',
      fileStreamOrBuffer: mockBuffer,
      size: mockBuffer.length,
      designerNotes: 'Initial design mock',
      actor: { id: 'ADM-001', name: 'Test Admin', role: UserRole.ADMIN },
    });

    if (!result1.thumbnail || !result1.version) {
      throw new Error('Expected both thumbnail and version to be returned on upload.');
    }

    if (result1.thumbnail.currentVersion !== 1) {
      throw new Error(`Expected currentVersion to be 1, got ${result1.thumbnail.currentVersion}`);
    }

    if (result1.thumbnail.status !== 'DESIGNED') {
      throw new Error(`Expected status to be DESIGNED, got ${result1.thumbnail.status}`);
    }

    // Verify Drive metadata is present on Thumbnail
    if (!result1.thumbnail.driveFileId) {
      throw new Error('Expected driveFileId to be present on Thumbnail.');
    }
    if (result1.thumbnail.fileName !== 'cool_thumbnail_v1.png') {
      throw new Error(`Expected fileName to be cool_thumbnail_v1.png, got ${result1.thumbnail.fileName}`);
    }
    if (result1.thumbnail.fileSize !== mockBuffer.length) {
      throw new Error(`Expected fileSize to be ${mockBuffer.length}, got ${result1.thumbnail.fileSize}`);
    }

    // Verify versioning
    if (result1.version.versionNumber !== 1) {
      throw new Error(`Expected versionNumber 1, got ${result1.version.versionNumber}`);
    }
    if (result1.version.driveFileId !== result1.thumbnail.driveFileId) {
      throw new Error('Expected version driveFileId to match thumbnail.');
    }

    // Second upload (revision)
    const result2 = await thumbnailService.uploadThumbnailAsset({
      videoId,
      fileName: 'cool_thumbnail_v2.png',
      mimeType: 'image/png',
      fileStreamOrBuffer: mockBuffer,
      size: mockBuffer.length,
      designerNotes: 'Revised design mock with fixed typography',
      actor: { id: 'ADM-001', name: 'Test Admin', role: UserRole.ADMIN },
    });

    if (result2.thumbnail.currentVersion !== 2) {
      throw new Error(`Expected currentVersion to increment to 2, got ${result2.thumbnail.currentVersion}`);
    }
    if (result2.version.versionNumber !== 2) {
      throw new Error(`Expected version number 2, got ${result2.version.versionNumber}`);
    }
    if (result2.thumbnail.fileName !== 'cool_thumbnail_v2.png') {
      throw new Error(`Expected updated fileName cool_thumbnail_v2.png, got ${result2.thumbnail.fileName}`);
    }
  });

  await runTest('64. Thumbnail Upload RBAC Authorization', async () => {
    const videoId = `V-P9-T-RBAC-${Date.now()}`;
    const contentId = `BP-CNT-RBAC-${Math.floor(100000 + Math.random() * 900000)}`;

    await videosRepository.appendRecord({
      id: videoId,
      contentId,
      contentMasterId: contentId,
      questionId: 'Q-P9-T-2',
      title: 'RBAC Test Video',
      status: VideoProductionStatus.EDITED,
      priority: PriorityLevel.NORMAL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const mockBuffer = Buffer.from('fake-image-binary-bytes');

    // 1. Test active production role: THUMBNAIL_DESIGNER (Should succeed)
    const resultThmDesigner = await thumbnailService.uploadThumbnailAsset({
      videoId,
      fileName: 'designer_mock.png',
      mimeType: 'image/png',
      fileStreamOrBuffer: mockBuffer,
      size: mockBuffer.length,
      designerNotes: 'Thumbnail Designer upload',
      actor: { id: 'DES-001', name: 'Test Thumbnail Designer', role: UserRole.THUMBNAIL_DESIGNER },
    });

    if (!resultThmDesigner.thumbnail) {
      throw new Error('Expected THUMBNAIL_DESIGNER to succeed in uploading thumbnail.');
    }

    // 2. Test legacy role: DESIGNER (Should fail / be rejected)
    try {
      await thumbnailService.uploadThumbnailAsset({
        videoId,
        fileName: 'legacy_mock.png',
        mimeType: 'image/png',
        fileStreamOrBuffer: mockBuffer,
        size: mockBuffer.length,
        actor: { id: 'DES-002', name: 'Legacy Designer', role: UserRole.DESIGNER },
      });
      throw new Error('Expected legacy DESIGNER role to be rejected from active thumbnail operations.');
    } catch (err: any) {
      if (!err.message.includes('Unauthorized') && !err.message.includes('not allowed to modify')) {
        throw new Error(`Expected Unauthorized error for legacy DESIGNER, got: ${err.message}`);
      }
    }

    // 3. Test active production role: VIDEO_EDITOR (Should succeed)
    const resultVideoEditor = await thumbnailService.uploadThumbnailAsset({
      videoId,
      fileName: 'video_editor_mock.png',
      mimeType: 'image/png',
      fileStreamOrBuffer: mockBuffer,
      size: mockBuffer.length,
      designerNotes: 'Video editor upload',
      actor: { id: 'EDT-001', name: 'Test Video Editor', role: UserRole.VIDEO_EDITOR },
    });

    if (!resultVideoEditor.thumbnail) {
      throw new Error('Expected VIDEO_EDITOR to succeed in uploading thumbnail.');
    }

    // 4. Test unauthorized role: SPEAKER (Should fail)
    try {
      await thumbnailService.uploadThumbnailAsset({
        videoId,
        fileName: 'speaker_mock.png',
        mimeType: 'image/png',
        fileStreamOrBuffer: mockBuffer,
        size: mockBuffer.length,
        actor: { id: 'SPK-001', name: 'Test Speaker', role: UserRole.SPEAKER },
      });
      throw new Error('Expected SPEAKER upload to be rejected with unauthorized role error.');
    } catch (err: any) {
      if (!err.message.includes('Unauthorized') && !err.message.includes('not allowed to modify')) {
        throw new Error(`Expected Unauthorized error for SPEAKER, got: ${err.message}`);
      }
    }
  });

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.status === 'PASSED').length;
  const failedTests = totalTests - passedTests;

  googleSheetsClient.isConfigured = origIsConfigured;
  geminiInstance.generateSocialHooksAndStrategy = origGenerateHooks;

  return {
    success: failedTests === 0,
    totalTests,
    passedTests,
    failedTests,
    results,
  };
}
