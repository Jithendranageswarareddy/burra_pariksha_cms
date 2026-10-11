/**
 * BURRA PARIKSHA CMS - AI Thumbnail Intelligence Schema
 * Phase 18: AI Thumbnail Intelligence
 * 
 * Defines strict Zod and GenAI response schemas for structured AI thumbnail concept generation.
 */

import { z } from 'zod';
import { SchemaType } from './question-candidate.schema';

export const AiThumbnailConceptZodSchema = z.object({
  conceptName: z.string().min(3).max(100),
  abVariant: z.string().min(1).max(5),
  hookHeadline: z.string().min(3).max(65),
  curiosityFraming: z.object({
    curiosityAngle: z.string().min(5).max(300),
    psychologicalTrigger: z.string().min(3).max(200),
    hypothesis: z.string().min(10).max(500),
  }),
  visualDirection: z.object({
    composition: z.string().min(10).max(400),
    colorPalette: z.array(z.string()).min(2).max(6),
    focalPoint: z.string().min(5).max(300),
    emotionOrExpression: z.string().min(5).max(200),
    brandingElements: z.string().min(5).max(300),
  }),
  audienceTargeting: z.object({
    primaryAudience: z.string().min(5).max(200),
    secondaryAudience: z.string().min(5).max(200),
    languageStyle: z.enum(['TELUGU', 'ENGLISH', 'BILINGUAL']),
    difficultyPerception: z.enum(['LOOKS_EASY_BUT_HARD', 'CHALLENGE_FOR_GENIUSES', 'FAST_TRICK']),
  }),
  notes: z.string().optional().default(''),
});

export const AiThumbnailIntelligenceResponseZodSchema = z.object({
  concepts: z.array(AiThumbnailConceptZodSchema).min(1).max(5),
});

export type ValidatedThumbnailConceptsPayload = z.infer<typeof AiThumbnailIntelligenceResponseZodSchema>;

export const GenAiThumbnailIntelligenceResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    concepts: {
      type: SchemaType.ARRAY,
      description: 'Array of 2 to 3 diverse A/B thumbnail concept variants optimized for mobile YouTube Shorts.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          conceptName: { type: SchemaType.STRING, description: 'Descriptive name of concept (e.g. "Concept A - High Stakes Ego Trap")' },
          abVariant: { type: SchemaType.STRING, description: 'Variant letter (e.g. "A", "B", "C")' },
          hookHeadline: { type: SchemaType.STRING, description: 'Short punchy text overlay on thumbnail (3 to 6 words max, never reveal the answer)' },
          curiosityFraming: {
            type: SchemaType.OBJECT,
            properties: {
              curiosityAngle: { type: SchemaType.STRING, description: 'Angle of curiosity (e.g. Counter-intuitive logic)' },
              psychologicalTrigger: { type: SchemaType.STRING, description: 'Psychological motivator (e.g. Ego challenge, FOMO, Speed test)' },
              hypothesis: { type: SchemaType.STRING, description: 'Conceptual reasoning for engagement potential without claiming actual CTR metrics' },
            },
            required: ['curiosityAngle', 'psychologicalTrigger', 'hypothesis'],
          },
          visualDirection: {
            type: SchemaType.OBJECT,
            properties: {
              composition: { type: SchemaType.STRING, description: 'Layout composition for 9:16 vertical shorts thumbnail' },
              colorPalette: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
                description: 'High-contrast hex color codes'
              },
              focalPoint: { type: SchemaType.STRING, description: 'Primary focal element' },
              emotionOrExpression: { type: SchemaType.STRING, description: 'Presenter expression / emotional hook' },
              brandingElements: { type: SchemaType.STRING, description: 'Burra Pariksha branding placement' },
            },
            required: ['composition', 'colorPalette', 'focalPoint', 'emotionOrExpression', 'brandingElements'],
          },
          audienceTargeting: {
            type: SchemaType.OBJECT,
            properties: {
              primaryAudience: { type: SchemaType.STRING, description: 'Primary target audience segment' },
              secondaryAudience: { type: SchemaType.STRING, description: 'Secondary target audience segment' },
              languageStyle: { type: SchemaType.STRING, description: 'TELUGU, ENGLISH, or BILINGUAL' },
              difficultyPerception: { type: SchemaType.STRING, description: 'LOOKS_EASY_BUT_HARD, CHALLENGE_FOR_GENIUSES, or FAST_TRICK' },
            },
            required: ['primaryAudience', 'secondaryAudience', 'languageStyle', 'difficultyPerception'],
          },
          notes: { type: SchemaType.STRING, description: 'Additional designer or production notes' },
        },
        required: ['conceptName', 'abVariant', 'hookHeadline', 'curiosityFraming', 'visualDirection', 'audienceTargeting'],
      },
    },
  },
  required: ['concepts'],
};
