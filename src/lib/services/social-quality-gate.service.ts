/**
 * BURRA PARIKSHA CMS - Phase 20 Social Review & Quality Gate Service
 * 
 * Implements the complete production-grade social review gate:
 * - Content ID correlation (BP-CNT-######) across Question, Script, Video, Thumbnail, Pinned Comment, Metadata
 * - Strict Invariance, Answer-Leakage, and Cross-Content Safety Validation
 * - Deterministic SHA-256 version & artifact hashing
 * - Human-Authoritative Review Workflow (DRAFT -> IN_REVIEW -> PASS / CHANGES_REQUIRED / REJECTED)
 * - Review Version/Hash Locking & Strict Downstream Invalidation on Subsequent Edits
 * - Reviewer RBAC enforcement
 * - AI Review Recommendations (non-binding, error-isolated, fallback-safe)
 * - Audit History Logging
 * - Production Readiness Verification for Publishing (Phase 21/22)
 */

import crypto from 'crypto';
import {
  SocialReviewStatus,
  SocialReviewDecision,
  PackageArtifactHashes,
  PackageVersionLock,
  CompleteContentPackage,
  SocialReviewRecord,
  ProductionReadinessResult,
  SocialQualityGateReport,
  WorkflowActor,
  UserRole,
  VideoProductionStatus,
} from '../../types';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { scriptsRepository, scriptVersionsRepository } from '../repositories/scripts.repository';
import { videosRepository } from '../repositories/videos.repository';
import { thumbnailsRepository, thumbnailVersionsRepository } from '../repositories/thumbnails.repository';
import { thumbnailCandidatesRepository } from '../repositories/thumbnail-candidates.repository';
import { pinnedCommentPackagesRepository } from '../repositories/pinned-comment-packages.repository';
import { mediaAssetsRepository } from '../repositories/media-assets.repository';
import { socialReviewsRepository } from '../repositories/social-reviews.repository';
import { auditService } from './audit.service';
import { SocialQualityGateValidator } from '../validators/social-quality-gate.validator';
import { aiOrchestrator } from '../ai/ai-orchestrator.service';
import {
  ValidationError,
  AuthorizationError,
  ReferenceIntegrityError,
} from '../errors';

export class SocialQualityGateService {
  private static instance: SocialQualityGateService | null = null;

  private constructor() {}

  public static getInstance(): SocialQualityGateService {
    if (!SocialQualityGateService.instance) {
      SocialQualityGateService.instance = new SocialQualityGateService();
    }
    return SocialQualityGateService.instance;
  }

  /**
   * Helper to verify actor has one of the allowed roles.
   */
  private verifyRole(actor: WorkflowActor, allowedRoles: string[], actionDescription: string): void {
    if (!actor || !actor.id) {
      throw new AuthorizationError('Authentication required to perform social review operation.');
    }
    const actorRole = actor.role ? String(actor.role).toUpperCase() : '';
    const actorRoles = (actor.roles || []).map((r) => String(r).toUpperCase());
    if (actorRole) actorRoles.push(actorRole);

    const isAllowed = actorRoles.some((r) => allowedRoles.includes(r) || r === UserRole.ADMIN);
    if (!isAllowed) {
      throw new AuthorizationError(
        `Role "${actor.role || 'UNKNOWN'}" is not authorized to ${actionDescription}. Required roles: [${allowedRoles.join(', ')}]`
      );
    }
  }

  /**
   * Computes deterministic SHA-256 integrity hashes for each artifact in the package.
   */
  public computeIntegrityHashes(pkg: {
    contentId: string;
    question?: any;
    script?: any;
    scriptVersionNumber?: number;
    video?: any;
    videoVersionNumber?: number;
    thumbnail?: any;
    thumbnailVersionNumber?: number;
    pinnedCommentPackage?: any;
    pinnedCommentVersionNumber?: number;
    metadata?: any;
  }): PackageArtifactHashes {
    // 1. Question Hash
    const q = pkg.question || {};
    let optionsNormalized: Array<{ identifier: string; text: string }> = [];
    if (Array.isArray(q.options)) {
      optionsNormalized = q.options.map((o: any) => ({
        identifier: String(o.identifier || o.key || '').toUpperCase().trim(),
        text: String(o.text || o.value || '').trim(),
      })).sort((a, b) => a.identifier.localeCompare(b.identifier));
    } else if (typeof q.options === 'object' && q.options !== null) {
      optionsNormalized = Object.entries(q.options).map(([k, v]) => ({
        identifier: k.toUpperCase().trim(),
        text: String(v || '').trim(),
      })).sort((a, b) => a.identifier.localeCompare(b.identifier));
    } else {
      optionsNormalized = [
        { identifier: 'A', text: String(q.optionA || '').trim() },
        { identifier: 'B', text: String(q.optionB || '').trim() },
        { identifier: 'C', text: String(q.optionC || '').trim() },
        { identifier: 'D', text: String(q.optionD || '').trim() },
      ].filter((o) => Boolean(o.text));
    }

    const questionPayload = {
      id: String(q.id || '').trim(),
      questionText: String(q.questionText || '').trim(),
      options: optionsNormalized,
      correctAnswer: String(q.correctAnswer || '').trim().toUpperCase(),
      explanation: String(q.explanation || '').trim(),
      language: String(q.language || 'ENGLISH').trim().toUpperCase(),
      topicId: String(q.topicId || '').trim(),
      subtopicId: String(q.subtopicId || '').trim(),
      difficulty: String(q.difficulty || '').trim().toUpperCase(),
    };
    const questionHash = crypto.createHash('sha256').update(JSON.stringify(questionPayload), 'utf8').digest('hex');

    // 2. Script Hash
    const s = pkg.script || {};
    const scriptPayload = {
      id: String(s.id || '').trim(),
      hookText: String(s.hookText || '').trim(),
      problemStatement: String(s.problemStatement || '').trim(),
      stepByStepSolution: String(s.stepByStepSolution || '').trim(),
      speedTrickOrTakeaway: String(s.speedTrickOrTakeaway || '').trim(),
      callToAction: String(s.callToAction || '').trim(),
      versionNumber: Number(pkg.scriptVersionNumber || s.versionNumber || 1),
      isApproved: Boolean(s.isApproved || s.status === 'APPROVED'),
    };
    const scriptHash = crypto.createHash('sha256').update(JSON.stringify(scriptPayload), 'utf8').digest('hex');

    // 3. Video Hash
    const v = pkg.video || {};
    const videoPayload = {
      id: String(v.id || '').trim(),
      status: String(v.status || '').trim(),
      finalRenderWidth: Number(v.finalRenderWidth || 0),
      finalRenderHeight: Number(v.finalRenderHeight || 0),
      finalRenderFormat: String(v.finalRenderFormat || '').trim(),
      finalRenderAspectRatio: String(v.finalRenderAspectRatio || '').trim(),
      actualDurationSeconds: Number(v.actualDurationSeconds || 0),
      driveFileId: String(v.driveFileId || v.finalRenderPath || '').trim(),
      checksumMd5: String(v.checksumMd5 || '').trim(),
      versionNumber: Number(pkg.videoVersionNumber || 1),
    };
    const videoHash = crypto.createHash('sha256').update(JSON.stringify(videoPayload), 'utf8').digest('hex');

    // 4. Thumbnail Hash
    const t = pkg.thumbnail || {};
    const thumbnailPayload = {
      id: String(t.id || '').trim(),
      hookText: String(t.hookText || t.onScreenText || t.caption || '').trim(),
      visualDescription: String(t.visualDescription || t.prompt || '').trim(),
      driveFileId: String(t.driveFileId || t.driveUrl || '').trim(),
      checksumMd5: String(t.checksumMd5 || '').trim(),
      versionNumber: Number(pkg.thumbnailVersionNumber || t.version || 1),
      isApproved: Boolean(t.isApproved || t.status === 'APPROVED'),
    };
    const thumbnailHash = crypto.createHash('sha256').update(JSON.stringify(thumbnailPayload), 'utf8').digest('hex');

    // 5. Pinned Comment Hash
    const pcp = pkg.pinnedCommentPackage || {};
    const followUps = Array.isArray(pcp.followUpQuestions)
      ? [...pcp.followUpQuestions].map((f: string) => String(f || '').trim()).sort()
      : [];
    const pinnedCommentPayload = {
      id: String(pcp.id || '').trim(),
      pinnedComment: String(pcp.pinnedComment || '').trim(),
      answerDiscussionPrompt: String(pcp.answerDiscussionPrompt || '').trim(),
      followUpQuestions: followUps,
      audienceParticipationPrompt: String(pcp.audienceParticipationPrompt || '').trim(),
      versionNumber: Number(pkg.pinnedCommentVersionNumber || pcp.version || 1),
      isApproved: Boolean(pcp.isApproved || pcp.status === 'APPROVED'),
    };
    const pinnedCommentHash = crypto.createHash('sha256').update(JSON.stringify(pinnedCommentPayload), 'utf8').digest('hex');

    // 6. Metadata Hash
    const meta = pkg.metadata || {};
    const hashtags = Array.isArray(meta.hashtags) ? [...meta.hashtags].map(h => String(h).trim()).sort() : [];
    const keywords = Array.isArray(meta.keywords) ? [...meta.keywords].map(k => String(k).trim()).sort() : [];
    const metadataPayload = {
      shortTitle: String(meta.shortTitle || meta.title || '').trim(),
      socialCaption: String(meta.socialCaption || meta.caption || '').trim(),
      hashtags,
      keywords,
      language: String(meta.language || 'ENGLISH').trim().toUpperCase(),
    };
    const metadataHash = crypto.createHash('sha256').update(JSON.stringify(metadataPayload), 'utf8').digest('hex');

    // 7. Package Overall Hash
    const packageOverallPayload = {
      contentId: String(pkg.contentId || '').trim(),
      questionHash,
      scriptHash,
      videoHash,
      thumbnailHash,
      pinnedCommentHash,
      metadataHash,
    };
    const packageOverallHash = crypto.createHash('sha256').update(JSON.stringify(packageOverallPayload), 'utf8').digest('hex');

    return {
      questionHash,
      scriptHash,
      videoHash,
      thumbnailHash,
      pinnedCommentHash,
      metadataHash,
      packageOverallHash,
    };
  }

  /**
   * Assembles the complete content package for a given canonical Content ID.
   */
  public async assemblePackage(
    contentId: string,
    overrides?: {
      question?: any;
      script?: any;
      video?: any;
      thumbnail?: any;
      pinnedCommentPackage?: any;
      metadata?: any;
      platformAdaptations?: any;
    }
  ): Promise<CompleteContentPackage> {
    const canonicalIdRegex = /^BP-CNT-\d{6}$/;
    if (!contentId || !canonicalIdRegex.test(contentId)) {
      throw new ValidationError(`Invalid canonical Content ID format: "${contentId}". Must match BP-CNT-######.`);
    }

    // 1. Content Master
    let contentMaster = await contentMastersRepository.findById(contentId);
    if (!contentMaster) {
      // Look up if any content master exists or construct base representation
      contentMaster = {
        id: contentId,
        title: 'Master for ' + contentId,
        topicId: 'TOPIC-001',
        subtopicId: 'SUB-001',
        status: 'READY_FOR_SOCIAL_REVIEW' as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // 2. Question
    let question = overrides?.question || null;
    if (!question) {
      const qId = (contentMaster as any).questionId || (contentMaster as any).primaryQuestionId;
      if (qId) {
        question = await questionsRepository.findById(qId);
      }
      if (!question) {
        const allQuestions = await questionsRepository.findAll();
        question = allQuestions.find((q) => q.contentMasterId === contentId || (q as any).contentId === contentId) || null;
      }
    }

    if (!question) {
      throw new ReferenceIntegrityError(`Source question not found for Content ID "${contentId}".`);
    }

    // 3. Script & Script Version
    let script = overrides?.script || null;
    if (!script) {
      const sId = (contentMaster as any).scriptId || (contentMaster as any).currentScriptId;
      if (sId) {
        script = await scriptsRepository.findById(sId);
      }
      if (!script && (contentMaster as any).videoId) {
        script = await scriptsRepository.findByVideoId((contentMaster as any).videoId);
      }
      if (!script) {
        const allScripts = await scriptsRepository.findAll();
        script = allScripts.find((s) => (s as any).contentId === contentId || s.questionId === question?.id) || null;
      }
    }

    let scriptVersionNumber = 1;
    if (script) {
      const versions = await scriptVersionsRepository.findByScriptId(script.id);
      if (versions && versions.length > 0) {
        scriptVersionNumber = Math.max(...versions.map((v) => v.versionNumber || 1));
      }
    }

    // 4. Video
    let video = overrides?.video || null;
    if (!video) {
      const vId = (contentMaster as any).videoId || (contentMaster as any).currentVideoId;
      if (vId) {
        video = await videosRepository.findById(vId);
      }
      if (!video && question) {
        const videos = await videosRepository.findByQuestionId(question.id);
        if (videos && videos.length > 0) {
          video = videos[0];
        }
      }
      if (!video) {
        const allVideos = await videosRepository.findAll();
        video = allVideos.find((v) => (v as any).contentId === contentId || v.questionId === question?.id) || null;
      }
    }

    let videoVersionNumber = 1;

    // 5. Video Media Asset
    const allMedia = await mediaAssetsRepository.findByContentId(contentId);
    const videoAsset = allMedia.find((m) => m.mediaStage === 'FINAL' || m.mediaStage === 'EDITED' || (m.mediaStage as any) === 'FINAL_VIDEO');

    // 6. Thumbnail
    let thumbnail = overrides?.thumbnail || null;
    let thumbnailVersionNumber = 1;
    if (!thumbnail) {
      const candidates = await thumbnailCandidatesRepository.findByContentId(contentId);
      const approvedCandidate = candidates.find((c) => c.status === 'APPROVED');
      if (approvedCandidate) {
        thumbnail = approvedCandidate;
        thumbnailVersionNumber = approvedCandidate.version || 1;
      } else {
        const tId = (contentMaster as any).thumbnailId || (contentMaster as any).currentThumbnailId;
        if (tId) {
          thumbnail = await thumbnailsRepository.findById(tId);
        }
        if (!thumbnail) {
          const vId = (contentMaster as any).videoId || (contentMaster as any).currentVideoId;
          if (vId) {
            thumbnail = await thumbnailsRepository.findByVideoId(vId);
          }
        }
        if (!thumbnail) {
          const allThumbnails = await thumbnailsRepository.findAll();
          thumbnail = allThumbnails.find((t) => (t as any).contentId === contentId || (t as any).questionId === question?.id) || null;
        }
        if (thumbnail) {
          const versions = await thumbnailVersionsRepository.findByThumbnailId(thumbnail.id);
          if (versions.length > 0) {
            thumbnailVersionNumber = versions.length;
          }
        }
      }
    }

    const thumbnailAsset = allMedia.find((m) => m.mediaStage === 'THUMBNAIL');

    // 7. Pinned Comment Package
    let pinnedCommentPackage = overrides?.pinnedCommentPackage || null;
    let pinnedCommentVersionNumber = 1;
    if (!pinnedCommentPackage) {
      pinnedCommentPackage = await pinnedCommentPackagesRepository.findByContentId(contentId);
      if (pinnedCommentPackage) {
        pinnedCommentVersionNumber = pinnedCommentPackage.version || 1;
      }
    }

    // 8. Metadata
    const metadata = overrides?.metadata || {
      id: `META-${contentId}`,
      shortTitle: (contentMaster as any).title || `Speed Math Trick | ${question.topicName || 'Aptitude'}`,
      socialCaption: question.questionText || '',
      hashtags: ['#BurraPariksha', '#TeluguQuiz', '#Shorts'],
      keywords: ['telugu aptitude', 'speed math', 'exam preparation'],
      language: question.language || 'TELUGU',
    };

    // 9. Compute Integrity Hashes & Version Lock
    const hashes = this.computeIntegrityHashes({
      contentId,
      question,
      script,
      scriptVersionNumber,
      video,
      videoVersionNumber,
      thumbnail,
      thumbnailVersionNumber,
      pinnedCommentPackage,
      pinnedCommentVersionNumber,
      metadata,
    });

    const versionLock: PackageVersionLock = {
      contentId,
      questionId: question.id,
      questionVersion: (question as any).version || 1,
      scriptId: script?.id || '',
      scriptVersion: scriptVersionNumber,
      videoId: video?.id || '',
      videoVersion: videoVersionNumber,
      thumbnailId: thumbnail?.id || '',
      thumbnailVersion: thumbnailVersionNumber,
      pinnedCommentPackageId: pinnedCommentPackage?.id || '',
      pinnedCommentVersion: pinnedCommentVersionNumber,
      hashes,
    };

    return {
      contentId,
      contentMaster,
      question,
      questionVersion: (question as any).version || 1,
      script: script as any,
      scriptVersionNumber,
      video: video as any,
      videoVersionNumber,
      videoAsset,
      thumbnail,
      thumbnailVersionNumber,
      thumbnailAsset,
      pinnedCommentPackage,
      pinnedCommentVersionNumber,
      metadata,
      platformAdaptations: overrides?.platformAdaptations,
      versionLock,
    };
  }

  /**
   * Submits a content package for Social Review (transitions to IN_REVIEW).
   */
  public async submitForReview(
    contentId: string,
    actor: WorkflowActor,
    assignedReviewerId?: string,
    overrides?: any
  ): Promise<SocialReviewRecord> {
    this.verifyRole(actor, ['ADMIN', 'CONTENT_MANAGER', 'REVIEWER', 'TOPIC_LEAD', 'SCRIPT_WRITER', 'VIDEO_EDITOR'], 'submit content package for social review');

    const pkg = await this.assemblePackage(contentId, overrides);
    const report = SocialQualityGateValidator.validate(pkg);

    const now = new Date().toISOString();
    const recordId = `BP-SRV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const reviewRecord: SocialReviewRecord = {
      id: recordId,
      contentId,
      status: 'IN_REVIEW',
      assignedReviewerId: assignedReviewerId || undefined,
      versionLock: pkg.versionLock,
      validationSummary: {
        isValid: report.isValid,
        issues: report.issues,
        warnings: report.warnings,
        checksPassed: report.checksPassed,
      },
      isInvalidated: false,
      createdAt: now,
      updatedAt: now,
    };

    await socialReviewsRepository.createSocialReviewRecord(reviewRecord);

    await auditService.log(
      actor.id,
      actor.name || 'Workflow Actor',
      'SUBMIT_SOCIAL_REVIEW',
      'SOCIAL_REVIEW',
      recordId,
      { details: `Submitted content package "${contentId}" for social review. Valid: ${report.isValid}.` }
    );

    return reviewRecord;
  }

  /**
   * Completes a social review decision (PASS, CHANGES_REQUIRED, REJECTED).
   */
  public async completeReview(params: {
    reviewId: string;
    decision: SocialReviewDecision;
    reason?: string;
    feedbackCategories?: string[];
    actor: WorkflowActor;
    expectedVersionLock?: PackageVersionLock;
    overrides?: any;
  }): Promise<SocialReviewRecord> {
    const { reviewId, decision, reason, feedbackCategories, actor, expectedVersionLock, overrides } = params;

    // 1. RBAC check: only authorized reviewers can complete review
    this.verifyRole(actor, ['ADMIN', 'CONTENT_MANAGER', 'REVIEWER', 'TOPIC_LEAD'], 'complete social review decision');

    // 2. Fetch review record
    const existingReview = await socialReviewsRepository.findSocialReviewById(reviewId);
    if (!existingReview) {
      throw new ReferenceIntegrityError(`Social review record "${reviewId}" does not exist.`);
    }

    const contentId = existingReview.contentId;

    // 3. Assemble current live package
    const livePackage = await this.assemblePackage(contentId, overrides);

    // 4. Concurrency / Version lock check
    if (expectedVersionLock) {
      if (expectedVersionLock.hashes.packageOverallHash !== livePackage.versionLock.hashes.packageOverallHash) {
        throw new ValidationError(
          'Stale review request: Content package has been modified since review package was loaded. Please refresh before submitting.'
        );
      }
    }

    // 5. Validate decision specific gates
    const now = new Date().toISOString();
    let updatedRecord: SocialReviewRecord;

    if (decision === 'PASS') {
      const report = SocialQualityGateValidator.validate(livePackage);
      if (!report.isValid) {
        throw new ValidationError(
          `Cannot PASS social review: Quality Gate violations detected: ${report.issues.join('; ')}`
        );
      }

      updatedRecord = await socialReviewsRepository.updateSocialReviewRecord(reviewId, {
        status: 'PASS',
        decision: 'PASS',
        decisionReason: reason || 'Approved all quality gate and invariance checks.',
        feedbackCategories: feedbackCategories || [],
        reviewedBy: actor.id,
        reviewedByName: actor.name,
        reviewedByRole: String(actor.role || 'REVIEWER'),
        reviewedAt: now,
        versionLock: livePackage.versionLock,
        validationSummary: {
          isValid: true,
          issues: report.issues,
          warnings: report.warnings,
          checksPassed: report.checksPassed,
        },
        isInvalidated: false,
      });

      await auditService.log(
        actor.id,
        actor.name || 'Workflow Reviewer',
        'PASS_SOCIAL_REVIEW',
        'SOCIAL_REVIEW',
        reviewId,
        { details: `Passed social review for content "${contentId}". Version hash: ${livePackage.versionLock.hashes.packageOverallHash.slice(0, 12)}...` }
      );
    } else if (decision === 'CHANGES_REQUIRED') {
      const reasonText = (reason || '').trim();
      if (!reasonText || reasonText.length < 10) {
        throw new ValidationError('A detailed reason containing at least 10 meaningful characters is required when requesting changes.');
      }

      updatedRecord = await socialReviewsRepository.updateSocialReviewRecord(reviewId, {
        status: 'CHANGES_REQUIRED',
        decision: 'CHANGES_REQUIRED',
        decisionReason: reasonText,
        feedbackCategories: feedbackCategories || ['EDITORIAL'],
        reviewedBy: actor.id,
        reviewedByName: actor.name,
        reviewedByRole: String(actor.role || 'REVIEWER'),
        reviewedAt: now,
        versionLock: livePackage.versionLock,
        isInvalidated: false,
      });

      await auditService.log(
        actor.id,
        actor.name || 'Workflow Reviewer',
        'REQUEST_CHANGES_SOCIAL_REVIEW',
        'SOCIAL_REVIEW',
        reviewId,
        { details: `Requested changes for content "${contentId}". Reason: ${reasonText}` }
      );
    } else if (decision === 'REJECTED') {
      const reasonText = (reason || '').trim();
      if (!reasonText || reasonText.length < 10) {
        throw new ValidationError('A detailed reason containing at least 10 meaningful characters is required when rejecting a package.');
      }

      updatedRecord = await socialReviewsRepository.updateSocialReviewRecord(reviewId, {
        status: 'REJECTED',
        decision: 'REJECTED',
        decisionReason: reasonText,
        feedbackCategories: feedbackCategories || ['QUALITY'],
        reviewedBy: actor.id,
        reviewedByName: actor.name,
        reviewedByRole: String(actor.role || 'REVIEWER'),
        reviewedAt: now,
        versionLock: livePackage.versionLock,
        isInvalidated: false,
      });

      await auditService.log(
        actor.id,
        actor.name || 'Workflow Reviewer',
        'REJECT_SOCIAL_REVIEW',
        'SOCIAL_REVIEW',
        reviewId,
        { details: `Rejected content package "${contentId}". Reason: ${reasonText}` }
      );
    } else {
      throw new ValidationError(`Unknown review decision "${decision}".`);
    }

    return updatedRecord;
  }

  /**
   * Generates a non-binding AI review recommendation using Gemini.
   * Human review remains authoritative. AI failure never corrupts production packages.
   */
  public async generateAiReviewRecommendation(contentId: string): Promise<{
    recommendedDecision: SocialReviewDecision;
    confidence: number;
    rationale: string;
    flaggedIssues: string[];
    isAiGenerated: boolean;
    modelUsed: string;
  }> {
    const pkg = await this.assemblePackage(contentId);
    const deterministicReport = SocialQualityGateValidator.validate(pkg);

    if (aiOrchestrator.isConfigured() && pkg.question) {
      try {
        const assessment = await aiOrchestrator.generateSocialQualityAssessment(pkg.question, pkg.script || undefined);
        if (assessment) {
          const isPass = assessment.overallAssessment === 'PUBLISH_READY' || deterministicReport.isValid;
          return {
            recommendedDecision: isPass ? 'PASS' : 'CHANGES_REQUIRED',
            confidence: assessment.publishReadinessScore ? assessment.publishReadinessScore / 100 : 0.88,
            rationale: assessment.overallRecommendation || 'AI social quality assessment completed.',
            flaggedIssues: assessment.criticalIssues || [],
            isAiGenerated: true,
            modelUsed: 'gemini-3.1-flash-lite',
          };
        }
      } catch (err: any) {
        console.warn('[SocialQualityGateService] Gemini review recommendation call failed, applying deterministic fallback:', err?.message);
      }
    }

    // Deterministic fallback
    return {
      recommendedDecision: deterministicReport.isValid ? 'PASS' : 'CHANGES_REQUIRED',
      confidence: 0.9,
      rationale: deterministicReport.isValid
        ? 'Deterministic checks passed: all invariance, quality gate, and correlation requirements are satisfied.'
        : `Deterministic checks flagged issues: ${deterministicReport.issues.join(', ')}`,
      flaggedIssues: deterministicReport.issues,
      isAiGenerated: false,
      modelUsed: 'RULE_ENGINE',
    };
  }

  /**
   * Verifies production readiness for publishing (Phase 21/22).
   * Verifies that the package has an active, valid PASS social review,
   * and that no artifact has been modified since the review occurred.
   */
  public async verifyProductionReadiness(
    contentId: string,
    overrides?: any
  ): Promise<ProductionReadinessResult> {
    const livePackage = await this.assemblePackage(contentId, overrides);
    const latestReview = await socialReviewsRepository.getLatestSocialReviewByContentId(contentId);

    if (!latestReview) {
      return {
        isProductionReady: false,
        contentId,
        issues: ['No social review record found. Content must undergo social review before publishing.'],
        hashesMatch: false,
      };
    }

    if (latestReview.status !== 'PASS') {
      return {
        isProductionReady: false,
        contentId,
        reviewRecord: latestReview,
        issues: [`Social review status is "${latestReview.status}". Only PASS status is production-ready.`],
        hashesMatch: false,
      };
    }

    if (latestReview.isInvalidated) {
      return {
        isProductionReady: false,
        contentId,
        reviewRecord: latestReview,
        issues: [`Social review was invalidated: ${latestReview.invalidatedReason || 'Artifact changed after approval'}. Re-review required.`],
        hashesMatch: false,
      };
    }

    // Verify version hashes match exactly
    const liveHash = livePackage.versionLock.hashes.packageOverallHash;
    const reviewedHash = latestReview.versionLock?.hashes?.packageOverallHash;

    if (liveHash !== reviewedHash) {
      // Invalidate the stale review
      const invalidatedRecord = await socialReviewsRepository.updateSocialReviewRecord(latestReview.id, {
        isInvalidated: true,
        invalidatedReason: 'Artifact modification detected after social review approval',
        invalidatedAt: new Date().toISOString(),
      });

      await auditService.log(
        'SYSTEM',
        'Quality Gate Monitor',
        'INVALIDATE_SOCIAL_REVIEW',
        'SOCIAL_REVIEW',
        latestReview.id,
        { details: `Invalidated social review for content "${contentId}" due to hash mismatch (Live: ${liveHash.slice(0, 8)}, Reviewed: ${reviewedHash?.slice(0, 8)}).` }
      );

      return {
        isProductionReady: false,
        contentId,
        reviewRecord: invalidatedRecord,
        issues: ['Content artifacts were modified after social review approval. Previous PASS has been invalidated.'],
        hashesMatch: false,
      };
    }

    // Live validation gate check
    const report = SocialQualityGateValidator.validate(livePackage);
    if (!report.isValid) {
      return {
        isProductionReady: false,
        contentId,
        reviewRecord: latestReview,
        issues: report.issues,
        hashesMatch: true,
      };
    }

    return {
      isProductionReady: true,
      contentId,
      reviewRecord: latestReview,
      issues: [],
      hashesMatch: true,
    };
  }

  /**
   * Invalidates existing PASS reviews for a content ID when an upstream artifact changes.
   */
  public async invalidateReviewIfArtifactsChanged(contentId: string, reason: string): Promise<boolean> {
    const count = await socialReviewsRepository.invalidateSocialReviewsForContent(contentId, reason);
    if (count > 0) {
      await auditService.log(
        'SYSTEM',
        'Workflow Monitor',
        'INVALIDATE_SOCIAL_REVIEW',
        'SOCIAL_REVIEW',
        contentId,
        { details: `Invalidated ${count} social review(s) for "${contentId}". Reason: ${reason}` }
      );
      return true;
    }
    return false;
  }

  /**
   * Retrieves full review history for a Content ID.
   */
  public async getReviewHistory(contentId: string): Promise<SocialReviewRecord[]> {
    return socialReviewsRepository.findSocialReviewByContentId(contentId);
  }
}

export const socialQualityGateService = SocialQualityGateService.getInstance();
