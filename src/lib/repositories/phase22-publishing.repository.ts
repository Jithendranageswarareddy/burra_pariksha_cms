/**
 * BURRA PARIKSHA CMS - Phase 22 Publishing Hub Repository
 * Persistence repository for Phase 22 publishing records.
 */

import { Phase22PublishingRecord, PlatformType } from '../../types';

export class Phase22PublishingRepository {
  private static instance: Phase22PublishingRepository | null = null;
  private records: Map<string, Phase22PublishingRecord> = new Map();
  private idCounter = 1;

  private constructor() {}

  public static getInstance(): Phase22PublishingRepository {
    if (!Phase22PublishingRepository.instance) {
      Phase22PublishingRepository.instance = new Phase22PublishingRepository();
    }
    return Phase22PublishingRepository.instance;
  }

  public generateId(): string {
    const num = this.idCounter++;
    return `BP-PUB-${num.toString().padStart(6, '0')}`;
  }

  public async save(record: Phase22PublishingRecord): Promise<Phase22PublishingRecord> {
    const clone = JSON.parse(JSON.stringify(record));
    this.records.set(clone.id, clone);
    return JSON.parse(JSON.stringify(clone));
  }

  public async findById(id: string): Promise<Phase22PublishingRecord | null> {
    const rec = this.records.get(id);
    return rec ? JSON.parse(JSON.stringify(rec)) : null;
  }

  public async findByContentIdAndPlatform(
    contentId: string,
    platform: PlatformType | string
  ): Promise<Phase22PublishingRecord | null> {
    const normalizedPlatform = String(platform).toUpperCase();
    for (const rec of this.records.values()) {
      if (rec.contentId === contentId && String(rec.platform).toUpperCase() === normalizedPlatform) {
        return JSON.parse(JSON.stringify(rec));
      }
    }
    return null;
  }

  public async findByContentIdPlatformAndVersion(
    contentId: string,
    platform: PlatformType | string,
    version: number
  ): Promise<Phase22PublishingRecord | null> {
    const normalizedPlatform = String(platform).toUpperCase();
    for (const rec of this.records.values()) {
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

  public async findByContentId(contentId: string): Promise<Phase22PublishingRecord[]> {
    const results: Phase22PublishingRecord[] = [];
    for (const rec of this.records.values()) {
      if (rec.contentId === contentId) {
        results.push(JSON.parse(JSON.stringify(rec)));
      }
    }
    return results;
  }

  public async findAll(): Promise<Phase22PublishingRecord[]> {
    return Array.from(this.records.values()).map((r) => JSON.parse(JSON.stringify(r)));
  }

  public async search(filters: {
    contentId?: string;
    platform?: string;
    status?: string;
  }): Promise<Phase22PublishingRecord[]> {
    let list = Array.from(this.records.values());

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

  public async clearStore(): Promise<void> {
    this.records.clear();
  }
}

export const phase22PublishingRepository = Phase22PublishingRepository.getInstance();
