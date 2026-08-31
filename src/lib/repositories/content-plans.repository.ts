/**
 * BURRA PARIKSHA CMS - Content Plans Repository
 * Phase 9: Content Planning, Batch Management & Question Intelligence
 */

import { BaseRepository } from './base.repository';
import { PLANNING_SHEET_TABS, SHEET_SCHEMAS } from '../schemas/google-sheets-schema';
import { ContentPlan, ContentPlanStatus } from '../../types';

export class ContentPlansRepository extends BaseRepository<ContentPlan> {
  private static instance: ContentPlansRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[PLANNING_SHEET_TABS.CONTENT_PLANS]);
  }

  public static getInstance(): ContentPlansRepository {
    if (!ContentPlansRepository.instance) {
      ContentPlansRepository.instance = new ContentPlansRepository();
    }
    return ContentPlansRepository.instance;
  }

  public async findByStatus(status: ContentPlanStatus): Promise<ContentPlan[]> {
    const all = await this.findAll();
    return all.filter((p) => p.status === status);
  }

  public async findByCategoryId(categoryId: string): Promise<ContentPlan[]> {
    const all = await this.findAll();
    return all.filter((p) => p.categoryId === categoryId);
  }

  public async findByTopicId(topicId: string): Promise<ContentPlan[]> {
    const all = await this.findAll();
    return all.filter((p) => p.topicId === topicId);
  }

  public async findBySubtopicId(subtopicId: string): Promise<ContentPlan[]> {
    const all = await this.findAll();
    return all.filter((p) => p.subtopicId === subtopicId);
  }

  public async create(plan: ContentPlan): Promise<ContentPlan> {
    return this.appendRecord(plan);
  }

  public async update(id: string, updates: Partial<ContentPlan>): Promise<ContentPlan | null> {
    return this.updateRecord(id, updates);
  }

  public async delete(id: string): Promise<boolean> {
    return this.deleteRecord(id);
  }
}

export const contentPlansRepository = ContentPlansRepository.getInstance();
