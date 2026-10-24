import assert from 'node:assert/strict';
import {
  ArtifactPerformanceSnapshotSchema,
  AudiencePerformanceSnapshotSchema,
  LearningEngagementSnapshotSchema,
} from '../../../shared';

const available = (value: number) => ({ availability: 'AVAILABLE' as const, value });
const unavailable = (reason: 'NOT_SUPPORTED' | 'NOT_PROVIDED' | 'INSUFFICIENT_SAMPLE') => ({
  availability: 'UNAVAILABLE' as const,
  reason,
});
const dimensions = {
  artifactId: 'vid_550e8400-e29b-41d4-a716-446655440000',
  learningUnitId: 'lnu_550e8400-e29b-41d4-a716-446655440000',
  platform: 'youtube',
  mode: 'TOPIC_INTRODUCTION',
  format: 'VIDEO',
  audienceContext: 'STUDENTS',
  seriesId: 'series_discount_basics',
  capturedAt: '2026-10-24T12:00:00.000Z',
};

const audience = AudiencePerformanceSnapshotSchema.parse({
  ...dimensions,
  reach: available(1000),
  impressions: available(1500),
  views: available(800),
  averageWatchTimeSeconds: available(42),
  retentionRate: available(0.64),
  shares: available(20),
  saves: unavailable('NOT_PROVIDED'),
  returningViewers: unavailable('NOT_SUPPORTED'),
  followerGrowth: available(12),
});
assert.equal(audience.reach.availability, 'AVAILABLE');
assert.equal(audience.saves.availability, 'UNAVAILABLE');

const learning = LearningEngagementSnapshotSchema.parse({
  ...dimensions,
  challengeParticipation: unavailable('NOT_SUPPORTED'),
  answerAccuracy: available(0.72),
  explanationRequests: available(14),
  followUpPerformance: unavailable('INSUFFICIENT_SAMPLE'),
  repeatAttempts: available(32),
  lessonCompletion: unavailable('NOT_PROVIDED'),
});
assert.equal(learning.answerAccuracy.availability, 'AVAILABLE');
if (learning.followUpPerformance.availability === 'UNAVAILABLE') {
  assert.equal(learning.followUpPerformance.reason, 'INSUFFICIENT_SAMPLE');
}

const combined = ArtifactPerformanceSnapshotSchema.safeParse({ audience, learning });
assert.equal(combined.success, true);

const invalid = AudiencePerformanceSnapshotSchema.safeParse({
  ...dimensions,
  reach: 0,
});
assert.equal(invalid.success, false);
console.log('S15-T01 performance contracts passed (audience, learning, unavailable metrics, and invalid-shape rejection).');
