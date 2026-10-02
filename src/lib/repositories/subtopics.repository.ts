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
    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      this.seedFallbackData(MOCK_SUBTOPICS);
    }
  }

  public static getInstance(): SubtopicsRepository {
    if (!SubtopicsRepository.instance) {
      SubtopicsRepository.instance = new SubtopicsRepository();
    }
    return SubtopicsRepository.instance;
  }

  public override async findAll(): Promise<Subtopic[]> {
    const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName);
    if (!this.client.isConfigured(this.getTargetSpreadsheetId()) && (!sheetStore || sheetStore.size === 0)) {
      this.seedFallbackData(MOCK_SUBTOPICS);
    }
    return super.findAll();
  }

  public async findByTopicId(topicId: string): Promise<Subtopic[]> {
    const all = await this.findAll();
    return all.filter((s) => s.topicId === topicId);
  }

  public async findByNameAndTopicId(name: string, topicId: string): Promise<Subtopic | null> {
    const all = await this.findAll();
    const cleanName = name.trim().toLowerCase();
    return all.find((s) => s.topicId === topicId && (s.name || '').trim().toLowerCase() === cleanName) || null;
  }

  public async findBySlugAndTopicId(slug: string, topicId: string): Promise<Subtopic | null> {
    const all = await this.findAll();
    const cleanSlug = slug.trim().toLowerCase();
    return all.find((s) => s.topicId === topicId && (s.slug || '').trim().toLowerCase() === cleanSlug) || null;
  }

  public async findBySlug(slug: string): Promise<Subtopic | null> {
    const all = await this.findAll();
    const clean = slug.trim().toLowerCase();
    return all.find((s) => (s.slug || '').trim().toLowerCase() === clean) || null;
  }
}

export const subtopicsRepository = SubtopicsRepository.getInstance();
