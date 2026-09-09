/**
 * BURRA PARIKSHA CMS - Task 5 Question Validation Engine Verification Suite
 * Phase 5 Verification Test Runner
 * 
 * Verifies all 30 forensic checks (CHECK-01 through CHECK-30) for:
 * - Structural, Taxonomy, and Challenge Type Integrity
 * - Options, Duplicate Detection, and Answer Verification
 * - Deterministic Mathematical & Logical Solvers
 * - Explanation Verification & Contradiction Detection
 * - Ambiguity & Clarity Detection
 * - Real-Life Context & Language Consistency
 * - Fairness, Sanity & Answer Leakage Prevention
 * - Multi-Model Provider Interface & Consensus Conflicts
 * - Manual Edit Revalidation & Invalidation Lifecycle
 */

import { QuestionValidationEngine } from '../lib/validation/question-validation.engine';
import { MathematicalLogicalEngine } from '../lib/validation/mathematical-logical.engine';
import { OptionsValidator } from '../lib/validation/options.validator';
import { ExplanationValidator } from '../lib/validation/explanation.validator';
import { AmbiguityDetector } from '../lib/validation/ambiguity.detector';
import { ConsistencyValidator } from '../lib/validation/consistency.validator';
import { FairnessValidator } from '../lib/validation/fairness.validator';
import { ConsensusEngine } from '../lib/validation/consensus.engine';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { validationsRepository } from '../lib/repositories/validations.repository';
import { taxonomyService } from '../lib/services/taxonomy.service';
import {
  Question,
  QuestionValidationStatus,
  QuestionStatus,
  VideoProductionStatus,
  QuestionLanguage,
  QuestionValidatorProvider,
  DifficultyLevel,
} from '../types';

export interface VerificationCheckResult {
  id: string;
  name: string;
  category: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export interface VerificationSuiteSummary {
  success: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  checks: VerificationCheckResult[];
  timestamp: string;
}

function createMockQuestion(overrides: Partial<Question>): Question {
  return {
    id: 'TEST-Q-DEFAULT',
    categoryId: 'CAT-QA',
    categoryName: 'Quantitative Aptitude',
    topicId: 'TOP-QUANT-001',
    topicName: 'Arithmetic Operations',
    subtopicId: 'SUB-QUANT-001-01',
    subtopicName: 'Addition and Subtraction Mastery',
    questionText: 'What is 10 + 20?',
    options: { a: '30', b: '40', c: '50', d: '60' },
    correctAnswer: 'A',
    explanation: '10 plus 20 equals 30.',
    difficulty: DifficultyLevel.MEDIUM,
    challengeType: 'ABCD',
    presentationType: 'Text',
    language: QuestionLanguage.ENGLISH,
    status: QuestionStatus.DRAFT,
    videoStatus: VideoProductionStatus.NOT_STARTED,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export async function runTask5QuestionValidationEngineVerification(): Promise<VerificationSuiteSummary> {
  const checks: VerificationCheckResult[] = [];

  const recordCheck = (id: string, name: string, category: string, pass: boolean, details: string) => {
    checks.push({
      id,
      name,
      category,
      status: pass ? 'PASS' : 'FAIL',
      details,
    });
  };

  // -------------------------------------------------------------------------
  // CHECK-01: Canonical Challenge Types Support
  // -------------------------------------------------------------------------
  try {
    const supportedTypes = ['ABCD', 'TRUE_FALSE', 'YES_NO', 'ARRANGE_ORDER', 'INCORRECT'];
    const results = supportedTypes.map((type) => {
      const opts = type === 'TRUE_FALSE'
        ? { a: 'True', b: 'False', c: '', d: '' }
        : type === 'YES_NO'
        ? { a: 'Yes', b: 'No', c: '', d: '' }
        : type === 'ARRANGE_ORDER'
        ? { a: '1-2-3-4', b: '2-1-3-4', c: '4-3-2-1', d: '3-1-2-4' }
        : type === 'INCORRECT'
        ? { a: 'Statement A is correct', b: 'Statement B is incorrect', c: 'Statement C is correct', d: 'Statement D is correct' }
        : { a: '10', b: '20', c: '30', d: '40' };

      return OptionsValidator.validate(type, opts, 'A').isValid;
    });

    const allPassed = results.every(Boolean);
    recordCheck(
      'CHECK-01',
      'Canonical Challenge Types Support',
      'CHALLENGE_TYPES',
      allPassed,
      allPassed
        ? 'All 5 canonical challenge types (ABCD, TRUE_FALSE, YES_NO, ARRANGE_ORDER, INCORRECT) correctly supported by validator.'
        : 'One or more canonical challenge types failed option validation.'
    );
  } catch (err: any) {
    recordCheck('CHECK-01', 'Canonical Challenge Types Support', 'CHALLENGE_TYPES', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-02: Structural Validation Pass on Well-Formed Question
  // -------------------------------------------------------------------------
  try {
    const validQuestion = createMockQuestion({
      id: 'TEST-Q-01',
      questionText: 'What is 25% of 600?',
      options: { a: '150', b: '120', c: '180', d: '200' },
      correctAnswer: 'A',
      explanation: 'To find 25% of 600, calculate 0.25 * 600 = 150.',
    });

    const res = await QuestionValidationEngine.validate(validQuestion, { skipTaxonomyLookup: true });
    const pass = res.status === QuestionValidationStatus.VALID && res.confidenceScore > 0.8;
    recordCheck(
      'CHECK-02',
      'Structural Validation Pass on Well-Formed Question',
      'STRUCTURAL',
      pass,
      `Validation returned status=${res.status} with confidence=${res.confidenceScore}`
    );
  } catch (err: any) {
    recordCheck('CHECK-02', 'Structural Validation Pass', 'STRUCTURAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-03: Structural Validation Rejection on Missing Question Text
  // -------------------------------------------------------------------------
  try {
    const invalidQ = createMockQuestion({
      id: 'TEST-Q-02',
      questionText: '', // missing
      options: { a: '150', b: '120', c: '180', d: '200' },
      correctAnswer: 'A',
      explanation: 'To find 25% of 600, calculate 0.25 * 600 = 150.',
    });

    const res = await QuestionValidationEngine.validate(invalidQ, { skipTaxonomyLookup: true });
    const pass = res.status === QuestionValidationStatus.INVALID && res.errors.length > 0;
    recordCheck(
      'CHECK-03',
      'Structural Validation Rejection on Missing Question Text',
      'STRUCTURAL',
      pass,
      `Correctly rejected with status=INVALID; errors=${res.errors.join('; ')}`
    );
  } catch (err: any) {
    recordCheck('CHECK-03', 'Structural Validation Rejection', 'STRUCTURAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-04: Structural Validation Rejection on Short Explanation
  // -------------------------------------------------------------------------
  try {
    const invalidExpQ = createMockQuestion({
      id: 'TEST-Q-03',
      questionText: 'What is 25% of 600?',
      options: { a: '150', b: '120', c: '180', d: '200' },
      correctAnswer: 'A',
      explanation: 'TODO', // too short (<15 chars)
    });

    const res = await QuestionValidationEngine.validate(invalidExpQ, { skipTaxonomyLookup: true });
    const pass = res.status === QuestionValidationStatus.INVALID && !res.explanationVerification.substantiveLength;
    recordCheck(
      'CHECK-04',
      'Structural Validation Rejection on Short Explanation',
      'EXPLANATION',
      pass,
      `Correctly identified insubstantial explanation: "${invalidExpQ.explanation}"`
    );
  } catch (err: any) {
    recordCheck('CHECK-04', 'Short Explanation Rejection', 'EXPLANATION', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-05: Taxonomy Validation: Topic and Subtopic Belong Together
  // -------------------------------------------------------------------------
  try {
    const subtopics = await taxonomyService.getSubtopics();
    const pairedSubtopic = subtopics.find((s) => Boolean(s.topicId));
    const testTopicId = pairedSubtopic?.topicId || 'BP-TOP-1000001';
    const testSubtopicId = pairedSubtopic?.id || 'BP-SUB-1000001';

    const validTaxQ = createMockQuestion({
      id: 'TEST-Q-05',
      topicId: testTopicId,
      subtopicId: testSubtopicId,
      questionText: 'What is 15 * 12?',
      options: { a: '180', b: '150', c: '160', d: '190' },
      correctAnswer: 'A',
      explanation: '15 multiplied by 12 gives 180.',
    });

    const res = await QuestionValidationEngine.validate(validTaxQ);
    const taxCheck = res.checks.find((c) => c.id === 'CHK_STAGE_2_TAXONOMY');
    const pass = taxCheck !== undefined && taxCheck.status !== 'FAIL';
    recordCheck(
      'CHECK-05',
      'Taxonomy Validation: Topic and Subtopic Match',
      'TAXONOMY',
      pass,
      `Taxonomy check status: ${taxCheck?.status}; message: ${taxCheck?.message}`
    );
  } catch (err: any) {
    recordCheck('CHECK-05', 'Taxonomy Match', 'TAXONOMY', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-06: Taxonomy Validation Failure on Mismatched Subtopic
  // -------------------------------------------------------------------------
  try {
    const subtopics = await taxonomyService.getSubtopics();
    const pairedSubtopic = subtopics.find((s) => Boolean(s.topicId));
    const testTopicId = pairedSubtopic?.topicId || 'BP-TOP-1000001';

    const mismatchQ = createMockQuestion({
      id: 'TEST-Q-06',
      topicId: testTopicId,
      subtopicId: 'SUB-NONEXISTENT-999',
      questionText: 'What is 15 * 12?',
      options: { a: '180', b: '150', c: '160', d: '190' },
      correctAnswer: 'A',
      explanation: '15 multiplied by 12 gives 180.',
    });

    const res = await QuestionValidationEngine.validate(mismatchQ);
    const taxCheck = res.checks.find((c) => c.id === 'CHK_STAGE_2_TAXONOMY');
    const pass = res.status === QuestionValidationStatus.INVALID || taxCheck?.status === 'FAIL';
    recordCheck(
      'CHECK-06',
      'Taxonomy Validation Failure on Mismatched Subtopic',
      'TAXONOMY',
      pass,
      `Non-existent subtopic properly flagged with failure: ${taxCheck?.message}`
    );
  } catch (err: any) {
    recordCheck('CHECK-06', 'Mismatched Subtopic Failure', 'TAXONOMY', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-07: Options Validation: TRUE_FALSE Option Requirements
  // -------------------------------------------------------------------------
  try {
    const missingOptionB = OptionsValidator.validate(
      'TRUE_FALSE',
      { a: 'True', b: '', c: '', d: '' },
      'A'
    );
    const pass = !missingOptionB.isValid && missingOptionB.errors.some((e) => e.includes('Option B'));
    recordCheck(
      'CHECK-07',
      'Options Validation: TRUE_FALSE Option A & B Requirements',
      'OPTIONS',
      pass,
      `Correctly caught missing Option B in TRUE_FALSE: ${missingOptionB.errors[0]}`
    );
  } catch (err: any) {
    recordCheck('CHECK-07', 'TRUE_FALSE Options', 'OPTIONS', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-08: Options Validation: TRUE_FALSE Answer Key Constraint
  // -------------------------------------------------------------------------
  try {
    const invalidKey = OptionsValidator.validate(
      'TRUE_FALSE',
      { a: 'True', b: 'False', c: '', d: '' },
      'C'
    );
    const pass = !invalidKey.isValid && invalidKey.errors.some((e) => e.includes("correctAnswer must be 'A' or 'B'"));
    recordCheck(
      'CHECK-08',
      'Options Validation: TRUE_FALSE Answer Key Constraint',
      'OPTIONS',
      pass,
      `Correctly rejected invalid answer key 'C' for TRUE_FALSE.`
    );
  } catch (err: any) {
    recordCheck('CHECK-08', 'TRUE_FALSE Answer Key', 'OPTIONS', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-09: Options Validation: YES_NO Option A & B Structure
  // -------------------------------------------------------------------------
  try {
    const validYesNo = OptionsValidator.validate(
      'YES_NO',
      { a: 'Yes', b: 'No', c: '', d: '' },
      'B'
    );
    const pass = validYesNo.isValid;
    recordCheck(
      'CHECK-09',
      'Options Validation: YES_NO Option Structure',
      'OPTIONS',
      pass,
      `YES_NO options validated successfully.`
    );
  } catch (err: any) {
    recordCheck('CHECK-09', 'YES_NO Structure', 'OPTIONS', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-10: Duplicate Options Detection (Normalized Text)
  // -------------------------------------------------------------------------
  try {
    const dupText = OptionsValidator.validate(
      'ABCD',
      { a: 'Paris', b: 'london', c: '  PARIS  ', d: 'Berlin' },
      'A'
    );
    const pass = !dupText.isValid && dupText.errors.some((e) => e.includes('Duplicate Options Detected'));
    recordCheck(
      'CHECK-10',
      'Duplicate Options Detection (Normalized Text)',
      'OPTIONS',
      pass,
      `Correctly flagged duplicate text "Paris" vs "  PARIS  ".`
    );
  } catch (err: any) {
    recordCheck('CHECK-10', 'Duplicate Options Text', 'OPTIONS', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-11: Duplicate Options Detection (Normalized Numeric)
  // -------------------------------------------------------------------------
  try {
    const dupNumeric = OptionsValidator.validate(
      'ABCD',
      { a: '20 km/h', b: '30 km/h', c: '20 km/hr', d: '50 km/h' },
      'A'
    );
    const pass = !dupNumeric.isValid && dupNumeric.errors.some((e) => e.includes('Duplicate Numerical Value Detected'));
    recordCheck(
      'CHECK-11',
      'Duplicate Options Detection (Normalized Numeric)',
      'OPTIONS',
      pass,
      `Correctly identified numerical equivalence between "20 km/h" and "20 km/hr".`
    );
  } catch (err: any) {
    recordCheck('CHECK-11', 'Duplicate Options Numeric', 'OPTIONS', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-12: Mathematical Solver: Train Crossing Platform (Provably Valid)
  // -------------------------------------------------------------------------
  try {
    // Train = 300m, Platform = 200m, Speed = 90 km/h
    // Speed in m/s = 90 * 5/18 = 25 m/s
    // Total distance = 500m
    // Time = 500 / 25 = 20 seconds
    const trainQ = createMockQuestion({
      id: 'TEST-Q-TRAIN-01',
      questionText: 'A 300 m long train crosses a 200 m long platform at a speed of 90 km/h. How many seconds does it take?',
      options: { a: '20 seconds', b: '25 seconds', c: '18 seconds', d: '15 seconds' },
      correctAnswer: 'A',
      explanation: 'Total distance = 300 + 200 = 500m. Speed = 90 * 5/18 = 25 m/s. Time = 500 / 25 = 20 seconds.',
    });

    const res = await QuestionValidationEngine.validate(trainQ, { skipTaxonomyLookup: true });
    const pass = res.mathematicalLogicalResult.status === 'PROVABLY_VALID' &&
      res.mathematicalLogicalResult.calculatedValue === 20 &&
      res.status === QuestionValidationStatus.VALID;

    recordCheck(
      'CHECK-12',
      'Mathematical Solver: Train Crossing Platform (Provably Valid)',
      'MATHEMATICAL',
      pass,
      `Deterministic engine calculated: ${res.mathematicalLogicalResult.calculatedValue}s matching declared Option A.`
    );
  } catch (err: any) {
    recordCheck('CHECK-12', 'Train Crossing Platform Provably Valid', 'MATHEMATICAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-13: Mathematical Solver: Train Crossing Platform Contradiction
  // -------------------------------------------------------------------------
  try {
    // Same question, but declared answer is B (25 seconds) instead of A (20 seconds)
    const trainContradictQ = createMockQuestion({
      id: 'TEST-Q-TRAIN-02',
      questionText: 'A 300 m long train crosses a 200 m long platform at a speed of 90 km/h. How many seconds does it take?',
      options: { a: '20 seconds', b: '25 seconds', c: '18 seconds', d: '15 seconds' },
      correctAnswer: 'B', // Contradicts math! Correct is A (20s)
      explanation: 'Total distance = 500m. Time = 20 seconds. Therefore option A is correct.',
    });

    const res = await QuestionValidationEngine.validate(trainContradictQ, { skipTaxonomyLookup: true });
    const pass = res.status === QuestionValidationStatus.INVALID &&
      res.mathematicalLogicalResult.status === 'CONTRADICTORY' &&
      res.answerVerification.contradictionDetected;

    recordCheck(
      'CHECK-13',
      'Mathematical Solver: Train Contradiction Flagging',
      'MATHEMATICAL',
      pass,
      `Contradiction successfully caught: ${res.mathematicalLogicalResult.details}`
    );
  } catch (err: any) {
    recordCheck('CHECK-13', 'Train Contradiction', 'MATHEMATICAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-14: Mathematical Solver: Train Crossing Pole/Person
  // -------------------------------------------------------------------------
  try {
    // Train = 150m, Speed = 54 km/h
    // Speed in m/s = 54 * 5/18 = 15 m/s
    // Time = 150 / 15 = 10 seconds
    const poleSol = MathematicalLogicalEngine.verify(
      'A 150 m long train passes a signal pole at 54 km/h. Find the time taken.',
      { a: '10 seconds', b: '12 seconds', c: '15 seconds', d: '8 seconds' },
      'A'
    );
    const pass = poleSol.status === 'PROVABLY_VALID' && poleSol.calculatedValue === 10;
    recordCheck(
      'CHECK-14',
      'Mathematical Solver: Train Crossing Pole/Person',
      'MATHEMATICAL',
      pass,
      `Calculated ${poleSol.calculatedValue}s matching Option A.`
    );
  } catch (err: any) {
    recordCheck('CHECK-14', 'Train Pole Solver', 'MATHEMATICAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-15: Mathematical Solver: Profit & Loss Percentage
  // -------------------------------------------------------------------------
  try {
    // CP = 400, SP = 500 -> Profit = 100 -> Profit% = (100/400)*100 = 25%
    const pAndLSol = MathematicalLogicalEngine.verify(
      'An item is purchased for ₹400 and sold at ₹500. Find the profit percentage.',
      { a: '20%', b: '25%', c: '30%', d: '15%' },
      'B'
    );
    const pass = pAndLSol.status === 'PROVABLY_VALID' && pAndLSol.calculatedValue === 25;
    recordCheck(
      'CHECK-15',
      'Mathematical Solver: Profit & Loss Percentage',
      'MATHEMATICAL',
      pass,
      `Calculated profit percentage: ${pAndLSol.calculatedValue}% matching Option B.`
    );
  } catch (err: any) {
    recordCheck('CHECK-15', 'Profit & Loss Solver', 'MATHEMATICAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-16: Mathematical Solver: Simple Interest Formula
  // -------------------------------------------------------------------------
  try {
    // P = 5000, R = 8%, T = 3 years
    // SI = (5000 * 8 * 3) / 100 = 1200
    const siSol = MathematicalLogicalEngine.verify(
      'Calculate the simple interest on a principal of ₹5000 at 8% per annum for 3 years.',
      { a: '₹1200', b: '₹1500', c: '₹1000', d: '₹1800' },
      'A'
    );
    const pass = siSol.status === 'PROVABLY_VALID' && siSol.calculatedValue === 1200;
    recordCheck(
      'CHECK-16',
      'Mathematical Solver: Simple Interest Formula',
      'MATHEMATICAL',
      pass,
      `Calculated SI: ₹${siSol.calculatedValue} matching Option A.`
    );
  } catch (err: any) {
    recordCheck('CHECK-16', 'Simple Interest Solver', 'MATHEMATICAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-17: Mathematical Solver: Successive Discounts
  // -------------------------------------------------------------------------
  try {
    // 20% and 10% successive discounts
    // Single equivalent discount = 20 + 10 - (20*10/100) = 30 - 2 = 28%
    const discSol = MathematicalLogicalEngine.verify(
      'What is the single equivalent discount for two successive discounts of 20% and 10%?',
      { a: '30%', b: '28%', c: '25%', d: '18%' },
      'B'
    );
    const pass = discSol.status === 'PROVABLY_VALID' && discSol.calculatedValue === 28;
    recordCheck(
      'CHECK-17',
      'Mathematical Solver: Successive Discounts',
      'MATHEMATICAL',
      pass,
      `Calculated equivalent discount: ${discSol.calculatedValue}% matching Option B.`
    );
  } catch (err: any) {
    recordCheck('CHECK-17', 'Successive Discounts Solver', 'MATHEMATICAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-18: Mathematical Solver: Time & Work Combined Rate
  // -------------------------------------------------------------------------
  try {
    // A in 20 days, B in 30 days
    // Combined = (20 * 30) / (20 + 30) = 600 / 50 = 12 days
    const workSol = MathematicalLogicalEngine.verify(
      'A can do a work in 20 days and B in 30 days. How many days will they take working together?',
      { a: '12 days', b: '15 days', c: '10 days', d: '25 days' },
      'A'
    );
    const pass = workSol.status === 'PROVABLY_VALID' && workSol.calculatedValue === 12;
    recordCheck(
      'CHECK-18',
      'Mathematical Solver: Time & Work Combined Rate',
      'MATHEMATICAL',
      pass,
      `Calculated combined time: ${workSol.calculatedValue} days matching Option A.`
    );
  } catch (err: any) {
    recordCheck('CHECK-18', 'Time & Work Solver', 'MATHEMATICAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-19: Mathematical Solver: Average Speed Harmonic Mean
  // -------------------------------------------------------------------------
  try {
    // S1 = 60 km/h, S2 = 40 km/h equal distance
    // Avg speed = 2 * 60 * 40 / (60 + 40) = 4800 / 100 = 48 km/h
    const avgSol = MathematicalLogicalEngine.verify(
      'A car travels equal distance at 60 km/h and returns at 40 km/h. Find the average speed.',
      { a: '50 km/h', b: '48 km/h', c: '52 km/h', d: '45 km/h' },
      'B'
    );
    const pass = avgSol.status === 'PROVABLY_VALID' && avgSol.calculatedValue === 48;
    recordCheck(
      'CHECK-19',
      'Mathematical Solver: Average Speed Harmonic Mean',
      'MATHEMATICAL',
      pass,
      `Calculated average speed: ${avgSol.calculatedValue} km/h matching Option B.`
    );
  } catch (err: any) {
    recordCheck('CHECK-19', 'Average Speed Solver', 'MATHEMATICAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-20: Unmodeled Numerical Problem Yields NEEDS_REVIEW
  // -------------------------------------------------------------------------
  try {
    // An advanced complex algebra or calculus question with numbers that isn't modeled
    const unmodeledQ = createMockQuestion({
      id: 'TEST-Q-UNMODELED',
      questionText: 'Evaluate the complex integral of z^3 around the contour |z|=5 with winding number 2.',
      options: { a: '0', b: '2pi i', c: '4pi i', d: '1' },
      correctAnswer: 'A',
      explanation: 'By Cauchy Goursat theorem, the integral of any polynomial along a closed contour is zero.',
      difficulty: DifficultyLevel.HARD,
    });

    const res = await QuestionValidationEngine.validate(unmodeledQ, { skipTaxonomyLookup: true });
    const pass = res.mathematicalLogicalResult.status === 'NOT_DETERMINISTICALLY_VERIFIED' &&
      res.status === QuestionValidationStatus.NEEDS_REVIEW;

    recordCheck(
      'CHECK-20',
      'Unmodeled Numerical Problem Yields NEEDS_REVIEW',
      'MATHEMATICAL',
      pass,
      `Correctly designated NOT_DETERMINISTICALLY_VERIFIED resulting in status=${res.status}`
    );
  } catch (err: any) {
    recordCheck('CHECK-20', 'Unmodeled Numerical Logic', 'MATHEMATICAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-21: Non-numerical Verbal Question Yields NOT_APPLICABLE & Passes
  // -------------------------------------------------------------------------
  try {
    const verbalQ = createMockQuestion({
      id: 'TEST-Q-VERBAL',
      questionText: 'Author is to Book as Sculptor is to what?',
      options: { a: 'Statue', b: 'Canvas', c: 'Novel', d: 'Chisel' },
      correctAnswer: 'A',
      explanation: 'An author creates a book, and similarly a sculptor creates a statue.',
      difficulty: DifficultyLevel.EASY,
    });

    const res = await QuestionValidationEngine.validate(verbalQ, { skipTaxonomyLookup: true });
    const pass = res.mathematicalLogicalResult.status === 'NOT_APPLICABLE' &&
      res.status === QuestionValidationStatus.VALID;

    recordCheck(
      'CHECK-21',
      'Non-numerical Verbal Question Yields NOT_APPLICABLE & Passes',
      'MATHEMATICAL',
      pass,
      `Verbal question correctly marked NOT_APPLICABLE and passed as VALID.`
    );
  } catch (err: any) {
    recordCheck('CHECK-21', 'Verbal Question Handling', 'MATHEMATICAL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-22: Explanation Contradiction Detection
  // -------------------------------------------------------------------------
  try {
    const expContradict = ExplanationValidator.validate(
      'After calculating, we find that the result is 150. Therefore option C is the correct answer.',
      'A' // Declared is A, but explanation says option C!
    );
    const pass = expContradict.result.contradictsAnswer && expContradict.errors.length > 0;
    recordCheck(
      'CHECK-22',
      'Explanation Contradiction Detection',
      'EXPLANATION',
      pass,
      `Correctly flagged explanation citing Option C when declared answer is A.`
    );
  } catch (err: any) {
    recordCheck('CHECK-22', 'Explanation Contradiction', 'EXPLANATION', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-23: Ambiguity Detection: Template Placeholders
  // -------------------------------------------------------------------------
  try {
    const ambigPlaceholder = AmbiguityDetector.detect(
      'A train running at [SPEED] km/h takes 20 seconds to cross a platform.',
      { a: '10', b: '20', c: '30', d: '40' },
      'A'
    );
    const pass = ambigPlaceholder.result.isAmbiguous &&
      ambigPlaceholder.reasons.some((r) => r.includes('Unresolved template'));
    recordCheck(
      'CHECK-23',
      'Ambiguity Detection: Template Placeholders',
      'AMBIGUITY',
      pass,
      `Correctly detected unresolved placeholder token: ${ambigPlaceholder.reasons[0]}`
    );
  } catch (err: any) {
    recordCheck('CHECK-23', 'Placeholder Ambiguity', 'AMBIGUITY', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-24: Ambiguity Detection: Missing Numerical Values before Units
  // -------------------------------------------------------------------------
  try {
    const ambigMissingNum = AmbiguityDetector.detect(
      'A bus travels at speed of km/h for 3 hours. Find the distance.',
      { a: '100', b: '150', c: '200', d: '250' },
      'A'
    );
    const pass = ambigMissingNum.result.isAmbiguous &&
      ambigMissingNum.reasons.some((r) => r.includes('omit a required numerical value'));
    recordCheck(
      'CHECK-24',
      'Ambiguity Detection: Missing Numerical Values',
      'AMBIGUITY',
      pass,
      `Detected omission of speed value before unit: ${ambigMissingNum.reasons[0]}`
    );
  } catch (err: any) {
    recordCheck('CHECK-24', 'Missing Numerical Value Ambiguity', 'AMBIGUITY', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-25: Fairness Validator: Answer Leakage Detection
  // -------------------------------------------------------------------------
  try {
    const leakage = FairnessValidator.validate(
      'Since the answer is Hyderabad, what is the capital of Telangana?',
      { a: 'Hyderabad', b: 'Warangal', c: 'Karimnagar', d: 'Nizamabad' },
      'A'
    );
    const pass = leakage.errors.some((e) => e.includes('Answer Leakage Detected'));
    recordCheck(
      'CHECK-25',
      'Fairness Validator: Answer Leakage Detection',
      'FAIRNESS',
      pass,
      `Correctly detected answer leakage giving away Option A ("Hyderabad").`
    );
  } catch (err: any) {
    recordCheck('CHECK-25', 'Answer Leakage', 'FAIRNESS', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-26: Fairness Validator: Impossible Physical Values (Negative Speed/Time)
  // -------------------------------------------------------------------------
  try {
    const negativeSpeed = FairnessValidator.validate(
      'A cyclist travels at -25 km/h for 2 hours. What is the distance?',
      { a: '50 km', b: '25 km', c: '10 km', d: '0 km' },
      'A'
    );
    const pass = negativeSpeed.errors.some((e) => e.includes('Impossible physical conditions'));
    recordCheck(
      'CHECK-26',
      'Fairness Validator: Impossible Physical Sanity',
      'FAIRNESS',
      pass,
      `Correctly identified impossible negative speed condition.`
    );
  } catch (err: any) {
    recordCheck('CHECK-26', 'Physical Sanity', 'FAIRNESS', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-27: Language Validator: Telugu Script Verification
  // -------------------------------------------------------------------------
  try {
    const teluguMissing = ConsistencyValidator.validate(
      'What is 25% of 600?', // English text
      { a: '150', b: '120', c: '180', d: '200' },
      'Explanation in English',
      undefined,
      QuestionLanguage.TELUGU
    );
    const pass = teluguMissing.errors.some((e) => e.includes('contains no Telugu script characters'));
    recordCheck(
      'CHECK-27',
      'Language Validator: Telugu Script Verification',
      'CONSISTENCY',
      pass,
      `Correctly flagged absence of Telugu characters for QuestionLanguage.TELUGU.`
    );
  } catch (err: any) {
    recordCheck('CHECK-27', 'Telugu Script Verification', 'CONSISTENCY', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-28: Multi-Model Consensus: Unanimous Agreement
  // -------------------------------------------------------------------------
  try {
    const mockProviderA: QuestionValidatorProvider = {
      providerId: 'PROV-A',
      modelId: 'MODEL-ALPHA',
      validate: async () => ({
        providerId: 'PROV-A',
        modelId: 'MODEL-ALPHA',
        verdict: 'VALID',
        confidence: 0.95,
        reasoningSummary: 'Verified valid by Model Alpha',
        detectedIssues: [],
        timestamp: new Date().toISOString(),
      }),
    };

    const mockProviderB: QuestionValidatorProvider = {
      providerId: 'PROV-B',
      modelId: 'MODEL-BETA',
      validate: async () => ({
        providerId: 'PROV-B',
        modelId: 'MODEL-BETA',
        verdict: 'VALID',
        confidence: 0.92,
        reasoningSummary: 'Verified valid by Model Beta',
        detectedIssues: [],
        timestamp: new Date().toISOString(),
      }),
    };

    const dummyQ = createMockQuestion({ id: 'TEST-Q-CONSENSUS' });
    const consensus = await ConsensusEngine.evaluateProviders(dummyQ, [mockProviderA, mockProviderB], false);
    const pass = !consensus.hasConflict && consensus.suggestedStatus === QuestionValidationStatus.VALID;
    recordCheck(
      'CHECK-28',
      'Multi-Model Consensus: Unanimous Agreement',
      'MULTI_MODEL',
      pass,
      `Unanimous agreement across 2 providers yielded suggestedStatus=VALID without conflicts.`
    );
  } catch (err: any) {
    recordCheck('CHECK-28', 'Unanimous Consensus', 'MULTI_MODEL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-29: Multi-Model Consensus: Conflict Flags NEEDS_REVIEW
  // -------------------------------------------------------------------------
  try {
    const mockProviderValid: QuestionValidatorProvider = {
      providerId: 'PROV-A',
      modelId: 'MODEL-ALPHA',
      validate: async () => ({
        providerId: 'PROV-A',
        modelId: 'MODEL-ALPHA',
        verdict: 'VALID',
        confidence: 0.90,
        reasoningSummary: 'Verified valid',
        detectedIssues: [],
        timestamp: new Date().toISOString(),
      }),
    };

    const mockProviderInvalid: QuestionValidatorProvider = {
      providerId: 'PROV-B',
      modelId: 'MODEL-BETA',
      validate: async () => ({
        providerId: 'PROV-B',
        modelId: 'MODEL-BETA',
        verdict: 'INVALID',
        confidence: 0.85,
        reasoningSummary: 'Found subtle contradiction',
        detectedIssues: ['CONTRADICTION'],
        timestamp: new Date().toISOString(),
      }),
    };

    const dummyQ = createMockQuestion({ id: 'TEST-Q-CONFLICT' });
    const consensus = await ConsensusEngine.evaluateProviders(dummyQ, [mockProviderValid, mockProviderInvalid], false);
    const pass = consensus.hasConflict && consensus.suggestedStatus === QuestionValidationStatus.NEEDS_REVIEW;
    recordCheck(
      'CHECK-29',
      'Multi-Model Consensus: Conflict Detection',
      'MULTI_MODEL',
      pass,
      `Disagreement between models properly flagged conflict and recommended NEEDS_REVIEW.`
    );
  } catch (err: any) {
    recordCheck('CHECK-29', 'Consensus Conflict', 'MULTI_MODEL', false, err.message);
  }

  // -------------------------------------------------------------------------
  // CHECK-30: Invalidation on Material Edit
  // -------------------------------------------------------------------------
  try {
    // 1. Create a dummy question in repository
    const testId = `Q-VAL-TEST-${Date.now()}`;
    const testQuestion = createMockQuestion({
      id: testId,
      questionText: 'What is 15 * 12?',
      options: { a: '180', b: '150', c: '160', d: '190' },
      correctAnswer: 'A',
      explanation: '15 multiplied by 12 gives 180.',
      validationStatus: QuestionValidationStatus.VALID,
      validationScore: 0.95,
    });

    await questionsRepository.appendRecord(testQuestion);

    // Save a validation record for this question
    await validationsRepository.saveValidationResult({
      id: `VAL-${testId}`,
      questionId: testId,
      status: QuestionValidationStatus.VALID,
      confidenceScore: 0.95,
      validatorVersion: '1.0.0',
      validationRuleVersion: '2026.09.v1',
      timestamp: new Date().toISOString(),
      source: 'DETERMINISTIC',
      summary: 'Initial validation passed',
      checks: [],
      errors: [],
      warnings: [],
      recommendations: [],
      answerVerification: { isConsistent: true, declaredAnswer: 'A', details: 'Passed', contradictionDetected: false },
      explanationVerification: { isValid: true, contradictsAnswer: false, reachesDeclaredResult: true, substantiveLength: true, details: 'OK' },
      ambiguityResult: { isAmbiguous: false, ambiguityReasons: [], confidence: 1.0, details: 'OK' },
      mathematicalLogicalResult: { status: 'PROVABLY_VALID', details: 'OK' },
      modelEvidence: [],
      isStale: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Perform a material edit via questionService.updateQuestion (changing questionText)
    const { questionService } = await import('../lib/services/question.service');
    const updated = await questionService.updateQuestion(testId, {
      questionText: 'What is 15 * 12 + 10?',
    });

    // 3. Verify validationStatus was reset to NOT_VALIDATED and past validation is marked stale
    const history = await validationsRepository.getHistoryByQuestionId(testId);
    const staleRecord = history.find((h) => h.id === `VAL-${testId}`);

    const pass = updated.validationStatus === QuestionValidationStatus.NOT_VALIDATED &&
      staleRecord?.isStale === true;

    recordCheck(
      'CHECK-30',
      'Invalidation on Material Edit',
      'LIFECYCLE',
      pass,
      `Material question edit successfully marked existing validations as stale and reset question validationStatus to NOT_VALIDATED.`
    );
  } catch (err: any) {
    recordCheck('CHECK-30', 'Edit Invalidation', 'LIFECYCLE', false, err.message);
  }

  // -------------------------------------------------------------------------
  // Suite Summary
  // -------------------------------------------------------------------------
  const passedChecks = checks.filter((c) => c.status === 'PASS').length;
  const failedChecks = checks.filter((c) => c.status === 'FAIL').length;

  return {
    success: failedChecks === 0,
    totalChecks: checks.length,
    passedChecks,
    failedChecks,
    checks,
    timestamp: new Date().toISOString(),
  };
}
