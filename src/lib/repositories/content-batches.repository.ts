/**
 * BURRA PARIKSHA CMS - Content Batches Repository
 * Phase 9: Content Planning, Batch Management & Question Intelligence
 */

import { BaseRepository } from './base.repository';
import { PLANNING_SHEET_TABS, SHEET_SCHEMAS } from '../schemas/google-sheets-schema';
import { ContentBatch, ContentBatchStatus } from '../../types';

export class ContentBatchesRepository extends BaseRepository<ContentBatch> {
  private static instance: ContentBatchesRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[PLANNING_SHEET_TABS.CONTENT_BATCHES]);
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

  public async create(batch: ContentBatch): Promise<ContentBatch> {
    return this.appendRecord(batch);
  }

  public async update(id: string, updates: Partial<ContentBatch>): Promise<ContentBatch | null> {
    return this.updateRecord(id, updates);
  }

  public async delete(id: string): Promise<boolean> {
    return this.deleteRecord(id);
  }
}

export const contentBatchesRepository = ContentBatchesRepository.getInstance();
