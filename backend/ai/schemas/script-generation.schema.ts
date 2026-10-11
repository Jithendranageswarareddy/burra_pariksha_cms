/**
 * BURRA PARIKSHA CMS - AI Telugu Teleprompter Script Schema
 * Phase 6: Script Generation & Teleprompter Workspace
 * 
 * Defines strict Zod and GenAI response schemas for structured AI Telugu script generation.
 */

import { z } from 'zod';
import { SchemaType } from './question-candidate.schema';

/**
 * Zod Schema for server-side verification of AI Telugu script output.
 */
export const TeluguScriptZodSchema = z.object({
  hookText: z
    .string()
    .min(10, 'Hook text must be at least 10 characters')
    .max(500, 'Hook text exceeds maximum length'),
  problemStatement: z
    .string()
    .min(20, 'Problem statement must be at least 20 characters')
    .max(1500, 'Problem statement exceeds maximum length'),
  stepByStepSolution: z
    .string()
    .min(20, 'Solution must be at least 20 characters')
    .max(2000, 'Solution exceeds maximum length'),
  speedTrickOrTakeaway: z
    .string()
    .min(10, 'Speed trick must be at least 10 characters')
    .max(1000, 'Speed trick exceeds maximum length'),
  callToAction: z
    .string()
    .min(10, 'Call to action must be at least 10 characters')
    .max(500, 'Call to action exceeds maximum length'),
  notes: z.string().optional().default(''),
});

export type ValidatedScriptPayload = z.infer<typeof TeluguScriptZodSchema>;

/**
 * GenAI Structured Output Response Schema for @google/genai SDK.
 */
export const GenAiTeluguScriptResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    hookText: {
      type: SchemaType.STRING,
      description: 'Catchy 3-5 second conversational Telugu hook for short-form video (e.g. Instagram Reels / YouTube Shorts) that immediately hooks competitive exam aspirants.',
    },
    problemStatement: {
      type: SchemaType.STRING,
      description: 'The aptitude problem clearly explained in natural spoken Telugu, followed by all 4 options formatted with Telugu letters:\nఎ) <Option A>\nబి) <Option B>\nసి) <Option C>\nడి) <Option D>',
    },
    stepByStepSolution: {
      type: SchemaType.STRING,
      description: 'Clear, engaging spoken Telugu explanation revealing the correct option (e.g. సరైన సమాధానం ఆప్షన్...) with straightforward steps.',
    },
    speedTrickOrTakeaway: {
      type: SchemaType.STRING,
      description: '5-second mental math shortcut or exam trick in conversational Telugu (బుర్ర ట్రిక్) explaining how to eliminate wrong options or solve mentally.',
    },
    callToAction: {
      type: SchemaType.STRING,
      description: 'Spoken Telugu call to action encouraging viewer interaction (e.g., కామెంట్ చేయండి / షేర్ చేయండి / ఫాలో అవ్వండి).',
    },
    notes: {
      type: SchemaType.STRING,
      description: 'Production timing or teleprompter pacing notes.',
    },
  },
  required: [
    'hookText',
    'problemStatement',
    'stepByStepSolution',
    'speedTrickOrTakeaway',
    'callToAction',
  ],
};
