/**
 * BURRA PARIKSHA CMS - Script & Script Version Management Service
 * Phase 6: Script, Thumbnail & Manual Publishing Management
 * 
 * Provides complete lifecycle management for video teleprompter scripts:
 * - Draft generation and viewing
 * - Script editing & in-place saves
 * - Immutable historical version snapshots in SCRIPT_VERSIONS
 * - Version rollback / diffing
 * - Transitioning video between SCRIPT_REQUIRED and SCRIPT_READY
 * - Comprehensive WORKFLOW and AUDIT_LOG integration
 */

import { scriptsRepository, scriptVersionsRepository } from '../repositories/scripts.repository';
import { videosRepository } from '../repositories/videos.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { idService } from './id.service';
import { auditService } from './audit.service';
import { videoService } from './video.service';
import { geminiService } from '../ai/gemini.service';
import { Question, Script, ScriptVersion, VideoProductionStatus } from '../../types';

export interface ScriptContentPayload {
  hookText: string;
  problemStatement: string;
  stepByStepSolution: string;
  speedTrickOrTakeaway: string;
  callToAction: string;
  notes?: string;
}

export interface SaveScriptOptions extends ScriptContentPayload {
  createNewVersion?: boolean;
  changeSummary?: string;
  editedBy?: string;
}

export class ScriptService {
  private static instance: ScriptService | null = null;

  private constructor() {}

  public static getInstance(): ScriptService {
    if (!ScriptService.instance) {
      ScriptService.instance = new ScriptService();
    }
    return ScriptService.instance;
  }

  /**
   * Generates a high-retention conversational Telugu teleprompter script draft directly from a Question.
   */
  public async generateTeluguScriptForQuestion(question: Question | any): Promise<{
    scriptPayload: ScriptContentPayload;
    metadata: {
      modelUsed: string;
      generationDurationMs: number;
      isMockFallback: boolean;
    };
    validation: any;
  }> {
    return geminiService.generateTeluguScript(question);
  }

  /**
   * Generates a conversational Telugu teleprompter script for a specific video in production.
   */
  public async generateTeluguScriptForVideo(videoId: string): Promise<{
    scriptPayload: ScriptContentPayload;
    metadata: {
      modelUsed: string;
      generationDurationMs: number;
      isMockFallback: boolean;
    };
    validation: any;
  }> {
    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new Error(`Video with ID "${videoId}" not found.`);
    }

    const question = await questionsRepository.findById(video.questionId);
    if (!question) {
      throw new Error(`Linked question "${video.questionId}" not found for video "${videoId}".`);
    }

    return geminiService.generateTeluguScript(question);
  }

  /**
   * Retrieves the current active script for a given video.
   * If none exists in the repository, generates a structured conversational Telugu starter draft derived from the linked question.
   */
  public async getScriptByVideoId(videoId: string): Promise<{
    script: Script | null;
    draftProposal?: ScriptContentPayload;
    validation?: any;
  }> {
    const existing = await scriptsRepository.findByVideoId(videoId);
    if (existing) {
      return { script: existing };
    }

    // Generate starter draft proposal from linked question if available
    const video = await videosRepository.findById(videoId);
    if (!video) {
      return { script: null };
    }

    const question = await questionsRepository.findById(video.questionId);
    if (!question) {
      return {
        script: null,
        draftProposal: {
          hookText: `🔥 ${video.title}: 10 సెకన్లలో సమాధానం చెప్పగలరా? చూద్దాం!`,
          problemStatement: `ప్రశ్నను జాగ్రత్తగా చదవండి.\n\nఆప్షన్లు:\nఎ) ఆప్షన్ A\nబి) ఆప్షన్ B\nసి) ఆప్షన్ C\nడి) ఆప్షన్ D`,
          stepByStepSolution: `సరైన సమాధానం మరియు దశలవారీ గణిత వివరణ.`,
          speedTrickOrTakeaway: `💡 బుర్ర ట్రిక్: ఆప్షన్ ఎలిమినేషన్ ద్వారా వేగంగా సాల్వ్ చేయండి.`,
          callToAction: `మీ సమాధానాన్ని కామెంట్ చేయండి & @BurraPariksha ని ఫాలో అవ్వండి!`,
          notes: 'Auto-draft generated for video production.',
        },
      };
    }

    const generation = await geminiService.generateTeluguScript(question);

    return {
      script: null,
      draftProposal: generation.scriptPayload,
      validation: generation.validation,
    };
  }

  /**
   * Retrieves all immutable revision versions for a specific script.
   */
  public async getScriptVersions(scriptId: string): Promise<ScriptVersion[]> {
    return scriptVersionsRepository.findByScriptId(scriptId);
  }

  /**
   * Saves script content for a video.
   * If no script exists, creates the initial record (Version 1).
   * If a script exists and createNewVersion is true, increments version and writes an immutable snapshot to SCRIPT_VERSIONS.
   * If createNewVersion is false, updates the current script in-place.
   */
  public async saveScript(
    videoId: string,
    payload: SaveScriptOptions,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<{ script: Script; version?: ScriptVersion }> {
    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new Error(`Video with ID "${videoId}" not found in database.`);
    }

    const existing = await scriptsRepository.findByVideoId(videoId);
    const now = new Date().toISOString();

    if (!existing) {
      // 1. Create Brand New Script (Version 1)
      const scriptId = await idService.allocateScriptId();
      const newScript: Script = {
        id: scriptId,
        videoId,
        questionId: video.questionId,
        hookText: payload.hookText || '',
        problemStatement: payload.problemStatement || '',
        stepByStepSolution: payload.stepByStepSolution || '',
        speedTrickOrTakeaway: payload.speedTrickOrTakeaway || '',
        callToAction: payload.callToAction || '',
        currentVersion: 1,
        notes: payload.notes || '',
        createdAt: now,
        updatedAt: now,
      };

      const savedScript = await scriptsRepository.appendRecord(newScript);

      // Create Version 1 in SCRIPT_VERSIONS
      const versionId = `${scriptId}-V1`;
      const versionPayload: ScriptVersion = {
        id: versionId,
        scriptId,
        versionNumber: 1,
        content: JSON.stringify(payload),
        contentJson: payload,
        editedBy: payload.editedBy || actor.name,
        changeSummary: payload.changeSummary || 'Initial script creation',
        createdAt: now,
      };
      await scriptVersionsRepository.appendRecord(versionPayload);

      await auditService.log(
        actor.id,
        actor.name,
        'CREATE_SCRIPT',
        'SCRIPT',
        scriptId,
        { videoId, versionNumber: 1, changeSummary: payload.changeSummary }
      );

      return { script: savedScript, version: versionPayload };
    }

    // 2. Existing Script Update
    if (payload.createNewVersion) {
      const nextVersionNumber = (existing.currentVersion || 1) + 1;
      const updatedScript = await scriptsRepository.updateRecord(existing.id, {
        hookText: payload.hookText,
        problemStatement: payload.problemStatement,
        stepByStepSolution: payload.stepByStepSolution,
        speedTrickOrTakeaway: payload.speedTrickOrTakeaway,
        callToAction: payload.callToAction,
        notes: payload.notes !== undefined ? payload.notes : existing.notes,
        currentVersion: nextVersionNumber,
        updatedAt: now,
      });

      if (!updatedScript) {
        throw new Error(`Failed to update script "${existing.id}".`);
      }

      // Write immutable version record
      const versionId = `${existing.id}-V${nextVersionNumber}`;
      const newVersion: ScriptVersion = {
        id: versionId,
        scriptId: existing.id,
        versionNumber: nextVersionNumber,
        content: JSON.stringify(payload),
        contentJson: payload,
        editedBy: payload.editedBy || actor.name,
        changeSummary: payload.changeSummary || `Version ${nextVersionNumber} revision`,
        createdAt: now,
      };
      await scriptVersionsRepository.appendRecord(newVersion);

      await auditService.log(
        actor.id,
        actor.name,
        'SAVE_NEW_SCRIPT_VERSION',
        'SCRIPT',
        existing.id,
        { videoId, versionNumber: nextVersionNumber, changeSummary: payload.changeSummary }
      );

      return { script: updatedScript, version: newVersion };
    } else {
      // In-place update without creating a new version
      const updatedScript = await scriptsRepository.updateRecord(existing.id, {
        hookText: payload.hookText,
        problemStatement: payload.problemStatement,
        stepByStepSolution: payload.stepByStepSolution,
        speedTrickOrTakeaway: payload.speedTrickOrTakeaway,
        callToAction: payload.callToAction,
        notes: payload.notes !== undefined ? payload.notes : existing.notes,
        updatedAt: now,
      });

      if (!updatedScript) {
        throw new Error(`Failed to update script "${existing.id}".`);
      }

      await auditService.log(
        actor.id,
        actor.name,
        'UPDATE_SCRIPT_IN_PLACE',
        'SCRIPT',
        existing.id,
        { videoId, currentVersion: existing.currentVersion }
      );

      return { script: updatedScript };
    }
  }

  /**
   * Reverts active script content to match a specific historical version.
   */
  public async revertToVersion(
    scriptId: string,
    versionNumber: number,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<Script> {
    const script = await scriptsRepository.findById(scriptId);
    if (!script) {
      throw new Error(`Script "${scriptId}" not found.`);
    }

    const versions = await scriptVersionsRepository.findByScriptId(scriptId);
    const targetVersion = versions.find((v) => v.versionNumber === versionNumber);
    if (!targetVersion) {
      throw new Error(`Script version ${versionNumber} not found for script "${scriptId}".`);
    }

    const content = targetVersion.contentJson || (targetVersion.content ? JSON.parse(targetVersion.content) : {});
    const now = new Date().toISOString();

    const updated = await scriptsRepository.updateRecord(scriptId, {
      hookText: content.hookText || script.hookText,
      problemStatement: content.problemStatement || script.problemStatement,
      stepByStepSolution: content.stepByStepSolution || script.stepByStepSolution,
      speedTrickOrTakeaway: content.speedTrickOrTakeaway || script.speedTrickOrTakeaway,
      callToAction: content.callToAction || script.callToAction,
      notes: content.notes || script.notes,
      updatedAt: now,
    });

    if (!updated) {
      throw new Error(`Failed to rollback script "${scriptId}".`);
    }

    await auditService.log(
      actor.id,
      actor.name,
      'REVERT_SCRIPT_VERSION',
      'SCRIPT',
      scriptId,
      { revertedToVersionNumber: versionNumber }
    );

    return updated;
  }

  /**
   * Validates the script and transitions video from SCRIPT_REQUIRED to SCRIPT_READY.
   */
  public async markScriptReady(
    videoId: string,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' },
    remarks?: string
  ): Promise<{ script: Script; videoStatus: VideoProductionStatus }> {
    const existing = await scriptsRepository.findByVideoId(videoId);
    if (!existing) {
      throw new Error(`Cannot mark script ready: No script record exists for video "${videoId}".`);
    }

    if (!existing.hookText.trim() || !existing.problemStatement.trim() || !existing.stepByStepSolution.trim()) {
      throw new Error(`Script is incomplete. Hook, Problem Statement, and Step-by-Step Solution are required.`);
    }

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new Error(`Video "${videoId}" not found.`);
    }

    // If currently in SCRIPT_REQUIRED, advance state machine to SCRIPT_READY
    if (video.status === VideoProductionStatus.SCRIPT_REQUIRED) {
      await videoService.transitionStatus(
        videoId,
        VideoProductionStatus.SCRIPT_READY,
        actor,
        remarks || 'Script finalized and approved for recording'
      );
    }

    await auditService.log(
      actor.id,
      actor.name,
      'MARK_SCRIPT_READY',
      'SCRIPT',
      existing.id,
      { videoId, remarks }
    );

    return { script: existing, videoStatus: VideoProductionStatus.SCRIPT_READY };
  }

  /**
   * Returns video to SCRIPT_REQUIRED for revisions.
   */
  public async returnScriptToEditing(
    videoId: string,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' },
    remarks?: string
  ): Promise<{ script: Script; videoStatus: VideoProductionStatus }> {
    const existing = await scriptsRepository.findByVideoId(videoId);
    if (!existing) {
      throw new Error(`No script record found for video "${videoId}".`);
    }

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new Error(`Video "${videoId}" not found.`);
    }

    if (video.status === VideoProductionStatus.SCRIPT_READY) {
      await videoService.transitionStatus(
        videoId,
        VideoProductionStatus.SCRIPT_REQUIRED,
        actor,
        remarks || 'Script returned to editing for revisions'
      );
    }

    await auditService.log(
      actor.id,
      actor.name,
      'RETURN_SCRIPT_TO_EDITING',
      'SCRIPT',
      existing.id,
      { videoId, remarks }
    );

    return { script: existing, videoStatus: VideoProductionStatus.SCRIPT_REQUIRED };
  }
}

export const scriptService = ScriptService.getInstance();
