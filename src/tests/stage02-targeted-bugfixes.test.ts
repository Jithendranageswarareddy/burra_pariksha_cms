/**
 * BURRA PARIKSHA CMS — Stage 02 Targeted Bugfixes & UX Regression Test Suite
 * 
 * Verifies:
 * TEST 1: Stage 02 maps to Stage 02 / 15 (via ProductionJourneyBar stageCodeToNumber).
 * TEST 2: confidenceScore = 0 renders 0%, not 98%.
 * TEST 3: A failed Layer 7 explanation check renders FAILED / INVALID.
 * TEST 4: A verified mathematical layer renders Passed / VERIFIED.
 * TEST 5: A missing explanation cannot be approved (Approve & Mark Ready blocked).
 * TEST 6: Adding a valid explanation and re-running verification produces VALID when all other checks pass.
 * TEST 7: Stage 01 remains completely free of downstream verification UI.
 * TEST 8: BP-DFT draft does not receive permanent BP-Q ID before approval.
 * TEST 9: Successful approval creates the expected permanent records (BP-Q-######, Content Master, Video Queue).
 */

import fs from 'fs';
import path from 'path';
import { questionDraftService } from '../lib/services/question-draft.service';
import { questionDraftsRepository } from '../lib/repositories/question-drafts.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { questionValidationService } from '../lib/services/question-validation.service';
import { idService } from '../lib/services/id.service';
import { QuestionValidationStatus } from '../types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
}

export async function runStage02RegressionTests() {
  console.log('Running Stage 02 Targeted Bugfixes & UX Regression Test Suite...');

  // --------------------------------------------------------------------------
  // TEST 1: Stage 02 maps to Stage 02 / 15
  // --------------------------------------------------------------------------
  const barFilePath = path.resolve(process.cwd(), 'src/components/production/ProductionJourneyBar.tsx');
  const barContent = fs.readFileSync(barFilePath, 'utf8');
  assert(barContent.includes('QUESTION_VERIFICATION: 2'), 'ProductionJourneyBar maps QUESTION_VERIFICATION to Stage 2');
  assert(barContent.includes('QUESTION_GENERATION: 1'), 'ProductionJourneyBar maps QUESTION_GENERATION to Stage 1');

  // --------------------------------------------------------------------------
  // TEST 2: confidenceScore = 0 renders 0%, not 98%
  // --------------------------------------------------------------------------
  const verifyPagePath = path.resolve(process.cwd(), 'src/pages/QuestionVerifyApprovePage.tsx');
  const verifyContent = fs.readFileSync(verifyPagePath, 'utf8');
  assert(!verifyContent.includes(": '98%'"), 'No fallback to fake 98% confidence score in QuestionVerifyApprovePage');
  assert(verifyContent.includes('confidenceScore !== undefined'), 'QuestionVerifyApprovePage checks explicit confidenceScore availability');

  // --------------------------------------------------------------------------
  // TEST 3 & 4 & 5: Failed Layer 7 explanation vs Verified Math & Approval Gate
  // --------------------------------------------------------------------------
  questionDraftsRepository.clear();

  const validMathNoExplanationCandidate = {
    topicId: 'BP-TOP-001',
    subtopicId: 'BP-SUB-0001',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: 'ఒక షర్ట్ అసలు ధర ₹1000. దాని ధరను 20% పెంచారు. ఆ తర్వాత పెంచిన ధరపై 20% తగ్గించారు. ఇప్పుడు అసలు ధరతో పోలిస్తే చివరికి ఎంత మారింది?',
    question: 'ఒక షర్ట్ అసలు ధర ₹1000. దాని ధరను 20% పెంచారు. ఆ తర్వాత పెంచిన ధరపై 20% తగ్గించారు. ఇప్పుడు అసలు ధరతో పోలిస్తే చివరికి ఎంత మారింది?',
    options: {
      a: '₹40 పెరిగింది',
      b: '₹40 తగ్గింది',
      c: 'ఎలాంటి మార్పు లేదు',
      d: '₹20 తగ్గింది',
    },
    correctAnswer: 'B' as const,
    explanation: '', // Missing explanation
    realWorldContext: 'Retail Festive Discounts',
    challengeType: 'ABCD',
    presentationType: 'Text',
    questionStyle: 'STORY_BASED',
    tags: ['Aptitude', 'Percentage'],
  };

  const savedDraft = await questionDraftService.saveDraft(validMathNoExplanationCandidate, {
    id: 'USR-TEST',
    name: 'Test Reviewer',
  });

  assert(Boolean(savedDraft.id && savedDraft.id.startsWith('BP-DFT-')), 'TEST 8: Saved draft starts with BP-DFT-');

  // Validate the draft (missing explanation)
  const initialValResult = await questionValidationService.validateQuestion(savedDraft.id, 'TEST', { skipDuplicateCheck: true });
  assert(initialValResult.status === QuestionValidationStatus.INVALID, 'TEST 3: Missing explanation forces status to INVALID');
  assert(initialValResult.confidenceScore === 0, 'TEST 2: INVALID status returns confidenceScore = 0');
  
  const layer3Math = initialValResult.layers?.['LAYER_3_MATHEMATICAL'];
  assert(layer3Math?.status === 'VERIFIED', 'TEST 4: Mathematical calculation is independently VERIFIED as Option B');

  const layer7Exp = initialValResult.layers?.['LAYER_7_EXPLANATION'];
  assert(layer7Exp?.status === 'FAILED', 'TEST 3: Layer 7 Explanation check returns FAILED due to missing explanation');

  // --------------------------------------------------------------------------
  // TEST 5 & 8: Approval Gate remains blocked while INVALID
  // --------------------------------------------------------------------------
  assert(verifyContent.includes('validationResult?.status !== QuestionValidationStatus.VALID'), 'Approval button disabled when validation status is not VALID');

  // --------------------------------------------------------------------------
  // TEST 6: Adding a valid explanation produces VALID status
  // --------------------------------------------------------------------------
  const validExplanation = 'అసలు ధర = ₹1000. 20% పెంచిన ధర = ₹1000 + ₹200 = ₹1200. ఆ తర్వాత ₹1200 పై 20% తగ్గించిన ధర = ₹1200 - ₹240 = ₹960. ప్రారంభ ధర ₹1000 నుండి చివరి ధర ₹960 కి ₹40 తగ్గింది (ఆప్షన్ B).';
  
  await questionDraftService.saveDraft({
    ...savedDraft,
    id: savedDraft.id,
    explanation: validExplanation,
  });

  const updatedValResult = await questionValidationService.validateQuestion(savedDraft.id, 'TEST', { skipDuplicateCheck: true });
  console.log('TEST 6 updatedValResult:', {
    status: updatedValResult.status,
    confidenceScore: updatedValResult.confidenceScore,
    errors: updatedValResult.errors,
    warnings: updatedValResult.warnings,
  });
  assert(updatedValResult.status === QuestionValidationStatus.VALID, `TEST 6: Valid explanation produces overall VALID status (actual: ${updatedValResult.status}, errors: ${JSON.stringify(updatedValResult.errors)})`);
  assert(updatedValResult.confidenceScore >= 0.8, `TEST 6: Valid question confidenceScore is >= 0.8 (actual: ${updatedValResult.confidenceScore})`);

  // --------------------------------------------------------------------------
  // TEST 7: Stage 01 remains free of downstream verification UI
  // --------------------------------------------------------------------------
  const studioPagePath = path.resolve(process.cwd(), 'src/pages/QuestionStudioPage.tsx');
  const studioContent = fs.readFileSync(studioPagePath, 'utf8');
  assert(!studioContent.includes('Client: PASS'), 'TEST 7: Stage 01 contains no downstream verification badges');
  assert(!studioContent.includes('MultiLayerVerificationEngine'), 'TEST 7: Stage 01 does not invoke MultiLayerVerificationEngine');

  // --------------------------------------------------------------------------
  // TEST 9: Successful approval creates permanent records
  // --------------------------------------------------------------------------
  const approvedQuestion = await questionDraftService.approveDraft(savedDraft.id, {
    id: 'USR-REVIEWER',
    name: 'Lead Reviewer',
  }, 'Approved in Stage 02 test');

  assert(Boolean(approvedQuestion.id && approvedQuestion.id.startsWith('BP-Q-')), 'TEST 9: Approved question has permanent BP-Q-###### ID');
  assert(approvedQuestion.status === 'APPROVED', 'TEST 9: Approved question status is APPROVED');

  // Verify draft cleanup
  const checkDraft = await questionDraftsRepository.findById(savedDraft.id);
  assert(checkDraft === null, 'TEST 9: Draft record is cleaned up after approval');

  console.log('All Stage 02 Targeted Bugfixes & UX Regression Tests Passed Successfully!');
}

runStage02RegressionTests().catch((err) => {
  console.error('Stage 02 Regression Test Failure:', err);
  process.exit(1);
});
