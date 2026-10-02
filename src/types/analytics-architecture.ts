/**
 * BURRA PARIKSHA CMS — Stage 20 Analytics Architecture & Intelligence Loop
 *
 * Defines the 5-stage analytics pipeline, telemetry schemas, engagement formulas,
 * retention benchmarks, and the Step 15 -> Step 01 closed-loop feedback contracts.
 */

import { z } from 'zod';

// ============================================================================
// 1. ANALYTICS ENUMS & TAXONOMY
// ============================================================================

export enum PlatformId {
  YOUTUBE = 'YOUTUBE',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
}

export enum AnalyticsWindow {
  DAY_1 = 'DAY_1',
  DAY_7 = 'DAY_7',
  DAY_30 = 'DAY_30',
  LIFETIME = 'LIFETIME',
}

export enum RetentionBenchmark {
  VIRAL = 'VIRAL',
  HIGH = 'HIGH',
  AVERAGE = 'AVERAGE',
  UNDERPERFORMING = 'UNDERPERFORMING',
}

export enum IntelligenceCategory {
  HIGH_DROPOFF_TOPIC = 'HIGH_DROPOFF_TOPIC',
  CONFUSION_SIGNAL = 'CONFUSION_SIGNAL',
  HIGH_DEMAND_CURRICULUM = 'HIGH_DEMAND_CURRICULUM',
  HOOK_FAILURE = 'HOOK_FAILURE',
}

// ============================================================================
// 2. STAGE 1: RAW PLATFORM TELEMETRY SCHEMA
// ============================================================================

export const RawPlatformTelemetrySchema = z.object({
  rawTelemetryId: z.string().regex(/^RAW-TEL-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  publicationId: z.string().min(1),
  platform: z.nativeEnum(PlatformId),
  rawPayload: z.record(z.string(), z.unknown()),
  harvestedAt: z.string().datetime(),
  statusCode: z.number().int().default(200),
});

export type RawPlatformTelemetry = z.infer<typeof RawPlatformTelemetrySchema>;

// ============================================================================
// 3. STAGE 2: NORMALIZED ANALYTICS RECORD SCHEMA
// ============================================================================

export const RetentionCurvePointSchema = z.object({
  percentile: z.number().min(0).max(100), // 0% to 100% of video duration
  retentionRatio: z.number().min(0).max(1), // 0.0 to 1.0 (e.g. 0.85 = 85% viewers)
});

export type RetentionCurvePoint = z.infer<typeof RetentionCurvePointSchema>;

export const NormalizedAnalyticsRecordSchema = z.object({
  snapshotId: z.string().regex(/^ASN-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  publicationId: z.string().min(1),
  contentId: z.string().min(1),
  platform: z.nativeEnum(PlatformId),
  viewsCount: z.number().int().nonnegative(),
  likesCount: z.number().int().nonnegative(),
  commentsCount: z.number().int().nonnegative(),
  sharesCount: z.number().int().nonnegative(),
  averageWatchDurationSeconds: z.number().nonnegative(),
  completionRateRatio: z.number().min(0).max(1),
  retentionCurve: z.array(RetentionCurvePointSchema).min(2),
  capturedAt: z.string().datetime(),
});

export type NormalizedAnalyticsRecord = z.infer<typeof NormalizedAnalyticsRecordSchema>;

// ============================================================================
// 4. STAGE 3: AGGREGATED METRICS SUMMARY SCHEMA
// ============================================================================

export const AggregatedMetricsSummarySchema = z.object({
  aggregationId: z.string().regex(/^AGG-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  window: z.nativeEnum(AnalyticsWindow),
  subject: z.string().optional(),
  topic: z.string().optional(),
  totalViews: z.number().int().nonnegative(),
  totalLikes: z.number().int().nonnegative(),
  totalComments: z.number().int().nonnegative(),
  totalShares: z.number().int().nonnegative(),
  avgEngagementRate: z.number().nonnegative(),
  avgCompletionRate: z.number().min(0).max(1),
  cohortSize: z.number().int().positive(),
  computedAt: z.string().datetime(),
});

export type AggregatedMetricsSummary = z.infer<typeof AggregatedMetricsSummarySchema>;

// ============================================================================
// 5. STAGE 4: PERFORMANCE RECORD SCHEMA
// ============================================================================

export const PerformanceRecordSchema = z.object({
  recordId: z.string().regex(/^PERF-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  contentId: z.string().min(1),
  evaluationWindow: z.nativeEnum(AnalyticsWindow),
  normalizedViewIndex: z.number().nonnegative(),
  engagementRateRatio: z.number().nonnegative(),
  benchmark: z.nativeEnum(RetentionBenchmark),
  evaluatedAt: z.string().datetime(),
  reviewedByUserId: z.string().min(1),
});

export type PerformanceRecord = z.infer<typeof PerformanceRecordSchema>;

// ============================================================================
// 6. STAGE 5: INTELLIGENCE INSIGHT & FEEDBACK SCHEMA
// ============================================================================

export const IntelligenceInsightSchema = z.object({
  insightId: z.string().regex(/^INS-\d{8}-[a-zA-Z0-9_-]{6,16}$/),
  contentId: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  category: z.nativeEnum(IntelligenceCategory),
  recommendationSummary: z.string().min(10),
  actionableFeedbackForStep01: z.object({
    suggestedClass: z.string(),
    suggestedSubject: z.string(),
    targetTopic: z.string(),
    targetMisconception: z.string(),
    pedagogicalGuidance: z.string(),
  }),
  isApproved: z.boolean(),
  approvedByUserId: z.string().nullable(),
  generatedAt: z.string().datetime(),
});

export type IntelligenceInsight = z.infer<typeof IntelligenceInsightSchema>;

// ============================================================================
// 7. PURE ANALYTICAL CALCULATORS & PIPELINE HELPERS
// ============================================================================

export function calculateEngagementRate(
  views: number,
  likes: number,
  comments: number,
  shares: number
): number {
  if (views <= 0) return 0;
  const weightedEngagement = likes + comments * 2 + shares * 3;
  return Number((weightedEngagement / views).toFixed(4));
}

export function classifyRetentionBenchmark(
  retentionCurve: RetentionCurvePoint[]
): RetentionBenchmark {
  if (retentionCurve.length === 0) return RetentionBenchmark.UNDERPERFORMING;

  // Final completion point (100% of duration)
  const finalPoint = retentionCurve[retentionCurve.length - 1];
  const completionRatio = finalPoint ? finalPoint.retentionRatio : 0;

  // Hook check: check retention at 10% mark
  const hookPoint = retentionCurve.find((p) => p.percentile >= 10);
  if (hookPoint && hookPoint.retentionRatio < 0.5) {
    return RetentionBenchmark.UNDERPERFORMING; // Hook failure
  }

  if (completionRatio >= 0.7) return RetentionBenchmark.VIRAL;
  if (completionRatio >= 0.5) return RetentionBenchmark.HIGH;
  if (completionRatio >= 0.3) return RetentionBenchmark.AVERAGE;
  return RetentionBenchmark.UNDERPERFORMING;
}

export function normalizeRawTelemetry(params: {
  snapshotId: string;
  publicationId: string;
  contentId: string;
  platform: PlatformId;
  rawPayload: Record<string, unknown>;
  capturedAt: string;
}): NormalizedAnalyticsRecord {
  const views = Number(params.rawPayload.views || params.rawPayload.viewCount || 0);
  const likes = Number(params.rawPayload.likes || params.rawPayload.likeCount || 0);
  const comments = Number(params.rawPayload.comments || params.rawPayload.commentCount || 0);
  const shares = Number(params.rawPayload.shares || params.rawPayload.shareCount || 0);
  const avgWatchSec = Number(params.rawPayload.avgWatchSec || params.rawPayload.averageWatchDuration || 0);
  const completionRate = Number(params.rawPayload.completionRate || 0.45);

  const retentionCurve: RetentionCurvePoint[] = Array.isArray(params.rawPayload.retentionCurve)
    ? (params.rawPayload.retentionCurve as RetentionCurvePoint[])
    : [
        { percentile: 0, retentionRatio: 1.0 },
        { percentile: 25, retentionRatio: 0.8 },
        { percentile: 50, retentionRatio: 0.65 },
        { percentile: 75, retentionRatio: 0.52 },
        { percentile: 100, retentionRatio: completionRate },
      ];

  const record: NormalizedAnalyticsRecord = {
    snapshotId: params.snapshotId,
    publicationId: params.publicationId,
    contentId: params.contentId,
    platform: params.platform,
    viewsCount: views,
    likesCount: likes,
    commentsCount: comments,
    sharesCount: shares,
    averageWatchDurationSeconds: avgWatchSec,
    completionRateRatio: completionRate,
    retentionCurve,
    capturedAt: params.capturedAt,
  };

  NormalizedAnalyticsRecordSchema.parse(record);
  return record;
}

export function generateStep01FeedbackPayload(insight: IntelligenceInsight) {
  return {
    sourceInsightId: insight.insightId,
    targetWorkflowStep: 1, // Step 01 Question Studio
    guidance: insight.actionableFeedbackForStep01,
    emittedAt: new Date().toISOString(),
  };
}
