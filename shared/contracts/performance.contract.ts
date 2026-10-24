import { z } from 'zod';

/**
 * Performance measurements remain observations, not workflow evidence. An
 * unavailable metric is represented explicitly so consumers never mistake a
 * missing provider capability for a measured zero.
 */
export const PerformanceMetricSchema = z.discriminatedUnion('availability', [
  z.object({
    availability: z.literal('AVAILABLE'),
    value: z.number().finite().nonnegative(),
  }),
  z.object({
    availability: z.literal('UNAVAILABLE'),
    reason: z.enum([
      'NOT_SUPPORTED',
      'NOT_PROVIDED',
      'INSUFFICIENT_SAMPLE',
      'PRIVACY_RESTRICTED',
    ]),
  }),
]);

export const PerformanceDimensionsSchema = z.object({
  artifactId: z.string().min(1),
  learningUnitId: z.string().min(1).optional(),
  platform: z.string().min(1),
  mode: z.string().min(1).optional(),
  format: z.string().min(1).optional(),
  audienceContext: z.string().min(1).optional(),
  seriesId: z.string().min(1).optional(),
});

export const AudiencePerformanceSnapshotSchema = PerformanceDimensionsSchema.extend({
  capturedAt: z.string().datetime({ offset: true }),
  reach: PerformanceMetricSchema,
  impressions: PerformanceMetricSchema,
  views: PerformanceMetricSchema,
  averageWatchTimeSeconds: PerformanceMetricSchema,
  retentionRate: PerformanceMetricSchema,
  shares: PerformanceMetricSchema,
  saves: PerformanceMetricSchema,
  returningViewers: PerformanceMetricSchema,
  followerGrowth: PerformanceMetricSchema,
});

export const LearningEngagementSnapshotSchema = PerformanceDimensionsSchema.extend({
  capturedAt: z.string().datetime({ offset: true }),
  challengeParticipation: PerformanceMetricSchema,
  answerAccuracy: PerformanceMetricSchema,
  explanationRequests: PerformanceMetricSchema,
  followUpPerformance: PerformanceMetricSchema,
  repeatAttempts: PerformanceMetricSchema,
  lessonCompletion: PerformanceMetricSchema,
});

export const ArtifactPerformanceSnapshotSchema = z.object({
  audience: AudiencePerformanceSnapshotSchema,
  learning: LearningEngagementSnapshotSchema,
});

export type PerformanceMetric = z.infer<typeof PerformanceMetricSchema>;
export type AudiencePerformanceSnapshot = z.infer<typeof AudiencePerformanceSnapshotSchema>;
export type LearningEngagementSnapshot = z.infer<typeof LearningEngagementSnapshotSchema>;
export type ArtifactPerformanceSnapshot = z.infer<typeof ArtifactPerformanceSnapshotSchema>;
