/**
 * BURRA PARIKSHA CMS - Subtopics Repository
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { Subtopic } from '../../types';

export class SubtopicsRepository extends BaseRepository<Subtopic> {
  private static instance: SubtopicsRepository | null = null;

  private constructor() {
    super('subtopics', 'BP-SUB-');
  }

  public static getInstance(): SubtopicsRepository {
    if (!SubtopicsRepository.instance) {
      SubtopicsRepository.instance = new SubtopicsRepository();
    }
    return SubtopicsRepository.instance;
  }

  public async findByTopicId(topicId: string): Promise<Subtopic[]> {
    const all = await this.findAll();
    return all.filter((s) => s.topicId === topicId);
  }

  public async findByNameAndTopicId(name: string, topicId: string): Promise<Subtopic | null> {
    const all = await this.findAll();
    const cleanName = name.trim().toLowerCase();
    return all.find((s) => s.topicId === topicId && (s.name || '').trim().toLowerCase() === cleanName) || null;
  }

  public async findBySlugAndTopicId(slug: string, topicId: string): Promise<Subtopic | null> {
    const all = await this.findAll();
    const cleanSlug = slug.trim().toLowerCase();
    return all.find((s) => s.topicId === topicId && (s.slug || '').trim().toLowerCase() === cleanSlug) || null;
  }

  public async findBySlug(slug: string): Promise<Subtopic | null> {
    const all = await this.findAll();
    const clean = slug.trim().toLowerCase();
    return all.find((s) => (s.slug || '').trim().toLowerCase() === clean) || null;
  }
}

export const subtopicsRepository = SubtopicsRepository.getInstance();
