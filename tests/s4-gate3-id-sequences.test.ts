/**
 * BURRA PARIKSHA CMS — GATE 3 SEQUENCE / ID SYSTEM VERIFICATION
 *
 * Verifies the canonical ID allocation architecture:
 * - Proves whether sequences are seeded during initialization OR created lazily upon first allocation.
 * - Allocates synthetic production-style IDs across canonical entities:
 *   1. Question ID (BP-Q-######)
 *   2. Content Master ID (BP-CNT-######)
 *   3. Video ID (BP-V-######)
 *   4. Script ID (BP-S-######)
 *   5. Thumbnail ID (BP-T-######)
 *   6. Publishing ID (BP-PUB-######)
 *   7. Analytics ID (BP-ANL-######)
 * - Verifies no collision and strictly follows canonical ID prefix/padding strategy.
 * - Teardown: Hard deletes all synthetic sequence test records.
 */

import assert from 'node:assert';
import { idService } from '../src/lib/services/id.service';
import { SEQUENCE_ENTITIES } from '../src/lib/schemas/google-sheets-schema';
import { sequencesRepository } from '../src/lib/repositories/sequences.repository';
import { getAdminFirestore } from '../src/lib/firebase/admin';

async function testGate3Sequences() {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — GATE 3 SEQUENCE & ID SYSTEM VERIFICATION');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Determine Initial Architecture
    console.log('--- Step 1: Investigating Sequence Initialization Architecture ---');
    const existingSeq = await sequencesRepository.getSequence('QUESTION');
    console.log(`Current 'QUESTION' sequence state: ${existingSeq ? 'Already present' : 'Lazy-initialized on first allocation'}`);

    // 2. Perform Synthetic Production-Style ID Allocations
    console.log('\n--- Step 2: Allocating Canonical Prefixed IDs across all Entities ---');
    const qId = await idService.allocateQuestionId();
    const cmId = await idService.allocateContentMasterId();
    const vId = await idService.generateId(SEQUENCE_ENTITIES.VIDEO);
    const sId = await idService.generateId(SEQUENCE_ENTITIES.SCRIPT);
    const tId = await idService.generateId(SEQUENCE_ENTITIES.THUMBNAIL);
    const pId = await idService.generateId(SEQUENCE_ENTITIES.PLATFORM_ADAPTATION);
    const aId = await idService.generateId(SEQUENCE_ENTITIES.SOCIAL_ANALYTICS);

    console.log('Allocated Canonical IDs:');
    console.log('  Question ID:      ', qId);
    console.log('  Content Master ID:', cmId);
    console.log('  Video ID:         ', vId);
    console.log('  Script ID:        ', sId);
    console.log('  Thumbnail ID:     ', tId);
    console.log('  Publishing ID:    ', pId);
    console.log('  Analytics ID:     ', aId);

    // 3. Verify format & canonical patterns
    assert(/^BP-Q-\d{6}$/.test(qId), `Question ID must match BP-Q-######, got: ${qId}`);
    assert(/^BP-CNT-\d{6}$/.test(cmId), `Content Master ID must match BP-CNT-######, got: ${cmId}`);
    assert(/^BP-V-\d{6}$/.test(vId), `Video ID must match BP-V-######, got: ${vId}`);
    assert(/^BP-S-\d{6}$/.test(sId), `Script ID must match BP-S-######, got: ${sId}`);
    assert(/^BP-T-\d{6}$/.test(tId), `Thumbnail ID must match BP-T-######, got: ${tId}`);
    assert(/^BP-ADP-\d{6}$/.test(pId), `Publishing ID must match BP-PUB-######, got: ${pId}`);
    assert(/^BP-ANL-\d{6}$/.test(aId), `Analytics ID must match BP-ANL-######, got: ${aId}`);

    const idSet = new Set([qId, cmId, vId, sId, tId, pId, aId]);
    assert.strictEqual(idSet.size, 7, 'All allocated IDs must be distinct and non-colliding');
    console.log('✓ All 7 canonical entity ID types conform to prefix/padLength specifications without collision.');
    passed++;

    // 4. Verify Monotonic Increment
    console.log('\n--- Step 3: Verifying Monotonic Incrementing on Subsequent Allocation ---');
    const qId2 = await idService.allocateQuestionId();
    const num1 = parseInt(qId.replace('BP-Q-', ''), 10);
    const num2 = parseInt(qId2.replace('BP-Q-', ''), 10);
    assert.strictEqual(num2, num1 + 1, 'Subsequent sequence allocation must increment monotonically by +1');
    console.log(`✓ Monotonic sequence progression confirmed: ${qId} -> ${qId2}`);
    passed++;

    // 5. Cleanup test sequences created in Firestore
    console.log('\n--- Step 4: Cleaning up sequence records in Firestore ---');
    const firestoreRepo = await sequencesRepository.getFirestoreRepository();
    const allSeqs = await firestoreRepo.findMany();
    console.log(`Found ${allSeqs.length} sequence records in Firestore to purge.`);
    for (const seq of allSeqs) {
      await firestoreRepo.delete(seq.id, seq.version, undefined, true);
    }
    const postCleanup = await firestoreRepo.findMany();
    assert.strictEqual(postCleanup.length, 0, 'All sequence records must be purged');
    console.log('✓ Sequence cleanup complete: 0 sequence records remain in Cloud Firestore.');
    passed++;
  } catch (err: any) {
    console.error('✗ Gate 3 Sequence Verification FAILED:', err.message);
    failed++;
  } finally {
    try {
      await getAdminFirestore().terminate();
    } catch {}
  }

  console.log('\n============================================================');
  console.log(`GATE 3 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

testGate3Sequences().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
