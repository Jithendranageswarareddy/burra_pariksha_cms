/**
 * BURRA PARIKSHA CMS - Phase 22 Publishing Hub Repository Adapter
 * Persistence adapter delegating to canonical publishingRepository.
 */

import { Phase22PublishingRecord, PlatformType } from '../../types';
import { publishingRepository } from './publishing.repository';

export class Phase22PublishingRepository {
  private static instance: Phase22PublishingRepository | null = null;

  private constructor() {}

  public static getInstance(): Phase22PublishingRepository {
    if (!Phase22PublishingRepository.instance) {
      Phase22PublishingRepository.instance = new Phase22PublishingRepository();
    }
    return Phase22PublishingRepository.instance;
  }

  public generateId(): string {
    return publishingRepository.generateId();
  }

  public async save(record: Phase22PublishingRecord): Promise<Phase22PublishingRecord> {
    return publishingRepository.savePhase22Record(record);
  }

  public async findById(id: string): Promise<Phase22PublishingRecord | null> {
    return publishingRepository.findPhase22ById(id);
  }

  public async findByContentIdAndPlatform(
    contentId: string,
    platform: PlatformType | string
  ): Promise<Phase22PublishingRecord | null> {
    return publishingRepository.findPhase22ByContentIdAndPlatform(contentId, platform);
  }

  public async findByContentIdPlatformAndVersion(
    contentId: string,
    platform: PlatformType | string,
    version: number
  ): Promise<Phase22PublishingRecord | null> {
    return publishingRepository.findPhase22ByContentIdPlatformAndVersion(contentId, platform, version);
  }

  public async findByContentId(contentId: string): Promise<Phase22PublishingRecord[]> {
    return publishingRepository.findPhase22ByContentId(contentId);
  }

  public async findAll(): Promise<Phase22PublishingRecord[]> {
    return publishingRepository.findAllPhase22();
  }

  public async search(filters: {
    contentId?: string;
    platform?: string;
    status?: string;
  }): Promise<Phase22PublishingRecord[]> {
    return publishingRepository.searchPhase22(filters);
  }

  public async clearStore(): Promise<void> {
    return publishingRepository.clearPhase22Store();
  }
}

export const phase22PublishingRepository = Phase22PublishingRepository.getInstance();

