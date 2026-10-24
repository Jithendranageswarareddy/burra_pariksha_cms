/**
 * BURRA PARIKSHA CMS — Verified Learning Unit Repository
 * Location: database/firestore/repositories/learning-units.repository.ts
 *
 * Source of Truth: docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md
 * (Section 6: The Central Asset: A Verified Learning Unit; Section 7: Proposed Content-Planning Model)
 * Architectural Decision: ADR-015 (docs/architecture/DECISION-LOG.md)
 *
 * Authoritative Firestore persistence for the central educational asset:
 * - Distinguishes underlying verified curriculum knowledge from individual publications.
 * - Enforces schema validation using LearningUnitSchema & CreateLearningUnitSchema.
 * - Guarantees primary key uniqueness and canonical collision-resistant lnu_<uuid> IDs.
 * - Enforces Optimistic Concurrency Control (OCC) with atomic version checks.
 * - Protects immutable identifiers and enforces RBAC authorization checks.
 * - Implements multi-field querying across taxonomy, skill level, audience, and editorial pillars.
 */

import { BaseRepository } from './base.repository';
import {
  AudienceContext,
  EditorialPillar,
  LearningUnit,
  CreateLearningUnitInput,
  UpdateLearningUnitInput,
  SkillLevel,
  PresentationFormat,
  canonicalIdService,
} from '../../../shared';
import {
  CreateLearningUnitSchema,
  UpdateLearningUnitSchema,
} from '../../../shared/contracts/learning-unit.contract';
import {
  ValidationError,
  NotFoundError,
  ConcurrencyConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../../src/lib/errors';
import { MutationContext } from '../../../src/lib/db/repository.interface';

export interface LearningUnitFilterInput {
  search?: string;
  topicId?: string;
  subtopicId?: string;
  skillLevel?: SkillLevel;
  audienceContext?: AudienceContext;
  editorialPillar?: EditorialPillar;
  authorId?: string;
  primaryFormat?: PresentationFormat;
}

export interface LearningUnitActor {
  id: string;
  role: string;
  name?: string;
}

const AUTHORIZED_CREATOR_ROLES = new Set([
  'ADMIN',
  'CONTENT_LEAD',
  'CONTENT_MANAGER',
  'QUESTION_AUTHOR',
  'QUESTION_CREATOR',
  'QUESTION_EDITOR',
  'CREATOR',
  'CONTENT_WRITER',
  'TOPIC_LEAD',
  'QA_REVIEWER',
  'REVIEWER',
]);

const ELEVATED_ADMIN_ROLES = new Set([
  'ADMIN',
  'CONTENT_LEAD',
  'CONTENT_MANAGER',
  'TOPIC_LEAD',
  'QA_REVIEWER',
]);

export class LearningUnitsRepository extends BaseRepository<LearningUnit> {
  private static instance: LearningUnitsRepository | null = null;

  public constructor() {
    super('learning_units', 'lnu_');
  }

  public static getInstance(): LearningUnitsRepository {
    if (!LearningUnitsRepository.instance) {
      LearningUnitsRepository.instance = new LearningUnitsRepository();
    }
    return LearningUnitsRepository.instance;
  }

  /**
   * Validates actor permissions for creation mutations.
   */
  private assertCanCreate(actor?: LearningUnitActor): void {
    if (!actor) return;
    const normalizedRole = actor.role.toUpperCase();
    if (!AUTHORIZED_CREATOR_ROLES.has(normalizedRole)) {
      throw new ForbiddenError(
        `Role '${actor.role}' is not authorized to create learning units.`
      );
    }
  }

  /**
   * Validates actor permissions for update/mutation operations.
   */
  private assertCanUpdate(existing: LearningUnit, actor?: LearningUnitActor): void {
    if (!actor) return;
    const normalizedRole = actor.role.toUpperCase();

    // Elevated management roles can update any learning unit
    if (ELEVATED_ADMIN_ROLES.has(normalizedRole)) {
      return;
    }

    // Authors can update their own learning units
    if (AUTHORIZED_CREATOR_ROLES.has(normalizedRole)) {
      if (existing.authorId === actor.id) {
        return;
      }
      throw new ForbiddenError(
        `Creator '${actor.id}' is not authorized to modify learning unit owned by '${existing.authorId}'.`
      );
    }

    throw new ForbiddenError(
      `Role '${actor.role}' has insufficient permissions to modify learning units.`
    );
  }

  /**
   * Creates a new verified LearningUnit in Cloud Firestore.
   * Enforces schema validation, primary key uniqueness, and canonical lnu_ ID format.
   */
  public override async create(
    input: CreateLearningUnitInput | Partial<LearningUnit>,
    options?: { actor?: LearningUnitActor; context?: MutationContext }
  ): Promise<LearningUnit> {
    this.assertCanCreate(options?.actor);

    // 1. Resolve author attribution from actor if not provided in input
    const effectiveInput = {
      ...input,
      ...(options?.actor?.id && !input.authorId ? { authorId: options.actor.id } : {}),
      ...(options?.actor?.name && !input.authorName ? { authorName: options.actor.name } : {}),
    };

    // 2. Schema validation against CreateLearningUnitSchema
    const parseResult = CreateLearningUnitSchema.safeParse(effectiveInput);
    if (!parseResult.success) {
      throw new ValidationError(
        `LearningUnit creation validation failed: ${parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
        { details: parseResult.error.issues }
      );
    }

    const validatedInput = parseResult.data;

    // 2. Canonical ID resolution & uniqueness validation
    let id: string;
    const rawId = (input as { id?: string }).id;
    if (rawId) {
      if (!canonicalIdService.validateCanonicalId(rawId, 'lnu_')) {
        throw new ValidationError(
          `Invalid canonical LearningUnit identifier "${rawId}". Must match canonical format: lnu_<uuidv4>.`
        );
      }
      id = rawId;

      // Check primary key uniqueness
      const existing = await this.findById(id);
      if (existing) {
        throw new ValidationError(
          `Primary key uniqueness guard rejected: LearningUnit with ID "${id}" already exists.`
        );
      }
    } else {
      id = canonicalIdService.generateLearningUnitId();
    }

    // 3. Resolve author attribution
    const authorId = options?.actor?.id || validatedInput.authorId;
    const authorName = options?.actor?.name || validatedInput.authorName;

    const payload: Partial<LearningUnit> = {
      ...(validatedInput as unknown as Partial<LearningUnit>),
      id,
      authorId,
      ...(authorName ? { authorName } : {}),
      version: 1,
    };

    const r = await this.getRepo();
    const created = await r.create(payload as any, options?.context);
    return created as unknown as LearningUnit;
  }

  /**
   * Updates an existing LearningUnit document with Optimistic Concurrency Control (OCC).
   * Enforces identifier immutability, schema validation, and version incrementing.
   */
  public override async update(
    recordOrId: LearningUnit | string,
    updates?: Partial<LearningUnit> | UpdateLearningUnitInput,
    options?: { expectedVersion?: number; actor?: LearningUnitActor; context?: MutationContext }
  ): Promise<LearningUnit> {
    const id = typeof recordOrId === 'string' ? recordOrId : recordOrId.id;
    if (!id) {
      throw new ValidationError('LearningUnit ID is required for update.');
    }

    const patch = typeof recordOrId === 'string' ? (updates || {}) : (updates || recordOrId);

    // 1. Protect immutable identifier
    if ((patch as any).id && (patch as any).id !== id) {
      throw new ValidationError(
        `LearningUnit identifier is immutable. Cannot modify ID from "${id}" to "${(patch as any).id}".`
      );
    }

    // 2. Ensure record exists
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`LearningUnit with ID "${id}" does not exist.`);
    }

    // 3. Authorization check
    this.assertCanUpdate(existing, options?.actor);

    // 4. Schema validation on updates
    const parseResult = UpdateLearningUnitSchema.safeParse(patch);
    if (!parseResult.success) {
      throw new ValidationError(
        `LearningUnit update validation failed: ${parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
        { details: parseResult.error.issues }
      );
    }

    const validatedPatch = parseResult.data;

    // 5. Optimistic Concurrency Control (OCC)
    const expectedVer =
      options?.expectedVersion !== undefined
        ? options.expectedVersion
        : existing.version;

    const cleanUpdates = { ...validatedPatch };
    delete (cleanUpdates as any).version;
    delete (cleanUpdates as any).id;

    const r = await this.getRepo();
    try {
      const updated = await r.update(id, expectedVer, cleanUpdates as any, options?.context);
      return updated as unknown as LearningUnit;
    } catch (err: any) {
      if (err instanceof ConcurrencyConflictError || err?.code === 'CONCURRENCY_CONFLICT' || err?.statusCode === 409) {
        throw new ConcurrencyConflictError('learning_units', id, expectedVer, existing.version);
      }
      throw err;
    }
  }

  /**
   * Queries LearningUnits applying multi-dimensional filters and search.
   */
  public async query(filter?: LearningUnitFilterInput): Promise<LearningUnit[]> {
    const all = await this.findAll();
    if (!filter) return all;

    return all.filter((u) => {
      // 1. Multi-field text search
      if (filter.search && filter.search.trim()) {
        const query = filter.search.toLowerCase().trim();
        const matchesTitle = u.title?.toLowerCase().includes(query);
        const matchesObjective = u.learningObjective?.toLowerCase().includes(query);
        const matchesMethod = u.verifiedMethod?.toLowerCase().includes(query);
        const matchesScenario = u.realLifeScenario?.toLowerCase().includes(query);
        const matchesTopic = u.topicName?.toLowerCase().includes(query);
        const matchesSubtopic = u.subtopicName?.toLowerCase().includes(query);
        const matchesCalculations = u.correctCalculations?.toLowerCase().includes(query);

        if (
          !matchesTitle &&
          !matchesObjective &&
          !matchesMethod &&
          !matchesScenario &&
          !matchesTopic &&
          !matchesSubtopic &&
          !matchesCalculations
        ) {
          return false;
        }
      }

      // 2. Taxonomy filters
      if (filter.topicId && u.topicId !== filter.topicId) {
        return false;
      }
      if (filter.subtopicId && u.subtopicId !== filter.subtopicId) {
        return false;
      }

      // 3. Core requirement dimension filters
      if (filter.skillLevel && u.skillLevel !== filter.skillLevel) {
        return false;
      }
      if (filter.audienceContext && u.audienceContext !== filter.audienceContext) {
        return false;
      }
      if (filter.editorialPillar && u.editorialPillar !== filter.editorialPillar) {
        return false;
      }
      if (filter.authorId && u.authorId !== filter.authorId) {
        return false;
      }
      if (filter.primaryFormat && u.primaryFormat !== filter.primaryFormat) {
        return false;
      }

      return true;
    });
  }

  /**
   * Lists LearningUnits with optional filtering (convenience alias for query).
   */
  public async list(filter?: LearningUnitFilterInput): Promise<LearningUnit[]> {
    return this.query(filter);
  }

  /**
   * Test fixture helper to purge synthetic test records from the collection.
   */
  public async clear(): Promise<void> {
    const all = await this.findAll();
    await Promise.all(all.map((u) => this.delete(u.id)));
  }
}

export const learningUnitsRepository = LearningUnitsRepository.getInstance();
