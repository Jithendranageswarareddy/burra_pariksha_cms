/**
 * BURRA PARIKSHA CMS - Publishing Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { Publishing, Phase22PublishingRecord, PlatformType } from '../../types';
import { MOCK_PUBLISHING_RECORDS } from '../mock-data/publishing';

export class PublishingRepository extends BaseRepository<Publishing> {
  private static instance: PublishingRepository | null = null;
  private phase22Store = new Map<string, Phase22PublishingRecord>();
  private idCounter = 1;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.PUBLISHING]);
    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      this.seedFallbackData(MOCK_PUBLISHING_RECORDS);
    }
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

  public async savePhase22Record(record: Phase22PublishingRecord): Promise<Phase22PublishingRecord> {
    const clone = JSON.parse(JSON.stringify(record));
    this.phase22Store.set(clone.id, clone);
    return JSON.parse(JSON.stringify(clone));
  }

  public async findPhase22ById(id: string): Promise<Phase22PublishingRecord | null> {
    const rec = this.phase22Store.get(id);
    return rec ? JSON.parse(JSON.stringify(rec)) : null;
  }

  public async findPhase22ByContentIdAndPlatform(
    contentId: string,
    platform: PlatformType | string
  ): Promise<Phase22PublishingRecord | null> {
    const normalizedPlatform = String(platform).toUpperCase();
    for (const rec of this.phase22Store.values()) {
      if (rec.contentId === contentId && String(rec.platform).toUpperCase() === normalizedPlatform) {
        return JSON.parse(JSON.stringify(rec));
      }
    }
    return null;
  }

  public async findPhase22ByContentIdPlatformAndVersion(
    contentId: string,
    platform: PlatformType | string,
    version: number
  ): Promise<Phase22PublishingRecord | null> {
    const normalizedPlatform = String(platform).toUpperCase();
    for (const rec of this.phase22Store.values()) {
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

  public async findPhase22ByContentId(contentId: string): Promise<Phase22PublishingRecord[]> {
    const results: Phase22PublishingRecord[] = [];
    for (const rec of this.phase22Store.values()) {
      if (rec.contentId === contentId) {
        results.push(JSON.parse(JSON.stringify(rec)));
      }
    }
    return results;
  }

  public async findAllPhase22(): Promise<Phase22PublishingRecord[]> {
    return Array.from(this.phase22Store.values()).map((r) => JSON.parse(JSON.stringify(r)));
  }

  public async searchPhase22(filters: {
    contentId?: string;
    platform?: string;
    status?: string;
  }): Promise<Phase22PublishingRecord[]> {
    let list = Array.from(this.phase22Store.values());

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

  public async clearPhase22Store(): Promise<void> {
    this.phase22Store.clear();
  }
}

export const publishingRepository = PublishingRepository.getInstance();

