/**
 * BURRA PARIKSHA CMS - Categories Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { Category } from '../../types';
import { PRODUCTION_CATEGORIES } from '../data/production-taxonomy';

export class CategoriesRepository extends BaseRepository<Category> {
  private static instance: CategoriesRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.CATEGORIES]);
    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      this.seedFallbackData(PRODUCTION_CATEGORIES);
    }
  }

  public static getInstance(): CategoriesRepository {
    if (!CategoriesRepository.instance) {
      CategoriesRepository.instance = new CategoriesRepository();
    }
    return CategoriesRepository.instance;
  }

  public override async findAll(): Promise<Category[]> {
    const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName);
    if (!this.client.isConfigured(this.getTargetSpreadsheetId()) && (!sheetStore || sheetStore.size === 0)) {
      this.seedFallbackData(PRODUCTION_CATEGORIES);
    }
    return super.findAll();
  }

  public async findBySlug(slug: string): Promise<Category | null> {
    const all = await this.findAll();
    return all.find((c) => c.slug === slug) || null;
  }
}

export const categoriesRepository = CategoriesRepository.getInstance();
