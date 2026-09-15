/**
 * BURRA PARIKSHA CMS - Refinement Candidates Repository
 * Phase 13: AI Question Refinement & Improvement
 */

export interface RefinementCandidate {
  id: string; // e.g. BP-RC-###### (Refinement Candidate ID)
  contentMasterId: string; // references ContentMaster.id (BP-CNT-######)
  questionId: string; // references Question.id (BP-Q-######)
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

class RefinementCandidatesRepository {
  private store = new Map<string, RefinementCandidate>();

  public async create(candidate: RefinementCandidate): Promise<RefinementCandidate> {
    this.store.set(candidate.id, { ...candidate });
    return candidate;
  }

  public async findById(id: string): Promise<RefinementCandidate | null> {
    const item = this.store.get(id);
    if (!item) return null;
    return { ...item };
  }

  public async findByContentMasterId(contentMasterId: string): Promise<RefinementCandidate[]> {
    return Array.from(this.store.values())
      .filter((c) => c.contentMasterId === contentMasterId)
      .map((c) => ({ ...c }));
  }

  public async update(id: string, updates: Partial<RefinementCandidate>): Promise<RefinementCandidate> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`RefinementCandidate with ID ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    this.store.set(id, updated);
    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  public async findAll(): Promise<RefinementCandidate[]> {
    return Array.from(this.store.values()).map((c) => ({ ...c }));
  }

  public clearFallbackData(): void {
    this.store.clear();
  }
}

export const refinementCandidatesRepository = new RefinementCandidatesRepository();
