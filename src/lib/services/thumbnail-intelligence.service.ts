/**
 * BURRA PARIKSHA CMS - Phase 18 AI Thumbnail Intelligence Service
 * 
 * End-to-End AI-Assisted Thumbnail Intelligence & Asset Management:
 * Content ID (BP-CNT-######)
 * → AI Thumbnail Concepts (A/B testing, curiosity hooks, visual direction, audience targeting)
 * → Human Review & Approval Workflow (DRAFT → IN_REVIEW → APPROVED / REJECTED)
 * → Real Google Drive Binary Ingestion (Phase 14 Drive hierarchy BP-CNT-######/Thumbnail/)
 * 
 * Enforces:
 * - Content ID preservation and rejection of cross-content associations
 * - Strict separation of thumbnail technical ID from canonical Content ID
 * - Answer-leakage protection (zero spoilers on thumbnails)
 * - Mobile readability & scroll-stopping compliance
 * - RBAC & Human-in-the-loop approval protection
 * - AI failure fallback & manual candidate creation
 */

import {
  AiThumbnailConcept,
  ThumbnailCandidate,
  ThumbnailCandidateVersion,
  Thumbnail,
  ThumbnailVersion,
  ThumbnailProductionHistory,
  ThumbnailSafetyReport,
  MediaAsset,
  UserRole,
  Question,
  Script,
  Video,
} from '../../types';
import { thumbnailCandidatesRepository } from '../repositories/thumbnail-candidates.repository';
import { thumbnailsRepository } from '../repositories/thumbnails.repository';
import { thumbnailVersionsRepository } from '../repositories/thumbnail-versions.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { scriptsRepository } from '../repositories/scripts.repository';
import { videosRepository } from '../repositories/videos.repository';
import { mediaAssetsRepository } from '../repositories/media-assets.repository';
import { driveSyncService } from './drive-sync.service';
import { googleDriveService } from './google-drive.service';
import { aiOrchestrator } from '../ai/ai-orchestrator.service';
import { auditService } from './audit.service';
import { idService } from './id.service';
import { ThumbnailSafetyValidator } from '../validators/thumbnail-safety.validator';
import { ValidationError, ReferenceIntegrityError, AuthorizationError } from '../google-sheets/errors';
import { WorkflowActor } from './video-production.service';
export type { WorkflowActor };

export interface CreateManualCandidateInput {
  contentId: string;
  conceptName: string;
  abVariant?: string;
  hookHeadline: string;
  curiosityAngle?: string;
  psychologicalTrigger?: string;
  hypothesis?: string;
  composition?: string;
  colorPalette?: string[];
  focalPoint?: string;
  emotionOrExpression?: string;
  brandingElements?: string;
  primaryAudience?: string;
  secondaryAudience?: string;
  languageStyle?: 'TELUGU' | 'ENGLISH' | 'BILINGUAL';
  difficultyPerception?: 'LOOKS_EASY_BUT_HARD' | 'CHALLENGE_FOR_GENIUSES' | 'FAST_TRICK';
  notes?: string;
}

export interface UploadThumbnailBinaryInput {
  contentId: string;
  candidateId?: string;
  fileName: string;
  mimeType: string;
  imageBinaryBuffer?: Buffer;
  fileBuffer?: Buffer;
  designerNotes?: string;
}

export interface ThumbnailBinaryUploadResult {
  thumbnail: Thumbnail;
  mediaAsset: MediaAsset;
  thumbnailVersion: ThumbnailVersion;
  driveFileUrl: string;
  drivePreviewUrl: string;
  candidate?: ThumbnailCandidate | null;
}

export class ThumbnailIntelligenceService {
  private static instance: ThumbnailIntelligenceService | null = null;

  public static getInstance(): ThumbnailIntelligenceService {
    if (!ThumbnailIntelligenceService.instance) {
      ThumbnailIntelligenceService.instance = new ThumbnailIntelligenceService();
    }
    return ThumbnailIntelligenceService.instance;
  }

  public async getCandidatesForContent(contentId: string): Promise<ThumbnailCandidate[]> {
    return thumbnailCandidatesRepository.findByContentId(contentId);
  }

  /**
   * RBAC verification helper
   */
  private verifyRole(actor: WorkflowActor, allowedRoles: string[], actionDescription: string): void {
    const actorRole = actor.role ? String(actor.role).toUpperCase() : '';
    const actorRoles = (actor.roles || []).map((r) => String(r).toUpperCase());
    if (actorRole) actorRoles.push(actorRole);

    const isAllowed = actorRoles.some((r) => allowedRoles.includes(r) || r === UserRole.ADMIN);
    if (!isAllowed) {
      throw new AuthorizationError(
        `Forbidden: Role "${actor.role || 'UNKNOWN'}" is not authorized to ${actionDescription}. Required roles: [${allowedRoles.join(', ')}]`
      );
    }
  }

  /**
   * Validates Content ID format BP-CNT-######
   */
  public validateContentIdFormat(contentId: string): void {
    if (!contentId || !/^BP-CNT-\d{6}$/.test(contentId)) {
      throw new ValidationError(`Invalid Content ID format: "${contentId}". Expected canonical format BP-CNT-######.`);
    }
  }

  /**
   * Generates AI Thumbnail Concepts for a given Content ID.
   * Produces structured, non-approved candidate variants (A/B testing).
   */
  public async generateConceptsForContent(
    contentId: string,
    actor: WorkflowActor,
    options?: { numberOfVariants?: number }
  ): Promise<ThumbnailCandidate[]> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.THUMBNAIL_DESIGNER, UserRole.DESIGNER, UserRole.TOPIC_LEAD],
      'generate thumbnail concepts'
    );

    this.validateContentIdFormat(contentId);

    // Verify Content Master exists
    const contentMaster = await contentMastersRepository.findById(contentId);
    if (!contentMaster) {
      throw new ReferenceIntegrityError(`Content master record not found for Content ID: ${contentId}`);
    }

    // Locate related Question
    const questionId = contentMaster.primaryQuestionId || (contentMaster as any).questionId;
    let question: Question | null = null;
    if (questionId) {
      question = await questionsRepository.findById(questionId);
    }
    if (!question) {
      const allQuestions = await questionsRepository.findAll();
      question = allQuestions.find((q) => q.contentId === contentId || q.contentMasterId === contentId) || null;
    }
    if (!question) {
      throw new ReferenceIntegrityError(`Question record not found for Content ID: ${contentId}`);
    }

    // Locate optional Script and Video
    let script: Script | undefined;
    const allScripts = await scriptsRepository.findAll();
    const foundScript = allScripts.find((s) => s.contentId === contentId || s.contentMasterId === contentId || s.questionId === question!.id);
    if (foundScript) script = foundScript;

    let video: Video | undefined;
    const allVideos = await videosRepository.findAll();
    const foundVideo = allVideos.find((v) => v.contentId === contentId || v.contentMasterId === contentId || v.questionId === question!.id);
    if (foundVideo) video = foundVideo;

    // Request AI Concepts from Phase24 Orchestrator
    const concepts = await aiOrchestrator.generateThumbnailIntelligence(question, contentId, {
      script,
      video,
      numberOfVariants: options?.numberOfVariants || 2,
    });

    const now = new Date().toISOString();
    const createdCandidates: ThumbnailCandidate[] = [];

    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];
      const variantLetter = concept.abVariant || String.fromCharCode(65 + i);
      const candidateTechnicalId = `BP-TC-${contentId.replace(/^BP-CNT-/, '')}-${variantLetter}`;

      const candidate: ThumbnailCandidate = {
        id: candidateTechnicalId,
        contentId,
        questionId: question.id,
        scriptId: script?.id,
        videoId: video?.id,
        conceptName: concept.conceptName,
        abVariant: variantLetter,
        hookHeadline: concept.hookHeadline,
        curiosityFraming: concept.curiosityFraming,
        visualDirection: concept.visualDirection,
        audienceTargeting: concept.audienceTargeting,
        version: 1,
        status: 'DRAFT',
        isAiGenerated: true,
        notes: concept.notes,
        createdAt: now,
        updatedAt: now,
      };

      const saved = await thumbnailCandidatesRepository.create(candidate);
      createdCandidates.push(saved);
    }

    // Audit trail
    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'GENERATE_AI_THUMBNAIL_CONCEPTS',
      'THUMBNAIL',
      contentId,
      { candidateIds: createdCandidates.map((c) => c.id) }
    );

    return createdCandidates;
  }

  /**
   * Manual creation of a thumbnail candidate (supporting AI-independent fallback).
   */
  public async createCandidateManual(
    input: CreateManualCandidateInput,
    actor: WorkflowActor
  ): Promise<ThumbnailCandidate> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.THUMBNAIL_DESIGNER, UserRole.DESIGNER, UserRole.TOPIC_LEAD],
      'create manual thumbnail candidate'
    );

    this.validateContentIdFormat(input.contentId);

    const contentMaster = await contentMastersRepository.findById(input.contentId);
    if (!contentMaster) {
      throw new ReferenceIntegrityError(`Content master not found for Content ID: ${input.contentId}`);
    }

    const questionId = contentMaster.primaryQuestionId || (contentMaster as any).questionId;
    let question: Question | null = null;
    if (questionId) {
      question = await questionsRepository.findById(questionId);
    }
    if (!question) {
      const allQuestions = await questionsRepository.findAll();
      question = allQuestions.find((q) => q.contentId === input.contentId || q.contentMasterId === input.contentId) || null;
    }
    if (!question) {
      throw new ReferenceIntegrityError(`Question not found for Content ID: ${input.contentId}`);
    }

    // Locate optional Script and Video
    const allScripts = await scriptsRepository.findAll();
    const script = allScripts.find((s) => s.contentId === input.contentId || s.contentMasterId === input.contentId || s.questionId === question!.id);

    const allVideos = await videosRepository.findAll();
    const video = allVideos.find((v) => v.contentId === input.contentId || v.contentMasterId === input.contentId || v.questionId === question!.id);

    // Enforce safety validator (answer leakage & brevity check)
    const safetyReport = ThumbnailSafetyValidator.validate(input.hookHeadline, question);
    if (!safetyReport.isValid) {
      throw new ValidationError(
        `Thumbnail safety validation failed: ${safetyReport.issues.join('; ')}`
      );
    }

    const now = new Date().toISOString();
    const existing = await thumbnailCandidatesRepository.findByContentId(input.contentId);
    const variantLetter = input.abVariant || String.fromCharCode(65 + existing.length);
    const candidateTechnicalId = `BP-TC-${input.contentId.replace(/^BP-CNT-/, '')}-${variantLetter}`;

    const candidate: ThumbnailCandidate = {
      id: candidateTechnicalId,
      contentId: input.contentId,
      questionId: question.id,
      scriptId: script?.id,
      videoId: video?.id,
      conceptName: input.conceptName,
      abVariant: variantLetter,
      hookHeadline: input.hookHeadline.trim(),
      curiosityFraming: {
        curiosityAngle: input.curiosityAngle || 'Core Conceptual Paradox',
        psychologicalTrigger: input.psychologicalTrigger || 'Counter-Intuitive Revelation',
        hypothesis: input.hypothesis || 'High contrast question hooks test-takers instantly.',
      },
      visualDirection: {
        composition: input.composition || 'Split-screen high contrast dilemma with bold focal subject',
        colorPalette: input.colorPalette || ['#FFE600', '#000000', '#FFFFFF', '#FF3B30'],
        focalPoint: input.focalPoint || 'Bold central inquiry graphic',
        emotionOrExpression: input.emotionOrExpression || 'High curiosity / inquisitive intrigue',
        brandingElements: input.brandingElements || 'Burra Pariksha corner badge',
      },
      audienceTargeting: {
        primaryAudience: input.primaryAudience || 'Competitive Exam Aspirants (APPSC / TSPSC)',
        secondaryAudience: input.secondaryAudience || 'Curious General Students',
        languageStyle: input.languageStyle || 'BILINGUAL',
        difficultyPerception: input.difficultyPerception || 'LOOKS_EASY_BUT_HARD',
      },
      version: 1,
      status: 'DRAFT',
      isAiGenerated: false,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await thumbnailCandidatesRepository.create(candidate);

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'CREATE_MANUAL_THUMBNAIL_CANDIDATE',
      'THUMBNAIL',
      saved.id,
      { candidateId: saved.id, contentId: input.contentId }
    );

    return saved;
  }

  /**
   * Human edit of an existing thumbnail candidate.
   * Increments version, records history, and invalidates approval if previously approved.
   */
  public async updateCandidate(
    candidateId: string,
    updates: Partial<ThumbnailCandidate>,
    actor: WorkflowActor
  ): Promise<ThumbnailCandidate> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.THUMBNAIL_DESIGNER, UserRole.DESIGNER, UserRole.TOPIC_LEAD],
      'update thumbnail candidate'
    );

    const existing = await thumbnailCandidatesRepository.findById(candidateId);
    if (!existing) {
      throw new ReferenceIntegrityError(`Thumbnail candidate not found: ${candidateId}`);
    }

    // Cross-content association protection
    if (updates.contentId && updates.contentId !== existing.contentId) {
      throw new ValidationError(
        `Cross-content modification rejected. Candidate ${candidateId} belongs to ${existing.contentId}, cannot assign to ${updates.contentId}.`
      );
    }

    // If hookHeadline is updated, re-validate for safety
    if (updates.hookHeadline && updates.hookHeadline !== existing.hookHeadline) {
      const question = await questionsRepository.findById(existing.questionId);
      if (question) {
        const safetyReport = ThumbnailSafetyValidator.validate(updates.hookHeadline, question);
        if (!safetyReport.isValid) {
          throw new ValidationError(
            `Thumbnail safety validation failed: ${safetyReport.issues.join('; ')}`
          );
        }
      }
    }

    const newVersion = existing.version + 1;
    const now = new Date().toISOString();

    // Check if editing an approved candidate: invalidates approval!
    const wasApproved = existing.status === 'APPROVED';
    const nextStatus = wasApproved ? 'DRAFT' : (updates.status || existing.status);

    const updatedCandidate: ThumbnailCandidate = {
      ...existing,
      ...updates,
      id: existing.id,
      contentId: existing.contentId, // Immutable canonical correlation
      questionId: existing.questionId,
      version: newVersion,
      status: nextStatus,
      // If invalidated, clear approval metadata
      approvedBy: wasApproved ? undefined : existing.approvedBy,
      approvedVersion: wasApproved ? undefined : existing.approvedVersion,
      approvedAt: wasApproved ? undefined : existing.approvedAt,
      updatedAt: now,
    };

    // Record version history snapshot
    const versionRecord: ThumbnailCandidateVersion = {
      id: `TCV-${candidateId.replace(/^BP-TC-|^TC-/, '')}-${newVersion}`,
      candidateId,
      versionNumber: newVersion,
      contentSnapshot: { ...existing },
      editedBy: actor.name || actor.id,
      changeSummary: wasApproved
        ? `Edited approved candidate; approval invalidated and version bumped to ${newVersion}`
        : `Updated candidate details; bumped to version ${newVersion}`,
      createdAt: now,
    };

    await thumbnailCandidatesRepository.recordVersion(versionRecord);
    const saved = await thumbnailCandidatesRepository.update(candidateId, updatedCandidate);

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      wasApproved ? 'INVALIDATE_APPROVED_THUMBNAIL' : 'UPDATE_THUMBNAIL_CANDIDATE',
      'THUMBNAIL',
      candidateId,
      { version: newVersion, wasApproved, nextStatus }
    );

    return saved;
  }

  /**
   * Submits a candidate for editorial review (DRAFT → IN_REVIEW).
   */
  public async submitForReview(
    candidateId: string,
    actor: WorkflowActor,
    reviewerId?: string
  ): Promise<ThumbnailCandidate> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.THUMBNAIL_DESIGNER, UserRole.DESIGNER, UserRole.TOPIC_LEAD],
      'submit thumbnail candidate for review'
    );

    const candidate = await thumbnailCandidatesRepository.findById(candidateId);
    if (!candidate) {
      throw new ReferenceIntegrityError(`Thumbnail candidate not found: ${candidateId}`);
    }

    const updated = await thumbnailCandidatesRepository.update(candidateId, {
      status: 'IN_REVIEW',
      assignedReviewerId: reviewerId || candidate.assignedReviewerId,
    });

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'SUBMIT_THUMBNAIL_REVIEW',
      'THUMBNAIL',
      candidateId,
      { status: 'IN_REVIEW', assignedReviewerId: reviewerId }
    );

    return updated;
  }

  /**
   * Human approval of a candidate (IN_REVIEW / DRAFT → APPROVED).
   * Enforces:
   * - Authorized human role check
   * - Exact version match (rejects stale approvals)
   * - Cross-content correlation protection
   * - Answer-leakage validation
   * - Synchronizes approved status to thumbnails sheet
   */
  public async approveCandidate(
    candidateId: string,
    targetVersion: number,
    actor: WorkflowActor,
    expectedContentId?: string
  ): Promise<{ candidate: ThumbnailCandidate; thumbnailRecord: Thumbnail }> {
    // 1. Authorization check
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER, UserRole.TOPIC_LEAD, UserRole.THUMBNAIL_DESIGNER],
      'approve thumbnail candidate'
    );

    const candidate = await thumbnailCandidatesRepository.findById(candidateId);
    if (!candidate) {
      throw new ReferenceIntegrityError(`Thumbnail candidate not found: ${candidateId}`);
    }

    // 2. Cross-content check
    if (expectedContentId && expectedContentId !== candidate.contentId) {
      throw new ValidationError(
        `Cross-content approval rejected. Candidate ${candidateId} belongs to ${candidate.contentId}, cannot approve under ${expectedContentId}.`
      );
    }

    // 3. Stale version protection
    if (candidate.version !== targetVersion) {
      throw new ValidationError(
        `Stale version rejection: candidate is at version ${candidate.version}, but approval was requested for version ${targetVersion}.`
      );
    }

    // 4. Safety verification
    const question = await questionsRepository.findById(candidate.questionId);
    if (question) {
      const safetyReport = ThumbnailSafetyValidator.validate(candidate.hookHeadline, question);
      if (!safetyReport.isValid) {
        throw new ValidationError(
          `Cannot approve candidate with safety violations: ${safetyReport.issues.join('; ')}`
        );
      }
    }

    const now = new Date().toISOString();

    // 5. Update Candidate
    const approvedCandidate = await thumbnailCandidatesRepository.update(candidateId, {
      status: 'APPROVED',
      approvedBy: actor.name || actor.id,
      approvedVersion: targetVersion,
      approvedAt: now,
    });

    // 6. Synchronize with Thumbnails Sheet repository
    const technicalThumbnailId = `BP-T-${candidate.contentId.replace(/^BP-CNT-/, '')}`;
    let existingThumb = await thumbnailsRepository.findById(technicalThumbnailId);

    if (!existingThumb) {
      // Allocate or create thumbnail record
      existingThumb = await thumbnailsRepository.create({
        id: technicalThumbnailId,
        contentId: candidate.contentId,
        contentMasterId: candidate.contentId,
        videoId: candidate.videoId || `BP-V-${candidate.contentId.replace(/^BP-CNT-/, '')}`,
        hookHeadline: candidate.hookHeadline,
        status: 'APPROVED',
        currentVersion: targetVersion,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      existingThumb = await thumbnailsRepository.update(technicalThumbnailId, {
        hookHeadline: candidate.hookHeadline,
        status: 'APPROVED',
        currentVersion: targetVersion,
        updatedAt: now,
      });
    }

    // 7. Audit log
    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'APPROVE_THUMBNAIL_CANDIDATE',
      'THUMBNAIL',
      candidateId,
      { candidateId, version: targetVersion, technicalThumbnailId }
    );

    return {
      candidate: approvedCandidate,
      thumbnailRecord: existingThumb,
    };
  }

  /**
   * Human rejection of a candidate.
   */
  public async rejectCandidate(
    candidateId: string,
    reason: string,
    actor: WorkflowActor
  ): Promise<ThumbnailCandidate> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER, UserRole.TOPIC_LEAD, UserRole.THUMBNAIL_DESIGNER],
      'reject thumbnail candidate'
    );

    if (!reason || !reason.trim()) {
      throw new ValidationError('Rejection reason is required.');
    }

    const candidate = await thumbnailCandidatesRepository.findById(candidateId);
    if (!candidate) {
      throw new ReferenceIntegrityError(`Thumbnail candidate not found: ${candidateId}`);
    }

    const updated = await thumbnailCandidatesRepository.update(candidateId, {
      status: 'REJECTED',
      rejectedReason: reason.trim(),
    });

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'REJECT_THUMBNAIL_CANDIDATE',
      'THUMBNAIL',
      candidateId,
      { status: 'REJECTED', reason: reason.trim() }
    );

    return updated;
  }

  /**
   * Uploads real thumbnail binary to Google Drive under:
   * BP-CNT-######/Thumbnail/
   * 
   * Uses Phase 14 Drive infrastructure:
   * - Enforces MIME type (image/png, image/jpeg) and size limits (<= 5MB)
   * - Saves Drive file ID, folder hierarchy, and MD5 checksum
   * - Records MediaAsset and updates Thumbnails & ThumbnailVersions in sheets
   */
  public async uploadThumbnailBinary(
    input: UploadThumbnailBinaryInput,
    actor: WorkflowActor
  ): Promise<ThumbnailBinaryUploadResult> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.THUMBNAIL_DESIGNER, UserRole.DESIGNER, UserRole.VIDEO_EDITOR],
      'upload thumbnail binary'
    );

    this.validateContentIdFormat(input.contentId);

    // Verify Content Master
    const contentMaster = await contentMastersRepository.findById(input.contentId);
    if (!contentMaster) {
      throw new ReferenceIntegrityError(`Content master not found for Content ID: ${input.contentId}`);
    }

    // If candidateId is supplied, verify association and reject cross-content
    let candidate: ThumbnailCandidate | null = null;
    if (input.candidateId) {
      candidate = await thumbnailCandidatesRepository.findById(input.candidateId);
      if (!candidate) {
        throw new ReferenceIntegrityError(`Thumbnail candidate not found: ${input.candidateId}`);
      }
      if (candidate.contentId !== input.contentId) {
        throw new ValidationError(
          `Cross-content upload rejected. Candidate ${input.candidateId} belongs to ${candidate.contentId}, but upload specified ${input.contentId}.`
        );
      }
    }

    const binaryBuffer = input.imageBinaryBuffer || input.fileBuffer;
    if (!binaryBuffer) {
      throw new ValidationError('imageBinaryBuffer or fileBuffer is required for thumbnail upload');
    }

    // Call Phase 14 Drive service to upload production asset to Google Drive
    const mediaAsset = await driveSyncService.uploadProductionAsset({
      contentId: input.contentId,
      mediaStage: 'THUMBNAIL',
      fileName: input.fileName,
      mimeType: input.mimeType,
      bodyStreamOrBuffer: binaryBuffer,
    });

    const now = new Date().toISOString();
    const technicalThumbnailId = `BP-T-${input.contentId.replace(/^BP-CNT-/, '')}`;
    const driveFileUrl = `https://drive.google.com/file/d/${mediaAsset.driveFileId}/view`;
    const drivePreviewUrl = `https://drive.google.com/thumbnail?id=${mediaAsset.driveFileId}&sz=w800`;

    // Persist in thumbnailsRepository
    let thumbnailRecord = await thumbnailsRepository.findById(technicalThumbnailId);
    if (!existingThumbnail(thumbnailRecord)) {
      thumbnailRecord = await thumbnailsRepository.create({
        id: technicalThumbnailId,
        contentId: input.contentId,
        contentMasterId: input.contentId,
        videoId: candidate?.videoId || `BP-V-${input.contentId.replace(/^BP-CNT-/, '')}`,
        hookHeadline: candidate?.hookHeadline || 'Burra Pariksha Challenge',
        driveAssetUrl: driveFileUrl,
        previewUrl: drivePreviewUrl,
        status: candidate?.status === 'APPROVED' ? 'APPROVED' : 'DESIGNED',
        currentVersion: mediaAsset.version,
        driveFileId: mediaAsset.driveFileId,
        driveFolderId: mediaAsset.folderId,
        fileName: mediaAsset.fileName,
        mimeType: mediaAsset.mimeType,
        fileSize: mediaAsset.fileSize,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      thumbnailRecord = await thumbnailsRepository.update(technicalThumbnailId, {
        driveAssetUrl: driveFileUrl,
        previewUrl: drivePreviewUrl,
        currentVersion: mediaAsset.version,
        driveFileId: mediaAsset.driveFileId,
        driveFolderId: mediaAsset.folderId,
        fileName: mediaAsset.fileName,
        mimeType: mediaAsset.mimeType,
        fileSize: mediaAsset.fileSize,
        updatedAt: now,
      });
    }

    // Persist in thumbnailVersionsRepository
    const versionRecordId = `TV-${technicalThumbnailId.replace(/^BP-T-|^T-/, '')}-${mediaAsset.version}`;
    const thumbVersion = await thumbnailVersionsRepository.create({
      id: versionRecordId,
      thumbnailId: technicalThumbnailId,
      versionNumber: mediaAsset.version,
      driveAssetUrl: driveFileUrl,
      driveFileId: mediaAsset.driveFileId,
      designerNotes: input.designerNotes || `Uploaded thumbnail binary V${mediaAsset.version}`,
      createdAt: now,
    });

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'UPLOAD_THUMBNAIL_BINARY',
      'THUMBNAIL',
      technicalThumbnailId,
      { driveFileId: mediaAsset.driveFileId, version: mediaAsset.version }
    );

    return {
      thumbnail: thumbnailRecord,
      mediaAsset: {
        ...mediaAsset,
        md5Checksum: mediaAsset.checksum || mediaAsset.md5Checksum,
      },
      thumbnailVersion: thumbVersion,
      driveFileUrl,
      drivePreviewUrl,
      candidate,
    };
  }

  /**
   * Retrieves complete production history for a Content ID.
   */
  public async getProductionHistory(contentId: string): Promise<ThumbnailProductionHistory> {
    this.validateContentIdFormat(contentId);

    const contentMaster = await contentMastersRepository.findById(contentId);
    const candidates = await thumbnailCandidatesRepository.findByContentId(contentId);

    const allVersions: ThumbnailCandidateVersion[] = [];
    for (const cand of candidates) {
      const versions = await thumbnailCandidatesRepository.getCandidateVersions(cand.id);
      allVersions.push(...versions);
    }

    const mediaAssets = await mediaAssetsRepository.findByContentIdAndStage(contentId, 'THUMBNAIL');
    const technicalThumbnailId = `BP-T-${contentId.replace(/^BP-CNT-/, '')}`;
    const activeThumbnailRecord = await thumbnailsRepository.findById(technicalThumbnailId);
    const approvedCandidate = candidates.find((c) => c.status === 'APPROVED') || null;

    return {
      contentId,
      questionId: contentMaster?.primaryQuestionId || (contentMaster as any)?.questionId,
      candidates,
      candidateVersions: allVersions,
      mediaAssets,
      approvedCandidate,
      activeThumbnailRecord,
    };
  }
}

function existingThumbnail(val: any): boolean {
  return !!(val && val.id);
}

export const thumbnailIntelligenceService = ThumbnailIntelligenceService.getInstance();
