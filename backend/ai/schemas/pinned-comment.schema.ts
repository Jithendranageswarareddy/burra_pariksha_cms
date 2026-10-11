/**
 * BURRA PARIKSHA CMS - AI Pinned Comment & Conversation Schema
 * Phase 19: Pinned Comment & Conversation Intelligence
 * 
 * Defines strict Zod and GenAI response schemas for structured AI pinned comment packages.
 */

import { z } from 'zod';
import { SchemaType } from './question-candidate.schema';

export const AiPinnedCommentPackageZodSchema = z.object({
  pinnedComment: z.string().min(25).max(2000),
  answerDiscussionPrompt: z.string().min(15).max(800),
  followUpQuestions: z.array(z.string().min(10).max(400)).min(1).max(5),
  audienceParticipationPrompt: z.string().min(10).max(800),
  notes: z.string().optional().default(''),
});

export type ValidatedPinnedCommentPackagePayload = z.infer<typeof AiPinnedCommentPackageZodSchema>;

export const GenAiPinnedCommentPackageResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    pinnedComment: {
      type: SchemaType.STRING,
      description: 'The main formatted YouTube pinned comment text with emojis, curiosity hook, educational hints or spoiler-guarded breakdown, and community prompt.',
    },
    answerDiscussionPrompt: {
      type: SchemaType.STRING,
      description: 'Prompt inviting viewers to explain their calculation or compare options without spoiling the answer.',
    },
    followUpQuestions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Array of 1 to 3 follow-up challenge questions extending the original mathematical or logical puzzle.',
    },
    audienceParticipationPrompt: {
      type: SchemaType.STRING,
      description: 'Call-to-action specifically designed for audience interaction (e.g. comment your solving time, vote between methods, or challenge friends).',
    },
    notes: {
      type: SchemaType.STRING,
      description: 'Pedagogical, engagement, or community notes.',
    },
  },
  required: ['pinnedComment', 'answerDiscussionPrompt', 'followUpQuestions', 'audienceParticipationPrompt'],
};
