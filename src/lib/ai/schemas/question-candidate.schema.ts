/**
 * BURRA PARIKSHA CMS - AI Question Schema
 * Phase 4: Gemini AI Question Studio
 * 
 * Defines strict Zod and GenAI response schemas for structured AI candidate output.
 */

import { z } from 'zod';
import { DifficultyLevel, QuestionLanguage } from '../../../types';

export enum SchemaType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
}

/**
 * Zod Schema for server-side verification of AI candidate output.
 */
export const QuestionCandidateZodSchema = z.object({
  content: z
    .string()
    .min(15, 'Question statement must be at least 15 characters long')
    .max(1000, 'Question statement exceeds maximum 1000 characters limit'),
  option_a: z.string().min(1, 'Option A is required').max(300, 'Option A exceeds 300 characters'),
  option_b: z.string().min(1, 'Option B is required').max(300, 'Option B exceeds 300 characters'),
  option_c: z.string().min(1, 'Option C is required').max(300, 'Option C exceeds 300 characters'),
  option_d: z.string().min(1, 'Option D is required').max(300, 'Option D exceeds 300 characters'),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z
    .string()
    .min(20, 'Pedagogical explanation must be at least 20 characters long')
    .max(2500, 'Explanation exceeds maximum 2500 characters limit'),
  difficulty: z.nativeEnum(DifficultyLevel).default(DifficultyLevel.MEDIUM),
  language: z.nativeEnum(QuestionLanguage).default(QuestionLanguage.ENGLISH),
  real_world_context: z.string().optional().default(''),
  question_style: z.string().optional().default(''),
});

export type ValidatedCandidatePayload = z.infer<typeof QuestionCandidateZodSchema>;

/**
 * GenAI Structured Output Response Schema for @google/genai SDK.
 */
export const GenAiQuestionCandidateResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    content: {
      type: SchemaType.STRING,
      description: 'The complete, precise problem statement of the aptitude question.',
    },
    option_a: {
      type: SchemaType.STRING,
      description: 'Option A value or text.',
    },
    option_b: {
      type: SchemaType.STRING,
      description: 'Option B value or text.',
    },
    option_c: {
      type: SchemaType.STRING,
      description: 'Option C value or text.',
    },
    option_d: {
      type: SchemaType.STRING,
      description: 'Option D value or text.',
    },
    correct_answer: {
      type: SchemaType.STRING,
      enum: ['A', 'B', 'C', 'D'],
      description: 'The single strictly correct option (must be exactly A, B, C, or D).',
    },
    explanation: {
      type: SchemaType.STRING,
      description: 'Step-by-step mathematical reasoning, verification of the calculation, and speed trick or shortcut formula.',
    },
    difficulty: {
      type: SchemaType.STRING,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      description: 'The verified difficulty tier of this aptitude question.',
    },
    language: {
      type: SchemaType.STRING,
      enum: ['ENGLISH', 'TELUGU'],
      description: 'The target language used in the question statement and options.',
    },
    real_world_context: {
      type: SchemaType.STRING,
      description: 'The real-world scenario or practical situation used as the question theme.',
    },
    question_style: {
      type: SchemaType.STRING,
      description: 'The stylistic category or pedagogical angle of the question.',
    },
  },
  required: [
    'content',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_answer',
    'explanation',
    'difficulty',
    'language',
  ],
};
