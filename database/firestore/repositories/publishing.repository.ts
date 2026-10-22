/**
 * BURRA PARIKSHA CMS - Publishing Repository
 * Authoritative Firestore persistence
 */

import { BaseRepository, GenericFirestoreRepository } from './base.repository';
import { Publishing, PublishingPlatformRecord, PlatformType } from '../../../shared';
import { canonicalIdService } from '../../../src/lib/id.service';

export class PublishingRepository extends BaseRepository<Publishing> {
  private static instance: PublishingRepository | null = null;
  private platformRepo: GenericFirestoreRepository<PublishingPlatformRecord>;

  private constructor() {
    super('publishing_packages', 'pub_');
    this.platformRepo = new GenericFirestoreRepository<PublishingPlatformRecord>(
      'publishing_platforms',
      'pub_'
    );
  }

  public static getInstance(): PublishingRepository {
    if (!PublishingRepository.instance) {
      PublishingRepository.instance = new PublishingRepository();
    }
    return PublishingRepository.instance;
  }

  public async findByVideoId(videoId: string): Promise<Publishing | null> {
    const all = await this.findAll();
    return all.find((p) => p.videoId === videoId) || null;
  }

  public async findByQuestionId(questionId: string): Promise<Publishing | null> {
    const all = await this.findAll();
    return all.find((p) => p.questionId === questionId) || null;
  }

  public async findByContentId(contentId: string): Promise<Publishing | null> {
    const all = await this.findAll();
    return all.find((p) => (p as any).contentId === contentId) || null;
  }

  public async save(record: Publishing): Promise<Publishing> {
    const existing = await this.findById(record.id);
    if (existing) {
      const updated = await this.updateRecord(record.id, record);
      if (updated) return updated;
    }
    return this.create(record);
  }

  /**
   * Generates a collision-resistant UUID-based canonical publishing identifier.
   */
  public generateId(): string {
    return canonicalIdService.generatePublishingId();
  }

  public async savePublishingPlatformRecord(record: PublishingPlatformRecord): Promise<PublishingPlatformRecord> {
    const existing = await this.platformRepo.findById(record.id);
    if (existing) {
      const updated = await this.platformRepo.updateRecord(record.id, record);
      if (updated) return updated;
    }
    return this.platformRepo.appendRecord(record);
  }

  public async findPublishingPlatformById(id: string): Promise<PublishingPlatformRecord | null> {
    return this.platformRepo.findById(id);
  }

  public async findPublishingPlatformByContentIdAndPlatform(
    contentId: string,
    platform: PlatformType | string
  ): Promise<PublishingPlatformRecord | null> {
    const normalizedPlatform = String(platform).toUpperCase();
    const all = await this.platformRepo.findAll();
    return (
      all.find(
        (rec) => rec.contentId === contentId && String(rec.platform).toUpperCase() === normalizedPlatform
      ) || null
    );
  }

  public async findPublishingPlatformByContentIdPlatformAndVersion(
    contentId: string,
    platform: PlatformType | string,
    version: number
  ): Promise<PublishingPlatformRecord | null> {
    const normalizedPlatform = String(platform).toUpperCase();
    const all = await this.platformRepo.findAll();
    return (
      all.find(
        (rec) =>
          rec.contentId === contentId &&
          String(rec.platform).toUpperCase() === normalizedPlatform &&
          rec.adaptationVersion === version
      ) || null
    );
  }

  public async findPublishingPlatformByContentId(contentId: string): Promise<PublishingPlatformRecord[]> {
    const all = await this.platformRepo.findAll();
    return all.filter((rec) => rec.contentId === contentId);
  }

  public async findAllPublishingPlatforms(): Promise<PublishingPlatformRecord[]> {
    return this.platformRepo.findAll();
  }

  public async searchPublishingPlatforms(filters: {
    contentId?: string;
    platform?: string;
    status?: string;
  }): Promise<PublishingPlatformRecord[]> {
    let list = await this.platformRepo.findAll();

    if (filters.contentId) {
      list = list.filter((r) => r.contentId === filters.contentId);
    }
    if (filters.platform) {
      const norm = filters.platform.toUpperCase();
      list = list.filter((r) => String(r.platform).toUpperCase() === norm);
    }
    if (filters.status) {
      list = list.filter((r) => r.status === filters.status);
    }

    return list;
  }

  public async clearPublishingPlatformStore(): Promise<void> {
    const all = await this.platformRepo.findAll();
    await Promise.all(all.map((r) => this.platformRepo.deleteRecord(r.id)));
  }
}

export const publishingRepository = PublishingRepository.getInstance();
