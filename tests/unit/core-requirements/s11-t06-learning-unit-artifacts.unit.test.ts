import assert from 'node:assert/strict';
import { ForbiddenError, NotFoundError } from '../../../src/lib/errors';
import { LearningUnit, Question, QuestionDraft, Video } from '../../../shared';
import { LearningUnitArtifactsService } from '../../../backend/features/planning/services/learning-unit-artifacts.service';

const learningUnitId = 'lnu_33333333-3333-4333-8333-333333333333';
const otherLearningUnitId = 'lnu_44444444-4444-4444-8444-444444444444';

const learningUnit: LearningUnit = {
  id: learningUnitId,
  topicId: 'top_11111111-1111-4111-8111-111111111111',
  subtopicId: 'sub_22222222-2222-4222-8222-222222222222',
  title: 'Discounts',
  learningObjective: 'Calculate discounts and compare final prices.',
  verifiedMethod: 'Convert the percentage to a decimal and multiply by the original price.',
  skillLevel: 'BEGINNER',
  planningStatus: 'SUBMITTED_FOR_VERIFICATION',
  authorId: 'usr_author',
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function artifactRepositories(records: {
  drafts?: QuestionDraft[];
  questions?: Question[];
  videos?: Video[];
  units?: LearningUnit[];
}) {
  const calls = { drafts: [] as Array<[string, number]>, questions: [] as Array<[string, number]>, videos: [] as Array<[string, number]> };
  return {
    calls,
    repositories: {
      learningUnits: {
        findById: async (id: string) => records.units?.find((unit) => unit.id === id) || null,
      },
      drafts: {
        findByLearningUnitId: async (id: string, limit: number) => {
          calls.drafts.push([id, limit]);
          return (records.drafts || []).filter((draft) => draft.learningUnitId === id).slice(0, limit);
        },
      },
      questions: {
        findByLearningUnitId: async (id: string, limit: number) => {
          calls.questions.push([id, limit]);
          return (records.questions || []).filter((question) => question.learningUnitId === id).slice(0, limit);
        },
      },
      videos: {
        findByLearningUnitId: async (id: string, limit: number) => {
          calls.videos.push([id, limit]);
          return (records.videos || []).filter((video) => video.learningUnitId === id).slice(0, limit);
        },
      },
    },
  };
}

function draft(id: string, linkedId?: string): QuestionDraft {
  return {
    id,
    learningUnitId: linkedId,
    topicId: 'topic',
    subtopicId: 'subtopic',
    difficulty: 'MEDIUM',
    questionText: 'What is 10% of 100?',
    options: { a: '1', b: '10', c: '20', d: '100' },
    correctAnswer: 'B',
    explanation: 'Ten percent of 100 is 10.',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function question(id: string, linkedId?: string): Question {
  return {
    id,
    learningUnitId: linkedId,
    topicId: 'topic',
    topicName: 'Topic',
    subtopicId: 'subtopic',
    subtopicName: 'Subtopic',
    difficulty: 'MEDIUM',
    questionText: 'What is 10% of 100?',
    options: { a: '1', b: '10', c: '20', d: '100' },
    correctAnswer: 'B',
    explanation: 'Ten percent of 100 is 10.',
    status: 'GENERATED' as any,
    videoStatus: 'NOT_STARTED' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function video(id: string, linkedId?: string): Video {
  return {
    id,
    learningUnitId: linkedId,
    questionId: 'qst_1',
    title: 'Discounts',
    status: 'NOT_STARTED' as any,
    priority: 'NORMAL' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  const fixtures = artifactRepositories({
    units: [learningUnit],
    drafts: [draft('dft-linked', learningUnitId), draft('dft-legacy')],
    questions: [question('qst-linked', learningUnitId), question('qst-other', otherLearningUnitId)],
    videos: [video('vid-linked', learningUnitId)],
  });
  const service = new LearningUnitArtifactsService(fixtures.repositories);

  const result = await service.findLinkedArtifacts(learningUnitId, {
    id: 'usr_author',
    role: 'CONTENT_WRITER',
  }, 1);
  assert.deepEqual(result.drafts.map((item) => item.id), ['dft-linked']);
  assert.deepEqual(result.questions.map((item) => item.id), ['qst-linked']);
  assert.deepEqual(result.videos.map((item) => item.id), ['vid-linked']);
  assert.deepEqual(fixtures.calls.drafts, [[learningUnitId, 1]]);
  assert.equal('authorId' in result.drafts[0], false);
  assert.equal('reviewerId' in result.drafts[0], false);
  assert.equal('notes' in result.videos[0], false);
  assert.equal(result.correctionReview.supported, false);

  const emptyFixtures = artifactRepositories({ units: [learningUnit] });
  const empty = await new LearningUnitArtifactsService(emptyFixtures.repositories)
    .findLinkedArtifacts(learningUnitId, { id: 'usr_author', role: 'CONTENT_WRITER' });
  assert.equal(empty.drafts.length + empty.questions.length + empty.videos.length, 0);

  await assert.rejects(
    () => service.findLinkedArtifacts(otherLearningUnitId, { id: 'usr_author', role: 'CONTENT_WRITER' }),
    NotFoundError
  );
  await assert.rejects(
    () => service.findLinkedArtifacts(learningUnitId, { id: 'usr_other', role: 'CONTENT_WRITER' }),
    ForbiddenError
  );
  await assert.rejects(
    () => service.findLinkedArtifacts('not-an-id', { id: 'usr_author', role: 'CONTENT_WRITER' }),
    /Invalid LearningUnit reference/
  );

  console.log('S11-T06 LearningUnit reverse-query tests passed (5 cases).');
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
