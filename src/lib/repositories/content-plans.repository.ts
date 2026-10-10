/**
 * BURRA PARIKSHA CMS - Content Plans Repository
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { ContentPlan, ContentPlanStatus } from '../../types';

export class ContentPlansRepository extends BaseRepository<ContentPlan> {
  private static instance: ContentPlansRepository | null = null;

  private constructor() {
    super('content_plans', 'BP-PLN-');
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

  public override async create(plan: ContentPlan): Promise<ContentPlan> {
    return this.appendRecord(plan);
  }

  public override async update(id: string, updates: Partial<ContentPlan>): Promise<ContentPlan | null> {
    return this.updateRecord(id, updates);
  }

  public override async delete(id: string): Promise<boolean> {
    return this.deleteRecord(id);
  }
}

export const contentPlansRepository = ContentPlansRepository.getInstance();
