/**
 * BURRA PARIKSHA CMS - Object-Level Authorization Service
 * Phase 8I: Hardened Object-Level Access Control (SEC-03)
 * 
 * Provides centralized permission evaluation for questions, videos, scripts,
 * thumbnails, pinned comments, content masters, social reviews, publishing,
 * and user metadata.
 */

import {
  UserRole,
  Question,
  Video,
  Script,
  Thumbnail,
  PinnedComment,
  ContentMaster,
  Publishing,
  Assignment,
} from '../../types';
import { assignmentsRepository } from '../repositories/assignments.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { videosRepository } from '../repositories/videos.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';

export interface ActorContext {
  id: string;
  role: string | UserRole;
  name?: string;
  _cachedActiveAssignments?: Assignment[];
  _inFlightActiveAssignments?: Promise<Assignment[]>;
}

export class ObjectAuthorizationService {
  private static instance: ObjectAuthorizationService | null = null;

  public static getInstance(): ObjectAuthorizationService {
    if (!ObjectAuthorizationService.instance) {
      ObjectAuthorizationService.instance = new ObjectAuthorizationService();
    }
    return ObjectAuthorizationService.instance;
  }

  /**
   * Helper: Check if actor is an Admin or Content Manager (Global Authority)
   */
  public isManagerOrAdmin(actor: ActorContext): boolean {
    if (!actor || !actor.role) return false;
    const r = String(actor.role).toUpperCase();
    return r === UserRole.ADMIN || r === UserRole.CONTENT_MANAGER;
  }

  /**
   * Helper: Retrieve active assignments for an actor with request-scoped deduplication
   */
  public async getActiveAssignments(actor: ActorContext): Promise<Assignment[]> {
    if (!actor || !actor.id) return [];

    // Return cached result if already resolved on this actor context
    if (actor._cachedActiveAssignments) {
      return actor._cachedActiveAssignments;
    }

    // Share in-flight promise if a lookup is currently ongoing for this actor context
    if (actor._inFlightActiveAssignments) {
      return await actor._inFlightActiveAssignments;
    }

    const promise = (async () => {
      try {
        const active = await assignmentsRepository.findActiveByAssigneeId(actor.id);
        actor._cachedActiveAssignments = active;
        return active;
      } finally {
        actor._inFlightActiveAssignments = undefined;
      }
    })();

    actor._inFlightActiveAssignments = promise;
    return await promise;
  }

  /**
   * Helper: Check if actor has an active assignment for the given entity
   */
  public async hasActiveAssignment(
    actor: ActorContext,
    entityType: string,
    entityId: string
  ): Promise<boolean> {
    if (!actor || !actor.id || !entityId) return false;

    // Check by assigneeId via request-scoped deduplicated active assignments
    const activeAssignments = await this.getActiveAssignments(actor);
    return activeAssignments.some(
      (a) =>
        (a.entityType === entityType && a.entityId === entityId) ||
        a.entityId === entityId ||
        a.videoId === entityId
    );
  }

  // --------------------------------------------------------------------------
  // 1. QUESTION AUTHORIZATION
  // --------------------------------------------------------------------------

  public async canAccessQuestion(actor: ActorContext, question: Question): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!question) return false;

    // Author/Creator access
    if (question.authorId === actor.id || (question as any).createdBy === actor.id) return true;

    // Active assignment access
    const hasAssignedQuestion = await this.hasActiveAssignment(actor, 'QUESTION', question.id);
    if (hasAssignedQuestion) return true;

    if (question.contentMasterId) {
      const hasAssignedMaster = await this.hasActiveAssignment(
        actor,
        'CONTENT_MASTER',
        question.contentMasterId
      );
      if (hasAssignedMaster) return true;
    }

    return false;
  }

  public async canModifyQuestion(actor: ActorContext, question: Question): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!question) return false;

    const allowedRoles = [
      UserRole.QUESTION_EDITOR,
      UserRole.CREATOR,
      UserRole.CONTENT_WRITER,
      UserRole.EDITOR,
    ];
    if (!allowedRoles.includes(actor.role as UserRole)) return false;

    if (question.authorId === actor.id || (question as any).createdBy === actor.id) return true;

    return await this.hasActiveAssignment(actor, 'QUESTION', question.id);
  }

  // --------------------------------------------------------------------------
  // 2. VIDEO AUTHORIZATION
  // --------------------------------------------------------------------------

  public async canAccessVideo(actor: ActorContext, video: Video): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!video) return false;

    if (video.assignedHost === actor.id || video.assignedEditor === actor.id) return true;

    const hasAssignedVideo = await this.hasActiveAssignment(actor, 'VIDEO', video.id);
    if (hasAssignedVideo) return true;

    if (video.questionId) {
      const question = await questionsRepository.findById(video.questionId);
      if (question && question.authorId === actor.id) return true;

      const hasAssignedQ = await this.hasActiveAssignment(actor, 'QUESTION', video.questionId);
      if (hasAssignedQ) return true;
    }

    return false;
  }

  public async canModifyVideo(actor: ActorContext, video: Video): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!video) return false;

    const allowedRoles = [
      UserRole.VIDEO_EDITOR,
      UserRole.CREATOR,
      UserRole.EDITOR,
      UserRole.SPEAKER,
      UserRole.PUBLISHING_MANAGER,
    ];
    if (!allowedRoles.includes(actor.role as UserRole)) return false;

    if (video.assignedHost === actor.id || video.assignedEditor === actor.id) return true;

    return await this.hasActiveAssignment(actor, 'VIDEO', video.id);
  }

  // --------------------------------------------------------------------------
  // 3. SCRIPT AUTHORIZATION
  // --------------------------------------------------------------------------

  public async canAccessScript(actor: ActorContext, target: Script | Video | string): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!target) return false;

    if (typeof target === 'string') {
      const video = await videosRepository.findById(target);
      if (video) return await this.canAccessVideo(actor, video);
      const question = await questionsRepository.findById(target);
      if (question) return await this.canAccessQuestion(actor, question);
      return false;
    }

    const scriptObj = target as any;
    if (scriptObj.editedBy === actor.id || scriptObj.updatedBy === actor.id) return true;

    if (scriptObj.id) {
      const hasAssignedScript = await this.hasActiveAssignment(actor, 'SCRIPT', scriptObj.id);
      if (hasAssignedScript) return true;
    }

    if (scriptObj.videoId) {
      const video = await videosRepository.findById(scriptObj.videoId);
      if (video) return await this.canAccessVideo(actor, video);
    } else if (scriptObj.assignedHost || scriptObj.assignedEditor || scriptObj.title) {
      // It's a Video object
      return await this.canAccessVideo(actor, scriptObj as Video);
    }

    if (scriptObj.questionId) {
      const question = await questionsRepository.findById(scriptObj.questionId);
      if (question) return await this.canAccessQuestion(actor, question);
    }

    return false;
  }

  public async canModifyScript(actor: ActorContext, target: Script | Video | string): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!target) return false;

    const allowedRoles = [
      UserRole.SCRIPT_WRITER,
      UserRole.CREATOR,
      UserRole.CONTENT_WRITER,
      UserRole.EDITOR,
    ];
    if (!allowedRoles.includes(actor.role as UserRole)) return false;

    if (typeof target === 'string') {
      const video = await videosRepository.findById(target);
      if (video) return await this.canModifyVideo(actor, video);
      return false;
    }

    const scriptObj = target as any;
    if (scriptObj.editedBy === actor.id || scriptObj.updatedBy === actor.id) return true;

    if (scriptObj.id) {
      const hasAssignedScript = await this.hasActiveAssignment(actor, 'SCRIPT', scriptObj.id);
      if (hasAssignedScript) return true;
    }

    if (scriptObj.videoId) {
      const video = await videosRepository.findById(scriptObj.videoId);
      if (video) return await this.canModifyVideo(actor, video);
    } else if (scriptObj.assignedHost || scriptObj.assignedEditor || scriptObj.title) {
      // It's a Video object
      return await this.canModifyVideo(actor, scriptObj as Video);
    }

    return false;
  }

  // --------------------------------------------------------------------------
  // 4. THUMBNAIL AUTHORIZATION
  // --------------------------------------------------------------------------

  public async canAccessThumbnail(actor: ActorContext, target: Thumbnail | Video | string): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!target) return false;

    if (typeof target === 'string') {
      const video = await videosRepository.findById(target);
      if (video) return await this.canAccessVideo(actor, video);
      return false;
    }

    const thumbObj = target as any;
    if (thumbObj.id) {
      const hasAssignedThm = await this.hasActiveAssignment(actor, 'THUMBNAIL', thumbObj.id);
      if (hasAssignedThm) return true;
    }

    if (thumbObj.videoId) {
      const video = await videosRepository.findById(thumbObj.videoId);
      if (video) return await this.canAccessVideo(actor, video);
    } else if (thumbObj.assignedHost || thumbObj.assignedEditor || thumbObj.title) {
      return await this.canAccessVideo(actor, thumbObj as Video);
    }

    return false;
  }

  public async canModifyThumbnail(actor: ActorContext, target: Thumbnail | Video | string): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!target) return false;

    const allowedRoles = [UserRole.DESIGNER, UserRole.CREATOR];
    if (!allowedRoles.includes(actor.role as UserRole)) return false;

    if (typeof target === 'string') {
      const video = await videosRepository.findById(target);
      if (video) return await this.canModifyVideo(actor, video);
      return false;
    }

    const thumbObj = target as any;
    if (thumbObj.id) {
      const hasAssignedThm = await this.hasActiveAssignment(actor, 'THUMBNAIL', thumbObj.id);
      if (hasAssignedThm) return true;
    }

    if (thumbObj.videoId) {
      const video = await videosRepository.findById(thumbObj.videoId);
      if (video) return await this.canModifyVideo(actor, video);
    } else if (thumbObj.assignedHost || thumbObj.assignedEditor || thumbObj.title) {
      return await this.canModifyVideo(actor, thumbObj as Video);
    }

    return false;
  }

  // --------------------------------------------------------------------------
  // 5. PINNED COMMENT AUTHORIZATION
  // --------------------------------------------------------------------------

  public async canAccessPinnedComment(
    actor: ActorContext,
    target: PinnedComment | Video | string
  ): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!target) return false;

    if (typeof target === 'string') {
      const video = await videosRepository.findById(target);
      if (video) return await this.canAccessVideo(actor, video);
      return false;
    }

    const commentObj = target as any;
    if (commentObj.videoId) {
      const video = await videosRepository.findById(commentObj.videoId);
      if (video) return await this.canAccessVideo(actor, video);
    } else if (commentObj.assignedHost || commentObj.assignedEditor || commentObj.title) {
      return await this.canAccessVideo(actor, commentObj as Video);
    }

    return false;
  }

  public async canModifyPinnedComment(
    actor: ActorContext,
    target: PinnedComment | Video | string
  ): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!target) return false;

    const allowedRoles = [
      UserRole.SCRIPT_WRITER,
      UserRole.CREATOR,
      UserRole.CONTENT_WRITER,
      UserRole.EDITOR,
      UserRole.PUBLISHING_MANAGER,
    ];
    if (!allowedRoles.includes(actor.role as UserRole)) return false;

    if (typeof target === 'string') {
      const video = await videosRepository.findById(target);
      if (video) return await this.canModifyVideo(actor, video);
      return false;
    }

    const commentObj = target as any;
    if (commentObj.videoId) {
      const video = await videosRepository.findById(commentObj.videoId);
      if (video) return await this.canModifyVideo(actor, video);
    } else if (commentObj.assignedHost || commentObj.assignedEditor || commentObj.title) {
      return await this.canModifyVideo(actor, commentObj as Video);
    }

    return false;
  }

  // --------------------------------------------------------------------------
  // 6. CONTENT MASTER AUTHORIZATION
  // --------------------------------------------------------------------------

  public async canAccessContentMaster(
    actor: ActorContext,
    cm: ContentMaster
  ): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!cm) return false;

    if (cm.createdBy === actor.id) return true;

    const hasAssignedMaster = await this.hasActiveAssignment(actor, 'CONTENT_MASTER', cm.id);
    if (hasAssignedMaster) return true;

    if (cm.primaryQuestionId) {
      const question = await questionsRepository.findById(cm.primaryQuestionId);
      if (question && question.authorId === actor.id) return true;
    }

    return false;
  }

  public async canModifyContentMaster(
    actor: ActorContext,
    cm: ContentMaster
  ): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!cm) return false;

    if (cm.createdBy === actor.id) return true;

    return await this.hasActiveAssignment(actor, 'CONTENT_MASTER', cm.id);
  }

  // --------------------------------------------------------------------------
  // 7. SOCIAL ENHANCEMENT & REVIEW AUTHORIZATION
  // --------------------------------------------------------------------------

  public async canAccessSocialPackage(
    actor: ActorContext,
    target: Question | Video | ContentMaster | string
  ): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!target) return false;

    if (typeof target === 'string') {
      const video = await videosRepository.findById(target);
      if (video) return await this.canAccessVideo(actor, video);

      const question = await questionsRepository.findById(target);
      if (question) return await this.canAccessQuestion(actor, question);

      const cm = await contentMastersRepository.findById(target);
      if (cm) return await this.canAccessContentMaster(actor, cm);

      return false;
    }

    const obj = target as any;
    if (obj.assignedHost || obj.assignedEditor || obj.title) {
      return await this.canAccessVideo(actor, obj as Video);
    }
    if (obj.authorId || obj.createdBy || obj.questionText || obj.content) {
      return await this.canAccessQuestion(actor, obj as Question);
    }
    if (obj.contentMasterId || obj.primaryQuestionId) {
      return await this.canAccessContentMaster(actor, obj as ContentMaster);
    }

    return false;
  }

  public async canModifySocialPackage(
    actor: ActorContext,
    target: Question | Video | ContentMaster | string
  ): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!target) return false;

    if (typeof target === 'string') {
      const video = await videosRepository.findById(target);
      if (video) return await this.canModifyVideo(actor, video);

      const question = await questionsRepository.findById(target);
      if (question) return await this.canModifyQuestion(actor, question);

      const cm = await contentMastersRepository.findById(target);
      if (cm) return await this.canModifyContentMaster(actor, cm);

      return false;
    }

    const obj = target as any;
    if (obj.assignedHost || obj.assignedEditor || obj.title) {
      return await this.canModifyVideo(actor, obj as Video);
    }
    if (obj.authorId || obj.createdBy || obj.questionText || obj.content) {
      return await this.canModifyQuestion(actor, obj as Question);
    }
    if (obj.contentMasterId || obj.primaryQuestionId) {
      return await this.canModifyContentMaster(actor, obj as ContentMaster);
    }

    return false;
  }

  public async canSubmitSocialReview(
    actor: ActorContext,
    videoId: string
  ): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (!videoId) return false;

    if (actor.role !== UserRole.REVIEWER) return false;

    const video = await videosRepository.findById(videoId);
    if (!video) return false;

    // Self-approval protection: Reviewer cannot be host/editor/creator of video/question
    if (video.assignedHost === actor.id || video.assignedEditor === actor.id) return false;

    if (video.questionId) {
      const question = await questionsRepository.findById(video.questionId);
      if (question && question.authorId === actor.id) return false;
    }

    return await this.hasActiveAssignment(actor, 'VIDEO', videoId);
  }

  // --------------------------------------------------------------------------
  // 8. PUBLISHING AUTHORIZATION
  // --------------------------------------------------------------------------

  public async canAccessPublishing(
    actor: ActorContext,
    target: Publishing | Video | string
  ): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (actor.role === UserRole.PUBLISHING_MANAGER) return true;
    if (!target) return false;

    const targetId = typeof target === 'string' ? target : (target as any).videoId || (target as any).id;
    if (!targetId) return false;

    return (
      (await this.hasActiveAssignment(actor, 'PUBLISHING', targetId)) ||
      (await this.hasActiveAssignment(actor, 'VIDEO', targetId))
    );
  }

  public async canModifyPublishing(
    actor: ActorContext,
    target: Publishing | Video | string
  ): Promise<boolean> {
    if (this.isManagerOrAdmin(actor)) return true;
    if (actor.role === UserRole.PUBLISHING_MANAGER) return true;
    if (!target) return false;

    const targetId = typeof target === 'string' ? target : (target as any).videoId || (target as any).id;
    if (!targetId) return false;

    return await this.hasActiveAssignment(actor, 'PUBLISHING', targetId);
  }

  // --------------------------------------------------------------------------
  // 9. USER METADATA AUTHORIZATION
  // --------------------------------------------------------------------------

  public canAccessUserDetail(actor: ActorContext, targetUserId: string): boolean {
    if (this.isManagerOrAdmin(actor)) return true;
    return actor.id === targetUserId;
  }

  public canAccessUser(actor: ActorContext, targetUserOrId: any): boolean {
    if (this.isManagerOrAdmin(actor)) return true;
    const targetId = typeof targetUserOrId === 'string' ? targetUserOrId : targetUserOrId?.id;
    return actor.id === targetId;
  }

  public canModifyUser(actor: ActorContext, targetUserOrId: any): boolean {
    if (actor.role === UserRole.ADMIN) return true;
    const targetId = typeof targetUserOrId === 'string' ? targetUserOrId : targetUserOrId?.id;
    return actor.id === targetId;
  }
}

export const objectAuthService = ObjectAuthorizationService.getInstance();
