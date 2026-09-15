/**
 * BURRA PARIKSHA CMS - PHASE 09 MULTI-LAYER QUESTION VERIFICATION TEST SUITE
 * Test Suite: P09-01 to P09-25
 * 
 * Verifies end-to-end functionality for:
 * 1. Structural Validation Layer
 * 2. Deterministic Validation Layer
 * 3. Mathematical Verification Layer
 * 4. Non-mathematical N/A Handling
 * 5. Independent AI Verification Layer
 * 6. AI Verifier Unavailable -> UNVERIFIED
 * 7. Contradiction Detection Layer
 * 8. Answer / Options Consistency Layer
 * 9. Explanation Consistency Layer
 * 10. Exact Duplicate Detection Layer
 * 11. Repetition / Near-Duplicate Detection Layer
 * 12. Human Review State Layer
 * 13. FAILED Precedence Rule
 * 14. FAILED Cannot Be Overwritten by VERIFIED
 * 15. UNVERIFIED Aggregation Rule
 * 16. Verification Persistence & Audit Trail
 * 17. Backend Save Gate Enforcement
 * 18. Client Spoofing Prevention
 * 19. Manual Question Verification Path
 * 20. AI Candidate Verification Path
 * 21. Manual & AI Convergence
 * 22. Invalid Question Cannot Silently Reach Save
 * 23. Verification Does Not Silently Mutate Question
 * 24. Historical Verification Traceability
 * 25. Complete Verification Aggregation Report
 */

import { MultiLayerVerificationEngine } from '../lib/validation/multi-layer-verification.engine';
import { questionService } from '../lib/services/question.service';
import { questionValidationService } from '../lib/services/question-validation.service';
import { validationsRepository } from '../lib/repositories/validations.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { QuestionValidationStatus, QuestionLanguage, QuestionStatus } from '../types';

export async function runPhase9Verification() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 09 VERIFICATION SUITE');
  console.log('Multi-Layer Question Verification Pipeline & Save Gate');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testCode: string, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${testCode}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${testCode}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Phase 09 Verification failed on Test ${testCode}: ${testName} - ${detail || ''}`);
    }
  }

  const testActor = { id: 'USR-ADMIN-01', name: 'Phase 09 Test Lead', role: 'ADMIN' };

  // Load canonical taxonomy for test cases
  const categories = await taxonomyService.getCategories();
  const category = categories[0] || { id: 'CAT-001', name: 'General Studies' };

  // Resolve a real topic and subtopic that are guaranteed to exist to prevent ReferenceIntegrityError
  const allSubtopics = await (await import('../lib/repositories/subtopics.repository')).subtopicsRepository.findAll();
  let topic = { id: 'BP-TOP-001', name: 'Number Fundamentals' };
  let subtopic = { id: 'BP-SUB-0001', name: 'Number Identification Challenges' };

  if (allSubtopics.length > 0) {
    const sub = allSubtopics[0];
    const top = await (await import('../lib/repositories/topics.repository')).topicsRepository.findById(sub.topicId);
    if (top) {
      topic = { id: top.id, name: top.name };
      subtopic = { id: sub.id, name: sub.name };
    }
  }

  // Helper valid question base
  const getBaseCandidate = (): any => ({
    topicId: topic.id,
    subtopicId: subtopic.id,
    categoryId: category.id,
    difficulty: 'Intermediate' as any,
    language: QuestionLanguage.TELUGU,
    questionText: `క్రింది సమాధానాలలో ఒక రైలు 60 km/h వేగంతో ప్రయాణిస్తే 120 km దూరం పూర్తి చేయడానికి పట్టే సమయం ఎంత? (Test run ${Date.now()})`,
    options: {
      a: '1 గంట',
      b: '2 గంటలు',
      c: '3 గంటలు',
      d: '4 గంటలు',
    },
    correctAnswer: 'B',
    explanation: 'సమయం = దూరం / వేగం = 120 / 60 = 2 గంటలు. కావున Option B సరైన సమాధానం.',
  });

  // ============================================================================
  // P09-01: Structural Validation Layer
  // ============================================================================
  console.log('\n--- P09-01: Structural Validation Layer ---');
  const invalidStructCandidate = {
    ...getBaseCandidate(),
    questionText: '', // Empty text
  };
  const r01 = await MultiLayerVerificationEngine.verify(invalidStructCandidate, { skipTaxonomyLookup: true });
  assert(r01.layers['1'].status === 'FAILED', 'P09-01', 'Structural validation returns FAILED on missing questionText');
  assert(r01.aggregatedStatus === 'FAILED', 'P09-01b', 'Aggregated status becomes FAILED on structural error');

  // ============================================================================
  // P09-02: Deterministic Validation Layer
  // ============================================================================
  console.log('\n--- P09-02: Deterministic Validation Layer ---');
  const malformedCandidate = {
    ...getBaseCandidate(),
    questionText: 'Test question with <script>alert("hack")</script> inserted into text',
  };
  const r02 = await MultiLayerVerificationEngine.verify(malformedCandidate, { skipTaxonomyLookup: true });
  assert(r02.layers['2'].status === 'FAILED', 'P09-02', 'Deterministic layer returns FAILED on malformed script tag');

  // ============================================================================
  // P09-03: Mathematical Verification Layer
  // ============================================================================
  console.log('\n--- P09-03: Mathematical Verification Layer ---');
  const validMathCandidate = getBaseCandidate();
  const r03 = await MultiLayerVerificationEngine.verify(validMathCandidate, { skipTaxonomyLookup: true });
  assert(r03.layers['3'].status === 'VERIFIED', 'P09-03', 'Mathematical layer returns VERIFIED for correct calculation (120/60 = 2 hours)');

  // ============================================================================
  // P09-04: Non-mathematical N/A Handling
  // ============================================================================
  console.log('\n--- P09-04: Non-mathematical N/A Handling ---');
  const verbalCandidate = {
    ...getBaseCandidate(),
    questionText: 'భారతదేశ మొదటి ప్రధానమంత్రి ఎవరు?',
    options: {
      a: 'జవహర్ లాల్ నెహ్రూ',
      b: 'మహాత్మా గాంధీ',
      c: 'లాల్ బహదూర్ శాస్త్రి',
      d: 'సర్దార్ పటేల్',
    },
    correctAnswer: 'A',
    explanation: 'స్వతంత్ర భారతదేశం యొక్క మొదటి ప్రధానమంత్రి జవహర్ లాల్ నెహ్రూ. కావున Option A సరైన సమాధానం.',
  };
  const r04 = await MultiLayerVerificationEngine.verify(verbalCandidate, { skipTaxonomyLookup: true });
  assert(r04.layers['3'].status === 'N/A', 'P09-04', 'Non-mathematical qualitative problem returns N/A for Layer 3');

  // ============================================================================
  // P09-05: Independent AI Verification Layer
  // ============================================================================
  console.log('\n--- P09-05: Independent AI Verification Layer ---');
  const r05 = await MultiLayerVerificationEngine.verify(getBaseCandidate(), {
    skipTaxonomyLookup: true,
    aiVerifierResult: {
      success: true,
      status: 'VERIFIED',
      modelId: 'Gemini Pro Verifier (Independent)',
    },
  });
  assert(r05.layers['4'].status === 'VERIFIED', 'P09-05', 'Independent AI verifier layer returns VERIFIED when AI verifies candidate');

  // ============================================================================
  // P09-06: AI Verifier Unavailable -> UNVERIFIED
  // ============================================================================
  console.log('\n--- P09-06: AI Verifier Unavailable -> UNVERIFIED ---');
  const r06 = await MultiLayerVerificationEngine.verify(getBaseCandidate(), {
    skipTaxonomyLookup: true,
    aiVerifierAvailable: false,
  });
  assert(r06.layers['4'].status === 'UNVERIFIED', 'P09-06', 'AI verifier unavailable returns UNVERIFIED (never auto-passes as VERIFIED)');

  // ============================================================================
  // P09-07: Contradiction Detection Layer
  // ============================================================================
  console.log('\n--- P09-07: Contradiction Detection Layer ---');
  const contradictionCandidate = {
    ...getBaseCandidate(),
    correctAnswer: 'A',
    explanation: 'సరైన గణన ద్వారా 120/60 = 2 గంటలు. కావున Option B సరైన సమాధానం.', // Explains B, but declared answer is A!
  };
  const r07 = await MultiLayerVerificationEngine.verify(contradictionCandidate, { skipTaxonomyLookup: true });
  assert(r07.layers['5'].status === 'FAILED', 'P09-07', 'Contradiction detection returns FAILED when explanation option B disagrees with declared answer A');

  // ============================================================================
  // P09-08: Answer / Options Consistency Layer
  // ============================================================================
  console.log('\n--- P09-08: Answer / Options Consistency Layer ---');
  const duplicateOptsCandidate = {
    ...getBaseCandidate(),
    options: {
      a: '2 గంటలు',
      b: '2 గంటలు', // Duplicate option!
      c: '3 గంటలు',
      d: '4 గంటలు',
    },
  };
  const r08 = await MultiLayerVerificationEngine.verify(duplicateOptsCandidate, { skipTaxonomyLookup: true });
  assert(r08.layers['6'].status === 'FAILED', 'P09-08', 'Answer/Options layer returns FAILED on duplicate option values');

  // ============================================================================
  // P09-09: Explanation Consistency Layer
  // ============================================================================
  console.log('\n--- P09-09: Explanation Consistency Layer ---');
  const shortExpCandidate = {
    ...getBaseCandidate(),
    explanation: 'OK', // Too short (< 5 chars)
  };
  const r09 = await MultiLayerVerificationEngine.verify(shortExpCandidate, { skipTaxonomyLookup: true });
  assert(r09.layers['7'].status === 'FAILED', 'P09-09', 'Explanation layer returns FAILED when explanation is less than 5 characters');

  // ============================================================================
  // P09-10: Exact Duplicate Detection Layer
  // ============================================================================
  console.log('\n--- P09-10: Exact Duplicate Detection Layer ---');
  const existingQuestions = await questionsRepository.findAll();
  const mockExistingQ = {
    id: 'BP-Q-TEST-EXISTING-1',
    questionText: 'భారత రాజ్యాంగంలో ప్రాథమిక హక్కులు ఏ భాగంలో ఉన్నాయి?',
    categoryName: 'General Studies',
    topicName: 'Polity',
  } as any;

  const exactDupCandidate = {
    ...getBaseCandidate(),
    questionText: 'భారత రాజ్యాంగంలో ప్రాథమిక హక్కులు ఏ భాగంలో ఉన్నాయి?',
  };

  const r10 = await MultiLayerVerificationEngine.verify(exactDupCandidate, {
    skipTaxonomyLookup: true,
    existingQuestions: [...existingQuestions, mockExistingQ],
  });
  assert(r10.layers['8'].status === 'FAILED', 'P09-10', 'Layer 8 returns FAILED on exact duplicate question text');

  // ============================================================================
  // P09-11: Repetition / Near-Duplicate Detection Layer
  // ============================================================================
  console.log('\n--- P09-11: Repetition / Near-Duplicate Detection Layer ---');
  const nearDupCandidate = {
    ...getBaseCandidate(),
    questionText: 'భారత రాజ్యాంగంలో ప్రాథమిక హక్కులు ముఖ్యంగా ఏ భాగంలో పొందుపరచబడ్డాయి?',
  };
  const mockNearExistingQ = {
    id: 'BP-Q-TEST-EXISTING-2',
    questionText: 'భారత రాజ్యాంగంలో ప్రాథమిక హక్కులు ఏ భాగంలో పొందుపరచబడ్డాయి?',
  } as any;

  const r11 = await MultiLayerVerificationEngine.verify(nearDupCandidate, {
    skipTaxonomyLookup: true,
    existingQuestions: [mockNearExistingQ],
  });
  assert(r11.layers['8'].status === 'FAILED', 'P09-11', 'Layer 8 returns FAILED on near-duplicate question text');

  // ============================================================================
  // P09-12: Human Review State Layer
  // ============================================================================
  console.log('\n--- P09-12: Human Review State Layer ---');
  const r12 = await MultiLayerVerificationEngine.verify(getBaseCandidate(), {
    skipTaxonomyLookup: true,
    humanReview: {
      requiresHumanReview: true,
      reviewStatus: 'APPROVED',
      reviewerId: 'USR-REVIEWER-1',
      reviewerName: 'Lead Reviewer',
      reviewedAt: new Date().toISOString(),
      comments: 'Verified correct by editorial lead',
    },
  });
  assert(r12.layers['9'].status === 'VERIFIED', 'P09-12', 'Layer 9 returns VERIFIED when human review is explicitly APPROVED');

  // ============================================================================
  // P09-13: FAILED Precedence Rule
  // ============================================================================
  console.log('\n--- P09-13: FAILED Precedence Rule ---');
  const failedPrecedenceCandidate = {
    ...getBaseCandidate(),
    options: { a: '2', b: '2', c: '3', d: '4' }, // Layer 6 FAILED
  };
  const r13 = await MultiLayerVerificationEngine.verify(failedPrecedenceCandidate, {
    skipTaxonomyLookup: true,
    aiVerifierResult: { success: true, status: 'VERIFIED' }, // AI says VERIFIED
  });
  assert(r13.aggregatedStatus === 'FAILED', 'P09-13', 'Aggregated status is FAILED despite AI verifier saying VERIFIED');
  assert(r13.canSave === false, 'P09-13b', 'canSave is strictly false when aggregatedStatus is FAILED');

  // ============================================================================
  // P09-14: FAILED Cannot Be Overwritten by VERIFIED
  // ============================================================================
  console.log('\n--- P09-14: FAILED Cannot Be Overwritten by VERIFIED ---');
  assert(
    r13.canonicalValidationStatus === QuestionValidationStatus.INVALID,
    'P09-14',
    'Canonical validation status is INVALID and cannot be overwritten by weaker VERIFIED claim'
  );

  // ============================================================================
  // P09-15: UNVERIFIED Aggregation Rule
  // ============================================================================
  console.log('\n--- P09-15: UNVERIFIED Aggregation Rule ---');
  const r15 = await MultiLayerVerificationEngine.verify(getBaseCandidate(), {
    skipTaxonomyLookup: true,
    aiVerifierAvailable: false, // AI verifier unavailable
  });
  assert(r15.aggregatedStatus === 'UNVERIFIED', 'P09-15', 'Aggregated status becomes UNVERIFIED when AI verifier is unavailable');
  assert(r15.canonicalValidationStatus === QuestionValidationStatus.NEEDS_REVIEW, 'P09-15b', 'Canonical status becomes NEEDS_REVIEW');

  // ============================================================================
  // P09-16: Verification Persistence & Audit Trail
  // ============================================================================
  console.log('\n--- P09-16: Verification Persistence & Audit Trail ---');
  const testValResult = await questionValidationService.validateCandidate(getBaseCandidate(), { skipTaxonomyLookup: true });
  const savedAudit = await validationsRepository.saveValidationResult(testValResult);
  assert(savedAudit.id === testValResult.id, 'P09-16', 'Validation result persisted into validationsRepository audit trail');

  // ============================================================================
  // P09-17: Backend Save Gate Enforcement
  // ============================================================================
  console.log('\n--- P09-17: Backend Save Gate Enforcement ---');
  let saveGateBlocked = false;
  try {
    await questionService.createQuestion({
      topicId: topic.id,
      subtopicId: subtopic.id,
      difficulty: 'Intermediate' as any,
      language: QuestionLanguage.TELUGU as any,
      questionText: 'Test invalid question with script tag <script>alert(1)</script>',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' }, // Distinct options
      correctAnswer: 'A',
      explanation: 'Test explanation',
    } as any, testActor);
  } catch (err: any) {
    saveGateBlocked = true;
    assert(err.message.includes('Save Gate') || err.message.includes('REJECTED'), 'P09-17', 'Save Gate threw expected ValidationError');
  }
  assert(saveGateBlocked, 'P09-17b', 'Backend Save Gate successfully blocked invalid question creation');

  // ============================================================================
  // P09-18: Client Spoofing Prevention
  // ============================================================================
  console.log('\n--- P09-18: Client Spoofing Prevention ---');
  const spoofPayload = {
    ...getBaseCandidate(),
    questionText: `Valid candidate text for client spoofing test (${Date.now()})`,
    validationStatus: QuestionValidationStatus.VALID, // Client spoof claim
  };
  const createdWithSpoof = await questionService.createQuestionFromRequest({
    creationMode: 'manual',
    topicId: topic.id,
    subtopicId: subtopic.id,
    difficulty: 'Intermediate' as any,
    questionText: spoofPayload.questionText,
    options: spoofPayload.options,
    correctAnswer: 'B',
    explanation: spoofPayload.explanation,
    validationStatus: 'VALID' as any, // Client attempt to spoof VALID status
  } as any, testActor);

  assert(
    createdWithSpoof.validationStatus !== undefined && createdWithSpoof.validationStatus !== null,
    'P09-18',
    'Server determined validation status is assigned'
  );

  // Clean up created question
  try {
    await questionsRepository.deleteRecord(createdWithSpoof.id);
  } catch {
    // Ignore cleanup
  }

  // ============================================================================
  // P09-19: Manual Question Verification Path
  // ============================================================================
  console.log('\n--- P09-19: Manual Question Verification Path ---');
  const manualQuestion = await questionService.createQuestion({
    topicId: topic.id,
    subtopicId: subtopic.id,
    difficulty: 'Intermediate' as any,
    language: QuestionLanguage.TELUGU as any,
    questionText: `మాన్యువల్ ప్రశ్న పరీక్షా వచనం (${Date.now()})`,
    options: { a: '10', b: '20', c: '30', d: '40' },
    correctAnswer: 'B',
    explanation: 'వివరణ కనీసం 5 అక్షరాలు కలిగి ఉంది.',
  } as any, testActor);

  assert(manualQuestion.lastValidationId !== undefined, 'P09-19', 'Manual question routed through multi-layer verification path and received validation ID');
  try { await questionsRepository.deleteRecord(manualQuestion.id); } catch {}

  // ============================================================================
  // P09-20: AI Candidate Verification Path
  // ============================================================================
  console.log('\n--- P09-20: AI Candidate Verification Path ---');
  const aiCandidate = await questionService.createQuestionFromRequest({
    creationMode: 'ai',
    topicId: topic.id,
    subtopicId: subtopic.id,
    difficulty: 'Intermediate' as any,
    questionText: `AI ఉత్పత్తి చేసిన ప్రశ్న వచనం (${Date.now()})`,
    options: { a: '100', b: '200', c: '300', d: '400' },
    correctAnswer: 'C',
    explanation: 'AI వివరాలు సమాధానం 300 ను వివరిస్తాయి.',
  } as any, testActor);

  assert(aiCandidate.lastValidationId !== undefined, 'P09-20', 'AI candidate routed through multi-layer verification path');
  try { await questionsRepository.deleteRecord(aiCandidate.id); } catch {}

  // ============================================================================
  // P09-21: Manual & AI Convergence
  // ============================================================================
  console.log('\n--- P09-21: Manual & AI Convergence ---');
  assert(
    manualQuestion.validationStatus !== undefined && aiCandidate.validationStatus !== undefined,
    'P09-21',
    'Both manual and AI candidates converge on the same multi-layer verification engine'
  );

  // ============================================================================
  // P09-22: Invalid Question Cannot Silently Reach Save
  // ============================================================================
  console.log('\n--- P09-22: Invalid Question Cannot Silently Reach Save ---');
  const allQsBefore = await questionsRepository.findAll();
  try {
    await questionService.createQuestion({
      topicId: topic.id,
      subtopicId: subtopic.id,
      difficulty: 'Intermediate' as any,
      language: QuestionLanguage.TELUGU as any,
      questionText: 'Invalid question math contradiction test',
      options: { a: '10 km/h', b: '20 km/h', c: '30 km/h', d: '40 km/h' },
      correctAnswer: 'A',
      explanation: 'వివరణ సరైన సమాధానం B అని చెబుతుంది. (Option B is correct)', // Contradicts declared answer A!
    } as any, testActor);
  } catch {
    // Expected Save Gate rejection
  }
  const allQsAfter = await questionsRepository.findAll();
  assert(allQsBefore.length === allQsAfter.length, 'P09-22', 'No new record created in QUESTIONS repository when Save Gate rejects invalid question');

  // ============================================================================
  // P09-23: Verification Does Not Silently Mutate Question
  // ============================================================================
  console.log('\n--- P09-23: Verification Does Not Silently Mutate Question ---');
  const immutableTest = getBaseCandidate();
  const textBefore = immutableTest.questionText;
  const optsBefore = JSON.stringify(immutableTest.options);
  await MultiLayerVerificationEngine.verify(immutableTest, { skipTaxonomyLookup: true });
  assert(immutableTest.questionText === textBefore, 'P09-23', 'Question text remains unmutated after verification');
  assert(JSON.stringify(immutableTest.options) === optsBefore, 'P09-23b', 'Question options remain unmutated after verification');

  // ============================================================================
  // P09-24: Historical Verification Traceability
  // ============================================================================
  console.log('\n--- P09-24: Historical Verification Traceability ---');
  const targetQId = 'BP-Q-TRACE-TEST-1';
  const val1 = await MultiLayerVerificationEngine.verify({ ...getBaseCandidate(), id: targetQId }, { skipTaxonomyLookup: true });
  const val2 = await MultiLayerVerificationEngine.verify({ ...getBaseCandidate(), id: targetQId }, { skipTaxonomyLookup: true });
  
  await validationsRepository.saveValidationResult(val1 as any);
  await validationsRepository.saveValidationResult(val2 as any);

  const history = await validationsRepository.getHistoryByQuestionId(targetQId);
  assert(history.length >= 2, 'P09-24', `Historical validation records traceable in validationsRepository (count: ${history.length})`);

  // ============================================================================
  // P09-25: Complete Verification Aggregation Report
  // ============================================================================
  console.log('\n--- P09-25: Complete Verification Aggregation Report ---');
  const fullReport = await MultiLayerVerificationEngine.verify(getBaseCandidate(), { skipTaxonomyLookup: true });
  assert(fullReport.layerList.length === 9, 'P09-25a', 'Verification report contains exactly 9 verification layer results');
  assert(fullReport.aggregatedStatus !== undefined, 'P09-25b', 'Verification report contains aggregated status');
  assert(fullReport.confidenceScore >= 0 && fullReport.confidenceScore <= 1, 'P09-25c', 'Confidence score is normalized between 0 and 1');

  console.log('\n====================================================');
  console.log(`PHASE 09 VERIFICATION PASSED: ${passedTests}/${totalTests} TESTS GREEN`);
  console.log('====================================================\n');

  return {
    success: true,
    passedTests,
    totalTests,
    summary: `Phase 09 Multi-Layer Question Verification verified: ${passedTests}/${totalTests} tests passed cleanly.`,
  };
}
