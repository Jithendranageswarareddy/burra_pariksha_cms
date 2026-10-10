/**
 * BURRA PARIKSHA CMS - Content Masters Repository
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { ContentMaster } from '../../types';
import { ValidationError } from '../errors';

export class ContentMastersRepository extends BaseRepository<ContentMaster> {
  private static instance: ContentMastersRepository | null = null;

  private constructor() {
    super('content_masters', 'BP-CNT-');
  }

  public static getInstance(): ContentMastersRepository {
    if (!ContentMastersRepository.instance) {
      ContentMastersRepository.instance = new ContentMastersRepository();
    }
    return ContentMastersRepository.instance;
  }

  /**
   * Primary key uniqueness guard before appending a new content master.
   */
  public override async appendRecord(record: ContentMaster): Promise<ContentMaster> {
    if (record.id) {
      const existing = await this.findById(record.id);
      if (existing) {
        throw new ValidationError(
          `Primary Key Uniqueness Guard Rejected Append: Content Master with ID "${record.id}" already exists.`
        );
      }
    }
    return super.appendRecord(record);
  }

  public async findByPrimaryQuestionId(questionId: string): Promise<ContentMaster | null> {
    const all = await this.findAll();
    return all.find((m) => m.primaryQuestionId === questionId) || null;
  }

  public async findBySubtopicId(subtopicId: string): Promise<ContentMaster[]> {
    const all = await this.findAll();
    return all.filter((m) => m.subtopicId === subtopicId);
  }

  public async delete(id: string, options?: { actor?: { id: string; name: string }; reason?: string }): Promise<boolean> {
    return this.deleteRecord(id);
  }
}

export const contentMastersRepository = ContentMastersRepository.getInstance();
