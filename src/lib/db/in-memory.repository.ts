/**
 * BURRA PARIKSHA CMS — In-Memory Repository Test Double
 * Stage 27 Feature Contract: FC-003 (Database Abstraction & Universal API Envelopes)
 *
 * Fully compliant in-memory implementation of IRepository<T>:
 * - Optimistic Concurrency Control (OCC) enforcement with HTTP 409 ConcurrencyConflictError
 * - Soft-deletion filtering (isDeleted = true excluded unless includeDeleted: true)
 * - Canonical ID auto-generation
 * - Audit hook propagation
 * - Atomic isolation through deep cloning
 */

import {
  BaseEntity,
  IRepository,
  MutationContext,
  QueryOptions,
  AuditHook,
  RepositoryAuditEvent,
} from './repository.interface';
import { ConcurrencyConflictError, NotFoundError } from '../errors';
import { canonicalIdService, CanonicalPrefix } from '../id.service';

export class InMemoryRepository<T extends BaseEntity> implements IRepository<T> {
  public readonly collectionName: string;
  private readonly defaultPrefix?: CanonicalPrefix;
  private readonly storage = new Map<string, T>();
  private readonly auditHooks: AuditHook<T>[] = [];

  constructor(collectionName: string, defaultPrefix?: CanonicalPrefix) {
    this.collectionName = collectionName;
    this.defaultPrefix = defaultPrefix;
  }

  public onMutation(hook: AuditHook<T>): void {
    this.auditHooks.push(hook);
  }

  private async notifyAudit(event: RepositoryAuditEvent<T>): Promise<void> {
    for (const hook of this.auditHooks) {
      try {
        await hook(event);
      } catch (err) {
        console.warn(`[InMemoryRepository:${this.collectionName}] Audit hook error:`, err);
      }
    }
  }

  private clone(item: T): T {
    return JSON.parse(JSON.stringify(item)) as T;
  }

  public async findById(id: string, options?: { includeDeleted?: boolean }): Promise<T | null> {
    const item = this.storage.get(id);
    if (!item) {
      return null;
    }
    if (item.isDeleted && !options?.includeDeleted) {
      return null;
    }
    return this.clone(item);
  }

  public async create(
    entity: Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'isDeleted'> & Partial<Pick<T, 'id'>>,
    context?: MutationContext
  ): Promise<T> {
    const now = context?.timestamp || new Date().toISOString();
    const id = entity.id || (this.defaultPrefix ? canonicalIdService.generateCanonicalId(this.defaultPrefix) : `ent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

    const newRecord = {
      ...(entity as any),
      id,
      version: 1,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    } as T;

    this.storage.set(id, this.clone(newRecord));

    await this.notifyAudit({
      action: 'CREATE',
      collection: this.collectionName,
      entityId: id,
      version: 1,
      context,
      entity: this.clone(newRecord),
    });

    return this.clone(newRecord);
  }

  public async update(
    id: string,
    expectedVersion: number,
    patch: Partial<Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
    context?: MutationContext
  ): Promise<T> {
    const current = this.storage.get(id);
    if (!current || current.isDeleted) {
      throw new NotFoundError(`Resource '${this.collectionName}' with id '${id}' not found.`);
    }

    if (current.version !== expectedVersion) {
      throw new ConcurrencyConflictError(this.collectionName, id, expectedVersion, current.version);
    }

    const previousVersion = current.version;
    const nextVersion = current.version + 1;
    const now = context?.timestamp || new Date().toISOString();

    const updated = {
      ...current,
      ...(patch as any),
      id: current.id,
      createdAt: current.createdAt,
      version: nextVersion,
      updatedAt: now,
    } as T;

    this.storage.set(id, this.clone(updated));

    await this.notifyAudit({
      action: 'UPDATE',
      collection: this.collectionName,
      entityId: id,
      version: nextVersion,
      previousVersion,
      context,
      entity: this.clone(updated),
    });

    return this.clone(updated);
  }

  public async delete(
    id: string,
    expectedVersion: number,
    context?: MutationContext,
    physical = false
  ): Promise<boolean> {
    const current = this.storage.get(id);
    if (!current || current.isDeleted) {
      throw new NotFoundError(`Resource '${this.collectionName}' with id '${id}' not found.`);
    }

    if (current.version !== expectedVersion) {
      throw new ConcurrencyConflictError(this.collectionName, id, expectedVersion, current.version);
    }

    const previousVersion = current.version;
    const now = context?.timestamp || new Date().toISOString();

    if (physical) {
      this.storage.delete(id);
      await this.notifyAudit({
        action: 'DELETE',
        collection: this.collectionName,
        entityId: id,
        version: previousVersion,
        previousVersion,
        context,
      });
      return true;
    }

    const nextVersion = current.version + 1;
    const softDeleted = {
      ...current,
      isDeleted: true,
      version: nextVersion,
      updatedAt: now,
    } as T;

    this.storage.set(id, this.clone(softDeleted));

    await this.notifyAudit({
      action: 'SOFT_DELETE',
      collection: this.collectionName,
      entityId: id,
      version: nextVersion,
      previousVersion,
      context,
      entity: this.clone(softDeleted),
    });

    return true;
  }

  public async findMany(options?: QueryOptions<T>): Promise<T[]> {
    let items = Array.from(this.storage.values());

    // 1. Soft-delete filter
    if (!options?.includeDeleted) {
      items = items.filter((item) => !item.isDeleted);
    }

    // 2. Where equality filters
    if (options?.where) {
      const whereEntries = Object.entries(options.where);
      items = items.filter((item: any) =>
        whereEntries.every(([key, val]) => val === undefined || item[key] === val)
      );
    }

    // 3. Ordering
    if (options?.orderBy) {
      const { field, direction } = options.orderBy;
      const factor = direction === 'desc' ? -1 : 1;
      items.sort((a: any, b: any) => {
        if (a[field] < b[field]) return -1 * factor;
        if (a[field] > b[field]) return 1 * factor;
        return 0;
      });
    }

    // 4. Pagination / Slicing
    if (options?.offset !== undefined || options?.limit !== undefined) {
      const start = options.offset || 0;
      const end = options.limit !== undefined ? start + options.limit : undefined;
      items = items.slice(start, end);
    }

    return items.map((i) => this.clone(i));
  }

  public async count(options?: QueryOptions<T>): Promise<number> {
    const filtered = await this.findMany({
      ...options,
      offset: undefined,
      limit: undefined,
    });
    return filtered.length;
  }

  /**
   * Helper for test teardown / reset
   */
  public clear(): void {
    this.storage.clear();
  }
}
