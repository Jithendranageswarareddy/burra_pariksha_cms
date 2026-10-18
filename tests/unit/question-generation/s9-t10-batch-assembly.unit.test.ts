import assert from 'node:assert';
import { assembleQuestionBatch, recalculateQuestionBatchState } from '../../../shared';

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
  assert.equal(complete.inMemoryValidCount, 5);
  assert.equal(complete.persistedValidCount, null);
  assert.equal(complete.rejectedCount, 0);
  assert.deepEqual(complete.slots.map((slot) => slot.slotNumber), [1, 2, 3, 4, 5]);
  assert.equal(new Set(complete.slots.map((slot) => slot.slotId)).size, 5);

  const partial = assembleQuestionBatch(5, [valid('Question 1'), { ...valid('bad'), option_d: '' }]);
  assert.equal(partial.batchStatus, 'PARTIAL');
  assert.equal(partial.inMemoryValidCount, 1);
  assert.equal(partial.persistedValidCount, null);
  assert.equal(partial.rejectedCount, 1);

  const failed = assembleQuestionBatch(5, [{ ...valid('bad'), option_d: '' }]);
  assert.equal(failed.batchStatus, 'FAILED');
  assert.equal(failed.inMemoryValidCount, 0);
  assert.equal(failed.rejectedCount, 1);

  const withOverflow = assembleQuestionBatch(5, [1, 2, 3, 4, 5, 6].map((n) => valid(`Question ${n}`)));
  assert.equal(withOverflow.inMemoryValidCount, 5);
  assert.equal(withOverflow.overflowCount, 1);
  assert.equal(withOverflow.rejectedCount, 0);

  const first = assembleQuestionBatch(5, [valid('Question 1')]);
  const manuallyEdited = { ...first.slots[0], status: 'MANUALLY_EDITED' as const, isManuallyEdited: true, questionText: 'Editor version' };
  const regenerated = assembleQuestionBatch(5, [valid('Replacement'), valid('Question 2')], [manuallyEdited, ...first.slots.slice(1)]);
  assert.equal(regenerated.slots[0].questionText, 'Editor version');
  assert.equal(regenerated.slots[0].slotId, manuallyEdited.slotId);
  assert.equal(regenerated.slots[1].questionText, 'Replacement');
  const accumulated = assembleQuestionBatch(5, [valid('Question 3')], regenerated.slots);
  assert.equal(accumulated.slots[0].questionText, 'Editor version');
  assert.equal(accumulated.slots[1].questionText, 'Replacement');
  assert.equal(accumulated.slots[2].questionText, 'Question 2');
  assert.equal(accumulated.slots[3].questionText, 'Question 3');
  assert.equal(accumulated.slots[0].slotId, manuallyEdited.slotId);
  assert.equal(accumulated.inMemoryValidCount, 4);
  const persisted = recalculateQuestionBatchState(
    5,
    accumulated.slots,
    accumulated.rejectedItems,
    accumulated.overflowCount
  );
  assert.equal(persisted.persistedValidCount, 4);
  assert.equal(persisted.batchStatus, 'PARTIAL');

  console.log('S9-T10 BATCH ASSEMBLY TESTS PASSED');
};

run();
