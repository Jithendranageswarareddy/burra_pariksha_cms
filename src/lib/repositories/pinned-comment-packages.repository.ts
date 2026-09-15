/**
 * BURRA PARIKSHA CMS - Pinned Comment Packages Repository
 * Phase 19: Pinned Comment & Conversation Intelligence
 * 
 * Manages structured engagement packages, revision histories, and workflow state.
 */

import { PinnedCommentPackage, PinnedCommentPackageVersion } from '../../types';

export class PinnedCommentPackagesRepository {
  private static instance: PinnedCommentPackagesRepository | null = null;
  private packageStore = new Map<string, PinnedCommentPackage>();
  private versionStore = new Map<string, PinnedCommentPackageVersion[]>();

  private constructor() {}

  public static getInstance(): PinnedCommentPackagesRepository {
    if (!PinnedCommentPackagesRepository.instance) {
      PinnedCommentPackagesRepository.instance = new PinnedCommentPackagesRepository();
    }
    return PinnedCommentPackagesRepository.instance;
  }

  public async create(pkg: PinnedCommentPackage): Promise<PinnedCommentPackage> {
    this.packageStore.set(pkg.id, { ...pkg });
    return { ...pkg };
  }

  public async findById(id: string): Promise<PinnedCommentPackage | null> {
    const found = this.packageStore.get(id);
    return found ? { ...found } : null;
  }

  public async findByContentId(contentId: string): Promise<PinnedCommentPackage | null> {
    const all = Array.from(this.packageStore.values());
    const match = all.find((p) => p.contentId === contentId);
    return match ? { ...match } : null;
  }

  public async findByQuestionId(questionId: string): Promise<PinnedCommentPackage[]> {
    return Array.from(this.packageStore.values())
      .filter((p) => p.questionId === questionId)
      .map((p) => ({ ...p }));
  }

  public async update(id: string, updates: Partial<PinnedCommentPackage>): Promise<PinnedCommentPackage> {
    const existing = this.packageStore.get(id);
    if (!existing) {
      throw new Error(`Pinned comment package with ID "${id}" does not exist.`);
    }

    const updated: PinnedCommentPackage = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.packageStore.set(id, updated);
    return { ...updated };
  }

  public async recordVersion(version: PinnedCommentPackageVersion): Promise<PinnedCommentPackageVersion> {
    const list = this.versionStore.get(version.packageId) || [];
    list.push({ ...version });
    this.versionStore.set(version.packageId, list);
    return { ...version };
  }

  public async getPackageVersions(packageId: string): Promise<PinnedCommentPackageVersion[]> {
    const list = this.versionStore.get(packageId) || [];
    return list.map((v) => ({ ...v }));
  }

  public async findAll(): Promise<PinnedCommentPackage[]> {
    return Array.from(this.packageStore.values()).map((p) => ({ ...p }));
  }

  public async delete(id: string): Promise<boolean> {
    this.versionStore.delete(id);
    return this.packageStore.delete(id);
  }

  public clearAll(): void {
    this.packageStore.clear();
    this.versionStore.clear();
  }
}

export const pinnedCommentPackagesRepository = PinnedCommentPackagesRepository.getInstance();
