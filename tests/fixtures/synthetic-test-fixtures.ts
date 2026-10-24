/**
 * BURRA PARIKSHA CMS — Synthetic Verification Test Fixtures
 *
 * Strict Guardrails for Automated Testing:
 * 1. Zero realistic academic or real-world subject content (no Physics, Thermodynamics, Biology, etc.)
 * 2. Mandatory unambiguous test metadata flags:
 *    - testOnly: true
 *    - environment: 'TEST'
 * 3. Clearly synthetic, non-production taxonomy markers:
 *    - Topic: 'TEST_TOPIC'
 *    - Subtopic: 'TEST_SUBTOPIC'
 * 4. Synthetic, distinguishable identifiers with prefix:
 *    - BP-TEST-Q-*
 *    - BP-TEST-CNT-*
 *    - BP-TEST-DFT-*
 *    - BP-TEST-S-*
 *    - BP-TEST-V-*
 *    - BP-TEST-T-*
 *    - BP-TEST-PUB-*
 *    - BP-TEST-ANL-*
 *    - BP-TEST-WFL-*
 */

export const SYNTHETIC_TEST_MARKERS = {
  testOnly: true as const,
  environment: 'TEST' as const,
  category: 'TEST',
  topic: 'TEST_TOPIC',
  subtopic: 'TEST_SUBTOPIC',
};

export function createSyntheticQuestionPayload(uniqueTag: string | number = Date.now()) {
  return {
    question: `TEST QUESTION — Firestore persistence verification (${uniqueTag})`,
    category: 'TEST',
    topic: 'TEST_TOPIC',
    subtopic: 'TEST_SUBTOPIC',
    difficulty: 1,
    testOnly: true,
    environment: 'TEST',
    testExecutionId: `TEST-RUN-${uniqueTag}`,
  };
}

/**
 * Builds neutral LearningUnit input for emulator tests. The unique tag keeps
 * concurrent runs distinguishable without depending on pre-seeded datastore data.
 */
export function createSyntheticLearningUnitPayload(uniqueTag: string | number = Date.now()) {
  return {
    topicId: `top_test_${uniqueTag}`,
    topicName: 'TEST_TOPIC',
    subtopicId: `sub_test_${uniqueTag}`,
    subtopicName: 'TEST_SUBTOPIC',
    title: `[SYNTHETIC TEST] Learning unit ${uniqueTag}`,
    learningObjective: `Synthetic objective for emulator isolation run ${uniqueTag}.`,
    prerequisiteSkills: ['TEST_PREREQUISITE'],
    verifiedMethod: `Synthetic verification method for run ${uniqueTag}.`,
    correctCalculations: `Synthetic calculation evidence for run ${uniqueTag}.`,
    commonMistakes: ['TEST_MISTAKE'],
    realLifeApplications: ['TEST_APPLICATION'],
    realLifeScenario: `Synthetic scenario for run ${uniqueTag}.`,
    skillLevel: 'BEGINNER' as const,
    audienceContext: 'HOUSEHOLDS' as const,
    editorialPillar: 'PILLAR_A' as const,
    suggestedModes: ['TOPIC_INTRODUCTION', 'WORKED_EXAMPLES', 'QUESTION_CHALLENGE_SHORT'] as const,
    primaryFormat: 'VIDEO' as const,
    authorId: `usr_test_${uniqueTag}`,
    authorName: 'Synthetic Test Author',
  };
}
