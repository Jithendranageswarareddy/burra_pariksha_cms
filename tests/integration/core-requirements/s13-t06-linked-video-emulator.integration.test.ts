/**
 * S13-T06 — Emulator acceptance for one LearningUnit-linked video path.
 *
 * This test deliberately uses the Firestore emulator only. Drive and AI are
 * represented by metadata-only test doubles: the acceptance path must persist
 * the linkage and workflow evidence without calling either external provider.
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
import { workflowHistoryRepository, workflowInstancesRepository } from '../../../backend/domain/workflow/workflow.repository';
import { workflowService } from '../../../backend/domain/workflow';
import { canonicalIdService } from '../../../shared';
import { QuestionStatus, VideoProductionStatus, PriorityLevel } from '../../../shared';
import { createSyntheticLearningUnitPayload } from '../../fixtures/synthetic-test-fixtures';
import { ConcurrencyConflictError } from '../../../src/lib/errors';
import { auditDispatcher } from '../../../src/lib/audit';

const actor = {
  id: 'USR-S13-T06-ADMIN',
  name: 'S13-T06 Synthetic Admin',
  role: 'ADMIN',
  roles: ['ADMIN'],
};

async function probeEmulator(): Promise<boolean> {
  return new Promise((resolve) => {
    const request = http.get('http://127.0.0.1:8080', (response) => resolve(response.statusCode === 200));
    request.on('error', () => resolve(false));
    request.setTimeout(3000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function run() {
  await resetAdminApp();
  const target = assertDatastoreSafe();
  assert.equal(target.mode, 'LOCAL_FIRESTORE_EMULATOR');
  assert.equal(target.projectId, 'burra-pariksha-test');
  assert.equal(target.databaseId, '(default)');
  assert.equal(target.isProductionTarget, false);
  assert.equal(await probeEmulator(), true, 'S13-T06 requires the local Firestore emulator.');

  const db = getAdminFirestore();
  await db.collection('learning_units').limit(1).get();
  assert.equal(await new LearningUnitsRepository().getPersistenceMode(), 'FIRESTORE');

  const learningUnitId = canonicalIdService.generateLearningUnitId();
  const questionId = canonicalIdService.generateQuestionId();
  const videoId = canonicalIdService.generateVideoId();
  const workflowIds: string[] = [];
  const createdCollections: Array<{ collection: string; id: string; version: number }> = [];
  const auditIds = new Set<string>();
  const now = new Date().toISOString();

  try {
    const learningUnits = new LearningUnitsRepository();
    const learningUnit = await learningUnits.create({
      id: learningUnitId,
      ...createSyntheticLearningUnitPayload(learningUnitId),
    });
    createdCollections.push({ collection: 'learning_units', id: learningUnit.id, version: learningUnit.version });

    const questionRepository = await questionsRepository.getFirestoreRepository();
    const question = await questionRepository.create({
      id: questionId,
      learningUnitId,
      topicId: 'topic-percentages',
      topicName: 'Percentages',
      subtopicId: 'subtopic-discounts',
      subtopicName: 'Discounts',
      difficulty: 'EASY',
      language: 'TELUGU',
      questionText: '[SYNTHETIC S13-T06] What is 20% of ₹1000?',
      options: { a: '₹20', b: '₹200', c: '₹800', d: '₹1200' },
      correctAnswer: 'B',
      explanation: '20% of ₹1000 is ₹200.',
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      authorId: actor.id,
    }, { actorId: actor.id, requestId: 'req_s13_t06_question' });
    createdCollections.push({ collection: 'questions', id: question.id, version: question.version });

    const videoRepository = await videosRepository.getFirestoreRepository();
    const video = await videoRepository.create({
      id: videoId,
      learningUnitId,
      questionId,
      title: '[SYNTHETIC S13-T06] Linked video',
      status: VideoProductionStatus.QUEUED,
      priority: PriorityLevel.NORMAL,
      targetDurationSeconds: 45,
      notes: 'Metadata-only emulator acceptance; no Drive upload.',
    }, { actorId: actor.id, requestId: 'req_s13_t06_video' });
    createdCollections.push({ collection: 'videos', id: video.id, version: video.version });

    const persistedVideo = await videosRepository.findById(videoId);
    assert.equal(persistedVideo?.learningUnitId, learningUnitId);
    assert.equal(persistedVideo?.questionId, questionId);

    const workflow = await workflowService.createInstance({
      entityType: 'VIDEO',
      entityId: videoId,
      currentStep: 1,
      authorId: actor.id,
      contentStatus: 'DRAFT',
      mediaStatus: 'NOT_REQUIRED',
      publicationStatus: 'UNPUBLISHED',
      jobStatus: 'IDLE',
      metadata: { learningUnitId, testOnly: true, externalProviders: 'MOCKED_METADATA_ONLY' },
    }, actor);
    workflowIds.push(workflow.id);

    const transitioned = await workflowService.transition(workflow.id, {
      targetStep: 2,
      action: 'QUESTION_SUBMIT',
      reason: 'Synthetic linked video submitted for emulator acceptance',
      expectedVersion: workflow.version,
    }, actor, { requestId: 'req_s13_t06_transition' });
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
        reason: 'Stale synthetic OCC attempt',
        expectedVersion: 1,
      }, actor, { requestId: 'req_s13_t06_stale' }),
      (error: unknown) => error instanceof ConcurrencyConflictError
    );

    const auditDocuments = await db.collection('audit_events').get();
    for (const document of auditDocuments.docs) {
      const data = document.data();
      const resourceId = data.resource?.resourceId;
      if ([workflow.id, videoId, questionId].includes(resourceId)) {
        auditIds.add(document.id);
      }
    }
    assert.ok(auditIds.size >= 3, 'Expected persistence and workflow audit records in the emulator.');
    console.log('S13-T06 emulator acceptance passed: linked video persistence, workflow history, audit append, and OCC rejection.');
  } finally {
    for (const workflowId of workflowIds) {
      const workflow = await workflowInstancesRepository.findById(workflowId);
      if (workflow) await workflowInstancesRepository.delete(workflowId, workflow.version, { actorId: actor.id }, true);
      const history = await workflowHistoryRepository.findMany({ where: { workflowId } });
      for (const entry of history) {
        await workflowHistoryRepository.delete(entry.id, entry.version, { actorId: actor.id }, true);
      }
    }
    for (const record of createdCollections.reverse()) {
      const collection = db.collection(record.collection).doc(record.id);
      await collection.delete();
    }
    const allAuditDocuments = await db.collection('audit_events').get();
    for (const document of allAuditDocuments.docs) {
      const resourceId = document.data().resource?.resourceId;
      if ([workflowIds[0], videoId, questionId, learningUnitId].includes(resourceId)) {
        auditIds.add(document.id);
      }
    }
    for (const auditId of auditIds) {
      await db.collection('audit_events').doc(auditId).delete();
    }
    assert.equal((await db.collection('learning_units').doc(learningUnitId).get()).exists, false);
    assert.equal((await db.collection('questions').doc(questionId).get()).exists, false);
    assert.equal((await db.collection('videos').doc(videoId).get()).exists, false);
    if (workflowIds.length > 0) {
      assert.equal((await db.collection('workflow_instances').doc(workflowIds[0]).get()).exists, false);
    }
    assert.equal((await db.collection('audit_events').get()).docs.some((doc) => {
      const resourceId = doc.data().resource?.resourceId;
      return [workflowIds[0], videoId, questionId, learningUnitId].includes(resourceId);
    }), false);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
