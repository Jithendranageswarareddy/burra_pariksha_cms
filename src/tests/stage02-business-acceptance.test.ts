/**
 * BURRA PARIKSHA CMS — Stage 02 Business Acceptance Criteria Automated Test Suite
 *
 * STRUCTURE:
 * PART A: CONTRACT & UNIT SPECIFICATION TESTS
 * PART B: REAL PRODUCTION-PATH ACCEPTANCE ENFORCEMENT TESTS
 *
 * Authoritative production paths verified in Part B:
 * - NEG-01: questionDraftService.approveDraft() Anti-Self-Approval constraint
 * - NEG-02: validateCanonicalWorkflowTransition() & contentWorkflowService.transitionWorkflowState()
 * - NEG-03: publishingService.validatePublishReadiness() & ProductionAssetValidationService
 * - NEG-04: questionService.updateStatus() real production idempotency
 * - NEG-05: BaseRepository & contentMastersRepository real optimistic concurrency control
 * - NEG-06: AI Orchestrator human-gated boundary (AI cannot mutate business state directly)
 * - NEG-07: validateMediaAssetMetadata() media storage guard
 * - NEG-08: requireAuth & requireRole server-side authorization middleware
 * - NEG-09: COST-001 frugal infrastructure boundary
 * - NEG-10: auditLogRepository & auditService authoritative audit trail
 */

import fs from 'fs';
import path from 'path';

// Force offline test mode for zero-network deterministic acceptance verification
process.env.SKIP_SHEETS_SYNC = 'true';
process.env.NODE_ENV = 'test';

import {
  CANONICAL_15_STEPS,
  validateCanonicalWorkflowTransition,
  CanonicalStageNumber,
} from '../lib/workflow/canonical-workflow';
import {
  validateMediaAssetMetadata,
  MediaAssetMetadataInput,
} from '../lib/workflow/media-storage-guard';
import {
  QuestionStatus,
  VideoProductionStatus,
  UserRole,
  ContentMasterStatus,
  ContentMaster,
  DifficultyLevel,
  QuestionLanguage,
} from '../types';
import { questionDraftService } from '../lib/services/question-draft.service';
import { questionService } from '../lib/services/question.service';
import { questionDraftsRepository } from '../lib/repositories/question-drafts.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { workflowRepository } from '../lib/repositories/workflow.repository';
import { publishingService } from '../lib/services/publishing.service';
import { contentWorkflowService } from '../lib/services/content-workflow.service';
import { auditService, workflowService } from '../lib/services/audit.service';
import { AIOrchestrator } from '../lib/ai/orchestrator';
import { requireRole, requireAuth } from '../server/middleware/auth.middleware';

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    throw new Error(`[STAGE 02 BUSINESS ACCEPTANCE VIOLATION] ${msg}`);
  }
}

// ============================================================================
// PART A: CONTRACT & UNIT SPECIFICATION TESTS (Pure in-memory checks)
// ============================================================================

interface UnitMockQuestionDraft {
  id: string;
  authorId: string;
  topicId: string;
  classLevel: string;
  subject: string;
  stemEnglish: string;
  stemTelugu: string;
  options: Array<{ id: string; textEnglish: string; textTelugu: string }>;
  correctKey: string;
  solutionProof: string;
  status: QuestionStatus;
  currentWorkflowStep: number;
}

interface UnitMockVerificationDecision {
  questionId: string;
  reviewerId: string;
  approved: boolean;
  checklistComplete: boolean;
}

function unitProcessQuestionDraftSubmission(draft: Partial<UnitMockQuestionDraft>): {
  success: boolean;
  error?: string;
  questionRecord?: UnitMockQuestionDraft;
} {
  if (!draft.stemEnglish || draft.stemEnglish.trim() === '') {
    return { success: false, error: 'English stem cannot be empty' };
  }
  if (!draft.options || draft.options.length !== 4) {
    return { success: false, error: 'Exactly 4 distinct options are required' };
  }
  if (!draft.correctKey || !['A', 'B', 'C', 'D'].includes(draft.correctKey)) {
    return { success: false, error: 'A single definitive correct key (A, B, C, or D) must be designated' };
  }
  if (!draft.solutionProof || draft.solutionProof.trim() === '') {
    return { success: false, error: 'Mathematical proof and solution explanation required' };
  }

  const record: UnitMockQuestionDraft = {
    id: draft.id || `BP-Q-DRAFT-${Date.now()}`,
    authorId: draft.authorId || 'author-default',
    topicId: draft.topicId || 'TOPIC-001',
    classLevel: draft.classLevel || 'Class 10',
    subject: draft.subject || 'Mathematics',
    stemEnglish: draft.stemEnglish,
    stemTelugu: draft.stemTelugu || draft.stemEnglish,
    options: draft.options,
    correctKey: draft.correctKey,
    solutionProof: draft.solutionProof,
    status: QuestionStatus.EDITING,
    currentWorkflowStep: 2,
  };

  return { success: true, questionRecord: record };
}

function unitVerifyQuestion(
  question: UnitMockQuestionDraft,
  decision: UnitMockVerificationDecision
): { allowed: boolean; error?: string; updatedStatus?: QuestionStatus } {
  if (question.authorId === decision.reviewerId) {
    return {
      allowed: false,
      error: 'Self-approval prohibited (NEG-01): The author cannot verify their own question in Step 02.',
    };
  }

  if (!decision.checklistComplete) {
    return {
      allowed: false,
      error: 'Checklist incomplete: All 10 pedagogical audit points must be certified.',
    };
  }

  return {
    allowed: true,
    updatedStatus: decision.approved ? QuestionStatus.APPROVED : QuestionStatus.REJECTED,
  };
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

export async function runStage02AcceptanceTests(): Promise<void> {
  console.log('============================================================');
  console.log('RUNNING STAGE 02 BUSINESS ACCEPTANCE CRITERIA VERIFICATION');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // PART A: CONTRACT / UNIT TESTS
  // --------------------------------------------------------------------------
  console.log('--- SECTION A: CONTRACT & UNIT SPECIFICATION TESTS ---');

  console.log('Unit Check 1: Question draft validation contract (AC2-011)...');
  const validDraftInput: Partial<UnitMockQuestionDraft> = {
    authorId: 'user-creator-101',
    stemEnglish: 'If 2x + 5 = 15, what is the value of x?',
    stemTelugu: '2x + 5 = 15 అయితే, x విలువ ఎంత?',
    options: [
      { id: 'A', textEnglish: '5', textTelugu: '5' },
      { id: 'B', textEnglish: '10', textTelugu: '10' },
      { id: 'C', textEnglish: '15', textTelugu: '15' },
      { id: 'D', textEnglish: '20', textTelugu: '20' },
    ],
    correctKey: 'A',
    solutionProof: '2x = 15 - 5 = 10; therefore x = 5.',
  };
  const unitValidRes = unitProcessQuestionDraftSubmission(validDraftInput);
  assert(unitValidRes.success, 'Valid draft contract must pass');
  assert(unitValidRes.questionRecord?.currentWorkflowStep === 2, 'Must route to Step 02');

  const unitInvalidOptions = unitProcessQuestionDraftSubmission({
    ...validDraftInput,
    options: [{ id: 'A', textEnglish: '5', textTelugu: '5' }],
  });
  assert(!unitInvalidOptions.success, 'Fewer than 4 options must fail contract');
  console.log('  -> PASS: Unit question draft validation contract verified.\n');

  console.log('Unit Check 2: Pure contract anti-self-approval rule (NEG-01)...');
  const unitSelfCheck = unitVerifyQuestion(unitValidRes.questionRecord!, {
    questionId: unitValidRes.questionRecord!.id,
    reviewerId: 'user-creator-101',
    approved: true,
    checklistComplete: true,
  });
  assert(!unitSelfCheck.allowed, 'Author cannot verify own question in contract');
  console.log('  -> PASS: Unit anti-self-approval contract verified.\n');

  // --------------------------------------------------------------------------
  // PART B: REAL PRODUCTION-PATH TESTS (AUTHORITATIVE ACCEPTANCE ENFORCEMENT)
  // --------------------------------------------------------------------------
  console.log('--- SECTION B: REAL PRODUCTION-PATH TESTS (AUTHORITATIVE) ---');

  // --------------------------------------------------------------------------
  // TEST 1: REAL PRODUCTION NEG-01 ANTI-SELF-APPROVAL ENFORCEMENT
  // Path: questionDraftService.saveDraft() -> approveDraft() -> questionsRepository
  // --------------------------------------------------------------------------
  console.log('Checking Production Path 1: Real NEG-01 Anti-Self-Approval Gate in questionDraftService...');
  const authorActor = { id: 'USR-AUTHOR-401', name: 'Kavitha Content Writer', role: UserRole.CONTENT_WRITER };
  const independentReviewerActor = { id: 'USR-REVIEWER-502', name: 'Dr. Prasad Academic Verifier', role: UserRole.REVIEWER };

  // 1. Create and persist a real draft with Author A
  const realDraft = await questionDraftService.saveDraft(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      categoryId: 'CAT-QA',
      difficulty: 'Intermediate',
      language: 'TELUGU',
      questionText: 'If 2x + 5 = 15, what is the value of x?',
      options: {
        a: '5',
        b: '10',
        c: '15',
        d: '20',
      },
      correctAnswer: 'A',
      explanation: '2x + 5 = 15 implies 2x = 10, so x = 5.',
      realLifeContext: 'Calculating trajectory intercept points.',
    },
    authorActor
  );

  assert(Boolean(realDraft && realDraft.id), 'Real draft must be created with persistent ID');
  assert(realDraft.authorId === authorActor.id, 'Draft authorId must match Author A');

  // 2. Attempt approval as Author A (Self-Approval Violation)
  let selfApprovalBlocked = false;
  let selfApprovalError: any = null;
  try {
    await questionDraftService.approveDraft(realDraft.id, authorActor, 'Author trying to approve own question');
  } catch (err: any) {
    selfApprovalBlocked = true;
    selfApprovalError = err;
  }

  // 3. Verify rejection
  assert(selfApprovalBlocked, 'Production questionDraftService.approveDraft MUST reject self-approval attempt (NEG-01)');
  assert(
    selfApprovalError?.code === 'NEG-01' ||
    selfApprovalError?.statusCode === 403 ||
    (selfApprovalError?.message && selfApprovalError.message.includes('NEG-01')),
    `Error must identify NEG-01 rejection: ${selfApprovalError?.message}`
  );

  // 4. Verify no production Question was created
  const questionsAfterBlocked = await questionsRepository.findAll();
  const leakedQuestion = questionsAfterBlocked.find((q) => q.questionText === realDraft.questionText);
  assert(!leakedQuestion, 'Blocked self-approval MUST NOT create a production Question record');

  // 5. Verify the draft still exists
  const draftAfterBlocked = await questionDraftsRepository.findById(realDraft.id);
  assert(Boolean(draftAfterBlocked), 'Draft MUST NOT be deleted after blocked self-approval attempt');

  // 6. Verify the draft was not mutated into an approved status
  assert(
    draftAfterBlocked?.status === QuestionStatus.DRAFT,
    'Draft status must remain DRAFT after blocked self-approval'
  );

  // 7. Approve the same draft as an authorized independent reviewer B
  const approvedQuestion = await questionDraftService.approveDraft(
    realDraft.id,
    independentReviewerActor,
    'Pedagogical verification certified by independent reviewer'
  );

  // 8. Verify successful production Question creation
  assert(Boolean(approvedQuestion && approvedQuestion.id), 'Independent reviewer approval must create production Question');
  assert(approvedQuestion.status === QuestionStatus.APPROVED, 'Created question must have APPROVED status');

  // 9. Verify draft was cleaned up after successful approval
  const draftAfterApproved = await questionDraftsRepository.findById(realDraft.id);
  assert(!draftAfterApproved, 'Materialized draft must be removed from draft repository upon successful approval');

  // 10. Verify audit ledger preserved the rejection event
  const auditLogs = await auditLogRepository.findAll();
  const selfApprovalRejectionAudit = auditLogs.find(
    (log) => log.action === 'QUESTION_DRAFT_APPROVAL_REJECTED' && log.entityId === realDraft.id
  );
  assert(Boolean(selfApprovalRejectionAudit), 'Authoritative audit ledger must contain QUESTION_DRAFT_APPROVAL_REJECTED event');

  console.log('  -> PASS: Real NEG-01 Anti-Self-Approval production path fully verified.\n');

  // --------------------------------------------------------------------------
  // TEST 2: REAL PRODUCTION NEG-02 WORKFLOW TRANSITION AUTHORITY
  // Path: validateCanonicalWorkflowTransition() & contentWorkflowService.transitionWorkflowState()
  // --------------------------------------------------------------------------
  console.log('Checking Production Path 2: Real NEG-02 Workflow Transition Enforcement...');

  // A. Canonical validator jump rejection
  const illegalJump01To06 = validateCanonicalWorkflowTransition({
    contentMasterId: 'BP-CNT-000001',
    currentStage: 1,
    targetStage: 6,
    actor: { id: 'user-editor-303', role: 'VIDEO_EDITOR' },
    prerequisitesMet: true,
  });
  assert(!illegalJump01To06.allowed, 'Direct jump from Step 01 to Step 06 must be blocked');
  assert(
    illegalJump01To06.error?.includes('Illegal workflow jump'),
    'Error must cite illegal workflow jump'
  );

  // B. Real Production Service Path: ContentWorkflowService state machine
  const testMasterId = `BP-CNT-${Date.now()}`;
  await contentMastersRepository.create({
    id: testMasterId,
    title: 'Stage 02 Workflow Transition Test',
    status: ContentMasterStatus.DRAFT,
    currentVersion: 1,
    creatorId: authorActor.id,
    creatorName: authorActor.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  // 1. Valid sequential transition: DRAFT -> READY_FOR_REVIEW
  const validTransitionResult = await contentWorkflowService.transitionWorkflowState({
    contentMasterId: testMasterId,
    targetStatus: ContentMasterStatus.READY_FOR_REVIEW,
    actor: authorActor,
    remarks: 'Submitting draft for peer review',
  });
  assert(
    validTransitionResult.status === ContentMasterStatus.READY_FOR_REVIEW,
    'Sequential transition DRAFT -> READY_FOR_REVIEW must succeed'
  );

  // 2. Illegal transition: Trying to bypass review directly to APPROVED without reviewer role
  let illegalTransitionBlocked = false;
  try {
    await contentWorkflowService.transitionWorkflowState({
      contentMasterId: testMasterId,
      targetStatus: ContentMasterStatus.APPROVED,
      actor: authorActor, // Writer cannot approve
      versionHashOrNumber: 1,
    });
  } catch (err: any) {
    illegalTransitionBlocked = true;
  }
  assert(illegalTransitionBlocked, 'Direct jump or unauthorized approval MUST be blocked in production workflow service');

  // Verify entity state remained untouched after illegal transition attempt
  const masterAfterIllegal = await contentMastersRepository.findById(testMasterId);
  assert(
    masterAfterIllegal?.status === ContentMasterStatus.READY_FOR_REVIEW,
    'Entity status must remain unchanged after rejected illegal transition'
  );

  console.log('  -> PASS: Real NEG-02 Workflow Transition enforcement verified.\n');

  // --------------------------------------------------------------------------
  // TEST 3: REAL PRODUCTION NEG-03 QC PUBLISHING GATE
  // Path: publishingService.validatePublishReadiness() -> ProductionAssetValidationService
  // --------------------------------------------------------------------------
  console.log('Checking Production Path 3: Real NEG-03 QC Publishing Gate in publishingService...');

  // Create real test video in database with INVALID render resolution (e.g. 1920x1080 horizontal instead of 9:16 vertical)
  const testVideoId = `BP-V-TEST-${Date.now()}`;
  await videosRepository.create({
    id: testVideoId,
    contentId: 'BP-CNT-999001',
    questionId: approvedQuestion.id,
    title: 'Algebra Quadratic Formula Short',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    driveFileId: '1AbCdEfGhIjKlMnOpQrStUvWxYz',
    finalRenderPath: '/renders/bad_cut.mp4',
    finalRenderWidth: 1920, // Invalid: Horizontal 16:9
    finalRenderHeight: 1080,
    finalRenderAspectRatio: '16:9', // Non-compliant short form
    finalRenderFormat: 'mp4',
    actualDurationSeconds: 45,
    targetDurationSeconds: 50,
  } as any);

  const invalidPublishReadiness = await publishingService.validatePublishReadiness(testVideoId, { skipAudit: true });
  assert(!invalidPublishReadiness.isReady, 'Publishing readiness must be FALSE when QC render validation fails (NEG-03)');
  assert(
    invalidPublishReadiness.blockers.some((b) => b.includes('QC Render Validation Failed') || b.includes('NEG-03') || b.includes('9:16')),
    `Blockers must identify QC render failure: ${invalidPublishReadiness.blockers.join(', ')}`
  );

  console.log('  -> PASS: Real NEG-03 QC Publishing Gate verified in publishingService.\n');

  // --------------------------------------------------------------------------
  // TEST 4: REAL PRODUCTION NEG-04 IDEMPOTENCY
  // Path: questionService.updateStatus() repeated identical mutation
  // --------------------------------------------------------------------------
  console.log('Checking Production Path 4: Real NEG-04 Idempotent State Transitions...');

  // First status transition
  const statusRes1 = await questionService.updateStatus(
    approvedQuestion.id,
    QuestionStatus.APPROVED,
    independentReviewerActor,
    'First status transition application'
  );
  assert(statusRes1.status === QuestionStatus.APPROVED, 'Initial transition must succeed');

  const auditCountBefore = (await auditLogRepository.findAll()).length;
  const workflowCountBefore = (await workflowRepository.findAll()).length;

  // Second identical transition request (Idempotent replay)
  const statusRes2 = await questionService.updateStatus(
    approvedQuestion.id,
    QuestionStatus.APPROVED,
    independentReviewerActor,
    'Identical status transition replay'
  );
  assert(statusRes2.status === QuestionStatus.APPROVED, 'Idempotent replay must return consistent APPROVED status');

  const auditCountAfter = (await auditLogRepository.findAll()).length;
  const workflowCountAfter = (await workflowRepository.findAll()).length;

  // Ensure no duplicate workflow transition records were created for the same logical operation
  assert(
    workflowCountAfter === workflowCountBefore,
    'Idempotent transition must NOT create duplicate workflow transition records'
  );
  assert(
    auditCountAfter === auditCountBefore,
    'Idempotent transition must NOT create duplicate audit logs'
  );

  console.log('  -> PASS: Real NEG-04 Idempotency verified in production path.\n');

  // --------------------------------------------------------------------------
  // TEST 5: REAL PRODUCTION NEG-05 OPTIMISTIC CONCURRENCY CONTROL
  // Path: BaseRepository.updateRecord / BaseRepository.update with version conflict
  // --------------------------------------------------------------------------
  console.log('Checking Production Path 5: Real NEG-05 Optimistic Concurrency Control...');

  const concurrencyMasterId = `BP-CNT-CONC-${Date.now()}`;
  await contentMastersRepository.create({
    id: concurrencyMasterId,
    title: 'Initial Version 1 Title',
    status: ContentMasterStatus.DRAFT,
    version: 1,
    currentVersion: 1,
    creatorId: authorActor.id,
    creatorName: authorActor.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  // Actor A reads version 1
  const actorARecord = await contentMastersRepository.findById(concurrencyMasterId);
  assert(Number((actorARecord as any)?.version ?? (actorARecord as any)?.currentVersion) === 1, 'Actor A reads version 1');

  // Actor B reads the same version 1
  const actorBRecord = await contentMastersRepository.findById(concurrencyMasterId);
  assert(Number((actorBRecord as any)?.version ?? (actorBRecord as any)?.currentVersion) === 1, 'Actor B reads version 1');

  // Actor A updates successfully from version 1 -> version 2
  const actorAUpdate = await contentMastersRepository.update(
    concurrencyMasterId,
    { title: 'Title Updated by Actor A', currentVersion: 2 } as any,
    { expectedVersion: 1 }
  );
  assert(actorAUpdate?.title === 'Title Updated by Actor A', 'Actor A update must succeed');
  assert(Number((actorAUpdate as any)?.version ?? (actorAUpdate as any)?.currentVersion) === 2, 'Version must increment to 2');

  // Actor B attempts update using stale expectedVersion 1
  let concurrencyConflictDetected = false;
  let conflictError: any = null;
  try {
    await contentMastersRepository.update(
      concurrencyMasterId,
      { title: 'Title Attempted by Actor B (Stale Update)' },
      { expectedVersion: 1 }
    );
  } catch (err: any) {
    concurrencyConflictDetected = true;
    conflictError = err;
  }

  assert(
    concurrencyConflictDetected,
    'Stale concurrent mutation using outdated version MUST be rejected (NEG-05)'
  );
  assert(
    conflictError?.message?.includes('NEG-05') || conflictError?.message?.includes('Concurrency conflict'),
    `Error must identify concurrency conflict: ${conflictError?.message}`
  );

  // Verify persisted state remains Actor A's state (No silent overwrite)
  const persistedRecord = await contentMastersRepository.findById(concurrencyMasterId);
  assert(
    persistedRecord?.title === 'Title Updated by Actor A',
    'Persisted database state MUST remain Actor A’s update (No silent overwrite)'
  );
  assert(
    Number((persistedRecord as any)?.version ?? (persistedRecord as any)?.currentVersion) === 2,
    'Persisted version must remain version 2'
  );

  console.log('  -> PASS: Real NEG-05 Optimistic Concurrency verified in production repository.\n');

  // --------------------------------------------------------------------------
  // TEST 6: REAL PRODUCTION NEG-06 AI HUMAN-GATE BOUNDARY
  // Path: AI generation services cannot silently approve or mutate business state
  // --------------------------------------------------------------------------
  console.log('Checking Production Path 6: Real NEG-06 AI Human-in-the-Loop Governance...');

  const aiOrchestrator = new AIOrchestrator();
  const questionsCountBeforeAI = (await questionsRepository.findAll()).length;

  // AI candidate generation produces candidate data payload
  const aiCandidateResult = await aiOrchestrator.generateQuestionCandidate({
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    categoryId: 'CAT-QA',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
    realWorldContext: 'TRAJECTORY_INTERCEPT',
  });

  assert(Boolean(aiCandidateResult.candidate), 'AI Orchestrator returned candidate payload');

  // Verify that AI generation alone does NOT create or materialize a question in the authoritative questions repository
  const questionsCountAfterAI = (await questionsRepository.findAll()).length;
  assert(
    questionsCountAfterAI === questionsCountBeforeAI,
    'AI candidate generation MUST NOT autonomously create records in questions repository'
  );

  // Saving AI candidate produces a DRAFT requiring human review, NOT an APPROVED question
  const rawQText = aiCandidateResult.candidate.content || (aiCandidateResult.candidate as any).questionText || 'A train traveling at 72 km/h crosses a 180m bridge in how many seconds?';
  const optA = aiCandidateResult.candidate.option_a || '9';
  const optB = aiCandidateResult.candidate.option_b || '12';
  const optC = aiCandidateResult.candidate.option_c || '15';
  const optD = aiCandidateResult.candidate.option_d || '18';

  const savedAIDraft = await questionDraftService.saveDraft(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      categoryId: 'CAT-QA',
      difficulty: 'Intermediate',
      language: 'TELUGU',
      questionText: rawQText,
      options: { a: optA, b: optB, c: optC, d: optD },
      correctAnswer: aiCandidateResult.candidate.correct_answer || 'A',
      explanation: aiCandidateResult.candidate.explanation || 'Speed = 72 * (5/18) = 20 m/s. Time = 180/20 = 9 seconds.',
      realLifeContext: aiCandidateResult.candidate.real_world_context || 'TRAJECTORY_INTERCEPT',
      source: 'AI Question Studio',
    },
    authorActor
  );

  assert(savedAIDraft.status === QuestionStatus.DRAFT, 'AI candidate draft must enter system in DRAFT status');
  assert(
    savedAIDraft.status !== QuestionStatus.APPROVED,
    'AI candidate MUST NOT bypass human sign-off into APPROVED status (NEG-06)'
  );

  console.log('  -> PASS: Real NEG-06 AI Human-in-the-Loop Governance verified.\n');

  // --------------------------------------------------------------------------
  // TEST 7: REAL PRODUCTION NEG-07 MEDIA METADATA BOUNDARY
  // Path: validateMediaAssetMetadata() with binary and base64 payloads
  // --------------------------------------------------------------------------
  console.log('Checking Production Path 7: Real NEG-07 Media Metadata Boundary...');
  const validMediaMeta: MediaAssetMetadataInput = {
    entityId: testVideoId,
    entityType: 'VIDEO',
    fileName: 'master_cut_v1.mp4',
    mimeType: 'video/mp4',
    driveFileId: '1Z_x9AbCdEfGhIjKlMnOpQrSt',
    externalUrl: 'https://drive.google.com/file/d/1Z_x9AbCdEfGhIjKlMnOpQrSt/view',
    byteSize: 45000000,
  };

  const validMediaCheck = validateMediaAssetMetadata(validMediaMeta);
  assert(validMediaCheck.isValid, 'Valid metadata reference must pass');

  // Prohibited raw binary payload
  const invalidBinaryCheck = validateMediaAssetMetadata({
    ...validMediaMeta,
    rawBinaryData: Buffer.from('FAKE_RAW_BINARY_STREAM'),
  });
  assert(!invalidBinaryCheck.isValid, 'Raw binary payload must be rejected from database (AP-007 / NEG-07)');

  // Prohibited base64 data URI in metadata string
  const invalidBase64Check = validateMediaAssetMetadata({
    ...validMediaMeta,
    notes: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAA',
  });
  assert(!invalidBase64Check.isValid, 'Base64 data URI in metadata field must be rejected (NEG-07)');

  console.log('  -> PASS: Real NEG-07 Media Metadata Boundary verified.\n');

  // --------------------------------------------------------------------------
  // TEST 8: REAL PRODUCTION NEG-08 AUTHENTICATION & ROLE MIDDLEWARE
  // Path: requireRole() & requireAuth() middleware functions
  // --------------------------------------------------------------------------
  console.log('Checking Production Path 8: Real NEG-08 Authentication & Role Middleware...');
  let unauthStatus: number | null = null;
  const mockUnauthReq: any = { headers: {} };
  const mockUnauthRes: any = {
    status: (code: number) => {
      unauthStatus = code;
      return { json: () => {} };
    },
  };
  requireAuth(mockUnauthReq, mockUnauthRes, () => {});
  assert(unauthStatus === 401, 'Unauthenticated request must return 401 Unauthorized');

  let forbiddenStatus: number | null = null;
  const mockForbiddenReq: any = {
    user: { id: 'USR-WRITER-1', role: UserRole.CONTENT_WRITER, roles: [UserRole.CONTENT_WRITER] },
  };
  const mockForbiddenRes: any = {
    status: (code: number) => {
      forbiddenStatus = code;
      return { json: () => {} };
    },
  };
  const adminOnlyMiddleware = requireRole([UserRole.ADMIN]);
  adminOnlyMiddleware(mockForbiddenReq, mockForbiddenRes, () => {});
  assert(forbiddenStatus === 403, 'Unauthorized role request must return 403 Forbidden');

  console.log('  -> PASS: Real NEG-08 Authentication & Role Middleware verified.\n');

  // --------------------------------------------------------------------------
  // TEST 9: COST-001 BOUNDARY INVARIANT CHECK (NEG-09)
  // --------------------------------------------------------------------------
  console.log('Checking Production Path 9: COST-001 (NEG-09) Frugal Infrastructure Boundary...');
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  const disallowedCostlyPackages = [
    'ioredis',
    'bullmq',
    'pg-boss',
    'datadog-metrics',
    'aws-sdk',
  ];
  disallowedCostlyPackages.forEach((pkgName) => {
    assert(!allDeps[pkgName], `Disallowed costly package "${pkgName}" found`);
  });

  console.log('  -> PASS: COST-001 (₹0–₹100) boundary invariant verified.\n');

  // --------------------------------------------------------------------------
  // TEST 10: REAL PRODUCTION NEG-10 AUTHORITATIVE AUDIT TRAIL
  // Path: auditService & auditLogRepository verification of successful & rejected operations
  // --------------------------------------------------------------------------
  console.log('Checking Production Path 10: Real NEG-10 Authoritative Audit Trail...');

  // 1. Verify rejected self-approval audit record exists and has complete metadata
  const allAuditRecords = await auditLogRepository.findAll();
  const rejectedAudit = allAuditRecords.find(
    (log) => log.action === 'QUESTION_DRAFT_APPROVAL_REJECTED' && log.entityId === realDraft.id
  );

  assert(Boolean(rejectedAudit), 'Authoritative audit record MUST exist for rejected self-approval');
  assert(rejectedAudit!.actorId === authorActor.id, 'Audit record MUST contain author actor ID');
  assert(Boolean(rejectedAudit!.timestamp), 'Audit record MUST contain ISO timestamp');
  assert(
    Boolean(rejectedAudit!.details && String(JSON.stringify(rejectedAudit!.details)).includes('NEG-01')),
    'Audit record MUST contain rejection reason'
  );

  // 2. Verify successful protected status transition audit record exists
  const transitionAudit = allAuditRecords.find(
    (log) => log.action === 'QUESTION_STATUS_CHANGED' && log.entityId === approvedQuestion.id
  );

  assert(Boolean(transitionAudit), 'Authoritative audit record MUST exist for successful question approval');
  assert(transitionAudit!.actorId === independentReviewerActor.id, 'Audit record MUST attribute approving reviewer');
  assert(Boolean(transitionAudit!.timestamp), 'Audit record MUST contain ISO timestamp');
  assert(
    Boolean(
      transitionAudit!.details &&
      (String(transitionAudit!.details).includes('APPROVED') ||
        (typeof transitionAudit!.details === 'object' && (transitionAudit!.details as any).to === QuestionStatus.APPROVED))
    ),
    'Audit record MUST contain target approved status'
  );

  console.log('  -> PASS: Real NEG-10 Authoritative Audit Trail verified.\n');

  console.log('============================================================');
  console.log('ALL STAGE 02 BUSINESS ACCEPTANCE TESTS COMPLETED SUCCESSFULLY! ✅');
  console.log('============================================================');
}

// Cross-platform direct CLI execution guard
const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('src/tests/stage02-business-acceptance.test.ts')
  )
);

if (isDirectCli) {
  runStage02AcceptanceTests().catch((err) => {
    console.error('Stage 02 Acceptance Test Failure:', err);
    process.exit(1);
  });
}
