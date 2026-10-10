/**
 * BURRA PARIKSHA CMS - Topics Repository
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { Topic } from '../../types';

export class TopicsRepository extends BaseRepository<Topic> {
  private static instance: TopicsRepository | null = null;

  private constructor() {
    super('topics', 'BP-TOP-');
  }

  public static getInstance(): TopicsRepository {
    if (!TopicsRepository.instance) {
      TopicsRepository.instance = new TopicsRepository();
    }
    return TopicsRepository.instance;
  }

  public async findByCategoryId(categoryId: string): Promise<Topic[]> {
    const all = await this.findAll();
    return all.filter((t) => t.categoryId === categoryId);
  }

  public async findByName(name: string): Promise<Topic | null> {
    const all = await this.findAll();
    const clean = name.trim().toLowerCase();
    return all.find((t) => (t.name || '').trim().toLowerCase() === clean) || null;
  }

  public async findBySlug(slug: string): Promise<Topic | null> {
    const all = await this.findAll();
    const clean = slug.trim().toLowerCase();
    return all.find((t) => (t.slug || '').trim().toLowerCase() === clean) || null;
  }
}

export const topicsRepository = TopicsRepository.getInstance();
