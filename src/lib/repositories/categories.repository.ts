/**
 * BURRA PARIKSHA CMS - Categories Repository
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { Category } from '../../types';

export class CategoriesRepository extends BaseRepository<Category> {
  private static instance: CategoriesRepository | null = null;

  private constructor() {
    super('categories', 'BP-CAT-');
  }

  public static getInstance(): CategoriesRepository {
    if (!CategoriesRepository.instance) {
      CategoriesRepository.instance = new CategoriesRepository();
    }
    return CategoriesRepository.instance;
  }

  public async findBySlug(slug: string): Promise<Category | null> {
    const all = await this.findAll();
    return all.find((c) => c.slug === slug) || null;
  }
}

export const categoriesRepository = CategoriesRepository.getInstance();
