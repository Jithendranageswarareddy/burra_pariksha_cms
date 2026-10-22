/**
 * BURRA PARIKSHA CMS - Thumbnail Candidates Repository
 * Phase 18: AI Thumbnail Intelligence
 * 
 * Manages thumbnail candidate proposals, A/B concept variants, and revision history.
 * Authoritative Firestore persistence.
 */

import { BaseRepository, GenericFirestoreRepository } from './base.repository';
import { ThumbnailCandidate, ThumbnailCandidateVersion } from '../../../shared';

export class ThumbnailCandidatesRepository extends BaseRepository<ThumbnailCandidate> {
  private static instance: ThumbnailCandidatesRepository | null = null;
  private versionRepo: GenericFirestoreRepository<ThumbnailCandidateVersion>;

  private constructor() {
    super('thumbnail_candidates', 'thm_');
    this.versionRepo = new GenericFirestoreRepository<ThumbnailCandidateVersion>(
      'thumbnail_candidate_versions',
      'thm_ver_'
    );
  }

  public static getInstance(): ThumbnailCandidatesRepository {
    if (!ThumbnailCandidatesRepository.instance) {
      ThumbnailCandidatesRepository.instance = new ThumbnailCandidatesRepository();
    }
    return ThumbnailCandidatesRepository.instance;
  }

  public override async create(candidate: ThumbnailCandidate): Promise<ThumbnailCandidate> {
    const existing = await this.findById(candidate.id);
    if (existing) {
      const updated = await this.updateRecord(candidate.id, candidate);
      return updated || candidate;
    }
    return this.appendRecord(candidate);
  }

  public async findByContentId(contentId: string): Promise<ThumbnailCandidate[]> {
    const all = await this.findAll();
    return all.filter((c) => c.contentId === contentId);
  }

  public async findByQuestionId(questionId: string): Promise<ThumbnailCandidate[]> {
    const all = await this.findAll();
    return all.filter((c) => c.questionId === questionId);
  }

  public override async update(
    idOrRecord: string | ThumbnailCandidate,
    updates?: Partial<ThumbnailCandidate>,
    options?: { expectedVersion?: number }
  ): Promise<ThumbnailCandidate> {
    const id = typeof idOrRecord === 'string' ? idOrRecord : idOrRecord.id;
    const patch = typeof idOrRecord === 'string' ? (updates || {}) : (updates || idOrRecord);

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Thumbnail candidate with ID "${id}" does not exist.`);
    }

    const updated = await this.updateRecord(
      id,
      {
        ...patch,
        updatedAt: new Date().toISOString(),
      },
      options
    );

    return updated || ({ ...existing, ...patch } as ThumbnailCandidate);
  }

  public async recordVersion(version: ThumbnailCandidateVersion): Promise<ThumbnailCandidateVersion> {
    return this.versionRepo.appendRecord(version);
  }

  public async getCandidateVersions(candidateId: string): Promise<ThumbnailCandidateVersion[]> {
    const all = await this.versionRepo.findAll();
    return all
      .filter((v) => v.candidateId === candidateId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }

  public override async delete(id: string): Promise<boolean> {
    const versions = await this.getCandidateVersions(id);
    await Promise.all(versions.map((v) => this.versionRepo.deleteRecord((v as any).id)));
    return this.deleteRecord(id);
  }

  public async clear(): Promise<void> {
    const candidates = await this.findAll();
    await Promise.all(candidates.map((c) => this.deleteRecord(c.id)));
    const versions = await this.versionRepo.findAll();
    await Promise.all(versions.map((v) => this.versionRepo.deleteRecord((v as any).id)));
  }
}

export const thumbnailCandidatesRepository = ThumbnailCandidatesRepository.getInstance();
