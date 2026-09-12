/**
 * BURRA PARIKSHA CMS - Phase 13.5 Test Suite
 * Publishing UI + Final Integration Verification
 */

import { publishingService } from '../lib/services/publishing.service';
import { SocialReviewService } from '../lib/services/social-review.service';
import { ProductionAssetValidationService } from '../lib/services/production-asset-validation.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { publishingRepository } from '../lib/repositories/publishing.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { assignmentsRepository } from '../lib/repositories/assignments.repository';
import { usersRepository } from '../lib/repositories/users.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { workflowRepository } from '../lib/repositories/workflow.repository';
import {
  UserRole,
  SocialPublishStatus,
  VideoProductionStatus,
  QuestionValidationStatus,
  QuestionStatus,
  SocialReviewStatus,
  SocialQualityStatus,
  DifficultyLevel,
  QuestionLanguage,
  PriorityLevel,
  Video,
  Publishing,
  Question,
  Thumbnail,
  PinnedComment,
  User,
  Assignment,
  AssignmentEntityType,
  AssignmentStatus,
  CanonicalProductionReadiness,
} from '../types';
import {
  ValidationError,
  AuthorizationError,
} from '../lib/google-sheets/errors';

export async function runPhase13Step5Tests() {
  process.env.GOOGLE_SPREADSHEET_ID = '';
  (publishingRepository as any).client.isConfigured = () => false;
  (videosRepository as any).client.isConfigured = () => false;
  (questionsRepository as any).client.isConfigured = () => false;
  (thumbnailsRepository as any).client.isConfigured = () => false;
  (pinnedCommentsRepository as any).client.isConfigured = () => false;
  (socialReviewsRepository as any).client.isConfigured = () => false;
  (scriptsRepository as any).client.isConfigured = () => false;
  (assignmentsRepository as any).client.isConfigured = () => false;
  (usersRepository as any).client.isConfigured = () => false;
  (auditLogRepository as any).client.isConfigured = () => false;
  (workflowRepository as any).client.isConfigured = () => false;

  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS — PHASE 13.5 TEST SUITE');
  console.log('Publishing UI + Final Integration Verification');
  console.log('====================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failedTests++;
    }
  }

  // Actors
  const adminActor = { id: 'usr-admin-01', name: 'Super Admin', role: UserRole.ADMIN };
  const pubManagerActor = { id: 'usr-pubmgr-01', name: 'Publishing Manager', role: UserRole.PUBLISHING_MANAGER };
  const contentMgrActor = { id: 'usr-cntmgr-01', name: 'Content Manager', role: UserRole.CONTENT_MANAGER };
  const unauthorizedActor = { id: 'usr-editor-01', name: 'Question Editor', role: UserRole.QUESTION_EDITOR };

  const testVideoId = 'vid-phase13-5-test';
  const testQuestionId = 'q-phase13-5-test';
  const testPubId = 'pub-phase13-5-test';

  // In-memory repositories
  let mockVideos: Record<string, Video> = {};
  let mockPublishings: Record<string, Publishing> = {};
  let mockQuestions: Record<string, Question> = {};
  let mockThumbnails: Record<string, any> = {};
  let mockPinnedComments: Record<string, any> = {};
  let mockSocialReviews: Record<string, any[]> = {};
  let mockScripts: Record<string, any> = {};
  let mockAssignments: Record<string, Assignment> = {};
  let mockUsers: Record<string, User> = {};
  let mockAuditLogs: any[] = [];
  let mockWorkflowLogs: any[] = [];

  videosRepository.findById = async (id: string) => mockVideos[id] || null;
  videosRepository.findByQuestionId = async (qId: string) => Object.values(mockVideos).filter((v: any) => v.questionId === qId);
  videosRepository.findAll = async () => Object.values(mockVideos);
  videosRepository.updateRecord = async (id: string, updates: any) => {
    if (mockVideos[id]) {
      mockVideos[id] = { ...mockVideos[id], ...updates };
      return mockVideos[id];
    }
    return null as any;
  };
  videosRepository.update = videosRepository.updateRecord;

  publishingRepository.findByVideoId = async (vId: string) =>
    Object.values(mockPublishings).find((p) => p.videoId === vId) || null;
  publishingRepository.findById = async (id: string) => mockPublishings[id] || null;
  publishingRepository.findAll = async () => Object.values(mockPublishings);
  publishingRepository.appendRecord = async (record: any) => {
    mockPublishings[record.id] = record;
    return record;
  };
  publishingRepository.updateRecord = async (id: string, updates: any) => {
    if (mockPublishings[id]) {
      mockPublishings[id] = { ...mockPublishings[id], ...updates };
      return mockPublishings[id];
    }
    return null as any;
  };
  publishingRepository.update = publishingRepository.updateRecord;

  questionsRepository.findById = async (qId: string) => mockQuestions[qId] || null;
  thumbnailsRepository.findByVideoId = async (vId: string) => mockThumbnails[vId] || null;
  pinnedCommentsRepository.findByVideoId = async (vId: string) => mockPinnedComments[vId] || null;
  socialReviewsRepository.findByQuestion = async (qId: string) => mockSocialReviews[qId] || [];
  socialReviewsRepository.findById = async (id: string) => {
    for (const list of Object.values(mockSocialReviews)) {
      const found = list.find((r) => r.id === id);
      if (found) return found;
    }
    return null;
  };

  scriptsRepository.findByVideoId = async (vId: string) =>
    Object.values(mockScripts).find((s: any) => s.videoId === vId) || null;
  (scriptsRepository as any).findByQuestionId = async (qId: string) => mockScripts[qId] || null;

  assignmentsRepository.findAll = async () => Object.values(mockAssignments);
  assignmentsRepository.findById = async (id: string) => mockAssignments[id] || null;
  assignmentsRepository.findByEntity = async (entityType: string, entityId: string) => {
    return Object.values(mockAssignments).filter((a) => {
      if (a.entityType === entityType && a.entityId === entityId) return true;
      if (entityType === 'PUBLISHING' && (a.videoId === entityId || a.entityId === entityId)) return true;
      return false;
    });
  };
  assignmentsRepository.findActiveByEntity = async (entityType: string, entityId: string) => {
    const all = await assignmentsRepository.findByEntity(entityType, entityId);
    return all.filter((a) => a.status === AssignmentStatus.ASSIGNED || a.status === AssignmentStatus.IN_PROGRESS);
  };
  assignmentsRepository.appendRecord = async (rec: Assignment) => {
    mockAssignments[rec.id] = rec;
    return rec;
  };
  assignmentsRepository.update = async (id: string, updates: any) => {
    if (mockAssignments[id]) {
      mockAssignments[id] = { ...mockAssignments[id], ...updates };
      return mockAssignments[id];
    }
    return null as any;
  };

  usersRepository.findById = async (id: string) => mockUsers[id] || null;
  usersRepository.findAll = async () => Object.values(mockUsers);

  auditLogRepository.logAction = async (actorId: string, actorName: string, action: string, entityType: string, entityId: string, details?: any) => {
    const entry = { id: `AUD-${Date.now()}`, actorId, actorName, action, entityType, entityId, details, changes: details, timestamp: new Date().toISOString() };
    mockAuditLogs.push(entry);
    return entry as any;
  };
  workflowRepository.appendRecord = async (record: any) => {
    mockWorkflowLogs.push(record);
    return record;
  };

  // Seed question
  mockQuestions[testQuestionId] = {
    id: testQuestionId,
    categoryId: 'CAT-MATH',
    categoryName: 'Speed Math',
    topicId: 'TOP-PERCENT',
    topicName: 'Percentages',
    subtopicId: 'SUB-TRICKS',
    subtopicName: 'Mental Tricks',
    difficulty: DifficultyLevel.MEDIUM,
    questionText: 'What is the speed trick for 25% of 400?',
    options: [
      { identifier: 'A', text: '100' },
      { identifier: 'B', text: '200' },
      { identifier: 'C', text: '300' },
      { identifier: 'D', text: '400' },
    ] as any,
    correctAnswer: 'A',
    explanation: '25% of 400 is 100.',
    status: QuestionStatus.APPROVED,
    validationStatus: QuestionValidationStatus.VALID,
    language: QuestionLanguage.TELUGU,
    videoStatus: VideoProductionStatus.READY_TO_UPLOAD,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Seed video with compliant render metadata
  mockVideos[testVideoId] = {
    id: testVideoId,
    questionId: testQuestionId,
    title: 'Burra Speed Trick | 25% Shortcut',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    driveFileId: 'drive-file-135',
    priority: PriorityLevel.HIGH,
    finalRenderPath: 'gs://renders/vid-phase13-5-test.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'mp4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Seed thumbnail (status: APPROVED)
  mockThumbnails[testVideoId] = {
    id: 'THM-135',
    videoId: testVideoId,
    questionId: testQuestionId,
    hookHeadline: '25% Shortcut',
    status: 'APPROVED',
    isApproved: true,
    currentVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Seed pinned comment
  mockPinnedComments[testVideoId] = {
    id: 'PIN-135',
    videoId: testVideoId,
    commentText: 'Comment your answer before watching the solution! A, B, C or D?',
    solutionBreakdown: '25% = 1/4th. 400 / 4 = 100.',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Seed script with multiPlatformAdaptations and qualityAssessment
  mockScripts[testQuestionId] = {
    id: 'SCR-135',
    questionId: testQuestionId,
    videoId: testVideoId,
    hookText: 'Watch this 5-second trick!',
    problemStatement: 'What is 25% of 400?',
    stepByStepSolution: '25% = 1/4th. 400 / 4 = 100.',
    selectedHookId: 'H1',
    spokenLanguage: 'TELUGU',
    status: 'APPROVED',
    scriptDraft: {
      hook: { id: 'H1', style: 'CURIOSITY', text: 'Watch this 5-second trick!', spokenTeluguText: 'Watch this 5-second trick!', onScreenOverlayText: '25% Shortcut' },
      teleprompterScript: 'Full teleprompter script for 25% shortcut',
      canonicalMetadata: {
        shortTitle: 'Burra Speed Trick | Math',
        socialCaption: 'Learn this quick speed trick for competitive exams!',
        extendedDescription: 'Full breakdown of speed math tricks for APPSC and TSPSC.',
        hashtags: ['#BurraPariksha', '#MathShortcuts', '#TeluguMath'],
        keywords: ['Math', 'Shortcut', 'Telugu'],
        cta: { primaryText: 'Comment your answer below!', pinnedCommentPrompt: 'A, B, C or D?' },
      },
      multiPlatformAdaptations: {
        variants: {
          youtube: {
            title: 'YouTube Shorts: 25% Speed Trick',
            caption: 'YouTube Shorts Caption for 25% speed trick',
            hashtags: ['#Shorts', '#MathShortcuts'],
            overlayText: 'Overlay YT',
            pinnedComment: 'YouTube Pinned Comment: Answer is A',
          },
          instagram: {
            title: 'Insta Reel: 25% Speed Trick',
            caption: 'Instagram Reel Caption for 25% speed trick',
            hashtags: ['#Reels', '#TeluguReels'],
            overlayText: 'Overlay IG',
            pinnedComment: 'Instagram Pinned Comment: Answer is A',
          },
          facebook: {
            title: 'FB Video: 25% Speed Trick',
            caption: 'Facebook Video Caption for 25% speed trick',
            hashtags: ['#FacebookVideo', '#Math'],
            overlayText: 'Overlay FB',
            pinnedComment: 'Facebook Pinned Comment: Answer is A',
          },
        },
      },
      qualityAssessment: { overallScore: 95, status: 'PASSED', blockingFindingsCount: 0 },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const question = mockQuestions[testQuestionId];
  const bundle = await SocialReviewService.getReviewPackageBundle(testQuestionId, question);

  // Seed social review record
  mockSocialReviews[testQuestionId] = [{
    id: 'REV-135',
    questionId: testQuestionId,
    decision: SocialReviewStatus.APPROVED,
    reviewedVersionHash: bundle.currentVersionHash,
    reviewerId: adminActor.id,
    reviewerName: adminActor.name,
    reviewerRole: adminActor.role,
    overallQualityScoreAtReview: 95,
    qualityStatusAtReview: SocialQualityStatus.EXCELLENT,
    reviewedAt: new Date().toISOString(),
  }];

  // Seed publishing record
  mockPublishings[testPubId] = {
    id: testPubId,
    videoId: testVideoId,
    videoTitle: mockVideos[testVideoId].title,
    questionId: testQuestionId,
    finalVideoStatus: 'VERIFIED',
    thumbnailReady: true,
    pinnedCommentReady: true,
    youtube: {
      status: SocialPublishStatus.NOT_STARTED,
    },
    instagram: {
      status: SocialPublishStatus.NOT_STARTED,
    },
    facebook: {
      status: SocialPublishStatus.NOT_STARTED,
    },
    completedPlatformsCount: 0,
    totalPlatformsCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockUsers[adminActor.id] = { id: adminActor.id, name: adminActor.name, email: 'admin@example.com', role: adminActor.role, isActive: true, createdAt: '', updatedAt: '' };
  mockUsers[pubManagerActor.id] = { id: pubManagerActor.id, name: pubManagerActor.name, email: 'pubmgr@example.com', role: pubManagerActor.role, isActive: true, createdAt: '', updatedAt: '' };
  mockUsers[contentMgrActor.id] = { id: contentMgrActor.id, name: contentMgrActor.name, email: 'cntmgr@example.com', role: contentMgrActor.role, isActive: true, createdAt: '', updatedAt: '' };
  mockUsers[unauthorizedActor.id] = { id: unauthorizedActor.id, name: unauthorizedActor.name, email: 'editor@example.com', role: unauthorizedActor.role, isActive: true, createdAt: '', updatedAt: '' };

  // =========================================================================
  // Section 1: Publishing Data Loading & Initial State Representation
  // =========================================================================
  console.log('--- Section 1: Publishing Data Loading & State Representation ---');

  const loadedPubs = await publishingRepository.findAll();
  assert(loadedPubs.length > 0 && loadedPubs.some(p => p.videoId === testVideoId), '1. Publishing records loaded successfully from repository');

  const loadedVideo = await videosRepository.findById(testVideoId);
  assert(loadedVideo?.status === VideoProductionStatus.READY_TO_UPLOAD, '2. Video production status (READY_TO_UPLOAD) correctly preserved');

  const readinessResult = await publishingService.validatePublishReadiness(testVideoId);
  assert(readinessResult.isReady === true, '3. Gate D publish readiness evaluates to TRUE for compliant video');

  const canonicalReadiness = ProductionAssetValidationService.determineReadiness(mockVideos[testVideoId], readinessResult);
  assert(canonicalReadiness === CanonicalProductionReadiness.READY_FOR_PUBLISHING, '4. Canonical production readiness correctly evaluates to READY_FOR_PUBLISHING');

  const editingVideo = { ...mockVideos[testVideoId], status: VideoProductionStatus.EDITING };
  const editingReadiness = ProductionAssetValidationService.determineReadiness(editingVideo, { isReady: false });
  assert(editingReadiness === CanonicalProductionReadiness.RENDER_VALID_BUT_EDITING, '5. Canonical production readiness for EDITING video evaluates to RENDER_VALID_BUT_EDITING');

  // =========================================================================
  // Section 2: Multi-Platform Status Representation
  // =========================================================================
  console.log('--- Section 2: Multi-Platform Status Representation ---');

  const initialRecord = await publishingRepository.findById(testPubId);
  assert(initialRecord?.youtube.status === SocialPublishStatus.NOT_STARTED, '6. YouTube platform initially in NOT_STARTED status');
  assert(initialRecord?.instagram.status === SocialPublishStatus.NOT_STARTED, '7. Instagram platform initially in NOT_STARTED status');
  assert(initialRecord?.facebook.status === SocialPublishStatus.NOT_STARTED, '8. Facebook platform initially in NOT_STARTED status');

  // =========================================================================
  // Section 3: Publishing Worker Assignment Representation
  // =========================================================================
  console.log('--- Section 3: Publishing Worker Assignment Representation ---');

  const createdAssignment = await publishingService.createPublishingAssignment(
    testVideoId,
    {
      assigneeId: pubManagerActor.id,
      platform: 'youtube',
      priority: PriorityLevel.HIGH,
      notes: 'Please verify Telugu tags before scheduling',
    },
    adminActor
  );

  assert(Boolean(createdAssignment && createdAssignment.id), '9. Publishing assignment created successfully by authorized actor');
  assert(createdAssignment.assigneeId === pubManagerActor.id, '10. Assignee ID matches assigned publishing manager');
  assert(createdAssignment.assigneeName === pubManagerActor.name, '11. Assignee name resolved correctly on assignment');
  assert(createdAssignment.platform === 'youtube', '12. Platform scope correctly set to youtube');
  assert(createdAssignment.entityType === AssignmentEntityType.PUBLISHING, '13. AssignmentEntityType is strictly PUBLISHING');
  assert(createdAssignment.entityId === testPubId, '13b. Assignment entityId matches canonical publishing record ID');
  assert(createdAssignment.videoId === testVideoId, '13c. Assignment videoId matches target video ID');
  assert(createdAssignment.status === AssignmentStatus.ASSIGNED, '14. Assignment status is initially ASSIGNED');

  // Assignment isolation checks
  const postAssignPub = await publishingRepository.findById(testPubId);
  assert(postAssignPub?.youtube.status === SocialPublishStatus.NOT_STARTED, '15. Assignment creation leaves YouTube SocialPublishStatus independent (still NOT_STARTED)');
  const postAssignVideo = await videosRepository.findById(testVideoId);
  assert(postAssignVideo?.status === VideoProductionStatus.READY_TO_UPLOAD, '16. Assignment creation leaves VideoProductionStatus independent (still READY_TO_UPLOAD)');

  // =========================================================================
  // Section 4: Package Copier Integration & Immutability
  // =========================================================================
  console.log('--- Section 4: Package Copier Integration & Immutability ---');

  const ytProjection = await publishingService.getPlatformPackage(testVideoId, 'youtube', adminActor);
  assert(ytProjection.isApprovedPackage === true, '17. Package projection indicates approved review status');
  assert(Boolean(ytProjection.title && ytProjection.caption && ytProjection.hashtags.length > 0), '18. Projected package contains full payload (title, caption, hashtags)');
  assert(ytProjection.versionHash === bundle.currentVersionHash, '19. Package projection preserves approved security fingerprint');

  // Verify social review record in repository was not modified by projection read
  const unmodifiedSr = mockSocialReviews[testQuestionId][0];
  assert(unmodifiedSr?.decision === SocialReviewStatus.APPROVED, '20. SocialReview status remains strictly APPROVED and unmodified by projection');

  // =========================================================================
  // Section 5: Scheduling & Validation via Canonical Backend
  // =========================================================================
  console.log('--- Section 5: Scheduling & Validation via Canonical Backend ---');

  const futureScheduleDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const scheduledPub = await publishingService.schedulePublishing(
    testVideoId,
    'youtube',
    futureScheduleDate,
    pubManagerActor
  );

  assert(scheduledPub.youtube.status === SocialPublishStatus.SCHEDULED, '21. YouTube platform status transitions to SCHEDULED');
  assert(scheduledPub.youtube.scheduledAt === futureScheduleDate, '22. ScheduledAt preserves authoritative UTC ISO string');

  // Validation: past date rejected
  let pastDateRejected = false;
  try {
    const pastScheduleDate = new Date(Date.now() - 3600 * 1000).toISOString();
    await publishingService.schedulePublishing(testVideoId, 'instagram', pastScheduleDate, pubManagerActor);
  } catch (err: any) {
    pastDateRejected = err instanceof ValidationError;
  }
  assert(pastDateRejected, '23. Past scheduled date strictly rejected with ValidationError');

  // Validation: invalid platform name rejected
  let invalidPlatformRejected = false;
  try {
    await publishingService.schedulePublishing(testVideoId, 'tiktok' as any, futureScheduleDate, pubManagerActor);
  } catch (err: any) {
    invalidPlatformRejected = err instanceof ValidationError;
  }
  assert(invalidPlatformRejected, '24. Invalid platform name strictly rejected with ValidationError');

  // =========================================================================
  // Section 6: Failure & Retry Orchestration
  // =========================================================================
  console.log('--- Section 6: Failure & Retry Orchestration ---');

  const failedPub = await publishingService.markPlatformFailed(
    testVideoId,
    'youtube',
    'External upload failed: YouTube Shorts quota exceeded',
    pubManagerActor
  );

  assert(failedPub.youtube.status === SocialPublishStatus.FAILED, '25. Platform marked as FAILED');
  assert(failedPub.youtube.lastFailureReason === 'External upload failed: YouTube Shorts quota exceeded', '26. Last failure reason accurately recorded');
  assert(Boolean(failedPub.youtube.failedAt), '27. Failure timestamp recorded');

  // Immediate Retry (resets to DRAFT and increments retry count)
  const retriedPub = await publishingService.retryPublishing(
    testVideoId,
    'youtube',
    { remarks: 'Retrying after quota reset' },
    pubManagerActor
  );

  assert(retriedPub.youtube.status === SocialPublishStatus.DRAFT, '28. Immediate retry resets status to DRAFT');
  assert((retriedPub.youtube.retryCount || 0) === 1, '29. Retry count incremented to 1');

  // Mark failed again for reschedule test
  await publishingService.markPlatformFailed(testVideoId, 'youtube', 'Rate limited on retry', pubManagerActor);

  // Reschedule Retry
  const newScheduleDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  const rescheduledPub = await publishingService.retryPublishing(
    testVideoId,
    'youtube',
    { scheduledAt: newScheduleDate, remarks: 'Rescheduled for prime time' },
    pubManagerActor
  );

  assert(rescheduledPub.youtube.status === SocialPublishStatus.SCHEDULED, '30. Rescheduling retry sets platform status to SCHEDULED');
  assert(rescheduledPub.youtube.scheduledAt === newScheduleDate, '31. Rescheduled retry stores new UTC scheduledAt');
  assert((rescheduledPub.youtube.retryCount || 0) === 2, '32. Retry count incremented to 2');

  // =========================================================================
  // Section 7: Manual Publication & Live URL Recording
  // =========================================================================
  console.log('--- Section 7: Manual Publication & Live URL Recording ---');

  const ytLiveUrl = 'https://youtube.com/shorts/test135abc';
  const pubWithYt = await publishingService.markPlatformPublished(
    testVideoId,
    'youtube',
    ytLiveUrl,
    pubManagerActor
  );

  assert(pubWithYt.youtube.status === SocialPublishStatus.PUBLISHED, '33. YouTube platform status transitions to PUBLISHED');
  assert(pubWithYt.youtube.videoUrl === ytLiveUrl, '34. YouTube live URL recorded accurately');
  assert(Boolean(pubWithYt.youtube.publishedAt), '35. PublishedAt timestamp recorded');
  assert(pubWithYt.completedPlatformsCount === 1, '36. CompletedPlatformsCount incremented to 1');

  // Published platform cannot be retried
  let publishedRetryBlocked = false;
  try {
    await publishingService.retryPublishing(testVideoId, 'youtube', undefined, pubManagerActor);
  } catch (err: any) {
    publishedRetryBlocked = err instanceof ValidationError;
  }
  assert(publishedRetryBlocked, '37. PUBLISHED platform cannot be retried (rejected with ValidationError)');

  // Invalid URL domain rejected
  let invalidDomainRejected = false;
  try {
    await publishingService.markPlatformPublished(testVideoId, 'instagram', 'https://vimeo.com/123456', pubManagerActor);
  } catch (err: any) {
    invalidDomainRejected = err instanceof ValidationError;
  }
  assert(invalidDomainRejected, '38. Invalid platform domain URL strictly rejected with ValidationError');

  // Record Instagram publication with valid URL
  const igLiveUrl = 'https://instagram.com/reel/test135reel';
  const pubWithIg = await publishingService.markPlatformPublished(
    testVideoId,
    'instagram',
    igLiveUrl,
    pubManagerActor
  );
  assert(pubWithIg.instagram.status === SocialPublishStatus.PUBLISHED, '39. Instagram platform recorded as PUBLISHED');
  assert(pubWithIg.completedPlatformsCount === 2, '40. CompletedPlatformsCount incremented to 2');

  // Duplicate URL across different video rejected
  const otherVideoId = 'vid-other-135';
  mockVideos[otherVideoId] = {
    ...mockVideos[testVideoId],
    id: otherVideoId,
    status: VideoProductionStatus.READY_TO_UPLOAD,
  };
  mockPublishings['pub-other-135'] = {
    ...mockPublishings[testPubId],
    id: 'pub-other-135',
    videoId: otherVideoId,
    youtube: { status: SocialPublishStatus.NOT_STARTED },
    instagram: { status: SocialPublishStatus.NOT_STARTED },
    facebook: { status: SocialPublishStatus.NOT_STARTED },
    completedPlatformsCount: 0,
  };

  let duplicateUrlRejected = false;
  try {
    await publishingService.markPlatformPublished(otherVideoId, 'youtube', ytLiveUrl, pubManagerActor);
  } catch (err: any) {
    duplicateUrlRejected = err instanceof ValidationError;
  }
  assert(duplicateUrlRejected, '41. Duplicate public URL across different videos strictly rejected');

  // =========================================================================
  // Section 8: Finalization Rules & Status Isolation
  // =========================================================================
  console.log('--- Section 8: Finalization Rules & Status Isolation ---');

  // Test 42: Finalizing video with 0/3 published platforms is strictly rejected
  let zeroPublishedFinalizeBlocked = false;
  try {
    await publishingService.finalizePublishing(otherVideoId, adminActor);
  } catch (err: any) {
    zeroPublishedFinalizeBlocked = err instanceof ValidationError && err.message.includes('All configured target platforms must be PUBLISHED');
  }
  assert(zeroPublishedFinalizeBlocked, '42. Finalizing video with 0/3 published platforms strictly rejected');

  // Test 43: Finalizing video with 1/3 published platforms is strictly rejected
  const test1of3VideoId = 'vid-1of3-135';
  mockVideos[test1of3VideoId] = {
    ...mockVideos[testVideoId],
    id: test1of3VideoId,
    status: VideoProductionStatus.READY_TO_UPLOAD,
  };
  mockPublishings['pub-1of3-135'] = {
    ...mockPublishings[testPubId],
    id: 'pub-1of3-135',
    videoId: test1of3VideoId,
    youtube: { status: SocialPublishStatus.PUBLISHED, videoUrl: 'https://youtube.com/shorts/test1of3' },
    instagram: { status: SocialPublishStatus.NOT_STARTED },
    facebook: { status: SocialPublishStatus.NOT_STARTED },
    completedPlatformsCount: 1,
    totalPlatformsCount: 3,
  };

  let onePublishedFinalizeBlocked = false;
  try {
    await publishingService.finalizePublishing(test1of3VideoId, adminActor);
  } catch (err: any) {
    onePublishedFinalizeBlocked = err instanceof ValidationError && err.message.includes('All configured target platforms must be PUBLISHED (1/3 published)');
  }
  assert(onePublishedFinalizeBlocked, '43. Finalizing video with 1/3 published platforms strictly rejected');

  // Test 44: Finalizing video with 2/3 published platforms (testVideoId: YouTube + Instagram published, Facebook NOT_STARTED) is strictly rejected
  let twoPublishedFinalizeBlocked = false;
  try {
    await publishingService.finalizePublishing(testVideoId, adminActor);
  } catch (err: any) {
    twoPublishedFinalizeBlocked = err instanceof ValidationError && err.message.includes('All configured target platforms must be PUBLISHED (2/3 published)');
  }
  assert(twoPublishedFinalizeBlocked, '44. Finalizing video with 2/3 published platforms strictly rejected');

  // Publish remaining 3rd platform (Facebook) on testVideoId
  const fbLiveUrl = 'https://facebook.com/watch/test135abc';
  const pubWithFb = await publishingService.markPlatformPublished(
    testVideoId,
    'facebook',
    fbLiveUrl,
    pubManagerActor,
    'Facebook video distribution completed'
  );
  assert(pubWithFb.facebook.status === SocialPublishStatus.PUBLISHED, '45. Facebook platform recorded as PUBLISHED');
  assert(pubWithFb.completedPlatformsCount === 3, '46. CompletedPlatformsCount reaches 3/3');

  // Verify VideoProductionStatus is STILL READY_TO_UPLOAD (3/3 PUBLISHED does NOT auto-advance video)
  const videoBeforeFinalize = await videosRepository.findById(testVideoId);
  assert(
    videoBeforeFinalize?.status === VideoProductionStatus.READY_TO_UPLOAD,
    '46b. 3/3 platforms PUBLISHED does NOT automatically transition VideoProductionStatus (still READY_TO_UPLOAD)'
  );

  // Test 47: Finalize video publishing now succeeds with all 3/3 platforms published
  const finalizeResult = await publishingService.finalizePublishing(
    testVideoId,
    adminActor,
    'All primary distribution channels verified live'
  );

  assert(finalizeResult.video.status === VideoProductionStatus.UPLOADED, '47. Finalization transitions VideoProductionStatus to UPLOADED when all 3 platforms published');
  assert(finalizeResult.publishing.youtube.status === SocialPublishStatus.PUBLISHED, '48. YouTube SocialPublishStatus preserved after finalization');
  assert(finalizeResult.publishing.instagram.status === SocialPublishStatus.PUBLISHED, '49. Instagram SocialPublishStatus preserved after finalization');
  assert(finalizeResult.publishing.facebook.status === SocialPublishStatus.PUBLISHED, '50. Facebook SocialPublishStatus preserved after finalization');

  // =========================================================================
  // Section 9: RBAC & Human-in-the-Loop Integrity
  // =========================================================================
  console.log('--- Section 9: RBAC & Human-In-The-Loop Integrity ---');

  // Unauthorized mutation rejected
  let unauthorizedMutationBlocked = false;
  try {
    await publishingService.schedulePublishing(otherVideoId, 'facebook', futureScheduleDate, unauthorizedActor);
  } catch (err: any) {
    unauthorizedMutationBlocked = err instanceof AuthorizationError;
  }
  assert(unauthorizedMutationBlocked, '51. Unauthorized actor strictly blocked from scheduling publishing');

  // Verify human-in-the-loop: no automated network calls occurred, Facebook on other video remains NOT_STARTED
  const finalCheckOtherPub = await publishingRepository.findById('pub-other-135');
  assert(finalCheckOtherPub?.facebook.status === SocialPublishStatus.NOT_STARTED, '52. Human-in-the-loop integrity verified: other video Facebook not auto-published');
  assert(finalCheckOtherPub?.facebook.postUrl === undefined, '53. Other video Facebook post URL remains undefined without manual operator input');

  console.log('\n====================================================');
  console.log(`PHASE 13.5 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

// Run test suite if executed directly
if (process.argv[1]?.includes('phase13-step5-publishing-integration')) {
  runPhase13Step5Tests().catch((err) => {
    console.error('Fatal test error in Phase 13.5:', err);
    process.exit(1);
  });
}
