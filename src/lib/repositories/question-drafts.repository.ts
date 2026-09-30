/**
 * BURRA PARIKSHA CMS - Question Drafts Repository
 * Stage 01: Question Generation & Drafting Persistence
 * 
 * Provides isolated storage for question drafts generated in Stage 01.
 * Decouples draft creation from final production Question ID allocation,
 * Content Master generation, and multi-layer verification save gates.
 */

import { QuestionDraft } from '../../types';

export class QuestionDraftsRepository {
  private static instance: QuestionDraftsRepository | null = null;
  private draftStore = new Map<string, QuestionDraft>();

  private constructor() {}

  public static getInstance(): QuestionDraftsRepository {
    if (!QuestionDraftsRepository.instance) {
      QuestionDraftsRepository.instance = new QuestionDraftsRepository();
    }
    return QuestionDraftsRepository.instance;
  }

  public async create(draft: QuestionDraft): Promise<QuestionDraft> {
    this.draftStore.set(draft.id, { ...draft });
    return { ...draft };
  }

  public async findById(id: string): Promise<QuestionDraft | null> {
    const found = this.draftStore.get(id);
    return found ? { ...found } : null;
  }

  public async findAll(): Promise<QuestionDraft[]> {
    return Array.from(this.draftStore.values()).map((d) => ({ ...d }));
  }

  public async update(id: string, updates: Partial<QuestionDraft>): Promise<QuestionDraft> {
    const existing = this.draftStore.get(id);
    if (!existing) {
      throw new Error(`Question draft with ID "${id}" does not exist.`);
    }

    const updated: QuestionDraft = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.draftStore.set(id, updated);
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    return this.draftStore.delete(id);
  }

  public clear(): void {
    this.draftStore.clear();
  }
}

export const questionDraftsRepository = QuestionDraftsRepository.getInstance();
