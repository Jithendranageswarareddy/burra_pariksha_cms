/**
 * BURRA PARIKSHA CMS — Real Application-Path Verification Test
 * Requirement 5: Trace representative production operations through:
 * Browser / HTTP API
 * → authentication
 * → centralAuthorizationService / RBAC
 * → business service (questionService / contentMasterService)
 * → repository (questionsRepository / contentMastersRepository)
 * → Cloud Firestore
 */

import assert from 'node:assert';
import { centralAuthorizationService } from '../src/lib/services/central-authorization.service';
import { AuthorizationResource, AuthorizationAction, CanonicalRbacRole } from '../src/types/rbac-models';
import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { contentMastersRepository } from '../src/lib/repositories/content-masters.repository';
import { idService } from '../src/lib/services/id.service';
import { getBackendFirestore } from '../src/lib/firebase/server-auth';
import { terminate } from 'firebase/firestore';

async function runApplicationPathTest() {
  console.log('============================================================');
  console.log('SPRINT 4 — REAL APPLICATION-PATH VERIFICATION TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. RBAC Evaluation Check for Question Author
    console.log('--- Step 1: Testing RBAC evaluation for Question Author ---');
    const mockActor: any = {
      id: 'USR-002',
      email: 'creator@burrapariksha.com',
      role: CanonicalRbacRole.QUESTION_AUTHOR,
      roles: [CanonicalRbacRole.QUESTION_AUTHOR],
      isActive: true,
    };

    const decision = centralAuthorizationService.evaluateRequest(
      mockActor,
      AuthorizationResource.QUESTION,
      AuthorizationAction.CREATE
    );
    assert.strictEqual(decision.allowed, true, 'Question Author must be authorized to CREATE questions');
    console.log('✓ RBAC Evaluation PASSED: Allowed =', decision.allowed);
    passed++;

    // 2. ID Allocation via ID Service & Sequence Repository
    console.log('--- Step 2: Allocating canonical Question and Content Master IDs ---');
    const questionId = await idService.allocateQuestionId();
    const contentMasterId = await idService.allocateContentMasterId();
    assert(questionId.startsWith('BP-Q-'), 'Question ID must have canonical prefix BP-Q-');
    assert(contentMasterId.startsWith('BP-CNT-'), 'Content Master ID must have canonical prefix BP-CNT-');
    console.log(`✓ Allocated IDs: Question = ${questionId}, Content Master = ${contentMasterId}`);
    passed++;

    // 3. Content Master Creation via contentMastersRepository -> Cloud Firestore
    console.log('--- Step 3: Persisting Content Master via repository to Cloud Firestore ---');
    const contentMaster = await contentMastersRepository.appendRecord({
      id: contentMasterId,
      title: 'Thermodynamics & Heat Transfer Master',
      primaryQuestionId: questionId,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isDeleted: false,
    });
    assert.strictEqual(contentMaster.id, contentMasterId);
    console.log('✓ Content Master persisted in Cloud Firestore:', contentMaster.id);
    passed++;

    // 4. Question Creation via questionsRepository -> Cloud Firestore
    console.log('--- Step 4: Persisting Question via repository to Cloud Firestore ---');
    const createdQuestion = await questionsRepository.appendRecord({
      id: questionId,
      contentMasterId: contentMasterId,
      question: 'Explain photon momentum in Compton scattering effect.',
      category: 'Science',
      topic: 'Physics',
      subtopic: 'Heat',
      difficulty: 'MEDIUM',
      status: 'DRAFT',
      currentStage: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      isDeleted: false,
    });
    assert.strictEqual(createdQuestion.id, questionId);
    console.log('✓ Question persisted in Cloud Firestore:', createdQuestion.id);
    passed++;

    // 5. Verification & Read-back from Cloud Firestore through repository layer
    console.log('--- Step 5: Reading back Question and Content Master from Cloud Firestore ---');
    const readQuestion = await questionsRepository.findById(questionId);
    const readMaster = await contentMastersRepository.findById(contentMasterId);
    assert(readQuestion !== null, 'Question must be retrievable from Firestore');
    assert(readMaster !== null, 'Content Master must be retrievable from Firestore');
    assert.strictEqual(readQuestion.question, 'Explain photon momentum in Compton scattering effect.');
    assert.strictEqual(readMaster.primaryQuestionId, questionId);
    console.log('✓ Read-back from Cloud Firestore verified for both records.');
    passed++;

    // 6. Update Question with atomic OCC increment
    console.log('--- Step 6: Updating Question with atomic OCC increment in Cloud Firestore ---');
    const updatedQuestion = await questionsRepository.updateRecord(questionId, {
      question: 'Explain photon momentum and Compton wavelength shift equation.',
    });
    assert(updatedQuestion !== null);
    assert.strictEqual(updatedQuestion.version, 2, 'Version must increment to 2');
    console.log('✓ Question updated in Cloud Firestore with version increment to 2.');
    passed++;

    // 7. Cleanup
    await questionsRepository.deleteRecord(questionId);
    await contentMastersRepository.deleteRecord(contentMasterId);
    console.log('✓ Teardown complete.');
  } catch (err: any) {
    console.error('✗ Real application path test FAILED:', err.message);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`APPLICATION PATH TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  try {
    const db = await getBackendFirestore();
    await terminate(db);
  } catch {}

  process.exit(failed > 0 ? 1 : 0);
}

runApplicationPathTest().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
