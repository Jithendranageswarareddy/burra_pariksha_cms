/**
 * BURRA PARIKSHA CMS - Taxonomy Service
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Manages aptitude categories, topics, subtopics and enforces strict relational integrity.
 */

import { categoriesRepository, topicsRepository, subtopicsRepository } from '../repositories';
import { Category, Subtopic, Topic } from '../../types';
import { ReferenceIntegrityError, ValidationError } from '../google-sheets/errors';
import { idService } from './id.service';
import { auditService } from './audit.service';

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string;
  colorCode?: string;
}

export interface CreateTopicInput {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
}

export interface CreateSubtopicInput {
  topicId: string;
  name: string;
  slug?: string;
  notes?: string;
}

export interface TaxonomyTreeItem extends Category {
  topics: Array<Topic & { subtopics: Subtopic[] }>;
}

export class TaxonomyService {
  private static instance: TaxonomyService | null = null;

  private constructor() {}

  public static getInstance(): TaxonomyService {
    if (!TaxonomyService.instance) {
      TaxonomyService.instance = new TaxonomyService();
    }
    return TaxonomyService.instance;
  }

  public async getCategories(): Promise<Category[]> {
    return categoriesRepository.findAll();
  }

  public async getCategoryById(id: string): Promise<Category | null> {
    return categoriesRepository.findById(id);
  }

  public async getTopics(categoryId?: string): Promise<Topic[]> {
    if (categoryId) {
      return topicsRepository.findByCategoryId(categoryId);
    }
    return topicsRepository.findAll();
  }

  public async getTopicById(id: string): Promise<Topic | null> {
    return topicsRepository.findById(id);
  }

  public async getSubtopics(topicId?: string): Promise<Subtopic[]> {
    if (topicId) {
      return subtopicsRepository.findByTopicId(topicId);
    }
    return subtopicsRepository.findAll();
  }

  public async getSubtopicById(id: string): Promise<Subtopic | null> {
    return subtopicsRepository.findById(id);
  }

  /**
   * Creates a new Category in the CATEGORIES sheet with auto-generated ID, slug, and audit trail.
   */
  public async createCategory(
    input: CreateCategoryInput,
    actor?: { id: string; name: string }
  ): Promise<Category> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Category name is required and cannot be empty.');
    }

    const id = await idService.allocateCategoryId();
    const slug = input.slug?.trim() || input.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const now = new Date().toISOString();

    const category: Category = {
      id,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || '',
      colorCode: input.colorCode?.trim() || '#3B82F6',
      createdAt: now,
    };

    const saved = await categoriesRepository.appendRecord(category);

    if (actor) {
      await auditService.log(
        actor.id,
        actor.name,
        'TAXONOMY_CATEGORY_CREATED',
        'CATEGORY',
        saved.id,
        { name: saved.name, slug: saved.slug }
      );
    }

    return saved;
  }

  /**
   * Creates a new Topic nested under a valid Category in the TOPICS sheet.
   */
  public async createTopic(
    input: CreateTopicInput,
    actor?: { id: string; name: string }
  ): Promise<Topic> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Topic name is required and cannot be empty.');
    }
    if (!input.categoryId || input.categoryId.trim().length === 0) {
      throw new ValidationError('Parent Category ID is required.');
    }

    const parentCategory = await categoriesRepository.findById(input.categoryId);
    if (!parentCategory) {
      throw new ReferenceIntegrityError(`Referenced Category with ID "${input.categoryId}" does not exist in the CATEGORIES sheet.`);
    }

    const id = await idService.allocateTopicId();
    const slug = input.slug?.trim() || input.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const now = new Date().toISOString();

    const topic: Topic = {
      id,
      categoryId: parentCategory.id,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || '',
      createdAt: now,
    };

    const saved = await topicsRepository.appendRecord(topic);

    if (actor) {
      await auditService.log(
        actor.id,
        actor.name,
        'TAXONOMY_TOPIC_CREATED',
        'TOPIC',
        saved.id,
        { name: saved.name, categoryId: saved.categoryId, slug: saved.slug }
      );
    }

    return saved;
  }

  /**
   * Creates a new Subtopic nested under a valid Topic in the SUBTOPICS sheet.
   */
  public async createSubtopic(
    input: CreateSubtopicInput,
    actor?: { id: string; name: string }
  ): Promise<Subtopic> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Subtopic name is required and cannot be empty.');
    }
    if (!input.topicId || input.topicId.trim().length === 0) {
      throw new ValidationError('Parent Topic ID is required.');
    }

    const parentTopic = await topicsRepository.findById(input.topicId);
    if (!parentTopic) {
      throw new ReferenceIntegrityError(`Referenced Topic with ID "${input.topicId}" does not exist in the TOPICS sheet.`);
    }

    const id = await idService.allocateSubtopicId();
    const slug = input.slug?.trim() || input.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const now = new Date().toISOString();

    const subtopic: Subtopic = {
      id,
      topicId: parentTopic.id,
      name: input.name.trim(),
      slug,
      notes: input.notes?.trim() || '',
      createdAt: now,
    };

    const saved = await subtopicsRepository.appendRecord(subtopic);

    if (actor) {
      await auditService.log(
        actor.id,
        actor.name,
        'TAXONOMY_SUBTOPIC_CREATED',
        'SUBTOPIC',
        saved.id,
        { name: saved.name, topicId: saved.topicId, slug: saved.slug }
      );
    }

    return saved;
  }

  /**
   * Searches categories by name, slug, or description keyword.
   */
  public async searchCategories(query: string): Promise<Category[]> {
    const all = await this.getCategories();
    if (!query || !query.trim()) return all;
    const q = query.toLowerCase().trim();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }

  /**
   * Searches topics by name, slug, or description keyword with optional category filter.
   */
  public async searchTopics(query: string, categoryId?: string): Promise<Topic[]> {
    const all = await this.getTopics(categoryId);
    if (!query || !query.trim()) return all;
    const q = query.toLowerCase().trim();
    return all.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }

  /**
   * Searches subtopics by name, slug, or notes keyword with optional topic filter.
   */
  public async searchSubtopics(query: string, topicId?: string): Promise<Subtopic[]> {
    const all = await this.getSubtopics(topicId);
    if (!query || !query.trim()) return all;
    const q = query.toLowerCase().trim();
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
    );
  }

  /**
   * Retrieves full hierarchical taxonomy tree.
   */
  public async getTaxonomyTree(): Promise<TaxonomyTreeItem[]> {
    const [categories, topics, subtopics] = await Promise.all([
      categoriesRepository.findAll(),
      topicsRepository.findAll(),
      subtopicsRepository.findAll(),
    ]);

    return categories.map((cat) => {
      const catTopics = topics.filter((t) => t.categoryId === cat.id);
      const enrichedTopics = catTopics.map((top) => {
        const topSubtopics = subtopics.filter((s) => s.topicId === top.id);
        return {
          ...top,
          subtopics: topSubtopics,
        };
      });

      return {
        ...cat,
        topics: enrichedTopics,
      };
    });
  }

  /**
   * Validates Category -> Topic -> Subtopic hierarchical integrity.
   * Throws ReferenceIntegrityError if any parent-child relationship is broken.
   */
  public async validateTaxonomy(
    categoryId: string,
    topicId: string,
    subtopicId: string
  ): Promise<{ category: Category; topic: Topic; subtopic: Subtopic }> {
    const [category, topic, subtopic] = await Promise.all([
      categoriesRepository.findById(categoryId),
      topicsRepository.findById(topicId),
      subtopicsRepository.findById(subtopicId),
    ]);

    if (!category) {
      throw new ReferenceIntegrityError(`Referenced Category with ID "${categoryId}" does not exist in the CATEGORIES sheet.`);
    }

    if (!topic) {
      throw new ReferenceIntegrityError(`Referenced Topic with ID "${topicId}" does not exist in the TOPICS sheet.`);
    }

    if (topic.categoryId !== categoryId) {
      throw new ReferenceIntegrityError(
        `Taxonomy integrity violation: Topic "${topic.name}" (${topic.id}) belongs to Category "${topic.categoryId}", not "${categoryId}".`
      );
    }

    if (!subtopic) {
      throw new ReferenceIntegrityError(`Referenced Subtopic with ID "${subtopicId}" does not exist in the SUBTOPICS sheet.`);
    }

    if (subtopic.topicId !== topicId) {
      throw new ReferenceIntegrityError(
        `Taxonomy integrity violation: Subtopic "${subtopic.name}" (${subtopic.id}) belongs to Topic "${subtopic.topicId}", not "${topicId}".`
      );
    }

    return { category, topic, subtopic };
  }
}

export const taxonomyService = TaxonomyService.getInstance();
