/**
 * BURRA PARIKSHA CMS - Scripts & Script Versions Repositories
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { Script, ScriptVersion } from '../../types';

export class ScriptsRepository extends BaseRepository<Script> {
  private static instance: ScriptsRepository | null = null;

  private constructor() {
    super('scripts', 'BP-S-');
  }

  public static getInstance(): ScriptsRepository {
    if (!ScriptsRepository.instance) {
      ScriptsRepository.instance = new ScriptsRepository();
    }
    return ScriptsRepository.instance;
  }

  public async findByVideoId(videoId: string): Promise<Script | null> {
    const all = await this.findAll();
    return all.find((s) => s.videoId === videoId) || null;
  }

  public async findByQuestionId(questionId: string): Promise<Script | null> {
    const all = await this.findAll();
    return all.find((s) => s.questionId === questionId) || null;
  }

  public async findByContentId(contentId: string): Promise<Script | null> {
    const all = await this.findAll();
    return all.find((s) => (s as any).contentId === contentId) || null;
  }
}

export class ScriptVersionsRepository extends BaseRepository<ScriptVersion> {
  private static instance: ScriptVersionsRepository | null = null;

  private constructor() {
    super('script_versions');
  }

  public static getInstance(): ScriptVersionsRepository {
    if (!ScriptVersionsRepository.instance) {
      ScriptVersionsRepository.instance = new ScriptVersionsRepository();
    }
    return ScriptVersionsRepository.instance;
  }

  public async findByScriptId(scriptId: string): Promise<ScriptVersion[]> {
    const all = await this.findAll();
    return all
      .filter((sv) => sv.scriptId === scriptId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }
}

export const scriptsRepository = ScriptsRepository.getInstance();
export const scriptVersionsRepository = ScriptVersionsRepository.getInstance();
