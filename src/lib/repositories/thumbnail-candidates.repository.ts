/**
 * BURRA PARIKSHA CMS - Thumbnail Candidates Repository
 * Phase 18: AI Thumbnail Intelligence
 * 
 * Manages thumbnail candidate proposals, A/B concept variants, and revision history.
 * Decouples AI generation from human-approved assets.
 */

import { ThumbnailCandidate, ThumbnailCandidateVersion } from '../../types';

export class ThumbnailCandidatesRepository {
  private static instance: ThumbnailCandidatesRepository | null = null;
  private candidateStore = new Map<string, ThumbnailCandidate>();
  private versionStore = new Map<string, ThumbnailCandidateVersion[]>();

  private constructor() {}

  public static getInstance(): ThumbnailCandidatesRepository {
    if (!ThumbnailCandidatesRepository.instance) {
      ThumbnailCandidatesRepository.instance = new ThumbnailCandidatesRepository();
    }
    return ThumbnailCandidatesRepository.instance;
  }

  public async create(candidate: ThumbnailCandidate): Promise<ThumbnailCandidate> {
    this.candidateStore.set(candidate.id, { ...candidate });
    return { ...candidate };
  }

  public async findById(id: string): Promise<ThumbnailCandidate | null> {
    const found = this.candidateStore.get(id);
    return found ? { ...found } : null;
  }

  public async findByContentId(contentId: string): Promise<ThumbnailCandidate[]> {
    return Array.from(this.candidateStore.values())
      .filter((c) => c.contentId === contentId)
      .map((c) => ({ ...c }));
  }

  public async findByQuestionId(questionId: string): Promise<ThumbnailCandidate[]> {
    return Array.from(this.candidateStore.values())
      .filter((c) => c.questionId === questionId)
      .map((c) => ({ ...c }));
  }

  public async update(id: string, updates: Partial<ThumbnailCandidate>): Promise<ThumbnailCandidate> {
    const existing = this.candidateStore.get(id);
    if (!existing) {
      throw new Error(`Thumbnail candidate with ID "${id}" does not exist.`);
    }

    const updated: ThumbnailCandidate = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.candidateStore.set(id, updated);
    return { ...updated };
  }

  public async recordVersion(version: ThumbnailCandidateVersion): Promise<ThumbnailCandidateVersion> {
    const list = this.versionStore.get(version.candidateId) || [];
    list.push({ ...version });
    this.versionStore.set(version.candidateId, list);
    return { ...version };
  }

  public async getCandidateVersions(candidateId: string): Promise<ThumbnailCandidateVersion[]> {
    const list = this.versionStore.get(candidateId) || [];
    return list.map((v) => ({ ...v }));
  }

  public async findAll(): Promise<ThumbnailCandidate[]> {
    return Array.from(this.candidateStore.values()).map((c) => ({ ...c }));
  }

  public async delete(id: string): Promise<boolean> {
    this.versionStore.delete(id);
    return this.candidateStore.delete(id);
  }
}

export const thumbnailCandidatesRepository = ThumbnailCandidatesRepository.getInstance();
