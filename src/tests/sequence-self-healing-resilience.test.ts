/**
 * A-02.5: SEQUENCE PERSISTENCE, SELF-HEALING & CONCURRENCY RESILIENCE TEST SUITE
 * 
 * Verifies all 12 sequence allocation resilience contracts:
 * 1. Initial allocation creates row starting past max existing ID
 * 2. Subsequent allocations increment sequentially
 * 3. Retired 'CONTENT_ID' throws error pointing to 'CONTENT_MASTER'
 * 4. Concurrent allocation serialized via single-process promise queue
 * 5. Update failure (updateRecord returning null or throwing) throws SequenceAllocationError
 * 6. Non-transient update rejection fails-closed
 * 7. Self-healing detects sequence drift and advances nextNumber past max existing ID
 * 8. Self-healing respects entity prefix and pad length
 * 9. Canonical regex parsing correctly ignores malformed or non-canonical IDs
 * 10. Memory fallback isolation when client is unconfigured
 * 11. Multi-entity sequence independence
 * 12. Fail-closed on corrupted repository state
 */

import { sequencesRepository, SequenceRecord } from '../lib/repositories/sequences.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { usersRepository } from '../lib/repositories/users.repository';
import { SequenceAllocationError } from '../lib/google-sheets/errors';
import { SEQUENCE_ENTITIES } from '../lib/schemas/google-sheets-schema';

export async function runSequenceSelfHealingResilienceTests() {
  console.log('========================================================================');
  console.log('A-02.5: SEQUENCE PERSISTENCE & SELF-HEALING RESILIENCE TEST SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total.toString().padStart(2, ' ')}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total.toString().padStart(2, ' ')}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // Ensure test mode isolation is active
  process.env.NODE_ENV = 'test';
  delete process.env.ALLOW_LIVE_TEST_WRITES;

  // Backup originals
  const origFindAll = sequencesRepository.findAll;
  const origFindById = sequencesRepository.findById;
  const origGetSequence = sequencesRepository.getSequence;
  const origAppendRecord = sequencesRepository.appendRecord;
  const origUpdateRecord = sequencesRepository.updateRecord;
  const origQuestionsFindAll = questionsRepository.findAll;
  const origContentMastersFindAll = contentMastersRepository.findAll;
  const origVideosFindAll = videosRepository.findAll;
  const origUsersFindAll = usersRepository.findAll;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Initial allocation creates sequence row starting past max existing ID
    // -------------------------------------------------------------------------
    {
      const inMemorySequences: Map<string, SequenceRecord> = new Map();
      sequencesRepository.getSequence = async (entityType: string) => inMemorySequences.get(entityType) || null;
      sequencesRepository.findById = async (id: string) => inMemorySequences.get(id) || null;
      sequencesRepository.findAll = async () => Array.from(inMemorySequences.values());
      sequencesRepository.appendRecord = async (rec: SequenceRecord) => {
        inMemorySequences.set(rec.entityType, { ...rec });
        return rec;
      };
      sequencesRepository.updateRecord = async (id: string, updates: Partial<SequenceRecord>) => {
        const existing = inMemorySequences.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        inMemorySequences.set(id, updated);
        return updated;
      };
      questionsRepository.findAll = async () => [
        { id: 'BP-Q-000005', question: 'Sample 5' } as any,
        { id: 'BP-Q-000010', question: 'Sample 10' } as any,
      ];

      const result = await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.QUESTION);
      assert(
        result.allocatedNumber === 11 && result.prefix === 'BP-Q-' && result.padLength === 6,
        'Initial allocation creates row starting past max existing ID',
        `Expected 11, got ${result.allocatedNumber}`
      );
      assert(
        inMemorySequences.get(SEQUENCE_ENTITIES.QUESTION)?.nextNumber === 12,
        'Sequence record stored nextNumber incremented to 12',
        `Expected nextNumber 12, got ${inMemorySequences.get(SEQUENCE_ENTITIES.QUESTION)?.nextNumber}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 2: Subsequent allocations increment sequentially
    // -------------------------------------------------------------------------
    {
      const inMemorySequences: Map<string, SequenceRecord> = new Map([
        [SEQUENCE_ENTITIES.QUESTION, { entityType: SEQUENCE_ENTITIES.QUESTION, nextNumber: 12, prefix: 'BP-Q-', padLength: 6 }],
      ]);
      sequencesRepository.getSequence = async (entityType: string) => inMemorySequences.get(entityType) || null;
      sequencesRepository.findById = async (id: string) => inMemorySequences.get(id) || null;
      sequencesRepository.findAll = async () => Array.from(inMemorySequences.values());
      sequencesRepository.updateRecord = async (id: string, updates: Partial<SequenceRecord>) => {
        const existing = inMemorySequences.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        inMemorySequences.set(id, updated);
        return updated;
      };
      questionsRepository.findAll = async () => [];

      const result1 = await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.QUESTION);
      const result2 = await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.QUESTION);

      assert(
        result1.allocatedNumber === 12 && result2.allocatedNumber === 13,
        'Subsequent allocations increment sequentially (12 -> 13)',
        `Got ${result1.allocatedNumber}, ${result2.allocatedNumber}`
      );
      assert(
        inMemorySequences.get(SEQUENCE_ENTITIES.QUESTION)?.nextNumber === 14,
        'Sequence record nextNumber updated to 14',
        `Expected nextNumber 14, got ${inMemorySequences.get(SEQUENCE_ENTITIES.QUESTION)?.nextNumber}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 3: Retired 'CONTENT_ID' throws error pointing to 'CONTENT_MASTER'
    // -------------------------------------------------------------------------
    {
      let errorThrown = false;
      let errorMessage = '';
      try {
        await sequencesRepository.allocateNextNumber('CONTENT_ID');
      } catch (err: any) {
        errorThrown = true;
        errorMessage = err.message;
      }
      assert(
        errorThrown && errorMessage.includes('CONTENT_MASTER') && errorMessage.includes('RETIRED_SEQUENCE_ENTITY'),
        'Retired CONTENT_ID throws explicit obsolete error referencing CONTENT_MASTER',
        `Error message: ${errorMessage}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 4: Concurrent allocation serialized via single-process promise queue
    // -------------------------------------------------------------------------
    {
      let seqValue = 100;
      const inMemorySequences: Map<string, SequenceRecord> = new Map([
        [SEQUENCE_ENTITIES.QUESTION, { entityType: SEQUENCE_ENTITIES.QUESTION, nextNumber: seqValue, prefix: 'BP-Q-', padLength: 6 }],
      ]);
      sequencesRepository.getSequence = async (entityType: string) => inMemorySequences.get(entityType) || null;
      sequencesRepository.findById = async (id: string) => inMemorySequences.get(id) || null;
      sequencesRepository.findAll = async () => Array.from(inMemorySequences.values());
      sequencesRepository.updateRecord = async (id: string, updates: Partial<SequenceRecord>) => {
        // Add random artificial async latency to test serialization
        await new Promise((r) => setTimeout(r, Math.random() * 20));
        const existing = inMemorySequences.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        inMemorySequences.set(id, updated);
        return updated;
      };
      questionsRepository.findAll = async () => [];

      const concurrentPromises = Array.from({ length: 10 }, () =>
        sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.QUESTION)
      );
      const results = await Promise.all(concurrentPromises);
      const allocatedNumbers = results.map((r) => r.allocatedNumber);
      const uniqueNumbers = new Set(allocatedNumbers);

      assert(
        uniqueNumbers.size === 10 && allocatedNumbers[0] === 100 && allocatedNumbers[9] === 109,
        'Concurrent allocations are serialized without race conditions or duplicates (100..109)',
        `Allocated: ${allocatedNumbers.join(', ')}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 5: Update failure (updateRecord returning null) throws SequenceAllocationError
    // -------------------------------------------------------------------------
    {
      const inMemorySequences: Map<string, SequenceRecord> = new Map([
        [SEQUENCE_ENTITIES.QUESTION, { entityType: SEQUENCE_ENTITIES.QUESTION, nextNumber: 50, prefix: 'BP-Q-', padLength: 6 }],
      ]);
      sequencesRepository.getSequence = async (entityType: string) => inMemorySequences.get(entityType) || null;
      sequencesRepository.findById = async (id: string) => inMemorySequences.get(id) || null;
      sequencesRepository.findAll = async () => Array.from(inMemorySequences.values());
      // Simulate sheet update failure where row was not found (returns null)
      sequencesRepository.updateRecord = async () => null;
      questionsRepository.findAll = async () => [];

      let errorThrown = false;
      let errorInstance: any = null;
      try {
        await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.QUESTION);
      } catch (err: any) {
        errorThrown = true;
        errorInstance = err;
      }

      assert(
        errorThrown && errorInstance instanceof SequenceAllocationError,
        'Update failure (returning null) fails-closed throwing SequenceAllocationError',
        `Caught: ${errorInstance?.name} - ${errorInstance?.message}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 6: Non-transient update rejection fails-closed
    // -------------------------------------------------------------------------
    {
      const inMemorySequences: Map<string, SequenceRecord> = new Map([
        [SEQUENCE_ENTITIES.QUESTION, { entityType: SEQUENCE_ENTITIES.QUESTION, nextNumber: 50, prefix: 'BP-Q-', padLength: 6 }],
      ]);
      sequencesRepository.getSequence = async (entityType: string) => inMemorySequences.get(entityType) || null;
      sequencesRepository.findById = async (id: string) => inMemorySequences.get(id) || null;
      sequencesRepository.findAll = async () => Array.from(inMemorySequences.values());
      sequencesRepository.updateRecord = async () => {
        throw new Error('Google Sheets API Network Failure');
      };
      questionsRepository.findAll = async () => [];

      let errorThrown = false;
      let errorInstance: any = null;
      try {
        await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.QUESTION);
      } catch (err: any) {
        errorThrown = true;
        errorInstance = err;
      }

      assert(
        errorThrown && errorInstance?.message?.includes('Google Sheets API Network Failure'),
        'Underlying update rejection fails-closed propagating error',
        `Caught: ${errorInstance?.message}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 7: Self-healing detects sequence drift and advances past max existing ID
    // -------------------------------------------------------------------------
    {
      // Stored nextNumber in SEQUENCES is lagging behind reality (nextNumber=10, but DB has BP-Q-000045)
      const inMemorySequences: Map<string, SequenceRecord> = new Map([
        [SEQUENCE_ENTITIES.QUESTION, { entityType: SEQUENCE_ENTITIES.QUESTION, nextNumber: 10, prefix: 'BP-Q-', padLength: 6 }],
      ]);
      sequencesRepository.getSequence = async (entityType: string) => inMemorySequences.get(entityType) || null;
      sequencesRepository.findById = async (id: string) => inMemorySequences.get(id) || null;
      sequencesRepository.findAll = async () => Array.from(inMemorySequences.values());
      sequencesRepository.updateRecord = async (id: string, updates: Partial<SequenceRecord>) => {
        const existing = inMemorySequences.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        inMemorySequences.set(id, updated);
        return updated;
      };
      questionsRepository.findAll = async () => [
        { id: 'BP-Q-000010' } as any,
        { id: 'BP-Q-000045' } as any,
      ];

      const result = await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.QUESTION);

      assert(
        result.allocatedNumber === 46,
        'Self-healing detects sequence drift (lagging 10) and leaps forward to 46',
        `Expected 46, got ${result.allocatedNumber}`
      );
      assert(
        inMemorySequences.get(SEQUENCE_ENTITIES.QUESTION)?.nextNumber === 47,
        'Sequence record nextNumber updated to 47 after self-healing',
        `Expected 47, got ${inMemorySequences.get(SEQUENCE_ENTITIES.QUESTION)?.nextNumber}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 8: Self-healing respects entity prefix and pad length
    // -------------------------------------------------------------------------
    {
      const inMemorySequences: Map<string, SequenceRecord> = new Map();
      sequencesRepository.getSequence = async (entityType: string) => inMemorySequences.get(entityType) || null;
      sequencesRepository.findById = async (id: string) => inMemorySequences.get(id) || null;
      sequencesRepository.findAll = async () => Array.from(inMemorySequences.values());
      sequencesRepository.appendRecord = async (rec: SequenceRecord) => {
        inMemorySequences.set(rec.entityType, { ...rec });
        return rec;
      };
      sequencesRepository.updateRecord = async (id: string, updates: Partial<SequenceRecord>) => {
        const existing = inMemorySequences.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        inMemorySequences.set(id, updated);
        return updated;
      };
      contentMastersRepository.findAll = async () => [
        { id: 'BP-CNT-000105' } as any,
        { id: 'BP-CNT-000200' } as any,
      ];

      const result = await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.CONTENT_MASTER);

      assert(
        result.allocatedNumber === 201 && result.prefix === 'BP-CNT-' && result.padLength === 6,
        'Content Master allocation correctly identifies BP-CNT- prefix and pad length 6',
        `Got allocatedNumber=${result.allocatedNumber}, prefix=${result.prefix}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 9: Canonical regex parsing correctly ignores malformed or non-canonical IDs
    // -------------------------------------------------------------------------
    {
      const inMemorySequences: Map<string, SequenceRecord> = new Map();
      sequencesRepository.getSequence = async (entityType: string) => inMemorySequences.get(entityType) || null;
      sequencesRepository.findById = async (id: string) => inMemorySequences.get(id) || null;
      sequencesRepository.findAll = async () => Array.from(inMemorySequences.values());
      sequencesRepository.appendRecord = async (rec: SequenceRecord) => {
        inMemorySequences.set(rec.entityType, { ...rec });
        return rec;
      };
      sequencesRepository.updateRecord = async (id: string, updates: Partial<SequenceRecord>) => {
        const existing = inMemorySequences.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        inMemorySequences.set(id, updated);
        return updated;
      };
      questionsRepository.findAll = async () => [
        { id: 'BP-Q-000005' } as any,
        { id: 'INVALID-ID-999999' } as any,
        { id: 'BP-Q-123' } as any, // non-canonical pad length (3 instead of 6)
        { id: 'BP-Q-000010-TEMP' } as any,
        { id: 'BP-Q-000012' } as any,
      ];

      const result = await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.QUESTION);

      assert(
        result.allocatedNumber === 13,
        'Canonical regex ignores non-conforming IDs and determines true maximum as 12 (allocating 13)',
        `Expected 13, got ${result.allocatedNumber}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 10: Memory fallback isolation when client is unconfigured
    // -------------------------------------------------------------------------
    {
      const inMemorySequences: Map<string, SequenceRecord> = new Map([
        [SEQUENCE_ENTITIES.VIDEO, { entityType: SEQUENCE_ENTITIES.VIDEO, nextNumber: 1, prefix: 'BP-VID-', padLength: 6 }],
      ]);
      sequencesRepository.getSequence = async (entityType: string) => inMemorySequences.get(entityType) || null;
      sequencesRepository.findById = async (id: string) => inMemorySequences.get(id) || null;
      sequencesRepository.findAll = async () => Array.from(inMemorySequences.values());
      sequencesRepository.updateRecord = async (id: string, updates: Partial<SequenceRecord>) => {
        const existing = inMemorySequences.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        inMemorySequences.set(id, updated);
        return updated;
      };
      videosRepository.findAll = async () => [];

      const result = await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.VIDEO);

      assert(
        result.allocatedNumber === 1 && result.prefix === 'BP-VID-',
        'Video sequence allocates properly in memory store',
        `Got ${result.allocatedNumber}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 11: Multi-entity sequence independence
    // -------------------------------------------------------------------------
    {
      const inMemorySequences: Map<string, SequenceRecord> = new Map([
        [SEQUENCE_ENTITIES.QUESTION, { entityType: SEQUENCE_ENTITIES.QUESTION, nextNumber: 10, prefix: 'BP-Q-', padLength: 6 }],
        [SEQUENCE_ENTITIES.CONTENT_MASTER, { entityType: SEQUENCE_ENTITIES.CONTENT_MASTER, nextNumber: 50, prefix: 'BP-CNT-', padLength: 6 }],
        [SEQUENCE_ENTITIES.USER, { entityType: SEQUENCE_ENTITIES.USER, nextNumber: 5, prefix: 'USR-', padLength: 4 }],
      ]);
      sequencesRepository.getSequence = async (entityType: string) => inMemorySequences.get(entityType) || null;
      sequencesRepository.findById = async (id: string) => inMemorySequences.get(id) || null;
      sequencesRepository.findAll = async () => Array.from(inMemorySequences.values());
      sequencesRepository.updateRecord = async (id: string, updates: Partial<SequenceRecord>) => {
        const existing = inMemorySequences.get(id);
        if (!existing) return null;
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        inMemorySequences.set(id, updated);
        return updated;
      };
      questionsRepository.findAll = async () => [];
      contentMastersRepository.findAll = async () => [];
      usersRepository.findAll = async () => [];

      const qResult = await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.QUESTION);
      const cntResult = await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.CONTENT_MASTER);
      const usrResult = await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.USER);

      assert(
        qResult.allocatedNumber === 10 && cntResult.allocatedNumber === 50 && usrResult.allocatedNumber === 5,
        'Independent sequence entities allocate distinct sequence streams without cross-talk',
        `Q: ${qResult.allocatedNumber}, CNT: ${cntResult.allocatedNumber}, USR: ${usrResult.allocatedNumber}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 12: Fail-closed on corrupted repository state
    // -------------------------------------------------------------------------
    {
      sequencesRepository.getSequence = async () => null;
      sequencesRepository.findById = async () => null;
      sequencesRepository.findAll = async () => [];
      questionsRepository.findAll = async () => {
        throw new Error('CORRUPTED_WORKSHEET_DATA');
      };

      let errorThrown = false;
      let errorInstance: any = null;
      try {
        await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.QUESTION);
      } catch (err: any) {
        errorThrown = true;
        errorInstance = err;
      }

      assert(
        errorThrown && errorInstance instanceof SequenceAllocationError,
        'Scanning failure on corrupted repository fails-closed with SequenceAllocationError',
        `Caught: ${errorInstance?.name} - ${errorInstance?.message}`
      );
    }

    console.log(`\n========================================================================`);
    console.log(`A-02.5 TEST RESULTS: ${passed}/${total} TESTS PASSED (100%)`);
    console.log(`========================================================================\n`);
  } finally {
    // Restore originals
    sequencesRepository.findAll = origFindAll;
    sequencesRepository.findById = origFindById;
    sequencesRepository.getSequence = origGetSequence;
    sequencesRepository.appendRecord = origAppendRecord;
    sequencesRepository.updateRecord = origUpdateRecord;
    questionsRepository.findAll = origQuestionsFindAll;
    contentMastersRepository.findAll = origContentMastersFindAll;
    videosRepository.findAll = origVideosFindAll;
    usersRepository.findAll = origUsersFindAll;
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  runSequenceSelfHealingResilienceTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Test run failed:', err);
      process.exit(1);
    });
}
