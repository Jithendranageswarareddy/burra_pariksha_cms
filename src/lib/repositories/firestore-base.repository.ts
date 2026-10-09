/**
 * BURRA PARIKSHA CMS — Unified Firestore-Backed Base Repository
 * Sprint 4: Production Data Layer Migration
 *
 * Implements authoritative persistence against Cloud Firestore via FirestoreRepository<T>
 * providing backward-compatible method signatures (findById, findAll, findWhere, appendRecord, updateRecord, deleteRecord)
 * while delegating directly to IRepository<T> with atomic OCC versioning.
 */

import { BaseEntity, IRepository } from '../db/repository.interface';
import { FirestoreRepository } from '../db/firestore.repository';
import { SheetSchemaContract, SheetTabName } from '../schemas/google-sheets-schema';
import { CanonicalPrefix } from '../id.service';
import { connectRepositoryToAudit } from '../audit';

export abstract class FirestoreBaseRepository<T extends BaseEntity> {
  protected schema: SheetSchemaContract;
  protected repository: IRepository<T>;

  constructor(schema: SheetSchemaContract, defaultPrefix?: CanonicalPrefix) {
    this.schema = schema;
    const collectionName = schema.sheetName.toLowerCase();
    this.repository = new FirestoreRepository<T>(collectionName, defaultPrefix);
    connectRepositoryToAudit(this.repository);
  }

  public getSheetName(): SheetTabName {
    return this.schema.sheetName;
  }

  public getSchema(): SheetSchemaContract {
    return this.schema;
  }

  public async findById(id: string): Promise<T | null> {
    return this.repository.findById(id);
  }

  public async findAll(): Promise<T[]> {
    return this.repository.findMany();
  }

  public async findWhere(predicate: (record: T) => boolean): Promise<T[]> {
    const all = await this.repository.findMany();
    return all.filter(predicate);
  }

  public async appendRecord(record: Partial<T>): Promise<T> {
    return this.repository.create(record as any);
  }

  public async updateRecord(
    id: string,
    updates: Partial<T>,
    options?: { expectedVersion?: number }
  ): Promise<T | null> {
    const existing = await this.repository.findById(id);
    if (!existing) return null;

    const expectedVer = options?.expectedVersion ?? (updates as any)?.version ?? existing.version;
    return this.repository.update(id, expectedVer, updates as any);
  }

  public async update(
    recordOrId: T | string,
    updates?: Partial<T>,
    options?: { expectedVersion?: number }
  ): Promise<T | null> {
    if (typeof recordOrId === 'string') {
      return this.updateRecord(recordOrId, updates || {}, options);
    }
    const id = recordOrId.id;
    if (!id) return null;
    return this.updateRecord(id, updates || recordOrId, options);
  }

  public async deleteRecord(id: string): Promise<boolean> {
    const existing = await this.repository.findById(id);
    if (!existing) return false;
    return this.repository.delete(id, existing.version);
  }

  public async delete(id: string): Promise<boolean> {
    return this.deleteRecord(id);
  }
}
