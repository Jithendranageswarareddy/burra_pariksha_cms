/**
 * BURRA PARIKSHA CMS - Pinned Comment Packages Repository
 * Phase 19: Pinned Comment & Conversation Intelligence
 * 
 * Manages structured engagement packages, revision histories, and workflow state.
 * Authoritative Firestore persistence.
 */

import { BaseRepository, GenericFirestoreRepository } from './base.repository';
import { PinnedCommentPackage, PinnedCommentPackageVersion } from '../../../shared';

export class PinnedCommentPackagesRepository extends BaseRepository<PinnedCommentPackage> {
  private static instance: PinnedCommentPackagesRepository | null = null;
  private versionRepo: GenericFirestoreRepository<PinnedCommentPackageVersion>;

  private constructor() {
    super('pinned_comment_packages', 'pin_');
    this.versionRepo = new GenericFirestoreRepository<PinnedCommentPackageVersion>(
      'pinned_comment_package_versions',
      'pin_ver_'
    );
  }

  public static getInstance(): PinnedCommentPackagesRepository {
    if (!PinnedCommentPackagesRepository.instance) {
      PinnedCommentPackagesRepository.instance = new PinnedCommentPackagesRepository();
    }
    return PinnedCommentPackagesRepository.instance;
  }

  public override async create(pkg: PinnedCommentPackage): Promise<PinnedCommentPackage> {
    const existing = await this.findById(pkg.id);
    if (existing) {
      const updated = await this.updateRecord(pkg.id, pkg);
      return updated || pkg;
    }
    return this.appendRecord(pkg);
  }

  public async findByContentId(contentId: string): Promise<PinnedCommentPackage | null> {
    const all = await this.findAll();
    return all.find((p) => p.contentId === contentId) || null;
  }

  public async findByQuestionId(questionId: string): Promise<PinnedCommentPackage[]> {
    const all = await this.findAll();
    return all.filter((p) => p.questionId === questionId);
  }

  public override async update(
    idOrRecord: string | PinnedCommentPackage,
    updates?: Partial<PinnedCommentPackage>,
    options?: { expectedVersion?: number }
  ): Promise<PinnedCommentPackage> {
    const id = typeof idOrRecord === 'string' ? idOrRecord : idOrRecord.id;
    const patch = typeof idOrRecord === 'string' ? (updates || {}) : (updates || idOrRecord);

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Pinned comment package with ID "${id}" does not exist.`);
    }

    const updated = await this.updateRecord(
      id,
      {
        ...patch,
        updatedAt: new Date().toISOString(),
      },
      options
    );

    return updated || ({ ...existing, ...patch } as PinnedCommentPackage);
  }

  public async recordVersion(version: PinnedCommentPackageVersion): Promise<PinnedCommentPackageVersion> {
    return this.versionRepo.appendRecord(version);
  }

  public async getPackageVersions(packageId: string): Promise<PinnedCommentPackageVersion[]> {
    const all = await this.versionRepo.findAll();
    return all
      .filter((v) => v.packageId === packageId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  public override async delete(id: string): Promise<boolean> {
    const versions = await this.getPackageVersions(id);
    await Promise.all(versions.map((v) => this.versionRepo.deleteRecord((v as any).id)));
    return this.deleteRecord(id);
  }

  public async clearAll(): Promise<void> {
    const packages = await this.findAll();
    await Promise.all(packages.map((p) => this.deleteRecord(p.id)));
    const versions = await this.versionRepo.findAll();
    await Promise.all(versions.map((v) => this.versionRepo.deleteRecord((v as any).id)));
  }
}

export const pinnedCommentPackagesRepository = PinnedCommentPackagesRepository.getInstance();
