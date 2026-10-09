/**
 * BURRA PARIKSHA CMS — Synthetic Verification Test Fixtures
 *
 * Strict Guardrails for Automated Testing:
 * 1. Zero realistic academic or real-world subject content (no Physics, Thermodynamics, Biology, etc.)
 * 2. Mandatory unambiguous test metadata flags:
 *    - testOnly: true
 *    - environment: 'TEST'
 * 3. Clearly synthetic, non-production taxonomy markers:
 *    - Category: 'TEST'
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
