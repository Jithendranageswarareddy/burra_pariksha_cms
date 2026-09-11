import 'dotenv/config';
import express from 'express';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { QuestionValidationEngine } from '../src/lib/validation/question-validation.engine';
import { OptionsValidator } from '../src/lib/validation/options.validator';
import { questionValidationService } from '../src/lib/services/question-validation.service';
import { taxonomyService } from '../src/lib/services/taxonomy.service';
import { similarityService } from '../src/lib/services/similarity.service';
import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { authService } from '../src/lib/services/auth.service';
import { apiRouter } from '../src/server/routes';
import {
  Question,
  QuestionValidationStatus,
  DifficultyLevel,
  QuestionLanguage,
  QuestionStatus,
  VideoProductionStatus,
} from '../src/types';

interface SheetSnapshot {
  QUESTIONS: number;
  CONTENT_MASTERS: number;
  QUESTION_VALIDATIONS: number | string;
  WORKFLOW: number;
  AUDIT_LOG: number;
  SEQUENCES: number;
  timestamp: string;
}

async function getLiveSnapshot(): Promise<SheetSnapshot> {
  const metadata = await googleSheetsClient.getSpreadsheetMetadata();
  const names = metadata.sheetNames;

  const countSheet = async (sheetName: string): Promise<number | string> => {
    if (!names.includes(sheetName)) {
      return 'TAB_NOT_PRESENT (0)';
    }
    try {
      const res = await googleSheetsClient.getRows(sheetName);
      return res.rows.length;
    } catch (err: any) {
      return `ERROR: ${err.message}`;
    }
  };

  const q = await countSheet('QUESTIONS');
  const cm = await countSheet('CONTENT_MASTERS');
  const qv = await countSheet('QUESTION_VALIDATIONS');
  const wf = await countSheet('WORKFLOW');
  const al = await countSheet('AUDIT_LOG');
  const seq = await countSheet('SEQUENCES');

  return {
    QUESTIONS: typeof q === 'number' ? q : 0,
    CONTENT_MASTERS: typeof cm === 'number' ? cm : 0,
    QUESTION_VALIDATIONS: qv,
    WORKFLOW: typeof wf === 'number' ? wf : 0,
    AUDIT_LOG: typeof al === 'number' ? al : 0,
    SEQUENCES: typeof seq === 'number' ? seq : 0,
    timestamp: new Date().toISOString(),
  };
}

async function callApiValidateCandidate(app: express.Express, token: string, candidate: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', async () => {
      try {
        const address = server.address() as any;
        const port = address.port;
        const resp = await fetch(`http://127.0.0.1:${port}/api/questions/validate-candidate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ question: candidate }),
        });
        const json = await resp.json();
        server.close();
        resolve({ status: resp.status, body: json });
      } catch (err) {
        server.close();
        reject(err);
      }
    });
  });
}

async function runPhase5SmokeTest() {
  console.log('=== PHASE 5: CONTROLLED LIVE DETERMINISTIC VALIDATION SMOKE TEST ===\n');

  // 1. Pre-test Snapshot
  console.log('--- Step 1: Taking Pre-Test Live Database Snapshot ---');
  const preSnapshot = await getLiveSnapshot();
  console.log('Pre-test snapshot:', JSON.stringify(preSnapshot, null, 2));

  // Initialize Express App for API route testing
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  // Generate Admin session token
  const token = authService.generateSessionToken({
    userId: 'TEST-ADMIN-PHASE5',
    name: 'Phase 5 Smoke Test Admin',
    role: 'ADMIN',
  });

  // -------------------------------------------------------------------------
  // TEST CASE 1: Valid Deterministic Aptitude Question
  // -------------------------------------------------------------------------
  console.log('\n--- Test Case 1: Valid Deterministic Aptitude Question ---');
  const candidate1: Partial<Question> = {
    id: 'CANDIDATE-TC1-VALID',
    categoryId: 'CAT-QA',
    categoryName: 'Quantitative Aptitude',
    topicId: 'TOP-QA-01',
    topicName: 'Speed, Time and Distance',
    subtopicId: 'SUB-QA-01-01',
    subtopicName: 'Time, Speed & Relative Velocity',
    questionText: 'A 300 m long train crosses a 200 m long platform at a speed of 90 km/h. How many seconds does it take?',
    options: { a: '20 seconds', b: '25 seconds', c: '18 seconds', d: '15 seconds' },
    correctAnswer: 'A',
    explanation: 'Total distance = 300 + 200 = 500m. Speed = 90 * 5/18 = 25 m/s. Time = 500 / 25 = 20 seconds.',
    difficulty: DifficultyLevel.MEDIUM,
    challengeType: 'ABCD',
    presentationType: 'Text',
    language: QuestionLanguage.ENGLISH,
    status: QuestionStatus.DRAFT,
    videoStatus: VideoProductionStatus.NOT_STARTED,
  };

  // Direct engine execution
  const directResult1 = await QuestionValidationEngine.validate(candidate1 as Question);
  console.log('TC1 Direct Engine Status:', directResult1.status);
  console.log('TC1 Direct Math Status:', directResult1.mathematicalLogicalResult.status);
  console.log('TC1 Direct Confidence:', directResult1.confidenceScore);

  // API route execution
  const apiResult1 = await callApiValidateCandidate(app, token, candidate1);
  console.log('TC1 API HTTP Status:', apiResult1.status);
  console.log('TC1 API Validation Status:', apiResult1.body?.data?.status);

  // -------------------------------------------------------------------------
  // TEST CASE 2: Mathematical Contradiction
  // -------------------------------------------------------------------------
  console.log('\n--- Test Case 2: Mathematical Contradiction ---');
  const candidate2: Partial<Question> = {
    ...candidate1,
    id: 'CANDIDATE-TC2-CONTRADICTION',
    correctAnswer: 'B', // Intentionally wrong (25s instead of 20s)
  };

  const directResult2 = await QuestionValidationEngine.validate(candidate2 as Question);
  console.log('TC2 Direct Engine Status:', directResult2.status);
  console.log('TC2 Direct Math Status:', directResult2.mathematicalLogicalResult.status);
  console.log('TC2 Math Details:', directResult2.mathematicalLogicalResult.details);

  const apiResult2 = await callApiValidateCandidate(app, token, candidate2);
  console.log('TC2 API HTTP Status:', apiResult2.status);
  console.log('TC2 API Validation Status:', apiResult2.body?.data?.status);

  // -------------------------------------------------------------------------
  // TEST CASE 3: Invalid Taxonomy Relationship
  // -------------------------------------------------------------------------
  console.log('\n--- Test Case 3: Invalid Taxonomy Relationship ---');
  const allSubtopics = await taxonomyService.getSubtopics();
  const mismatchedSub = allSubtopics.find(s => s.topicId && s.topicId !== 'TOP-QA-01');
  let tc3Exercised = false;
  let directResult3: any = null;
  let apiResult3: any = null;

  if (mismatchedSub) {
    tc3Exercised = true;
    const candidate3: Partial<Question> = {
      ...candidate1,
      id: 'CANDIDATE-TC3-MISMATCH',
      topicId: 'TOP-QA-01',
      subtopicId: mismatchedSub.id, // belongs to mismatchedSub.topicId!
    };

    directResult3 = await QuestionValidationEngine.validate(candidate3 as Question);
    console.log('TC3 Mismatch tested:', `topicId=TOP-QA-01 paired with subtopicId=${mismatchedSub.id} (belongs to ${mismatchedSub.topicId})`);
    console.log('TC3 Direct Engine Status:', directResult3.status);
    console.log('TC3 Direct Errors:', directResult3.errors);

    apiResult3 = await callApiValidateCandidate(app, token, candidate3);
    console.log('TC3 API HTTP Status:', apiResult3.status);
    console.log('TC3 API Validation Status:', apiResult3.body?.data?.status);
  } else {
    console.log('TC3: No suitable mismatched pair found in live taxonomy.');
  }

  // -------------------------------------------------------------------------
  // TEST CASE 4: Duplicate Detection (Advisory)
  // -------------------------------------------------------------------------
  console.log('\n--- Test Case 4: Duplicate Detection (Advisory) ---');
  const questionsRows = await googleSheetsClient.getRows('QUESTIONS');
  const rowWithText = questionsRows.rows.find(row => row[8] && String(row[8]).trim().length > 5);

  let tc4ExistingMatch: any = null;
  let tc4SimilarityResult: any = null;

  if (rowWithText) {
    const existingId = String(rowWithText[0]);
    const existingText = String(rowWithText[8]);
    console.log(`TC4: Using existing question ID=${existingId}, text="${existingText}"`);
    
    // In-memory candidate with exact same text
    const matches = await similarityService.findSimilarQuestions(existingText);
    tc4ExistingMatch = { id: existingId, questionText: existingText };
    tc4SimilarityResult = matches.find(m => m.matchedQuestionId === existingId);
    console.log('TC4 Match Found: Type =', tc4SimilarityResult?.type, '| Score =', tc4SimilarityResult?.similarityScore, '| Reason =', tc4SimilarityResult?.reason);
  } else {
    console.log('TC4: No existing questions with text found in QUESTIONS sheet.');
  }

  // -------------------------------------------------------------------------
  // TEST CASE 5: Placeholder / Malformed Content
  // -------------------------------------------------------------------------
  console.log('\n--- Test Case 5: Placeholder / Malformed Content ---');
  const candidate5: Partial<Question> = {
    ...candidate1,
    id: 'CANDIDATE-TC5-PLACEHOLDER',
    questionText: 'A train running at speed [SPEED] takes TODO seconds to cross a platform.',
  };

  const directResult5 = await QuestionValidationEngine.validate(candidate5 as Question);
  console.log('TC5 Direct Engine Status:', directResult5.status);
  console.log('TC5 Ambiguity Result:', directResult5.ambiguityResult);
  console.log('TC5 Warnings/Errors:', [...directResult5.errors, ...directResult5.warnings]);

  const apiResult5 = await callApiValidateCandidate(app, token, candidate5);
  console.log('TC5 API HTTP Status:', apiResult5.status);
  console.log('TC5 API Validation Status:', apiResult5.body?.data?.status);

  // -------------------------------------------------------------------------
  // TEST CASE 6: Binary Option Validation
  // -------------------------------------------------------------------------
  console.log('\n--- Test Case 6: Binary Option Validation ---');
  // Part A: Valid TRUE_FALSE structure and answer key
  const optionsCheckA = OptionsValidator.validate(
    'TRUE_FALSE',
    { a: 'True', b: 'False', c: '', d: '' },
    'A'
  );
  console.log('TC6 (Correct Answer A) OptionsValidator.isValid:', optionsCheckA.isValid);

  const candidate6VerbalValid: Partial<Question> = {
    ...candidate1,
    id: 'CANDIDATE-TC6-VALID',
    questionText: 'The sun rises in the east and sets in the west.',
    challengeType: 'TRUE_FALSE',
    options: { a: 'True', b: 'False', c: '', d: '' },
    correctAnswer: 'A',
    explanation: 'Due to the Earth rotating eastward, celestial objects appear to rise in the east and set in the west.',
  };

  const directResult6Valid = await QuestionValidationEngine.validate(candidate6VerbalValid as Question);
  console.log('TC6 (Correct Answer A) Direct Engine Status:', directResult6Valid.status);

  const apiResult6Valid = await callApiValidateCandidate(app, token, candidate6VerbalValid);
  console.log('TC6 (Correct Answer A) API HTTP Status:', apiResult6Valid.status);
  console.log('TC6 (Correct Answer A) API Validation Status:', apiResult6Valid.body?.data?.status);

  // Part B: Invalid answer key C for TRUE_FALSE
  const optionsCheckC = OptionsValidator.validate(
    'TRUE_FALSE',
    { a: 'True', b: 'False', c: '', d: '' },
    'C'
  );
  console.log('TC6 (Correct Answer C) OptionsValidator.isValid:', optionsCheckC.isValid);
  console.log('TC6 (Correct Answer C) OptionsValidator errors:', optionsCheckC.errors);

  const candidate6Invalid: Partial<Question> = {
    ...candidate6VerbalValid,
    id: 'CANDIDATE-TC6-INVALID',
    correctAnswer: 'C', // Invalid for TRUE_FALSE
  };

  const directResult6Invalid = await QuestionValidationEngine.validate(candidate6Invalid as Question);
  console.log('TC6 (Correct Answer C) Direct Status:', directResult6Invalid.status);
  console.log('TC6 (Correct Answer C) Direct Errors:', directResult6Invalid.errors);

  const apiResult6Invalid = await callApiValidateCandidate(app, token, candidate6Invalid);
  console.log('TC6 (Correct Answer C) API HTTP Status:', apiResult6Invalid.status);
  console.log('TC6 (Correct Answer C) API Validation Status:', apiResult6Invalid.body?.data?.status);

  // -------------------------------------------------------------------------
  // 8. Post-test Snapshot & Verification
  // -------------------------------------------------------------------------
  console.log('\n--- Step 8: Taking Post-Test Live Database Snapshot ---');
  const postSnapshot = await getLiveSnapshot();
  console.log('Post-test snapshot:', JSON.stringify(postSnapshot, null, 2));

  const questionsUnchanged = preSnapshot.QUESTIONS === postSnapshot.QUESTIONS;
  const contentMastersUnchanged = preSnapshot.CONTENT_MASTERS === postSnapshot.CONTENT_MASTERS;
  const questionValidationsUnchanged = preSnapshot.QUESTION_VALIDATIONS === postSnapshot.QUESTION_VALIDATIONS;
  const workflowUnchanged = preSnapshot.WORKFLOW === postSnapshot.WORKFLOW;
  const auditLogUnchanged = preSnapshot.AUDIT_LOG === postSnapshot.AUDIT_LOG;
  const sequencesUnchanged = preSnapshot.SEQUENCES === postSnapshot.SEQUENCES;

  const zeroPersistenceVerified =
    questionsUnchanged &&
    contentMastersUnchanged &&
    questionValidationsUnchanged &&
    workflowUnchanged &&
    auditLogUnchanged &&
    sequencesUnchanged;

  console.log('\n--- Persistence Safety Check ---');
  console.log('QUESTIONS unchanged:', questionsUnchanged);
  console.log('CONTENT_MASTERS unchanged:', contentMastersUnchanged);
  console.log('QUESTION_VALIDATIONS unchanged:', questionValidationsUnchanged);
  console.log('WORKFLOW unchanged:', workflowUnchanged);
  console.log('AUDIT_LOG unchanged:', auditLogUnchanged);
  console.log('SEQUENCES unchanged:', sequencesUnchanged);
  console.log('OVERALL ZERO PERSISTENCE VERIFIED:', zeroPersistenceVerified);

  // Output structured result JSON
  const summaryOutput = {
    preSnapshot,
    postSnapshot,
    zeroPersistenceVerified,
    test1: {
      directStatus: directResult1.status,
      mathStatus: directResult1.mathematicalLogicalResult.status,
      confidence: directResult1.confidenceScore,
      apiHttpStatus: apiResult1.status,
      apiStatus: apiResult1.body?.data?.status,
    },
    test2: {
      directStatus: directResult2.status,
      mathStatus: directResult2.mathematicalLogicalResult.status,
      mathDetails: directResult2.mathematicalLogicalResult.details,
      apiHttpStatus: apiResult2.status,
      apiStatus: apiResult2.body?.data?.status,
    },
    test3: {
      exercised: tc3Exercised,
      subtopicId: mismatchedSub?.id,
      topicId: mismatchedSub?.topicId,
      directStatus: directResult3?.status,
      errors: directResult3?.errors,
      apiHttpStatus: apiResult3?.status,
      apiStatus: apiResult3?.body?.data?.status,
    },
    test4: {
      targetQuestionId: tc4ExistingMatch?.id,
      targetQuestionText: tc4ExistingMatch?.questionText,
      matchType: tc4SimilarityResult?.type,
      similarityScore: tc4SimilarityResult?.similarityScore,
      reason: tc4SimilarityResult?.reason,
    },
    test5: {
      directStatus: directResult5.status,
      ambiguity: directResult5.ambiguityResult,
      errors: directResult5.errors,
      warnings: directResult5.warnings,
      apiHttpStatus: apiResult5.status,
      apiStatus: apiResult5.body?.data?.status,
    },
    test6: {
      partA_optionsValid: optionsCheckA.isValid,
      partA_engineStatus: directResult6Valid.status,
      partA_apiStatus: apiResult6Valid.body?.data?.status,
      partB_optionsValid: optionsCheckC.isValid,
      partB_optionsErrors: optionsCheckC.errors,
      partB_engineStatus: directResult6Invalid.status,
      partB_apiStatus: apiResult6Invalid.body?.data?.status,
    },
  };

  console.log('\n=== FINAL SMOKE TEST SUMMARY ===');
  console.log(JSON.stringify(summaryOutput, null, 2));
}

runPhase5SmokeTest().catch((err) => {
  console.error('Fatal error running smoke test:', err);
  process.exit(1);
});
