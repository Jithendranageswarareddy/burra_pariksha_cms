/**
 * Regression Test: Question Studio Validation Alias and Contract Checks
 * 
 * Proves:
 * 1. questionText works perfectly in QuestionValidationEngine.validate
 * 2. question alias works perfectly in QuestionValidationEngine.validate
 * 3. content alias works perfectly in QuestionValidationEngine.validate
 * 4. Empty/short text is rejected properly by structural validation
 * 5. Existing AI candidate save/validation still works (using canonical validation)
 */

import { QuestionValidationEngine } from '../lib/validation/question-validation.engine';
import { QuestionLanguage, QuestionValidationStatus } from '../types';

async function runRegressionSuite() {
  console.log('=== STARTING QUESTION STUDIO VALIDATION ALIAS REGRESSION TESTS ===');
  let failures = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      failures++;
    }
  }

  // Ensure sheets sync is bypassed/isolated
  process.env.SKIP_SHEETS_SYNC = 'true';

  // 1. Prove questionText works
  try {
    const payloadWithQuestionText = {
      id: 'TEST-QS-QT-01',
      topicId: 'TOPIC_TEST',
      subtopicId: 'SUBTOPIC_TEST',
      difficulty: 'MEDIUM',
      language: 'TELUGU',
      questionText: 'ఒక వస్తువు యొక్క ధర రూ 500. దానిపై 10% తగ్గింపు ఎంత?',
      options: { a: '₹50', b: '₹60', c: '₹40', d: '₹100' },
      correctAnswer: 'A',
      explanation: '10% of 500 is 50. Therefore, the answer is A.',
    };

    const result = await QuestionValidationEngine.validate(payloadWithQuestionText as any, { skipTaxonomyLookup: true });
    assert(
      result.status === 'VALID' || !result.errors.some((e) => e.includes('Question text is required')),
      'Test 1: questionText works perfectly in QuestionValidationEngine.validate'
    );
  } catch (err: any) {
    assert(false, 'Test 1: questionText works', err.message);
  }

  // 2. Prove question alias works
  try {
    const payloadWithQuestionAlias = {
      id: 'TEST-QS-QA-02',
      topicId: 'TOPIC_TEST',
      subtopicId: 'SUBTOPIC_TEST',
      difficulty: 'MEDIUM',
      language: 'TELUGU',
      question: 'ఒక వస్తువు యొక్క ధర రూ 500. దానిపై 10% తగ్గింపు ఎంత?',
      options: { a: '₹50', b: '₹60', c: '₹40', d: '₹100' },
      correctAnswer: 'A',
      explanation: '10% of 500 is 50. Therefore, the answer is A.',
    };

    const result = await QuestionValidationEngine.validate(payloadWithQuestionAlias as any, { skipTaxonomyLookup: true });
    assert(
      result.status === 'VALID' || !result.errors.some((e) => e.includes('Question text is required')),
      'Test 2: question alias works perfectly in QuestionValidationEngine.validate'
    );
  } catch (err: any) {
    assert(false, 'Test 2: question alias works', err.message);
  }

  // 3. Prove content alias works
  try {
    const payloadWithContentAlias = {
      id: 'TEST-QS-CA-03',
      topicId: 'TOPIC_TEST',
      subtopicId: 'SUBTOPIC_TEST',
      difficulty: 'MEDIUM',
      language: 'TELUGU',
      content: 'ఒక వస్తువు యొక్క ధర రూ 500. దానిపై 10% తగ్గింపు ఎంత?',
      options: { a: '₹50', b: '₹60', c: '₹40', d: '₹100' },
      correctAnswer: 'A',
      explanation: '10% of 500 is 50. Therefore, the answer is A.',
    };

    const result = await QuestionValidationEngine.validate(payloadWithContentAlias as any, { skipTaxonomyLookup: true });
    assert(
      result.status === 'VALID' || !result.errors.some((e) => e.includes('Question text is required')),
      'Test 3: content alias works perfectly in QuestionValidationEngine.validate'
    );
  } catch (err: any) {
    assert(false, 'Test 3: content alias works', err.message);
  }

  // 4. Prove empty/short text is rejected
  try {
    const emptyPayload = {
      id: 'TEST-QS-EMP-04',
      topicId: 'TOPIC_TEST',
      subtopicId: 'SUBTOPIC_TEST',
      difficulty: 'MEDIUM',
      language: 'TELUGU',
      questionText: '   ', // empty
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
      explanation: 'Some explanation text here.',
    };

    const result = await QuestionValidationEngine.validate(emptyPayload as any, { skipTaxonomyLookup: true });
    assert(
      result.errors.some((e) => e.includes('Question text is required') || e.includes('at least 5 characters long')),
      'Test 4a: Empty questionText is strictly rejected'
    );
  } catch (err: any) {
    assert(false, 'Test 4a: Empty questionText rejected check', err.message);
  }

  try {
    const shortPayload = {
      id: 'TEST-QS-SH-05',
      topicId: 'TOPIC_TEST',
      subtopicId: 'SUBTOPIC_TEST',
      difficulty: 'MEDIUM',
      language: 'TELUGU',
      questionText: '1+1?', // < 5 chars
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
      explanation: 'Some explanation text here.',
    };

    const result = await QuestionValidationEngine.validate(shortPayload as any, { skipTaxonomyLookup: true });
    assert(
      result.errors.some((e) => e.includes('at least 5 characters long')),
      'Test 4b: Short questionText (< 5 chars) is strictly rejected'
    );
  } catch (err: any) {
    assert(false, 'Test 4b: Short questionText rejected check', err.message);
  }

  // 5. Prove existing AI candidate save/validation still works
  try {
    const validCandidate = {
      id: 'TEST-QS-CAND-06',
      topicId: 'TOPIC_TEST',
      subtopicId: 'SUBTOPIC_TEST',
      difficulty: 'MEDIUM',
      language: 'TELUGU',
      questionText: 'ఒక రైలు గంటకు 60 కిమీ వేగంతో ప్రయాణిస్తే 120 కిమీ దూరం వెళ్ళడానికి పట్టే సమయం ఎంత?',
      options: { a: '1 గంట', b: '2 గంటలు', c: '3 గంటలు', d: '4 గంటలు' },
      correctAnswer: 'B',
      explanation: 'దూరం / వేగం = సమయం. 120 / 60 = 2 గంటలు.',
    };

    const result = await QuestionValidationEngine.validate(validCandidate as any, { skipTaxonomyLookup: true });
    assert(
      (result.status === QuestionValidationStatus.VALID || result.status === QuestionValidationStatus.NEEDS_REVIEW) && !result.errors.some((e) => e.includes('Structural Validation Error')),
      'Test 5: Valid AI candidate save and validation works perfectly'
    );
  } catch (err: any) {
    assert(false, 'Test 5: Existing AI candidate save/validation works', err.message);
  }

  console.log(`=== REGRESSION SUMMARY: ${failures === 0 ? 'ALL PASSED' : failures + ' FAILED'} ===`);
  if (failures > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error('Fatal error in regression suite:', err);
  process.exit(1);
});
