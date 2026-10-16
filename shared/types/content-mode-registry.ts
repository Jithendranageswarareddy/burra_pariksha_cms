/**
 * BURRA PARIKSHA CMS — Content Mode Registry Contracts
 * Location: shared/types/content-mode-registry.ts
 *
 * Implements authoritative contract specifications from:
 * docs/sprints/sprint-08/S8-T06-CONTENT-MODE-REGISTRY-DESIGN.md
 *
 * Enforces declarative, strongly typed registry for all production modes:
 * - Mode 1: QUESTION_CHALLENGE_SHORT (Single-question vertical short <= 58s)
 * - Mode 2: TOPIC_INTRODUCTION (Conceptual syllabus overview 0 questions, 60-180s)
 * - Mode 3: EXPLAINED_QUESTIONS_VIDEO (Masterclass 1 intro + N questions, 16:9)
 */

import { ContentProductionMode } from './production-context';
import { WorkflowStepNumber } from '../constants/workflow';
import { CanonicalRbacRole } from '../constants/roles';

/**
 * Aspect ratio options supported across the production pipeline
 */
export type SupportedAspectRatio = '9:16' | '16:9';

/**
 * Target question count configuration constraint
 */
export interface QuestionCountConstraint {
  allowedValues: readonly number[]; // e.g. [1] for Mode 1; [0] for Mode 2; [5, 10, 15, 20] for Mode 3
  defaultValue: number; // 1 for Mode 1; 0 for Mode 2; 10 for Mode 3
  isConfigurable: boolean; // true if user may pick count; false if strictly fixed
  requiresQuestionsArray: boolean; // true for Mode 3 (questions[]); false for Modes 1 & 2
}

/**
 * Aspect ratio configuration constraint
 */
export interface AspectRatioConstraint {
  allowedValues: readonly SupportedAspectRatio[]; // ['9:16'] or ['16:9'] or ['9:16', '16:9']
  defaultValue: SupportedAspectRatio;
  isConfigurable: boolean;
}

/**
 * Expected audio/video duration boundaries in seconds
 */
export interface DurationConstraint {
  minSeconds: number;
  maxSeconds: number;
  targetSeconds: number;
  hardCeilingSeconds: number; // Platform drop-off limit (e.g. 58s for Shorts)
}

/**
 * Mode-specific input requirement declaration
 */
export interface ModeInputRequirements {
  requiresTaxonomy: true; // All modes strictly require Two-Tier Topic -> Subtopic
  requiresMCQOptions: boolean; // true for Mode 1; false for Mode 2; true per-question for Mode 3
  requiresCorrectAnswer: boolean; // true for Mode 1; false for Mode 2; true per-question for Mode 3
  requiresIntroductoryConcept: boolean; // true for Modes 2 & 3; optional for Mode 1
  requiresRealWorldContext: boolean; // recommended for Mode 1 & 2; optional for Mode 3
  requiresProofExplanation: boolean; // true for Mode 1 & 3; false for Mode 2
  allowedChallengeTypes: readonly string[]; // ['ABCD'] for Modes 1 & 3; [] for Mode 2
}

/**
 * Stage 02 Verification Checklist Contract
 */
export interface ModeVerificationChecklistSpec {
  checklistType: '10_POINT_PROOF' | '5_POINT_CONCEPT';
  checklistCodePrefix: string; // 'S8-M1', 'S8-M2', 'S8-M3'
  totalCheckpoints: number; // 10 for Mode 1 & 3; 5 for Mode 2
  evaluatesMathematicalProof: boolean; // true for Mode 1 & 3; false for Mode 2
  evaluatesSyllabusAccuracy: boolean; // true across all modes
  enforcesGar02: true; // Absolute non-bypassable invariant across all modes
}

/**
 * Supported production action token within a mode
 */
export interface ModeSupportedAction {
  actionId: string; // e.g. 'ACTION_SAVE_DRAFT', 'ACTION_SUBMIT_VERIFY'
  label: string; // Human-readable action label
  applicableStages: readonly WorkflowStepNumber[]; // Allowed canonical stages for this action
  requiredCapability: string; // Atomic RBAC token (e.g. 'QUESTION:CREATE')
  allowedRoles: readonly CanonicalRbacRole[]; // Primary authorized roles
  isVerificationGate: boolean; // True if action executes a formal human quality gate
}

/**
 * Presentation and Workspace UX Hints
 */
export interface ModePresentationMetadata {
  badgeLabel: string;
  badgeVariant: 'amber' | 'indigo' | 'emerald' | 'slate';
  iconToken: string; // 'Zap' | 'BookOpen' | 'ListOrdered'
  studioWorkspaceComponent: string; // 'QuestionStudioWorkspace' | 'TopicIntroWorkspace' | 'ExplainedQuestionsWorkspace'
  teleprompterTemplateType: '4_PART_SHORT' | 'FOUNDATIONAL_CONCEPT' | 'SEGMENTED_MASTERCLASS';
  editingBayFormat: 'VERTICAL_9_16_SNAPPY' | 'HYBRID_OVERVIEW' | 'LANDSCAPE_16_9_CHAPTERED';
  thumbnailFormat: 'VERTICAL_CTR_SPLIT' | 'CONFIGURABLE_SPLIT' | 'LANDSCAPE_16_9_CTR';
}

/**
 * Complete Declarative Content-Mode Definition
 */
export interface ContentModeDefinition {
  id: ContentProductionMode;
  code: string; // e.g. 'MODE_1', 'MODE_2', 'MODE_3'
  name: string;
  shortLabel: string;
  description: string;
  pedagogicalObjective: string;

  // Constraints & Contracts
  questionCount: QuestionCountConstraint;
  aspectRatio: AspectRatioConstraint;
  duration: DurationConstraint;
  inputs: ModeInputRequirements;
  verification: ModeVerificationChecklistSpec;

  // Lifecycle & Operations
  applicableStages: readonly WorkflowStepNumber[]; // All 15 canonical steps
  supportedActions: readonly ModeSupportedAction[];

  // UX & Rendering Metadata
  presentation: ModePresentationMetadata;
}
