/**
 * BURRA PARIKSHA CMS - Publishing Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { Publishing, PublishingPlatformRecord, PlatformType } from '../../types';

export class PublishingRepository extends BaseRepository<Publishing> {
  private static instance: PublishingRepository | null = null;
  private publishingPlatformStore = new Map<string, PublishingPlatformRecord>();
  private idCounter = 1;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.PUBLISHING]);
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

  // Canonical Phase 22 publishing hub support integrated into canonical repo
  public generateId(): string {
    const num = this.idCounter++;
    return `BP-PUB-${num.toString().padStart(6, '0')}`;
  }

  public async savePublishingPlatformRecord(record: PublishingPlatformRecord): Promise<PublishingPlatformRecord> {
    const clone = JSON.parse(JSON.stringify(record));
    this.publishingPlatformStore.set(clone.id, clone);
    return JSON.parse(JSON.stringify(clone));
  }

  public async findPublishingPlatformById(id: string): Promise<PublishingPlatformRecord | null> {
    const rec = this.publishingPlatformStore.get(id);
    return rec ? JSON.parse(JSON.stringify(rec)) : null;
  }

  public async findPublishingPlatformByContentIdAndPlatform(
    contentId: string,
    platform: PlatformType | string
  ): Promise<PublishingPlatformRecord | null> {
    const normalizedPlatform = String(platform).toUpperCase();
    for (const rec of this.publishingPlatformStore.values()) {
      if (rec.contentId === contentId && String(rec.platform).toUpperCase() === normalizedPlatform) {
        return JSON.parse(JSON.stringify(rec));
      }
    }
    return null;
  }

  public async findPublishingPlatformByContentIdPlatformAndVersion(
    contentId: string,
    platform: PlatformType | string,
    version: number
  ): Promise<PublishingPlatformRecord | null> {
    const normalizedPlatform = String(platform).toUpperCase();
    for (const rec of this.publishingPlatformStore.values()) {
      if (
        rec.contentId === contentId &&
        String(rec.platform).toUpperCase() === normalizedPlatform &&
        rec.adaptationVersion === version
      ) {
        return JSON.parse(JSON.stringify(rec));
      }
    }
    return null;
  }

  public async findPublishingPlatformByContentId(contentId: string): Promise<PublishingPlatformRecord[]> {
    const results: PublishingPlatformRecord[] = [];
    for (const rec of this.publishingPlatformStore.values()) {
      if (rec.contentId === contentId) {
        results.push(JSON.parse(JSON.stringify(rec)));
      }
    }
    return results;
  }

  public async findAllPublishingPlatforms(): Promise<PublishingPlatformRecord[]> {
    return Array.from(this.publishingPlatformStore.values()).map((r) => JSON.parse(JSON.stringify(r)));
  }

  public async searchPublishingPlatforms(filters: {
    contentId?: string;
    platform?: string;
    status?: string;
  }): Promise<PublishingPlatformRecord[]> {
    let list = Array.from(this.publishingPlatformStore.values());

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

    return list.map((r) => JSON.parse(JSON.stringify(r)));
  }

  public async clearPublishingPlatformStore(): Promise<void> {
    this.publishingPlatformStore.clear();
  }
}

export const publishingRepository = PublishingRepository.getInstance();

