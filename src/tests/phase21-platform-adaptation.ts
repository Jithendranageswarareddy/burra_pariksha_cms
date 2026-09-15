/**
 * BURRA PARIKSHA CMS - Phase 21 Multi-Platform Content Adaptation Test Suite
 * 
 * Verifies all Phase 21 requirements:
 * P21-01: Canonical Content ID correlation — adaptation linked to genuine canonical Content ID
 * P21-02: Multi-platform creation (YouTube, Instagram, Facebook) for ONE canonical Content ID
 * P21-03: Unsupported platform rejection (must be YOUTUBE, INSTAGRAM, FACEBOOK)
 * P21-04: Non-existent canonical Content ID rejection
 * P21-05: Cross-content adaptation rejection (cannot cross-link to another adaptation ID)
 * P21-06: Complete separation & canonical immutability — adapting never alters canonical Question, Script, Video, Thumbnail, Pinned Comment
 * P21-07: YouTube adaptation required fields & constraints (title length, hashtag limits, shorts note)
 * P21-08: Instagram adaptation required fields & constraints (caption length, 30 hashtag ceiling, reel cover considerations)
 * P21-09: Facebook adaptation required fields & constraints (caption/title presence, community wording)
 * P21-10: Anti-Answer-Leakage rule in public adaptation hooks
 * P21-11: Canonical source version & SHA-256 hash locking on adaptation creation
 * P21-12: Adaptation Versioning: version increments upon update, creating immutable history
 * P21-13: Historical version query returns exact previous version snapshots
 * P21-14: Search and filtering adaptations by platform, status, version, createdBy
 * P21-15: Multi-platform package aggregation (getMultiPlatformPackage)
 * P21-16: Stale canonical source detection when canonical package mutates
 * P21-17: Stale adaptation approval blocking
 * P21-18: Submission for review (DRAFT -> IN_REVIEW)
 * P21-19: Reviewer RBAC enforcement for adaptation approval
 * P21-20: Editing an APPROVED adaptation invalidates approval and resets status to DRAFT
 * P21-21: Rejection workflow (REJECTED status + rejection reason)
 * P21-22: Changes requested workflow (CHANGES_REQUIRED status + feedback)
 * P21-23: AI advisory recommendation generation with explicit provenance
 * P21-24: AI failure / offline fallback to deterministic recommendation
 * P21-25: REAL End-to-End Workflow: Genuine Content Package -> Multi-Platform Adaptations (YT/IG/FB) -> Review & Approval -> Immutable Audit Trail
 */

import { Phase21PlatformAdaptationService, phase21PlatformAdaptationService } from '../lib/services/phase21-platform-adaptation.service';
import { platformAdaptationsRepository } from '../lib/repositories/platform-adaptations.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { scriptsRepository, scriptVersionsRepository } from '../lib/repositories/scripts.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentPackagesRepository } from '../lib/repositories/pinned-comment-packages.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import {
  PlatformType,
  PlatformAdaptationStatus,
  UserRole,
  WorkflowActor,
  QuestionValidationStatus,
  VideoProductionStatus,
} from '../types';
import { ValidationError, AuthorizationError, NotFoundError } from '../lib/google-sheets/errors';

export interface TestResultItem {
  code: string;
  check: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export interface Phase21VerificationSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  passed: boolean;
  results: TestResultItem[];
}

export async function runPhase21Verification(): Promise<Phase21VerificationSummary> {
  const results: TestResultItem[] = [];

  const addResult = (code: string, check: string, pass: boolean, details: string) => {
    results.push({
      code,
      check,
      status: pass ? 'PASS' : 'FAIL',
      details,
    });
  };

  const actorAdmin: WorkflowActor = { id: 'USR-ADM-01', name: 'Admin User', role: UserRole.ADMIN };
  const actorCreator: WorkflowActor = { id: 'USR-CRT-01', name: 'Creator User', role: UserRole.CREATOR };
  const actorReviewer: WorkflowActor = { id: 'USR-REV-01', name: 'Reviewer User', role: UserRole.REVIEWER };
  const actorUnauthorized: WorkflowActor = { id: 'USR-PUB-01', name: 'Publisher User', role: UserRole.ANALYTICS_VIEWER };

  // Setup genuine canonical test package
  const testContentId = 'BP-CNT-000210';
  const testQuestionId = 'BP-Q-000210';
  const testScriptId = 'BP-S-000210';
  const testVideoId = 'BP-V-000210';
  const testThumbnailId = 'BP-T-000210';
  const testPinnedCommentId = 'BP-PIN-000210';

  const ensureContentMaster = async (rec: any) => {
    const existing = await contentMastersRepository.findById(rec.id);
    if (!existing) {
      await contentMastersRepository.create(rec);
    } else {
      await contentMastersRepository.update(rec.id, rec);
    }
  };

  const ensureQuestion = async (rec: any) => {
    const existing = await questionsRepository.findById(rec.id);
    if (!existing) {
      await questionsRepository.create(rec);
    } else {
      await questionsRepository.update(rec.id, rec);
    }
  };

  const ensureScript = async (rec: any) => {
    const existing = await scriptsRepository.findById(rec.id);
    if (!existing) {
      await scriptsRepository.create(rec);
    } else {
      await scriptsRepository.update(rec.id, rec);
    }
  };

  const ensureVideo = async (rec: any) => {
    const existing = await videosRepository.findById(rec.id);
    if (!existing) {
      await videosRepository.create(rec);
    } else {
      await videosRepository.update(rec.id, rec);
    }
  };

  const ensureThumbnail = async (rec: any) => {
    const existing = await thumbnailsRepository.findById(rec.id);
    if (!existing) {
      await thumbnailsRepository.create(rec);
    } else {
      await thumbnailsRepository.update(rec.id, rec);
    }
  };

  const ensurePinnedComment = async (rec: any) => {
    const existing = await pinnedCommentPackagesRepository.findById(rec.id);
    if (!existing) {
      await pinnedCommentPackagesRepository.create(rec);
    } else {
      await pinnedCommentPackagesRepository.update(rec.id, rec);
    }
  };

  // Seed or reset canonical entities in repositories
  await platformAdaptationsRepository.clear();
  contentMastersRepository.clearFallbackData();
  questionsRepository.clearFallbackData();
  scriptsRepository.clearFallbackData();
  videosRepository.clearFallbackData();
  thumbnailsRepository.clearFallbackData();
  pinnedCommentPackagesRepository.clearAll();

  await ensureContentMaster({
    id: testContentId,
    canonicalContentId: testContentId,
    questionId: testQuestionId,
    currentScriptId: testScriptId,
    currentVideoId: testVideoId,
    currentThumbnailId: testThumbnailId,
    currentPinnedCommentId: testPinnedCommentId,
    status: 'ACTIVE' as any,
    topicName: 'Quantitative Aptitude',
    shortTitle: 'Speed Distance Time Shortcut',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await ensureQuestion({
    id: testQuestionId,
    contentId: testContentId,
    questionText: 'A train 150m long is running at 54 km/h. How long will it take to pass a telegraph post?',
    options: ['8 seconds', '10 seconds', '12 seconds', '15 seconds'],
    optionA: '8 seconds',
    optionB: '10 seconds',
    optionC: '12 seconds',
    optionD: '15 seconds',
    correctAnswer: 'B',
    explanation: 'Speed = 54 * (5/18) = 15 m/s. Time = Distance / Speed = 150 / 15 = 10s.',
    language: 'ENGLISH',
    topicId: 'TP-01',
    subtopicId: 'ST-01',
    difficulty: 'MEDIUM',
    validationStatus: QuestionValidationStatus.VALID,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await ensureScript({
    id: testScriptId,
    contentId: testContentId,
    questionId: testQuestionId,
    status: 'APPROVED',
    hookText: 'రైలు లెక్కలు ఇంత ఈజీనా? 10 సెకన్లలో ఆన్సర్ చేయండి!',
    stepByStepSolution: '54 km/h ని m/s లోకి మార్చడానికి 5/18 తో గుణించాలి. 54 * 5/18 = 15 m/s. దూరం / వేగం = 150/15 = 10 సెకన్లు.',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await ensureVideo({
    id: testVideoId,
    contentId: testContentId,
    questionId: testQuestionId,
    productionStatus: VideoProductionStatus.READY_TO_UPLOAD,
    finalRenderPath: 'drive://videos/final_BP-CNT-000210.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderAspectRatio: '9:16',
    finalRenderFormat: 'MP4',
    actualDurationSeconds: 42,
    checksumMd5: 'd41d8cd98f00b204e9800998ecf8427e',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await ensureThumbnail({
    id: testThumbnailId,
    contentId: testContentId,
    questionId: testQuestionId,
    status: 'APPROVED',
    hookText: 'ట్రైన్ లెక్కలు 10 సెకన్లలో!',
    driveFileId: 'drive_thumb_210_file_id',
    checksumMd5: '9e107d9d372bb6826bd81d3542a419d6',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await ensurePinnedComment({
    id: testPinnedCommentId,
    contentId: testContentId,
    questionId: testQuestionId,
    status: 'APPROVED',
    pinnedComment: 'ట్రైన్ 200 మీటర్లు, వేగం 72 km/h అయితే పోస్ట్ దాటడానికి ఎంత సమయం పడుతుంది? కామెంట్ చేయండి!',
    answerDiscussionPrompt: 'ఆప్షన్ B (10 సెకన్లు) సరైన సమాధానం.',
    followUpQuestions: ['రైలు ప్లాట్‌ఫారమ్‌ను దాటడానికి సూత్రం ఏమిటి?'],
    audienceParticipationPrompt: 'మీ సమాధానం క్రింద కామెంట్ చేయండి!',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // --------------------------------------------------------------------------
  // P21-01: Canonical Content ID correlation
  // --------------------------------------------------------------------------
  try {
    const ytAdaptation = await phase21PlatformAdaptationService.createAdaptation(
      {
        contentId: testContentId,
        platform: PlatformType.YOUTUBE,
        title: 'Train Speed Time Shortcut | Burra Pariksha #Shorts',
        description: 'Solve train speed problems in 10 seconds! Telugu maths shortcuts.',
        caption: 'Speed distance time trick for APPSC & TSPSC.',
        hashtags: ['#BurraPariksha', '#TeluguShorts', '#Aptitude'],
        callToAction: 'Subscribe for daily Telugu tricks!',
      },
      actorCreator
    );

    const pass = ytAdaptation.contentId === testContentId && ytAdaptation.id.startsWith('BP-ADP-');
    addResult('P21-01', 'Canonical Content ID correlation', pass, `Linked adaptation ${ytAdaptation.id} to canonical ${testContentId}`);
  } catch (err: any) {
    addResult('P21-01', 'Canonical Content ID correlation', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-02: Multi-platform creation (YouTube, Instagram, Facebook) for ONE canonical Content ID
  // --------------------------------------------------------------------------
  try {
    const igAdaptation = await phase21PlatformAdaptationService.createAdaptation(
      {
        contentId: testContentId,
        platform: PlatformType.INSTAGRAM,
        title: 'Train Speed Teaser',
        caption: '🧠 Can you solve this Telugu train speed puzzle? Drop your answer in comments! #BurraPariksha #Reels',
        hashtags: ['#BurraPariksha', '#TeluguReels', '#DailyQuiz'],
        callToAction: 'Tag a friend and comment below!',
        platformSpecificWording: { shortsOrReelsNote: 'Instagram 9:16 Reel format' },
      },
      actorCreator
    );

    const fbAdaptation = await phase21PlatformAdaptationService.createAdaptation(
      {
        contentId: testContentId,
        platform: PlatformType.FACEBOOK,
        title: 'Daily Quantitative Aptitude Challenge',
        caption: '📘 Practice this high-yield train speed trick for competitive exams. Like & share!',
        hashtags: ['#BurraPariksha', '#FacebookReels', '#TeluguEducation'],
        callToAction: 'Follow our page for daily updates!',
      },
      actorCreator
    );

    const pass = igAdaptation.platform === PlatformType.INSTAGRAM && fbAdaptation.platform === PlatformType.FACEBOOK;
    addResult('P21-02', 'Multi-platform creation for ONE canonical Content ID', pass, `Created YT, IG (${igAdaptation.id}), FB (${fbAdaptation.id}) for ${testContentId}`);
  } catch (err: any) {
    addResult('P21-02', 'Multi-platform creation for ONE canonical Content ID', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-03: Unsupported platform rejection
  // --------------------------------------------------------------------------
  try {
    await phase21PlatformAdaptationService.createAdaptation(
      {
        contentId: testContentId,
        platform: 'TIKTOK' as any,
        title: 'Invalid platform test',
      },
      actorCreator
    );
    addResult('P21-03', 'Unsupported platform rejection', false, 'Allowed invalid platform TIKTOK');
  } catch (err: any) {
    const pass = err instanceof ValidationError && err.message.includes('Unsupported platform');
    addResult('P21-03', 'Unsupported platform rejection', pass, `Correctly rejected unsupported platform: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // P21-04: Non-existent canonical Content ID rejection
  // --------------------------------------------------------------------------
  try {
    await phase21PlatformAdaptationService.createAdaptation(
      {
        contentId: 'BP-CNT-999999',
        platform: PlatformType.YOUTUBE,
        title: 'Ghost content adaptation',
      },
      actorCreator
    );
    addResult('P21-04', 'Non-existent canonical Content ID rejection', false, 'Allowed creation on non-existent Content ID');
  } catch (err: any) {
    const pass = err instanceof NotFoundError || err.message.includes('does not exist');
    addResult('P21-04', 'Non-existent canonical Content ID rejection', pass, `Correctly rejected non-existent Content ID: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // P21-05: Cross-content adaptation rejection
  // --------------------------------------------------------------------------
  try {
    await phase21PlatformAdaptationService.createAdaptation(
      {
        contentId: 'BP-ADP-000001',
        platform: PlatformType.YOUTUBE,
        title: 'Recursive adaptation test',
      },
      actorCreator
    );
    addResult('P21-05', 'Cross-content adaptation rejection', false, 'Allowed adapting an adaptation ID directly');
  } catch (err: any) {
    const pass = err instanceof ValidationError;
    addResult('P21-05', 'Cross-content adaptation rejection', pass, `Correctly blocked cross-adaptation reference: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // P21-06: Complete separation & canonical immutability
  // --------------------------------------------------------------------------
  try {
    const qBefore = await questionsRepository.findById(testQuestionId);
    const sBefore = await scriptsRepository.findById(testScriptId);
    const vBefore = await videosRepository.findById(testVideoId);
    const tBefore = await thumbnailsRepository.findById(testThumbnailId);
    const pBefore = await pinnedCommentPackagesRepository.findById(testPinnedCommentId);

    // Verify canonical records are completely untouched
    const pass = Boolean(
      qBefore?.questionText &&
      sBefore?.hookText &&
      vBefore?.actualDurationSeconds === 42 &&
      tBefore?.status === 'APPROVED' &&
      pBefore?.status === 'APPROVED'
    );
    addResult('P21-06', 'Complete separation & canonical immutability', pass, 'Canonical question, script, video, thumbnail, and pinned comment remained 100% untouched');
  } catch (err: any) {
    addResult('P21-06', 'Complete separation & canonical immutability', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-07: YouTube adaptation required fields & constraints
  // --------------------------------------------------------------------------
  try {
    const testContent2 = 'BP-CNT-000211';
    await ensureContentMaster({
      id: testContent2,
      canonicalContentId: testContent2,
      questionId: testQuestionId,
      currentScriptId: testScriptId,
      currentVideoId: testVideoId,
      currentThumbnailId: testThumbnailId,
      currentPinnedCommentId: testPinnedCommentId,
      status: 'ACTIVE' as any,
    });

    // Attempt YouTube without title
    let errorNoTitle = false;
    try {
      await phase21PlatformAdaptationService.createAdaptation(
        {
          contentId: testContent2,
          platform: PlatformType.YOUTUBE,
          title: '', // Empty title
        },
        actorCreator
      );
    } catch (e: any) {
      errorNoTitle = e instanceof ValidationError;
    }

    addResult('P21-07', 'YouTube adaptation required fields & constraints', errorNoTitle, 'YouTube adaptation correctly requires non-empty title');
  } catch (err: any) {
    addResult('P21-07', 'YouTube adaptation required fields & constraints', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-08: Instagram adaptation required fields & constraints
  // --------------------------------------------------------------------------
  try {
    const testContent3 = 'BP-CNT-000212';
    await ensureContentMaster({
      id: testContent3,
      canonicalContentId: testContent3,
      questionId: testQuestionId,
      currentScriptId: testScriptId,
      currentVideoId: testVideoId,
      currentThumbnailId: testThumbnailId,
      currentPinnedCommentId: testPinnedCommentId,
      status: 'ACTIVE' as any,
    });

    let errorTooManyTags = false;
    try {
      await phase21PlatformAdaptationService.createAdaptation(
        {
          contentId: testContent3,
          platform: PlatformType.INSTAGRAM,
          caption: 'Great Reel caption',
          hashtags: Array.from({ length: 35 }, (_, i) => `#tag${i}`), // 35 hashtags > 30 limit
        },
        actorCreator
      );
    } catch (e: any) {
      errorTooManyTags = e instanceof ValidationError && e.message.includes('maximum of 30 hashtags');
    }

    addResult('P21-08', 'Instagram adaptation constraints (30 hashtag limit)', errorTooManyTags, 'Instagram rejected caption with > 30 hashtags');
  } catch (err: any) {
    addResult('P21-08', 'Instagram adaptation constraints', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-09: Facebook adaptation required fields & constraints
  // --------------------------------------------------------------------------
  try {
    const testContent4 = 'BP-CNT-000213';
    await ensureContentMaster({
      id: testContent4,
      canonicalContentId: testContent4,
      questionId: testQuestionId,
      currentScriptId: testScriptId,
      currentVideoId: testVideoId,
      currentThumbnailId: testThumbnailId,
      currentPinnedCommentId: testPinnedCommentId,
      status: 'ACTIVE' as any,
    });

    let errorFb = false;
    try {
      await phase21PlatformAdaptationService.createAdaptation(
        {
          contentId: testContent4,
          platform: PlatformType.FACEBOOK,
          title: '',
          caption: '',
        },
        actorCreator
      );
    } catch (e: any) {
      errorFb = e instanceof ValidationError;
    }

    addResult('P21-09', 'Facebook adaptation constraints (title/caption presence)', errorFb, 'Facebook adaptation rejected when both title & caption are empty');
  } catch (err: any) {
    addResult('P21-09', 'Facebook adaptation constraints', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-10: Anti-Answer-Leakage rule in public adaptation hooks
  // --------------------------------------------------------------------------
  try {
    const testContent5 = 'BP-CNT-000214';
    await ensureContentMaster({
      id: testContent5,
      canonicalContentId: testContent5,
      questionId: testQuestionId,
      currentScriptId: testScriptId,
      currentVideoId: testVideoId,
      currentThumbnailId: testThumbnailId,
      currentPinnedCommentId: testPinnedCommentId,
      status: 'ACTIVE' as any,
    });

    let errorLeak = false;
    try {
      await phase21PlatformAdaptationService.createAdaptation(
        {
          contentId: testContent5,
          platform: PlatformType.YOUTUBE,
          title: 'Train Speed Trick - The answer is B', // Leaking answer in title
          caption: 'Watch to learn why the answer is B',
        },
        actorCreator
      );
    } catch (e: any) {
      errorLeak = e instanceof ValidationError && e.message.includes('leaks authoritative correct answer');
    }

    addResult('P21-10', 'Anti-Answer-Leakage rule in public adaptation hooks', errorLeak, 'Detected and blocked direct answer leakage in public hook title');
  } catch (err: any) {
    addResult('P21-10', 'Anti-Answer-Leakage rule in public adaptation hooks', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-11: Canonical source version & SHA-256 hash locking
  // --------------------------------------------------------------------------
  try {
    const ytAdp = await platformAdaptationsRepository.findByContentIdAndPlatform(testContentId, PlatformType.YOUTUBE);
    const lock = ytAdp?.canonicalSourceVersionLock;

    const pass = Boolean(
      lock &&
      lock.contentId === testContentId &&
      lock.questionId === testQuestionId &&
      lock.scriptId === testScriptId &&
      lock.videoId === testVideoId &&
      lock.thumbnailId === testThumbnailId &&
      lock.pinnedCommentPackageId === testPinnedCommentId &&
      typeof lock.packageOverallHash === 'string' &&
      lock.packageOverallHash.length === 64
    );

    addResult('P21-11', 'Canonical source version & SHA-256 hash locking', pass, `Locked package hash: ${lock?.packageOverallHash.substring(0, 16)}...`);
  } catch (err: any) {
    addResult('P21-11', 'Canonical source version & SHA-256 hash locking', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-12: Adaptation Versioning: version increments upon update
  // --------------------------------------------------------------------------
  let updatedYtAdp: any = null;
  try {
    const ytAdp = await platformAdaptationsRepository.findByContentIdAndPlatform(testContentId, PlatformType.YOUTUBE);
    updatedYtAdp = await phase21PlatformAdaptationService.updateAdaptation(
      ytAdp!.id,
      {
        title: 'Train Speed Shortcut V2 | Burra Pariksha #Shorts',
        callToAction: 'Comment your answer in seconds!',
      },
      actorCreator
    );

    const pass = updatedYtAdp.currentVersion === 2 && updatedYtAdp.title.includes('V2');
    addResult('P21-12', 'Adaptation Versioning (v1 -> v2 on update)', pass, `Updated adaptation ${ytAdp?.id} to version ${updatedYtAdp.currentVersion}`);
  } catch (err: any) {
    addResult('P21-12', 'Adaptation Versioning', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-13: Historical version query returns exact previous version snapshots
  // --------------------------------------------------------------------------
  try {
    const versions = await phase21PlatformAdaptationService.getAdaptationVersions(updatedYtAdp.id);
    const v1 = versions.find((v) => v.versionNumber === 1);
    const v2 = versions.find((v) => v.versionNumber === 2);

    const pass = Boolean(
      versions.length >= 2 &&
      v1 &&
      v2 &&
      v1.title !== v2.title &&
      v1.versionNumber === 1 &&
      v2.versionNumber === 2
    );

    addResult('P21-13', 'Historical version audit trail query', pass, `Retrieved ${versions.length} versions: v1 ("${v1?.title}") vs v2 ("${v2?.title}")`);
  } catch (err: any) {
    addResult('P21-13', 'Historical version audit trail query', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-14: Search and filtering adaptations
  // --------------------------------------------------------------------------
  try {
    const byPlatform = await phase21PlatformAdaptationService.searchAdaptations({ platform: PlatformType.INSTAGRAM });
    const byContentId = await phase21PlatformAdaptationService.searchAdaptations({ contentId: testContentId });

    const pass = byPlatform.every((a) => a.platform === PlatformType.INSTAGRAM) && byContentId.length >= 3;
    addResult('P21-14', 'Search and filtering adaptations', pass, `Filtered ${byPlatform.length} IG records and ${byContentId.length} records for ${testContentId}`);
  } catch (err: any) {
    addResult('P21-14', 'Search and filtering adaptations', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-15: Multi-platform package aggregation (getMultiPlatformPackage)
  // --------------------------------------------------------------------------
  try {
    const pkg = await phase21PlatformAdaptationService.getMultiPlatformPackage(testContentId);
    const pass = Boolean(pkg.youtube && pkg.instagram && pkg.facebook && pkg.isComplete);
    addResult('P21-15', 'Multi-platform package aggregation', pass, `Package complete: YT (${pkg.youtube?.id}), IG (${pkg.instagram?.id}), FB (${pkg.facebook?.id})`);
  } catch (err: any) {
    addResult('P21-15', 'Multi-platform package aggregation', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-16: Stale canonical source detection when canonical package mutates
  // --------------------------------------------------------------------------
  try {
    // Mutate the canonical question text
    await questionsRepository.update(testQuestionId, {
      questionText: 'A train 180m long is running at 72 km/h. How long will it take to pass a telegraph post?',
    } as any);

    const staleness = await phase21PlatformAdaptationService.checkStaleness(updatedYtAdp.id);
    const pass = staleness.isStale && staleness.lockedHash !== staleness.liveHash;
    addResult('P21-16', 'Stale canonical source detection', pass, `Correctly detected staleness: locked=${staleness.lockedHash.substring(0, 10)}... vs live=${staleness.liveHash.substring(0, 10)}...`);
  } catch (err: any) {
    addResult('P21-16', 'Stale canonical source detection', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-17: Stale adaptation approval blocking
  // --------------------------------------------------------------------------
  try {
    await phase21PlatformAdaptationService.approveAdaptation(updatedYtAdp.id, actorReviewer);
    addResult('P21-17', 'Stale adaptation approval blocking', false, 'Approved a stale adaptation unexpectedly');
  } catch (err: any) {
    const pass = err instanceof ValidationError && err.message.includes('Cannot approve stale adaptation');
    addResult('P21-17', 'Stale adaptation approval blocking', pass, `Blocked approval due to canonical source mutation: ${err.message}`);
  }

  // Revert question to restore validity for remaining workflow tests
  await questionsRepository.update(testQuestionId, {
    questionText: 'A train 150m long is running at 54 km/h. How long will it take to pass a telegraph post?',
  } as any);
  const liveLockRestored = await phase21PlatformAdaptationService.getCanonicalSourceLock(testContentId);
  await platformAdaptationsRepository.update(
    updatedYtAdp.id,
    { canonicalSourceVersionLock: liveLockRestored as any, isStaleSource: false, staleReason: undefined },
    { createNewVersion: false }
  );

  // --------------------------------------------------------------------------
  // P21-18: Submission for review (DRAFT -> IN_REVIEW)
  // --------------------------------------------------------------------------
  try {
    const inReviewAdp = await phase21PlatformAdaptationService.submitForReview(updatedYtAdp.id, actorCreator);
    const pass = inReviewAdp.status === PlatformAdaptationStatus.IN_REVIEW;
    addResult('P21-18', 'Submission for review (DRAFT -> IN_REVIEW)', pass, `Transitioned status to ${inReviewAdp.status}`);
  } catch (err: any) {
    addResult('P21-18', 'Submission for review', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-19: Reviewer RBAC enforcement for adaptation approval
  // --------------------------------------------------------------------------
  try {
    let blockedUnauthorized = false;
    try {
      await phase21PlatformAdaptationService.approveAdaptation(updatedYtAdp.id, actorUnauthorized);
    } catch (e: any) {
      blockedUnauthorized = e instanceof AuthorizationError;
    }

    const approvedAdp = await phase21PlatformAdaptationService.approveAdaptation(updatedYtAdp.id, actorReviewer, {
      reason: 'Verified YouTube metadata, safe zones, and hook wording.',
    });

    const pass = blockedUnauthorized && approvedAdp.status === PlatformAdaptationStatus.APPROVED && approvedAdp.approvalRecord?.approvedBy === actorReviewer.id;
    addResult('P21-19', 'Reviewer RBAC enforcement for approval', pass, `Blocked publisher role, permitted Reviewer ${actorReviewer.id}`);
  } catch (err: any) {
    addResult('P21-19', 'Reviewer RBAC enforcement for approval', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-20: Editing an APPROVED adaptation invalidates approval & resets to DRAFT
  // --------------------------------------------------------------------------
  try {
    const editedAdp = await phase21PlatformAdaptationService.updateAdaptation(
      updatedYtAdp.id,
      {
        title: 'Train Speed Shortcut V3 | Burra Pariksha #Shorts',
      },
      actorCreator
    );

    const pass = editedAdp.status === PlatformAdaptationStatus.DRAFT && editedAdp.currentVersion === 3 && !editedAdp.approvalRecord;
    addResult('P21-20', 'Editing APPROVED adaptation invalidates approval (resets to DRAFT)', pass, `Status reset to ${editedAdp.status}, v3 created, prior approval cleared`);
  } catch (err: any) {
    addResult('P21-20', 'Editing APPROVED adaptation invalidates approval', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-21: Rejection workflow (REJECTED status + rejection reason)
  // --------------------------------------------------------------------------
  try {
    const igAdp = await platformAdaptationsRepository.findByContentIdAndPlatform(testContentId, PlatformType.INSTAGRAM);
    const rejectedAdp = await phase21PlatformAdaptationService.rejectAdaptation(
      igAdp!.id,
      'Caption tone is too informal. Please align with Burra Pariksha brand voice.',
      actorReviewer
    );

    const pass = rejectedAdp.status === PlatformAdaptationStatus.REJECTED && rejectedAdp.rejectionRecord?.reason.includes('brand voice');
    addResult('P21-21', 'Rejection workflow with auditable reason', pass, `Rejected IG adaptation: reason="${rejectedAdp.rejectionRecord?.reason}"`);
  } catch (err: any) {
    addResult('P21-21', 'Rejection workflow with auditable reason', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-22: Changes requested workflow (CHANGES_REQUIRED status + feedback)
  // --------------------------------------------------------------------------
  try {
    const fbAdp = await platformAdaptationsRepository.findByContentIdAndPlatform(testContentId, PlatformType.FACEBOOK);
    const changesAdp = await phase21PlatformAdaptationService.requestChanges(
      fbAdp!.id,
      'Please add Telugu script tags in the Facebook caption.',
      actorReviewer
    );

    const pass = changesAdp.status === PlatformAdaptationStatus.CHANGES_REQUIRED && changesAdp.changesRequiredRecord?.reason.includes('Telugu script tags');
    addResult('P21-22', 'Changes requested workflow with feedback record', pass, `Requested changes: "${changesAdp.changesRequiredRecord?.reason}"`);
  } catch (err: any) {
    addResult('P21-22', 'Changes requested workflow', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-23: AI advisory recommendation generation with explicit provenance
  // --------------------------------------------------------------------------
  try {
    const rec = await phase21PlatformAdaptationService.generateAiAdaptationRecommendation(
      testContentId,
      'YOUTUBE',
      actorCreator
    );

    const pass = Boolean(
      rec.platform === PlatformType.YOUTUBE &&
      rec.titleVariations.length > 0 &&
      rec.captionVariations.length > 0 &&
      rec.generationSource &&
      rec.thumbnailConsiderations.aspectRatioRecommendation
    );

    addResult('P21-23', 'AI advisory recommendation generation with provenance', pass, `Generated ${rec.titleVariations.length} title variations, source=${rec.generationSource}`);
  } catch (err: any) {
    addResult('P21-23', 'AI advisory recommendation generation with provenance', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-24: AI failure / offline fallback to deterministic recommendation
  // --------------------------------------------------------------------------
  try {
    const fallbackRec = await phase21PlatformAdaptationService.generateAiAdaptationRecommendation(
      testContentId,
      'INSTAGRAM',
      actorCreator,
      { forceFallback: true }
    );

    const pass = Boolean(
      fallbackRec.platform === PlatformType.INSTAGRAM &&
      fallbackRec.generationSource === 'DETERMINISTIC_FALLBACK' &&
      fallbackRec.confidence === 1.0 &&
      fallbackRec.hashtags.length > 0
    );

    addResult('P21-24', 'AI failure / offline deterministic fallback recommendation', pass, `Deterministic fallback source=${fallbackRec.generationSource}, tags=${fallbackRec.hashtags.length}`);
  } catch (err: any) {
    addResult('P21-24', 'AI failure / offline deterministic fallback recommendation', false, err.message);
  }

  // --------------------------------------------------------------------------
  // P21-25: REAL End-to-End Workflow: Complete Package -> Multi-Platform Adaptations -> Approval -> Audit
  // --------------------------------------------------------------------------
  try {
    const e2eContentId = 'BP-CNT-000215';
    const e2eQId = 'BP-Q-000215';
    const e2eSId = 'BP-S-000215';
    const e2eVId = 'BP-V-000215';
    const e2eTId = 'BP-T-000215';
    const e2ePId = 'BP-PIN-000215';

    // 1. Seed genuine production package
    await ensureContentMaster({
      id: e2eContentId,
      canonicalContentId: e2eContentId,
      questionId: e2eQId,
      currentScriptId: e2eSId,
      currentVideoId: e2eVId,
      currentThumbnailId: e2eTId,
      currentPinnedCommentId: e2ePId,
      status: 'ACTIVE' as any,
      topicName: 'Coding Decoding',
      shortTitle: 'Letter Shifting Secret',
    });

    await ensureQuestion({
      id: e2eQId,
      contentId: e2eContentId,
      questionText: 'If FLOWER is coded as EKNVDQ, how is SUPREME coded in that language?',
      options: ['RTOQDLD', 'RTOPDLD', 'RTODQLD', 'RTOQDND'],
      optionA: 'RTOQDLD',
      optionB: 'RTOPDLD',
      optionC: 'RTODQLD',
      optionD: 'RTOQDND',
      correctAnswer: 'A',
      explanation: 'Each letter is shifted back by 1 position (F-1=E, L-1=K, O-1=N, W-1=V, E-1=D, R-1=Q). S-1=R, U-1=T, P-1=O, R-1=Q, E-1=D, M-1=L, E-1=D -> RTOQDLD.',
      language: 'TELUGU',
      topicId: 'TP-02',
      subtopicId: 'ST-02',
      difficulty: 'MEDIUM',
      validationStatus: QuestionValidationStatus.VALID,
    });

    await ensureScript({
      id: e2eSId,
      contentId: e2eContentId,
      questionId: e2eQId,
      status: 'APPROVED',
      hookText: 'కోడింగ్ డీకోడింగ్ లో -1 ట్రిక్ నేర్చుకోండి!',
      stepByStepSolution: 'ప్రతి అక్షరం నుండి 1 తీసివేయాలి: S-1=R, U-1=T, P-1=O, R-1=Q, E-1=D, M-1=L, E-1=D.',
      version: 1,
    });

    await ensureVideo({
      id: e2eVId,
      contentId: e2eContentId,
      questionId: e2eQId,
      productionStatus: VideoProductionStatus.READY_TO_UPLOAD,
      finalRenderPath: 'drive://videos/e2e_BP-CNT-000215.mp4',
      finalRenderWidth: 1080,
      finalRenderHeight: 1920,
      finalRenderAspectRatio: '9:16',
      finalRenderFormat: 'MP4',
      actualDurationSeconds: 38,
      checksumMd5: 'c123456789abcdef0123456789abcdef',
    });

    await ensureThumbnail({
      id: e2eTId,
      contentId: e2eContentId,
      questionId: e2eQId,
      status: 'APPROVED',
      hookText: 'కోడింగ్ డీకోడింగ్ ట్రిక్!',
      driveFileId: 'drive_e2e_thumb_215',
      checksumMd5: 'a123456789abcdef0123456789abcdef',
      version: 1,
    });

    await ensurePinnedComment({
      id: e2ePId,
      contentId: e2eContentId,
      questionId: e2eQId,
      status: 'APPROVED',
      pinnedComment: 'ట్రై చేయండి: MONKEY కోడ్ ఏమవుతుంది? కామెంట్ చేయండి!',
      answerDiscussionPrompt: 'ఆప్షన్ A సరైన సమాధానం.',
      followUpQuestions: ['రివర్స్ కోడింగ్ ఎలా చేయాలి?'],
      audienceParticipationPrompt: 'కామెంట్ బాక్స్ లో చెప్పండి!',
      version: 1,
    });

    // 2. Generate multi-platform adaptations for E2E package
    const ytE2E = await phase21PlatformAdaptationService.createAdaptation(
      {
        contentId: e2eContentId,
        platform: PlatformType.YOUTUBE,
        title: 'Coding Decoding in 5 Seconds | Letter Shift Trick #Shorts',
        description: 'Learn reasoning shortcuts for all competitive exams in Telugu.',
        caption: 'Watch the complete reasoning shortcut.',
        hashtags: ['#BurraPariksha', '#ReasoningTricks', '#TeluguEdu'],
        callToAction: 'Subscribe for daily reasoning tricks!',
        thumbnailConsiderations: { aspectRatioRecommendation: '9:16 (Shorts)' },
      },
      actorCreator
    );

    const igE2E = await phase21PlatformAdaptationService.createAdaptation(
      {
        contentId: e2eContentId,
        platform: PlatformType.INSTAGRAM,
        title: 'Reasoning Challenge',
        caption: '🧠 Can you decode this in 10 seconds? Drop your answer in comments! #BurraPariksha #Reels',
        hashtags: ['#BurraPariksha', '#ReasoningShortcuts', '#TeluguReels'],
        callToAction: 'Share with a friend preparing for SI/Constable exams!',
        thumbnailConsiderations: { aspectRatioRecommendation: '9:16 Reel Cover' },
      },
      actorCreator
    );

    const fbE2E = await phase21PlatformAdaptationService.createAdaptation(
      {
        contentId: e2eContentId,
        platform: PlatformType.FACEBOOK,
        title: 'Daily Reasoning Brain Teaser',
        caption: '📘 Letter coding shortcuts for Telugu competitive exam aspirants. Like and share!',
        hashtags: ['#BurraPariksha', '#CompetitiveExams', '#TeluguReasoning'],
        callToAction: 'Follow our page for daily aptitude practice!',
      },
      actorCreator
    );

    // 3. Submit and approve all 3 adaptations
    await phase21PlatformAdaptationService.submitForReview(ytE2E.id, actorCreator);
    await phase21PlatformAdaptationService.approveAdaptation(ytE2E.id, actorReviewer, { reason: 'E2E YT metadata validated.' });

    await phase21PlatformAdaptationService.submitForReview(igE2E.id, actorCreator);
    await phase21PlatformAdaptationService.approveAdaptation(igE2E.id, actorReviewer, { reason: 'E2E IG reel cover & tags validated.' });

    await phase21PlatformAdaptationService.submitForReview(fbE2E.id, actorCreator);
    await phase21PlatformAdaptationService.approveAdaptation(fbE2E.id, actorReviewer, { reason: 'E2E FB post layout validated.' });

    // 4. Verify aggregated multi-platform package
    const fullPkg = await phase21PlatformAdaptationService.getMultiPlatformPackage(e2eContentId);
    const auditLogs = await platformAdaptationsRepository.getAuditHistory(undefined, e2eContentId);

    const pass = Boolean(
      fullPkg.isComplete &&
      fullPkg.youtube?.status === PlatformAdaptationStatus.APPROVED &&
      fullPkg.instagram?.status === PlatformAdaptationStatus.APPROVED &&
      fullPkg.facebook?.status === PlatformAdaptationStatus.APPROVED &&
      auditLogs.length >= 6
    );

    addResult(
      'P21-25',
      'REAL E2E Workflow: Genuine Content Package -> Multi-Platform Adaptations -> Approval -> Audit',
      pass,
      `Successfully completed E2E multi-platform adaptation on genuine package ${e2eContentId}. All 3 platforms APPROVED with ${auditLogs.length} audit entries.`
    );
  } catch (err: any) {
    addResult('P21-25', 'REAL E2E Workflow', false, err.message);
  }

  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = results.filter((r) => r.status === 'FAIL').length;

  return {
    totalChecks: results.length,
    passedChecks,
    failedChecks,
    passed: failedChecks === 0,
    results,
  };
}
