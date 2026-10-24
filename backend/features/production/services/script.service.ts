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

import { scriptsRepository, scriptVersionsRepository } from '../../../../database/firestore/repositories/scripts.repository';
import { videosRepository } from '../../../../database/firestore/repositories/videos.repository';
import { questionsRepository } from '../../../../database/firestore/repositories/questions.repository';
import { canonicalIdService } from '../../../../src/lib/id.service';
import { auditService } from '../../../infrastructure/audit/services/audit.service';
import { videoService } from './video.service';
import { aiOrchestrator } from '../../../ai/orchestrator';
import {
  Question,
  Script,
  ScriptVersion,
  VideoProductionStatus,
  UserRole,
  ScriptContentPayload,
  toAudienceLearningUnitContext,
  toLinkedLearningUnitContext,
} from '../../../../shared';
import { ValidationError } from '../../../../src/lib/errors';
import { learningUnitsRepository } from '../../../../database/firestore/repositories/learning-units.repository';

export type { ScriptContentPayload };

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

  private verifyScriptRole(actor: { role?: string | UserRole }): void {
    if (actor.role) {
      const r = String(actor.role).toUpperCase();
      const allowed = [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.SCRIPT_WRITER, UserRole.CONTENT_WRITER];
      if (!allowed.includes(r as any)) {
        throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to modify scripts.`);
      }
    }
  }

  /**
   * Generates a high-retention conversational Telugu teleprompter script draft directly from a Question.
   */
  public async generateTeluguScriptForQuestion(question: Question | any): Promise<{
    scriptPayload: ScriptContentPayload;
    metadata: {
      modelUsed: string;
      generationDurationMs: number;
      fallbackUsed: boolean;
    };
    validation: any;
  }> {
    const learningUnitContext = await this.getAudienceLearningUnitContext(question.learningUnitId);
    return aiOrchestrator.generateTeluguScript({ ...question, learningUnitContext });
  }

  /**
   * Generates a conversational Telugu teleprompter script for a specific video in production.
   */
  public async generateTeluguScriptForVideo(videoId: string): Promise<{
    scriptPayload: ScriptContentPayload;
    metadata: {
      modelUsed: string;
      generationDurationMs: number;
      fallbackUsed: boolean;
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

    const learningUnitContext = await this.getAudienceLearningUnitContext(question.learningUnitId || video.learningUnitId);
    return aiOrchestrator.generateTeluguScript({ ...question, learningUnitContext });
  }

  private async getAudienceLearningUnitContext(learningUnitId?: string) {
    if (!learningUnitId) return undefined;
    const learningUnit = await learningUnitsRepository.findById(learningUnitId);
    if (!learningUnit) {
      throw new ValidationError(`Linked LearningUnit "${learningUnitId}" was not found.`);
    }
    return toAudienceLearningUnitContext(toLinkedLearningUnitContext(learningUnit));
  }

  public async getScriptByQuestionId(questionId: string): Promise<Script | null> {
    return scriptsRepository.findByQuestionId(questionId);
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

    if (question.productionMode === 'TOPIC_INTRODUCTION') {
      return {
        script: null,
        draftProposal: {
          productionMode: 'TOPIC_INTRODUCTION',
          hookText: question.conceptTitle ? `🔥 ${question.conceptTitle}: కాన్సెప్ట్ క్లియర్‌గా అర్థం చేసుకుందాం!` : 'ఈ కాన్సెప్ట్ పూర్తి విశ్లేషణ',
          coreTheory: question.introductoryConcept || question.questionText || '',
          problemStatement: question.introductoryConcept || question.questionText || '',
          realLifeApplication: question.realLifeContext || question.syllabusScopeNotes || 'నిత్యజీవితంలో మరియు పోటీ పరీక్షల్లో ఈ కాన్సెప్ట్ ప్రాముఖ్యత...',
          stepByStepSolution: question.realLifeContext || question.syllabusScopeNotes || '',
          speedTrickOrTakeaway: '',
          callToAction: 'కాన్సెప్ట్ అర్థమైతే లైక్ చేయండి! తర్వాతి వీడియోలో ఈ టాపిక్ పై మోస్ట్ ఇంపార్టెంట్ ప్రాక్టీస్ ప్రశ్నలను సాల్వ్ చేద్దాం.',
          notes: 'Auto-draft generated for Mode 2 Topic Introduction.',
        },
      };
    }

    if (question.productionMode === 'EXPLAINED_QUESTIONS_VIDEO') {
      const qBlocks = (question.questions && question.questions.length > 0)
        ? question.questions.map((q: any, idx: number) => ({
            questionNumber: q.questionNumber || idx + 1,
            questionText: q.questionText || '',
            optionsText: q.options ? `Option A: ${q.options.a || q.options.A || ''}\nOption B: ${q.options.b || q.options.B || ''}\nOption C: ${q.options.c || q.options.C || ''}\nOption D: ${q.options.d || q.options.d || ''}` : '',
            stepByStepSolution: q.explanation || '',
            speedTrickOrTakeaway: q.trickOrPitfall || '',
          }))
        : [{
            questionNumber: 1,
            questionText: question.questionText || '',
            optionsText: '',
            stepByStepSolution: question.explanation || '',
            speedTrickOrTakeaway: (question as any).speedTrick || '',
          }];

      return {
        script: null,
        draftProposal: {
          productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
          introOverview: question.introductoryConcept || (question.conceptTitle ? `${question.conceptTitle} — సంపూర్ణ మాస్టర్‌క్లాస్` : 'ఈ వీడియోలో మనం ముఖ్యమైన ప్రశ్నలను స్టెప్-బై-స్టెప్ షార్ట్‌కట్లతో సాధిస్తాం.'),
          hookText: question.introductoryConcept || question.conceptTitle || 'సంపూర్ణ మాస్టర్‌క్లాస్',
          questionBlocks: qBlocks,
          problemStatement: qBlocks.map((q: any) => `Q${q.questionNumber}: ${q.questionText}`).join('\n\n'),
          stepByStepSolution: qBlocks.map((q: any) => `Q${q.questionNumber} Solution:\n${q.stepByStepSolution}`).join('\n\n'),
          speedTrickOrTakeaway: qBlocks.map((q: any) => `Q${q.questionNumber} Trick: ${q.speedTrickOrTakeaway}`).join('\n'),
          callToAction: 'ఈ ప్రశ్నలన్నీ పరీక్షల్లో ఎంతో ముఖ్యం! మరిన్ని మాస్టర్‌క్లాస్ వీడియోల కోసం Burra Pariksha ఛానెల్ ని Follow చేయండి!',
          notes: 'Auto-draft generated for Mode 3 Explained Questions Video.',
        },
      };
    }

    try {
      const generation = await aiOrchestrator.generateTeluguScript(question);
      return {
        script: null,
        draftProposal: generation.scriptPayload,
        validation: generation.validation,
      };
    } catch {
      const opts = question.options;
      const optionsText = opts && typeof opts === 'object'
        ? `Option A: ${opts.a || (opts as any).A || '...'}\nOption B: ${opts.b || (opts as any).B || '...'}\nOption C: ${opts.c || (opts as any).C || '...'}\nOption D: ${opts.d || (opts as any).D || '...'}`
        : 'Option A: ...\nOption B: ...\nOption C: ...\nOption D: ...';

      return {
        script: null,
        draftProposal: {
          productionMode: 'QUESTION_CHALLENGE_SHORT',
          hookText: `🔥 ${video.title || 'ఈ ప్రశ్న'}: 10 సెకన్లలో సమాధానం చెప్పగలరా? చూద్దాం!`,
          problemStatement: (question as any).statementTe || question.questionText || '',
          stepByStepSolution: (question as any).explanationTe || question.explanation || optionsText,
          speedTrickOrTakeaway: (question as any).shortcutTe || (question as any).speedTrick || '💡 బుర్ర ట్రిక్: ఆప్షన్ ఎలిమినేషన్ ద్వారా వేగంగా సాల్వ్ చేయండి.',
          callToAction: `మీ సమాధానాన్ని కామెంట్ చేయండి & @BurraPariksha ని ఫాలో అవ్వండి!`,
          notes: 'Starter draft generated from linked question.',
        },
      };
    }
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
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN }
  ): Promise<{ script: Script; version?: ScriptVersion }> {
    this.verifyScriptRole(actor);

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new Error(`Video with ID "${videoId}" not found in database.`);
    }

    const videoContentId = video.contentId || video.contentMasterId;
    if ((payload as any).contentId && videoContentId && (payload as any).contentId !== videoContentId) {
      throw new ValidationError(
        `Cross-content entity attachment rejected: provided Content ID "${(payload as any).contentId}" does not match parent video Content ID "${videoContentId}".`
      );
    }

    const existing = await scriptsRepository.findByVideoId(videoId);
    const now = new Date().toISOString();

    if (!existing) {
      // 1. Create Brand New Script (Version 1)
      const scriptId = canonicalIdService.generateScriptId();
      const newScript: Script = {
        id: scriptId,
        learningUnitId: video.learningUnitId,
        contentId: video.contentId || video.contentMasterId,
        contentMasterId: video.contentMasterId,
        videoId,
        questionId: video.questionId,
        hookText: payload.hookText || '',
        problemStatement: payload.problemStatement || '',
        stepByStepSolution: payload.stepByStepSolution || '',
        speedTrickOrTakeaway: payload.speedTrickOrTakeaway || '',
        callToAction: payload.callToAction || '',
        productionMode: payload.productionMode,
        coreTheory: payload.coreTheory,
        realLifeApplication: payload.realLifeApplication,
        introOverview: payload.introOverview,
        questionBlocks: payload.questionBlocks,
        scriptFormat: payload.scriptFormat,
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
        ...(video.learningUnitId ? { learningUnitId: video.learningUnitId } : {}),
        hookText: payload.hookText,
        problemStatement: payload.problemStatement,
        stepByStepSolution: payload.stepByStepSolution,
        speedTrickOrTakeaway: payload.speedTrickOrTakeaway,
        callToAction: payload.callToAction,
        productionMode: payload.productionMode !== undefined ? payload.productionMode : existing.productionMode,
        coreTheory: payload.coreTheory !== undefined ? payload.coreTheory : existing.coreTheory,
        realLifeApplication: payload.realLifeApplication !== undefined ? payload.realLifeApplication : existing.realLifeApplication,
        introOverview: payload.introOverview !== undefined ? payload.introOverview : existing.introOverview,
        questionBlocks: payload.questionBlocks !== undefined ? payload.questionBlocks : existing.questionBlocks,
        scriptFormat: payload.scriptFormat !== undefined ? payload.scriptFormat : existing.scriptFormat,
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
        productionMode: payload.productionMode !== undefined ? payload.productionMode : existing.productionMode,
        coreTheory: payload.coreTheory !== undefined ? payload.coreTheory : existing.coreTheory,
        realLifeApplication: payload.realLifeApplication !== undefined ? payload.realLifeApplication : existing.realLifeApplication,
        introOverview: payload.introOverview !== undefined ? payload.introOverview : existing.introOverview,
        questionBlocks: payload.questionBlocks !== undefined ? payload.questionBlocks : existing.questionBlocks,
        scriptFormat: payload.scriptFormat !== undefined ? payload.scriptFormat : existing.scriptFormat,
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
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN }
  ): Promise<Script> {
    this.verifyScriptRole(actor);

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
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN },
    remarks?: string
  ): Promise<{ script: Script; videoStatus: VideoProductionStatus }> {
    this.verifyScriptRole(actor);

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

    // If currently in SCRIPT_REQUIRED or QUEUED, advance state machine to SCRIPT_READY
    if (video.status === VideoProductionStatus.SCRIPT_REQUIRED || video.status === VideoProductionStatus.QUEUED) {
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
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN },
    remarks?: string
  ): Promise<{ script: Script; videoStatus: VideoProductionStatus }> {
    this.verifyScriptRole(actor);

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
