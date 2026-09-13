/**
 * BURRA PARIKSHA CMS - ID Generation Service
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Provides stable, permanent, prefixed domain entity IDs based on the SEQUENCES worksheet.
 * Never uses volatile row indices or array counts.
 */

import { sequencesRepository } from '../repositories/sequences.repository';
import { ID_PREFIX_MAP, SEQUENCE_ENTITIES, SequenceEntityType } from '../schemas/google-sheets-schema';
import { SequenceAllocationError } from '../google-sheets/errors';

export class IdService {
  private static instance: IdService | null = null;

  private constructor() {}

  public static getInstance(): IdService {
    if (!IdService.instance) {
      IdService.instance = new IdService();
    }
    return IdService.instance;
  }

  /**
   * Generates a padded, formatted permanent ID for the specified entity type.
   * Example: QUESTION -> BP-Q-000042
   */
  public async generateId(entityType: SequenceEntityType): Promise<string> {
    try {
      const config = ID_PREFIX_MAP[entityType];
      if (!config) {
        throw new Error(`Unknown sequence entity type: ${entityType}`);
      }

      const { allocatedNumber, prefix, padLength } = await sequencesRepository.allocateNextNumber(entityType);
      const paddedNumber = String(allocatedNumber).padStart(padLength, '0');

      return `${prefix}${paddedNumber}`;
    } catch (err: any) {
      throw new SequenceAllocationError(entityType, err?.message || 'Failed to allocate sequence number');
    }
  }

  public async allocateQuestionId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.QUESTION);
  }

  public async allocateVideoId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.VIDEO);
  }

  public async allocateScriptId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.SCRIPT);
  }

  public async allocateThumbnailId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.THUMBNAIL);
  }

  public async allocatePinnedCommentId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.PINNED_COMMENT);
  }

  public async allocateCategoryId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.CATEGORY);
  }

  public async allocateTopicId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.TOPIC);
  }

  public async allocateSubtopicId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.SUBTOPIC);
  }

  public async allocateContentPlanId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.CONTENT_PLAN);
  }

  public async allocateContentBatchId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.CONTENT_BATCH);
  }

  public async allocateAssignmentId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.ASSIGNMENT);
  }

  public async allocateContentMasterId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.CONTENT_MASTER);
  }

  public async allocateContentId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.CONTENT_ID);
  }

  public async allocateSocialAnalyticsId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.SOCIAL_ANALYTICS);
  }

  public async allocateIntelligenceId(): Promise<string> {
    return this.generateId(SEQUENCE_ENTITIES.SOCIAL_PERFORMANCE_INTELLIGENCE);
  }

  public async allocateUserId(): Promise<string> {
    const timestamp = Date.now();
    return `USR-${timestamp.toString().slice(-4)}`;
  }

  public async allocateId(entityType: string): Promise<string> {
    if (entityType === 'USERS' || entityType === 'USER') {
      return this.allocateUserId();
    }
    return this.generateId(entityType as SequenceEntityType);
  }
}

export const idService = IdService.getInstance();
