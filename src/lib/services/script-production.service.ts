/**
 * BURRA PARIKSHA CMS - Phase 15: AI Script & Hook Production Service
 * 
 * Orchestrates the full lifecycle of AI-generated social scripts:
 * - Generation of high-retention spoken scripts from authoritative source questions
 * - Version-controlled persistence with audit logs and deletion safety rollback support
 * - Clean validation for safety, quality, and mathematical invariance
 * - Separate candidate/draft status preservation allowing subsequent human edits
 */

import { questionsRepository } from '../repositories/questions.repository';
import { videosRepository } from '../repositories/videos.repository';
import { scriptsRepository, scriptVersionsRepository } from '../repositories/scripts.repository';
import { aiOrchestrator } from '../ai/ai-orchestrator.service';
import { ScriptValidator } from '../validators/script.validator';
import { idService } from './id.service';
import { auditService } from './audit.service';
import { Question, Script, ScriptVersion, UserRole, Video, VideoProductionStatus, PriorityLevel } from '../../types';
import { ValidationError } from '../google-sheets/errors';

export interface ScriptGenerationResponse {
  script: Script;
  version: ScriptVersion;
  validationErrors: string[];
  metadata: {
    modelUsed: string;
    durationMs: number;
    isMockFallback: boolean;
  };
}

export class ScriptProductionService {
  private static instance: ScriptProductionService | null = null;

  private constructor() {}

  public static getInstance(): ScriptProductionService {
    if (!ScriptProductionService.instance) {
      ScriptProductionService.instance = new ScriptProductionService();
    }
    return ScriptProductionService.instance;
  }

  /**
   * Resolves or creates a draft production Video record associated with the Question.
   * This satisfies the relational foreign key constraint in Google Sheets.
   */
  public async resolveOrCreateVideoForQuestion(question: Question): Promise<Video> {
    const existingVideos = await videosRepository.findByQuestionId(question.id);
    if (existingVideos && existingVideos.length > 0) {
      return existingVideos[0];
    }

    // Allocate new video ID and append a draft Video record
    const videoId = await idService.allocateVideoId();
    const newVideo: Video = {
      id: videoId,
      questionId: question.id,
      contentId: question.contentMasterId || (question as any).contentId,
      contentMasterId: question.contentMasterId || (question as any).contentId,
      title: `Production: ${question.topicName || 'Math Challenge'}`,
      status: VideoProductionStatus.SCRIPT_REQUIRED,
      priority: PriorityLevel.MEDIUM,
      queuePosition: 1,
      targetDurationSeconds: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await videosRepository.appendRecord(newVideo);
  }

  /**
   * Loads an existing question and produces a structured, conversational spoken script candidate
   * optimized for YouTube Shorts and high social retention.
   */
  public async generateScriptForQuestion(
    questionId: string,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-AI', name: 'Gemini AI Assistant', role: UserRole.ADMIN }
  ): Promise<ScriptGenerationResponse> {
    const startTime = Date.now();

    // 1. Load authoritative source question
    const question = await questionsRepository.findById(questionId);
    if (!question) {
      throw new Error(`Source question with ID "${questionId}" not found in database.`);
    }

    // 2. Resolve/Create linked video to enforce relational integrity
    const video = await this.resolveOrCreateVideoForQuestion(question);

    // 3. Request structured script generation from AI provider (with automatic pedagogical fallback)
    const aiResult = await aiOrchestrator.generateTeluguScript(question);

    const now = new Date().toISOString();
    const payload = aiResult.scriptPayload;

    // Check if there is an existing script for this video
    const existingScript = await scriptsRepository.findByVideoId(video.id);

    let finalScript: Script;
    let finalVersion: ScriptVersion;

    if (!existingScript) {
      // 4a. Initial script candidate (Version 1)
      const scriptId = await idService.allocateScriptId();
      const newScript: Script = {
        id: scriptId,
        contentId: question.contentMasterId || (question as any).contentId,
        videoId: video.id,
        questionId: question.id,
        hookText: payload.hookText || '',
        problemStatement: payload.problemStatement || '',
        stepByStepSolution: payload.stepByStepSolution || '',
        speedTrickOrTakeaway: payload.speedTrickOrTakeaway || '',
        callToAction: payload.callToAction || '',
        currentVersion: 1,
        notes: payload.notes || 'Conversational YouTube Shorts script candidate.',
        createdAt: now,
        updatedAt: now,
      };

      finalScript = await scriptsRepository.appendRecord(newScript);

      const versionId = `${scriptId}-V1`;
      const versionRecord: ScriptVersion = {
        id: versionId,
        scriptId,
        versionNumber: 1,
        contentJson: payload,
        content: JSON.stringify(payload),
        editedBy: actor.name,
        changeSummary: 'Initial AI script candidate generation',
        createdAt: now,
      };

      finalVersion = await scriptVersionsRepository.appendRecord(versionRecord);
    } else {
      // 4b. Multi-version generation: increment version and append new snapshot
      const nextVersion = (existingScript.currentVersion || 1) + 1;
      
      const updatedScript = await scriptsRepository.updateRecord(existingScript.id, {
        hookText: payload.hookText,
        problemStatement: payload.problemStatement,
        stepByStepSolution: payload.stepByStepSolution,
        speedTrickOrTakeaway: payload.speedTrickOrTakeaway,
        callToAction: payload.callToAction,
        currentVersion: nextVersion,
        updatedAt: now,
      });

      if (!updatedScript) {
        throw new Error(`Failed to update script candidate record "${existingScript.id}".`);
      }

      finalScript = updatedScript;

      const versionId = `${existingScript.id}-V${nextVersion}`;
      const versionRecord: ScriptVersion = {
        id: versionId,
        scriptId: existingScript.id,
        versionNumber: nextVersion,
        contentJson: payload,
        content: JSON.stringify(payload),
        editedBy: actor.name,
        changeSummary: `AI Generated Candidate Version ${nextVersion}`,
        createdAt: now,
      };

      finalVersion = await scriptVersionsRepository.appendRecord(versionRecord);
    }

    // 5. Direct safety and quality validation
    const validationReport = ScriptValidator.validate(question, finalScript);

    // 6. Persist Audit log entry
    await auditService.log(
      actor.id,
      actor.name,
      'GENERATE_SCRIPT_CANDIDATE',
      'SCRIPT',
      finalScript.id,
      {
        questionId: question.id,
        contentId: finalScript.contentId,
        versionNumber: finalScript.currentVersion,
        isValid: validationReport.isValid,
        errors: validationReport.errors,
      }
    );

    return {
      script: finalScript,
      version: finalVersion,
      validationErrors: validationReport.errors,
      metadata: {
        modelUsed: aiResult.metadata.modelUsed,
        durationMs: Date.now() - startTime,
        isMockFallback: aiResult.metadata.isMockFallback,
      },
    };
  }

  /**
   * Enables complete editing and refinement of an existing script candidate by humans
   * before any approval/publishing takes place.
   */
  public async editScriptCandidate(
    scriptId: string,
    updates: {
      hookText?: string;
      hook?: string;
      problemStatement?: string;
      narration?: string;
      stepByStepSolution?: string;
      explanation?: string;
      answerReveal?: string;
      speedTrickOrTakeaway?: string;
      takeaway?: string;
      retention?: string;
      speedTrick?: string;
      callToAction?: string;
      cta?: string;
      notes?: string;
      createNewVersion?: boolean;
    },
    actor: { id: string; name: string; role?: string | UserRole }
  ): Promise<{ script: Script; version?: ScriptVersion }> {
    const existing = await scriptsRepository.findById(scriptId);
    if (!existing) {
      throw new Error(`Script with ID "${scriptId}" not found.`);
    }

    // Security & Invariance: Content ID and Question ID must never be modified
    if ((updates as any).contentId && (updates as any).contentId !== existing.contentId) {
      throw new Error(`Cannot modify canonical Content ID. Existing: "${existing.contentId}", attempted: "${(updates as any).contentId}".`);
    }
    if ((updates as any).questionId && (updates as any).questionId !== existing.questionId) {
      throw new Error(`Cannot modify source Question ID. Existing: "${existing.questionId}", attempted: "${(updates as any).questionId}".`);
    }

    // Resolve field aliases
    const hookText = updates.hookText !== undefined ? updates.hookText : updates.hook;
    const problemStatement = updates.problemStatement !== undefined ? updates.problemStatement : updates.narration;
    const stepByStepSolution = updates.stepByStepSolution !== undefined 
      ? updates.stepByStepSolution 
      : (updates.explanation !== undefined ? updates.explanation : updates.answerReveal);
    const speedTrickOrTakeaway = updates.speedTrickOrTakeaway !== undefined 
      ? updates.speedTrickOrTakeaway 
      : (updates.takeaway !== undefined ? updates.takeaway : (updates.retention !== undefined ? updates.retention : updates.speedTrick));
    const callToAction = updates.callToAction !== undefined ? updates.callToAction : updates.cta;
    const notes = updates.notes;

    if (hookText !== undefined && hookText.trim().length === 0) {
      throw new Error('Script editing error: Hook cannot be empty.');
    }

    const now = new Date().toISOString();
    // Default to creating a new version unless explicitly set to false
    const shouldCreateNewVersion = updates.createNewVersion !== false;

    if (shouldCreateNewVersion) {
      const currentVer = existing.currentVersion || 1;
      const nextVersionNumber = currentVer + 1;

      // Ensure base version V1 exists in repository for complete auditability
      const existingVersions = await scriptVersionsRepository.findByScriptId(existing.id);
      if (existingVersions.length === 0) {
        const v1Payload = {
          hookText: existing.hookText,
          problemStatement: existing.problemStatement,
          stepByStepSolution: existing.stepByStepSolution,
          speedTrickOrTakeaway: existing.speedTrickOrTakeaway,
          callToAction: existing.callToAction,
          notes: existing.notes,
        };
        await scriptVersionsRepository.appendRecord({
          id: `${existing.id}-V${currentVer}`,
          scriptId: existing.id,
          versionNumber: currentVer,
          content: JSON.stringify(v1Payload),
          contentJson: v1Payload,
          editedBy: 'Initial Draft',
          changeSummary: 'Initial generated draft version',
          createdAt: existing.createdAt || now,
        });
      }

      const updatedScript = await scriptsRepository.updateRecord(existing.id, {
        hookText: hookText !== undefined ? hookText : existing.hookText,
        problemStatement: problemStatement !== undefined ? problemStatement : existing.problemStatement,
        stepByStepSolution: stepByStepSolution !== undefined ? stepByStepSolution : existing.stepByStepSolution,
        speedTrickOrTakeaway: speedTrickOrTakeaway !== undefined ? speedTrickOrTakeaway : existing.speedTrickOrTakeaway,
        callToAction: callToAction !== undefined ? callToAction : existing.callToAction,
        notes: notes !== undefined ? notes : existing.notes,
        currentVersion: nextVersionNumber,
        status: 'DRAFT',
        approvedBy: undefined,
        approvedAt: undefined,
        approvedVersion: undefined,
        updatedAt: now,
      });

      if (!updatedScript) {
        throw new Error('Failed to save script edit candidate.');
      }

      // Record immutable revision version
      const versionId = `${existing.id}-V${nextVersionNumber}`;
      const payload = {
        hookText: updatedScript.hookText,
        problemStatement: updatedScript.problemStatement,
        stepByStepSolution: updatedScript.stepByStepSolution,
        speedTrickOrTakeaway: updatedScript.speedTrickOrTakeaway,
        callToAction: updatedScript.callToAction,
        notes: updatedScript.notes,
      };

      const newVersion: ScriptVersion = {
        id: versionId,
        scriptId: existing.id,
        versionNumber: nextVersionNumber,
        content: JSON.stringify(payload),
        contentJson: payload,
        editedBy: actor.name,
        changeSummary: `Human Manual Revision V${nextVersionNumber}`,
        createdAt: now,
      };

      const savedVersion = await scriptVersionsRepository.appendRecord(newVersion);

      await auditService.log(
        actor.id,
        actor.name,
        'MANUAL_EDIT_SCRIPT_VERSION',
        'SCRIPT',
        existing.id,
        { versionNumber: nextVersionNumber, contentId: existing.contentId }
      );

      return { script: updatedScript, version: savedVersion };
    } else {
      // In-place manual update (invalidates any prior approval)
      const updatedScript = await scriptsRepository.updateRecord(existing.id, {
        hookText: hookText !== undefined ? hookText : existing.hookText,
        problemStatement: problemStatement !== undefined ? problemStatement : existing.problemStatement,
        stepByStepSolution: stepByStepSolution !== undefined ? stepByStepSolution : existing.stepByStepSolution,
        speedTrickOrTakeaway: speedTrickOrTakeaway !== undefined ? speedTrickOrTakeaway : existing.speedTrickOrTakeaway,
        callToAction: callToAction !== undefined ? callToAction : existing.callToAction,
        notes: notes !== undefined ? notes : existing.notes,
        status: 'DRAFT',
        approvedBy: undefined,
        approvedAt: undefined,
        approvedVersion: undefined,
        updatedAt: now,
      });

      if (!updatedScript) {
        throw new Error('Failed to update script candidate in-place.');
      }

      await auditService.log(
        actor.id,
        actor.name,
        'MANUAL_EDIT_SCRIPT_IN_PLACE',
        'SCRIPT',
        existing.id,
        { currentVersion: existing.currentVersion, contentId: existing.contentId }
      );

      return { script: updatedScript };
    }
  }

  public async revertScript(
    scriptId: string,
    targetVersionNumber: number,
    actor: { id: string; name: string; role?: string | UserRole }
  ): Promise<{ script: Script; version?: ScriptVersion }> {
    const existing = await scriptsRepository.findById(scriptId);
    if (!existing) {
      throw new Error(`Script with ID "${scriptId}" not found.`);
    }

    const versions = await scriptVersionsRepository.findByScriptId(scriptId);
    const targetVersion = versions.find((v: any) => v.versionNumber === targetVersionNumber);
    if (!targetVersion) {
      throw new Error(`Target version V${targetVersionNumber} not found for script "${scriptId}".`);
    }

    const payload = typeof targetVersion.contentJson === 'string' 
      ? JSON.parse(targetVersion.contentJson) 
      : (targetVersion.contentJson || JSON.parse(targetVersion.content || '{}'));

    const res = await this.editScriptCandidate(
      scriptId,
      {
        ...payload,
        createNewVersion: true,
      },
      actor
    );

    await auditService.log(
      actor.id,
      actor.name,
      'REVERT_SCRIPT_TO_VERSION',
      'SCRIPT',
      scriptId,
      { revertedToVersion: targetVersionNumber, newVersion: res.script.currentVersion }
    );

    return res;
  }

  public async submitForReview(
    scriptId: string,
    reviewerId: string | undefined,
    actor: { id: string; name: string; role?: string | UserRole }
  ): Promise<Script> {
    const existing = await scriptsRepository.findById(scriptId);
    if (!existing) {
      throw new Error(`Script with ID "${scriptId}" not found.`);
    }

    const updated = await scriptsRepository.updateRecord(scriptId, {
      status: 'IN_REVIEW',
      assignedReviewerId: reviewerId,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) throw new Error('Failed to submit for review');

    await auditService.log(actor.id, actor.name, 'SUBMIT_SCRIPT_FOR_REVIEW', 'SCRIPT', scriptId, { reviewerId });

    return updated;
  }

  public async approveScript(
    scriptId: string,
    versionNumber: number,
    actor: { id: string; name: string; role?: string | UserRole },
    expectedContentId?: string
  ): Promise<Script> {
    const existing = await scriptsRepository.findById(scriptId);
    if (!existing) {
      throw new Error(`Script with ID "${scriptId}" not found.`);
    }

    // Cross-content protection: verify against expected Content ID
    if (expectedContentId && existing.contentId !== expectedContentId) {
      throw new Error(`Cross-content approval rejected: script Content ID "${existing.contentId}" does not match expected "${expectedContentId}".`);
    }

    // Role-based access control for approval
    const authorizedRoles = ['ADMIN', 'CONTENT_MANAGER', 'REVIEWER', 'TOPIC_LEAD'];
    if (!actor.role || !authorizedRoles.includes(actor.role as string)) {
      throw new Error(`User role ${actor.role} is not authorized to approve scripts.`);
    }

    // Assigned reviewer check (Admin and Content Manager can override)
    if (
      existing.assignedReviewerId &&
      actor.role !== 'ADMIN' &&
      actor.role !== 'CONTENT_MANAGER' &&
      actor.id !== existing.assignedReviewerId
    ) {
      throw new Error(`Reviewer mismatch: script is assigned to reviewer "${existing.assignedReviewerId}", but actor is "${actor.id}".`);
    }

    // Stale version approval prevention
    if (existing.currentVersion !== versionNumber) {
      throw new Error(`Stale approval rejected: script is at V${existing.currentVersion} but approval was for V${versionNumber}.`);
    }

    // Check readiness using ScriptValidator
    const question = await questionsRepository.findById(existing.questionId);
    if (!question) throw new Error('Source question not found for script.');

    // Ensure script Content ID matches source question Content ID
    const questionContentId = question.contentMasterId || (question as any).contentId;
    if (existing.contentId && questionContentId && existing.contentId !== questionContentId) {
      throw new Error(`Cross-content protection: Script Content ID "${existing.contentId}" does not match Question Content ID "${questionContentId}".`);
    }

    const validationReport = ScriptValidator.validate(question, existing);
    if (!validationReport.isValid) {
      throw new Error('Script failed readiness validation: ' + validationReport.errors.join(', '));
    }

    const updated = await scriptsRepository.updateRecord(scriptId, {
      status: 'APPROVED',
      approvedBy: actor.name,
      approvedAt: new Date().toISOString(),
      approvedVersion: versionNumber,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) throw new Error('Failed to approve script');

    await auditService.log(actor.id, actor.name, 'APPROVE_SCRIPT', 'SCRIPT', scriptId, {
      versionNumber,
      contentId: existing.contentId,
      approvedBy: actor.name,
    });

    return updated;
  }

  public async rejectScript(
    scriptId: string,
    reason: string,
    actor: { id: string; name: string; role?: string | UserRole }
  ): Promise<Script> {
    const existing = await scriptsRepository.findById(scriptId);
    if (!existing) {
      throw new Error(`Script with ID "${scriptId}" not found.`);
    }

    const updated = await scriptsRepository.updateRecord(scriptId, {
      status: 'REJECTED',
      updatedAt: new Date().toISOString(),
    });

    if (!updated) throw new Error('Failed to reject script');

    await auditService.log(actor.id, actor.name, 'REJECT_SCRIPT', 'SCRIPT', scriptId, { reason });

    return updated;
  }
}

export const scriptProductionService = ScriptProductionService.getInstance();
export const phase15ScriptProductionService = scriptProductionService;
export type Phase15ScriptProductionService = ScriptProductionService;
