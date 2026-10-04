/**
 * BURRA PARIKSHA CMS — Repository Pattern & Persistence Abstraction
 * Stage 27 Feature Contract: FC-003 (Database Abstraction & Universal API Envelopes)
 *
 * Implements authoritative generic repository contract:
 * - BaseEntity: { id, version, createdAt, updatedAt, isDeleted }
 * - Optimistic Concurrency Control (OCC) contracts
 * - Soft-delete filtering
 * - Audit metadata propagation
 */

export interface BaseEntity {
  id: string; // Typed prefix + UUID
  version: number; // Integer, begins at 1
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  isDeleted: boolean; // Soft delete flag
}

export interface QueryOptions<T extends BaseEntity> {
  where?: Partial<Record<keyof T, any>>;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: {
    field: keyof T;
    direction: 'asc' | 'desc';
  };
}

export interface MutationContext {
  requestId?: string;
  actorId?: string;
  timestamp?: string;
}

export interface RepositoryAuditEvent<T extends BaseEntity> {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE';
  collection: string;
  entityId: string;
  version: number;
  previousVersion?: number;
  context?: MutationContext;
  entity?: T;
}

export type AuditHook<T extends BaseEntity> = (event: RepositoryAuditEvent<T>) => void | Promise<void>;

export interface IRepository<T extends BaseEntity> {
  readonly collectionName: string;

  /**
   * Retrieves a document by its canonical ID.
   * By default, soft-deleted documents (isDeleted === true) return null.
   */
  findById(id: string, options?: { includeDeleted?: boolean }): Promise<T | null>;

  /**
   * Creates a new document with version = 1, createdAt = now(), updatedAt = now(), isDeleted = false.
   * If entity.id is not provided, a canonical ID is auto-generated.
   */
  create(
    entity: Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'isDeleted'> & Partial<Pick<T, 'id'>>,
    context?: MutationContext
  ): Promise<T>;

  /**
   * Updates an existing document with OCC version verification.
   * Throws ConcurrencyConflictError if expectedVersion !== current.version.
   * Increments version by 1 and updates updatedAt.
   */
  update(
    id: string,
    expectedVersion: number,
    patch: Partial<Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
    context?: MutationContext
  ): Promise<T>;

  /**
   * Deletes a document with OCC version verification.
   * By default, performs soft-delete (sets isDeleted = true, version + 1).
   * If physical === true, removes document completely.
   */
  delete(
    id: string,
    expectedVersion: number,
    context?: MutationContext,
    physical?: boolean
  ): Promise<boolean>;

  /**
   * Queries documents with optional filtering, ordering, pagination, and soft-delete exclusion.
   */
  findMany(options?: QueryOptions<T>): Promise<T[]>;

  /**
   * Counts documents matching the given filter.
   */
  count(options?: QueryOptions<T>): Promise<number>;

  /**
   * Registers an audit hook for write mutations.
   */
  onMutation(hook: AuditHook<T>): void;
}
