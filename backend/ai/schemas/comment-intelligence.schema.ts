/**
 * BURRA PARIKSHA CMS - Comment Intelligence GenAI Schema & Zod Validators
 * Phase 30: AI Social Comment Intelligence & Audience Insight Extraction
 */

import { Schema, Type } from '@google/genai';
import { z } from 'zod';

export const CommentIntelligenceGenAISchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallSentiment: {
      type: Type.OBJECT,
      properties: {
        positivePercentage: { type: Type.NUMBER, description: 'Percentage of positive comments (0-100)' },
        negativePercentage: { type: Type.NUMBER, description: 'Percentage of negative comments (0-100)' },
        neutralPercentage: { type: Type.NUMBER, description: 'Percentage of neutral/inquisitive comments (0-100)' },
        overallVerdict: {
          type: Type.STRING,
          description: 'Overall sentiment category: OVERWHELMINGLY_POSITIVE, POSITIVE, MIXED, NEGATIVE, or CONFUSED',
        },
        summary: { type: Type.STRING, description: 'High-level 1-2 sentence synthesis of audience reactions' },
      },
      required: ['positivePercentage', 'negativePercentage', 'neutralPercentage', 'overallVerdict', 'summary'],
    },
    misconceptions: {
      type: Type.ARRAY,
      description: 'Common misconceptions, flawed reasoning, or incorrect assumptions identified in audience comments',
      items: {
        type: Type.OBJECT,
        properties: {
          misconception: { type: Type.STRING, description: 'The specific concept or answer choice viewers misunderstood' },
          frequencyEstimate: { type: Type.STRING, description: 'Estimated prevalence: HIGH, MEDIUM, or LOW' },
          sampleCommentQuotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Direct verbatim phrases from audience comments reflecting this misconception',
          },
          explanationNeeded: { type: Type.STRING, description: 'Clear pedagogical clarification to resolve this misconception in future content or pinned comments' },
        },
        required: ['misconception', 'sampleCommentQuotes', 'explanationNeeded'],
      },
    },
    viewerQuestions: {
      type: Type.ARRAY,
      description: 'Unresolved questions or requests for explanation repeatedly raised by viewers',
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: 'The viewer question or ambiguity' },
          frequencyEstimate: { type: Type.STRING, description: 'Estimated prevalence: HIGH, MEDIUM, or LOW' },
          sampleCommentQuotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Direct verbatim phrases from comments posing this question',
          },
          suggestedAnswer: { type: Type.STRING, description: 'Concise, authoritative answer suitable for a reply or pinned clarification' },
        },
        required: ['question', 'sampleCommentQuotes', 'suggestedAnswer'],
      },
    },
    contentRequests: {
      type: Type.ARRAY,
      description: 'Follow-up topics, deeper explanations, or future video concepts explicitly requested by viewers',
      items: {
        type: Type.OBJECT,
        properties: {
          requestedTopicOrFormat: { type: Type.STRING, description: 'The specific topic, problem type, or format requested' },
          frequencyEstimate: { type: Type.STRING, description: 'Estimated prevalence: HIGH, MEDIUM, or LOW' },
          sampleCommentQuotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Direct verbatim phrases from comments requesting this content',
          },
        },
        required: ['requestedTopicOrFormat', 'sampleCommentQuotes'],
      },
    },
    factualCorrections: {
      type: Type.ARRAY,
      description: 'Audience reports of factual errors, typos, math mistakes, or translation inaccuracies in the published content',
      items: {
        type: Type.OBJECT,
        properties: {
          issueReported: { type: Type.STRING, description: 'Specific inaccuracy or defect claimed by viewers' },
          severity: { type: Type.STRING, description: 'Severity level: CRITICAL, MODERATE, or MINOR' },
          sampleCommentQuotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Direct verbatim phrases from comments reporting the issue',
          },
          verificationNeeded: { type: Type.STRING, description: 'Recommended editorial action or fact-check required' },
        },
        required: ['issueReported', 'severity', 'sampleCommentQuotes', 'verificationNeeded'],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      description: 'Actionable editorial recommendations to improve future question design, video pacing, or pinned comments',
      items: {
        type: Type.OBJECT,
        properties: {
          area: {
            type: Type.STRING,
            description: 'Focus area: QUESTION_DESIGN, EXPLANATION_CLARITY, TOPIC_EXPANSION, PACING, or PINNED_COMMENT',
          },
          recommendation: { type: Type.STRING, description: 'Specific editorial recommendation' },
          supportingEvidence: { type: Type.STRING, description: 'Concrete evidence from comments justifying this recommendation' },
          suggestedAction: { type: Type.STRING, description: 'Concrete step for the content team' },
          confidenceLevel: { type: Type.STRING, description: 'Confidence level: HIGH, MEDIUM, or LOW' },
        },
        required: ['area', 'recommendation', 'supportingEvidence', 'suggestedAction', 'confidenceLevel'],
      },
    },
    confidence: {
      type: Type.STRING,
      description: 'Overall analytical confidence: HIGH, MEDIUM, LOW, or INSUFFICIENT_DATA',
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: 'Confidence score from 0 to 100 based on comment volume and clarity of signal',
    },
  },
  required: [
    'overallSentiment',
    'misconceptions',
    'viewerQuestions',
    'contentRequests',
    'factualCorrections',
    'recommendations',
    'confidence',
  ],
};

export const CommentIntelligenceZodSchema = z.object({
  overallSentiment: z.object({
    positivePercentage: z.number().min(0).max(100),
    negativePercentage: z.number().min(0).max(100),
    neutralPercentage: z.number().min(0).max(100),
    overallVerdict: z.enum(['OVERWHELMINGLY_POSITIVE', 'POSITIVE', 'MIXED', 'NEGATIVE', 'CONFUSED']),
    summary: z.string().min(1),
  }),
  misconceptions: z.array(
    z.object({
      misconception: z.string().min(1),
      frequencyEstimate: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
      sampleCommentQuotes: z.array(z.string()).default([]),
      explanationNeeded: z.string().min(1),
    })
  ).default([]),
  viewerQuestions: z.array(
    z.object({
      question: z.string().min(1),
      frequencyEstimate: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
      sampleCommentQuotes: z.array(z.string()).default([]),
      suggestedAnswer: z.string().min(1),
    })
  ).default([]),
  contentRequests: z.array(
    z.object({
      requestedTopicOrFormat: z.string().min(1),
      frequencyEstimate: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
      sampleCommentQuotes: z.array(z.string()).default([]),
    })
  ).default([]),
  factualCorrections: z.array(
    z.object({
      issueReported: z.string().min(1),
      severity: z.enum(['CRITICAL', 'MODERATE', 'MINOR']),
      sampleCommentQuotes: z.array(z.string()).default([]),
      verificationNeeded: z.string().min(1),
    })
  ).default([]),
  recommendations: z.array(
    z.object({
      area: z.enum(['QUESTION_DESIGN', 'EXPLANATION_CLARITY', 'TOPIC_EXPANSION', 'PACING', 'PINNED_COMMENT']),
      recommendation: z.string().min(1),
      supportingEvidence: z.string().min(1),
      suggestedAction: z.string().min(1),
      confidenceLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    })
  ).default([]),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT_DATA']),
  confidenceScore: z.number().min(0).max(100).optional().default(75),
});

export type CommentIntelligenceAIOutput = z.infer<typeof CommentIntelligenceZodSchema>;
