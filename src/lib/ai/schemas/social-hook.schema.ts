/**
 * BURRA PARIKSHA CMS - AI Social Hook & Presentation Strategy Schema
 * Phase 8C: Multi-Hook & Presentation Strategy Engine
 * 
 * Defines strict Zod and GenAI response schemas for structured AI social media hook generation.
 */

import { z } from 'zod';
import { HookStyle } from '../../../types';
import { SchemaType } from './question-candidate.schema';

export const SocialHookVariantZodSchema = z.object({
  id: z.string(),
  style: z.nativeEnum(HookStyle),
  text: z.string().min(5, 'Hook text must be at least 5 characters').max(500),
  spokenTeluguText: z.string().min(5, 'Spoken text must be at least 5 characters').max(500),
  onScreenOverlayText: z.string().min(3, 'On-screen text must be at least 3 characters').max(200),
  estimatedDurationSeconds: z.number().min(1).max(15).default(5),
  rationale: z.string().optional().default(''),
});

export const SocialPresentationStrategyZodSchema = z.object({
  visualOpening: z.string().min(5, 'Visual opening description required'),
  onScreenTitleOverlay: z.string().min(3, 'Title overlay required'),
  questionRevealTimingMs: z.number().min(500).default(1500),
  optionRevealTimingMs: z.number().min(1000).default(8000),
  answerRevealTimingMs: z.number().min(5000).default(20000),
  explanationTimingMs: z.number().min(8000).default(25000),
  visualEmphasisNotes: z.string().default(''),
  diagramOrChartSuggestion: z.string().optional().default(''),
  pacingWpm: z.number().min(100).max(180).default(140),
});

export const SocialHookAndStrategyZodSchema = z.object({
  hooks: z.array(SocialHookVariantZodSchema).min(1, 'At least 1 hook variant required').max(5, 'Maximum 5 hook variants allowed'),
  presentationStrategy: SocialPresentationStrategyZodSchema,
});

export type ValidatedSocialHookPayload = z.infer<typeof SocialHookAndStrategyZodSchema>;

export const GenAiSocialHookResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    hooks: {
      type: SchemaType.ARRAY,
      description: 'Array of 1 to 5 structured hook variants tailored for short-form vertical videos.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: 'Hook identifier (e.g. HOOK-1, HOOK-CURIOSITY)' },
          style: {
            type: SchemaType.STRING,
            description: 'Hook style: CURIOSITY, BRAIN_CHALLENGE, SPEED_CHALLENGE, REAL_WORLD, or EXAM_CHALLENGE',
          },
          text: { type: SchemaType.STRING, description: 'Hook text in target language' },
          spokenTeluguText: { type: SchemaType.STRING, description: 'Natural spoken Telugu narration for the hook' },
          onScreenOverlayText: { type: SchemaType.STRING, description: 'Short bold text overlay for first 3 seconds of video' },
          estimatedDurationSeconds: { type: SchemaType.INTEGER, description: 'Estimated hook duration in seconds (3 to 7s)' },
          rationale: { type: SchemaType.STRING, description: 'Brief pedagogical rationale for this hook variant' },
        },
        required: ['id', 'style', 'text', 'spokenTeluguText', 'onScreenOverlayText', 'estimatedDurationSeconds'],
      },
    },
    presentationStrategy: {
      type: SchemaType.OBJECT,
      description: 'Structured short-form video presentation plan.',
      properties: {
        visualOpening: { type: SchemaType.STRING, description: 'Description of opening scene visual style' },
        onScreenTitleOverlay: { type: SchemaType.STRING, description: 'Primary bold title card overlay' },
        questionRevealTimingMs: { type: SchemaType.INTEGER, description: 'Timestamp in ms when question appears' },
        optionRevealTimingMs: { type: SchemaType.INTEGER, description: 'Timestamp in ms when options A/B/C/D appear' },
        answerRevealTimingMs: { type: SchemaType.INTEGER, description: 'Timestamp in ms when correct answer is revealed' },
        explanationTimingMs: { type: SchemaType.INTEGER, description: 'Timestamp in ms when explanation/trick begins' },
        visualEmphasisNotes: { type: SchemaType.STRING, description: 'Color highlights and diagram emphasis notes' },
        diagramOrChartSuggestion: { type: SchemaType.STRING, description: 'Suggested visual diagram or graphic' },
        pacingWpm: { type: SchemaType.INTEGER, description: 'Target teleprompter reading speed in WPM (e.g. 140)' },
      },
      required: [
        'visualOpening',
        'onScreenTitleOverlay',
        'questionRevealTimingMs',
        'optionRevealTimingMs',
        'answerRevealTimingMs',
        'explanationTimingMs',
        'visualEmphasisNotes',
        'pacingWpm',
      ],
    },
  },
  required: ['hooks', 'presentationStrategy'],
};
