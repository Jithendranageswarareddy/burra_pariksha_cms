/**
 * BURRA PARIKSHA CMS - Candidate Deterministic Adapter
 * Phase 22.4: Deterministic Validation Integration (Strategy B)
 * 
 * Bridges AI Question Candidates to the canonical MathematicalLogicalEngine
 * (24 deterministic archetype solvers) without modifying the legacy
 * CandidateValidator -> MathematicalValidator pipeline.
 * 
 * Pure, in-memory, synchronous evaluation.
 */

import { MathematicalLogicalEngine } from '../../validation/mathematical-logical.engine';
import { MathematicalLogicalResult } from '../../../types';
import { QuestionCandidate } from '../types';

export interface DeterministicAdapterInput {
  questionText: string;
  options: {
    a: string;
    b: string;
    c?: string;
    d?: string;
  };
  declaredAnswer: string;
}

export class CandidateDeterministicAdapter {
  /**
   * Evaluates a candidate using the canonical MathematicalLogicalEngine.
   * Pure function: Does NOT mutate entities, call AI, or access persistence.
   */
  public static verify(input: DeterministicAdapterInput): MathematicalLogicalResult {
    return MathematicalLogicalEngine.verify(
      input.questionText,
      input.options,
      input.declaredAnswer
    );
  }

  /**
   * Convenience adapter method accepting a QuestionCandidate directly.
   */
  public static verifyCandidate(candidate: QuestionCandidate): MathematicalLogicalResult {
    return CandidateDeterministicAdapter.verify({
      questionText: candidate.content || '',
      options: {
        a: candidate.option_a || '',
        b: candidate.option_b || '',
        c: candidate.option_c || '',
        d: candidate.option_d || '',
      },
      declaredAnswer: candidate.correct_answer || '',
    });
  }
}
