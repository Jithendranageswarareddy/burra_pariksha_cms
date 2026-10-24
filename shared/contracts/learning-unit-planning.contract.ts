import { z } from 'zod';
import {
  CreateLearningUnitSchema,
  UpdateLearningUnitSchema,
} from './learning-unit.contract';

export const LearningUnitPlanningOperationSchema = z.enum([
  'SAVE_DRAFT',
  'SUBMIT_FOR_VERIFICATION',
] as const);

export const CreateLearningUnitPlanningRequestSchema = CreateLearningUnitSchema
  .omit({ authorId: true, authorName: true })
  .extend({ operation: z.literal('SAVE_DRAFT') });

export const UpdateLearningUnitPlanningRequestSchema = UpdateLearningUnitSchema
  .omit({ expectedVersion: true, planningStatus: true })
  .extend({
    operation: z.literal('SAVE_DRAFT'),
    expectedVersion: z.number().int().min(1),
  });

export const SubmitLearningUnitForVerificationRequestSchema = z.object({
  expectedVersion: z.number().int().min(1),
  operation: z.literal('SUBMIT_FOR_VERIFICATION').optional(),
});

export const LearningUnitPlanningFilterSchema = z.object({
  search: z.string().optional(),
  topicId: z.string().optional(),
  subtopicId: z.string().optional(),
  skillLevel: z.string().optional(),
  audienceContext: z.string().optional(),
  editorialPillar: z.string().optional(),
  authorId: z.string().optional(),
  primaryFormat: z.string().optional(),
});

export type CreateLearningUnitPlanningRequest = z.infer<typeof CreateLearningUnitPlanningRequestSchema>;
export type UpdateLearningUnitPlanningRequest = z.infer<typeof UpdateLearningUnitPlanningRequestSchema>;
export type SubmitLearningUnitForVerificationRequest = z.infer<typeof SubmitLearningUnitForVerificationRequestSchema>;
