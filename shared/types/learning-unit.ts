/**
 * BURRA PARIKSHA CMS — Verified Learning Unit Types
 * Location: shared/types/learning-unit.ts
 *
 * Source of Truth: docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md
 * (Section 6: The Central Asset: A Verified Learning Unit; Section 7: Proposed Content-Planning Model)
 * Architectural Decision: ADR-015 (docs/architecture/DECISION-LOG.md)
 *
 * Defines the central educational asset:
 * Distinguishes the underlying educational lesson from publications produced from it.
 * Multiple content artifacts (Mode 1 Topic Intro, Mode 2 Worked Examples,
 * Mode 3 Challenge Short, Text explanations, Audio lessons, Images) all link
 * back to the same verified learning unit.
 */

import {
  AudienceContext,
  CanonicalContentMode,
  EditorialPillar,
  PresentationFormat,
  SkillLevel,
} from '../constants/core-requirements';

export {
  AudienceContext,
  CanonicalContentMode,
  EditorialPillar,
  PresentationFormat,
  SkillLevel,
};

export type LearningUnitPlanningStatus = 'DRAFT' | 'SUBMITTED_FOR_VERIFICATION';

export type LearningUnitPlanningOperation = 'SAVE_DRAFT' | 'SUBMIT_FOR_VERIFICATION';

/**
 * The central educational asset representing verified core curriculum knowledge.
 * Adheres to Layer 1 (Knowledge Reference) and Layer 2 (Learning Design).
 */
export interface LearningUnit {
  /** Canonical collision-resistant identifier: lnu_<uuid> */
  id: string;

  /** Layer 1 — Two-Tier Taxonomy references */
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;

  /** Lesson title (e.g., "Calculate discounts and compare final prices") */
  title: string;

  /** What the viewer should understand or be able to do afterward (REQ-04, REQ-06) */
  learningObjective: string;

  /** Foundational skills or prerequisites needed before starting this lesson */
  prerequisiteSkills?: string[];

  /** Verified, step-by-step mathematical or analytical reasoning method */
  verifiedMethod: string;

  /** Exact verified calculation proof, equations, or reference values */
  correctCalculations?: string;

  /** Common mistakes, cognitive traps, or frequent misconceptions to warn against */
  commonMistakes?: string[];

  /** Real-life everyday situations or decisions where this skill applies */
  realLifeApplications?: string[];

  /** Specific relatable scenario (e.g., "Comparing 20% off vs ₹200 flat discount") */
  realLifeScenario?: string;

  /** Layer 2 — Learning Design Dimensions */
  skillLevel: SkillLevel;
  audienceContext?: AudienceContext;
  editorialPillar?: EditorialPillar;

  /** Suggested content modes appropriate for this lesson */
  suggestedModes?: CanonicalContentMode[];

  /** Primary initial presentation format (defaults to 'VIDEO') */
  primaryFormat?: PresentationFormat;

  /** Planning-only state; does not advance the canonical production workflow. */
  planningStatus?: LearningUnitPlanningStatus;

  /** Staff user ID who authored or verified the learning unit: usr_<uuid> */
  authorId: string;
  authorName?: string;

  /** Optimistic Concurrency Control (OCC) version */
  version: number;

  /** ISO 8601 UTC creation and mutation timestamps */
  createdAt: string;
  updatedAt: string;
}

/**
 * Input DTO for creating a new LearningUnit
 */
export interface CreateLearningUnitInput {
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;
  title: string;
  learningObjective: string;
  prerequisiteSkills?: string[];
  verifiedMethod: string;
  correctCalculations?: string;
  commonMistakes?: string[];
  realLifeApplications?: string[];
  realLifeScenario?: string;
  skillLevel: SkillLevel;
  audienceContext?: AudienceContext;
  editorialPillar?: EditorialPillar;
  suggestedModes?: CanonicalContentMode[];
  primaryFormat?: PresentationFormat;
  authorId: string;
  authorName?: string;
  planningStatus?: LearningUnitPlanningStatus;
}

/**
 * Input DTO for updating an existing LearningUnit
 */
export interface UpdateLearningUnitInput {
  topicId?: string;
  topicName?: string;
  subtopicId?: string;
  subtopicName?: string;
  title?: string;
  learningObjective?: string;
  prerequisiteSkills?: string[];
  verifiedMethod?: string;
  correctCalculations?: string;
  commonMistakes?: string[];
  realLifeApplications?: string[];
  realLifeScenario?: string;
  skillLevel?: SkillLevel;
  audienceContext?: AudienceContext;
  editorialPillar?: EditorialPillar;
  suggestedModes?: CanonicalContentMode[];
  primaryFormat?: PresentationFormat;
  planningStatus?: LearningUnitPlanningStatus;
  expectedVersion?: number;
}

export interface LearningUnitPlanningDto {
  id: string;
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;
  title: string;
  learningObjective: string;
  prerequisiteSkills?: string[];
  verifiedMethod: string;
  correctCalculations?: string;
  commonMistakes?: string[];
  realLifeApplications?: string[];
  realLifeScenario?: string;
  skillLevel: SkillLevel;
  audienceContext?: AudienceContext;
  editorialPillar?: EditorialPillar;
  suggestedModes?: CanonicalContentMode[];
  primaryFormat?: PresentationFormat;
  planningStatus: LearningUnitPlanningStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface LearningUnitPlanningResponse {
  learningUnit: LearningUnitPlanningDto;
  operation: LearningUnitPlanningOperation;
  workflowAdvanced: false;
}

/**
 * Lightweight summary of a LearningUnit for list views, selectors, and cards
 */
export interface LearningUnitSummary {
  id: string;
  title: string;
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;
  skillLevel: SkillLevel;
  audienceContext?: AudienceContext;
  editorialPillar?: EditorialPillar;
  updatedAt: string;
}
