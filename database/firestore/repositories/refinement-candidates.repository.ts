/**
 * BURRA PARIKSHA CMS - Refinement Candidates Repository
 * Phase 13: AI Question Refinement & Improvement
 * Authoritative Firestore persistence.
 */

import { BaseRepository } from './base.repository';

export interface RefinementCandidate {
  id: string; // e.g. ref_<uuid> or BP-RC-######
  contentMasterId: string; // references ContentMaster.id
  questionId: string; // references Question.id
  originalVersion: number;
  candidateVersion: number;
  intent: string;
  promptModifier?: string;
  actorId: string;
  actorName: string;
  refinedContent: string;
  refinedOptionA: string;
  refinedOptionB: string;
  refinedOptionC: string;
  refinedOptionD: string;
  refinedCorrectAnswer: 'A' | 'B' | 'C' | 'D';
  refinedExplanation: string;
  refinedDifficulty: string;
  refinedLanguage: string;
  mathematicalStatus: 'VERIFIED' | 'UNVERIFIED' | 'NEEDS_REVIEW';
  mathematicalFeedback?: string;
  structuralStatus: 'VALID' | 'INVALID';
  metadataStatus: 'PROTECTED' | 'DRIFTED';
  verificationPreserved: boolean;
  phase10EvaluationResult?: any;
  createdAt: string;
  appliedAt?: string;
  rejectedAt?: string;
}

export class RefinementCandidatesRepository extends BaseRepository<RefinementCandidate> {
  private static instance: RefinementCandidatesRepository | null = null;

  private constructor() {
    super('refinement_candidates', 'ref_');
  }

  public static getInstance(): RefinementCandidatesRepository {
    if (!RefinementCandidatesRepository.instance) {
      RefinementCandidatesRepository.instance = new RefinementCandidatesRepository();
    }
    return RefinementCandidatesRepository.instance;
  }

  public override async create(candidate: RefinementCandidate): Promise<RefinementCandidate> {
    const existing = await this.findById(candidate.id);
    if (existing) {
      const updated = await this.updateRecord(candidate.id, candidate);
      return updated || candidate;
    }
    return this.appendRecord(candidate);
  }

  public async findByContentMasterId(contentMasterId: string): Promise<RefinementCandidate[]> {
    const all = await this.findAll();
    return all.filter((c) => c.contentMasterId === contentMasterId);
  }

  public override async update(
    idOrRecord: string | RefinementCandidate,
    updates?: Partial<RefinementCandidate>,
    options?: { expectedVersion?: number }
  ): Promise<RefinementCandidate> {
    const id = typeof idOrRecord === 'string' ? idOrRecord : idOrRecord.id;
    const patch = typeof idOrRecord === 'string' ? (updates || {}) : (updates || idOrRecord);

    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`RefinementCandidate with ID ${id} not found`);
    }

    const updated = await this.updateRecord(id, patch, options);
    return updated || ({ ...existing, ...patch } as RefinementCandidate);
  }

  public async clearFallbackData(): Promise<void> {
    const all = await this.findAll();
    await Promise.all(all.map((c) => this.deleteRecord(c.id)));
  }
}

export const refinementCandidatesRepository = RefinementCandidatesRepository.getInstance();
