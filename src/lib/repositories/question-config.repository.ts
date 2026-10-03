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

export const DEFAULT_QUESTION_CONFIG: QuestionConfigEntry[] = [
  {
    id: 'CFG-CTX-001',
    dimension: 'REAL_LIFE_CONTEXT',
    code: 'TRAJECTORY_INTERCEPT',
    displayLabel: 'Trajectory Intercept',
    description: 'Real-world physics and motion trajectory intercept points',
    aiPromptGuidance: 'Frame problems using realistic velocities and time coordinates',
    sortOrder: 1,
    isActive: true,
    isDefault: true,
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'CFG-STY-001',
    dimension: 'QUESTION_STYLE',
    code: 'STORY_BASED',
    displayLabel: 'Story Based',
    description: 'Narrative context with characters and scenario',
    aiPromptGuidance: 'Set up an engaging story premise before presenting mathematical facts',
    sortOrder: 1,
    isActive: true,
    isDefault: true,
    updatedAt: '2026-01-10T10:00:00Z',
  },
];

export class QuestionConfigRepository extends BaseRepository<QuestionConfigEntry> {
  private static instance: QuestionConfigRepository | null = null;

  public constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.QUESTION_CONFIG]);
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
