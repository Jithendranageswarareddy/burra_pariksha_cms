/**
 * BURRA PARIKSHA CMS - Platform Adaptations Repository
 * Phase 21: Multi-Platform Content Adaptation
 * 
 * Manages storage and version history of platform adaptations (YouTube, Instagram, Facebook).
 * Guarantees:
 * - One current adaptation record per (Content ID, Platform)
 * - Immutable version snapshots preserved per adaptation
 * - Querying by Content ID, Platform, Status, Version, CreatedBy, UpdatedAt
 */

import {
  PlatformAdaptationRecord,
  PlatformAdaptationVersion,
  PlatformAdaptationSearchFilters,
  PlatformType,
  PlatformAdaptationAuditEntry,
} from '../../types';

export class PlatformAdaptationsRepository {
  private static instance: PlatformAdaptationsRepository | null = null;
  private adaptationStore = new Map<string, PlatformAdaptationRecord>();
  private versionStore = new Map<string, PlatformAdaptationVersion[]>();
  private auditStore: PlatformAdaptationAuditEntry[] = [];

  private constructor() {}

  public static getInstance(): PlatformAdaptationsRepository {
    if (!PlatformAdaptationsRepository.instance) {
      PlatformAdaptationsRepository.instance = new PlatformAdaptationsRepository();
    }
    return PlatformAdaptationsRepository.instance;
  }

  public async create(adaptation: PlatformAdaptationRecord): Promise<PlatformAdaptationRecord> {
    this.adaptationStore.set(adaptation.id, { ...adaptation });

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

    const existingVersions = this.versionStore.get(adaptation.id) || [];
    this.versionStore.set(adaptation.id, [...existingVersions, initialVersion]);

    return { ...adaptation };
  }

  public async findById(id: string): Promise<PlatformAdaptationRecord | null> {
    const found = this.adaptationStore.get(id);
    return found ? { ...found } : null;
  }

  public async findByContentIdAndPlatform(
    contentId: string,
    platform: PlatformType
  ): Promise<PlatformAdaptationRecord | null> {
    const all = Array.from(this.adaptationStore.values());
    const match = all.find((a) => a.contentId === contentId && a.platform === platform);
    return match ? { ...match } : null;
  }

  public async findByContentId(contentId: string): Promise<PlatformAdaptationRecord[]> {
    return Array.from(this.adaptationStore.values())
      .filter((a) => a.contentId === contentId)
      .map((a) => ({ ...a }));
  }

  public async findAll(): Promise<PlatformAdaptationRecord[]> {
    return Array.from(this.adaptationStore.values()).map((a) => ({ ...a }));
  }

  public async search(filters: PlatformAdaptationSearchFilters): Promise<PlatformAdaptationRecord[]> {
    let list = Array.from(this.adaptationStore.values());

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

    return list.map((a) => ({ ...a }));
  }

  public async update(
    id: string,
    updates: Partial<PlatformAdaptationRecord>,
    options?: { createNewVersion?: boolean }
  ): Promise<PlatformAdaptationRecord> {
    const existing = this.adaptationStore.get(id);
    if (!existing) {
      throw new Error(`Platform adaptation with ID "${id}" does not exist.`);
    }

    const now = new Date().toISOString();
    const shouldNewVersion = options?.createNewVersion ?? false;
    const newVersionNumber = shouldNewVersion ? existing.currentVersion + 1 : existing.currentVersion;

    const updated: PlatformAdaptationRecord = {
      ...existing,
      ...updates,
      currentVersion: newVersionNumber,
      updatedAt: now,
    };

    this.adaptationStore.set(id, updated);

    if (shouldNewVersion) {
      const versionSnapshot: PlatformAdaptationVersion = {
        versionNumber: newVersionNumber,
        adaptationId: updated.id,
        contentId: updated.contentId,
        platform: updated.platform,
        title: updated.title,
        description: updated.description,
        caption: updated.caption,
        hashtags: [...updated.hashtags],
        callToAction: updated.callToAction,
        platformSpecificWording: { ...updated.platformSpecificWording },
        thumbnailConsiderations: { ...updated.thumbnailConsiderations },
        status: updated.status,
        canonicalSourceVersionLock: { ...updated.canonicalSourceVersionLock },
        generationSource: updated.generationSource,
        aiProvenance: updated.aiProvenance ? { ...updated.aiProvenance } : undefined,
        createdBy: updated.createdBy,
        createdByName: updated.createdByName,
        createdByRole: updated.createdByRole,
        createdAt: now,
        approvalRecord: updated.approvalRecord ? { ...updated.approvalRecord } : undefined,
        rejectionRecord: updated.rejectionRecord ? { ...updated.rejectionRecord } : undefined,
        changesRequiredRecord: updated.changesRequiredRecord ? { ...updated.changesRequiredRecord } : undefined,
      };

      const existingVersions = this.versionStore.get(id) || [];
      this.versionStore.set(id, [...existingVersions, versionSnapshot]);
    }

    return { ...updated };
  }

  public async getVersions(adaptationId: string): Promise<PlatformAdaptationVersion[]> {
    const versions = this.versionStore.get(adaptationId) || [];
    return versions.map((v) => ({ ...v }));
  }

  public async getVersion(adaptationId: string, versionNumber: number): Promise<PlatformAdaptationVersion | null> {
    const versions = this.versionStore.get(adaptationId) || [];
    const match = versions.find((v) => v.versionNumber === versionNumber);
    return match ? { ...match } : null;
  }

  public async logAudit(entry: Omit<PlatformAdaptationAuditEntry, 'id'>): Promise<PlatformAdaptationAuditEntry> {
    const fullEntry: PlatformAdaptationAuditEntry = {
      id: `ADP-AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...entry,
    };
    this.auditStore.push(fullEntry);
    return fullEntry;
  }

  public async getAuditHistory(adaptationId?: string, contentId?: string): Promise<PlatformAdaptationAuditEntry[]> {
    let list = [...this.auditStore];
    if (adaptationId) {
      list = list.filter((a) => a.adaptationId === adaptationId);
    }
    if (contentId) {
      list = list.filter((a) => a.contentId === contentId);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public async clear(): Promise<void> {
    this.adaptationStore.clear();
    this.versionStore.clear();
    this.auditStore = [];
  }
}

export const platformAdaptationsRepository = PlatformAdaptationsRepository.getInstance();
