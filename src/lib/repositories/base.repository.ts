/**
 * BURRA PARIKSHA CMS — Authoritative Domain Base Repository
 *
 * ARCHITECTURAL MANDATE:
 * 1. Cloud Firestore is the SINGLE AUTHORITATIVE transactional persistence store for BP-CMS.
 * 2. All production domain repositories inherit from this BaseRepository, which
 *    delegates transactional operations (findById, findAll, findWhere, appendRecord,
 *    updateRecord, deleteRecord) directly to FirestoreRepository<T> backed by
 *    server-side Firebase Admin SDK Firestore credentials.
 */

import { BaseEntity, IRepository } from '../db/repository.interface';
import { CanonicalPrefix } from '../id.service';
import { FirestoreCollectionDefinition } from '../schemas/domain-schemas';

export { type FirestoreCollectionDefinition };

export abstract class BaseRepository<T extends Record<string, any>> {
  protected collectionName: string;
  protected defaultPrefix?: CanonicalPrefix;
  private _firestoreRepo: IRepository<T & BaseEntity> | null = null;

  constructor(
    definition: FirestoreCollectionDefinition | string,
    defaultPrefix?: CanonicalPrefix
  ) {
    if (typeof definition === 'string') {
      this.collectionName = definition;
      this.defaultPrefix = defaultPrefix;
    } else {
      this.collectionName = definition.collectionName;
      this.defaultPrefix = definition.defaultPrefix ?? defaultPrefix;
    }
  }

  protected async getRepo(): Promise<IRepository<T & BaseEntity>> {
    if (!this._firestoreRepo) {
      const { FirestoreRepository } = await import('../db/firestore.repository');
      this._firestoreRepo = new FirestoreRepository<T & BaseEntity>(this.collectionName, this.defaultPrefix);
    }
    return this._firestoreRepo;
  }

  public getCollectionName(): string {
    return this.collectionName;
  }

  /**
   * Returns collection name for compatibility.
   */
  public getSheetName(): string {
    return this.collectionName;
  }

  public getSchema(): { collectionName: string; primaryKey: string } {
    return { collectionName: this.collectionName, primaryKey: 'id' };
  }

  public async getFirestoreRepository(): Promise<IRepository<T & BaseEntity>> {
    return this.getRepo();
  }

  public async findById(id: string): Promise<T | null> {
    const r = await this.getRepo();
    const doc = await r.findById(id);
    return (doc as T) || null;
  }

  public async findAll(): Promise<T[]> {
    const r = await this.getRepo();
    const list = await r.findMany();
    return list as unknown as T[];
  }

  public async findWhere(predicate: (record: T) => boolean): Promise<T[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }

  public async appendRecord(record: Partial<T>): Promise<T> {
    const r = await this.getRepo();
    const created = await r.create(record as any);
    return created as unknown as T;
  }

  public async create(record: Partial<T>): Promise<T> {
    return this.appendRecord(record);
  }

  public async updateRecord(
    id: string,
    updates: Partial<T>,
    options?: { expectedVersion?: number }
  ): Promise<T | null> {
    const r = await this.getRepo();
    const existing = await r.findById(id);
    if (!existing) {
      return null;
    }

    const expectedVer =
      options?.expectedVersion ??
      (updates as any)?.version ??
      existing.version;

    const updated = await r.update(id, expectedVer, updates as any);
    return updated as unknown as T;
  }

  public async update(
    recordOrId: T | string,
    updates?: Partial<T>,
    options?: { expectedVersion?: number }
  ): Promise<T | null> {
    if (typeof recordOrId === 'string') {
      return this.updateRecord(recordOrId, updates || {}, options);
    }
    const id = (recordOrId as any).id;
    if (!id) return null;
    return this.updateRecord(id, updates || recordOrId, options);
  }

  public async deleteRecord(id: string): Promise<boolean> {
    const r = await this.getRepo();
    const existing = await r.findById(id);
    if (!existing) {
      return false;
    }
    return r.delete(id, existing.version);
  }

  public async delete(id: string): Promise<boolean> {
    return this.deleteRecord(id);
  }
}
