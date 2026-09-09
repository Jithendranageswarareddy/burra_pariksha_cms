/**
 * BURRA PARIKSHA CMS - Content Masters Repository
 * Task 2: Canonical Content Master Data Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { ContentMaster } from '../../types';

export class ContentMastersRepository extends BaseRepository<ContentMaster> {
  private static instance: ContentMastersRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.CONTENT_MASTERS]);
  }

  public static getInstance(): ContentMastersRepository {
    if (!ContentMastersRepository.instance) {
      ContentMastersRepository.instance = new ContentMastersRepository();
    }
    return ContentMastersRepository.instance;
  }

  public async findByPrimaryQuestionId(questionId: string): Promise<ContentMaster | null> {
    const all = await this.findAll();
    return all.find((m) => m.primaryQuestionId === questionId) || null;
  }

  public async findBySubtopicId(subtopicId: string): Promise<ContentMaster[]> {
    const all = await this.findAll();
    return all.filter((m) => m.subtopicId === subtopicId);
  }
}

export const contentMastersRepository = ContentMastersRepository.getInstance();
