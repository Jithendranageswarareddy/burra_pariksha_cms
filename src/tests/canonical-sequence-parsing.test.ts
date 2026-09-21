/**
 * CANONICAL SEQUENCE PARSING REGRESSION TEST SUITE (A-02.1)
 * 
 * Verifies strict canonical-format validation for sequence max calculations.
 * Ensures noncanonical IDs (test fixtures, wrong prefixes, incorrect padding)
 * never influence canonical sequence maximums or cause sequence contamination.
 */

import { sequencesRepository } from '../lib/repositories/sequences.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { topicsRepository } from '../lib/repositories/topics.repository';
import { subtopicsRepository } from '../lib/repositories/subtopics.repository';
import { usersRepository } from '../lib/repositories/users.repository';
import { SEQUENCE_ENTITIES } from '../lib/schemas/google-sheets-schema';

async function runTests() {
  console.log('====================================================');
  console.log('A-02.1: CANONICAL SEQUENCE PARSING REGRESSION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // Backup original findAll methods to ensure complete isolation
  const origQuestionsFindAll = questionsRepository.findAll;
  const origContentMastersFindAll = contentMastersRepository.findAll;
  const origTopicsFindAll = topicsRepository.findAll;
  const origSubtopicsFindAll = subtopicsRepository.findAll;
  const origUsersFindAll = usersRepository.findAll;
  const origGetSequence = sequencesRepository.getSequence;

  try {
    // -------------------------------------------------------------
    // Test A: Valid canonical ID: BP-Q-000003 -> contributes 3
    // -------------------------------------------------------------
    questionsRepository.findAll = async () => [
      { id: 'BP-Q-000003' } as any
    ];
    const maxA = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    assert(maxA === 3, 'Test A - Single canonical ID (BP-Q-000003) contributes 3', `Expected 3, got ${maxA}`);

    // -------------------------------------------------------------
    // Test B: Multiple canonical IDs: BP-Q-000001, BP-Q-000003 -> max = 3
    // -------------------------------------------------------------
    questionsRepository.findAll = async () => [
      { id: 'BP-Q-000001' } as any,
      { id: 'BP-Q-000003' } as any,
    ];
    const maxB = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    assert(maxB === 3, 'Test B - Multiple canonical IDs (BP-Q-000001, BP-Q-000003) returns max 3', `Expected 3, got ${maxB}`);

    // -------------------------------------------------------------
    // Test C: Noncanonical TEST ID: TEST-P09-Q-1789891450880 -> contributes nothing
    // -------------------------------------------------------------
    questionsRepository.findAll = async () => [
      { id: 'TEST-P09-Q-1789891450880' } as any
    ];
    const maxC = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    assert(maxC === 0, 'Test C - Noncanonical test ID (TEST-P09-Q-1789891450880) contributes nothing (0)', `Expected 0, got ${maxC}`);

    // -------------------------------------------------------------
    // Test D: Wrong prefix: BP-CNT-999999 while evaluating QUESTION -> contributes nothing
    // -------------------------------------------------------------
    questionsRepository.findAll = async () => [
      { id: 'BP-CNT-999999' } as any
    ];
    const maxD = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    assert(maxD === 0, 'Test D - Wrong prefix ID (BP-CNT-999999) while evaluating QUESTION contributes 0', `Expected 0, got ${maxD}`);

    // -------------------------------------------------------------
    // Test E: Wrong digit length: BP-Q-123 -> contributes nothing
    // -------------------------------------------------------------
    questionsRepository.findAll = async () => [
      { id: 'BP-Q-123' } as any
    ];
    const maxE = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    assert(maxE === 0, 'Test E - Short digit length ID (BP-Q-123, 3 digits instead of 6) contributes 0', `Expected 0, got ${maxE}`);

    // -------------------------------------------------------------
    // Test F: Wrong digit length: BP-Q-1234567 -> contributes nothing
    // -------------------------------------------------------------
    questionsRepository.findAll = async () => [
      { id: 'BP-Q-1234567' } as any
    ];
    const maxF = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    assert(maxF === 0, 'Test F - Long digit length ID (BP-Q-1234567, 7 digits instead of 6) contributes 0', `Expected 0, got ${maxF}`);

    // -------------------------------------------------------------
    // Test G: Mixed records: BP-Q-000003, TEST-P09-Q-1789891450880, BP-CNT-999999, random-888888 -> QUESTION max must remain 3
    // -------------------------------------------------------------
    questionsRepository.findAll = async () => [
      { id: 'BP-Q-000003' } as any,
      { id: 'TEST-P09-Q-1789891450880' } as any,
      { id: 'BP-CNT-999999' } as any,
      { id: 'random-888888' } as any,
      { id: 'TEST-QUESTION-999999' } as any,
    ];
    const maxG = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    assert(maxG === 3, 'Test G - Mixed valid and invalid records strictly isolates QUESTION max to 3', `Expected 3, got ${maxG}`);

    // -------------------------------------------------------------
    // Test H: Empty sheet -> max must remain 0
    // -------------------------------------------------------------
    questionsRepository.findAll = async () => [];
    const maxH = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    assert(maxH === 0, 'Test H - Empty sheet returns 0', `Expected 0, got ${maxH}`);

    // -------------------------------------------------------------
    // Test I: Entity-specific validation:
    // CONTENT_MASTER must accept BP-CNT-675486 but reject BP-Q-000003
    // -------------------------------------------------------------
    contentMastersRepository.findAll = async () => [
      { id: 'BP-CNT-675486' } as any,
      { id: 'BP-Q-000003' } as any,
      { id: 'random-123456' } as any,
    ];
    const maxI = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.CONTENT_MASTER);
    assert(maxI === 675486, 'Test I - CONTENT_MASTER accepts BP-CNT-675486 and rejects BP-Q-000003 (max 675486)', `Expected 675486, got ${maxI}`);

    // -------------------------------------------------------------
    // Test J: Taxonomy strict parsing:
    // TOPICS rejects TP-MATH, TP-SCIENCE
    // SUBTOPICS rejects STP-ALGEBRA, STP-PHYSICS
    // -------------------------------------------------------------
    topicsRepository.findAll = async () => [
      { id: 'BP-TOP-001' } as any,
      { id: 'BP-TOP-108' } as any,
      { id: 'TP-MATH' } as any,
      { id: 'TP-SCIENCE' } as any,
    ];
    // Sequence record with padLength = 3 as in live SEQUENCES sheet
    sequencesRepository.getSequence = async (entity: string) => {
      if (entity === SEQUENCE_ENTITIES.TOPIC) {
        return { entityType: entity, nextNumber: 109, prefix: 'BP-TOP-', padLength: 3 };
      }
      if (entity === SEQUENCE_ENTITIES.SUBTOPIC) {
        return { entityType: entity, nextNumber: 109, prefix: 'BP-SUB-', padLength: 4 };
      }
      return origGetSequence.call(sequencesRepository, entity);
    };

    const maxTopic = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.TOPIC);
    assert(maxTopic === 108, 'Test J1 - TOPIC rejects TP-MATH / TP-SCIENCE and resolves max 108', `Expected 108, got ${maxTopic}`);

    subtopicsRepository.findAll = async () => [
      { id: 'BP-SUB-0001' } as any,
      { id: 'BP-SUB-0108' } as any,
      { id: 'STP-ALGEBRA' } as any,
      { id: 'STP-PHYSICS' } as any,
    ];
    const maxSubtopic = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.SUBTOPIC);
    assert(maxSubtopic === 108, 'Test J2 - SUBTOPIC rejects STP-ALGEBRA / STP-PHYSICS and resolves max 108', `Expected 108, got ${maxSubtopic}`);

    // -------------------------------------------------------------
    // Test K: USER entity isolation:
    // Rejects USR-1234 (4 digits) when configured for padLength 3
    // -------------------------------------------------------------
    usersRepository.findAll = async () => [
      { id: 'USR-001' } as any,
      { id: 'USR-002' } as any,
      { id: 'USR-1234' } as any, // 4-digit timestamp slice
      { id: 'BP-Q-000003' } as any,
    ];
    const maxUser = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.USER);
    assert(maxUser === 2, 'Test K - USER sequence rejects USR-1234 (4 digits) and resolves max 2', `Expected 2, got ${maxUser}`);

    // =============================================================
    // CRITICAL SAFETY TEST:
    // Explicitly prove that TEST-P09-Q-1789891450880 CANNOT cause
    // BP-Q-1789891450881 to be allocated!
    // =============================================================
    console.log('\n--- CRITICAL SAFETY VERIFICATION ---');

    questionsRepository.findAll = async () => [
      { id: 'BP-Q-000003' } as any,
      { id: 'TEST-P09-Q-1789891450880' } as any,
    ];

    // Simulate sequence record at next_number = 4 (as in live production)
    sequencesRepository.getSequence = async (entity: string) => {
      if (entity === SEQUENCE_ENTITIES.QUESTION) {
        return {
          entityType: entity,
          nextNumber: 4,
          prefix: 'BP-Q-',
          padLength: 6,
        };
      }
      return origGetSequence.call(sequencesRepository, entity);
    };

    // Calculate max existing ID with the contaminant present
    const detectedMaxId = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    assert(
      detectedMaxId === 3,
      'Safety Gate 1: Contaminant TEST-P09-Q-1789891450880 is ignored; detectedMaxId is 3 (NOT 1789891450880)',
      `Detected max was ${detectedMaxId}`
    );

    // Simulate allocation self-healing calculation:
    // In performAllocation:
    // let currentNumber = sequence.nextNumber; // 4
    // if (currentNumber <= maxExistingId) { currentNumber = maxExistingId + 1; }
    // const allocatedNumber = currentNumber; // 4
    // nextNumber = currentNumber + 1; // 5
    const sequenceRecord = await sequencesRepository.getSequence(SEQUENCE_ENTITIES.QUESTION);
    let currentNumber = Number(sequenceRecord?.nextNumber) || 1;
    if (currentNumber <= detectedMaxId) {
      currentNumber = detectedMaxId + 1;
    }
    const allocatedNumber = currentNumber;
    const formattedId = `BP-Q-${String(allocatedNumber).padStart(6, '0')}`;

    assert(
      allocatedNumber === 4,
      'Safety Gate 2: Allocated sequence number is 4 (NOT 1789891450881)',
      `Allocated number was ${allocatedNumber}`
    );
    assert(
      formattedId === 'BP-Q-000004',
      'Safety Gate 3: Generated ID is BP-Q-000004 (NEVER BP-Q-1789891450881)',
      `Generated ID was ${formattedId}`
    );
    assert(
      formattedId !== 'BP-Q-1789891450881',
      'Safety Gate 4: Explicit proof: BP-Q-1789891450881 was NOT generated',
      'Contaminant caused inflated allocation!'
    );

    console.log('\n====================================================');
    console.log(`ALL ${passed}/${total} CANONICAL PARSING TESTS PASSED SUCCESSFULLY!`);
    console.log('====================================================\n');

  } finally {
    // Restore all mocked methods
    questionsRepository.findAll = origQuestionsFindAll;
    contentMastersRepository.findAll = origContentMastersFindAll;
    topicsRepository.findAll = origTopicsFindAll;
    subtopicsRepository.findAll = origSubtopicsFindAll;
    usersRepository.findAll = origUsersFindAll;
    sequencesRepository.getSequence = origGetSequence;
  }
}

runTests().catch((err) => {
  console.error('[FATAL ERROR] Test suite aborted:', err);
  process.exit(1);
});
