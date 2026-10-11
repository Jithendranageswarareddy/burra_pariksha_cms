/**
 * BURRA PARIKSHA CMS - Social Quality & Engagement Intelligence Schemas
 * Phase 8G: Quality & Engagement Intelligence Engine
 */

import { Schema, Type } from '@google/genai';
import { z } from 'zod';

export const SocialQualityAssessmentGenAISchema: Schema = {
  type: Type.OBJECT,
  properties: {
    scores: {
      type: Type.OBJECT,
      properties: {
        clarity: {
          type: Type.NUMBER,
          description: 'Score (0-100) for question & options wording clarity and readability.',
        },
        curiosity: {
          type: Type.NUMBER,
          description: 'Score (0-100) for hook curiosity gap, intrigue, and urge to solve.',
        },
        challengeQuality: {
          type: Type.NUMBER,
          description: 'Score (0-100) for difficulty calibration, non-triviality, and fair distractors.',
        },
        commentability: {
          type: Type.NUMBER,
          description: 'Score (0-100) for comment/discussion incentive and CTA prompt strength.',
        },
        retentionPotential: {
          type: Type.NUMBER,
          description: 'Score (0-100) for teleprompter pacing, visual reveals, and narrative arc.',
        },
        realLifeRelevance: {
          type: Type.NUMBER,
          description: 'Score (0-100) for practical scenario context and relatability.',
        },
        socialPresentation: {
          type: Type.NUMBER,
          description: 'Score (0-100) for social title, caption, hashtag, and platform formatting.',
        },
        languageQuality: {
          type: Type.NUMBER,
          description: 'Score (0-100) for natural spoken Telugu and conversational English register.',
        },
        audienceSuitability: {
          type: Type.NUMBER,
          description: 'Score (0-100) for broad audience appeal, safety, and accessibility.',
        },
        repetitionRisk: {
          type: Type.NUMBER,
          description: 'Score (0-100) for risk of repetition or redundancy across syllabus.',
        },
        audienceAppeal: {
          type: Type.NUMBER,
          description: 'Score (0-100) for student and viewer visual and conceptual appeal.',
        },
      },
      required: [
        'clarity',
        'curiosity',
        'challengeQuality',
        'commentability',
        'retentionPotential',
        'realLifeRelevance',
        'socialPresentation',
        'languageQuality',
        'audienceSuitability',
        'repetitionRisk',
        'audienceAppeal',
      ],
    },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dimension: {
            type: Type.STRING,
            description: 'Dimension key e.g. CURIOSITY, LANGUAGE_QUALITY, COMMENTABILITY, RETENTION_POTENTIAL, CLARITY, CHALLENGE_QUALITY, REAL_LIFE_RELEVANCE, SOCIAL_PRESENTATION, AUDIENCE_SUITABILITY.',
          },
          severity: {
            type: Type.STRING,
            description: 'Finding severity: "BLOCKING" or "ADVISORY".',
          },
          code: {
            type: Type.STRING,
            description: 'Short upper snake_case identifier e.g. WEAK_HOOK_INTRIGUE, OVERLY_FORMAL_TELUGU.',
          },
          message: {
            type: Type.STRING,
            description: 'Detailed explanation of the finding.',
          },
          context: {
            type: Type.STRING,
            description: 'Specific snippet or text surface where finding applies.',
          },
          suggestedFix: {
            type: Type.STRING,
            description: 'Actionable suggestion for improvement.',
          },
        },
        required: ['dimension', 'severity', 'code', 'message'],
      },
      description: 'List of qualitative quality findings.',
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of top actionable recommendations for the creator.',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Model confidence score between 0.0 and 1.0.',
    },
  },
  required: ['scores', 'findings', 'recommendations', 'confidence'],
};

export const SocialQualityAssessmentZodSchema = z.object({
  scores: z.object({
    clarity: z.number().min(0).max(100),
    curiosity: z.number().min(0).max(100),
    challengeQuality: z.number().min(0).max(100),
    commentability: z.number().min(0).max(100),
    retentionPotential: z.number().min(0).max(100),
    realLifeRelevance: z.number().min(0).max(100),
    socialPresentation: z.number().min(0).max(100),
    languageQuality: z.number().min(0).max(100),
    audienceSuitability: z.number().min(0).max(100),
    repetitionRisk: z.number().min(0).max(100),
    audienceAppeal: z.number().min(0).max(100),
  }),
  findings: z.array(
    z.object({
      dimension: z.string(),
      severity: z.enum(['BLOCKING', 'ADVISORY']),
      code: z.string(),
      message: z.string(),
      context: z.string().optional(),
      suggestedFix: z.string().optional(),
    })
  ),
  recommendations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type SocialQualityAssessmentAIOutput = z.infer<typeof SocialQualityAssessmentZodSchema>;
