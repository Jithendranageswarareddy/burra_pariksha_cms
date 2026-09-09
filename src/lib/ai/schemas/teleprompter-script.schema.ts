/**
 * BURRA PARIKSHA CMS - Teleprompter & Spoken Script Response Schema
 * Phase 8D: Teleprompter / Spoken Telugu Enhancer
 * 
 * Defines Zod runtime validation and Gemini GenAI response schemas for teleprompter scripts.
 */

import { z } from 'zod';
import { SchemaType } from './question-candidate.schema';

export const TeleprompterSegmentSectionEnum = z.enum([
  'HOOK',
  'HOOK_TRANSITION',
  'QUESTION',
  'OPTIONS',
  'PAUSE_CHALLENGE',
  'SOLUTION',
  'SPEED_TRICK',
  'CTA',
]);

export const TeleprompterSegmentZodSchema = z.object({
  id: z.string(),
  section: TeleprompterSegmentSectionEnum,
  spokenText: z.string().min(2, 'Spoken text required').max(500),
  teleprompterText: z.string().min(2, 'Teleprompter text required').max(500),
  estimatedDurationSeconds: z.number().min(1).max(30).default(5),
  pauseDurationSeconds: z.number().min(0).max(10).optional().default(0),
  pauseAfterMs: z.number().min(0).max(5000).optional().default(0),
  emphasisWords: z.array(z.string()).optional().default([]),
  visualCardPrompt: z.string().optional().default(''),
  onScreenText: z.string().optional().default(''),
  onScreenOverlay: z.string().optional().default(''),
});

export const TeleprompterScriptZodSchema = z.object({
  pacingWpm: z.number().min(100).max(180).default(140),
  totalEstimatedDurationSeconds: z.number().min(1).max(120).default(45),
  segments: z
    .array(TeleprompterSegmentZodSchema)
    .min(1, 'At least 1 segment required')
    .max(10, 'Maximum 10 segments allowed'),
});

export type ValidatedTeleprompterScriptPayload = z.infer<typeof TeleprompterScriptZodSchema>;

export const GenAiTeleprompterScriptResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    pacingWpm: {
      type: SchemaType.INTEGER,
      description: 'Target teleprompter reading speed in WPM (100 to 180, default ~140)',
    },
    totalEstimatedDurationSeconds: {
      type: SchemaType.INTEGER,
      description: 'Total video narration duration in seconds (30-60s)',
    },
    segments: {
      type: SchemaType.ARRAY,
      description: 'Ordered sequence of 5 to 10 teleprompter narration segments (HOOK -> CTA)',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'Segment identifier (e.g. SEG-1, SEG-HOOK)' },
          section: {
            type: SchemaType.STRING,
            description: 'Segment section: HOOK, HOOK_TRANSITION, QUESTION, OPTIONS, PAUSE_CHALLENGE, SOLUTION, SPEED_TRICK, or CTA',
          },
          spokenText: { type: SchemaType.STRING, description: 'Natural spoken narration spoken aloud by presenter' },
          teleprompterText: { type: SchemaType.STRING, description: 'Presenter-readable display text formatted for teleprompter' },
          estimatedDurationSeconds: { type: SchemaType.INTEGER, description: 'Estimated segment duration in seconds' },
          pauseAfterMs: { type: SchemaType.INTEGER, description: 'Pause after segment in milliseconds (0 to 5000ms)' },
          emphasisWords: {
            type: SchemaType.ARRAY,
            description: 'Key words to emphasize vocally or visually',
            items: { type: SchemaType.STRING },
          },
          onScreenOverlay: { type: SchemaType.STRING, description: 'Short text overlay for video editor' },
        },
        required: ['id', 'section', 'spokenText', 'teleprompterText', 'estimatedDurationSeconds'],
      },
    },
  },
  required: ['pacingWpm', 'totalEstimatedDurationSeconds', 'segments'],
};
