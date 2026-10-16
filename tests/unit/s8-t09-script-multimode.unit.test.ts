/**
 * BURRA PARIKSHA CMS — S8-T09 Unit Test Suite
 * Stage 03 Multi-Mode Audience Script Support
 * 
 * Verifies all mandatory requirements of S8-T09:
 * 1. Mode 1 — QUESTION_CHALLENGE_SHORT: Hook, Question Presentation, Options/Countdown, Engagement CTA.
 * 2. Mode 2 — TOPIC_INTRODUCTION: Hook/Overview, Core Theory/Definition, Real-Life Application, Next-Steps CTA.
 * 3. Mode 3 — EXPLAINED_QUESTIONS_VIDEO: Introductory Overview, practice question blocks for every question with speed-trick callouts, Closing CTA.
 * 4. Starter Draft Proposal Hydration: getScriptByVideoId generates mode-tailored starter templates from linked Question entities.
 * 5. Authored Content Preservation Across Reloads: Authored script content is never overwritten when page reloads or mode is re-evaluated.
 * 6. Immutable Historical Version Snapshots: SCRIPT_VERSIONS persists complete multi-mode JSON snapshots.
 */

import assert from 'node:assert';
import { scriptService } from '../../backend/features/production/services/script.service';
import { videosRepository } from '../../database/firestore/repositories/videos.repository';
import { questionsRepository } from '../../database/firestore/repositories/questions.repository';
import { scriptsRepository, scriptVersionsRepository } from '../../database/firestore/repositories/scripts.repository';
import {
  canonicalIdService,
  VideoProductionStatus,
  PriorityLevel,
  QuestionStatus,
  DifficultyLevel,
  UserRole,
  ScriptContentPayload,
  Mode3QuestionBlock,
} from '../../shared';

const adminActor = {
  id: 'USR-ADMIN-01',
  name: 'Admin Content Lead',
  role: UserRole.ADMIN,
};

async function runS8T09UnitTests() {
  console.log('========================================================================');
  console.log('RUNNING S8-T09 UNIT TESTS: Stage 03 Multi-Mode Audience Script Support');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // TEST 1: Mode 1 (QUESTION_CHALLENGE_SHORT) Script Template & Persistence
  // -------------------------------------------------------------------------
  console.log('[Test 1] Mode 1 (QUESTION_CHALLENGE_SHORT): Hook, Question, Options/Countdown, CTA');

  const mode1QuestionId = canonicalIdService.generateQuestionId();
  const mode1VideoId = canonicalIdService.generateVideoId();

  await questionsRepository.appendRecord({
    id: mode1QuestionId,
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    questionText: '10 మీటర్ల పొడవు గల రైలు 54 కిమీ/గం వేగంతో స్తంభాన్ని దాటడానికి పట్టే సమయం ఎంత?',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    status: QuestionStatus.APPROVED,
    difficulty: DifficultyLevel.MEDIUM,
    explanation: 'కాలం = దూరం / వేగం = 10 / (54 * 5/18) = 10 / 15 = 2/3 సెకన్లు.',
    shortcutTe: 'వేగాన్ని 5/18 తో గుణించి నేరుగా భాగించండి.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  await videosRepository.appendRecord({
    id: mode1VideoId,
    questionId: mode1QuestionId,
    title: 'రైలు లెక్కలు — 5 సెకన్ల ట్రిక్',
    status: VideoProductionStatus.SCRIPT_REQUIRED,
    priority: PriorityLevel.HIGH,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  const mode1Payload: ScriptContentPayload = {
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    scriptFormat: 'VIRAL_CHALLENGE',
    hookText: '🔥 ఈ క్వశ్చన్ ని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్!',
    problemStatement: '10 మీటర్ల పొడవు గల రైలు 54 కిమీ/గం వేగంతో స్తంభాన్ని దాటడానికి పట్టే సమయం ఎంత?',
    stepByStepSolution: 'Option A: 2/3 sec\nOption B: 1 sec\nOption C: 1.5 sec\nOption D: 2 sec',
    speedTrickOrTakeaway: 'బుర్ర ట్రిక్: 54 * (5/18) = 15 m/s. నేరుగా 10/15 వేయండి.',
    callToAction: 'మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది.',
  };

  const { script: savedMode1Script } = await scriptService.saveScript(mode1VideoId, mode1Payload, adminActor);

  assert.ok(savedMode1Script.id.startsWith('scr_'), 'Mode 1 script must have canonical scr_ UUID');
  assert.strictEqual(savedMode1Script.productionMode, 'QUESTION_CHALLENGE_SHORT', 'Mode 1 productionMode must be preserved');
  assert.strictEqual(savedMode1Script.hookText, mode1Payload.hookText, 'Mode 1 Hook must be preserved');
  assert.strictEqual(savedMode1Script.problemStatement, mode1Payload.problemStatement, 'Mode 1 Question presentation preserved');
  assert.strictEqual(savedMode1Script.stepByStepSolution, mode1Payload.stepByStepSolution, 'Mode 1 Options delivery preserved');
  assert.strictEqual(savedMode1Script.callToAction, mode1Payload.callToAction, 'Mode 1 Engagement CTA preserved');
  assert.strictEqual(savedMode1Script.currentVersion, 1, 'Initial version must be 1');
  console.log('  PASS: Mode 1 script structure persisted cleanly with 4-part short format.');

  // -------------------------------------------------------------------------
  // TEST 2: Mode 2 (TOPIC_INTRODUCTION) Script Template & Persistence
  // -------------------------------------------------------------------------
  console.log('\n[Test 2] Mode 2 (TOPIC_INTRODUCTION): Hook/Overview, Core Theory, Real-Life App, Next-Steps CTA');

  const mode2QuestionId = canonicalIdService.generateQuestionId();
  const mode2VideoId = canonicalIdService.generateVideoId();

  await questionsRepository.appendRecord({
    id: mode2QuestionId,
    topicId: 'TOP-QA-02',
    subtopicId: 'SUB-02',
    conceptTitle: 'వయసు సమస్యలు — త్రికాల సూత్రం',
    introductoryConcept: 'ఈ విభాగంలో మనం వయసు లెక్కలను సమీకరణాలు లేకుండా, కేవలం నిష్పత్తుల వ్యత్యాసం పద్ధతితో ఎలా సాధించవచ్చో నేర్చుకుందాం.',
    syllabusScopeNotes: 'APPSC Group 2 & TSPSC పరీక్షల్లో తరచుగా అడిగే నిష్పత్తుల సూత్రాలు.',
    realLifeContext: 'కుటుంబ సభ్యుల వయస్సు పోలిక',
    productionMode: 'TOPIC_INTRODUCTION',
    status: QuestionStatus.APPROVED,
    difficulty: DifficultyLevel.MEDIUM,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  await videosRepository.appendRecord({
    id: mode2VideoId,
    questionId: mode2QuestionId,
    title: 'వయసు సమస్యలు కాన్సెప్ట్ ఇంట్రడక్షన్',
    status: VideoProductionStatus.SCRIPT_REQUIRED,
    priority: PriorityLevel.NORMAL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  const mode2Payload: ScriptContentPayload = {
    productionMode: 'TOPIC_INTRODUCTION',
    hookText: '🔥 వయసు సమస్యలు — త్రికాల సూత్రం: కాన్సెప్ట్ క్లియర్‌గా అర్థం చేసుకుందాం!',
    coreTheory: 'వయస్సు లెక్కల్లో వర్తమానం, భూతకాలం, భవిష్యత్తు కాలాల నిష్పత్తుల వ్యత్యాసం ఎల్లప్పుడూ స్థిరంగా ఉంటుంది.',
    problemStatement: 'వయస్సు లెక్కల్లో వర్తమానం, భూతకాలం, భవిష్యత్తు కాలాల నిష్పత్తుల వ్యత్యాసం ఎల్లప్పుడూ స్థిరంగా ఉంటుంది.',
    realLifeApplication: 'APPSC/TSPSC పరీక్షల్లో అడిగే 90% వయసు లెక్కలను x, y సమీకరణాలు లేకుండా 15 సెకన్లలో సాల్వ్ చేయవచ్చు.',
    stepByStepSolution: 'APPSC/TSPSC పరీక్షల్లో అడిగే 90% వయసు లెక్కలను x, y సమీకరణాలు లేకుండా 15 సెకన్లలో సాల్వ్ చేయవచ్చు.',
    speedTrickOrTakeaway: 'బుర్ర ట్రిక్: వర్తమానం, భూతకాలం, భవిష్యత్తు వ్యత్యాసం స్థిర సూత్రం.',
    callToAction: 'కాన్సెప్ట్ అర్థమైతే లైక్ చేయండి! తర్వాతి వీడియోలో ఈ టాపిక్ పై మోస్ట్ ఇంపార్టెంట్ ప్రాక్టీస్ ప్రశ్నలను సాల్వ్ చేద్దాం.',
    notes: 'Use diagram visual overlay on whiteboard at 45s mark.',
  };

  const { script: savedMode2Script } = await scriptService.saveScript(mode2VideoId, mode2Payload, adminActor);

  assert.ok(savedMode2Script.id.startsWith('scr_'), 'Mode 2 script must have canonical scr_ UUID');
  assert.strictEqual(savedMode2Script.productionMode, 'TOPIC_INTRODUCTION', 'Mode 2 productionMode must be preserved');
  assert.strictEqual(savedMode2Script.hookText, mode2Payload.hookText, 'Mode 2 Hook/Overview preserved');
  assert.strictEqual(savedMode2Script.coreTheory, mode2Payload.coreTheory, 'Mode 2 Core Theory/Definition preserved');
  assert.strictEqual(savedMode2Script.realLifeApplication, mode2Payload.realLifeApplication, 'Mode 2 Real-Life Application preserved');
  assert.strictEqual(savedMode2Script.callToAction, mode2Payload.callToAction, 'Mode 2 Next-Steps CTA preserved');
  console.log('  PASS: Mode 2 script structure persisted with Core Theory, Real-Life Application, and Next-Steps CTA.');

  // -------------------------------------------------------------------------
  // TEST 3: Mode 3 (EXPLAINED_QUESTIONS_VIDEO) Script Template & Persistence
  // -------------------------------------------------------------------------
  console.log('\n[Test 3] Mode 3 (EXPLAINED_QUESTIONS_VIDEO): Introductory Overview + Script Blocks for Every Practice Question');

  const mode3QuestionId = canonicalIdService.generateQuestionId();
  const mode3VideoId = canonicalIdService.generateVideoId();

  const mode3PracticeBlocks: Mode3QuestionBlock[] = [
    {
      questionNumber: 1,
      questionText: 'రైలు ఒక స్థిరమైన స్తంభాన్ని దాటడానికి పట్టే సమయం 12 సెకన్లు అయితే, వేగం ఎంత?',
      optionsText: 'Option A: 45 km/h\nOption B: 54 km/h\nOption C: 60 km/h\nOption D: 72 km/h',
      stepByStepSolution: 'దూరం = 180 మీటర్లు. వేగం = 180 / 12 = 15 m/s = 15 * 18/5 = 54 km/h.',
      speedTrickOrTakeaway: '15 m/s అంటే 54 km/h (18 యొక్క 3 రెట్లు).',
    },
    {
      questionNumber: 2,
      questionText: 'రెండు రైళ్లు వ్యతిరేక దిశల్లో ప్రయాణిస్తున్నప్పుడు వాటి సాపేక్ష వేగం ఎంత?',
      optionsText: 'Option A: s1 + s2\nOption B: s1 - s2\nOption C: s1 * s2\nOption D: s1 / s2',
      stepByStepSolution: 'వ్యతిరేక దిశల్లో ప్రయాణించినప్పుడు వేగాలు కలుస్తాయి: Relative Speed = S1 + S2.',
      speedTrickOrTakeaway: 'వ్యతిరేక దిశ = సంకలనం (+), ఒకే దిశ = వ్యవకలనం (-).',
    },
    {
      questionNumber: 3,
      questionText: '200 మీటర్ల పొడవు గల రైలు 300 మీటర్ల ప్లాట్‌ఫారమ్‌ను దాటడానికి మొత్తం దూరం ఎంత?',
      optionsText: 'Option A: 200m\nOption B: 300m\nOption C: 500m\nOption D: 100m',
      stepByStepSolution: 'మొత్తం దూరం = రైలు పొడవు + ప్లాట్‌ఫారమ్ పొడవు = 200 + 300 = 500 మీటర్లు.',
      speedTrickOrTakeaway: 'ప్లాట్‌ఫారమ్‌కు పొడవు ఉంటుంది కాబట్టి రైలు పొడవుతో తప్పనిసరిగా కలపాలి.',
    },
  ];

  await questionsRepository.appendRecord({
    id: mode3QuestionId,
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    conceptTitle: 'రైళ్ల సమస్యలు సంపూర్ణ మాస్టర్‌క్లాస్',
    introductoryConcept: 'ఈ వీడియోలో మనం రైలు సమస్యల నుండి అత్యంత కీలకమైన ప్రశ్నలను స్టెప్-బై-స్టెప్ షార్ట్‌కట్లతో సాధిస్తాం.',
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    status: QuestionStatus.APPROVED,
    difficulty: DifficultyLevel.HARD,
    questions: mode3PracticeBlocks.map((b) => ({
      questionNumber: b.questionNumber,
      questionText: b.questionText,
      explanation: b.stepByStepSolution,
      trickOrPitfall: b.speedTrickOrTakeaway,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  await videosRepository.appendRecord({
    id: mode3VideoId,
    questionId: mode3QuestionId,
    title: 'రైళ్ల సమస్యలు సంపూర్ణ మాస్టర్‌క్లాస్ — 3 ముఖ్యమైన ప్రశ్నలు',
    status: VideoProductionStatus.SCRIPT_REQUIRED,
    priority: PriorityLevel.HIGH,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  const mode3Payload: ScriptContentPayload = {
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    introOverview: 'ఈ వీడియోలో మనం రైలు సమస్యల నుండి 3 కీలకమైన ప్రశ్నలను స్టెప్-బై-స్టెప్ షార్ట్‌కట్లతో సాధిస్తాం.',
    hookText: 'ఈ వీడియోలో మనం రైలు సమస్యల నుండి 3 కీలకమైన ప్రశ్నలను స్టెప్-బై-స్టెప్ షార్ట్‌కట్లతో సాధిస్తాం.',
    questionBlocks: mode3PracticeBlocks,
    problemStatement: mode3PracticeBlocks.map((b) => `Q${b.questionNumber}: ${b.questionText}`).join('\n\n'),
    stepByStepSolution: mode3PracticeBlocks.map((b) => `Q${b.questionNumber} Sol: ${b.stepByStepSolution}`).join('\n\n'),
    speedTrickOrTakeaway: mode3PracticeBlocks.map((b) => `Q${b.questionNumber} Trick: ${b.speedTrickOrTakeaway}`).join('\n'),
    callToAction: 'ఈ ప్రశ్నలన్నీ పరీక్షల్లో ఎంతో ముఖ్యం! మరిన్ని మాస్టర్‌క్లాస్ వీడియోల కోసం Burra Pariksha ఛానెల్ ని Follow చేయండి!',
    notes: 'Switch to split-screen graphics during Question 2 relative speed proof.',
  };

  const { script: savedMode3Script } = await scriptService.saveScript(mode3VideoId, mode3Payload, adminActor);

  assert.ok(savedMode3Script.id.startsWith('scr_'), 'Mode 3 script must have canonical scr_ UUID');
  assert.strictEqual(savedMode3Script.productionMode, 'EXPLAINED_QUESTIONS_VIDEO', 'Mode 3 productionMode must be preserved');
  assert.strictEqual(savedMode3Script.introOverview, mode3Payload.introOverview, 'Mode 3 Introductory Overview preserved');
  assert.ok(Array.isArray(savedMode3Script.questionBlocks), 'Mode 3 questionBlocks must be an array');
  assert.strictEqual(savedMode3Script.questionBlocks?.length, 3, 'Must persist all 3 question script blocks');
  assert.strictEqual(savedMode3Script.questionBlocks[0].questionNumber, 1, 'Question 1 number preserved');
  assert.strictEqual(savedMode3Script.questionBlocks[0].speedTrickOrTakeaway, mode3PracticeBlocks[0].speedTrickOrTakeaway, 'Question 1 speed-trick callout preserved');
  assert.strictEqual(savedMode3Script.questionBlocks[1].questionNumber, 2, 'Question 2 number preserved');
  assert.strictEqual(savedMode3Script.questionBlocks[2].questionNumber, 3, 'Question 3 number preserved');
  assert.strictEqual(savedMode3Script.callToAction, mode3Payload.callToAction, 'Mode 3 Outro CTA preserved');
  console.log('  PASS: Mode 3 script structure persisted with Intro Roadmap, all practice question blocks, and speed tricks.');

  // -------------------------------------------------------------------------
  // TEST 4: Authored Content Preservation Across Reloads (Reload Guard)
  // -------------------------------------------------------------------------
  console.log('\n[Test 4] Authored Content Preservation: Reloading Script Does NOT Overwrite Edits');

  // Modify Mode 2 script with custom presenter revisions
  const modifiedHook = '🔥 [REVISED] వయసు సమస్యలు — త్రికాల సూత్రం సంపూర్ణ విశ్లేషణ!';
  const modifiedTheory = 'ఇది ప్రెజెంటర్ స్వయంగా సవరించిన ప్రత్యేక సిద్ధాంత వివరణ.';

  const { script: updatedMode2Script } = await scriptService.saveScript(
    mode2VideoId,
    {
      ...mode2Payload,
      hookText: modifiedHook,
      coreTheory: modifiedTheory,
      problemStatement: modifiedTheory,
    },
    adminActor
  );

  assert.strictEqual(updatedMode2Script.hookText, modifiedHook, 'Updated hook must be persisted');
  assert.strictEqual(updatedMode2Script.coreTheory, modifiedTheory, 'Updated core theory must be persisted');

  // Re-fetch script via getScriptByVideoId
  const reloaded = await scriptService.getScriptByVideoId(mode2VideoId);
  assert.ok(reloaded.script, 'Reloaded script must exist in Firestore');
  assert.strictEqual(reloaded.script.hookText, modifiedHook, 'Authored hook edit must NOT be overwritten on reload');
  assert.strictEqual(reloaded.script.coreTheory, modifiedTheory, 'Authored core theory edit must NOT be overwritten on reload');
  assert.strictEqual(reloaded.script.productionMode, 'TOPIC_INTRODUCTION', 'Production mode must be preserved');
  console.log('  PASS: Authored script edits preserved across reload without being overwritten by defaults.');

  // -------------------------------------------------------------------------
  // TEST 5: Starter Draft Proposal Hydration for Mode 2 & Mode 3
  // -------------------------------------------------------------------------
  console.log('\n[Test 5] Starter Draft Proposal: Tailored initialization from linked Question for Mode 2 and Mode 3');

  // Video with Mode 2 Question but NO existing script
  const freshMode2Vid = canonicalIdService.generateVideoId();
  await videosRepository.appendRecord({
    id: freshMode2Vid,
    questionId: mode2QuestionId,
    title: 'Fresh Mode 2 Video',
    status: VideoProductionStatus.SCRIPT_REQUIRED,
    priority: PriorityLevel.NORMAL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  const mode2Proposal = await scriptService.getScriptByVideoId(freshMode2Vid);
  assert.strictEqual(mode2Proposal.script, null, 'Must have no existing script');
  assert.ok(mode2Proposal.draftProposal, 'Must return draft proposal tailored for Mode 2');
  assert.strictEqual(mode2Proposal.draftProposal.productionMode, 'TOPIC_INTRODUCTION', 'Proposal must identify Mode 2');
  assert.ok(mode2Proposal.draftProposal.coreTheory?.includes('త్రికాల సూత్రం') || mode2Proposal.draftProposal.coreTheory?.includes('నిష్పత్తుల వ్యత్యాసం'), 'Proposal core theory must draw from question introductoryConcept');
  console.log('  PASS: Mode 2 draft proposal automatically hydrated from linked Question introductoryConcept.');

  // Video with Mode 3 Question but NO existing script
  const freshMode3Vid = canonicalIdService.generateVideoId();
  await videosRepository.appendRecord({
    id: freshMode3Vid,
    questionId: mode3QuestionId,
    title: 'Fresh Mode 3 Video',
    status: VideoProductionStatus.SCRIPT_REQUIRED,
    priority: PriorityLevel.HIGH,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  const mode3Proposal = await scriptService.getScriptByVideoId(freshMode3Vid);
  assert.strictEqual(mode3Proposal.script, null, 'Must have no existing script');
  assert.ok(mode3Proposal.draftProposal, 'Must return draft proposal tailored for Mode 3');
  assert.strictEqual(mode3Proposal.draftProposal.productionMode, 'EXPLAINED_QUESTIONS_VIDEO', 'Proposal must identify Mode 3');
  assert.ok(Array.isArray(mode3Proposal.draftProposal.questionBlocks), 'Proposal must contain question blocks array');
  assert.strictEqual(mode3Proposal.draftProposal.questionBlocks?.length, 3, 'Proposal must map all practice questions from question set');
  console.log('  PASS: Mode 3 draft proposal automatically hydrated with all practice question blocks.');

  // -------------------------------------------------------------------------
  // TEST 6: Immutable Historical Version Snapshots
  // -------------------------------------------------------------------------
  console.log('\n[Test 6] Immutable Version History: Version snapshot captures complete multi-mode JSON');

  const { script: v2Script, version: v2Version } = await scriptService.saveScript(
    mode3VideoId,
    {
      ...mode3Payload,
      createNewVersion: true,
      changeSummary: 'Added speed trick optimization to Question 1',
    },
    adminActor
  );

  assert.strictEqual(v2Script.currentVersion, 2, 'Version number must increment to 2');
  assert.ok(v2Version, 'Version record must be created');
  assert.strictEqual(v2Version.versionNumber, 2, 'Version snapshot must record version 2');
  assert.ok(v2Version.contentJson, 'Version snapshot must contain full contentJson');
  assert.strictEqual(v2Version.contentJson.productionMode, 'EXPLAINED_QUESTIONS_VIDEO', 'Version snapshot preserves production mode');
  assert.strictEqual(v2Version.contentJson.questionBlocks?.length, 3, 'Version snapshot preserves all question blocks');

  const allVersions = await scriptService.getScriptVersions(v2Script.id);
  assert.strictEqual(allVersions.length, 2, 'Script must have exactly 2 versions in history');
  console.log('  PASS: Immutable version snapshot accurately records multi-mode script payload.');

  console.log('\n========================================================================');
  console.log('ALL S8-T09 UNIT TESTS PASSED SUCCESSFULLY! (6/6 Verification Suites)');
  console.log('========================================================================\n');
}

runS8T09UnitTests().catch((err) => {
  console.error('\nFAILED: S8-T09 Unit Tests encountered an error:', err);
  process.exit(1);
});
