import { questionService } from '../lib/services/question.service';
import { questionsRepository } from '../lib/repositories/questions.repository';

async function runDuplicateCheckRegression() {
  console.log('=== STARTING QUESTION STUDIO DUPLICATE-CHECK REGRESSION TESTS ===');
  let failures = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      failures++;
    }
  }

  // Mock repositories.findAll() to return a controlled list of existing questions
  const originalFindAll = questionsRepository.findAll;
  const mockExistingQuestions = [
    {
      id: 'BP-Q-1001',
      questionText: 'ఒక రైలు గంటకు 60 కిమీ వేగంతో ప్రయాణిస్తే 120 కిమీ దూరం వెళ్ళడానికి పట్టే సమయం ఎంత?',
      categoryName: 'Aptitude',
      topicName: 'Speed & Distance',
      status: 'APPROVED',
      videoStatus: 'COMPLETED',
    },
    {
      id: 'BP-Q-1002',
      questionText: 'ఒక వర్తకుడు ఒక వస్తువును 500 రూపాయలకు కొని 10% లాభంతో అమ్మినచో అమ్మకపు వెల ఎంత?',
      categoryName: 'Arithmetic',
      topicName: 'Profit & Loss',
      status: 'DRAFT',
      videoStatus: 'PENDING',
    }
  ];

  questionsRepository.findAll = async () => mockExistingQuestions as any;

  try {
    // Test Case 1: Successful check with zero matches
    const zeroMatches = await questionService.detectDuplicates('ఈ ప్రశ్న చాలా భిన్నమైనది మరియు ఎలాంటి సరిపోలికను కలిగి లేదు.');
    assert(
      zeroMatches.length === 0,
      'Test 1: Successful check with zero matches returns empty list'
    );

    // Test Case 2: Successful check with duplicate matches (high similarity / exact)
    const exactMatches = await questionService.detectDuplicates('ఒక రైలు గంటకు 60 కిమీ వేగంతో ప్రయాణిస్తే 120 కిమీ దూరం వెళ్ళడానికి పట్టే సమయం ఎంత?');
    assert(
      exactMatches.length > 0,
      'Test 2a: Successful check with exact duplicate match returns matches'
    );
    assert(
      exactMatches[0].isExact === true && exactMatches[0].similarity === 1.0,
      'Test 2b: Exact duplicate match similarity is correctly rated as 1.0 and isExact is true'
    );

    // Test Case 3: Correct response-field rendering verification
    // Verify that the DuplicateMatch properties match the exact contract returned by detectDuplicates
    const matched = exactMatches[0];
    const hasCorrectKeys = 'questionId' in matched &&
                           'questionText' in matched &&
                           'categoryName' in matched &&
                           'topicName' in matched &&
                           'status' in matched &&
                           'videoStatus' in matched &&
                           'similarity' in matched &&
                           'isExact' in matched;
    assert(
      hasCorrectKeys,
      'Test 3: Match fields comply exactly with backend-to-frontend DuplicateMatch contract keys'
    );

    // Test Case 4: API failure / robustness check (with empty or invalid inputs)
    const emptyMatches = await questionService.detectDuplicates('');
    assert(
      emptyMatches.length === 0,
      'Test 4a: Empty question input safely returns 0 matches'
    );

    const shortMatches = await questionService.detectDuplicates('స్వల్పం');
    assert(
      shortMatches.length === 0,
      'Test 4b: Very short question input (< 5 chars) is safely ignored'
    );

  } catch (err: any) {
    console.error('Unexpected error during duplicate check regression:', err);
    failures++;
  } finally {
    // Restore repository
    questionsRepository.findAll = originalFindAll;
  }

  console.log(`=== DUPLICATE REGRESSION SUMMARY: ${failures === 0 ? 'ALL PASSED' : failures + ' FAILED'} ===`);
  if (failures > 0) {
    process.exit(1);
  }
}

runDuplicateCheckRegression().catch((err) => {
  console.error('Fatal error in regression suite:', err);
  process.exit(1);
});
