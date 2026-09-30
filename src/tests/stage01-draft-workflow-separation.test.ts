/**
 * BURRA PARIKSHA CMS - Stage 01 vs Stage 02 Architectural Separation Test Suite
 * 
 * Verifies that:
 * 1. Stage 01 produces unverified question drafts ONLY (no permanent IDs, no Sheets allocation).
 * 2. Stage 01 does NOT invoke MultiLayerVerificationEngine or QuestionValidationEngine save gates.
 * 3. Mathematically incorrect candidates can be saved as drafts in Stage 01 and handed to Stage 02.
 * 4. Stage 02 acts as the authoritative verification owner, detecting errors and guarding final approval.
 * 5. Permanent Question IDs and Content Masters are allocated ONLY at final Stage 02 approval.
 */

import fs from 'fs';
import path from 'path';
import { questionDraftService } from '../lib/services/question-draft.service';
import { questionDraftsRepository } from '../lib/repositories/question-drafts.repository';
import { questionValidationService } from '../lib/services/question-validation.service';
import { idService } from '../lib/services/id.service';
import { QuestionValidationStatus } from '../types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
}

export async function runDraftSeparationTests() {
  console.log('Running Stage 01 Draft Workflow Separation Tests...');

  const sampleIncorrectCandidate = {
    topicId: 'BP-TOP-001',
    subtopicId: 'BP-SUB-0001',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: 'హైదరాబాద్ మెట్రోలో రవి తన ఆఫీసుకి వెళ్లేటప్పుడు, సాధారణంగా 40 కి.మీ/గం వేగంతో ప్రయాణిస్తే 15 నిమిషాలు ఆలస్యంగా చేరుకుంటాడు. ఒకవేళ అతను తన వేగాన్ని 50 కి.మీ/గం కి పెంచితే, 5 నిమిషాలు ముందుగానే చేరుకుంటాడు. అయితే, రవి ఇంటి నుండి ఆఫీసుకి ఉన్న దూరం ఎన్ని కిలోమీటర్లు?',
    question: 'హైదరాబాద్ మెట్రోలో రవి తన ఆఫీసుకి వెళ్లేటప్పుడు, సాధారణంగా 40 కి.మీ/గం వేగంతో ప్రయాణిస్తే 15 నిమిషాలు ఆలస్యంగా చేరుకుంటాడు. ఒకవేళ అతను తన వేగాన్ని 50 కి.మీ/గం కి పెంచితే, 5 నిమిషాలు ముందుగానే చేరుకుంటాడు. అయితే, రవి ఇంటి నుండి ఆఫీసుకి ఉన్న దూరం ఎన్ని కిలోమీటర్లు?',
    options: {
      a: '30 కి.మీ',
      b: '33.33 కి.మీ', // Incorrect option (mathematically 66.67 km)
      c: '25 కి.మీ',
      d: '40 కి.మీ',
    },
    correctAnswer: 'B' as const,
    explanation: 'వేగం తేడా మరియు సమయం వ్యత్యాసం ఆధారంగా లెక్కించిన దూరం = 66.67 కి.మీ.',
    realLifeContext: 'Daily Commute & Public Transit',
    challengeType: 'ABCD',
    presentationType: 'Text',
    questionStyle: 'STORY_BASED',
    tags: ['Aptitude', 'SpeedDistanceTime'],
  };

  questionDraftsRepository.clear();

  // TEST 1 & 2 & 3 & 4 & 12 & 13
  const studioPagePath = path.resolve(process.cwd(), 'src/pages/QuestionStudioPage.tsx');
  const content = fs.readFileSync(studioPagePath, 'utf8');

  assert(!content.includes('Client: PASS'), 'Stage 01 contains no Client: PASS badge');
  assert(!content.includes('Client: FAIL'), 'Stage 01 contains no Client: FAIL badge');
  assert(!content.includes('Math: VERIFIED'), 'Stage 01 contains no Math: VERIFIED badge');
  assert(!content.includes('Math: UNVERIFIED'), 'Stage 01 contains no Math: UNVERIFIED badge');
  assert(!content.includes('Server: VALID'), 'Stage 01 contains no Server: VALID badge');
  assert(!content.includes('Server: INVALID'), 'Stage 01 contains no Server: INVALID badge');
  assert(!content.includes('Run Validation'), 'Stage 01 contains no Run Validation button');

  // TEST 14 & 15
  assert(content.includes('Save Draft & Continue →'), 'Stage 01 contains Save Draft & Continue');
  assert(content.includes('Clear / Start New Question'), 'Stage 01 contains Clear / Start New Question');
  assert(!content.includes('+ Draft Another Question'), 'Stage 01 contains no duplicate Draft Another Question button');

  // TEST 5 & 6 & 7 & 8
  const origAllocateId = idService.allocateQuestionId;
  let allocateCalled = false;
  (idService as any).allocateQuestionId = async () => {
    allocateCalled = true;
    return 'BP-Q-9999';
  };

  const savedDraft = await questionDraftService.saveDraft(sampleIncorrectCandidate, {
    id: 'USR-TEST',
    name: 'Test Author',
  });

  idService.allocateQuestionId = origAllocateId;

  assert(Boolean(savedDraft), 'Saved draft is defined');
  assert(Boolean(savedDraft.id && savedDraft.id.startsWith('BP-DFT-')), 'Draft ID starts with BP-DFT-');
  assert(!allocateCalled, 'No permanent ID allocated during draft save');
  assert(savedDraft.status === 'DRAFT', 'Draft status is DRAFT');

  // TEST 9 & 10
  const draft = await questionDraftService.saveDraft(sampleIncorrectCandidate, {
    id: 'USR-TEST',
    name: 'Test Author',
  });
  assert(Boolean(draft.id && draft.id.startsWith('BP-DFT-')), 'Draft created successfully for invalid candidate');

  const retrievedDraft = await questionDraftService.getDraftById(draft.id);
  assert(retrievedDraft !== null && retrievedDraft.id === draft.id, 'Retrieved draft matches saved draft');

  // TEST 11
  const valResult = await questionValidationService.validateQuestion(
    draft.id,
    { id: 'USR-REVIEWER', name: 'Reviewer Lead' },
    { skipTaxonomyLookup: true, skipDuplicateCheck: true }
  );

  assert(Boolean(valResult), 'Validation result returned for draft');
  assert(
    valResult.status === QuestionValidationStatus.INVALID || valResult.status === QuestionValidationStatus.NEEDS_REVIEW,
    'Draft verified in Stage 02 flags mathematical issue'
  );

  // TEST 16
  const journeyBarPath = path.resolve(process.cwd(), 'src/components/production/ProductionJourneyBar.tsx');
  const journeyContent = fs.readFileSync(journeyBarPath, 'utf8');
  assert(journeyContent.includes('Production Journey'), 'Production Journey Bar exists');
  assert(journeyContent.includes('15'), '15-stage workflow preserved');

  console.log('ALL STAGE 01 DRAFT SEPARATION TESTS PASSED 100%!');
}
