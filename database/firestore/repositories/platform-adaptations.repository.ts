/**
 * BURRA PARIKSHA CMS - Platform Adaptations Repository
 * Phase 21: Multi-Platform Content Adaptation
 * 
 * Manages storage and version history of platform adaptations (YouTube, Instagram, Facebook).
 * Authoritative Firestore persistence.
 */

import { BaseRepository, GenericFirestoreRepository } from './base.repository';
import {
  PlatformType,
  PlatformAdaptationRecord,
  PlatformAdaptationVersion,
  PlatformAdaptationSearchFilters,
  PlatformAdaptationAuditEntry,
} from '../../../shared';
import { canonicalIdService } from '../../../src/lib/id.service';

export class PlatformAdaptationsRepository extends BaseRepository<PlatformAdaptationRecord> {
  private static instance: PlatformAdaptationsRepository | null = null;
  private versionRepo: GenericFirestoreRepository<PlatformAdaptationVersion>;
  private auditRepo: GenericFirestoreRepository<PlatformAdaptationAuditEntry>;

  private constructor() {
    super('platform_adaptations', 'adp_');
    this.versionRepo = new GenericFirestoreRepository<PlatformAdaptationVersion>(
      'platform_adaptation_versions',
      'adp_ver_'
    );
    this.auditRepo = new GenericFirestoreRepository<PlatformAdaptationAuditEntry>(
      'platform_adaptation_audits',
      'aud_'
    );
  }

  public static getInstance(): PlatformAdaptationsRepository {
    if (!PlatformAdaptationsRepository.instance) {
      PlatformAdaptationsRepository.instance = new PlatformAdaptationsRepository();
    }
    return PlatformAdaptationsRepository.instance;
  }

  public override async create(adaptation: PlatformAdaptationRecord): Promise<PlatformAdaptationRecord> {
    const existing = await this.findById(adaptation.id);
    const saved = existing
      ? (await this.updateRecord(adaptation.id, adaptation)) || adaptation
      : await this.appendRecord(adaptation);

    // Initial version 1 snapshot
    const initialVersion: PlatformAdaptationVersion = {
      versionNumber: adaptation.currentVersion || 1,
      adaptationId: adaptation.id,
      contentId: adaptation.contentId,
      platform: adaptation.platform,
      title: adaptation.title,
      description: adaptation.description,
      caption: adaptation.caption,
      hashtags: [...adaptation.hashtags],
      callToAction: adaptation.callToAction,
      platformSpecificWording: { ...adaptation.platformSpecificWording },
      thumbnailConsiderations: { ...adaptation.thumbnailConsiderations },
      status: adaptation.status,
      canonicalSourceVersionLock: { ...adaptation.canonicalSourceVersionLock },
      generationSource: adaptation.generationSource,
      aiProvenance: adaptation.aiProvenance ? { ...adaptation.aiProvenance } : undefined,
      createdBy: adaptation.createdBy,
      createdByName: adaptation.createdByName,
      createdByRole: adaptation.createdByRole,
      createdAt: adaptation.createdAt,
      approvalRecord: adaptation.approvalRecord ? { ...adaptation.approvalRecord } : undefined,
      rejectionRecord: adaptation.rejectionRecord ? { ...adaptation.rejectionRecord } : undefined,
      changesRequiredRecord: adaptation.changesRequiredRecord ? { ...adaptation.changesRequiredRecord } : undefined,
    };

    await this.versionRepo.appendRecord(initialVersion);
    return saved;
  }

  public async findByContentIdAndPlatform(
    contentId: string,
    platform: PlatformType
  ): Promise<PlatformAdaptationRecord | null> {
    const all = await this.findAll();
    return all.find((a) => a.contentId === contentId && a.platform === platform) || null;
  }

  public async findByContentId(contentId: string): Promise<PlatformAdaptationRecord[]> {
    const all = await this.findAll();
    return all.filter((a) => a.contentId === contentId);
  }

  public async search(filters: PlatformAdaptationSearchFilters): Promise<PlatformAdaptationRecord[]> {
    let list = await this.findAll();

    if (filters.contentId) {
      list = list.filter((a) => a.contentId === filters.contentId);
    }
    if (filters.platform) {
      list = list.filter((a) => a.platform === filters.platform);
    }
    if (filters.status) {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters.version !== undefined) {
      list = list.filter((a) => a.currentVersion === filters.version);
    }
    if (filters.createdBy) {
      list = list.filter((a) => a.createdBy === filters.createdBy);
    }
    if (filters.updatedAfter) {
      const afterTime = new Date(filters.updatedAfter).getTime();
      list = list.filter((a) => new Date(a.updatedAt).getTime() >= afterTime);
    }
    if (filters.updatedBefore) {
      const beforeTime = new Date(filters.updatedBefore).getTime();
      list = list.filter((a) => new Date(a.updatedAt).getTime() <= beforeTime);
    }

    return list;
  }

  public override async update(
    idOrRecord: string | PlatformAdaptationRecord,
    updates?: Partial<PlatformAdaptationRecord>,
    options?: { createNewVersion?: boolean; expectedVersion?: number }
  ): Promise<PlatformAdaptationRecord> {
    const id = typeof idOrRecord === 'string' ? idOrRecord : idOrRecord.id;
    const patch = typeof idOrRecord === 'string' ? (updates || {}) : (updates || idOrRecord);

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Platform adaptation with ID "${id}" does not exist.`);
    }

    const now = new Date().toISOString();
    const shouldNewVersion = options?.createNewVersion ?? false;
    const newVersionNumber = shouldNewVersion ? existing.currentVersion + 1 : existing.currentVersion;

    const payload: Partial<PlatformAdaptationRecord> = {
      ...patch,
      currentVersion: newVersionNumber,
      updatedAt: now,
    };

    const updated = await this.updateRecord(id, payload, { expectedVersion: options?.expectedVersion });
    const fullUpdated = updated || ({ ...existing, ...payload } as PlatformAdaptationRecord);

    if (shouldNewVersion) {
      const versionSnapshot: PlatformAdaptationVersion = {
        versionNumber: newVersionNumber,
        adaptationId: fullUpdated.id,
        contentId: fullUpdated.contentId,
        platform: fullUpdated.platform,
        title: fullUpdated.title,
        description: fullUpdated.description,
        caption: fullUpdated.caption,
        hashtags: [...fullUpdated.hashtags],
        callToAction: fullUpdated.callToAction,
        platformSpecificWording: { ...fullUpdated.platformSpecificWording },
        thumbnailConsiderations: { ...fullUpdated.thumbnailConsiderations },
        status: fullUpdated.status,
        canonicalSourceVersionLock: { ...fullUpdated.canonicalSourceVersionLock },
        generationSource: fullUpdated.generationSource,
        aiProvenance: fullUpdated.aiProvenance ? { ...fullUpdated.aiProvenance } : undefined,
        createdBy: fullUpdated.createdBy,
        createdByName: fullUpdated.createdByName,
        createdByRole: fullUpdated.createdByRole,
        createdAt: now,
        approvalRecord: fullUpdated.approvalRecord ? { ...fullUpdated.approvalRecord } : undefined,
        rejectionRecord: fullUpdated.rejectionRecord ? { ...fullUpdated.rejectionRecord } : undefined,
        changesRequiredRecord: fullUpdated.changesRequiredRecord ? { ...fullUpdated.changesRequiredRecord } : undefined,
      };

      await this.versionRepo.appendRecord(versionSnapshot);
    }

    return fullUpdated;
  }

  public async getVersions(adaptationId: string): Promise<PlatformAdaptationVersion[]> {
    const all = await this.versionRepo.findAll();
    return all
      .filter((v) => v.adaptationId === adaptationId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  public async getVersion(adaptationId: string, versionNumber: number): Promise<PlatformAdaptationVersion | null> {
    const versions = await this.getVersions(adaptationId);
    return versions.find((v) => v.versionNumber === versionNumber) || null;
  }

  public async logAudit(entry: Omit<PlatformAdaptationAuditEntry, 'id'>): Promise<PlatformAdaptationAuditEntry> {
    const fullEntry: PlatformAdaptationAuditEntry = {
      id: canonicalIdService.generateAuditLogId(),
      ...entry,
    };
    return this.auditRepo.appendRecord(fullEntry);
  }

  public async getAuditHistory(adaptationId?: string, contentId?: string): Promise<PlatformAdaptationAuditEntry[]> {
    let list = await this.auditRepo.findAll();
    if (adaptationId) {
      list = list.filter((a) => a.adaptationId === adaptationId);
    }
    if (contentId) {
      list = list.filter((a) => a.contentId === contentId);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public async clear(): Promise<void> {
    const adaptations = await this.findAll();
    await Promise.all(adaptations.map((a) => this.deleteRecord(a.id)));
    const versions = await this.versionRepo.findAll();
    await Promise.all(versions.map((v) => this.versionRepo.deleteRecord((v as any).id)));
    const audits = await this.auditRepo.findAll();
    await Promise.all(audits.map((a) => this.auditRepo.deleteRecord(a.id)));
  }
}

export const platformAdaptationsRepository = PlatformAdaptationsRepository.getInstance();
