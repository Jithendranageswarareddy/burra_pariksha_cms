/**
 * BURRA PARIKSHA CMS - Social Metadata Schemas
 * Phase 8E: Social Caption / Hashtag / Metadata Generator
 */

import { Schema, Type } from '@google/genai';
import { z } from 'zod';

export const SocialMetadataGenAISchema: Schema = {
  type: Type.OBJECT,
  properties: {
    shortTitle: {
      type: Type.STRING,
      description: 'Short video headline/title (max 60 chars)',
    },
    socialCaption: {
      type: Type.STRING,
      description: 'Concise social media caption (max 280 chars)',
    },
    extendedDescription: {
      type: Type.STRING,
      description: 'Detailed social description with context (max 1000 chars)',
    },
    hashtags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '5 to 8 relevant hashtags including #BurraPariksha',
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '5 to 10 search indexing keywords',
    },
    topicLabel: {
      type: Type.STRING,
      description: 'Display label for topic',
    },
    subtopicLabel: {
      type: Type.STRING,
      description: 'Display label for subtopic',
    },
    difficultyLabel: {
      type: Type.STRING,
      description: 'Display label for difficulty',
    },
    challengeTypeLabel: {
      type: Type.STRING,
      description: 'Display label for challenge type',
    },
    cta: {
      type: Type.OBJECT,
      properties: {
        primaryText: {
          type: Type.STRING,
          description: 'Primary call to action text (e.g., Comment your answer below! 👇)',
        },
        pinnedCommentPrompt: {
          type: Type.STRING,
          description: 'Prompt for pinned comment engagement',
        },
      },
      required: ['primaryText', 'pinnedCommentPrompt'],
    },
  },
  required: [
    'shortTitle',
    'socialCaption',
    'extendedDescription',
    'hashtags',
    'keywords',
    'topicLabel',
    'subtopicLabel',
    'difficultyLabel',
    'challengeTypeLabel',
    'cta',
  ],
};

export const SocialMetadataZodSchema = z.object({
  shortTitle: z.string().min(2, 'Title required').max(120, 'Title too long'),
  socialCaption: z.string().min(5, 'Caption required').max(500, 'Caption too long'),
  extendedDescription: z.string().min(5, 'Description required').max(1500, 'Description too long'),
  hashtags: z
    .array(z.string())
    .min(3, 'At least 3 hashtags required')
    .max(15, 'Maximum 15 hashtags allowed'),
  keywords: z
    .array(z.string())
    .min(3, 'At least 3 keywords required')
    .max(20, 'Maximum 20 keywords allowed'),
  topicLabel: z.string().optional().default('General Aptitude'),
  subtopicLabel: z.string().optional().default('Problem Solving'),
  difficultyLabel: z.string().optional().default('MEDIUM'),
  challengeTypeLabel: z.string().optional().default('SPEED_MATH'),
  cta: z.object({
    primaryText: z.string().min(2).default('Comment your answer below! 👇'),
    pinnedCommentPrompt: z.string().min(2).default('What option did you get — A, B, C, or D? Let us know!'),
  }),
});

export type SocialMetadataAIResult = z.infer<typeof SocialMetadataZodSchema>;
