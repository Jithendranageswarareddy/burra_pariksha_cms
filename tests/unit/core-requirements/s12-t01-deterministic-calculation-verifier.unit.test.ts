import assert from 'node:assert/strict';
import {
  verifyDeterministicCalculation,
} from '../../../backend/ai/validators/deterministic-calculation-verifier';

function run(): void {
  const valid = verifyDeterministicCalculation({
    operation: 'PERCENT_OF',
    operands: [350, 20],
    claimedResult: 70,
    steps: ['Multiply the base by the percentage.', 'Divide by 100.'],
    requiredStepCount: 2,
  });
  assert.equal(valid.status, 'VERIFIED');
  assert.equal(valid.expectedResult, 70);

  const incorrect = verifyDeterministicCalculation({
    operation: 'MULTIPLY',
    operands: [0.1, 0.2],
    claimedResult: 0.3,
  });
  assert.equal(incorrect.status, 'FAILED');
  assert.equal(incorrect.expectedResult, 0.020000000000000004);

  const incomplete = verifyDeterministicCalculation({
    operation: 'DIVIDE',
    operands: [200, 20],
    claimedResult: 10,
    steps: ['Divide distance by speed.'],
    requiredStepCount: 2,
  });
  assert.equal(incomplete.status, 'FAILED');
  assert.match(incomplete.issues[0], /incomplete/i);

  const ambiguous = verifyDeterministicCalculation({
    operation: 'ADD',
    operands: [2, 2],
    claimedResult: 4,
    options: [4, 4, 5, 6],
  });
  assert.equal(ambiguous.status, 'NEEDS_REVIEW');
  assert.equal(ambiguous.matchedOptionIndexes.length, 2);

  const topicIntroduction = verifyDeterministicCalculation({
    operation: 'ADD',
    operands: [],
    claimedResult: 0,
    contentMode: 'TOPIC_INTRODUCTION',
  });
  assert.equal(topicIntroduction.status, 'NOT_APPLICABLE');

  const repeatA = verifyDeterministicCalculation({
    operation: 'PERCENT_CHANGE',
    operands: [80, 100],
    claimedResult: 25,
  });
  const repeatB = verifyDeterministicCalculation({
    operation: 'PERCENT_CHANGE',
    operands: [80, 100],
    claimedResult: 25,
  });
  assert.deepEqual(repeatA, repeatB);
  console.log('S12-T01 deterministic calculation verification tests passed (6 cases).');
}

run();
