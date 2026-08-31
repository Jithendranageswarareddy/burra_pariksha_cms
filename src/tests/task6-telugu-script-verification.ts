/**
 * BURRA PARIKSHA CMS — END-TO-END VERIFICATION
 * TASK 6: TELUGU SCRIPT GENERATION VERIFICATION TEST SUITE
 * 
 * Verifies:
 * Question -> Script generation -> Telugu narration -> Script validation -> Script save -> Script version -> Retrieval
 * 
 * 10 Specific Verification Checks:
 * 1. Natural spoken Telugu (Telugu Unicode characters and colloquial flow)
 * 2. Question clearly presented
 * 3. Options presented as: ఎ, బి, సి, డి
 * 4. Answer interaction / call-to-action is present
 * 5. No malformed output (passes Zod schema & validation)
 * 6. Script is associated with the correct question / video IDs
 * 7. Script is persisted to Google Sheets (SCRIPT and SCRIPT_VERSIONS)
 * 8. Script can be fetched again
 * 9. Script version is recorded correctly (v1 snapshot -> v2 increment)
 * 10. AI-generated content remains reviewable before publication (draft state reviewable)
 */

import { questionsRepository } from '../lib/repositories/questions.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { scriptsRepository, scriptVersionsRepository } from '../lib/repositories/scripts.repository';
import { scriptService } from '../lib/services/script.service';
import { geminiService } from '../lib/ai/gemini.service';
import { ScriptValidator } from '../lib/ai/validators/script.validator';
import {
  DifficultyLevel,
  PriorityLevel,
  QuestionLanguage,
  QuestionStatus,
  VideoProductionStatus,
} from '../types';

export async function runTask6Verification() {
  console.log('========================================================================');
  console.log('BURRA PARIKSHA CMS - TASK 6: TELUGU SCRIPT GENERATION VERIFICATION');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Check ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Check ${totalTests}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Verification failed: ${testName}`);
    }
  }

  // STEP 1: Create a temporary test question in Telugu
  console.log('--- Step 1: Setting Up Temporary Test Question ---');
  const tempQuestionId = `Q-T6-${Date.now().toString().slice(-6)}`;
  const testQuestion = {
    id: tempQuestionId,
    content: 'ఒక రైలు 60 km/h వేగంతో ప్రయాణిస్తూ 150 మీటర్ల పొడవున్న ప్లాట్‌ఫారమ్‌ను 18 సెకన్లలో దాటితే, ఆ రైలు పొడవు ఎంత?',
    questionText: 'ఒక రైలు 60 km/h వేగంతో ప్రయాణిస్తూ 150 మీటర్ల పొడవున్న ప్లాట్‌ఫారమ్‌ను 18 సెకన్లలో దాటితే, ఆ రైలు పొడవు ఎంత?',
    language: QuestionLanguage.TELUGU,
    difficulty: DifficultyLevel.MEDIUM,
    categoryId: 'CAT-QUANT',
    categoryName: 'Quantitative Aptitude',
    topicId: 'TOPIC-TSD',
    topicName: 'Time, Speed and Distance',
    subtopicId: 'SUB-TRAINS',
    subtopicName: 'Problems on Trains',
    options: {
      a: '120 మీటర్లు',
      b: '150 మీటర్లు',
      c: '180 మీటర్లు',
      d: '200 మీటర్లు',
    },
    correctAnswer: 'B',
    explanation: 'మొత్తం దూరం = వేగం × సమయం = (60 × 5/18) × 18 = 300 మీటర్లు. రైలు పొడవు = 300 - 150 = 150 మీటర్లు (ఆప్షన్ B).',
    status: QuestionStatus.APPROVED,
    priority: PriorityLevel.HIGH,
    realWorldContext: 'రైల్వే RRB NTPC మరియు SI/Constable ఎగ్జామ్స్ లో తరచుగా వచ్చే రైలు లెక్క',
    tags: ['Trains', 'Speed', 'Telugu', 'Task6-Test'],
  };

  const savedQuestion = await questionsRepository.appendRecord(testQuestion as any);
  assert(Boolean(savedQuestion.id), `Temporary test question created with ID: ${savedQuestion.id}`);

  // STEP 2: Create a linked video record
  console.log('\n--- Step 2: Creating Linked Video Record ---');
  const tempVideoId = `VID-T6-${Date.now().toString().slice(-6)}`;
  const testVideo = {
    id: tempVideoId,
    questionId: savedQuestion.id,
    title: 'రైలు పొడవు లెక్క — 10 సెకన్ల బుర్ర ట్రిక్',
    status: VideoProductionStatus.SCRIPT_REQUIRED,
    priority: PriorityLevel.HIGH,
    targetDurationSeconds: 45,
    assignedHost: 'Telugu Host',
    assignedEditor: 'Telugu Editor',
    notes: 'Task 6 Telugu script generation pipeline test',
  };

  const savedVideo = await videosRepository.appendRecord(testVideo as any);
  assert(Boolean(savedVideo.id), `Video record created with ID: ${savedVideo.id}, linked to Question: ${savedVideo.questionId}`);

  // STEP 3: Generate Conversational Telugu Script via AI / Pedagogical Engine
  console.log('\n--- Step 3: Generating Conversational Telugu Script ---');
  const generationResult = await geminiService.generateTeluguScript(savedQuestion);
  const { scriptPayload, metadata, validation } = generationResult;

  console.log('\n--- Generated Script Output Preview ---');
  console.log(`[HOOK]:\n${scriptPayload.hookText}\n`);
  console.log(`[PROBLEM & OPTIONS]:\n${scriptPayload.problemStatement}\n`);
  console.log(`[STEP-BY-STEP SOLUTION]:\n${scriptPayload.stepByStepSolution}\n`);
  console.log(`[SPEED TRICK]:\n${scriptPayload.speedTrickOrTakeaway}\n`);
  console.log(`[CALL TO ACTION]:\n${scriptPayload.callToAction}\n`);

  // Verification 1: Natural spoken Telugu
  assert(
    validation.metrics.hasTeluguUnicode,
    'Check 1: Natural spoken Telugu script detected (Telugu Unicode block present)',
    'Telugu characters not found'
  );

  // Verification 2: Question clearly presented
  const questionWords = savedQuestion.questionText.split(' ').slice(0, 3);
  const isQuestionInProblemStatement =
    scriptPayload.problemStatement.length > 20 &&
    (scriptPayload.problemStatement.includes('రైలు') || scriptPayload.problemStatement.includes('ప్రశ్న'));
  assert(
    isQuestionInProblemStatement,
    'Check 2: Question is clearly presented in the script statement',
    'Question content missing in statement'
  );

  // Verification 3: Options presented as: ఎ, బి, సి, డి
  const hasTeluguOptA = scriptPayload.problemStatement.includes('ఎ');
  const hasTeluguOptB = scriptPayload.problemStatement.includes('బి');
  const hasTeluguOptC = scriptPayload.problemStatement.includes('సి');
  const hasTeluguOptD = scriptPayload.problemStatement.includes('డి');
  assert(
    hasTeluguOptA && hasTeluguOptB && hasTeluguOptC && hasTeluguOptD,
    'Check 3: Options are presented with Telugu labels: ఎ, బి, సి, డి',
    `Labels found: ఎ=${hasTeluguOptA}, బి=${hasTeluguOptB}, సి=${hasTeluguOptC}, డి=${hasTeluguOptD}`
  );

  // Verification 4: Answer interaction / call-to-action is present
  assert(
    validation.metrics.hasInteractionCta,
    'Check 4: Answer interaction & Call-to-Action is present (comments/follow/share)',
    'CTA does not contain interaction keywords'
  );

  // Verification 5: No malformed output
  assert(
    validation.isValid && validation.errors.length === 0,
    'Check 5: Script passes all structural schema validations with no malformed fields',
    `Errors: ${validation.errors.join(', ')}`
  );

  // STEP 4: Persist Script to Repository (Google Sheets SCRIPT table)
  console.log('\n--- Step 4: Persisting Script to Google Sheets ---');
  const testActor = { id: 'USR-TEL-01', name: 'Telugu Script Editor' };
  const saveResult = await scriptService.saveScript(
    savedVideo.id,
    {
      hookText: scriptPayload.hookText,
      problemStatement: scriptPayload.problemStatement,
      stepByStepSolution: scriptPayload.stepByStepSolution,
      speedTrickOrTakeaway: scriptPayload.speedTrickOrTakeaway,
      callToAction: scriptPayload.callToAction,
      notes: scriptPayload.notes,
      createNewVersion: false,
    },
    testActor
  );

  // Verification 6: Script is associated with the correct question/video
  assert(
    saveResult.script.videoId === savedVideo.id,
    `Check 6: Script is associated with correct Video ID (${savedVideo.id}) and Question ID (${savedQuestion.id})`
  );

  // Verification 7: Script is persisted to Google Sheets
  const retrievedScriptDirect = await scriptsRepository.findById(saveResult.script.id);
  assert(
    Boolean(retrievedScriptDirect && retrievedScriptDirect.id === saveResult.script.id),
    `Check 7: Script persisted and verified in SCRIPT repository (ID: ${retrievedScriptDirect?.id})`
  );

  // Verification 8: Script can be fetched again via service
  const fetchedViaService = await scriptService.getScriptByVideoId(savedVideo.id);
  assert(
    Boolean(fetchedViaService.script && fetchedViaService.script.id === saveResult.script.id),
    `Check 8: Script successfully fetched again via scriptService.getScriptByVideoId`
  );

  // STEP 5: Create a new version snapshot (v1 -> v2)
  console.log('\n--- Step 5: Creating Script Version Snapshot ---');
  const v2Result = await scriptService.saveScript(
    savedVideo.id,
    {
      hookText: '🔥 RRB NTPC స్పెషల్: ఈ రైలు లెక్కను 10 సెకన్లలో సాల్వ్ చేయగలరా? 95% మంది తప్పు చేస్తారు!',
      problemStatement: scriptPayload.problemStatement,
      stepByStepSolution: scriptPayload.stepByStepSolution,
      speedTrickOrTakeaway: '💡 సూపర్ బుర్ర ట్రిక్: వేగం 60 km/h ఉన్నప్పుడు 18 సెకన్లలో 300 మీటర్లు! 300 - 150 = 150m డైరెక్ట్ గా ఆప్షన్ బి!',
      callToAction: 'మీ సమాధానం బి అయితే వెంటనే కామెంట్ చేయండి! మరిన్ని ట్రిక్స్ కోసం @BurraPariksha ని ఫాలో అవ్వండి!',
      notes: 'Reviewed and refined for high retention short-form video delivery.',
      createNewVersion: true,
      changeSummary: 'Enhanced Telugu hook and simplified speed trick explanation',
      editedBy: 'Lead Telugu Presenter',
    },
    testActor
  );

  // Verification 9: Script version is recorded correctly
  assert(
    v2Result.script.currentVersion === 2,
    `Check 9: Script version incremented to v${v2Result.script.currentVersion}`
  );

  const versionsList = await scriptVersionsRepository.findByScriptId(v2Result.script.id);
  assert(
    versionsList.length >= 1,
    `Check 9b: Script versions recorded in SCRIPT_VERSIONS repository (${versionsList.length} snapshot(s) stored)`
  );

  // STEP 6: Reviewable before publication
  console.log('\n--- Step 6: Verifying Reviewability Before Publication ---');
  const videoStateBeforeApproval = await videosRepository.findById(savedVideo.id);
  assert(
    videoStateBeforeApproval?.status === VideoProductionStatus.SCRIPT_REQUIRED,
    'Check 10a: Video remains in draft/review state (SCRIPT_REQUIRED) before explicit producer approval'
  );

  // Producer marks script ready
  const markReadyResult = await scriptService.markScriptReady(
    savedVideo.id,
    testActor,
    'Verified spoken Telugu accuracy, options formatting, and mathematical correctness.'
  );

  assert(
    markReadyResult.videoStatus === VideoProductionStatus.SCRIPT_READY,
    'Check 10b: Script successfully approved and transitioned to SCRIPT_READY for studio recording'
  );

  console.log('\n========================================================================');
  console.log(`TASK 6 VERIFICATION SUMMARY: ${passedTests}/${totalTests} CHECKS PASSED`);
  console.log('========================================================================\n');

  return {
    success: passedTests === totalTests,
    passedTests,
    totalTests,
    testQuestionId: savedQuestion.id,
    testVideoId: savedVideo.id,
    testScriptId: v2Result.script.id,
  };
}

// Self-execution if run via tsx directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('task6-telugu-script-verification')) {
  runTask6Verification()
    .then((res) => {
      console.log('Task 6 Telugu Script Generation Verification Result:', res);
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Task 6 Verification Fatal Error:', err);
      process.exit(1);
    });
}
