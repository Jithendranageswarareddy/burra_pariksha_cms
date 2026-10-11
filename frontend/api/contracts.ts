/**
 * BURRA PARIKSHA CMS - Frontend Client-Safe API Contracts
 * Sprint 7: Frontend / Backend Boundary Remediation (S7-T05)
 *
 * Defines pure, client-safe DTO interfaces for API responses and payloads.
 * Frontend presentation code consumes these serializable contracts rather than
 * importing server-side domain services, AI validators, or database infrastructure.
 */

import {
  ContentMaster,
  ContentDiversityWarning,
  Question,
  Video,
  Script,
  Thumbnail,
  PinnedComment,
  Publishing,
  SocialReviewRecord,
  Assignment,
  AuditLog,
  Workflow,
} from '../../src/types';

// ==========================================
// 1. Content Master Contracts
// ==========================================

export interface ContentMasterDetails {
  contentMaster: ContentMaster;
  primaryQuestion?: Question;
  questions: Question[];
  videos: Video[];
  scripts: Script[];
  thumbnails: Thumbnail[];
  pinnedComments: PinnedComment[];
  publishingRecords: Publishing[];
  socialReviews?: SocialReviewRecord[];
  assignments: Assignment[];
  auditLogs: AuditLog[];
  workflows: Workflow[];
}

// ==========================================
// 2. Similarity & Content Planning Contracts
// ==========================================

export interface QuestionSimilarityMatch {
  sourceQuestionId: string;
  sourceText: string;
  matchedQuestionId: string;
  matchedText: string;
  similarityScore: number;
  type: 'EXACT_DUPLICATE' | 'HIGH_SIMILARITY' | 'STRUCTURAL_PATTERN';
  reason: string;
}

export interface DiversityRadarReport {
  scannedQuestionsCount: number;
  exactDuplicatesCount: number;
  highSimilarityMatchesCount: number;
  similarityMatches: QuestionSimilarityMatch[];
  diversityWarnings: ContentDiversityWarning[];
  taxonomyConcentrations: {
    topicId: string;
    topicName: string;
    questionCount: number;
    shareOfTotal: number;
  }[];
  healthScore: number; // 0 to 100
  generatedAt: string;
}

// ==========================================
// 3. Operational Health & Recovery Contracts
// ==========================================

export type ConnectivityStatus = 'CONNECTED' | 'DEGRADED' | 'CONFIGURATION_ERROR' | 'UNAVAILABLE';
export type AuthStatus = 'VALID' | 'MISSING_CREDENTIALS' | 'INVALID_CREDENTIALS' | 'PERMISSION_DENIED';
export type SpreadsheetAccessibility = 'ACCESSIBLE' | 'NOT_APPLICABLE';

export interface OperationalTelemetry {
  totalRequests: number;
  totalRetries: number;
  lastLatencyMs: number | null;
  lastSuccessfulOperation: string | null;
  lastFailedOperation: string | null;
  lastSuccessTimestamp: string | null;
  lastFailureTimestamp: string | null;
}

export interface OperationalHealthReport {
  generatedAt: string;
  isConfigured: boolean;
  isConnected: boolean;
  connectivityStatus: ConnectivityStatus;
  authStatus: AuthStatus;
  databaseProvider: 'FIRESTORE';
  spreadsheetAccessibility: SpreadsheetAccessibility;
  mode: 'CLOUD_FIRESTORE' | 'UNCONFIGURED';
  spreadsheetId: string;
  spreadsheetTitle: string | null;
  projectId: string;
  databaseId: string;
  telemetry: OperationalTelemetry;
  sanitizedDiagnosticMessage: string;
  isReadOnly: true;
  collections?: Array<{ name: string; status: 'ONLINE' | 'ERROR'; count?: number }>;
}

export interface RecoveryActionPlan {
  actionId: string;
  title: string;
  category: 'CONNECTIVITY' | 'SCHEMA' | 'TAXONOMY' | 'RELATIONSHIP';
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  isAutomatedSupported: boolean;
  requiresExplicitConfirmation: boolean;
  previousValue?: string | number | null;
  proposedNewValue?: string | number | null;
  manualSteps: string[];
  description: string;
}

export interface OperationalRecoveryState {
  generatedAt: string;
  connectivity: OperationalHealthReport;
  actionPlans: RecoveryActionPlan[];
  isReadOnly: boolean;
}

// ==========================================
// 4. Question Validation & Math Contracts
// ==========================================

export type MathVerificationStatus = 'VERIFIED' | 'FAILED' | 'UNVERIFIED' | 'NOT_APPLICABLE';

export interface MathVerificationResult {
  status: MathVerificationStatus;
  problemType?: string;
  expectedValue?: number | string;
  expectedUnit?: string;
  matchedOption?: 'A' | 'B' | 'C' | 'D';
  allMatchedOptions?: ('A' | 'B' | 'C' | 'D')[];
  reason?: string;
  details?: string;
  calculationSteps?: string[];
}

export interface CandidateValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics?: {
    charCount: number;
    explanationCharCount: number;
    hasBurraTrick: boolean;
    hasTeluguScript: boolean;
    isNumericProblem: boolean;
  };
  mathematicalVerification?: MathVerificationResult;
}
