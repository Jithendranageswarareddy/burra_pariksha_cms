/**
 * BURRA PARIKSHA CMS - Performance Intelligence GenAI Schema & Zod Validators
 * Phase 28: AI Social Performance Intelligence Schema
 */

import { Schema, Type } from '@google/genai';
import { z } from 'zod';

export const PerformanceIntelligenceGenAISchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallVerdict: {
      type: Type.STRING,
      description: 'High-level synthesis of social content performance across platforms and dimensions.',
    },
    topPerformingDimensions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dimension: { type: Type.STRING, description: 'Dimension type e.g. Topic, Platform, Difficulty' },
          value: { type: Type.STRING, description: 'Dimension value e.g. TELUGU, youtube_shorts, HARD' },
          sampleSize: { type: Type.NUMBER, description: 'Number of analyzed content items in sample' },
          avgViews: { type: Type.NUMBER, description: 'Average views for this dimension' },
          avgRetention: { type: Type.NUMBER, description: 'Average retention rate percentage' },
          avgCtr: { type: Type.NUMBER, description: 'Average CTR percentage' },
          reason: { type: Type.STRING, description: 'Evidence-backed reason for top performance' },
        },
        required: ['dimension', 'value', 'sampleSize', 'avgViews', 'avgRetention', 'avgCtr', 'reason'],
      },
    },
    underperformingDimensions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dimension: { type: Type.STRING },
          value: { type: Type.STRING },
          sampleSize: { type: Type.NUMBER },
          avgViews: { type: Type.NUMBER },
          avgRetention: { type: Type.NUMBER },
          avgCtr: { type: Type.NUMBER },
          reason: { type: Type.STRING, description: 'Evidence-backed reason for underperformance' },
        },
        required: ['dimension', 'value', 'sampleSize', 'avgViews', 'avgRetention', 'avgCtr', 'reason'],
      },
    },
    platformSpecificRecommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING, description: 'Target platform e.g. youtube_shorts, instagram_reels' },
          sampleSize: { type: Type.NUMBER },
          keyTakeaways: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          recommendedActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['platform', 'sampleSize', 'keyTakeaways', 'recommendedActions'],
      },
    },
    contentStrategyRecommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING, description: 'Focus area e.g. Hook Style, Topic Mix, Difficulty Pacing' },
          recommendation: { type: Type.STRING, description: 'Specific actionable recommendation' },
          supportingEvidence: { type: Type.STRING, description: 'Concrete evidence referencing metrics/samples' },
          sampleSize: { type: Type.NUMBER, description: 'Sample size supporting recommendation' },
          confidenceLevel: { type: Type.STRING, description: 'HIGH, MEDIUM, or LOW based on sample size' },
        },
        required: ['area', 'recommendation', 'supportingEvidence', 'sampleSize', 'confidenceLevel'],
      },
    },
    postingTimeRecommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          recommendedWindow: { type: Type.STRING, description: 'Recommended posting time window e.g. 18:00 - 21:00 UTC' },
          platform: { type: Type.STRING, description: 'Target platform e.g. youtube_shorts, instagram_reels, ALL' },
          sampleSize: { type: Type.NUMBER, description: 'Sample size supporting recommendation' },
          supportingEvidence: { type: Type.STRING, description: 'Evidence detailing avg views, retention, CTR' },
          confidenceLevel: { type: Type.STRING, description: 'HIGH, MEDIUM, or LOW based on sample size' },
          dayOfWeek: { type: Type.STRING, description: 'Optional day of week e.g. SUNDAY' },
          bestHourWindow: { type: Type.STRING, description: 'Optional best hour window' },
        },
        required: ['recommendedWindow', 'platform', 'sampleSize', 'supportingEvidence', 'confidenceLevel'],
      },
    },
    dataConfidenceNotes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Notes explicitly highlighting small samples, missing dimensions, or caveats.',
    },
  },
  required: [
    'overallVerdict',
    'topPerformingDimensions',
    'underperformingDimensions',
    'platformSpecificRecommendations',
    'contentStrategyRecommendations',
    'dataConfidenceNotes',
  ],
};

export const PerformanceIntelligenceZodSchema = z.object({
  overallVerdict: z.string().min(1),
  topPerformingDimensions: z.array(
    z.object({
      dimension: z.string(),
      value: z.string(),
      sampleSize: z.number(),
      avgViews: z.number(),
      avgRetention: z.number(),
      avgCtr: z.number(),
      reason: z.string(),
    })
  ),
  underperformingDimensions: z.array(
    z.object({
      dimension: z.string(),
      value: z.string(),
      sampleSize: z.number(),
      avgViews: z.number(),
      avgRetention: z.number(),
      avgCtr: z.number(),
      reason: z.string(),
    })
  ),
  platformSpecificRecommendations: z.array(
    z.object({
      platform: z.string(),
      sampleSize: z.number(),
      keyTakeaways: z.array(z.string()),
      recommendedActions: z.array(z.string()),
    })
  ),
  contentStrategyRecommendations: z.array(
    z.object({
      area: z.string(),
      recommendation: z.string(),
      supportingEvidence: z.string(),
      sampleSize: z.number(),
      confidenceLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    })
  ),
  postingTimeRecommendations: z.array(
    z.object({
      recommendedWindow: z.string(),
      platform: z.string(),
      sampleSize: z.number(),
      supportingEvidence: z.string(),
      confidenceLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      dayOfWeek: z.string().optional(),
      bestHourWindow: z.string().optional(),
    })
  ).optional().default([]),
  dataConfidenceNotes: z.array(z.string()),
});

export type PerformanceIntelligenceAIOutput = z.infer<typeof PerformanceIntelligenceZodSchema>;
