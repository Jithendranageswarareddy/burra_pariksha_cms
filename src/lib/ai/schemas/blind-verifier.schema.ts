/**
 * BURRA PARIKSHA CMS - Blind Verifier Schema
 * Phase 22.3: Blind Independent Verifier Architecture (Option C)
 * 
 * Defines strict Zod and GenAI structured output schemas for independent blind solving.
 */

import { z } from 'zod';
import { SchemaType } from './question-candidate.schema';

/**
 * Zod Schema for validating raw model output from the blind verifier.
 * Strictly enforces that the model acts as an examinee/solver rather than an approval arbiter.
 */
export const BlindVerifierOutputZodSchema = z.object({
  solvedOption: z.enum(['A', 'B', 'C', 'D', 'UNSOLVABLE', 'MULTIPLE']),
  derivedValue: z.string().optional(),
  independentProof: z
    .string()
    .min(5, 'Independent proof must contain substantive reasoning steps')
    .max(5000, 'Independent proof exceeds 5000 characters limit'),
  confidence: z
    .number()
    .min(0, 'Confidence cannot be less than 0.0')
    .max(1, 'Confidence cannot exceed 1.0'),
  isSolvable: z.boolean(),
  hasMultipleValidOptions: z.boolean(),
  validOptions: z.array(z.enum(['A', 'B', 'C', 'D'])).optional(),
  notes: z.string().optional(),
});

export type ValidatedBlindVerifierOutput = z.infer<typeof BlindVerifierOutputZodSchema>;

/**
 * GenAI Structured Output Response Schema for @google/genai SDK.
 */
export const GenAiBlindVerifierResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    solvedOption: {
      type: SchemaType.STRING,
      enum: ['A', 'B', 'C', 'D', 'UNSOLVABLE', 'MULTIPLE'],
      description: 'The single option derived from independent calculation (A, B, C, or D). If missing necessary constraints, output UNSOLVABLE. If multiple options are equally correct, output MULTIPLE.',
    },
    derivedValue: {
      type: SchemaType.STRING,
      description: 'The raw mathematical or logical value derived (e.g., "48 km/h", "20 seconds", "15 days").',
    },
    independentProof: {
      type: SchemaType.STRING,
      description: 'Complete, step-by-step mathematical proof or deductive logical reasoning derived independently without looking at hints.',
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: 'Confidence score from 0.0 to 1.0 in the mathematical derivation and selected option.',
    },
    isSolvable: {
      type: SchemaType.BOOLEAN,
      description: 'Whether the problem statement contains sufficient, unambiguous information to be solved definitively.',
    },
    hasMultipleValidOptions: {
      type: SchemaType.BOOLEAN,
      description: 'Whether more than one of the 4 provided options is mathematically or logically defensible.',
    },
    validOptions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
      description: 'List of all option letters (A, B, C, D) that satisfy the problem statement, if multiple.',
    },
    notes: {
      type: SchemaType.STRING,
      description: 'Concise observations regarding premise clarity, potential traps, or linguistic nuances.',
    },
  },
  required: ['solvedOption', 'independentProof', 'confidence', 'isSolvable', 'hasMultipleValidOptions'],
};
