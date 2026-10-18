import assert from 'node:assert';
import { assembleQuestionBatch } from '../../../backend/domain/question-generation';

const valid = (text: string) => ({
  content: text,
  option_a: 'One',
  option_b: 'Two',
  option_c: 'Three',
  option_d: 'Four',
  correct_answer: 'A',
  explanation: 'The first option is correct.',
});

const run = () => {
  const complete = assembleQuestionBatch(5, [1, 2, 3, 4, 5].map((n) => valid(`Question ${n}`)));
  assert.equal(complete.batchStatus, 'COMPLETE');
  assert.equal(complete.persistedValidCount, 5);
  assert.equal(complete.rejectedCount, 0);
  assert.deepEqual(complete.slots.map((slot) => slot.slotNumber), [1, 2, 3, 4, 5]);
  assert.equal(new Set(complete.slots.map((slot) => slot.slotId)).size, 5);

  const partial = assembleQuestionBatch(5, [valid('Question 1'), { ...valid('bad'), option_d: '' }]);
  assert.equal(partial.batchStatus, 'PARTIAL');
  assert.equal(partial.persistedValidCount, 1);
  assert.equal(partial.rejectedCount, 1);

  const failed = assembleQuestionBatch(5, [{ ...valid('bad'), option_d: '' }]);
  assert.equal(failed.batchStatus, 'FAILED');
  assert.equal(failed.persistedValidCount, 0);
  assert.equal(failed.rejectedCount, 1);

  const withOverflow = assembleQuestionBatch(5, [1, 2, 3, 4, 5, 6].map((n) => valid(`Question ${n}`)));
  assert.equal(withOverflow.persistedValidCount, 5);
  assert.equal(withOverflow.overflowCount, 1);
  assert.equal(withOverflow.rejectedCount, 0);

  const first = assembleQuestionBatch(5, [valid('Question 1')]);
  const manuallyEdited = { ...first.slots[0], status: 'MANUALLY_EDITED' as const, isManuallyEdited: true, questionText: 'Editor version' };
  const regenerated = assembleQuestionBatch(5, [valid('Replacement'), valid('Question 2')], [manuallyEdited, ...first.slots.slice(1)]);
  assert.equal(regenerated.slots[0].questionText, 'Editor version');
  assert.equal(regenerated.slots[0].slotId, manuallyEdited.slotId);
  assert.equal(regenerated.slots[1].questionText, 'Replacement');

  console.log('S9-T10 BATCH ASSEMBLY TESTS PASSED');
};

run();
