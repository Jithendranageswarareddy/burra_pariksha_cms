/**
 * BURRA PARIKSHA CMS - Subtopics Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { Subtopic } from '../../types';
import { MOCK_SUBTOPICS } from '../mock-data/taxonomy';

export class SubtopicsRepository extends BaseRepository<Subtopic> {
  private static instance: SubtopicsRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.SUBTOPICS]);
    this.seedFallbackData(MOCK_SUBTOPICS);
  }

  public static getInstance(): SubtopicsRepository {
    if (!SubtopicsRepository.instance) {
      SubtopicsRepository.instance = new SubtopicsRepository();
    }
    return SubtopicsRepository.instance;
  }

  public async findByTopicId(topicId: string): Promise<Subtopic[]> {
    const all = await this.findAll();
    return all.filter((s) => s.topicId === topicId);
  }

  public async findBySlug(slug: string): Promise<Subtopic | null> {
    const all = await this.findAll();
    return all.find((s) => s.slug === slug) || null;
  }
}

export const subtopicsRepository = SubtopicsRepository.getInstance();
