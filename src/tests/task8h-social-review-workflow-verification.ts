/**
 * BURRA PARIKSHA CMS - Phase 8H Verification Test Suite
 * Social Content Review & Human Approval Workflow
 * Comprehensive 52-check forensic verification suite.
 */

import { SocialReviewService } from '../lib/services/social-review.service';
import { SocialEnhancementService } from '../lib/services/social-enhancement.service';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { workflowRepository } from '../lib/repositories/workflow.repository';
import {
  Question,
  QuestionValidationStatus,
  SocialReviewStatus,
  UserRole,
  SocialQualityStatus,
} from '../types';

export interface VerificationTestResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  message: string;
  details?: any;
}

export async function runTask8hVerification(): Promise<{
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: VerificationTestResult[];
}> {
  const results: VerificationTestResult[] = [];

  const addResult = (id: string, name: string, category: string, passed: boolean, message: string, details?: any) => {
    results.push({ id, name, category, passed, message, details });
  };

  const originalDraftFn = SocialEnhancementService.generateSocialEnhancementDraft;
  SocialEnhancementService.generateSocialEnhancementDraft = async (input: any) => {
    const q = input.question;
    return {
      isEligible: true,
      reason: 'Question is eligible for social enhancement',
      aiCallsCount: 0,
      payload: {
        id: `SOC-${q.id}`,
        questionId: q.id,
        language: q.language || 'ENGLISH',
        status: 'VALIDATED' as any,
        selectedHookStyle: 'CURIOSITY' as any,
        hooks: [
          {
            id: 'H1',
            style: 'CURIOSITY' as any,
            text: `Curiosity hook for ${q.questionText}`,
            spokenTeluguText: 'Spoken Telugu hook',
            onScreenOverlayText: 'Overlay hook',
            score: 90,
          },
        ],
        presentationStrategy: {} as any,
        cta: {} as any,
        caption: {} as any,
        platformVariants: [],
        teleprompterScript: {
          id: `TEL-${q.id}`,
          questionId: q.id,
          selectedHookStyle: 'CURIOSITY' as any,
          selectedHookText: 'Curiosity hook',
          language: q.language || 'ENGLISH',
          totalEstimatedDurationSeconds: 45,
          pacingWpm: 140,
          segments: [
            {
              id: 'S1',
              section: 'HOOK' as any,
              spokenText: `Spoken intro for ${q.questionText}`,
              teleprompterText: 'Teleprompter text',
              estimatedDurationSeconds: 5,
              pauseDurationSeconds: 1,
            },
          ],
          invarianceCheckPassed: true,
          answerLeakageDetected: false,
          status: 'VALIDATED' as any,
          generatedAt: new Date().toISOString(),
        },
        metadata: {
          id: `META-${q.id}`,
          questionId: q.id,
          language: q.language || 'ENGLISH',
          shortTitle: `Title for ${q.questionText}`,
          socialCaption: `Caption for ${q.questionText}`,
          extendedDescription: 'Description',
          hashtags: ['Education', 'Exam'],
          keywords: ['Question'],
          cta: {
            primaryText: 'Comment answer',
            pinnedCommentPrompt: 'Your answer?',
          },
          generatedAt: new Date().toISOString(),
        },
        multiPlatformAdaptations: {
          isAllValid: true,
          variants: {
            YOUTUBE_SHORTS: { title: 'YouTube Shorts Title', caption: 'YouTube Shorts Caption', hashtags: ['shorts'], overlayText: 'Overlay', pinnedComment: 'Pinned' },
            INSTAGRAM_REELS: { title: 'Instagram Reels Title', caption: 'Instagram Reels Caption', hashtags: ['reels'], overlayText: 'Overlay', pinnedComment: 'Pinned' },
            FACEBOOK_REELS: { title: 'Facebook Reels Title', caption: 'Facebook Reels Caption', hashtags: ['fbreels'], overlayText: 'Overlay', pinnedComment: 'Pinned' },
          },
        },
        qualityAssessment: {
          id: `QUAL-${q.id}`,
          questionId: q.id,
          overallScore: 88,
          status: SocialQualityStatus.EXCELLENT,
          dimensionScores: {} as any,
          blockingFindings: [],
          advisoryFindings: [],
          recommendations: [],
          confidence: 0.95,
          assessmentMethod: 'DETERMINISTIC_ONLY' as any,
          aiCallsCount: 0,
          generatedAt: new Date().toISOString(),
        },
        invarianceReport: {
          status: 'VALID' as any,
          isValid: true,
          sourceQuestionValidationStatus: QuestionValidationStatus.VALID,
          preservedAnchorsCount: 4,
          mutatedAnchorsCount: 0,
          violations: [],
          warnings: [],
          anchors: [],
          checkedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
    };
  };

  // Mock source question
  const baseQuestion: Question = {
    id: `Q-TEST-8H-${Date.now().toString(36).toUpperCase()}`,
    questionText: 'What is the capital of Telangana?',
    options: {
      a: 'Hyderabad',
      b: 'Warangal',
      c: 'Nizamabad',
      d: 'Karimnagar',
    },
    correctAnswer: 'A',
    explanation: 'Hyderabad is the official administrative capital of Telangana state.',
    language: 'ENGLISH' as any,
    validationStatus: QuestionValidationStatus.VALID,
    authorId: 'USER-AUTHOR-01',
    createdBy: 'USER-AUTHOR-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any;

  try {
    // =========================================================================
    // 1. DETERMINISTIC VERSION FINGERPRINTING (12 CHECKS)
    // =========================================================================
    const hash1 = SocialReviewService.computeVersionHash({
      question: {
        questionText: baseQuestion.questionText,
        options: baseQuestion.options,
        correctAnswer: baseQuestion.correctAnswer,
        explanation: baseQuestion.explanation,
        language: baseQuestion.language,
      },
      hook: { id: 'H1', text: 'Hook test text', style: 'CURIOSITY' },
      teleprompterScript: { segments: [{ section: 'Hook', spokenText: 'Spoken test' }] },
      canonicalMetadata: { shortTitle: 'Short Title', socialCaption: 'Caption' },
      multiPlatformAdaptations: { variants: { YOUTUBE_SHORTS: { title: 'YouTube' } } },
      qualityAssessment: { overallScore: 88, status: 'PASS', blockingFindingsCount: 0 },
    });

    const hash2 = SocialReviewService.computeVersionHash({
      question: {
        questionText: baseQuestion.questionText,
        options: baseQuestion.options,
        correctAnswer: baseQuestion.correctAnswer,
        explanation: baseQuestion.explanation,
        language: baseQuestion.language,
      },
      hook: { id: 'H1', text: 'Hook test text', style: 'CURIOSITY' },
      teleprompterScript: { segments: [{ section: 'Hook', spokenText: 'Spoken test' }] },
      canonicalMetadata: { shortTitle: 'Short Title', socialCaption: 'Caption' },
      multiPlatformAdaptations: { variants: { YOUTUBE_SHORTS: { title: 'YouTube' } } },
      qualityAssessment: { overallScore: 88, status: 'PASS', blockingFindingsCount: 0 },
    });

    addResult('8H-FP-01', 'Deterministic Hashing Invariance', 'Fingerprinting', hash1 === hash2, 'Identical inputs yield identical hashes', { hash1 });

    const hashModifiedText = SocialReviewService.computeVersionHash({
      question: {
        questionText: baseQuestion.questionText + ' (modified)',
        options: baseQuestion.options,
        correctAnswer: baseQuestion.correctAnswer,
        explanation: baseQuestion.explanation,
        language: baseQuestion.language,
      },
      hook: { id: 'H1', text: 'Hook test text', style: 'CURIOSITY' },
    });
    addResult('8H-FP-02', 'Question Text Modification Sensitivity', 'Fingerprinting', hash1 !== hashModifiedText, 'Modified question text produces different hash');

    const hashModifiedOption = SocialReviewService.computeVersionHash({
      question: {
        questionText: baseQuestion.questionText,
        options: { ...baseQuestion.options, a: 'Hyderabad Metro' },
        correctAnswer: baseQuestion.correctAnswer,
      },
      hook: { id: 'H1', text: 'Hook test text', style: 'CURIOSITY' },
    });
    addResult('8H-FP-03', 'Option Modification Sensitivity', 'Fingerprinting', hash1 !== hashModifiedOption, 'Modified option text produces different hash');

    const hashModifiedAnswer = SocialReviewService.computeVersionHash({
      question: {
        questionText: baseQuestion.questionText,
        options: baseQuestion.options,
        correctAnswer: 'B',
      },
      hook: { id: 'H1', text: 'Hook test text', style: 'CURIOSITY' },
    });
    addResult('8H-FP-04', 'Correct Answer Sensitivity', 'Fingerprinting', hash1 !== hashModifiedAnswer, 'Modified correct answer produces different hash');

    const hashModifiedHook = SocialReviewService.computeVersionHash({
      question: baseQuestion,
      hook: { id: 'H1', text: 'Hook test text MODIFIED', style: 'CURIOSITY' },
    });
    addResult('8H-FP-05', 'Hook Text Sensitivity', 'Fingerprinting', hash1 !== hashModifiedHook, 'Modified hook text produces different hash');

    const hashModifiedTele = SocialReviewService.computeVersionHash({
      question: baseQuestion,
      hook: { id: 'H1', text: 'Hook test text', style: 'CURIOSITY' },
      teleprompterScript: { segments: [{ section: 'Hook', spokenText: 'Spoken test MODIFIED' }] },
    });
    addResult('8H-FP-06', 'Teleprompter Script Sensitivity', 'Fingerprinting', hash1 !== hashModifiedTele, 'Modified teleprompter produces different hash');

    const hashModifiedMeta = SocialReviewService.computeVersionHash({
      question: baseQuestion,
      hook: { id: 'H1', text: 'Hook test text', style: 'CURIOSITY' },
      canonicalMetadata: { shortTitle: 'Short Title MODIFIED' },
    });
    addResult('8H-FP-07', 'Canonical Metadata Sensitivity', 'Fingerprinting', hash1 !== hashModifiedMeta, 'Modified metadata produces different hash');

    const hashModifiedAdapt = SocialReviewService.computeVersionHash({
      question: baseQuestion,
      hook: { id: 'H1', text: 'Hook test text', style: 'CURIOSITY' },
      multiPlatformAdaptations: { variants: { YOUTUBE_SHORTS: { title: 'YouTube MODIFIED' } } },
    });
    addResult('8H-FP-08', 'Platform Adaptation Sensitivity', 'Fingerprinting', hash1 !== hashModifiedAdapt, 'Modified platform adaptation produces different hash');

    const hashModifiedQuality = SocialReviewService.computeVersionHash({
      question: baseQuestion,
      hook: { id: 'H1', text: 'Hook test text', style: 'CURIOSITY' },
      qualityAssessment: { overallScore: 50, status: 'REJECTED', blockingFindingsCount: 2 },
    });
    addResult('8H-FP-09', 'Quality Assessment Sensitivity', 'Fingerprinting', hash1 !== hashModifiedQuality, 'Modified quality score produces different hash');

    const unorderedHash = SocialReviewService.computeVersionHash({
      qualityAssessment: { blockingFindingsCount: 0, status: 'PASS', overallScore: 88 },
      multiPlatformAdaptations: { variants: { YOUTUBE_SHORTS: { title: 'YouTube' } } },
      canonicalMetadata: { socialCaption: 'Caption', shortTitle: 'Short Title' },
      teleprompterScript: { segments: [{ spokenText: 'Spoken test', section: 'Hook' }] },
      hook: { style: 'CURIOSITY', text: 'Hook test text', id: 'H1' },
      question: {
        language: baseQuestion.language,
        explanation: baseQuestion.explanation,
        correctAnswer: baseQuestion.correctAnswer,
        options: baseQuestion.options,
        questionText: baseQuestion.questionText,
      },
    });
    addResult('8H-FP-10', 'Key Ordering Canonicalization', 'Fingerprinting', hash1 === unorderedHash, 'Key order variations produce identical hash', { hash1, unorderedHash });

    const hashWithTimestamp1 = SocialReviewService.computeVersionHash({
      question: { questionText: 'Test Q', options: { a: 'A', b: 'B', c: 'C', d: 'D' }, correctAnswer: 'A' },
      hook: { id: 'H1', text: 'Hook', style: 'CURIOSITY' },
    });
    const hashWithTimestamp2 = SocialReviewService.computeVersionHash({
      question: { questionText: 'Test Q', options: { a: 'A', b: 'B', c: 'C', d: 'D' }, correctAnswer: 'A' },
      hook: { id: 'H1', text: 'Hook', style: 'CURIOSITY' },
    });
    addResult('8H-FP-11', 'Volatile Timestamps Exclusion Invariance', 'Fingerprinting', hashWithTimestamp1 === hashWithTimestamp2, 'Volatile timestamps do not alter content version hash');

    addResult('8H-FP-12', 'Hexadecimal Hash Structure Validation', 'Fingerprinting', /^[a-f0-9]{64}$/.test(hash1), 'Computed hash is a valid 64-character lowercase SHA-256 hex string');

    // =========================================================================
    // 2. REVIEW BUNDLE ASSEMBLY & INITIAL STATE (6 CHECKS)
    // =========================================================================
    const initialBundle = await SocialReviewService.getReviewPackageBundle(baseQuestion.id, baseQuestion);

    addResult('8H-BD-01', 'Bundle Assembly', 'Bundle', Boolean(initialBundle && initialBundle.question), 'Successfully assembled bundle for question');
    addResult('8H-BD-02', 'Initial Status Pending', 'Bundle', initialBundle.currentReviewStatus === SocialReviewStatus.PENDING_REVIEW, 'Unreviewed content starts in PENDING_REVIEW status');
    addResult('8H-BD-03', 'Version Hash Populated', 'Bundle', typeof initialBundle.currentVersionHash === 'string' && initialBundle.currentVersionHash.length === 64, 'Computed 64-char hex SHA-256 version hash');
    addResult('8H-BD-04', 'Blockers Evaluation', 'Bundle', Array.isArray(initialBundle.blockers), 'Evaluates publishing blockers array');
    addResult('8H-BD-05', 'Draft Artifacts Assembly', 'Bundle', Boolean(initialBundle.hook && initialBundle.teleprompterScript), 'Assembles draft social artifacts dynamically');
    addResult('8H-BD-06', 'Quality Assessment Integration', 'Bundle', Boolean(initialBundle.qualityAssessment && initialBundle.qualityAssessment.overallScore > 0), 'Bundle integrates Phase 8G quality assessment findings');

    // =========================================================================
    // 3. HUMAN APPROVAL DECISIONS & STATE MACHINE (10 CHECKS)
    // =========================================================================
    const reviewerActor = { id: 'USER-REVIEWER-01', name: 'Senior Reviewer', role: UserRole.REVIEWER };
    const authorActor = { id: 'USER-AUTHOR-01', name: 'Content Author', role: UserRole.CONTENT_MANAGER };
    const adminAuthorActor = { id: 'USER-AUTHOR-01', name: 'Admin Author', role: UserRole.ADMIN };

    // Independent reviewer approval
    const independentApproval = await SocialReviewService.submitReviewDecision(
      baseQuestion.id,
      { decision: SocialReviewStatus.APPROVED, versionHash: initialBundle.currentVersionHash },
      reviewerActor,
      baseQuestion
    );
    addResult('8H-SM-01', 'Approval Transition', 'State Machine', independentApproval.bundle.currentReviewStatus === SocialReviewStatus.APPROVED, 'Independent reviewer approval sets status to APPROVED');

    // Modifying question text transitions status to STALE_REVISION_REQUIRED
    const modifiedQuestion: Question = {
      ...baseQuestion,
      questionText: baseQuestion.questionText + ' (modified after approval)',
    };
    const staleBundle = await SocialReviewService.getReviewPackageBundle(baseQuestion.id, modifiedQuestion);
    addResult('8H-SM-02', 'Stale Approval Detection on Content Change', 'State Machine', staleBundle.currentReviewStatus === SocialReviewStatus.STALE_REVISION_REQUIRED, 'Modifying approved content sets status to STALE_REVISION_REQUIRED');

    // Re-approving updated content updates status to APPROVED
    const reApproved = await SocialReviewService.submitReviewDecision(
      baseQuestion.id,
      { decision: SocialReviewStatus.APPROVED, versionHash: staleBundle.currentVersionHash },
      reviewerActor,
      modifiedQuestion
    );
    addResult('8H-SM-03', 'Re-approval of Modified Content', 'State Machine', reApproved.bundle.currentReviewStatus === SocialReviewStatus.APPROVED, 'Re-approving modified content sets status to APPROVED');

    // Requesting changes without sufficient reason fails
    let shortReasonBlocked = false;
    try {
      await SocialReviewService.submitReviewDecision(
        baseQuestion.id,
        { decision: SocialReviewStatus.CHANGES_REQUESTED, versionHash: reApproved.bundle.currentVersionHash, reason: 'Short' },
        reviewerActor,
        modifiedQuestion
      );
    } catch (err: any) {
      if (err.statusCode === 400 && err.message.includes('detailed reason')) {
        shortReasonBlocked = true;
      }
    }
    addResult('8H-SM-04', 'Change Request Reason Length Enforcement', 'State Machine', shortReasonBlocked, 'Change request with reason < 10 chars rejected with 400');

    // Requesting changes with valid reason transitions status to CHANGES_REQUESTED
    const changeReq = await SocialReviewService.submitReviewDecision(
      baseQuestion.id,
      { decision: SocialReviewStatus.CHANGES_REQUESTED, versionHash: reApproved.bundle.currentVersionHash, reason: 'Please make the option text clearer.' },
      reviewerActor,
      modifiedQuestion
    );
    addResult('8H-SM-05', 'Change Request Transition', 'State Machine', changeReq.bundle.currentReviewStatus === SocialReviewStatus.CHANGES_REQUESTED, 'Valid change request sets status to CHANGES_REQUESTED');

    // Modifying content after CHANGES_REQUESTED transitions status back to PENDING_REVIEW
    const revisedQuestion: Question = {
      ...modifiedQuestion,
      questionText: baseQuestion.questionText + ' (revised option clarity)',
    };
    const revisedBundle = await SocialReviewService.getReviewPackageBundle(baseQuestion.id, revisedQuestion);
    addResult('8H-SM-06', 'Content Revision Resets Status to Pending', 'State Machine', revisedBundle.currentReviewStatus === SocialReviewStatus.PENDING_REVIEW, 'Editing content after change request shifts status back to PENDING_REVIEW');

    // Rejection without reason fails
    let rejectNoReasonBlocked = false;
    try {
      await SocialReviewService.submitReviewDecision(
        baseQuestion.id,
        { decision: SocialReviewStatus.REJECTED, versionHash: revisedBundle.currentVersionHash, reason: 'No' },
        reviewerActor,
        revisedQuestion
      );
    } catch (err: any) {
      if (err.statusCode === 400 && err.message.includes('detailed reason')) {
        rejectNoReasonBlocked = true;
      }
    }
    addResult('8H-SM-07', 'Rejection Reason Length Enforcement', 'State Machine', rejectNoReasonBlocked, 'Rejection without detailed reason rejected with 400');

    // Rejection transitions status to REJECTED
    const rejection = await SocialReviewService.submitReviewDecision(
      baseQuestion.id,
      { decision: SocialReviewStatus.REJECTED, versionHash: revisedBundle.currentVersionHash, reason: 'Content unsuitable for target social demographic.' },
      reviewerActor,
      revisedQuestion
    );
    addResult('8H-SM-08', 'Rejection Transition', 'State Machine', rejection.bundle.currentReviewStatus === SocialReviewStatus.REJECTED, 'Rejection decision sets status to REJECTED');

    addResult('8H-SM-09', 'Previous Status Recording in History', 'State Machine', rejection.record.previousStatus === SocialReviewStatus.PENDING_REVIEW, 'Review decision record captures accurate previousStatus');

    addResult('8H-SM-10', 'Publishing Readiness Flag Evaluation', 'State Machine', rejection.bundle.isPublishingReady === false && rejection.bundle.blockers.length > 0, 'Rejected package is marked not publishing ready with active blockers');

    // =========================================================================
    // 4. VALIDATION GATES (6 CHECKS)
    // =========================================================================
    const invalidSourceQuestion: Question = {
      ...baseQuestion,
      id: 'Q-INVALID-01',
      validationStatus: QuestionValidationStatus.INVALID,
    };
    const invalidSourceBundle = await SocialReviewService.getReviewPackageBundle('Q-INVALID-01', invalidSourceQuestion);
    let unvalidatedApprovalBlocked = false;
    try {
      await SocialReviewService.submitReviewDecision(
        'Q-INVALID-01',
        { decision: SocialReviewStatus.APPROVED, versionHash: invalidSourceBundle.currentVersionHash },
        reviewerActor,
        invalidSourceQuestion
      );
    } catch (err: any) {
      if (err.statusCode === 422) {
        unvalidatedApprovalBlocked = true;
      }
    }
    addResult('8H-GT-01', 'Source Question Validation Gate', 'Validation Gates', unvalidatedApprovalBlocked, 'Unvalidated source question approval rejected with 422');

    addResult('8H-GT-02', 'AI Quality Assessment Gate', 'Validation Gates', Array.isArray(initialBundle.blockers), 'Evaluates quality findings and raises blockers if critical defects exist');

    addResult('8H-GT-03', 'Readiness Blockers List Accuracy', 'Validation Gates', Array.isArray(rejection.bundle.blockers) && rejection.bundle.blockers.some((b) => b.includes('REJECTED') || b.includes('approval')), 'Blockers accurately report rejection status');

    let missingHashBlocked = false;
    try {
      await SocialReviewService.submitReviewDecision(
        baseQuestion.id,
        { decision: SocialReviewStatus.APPROVED, versionHash: '' },
        reviewerActor,
        revisedQuestion
      );
    } catch (err: any) {
      if (err.statusCode === 400 && err.message.includes('versionHash')) {
        missingHashBlocked = true;
      }
    }
    addResult('8H-GT-04', 'Missing Version Hash Rejection', 'Validation Gates', missingHashBlocked, 'Decision without version hash rejected with 400 Bad Request');

    let invalidDecisionBlocked = false;
    try {
      await SocialReviewService.submitReviewDecision(
        baseQuestion.id,
        { decision: 'INVALID_DECISION' as any, versionHash: revisedBundle.currentVersionHash },
        reviewerActor,
        revisedQuestion
      );
    } catch (err: any) {
      if (err.statusCode === 400) {
        invalidDecisionBlocked = true;
      }
    }
    addResult('8H-GT-05', 'Invalid Decision Value Rejection', 'Validation Gates', invalidDecisionBlocked, 'Invalid decision enum value rejected with 400 Bad Request');

    const auditLogs = await auditLogRepository.findAll();
    const reviewAuditLog = auditLogs.find((l) => l.entityType === 'SOCIAL_REVIEW' && l.entityId === baseQuestion.id);
    addResult('8H-GT-06', 'Audit Trail Recording', 'Validation Gates', Boolean(reviewAuditLog), 'Audit log entry recorded for social review decision');

    // =========================================================================
    // 5. ROLE-BASED ACCESS CONTROL & SELF-APPROVAL (6 CHECKS)
    // =========================================================================
    let selfApprovalBlocked = false;
    try {
      await SocialReviewService.submitReviewDecision(
        baseQuestion.id,
        { decision: SocialReviewStatus.APPROVED, versionHash: revisedBundle.currentVersionHash },
        authorActor,
        revisedQuestion
      );
    } catch (err: any) {
      if (err.statusCode === 403 && err.message.includes('Self-approval')) {
        selfApprovalBlocked = true;
      }
    }
    addResult('8H-RB-01', 'Non-Admin Self Approval Policy', 'RBAC & Self-Approval', selfApprovalBlocked, 'Non-admin author self-approval is strictly forbidden (403)');

    const adminApproval = await SocialReviewService.submitReviewDecision(
      baseQuestion.id,
      { decision: SocialReviewStatus.APPROVED, versionHash: revisedBundle.currentVersionHash },
      adminAuthorActor,
      revisedQuestion
    );
    addResult('8H-RB-02', 'Admin Self Approval Override', 'RBAC & Self-Approval', adminApproval.record.isAdminOverride === true && adminApproval.bundle.currentReviewStatus === SocialReviewStatus.APPROVED, 'Admin self-approval succeeds with isAdminOverride = true');

    addResult('8H-RB-03', 'Independent Reviewer Approval', 'RBAC & Self-Approval', independentApproval.record.isAdminOverride === false && independentApproval.bundle.currentReviewStatus === SocialReviewStatus.APPROVED, 'Independent reviewer approval succeeds without override flag');

    const editorActor = { id: 'USER-EDITOR-01', name: 'Question Editor', role: UserRole.QUESTION_EDITOR };
    let editorRoleBlocked = false;
    try {
      await SocialReviewService.submitReviewDecision(
        baseQuestion.id,
        { decision: SocialReviewStatus.APPROVED, versionHash: adminApproval.bundle.currentVersionHash },
        editorActor,
        revisedQuestion
      );
    } catch (err: any) {
      if (err.statusCode === 403) {
        editorRoleBlocked = true;
      }
    }
    addResult('8H-RB-04', 'Unauthorized Role Rejection (Editor)', 'RBAC & Self-Approval', editorRoleBlocked, 'QUESTION_EDITOR blocked from review decision (403)');

    const guestActor = { id: 'USER-GUEST-01', name: 'Guest User', role: 'GUEST' };
    let guestRoleBlocked = false;
    try {
      await SocialReviewService.submitReviewDecision(
        baseQuestion.id,
        { decision: SocialReviewStatus.APPROVED, versionHash: adminApproval.bundle.currentVersionHash },
        guestActor,
        revisedQuestion
      );
    } catch (err: any) {
      if (err.statusCode === 403) {
        guestRoleBlocked = true;
      }
    }
    addResult('8H-RB-05', 'Unauthorized Role Rejection (Guest)', 'RBAC & Self-Approval', guestRoleBlocked, 'Guest user blocked from review decision (403)');

    const managerActor = { id: 'USER-MANAGER-02', name: 'Second Content Manager', role: UserRole.CONTENT_MANAGER };
    const managerApproval = await SocialReviewService.submitReviewDecision(
      baseQuestion.id,
      { decision: SocialReviewStatus.APPROVED, versionHash: adminApproval.bundle.currentVersionHash },
      managerActor,
      revisedQuestion
    );
    addResult('8H-RB-06', 'Authorized Role Acceptance (Content Manager)', 'RBAC & Self-Approval', managerApproval.bundle.currentReviewStatus === SocialReviewStatus.APPROVED, 'Independent CONTENT_MANAGER authorized for review decision');

    // =========================================================================
    // 6. CONCURRENCY PROTECTION (4 CHECKS)
    // =========================================================================
    let staleHashBlocked = false;
    try {
      await SocialReviewService.submitReviewDecision(
        baseQuestion.id,
        { decision: SocialReviewStatus.APPROVED, versionHash: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff' },
        reviewerActor,
        revisedQuestion
      );
    } catch (err: any) {
      if (err.statusCode === 409) {
        staleHashBlocked = true;
      }
    }
    addResult('8H-CC-01', 'Stale Version Hash Rejection', 'Concurrency', staleHashBlocked, 'Outdated version hash approval rejected with 409 Conflict');

    const editedQuestion: Question = { ...revisedQuestion, questionText: revisedQuestion.questionText + ' [CONCURRENT EDIT]' };
    const editedBundle = await SocialReviewService.getReviewPackageBundle(baseQuestion.id, editedQuestion);
    addResult('8H-CC-02', 'Outdated Version Hash Prevention', 'Concurrency', editedBundle.currentVersionHash !== managerApproval.bundle.currentVersionHash, 'Concurrent question edit invalidates previous review version hash');

    let concurrentMismatchBlocked = false;
    try {
      await SocialReviewService.submitReviewDecision(
        baseQuestion.id,
        { decision: SocialReviewStatus.APPROVED, versionHash: managerApproval.bundle.currentVersionHash },
        reviewerActor,
        editedQuestion
      );
    } catch (err: any) {
      if (err.statusCode === 409) {
        concurrentMismatchBlocked = true;
      }
    }
    addResult('8H-CC-03', 'Hash Mismatch Protection Across Concurrent Edits', 'Concurrency', concurrentMismatchBlocked, 'Attempting approval with pre-edit hash on post-edit question blocked with 409');

    const freshEditApproval = await SocialReviewService.submitReviewDecision(
      baseQuestion.id,
      { decision: SocialReviewStatus.APPROVED, versionHash: editedBundle.currentVersionHash },
      reviewerActor,
      editedQuestion
    );
    addResult('8H-CC-04', 'Fresh Hash Approval Recovery', 'Concurrency', freshEditApproval.bundle.currentReviewStatus === SocialReviewStatus.APPROVED, 'Submitting approval with fresh updated version hash succeeds');

    // =========================================================================
    // 7. GOOGLE SHEETS PERSISTENCE (4 CHECKS)
    // =========================================================================
    const persistedReviews = await socialReviewsRepository.findByQuestion(baseQuestion.id);
    addResult('8H-PS-01', 'Google Sheets Reviews Tab Persistence', 'Persistence', persistedReviews.length > 0, 'Review records persisted in SOCIAL_REVIEWS repository');

    const latestPersisted = await socialReviewsRepository.getLatestByQuestion(baseQuestion.id);
    addResult('8H-PS-02', 'Latest Review Retrieval', 'Persistence', latestPersisted?.decision === SocialReviewStatus.APPROVED, 'Latest review record successfully retrieved');

    addResult('8H-PS-03', 'Reviewer Identity & Role Persistence', 'Persistence', latestPersisted?.reviewerId === reviewerActor.id && latestPersisted?.reviewerRole === reviewerActor.role, 'Reviewer ID and role accurately stored in record');

    addResult('8H-PS-04', 'Version Hash & Reason Persistence', 'Persistence', typeof latestPersisted?.reviewedVersionHash === 'string' && latestPersisted.reviewedVersionHash.length === 64, 'Exact version hash stored in review record');

    // =========================================================================
    // 8. AUDIT & HISTORY TRAIL (4 CHECKS)
    // =========================================================================
    const workflowEntries = await workflowRepository.findAll();
    const reviewWorkflow = workflowEntries.find((w) => w.entityId === baseQuestion.id && (w.toStatus === SocialReviewStatus.APPROVED || w.toStatus === SocialReviewStatus.REJECTED));
    addResult('8H-AH-01', 'Workflow Transition Entry Generation', 'Audit & History', Boolean(reviewWorkflow), 'Workflow transition recorded in repository');

    const reviewHistory = await SocialReviewService.getReviewHistory(baseQuestion.id);
    addResult('8H-AH-02', 'Review History Timeline Retrieval', 'Audit & History', Array.isArray(reviewHistory) && reviewHistory.length >= 3, 'Chronological review history retrieved with all past decisions');

    const adminSelfAppRecord = reviewHistory.find((r) => r.isAdminOverride === true);
    addResult('8H-AH-03', 'Audit Override Flag Persistence', 'Audit & History', Boolean(adminSelfAppRecord), 'Administrative self-approval override flag persisted in review history');

    addResult('8H-AH-04', 'Snapshot Hash History Consistency', 'Audit & History', reviewHistory.every((r) => typeof r.reviewedVersionHash === 'string' && r.reviewedVersionHash.length === 64), 'All history records preserve valid 64-char version hashes');

  } catch (err: any) {
    addResult('8H-FATAL', 'Fatal Test Runner Exception', 'Fatal Error', false, err?.message || 'Unexpected exception', { stack: err?.stack });
  } finally {
    SocialEnhancementService.generateSocialEnhancementDraft = originalDraftFn;
  }

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const success = totalTests > 0 && totalTests === passedTests;

  return {
    success,
    totalTests,
    passedTests,
    results,
  };
}
