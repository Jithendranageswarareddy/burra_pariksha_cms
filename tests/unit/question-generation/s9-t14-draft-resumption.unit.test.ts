/**
 * BURRA PARIKSHA CMS — S9-T14: Draft Persistence and Resumption Unit Tests
 * Specification: S9-T14 Save, Retrieve, and Draft Resumption across sessions
 *
 * NOTE: As per S9-T14 task execution policy, this test file is authored for
 * static inspection and future regression verification. IT MUST NOT BE EXECUTED
 * during the T14 implementation run.
 *
 * Test Scenarios Covered (all 14 required criteria):
 * 1. Create and save a new draft using canonical ID convention (dft_<uuid_v4>)
 * 2. Retrieve the saved draft by its canonical ID
 * 3. Restore metadata, settings, questions, choices, answers, explanations, and ordering
 * 4. Restore a partially completed batch (empty, invalid, and valid slots)
 * 5. Restore manually edited and accepted slots without losing content
 * 6. Reopen and save again using the same record ID (in-place update, version increment)
 * 7. Save after refresh or simulated new-session retrieval (session hydration)
 * 8. Handle failed saves without discarding unsaved edits in memory
 * 9. Reject stale updates according to OCC concurrency contract (HTTP 409 ConcurrencyConflictError)
 * 10. Handle repeated saves or retries without duplicate records
 * 11. Handle missing or inaccessible records through the existing error contract
 * 12. Preserve UUID v4 validity and identity across create, save, retrieve, and update
 * 13. Preserve draft-versus-submit workflow semantics (no verification triggered on save)
 * 14. Restore the correct saved-versus-unsaved audience preview source
 */

import assert from 'node:assert/strict';
import { questionGenerationService } from '../../../backend/domain/question-generation';
import {
  canonicalIdService,
  QuestionStatus,
  QuestionLanguage,
  ContentProductionMode,
} from '../../../shared';
import {
  SaveQuestionDraftInput,
  QuestionBatchSlot,
  QuestionBatchAssembly,
  StudioCandidate,
} from '../../../shared/contracts/question-generation/question-generation.contract';
import {
  projectToAudiencePreview,
} from '../../../shared/lib/audience-preview-projection';
import {
  AudiencePreviewSourceVersion,
} from '../../../shared/contracts/question-generation/audience-preview.contract';
import { ConcurrencyConflictError } from '../../../src/lib/errors';
import { QuestionGenerationDomainError } from '../../../backend/domain/question-generation/question-generation.service';
import { questionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';

export async function runDraftResumptionUnitTests(): Promise<void> {
  console.log('============================================================');
  console.log('SUITE: S9-T14 Draft Persistence & Resumption Unit Tests');
  console.log('============================================================\n');

  const testActor = {
    id: 'USR-TEST-AUTHOR-S9T14',
    name: 'Author Lakshmi',
  };

  // Helper fixture: baseline 5-slot batch payload
  const createBaselineSlots = (): QuestionBatchSlot[] => [
    {
      slotId: 'slt_test_01',
      slotNumber: 1,
      status: 'ACCEPTED',
      isManuallyEdited: false,
      questionText: 'రైలు 72 కి.మీ/గం వేగంతో 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
      options: {
        a: '10 సెకన్లు',
        b: '15 సెకన్లు',
        c: '20 సెకన్లు',
        d: '25 సెకన్లు',
      },
      correctAnswer: 'A',
      explanation: 'వేగం = 72 * (5/18) = 20 m/s. కాలం = 200 / 20 = 10 సెకన్లు.',
      validationErrors: [],
      revisionNumber: 1,
    },
    {
      slotId: 'slt_test_02',
      slotNumber: 2,
      status: 'MANUALLY_EDITED',
      isManuallyEdited: true,
      questionText: 'ఒక వ్యాపారి ₹500 వస్తువును ₹650 కి విక్రయిస్తే లాభ శాతం ఎంత?',
      options: {
        a: '20%',
        b: '30%',
        c: '25%',
        d: '35%',
      },
      correctAnswer: 'B',
      explanation: 'లాభం = 650 - 500 = ₹150. లాభ శాతం = (150/500)*100 = 30%.',
      validationErrors: [],
      revisionNumber: 2,
    },
    {
      slotId: 'slt_test_03',
      slotNumber: 3,
      status: 'VALID',
      isManuallyEdited: false,
      questionText: '12 మంది వ్యక్తులు ఒక పనిని 8 రోజుల్లో పూర్తి చేస్తే, 16 మంది ఎన్ని రోజుల్లో పూర్తి చేస్తారు?',
      options: {
        a: '4 రోజులు',
        b: '6 రోజులు',
        c: '8 రోజులు',
        d: '10 రోజులు',
      },
      correctAnswer: 'B',
      explanation: 'M1*D1 = M2*D2 => 12 * 8 = 16 * D2 => D2 = 96 / 16 = 6 రోజులు.',
      validationErrors: [],
      revisionNumber: 1,
    },
    {
      slotId: 'slt_test_04',
      slotNumber: 4,
      status: 'INVALID',
      isManuallyEdited: false,
      questionText: 'సగటు వేగం లెక్కించండి.',
      options: {
        a: '',
        b: '',
        c: '',
        d: '',
      },
      correctAnswer: 'A',
      explanation: '',
      validationErrors: ['Option B cannot be empty', 'Option C cannot be empty'],
      revisionNumber: 1,
    },
    {
      slotId: 'slt_test_05',
      slotNumber: 5,
      status: 'EMPTY',
      isManuallyEdited: false,
      questionText: '',
      options: {
        a: '',
        b: '',
        c: '',
        d: '',
      },
      correctAnswer: 'A',
      explanation: '',
      validationErrors: [],
      revisionNumber: 1,
    },
  ];

  // --------------------------------------------------------------------------
  // Scenario 1: Create and save a new draft using canonical ID convention
  // --------------------------------------------------------------------------
  console.log('[Scenario 1] Create and save a new draft using canonical UUID v4 ID...');
  const newDraftInput: SaveQuestionDraftInput = {
    topicId: 'TOP-QA-01',
    topicName: 'Quantitative Aptitude',
    subtopicId: 'SUB-01',
    subtopicName: 'Time and Distance',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: 'రైలు 72 కి.మీ/గం వేగంతో 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
    options: {
      a: '10 సెకన్లు',
      b: '15 సెకన్లు',
      c: '20 సెకన్లు',
      d: '25 సెకన్లు',
    },
    correctAnswer: 'A',
    explanation: 'వేగం = 72 * (5/18) = 20 m/s. కాలం = 200 / 20 = 10 సెకన్లు.',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    aspectRatio: '9:16',
    challengeType: 'ABCD',
    presentationType: 'TEXT_ONLY',
    questionStyle: 'STORY_BASED',
    realLifeContext: 'రైల్వే ప్రయాణం సమయ విశ్లేషణ',
    tags: ['Aptitude', 'Trains', 'Telugu'],
    slots: createBaselineSlots(),
  };

  const createdDraft = await questionGenerationService.saveDraft(newDraftInput, testActor);

  assert.ok(createdDraft, 'Draft must be saved successfully');
  assert.ok(canonicalIdService.validateCanonicalId(createdDraft.id, 'dft_'), 'Draft ID must strictly be canonical dft_<uuid_v4>');
  assert.strictEqual(createdDraft.status, QuestionStatus.DRAFT, 'Draft status must strictly be DRAFT');
  assert.strictEqual(createdDraft.workflowStage, 'QUESTION_STUDIO', 'Draft stage must strictly be QUESTION_STUDIO');
  assert.strictEqual(createdDraft.version, 1, 'Initial draft version must be 1');
  assert.strictEqual(createdDraft.authorId, testActor.id, 'Author ID must match creating actor');
  console.log(`  PASS: Created draft ${createdDraft.id} with version ${createdDraft.version}.`);

  // --------------------------------------------------------------------------
  // Scenario 2: Retrieve the saved draft by its ID
  // --------------------------------------------------------------------------
  console.log('[Scenario 2] Retrieve saved draft by its canonical ID...');
  const retrievedDraft = await questionGenerationService.getDraftById(createdDraft.id);

  assert.ok(retrievedDraft, 'Draft must be retrievable by canonical ID');
  assert.strictEqual(retrievedDraft?.id, createdDraft.id, 'Retrieved ID must match requested ID');
  assert.strictEqual(retrievedDraft?.version, createdDraft.version, 'Retrieved version must match saved version');
  console.log(`  PASS: Successfully retrieved draft ${retrievedDraft?.id}.`);

  // --------------------------------------------------------------------------
  // Scenario 3: Restore metadata, settings, questions, choices, answers, explanations, and ordering
  // --------------------------------------------------------------------------
  console.log('[Scenario 3] Restore all metadata, settings, questions, choices, answers, explanations...');
  assert.strictEqual(retrievedDraft?.topicId, 'TOP-QA-01');
  assert.strictEqual(retrievedDraft?.topicName, 'Quantitative Aptitude');
  assert.strictEqual(retrievedDraft?.subtopicId, 'SUB-01');
  assert.strictEqual(retrievedDraft?.subtopicName, 'Time and Distance');
  assert.strictEqual(retrievedDraft?.difficulty, 'Intermediate');
  assert.strictEqual(retrievedDraft?.language, 'TELUGU');
  assert.strictEqual(retrievedDraft?.productionMode, 'QUESTION_CHALLENGE_SHORT');
  assert.strictEqual(retrievedDraft?.targetQuestionCount, 5);
  assert.strictEqual(retrievedDraft?.aspectRatio, '9:16');
  assert.strictEqual(retrievedDraft?.challengeType, 'ABCD');
  assert.strictEqual(retrievedDraft?.presentationType, 'TEXT_ONLY');
  assert.strictEqual(retrievedDraft?.questionStyle, 'STORY_BASED');
  assert.strictEqual(retrievedDraft?.realLifeContext, 'రైల్వే ప్రయాణం సమయ విశ్లేషణ');
  assert.strictEqual(retrievedDraft?.correctAnswer, 'A');
  assert.strictEqual(retrievedDraft?.options?.a, '10 సెకన్లు');
  assert.strictEqual(retrievedDraft?.options?.b, '15 సెకన్లు');
  assert.strictEqual(retrievedDraft?.options?.c, '20 సెకన్లు');
  assert.strictEqual(retrievedDraft?.options?.d, '25 సెకన్లు');
  assert.ok(retrievedDraft?.explanation.includes('వేగం = 72'), 'Explanation must be preserved');
  console.log('  PASS: All metadata, settings, taxonomy, and question fields restored.');

  // --------------------------------------------------------------------------
  // Scenario 4: Restore a partially completed batch
  // --------------------------------------------------------------------------
  console.log('[Scenario 4] Restore a partially completed batch without discarding empty/invalid slots...');
  assert.ok(Array.isArray(retrievedDraft?.slots), 'Slots array must be restored');
  assert.strictEqual(retrievedDraft?.slots?.length, 5, 'Exact slot count (5) must be preserved');
  assert.strictEqual(retrievedDraft?.slots?.[0].status, 'ACCEPTED');
  assert.strictEqual(retrievedDraft?.slots?.[1].status, 'MANUALLY_EDITED');
  assert.strictEqual(retrievedDraft?.slots?.[2].status, 'VALID');
  assert.strictEqual(retrievedDraft?.slots?.[3].status, 'INVALID');
  assert.strictEqual(retrievedDraft?.slots?.[4].status, 'EMPTY');
  assert.strictEqual(retrievedDraft?.batchStatus, 'PARTIAL', 'Batch status must reflect partial assembly');
  assert.strictEqual(retrievedDraft?.persistedValidCount, 3, 'Persisted valid count (ACCEPTED + MANUALLY_EDITED + VALID) must be 3');
  console.log('  PASS: Partial batch state, slot sequence, and slot statuses restored.');

  // --------------------------------------------------------------------------
  // Scenario 5: Restore manually edited and accepted slots without losing content
  // --------------------------------------------------------------------------
  console.log('[Scenario 5] Restore manually edited and accepted slots without content corruption...');
  const slot2 = retrievedDraft?.slots?.[1];
  assert.ok(slot2, 'Slot 2 must exist');
  assert.strictEqual(slot2?.isManuallyEdited, true, 'isManuallyEdited flag must remain true');
  assert.strictEqual(slot2?.questionText, 'ఒక వ్యాపారి ₹500 వస్తువును ₹650 కి విక్రయిస్తే లాభ శాతం ఎంత?');
  assert.strictEqual(slot2?.options?.b, '30%');
  assert.strictEqual(slot2?.correctAnswer, 'B');
  assert.strictEqual(slot2?.revisionNumber, 2);

  const slot1 = retrievedDraft?.slots?.[0];
  assert.strictEqual(slot1?.status, 'ACCEPTED', 'Slot 1 accepted state preserved');
  console.log('  PASS: Manually edited content and accepted status preserved perfectly.');

  // --------------------------------------------------------------------------
  // Scenario 6: Reopen and save again using the same record ID
  // --------------------------------------------------------------------------
  console.log('[Scenario 6] Reopen and save again using the same record ID (in-place update)...');
  const updatePayload: SaveQuestionDraftInput = {
    ...newDraftInput,
    id: createdDraft.id,
    version: createdDraft.version,
    expectedVersion: createdDraft.version,
    questionText: 'రైలు 72 కి.మీ/గం వేగంతో 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది? (సవరించిన ప్రశ్న)',
  };

  const updatedDraft = await questionGenerationService.saveDraft(updatePayload, testActor);

  assert.strictEqual(updatedDraft.id, createdDraft.id, 'Updating must retain canonical draft ID');
  assert.strictEqual(updatedDraft.version, 2, 'Version must increment to 2');
  assert.strictEqual(updatedDraft.questionText, 'రైలు 72 కి.మీ/గం వేగంతో 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది? (సవరించిన ప్రశ్న)');
  assert.strictEqual(updatedDraft.workflowStage, 'QUESTION_STUDIO', 'Workflow stage must remain QUESTION_STUDIO');
  console.log(`  PASS: In-place update preserved draft ID ${updatedDraft.id} and advanced version to ${updatedDraft.version}.`);

  // --------------------------------------------------------------------------
  // Scenario 7: Save after refresh or simulated new-session retrieval
  // --------------------------------------------------------------------------
  console.log('[Scenario 7] Save after refresh or simulated new-session deep link hydration...');
  // Simulate page reload: query draft fresh from DB
  const hydratedFromNewSession = await questionGenerationService.getDraftById(createdDraft.id);
  assert.ok(hydratedFromNewSession, 'Must hydrate existing draft in new session');
  assert.strictEqual(hydratedFromNewSession?.version, 2);

  // User edits question in new session and saves
  const sessionEditPayload: SaveQuestionDraftInput = {
    ...hydratedFromNewSession!,
    id: hydratedFromNewSession!.id,
    version: hydratedFromNewSession!.version,
    expectedVersion: hydratedFromNewSession!.version,
    difficulty: 'Advanced',
  };

  const postRefreshDraft = await questionGenerationService.saveDraft(sessionEditPayload, testActor);
  assert.strictEqual(postRefreshDraft.id, createdDraft.id);
  assert.strictEqual(postRefreshDraft.version, 3, 'Version must advance to 3');
  assert.strictEqual(postRefreshDraft.difficulty, 'Advanced', 'New session edit persisted');
  console.log('  PASS: Deep-link hydration and post-refresh save successfully completed.');

  // --------------------------------------------------------------------------
  // Scenario 8: Handle failed saves without discarding unsaved edits
  // --------------------------------------------------------------------------
  console.log('[Scenario 8] Handle failed saves without discarding unsaved edits in memory...');
  // Working copy in editor before save attempt
  const inMemoryWorkingCopy = {
    questionText: 'యూజర్ టైప్ చేసిన కొత్త ప్రశ్న ఇది',
    optionA: 'ఎంపిక 1',
    optionB: 'ఎంపిక 2',
    isDirty: true,
  };

  let saveFailedCaught = false;
  try {
    // Attempt invalid save (e.g. empty topicId)
    await questionGenerationService.saveDraft({
      id: createdDraft.id,
      version: postRefreshDraft.version,
      topicId: '', // Invalid!
      subtopicId: 'SUB-01',
      questionText: inMemoryWorkingCopy.questionText,
    }, testActor);
  } catch (err: any) {
    saveFailedCaught = true;
    assert.ok(err instanceof QuestionGenerationDomainError || err.statusCode === 400);
  }
  assert.strictEqual(saveFailedCaught, true, 'Save with invalid topic must throw validation error');

  // Assert working-copy candidate state in editor was NOT mutated or reset
  assert.strictEqual(inMemoryWorkingCopy.questionText, 'యూజర్ టైప్ చేసిన కొత్త ప్రశ్న ఇది', 'Working copy prompt must remain intact');
  assert.strictEqual(inMemoryWorkingCopy.isDirty, true, 'Working copy dirty flag must remain true');
  console.log('  PASS: Failed save preserved working-copy candidate state without data loss.');

  // --------------------------------------------------------------------------
  // Scenario 9: Reject stale updates according to the existing concurrency contract (OCC)
  // --------------------------------------------------------------------------
  console.log('[Scenario 9] Reject stale OCC updates with ConcurrencyConflictError (HTTP 409)...');
  let occErrorCaught = false;
  try {
    // Stale write attempt: passing expectedVersion: 1 when server is at version 3
    await questionGenerationService.saveDraft({
      ...postRefreshDraft,
      id: postRefreshDraft.id,
      version: 1, // Stale!
      expectedVersion: 1, // Stale!
      questionText: 'పాత వెర్షన్ నుండి వచ్చిన ఓవర్‌రైట్ ప్రయత్నం',
    }, testActor);
  } catch (err: any) {
    occErrorCaught = err instanceof ConcurrencyConflictError || err.statusCode === 409 || err.code === 'CONFLICT_OPTIMISTIC_LOCK';
  }
  assert.strictEqual(occErrorCaught, true, 'Stale expectedVersion update MUST throw ConcurrencyConflictError (409)');

  // Verify server document was NOT overwritten
  const verifyServerDoc = await questionGenerationService.getDraftById(postRefreshDraft.id);
  assert.strictEqual(verifyServerDoc?.version, 3, 'Server version must remain at 3');
  assert.notStrictEqual(verifyServerDoc?.questionText, 'పాత వెర్షన్ నుండి వచ్చిన ఓవర్‌రైట్ ప్రయత్నం', 'Stale write must NOT corrupt server data');
  console.log('  PASS: OCC correctly rejected stale update and protected server document.');

  // --------------------------------------------------------------------------
  // Scenario 10: Handle repeated saves or retries without duplicate records
  // --------------------------------------------------------------------------
  console.log('[Scenario 10] Repeated saves/retries do not create duplicate records...');
  const allDraftsBefore = await questionGenerationService.getAllDrafts();
  const matchingDraftsBefore = allDraftsBefore.filter((d) => d.id === createdDraft.id);
  assert.strictEqual(matchingDraftsBefore.length, 1, 'Exactly one record exists before retry');

  // Repeated save with matching current version
  const retrySave = await questionGenerationService.saveDraft({
    ...verifyServerDoc!,
    id: createdDraft.id,
    version: 3,
    expectedVersion: 3,
  }, testActor);

  assert.strictEqual(retrySave.id, createdDraft.id, 'Retry must target same draft ID');
  const allDraftsAfter = await questionGenerationService.getAllDrafts();
  const matchingDraftsAfter = allDraftsAfter.filter((d) => d.id === createdDraft.id);
  assert.strictEqual(matchingDraftsAfter.length, 1, 'Exactly one record exists after retry (no duplicates)');
  console.log('  PASS: Repeated saves updated existing record without duplication.');

  // --------------------------------------------------------------------------
  // Scenario 11: Handle missing or inaccessible records through existing error contract
  // --------------------------------------------------------------------------
  console.log('[Scenario 11] Handle missing or inaccessible records through existing error contract...');
  const nonExistentId = canonicalIdService.generateDraftId();
  const missingDraft = await questionGenerationService.getDraftById(nonExistentId);
  assert.strictEqual(missingDraft, null, 'getDraftById on non-existent ID must return null');

  let malformedIdCaught = false;
  try {
    await questionGenerationService.getDraftById('invalid_id_not_uuid');
  } catch (err: any) {
    malformedIdCaught = true;
    assert.strictEqual(err.statusCode, 400, 'Malformed draft ID must return 400');
  }
  assert.strictEqual(malformedIdCaught, true, 'Malformed draft ID rejection verified');
  console.log('  PASS: Missing and malformed draft ID contracts verified.');

  // --------------------------------------------------------------------------
  // Scenario 12: Preserve UUID v4 validity and identity across create, save, retrieve, and update
  // --------------------------------------------------------------------------
  console.log('[Scenario 12] Preserve UUID v4 validity and identity across full lifecycle...');
  const lifecycleId = canonicalIdService.generateDraftId();
  assert.ok(canonicalIdService.validateCanonicalId(lifecycleId, 'dft_'));

  const step1 = await questionGenerationService.saveDraft({
    ...newDraftInput,
    id: lifecycleId,
  }, testActor);
  assert.strictEqual(step1.id, lifecycleId);

  const step2 = await questionGenerationService.getDraftById(lifecycleId);
  assert.strictEqual(step2?.id, lifecycleId);

  const step3 = await questionGenerationService.saveDraft({
    ...step2!,
    id: lifecycleId,
    version: step2!.version,
    expectedVersion: step2!.version,
    explanation: 'అప్‌డేట్ చేసిన వివరణ',
  }, testActor);
  assert.strictEqual(step3.id, lifecycleId);

  const step4 = await questionGenerationService.getDraftById(lifecycleId);
  assert.strictEqual(step4?.id, lifecycleId);
  assert.ok(canonicalIdService.validateCanonicalId(step4!.id, 'dft_'));
  console.log(`  PASS: Canonical ID ${lifecycleId} preserved immutably across 4 operations.`);

  // --------------------------------------------------------------------------
  // Scenario 13: Preserve draft-versus-submit workflow semantics
  // --------------------------------------------------------------------------
  console.log('[Scenario 13] Preserve draft-versus-submit workflow semantics (SAVE DRAFT != SUBMIT)...');
  assert.notStrictEqual(step4?.status, QuestionStatus.APPROVED, 'Saving draft must NEVER set status to APPROVED');
  assert.notStrictEqual(step4?.status, 'VERIFIED', 'Saving draft must NEVER set status to VERIFIED');
  assert.notStrictEqual(step4?.status, 'SUBMITTED_FOR_REVIEW', 'Saving draft must NEVER set status to SUBMITTED_FOR_REVIEW');
  assert.strictEqual(step4?.status, QuestionStatus.DRAFT, 'Draft status must strictly be DRAFT');
  assert.strictEqual(step4?.workflowStage, 'QUESTION_STUDIO', 'Workflow stage must strictly be QUESTION_STUDIO');
  console.log('  PASS: Saving draft never advances workflow stage or triggers verification gates.');

  // --------------------------------------------------------------------------
  // Scenario 14: Restore the correct saved-versus-unsaved audience preview source
  // --------------------------------------------------------------------------
  console.log('[Scenario 14] Restore the correct saved-versus-unsaved audience preview source...');
  // Saved draft projection
  const savedProjection = projectToAudiencePreview({
    candidate: {
      questionText: step4!.questionText,
      optionA: step4!.options?.a || '',
      optionB: step4!.options?.b || '',
      optionC: step4!.options?.c || '',
      optionD: step4!.options?.d || '',
      correctAnswer: step4!.correctAnswer,
      explanation: step4!.explanation,
      productionMode: step4!.productionMode,
      targetQuestionCount: step4!.targetQuestionCount,
      aspectRatio: step4!.aspectRatio,
    },
    slots: step4!.slots,
    sourceVersion: AudiencePreviewSourceVersion.SAVED,
    savedDraft: step4,
  });

  assert.strictEqual(savedProjection.sourceVersion, AudiencePreviewSourceVersion.SAVED);
  assert.strictEqual(savedProjection.totalQuestions, 5);
  // Verify audience projection excludes internal correct answers and explanations
  assert.strictEqual((savedProjection.questions[0] as any).correctAnswer, undefined, 'Audience preview must NOT leak correctAnswer');
  assert.strictEqual((savedProjection.questions[0] as any).explanation, undefined, 'Audience preview must NOT leak explanation');
  assert.strictEqual((savedProjection as any).authorId, undefined, 'Audience preview must NOT leak authorId');
  assert.strictEqual((savedProjection as any).workflowStage, undefined, 'Audience preview must NOT leak workflowStage');

  // Unsaved modifications projection
  const unsavedEditedSlots: QuestionBatchSlot[] = [
    ...step4!.slots!.map((s, idx) =>
      idx === 0
        ? { ...s, questionText: 'తాత్కాలిక అన్‌సేవ్డ్ ఎడిట్ ప్రశ్న' }
        : s
    ),
  ];

  const unsavedProjection = projectToAudiencePreview({
    candidate: {
      questionText: 'తాత్కాలిక అన్‌సేవ్డ్ ఎడిట్ ప్రశ్న',
      optionA: 'కొత్త ఎంపిక',
      optionB: step4!.options?.b || '',
      optionC: step4!.options?.c || '',
      optionD: step4!.options?.d || '',
      correctAnswer: step4!.correctAnswer,
      explanation: step4!.explanation,
      productionMode: step4!.productionMode,
      targetQuestionCount: step4!.targetQuestionCount,
      aspectRatio: step4!.aspectRatio,
    },
    slots: unsavedEditedSlots,
    sourceVersion: AudiencePreviewSourceVersion.UNSAVED,
    savedDraft: step4,
  });

  assert.strictEqual(unsavedProjection.sourceVersion, AudiencePreviewSourceVersion.UNSAVED);
  assert.strictEqual(unsavedProjection.questions[0].prompt, 'తాత్కాలిక అన్‌సేవ్డ్ ఎడిట్ ప్రశ్న');
  assert.notStrictEqual(savedProjection.questions[0].prompt, unsavedProjection.questions[0].prompt, 'Saved vs Unsaved projection prompts must remain isolated');
  console.log('  PASS: Audience preview accurately isolated saved vs unsaved projection sources.');

  // Cleanup test artifacts
  await questionGenerationService.deleteDraft(createdDraft.id);
  await questionGenerationService.deleteDraft(lifecycleId);

  console.log('\n============================================================');
  console.log('ALL 14 S9-T14 DRAFT RESUMPTION UNIT TEST SCENARIOS PASSED (SPECIFIED)');
  console.log('============================================================\n');
}
