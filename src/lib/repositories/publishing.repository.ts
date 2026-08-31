/**
 * BURRA PARIKSHA CMS - Publishing Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { Publishing } from '../../types';
import { MOCK_PUBLISHING_RECORDS } from '../mock-data/publishing';

export class PublishingRepository extends BaseRepository<Publishing> {
  private static instance: PublishingRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.PUBLISHING]);
    this.seedFallbackData(MOCK_PUBLISHING_RECORDS);
  }

  public static getInstance(): PublishingRepository {
    if (!PublishingRepository.instance) {
      PublishingRepository.instance = new PublishingRepository();
    }
    return PublishingRepository.instance;
  }

  public async findByVideoId(videoId: string): Promise<Publishing | null> {
    const all = await this.findAll();
    return all.find((p) => p.videoId === videoId) || null;
  }

  public async findByQuestionId(questionId: string): Promise<Publishing | null> {
    const all = await this.findAll();
    return all.find((p) => p.questionId === questionId) || null;
  }
}

export const publishingRepository = PublishingRepository.getInstance();
