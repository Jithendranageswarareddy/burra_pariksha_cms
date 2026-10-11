/**
 * BURRA PARIKSHA CMS - Taxonomy Service
 * Phase 3 / Sprint 5: Pure 2-Tier Taxonomy Engine (TOPIC -> SUBTOPIC)
 * 
 * Manages Topics and Subtopics as the authoritative operational taxonomy,
 * enforces strict relational integrity, provides bulk import dry-run capabilities,
 * and caches lookups for high performance.
 */

import { topicsRepository, subtopicsRepository } from '../../../../src/lib/repositories';
import { Subtopic, Topic } from '../../../../src/types';
import { ReferenceIntegrityError, ValidationError } from '../../../../src/lib/errors';
import { canonicalIdService } from '../../../../src/lib/id.service';
import { auditService } from '../../../infrastructure/audit/services/audit.service';
import {
  CreateTopicInputSchema,
  UpdateTopicInputSchema,
  CreateSubtopicInputSchema,
  UpdateSubtopicInputSchema,
  BulkImportTaxonomyInputSchema,
  BulkImportTaxonomyInput,
  CreateTopicInput,
  CreateSubtopicInput,
  UpdateTopicInput,
  UpdateSubtopicInput,
} from '../../../../src/lib/schemas/google-sheets-schema';

export interface TaxonomyTreeItem extends Topic {
  subtopics: Subtopic[];
}

export interface PureTaxonomyTopic extends Topic {
  subtopics: Subtopic[];
}

export interface TaxonomyMetrics {
  totalTopics: number;
  totalSubtopics: number;
  activeTopics: number;
  activeSubtopics: number;
  targetTopics: number;
  targetSubtopicsPerTopic: number;
  targetTotalSubtopics: number;
  missingSubtopics: number;
  completeTopicsCount: number;
  incompleteTopicsCount: number;
  completeTopicIds: string[];
  incompleteTopicIds: string[];
  subtopicsByTopic: Record<string, number>;
  hasDataGap: boolean;
  dataGapMessage: string;
}

export interface BulkImportDryRunReport {
  valid: boolean;
  summary: {
    totalTopicsInInput: number;
    totalSubtopicsInInput: number;
    newTopicsToCreate: number;
    existingTopicsToReuse: number;
    newSubtopicsToCreate: number;
    errorCount: number;
    duplicateCount: number;
  };
  plan: {
    topicsToCreate: Array<{ name: string; slug: string; description?: string; displayOrder?: number }>;
    subtopicsToCreate: Array<{ topicName: string; name: string; slug: string; description?: string; notes?: string; displayOrder?: number }>;
  };
  errors: Array<{ index: number; type: string; message: string }>;
}

export class TaxonomyService {
  private static instance: TaxonomyService | null = null;

  // In-memory cache to prevent N+1 sheet/db reads
  private topicsCache: Topic[] | null = null;
  private subtopicsCache: Subtopic[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL_MS = 60000; // 1 minute TTL

  private constructor() {}

  public static getInstance(): TaxonomyService {
    if (!TaxonomyService.instance) {
      TaxonomyService.instance = new TaxonomyService();
    }
    return TaxonomyService.instance;
  }

  public invalidateCache(): void {
    this.topicsCache = null;
    this.subtopicsCache = null;
    this.cacheTimestamp = 0;
  }

  private isCacheValid(): boolean {
    return (
      this.topicsCache !== null &&
      this.subtopicsCache !== null &&
      Date.now() - this.cacheTimestamp < this.CACHE_TTL_MS
    );
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  // ----------------------------------------------------
  // Topic Methods (Top-Level Operational Taxonomy)
  // ----------------------------------------------------

  public async getTopics(
    options: { includeInactive?: boolean } = {}
  ): Promise<Topic[]> {
    let topics: Topic[];
    if (this.isCacheValid() && this.topicsCache) {
      topics = this.topicsCache;
    } else {
      topics = await topicsRepository.findAll();
      this.topicsCache = topics;
    }

    let filtered = topics;

    if (!options.includeInactive) {
      filtered = filtered.filter((t) => t.isActive !== false);
    }

    // Sort by displayOrder ascending, then name
    return [...filtered].sort((a, b) => {
      const orderA = a.displayOrder ?? 999;
      const orderB = b.displayOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  public async getTopicById(id: string): Promise<Topic | null> {
    const all = await this.getTopics({ includeInactive: true });
    return all.find((t) => t.id === id) || null;
  }

  public async createTopic(
    input: CreateTopicInput,
    actor?: { id: string; name: string }
  ): Promise<Topic> {
    const validated = CreateTopicInputSchema.parse(input);
    const cleanName = validated.name.trim();
    const slug = validated.slug?.trim() || this.slugify(cleanName);

    // Duplicate Prevention - Check Topic name uniqueness (case-insensitive)
    const allTopics = await this.getTopics({ includeInactive: true });
    const duplicateName = allTopics.find(
      (t) => (t.name || '').trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicateName) {
      throw new ValidationError(`A Topic with the name "${cleanName}" already exists (ID: ${duplicateName.id}).`);
    }

    // Duplicate Prevention - Check Topic slug uniqueness
    const duplicateSlug = allTopics.find(
      (t) => (t.slug || '').trim().toLowerCase() === slug.toLowerCase()
    );
    if (duplicateSlug) {
      throw new ValidationError(`A Topic with the slug "${slug}" already exists (ID: ${duplicateSlug.id}).`);
    }

    const id = canonicalIdService.generateTopicId();
    const now = new Date().toISOString();

    const topic: Topic = {
      id,
      name: cleanName,
      slug,
      description: validated.description?.trim() || '',
      displayOrder: validated.displayOrder ?? 1,
      isActive: validated.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await topicsRepository.appendRecord(topic);
    this.invalidateCache();

    if (actor) {
      await auditService.log(
        actor.id,
        actor.name,
        'TAXONOMY_TOPIC_CREATED',
        'TOPIC',
        saved.id,
        { name: saved.name, slug: saved.slug }
      );
    }

    return saved;
  }

  public async updateTopic(
    id: string,
    input: UpdateTopicInput,
    actor?: { id: string; name: string }
  ): Promise<Topic> {
    const validated = UpdateTopicInputSchema.parse({ ...input, id });
    const existing = await this.getTopicById(id);
    if (!existing) {
      throw new ReferenceIntegrityError(`Topic with ID "${id}" does not exist.`);
    }

    const allTopics = await this.getTopics({ includeInactive: true });

    // Validate name uniqueness if changed
    if (validated.name && validated.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const cleanName = validated.name.trim();
      const dup = allTopics.find(
        (t) => t.id !== id && t.name.trim().toLowerCase() === cleanName.toLowerCase()
      );
      if (dup) {
        throw new ValidationError(`A Topic with the name "${cleanName}" already exists (ID: ${dup.id}).`);
      }
    }

    // Validate slug uniqueness if changed
    if (validated.slug && validated.slug.trim().toLowerCase() !== existing.slug.toLowerCase()) {
      const cleanSlug = validated.slug.trim();
      const dup = allTopics.find(
        (t) => t.id !== id && t.slug.trim().toLowerCase() === cleanSlug.toLowerCase()
      );
      if (dup) {
        throw new ValidationError(`A Topic with the slug "${cleanSlug}" already exists (ID: ${dup.id}).`);
      }
    }

    const now = new Date().toISOString();
    const updated: Topic = {
      ...existing,
      name: validated.name !== undefined ? validated.name.trim() : existing.name,
      slug: validated.slug !== undefined ? validated.slug.trim() : (validated.name ? this.slugify(validated.name) : existing.slug),
      description: validated.description !== undefined ? validated.description.trim() : existing.description,
      displayOrder: validated.displayOrder !== undefined ? validated.displayOrder : existing.displayOrder,
      isActive: validated.isActive !== undefined ? validated.isActive : existing.isActive,
      updatedAt: now,
    };

    const saved = await topicsRepository.updateRecord(id, updated);
    this.invalidateCache();

    if (actor) {
      await auditService.log(
        actor.id,
        actor.name,
        'TAXONOMY_TOPIC_UPDATED',
        'TOPIC',
        id,
        { updatedFields: Object.keys(validated) }
      );
    }

    return saved;
  }

  public async toggleTopicActive(
    id: string,
    isActive: boolean,
    actor?: { id: string; name: string }
  ): Promise<Topic> {
    return this.updateTopic(id, { id, isActive }, actor);
  }

  // ----------------------------------------------------
  // Subtopic Methods (Belongs to exactly one Topic)
  // ----------------------------------------------------

  public async getSubtopics(
    topicId?: string,
    options: { includeInactive?: boolean } = {}
  ): Promise<Subtopic[]> {
    let subtopics: Subtopic[];
    if (this.isCacheValid() && this.subtopicsCache) {
      subtopics = this.subtopicsCache;
    } else {
      subtopics = await subtopicsRepository.findAll();
      this.subtopicsCache = subtopics;
    }

    let filtered = subtopics;

    if (topicId) {
      filtered = filtered.filter((s) => s.topicId === topicId);
    }

    if (!options.includeInactive) {
      filtered = filtered.filter((s) => s.isActive !== false);
    }

    // Sort by displayOrder ascending, then name
    return [...filtered].sort((a, b) => {
      const orderA = a.displayOrder ?? 999;
      const orderB = b.displayOrder ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  public async getSubtopicById(id: string): Promise<Subtopic | null> {
    const all = await this.getSubtopics(undefined, { includeInactive: true });
    return all.find((s) => s.id === id) || null;
  }

  /**
   * Resolves a subtopic selection for content generation.
   * If subtopicIdOrMode is 'RANDOM' (case-insensitive) or empty, uniformly selects ONE active subtopic
   * from the provided topicId.
   * Returns the resolved subtopic, actual subtopicId, subtopicName, and generationMode ('SUBTOPIC' | 'RANDOM').
   */
  public async resolveSubtopicSelection(
    topicId: string,
    subtopicIdOrMode?: string
  ): Promise<{
    topicId: string;
    topicName: string;
    subtopicId: string;
    subtopicName: string;
    generationMode: 'SUBTOPIC' | 'RANDOM';
    selectedSubtopic: Subtopic;
  }> {
    const parentTopic = await this.getTopicById(topicId);
    if (!parentTopic) {
      throw new ReferenceIntegrityError(
        `Referenced Topic with ID "${topicId}" does not exist.`
      );
    }
    if (parentTopic.isActive === false) {
      throw new ValidationError(
        `Referenced Topic "${parentTopic.name}" (${parentTopic.id}) is inactive and cannot be used.`
      );
    }

    const isRandomMode =
      !subtopicIdOrMode ||
      subtopicIdOrMode.trim().toUpperCase() === 'RANDOM' ||
      subtopicIdOrMode.trim().toUpperCase() === 'SUB-GEN';

    if (isRandomMode) {
      const activeSubtopics = await this.getSubtopics(topicId, { includeInactive: false });
      if (activeSubtopics.length === 0) {
        throw new ValidationError(`No active subtopics found under Topic "${parentTopic.name}" (${topicId}).`);
      }
      const randomIndex = Math.floor(Math.random() * activeSubtopics.length);
      const chosenSubtopic = activeSubtopics[randomIndex];

      return {
        topicId: parentTopic.id,
        topicName: parentTopic.name,
        subtopicId: chosenSubtopic.id,
        subtopicName: chosenSubtopic.name,
        generationMode: 'RANDOM',
        selectedSubtopic: chosenSubtopic,
      };
    } else {
      const subtopic = await this.getSubtopicById(subtopicIdOrMode);
      if (!subtopic) {
        throw new ValidationError(`Referenced Subtopic with ID "${subtopicIdOrMode}" does not exist.`);
      }
      if (subtopic.isActive === false) {
        throw new ValidationError(
          `Referenced Subtopic "${subtopic.name}" (${subtopic.id}) is inactive and cannot be used.`
        );
      }
      if (subtopic.topicId !== topicId) {
        throw new ValidationError(
          `Subtopic "${subtopic.name}" (${subtopic.id}) does not belong to Topic "${parentTopic.name}" (${topicId}).`
        );
      }

      return {
        topicId: parentTopic.id,
        topicName: parentTopic.name,
        subtopicId: subtopic.id,
        subtopicName: subtopic.name,
        generationMode: 'SUBTOPIC',
        selectedSubtopic: subtopic,
      };
    }
  }

  public async createSubtopic(
    input: CreateSubtopicInput,
    actor?: { id: string; name: string }
  ): Promise<Subtopic> {
    const validated = CreateSubtopicInputSchema.parse(input);
    const cleanName = validated.name.trim();
    const slug = validated.slug?.trim() || this.slugify(cleanName);

    // Parent Topic Reference Check & Orphan Prevention
    const parentTopic = await this.getTopicById(validated.topicId);
    if (!parentTopic) {
      throw new ReferenceIntegrityError(
        `Referenced Topic with ID "${validated.topicId}" does not exist in the TOPICS collection.`
      );
    }

    // Duplicate Prevention - Check Subtopic name uniqueness within SAME Topic
    const existingSubtopics = await this.getSubtopics(validated.topicId, { includeInactive: true });
    const duplicateName = existingSubtopics.find(
      (s) => (s.name || '').trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicateName) {
      throw new ValidationError(
        `A Subtopic with the name "${cleanName}" already exists under Topic "${parentTopic.name}" (${parentTopic.id}) (ID: ${duplicateName.id}).`
      );
    }

    // Duplicate Prevention - Check Subtopic slug uniqueness within SAME Topic
    const duplicateSlug = existingSubtopics.find(
      (s) => (s.slug || '').trim().toLowerCase() === slug.toLowerCase()
    );
    if (duplicateSlug) {
      throw new ValidationError(
        `A Subtopic with the slug "${slug}" already exists under Topic "${parentTopic.name}" (${parentTopic.id}) (ID: ${duplicateSlug.id}).`
      );
    }

    const id = canonicalIdService.generateSubtopicId();
    const now = new Date().toISOString();

    const subtopic: Subtopic = {
      id,
      topicId: parentTopic.id,
      name: cleanName,
      slug,
      description: validated.description?.trim() || '',
      notes: validated.notes?.trim() || '',
      displayOrder: validated.displayOrder ?? 1,
      isActive: validated.isActive !== false,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await subtopicsRepository.appendRecord(subtopic);
    this.invalidateCache();

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

  public async updateSubtopic(
    id: string,
    input: UpdateSubtopicInput,
    actor?: { id: string; name: string }
  ): Promise<Subtopic> {
    const validated = UpdateSubtopicInputSchema.parse({ ...input, id });
    const existing = await this.getSubtopicById(id);
    if (!existing) {
      throw new ReferenceIntegrityError(`Subtopic with ID "${id}" does not exist.`);
    }

    const targetTopicId = validated.topicId || existing.topicId;
    const parentTopic = await this.getTopicById(targetTopicId);
    if (!parentTopic) {
      throw new ReferenceIntegrityError(`Referenced Topic with ID "${targetTopicId}" does not exist.`);
    }

    const topicSubtopics = await this.getSubtopics(targetTopicId, { includeInactive: true });

    // Validate name uniqueness within topic if name/topic changed
    if (validated.name && validated.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const cleanName = validated.name.trim();
      const dup = topicSubtopics.find(
        (s) => s.id !== id && s.name.trim().toLowerCase() === cleanName.toLowerCase()
      );
      if (dup) {
        throw new ValidationError(
          `A Subtopic with the name "${cleanName}" already exists under Topic "${parentTopic.name}".`
        );
      }
    }

    // Validate slug uniqueness within topic if slug/topic changed
    if (validated.slug && validated.slug.trim().toLowerCase() !== existing.slug.toLowerCase()) {
      const cleanSlug = validated.slug.trim();
      const dup = topicSubtopics.find(
        (s) => s.id !== id && s.slug.trim().toLowerCase() === cleanSlug.toLowerCase()
      );
      if (dup) {
        throw new ValidationError(
          `A Subtopic with the slug "${cleanSlug}" already exists under Topic "${parentTopic.name}".`
        );
      }
    }

    const now = new Date().toISOString();
    const updated: Subtopic = {
      ...existing,
      topicId: targetTopicId,
      name: validated.name !== undefined ? validated.name.trim() : existing.name,
      slug: validated.slug !== undefined ? validated.slug.trim() : (validated.name ? this.slugify(validated.name) : existing.slug),
      description: validated.description !== undefined ? validated.description.trim() : existing.description,
      notes: validated.notes !== undefined ? validated.notes.trim() : existing.notes,
      displayOrder: validated.displayOrder !== undefined ? validated.displayOrder : existing.displayOrder,
      isActive: validated.isActive !== undefined ? validated.isActive : existing.isActive,
      updatedAt: now,
    };

    const saved = await subtopicsRepository.updateRecord(id, updated);
    this.invalidateCache();

    if (actor) {
      await auditService.log(
        actor.id,
        actor.name,
        'TAXONOMY_SUBTOPIC_UPDATED',
        'SUBTOPIC',
        id,
        { updatedFields: Object.keys(validated) }
      );
    }

    return saved;
  }

  public async toggleSubtopicActive(
    id: string,
    isActive: boolean,
    actor?: { id: string; name: string }
  ): Promise<Subtopic> {
    return this.updateSubtopic(id, { id, isActive }, actor);
  }

  // ----------------------------------------------------
  // Search & Tree Methods (2-Tier: Topic -> Subtopic)
  // ----------------------------------------------------

  public async searchTopics(query: string): Promise<Topic[]> {
    const all = await this.getTopics({ includeInactive: true });
    if (!query || !query.trim()) return all;
    const q = query.toLowerCase().trim();
    return all.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        Boolean(t.slug && t.slug.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }

  public async searchSubtopics(query: string, topicId?: string): Promise<Subtopic[]> {
    const all = await this.getSubtopics(topicId, { includeInactive: true });
    if (!query || !query.trim()) return all;
    const q = query.toLowerCase().trim();
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        Boolean(s.slug && s.slug.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }

  /**
   * Pure Topic -> Subtopic 2-tier tree.
   */
  public async getPureTopicTree(options: { includeInactive?: boolean } = {}): Promise<PureTaxonomyTopic[]> {
    const [topics, subtopics] = await Promise.all([
      this.getTopics(options),
      this.getSubtopics(undefined, options),
    ]);

    return topics.map((topic) => ({
      ...topic,
      subtopics: subtopics.filter((s) => s.topicId === topic.id),
    }));
  }

  /**
   * Canonical taxonomy tree (2-tier Topic -> Subtopic).
   */
  public async getTaxonomyTree(options: { includeInactive?: boolean } = {}): Promise<TaxonomyTreeItem[]> {
    return this.getPureTopicTree(options);
  }

  /**
   * Authoritative taxonomy metrics and data gap diagnostics.
   */
  public async getTaxonomyMetrics(): Promise<TaxonomyMetrics> {
    const [allTopics, allSubtopics] = await Promise.all([
      this.getTopics({ includeInactive: true }),
      this.getSubtopics(undefined, { includeInactive: true }),
    ]);

    const activeTopics = allTopics.filter((t) => t.isActive !== false);
    const activeSubtopics = allSubtopics.filter((s) => s.isActive !== false);

    const subtopicsByTopic: Record<string, number> = {};
    for (const t of allTopics) {
      subtopicsByTopic[t.id] = 0;
    }
    for (const s of allSubtopics) {
      if (subtopicsByTopic[s.topicId] !== undefined) {
        subtopicsByTopic[s.topicId]++;
      }
    }

    const completeTopicIds: string[] = [];
    const incompleteTopicIds: string[] = [];

    for (const t of allTopics) {
      if (subtopicsByTopic[t.id] === 100) {
        completeTopicIds.push(t.id);
      } else {
        incompleteTopicIds.push(t.id);
      }
    }

    const totalTopics = allTopics.length;
    const totalSubtopics = allSubtopics.length;
    const targetTopics = 100;
    const targetSubtopicsPerTopic = 100;
    const targetTotalSubtopics = 10000;
    const missingSubtopics = Math.max(0, targetTotalSubtopics - totalSubtopics);
    const hasDataGap = totalTopics < targetTopics || totalSubtopics < targetTotalSubtopics;

    const dataGapMessage = hasDataGap
      ? `Authoritative data gap: ${totalTopics}/${targetTopics} Topics present. ${totalSubtopics}/${targetTotalSubtopics} Subtopics present (${missingSubtopics} Subtopics missing across ${incompleteTopicIds.length} Topics).`
      : 'Authoritative taxonomy is 100% complete.';

    return {
      totalTopics,
      totalSubtopics,
      activeTopics: activeTopics.length,
      activeSubtopics: activeSubtopics.length,
      targetTopics,
      targetSubtopicsPerTopic,
      targetTotalSubtopics,
      missingSubtopics,
      completeTopicsCount: completeTopicIds.length,
      incompleteTopicsCount: incompleteTopicIds.length,
      completeTopicIds,
      incompleteTopicIds,
      subtopicsByTopic,
      hasDataGap,
      dataGapMessage,
    };
  }

  // ----------------------------------------------------
  // Taxonomy Validation Engine (Question Integration)
  // ----------------------------------------------------

  /**
   * Validates Question Taxonomy Alignment:
   * Verifies that the referenced Subtopic exists and belongs directly to the specified Topic.
   */
  public async validateQuestionTaxonomy(
    topicId: string,
    subtopicId: string
  ): Promise<{ topic: Topic; subtopic: Subtopic }> {
    if (!topicId) {
      throw new ValidationError('Topic ID is required.');
    }
    if (!subtopicId) {
      throw new ValidationError('Subtopic ID is required.');
    }

    const [topic, subtopic] = await Promise.all([
      this.getTopicById(topicId),
      this.getSubtopicById(subtopicId),
    ]);

    if (!topic) {
      throw new ReferenceIntegrityError(`Referenced Topic with ID "${topicId}" does not exist in the TOPICS collection.`);
    }
    if (topic.isActive === false) {
      throw new ValidationError(`Referenced Topic "${topic.name}" (${topic.id}) is inactive and cannot be used.`);
    }

    if (!subtopic) {
      throw new ReferenceIntegrityError(`Referenced Subtopic with ID "${subtopicId}" does not exist in the SUBTOPICS collection.`);
    }
    if (subtopic.isActive === false) {
      throw new ValidationError(`Referenced Subtopic "${subtopic.name}" (${subtopic.id}) is inactive and cannot be used.`);
    }

    // STRICT INTEGRITY CHECK: Subtopic MUST belong directly to the specified Topic
    if (subtopic.topicId !== topicId) {
      throw new ReferenceIntegrityError(
        `Taxonomy integrity violation: Subtopic "${subtopic.name}" (${subtopic.id}) belongs to Topic "${subtopic.topicId}", not "${topic.name}" (${topicId}).`
      );
    }

    return { topic, subtopic };
  }

  /**
   * Alias for 2-tier validation (Topic -> Subtopic)
   */
  public async validateTaxonomy(
    topicId: string,
    subtopicId: string
  ): Promise<{ topic: Topic; subtopic: Subtopic }> {
    return this.validateQuestionTaxonomy(topicId, subtopicId);
  }

  // ----------------------------------------------------
  // Bulk Import Foundation (Dry-Run & Idempotent Execution)
  // ----------------------------------------------------

  public async bulkImportDryRun(input: BulkImportTaxonomyInput): Promise<BulkImportDryRunReport> {
    const validated = BulkImportTaxonomyInputSchema.parse(input);
    const existingTopics = await this.getTopics({ includeInactive: true });
    const existingSubtopics = await this.getSubtopics(undefined, { includeInactive: true });

    const errors: Array<{ index: number; type: string; message: string }> = [];
    const topicsToCreate: Array<{ name: string; slug: string; description?: string; displayOrder?: number }> = [];
    const subtopicsToCreate: Array<{ topicName: string; name: string; slug: string; description?: string; notes?: string; displayOrder?: number }> = [];

    const seenTopicNamesInBatch = new Set<string>();
    const seenSubtopicKeysInBatch = new Set<string>(); // `${topicName}:${subtopicName}`

    let newTopicsCount = 0;
    let existingTopicsCount = 0;
    let newSubtopicsCount = 0;
    let duplicateCount = 0;

    for (let i = 0; i < validated.topics.length; i++) {
      const tInput = validated.topics[i];
      const tCleanName = tInput.name.trim();
      const tSlug = tInput.slug?.trim() || this.slugify(tCleanName);

      if (seenTopicNamesInBatch.has(tCleanName.toLowerCase())) {
        duplicateCount++;
        errors.push({
          index: i,
          type: 'DUPLICATE_IN_BATCH',
          message: `Topic "${tCleanName}" is duplicated within the import batch.`,
        });
        continue;
      }
      seenTopicNamesInBatch.add(tCleanName.toLowerCase());

      const existingTopic = existingTopics.find(
        (t) => t.name.trim().toLowerCase() === tCleanName.toLowerCase()
      );

      if (existingTopic) {
        existingTopicsCount++;
      } else {
        newTopicsCount++;
        topicsToCreate.push({
          name: tCleanName,
          slug: tSlug,
          description: tInput.description,
          displayOrder: tInput.displayOrder,
        });
      }

      // Evaluate nested subtopics
      for (const sInput of tInput.subtopics || []) {
        const sCleanName = sInput.name.trim();
        const sSlug = sInput.slug?.trim() || this.slugify(sCleanName);
        const batchKey = `${tCleanName.toLowerCase()}:${sCleanName.toLowerCase()}`;

        if (seenSubtopicKeysInBatch.has(batchKey)) {
          duplicateCount++;
          errors.push({
            index: i,
            type: 'DUPLICATE_SUBTOPIC_IN_BATCH',
            message: `Subtopic "${sCleanName}" is duplicated under Topic "${tCleanName}" within the import batch.`,
          });
          continue;
        }
        seenSubtopicKeysInBatch.add(batchKey);

        let subtopicExists = false;
        if (existingTopic) {
          subtopicExists = existingSubtopics.some(
            (s) => s.topicId === existingTopic.id && s.name.trim().toLowerCase() === sCleanName.toLowerCase()
          );
        }

        if (!subtopicExists) {
          newSubtopicsCount++;
          subtopicsToCreate.push({
            topicName: tCleanName,
            name: sCleanName,
            slug: sSlug,
            description: sInput.description,
            notes: sInput.notes,
            displayOrder: sInput.displayOrder,
          });
        } else {
          duplicateCount++;
        }
      }
    }

    const totalSubtopicsInInput = validated.topics.reduce(
      (acc, t) => acc + (t.subtopics ? t.subtopics.length : 0),
      0
    );

    return {
      valid: errors.length === 0,
      summary: {
        totalTopicsInInput: validated.topics.length,
        totalSubtopicsInInput,
        newTopicsToCreate: newTopicsCount,
        existingTopicsToReuse: existingTopicsCount,
        newSubtopicsToCreate: newSubtopicsCount,
        errorCount: errors.length,
        duplicateCount,
      },
      plan: {
        topicsToCreate,
        subtopicsToCreate,
      },
      errors,
    };
  }

  public async executeBulkImport(
    input: BulkImportTaxonomyInput,
    actor?: { id: string; name: string }
  ): Promise<{ success: boolean; createdTopics: number; createdSubtopics: number; report: BulkImportDryRunReport }> {
    const report = await this.bulkImportDryRun(input);
    if (!report.valid) {
      throw new ValidationError(
        `Bulk import rejected due to ${report.errors.length} batch error(s): ${report.errors.map((e) => e.message).join('; ')}`
      );
    }

    const topicNameToIdMap = new Map<string, string>();
    const existingTopics = await this.getTopics({ includeInactive: true });
    existingTopics.forEach((t) => topicNameToIdMap.set(t.name.trim().toLowerCase(), t.id));

    let createdTopicsCount = 0;
    let createdSubtopicsCount = 0;

    // 1. Create missing Topics idempotently
    for (const tPlan of report.plan.topicsToCreate) {
      const topic = await this.createTopic(
        {
          name: tPlan.name,
          slug: tPlan.slug,
          description: tPlan.description,
          displayOrder: tPlan.displayOrder,
        },
        actor
      );
      topicNameToIdMap.set(topic.name.trim().toLowerCase(), topic.id);
      createdTopicsCount++;
    }

    // 2. Create missing Subtopics idempotently under their topic IDs
    for (const sPlan of report.plan.subtopicsToCreate) {
      const parentTopicId = topicNameToIdMap.get(sPlan.topicName.trim().toLowerCase());
      if (!parentTopicId) {
        throw new ReferenceIntegrityError(
          `Bulk import execution error: Parent Topic "${sPlan.topicName}" could not be resolved.`
        );
      }

      await this.createSubtopic(
        {
          topicId: parentTopicId,
          name: sPlan.name,
          slug: sPlan.slug,
          description: sPlan.description,
          notes: sPlan.notes,
          displayOrder: sPlan.displayOrder,
        },
        actor
      );
      createdSubtopicsCount++;
    }

    this.invalidateCache();

    return {
      success: true,
      createdTopics: createdTopicsCount,
      createdSubtopics: createdSubtopicsCount,
      report,
    };
  }
}

export const taxonomyService = TaxonomyService.getInstance();
