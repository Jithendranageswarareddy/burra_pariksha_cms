/**
 * BURRA PARIKSHA CMS - Content Batches Repository
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { ContentBatch, ContentBatchStatus } from '../../types';

export class ContentBatchesRepository extends BaseRepository<ContentBatch> {
  private static instance: ContentBatchesRepository | null = null;

  private constructor() {
    super('content_batches', 'BP-BCH-');
  }

  public static getInstance(): ContentBatchesRepository {
    if (!ContentBatchesRepository.instance) {
      ContentBatchesRepository.instance = new ContentBatchesRepository();
    }
    return ContentBatchesRepository.instance;
  }

  public async findByPlanId(planId: string): Promise<ContentBatch[]> {
    const all = await this.findAll();
    return all.filter((b) => b.planId === planId);
  }

  public async findByStatus(status: ContentBatchStatus): Promise<ContentBatch[]> {
    const all = await this.findAll();
    return all.filter((b) => b.status === status);
  }

  public async findByQuestionId(questionId: string): Promise<ContentBatch[]> {
    const all = await this.findAll();
    return all.filter((b) => Array.isArray(b.questionIds) && b.questionIds.includes(questionId));
  }

  public override async create(batch: ContentBatch): Promise<ContentBatch> {
    return this.appendRecord(batch);
  }

  public override async update(id: string, updates: Partial<ContentBatch>): Promise<ContentBatch | null> {
    return this.updateRecord(id, updates);
  }

  public override async delete(id: string): Promise<boolean> {
    return this.deleteRecord(id);
  }
}

export const contentBatchesRepository = ContentBatchesRepository.getInstance();
