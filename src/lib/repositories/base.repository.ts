
const TAB_NAME_TO_FIRESTORE_COLLECTION: Record<string, string> = {
  QUESTIONS: 'questions',
  CONTENT_MASTERS: 'content_masters',
  QUESTION_DRAFTS: 'question_drafts',
  SCRIPTS: 'scripts',
  SCRIPT: 'scripts',
  SCRIPT_VERSIONS: 'script_versions',
  VIDEOS: 'videos',
  THUMBNAILS: 'thumbnails',
  PINNED_COMMENTS: 'pinned_comments',
  PUBLISHING_PACKAGES: 'publishing_packages',
  SOCIAL_POSTS: 'social_posts',
  SOCIAL_COMMENTS: 'social_comments',
  SOCIAL_REVIEWS: 'social_reviews',
  SOCIAL_ANALYTICS: 'social_analytics',
  WORKFLOW_INSTANCES: 'workflow_instances',
  WORKFLOW_HISTORY: 'workflow_history',
  ASSIGNMENTS: 'assignments',
  TAXONOMY_CATEGORIES: 'categories',
  CATEGORIES: 'categories',
  TAXONOMY_TOPICS: 'topics',
  TOPICS: 'topics',
  TAXONOMY_SUBTOPICS: 'subtopics',
  SUBTOPICS: 'subtopics',
  USERS: 'users',
  QUESTION_CONFIG: 'question_config',
  SEQUENCES: 'sequences',
  AUDIT_LOGS: 'audit_logs',
  VALIDATIONS: 'validations',
};

/**
 * BURRA PARIKSHA CMS — Unified Authoritative Base Repository
 * Sprint 4: Production Data Layer Migration (Google Sheets to Cloud Firestore)
 *
 * ARCHITECTURAL MANDATE:
 * 1. Cloud Firestore (ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e)
 *    is the SINGLE AUTHORITATIVE transactional persistence store for BP-CMS.
 * 2. All production domain repositories inherit from this BaseRepository, which
 *    delegates transactional operations (findById, findAll, findWhere, appendRecord,
 *    updateRecord, deleteRecord) directly to FirestoreRepository<T> backed by
 *    server-side authenticated Firestore credentials.
 */

import { SheetSchemaContract, SheetTabName } from '../schemas/google-sheets-schema';
import { BaseEntity, IRepository } from '../db/repository.interface';
import { CanonicalPrefix } from '../id.service';

export abstract class BaseRepository<T extends Record<string, any>> {
  protected schema: SheetSchemaContract;
  protected defaultPrefix?: CanonicalPrefix;
  protected collectionName: string;
  private _firestoreRepo: IRepository<T & BaseEntity> | null = null;

  constructor(schema: SheetSchemaContract, defaultPrefix?: CanonicalPrefix) {
    this.schema = schema;
    this.defaultPrefix = defaultPrefix;
    const mapped = TAB_NAME_TO_FIRESTORE_COLLECTION[schema.sheetName.toUpperCase()];
    this.collectionName = mapped || schema.sheetName.toLowerCase();
  }

  protected async getRepo(): Promise<IRepository<T & BaseEntity>> {
    if (!this._firestoreRepo) {
      const { FirestoreRepository } = await import('../db/firestore.repository');
      this._firestoreRepo = new FirestoreRepository<T & BaseEntity>(this.collectionName, this.defaultPrefix);
    }
    return this._firestoreRepo;
  }

  public getSheetName(): SheetTabName {
    return this.schema.sheetName;
  }

  public getSchema(): SheetSchemaContract {
    return this.schema;
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
