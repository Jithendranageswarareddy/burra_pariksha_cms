/**
 * BURRA PARIKSHA CMS - Phase 13.4 Test Suite
 * Publishing Assignments Verification
 */

import { publishingService } from '../lib/services/publishing.service';
import { SocialReviewService } from '../lib/services/social-review.service';
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
import { idService } from '../lib/services/id.service';
import {
  UserRole,
  SocialPublishStatus,
  VideoProductionStatus,
  QuestionValidationStatus,
  QuestionStatus,
  SocialReviewStatus,
  DifficultyLevel,
  QuestionLanguage,
  PriorityLevel,
  Video,
  Publishing,
  Question,
  Thumbnail,
  PinnedComment,
  SocialReviewRecord,
  User,
  Assignment,
  AssignmentEntityType,
  AssignmentStatus,
  AssignmentTaskType,
} from '../types';
import {
  ValidationError,
  AuthorizationError,
  ReferenceIntegrityError,
} from '../lib/google-sheets/errors';

export async function runPhase13Step4Tests() {
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
  console.log('BURRA PARIKSHA CMS — PHASE 13.4 TEST SUITE');
  console.log('Publishing Assignments Verification');
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
  const adminActor = { id: 'USR-ADMIN', name: 'Admin User', role: UserRole.ADMIN };
  const pubMgrActor = { id: 'USR-PUBMGR', name: 'Publishing Manager', role: UserRole.PUBLISHING_MANAGER };
  const contentMgrActor = { id: 'USR-CNTMGR', name: 'Content Manager', role: UserRole.CONTENT_MANAGER };
  const editorActor = { id: 'USR-EDITOR', name: 'Question Editor', role: UserRole.QUESTION_EDITOR };
  const videoEditorActor = { id: 'USR-VIDEDIT', name: 'Video Editor', role: UserRole.VIDEO_EDITOR };

  // Mock in-memory stores
  let mockVideos: Record<string, Video> = {};
  let mockPublishings: Record<string, Publishing> = {};
  let mockQuestions: Record<string, Question> = {};
  let mockThumbnails: Record<string, Thumbnail> = {};
  let mockPinnedComments: Record<string, any> = {};
  let mockSocialReviews: Record<string, any[]> = {};
  let mockScripts: Record<string, any> = {};
  let mockAssignments: Record<string, Assignment> = {};
  let mockUsers: Record<string, User> = {};
  let mockAuditLogs: any[] = [];
  let mockWorkflowLogs: any[] = [];
  let nextAssignmentSeq = 1;

  function resetMocks() {
    mockVideos = {};
    mockPublishings = {};
    mockQuestions = {};
    mockThumbnails = {};
    mockPinnedComments = {};
    mockSocialReviews = {};
    mockScripts = {};
    mockAssignments = {};
    mockUsers = {};
    mockAuditLogs = [];
    mockWorkflowLogs = [];
    nextAssignmentSeq = 1;

    videosRepository.findById = async (id: string) => mockVideos[id] || null;
    videosRepository.update = async (id: string, updates: any) => {
      if (mockVideos[id]) {
        mockVideos[id] = { ...mockVideos[id], ...updates };
        return mockVideos[id];
      }
      return null as any;
    };

    publishingRepository.findByVideoId = async (vId: string) =>
      Object.values(mockPublishings).find((p) => p.videoId === vId) || null;
    publishingRepository.findById = async (id: string) => mockPublishings[id] || null;
    publishingRepository.appendRecord = async (record: any) => {
      mockPublishings[record.id] = record;
      return record;
    };
    publishingRepository.update = async (id: string, updates: any) => {
      if (mockPublishings[id]) {
        mockPublishings[id] = { ...mockPublishings[id], ...updates };
        return mockPublishings[id];
      }
      return null as any;
    };

    questionsRepository.findById = async (qId: string) => mockQuestions[qId] || null;
    thumbnailsRepository.findByVideoId = async (vId: string) => mockThumbnails[vId] || null;
    pinnedCommentsRepository.findByVideoId = async (vId: string) => mockPinnedComments[vId] || null;
    socialReviewsRepository.findByQuestion = async (qId: string) => mockSocialReviews[qId] || [];

    scriptsRepository.findByVideoId = async (vId: string) =>
      Object.values(mockScripts).find((s: any) => s.videoId === vId) || null;
    (scriptsRepository as any).findByQuestionId = async (qId: string) => mockScripts[qId] || null;

    // Assignments repository mocks
    assignmentsRepository.findAll = async () => Object.values(mockAssignments);
    assignmentsRepository.findById = async (id: string) => mockAssignments[id] || null;
    assignmentsRepository.findByEntity = async (entityType: string, entityId: string) => {
      return Object.values(mockAssignments).filter((a) => {
        if (a.entityType === entityType && a.entityId === entityId) return true;
        if (entityType === 'VIDEO' && a.videoId === entityId) return true;
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

    // Users repository mocks
    usersRepository.findById = async (id: string) => mockUsers[id] || null;

    // Audit & Workflow mocks
    auditLogRepository.logAction = async (actorId: string, actorName: string, action: string, entityType: string, entityId: string, details?: any) => {
      const entry = { id: `AUD-${Date.now()}`, actorId, actorName, action, entityType, entityId, details, changes: details, timestamp: new Date().toISOString() };
      mockAuditLogs.push(entry);
      return entry as any;
    };
    workflowRepository.appendRecord = async (record: any) => {
      mockWorkflowLogs.push(record);
      return record;
    };

    // Sequence allocation
    idService.allocateAssignmentId = async () => {
      const id = `BP-ASN-${String(nextAssignmentSeq++).padStart(6, '0')}`;
      return id;
    };

    // Pre-populate users
    mockUsers['USR-ADMIN'] = {
      id: 'USR-ADMIN',
      name: 'Admin User',
      email: 'admin@burrapariksha.com',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    mockUsers['USR-PUBMGR'] = {
      id: 'USR-PUBMGR',
      name: 'Publishing Manager',
      email: 'pubmgr@burrapariksha.com',
      role: UserRole.PUBLISHING_MANAGER,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    mockUsers['USR-CNTMGR'] = {
      id: 'USR-CNTMGR',
      name: 'Content Manager',
      email: 'cntmgr@burrapariksha.com',
      role: UserRole.CONTENT_MANAGER,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    mockUsers['USR-EDITOR'] = {
      id: 'USR-EDITOR',
      name: 'Question Editor',
      email: 'editor@burrapariksha.com',
      role: UserRole.QUESTION_EDITOR,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    mockUsers['USR-INACTIVE-PUB'] = {
      id: 'USR-INACTIVE-PUB',
      name: 'Inactive Publisher',
      email: 'inactive@burrapariksha.com',
      role: UserRole.PUBLISHING_MANAGER,
      isActive: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
  }

  // Seed valid ready video passing Gate D
  async function seedGateDReadyVideo(videoId = 'BP-V-999001', questionId = 'BP-Q-999001') {
    const question: Question = {
      id: questionId,
      categoryId: 'CAT-MATH',
      categoryName: 'Speed Math',
      topicId: 'TOP-PERCENT',
      topicName: 'Percentages',
      subtopicId: 'SUB-TRICKS',
      subtopicName: 'Mental Tricks',
      difficulty: DifficultyLevel.MEDIUM,
      questionText: 'What is 15% of 300?',
      options: [
        { identifier: 'A', text: '45' },
        { identifier: 'B', text: '50' },
        { identifier: 'C', text: '55' },
        { identifier: 'D', text: '60' },
      ],
      correctAnswer: 'A',
      explanation: '10% is 30, 5% is 15, so 30 + 15 = 45.',
      language: QuestionLanguage.TELUGU,
      status: QuestionStatus.APPROVED,
      validationStatus: QuestionValidationStatus.VALID,
      videoStatus: VideoProductionStatus.READY_TO_UPLOAD,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    mockQuestions[questionId] = question;

    const video: Video = {
      id: videoId,
      questionId,
      title: 'Quick Math: 15% of 300',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      priority: PriorityLevel.HIGH,
      finalRenderPath: 'https://storage.googleapis.com/videos/v-999001.mp4',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    mockVideos[videoId] = video;

    const thumbnail = {
      id: `THUMB-${videoId}`,
      videoId,
      driveFileId: 'DRIVE-THUMB-001',
      fileUrl: 'https://storage.googleapis.com/thumbnails/v-999001.png',
      status: 'APPROVED',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as any;
    mockThumbnails[videoId] = thumbnail;

    const pinnedComment = {
      id: `PIN-${videoId}`,
      videoId,
      commentText: 'Comment with your answer! Subscribe for daily mental math tricks.',
      solutionBreakdown: '10% is 30, 5% is 15, so 30 + 15 = 45.',
      status: 'APPROVED',
      isApproved: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    mockPinnedComments[videoId] = pinnedComment;

    mockScripts[questionId] = {
      id: `SCR-${videoId}`,
      questionId,
      videoId,
      selectedHookId: 'H1',
      spokenLanguage: 'TELUGU',
      status: 'APPROVED',
      scriptDraft: {
        hook: { id: 'H1', style: 'CURIOSITY', text: 'Watch this 5-second trick!', spokenTeluguText: 'Watch this 5-second trick!', onScreenOverlayText: '15% Shortcut' },
        teleprompterScript: 'Full teleprompter script for 15% shortcut',
        canonicalMetadata: {
          shortTitle: 'Burra Speed Trick | Math',
          socialCaption: 'Learn this quick speed trick for competitive exams!',
          extendedDescription: 'Full breakdown of speed math tricks for APPSC and TSPSC.',
          hashtags: ['#BurraPariksha', '#MathShortcuts', '#TeluguMath'],
          keywords: ['Math', 'Shortcut', 'Telugu'],
          cta: { primaryText: 'Comment your answer below!', pinnedCommentPrompt: 'A, B, C or D?' },
        },
        multiPlatformAdaptations: {
          isAllValid: true,
          variants: {
            youtube: {
              title: 'YouTube Shorts: 15% Speed Trick',
              caption: 'YouTube Shorts Caption for 15% speed trick',
              hashtags: ['#Shorts', '#MathShortcuts'],
              overlayText: 'Overlay YT',
              pinnedComment: 'YouTube Pinned Comment: Answer is A',
            },
            instagram: {
              title: 'Insta Reel: 15% Speed Trick',
              caption: 'Instagram Reel Caption for 15% speed trick',
              hashtags: ['#Reels', '#TeluguReels'],
              overlayText: 'Overlay IG',
              pinnedComment: 'Instagram Pinned Comment: Answer is A',
            },
            facebook: {
              title: 'FB Video: 15% Speed Trick',
              caption: 'Facebook Video Caption for 15% speed trick',
              hashtags: ['#FacebookVideo', '#Math'],
              overlayText: 'Overlay FB',
              pinnedComment: 'Facebook Pinned Comment: Answer is A',
            },
          },
        },
        qualityAssessment: { overallScore: 95, status: 'PASSED', blockingFindingsCount: 0 },
      },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    mockSocialReviews[questionId] = [{
      id: `REV-${questionId}`,
      entityType: 'QUESTION',
      entityId: questionId,
      questionId,
      decision: SocialReviewStatus.APPROVED,
      reviewStatus: SocialReviewStatus.APPROVED,
      reviewedVersionHash: 'TEMP_HASH',
      reviewerId: 'USR-PUBMGR',
      reviewerName: 'Publishing Manager',
      reviewerRole: UserRole.PUBLISHING_MANAGER,
      overallQualityScoreAtReview: 95,
      qualityStatusAtReview: 'EXCELLENT' as any,
      reviewedAt: '2026-01-02T00:00:00Z',
      checklist: {
        accuracyConfirmed: true,
        toneAppropriate: true,
        formattingCorrect: true,
        guidelinesFollowed: true,
      },
      auditTrail: [],
      createdAt: '2026-01-02T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    }];

    const bundle = await SocialReviewService.getReviewPackageBundle(questionId);
    mockSocialReviews[questionId][0].reviewedVersionHash = bundle.currentVersionHash;

    const publishing: Publishing = {
      id: `PUB-${videoId}`,
      videoId,
      questionId,
      videoTitle: video.title,
      finalVideoStatus: 'VERIFIED',
      youtube: {
        status: SocialPublishStatus.NOT_STARTED,
        scheduledAt: null,
        publishedAt: null,
        videoUrl: null,
      },
      instagram: {
        status: SocialPublishStatus.NOT_STARTED,
        scheduledAt: null,
        publishedAt: null,
        postUrl: null,
      },
      facebook: {
        status: SocialPublishStatus.NOT_STARTED,
        scheduledAt: null,
        publishedAt: null,
        postUrl: null,
      },
      pinnedCommentReady: true,
      thumbnailReady: true,
      completedPlatformsCount: 0,
      totalPlatformsCount: 3,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    mockPublishings[publishing.id] = publishing;

    return { question, video, thumbnail, pinnedComment, publishing };
  }

  // ==========================================================================
  // SECTION 1: Authorized Publishing Manager Creates Assignment for Gate D Ready Video
  // ==========================================================================
  console.log('--- Section 1: Authorized Assignment Creation (Gate D Ready) ---');
  resetMocks();
  await seedGateDReadyVideo('BP-V-101', 'BP-Q-101');

  try {
    const assignment = await publishingService.createPublishingAssignment(
      'BP-V-101',
      {
        assigneeId: 'USR-PUBMGR',
        platform: 'youtube',
        priority: PriorityLevel.HIGH,
        dueDate: '2026-09-15',
        notes: 'Publish during prime evening hours.',
      },
      pubMgrActor
    );

    assert(assignment !== null && assignment !== undefined, 'Section 1.1: Assignment record created');
    assert(assignment.id.startsWith('BP-ASN-'), 'Section 1.2: Sequence ID allocated properly', `ID: ${assignment.id}`);
    assert(assignment.entityType === AssignmentEntityType.PUBLISHING, 'Section 1.3: entityType is PUBLISHING');
    assert(assignment.entityId === 'PUB-BP-V-101', 'Section 1.4: entityId matches canonical publishing.id');
    assert(assignment.videoId === 'BP-V-101', 'Section 1.5: videoId is populated for compatibility');
    assert(assignment.taskType === AssignmentTaskType.PUBLISHING, 'Section 1.6: taskType is PUBLISHING');
    assert(assignment.assigneeId === 'USR-PUBMGR', 'Section 1.7: assigneeId matches input');
    assert(assignment.assigneeName === 'Publishing Manager', 'Section 1.8: assigneeName resolved from directory');
    assert(assignment.status === AssignmentStatus.ASSIGNED, 'Section 1.9: status is initialized to ASSIGNED');
    assert(assignment.platform === 'youtube', 'Section 1.10: platform is preserved as youtube');
    assert(assignment.priority === PriorityLevel.HIGH, 'Section 1.11: priority matches input');
    assert(assignment.dueDate === '2026-09-15', 'Section 1.12: dueDate matches input');
    assert(assignment.notes?.includes('Publish during prime evening hours.'), 'Section 1.13: notes preserved');
  } catch (err: any) {
    assert(false, 'Section 1: Expected successful assignment creation', err.message);
  }

  // ==========================================================================
  // SECTION 2: Assignment Creation Fails If Video Is NOT Gate D Ready
  // ==========================================================================
  console.log('\n--- Section 2: Gate D Blocker Enforcement ---');
  
  // 2a: Video in RECORDED status (not READY_TO_UPLOAD or UPLOADED)
  resetMocks();
  await seedGateDReadyVideo('BP-V-201', 'BP-Q-201');
  mockVideos['BP-V-201'].status = VideoProductionStatus.RECORDED;

  let failedGateDStatus = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-201',
      { assigneeId: 'USR-PUBMGR', platform: 'youtube' },
      pubMgrActor
    );
  } catch (err: any) {
    failedGateDStatus = true;
    assert(err instanceof ValidationError, 'Section 2a.1: ValidationError thrown for unrendered video');
    assert(err.message.includes('Gate D') || err.message.includes('blockers'), 'Section 2a.2: Error cites Gate D or blockers', err.message);
  }
  assert(failedGateDStatus, 'Section 2a: Creation failed when video status is RECORDED');

  // 2b: Question is not APPROVED
  resetMocks();
  await seedGateDReadyVideo('BP-V-202', 'BP-Q-202');
  mockQuestions['BP-Q-202'].status = QuestionStatus.DRAFT;

  let failedGateDQuestion = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-202',
      { assigneeId: 'USR-PUBMGR', platform: 'instagram' },
      pubMgrActor
    );
  } catch (err: any) {
    failedGateDQuestion = true;
    assert(err instanceof ValidationError, 'Section 2b.1: ValidationError thrown for unapproved question');
  }
  assert(failedGateDQuestion, 'Section 2b: Creation failed when question status is not APPROVED');

  // 2c: Social Review is REJECTED
  resetMocks();
  await seedGateDReadyVideo('BP-V-203', 'BP-Q-203');
  mockSocialReviews['BP-Q-203'][0].decision = SocialReviewStatus.REJECTED;
  mockSocialReviews['BP-Q-203'][0].reviewStatus = SocialReviewStatus.REJECTED;

  let failedGateDReview = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-203',
      { assigneeId: 'USR-PUBMGR', platform: 'facebook' },
      pubMgrActor
    );
  } catch (err: any) {
    failedGateDReview = true;
    assert(err instanceof ValidationError, 'Section 2c.1: ValidationError thrown for rejected social review');
  }
  assert(failedGateDReview, 'Section 2c: Creation failed when social review is REJECTED');

  // 2d: Missing Thumbnail
  resetMocks();
  await seedGateDReadyVideo('BP-V-204', 'BP-Q-204');
  delete mockThumbnails['BP-V-204'];

  let failedGateDThumbnail = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-204',
      { assigneeId: 'USR-PUBMGR' },
      pubMgrActor
    );
  } catch (err: any) {
    failedGateDThumbnail = true;
    assert(err instanceof ValidationError, 'Section 2d.1: ValidationError thrown for missing thumbnail');
  }
  assert(failedGateDThumbnail, 'Section 2d: Creation failed when thumbnail is missing');

  // 2e: Missing Pinned Comment
  resetMocks();
  await seedGateDReadyVideo('BP-V-205', 'BP-Q-205');
  delete mockPinnedComments['BP-V-205'];

  let failedGateDPinnedComment = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-205',
      { assigneeId: 'USR-PUBMGR' },
      pubMgrActor
    );
  } catch (err: any) {
    failedGateDPinnedComment = true;
    assert(err instanceof ValidationError, 'Section 2e.1: ValidationError thrown for missing pinned comment');
  }
  assert(failedGateDPinnedComment, 'Section 2e: Creation failed when pinned comment is missing');

  // ==========================================================================
  // SECTION 3: Assignment Creation Fails For Unauthorized Actors
  // ==========================================================================
  console.log('\n--- Section 3: Unauthorized Actor RBAC Enforcement ---');
  resetMocks();
  await seedGateDReadyVideo('BP-V-301', 'BP-Q-301');

  // 3a: Question Editor actor cannot create publishing assignment
  let failedEditorActor = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-301',
      { assigneeId: 'USR-PUBMGR', platform: 'youtube' },
      editorActor
    );
  } catch (err: any) {
    failedEditorActor = true;
    assert(err instanceof AuthorizationError, 'Section 3a.1: AuthorizationError thrown for QUESTION_EDITOR actor');
  }
  assert(failedEditorActor, 'Section 3a: QUESTION_EDITOR actor rejected');

  // 3b: Video Editor actor cannot create publishing assignment
  let failedVideoEditorActor = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-301',
      { assigneeId: 'USR-PUBMGR', platform: 'youtube' },
      videoEditorActor
    );
  } catch (err: any) {
    failedVideoEditorActor = true;
    assert(err instanceof AuthorizationError, 'Section 3b.1: AuthorizationError thrown for VIDEO_EDITOR actor');
  }
  assert(failedVideoEditorActor, 'Section 3b: VIDEO_EDITOR actor rejected');

  // 3c: Missing or empty actor cannot create publishing assignment
  let failedMissingActor = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-301',
      { assigneeId: 'USR-PUBMGR', platform: 'youtube' },
      null as any
    );
  } catch (err: any) {
    failedMissingActor = true;
    assert(err instanceof AuthorizationError, 'Section 3c.1: AuthorizationError thrown for null actor');
  }
  assert(failedMissingActor, 'Section 3c: Null actor rejected');

  // 3d: Admin and Content Manager ARE permitted
  let adminSucceeded = false;
  try {
    const a1 = await publishingService.createPublishingAssignment(
      'BP-V-301',
      { assigneeId: 'USR-PUBMGR', platform: 'youtube' },
      adminActor
    );
    adminSucceeded = !!a1;
  } catch (err: any) {
    adminSucceeded = false;
  }
  assert(adminSucceeded, 'Section 3d: ADMIN actor successfully creates assignment');

  // ==========================================================================
  // SECTION 4: Assignment Creation Fails For Invalid Assigned Worker
  // ==========================================================================
  console.log('\n--- Section 4: Invalid Assigned Worker Validation ---');
  resetMocks();
  await seedGateDReadyVideo('BP-V-401', 'BP-Q-401');

  // 4a: Non-existent assignee user
  let failedNonExistentAssignee = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-401',
      { assigneeId: 'USR-GHOST', platform: 'youtube' },
      pubMgrActor
    );
  } catch (err: any) {
    failedNonExistentAssignee = true;
    assert(err instanceof ValidationError, 'Section 4a.1: ValidationError for non-existent assignee');
    assert(err.message.includes('not found'), 'Section 4a.2: Error mentions not found', err.message);
  }
  assert(failedNonExistentAssignee, 'Section 4a: Non-existent assignee user rejected');

  // 4b: Inactive assignee user
  let failedInactiveAssignee = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-401',
      { assigneeId: 'USR-INACTIVE-PUB', platform: 'youtube' },
      pubMgrActor
    );
  } catch (err: any) {
    failedInactiveAssignee = true;
    assert(err instanceof ValidationError, 'Section 4b.1: ValidationError for inactive assignee');
    assert(err.message.includes('inactive'), 'Section 4b.2: Error mentions inactive', err.message);
  }
  assert(failedInactiveAssignee, 'Section 4b: Inactive assignee rejected');

  // 4c: Assignee has unauthorized role (e.g. QUESTION_EDITOR)
  let failedEditorAssignee = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-401',
      { assigneeId: 'USR-EDITOR', platform: 'youtube' },
      pubMgrActor
    );
  } catch (err: any) {
    failedEditorAssignee = true;
    assert(err instanceof ValidationError, 'Section 4c.1: ValidationError for worker with role QUESTION_EDITOR');
    assert(err.message.includes('role') || err.message.includes('authorized'), 'Section 4c.2: Error explains unauthorized publishing role', err.message);
  }
  assert(failedEditorAssignee, 'Section 4c: Assignee with QUESTION_EDITOR role rejected for publishing work');

  // ==========================================================================
  // SECTION 5: Exact Lowercase Platform Validation
  // ==========================================================================
  console.log('\n--- Section 5: Exact Lowercase Platform Validation ---');
  resetMocks();
  await seedGateDReadyVideo('BP-V-501', 'BP-Q-501');

  // 5a: youtube accepted
  let youtubeOk = false;
  try {
    const a = await publishingService.createPublishingAssignment(
      'BP-V-501',
      { assigneeId: 'USR-PUBMGR', platform: 'youtube' },
      pubMgrActor
    );
    youtubeOk = a.platform === 'youtube';
  } catch (e: any) {}
  assert(youtubeOk, 'Section 5a: Exact lowercase "youtube" accepted');

  // 5b: instagram accepted
  resetMocks();
  await seedGateDReadyVideo('BP-V-501', 'BP-Q-501');
  let instagramOk = false;
  try {
    const a = await publishingService.createPublishingAssignment(
      'BP-V-501',
      { assigneeId: 'USR-PUBMGR', platform: 'instagram' },
      pubMgrActor
    );
    instagramOk = a.platform === 'instagram';
  } catch (e: any) {}
  assert(instagramOk, 'Section 5b: Exact lowercase "instagram" accepted');

  // 5c: facebook accepted
  resetMocks();
  await seedGateDReadyVideo('BP-V-501', 'BP-Q-501');
  let facebookOk = false;
  try {
    const a = await publishingService.createPublishingAssignment(
      'BP-V-501',
      { assigneeId: 'USR-PUBMGR', platform: 'facebook' },
      pubMgrActor
    );
    facebookOk = a.platform === 'facebook';
  } catch (e: any) {}
  assert(facebookOk, 'Section 5c: Exact lowercase "facebook" accepted');

  // 5d: undefined/omitted platform accepted (video-level assignment)
  resetMocks();
  await seedGateDReadyVideo('BP-V-501', 'BP-Q-501');
  let videoLevelOk = false;
  try {
    const a = await publishingService.createPublishingAssignment(
      'BP-V-501',
      { assigneeId: 'USR-PUBMGR' },
      pubMgrActor
    );
    videoLevelOk = a !== null && a.entityId === 'PUB-BP-V-501' && a.platform === undefined;
  } catch (e: any) {}
  assert(videoLevelOk, 'Section 5d: Omitted platform accepted (video-level assignment)');

  // 5e: Mixed/Uppercase rejected
  const invalidPlatformVariants = [
    'YouTube',
    'YOUTUBE',
    'Instagram',
    'INSTAGRAM',
    'Facebook',
    'FACEBOOK',
    'tiktok',
    'twitter',
    'threads',
  ];

  for (const badPlatform of invalidPlatformVariants) {
    resetMocks();
    await seedGateDReadyVideo('BP-V-501', 'BP-Q-501');
    let rejected = false;
    try {
      await publishingService.createPublishingAssignment(
        'BP-V-501',
        { assigneeId: 'USR-PUBMGR', platform: badPlatform },
        pubMgrActor
      );
    } catch (err: any) {
      rejected = err instanceof ValidationError;
    }
    assert(rejected, `Section 5e: Platform variant "${badPlatform}" strictly rejected`);
  }

  // ==========================================================================
  // SECTION 6: State Isolation (No Mutation of VideoProductionStatus or SocialPublishStatus)
  // ==========================================================================
  console.log('\n--- Section 6: State Isolation & Separation ---');
  resetMocks();
  const { video: originalVideo, publishing: originalPublishing } = await seedGateDReadyVideo('BP-V-601', 'BP-Q-601');

  const beforeVideoStatus = originalVideo.status;
  const beforeYtStatus = originalPublishing.youtube?.status;
  const beforeIgStatus = originalPublishing.instagram?.status;
  const beforeFbStatus = originalPublishing.facebook?.status;

  await publishingService.createPublishingAssignment(
    'BP-V-601',
    { assigneeId: 'USR-PUBMGR', platform: 'youtube' },
    pubMgrActor
  );

  const afterVideo = mockVideos['BP-V-601'];
  const afterPublishing = Object.values(mockPublishings).find((p) => p.videoId === 'BP-V-601')!;

  assert(afterVideo.status === beforeVideoStatus, 'Section 6.1: VideoProductionStatus remains unchanged (READY_TO_UPLOAD)', `Status: ${afterVideo.status}`);
  assert(afterPublishing.youtube?.status === beforeYtStatus, 'Section 6.2: YouTube SocialPublishStatus remains unchanged (NOT_STARTED)', `Status: ${afterPublishing.youtube?.status}`);
  assert(afterPublishing.instagram?.status === beforeIgStatus, 'Section 6.3: Instagram SocialPublishStatus remains unchanged (NOT_STARTED)');
  assert(afterPublishing.facebook?.status === beforeFbStatus, 'Section 6.4: Facebook SocialPublishStatus remains unchanged (NOT_STARTED)');

  // Verify Gate D readiness remains valid after assignment creation
  const readinessAfter = await publishingService.validatePublishReadiness('BP-V-601');
  assert(readinessAfter.isReady === true, 'Section 6.5: Gate D publish readiness remains TRUE');

  // ==========================================================================
  // SECTION 7: Multi-Sheet Audit & Workflow Tracking
  // ==========================================================================
  console.log('\n--- Section 7: Audit Log and Workflow Transition Tracking ---');
  resetMocks();
  await seedGateDReadyVideo('BP-V-701', 'BP-Q-701');

  const createdAssignment = await publishingService.createPublishingAssignment(
    'BP-V-701',
    {
      assigneeId: 'USR-PUBMGR',
      platform: 'instagram',
      priority: PriorityLevel.HIGH,
      dueDate: '2026-09-20',
      notes: 'Ensure reel aspect ratio 9:16 is verified.',
    },
    pubMgrActor
  );

  // 7a: Stored in assignments repository
  const storedAssignment = mockAssignments[createdAssignment.id];
  assert(storedAssignment !== undefined, 'Section 7a: Assignment saved in ASSIGNMENTS sheet repository');

  // 7b: Audit log created
  const matchingAudit = mockAuditLogs.find(
    (log) => log.action === 'PUBLISHING_ASSIGNMENT_CREATED' && log.entityId === createdAssignment.id
  );
  assert(matchingAudit !== undefined, 'Section 7b.1: AUDIT_LOG action "PUBLISHING_ASSIGNMENT_CREATED" recorded');
  assert(matchingAudit?.details?.videoId === 'BP-V-701', 'Section 7b.2: Audit log details contain videoId');
  assert(matchingAudit?.details?.platform === 'instagram', 'Section 7b.3: Audit log details contain platform');

  // 7c: Workflow transition recorded
  const matchingWorkflow = mockWorkflowLogs.find(
    (w) => w.entityId === 'PUB-BP-V-701' && w.toStatus === 'ASSIGNED'
  );
  assert(matchingWorkflow !== undefined, 'Section 7c.1: WORKFLOW sheet transition to ASSIGNED recorded');
  assert(matchingWorkflow?.triggeredBy === 'USR-PUBMGR', 'Section 7c.2: Workflow transition actor recorded correctly');

  // ==========================================================================
  // SECTION 8: Backward Compatibility & Querying
  // ==========================================================================
  console.log('\n--- Section 8: Backward Compatibility & Querying ---');
  resetMocks();
  await seedGateDReadyVideo('BP-V-801', 'BP-Q-801');

  // 8a: Create multiple platform-scoped assignments
  const ytAssignment = await publishingService.createPublishingAssignment(
    'BP-V-801',
    { assigneeId: 'USR-PUBMGR', platform: 'youtube' },
    pubMgrActor
  );

  const igAssignment = await publishingService.createPublishingAssignment(
    'BP-V-801',
    { assigneeId: 'USR-CNTMGR', platform: 'instagram' },
    contentMgrActor
  );

  // 8b: Retrieve publishing assignments by videoId
  const retrievedAssignments = await publishingService.getPublishingAssignments('BP-V-801');
  assert(retrievedAssignments.length === 2, 'Section 8b.1: Retrieved both publishing assignments for video', `Count: ${retrievedAssignments.length}`);
  assert(retrievedAssignments.some((a) => a.id === ytAssignment.id), 'Section 8b.2: YouTube assignment present in query results');
  assert(retrievedAssignments.some((a) => a.id === igAssignment.id), 'Section 8b.3: Instagram assignment present in query results');

  // 8c: Duplicate active assignment protection
  let duplicatePrevented = false;
  try {
    await publishingService.createPublishingAssignment(
      'BP-V-801',
      { assigneeId: 'USR-PUBMGR', platform: 'youtube' },
      pubMgrActor
    );
  } catch (err: any) {
    duplicatePrevented = err instanceof ValidationError && err.message.includes('already exists');
  }
  assert(duplicatePrevented, 'Section 8c: Duplicate active assignment for same platform is prevented');

  // 8d: Also works when video status is UPLOADED (Gate D allows both READY_TO_UPLOAD and UPLOADED)
  resetMocks();
  await seedGateDReadyVideo('BP-V-802', 'BP-Q-802');
  mockVideos['BP-V-802'].status = VideoProductionStatus.UPLOADED;

  let uploadedStatusAllowed = false;
  try {
    const uploadedAssignment = await publishingService.createPublishingAssignment(
      'BP-V-802',
      { assigneeId: 'USR-PUBMGR', platform: 'youtube' },
      pubMgrActor
    );
    uploadedStatusAllowed = !!uploadedAssignment;
  } catch (err: any) {
    uploadedStatusAllowed = false;
  }
  assert(uploadedStatusAllowed, 'Section 8d: Gate D permits assignment creation when video is in UPLOADED status');

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log('\n====================================================');
  console.log(`PHASE 13.4 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    throw new Error(`Phase 13.4 Verification Failed with ${failedTests} failed assertions.`);
  }

  return { status: 'PASS', passed: passedTests, failed: failedTests };
}

// Direct execution support
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('phase13-step4-publishing-assignments')) {
  runPhase13Step4Tests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
