/**
 * BURRA PARIKSHA CMS - Question Configuration Repository
 * Question Studio Production Configuration Infrastructure
 * 
 * Provides Google Sheets persistence for creator-managed configuration metadata
 * (Real-Life Contexts, Question Styles, and prompt guidance).
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { QuestionConfigDimension, QuestionConfigEntry } from '../../types';

export class QuestionConfigRepository extends BaseRepository<QuestionConfigEntry> {
  private static instance: QuestionConfigRepository | null = null;

  public constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.QUESTION_CONFIG]);
    // Note: No hardcoded fallback seeds are injected here.
    // Production configuration must be read from the actual Google Sheets worksheet.
  }

  public static getInstance(): QuestionConfigRepository {
    if (!QuestionConfigRepository.instance) {
      QuestionConfigRepository.instance = new QuestionConfigRepository();
    }
    return QuestionConfigRepository.instance;
  }

  /**
   * Finds all configuration entries for a given dimension, sorted by sortOrder ascending.
   */
  public async findByDimension(dimension: QuestionConfigDimension | string): Promise<QuestionConfigEntry[]> {
    const all = await this.findAll();
    const cleanDim = (dimension || '').trim().toUpperCase();
    return all
      .filter((entry) => (entry.dimension || '').trim().toUpperCase() === cleanDim)
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  }

  /**
   * Finds all active configuration entries for a given dimension, sorted by sortOrder ascending.
   */
  public async findActiveByDimension(dimension: QuestionConfigDimension | string): Promise<QuestionConfigEntry[]> {
    const all = await this.findAll();
    const cleanDim = (dimension || '').trim().toUpperCase();
    return all
      .filter((entry) => {
        const isDimMatch = (entry.dimension || '').trim().toUpperCase() === cleanDim;
        const isActive = entry.isActive === true || String(entry.isActive).toLowerCase() === 'true';
        return isDimMatch && isActive;
      })
      .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  }

  /**
   * Finds a single configuration entry by dimension and machine-readable code.
   */
  public async findByCode(
    dimension: QuestionConfigDimension | string,
    code: string
  ): Promise<QuestionConfigEntry | null> {
    if (!dimension || !code) return null;
    const all = await this.findAll();
    const cleanDim = dimension.trim().toUpperCase();
    const cleanCode = code.trim().toUpperCase();
    return (
      all.find(
        (entry) =>
          (entry.dimension || '').trim().toUpperCase() === cleanDim &&
          (entry.code || '').trim().toUpperCase() === cleanCode
      ) || null
    );
  }

  /**
   * Identifies the configured default entry for a dimension.
   * Prefers active entry with isDefault === true; falls back to first active entry by sortOrder.
   */
  public async getDefault(dimension: QuestionConfigDimension | string): Promise<QuestionConfigEntry | null> {
    const active = await this.findActiveByDimension(dimension);
    if (active.length === 0) return null;
    const explicitDefault = active.find(
      (entry) => entry.isDefault === true || String(entry.isDefault).toLowerCase() === 'true'
    );
    return explicitDefault || active[0];
  }
}

export const questionConfigRepository = QuestionConfigRepository.getInstance();
