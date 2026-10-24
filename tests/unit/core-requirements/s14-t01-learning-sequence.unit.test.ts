import assert from 'node:assert/strict';
import { LearningUnitArtifactsService } from '../../../backend/features/planning/services/learning-unit-artifacts.service';

const learningUnitId = 'lnu_550e8400-e29b-41d4-a716-446655440000';
const actor = { id: 'usr_owner', role: 'CONTENT_WRITER' };
const source = {
  id: 'src',
  learningUnitId,
  topicId: 'topic',
  topicName: 'Topic',
  subtopicId: 'subtopic',
  subtopicName: 'Subtopic',
  difficulty: 'BEGINNER',
  language: 'TELUGU',
  questionText: 'A sequence item',
  options: { a: 'A', b: 'B', c: 'C', d: 'D' },
  correctAnswer: 'A',
  explanation: 'Explanation',
  status: 'DRAFT',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 1,
} as any;

const service = new LearningUnitArtifactsService({
  learningUnits: { findById: async () => ({
    id: learningUnitId,
    topicId: 'topic',
    subtopicId: 'subtopic',
    title: 'Sequence planning',
    learningObjective: 'Understand the sequence ordering',
    verifiedMethod: 'Follow the ordered learning artifacts',
    skillLevel: 'BEGINNER',
    authorId: actor.id,
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    planningStatus: 'SUBMITTED_FOR_VERIFICATION',
  } as any) },
  drafts: { findByLearningUnitId: async () => [{ ...source, id: 'draft-1', productionMode: 'QUESTION_CHALLENGE_SHORT', presentationType: 'TEXT' }] },
  questions: { findByLearningUnitId: async () => [{ ...source, id: 'question-1', productionMode: 'TOPIC_INTRODUCTION', presentationType: 'TEXT', status: 'APPROVED' }] },
  videos: { findByLearningUnitId: async () => [{ id: 'video-1', learningUnitId, questionId: 'question-1', title: 'Video', status: 'QUEUED', priority: 'NORMAL', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' }] },
});

const sequence = await service.getLearningSequence(learningUnitId, actor, { limit: 2 });
assert.equal(sequence.total, 3);
assert.deepEqual(sequence.artifacts.map((artifact) => artifact.id), ['question-1', 'draft-1']);
assert.equal(sequence.totalPages, 2);
assert.equal(sequence.artifacts[0].mode, 'TOPIC_INTRODUCTION');

const filtered = await service.getLearningSequence(learningUnitId, actor, { mode: 'WORKED_EXAMPLES' });
assert.equal(filtered.total, 0);
const formatFiltered = await service.getLearningSequence(learningUnitId, actor, { format: 'VIDEO' });
assert.deepEqual(formatFiltered.artifacts.map((artifact) => artifact.id), ['video-1']);
console.log('S14-T01 learning sequence tests passed (ordering, missing-mode tolerance, filters, and pagination).');
