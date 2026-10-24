/**
 * S16-T02 — Emulator acceptance for the existing linked production foundation.
 *
 * The test intentionally uses only synthetic records and the loopback
 * Firestore emulator. Provider fields are metadata-only so this acceptance
 * cannot call Drive, AI, publishing, or any other external service.
 */
process.env.NODE_ENV = 'test';
process.env.USE_FIRESTORE_EMULATOR = 'true';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIRESTORE_TEST_PROJECT_ID = 'burra-pariksha-test';
process.env.FIRESTORE_PROJECT_ID = 'burra-pariksha-test';
process.env.FIRESTORE_DATABASE_ID = '(default)';
delete process.env.PERSISTENCE_MODE;

import assert from 'node:assert/strict';
import http from 'node:http';
import { getAdminFirestore, resetAdminApp } from '../../../database/firestore/adapter/admin';
import { assertDatastoreSafe } from '../../../src/config/datastore-guard';
import { LearningUnitsRepository } from '../../../database/firestore/repositories/learning-units.repository';
import { questionsRepository } from '../../../database/firestore/repositories/questions.repository';
import { videosRepository } from '../../../database/firestore/repositories/videos.repository';
import {
  workflowHistoryRepository,
  workflowInstancesRepository,
} from '../../../backend/domain/workflow/workflow.repository';
import { workflowService } from '../../../backend/domain/workflow';
import { canonicalIdService, QuestionStatus, VideoProductionStatus } from '../../../shared';
import { ConcurrencyConflictError } from '../../../src/lib/errors';
import { createSyntheticLearningUnitPayload } from '../../fixtures/synthetic-test-fixtures';

const actor = {
  id: 'USR-S16-T02-ADMIN',
  name: 'S16-T02 Synthetic Admin',
  role: 'ADMIN',
};

async function emulatorIsReachable(): Promise<boolean> {
  return new Promise((resolve) => {
    const request = http.get('http://127.0.0.1:8080', (response) => resolve(response.statusCode === 200));
    request.on('error', () => resolve(false));
    request.setTimeout(3000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function run(): Promise<void> {
  await resetAdminApp();
  const target = assertDatastoreSafe();
  assert.equal(target.mode, 'LOCAL_FIRESTORE_EMULATOR');
  assert.equal(target.projectId, 'burra-pariksha-test');
  assert.equal(target.databaseId, '(default)');
  assert.equal(target.isProductionTarget, false);
  assert.equal(await emulatorIsReachable(), true, 'S16-T02 requires the loopback Firestore emulator.');

  const db = getAdminFirestore();
  const learningUnitId = canonicalIdService.generateLearningUnitId();
  const questionId = canonicalIdService.generateQuestionId();
  const videoId = canonicalIdService.generateVideoId();
  const workflowIds: string[] = [];
  const auditResourceIds = [learningUnitId, questionId, videoId];
  const now = new Date().toISOString();

  try {
    const learningUnits = new LearningUnitsRepository();
    const learningUnit = await learningUnits.create({
      id: learningUnitId,
      ...createSyntheticLearningUnitPayload(learningUnitId),
    });
    assert.equal((await learningUnits.findById(learningUnitId))?.id, learningUnitId);

    const questionRepository = await questionsRepository.getFirestoreRepository();
    const question = await questionRepository.create({
      id: questionId,
      learningUnitId,
      topicId: 'topic-s16-t02',
      topicName: 'S16-T02 Synthetic Topic',
      subtopicId: 'subtopic-s16-t02',
      subtopicName: 'S16-T02 Synthetic Subtopic',
      difficulty: 'EASY',
      language: 'TELUGU',
      questionText: '[SYNTHETIC S16-T02] Linked question',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
      explanation: 'Synthetic emulator-only record.',
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      authorId: actor.id,
      createdAt: now,
      updatedAt: now,
    }, { actorId: actor.id, requestId: 'req_s16_t02_question' });

    const videoRepository = await videosRepository.getFirestoreRepository();
    const video = await videoRepository.create({
      id: videoId,
      learningUnitId,
      questionId,
      title: '[SYNTHETIC S16-T02] Linked artifact',
      status: VideoProductionStatus.QUEUED,
      priority: 'NORMAL',
      targetDurationSeconds: 45,
      notes: 'Metadata-only; no provider call.',
      createdAt: now,
      updatedAt: now,
    }, { actorId: actor.id, requestId: 'req_s16_t02_video' });

    const persistedVideo = await videosRepository.findById(videoId);
    assert.deepEqual(
      { learningUnitId: persistedVideo?.learningUnitId, questionId: persistedVideo?.questionId },
      { learningUnitId, questionId: question.id }
    );

    const workflow = await workflowService.createInstance({
      entityType: 'VIDEO',
      entityId: video.id,
      currentStep: 1,
      authorId: actor.id,
      contentStatus: 'DRAFT',
      mediaStatus: 'NOT_REQUIRED',
      publicationStatus: 'UNPUBLISHED',
      jobStatus: 'IDLE',
      metadata: { learningUnitId, externalProviders: 'MOCKED_METADATA_ONLY' },
    }, actor);
    workflowIds.push(workflow.id);

    const transitioned = await workflowService.transition(workflow.id, {
      targetStep: 2,
      action: 'QUESTION_SUBMIT',
      reason: 'Synthetic S16-T02 emulator transition',
      expectedVersion: workflow.version,
    }, actor, { requestId: 'req_s16_t02_transition' });
    assert.equal(transitioned.workflow.currentStep, 2);
    assert.equal(transitioned.workflow.version, 2);

    const history = await workflowHistoryRepository.findMany({ where: { workflowId: workflow.id } });
    assert.equal(history.length, 2);
    assert.ok(history.some((entry) => entry.action === 'WORKFLOW_INITIALIZED'));
    assert.ok(history.some((entry) => entry.action === 'QUESTION_SUBMIT'));

    await assert.rejects(
      () => workflowService.transition(workflow.id, {
        targetStep: 3,
        action: 'QUESTION_VERIFY',
        reason: 'Synthetic stale OCC attempt',
        expectedVersion: 1,
      }, actor, { requestId: 'req_s16_t02_stale' }),
      (error: unknown) => error instanceof ConcurrencyConflictError
    );

    const auditDocuments = await db.collection('audit_events').get();
    const linkedAuditDocuments = auditDocuments.docs.filter((document) =>
      [...auditResourceIds, workflow.id].includes(document.data().resource?.resourceId)
    );
    assert.ok(
      linkedAuditDocuments.length >= 3,
      'Expected persisted audit evidence for the linked production path.'
    );
    console.log('PASS: S16-T02 emulator persistence, linkage, workflow history, audit, and stale OCC rejection.');
  } finally {
    for (const workflowId of workflowIds) {
      const workflow = await workflowInstancesRepository.findById(workflowId);
      if (workflow) await workflowInstancesRepository.delete(workflowId, workflow.version, { actorId: actor.id }, true);
      const history = await workflowHistoryRepository.findMany({ where: { workflowId } });
      for (const entry of history) {
        await workflowHistoryRepository.delete(entry.id, entry.version, { actorId: actor.id }, true);
      }
    }
    for (const [collection, id] of [
      ['learning_units', learningUnitId],
      ['questions', questionId],
      ['videos', videoId],
    ] as const) {
      await db.collection(collection).doc(id).delete();
    }
    const audits = await db.collection('audit_events').get();
    for (const document of audits.docs) {
      if ([...auditResourceIds, ...workflowIds].includes(document.data().resource?.resourceId)) {
        await db.collection('audit_events').doc(document.id).delete();
      }
    }
    assert.equal((await db.collection('learning_units').doc(learningUnitId).get()).exists, false);
    assert.equal((await db.collection('questions').doc(questionId).get()).exists, false);
    assert.equal((await db.collection('videos').doc(videoId).get()).exists, false);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
