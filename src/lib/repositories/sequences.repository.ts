/**
 * BURRA PARIKSHA CMS - Sequences Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Source of truth for permanent, auto-incrementing domain entity IDs.
 * Prevents ID generation based on volatile row indices or array counts.
 * Includes self-healing capability to prevent sequence drift and ID collisions.
 */

import { BaseRepository } from './base.repository';
import { ID_PREFIX_MAP, SEQUENCE_ENTITIES, SHEET_SCHEMAS, SHEET_TABS, SequenceEntityType } from '../schemas/google-sheets-schema';

import { questionsRepository } from './questions.repository';
import { videosRepository } from './videos.repository';
import { scriptsRepository } from './scripts.repository';
import { thumbnailsRepository } from './thumbnails.repository';
import { pinnedCommentsRepository } from './pinned-comments.repository';
import { categoriesRepository } from './categories.repository';
import { topicsRepository } from './topics.repository';
import { subtopicsRepository } from './subtopics.repository';
import { usersRepository } from './users.repository';
import { contentPlansRepository } from './content-plans.repository';
import { contentBatchesRepository } from './content-batches.repository';
import { assignmentsRepository } from './assignments.repository';
import { contentMastersRepository } from './content-masters.repository';
import { socialReviewsRepository } from './social-reviews.repository';
import { analyticsRepository } from './analytics.repository';
import { intelligenceRepository } from './intelligence.repository';
import { socialCommentsRepository } from './social-comments.repository';
import { commentIntelligenceRepository } from './comment-intelligence.repository';
import { SequenceAllocationError } from '../google-sheets/errors';

export interface SequenceRecord {
  entityType: string;
  nextNumber: number;
  prefix?: string;
  padLength?: number;
  updatedAt?: string;
}

export class SequencesRepository extends BaseRepository<SequenceRecord> {
  private static instance: SequencesRepository | null = null;
  // In-process lock / queue promise to serialize sequence increments within this Node process
  private allocationQueue: Promise<any> = Promise.resolve();

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.SEQUENCES]);
  }

  public static getInstance(): SequencesRepository {
    if (!SequencesRepository.instance) {
      SequencesRepository.instance = new SequencesRepository();
    }
    return SequencesRepository.instance;
  }

  /**
   * Retrieves current sequence state for given entity.
   */
  public async getSequence(entityType: string): Promise<SequenceRecord | null> {
    const direct = await this.findById(entityType);
    if (direct) return direct;
    const all = await this.findAll();
    return all.find((s) => s.entityType === entityType || s.id === entityType) || null;
  }

  /**
   * Helper mapping from entityType to repository.
   */
  private getRepositoryForEntity(entityType: string): BaseRepository<any> | null {
    switch (entityType) {
      case SEQUENCE_ENTITIES.QUESTION:
        return questionsRepository;
      case SEQUENCE_ENTITIES.VIDEO:
        return videosRepository;
      case SEQUENCE_ENTITIES.SCRIPT:
        return scriptsRepository;
      case SEQUENCE_ENTITIES.THUMBNAIL:
        return thumbnailsRepository;
      case SEQUENCE_ENTITIES.PINNED_COMMENT:
        return pinnedCommentsRepository;
      case SEQUENCE_ENTITIES.CATEGORY:
        return categoriesRepository;
      case SEQUENCE_ENTITIES.TOPIC:
        return topicsRepository;
      case SEQUENCE_ENTITIES.SUBTOPIC:
        return subtopicsRepository;
      case SEQUENCE_ENTITIES.USER:
        return usersRepository;
      case SEQUENCE_ENTITIES.CONTENT_PLAN:
        return contentPlansRepository;
      case SEQUENCE_ENTITIES.CONTENT_BATCH:
        return contentBatchesRepository;
      case SEQUENCE_ENTITIES.ASSIGNMENT:
        return assignmentsRepository;
      case SEQUENCE_ENTITIES.CONTENT_MASTER:
        return contentMastersRepository;
      case SEQUENCE_ENTITIES.SOCIAL_REVIEW:
        return socialReviewsRepository;
      case SEQUENCE_ENTITIES.SOCIAL_ANALYTICS:
        return analyticsRepository;
      case SEQUENCE_ENTITIES.SOCIAL_PERFORMANCE_INTELLIGENCE:
        return intelligenceRepository;
      case SEQUENCE_ENTITIES.SOCIAL_COMMENT:
        return socialCommentsRepository;
      case SEQUENCE_ENTITIES.COMMENT_INTELLIGENCE:
        return commentIntelligenceRepository;
      default:
        return null;
    }
  }

  /**
   * Scans target entity's repository to determine maximum numeric ID currently present.
   * Enforces strict canonical format validation: ^<configured prefix><exactly padLength digits>$.
   * Noncanonical IDs (such as test fixtures, wrong prefixes, or malformed digit lengths) are strictly ignored.
   */
  public async getMaxExistingId(entityType: string): Promise<number> {
    try {
      const repo = this.getRepositoryForEntity(entityType);
      if (!repo) return 0;

      const config = ID_PREFIX_MAP[entityType as SequenceEntityType];
      let prefix = config ? config.prefix : '';
      let padLength = config ? config.padLength : 6;

      try {
        const sequence = await this.getSequence(entityType);
        if (sequence) {
          if (sequence.prefix) prefix = sequence.prefix;
          if (sequence.padLength && !isNaN(Number(sequence.padLength))) {
            padLength = Number(sequence.padLength);
          }
        }
      } catch {
        // Fall back to config if getSequence fails
      }

      if (!prefix || !padLength || padLength <= 0) return 0;

      const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const canonicalRegex = new RegExp(`^${escapedPrefix}(\\d{${padLength}})$`);

      const records = await repo.findAll();
      if (!records || records.length === 0) return 0;

      let maxId = 0;
      for (const record of records) {
        if (!record) continue;
        const primaryKey = repo.getSchema().primaryKey || 'id';
        const rawId = record.id || (record as any)[primaryKey] || record.contentId || record.contentMasterId;
        if (!rawId || typeof rawId !== 'string') continue;

        const match = rawId.match(canonicalRegex);
        if (!match) continue;

        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
      return maxId;
    } catch (err: any) {
      if (err instanceof SequenceAllocationError) {
        throw err;
      }
      throw new SequenceAllocationError(
        entityType,
        `Failed to scan existing records to determine sequence maximum: ${err?.message || String(err)}`
      );
    }
  }

  /**
   * Allocates the next available number for an entity and increments the sequence.
   * Includes self-healing to advance past any existing IDs in target repository.
   */
  public async allocateNextNumber(entityType: string): Promise<{ allocatedNumber: number; prefix: string; padLength: number }> {
    return new Promise<{ allocatedNumber: number; prefix: string; padLength: number }>((resolve, reject) => {
      this.allocationQueue = this.allocationQueue
        .catch(() => {})
        .then(async () => {
          try {
            const res = await this.performAllocation(entityType);
            resolve(res);
          } catch (err) {
            reject(err);
          }
        });
    });
  }

  private async performAllocation(entityType: string): Promise<{ allocatedNumber: number; prefix: string; padLength: number }> {
    if (entityType === 'CONTENT_ID') {
      throw new Error(
        "RETIRED_SEQUENCE_ENTITY: 'CONTENT_ID' sequence is obsolete and retired. Use CONTENT_MASTER for canonical BP-CNT-###### ID allocation."
      );
    }
    let sequence = await this.getSequence(entityType);
    const config = ID_PREFIX_MAP[entityType as SequenceEntityType] || { prefix: 'BP-', padLength: 6 };

    // Self-healing check: find highest allocated ID currently in repository
    const maxExistingId = await this.getMaxExistingId(entityType);

    if (!sequence) {
      // Record not yet present in SEQUENCES tab, initialize starting past maxExistingId
      const allocatedNumber = maxExistingId + 1;
      const initialRecord: SequenceRecord = {
        id: entityType,
        entityType,
        nextNumber: allocatedNumber + 1,
        prefix: config.prefix,
        padLength: config.padLength,
        updatedAt: new Date().toISOString(),
      };
      await this.appendRecord(initialRecord);
      return {
        allocatedNumber,
        prefix: config.prefix,
        padLength: config.padLength,
      };
    }

    let currentNumber = Number(sequence.nextNumber) || 1;

    // If sequence.nextNumber <= maxExistingId, automatically advance nextNumber to maxExistingId + 1
    if (currentNumber <= maxExistingId) {
      currentNumber = maxExistingId + 1;
    }

    const nextNumber = currentNumber + 1;

    const updated = await this.updateRecord(entityType, {
      nextNumber,
      prefix: sequence.prefix || config.prefix,
      padLength: Number(sequence.padLength) || config.padLength,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw new SequenceAllocationError(
        entityType,
        `Failed to persist sequence allocation to SEQUENCES worksheet for "${entityType}".`
      );
    }

    return {
      allocatedNumber: currentNumber,
      prefix: sequence.prefix || config.prefix,
      padLength: Number(sequence.padLength) || config.padLength,
    };
  }

  public async updateCurrentValue(entityType: string, currentVal: number): Promise<void> {
    await this.updateRecord(entityType, {
      nextNumber: currentVal + 1,
      updatedAt: new Date().toISOString(),
    });
  }
}

export const sequencesRepository = SequencesRepository.getInstance();
