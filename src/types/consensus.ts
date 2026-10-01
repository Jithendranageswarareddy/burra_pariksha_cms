/**
 * BURRA PARIKSHA CMS - Multi-Model Consensus & AI Quality Judge Types
 * Formal data contracts for multi-model verification, reconciliation, and quality provenance.
 */

import { AIProviderId } from './ai';
import { QuestionCandidate } from '../lib/ai/types';

export type ConsensusVerdict = 'CORRECT' | 'INCORRECT' | 'AMBIGUOUS' | 'UNCERTAIN';

export type ConsensusStatus = 'VERIFIED' | 'FAILED' | 'REVIEW';

export interface MathVerificationDetail {
  isCorrect?: boolean;
  expectedValue?: string;
  calculatedValue?: string;
  details?: string;
}

export interface LanguageVerificationDetail {
  isNaturalTelugu?: boolean;
  spellingGrammarScore?: number;
  details?: string;
}

export interface VerifierResult {
  verifierId: string;
  provider: AIProviderId;
  model: string;
  verdict: ConsensusVerdict;
  confidence: number; // 0.0 to 1.0
  correctnessAssessment: boolean;
  identifiedIssues: string[];
  reasoning: string;
  mathematicalVerification?: MathVerificationDetail;
  languageVerification?: LanguageVerificationDetail;
  executionTimeMs: number;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'RATE_LIMITED';
  error?: string;
}

export interface ReconciliationResult {
  consensusStatus: ConsensusStatus;
  overallConfidence: number; // 0.0 to 1.0
  totalVerifiers: number;
  successfulVerifiers: number;
  failedVerifiers: number;
  verdictBreakdown: Record<ConsensusVerdict, number>;
  agreedCorrectness: boolean | null;
  unanimous: boolean;
  majorityVerdict: ConsensusVerdict | null;
  disagreementDetected: boolean;
  coverageMet: boolean;
  criticalIssuesFound: string[];
  reconciliationNotes: string;
}

export interface ConsensusProvenance {
  consensusId: string; // e.g., BP-CNS-XXXXXX
  contentId: string;   // e.g., BP-CNT-XXXXXX
  candidateHash: string; // Deterministic SHA256/canonical hash of question candidate
  version: number;
  verifierProviders: string[];
  verifierModels: string[];
  verifierResults: VerifierResult[];
  reconciliation: ReconciliationResult;
  confidence: number;
  finalStatus: ConsensusStatus;
  isStale: boolean;
  verifiedByRole?: string;
  timestamp: string;
}

export interface VerificationOptions {
  minVerifierCoverage?: number; // Default: 2
  requiredProviders?: AIProviderId[];
  customPriorities?: AIProviderId[];
  timeoutPerVerifierMs?: number; // Default: 8000ms
  userRole?: string;
  contentId?: string;
  version?: number;
  isHighRiskContent?: boolean;
}

export interface CandidateVerificationRequest {
  candidate: QuestionCandidate;
  contentId?: string;
  version?: number;
  options?: VerificationOptions;
}

export interface VerificationResponse {
  consensus: ConsensusProvenance;
  canonicalCandidate: QuestionCandidate; // Untouched, immutable canonical candidate
  status: ConsensusStatus;
  message: string;
}

