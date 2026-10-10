/**
 * BURRA PARIKSHA CMS - Phase 19 Pinned Comment & Conversation Intelligence Service
 * 
 * Implements:
 * - Content ID Correlation & Technical ID Separation
 * - AI Pinned Comment Package Generation (with Gemini & Fallback detection)
 * - Complete Human Review & Editing State Machine (DRAFT -> IN_REVIEW -> APPROVED / REJECTED)
 * - Immutable Package Versioning & Audit History Logging
 * - Strict RBAC Enforcement
 * - Anti-Answer-Leakage & Engagement Quality Safety Enforcement
 * - Downstream Google Sheets Database Synchronization (PINNED_COMMENTS & PUBLISHING)
 */

import {
  PinnedCommentPackage,
  PinnedCommentPackageVersion,
  PinnedComment,
  PinnedCommentPackageStatus,
  Question,
  WorkflowActor,
  UserRole,
  EngagementQualityReport,
  PinnedCommentPackageHistory,
} from '../../types';
import { pinnedCommentPackagesRepository } from '../repositories/pinned-comment-packages.repository';
import { pinnedCommentsRepository, pinnedCommentVersionsRepository } from '../repositories/pinned-comments.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { scriptsRepository } from '../repositories/scripts.repository';
import { videosRepository } from '../repositories/videos.repository';
import { publishingRepository } from '../repositories/publishing.repository';
import { aiOrchestrator } from '../ai/ai-orchestrator.service';
import { auditService } from './audit.service';
import { PinnedCommentSafetyValidator } from '../validators/pinned-comment-safety.validator';
import {
  ValidationError,
  AuthorizationError,
  ReferenceIntegrityError,
} from '../errors';

export interface CreateManualPackageInput {
  contentId: string;
  pinnedComment: string;
  answerDiscussionPrompt: string;
  followUpQuestions: string[];
  audienceParticipationPrompt: string;
  notes?: string;
}

export interface UpdatePackageInput {
  pinnedComment?: string;
  answerDiscussionPrompt?: string;
  followUpQuestions?: string[];
  audienceParticipationPrompt?: string;
  notes?: string;
  contentId?: string; // Checked for cross-content rejection
}

export interface ProductionReadinessResult {
  isReady: boolean;
  package?: PinnedCommentPackage;
  issues: string[];
}

export class PinnedCommentIntelligenceService {
  private static instance: PinnedCommentIntelligenceService | null = null;

  private constructor() {}

  public static getInstance(): PinnedCommentIntelligenceService {
    if (!PinnedCommentIntelligenceService.instance) {
      PinnedCommentIntelligenceService.instance = new PinnedCommentIntelligenceService();
    }
    return PinnedCommentIntelligenceService.instance;
  }

  /**
   * Helper to validate canonical Content ID format
   */
  private validateContentIdFormat(contentId: string): void {
    if (!contentId || !/^BP-CNT-\d{6}$/.test(contentId)) {
      throw new ValidationError(
        `Invalid canonical Content ID format: "${contentId}". Must match ^BP-CNT-\\d{6}$`
      );
    }
  }

  /**
   * Helper to enforce RBAC permissions
   */
  private verifyRole(actor: WorkflowActor, allowedRoles: UserRole[], actionDesc: string): void {
    if (!actor || !actor.role) {
      throw new AuthorizationError(`Unauthorized: Actor information missing for action: ${actionDesc}`);
    }
    if (!allowedRoles.includes(actor.role as UserRole)) {
      throw new AuthorizationError(
        `Role "${actor.role}" is not authorized to ${actionDesc}. Required: [${allowedRoles.join(', ')}]`
      );
    }
  }

  /**
   * Generate an AI Pinned Comment Package for a Content ID.
   * Remains in DRAFT status for editorial review.
   */
  public async generatePackageForContent(
    contentId: string,
    actor: WorkflowActor
  ): Promise<PinnedCommentPackage> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.TOPIC_LEAD, UserRole.REVIEWER, UserRole.CREATOR],
      'generate pinned comment package'
    );

    this.validateContentIdFormat(contentId);

    // 1. Resolve Content Master
    const contentMaster = await contentMastersRepository.findById(contentId);
    if (!contentMaster) {
      throw new ReferenceIntegrityError(`Content master not found for ID: ${contentId}`);
    }

    // 2. Resolve Question (Source of Truth)
    const questionId = (contentMaster as any).questionId || contentMaster.primaryQuestionId;
    if (!questionId) {
      throw new ReferenceIntegrityError(`Content master "${contentId}" has no associated Question ID.`);
    }

    const question = await questionsRepository.findById(questionId);
    if (!question) {
      throw new ReferenceIntegrityError(`Source question not found for ID: ${questionId}`);
    }

    // 3. Resolve Script & Video if present
    const scriptId = (contentMaster as any).scriptId;
    const videoId = (contentMaster as any).videoId;
    const script = scriptId ? await scriptsRepository.findById(scriptId) : null;
    const video = videoId ? await videosRepository.findById(videoId) : null;
    const scriptVer = script ? ((script as any).version || script.currentVersion) : undefined;

    // 4. Generate AI Package
    const aiOutput = await aiOrchestrator.generatePinnedCommentPackage(question, contentId, {
      script: script || undefined,
      video: video || undefined,
      approvedScriptVersion: scriptVer,
    });

    // 5. Validate engagement quality and safety
    const safetyCheck = PinnedCommentSafetyValidator.validate(aiOutput, question);
    if (!safetyCheck.isValid) {
      throw new ValidationError(`Generated pinned comment package failed safety validation: ${safetyCheck.issues.join(', ')}`);
    }

    const now = new Date().toISOString();
    const contentNum = contentId.replace(/^BP-CNT-/, '');
    const packageId = `BP-PCP-${contentNum}`;

    const newPackage: PinnedCommentPackage = {
      id: packageId,
      contentId,
      contentMasterId: contentMaster.id,
      questionId: question.id,
      scriptId: script?.id,
      scriptVersion: scriptVer,
      videoId: video?.id,
      pinnedComment: aiOutput.pinnedComment,
      answerDiscussionPrompt: aiOutput.answerDiscussionPrompt,
      followUpQuestions: aiOutput.followUpQuestions,
      audienceParticipationPrompt: aiOutput.audienceParticipationPrompt,
      version: 1,
      status: 'DRAFT',
      isAiGenerated: aiOutput.isAiGenerated,
      aiModelUsed: aiOutput.aiModelUsed,
      notes: aiOutput.notes,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await pinnedCommentPackagesRepository.create(newPackage);

    // Record immutable initial version
    const version1: PinnedCommentPackageVersion = {
      id: `BP-PCV-${contentNum}-1`,
      packageId,
      versionNumber: 1,
      contentSnapshot: { ...saved },
      editedBy: actor.name || actor.id,
      changeSummary: `Initial generation (${aiOutput.aiModelUsed})`,
      createdAt: now,
    };
    await pinnedCommentPackagesRepository.recordVersion(version1);

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'GENERATE_PINNED_COMMENT_PACKAGE',
      'PINNED_COMMENT',
      packageId,
      { contentId, model: aiOutput.aiModelUsed, isAiGenerated: aiOutput.isAiGenerated }
    );

    return saved;
  }

  /**
   * Create a manual pinned comment package without relying on AI (AI-Independent workflow).
   */
  public async createManualPackage(
    input: CreateManualPackageInput,
    actor: WorkflowActor
  ): Promise<PinnedCommentPackage> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.TOPIC_LEAD, UserRole.REVIEWER, UserRole.CREATOR],
      'create manual pinned comment package'
    );

    this.validateContentIdFormat(input.contentId);

    const contentMaster = await contentMastersRepository.findById(input.contentId);
    if (!contentMaster) {
      throw new ReferenceIntegrityError(`Content master not found for ID: ${input.contentId}`);
    }

    const manualQuestionId = (contentMaster as any).questionId || contentMaster.primaryQuestionId || '';
    const question = await questionsRepository.findById(manualQuestionId);
    if (!question) {
      throw new ReferenceIntegrityError(`Source question not found for content master: ${input.contentId}`);
    }

    const scriptId = (contentMaster as any).scriptId;
    const videoId = (contentMaster as any).videoId;
    const script = scriptId ? await scriptsRepository.findById(scriptId) : null;
    const video = videoId ? await videosRepository.findById(videoId) : null;
    const scriptVer = script ? ((script as any).version || script.currentVersion) : undefined;

    // Safety & quality validation
    const safetyCheck = PinnedCommentSafetyValidator.validate(input, question);
    if (!safetyCheck.isValid) {
      throw new ValidationError(
        `Pinned comment safety validation failed: ${safetyCheck.issues.join('; ')}`
      );
    }

    const now = new Date().toISOString();
    const contentNum = input.contentId.replace(/^BP-CNT-/, '');
    const packageId = `BP-PCP-${contentNum}`;

    const newPackage: PinnedCommentPackage = {
      id: packageId,
      contentId: input.contentId,
      contentMasterId: contentMaster.id,
      questionId: question.id,
      scriptId: script?.id,
      scriptVersion: scriptVer,
      videoId: video?.id,
      pinnedComment: input.pinnedComment.trim(),
      answerDiscussionPrompt: input.answerDiscussionPrompt.trim(),
      followUpQuestions: input.followUpQuestions.map((q) => q.trim()),
      audienceParticipationPrompt: input.audienceParticipationPrompt.trim(),
      version: 1,
      status: 'DRAFT',
      isAiGenerated: false,
      aiModelUsed: 'manual',
      notes: input.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const saved = await pinnedCommentPackagesRepository.create(newPackage);

    const version1: PinnedCommentPackageVersion = {
      id: `BP-PCV-${contentNum}-1`,
      packageId,
      versionNumber: 1,
      contentSnapshot: { ...saved },
      editedBy: actor.name || actor.id,
      changeSummary: 'Manual package creation',
      createdAt: now,
    };
    await pinnedCommentPackagesRepository.recordVersion(version1);

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'CREATE_MANUAL_PINNED_COMMENT_PACKAGE',
      'PINNED_COMMENT',
      packageId,
      { contentId: input.contentId }
    );

    return saved;
  }

  /**
   * Human edit of package fields.
   * Editing an approved package:
   * - Creates a new version (version + 1)
   * - Invalidates previous approval (status -> DRAFT)
   * - Clears approval metadata
   * - Downstream published record is set to not-approved
   */
  public async updatePackage(
    packageId: string,
    updates: UpdatePackageInput,
    actor: WorkflowActor
  ): Promise<PinnedCommentPackage> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.TOPIC_LEAD, UserRole.REVIEWER, UserRole.CREATOR],
      'update pinned comment package'
    );

    const existing = await pinnedCommentPackagesRepository.findById(packageId);
    if (!existing) {
      throw new ReferenceIntegrityError(`Pinned comment package not found: ${packageId}`);
    }

    // Cross-content rejection: package cannot be reassigned to a different Content ID
    if (updates.contentId && updates.contentId !== existing.contentId) {
      throw new ValidationError(
        `Cross-content violation: Cannot reassign package "${packageId}" from "${existing.contentId}" to "${updates.contentId}"`
      );
    }

    // Fetch Question for safety validation
    const question = await questionsRepository.findById(existing.questionId);
    if (question) {
      const mergedCandidate = {
        pinnedComment: updates.pinnedComment ?? existing.pinnedComment,
        answerDiscussionPrompt: updates.answerDiscussionPrompt ?? existing.answerDiscussionPrompt,
        followUpQuestions: updates.followUpQuestions ?? existing.followUpQuestions,
        audienceParticipationPrompt: updates.audienceParticipationPrompt ?? existing.audienceParticipationPrompt,
      };

      const safetyReport = PinnedCommentSafetyValidator.validate(mergedCandidate, question);
      if (!safetyReport.isValid) {
        throw new ValidationError(
          `Safety & quality check failed on update: ${safetyReport.issues.join('; ')}`
        );
      }
    }

    const wasApproved = existing.status === 'APPROVED';
    const newVersion = existing.version + 1;
    const now = new Date().toISOString();

    const patch: Partial<PinnedCommentPackage> = {
      ...updates,
      version: newVersion,
      // If was approved, editing invalidates approval and returns to DRAFT
      status: wasApproved ? 'DRAFT' : existing.status,
      approvedBy: wasApproved ? undefined : existing.approvedBy,
      approvedVersion: wasApproved ? undefined : existing.approvedVersion,
      approvedAt: wasApproved ? undefined : existing.approvedAt,
      rejectedReason: undefined,
      updatedAt: now,
    };

    // If was approved, invalidate downstream sync records
    if (wasApproved) {
      const activeComment = await pinnedCommentsRepository.findByVideoId(existing.videoId || '');
      if (activeComment) {
        await pinnedCommentsRepository.update(activeComment.id, { isApproved: false });
      }
      const pubRecord = await publishingRepository.findByContentId(existing.contentId);
      if (pubRecord) {
        await publishingRepository.update(pubRecord.id, { pinnedCommentReady: false });
      }
    }

    const updated = await pinnedCommentPackagesRepository.update(packageId, patch);

    // Record immutable version
    const contentNum = existing.contentId.replace(/^BP-CNT-/, '');
    const versionRecord: PinnedCommentPackageVersion = {
      id: `BP-PCV-${contentNum}-${newVersion}`,
      packageId,
      versionNumber: newVersion,
      contentSnapshot: { ...updated },
      editedBy: actor.name || actor.id,
      changeSummary: wasApproved ? 'Edited approved package (invalidated approval)' : 'Editorial updates',
      createdAt: now,
    };
    await pinnedCommentPackagesRepository.recordVersion(versionRecord);

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'UPDATE_PINNED_COMMENT_PACKAGE',
      'PINNED_COMMENT',
      packageId,
      { version: newVersion, invalidatedApproval: wasApproved }
    );

    return updated;
  }

  /**
   * Submit package for review (DRAFT -> IN_REVIEW)
   */
  public async submitForReview(
    packageId: string,
    actor: WorkflowActor,
    reviewerId?: string
  ): Promise<PinnedCommentPackage> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.TOPIC_LEAD, UserRole.CREATOR, UserRole.REVIEWER],
      'submit pinned comment for review'
    );

    const existing = await pinnedCommentPackagesRepository.findById(packageId);
    if (!existing) {
      throw new ReferenceIntegrityError(`Pinned comment package not found: ${packageId}`);
    }

    const updated = await pinnedCommentPackagesRepository.update(packageId, {
      status: 'IN_REVIEW',
      assignedReviewerId: reviewerId || existing.assignedReviewerId,
    });

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'SUBMIT_PINNED_COMMENT_REVIEW',
      'PINNED_COMMENT',
      packageId,
      { assignedReviewerId: reviewerId }
    );

    return updated;
  }

  /**
   * Approve a specific version of a package.
   * - Enforces RBAC (only authorized roles)
   * - Enforces target version match (rejects stale version approvals)
   * - Enforces Content ID correlation
   * - Enforces Safety & Engagement Quality
   * - Synchronizes official PINNED_COMMENTS sheet tab & publishing readiness
   */
  public async approvePackage(
    packageId: string,
    targetVersion: number,
    actor: WorkflowActor,
    expectedContentId?: string
  ): Promise<{ package: PinnedCommentPackage; officialPinnedComment: PinnedComment }> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER, UserRole.TOPIC_LEAD],
      'approve pinned comment package'
    );

    const existing = await pinnedCommentPackagesRepository.findById(packageId);
    if (!existing) {
      throw new ReferenceIntegrityError(`Pinned comment package not found: ${packageId}`);
    }

    // Cross-content check
    if (expectedContentId && expectedContentId !== existing.contentId) {
      throw new ValidationError(
        `Cross-content violation: Expected content ID "${expectedContentId}" does not match package content ID "${existing.contentId}"`
      );
    }

    // Stale version check: approval must match the current version exactly
    if (existing.version !== targetVersion) {
      throw new ValidationError(
        `Stale version approval rejected: Target version ${targetVersion} does not match current package version ${existing.version}`
      );
    }

    // Safety and quality validation
    const question = await questionsRepository.findById(existing.questionId);
    if (!question) {
      throw new ReferenceIntegrityError(`Source question not found for package: ${existing.questionId}`);
    }

    const safetyReport = PinnedCommentSafetyValidator.validate(existing, question);
    if (!safetyReport.isValid) {
      throw new ValidationError(
        `Cannot approve package with safety/engagement issues: ${safetyReport.issues.join('; ')}`
      );
    }

    const now = new Date().toISOString();
    const approvedPackage = await pinnedCommentPackagesRepository.update(packageId, {
      status: 'APPROVED',
      approvedBy: actor.id,
      approvedVersion: targetVersion,
      approvedAt: now,
      rejectedReason: undefined,
    });

    // Synchronize downstream official PINNED_COMMENTS sheet tab
    const contentNum = existing.contentId.replace(/^BP-CNT-/, '');
    const officialPinnedId = `BP-PIN-${contentNum}`;

    let officialRecord = await pinnedCommentsRepository.findById(officialPinnedId);
    if (!officialRecord) {
      officialRecord = await pinnedCommentsRepository.create({
        id: officialPinnedId,
        contentId: existing.contentId,
        contentMasterId: existing.contentMasterId,
        videoId: existing.videoId || `BP-V-${contentNum}`,
        commentText: existing.pinnedComment,
        solutionBreakdown: existing.answerDiscussionPrompt,
        nextChallengeQuestion: existing.followUpQuestions.join('\n\n'),
        isApproved: true,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      officialRecord = await pinnedCommentsRepository.update(officialPinnedId, {
        commentText: existing.pinnedComment,
        solutionBreakdown: existing.answerDiscussionPrompt,
        nextChallengeQuestion: existing.followUpQuestions.join('\n\n'),
        isApproved: true,
        updatedAt: now,
      });
    }

    // Record official revision version in PINNED_COMMENT_VERSIONS
    await pinnedCommentVersionsRepository.create({
      id: `BP-PCV-OFFICIAL-${contentNum}-${targetVersion}`,
      pinnedCommentId: officialPinnedId,
      versionNumber: targetVersion,
      commentText: existing.pinnedComment,
      createdAt: now,
    });

    // Update Publishing readiness
    const publishingRecord = await publishingRepository.findByContentId(existing.contentId);
    if (publishingRecord) {
      await publishingRepository.update(publishingRecord.id, {
        pinnedCommentReady: true,
      });
    }

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'APPROVE_PINNED_COMMENT_PACKAGE',
      'PINNED_COMMENT',
      packageId,
      { approvedVersion: targetVersion, officialPinnedId }
    );

    return {
      package: approvedPackage,
      officialPinnedComment: officialRecord,
    };
  }

  /**
   * Reject a pinned comment package with required reason.
   */
  public async rejectPackage(
    packageId: string,
    reason: string,
    actor: WorkflowActor
  ): Promise<PinnedCommentPackage> {
    this.verifyRole(
      actor,
      [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER, UserRole.TOPIC_LEAD],
      'reject pinned comment package'
    );

    if (!reason || !reason.trim()) {
      throw new ValidationError('Rejection reason is required.');
    }

    const existing = await pinnedCommentPackagesRepository.findById(packageId);
    if (!existing) {
      throw new ReferenceIntegrityError(`Pinned comment package not found: ${packageId}`);
    }

    const updated = await pinnedCommentPackagesRepository.update(packageId, {
      status: 'REJECTED',
      rejectedReason: reason.trim(),
    });

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'REJECT_PINNED_COMMENT_PACKAGE',
      'PINNED_COMMENT',
      packageId,
      { reason: reason.trim() }
    );

    return updated;
  }

  /**
   * Production Readiness Verification
   * Verifies that the package is genuinely ready for production upload.
   */
  public async isProductionReady(packageId: string): Promise<ProductionReadinessResult> {
    const issues: string[] = [];

    const pkg = await pinnedCommentPackagesRepository.findById(packageId);
    if (!pkg) {
      return { isReady: false, issues: [`Package not found: ${packageId}`] };
    }

    // 1. Content ID format & Master check
    if (!pkg.contentId || !/^BP-CNT-\d{6}$/.test(pkg.contentId)) {
      issues.push(`Invalid canonical Content ID: "${pkg.contentId}"`);
    }

    const master = await contentMastersRepository.findById(pkg.contentId);
    if (!master) {
      issues.push(`Content Master not found for Content ID: "${pkg.contentId}"`);
    }

    // 2. Question check
    const question = await questionsRepository.findById(pkg.questionId);
    if (!question) {
      issues.push(`Source question not found: "${pkg.questionId}"`);
    }

    // 3. Required fields check
    if (!pkg.pinnedComment || pkg.pinnedComment.trim().length < 25) {
      issues.push('Pinned comment is missing or too short.');
    }
    if (!pkg.answerDiscussionPrompt || pkg.answerDiscussionPrompt.trim().length < 15) {
      issues.push('Answer discussion prompt is missing or too short.');
    }
    if (!pkg.followUpQuestions || pkg.followUpQuestions.length === 0) {
      issues.push('At least one follow-up question is required.');
    }
    if (!pkg.audienceParticipationPrompt || pkg.audienceParticipationPrompt.trim().length < 10) {
      issues.push('Audience participation prompt is missing or too short.');
    }

    // 4. Approval status check
    if (pkg.status !== 'APPROVED') {
      issues.push(`Package status is "${pkg.status}", expected "APPROVED".`);
    }

    if (pkg.approvedVersion !== pkg.version) {
      issues.push(`Approved version mismatch: approved version is ${pkg.approvedVersion}, current version is ${pkg.version}.`);
    }

    if (!pkg.approvedBy) {
      issues.push('Approved by actor is missing.');
    }

    // 5. Safety & Quality check
    if (question) {
      const safety = PinnedCommentSafetyValidator.validate(pkg, question);
      if (!safety.isValid) {
        issues.push(...safety.issues);
      }
    }

    // 6. Downstream sheet sync check
    const contentNum = pkg.contentId.replace(/^BP-CNT-/, '');
    const officialPinned = await pinnedCommentsRepository.findById(`BP-PIN-${contentNum}`);
    if (!officialPinned || !officialPinned.isApproved) {
      issues.push('Official PINNED_COMMENTS sheet record is missing or not marked as approved.');
    }

    return {
      isReady: issues.length === 0,
      package: pkg,
      issues,
    };
  }

  /**
   * Retrieves full history for a content ID.
   */
  public async getPackageHistory(contentId: string): Promise<PinnedCommentPackageHistory> {
    this.validateContentIdFormat(contentId);

    const pkg = await pinnedCommentPackagesRepository.findByContentId(contentId);
    const versions = pkg ? await pinnedCommentPackagesRepository.getPackageVersions(pkg.id) : [];

    const contentNum = contentId.replace(/^BP-CNT-/, '');
    const activeComment = await pinnedCommentsRepository.findById(`BP-PIN-${contentNum}`);

    return {
      contentId,
      package: pkg,
      versions,
      approvedPackage: pkg && pkg.status === 'APPROVED' ? pkg : null,
      activePinnedCommentRecord: activeComment,
    };
  }
}

export const pinnedCommentIntelligenceService = PinnedCommentIntelligenceService.getInstance();
