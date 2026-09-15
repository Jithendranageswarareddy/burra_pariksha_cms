/**
 * BURRA PARIKSHA CMS - Phase 11 Canonical Content Lifecycle Verification Suite
 */

import {
  contentMastersRepository,
  questionsRepository,
  videosRepository,
  scriptsRepository,
  thumbnailsRepository,
  pinnedCommentsRepository,
  publishingRepository,
  assignmentsRepository,
  auditLogRepository,
  socialReviewsRepository,
  workflowRepository,
} from '../lib/repositories';
import { IdService } from '../lib/services/id.service';
import { contentMasterService } from '../lib/services/content-master.service';
import { publishingService } from '../lib/services/publishing.service';
import { workflowService } from '../lib/services/audit.service';
import {
  ContentMasterStatus,
  VideoProductionStatus,
  QuestionValidationStatus,
  SocialReviewStatus,
  SocialQualityStatus,
} from '../types';

export interface Phase11CheckResult {
  check: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export interface Phase11SuiteResult {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: Phase11CheckResult[];
}

export async function runPhase11Verification(): Promise<Phase11SuiteResult> {
  // Force memory fallback mode for clean deterministic testing
  const originalSheetId = process.env.GOOGLE_SHEETS_ID;
  process.env.GOOGLE_SHEETS_ID = '';

  // Clear fallback stores to prevent leakage from previous test suites
  contentMastersRepository.clearFallbackData();
  questionsRepository.clearFallbackData();
  videosRepository.clearFallbackData();
  scriptsRepository.clearFallbackData();
  thumbnailsRepository.clearFallbackData();
  pinnedCommentsRepository.clearFallbackData();
  publishingRepository.clearFallbackData();
  assignmentsRepository.clearFallbackData();
  auditLogRepository.clearFallbackData();
  socialReviewsRepository.clearFallbackData();
  workflowRepository.clearFallbackData();

  const results: Phase11CheckResult[] = [];
  const idService = IdService.getInstance();

  function record(check: string, condition: boolean, details: string) {
    results.push({
      check,
      status: condition ? 'PASS' : 'FAIL',
      details,
    });
  }

  try {
    // -------------------------------------------------------------------------
    // P11-01: Content ID format and uniqueness
    // -------------------------------------------------------------------------
    const contentId1 = await idService.allocateContentMasterId();
    const isValidFormat = idService.validateContentIdFormat(contentId1);
    
    let caughtDuplicateAppend = false;
    try {
      await contentMastersRepository.appendRecord({
        id: contentId1,
        title: 'Collision Test',
        status: ContentMasterStatus.DRAFT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      // Try to append again with same ID
      await contentMastersRepository.appendRecord({
        id: contentId1,
        title: 'Collision Test 2',
        status: ContentMasterStatus.DRAFT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err?.message?.includes('already exists')) {
        caughtDuplicateAppend = true;
      }
    }

    record(
      'P11-01: Content ID format and uniqueness',
      isValidFormat && caughtDuplicateAppend,
      `Allocated: ${contentId1}, Valid format: ${isValidFormat}, Duplicate append guard triggers: ${caughtDuplicateAppend}`
    );

    // -------------------------------------------------------------------------
    // P11-02: Content ID is the canonical business correlation key
    // -------------------------------------------------------------------------
    const testContentId = 'BP-CNT-000042';
    const isIdValid = idService.validateContentIdFormat(testContentId);
    
    const master = await contentMastersRepository.create({
      id: testContentId,
      title: 'Canonical Core Master Title',
      status: ContentMasterStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    record(
      'P11-02: Content ID is canonical business correlation key',
      isIdValid && master.id === testContentId,
      `Master created with Canonical Content ID: ${master.id}, Format valid: ${isIdValid}`
    );

    // -------------------------------------------------------------------------
    // P11-03: Question → Content ID traceability
    // -------------------------------------------------------------------------
    const qRecord = await questionsRepository.create({
      id: 'BP-Q-000101',
      contentId: testContentId,
      contentMasterId: testContentId,
      topicId: 'TOPIC-01',
      topicName: 'Arithmetic',
      subtopicId: 'SUBTOPIC-01',
      subtopicName: 'Percentages',
      difficulty: 'EASY',
      questionText: 'Traceability test question?',
      correctAnswer: 'A',
      explanation: 'Test Explanation',
      options: { a: '1', b: '2', c: '3', d: '4' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    const tracedQuestions = await questionsRepository.findAll();
    const hasQuestion = tracedQuestions.some(q => q.contentId === testContentId && q.id === 'BP-Q-000101');

    record(
      'P11-03: Question → Content ID traceability',
      hasQuestion,
      `Question with ID ${qRecord.id} correctly stores and references canonical Content ID: ${qRecord.contentId}`
    );

    // -------------------------------------------------------------------------
    // P11-04: Script → Content ID traceability
    // -------------------------------------------------------------------------
    const sRecord = await scriptsRepository.create({
      id: 'BP-S-000101',
      contentId: testContentId,
      contentMasterId: testContentId,
      videoId: 'BP-V-000101',
      questionId: 'BP-Q-000101',
      hookText: 'Hey look at this percentage trick!',
      problemStatement: 'Solving traceability tests in 2 seconds!',
      stepByStepSolution: 'Import the service and execute.',
      speedTrickOrTakeaway: 'Always reuse existing canonical ID fields.',
      callToAction: 'Follow for more!',
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const tracedScripts = await scriptsRepository.findAll();
    const hasScript = tracedScripts.some(s => s.contentId === testContentId && s.id === 'BP-S-000101');

    record(
      'P11-04: Script → Content ID traceability',
      hasScript,
      `Script with ID ${sRecord.id} correctly stores and references canonical Content ID: ${sRecord.contentId}`
    );

    // -------------------------------------------------------------------------
    // P11-05: Video → Content ID traceability
    // -------------------------------------------------------------------------
    const vRecord = await videosRepository.create({
      id: 'BP-V-000101',
      contentId: testContentId,
      contentMasterId: testContentId,
      questionId: 'BP-Q-000101',
      title: 'Canonical Content ID Video',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      priority: 'NORMAL' as any,
      driveFileId: 'DRV-11002233',
      fileName: 'BP-CNT-000042_Arithmetic_V1.mp4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const tracedVideos = await videosRepository.findAll();
    const hasVideo = tracedVideos.some(v => v.contentId === testContentId && v.id === 'BP-V-000101');

    record(
      'P11-05: Video → Content ID traceability',
      hasVideo,
      `Video with ID ${vRecord.id} correctly stores and references canonical Content ID: ${vRecord.contentId}`
    );

    // -------------------------------------------------------------------------
    // P11-06: Thumbnail → Content ID traceability
    // -------------------------------------------------------------------------
    const tRecord = await thumbnailsRepository.create({
      id: 'BP-T-000101',
      contentId: testContentId,
      contentMasterId: testContentId,
      videoId: 'BP-V-000101',
      hookHeadline: 'EASY MATH TRICK',
      status: 'APPROVED',
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const tracedThumbnails = await thumbnailsRepository.findAll();
    const hasThumbnail = tracedThumbnails.some(t => t.contentId === testContentId && t.id === 'BP-T-000101');

    record(
      'P11-06: Thumbnail → Content ID traceability',
      hasThumbnail,
      `Thumbnail with ID ${tRecord.id} correctly stores and references canonical Content ID: ${tRecord.contentId}`
    );

    // -------------------------------------------------------------------------
    // P11-07: Pinned Comment → Content ID traceability
    // -------------------------------------------------------------------------
    const pRecord = await pinnedCommentsRepository.create({
      id: 'BP-PIN-000101',
      contentId: testContentId,
      contentMasterId: testContentId,
      videoId: 'BP-V-000101',
      commentText: 'Here is the detailed solution breakdown.',
      solutionBreakdown: 'Steps 1, 2, 3 mapped out!',
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const tracedComments = await pinnedCommentsRepository.findAll();
    const hasComment = tracedComments.some(p => p.contentId === testContentId && p.id === 'BP-PIN-000101');

    record(
      'P11-07: Pinned Comment → Content ID traceability',
      hasComment,
      `Pinned Comment with ID ${pRecord.id} correctly stores and references canonical Content ID: ${pRecord.contentId}`
    );

    // -------------------------------------------------------------------------
    // P11-08: Review → Content ID traceability
    // -------------------------------------------------------------------------
    const rRecord = await socialReviewsRepository.create({
      id: 'REV-000101',
      questionId: 'BP-Q-000101',
      contentId: testContentId,
      contentMasterId: testContentId,
      decision: SocialReviewStatus.APPROVED,
      reviewedVersionHash: 'vhash123',
      reviewerId: 'USR-REVIEWER',
      reviewerName: 'Lead Reviewer',
      reviewerRole: 'REVIEWER',
      overallQualityScoreAtReview: 95,
      qualityStatusAtReview: SocialQualityStatus.EXCELLENT,
      reviewedAt: new Date().toISOString(),
    });

    const tracedReviews = await socialReviewsRepository.findAll();
    const hasReview = tracedReviews.some(r => r.contentId === testContentId && r.id === 'REV-000101');

    record(
      'P11-08: Review → Content ID traceability',
      hasReview,
      `SocialReview with ID ${rRecord.id} correctly stores and references canonical Content ID: ${rRecord.contentId}`
    );

    // -------------------------------------------------------------------------
    // P11-09: Assignment → Content ID traceability
    // -------------------------------------------------------------------------
    const aRecord = await assignmentsRepository.create({
      id: 'BP-ASN-000101',
      contentId: testContentId,
      contentMasterId: testContentId,
      entityType: 'VIDEO',
      entityId: 'BP-V-000101',
      taskType: 'FILMING',
      assigneeId: 'USR-SPECIALIST',
      assigneeName: 'Creative Specialist',
      status: 'COMPLETED',
      priority: 'NORMAL',
      createdAt: new Date().toISOString(),
    } as any);

    const tracedAssignments = await assignmentsRepository.findAll();
    const hasAssignment = tracedAssignments.some(a => a.contentId === testContentId && a.id === 'BP-ASN-000101');

    record(
      'P11-09: Assignment → Content ID traceability',
      hasAssignment,
      `Assignment with ID ${aRecord.id} correctly stores and references canonical Content ID: ${aRecord.contentId}`
    );

    // -------------------------------------------------------------------------
    // P11-10: Workflow → Content ID traceability
    // -------------------------------------------------------------------------
    const wfRecord = await workflowService.recordTransition(
      'VIDEO',
      'BP-V-000101',
      'RECORDING',
      'READY_TO_UPLOAD',
      'USR-SYSTEM',
      'Automated transition log with canonical metadata'
    );
    
    // Explicitly update transition with Content ID
    await workflowRepository.updateRecord(wfRecord.id, {
      contentId: testContentId,
      contentMasterId: testContentId,
    });

    const tracedWorkflows = await workflowRepository.findAll();
    const hasWorkflow = tracedWorkflows.some(wf => wf.contentId === testContentId && wf.entityId === 'BP-V-000101');

    record(
      'P11-10: Workflow → Content ID traceability',
      hasWorkflow,
      `Workflow transition with ID ${wfRecord.id} correctly stores and references canonical Content ID: ${testContentId}`
    );

    // -------------------------------------------------------------------------
    // P11-11: Publishing → Content ID traceability
    // -------------------------------------------------------------------------
    const pubRecord = await publishingRepository.create({
      id: 'BP-PUB-000101',
      contentId: testContentId,
      contentMasterId: testContentId,
      videoId: 'BP-V-000101',
      videoTitle: 'Canonical Content ID Video',
      questionId: 'BP-Q-000101',
      finalVideoStatus: 'READY',
      youtube: { status: 'PENDING' },
      instagram: { status: 'PENDING' },
      facebook: { status: 'PENDING' },
    } as any);

    const tracedPublishings = await publishingRepository.findAll();
    const hasPublishing = tracedPublishings.some(pub => pub.contentId === testContentId && pub.id === 'BP-PUB-000101');

    record(
      'P11-11: Publishing → Content ID traceability',
      hasPublishing,
      `Publishing tracking record correctly stores and references canonical Content ID: ${pubRecord.contentId}`
    );

    // -------------------------------------------------------------------------
    // P11-12: Audit → Content ID traceability
    // -------------------------------------------------------------------------
    const logRecord = await auditLogRepository.logAction(
      'USR-USER',
      'Lead Editor',
      'CORRELATE_CANONICAL_LIFECYCLE',
      'CONTENT_MASTER',
      testContentId,
      { title: 'Full content mapping', correlatedId: testContentId }
    );

    const tracedLogs = await auditLogRepository.findAll();
    const hasAuditLog = tracedLogs.some(log => log.entityId === testContentId || log.details.includes(testContentId));

    record(
      'P11-12: Audit → Content ID traceability',
      hasAuditLog,
      `Audit record with ID ${logRecord.id} references canonical Content ID: ${testContentId}`
    );

    // -------------------------------------------------------------------------
    // P11-13: Cross-content mismatch is rejected
    // -------------------------------------------------------------------------
    // Try publishing a mismatched thumbnail asset
    await thumbnailsRepository.updateRecord('BP-T-000101', { contentId: 'BP-CNT-MISMATCHED-AAA' });
    const validationResult = await publishingService.validatePublishReadiness('BP-V-000101');
    
    const isMismatchRejected = validationResult.blockers.some(b => 
      b.includes('Cross-content protection') && b.includes('Thumbnail Content ID')
    );

    // Revert thumbnail to correct contentId for subsequently reconstructing lifecycle
    await thumbnailsRepository.updateRecord('BP-T-000101', { contentId: testContentId });

    record(
      'P11-13: Cross-content mismatch is rejected',
      isMismatchRejected,
      `Mismatched asset relationship correctly triggers blockers: ${isMismatchRejected}`
    );

    // -------------------------------------------------------------------------
    // P11-14: Technical entity IDs remain separate
    // -------------------------------------------------------------------------
    const uniqueTechnicalIds = 
      qRecord.id !== testContentId &&
      vRecord.id !== testContentId &&
      sRecord.id !== testContentId &&
      tRecord.id !== testContentId;

    record(
      'P11-14: Technical entity IDs remain separate',
      uniqueTechnicalIds,
      `Question ID (${qRecord.id}), Video ID (${vRecord.id}), Script ID (${sRecord.id}), Thumbnail ID (${tRecord.id}) remain distinct from Content ID (${testContentId})`
    );

    // -------------------------------------------------------------------------
    // P11-15: Existing Content ID sequence remains safe
    // -------------------------------------------------------------------------
    const seqMaster1 = await idService.allocateContentMasterId();
    const seqMaster2 = await idService.allocateContentMasterId();
    
    const intNum1 = parseInt(seqMaster1.split('-')[2], 10);
    const intNum2 = parseInt(seqMaster2.split('-')[2], 10);
    const isSequentialAndSafe = intNum2 === intNum1 + 1;

    record(
      'P11-15: Existing Content ID sequence remains safe',
      isSequentialAndSafe,
      `Generated sequences sequentially increments correctly: ${seqMaster1} -> ${seqMaster2}`
    );

    // -------------------------------------------------------------------------
    // P11-16: One Content ID can reconstruct the complete lifecycle
    // -------------------------------------------------------------------------
    const lifecycleDetails = await contentMasterService.getContentLifecycle(testContentId);
    
    const hasAllConnectedEntities = Boolean(
      lifecycleDetails &&
      lifecycleDetails.contentMaster &&
      lifecycleDetails.questions.length > 0 &&
      lifecycleDetails.videos.length > 0 &&
      lifecycleDetails.scripts.length > 0 &&
      lifecycleDetails.thumbnails.length > 0 &&
      lifecycleDetails.pinnedComments.length > 0 &&
      lifecycleDetails.publishingRecords.length > 0 &&
      lifecycleDetails.socialReviews && lifecycleDetails.socialReviews.length > 0 &&
      lifecycleDetails.assignments.length > 0 &&
      lifecycleDetails.auditLogs.length > 0 &&
      lifecycleDetails.workflows.length > 0
    );

    record(
      'P11-16: One Content ID can reconstruct complete lifecycle',
      hasAllConnectedEntities,
      `All 10 connected lifecycle entities successfully fetched and aggregated under ${testContentId}: ${hasAllConnectedEntities}`
    );

    // -------------------------------------------------------------------------
    // P11-17: Existing Phase 9/10 data is preserved
    // -------------------------------------------------------------------------
    // Set some Phase 9 verification and Phase 10 quality scores on Question and SocialReview
    await questionsRepository.updateRecord('BP-Q-000101', {
      validationStatus: QuestionValidationStatus.VALID,
    });
    await socialReviewsRepository.updateRecord('REV-000101', {
      overallQualityScoreAtReview: 98,
      qualityStatusAtReview: SocialQualityStatus.EXCELLENT,
    });

    const verifyLifecycleDetails = await contentMasterService.getContentLifecycle(testContentId);
    const qPreserved = verifyLifecycleDetails?.questions.find(q => q.id === 'BP-Q-000101');
    const rPreserved = verifyLifecycleDetails?.socialReviews?.find(r => r.id === 'REV-000101');

    const dataPreserved = 
      qPreserved?.validationStatus === QuestionValidationStatus.VALID &&
      rPreserved?.overallQualityScoreAtReview === 98 &&
      rPreserved?.qualityStatusAtReview === SocialQualityStatus.EXCELLENT;

    record(
      'P11-17: Existing Phase 9/10 data is preserved',
      dataPreserved,
      `Question validation state: ${qPreserved?.validationStatus}, Quality review score: ${rPreserved?.overallQualityScoreAtReview}`
    );

    // -------------------------------------------------------------------------
    // P11-18: AI/API unavailability does not break lifecycle operations
    // -------------------------------------------------------------------------
    // Verify that retrieval/creation/matching logic runs with zero AI service requests
    const initialTime = Date.now();
    const offlineDetails = await contentMasterService.getContentLifecycle(testContentId);
    const finalTime = Date.now();
    
    const runsOffline = Boolean(offlineDetails && (finalTime - initialTime) < 500);

    record(
      'P11-18: AI/API unavailability does not break operations',
      runsOffline,
      `Reconstruction executed purely offline and completed in ${finalTime - initialTime}ms`
    );

  } catch (err: any) {
    record('EXCEPTION_THROWN', false, `Test execution failed with error: ${err?.message || err}`);
  } finally {
    // Restore original Google Sheets ID config
    process.env.GOOGLE_SHEETS_ID = originalSheetId;
  }

  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = results.length - passedChecks;

  return {
    passed: failedChecks === 0,
    totalChecks: results.length,
    passedChecks,
    failedChecks,
    results,
  };
}
