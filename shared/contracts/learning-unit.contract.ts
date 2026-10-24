/**
 * BURRA PARIKSHA CMS — Verified Learning Unit Validation Contracts & Schemas
 * Location: shared/contracts/learning-unit.contract.ts
 *
 * Source of Truth: docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md
 * Architectural Decision: ADR-015 (docs/architecture/DECISION-LOG.md)
 *
 * Provides runtime validation for:
 * - Canonical & Supported Content Modes (with legacy alias compatibility)
 * - Five Presentation Formats
 * - Seven Audience Contexts
 * - Four Skill Levels
 * - Initial Editorial Pillars A–F
 * - LearningUnit entities, creation inputs, and update mutations
 */

import { z } from 'zod';
import {
  AUDIENCE_CONTEXTS,
  AudienceContext,
  CANONICAL_CONTENT_MODES,
  CanonicalContentMode,
  EDITORIAL_PILLARS,
  EditorialPillar,
  PRESENTATION_FORMATS,
  PresentationFormat,
  SKILL_LEVELS,
  SkillLevel,
  SUPPORTED_CONTENT_MODES,
  SupportedContentMode,
  resolveCanonicalContentMode,
} from '../constants/core-requirements';
import {
  CreateLearningUnitInput,
  LearningUnit,
  UpdateLearningUnitInput,
} from '../types/learning-unit';
import { LearningUnitPlanningStatus } from '../types/learning-unit';

// ============================================================================
// 1. ATOMIC VALUE SCHEMAS
// ============================================================================

export const CanonicalContentModeSchema = z.enum(
  CANONICAL_CONTENT_MODES as unknown as [CanonicalContentMode, ...CanonicalContentMode[]]
);

export const SupportedContentModeSchema = z.enum(
  SUPPORTED_CONTENT_MODES as unknown as [SupportedContentMode, ...SupportedContentMode[]]
);

export const PresentationFormatSchema = z.enum(
  PRESENTATION_FORMATS as unknown as [PresentationFormat, ...PresentationFormat[]]
);

export const AudienceContextSchema = z.enum(
  AUDIENCE_CONTEXTS as unknown as [AudienceContext, ...AudienceContext[]]
);

export const SkillLevelSchema = z.enum(
  SKILL_LEVELS as unknown as [SkillLevel, ...SkillLevel[]]
);

export const EditorialPillarSchema = z.enum(
  EDITORIAL_PILLARS as unknown as [EditorialPillar, ...EditorialPillar[]]
);

export const LearningUnitPlanningStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED_FOR_VERIFICATION',
] as const);

// ============================================================================
// 2. LEARNING UNIT SCHEMAS
// ============================================================================

export const LearningUnitSchema = z.object({
  id: z.string().min(1, 'Learning Unit ID is required'),
  topicId: z.string().min(1, 'Topic ID is required'),
  topicName: z.string().optional(),
  subtopicId: z.string().min(1, 'Subtopic ID is required'),
  subtopicName: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  learningObjective: z.string().min(10, 'Learning objective must clearly state what the viewer will understand or be able to do'),
  prerequisiteSkills: z.array(z.string().min(1)).optional(),
  verifiedMethod: z.string().min(10, 'Verified method must provide a step-by-step problem-solving explanation'),
  correctCalculations: z.string().optional(),
  commonMistakes: z.array(z.string().min(1)).optional(),
  realLifeApplications: z.array(z.string().min(1)).optional(),
  realLifeScenario: z.string().optional(),
  skillLevel: SkillLevelSchema,
  audienceContext: AudienceContextSchema.optional(),
  editorialPillar: EditorialPillarSchema.optional(),
  suggestedModes: z.array(CanonicalContentModeSchema).optional(),
  primaryFormat: PresentationFormatSchema.default('VIDEO').optional(),
  planningStatus: LearningUnitPlanningStatusSchema.optional(),
  authorId: z.string().min(1, 'Author ID is required'),
  authorName: z.string().optional(),
  version: z.number().int().min(1, 'Version must be an integer >= 1'),
  createdAt: z.string().min(1, 'Creation timestamp is required'),
  updatedAt: z.string().min(1, 'Updated timestamp is required'),
});

export const CreateLearningUnitSchema = z.object({
  topicId: z.string().min(1, 'Topic ID is required'),
  topicName: z.string().optional(),
  subtopicId: z.string().min(1, 'Subtopic ID is required'),
  subtopicName: z.string().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  learningObjective: z.string().min(10, 'Learning objective must clearly state what the viewer will understand or be able to do'),
  prerequisiteSkills: z.array(z.string().min(1)).optional(),
  verifiedMethod: z.string().min(10, 'Verified method must provide a step-by-step problem-solving explanation'),
  correctCalculations: z.string().optional(),
  commonMistakes: z.array(z.string().min(1)).optional(),
  realLifeApplications: z.array(z.string().min(1)).optional(),
  realLifeScenario: z.string().optional(),
  skillLevel: SkillLevelSchema,
  audienceContext: AudienceContextSchema.optional(),
  editorialPillar: EditorialPillarSchema.optional(),
  suggestedModes: z.array(CanonicalContentModeSchema).optional(),
  primaryFormat: PresentationFormatSchema.default('VIDEO').optional(),
  planningStatus: LearningUnitPlanningStatusSchema.default('DRAFT').optional(),
  authorId: z.string().min(1, 'Author ID is required'),
  authorName: z.string().optional(),
});

export const UpdateLearningUnitSchema = z.object({
  topicId: z.string().min(1).optional(),
  topicName: z.string().optional(),
  subtopicId: z.string().min(1).optional(),
  subtopicName: z.string().optional(),
  title: z.string().min(3).optional(),
  learningObjective: z.string().min(10).optional(),
  prerequisiteSkills: z.array(z.string().min(1)).optional(),
  verifiedMethod: z.string().min(10).optional(),
  correctCalculations: z.string().optional(),
  commonMistakes: z.array(z.string().min(1)).optional(),
  realLifeApplications: z.array(z.string().min(1)).optional(),
  realLifeScenario: z.string().optional(),
  skillLevel: SkillLevelSchema.optional(),
  audienceContext: AudienceContextSchema.optional(),
  editorialPillar: EditorialPillarSchema.optional(),
  suggestedModes: z.array(CanonicalContentModeSchema).optional(),
  primaryFormat: PresentationFormatSchema.optional(),
  planningStatus: LearningUnitPlanningStatusSchema.optional(),
  expectedVersion: z.number().int().min(1).optional(),
});

// ============================================================================
// 3. VALIDATION HELPER FUNCTIONS
// ============================================================================

export function validateLearningUnit(data: unknown): { isValid: boolean; data?: LearningUnit; errors?: string[] } {
  const result = LearningUnitSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, data: result.data as LearningUnit };
  }
  return {
    isValid: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}

export function validateCreateLearningUnitInput(data: unknown): { isValid: boolean; data?: CreateLearningUnitInput; errors?: string[] } {
  const result = CreateLearningUnitSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, data: result.data as CreateLearningUnitInput };
  }
  return {
    isValid: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}

export function validateUpdateLearningUnitInput(data: unknown): { isValid: boolean; data?: UpdateLearningUnitInput; errors?: string[] } {
  const result = UpdateLearningUnitSchema.safeParse(data);
  if (result.success) {
    return { isValid: true, data: result.data as UpdateLearningUnitInput };
  }
  return {
    isValid: false,
    errors: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  };
}

export type { LearningUnitPlanningStatus };
