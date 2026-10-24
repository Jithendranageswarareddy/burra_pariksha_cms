process.env.PERSISTENCE_MODE = 'IN_MEMORY_TEST_ONLY';
process.env.NODE_ENV = 'test';

import assert from 'node:assert/strict';
import {
  LearningUnit,
} from '../../../shared';
import { LearningUnitActor, LearningUnitFilterInput } from '../../../database/firestore/repositories/learning-units.repository';
import { LearningUnitPlanningService } from '../../../backend/features/planning/services/learning-unit-planning.service';
import {
  CreateLearningUnitPlanningRequestSchema,
  SubmitLearningUnitForVerificationRequestSchema,
  UpdateLearningUnitPlanningRequestSchema,
} from '../../../shared/contracts/learning-unit-planning.contract';
import {
  ConcurrencyConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../../src/lib/errors';

type LearningUnitRepositoryDouble = {
  create(input: any, options: { actor: LearningUnitActor }): Promise<LearningUnit>;
  update(id: string, updates: any, options: { expectedVersion: number; actor: LearningUnitActor }): Promise<LearningUnit>;
  findById(id: string): Promise<LearningUnit | null>;
  query(filter?: LearningUnitFilterInput): Promise<LearningUnit[]>;
};

function buildRecord(id: string, actor: LearningUnitActor, overrides: Partial<LearningUnit> = {}): LearningUnit {
  const timestamp = new Date().toISOString();
  return {
    id,
    topicId: 'topic_percentages',
    topicName: 'Percentages',
    subtopicId: 'sub_discounts',
    subtopicName: 'Discounts',
    title: 'Compare two store discounts',
    learningObjective: 'Viewers will compare percentage and flat discounts accurately.',
    verifiedMethod: 'Calculate each discount from the original price, then compare final prices.',
    skillLevel: 'BEGINNER',
    primaryFormat: 'VIDEO',
    planningStatus: 'DRAFT',
    authorId: actor.id,
    authorName: actor.name,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  } as LearningUnit;
}

async function runS11T03Tests(): Promise<void> {
  const records = new Map<string, LearningUnit>();
  const auditEvents: Array<Record<string, unknown>> = [];
  let nextId = 1;
  const repository: LearningUnitRepositoryDouble = {
    async create(input, { actor }) {
      const record = buildRecord(`lnu_test_${nextId++}`, actor, input);
      records.set(record.id, record);
      return record;
    },
    async update(id, updates, { expectedVersion, actor }) {
      const existing = records.get(id);
      if (!existing) throw new NotFoundError(`LearningUnit with ID "${id}" does not exist.`);
      if (existing.authorId !== actor.id && actor.role !== 'ADMIN') {
        throw new ForbiddenError('Actor cannot modify this learning unit.');
      }
      if (existing.version !== expectedVersion) {
        throw new ConcurrencyConflictError('learning_units', id, expectedVersion, existing.version);
      }
      const updated = {
        ...existing,
        ...updates,
        version: existing.version + 1,
        updatedAt: new Date().toISOString(),
      };
      records.set(id, updated);
      return updated;
    },
    async findById(id) {
      return records.get(id) || null;
    },
    async query(filter) {
      return [...records.values()].filter((record) => !filter?.topicId || record.topicId === filter.topicId);
    },
  };
  const auditLogger = {
    async log(actorId: string, actorName: string, action: string, entityType: string, entityId: string, changes?: Record<string, unknown>) {
      auditEvents.push({ actorId, actorName, action, entityType, entityId, changes });
    },
  };
  const service = new LearningUnitPlanningService(repository as any, auditLogger);
  const actor: LearningUnitActor = { id: 'usr_author_01', name: 'Author One', role: 'QUESTION_AUTHOR' };

  assert.equal(
    CreateLearningUnitPlanningRequestSchema.safeParse({ operation: 'SAVE_DRAFT', title: '' }).success,
    false,
    'Invalid create requests must fail validation for the API 400 contract'
  );
  assert.equal(
    UpdateLearningUnitPlanningRequestSchema.safeParse({ operation: 'SAVE_DRAFT', title: 'Missing version' }).success,
    false,
    'Updates must require an expected OCC version'
  );
  assert.equal(
    SubmitLearningUnitForVerificationRequestSchema.safeParse({ expectedVersion: 0 }).success,
    false,
    'Submissions must reject invalid OCC versions'
  );

  const created = await service.saveDraft({
    topicId: 'topic_percentages',
    subtopicId: 'sub_discounts',
    title: 'Compare two store discounts',
    learningObjective: 'Viewers will compare percentage and flat discounts accurately.',
    verifiedMethod: 'Calculate each discount from the original price, then compare final prices.',
    skillLevel: 'BEGINNER',
  } as any, actor);
  assert.equal(created.operation, 'SAVE_DRAFT');
  assert.equal(created.workflowAdvanced, false);
  assert.equal(created.learningUnit.planningStatus, 'DRAFT');
  assert.equal((created.learningUnit as any).authorId, undefined);
  assert.equal((created.learningUnit as any).authorName, undefined);
  assert.equal(auditEvents[0].actorId, actor.id);

  const id = created.learningUnit.id;
  const loaded = await service.get(id);
  assert.equal(loaded.id, id);
  assert.equal((await service.list({ topicId: 'topic_percentages' })).length, 1);

  const updated = await service.updateDraft(id, { title: 'Compare supermarket discounts' }, 1, actor);
  assert.equal(updated.learningUnit.version, 2);
  assert.equal(updated.learningUnit.planningStatus, 'DRAFT');

  await assert.rejects(
    () => service.updateDraft(id, { title: 'Stale update' }, 1, actor),
    (error: unknown) => error instanceof ConcurrencyConflictError && (error as ConcurrencyConflictError).statusCode === 409
  );

  const submitted = await service.submitForVerification(id, 2, actor);
  assert.equal(submitted.operation, 'SUBMIT_FOR_VERIFICATION');
  assert.equal(submitted.learningUnit.planningStatus, 'SUBMITTED_FOR_VERIFICATION');
  assert.equal(submitted.workflowAdvanced, false);
  assert.equal(auditEvents[2].actorId, actor.id);
  await assert.rejects(
    () => service.submitForVerification(id, 3, actor),
    (error: unknown) => error instanceof ValidationError &&
      error.message.includes('cannot be submitted for verification')
  );

  const concurrentId = 'lnu_concurrent_submit';
  records.set(concurrentId, buildRecord(concurrentId, actor));
  const concurrentResults = await Promise.allSettled([
    service.submitForVerification(concurrentId, 1, actor),
    service.submitForVerification(concurrentId, 1, actor),
  ]);
  assert.equal(
    concurrentResults.filter((result) => result.status === 'fulfilled').length,
    1,
    'Concurrent submissions must produce exactly one successful transition'
  );
  assert.equal(
    concurrentResults.filter((result) => result.status === 'rejected').length,
    1,
    'The losing concurrent submission must be rejected by the authoritative state guard or OCC'
  );
  assert.equal(
    auditEvents.filter((event) => event.entityId === concurrentId).length,
    1,
    'Rejected concurrent submissions must not append a second audit event'
  );

  await assert.rejects(() => service.get('lnu_missing'), (error: unknown) => error instanceof NotFoundError);
  await assert.rejects(
    () => service.updateDraft(id, { title: 'Unauthorized update' }, 3, { id: 'usr_other', name: 'Other', role: 'QUESTION_AUTHOR' }),
    (error: unknown) => error instanceof ForbiddenError
  );

  console.log('PASS: S11-T03 planning service CRUD, OCC, operations, actor attribution, and safe DTO projection.');
}

runS11T03Tests().catch((error) => {
  console.error('FAIL: S11-T03 planning service tests', error);
  process.exitCode = 1;
});
