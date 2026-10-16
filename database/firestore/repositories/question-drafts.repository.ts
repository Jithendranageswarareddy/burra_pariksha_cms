/**
 * BURRA PARIKSHA CMS - Question Drafts Repository
 * Stage 01: Question Generation & Drafting Persistence
 * 
 * Provides authoritative Cloud Firestore persistence for Stage 01 question drafts.
 * Decouples draft creation from final production Question ID allocation,
 * Content Master generation, and multi-layer verification save gates.
 */

import { BaseRepository } from './base.repository';
import { QuestionDraft } from '../../../shared';

export class QuestionDraftsRepository extends BaseRepository<QuestionDraft> {
  private static instance: QuestionDraftsRepository | null = null;

  private constructor() {
    super('question_drafts', 'dft_');
  }

  public static getInstance(): QuestionDraftsRepository {
    if (!QuestionDraftsRepository.instance) {
      QuestionDraftsRepository.instance = new QuestionDraftsRepository();
    }
    return QuestionDraftsRepository.instance;
  }

  /**
   * Creates a question draft document in Cloud Firestore.
   */
  public override async create(draft: Partial<QuestionDraft>): Promise<QuestionDraft> {
    return super.create(draft);
  }

  /**
   * Updates an existing question draft document in Cloud Firestore.
   * Enforces optimistic concurrency control (OCC) when expectedVersion is provided.
   */
  public override async update(
    recordOrId: QuestionDraft | string,
    updates?: Partial<QuestionDraft>,
    options?: { expectedVersion?: number }
  ): Promise<QuestionDraft> {
    const id = typeof recordOrId === 'string' ? recordOrId : recordOrId.id;
    const patch = typeof recordOrId === 'string' ? (updates || {}) : (updates || recordOrId);
    const updated = await super.update(id, patch, options);
    if (!updated) {
      const err = new Error(`Question draft with ID "${id}" does not exist.`);
      (err as any).statusCode = 404;
      throw err;
    }
    return updated;
  }

  /**
   * Test fixture helper to purge draft collection.
   */
  public async clear(): Promise<void> {
    const all = await this.findAll();
    await Promise.all(all.map((d) => this.delete(d.id)));
  }
}

export const questionDraftsRepository = QuestionDraftsRepository.getInstance();
