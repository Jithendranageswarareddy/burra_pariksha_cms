/**
 * BURRA PARIKSHA CMS — Firestore Native Repository Adapter
 * Stage 27 Feature Contract: FC-003 (Database Abstraction & Universal API Envelopes)
 *
 * Implements IRepository<T> against Google Cloud Firestore v1 REST API:
 * - Uses googleapis native client (zero new package dependencies)
 * - ₹0.00–₹100.00 Spark Free-Tier optimization
 * - Optimistic Concurrency Control (OCC) enforcement
 * - Soft-deletion filtering (isDeleted = true excluded by default)
 * - Resilient offline/test double fallback when credentials are not configured
 */

import { google, firestore_v1 } from 'googleapis';
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
import { InMemoryRepository } from './in-memory.repository';

// Bidirectional Firestore Value Converter
function toFirestoreValue(val: any): firestore_v1.Schema$Value {
  if (val === null || val === undefined) {
    return { nullValue: 'NULL_VALUE' };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue),
      },
    };
  }
  if (typeof val === 'object') {
    const fields: Record<string, firestore_v1.Schema$Value> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreValue(val: firestore_v1.Schema$Value): any {
  if (!val) return null;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return parseInt(val.integerValue as string, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('stringValue' in val) return val.stringValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val && val.arrayValue?.values) {
    return val.arrayValue.values.map(fromFirestoreValue);
  }
  if ('mapValue' in val && val.mapValue?.fields) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields)) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

export function entityToFirestoreDocument(entity: Record<string, any>): firestore_v1.Schema$Document {
  const fields: Record<string, firestore_v1.Schema$Value> = {};
  for (const [key, value] of Object.entries(entity)) {
    if (value !== undefined) {
      fields[key] = toFirestoreValue(value);
    }
  }
  return { fields };
}

export function firestoreDocumentToEntity<T>(doc: firestore_v1.Schema$Document): T {
  const entity: Record<string, any> = {};
  if (doc.fields) {
    for (const [key, value] of Object.entries(doc.fields)) {
      entity[key] = fromFirestoreValue(value);
    }
  }
  return entity as T;
}

export class FirestoreRepository<T extends BaseEntity> implements IRepository<T> {
  public readonly collectionName: string;
  private readonly defaultPrefix?: CanonicalPrefix;
  private readonly projectId: string;
  private readonly databaseId: string;
  private readonly auditHooks: AuditHook<T>[] = [];
  private firestoreClient: firestore_v1.Firestore | null = null;
  private fallbackStore: InMemoryRepository<T> | null = null;
  private isClientInitialized = false;

  constructor(collectionName: string, defaultPrefix?: CanonicalPrefix) {
    this.collectionName = collectionName;
    this.defaultPrefix = defaultPrefix;
    this.projectId =
      process.env.GCP_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      'burra-pariksha-cms';
    this.databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
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

  private async getClient(): Promise<firestore_v1.Firestore | null> {
    if (this.isClientInitialized) {
      return this.firestoreClient;
    }

    // Fast-path in test or unconfigured environment: avoid network lookup delays
    if (process.env.NODE_ENV === 'test' || !process.env.GCP_PROJECT_ID) {
      this.firestoreClient = null;
      this.fallbackStore = new InMemoryRepository<T>(this.collectionName, this.defaultPrefix);
      for (const hook of this.auditHooks) {
        this.fallbackStore.onMutation(hook);
      }
      this.isClientInitialized = true;
      return null;
    }

    try {
      // Determine if valid Google credentials or service account are accessible
      const auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/datastore'],
      });
      await auth.getClient();
      this.firestoreClient = google.firestore({ version: 'v1', auth });
      this.isClientInitialized = true;
      return this.firestoreClient;
    } catch {
      // Offline fallback to internal In-Memory repository
      this.firestoreClient = null;
      this.fallbackStore = new InMemoryRepository<T>(this.collectionName, this.defaultPrefix);
      for (const hook of this.auditHooks) {
        this.fallbackStore.onMutation(hook);
      }
      this.isClientInitialized = true;
      return null;
    }
  }

  private getDocumentPath(id: string): string {
    return `projects/${this.projectId}/databases/${this.databaseId}/documents/${this.collectionName}/${id}`;
  }

  public async findById(id: string, options?: { includeDeleted?: boolean }): Promise<T | null> {
    const client = await this.getClient();
    if (!client || this.fallbackStore) {
      return this.fallbackStore!.findById(id, options);
    }

    try {
      const res = await client.projects.databases.documents.get({
        name: this.getDocumentPath(id),
      });

      if (!res.data || !res.data.fields) {
        return null;
      }

      const entity = firestoreDocumentToEntity<T>(res.data);
      if (entity.isDeleted && !options?.includeDeleted) {
        return null;
      }

      return entity;
    } catch (err: any) {
      if (err.status === 404 || err.code === 404) {
        return null;
      }
      throw err;
    }
  }

  public async create(
    entity: Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt' | 'isDeleted'> & Partial<Pick<T, 'id'>>,
    context?: MutationContext
  ): Promise<T> {
    const client = await this.getClient();
    if (!client || this.fallbackStore) {
      return this.fallbackStore!.create(entity, context);
    }

    const now = context?.timestamp || new Date().toISOString();
    const id =
      entity.id ||
      (this.defaultPrefix
        ? canonicalIdService.generateCanonicalId(this.defaultPrefix)
        : `ent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

    const newEntity = {
      ...(entity as any),
      id,
      version: 1,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    } as T;

    const firestoreDoc = entityToFirestoreDocument(newEntity);

    await client.projects.databases.documents.createDocument({
      parent: `projects/${this.projectId}/databases/${this.databaseId}/documents`,
      collectionId: this.collectionName,
      documentId: id,
      requestBody: firestoreDoc,
    });

    await this.notifyAudit({
      action: 'CREATE',
      collection: this.collectionName,
      entityId: id,
      version: 1,
      context,
      entity: newEntity,
    });

    return newEntity;
  }

  public async update(
    id: string,
    expectedVersion: number,
    patch: Partial<Omit<T, 'id' | 'version' | 'createdAt' | 'updatedAt'>>,
    context?: MutationContext
  ): Promise<T> {
    const client = await this.getClient();
    if (!client || this.fallbackStore) {
      return this.fallbackStore!.update(id, expectedVersion, patch, context);
    }

    // 1. Fetch current document to verify OCC precondition
    const current = await this.findById(id);
    if (!current || current.isDeleted) {
      throw new NotFoundError(`Resource '${this.collectionName}' with id '${id}' not found.`);
    }

    if (current.version !== expectedVersion) {
      throw new ConcurrencyConflictError(this.collectionName, id, expectedVersion, current.version);
    }

    const previousVersion = current.version;
    const nextVersion = current.version + 1;
    const now = context?.timestamp || new Date().toISOString();

    const updatedEntity = {
      ...current,
      ...(patch as any),
      id: current.id,
      createdAt: current.createdAt,
      version: nextVersion,
      updatedAt: now,
    } as T;

    const firestoreDoc = entityToFirestoreDocument(updatedEntity);

    await client.projects.databases.documents.patch({
      name: this.getDocumentPath(id),
      requestBody: firestoreDoc,
      'currentDocument.exists': true,
    });

    await this.notifyAudit({
      action: 'UPDATE',
      collection: this.collectionName,
      entityId: id,
      version: nextVersion,
      previousVersion,
      context,
      entity: updatedEntity,
    });

    return updatedEntity;
  }

  public async delete(
    id: string,
    expectedVersion: number,
    context?: MutationContext,
    physical = false
  ): Promise<boolean> {
    const client = await this.getClient();
    if (!client || this.fallbackStore) {
      return this.fallbackStore!.delete(id, expectedVersion, context, physical);
    }

    const current = await this.findById(id);
    if (!current || current.isDeleted) {
      throw new NotFoundError(`Resource '${this.collectionName}' with id '${id}' not found.`);
    }

    if (current.version !== expectedVersion) {
      throw new ConcurrencyConflictError(this.collectionName, id, expectedVersion, current.version);
    }

    const previousVersion = current.version;
    const now = context?.timestamp || new Date().toISOString();

    if (physical) {
      await client.projects.databases.documents.delete({
        name: this.getDocumentPath(id),
      });

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

    const firestoreDoc = entityToFirestoreDocument(softDeleted);

    await client.projects.databases.documents.patch({
      name: this.getDocumentPath(id),
      requestBody: firestoreDoc,
      'currentDocument.exists': true,
    });

    await this.notifyAudit({
      action: 'SOFT_DELETE',
      collection: this.collectionName,
      entityId: id,
      version: nextVersion,
      previousVersion,
      context,
      entity: softDeleted,
    });

    return true;
  }

  public async findMany(options?: QueryOptions<T>): Promise<T[]> {
    const client = await this.getClient();
    if (!client || this.fallbackStore) {
      return this.fallbackStore!.findMany(options);
    }

    try {
      const res = await client.projects.databases.documents.list({
        parent: `projects/${this.projectId}/databases/${this.databaseId}/documents`,
        collectionId: this.collectionName,
        pageSize: options?.limit || 100,
      });

      const docs = res.data.documents || [];
      let entities = docs.map((d) => firestoreDocumentToEntity<T>(d));

      if (!options?.includeDeleted) {
        entities = entities.filter((e) => !e.isDeleted);
      }

      if (options?.where) {
        const whereEntries = Object.entries(options.where);
        entities = entities.filter((e: any) =>
          whereEntries.every(([k, v]) => v === undefined || e[k] === v)
        );
      }

      if (options?.orderBy) {
        const { field, direction } = options.orderBy;
        const factor = direction === 'desc' ? -1 : 1;
        entities.sort((a: any, b: any) => {
          if (a[field] < b[field]) return -1 * factor;
          if (a[field] > b[field]) return 1 * factor;
          return 0;
        });
      }

      return entities;
    } catch {
      return [];
    }
  }

  public async count(options?: QueryOptions<T>): Promise<number> {
    const results = await this.findMany(options);
    return results.length;
  }
}
