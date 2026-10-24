import assert from 'node:assert/strict';
import { LearningUnitPlanningService } from '../../../backend/features/planning/services/learning-unit-planning.service';

const records = [
  {
    id: 'lnu_00000000-0000-4000-8000-000000000001',
    title: 'Discounts',
    topicId: 'topic-math',
    topicName: 'Mathematics',
    subtopicId: 'sub-discounts',
    subtopicName: 'Discounts',
    learningObjective: 'Understand discounts',
    verifiedMethod: 'Compare equivalent prices',
    skillLevel: 'BEGINNER',
    audienceContext: 'STUDENT',
    suggestedModes: ['TOPIC_INTRODUCTION', 'EXPLAINED_QUESTIONS_VIDEO'],
    primaryFormat: 'VIDEO',
    planningStatus: 'SUBMITTED_FOR_VERIFICATION',
    authorId: 'usr_owner',
    version: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'lnu_00000000-0000-4000-8000-000000000002',
    title: 'Fractions',
    topicId: 'topic-math',
    topicName: 'Mathematics',
    subtopicId: 'sub-fractions',
    subtopicName: 'Fractions',
    learningObjective: 'Understand fractions',
    verifiedMethod: 'Compare numerator and denominator',
    skillLevel: 'FOUNDATION',
    audienceContext: 'TEACHER',
    suggestedModes: ['QUESTION_CHALLENGE_SHORT'],
    primaryFormat: 'TEXT',
    planningStatus: 'DRAFT',
    authorId: 'usr_owner',
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
] as any[];

const service = new LearningUnitPlanningService(
  { query: async () => records } as any,
  { log: async () => undefined } as any
);

const calendar = await service.listEditorialCalendar({ topicId: 'topic-math', limit: 2 });
assert.equal(calendar.total, 3);
assert.deepEqual(calendar.entries.map((entry) => entry.mode), ['TOPIC_INTRODUCTION', 'WORKED_EXAMPLES']);
assert.equal(calendar.entries[0].status, 'SUBMITTED_FOR_VERIFICATION');
assert.equal((calendar.entries[0] as any).version, undefined);

const filtered = await service.listEditorialCalendar({
  subtopicId: 'sub-discounts',
  mode: 'WORKED_EXAMPLES',
  format: 'VIDEO',
  audienceContext: 'STUDENT',
  status: 'SUBMITTED_FOR_VERIFICATION',
});
assert.deepEqual(filtered.entries.map((entry) => entry.mode), ['WORKED_EXAMPLES']);

const empty = await service.listEditorialCalendar({ status: 'ARCHIVED' });
assert.equal(empty.total, 0);
console.log('S14-T02 editorial calendar tests passed (filters, alias normalization, safe projection, and pagination).');
