/**
 * BURRA PARIKSHA CMS - Phase 25 Multi-Model Consensus & AI Quality Judge Types
 * Formal data contracts for multi-model verification, reconciliation, and quality provenance.
 */

import { AIProviderId } from './phase24-ai';
import { QuestionCandidate } from '../lib/ai/types';

export type Phase25Verdict = 'CORRECT' | 'INCORRECT' | 'AMBIGUOUS' | 'UNCERTAIN';

export type Phase25ConsensusStatus = 'VERIFIED' | 'FAILED' | 'REVIEW';

export interface Phase25MathVerificationDetail {
  isCorrect?: boolean;
  expectedValue?: string;
  calculatedValue?: string;
  details?: string;
}

export interface Phase25LanguageVerificationDetail {
  isNaturalTelugu?: boolean;
  spellingGrammarScore?: number;
  details?: string;
}

export interface Phase25VerifierResult {
  verifierId: string;
  provider: AIProviderId;
  model: string;
  verdict: Phase25Verdict;
  confidence: number; // 0.0 to 1.0
  correctnessAssessment: boolean;
  identifiedIssues: string[];
  reasoning: string;
  mathematicalVerification?: Phase25MathVerificationDetail;
  languageVerification?: Phase25LanguageVerificationDetail;
  executionTimeMs: number;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'RATE_LIMITED';
  error?: string;
}

export interface Phase25ReconciliationResult {
  consensusStatus: Phase25ConsensusStatus;
  overallConfidence: number; // 0.0 to 1.0
  totalVerifiers: number;
  successfulVerifiers: number;
  failedVerifiers: number;
  verdictBreakdown: Record<Phase25Verdict, number>;
  agreedCorrectness: boolean | null;
  unanimous: boolean;
  majorityVerdict: Phase25Verdict | null;
  disagreementDetected: boolean;
  coverageMet: boolean;
  criticalIssuesFound: string[];
  reconciliationNotes: string;
}

export interface Phase25ConsensusProvenance {
  consensusId: string; // e.g., BP-CNS-XXXXXX
  contentId: string;   // e.g., BP-CNT-XXXXXX
  candidateHash: string; // Deterministic SHA256/canonical hash of question candidate
  version: number;
  verifierProviders: string[];
  verifierModels: string[];
  verifierResults: Phase25VerifierResult[];
  reconciliation: Phase25ReconciliationResult;
  confidence: number;
  finalStatus: Phase25ConsensusStatus;
  isStale: boolean;
  verifiedByRole?: string;
  timestamp: string;
}

export interface Phase25VerificationOptions {
  minVerifierCoverage?: number; // Default: 2
  requiredProviders?: AIProviderId[];
  customPriorities?: AIProviderId[];
  timeoutPerVerifierMs?: number; // Default: 8000ms
  userRole?: string;
  contentId?: string;
  version?: number;
  isHighRiskContent?: boolean;
}

export interface Phase25CandidateVerificationRequest {
  candidate: QuestionCandidate;
  contentId?: string;
  version?: number;
  options?: Phase25VerificationOptions;
}

export interface Phase25VerificationResponse {
  consensus: Phase25ConsensusProvenance;
  canonicalCandidate: QuestionCandidate; // Untouched, immutable canonical candidate
  status: Phase25ConsensusStatus;
  message: string;
}
