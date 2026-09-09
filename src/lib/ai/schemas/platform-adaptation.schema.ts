/**
 * BURRA PARIKSHA CMS - Platform Adaptation Schemas
 * Phase 8F: Multi-Platform Adaptation Engine
 */

import { Schema, Type } from '@google/genai';
import { z } from 'zod';

export const PlatformAdaptedVariantGenAISchema: Schema = {
  type: Type.OBJECT,
  properties: {
    youtubeShorts: {
      type: Type.OBJECT,
      properties: {
        title: {
          type: Type.STRING,
          description: 'YouTube Shorts title (max 100 chars, concise & engaging)',
        },
        description: {
          type: Type.STRING,
          description: 'YouTube Shorts description with context and CTA (max 5000 chars)',
        },
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Up to 5 hashtags including #BurraPariksha',
        },
        keywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Search keywords',
        },
        primaryCta: {
          type: Type.STRING,
          description: 'Primary CTA for description',
        },
        pinnedCommentPrompt: {
          type: Type.STRING,
          description: 'Engagement prompt for pinned comment',
        },
      },
      required: ['title', 'description', 'hashtags', 'keywords', 'primaryCta', 'pinnedCommentPrompt'],
    },
    instagramReels: {
      type: Type.OBJECT,
      properties: {
        caption: {
          type: Type.STRING,
          description: 'Instagram Reels combined caption with headline, body, CTA, and hashtags (max 2200 chars)',
        },
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Up to 8 hashtags including #BurraPariksha',
        },
        keywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Search keywords',
        },
        primaryCta: {
          type: Type.STRING,
          description: 'Primary CTA in caption',
        },
        commentPrompt: {
          type: Type.STRING,
          description: 'Comment engagement prompt',
        },
      },
      required: ['caption', 'hashtags', 'keywords', 'primaryCta', 'commentPrompt'],
    },
    facebookReels: {
      type: Type.OBJECT,
      properties: {
        caption: {
          type: Type.STRING,
          description: 'Facebook Reels combined caption with headline, body, CTA, and hashtags (max 2000 chars)',
        },
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Up to 5 hashtags including #BurraPariksha',
        },
        keywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Search keywords',
        },
        primaryCta: {
          type: Type.STRING,
          description: 'Primary inline CTA',
        },
      },
      required: ['caption', 'hashtags', 'keywords', 'primaryCta'],
    },
  },
  required: ['youtubeShorts', 'instagramReels', 'facebookReels'],
};

export const PlatformAdaptedVariantZodSchema = z.object({
  youtubeShorts: z.object({
    title: z.string().min(2).max(120),
    description: z.string().min(5).max(5200),
    hashtags: z.array(z.string()).min(1).max(10),
    keywords: z.array(z.string()).min(1).max(15),
    primaryCta: z.string().min(2),
    pinnedCommentPrompt: z.string().min(2),
  }),
  instagramReels: z.object({
    caption: z.string().min(5).max(2400),
    hashtags: z.array(z.string()).min(1).max(15),
    keywords: z.array(z.string()).min(1).max(15),
    primaryCta: z.string().min(2),
    commentPrompt: z.string().min(2),
  }),
  facebookReels: z.object({
    caption: z.string().min(5).max(2200),
    hashtags: z.array(z.string()).min(1).max(10),
    keywords: z.array(z.string()).min(1).max(15),
    primaryCta: z.string().min(2),
  }),
});
