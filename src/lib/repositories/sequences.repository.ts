/**
 * BURRA PARIKSHA CMS - Sequences Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Source of truth for permanent, auto-incrementing domain entity IDs.
 * Prevents ID generation based on volatile row indices or array counts.
 * 
 * CONCURRENCY & LIMITATION NOTE:
 * Google Sheets does not provide database-level ACID transactions or atomic
 * compare-and-swap primitives over its REST API. For this initial single-admin
 * application, this repository uses in-process Promise queue serialization to
 * safely sequence ID allocations within the single Node.js runtime process.
 * 
 * Guarantees:
 * - Within a single Node server instance: ID allocations are queued and executed
 *   sequentially, preventing in-process race conditions.
 * - Source of truth is the SEQUENCES worksheet row for each entity_type.
 * 
 * Limitations:
 * - Does NOT provide multi-instance / distributed transactional atomicity across
 *   multiple separate server processes or external direct edits to the Google Sheet.
 */

import { BaseRepository } from './base.repository';
import { ID_PREFIX_MAP, SEQUENCE_ENTITIES, SHEET_SCHEMAS, SHEET_TABS, SequenceEntityType } from '../schemas/google-sheets-schema';

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
    this.seedDefaultSequences();
  }

  public static getInstance(): SequencesRepository {
    if (!SequencesRepository.instance) {
      SequencesRepository.instance = new SequencesRepository();
    }
    return SequencesRepository.instance;
  }

  private seedDefaultSequences(): void {
    const defaults: SequenceRecord[] = Object.values(SEQUENCE_ENTITIES).map((entity) => {
      const config = ID_PREFIX_MAP[entity as SequenceEntityType] || { prefix: 'BP-', padLength: 6 };
      return {
        entityType: entity,
        nextNumber: 1,
        prefix: config.prefix,
        padLength: config.padLength,
        updatedAt: new Date().toISOString(),
      };
    });
    this.seedFallbackData(defaults);
  }

  /**
   * Retrieves current sequence state for given entity.
   */
  public async getSequence(entityType: string): Promise<SequenceRecord | null> {
    return this.findById(entityType);
  }

  /**
   * Allocates the next available number for an entity and increments the sequence.
   * Serialized in-process via Promise chaining to prevent concurrent interleaving within the Node process.
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
    let sequence = await this.getSequence(entityType);
    const config = ID_PREFIX_MAP[entityType as SequenceEntityType] || { prefix: 'BP-', padLength: 6 };

    if (!sequence) {
      // Record not yet present in SEQUENCES tab, initialize starting at 1
      const initialRecord: SequenceRecord = {
        entityType,
        nextNumber: 2, // 1 allocated, next is 2
        prefix: config.prefix,
        padLength: config.padLength,
        updatedAt: new Date().toISOString(),
      };
      await this.appendRecord(initialRecord);
      return {
        allocatedNumber: 1,
        prefix: config.prefix,
        padLength: config.padLength,
      };
    }

    const currentNumber = Number(sequence.nextNumber) || 1;
    const nextNumber = currentNumber + 1;

    await this.updateRecord(entityType, {
      nextNumber,
      updatedAt: new Date().toISOString(),
    });

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
