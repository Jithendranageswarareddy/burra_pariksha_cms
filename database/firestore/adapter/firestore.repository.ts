/**
 * BURRA PARIKSHA CMS — Cloud Firestore Production Server-Side Repository Adapter
 * Sprint 4 / Phase 3: Firebase Admin SDK Authoritative Architecture
 *
 * Implements authoritative generic repository contract IRepository<T> against Cloud Firestore:
 * - Uses privileged server-side Firebase Admin SDK (direct server-side Firestore)
 * - Atomic Optimistic Concurrency Control (OCC) via native Admin runTransaction
 * - Soft-deletion filtering (isDeleted = true excluded by default)
 * - FAIL CLOSED: NEVER silently falls back to in-memory on database or permission errors.
 * - Diagnostic firestore error serialization with handleFirestoreError
 */

import { Firestore, Query } from 'firebase-admin/firestore';
import { getAdminFirestore } from './admin';
import { handleFirestoreError, OperationType } from './errors';
import {
  BaseEntity,
  IRepository,
  MutationContext,
  QueryOptions,
  AuditHook,
  RepositoryAuditEvent,
} from '../../../src/lib/db/repository.interface';
import { ConcurrencyConflictError, NotFoundError } from '../../../src/lib/errors';
import { canonicalIdService, CanonicalPrefix } from '../../../src/lib/id.service';
import { InMemoryRepository } from '../../../src/lib/db/in-memory.repository';

export type RepositoryPersistenceMode = 'FIRESTORE' | 'IN_MEMORY_TEST_ONLY';

export class FirestoreRepository<T extends BaseEntity> implements IRepository<T> {
  public readonly collectionName: string;
  private readonly defaultPrefix?: CanonicalPrefix;
  private readonly auditHooks: AuditHook<T>[] = [];
  public readonly mode: RepositoryPersistenceMode;
  private fallbackStore: InMemoryRepository<T> | null = null;

  constructor(collectionName: string, defaultPrefix?: CanonicalPrefix) {
    this.collectionName = collectionName;
    this.defaultPrefix = defaultPrefix;

    if (process.env.PERSISTENCE_MODE === 'IN_MEMORY_TEST_ONLY') {
      this.mode = 'IN_MEMORY_TEST_ONLY';
      this.fallbackStore = new InMemoryRepository<T>(collectionName, defaultPrefix);
    } else {
      this.mode = 'FIRESTORE';
    }
  }

  private async getDb(): Promise<Firestore> {
    return getAdminFirestore();
  }

  public onMutation(hook: AuditHook<T>): void {
    this.auditHooks.push(hook);
    if (this.fallbackStore) {
      this.fallbackStore.onMutation(hook);
    }
  }

  private async notifyAudit(event: RepositoryAuditEvent<T>): Promise<void> {
    for (const hook of this.auditHooks) {
      try {
        await hook(event);
      } catch (err) {
        console.warn(`[FirestoreRepository:${this.collectionName}] Audit hook error:`, err);
      }
    }
  }

  public async findById(id: string, options?: { includeDeleted?: boolean }): Promise<T | null> {
    if (this.fallbackStore) {
      return this.fallbackStore.findById(id, options);
    }

    try {
      const db = await this.getDb();
      const docRef = db.collection(this.collectionName).doc(id);
      const snap = await docRef.get();

      if (!snap.exists) {
        return null;
      }

      const raw = snap.data();
      const entity = { ...raw, id: (raw as any)?.id || snap.id } as T;
      if (entity.isDeleted && !options?.includeDeleted) {
        return null;
      }

      return entity;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, `${this.collectionName}/${id}`);
    }
  }

  public async create(
    entity: Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'isDeleted'> & Partial<Pick<T, 'id'>>,
    context?: MutationContext
  ): Promise<T> {
    if (this.fallbackStore) {
      return this.fallbackStore.create(entity, context);
    }

    const now = context?.timestamp || new Date().toISOString();
    const id =
      entity.id ||
      (this.defaultPrefix
        ? canonicalIdService.generateCanonicalId(this.defaultPrefix)
        : canonicalIdService.generateCanonicalId('ent_'));

    const cleanEntity: any = {};
    for (const [k, v] of Object.entries(entity as any)) {
      if (v !== undefined) cleanEntity[k] = v;
    }
    const newEntity = {
      ...cleanEntity,
      id,
      version: 1,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    } as T;

    try {
      const db = await this.getDb();
      const docRef = db.collection(this.collectionName).doc(id);
      await docRef.set(newEntity);

      await this.notifyAudit({
        action: 'CREATE',
        collection: this.collectionName,
        entityId: id,
        version: 1,
        context,
        entity: newEntity,
      });

      return newEntity;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `${this.collectionName}/${id}`);
    }
  }

  public async update(
    id: string,
    expectedVersion: number,
    patch: Partial<Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
    context?: MutationContext
  ): Promise<T> {
    if (this.fallbackStore) {
      return this.fallbackStore.update(id, expectedVersion, patch, context);
    }

    const now = context?.timestamp || new Date().toISOString();
    let updatedEntity: T;
    let previousVersion: number;

    try {
      const db = await this.getDb();
      const docRef = db.collection(this.collectionName).doc(id);

      updatedEntity = await db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists) {
          throw new NotFoundError(`Resource '${this.collectionName}' with id '${id}' not found.`);
        }

        const raw = snap.data();
        const current = { ...raw, id: (raw as any)?.id || snap.id } as T;
        if (current.isDeleted) {
          throw new NotFoundError(`Resource '${this.collectionName}' with id '${id}' not found (deleted).`);
        }

        if (current.version !== expectedVersion) {
          throw new ConcurrencyConflictError(this.collectionName, id, expectedVersion, current.version);
        }

        previousVersion = current.version;
        const nextVersion = current.version + 1;

        const cleanPatch: any = {};
        for (const [k, v] of Object.entries(patch as any)) {
          if (v !== undefined) cleanPatch[k] = v;
        }

        const merged: T = {
          ...current,
          ...cleanPatch,
          id: current.id,
          createdAt: current.createdAt,
          version: nextVersion,
          updatedAt: now,
        };

        tx.set(docRef, merged);
        return merged;
      });

      await this.notifyAudit({
        action: 'UPDATE',
        collection: this.collectionName,
        entityId: id,
        version: updatedEntity.version,
        previousVersion: previousVersion!,
        context,
        entity: updatedEntity,
      });

      return updatedEntity;
    } catch (err: any) {
      if (err instanceof NotFoundError || err instanceof ConcurrencyConflictError) {
        throw err;
      }
      handleFirestoreError(err, OperationType.UPDATE, `${this.collectionName}/${id}`);
    }
  }

  public async delete(
    id: string,
    expectedVersion: number,
    context?: MutationContext,
    physical = false
  ): Promise<boolean> {
    if (this.fallbackStore) {
      return this.fallbackStore.delete(id, expectedVersion, context, physical);
    }

    const now = context?.timestamp || new Date().toISOString();
    let previousVersion: number;
    let softDeletedEntity: T | undefined;

    try {
      const db = await this.getDb();
      const docRef = db.collection(this.collectionName).doc(id);

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists) {
          throw new NotFoundError(`Resource '${this.collectionName}' with id '${id}' not found.`);
        }

        const raw = snap.data();
        const current = { ...raw, id: (raw as any)?.id || snap.id } as T;
        if (current.isDeleted && !physical) {
          throw new NotFoundError(`Resource '${this.collectionName}' with id '${id}' not found (already deleted).`);
        }

        if (current.version !== expectedVersion) {
          throw new ConcurrencyConflictError(this.collectionName, id, expectedVersion, current.version);
        }

        previousVersion = current.version;

        if (physical) {
          tx.delete(docRef);
        } else {
          const nextVersion = current.version + 1;
          softDeletedEntity = {
            ...current,
            isDeleted: true,
            version: nextVersion,
            updatedAt: now,
          };
          tx.set(docRef, softDeletedEntity);
        }
      });

      await this.notifyAudit({
        action: physical ? 'DELETE' : 'SOFT_DELETE',
        collection: this.collectionName,
        entityId: id,
        version: physical ? previousVersion! : (softDeletedEntity?.version || previousVersion! + 1),
        previousVersion,
        context,
        entity: softDeletedEntity,
      });

      return true;
    } catch (err: any) {
      if (err instanceof NotFoundError || err instanceof ConcurrencyConflictError) {
        throw err;
      }
      handleFirestoreError(err, OperationType.DELETE, `${this.collectionName}/${id}`);
    }
  }

  public async findMany(options?: QueryOptions<T>): Promise<T[]> {
    if (this.fallbackStore) {
      return this.fallbackStore.findMany(options);
    }

    try {
      const db = await this.getDb();
      let q: Query = db.collection(this.collectionName);

      // Apply equality filters directly at the Firestore query level so that
      // limit() operates on matching documents rather than truncating the collection before filtering.
      if (options?.where) {
        for (const [k, v] of Object.entries(options.where)) {
          if (v !== undefined) {
            q = q.where(k, '==', v);
          }
        }
      }

      // Apply ordering in Firestore so result order is stable before pagination.
      if (options?.orderBy) {
        q = q.orderBy(String(options.orderBy.field), options.orderBy.direction);
      }

      // offset and limit are applied by Firestore rather than after reading all rows.
      // Keep the existing post-query soft-delete filter for documents with legacy shapes.
      if (options?.offset && options.offset > 0) {
        q = q.offset(Math.floor(options.offset));
      }
      if (options?.limit !== undefined && options.limit > 0) {
        q = q.limit(Math.floor(options.limit));
      }

      const snap = await q.get();
      let list = snap.docs.map((d) => {
        const data = d.data();
        return { ...data, id: (data as any)?.id || d.id } as T;
      });

      if (!options?.includeDeleted) {
        list = list.filter((e) => !e.isDeleted);
      }

      if (options?.where) {
        const whereEntries = Object.entries(options.where);
        list = list.filter((e: any) =>
          whereEntries.every(([k, v]) => v === undefined || e[k] === v)
        );
      }

      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, this.collectionName);
    }
  }

  public async count(options?: QueryOptions<T>): Promise<number> {
    const records = await this.findMany(options);
    return records.length;
  }
}

export * from '../utilities/firestore-converters';

