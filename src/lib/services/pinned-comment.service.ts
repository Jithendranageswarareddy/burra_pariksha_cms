/**
 * BURRA PARIKSHA CMS - Pinned Comment Service
 * Phase 6: Script, Thumbnail & Manual Publishing Management
 * 
 * Provides management for sticky engagement comments on YouTube/Instagram/Facebook:
 * - Creates solution breakdown and next challenge engagement text
 * - Version tracking in PINNED_COMMENT_VERSIONS
 * - Syncs pinned_comment_ready in PUBLISHING worksheet
 */

import { pinnedCommentsRepository, pinnedCommentVersionsRepository } from '../repositories/pinned-comments.repository';
import { publishingRepository } from '../repositories/publishing.repository';
import { videosRepository } from '../repositories/videos.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { workflowRepository } from '../repositories/workflow.repository';
import { idService } from './id.service';
import { auditService } from './audit.service';
import { PinnedComment, PinnedCommentVersion, Workflow } from '../../types';
import { ValidationError } from '../errors';

export interface PinnedCommentPayload {
  commentText: string;
  solutionBreakdown: string;
  nextChallengeQuestion?: string;
  isApproved?: boolean;
  createNewVersion?: boolean;
  notes?: string;
}

export class PinnedCommentService {
  private static instance: PinnedCommentService | null = null;

  private constructor() {}

  public static getInstance(): PinnedCommentService {
    if (!PinnedCommentService.instance) {
      PinnedCommentService.instance = new PinnedCommentService();
    }
    return PinnedCommentService.instance;
  }

  /**
   * Retrieves pinned comment for a video or provides structured default.
   */
  public async getPinnedCommentByVideoId(videoId: string): Promise<{ pinnedComment: PinnedComment | null; draftProposal?: PinnedCommentPayload }> {
    const existing = await pinnedCommentsRepository.findByVideoId(videoId);
    if (existing) {
      return { pinnedComment: existing };
    }

    const video = await videosRepository.findById(videoId);
    if (!video) {
      return { pinnedComment: null };
    }

    const question = await questionsRepository.findById(video.questionId);
    const draftProposal: PinnedCommentPayload = {
      commentText: `🎯 Complete Solution Breakdown for Option (${question?.correctAnswer || 'Correct'}):\n\n${question?.explanation || 'Explanation details.'}\n\n💬 Challenge for you: Drop your answer to the next question in the comments below!`,
      solutionBreakdown: question?.explanation || 'Detailed step by step solution.',
      nextChallengeQuestion: 'If speed increases by 25%, by what percentage does time decrease?',
      isApproved: false,
    };

    return { pinnedComment: null, draftProposal };
  }

  /**
   * Retrieves all historical versions of a pinned comment.
   */
  public async getPinnedCommentVersions(pinnedCommentId: string): Promise<PinnedCommentVersion[]> {
    return pinnedCommentVersionsRepository.findByPinnedCommentId(pinnedCommentId);
  }

  /**
   * Saves or updates a pinned comment.
   */
  public async savePinnedComment(
    videoId: string,
    payload: PinnedCommentPayload,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<{ pinnedComment: PinnedComment; version?: PinnedCommentVersion }> {
    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new Error(`Video "${videoId}" not found.`);
    }

    const videoContentId = video.contentId || video.contentMasterId;
    if ((payload as any).contentId && videoContentId && (payload as any).contentId !== videoContentId) {
      throw new ValidationError(
        `Cross-content entity attachment rejected: provided Content ID "${(payload as any).contentId}" does not match parent video Content ID "${videoContentId}".`
      );
    }

    const existing = await pinnedCommentsRepository.findByVideoId(videoId);
    const now = new Date().toISOString();

    if (!existing) {
      const pinId = await idService.allocatePinnedCommentId();
      const newRecord: PinnedComment = {
        id: pinId,
        contentId: video.contentId || video.contentMasterId,
        contentMasterId: video.contentMasterId,
        videoId,
        commentText: payload.commentText,
        solutionBreakdown: payload.solutionBreakdown,
        nextChallengeQuestion: payload.nextChallengeQuestion || '',
        isApproved: Boolean(payload.isApproved),
        createdAt: now,
        updatedAt: now,
      };

      const saved = await pinnedCommentsRepository.appendRecord(newRecord);

      // Version 1
      const initialVer: PinnedCommentVersion = {
        id: `${pinId}-V1`,
        pinnedCommentId: pinId,
        versionNumber: 1,
        commentText: payload.commentText,
        createdAt: now,
      };
      await pinnedCommentVersionsRepository.appendRecord(initialVer);

      // Sync publishing
      const pub = await publishingRepository.findByVideoId(videoId);
      if (pub) {
        await publishingRepository.updateRecord(pub.id, {
          pinnedCommentReady: Boolean(payload.isApproved),
        });
      }

      await auditService.log(actor.id, actor.name, 'CREATE_PINNED_COMMENT', 'PINNED_COMMENT', pinId, { videoId, isApproved: payload.isApproved });
      return { pinnedComment: saved, version: initialVer };
    }

    if (payload.createNewVersion) {
      const existingVersions = await pinnedCommentVersionsRepository.findByPinnedCommentId(existing.id);
      const nextVersionNumber = existingVersions.length + 1;

      const updated = await pinnedCommentsRepository.updateRecord(existing.id, {
        commentText: payload.commentText,
        solutionBreakdown: payload.solutionBreakdown,
        nextChallengeQuestion: payload.nextChallengeQuestion !== undefined ? payload.nextChallengeQuestion : existing.nextChallengeQuestion,
        isApproved: payload.isApproved !== undefined ? payload.isApproved : existing.isApproved,
        updatedAt: now,
      });

      if (!updated) {
        throw new Error(`Failed to update pinned comment "${existing.id}".`);
      }

      const versionId = `${existing.id}-V${nextVersionNumber}`;
      const newVersion: PinnedCommentVersion = {
        id: versionId,
        pinnedCommentId: existing.id,
        versionNumber: nextVersionNumber,
        commentText: payload.commentText,
        createdAt: now,
      };
      await pinnedCommentVersionsRepository.appendRecord(newVersion);

      // Sync publishing
      const pub = await publishingRepository.findByVideoId(videoId);
      if (pub) {
        await publishingRepository.updateRecord(pub.id, {
          pinnedCommentReady: Boolean(payload.isApproved !== undefined ? payload.isApproved : existing.isApproved),
        });
      }

      await auditService.log(actor.id, actor.name, 'SAVE_NEW_PINNED_COMMENT_VERSION', 'PINNED_COMMENT', existing.id, {
        videoId,
        versionNumber: nextVersionNumber,
        isApproved: payload.isApproved,
      });

      return { pinnedComment: updated, version: newVersion };
    }

    const updated = await pinnedCommentsRepository.updateRecord(existing.id, {
      commentText: payload.commentText,
      solutionBreakdown: payload.solutionBreakdown,
      nextChallengeQuestion: payload.nextChallengeQuestion !== undefined ? payload.nextChallengeQuestion : existing.nextChallengeQuestion,
      isApproved: payload.isApproved !== undefined ? payload.isApproved : existing.isApproved,
      updatedAt: now,
    });

    if (!updated) {
      throw new Error(`Failed to update pinned comment "${existing.id}".`);
    }

    // Sync publishing
    const pub = await publishingRepository.findByVideoId(videoId);
    if (pub) {
      await publishingRepository.updateRecord(pub.id, {
        pinnedCommentReady: Boolean(payload.isApproved !== undefined ? payload.isApproved : existing.isApproved),
      });
    }

    await auditService.log(actor.id, actor.name, 'UPDATE_PINNED_COMMENT', 'PINNED_COMMENT', existing.id, { videoId, isApproved: payload.isApproved });
    return { pinnedComment: updated };
  }

  /**
   * Updates approval status of a pinned comment.
   */
  public async updateApprovalStatus(
    pinnedCommentId: string,
    isApproved: boolean,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' },
    remarks?: string
  ): Promise<PinnedComment> {
    const existing = await pinnedCommentsRepository.findById(pinnedCommentId);
    if (!existing) {
      throw new Error(`Pinned comment "${pinnedCommentId}" not found.`);
    }

    const prevStatus = existing.isApproved ? 'APPROVED' : 'DRAFT';
    const nextStatus = isApproved ? 'APPROVED' : 'DRAFT';
    const now = new Date().toISOString();

    const updated = await pinnedCommentsRepository.updateRecord(existing.id, {
      isApproved,
      updatedAt: now,
    });

    if (!updated) {
      throw new Error(`Failed to update approval status for "${pinnedCommentId}".`);
    }

    // Sync publishing
    const pub = await publishingRepository.findByVideoId(existing.videoId);
    if (pub) {
      await publishingRepository.updateRecord(pub.id, {
        pinnedCommentReady: isApproved,
      });
    }

    // Workflow record
    const wfId = await idService.generateId('WORKFLOW' as any).catch(() => `WF-${Date.now().toString().slice(-6)}`);
    const wfEntry: Workflow = {
      id: wfId,
      entityType: 'PUBLISHING',
      entityId: existing.videoId,
      fromStatus: `PINNED_COMMENT_${prevStatus}`,
      toStatus: `PINNED_COMMENT_${nextStatus}`,
      triggeredBy: actor.name,
      actorName: actor.name,
      remarks: remarks || `Pinned comment status changed to ${nextStatus}`,
      timestamp: now,
    };
    await workflowRepository.appendRecord(wfEntry).catch((err) => {
      console.warn('Failed to record workflow transition for pinned comment approval:', err);
    });

    // Audit log
    await auditService.log(actor.id, actor.name, 'APPROVE_PINNED_COMMENT', 'PINNED_COMMENT', existing.id, {
      videoId: existing.videoId,
      fromStatus: prevStatus,
      toStatus: nextStatus,
      remarks,
    });

    return updated;
  }
}

export const pinnedCommentService = PinnedCommentService.getInstance();
