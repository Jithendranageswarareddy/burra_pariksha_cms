/**
 * BURRA PARIKSHA CMS — PHASE 19 VERIFICATION SUITE
 * Pinned Comment & Conversation Intelligence
 * 
 * Verifies P19-01 through P19-21:
 * P19-01 Content ID correlation (canonical BP-CNT-######)
 * P19-02 Question/Script/Video association
 * P19-03 Technical ID separation (BP-PCP-###### vs BP-PIN-###### vs BP-CNT-######)
 * P19-04 AI pinned comment generation
 * P19-05 Answer discussion prompt
 * P19-06 Follow-up question generation
 * P19-07 Audience participation prompt
 * P19-08 Engagement-quality validation (rejection of generic placeholders)
 * P19-09 Source answer / factual consistency
 * P19-10 Answer-leakage protection
 * P19-11 Cross-content rejection
 * P19-12 AI candidate remains DRAFT
 * P19-13 Human edit (all package fields)
 * P19-14 Version history (immutable versions BP-PCV-######-N)
 * P19-15 Review workflow (DRAFT -> IN_REVIEW)
 * P19-16 Approval authorization (RBAC enforcement)
 * P19-17 Stale-version approval rejection
 * P19-18 Editing approved version invalidates approval
 * P19-19 AI-independent manual workflow
 * P19-20 Audit/history logging
 * P19-21 REAL E2E: Content -> AI package -> human edit -> review -> approval -> production-ready
 */

import { questionsRepository } from '../lib/repositories/questions.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { publishingRepository } from '../lib/repositories/publishing.repository';
import { pinnedCommentsRepository, pinnedCommentVersionsRepository } from '../lib/repositories/pinned-comments.repository';
import { pinnedCommentPackagesRepository } from '../lib/repositories/pinned-comment-packages.repository';
import { pinnedCommentIntelligenceService } from '../lib/services/pinned-comment-intelligence.service';
import { PinnedCommentSafetyValidator } from '../lib/validators/pinned-comment-safety.validator';
import { auditService } from '../lib/services/audit.service';
import {
  Question,
  DifficultyLevel,
  QuestionLanguage,
  QuestionStatus,
  UserRole,
  Script,
  Video,
  VideoProductionStatus,
  ContentMasterStatus,
  WorkflowActor,
} from '../types';

export interface VerificationResult {
  code: string;
  check: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export async function runPhase19Verification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: VerificationResult[];
}> {
  const results: VerificationResult[] = [];
  let passedCount = 0;

  const addResult = (code: string, check: string, passed: boolean, details: string) => {
    const status: 'PASS' | 'FAIL' = passed ? 'PASS' : 'FAIL';
    if (passed) passedCount++;
    results.push({ code, check, status, details });
  };

  const adminActor: WorkflowActor = {
    id: 'ACTOR-ADMIN-19',
    name: 'Lead Director',
    role: UserRole.ADMIN,
  };

  const reviewerActor: WorkflowActor = {
    id: 'ACTOR-REVIEWER-19',
    name: 'Senior Pedagogical Reviewer',
    role: UserRole.REVIEWER,
  };

  const unauthorizedActor: WorkflowActor = {
    id: 'ACTOR-GUEST-19',
    name: 'Unauthorized Guest',
    role: UserRole.ANALYTICS_VIEWER,
  };

  try {
    // SETUP FIXTURE DATA
    const now = new Date().toISOString();
    const testNum = Math.floor(100000 + Math.random() * 900000);
    const contentId = `BP-CNT-${testNum}`;
    const questionId = `BP-Q-${testNum}`;
    const scriptId = `BP-S-${testNum}`;
    const videoId = `BP-V-${testNum}`;

    const testQuestion: Question = {
      id: questionId,
      contentId,
      topicId: 'MATH-TSD-01',
      topicName: 'Quantitative Aptitude',
      subtopicId: 'SUB-TSD-01',
      subtopicName: 'Time, Speed & Distance',
      difficulty: DifficultyLevel.MEDIUM,
      language: QuestionLanguage.TELUGU_ENGLISH,
      questionText: 'Two trains running in opposite directions cross each other in 12 seconds. If their speeds are 45 km/h and 63 km/h, and the length of one train is 210 meters, find the length of the other train.',
      question: 'Two trains running in opposite directions cross each other in 12 seconds. If their speeds are 45 km/h and 63 km/h, and the length of one train is 210 meters, find the length of the other train.',
      options: {
        a: '150 meters',
        b: '180 meters',
        c: '120 meters',
        d: '200 meters',
      },
      optionA: '150 meters',
      optionB: '180 meters',
      optionC: '120 meters',
      optionD: '200 meters',
      correctAnswer: 'A',
      explanation: 'Relative speed = 45 + 63 = 108 km/h = 30 m/s. Total distance = 30 * 12 = 360m. Length of 2nd train = 360 - 210 = 150m (Option A).',
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.READY_TO_UPLOAD,
      createdAt: now,
      updatedAt: now,
    };
    await questionsRepository.create(testQuestion);

    const testScript: Script = {
      id: scriptId,
      contentId,
      videoId,
      questionId,
      currentVersion: 1,
      hookText: 'రెండు రైళ్లు ఎదురెదురుగా వస్తున్నాయి! 12 సెకన్లలో సమాధానం చెప్పగలరా? 🔥',
      problemStatement: 'Two trains problem',
      stepByStepSolution: 'Relative speed calculation',
      speedTrickOrTakeaway: '108 * 5/18 = 30m/s',
      callToAction: 'Comment your answer before the timer ends!',
      createdAt: now,
      updatedAt: now,
    };
    await scriptsRepository.create(testScript);

    const testVideo: Video = {
      id: videoId,
      contentId,
      questionId,
      title: 'Two Trains Problem Walkthrough',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      priority: 'NORMAL' as any,
      createdAt: now,
      updatedAt: now,
    };
    await videosRepository.create(testVideo);

    await contentMastersRepository.create({
      id: contentId,
      contentId,
      title: 'Two Trains Speed Challenge',
      topicId: 'MATH-TSD-01',
      primaryQuestionId: questionId,
      status: ContentMasterStatus.READY_FOR_REVIEW,
      createdAt: now,
      updatedAt: now,
    });
    // Set custom references on contentMaster
    const createdCM = await contentMastersRepository.findById(contentId);
    if (createdCM) {
      (createdCM as any).questionId = questionId;
      (createdCM as any).scriptId = scriptId;
      (createdCM as any).videoId = videoId;
      await contentMastersRepository.update(createdCM);
    }

    await publishingRepository.create({
      id: `BP-PUB-${testNum}`,
      contentId,
      videoId,
      videoTitle: 'Two Trains Speed Challenge',
      questionId,
      finalVideoStatus: 'READY',
      youtube: { status: 'DRAFT' as any },
      instagram: { status: 'DRAFT' as any },
      facebook: { status: 'DRAFT' as any },
      thumbnailReady: true,
      pinnedCommentReady: false,
      completedPlatformsCount: 0,
      totalPlatformsCount: 3,
      createdAt: now,
      updatedAt: now,
    });

    // ----------------------------------------------------
    // P19-01: Content ID Correlation
    // ----------------------------------------------------
    const generatedPackage = await pinnedCommentIntelligenceService.generatePackageForContent(
      contentId,
      adminActor
    );

    const p19_01_pass =
      generatedPackage.contentId === contentId &&
      /^BP-CNT-\d{6}$/.test(generatedPackage.contentId);
    addResult(
      'P19-01',
      'Content ID correlation preserves canonical BP-CNT-######',
      p19_01_pass,
      `Content ID: ${generatedPackage.contentId} correctly matched source ${contentId}`
    );

    // ----------------------------------------------------
    // P19-02: Question/Script/Video Association
    // ----------------------------------------------------
    const p19_02_pass =
      generatedPackage.questionId === questionId &&
      generatedPackage.scriptId === scriptId &&
      generatedPackage.videoId === videoId &&
      generatedPackage.scriptVersion === 1;
    addResult(
      'P19-02',
      'Question/Script/Video association correctly linked from Content Master',
      p19_02_pass,
      `Linked Question: ${generatedPackage.questionId}, Script: ${generatedPackage.scriptId} (v${generatedPackage.scriptVersion}), Video: ${generatedPackage.videoId}`
    );

    // ----------------------------------------------------
    // P19-03: Technical ID Separation
    // ----------------------------------------------------
    const p19_03_pass =
      generatedPackage.id.startsWith('BP-PCP-') &&
      generatedPackage.id !== generatedPackage.contentId &&
      generatedPackage.id !== generatedPackage.questionId;
    addResult(
      'P19-03',
      'Technical ID separation (BP-PCP-###### separate from Content/Question IDs)',
      p19_03_pass,
      `Package ID: ${generatedPackage.id}, Content ID: ${generatedPackage.contentId}`
    );

    // ----------------------------------------------------
    // P19-04: AI Pinned Comment Generation
    // ----------------------------------------------------
    const p19_04_pass =
      typeof generatedPackage.pinnedComment === 'string' &&
      generatedPackage.pinnedComment.length >= 25 &&
      (generatedPackage.isAiGenerated || generatedPackage.aiModelUsed === 'deterministic-fallback');
    addResult(
      'P19-04',
      'AI pinned comment generation produces structured output with provenance',
      p19_04_pass,
      `Model used: ${generatedPackage.aiModelUsed}, isAiGenerated: ${generatedPackage.isAiGenerated}, Length: ${generatedPackage.pinnedComment.length} chars`
    );

    // ----------------------------------------------------
    // P19-05: Answer Discussion Prompt
    // ----------------------------------------------------
    const p19_05_pass =
      typeof generatedPackage.answerDiscussionPrompt === 'string' &&
      generatedPackage.answerDiscussionPrompt.length >= 15;
    addResult(
      'P19-05',
      'Answer discussion prompt generated and structured',
      p19_05_pass,
      `Discussion Prompt: "${generatedPackage.answerDiscussionPrompt.substring(0, 70)}..."`
    );

    // ----------------------------------------------------
    // P19-06: Follow-up Question Generation
    // ----------------------------------------------------
    const p19_06_pass =
      Array.isArray(generatedPackage.followUpQuestions) &&
      generatedPackage.followUpQuestions.length >= 1 &&
      generatedPackage.followUpQuestions.every((q) => q.length >= 10);
    addResult(
      'P19-06',
      'Follow-up question(s) generated for deep engagement',
      p19_06_pass,
      `Follow-ups count: ${generatedPackage.followUpQuestions.length}. Sample: "${generatedPackage.followUpQuestions[0]}"`
    );

    // ----------------------------------------------------
    // P19-07: Audience Participation Prompt
    // ----------------------------------------------------
    const p19_07_pass =
      typeof generatedPackage.audienceParticipationPrompt === 'string' &&
      generatedPackage.audienceParticipationPrompt.length >= 10;
    addResult(
      'P19-07',
      'Audience participation prompt encourages natural social engagement',
      p19_07_pass,
      `Participation prompt: "${generatedPackage.audienceParticipationPrompt}"`
    );

    // ----------------------------------------------------
    // P19-08: Engagement-Quality Validation (Generic Placeholders Rejection)
    // ----------------------------------------------------
    const genericPackage = {
      pinnedComment: 'Comment below!',
      answerDiscussionPrompt: 'Let me know!',
      followUpQuestions: ['Follow for more!'],
      audienceParticipationPrompt: 'Subscribe for more!',
    };
    const genericReport = PinnedCommentSafetyValidator.validate(genericPackage, testQuestion);
    const p19_08_pass =
      !genericReport.isValid &&
      genericReport.hasBannedPlaceholders &&
      genericReport.issues.length > 0;
    addResult(
      'P19-08',
      'Engagement-quality validation rejects generic placeholders ("Comment below!", "Follow for more!")',
      p19_08_pass,
      `Detected issues: ${genericReport.issues.join(' | ')}`
    );

    // ----------------------------------------------------
    // P19-09: Source Answer / Factual Consistency
    // ----------------------------------------------------
    const contradictoryPackage = {
      pinnedComment: 'Valid long pinned comment explaining the train problem steps carefully.',
      answerDiscussionPrompt: 'Why is Option C the correct answer? Explain the formula.', // Contradicts real answer (Option A)
      followUpQuestions: ['What if speed doubled?'],
      audienceParticipationPrompt: 'Comment your solving time below!',
    };
    const contradictionReport = PinnedCommentSafetyValidator.validate(contradictoryPackage, testQuestion);
    const p19_09_pass =
      !contradictionReport.isValid &&
      contradictionReport.issues.some((i) => i.includes('contradicts the authoritative answer'));
    addResult(
      'P19-09',
      'Source answer/factual consistency enforces agreement with authoritative answer',
      p19_09_pass,
      `Contradiction caught: ${contradictionReport.issues.find((i) => i.includes('contradicts'))}`
    );

    // ----------------------------------------------------
    // P19-10: Answer-Leakage Protection
    // ----------------------------------------------------
    const leakingPackage = {
      pinnedComment: 'Valid comprehensive pinned comment text for students solving train problems.',
      answerDiscussionPrompt: 'The answer is Option A (150 meters). Did you get it right?', // Leaks answer
      followUpQuestions: ['What happens next?'],
      audienceParticipationPrompt: 'Comment your answer time!',
    };
    const leakageReport = PinnedCommentSafetyValidator.validate(leakingPackage, testQuestion);
    const p19_10_pass =
      !leakageReport.isValid &&
      leakageReport.leaksAnswer;
    addResult(
      'P19-10',
      'Answer-leakage protection catches spoiler discussion prompts',
      p19_10_pass,
      `Leakage detected: ${leakageReport.issues.find((i) => i.includes('leak') || i.includes('reveals'))}`
    );

    // ----------------------------------------------------
    // P19-11: Cross-Content Rejection
    // ----------------------------------------------------
    let crossContentRejected = false;
    try {
      await pinnedCommentIntelligenceService.updatePackage(
        generatedPackage.id,
        { contentId: 'BP-CNT-999999' }, // Attempt to hijack content ID
        adminActor
      );
    } catch (err: any) {
      crossContentRejected = err.message.includes('Cross-content');
    }
    addResult(
      'P19-11',
      'Cross-content association rejected on package updates',
      crossContentRejected,
      'Package contentId reassignment attempt successfully thrown and blocked'
    );

    // ----------------------------------------------------
    // P19-12: AI Candidate Remains DRAFT
    // ----------------------------------------------------
    const p19_12_pass =
      generatedPackage.status === 'DRAFT' &&
      generatedPackage.approvedBy === undefined &&
      generatedPackage.approvedAt === undefined;
    addResult(
      'P19-12',
      'AI candidate remains in DRAFT status awaiting human editorial review',
      p19_12_pass,
      `Status: ${generatedPackage.status}, Approved: ${generatedPackage.approvedBy || 'none'}`
    );

    // ----------------------------------------------------
    // P19-13: Human Edit
    // ----------------------------------------------------
    const updatedPackage = await pinnedCommentIntelligenceService.updatePackage(
      generatedPackage.id,
      {
        pinnedComment: 'Updated high-quality pinned comment with Telugu problem recap and step-by-step hint.',
        answerDiscussionPrompt: 'Why do most test-takers forget to convert km/h to m/s? Which step caught you?',
        followUpQuestions: [
          'Follow-up Level 2: If the trains were running in the SAME direction, how long would it take to cross?',
        ],
        audienceParticipationPrompt: 'Comment "SPEED MATH ⚡" if you used the 108 * 5/18 shortcut in under 5 seconds!',
        notes: 'Human editor refined the Telugu vocabulary and emphasized the km/h conversion trap.',
      },
      adminActor
    );

    const p19_13_pass =
      updatedPackage.version === 2 &&
      updatedPackage.answerDiscussionPrompt.includes('km/h to m/s') &&
      updatedPackage.followUpQuestions[0].includes('SAME direction');
    addResult(
      'P19-13',
      'Human editor can update all package fields',
      p19_13_pass,
      `Version incremented to v${updatedPackage.version}, prompt updated successfully`
    );

    // ----------------------------------------------------
    // P19-14: Version History
    // ----------------------------------------------------
    const history = await pinnedCommentIntelligenceService.getPackageHistory(contentId);
    const p19_14_pass =
      history.versions.length === 2 &&
      history.versions[0].versionNumber === 1 &&
      history.versions[1].versionNumber === 2;
    addResult(
      'P19-14',
      'Immutable version history snapshots maintained across edits',
      p19_14_pass,
      `Versions recorded: ${history.versions.map((v) => `v${v.versionNumber} (${v.id})`).join(', ')}`
    );

    // ----------------------------------------------------
    // P19-15: Review Workflow
    // ----------------------------------------------------
    const submittedPackage = await pinnedCommentIntelligenceService.submitForReview(
      generatedPackage.id,
      adminActor,
      reviewerActor.id
    );

    const p19_15_pass =
      submittedPackage.status === 'IN_REVIEW' &&
      submittedPackage.assignedReviewerId === reviewerActor.id;
    addResult(
      'P19-15',
      'Review workflow transitions package from DRAFT to IN_REVIEW',
      p19_15_pass,
      `Status: ${submittedPackage.status}, Assigned Reviewer: ${submittedPackage.assignedReviewerId}`
    );

    // ----------------------------------------------------
    // P19-16: Approval Authorization (RBAC)
    // ----------------------------------------------------
    let unauthorizedBlocked = false;
    try {
      await pinnedCommentIntelligenceService.approvePackage(
        generatedPackage.id,
        2,
        unauthorizedActor
      );
    } catch (err: any) {
      unauthorizedBlocked = err.name === 'AuthorizationError' || err.message.includes('not authorized');
    }
    addResult(
      'P19-16',
      'Approval authorization enforces strict RBAC (unauthorized role rejected)',
      unauthorizedBlocked,
      `Unauthorized actor "${unauthorizedActor.role}" was rejected as expected`
    );

    // ----------------------------------------------------
    // P19-17: Stale-Version Approval Rejection
    // ----------------------------------------------------
    let staleVersionBlocked = false;
    try {
      // Current package is version 2, try to approve stale version 1
      await pinnedCommentIntelligenceService.approvePackage(
        generatedPackage.id,
        1,
        reviewerActor
      );
    } catch (err: any) {
      staleVersionBlocked = err.message.includes('Stale version') || err.name === 'ValidationError';
    }
    addResult(
      'P19-17',
      'Stale-version approval rejection prevents approving outdated drafts',
      staleVersionBlocked,
      'Attempt to approve v1 when current is v2 correctly thrown and blocked'
    );

    // ----------------------------------------------------
    // Approval of current version (v2)
    // ----------------------------------------------------
    const approvalResult = await pinnedCommentIntelligenceService.approvePackage(
      generatedPackage.id,
      2,
      reviewerActor,
      contentId
    );

    const officialPinnedComment = await pinnedCommentsRepository.findById(`BP-PIN-${testNum}`);
    const pubCheck = await publishingRepository.findByContentId(contentId);

    const approvalSynced =
      approvalResult.package.status === 'APPROVED' &&
      approvalResult.package.approvedVersion === 2 &&
      approvalResult.package.approvedBy === reviewerActor.id &&
      officialPinnedComment !== null &&
      officialPinnedComment.isApproved === true &&
      pubCheck?.pinnedCommentReady === true;

    // ----------------------------------------------------
    // P19-18: Editing Approved Version Invalidates Approval
    // ----------------------------------------------------
    const reEditedPackage = await pinnedCommentIntelligenceService.updatePackage(
      generatedPackage.id,
      {
        notes: 'Post-approval tweak to add AP SI exam reference note.',
      },
      adminActor
    );

    const postEditOfficial = await pinnedCommentsRepository.findById(`BP-PIN-${testNum}`);
    const postEditPub = await publishingRepository.findByContentId(contentId);

    const p19_18_pass =
      approvalSynced &&
      reEditedPackage.status === 'DRAFT' &&
      reEditedPackage.version === 3 &&
      reEditedPackage.approvedBy === undefined &&
      reEditedPackage.approvedVersion === undefined &&
      postEditOfficial?.isApproved === false &&
      postEditPub?.pinnedCommentReady === false;
    addResult(
      'P19-18',
      'Editing an approved package invalidates approval, increments version, and resets to DRAFT',
      p19_18_pass,
      `After editing v2 (APPROVED), new state is v${reEditedPackage.version} (${reEditedPackage.status}), downstream ready: ${postEditPub?.pinnedCommentReady}`
    );

    // ----------------------------------------------------
    // P19-19: AI-Independent Manual Workflow
    // ----------------------------------------------------
    const manualTestNum = Math.floor(100000 + Math.random() * 900000);
    const manualContentId = `BP-CNT-${manualTestNum}`;
    const manualQuestionId = `BP-Q-${manualTestNum}`;

    await questionsRepository.create({
      id: manualQuestionId,
      contentId: manualContentId,
      topicId: 'MATH-GEOM-01',
      topicName: 'Geometry',
      subtopicId: 'SUB-GEOM-01',
      subtopicName: 'Triangles',
      difficulty: DifficultyLevel.EASY,
      language: QuestionLanguage.ENGLISH,
      question: 'What is the sum of angles in a triangle?',
      questionText: 'What is the sum of angles in a triangle?',
      options: {
        a: '180 degrees',
        b: '360 degrees',
        c: '90 degrees',
        d: '270 degrees',
      },
      optionA: '180 degrees',
      optionB: '360 degrees',
      optionC: '90 degrees',
      optionD: '270 degrees',
      correctAnswer: 'A',
      explanation: 'Sum of interior angles of a triangle is always 180 degrees.',
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.READY_TO_UPLOAD,
      createdAt: now,
      updatedAt: now,
    });

    await contentMastersRepository.create({
      id: manualContentId,
      contentId: manualContentId,
      title: 'Geometry Triangles Sum Proof',
      topicId: 'MATH-GEOM-01',
      primaryQuestionId: manualQuestionId,
      status: ContentMasterStatus.READY_FOR_REVIEW,
      createdAt: now,
      updatedAt: now,
    });
    const manualCM = await contentMastersRepository.findById(manualContentId);
    if (manualCM) {
      (manualCM as any).questionId = manualQuestionId;
      await contentMastersRepository.update(manualCM);
    }

    const manualPackage = await pinnedCommentIntelligenceService.createManualPackage(
      {
        contentId: manualContentId,
        pinnedComment: '📐 Geometry Quick Check: What is the sum of interior angles in any Euclidean triangle?',
        answerDiscussionPrompt: 'Why do exterior angles sum up to 360 degrees while interior sum to 180 degrees? Share your proof!',
        followUpQuestions: [
          'What is the sum of interior angles of a regular hexagon?',
        ],
        audienceParticipationPrompt: 'Comment "GEOMETRY MASTER 📐" if you remember the (n-2)*180 formula!',
        notes: 'Hand-crafted package created manually without AI assistance.',
      },
      adminActor
    );

    const p19_19_pass =
      manualPackage.contentId === manualContentId &&
      manualPackage.isAiGenerated === false &&
      manualPackage.aiModelUsed === 'manual' &&
      manualPackage.status === 'DRAFT' &&
      manualPackage.version === 1;
    addResult(
      'P19-19',
      'AI-independent manual workflow allows authoring and validating packages without AI',
      p19_19_pass,
      `Manual package created: ${manualPackage.id}, isAiGenerated: ${manualPackage.isAiGenerated}, model: ${manualPackage.aiModelUsed}`
    );

    // ----------------------------------------------------
    // P19-20: Audit/History Logging
    // ----------------------------------------------------
    const auditLogs = await auditService.getLogs('PINNED_COMMENT', generatedPackage.id);
    const actions = auditLogs.map((l) => l.action);
    const p19_20_pass =
      actions.includes('GENERATE_PINNED_COMMENT_PACKAGE') &&
      actions.includes('UPDATE_PINNED_COMMENT_PACKAGE') &&
      actions.includes('SUBMIT_PINNED_COMMENT_REVIEW') &&
      actions.includes('APPROVE_PINNED_COMMENT_PACKAGE');
    addResult(
      'P19-20',
      'Audit/history records all state transitions and editorial actions',
      p19_20_pass,
      `Audit actions logged for ${generatedPackage.id}: [${actions.join(', ')}]`
    );

    // ----------------------------------------------------
    // P19-21: REAL E2E: Content -> AI Package -> Human Edit -> Review -> Approval -> Production-Ready
    // ----------------------------------------------------
    // Re-approve the package at version 3 for production readiness verification
    await pinnedCommentIntelligenceService.submitForReview(
      generatedPackage.id,
      adminActor,
      reviewerActor.id
    );

    await pinnedCommentIntelligenceService.approvePackage(
      generatedPackage.id,
      3,
      reviewerActor,
      contentId
    );

    const readiness = await pinnedCommentIntelligenceService.isProductionReady(generatedPackage.id);
    const p19_21_pass =
      readiness.isReady === true &&
      readiness.issues.length === 0 &&
      readiness.package?.status === 'APPROVED' &&
      readiness.package?.approvedVersion === 3;
    addResult(
      'P19-21',
      'REAL E2E: Content -> AI package -> human edit -> review -> approval -> production-ready',
      p19_21_pass,
      `Full pipeline verified: Production-Ready = ${readiness.isReady}, Package Status = ${readiness.package?.status} (v${readiness.package?.approvedVersion})`
    );

  } catch (error: any) {
    addResult('P19-ERROR', 'Unexpected test execution exception', false, error.stack || error.message);
  }

  const passed = passedCount === 21;

  return {
    passed,
    totalChecks: 21,
    passedChecks: passedCount,
    failedChecks: 21 - passedCount,
    results,
  };
}
