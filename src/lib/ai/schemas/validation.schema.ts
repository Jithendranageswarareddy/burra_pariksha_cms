/**
 * BURRA PARIKSHA CMS - Validation Response Schema
 * Phase 6: Multi-Model Validation Adapters & Consensus Integration
 */

import { SchemaType } from './question-candidate.schema';

/**
 * GenAI Structured Output Response Schema for Question Validation Provider.
 */
export const GenAiValidationResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    verdict: {
      type: SchemaType.STRING,
      enum: ['VALID', 'NEEDS_REVIEW', 'INVALID'],
      description: 'The overall validation verdict for the question.',
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: 'Confidence score between 0.0 and 1.0 in this validation verdict.',
    },
    reasoningSummary: {
      type: SchemaType.STRING,
      description: 'Concise summary explaining the reasoning behind the validation verdict.',
    },
    detectedIssues: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'List of specific flaws, ambiguities, or errors detected in the question.',
    },
    declaredAnswerCorrect: {
      type: SchemaType.BOOLEAN,
      description: 'Whether the declared correct answer option matches mathematical/logical reality.',
    },
    explanationIsClearAndAccurate: {
      type: SchemaType.BOOLEAN,
      description: 'Whether the step-by-step explanation is mathematically sound and logically clear.',
    },
  },
  required: ['verdict', 'confidence', 'reasoningSummary', 'detectedIssues'],
};
