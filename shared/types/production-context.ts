/**
 * BURRA PARIKSHA CMS — Shared Production Context Contract
 * Location: shared/types/production-context.ts
 *
 * Implements authoritative contract specifications from:
 * docs/sprints/sprint-08/S8-T05-PRODUCTION-CONTEXT-CONTRACT.md
 *
 * Enforces:
 * - Two-tier taxonomy (Topic -> Subtopic, zero Category)
 * - Three content production modes (ADR-010, ADR-011)
 * - Collision-resistant canonical UUID entity IDs
 * - Canonical 15-stage workflow progression
 * - Client context is strictly advisory (backend RBAC & GAR-02 authoritative)
 */

import { CanonicalRbacRole } from '../constants/roles';
import { DifficultyLevel, QuestionLanguage, QuestionStyle } from '../constants/enums';
import { WorkflowStepNumber, WorkflowStageStatus } from '../constants/workflow';

import {
  CanonicalContentMode,
  SupportedContentMode,
} from '../constants/core-requirements';

export type { CanonicalContentMode, SupportedContentMode };

/**
 * Three content production modes deployed across existing runtime code (ADR-010).
 * Canonical modes (TOPIC_INTRODUCTION, WORKED_EXAMPLES, QUESTION_CHALLENGE_SHORT)
 * are formalized under CanonicalContentMode (ADR-015).
 */
export type ContentProductionMode =
  | 'QUESTION_CHALLENGE_SHORT' // Mode 1 in existing code: Single-question vertical short (<= 58s)
  | 'TOPIC_INTRODUCTION' // Mode 2 in existing code: Conceptual syllabus overview (0 questions, 60-180s)
  | 'EXPLAINED_QUESTIONS_VIDEO'; // Mode 3 in existing code: Masterclass (legacy alias for WORKED_EXAMPLES)

/**
 * Authoritative workflow stage micro-operational conditions
 */
export type { WorkflowStageStatus };

/**
 * Authoritative Two-Tier Taxonomy context
 */
export interface ProductionContextTaxonomy {
  topicId: string; // Canonical: top_<uuid> (legacy: TOP-###)
  topicName: string; // Human-readable topic title
  topicSlug: string; // URL-safe slug
  subtopicId: string; // Canonical: sub_<uuid> (legacy: SUB-###)
  subtopicName: string; // Human-readable subtopic title
  subtopicSlug: string; // URL-safe slug
}

/**
 * Production mode configuration parameters
 */
export interface ProductionContextModeConfig {
  productionMode: ContentProductionMode;
  questionCount: number; // Mode 1: 1 (or batch series {5,10,15,20}); Mode 2: 0; Mode 3: 5, 10, 15, 20
  aspectRatio: '9:16' | '16:9'; // Mode 1: '9:16'; Mode 2: '9:16' | '16:9'; Mode 3: '16:9'
  language: QuestionLanguage; // TELUGU | ENGLISH | TELUGU_ENGLISH
  difficulty?: DifficultyLevel; // EASY | MEDIUM | HARD
  questionStyle?: QuestionStyle; // e.g. STORY_BASED, SPEED_MATH_TRICK, etc.
  targetDurationSeconds?: number; // Mode 1: <= 58s; Mode 2: 60-180s; Mode 3: 720-3120s
}

/**
 * Canonical distributed UUID entity IDs correlating all production artifacts
 */
export interface ProductionContextEntityIds {
  learningUnitId?: string; // Central educational asset: lnu_<uuid> (REQ-06)
  contentMasterId?: string; // Root aggregate: cnt_<uuid>
  draftId?: string; // Transient draft: dft_<uuid> (Stage 01)
  questionId?: string; // Approved question: qst_<uuid> (Stage 02+)
  questionIds?: string[]; // Mode 3 practice questions array: qst_<uuid>[]
  conceptBriefId?: string; // Mode 2 conceptual overview ID: cbr_<uuid>
  scriptId?: string; // Teleprompter script: scr_<uuid> (Stage 03)
  videoId?: string; // Video production entity: vid_<uuid> (Stage 04-12)
  thumbnailId?: string; // Master thumbnail: thm_<uuid> (Stage 08)
  reviewId?: string; // QC/Social review: rev_<uuid> (Stage 07 & 09)
  publishingId?: string; // Publishing record: pub_<uuid> (Stage 10-12)
  analyticsId?: string; // Performance snapshot: anl_<uuid> (Stage 13-14)
  workflowInstanceId?: string; // State machine tracking: wfl_<uuid>
}

/**
 * Workflow state tracking across canonical 15-stage lifecycle
 */
export interface ProductionContextWorkflow {
  currentStage: WorkflowStepNumber; // Canonical integer: 1 to 15
  stageStatus: WorkflowStageStatus; // DRAFT | IN_PROGRESS | PENDING_REVIEW | CHANGES_REQUESTED | APPROVED | etc.
  isTerminal: boolean; // True if PUBLISHED or ARCHIVED
  lastTransitionAt: string; // ISO 8601 UTC timestamp
  lastTransitionBy: string; // usr_<uuid>
  rejectionNotes?: string; // Feedback from Stage 02, 07, or 09 rejection
  allowedActions: string[]; // Permitted transitions for active actor
}

/**
 * Operational role assignments for production artifacts
 */
export interface ProductionContextAssignment {
  ownerId: string; // Content creator / initiator (usr_<uuid>)
  assignedAuthorId?: string; // Stage 01 Author (usr_<uuid>)
  assignedReviewerId?: string; // Stage 02 Question QA (usr_<uuid>)
  assignedScriptwriterId?: string; // Stage 03 Scriptwriter (usr_<uuid>)
  assignedPresenterId?: string; // Stage 04 Presenter / Talent (usr_<uuid>)
  assignedEditorId?: string; // Stage 06 Video Editor (usr_<uuid>)
  assignedQcLeadId?: string; // Stage 07 Final QC Lead (usr_<uuid>)
  assignedDesignerId?: string; // Stage 08 Graphic Artist (usr_<uuid>)
  assignedPublisherId?: string; // Stage 09-12 Publishing Lead (usr_<uuid>)
}

/**
 * Authenticated actor context (advisory client presentation only)
 */
export interface ProductionContextActor {
  userId: string; // Authenticated User: usr_<uuid>
  name: string; // Full name
  roles: CanonicalRbacRole[]; // Canonical 11 roles from shared/constants/roles.ts
  capabilities: string[]; // Expanded atomic tokens ('QUESTION:SUBMIT', 'QUESTION:APPROVE', etc.)
  isAiAgent: boolean; // True for automated orchestrators, false for humans
}

/**
 * Authoritative Shared Production Context State Interface
 */
export interface ProductionContext {
  taxonomy: ProductionContextTaxonomy;
  modeConfig: ProductionContextModeConfig;
  entityIds: ProductionContextEntityIds;
  workflow: ProductionContextWorkflow;
  assignment: ProductionContextAssignment;
  actor: ProductionContextActor;
  isDirty: boolean; // Unsaved changes in active workbench
  isLoading: boolean; // Context hydration in progress
  error?: string | null; // Hydration or validation failure
}

/**
 * Actions exposed to update ProductionContext state
 */
export interface ProductionContextActions {
  setTaxonomy: (taxonomy: Partial<ProductionContextTaxonomy>) => void;
  setModeConfig: (config: Partial<ProductionContextModeConfig>) => void;
  setEntityIds: (ids: Partial<ProductionContextEntityIds>) => void;
  setWorkflow: (workflow: Partial<ProductionContextWorkflow>) => void;
  setAssignment: (assignment: Partial<ProductionContextAssignment>) => void;
  setIsDirty: (isDirty: boolean) => void;
  setError: (error: string | null) => void;
  resetContext: () => void;
}

/**
 * Combined Production Context value returned by useProductionContext
 */
export interface ProductionContextValue extends ProductionContext, ProductionContextActions {}

/**
 * Default production context initial values
 */
export const DEFAULT_PRODUCTION_CONTEXT: ProductionContext = {
  taxonomy: {
    topicId: '',
    topicName: '',
    topicSlug: '',
    subtopicId: '',
    subtopicName: '',
    subtopicSlug: '',
  },
  modeConfig: {
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    questionCount: 1,
    aspectRatio: '9:16',
    language: QuestionLanguage.TELUGU,
  },
  entityIds: {},
  workflow: {
    currentStage: 1,
    stageStatus: 'DRAFT',
    isTerminal: false,
    lastTransitionAt: new Date(0).toISOString(),
    lastTransitionBy: '',
    allowedActions: [],
  },
  assignment: {
    ownerId: '',
  },
  actor: {
    userId: '',
    name: '',
    roles: [],
    capabilities: [],
    isAiAgent: false,
  },
  isDirty: false,
  isLoading: false,
  error: null,
};

/**
 * Validation result interface
 */
export interface ProductionContextValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates ContentProductionMode and its associated questionCount and aspectRatio
 */
export function validateProductionModeConfig(
  mode: ContentProductionMode,
  questionCount: number,
  aspectRatio: '9:16' | '16:9'
): ProductionContextValidationResult {
  if (!mode) {
    return { isValid: false, error: 'Production mode is required.' };
  }

  if (mode === 'QUESTION_CHALLENGE_SHORT') {
    const validCounts = [1, 5, 10, 15, 20];
    if (!validCounts.includes(questionCount)) {
      return {
        isValid: false,
        error: `Mode 1 (QUESTION_CHALLENGE_SHORT) requires questionCount of 1 (or batch series 5, 10, 15, 20), received: ${questionCount}.`,
      };
    }
    if (aspectRatio !== '9:16') {
      return {
        isValid: false,
        error: `Mode 1 (QUESTION_CHALLENGE_SHORT) requires '9:16' aspect ratio, received: '${aspectRatio}'.`,
      };
    }
    return { isValid: true };
  }

  if (mode === 'TOPIC_INTRODUCTION') {
    if (questionCount !== 0) {
      return {
        isValid: false,
        error: `Mode 2 (TOPIC_INTRODUCTION) requires questionCount to be 0, received: ${questionCount}.`,
      };
    }
    if (aspectRatio !== '9:16' && aspectRatio !== '16:9') {
      return {
        isValid: false,
        error: `Mode 2 (TOPIC_INTRODUCTION) requires '9:16' or '16:9' aspect ratio, received: '${aspectRatio}'.`,
      };
    }
    return { isValid: true };
  }

  if (mode === 'EXPLAINED_QUESTIONS_VIDEO') {
    const validCounts = [5, 10, 15, 20];
    if (!validCounts.includes(questionCount)) {
      return {
        isValid: false,
        error: `Mode 3 (EXPLAINED_QUESTIONS_VIDEO) requires questionCount to be 5, 10, 15, or 20, received: ${questionCount}.`,
      };
    }
    if (aspectRatio !== '16:9') {
      return {
        isValid: false,
        error: `Mode 3 (EXPLAINED_QUESTIONS_VIDEO) requires '16:9' aspect ratio, received: '${aspectRatio}'.`,
      };
    }
    return { isValid: true };
  }

  return { isValid: false, error: `Invalid production mode: ${mode as string}.` };
}

/**
 * Validates two-tier Topic -> Subtopic link invariant
 */
export function validateTaxonomyLink(
  topicId: string,
  subtopicTopicId: string
): ProductionContextValidationResult {
  if (!topicId || typeof topicId !== 'string' || topicId.trim().length === 0) {
    return { isValid: false, error: 'Topic ID is required.' };
  }
  if (!subtopicTopicId || typeof subtopicTopicId !== 'string' || subtopicTopicId.trim().length === 0) {
    return { isValid: false, error: 'Subtopic topicId link is required.' };
  }
  if (topicId !== subtopicTopicId) {
    return {
      isValid: false,
      error: `Taxonomy link violation: Subtopic topicId (${subtopicTopicId}) does not match active Topic ID (${topicId}).`,
    };
  }
  return { isValid: true };
}
