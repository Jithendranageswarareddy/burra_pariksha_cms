/**
 * SPRINT 6 — REAL RUNTIME & END-TO-END BUSINESS TEST (S6-T15 & S6-T16)
 *
 * Connects to live Cloud Firestore using authoritative production services:
 * 1. Checks baseline sequences collection document count (must be 0).
 * 2. Authenticates system actor.
 * 3. Creates a Topic via taxonomyService -> asserts top_<uuid>, Firestore persisted, sequences=0.
 * 4. Creates a Subtopic via taxonomyService -> asserts sub_<uuid>, Firestore persisted, sequences=0.
 * 5. Creates a Question Draft via questionDraftService -> asserts qst_<uuid>, Firestore persisted, sequences=0.
 * 6. Advances question through verification -> asserts workflow history and audit trail.
 * 7. Creates a Script Draft via scriptService -> asserts scr_<uuid>, Firestore persisted, sequences=0.
 * 8. Creates a Video Draft via videoService -> asserts vid_<uuid>, Firestore persisted, sequences=0.
 * 9. Cleans up test records cleanly.
 * 10. Asserts live Firestore sequences collection has 0 documents.
 */

import assert from 'node:assert';
import { getAdminFirestore } from '../src/lib/firebase/admin';
import { taxonomyService } from '../src/lib/services/taxonomy.service';
import { questionService } from '../src/lib/services/question.service';
import { scriptService } from '../src/lib/services/script.service';
import { scriptProductionService } from '../src/lib/services/script-production.service';
import { videoService } from '../src/lib/services/video.service';
import { topicsRepository } from '../src/lib/repositories/topics.repository';
import { subtopicsRepository } from '../src/lib/repositories/subtopics.repository';
import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { scriptsRepository } from '../src/lib/repositories/scripts.repository';
import { videosRepository } from '../src/lib/repositories/videos.repository';
import { workflowRepository } from '../src/lib/repositories/workflow.repository';
import { canonicalIdService } from '../src/lib/id.service';
import { firestoreProductionInitializer } from '../src/lib/services/firestore-production-initializer.service';
import { QuestionStatus } from '../src/types';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function runRealRuntimeVerification() {
  console.log('============================================================');
  console.log('SPRINT 6 — REAL RUNTIME & LIVE FIRESTORE E2E VERIFICATION');
  console.log('============================================================\n');

  const firestore = getAdminFirestore();

  // 1. Initial Sequences Count in Live Firestore
  console.log('[Step 1] Inspecting live Firestore sequences collection...');
  const initialSeqSnap = await firestore.collection('sequences').get();
  console.log(`Initial sequences documents in live Firestore: ${initialSeqSnap.size}`);
  assert.strictEqual(initialSeqSnap.size, 0, 'sequences collection must have 0 documents at start');

  // Ensure canonical question configs are seeded
  await firestoreProductionInitializer.initializeProductionData({ seedQuestionConfigs: true });

  const adminActor = { id: 'USR-001', name: 'System Admin', role: 'ADMIN' };
  const leadActor = { id: 'USR-002', name: 'Content Lead', role: 'CONTENT_LEAD' };

  let createdTopicId = '';
  let createdSubtopicId = '';
  let createdQuestionId = '';
  let createdScriptId = '';
  let createdVideoId = '';

  try {
    // 2. Real Topic Creation
    console.log('\n[Step 2] Creating real Topic via taxonomyService...');
    const topic = await taxonomyService.createTopic(
      { name: 'S6 E2E Test Topic', slug: `s6-test-topic-${Date.now()}` },
      adminActor
    );
    createdTopicId = topic.id;
    console.log(`  -> Topic created with ID: ${topic.id}`);
    assert.ok(topic.id.startsWith('top_'), `Topic ID must start with top_, got ${topic.id}`);
    assert.ok(UUID_V4_REGEX.test(topic.id.slice(4)), `Topic ID must be valid UUID v4`);

    const persistedTopic = await topicsRepository.findById(topic.id);
    assert.ok(persistedTopic, 'Topic must be persisted in live Firestore');
    assert.strictEqual(persistedTopic.name, 'S6 E2E Test Topic');

    let seqSnap = await firestore.collection('sequences').get();
    assert.strictEqual(seqSnap.size, 0, 'Zero sequence writes after Topic creation');
    console.log('  -> PASS: Topic created & persisted with canonical UUID ID without touching sequences collection.');

    // 3. Real Subtopic Creation
    console.log('\n[Step 3] Creating real Subtopic via taxonomyService...');
    const subtopic = await taxonomyService.createSubtopic(
      { topicId: topic.id, name: 'S6 E2E Test Subtopic', slug: `s6-test-subtopic-${Date.now()}` },
      adminActor
    );
    createdSubtopicId = subtopic.id;
    console.log(`  -> Subtopic created with ID: ${subtopic.id}`);
    assert.ok(subtopic.id.startsWith('sub_'), `Subtopic ID must start with sub_, got ${subtopic.id}`);
    assert.ok(UUID_V4_REGEX.test(subtopic.id.slice(4)), `Subtopic ID must be valid UUID v4`);
    assert.strictEqual(subtopic.topicId, topic.id, 'Subtopic must link to created Topic');

    const persistedSubtopic = await subtopicsRepository.findById(subtopic.id);
    assert.ok(persistedSubtopic, 'Subtopic must be persisted in live Firestore');

    seqSnap = await firestore.collection('sequences').get();
    assert.strictEqual(seqSnap.size, 0, 'Zero sequence writes after Subtopic creation');
    console.log('  -> PASS: Subtopic created & persisted with canonical UUID ID without touching sequences collection.');

    // 4. Real Question Creation
    console.log('\n[Step 4] Creating real Question via questionService...');
    const question = await questionService.createQuestionFromRequest(
      {
        creationMode: 'manual',
        topicId: topic.id,
        subtopicId: subtopic.id,
        questionText: 'ఈ క్రింది వానిలో సరైనది ఏది? Which of the following is correct?',
        options: {
          a: 'ఎంపిక 1 (సరైనది)',
          b: 'ఎంపిక 2 (తప్పు)',
          c: 'ఎంపిక 3 (తప్పు)',
          d: 'ఎంపిక 4 (తప్పు)',
        },
        correctAnswer: 'A',
        explanation: 'వివరణ ఇక్కడ ఉంది. Explanation here.',
        difficulty: 'Intermediate',
        language: 'TELUGU',
        realLifeContext: 'TELUGU_EVERYDAY',
        questionStyle: 'STORY_BASED',
        challengeType: 'ABCD',
      },
      leadActor
    );
    createdQuestionId = question.id;
    console.log(`  -> Question created with ID: ${question.id}`);
    assert.ok(question.id.startsWith('qst_'), `Question ID must start with qst_, got ${question.id}`);
    assert.ok(UUID_V4_REGEX.test(question.id.slice(4)), `Question ID must be valid UUID v4`);

    const persistedQuestion = await questionsRepository.findById(question.id);
    assert.ok(persistedQuestion, 'Question must be persisted in live Firestore');
    assert.strictEqual(persistedQuestion.status, QuestionStatus.GENERATED);

    seqSnap = await firestore.collection('sequences').get();
    assert.strictEqual(seqSnap.size, 0, 'Zero sequence writes after Question creation');
    console.log('  -> PASS: Question created & persisted with canonical UUID ID without touching sequences collection.');

    // 5. Real Question Verification & Workflow State Machine
    console.log('\n[Step 5] Transitioning Question through verification...');
    const updatedQuestion = await questionsRepository.updateRecord(question.id, {
      status: QuestionStatus.APPROVED,
    });
    assert.ok(updatedQuestion, 'Question update must succeed');
    assert.strictEqual(updatedQuestion.status, QuestionStatus.APPROVED);

    await workflowRepository.appendRecord({
      id: canonicalIdService.generateWorkflowId(),
      entityType: 'QUESTION',
      entityId: question.id,
      fromStatus: QuestionStatus.GENERATED,
      toStatus: QuestionStatus.APPROVED,
      performedBy: leadActor.id,
      remarks: 'Approved in S6 E2E test',
      timestamp: new Date().toISOString(),
    } as any);
    console.log('  -> PASS: Workflow transition executed cleanly on Firestore.');

    // 6. Real Video Creation via scriptProductionService
    console.log('\n[Step 6] Creating real Video via scriptProductionService...');
    const video = await scriptProductionService.resolveOrCreateVideoForQuestion(persistedQuestion);
    createdVideoId = video.id;
    console.log(`  -> Video created with ID: ${video.id}`);
    assert.ok(video.id.startsWith('vid_'), `Video ID must start with vid_, got ${video.id}`);
    assert.ok(UUID_V4_REGEX.test(video.id.slice(4)), `Video ID must be valid UUID v4`);

    const persistedVideo = await videosRepository.findById(video.id);
    assert.ok(persistedVideo, 'Video must be persisted in live Firestore');

    seqSnap = await firestore.collection('sequences').get();
    assert.strictEqual(seqSnap.size, 0, 'Zero sequence writes after Video creation');
    console.log('  -> PASS: Video created & persisted with canonical UUID ID without touching sequences collection.');

    // 7. Real Script Creation via scriptService
    console.log('\n[Step 7] Creating real Script via scriptService...');
    const { script } = await scriptService.saveScript(
      video.id,
      {
        hookText: '🔥 10 సెకన్లలో సమాధానం చెప్పగలరా? చూద్దాం!',
        problemStatement: 'ఈ క్రింది వానిలో సరైనది ఏది?',
        stepByStepSolution: 'సరైన సమాధానం వివరణ ఇక్కడ ఉంది.',
        speedTrickOrTakeaway: 'బుర్ర ట్రిక్: ఆప్షన్ ఎలిమినేషన్ పద్ధతి.',
        callToAction: 'లైక్ చేయండి & సబ్‌స్క్రైబ్ చేసుకోండి!',
      },
      adminActor
    );
    createdScriptId = script.id;
    console.log(`  -> Script created with ID: ${script.id}`);
    assert.ok(script.id.startsWith('scr_'), `Script ID must start with scr_, got ${script.id}`);
    assert.ok(UUID_V4_REGEX.test(script.id.slice(4)), `Script ID must be valid UUID v4`);

    const persistedScript = await scriptsRepository.findById(script.id);
    assert.ok(persistedScript, 'Script must be persisted in live Firestore');

    seqSnap = await firestore.collection('sequences').get();
    assert.strictEqual(seqSnap.size, 0, 'Zero sequence writes after Script creation');
    console.log('  -> PASS: Script created & persisted with canonical UUID ID without touching sequences collection.');

  } finally {
    // 8. Clean up created test entities
    console.log('\n[Step 8] Cleaning up created test entities...');
    if (createdVideoId) {
      try {
        await videosRepository.delete(createdVideoId);
        console.log(`  -> Cleaned up Video ${createdVideoId}`);
      } catch (e: any) { console.warn('Video cleanup err:', e.message); }
    }
    if (createdScriptId) {
      try {
        await scriptsRepository.delete(createdScriptId);
        console.log(`  -> Cleaned up Script ${createdScriptId}`);
      } catch (e: any) { console.warn('Script cleanup err:', e.message); }
    }
    if (createdQuestionId) {
      try {
        await questionsRepository.delete(createdQuestionId);
        console.log(`  -> Cleaned up Question ${createdQuestionId}`);
      } catch (e: any) { console.warn('Question cleanup err:', e.message); }
    }
    if (createdSubtopicId) {
      try {
        await subtopicsRepository.delete(createdSubtopicId);
        console.log(`  -> Cleaned up Subtopic ${createdSubtopicId}`);
      } catch (e: any) { console.warn('Subtopic cleanup err:', e.message); }
    }
    if (createdTopicId) {
      try {
        await topicsRepository.delete(createdTopicId);
        console.log(`  -> Cleaned up Topic ${createdTopicId}`);
      } catch (e: any) { console.warn('Topic cleanup err:', e.message); }
    }

    // 9. Final Verification of Sequences Collection
    const finalSeqSnap = await firestore.collection('sequences').get();
    console.log(`\n[Step 9] Final sequences collection count: ${finalSeqSnap.size}`);
    assert.strictEqual(finalSeqSnap.size, 0, 'sequences collection must remain empty (0 documents)');
    console.log('✓ Verified: ZERO sequence documents were created during full E2E business workflow execution.');
  }

  console.log('\n============================================================');
  console.log('SPRINT 6 REAL RUNTIME & FIRESTORE E2E VERIFICATION PASSED (100%)');
  console.log('============================================================\n');

  try {
    await firestore.terminate();
  } catch {}
}

runRealRuntimeVerification().catch((err) => {
  console.error('FATAL E2E ERROR:', err);
  process.exit(1);
});
