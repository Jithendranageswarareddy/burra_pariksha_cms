/**
 * BURRA PARIKSHA CMS - Topics Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { Topic } from '../../types';

export class TopicsRepository extends BaseRepository<Topic> {
  private static instance: TopicsRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.TOPICS]);
  }

  public static getInstance(): TopicsRepository {
    if (!TopicsRepository.instance) {
      TopicsRepository.instance = new TopicsRepository();
    }
    return TopicsRepository.instance;
  }

  public async findByCategoryId(categoryId: string): Promise<Topic[]> {
    const all = await this.findAll();
    return all.filter((t) => t.categoryId === categoryId);
  }

  public async findByName(name: string): Promise<Topic | null> {
    const all = await this.findAll();
    const clean = name.trim().toLowerCase();
    return all.find((t) => (t.name || '').trim().toLowerCase() === clean) || null;
  }

  public async findBySlug(slug: string): Promise<Topic | null> {
    const all = await this.findAll();
    const clean = slug.trim().toLowerCase();
    return all.find((t) => (t.slug || '').trim().toLowerCase() === clean) || null;
  }
}

export const topicsRepository = TopicsRepository.getInstance();
