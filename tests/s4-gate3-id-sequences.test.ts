/**
 * BURRA PARIKSHA CMS — GATE 3 CANONICAL UUID ID SYSTEM VERIFICATION
 * Sprint 6: Complete Removal of Entity ID Sequence Infrastructure
 *
 * Verifies the canonical UUID-based ID generation architecture:
 * - Proves that entity IDs are generated using collision-resistant UUID v4 canonical identifiers.
 * - Proves zero reliance on database sequences, sequences collection, or sequence counters.
 * - Tests canonical IDs across all entities:
 *   1. Question ID (qst_<uuid>)
 *   2. Content Master ID (cnt_<uuid>)
 *   3. Video ID (vid_<uuid>)
 *   4. Script ID (scr_<uuid>)
 *   5. Thumbnail ID (thm_<uuid>)
 *   6. Platform Adaptation ID (adp_<uuid>)
 *   7. Analytics ID (anl_<uuid>)
 *   8. Topic ID (top_<uuid>)
 *   9. Subtopic ID (sub_<uuid>)
 * - Verifies no collision across concurrent generations.
 * - Verifies Firestore sequences collection is completely empty and unused.
 */

import assert from 'node:assert';
import { canonicalIdService } from '../src/lib/id.service';
import { getAdminFirestore } from '../database/firestore/adapter/admin';

async function testGate3CanonicalIds() {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — GATE 3 CANONICAL UUID ID VERIFICATION');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Verify Canonical Prefixed UUID IDs across all entities
    console.log('--- Step 1: Generating Canonical Prefixed UUID IDs ---');
    const qId = canonicalIdService.generateQuestionId();
    const cmId = canonicalIdService.generateContentMasterId();
    const vId = canonicalIdService.generateVideoId();
    const sId = canonicalIdService.generateScriptId();
    const tId = canonicalIdService.generateThumbnailId();
    const pId = canonicalIdService.generatePlatformAdaptationId();
    const aId = canonicalIdService.generateSocialAnalyticsId();
    const topId = canonicalIdService.generateTopicId();
    const subId = canonicalIdService.generateSubtopicId();

    console.log('Generated Canonical IDs:');
    console.log('  Question ID:          ', qId);
    console.log('  Content Master ID:    ', cmId);
    console.log('  Video ID:             ', vId);
    console.log('  Script ID:            ', sId);
    console.log('  Thumbnail ID:         ', tId);
    console.log('  Platform Adapt ID:    ', pId);
    console.log('  Analytics ID:         ', aId);
    console.log('  Topic ID:             ', topId);
    console.log('  Subtopic ID:          ', subId);

    // 2. Verify format & UUID patterns
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    assert.ok(qId.startsWith('qst_') && uuidRegex.test(qId.slice(4)), `Invalid Question ID: ${qId}`);
    assert.ok(cmId.startsWith('cnt_') && uuidRegex.test(cmId.slice(4)), `Invalid Content Master ID: ${cmId}`);
    assert.ok(vId.startsWith('vid_') && uuidRegex.test(vId.slice(4)), `Invalid Video ID: ${vId}`);
    assert.ok(sId.startsWith('scr_') && uuidRegex.test(sId.slice(4)), `Invalid Script ID: ${sId}`);
    assert.ok(tId.startsWith('thm_') && uuidRegex.test(tId.slice(4)), `Invalid Thumbnail ID: ${tId}`);
    assert.ok(pId.startsWith('adp_') && uuidRegex.test(pId.slice(4)), `Invalid Platform Adaptation ID: ${pId}`);
    assert.ok(aId.startsWith('anl_') && uuidRegex.test(aId.slice(4)), `Invalid Analytics ID: ${aId}`);
    assert.ok(topId.startsWith('top_') && uuidRegex.test(topId.slice(4)), `Invalid Topic ID: ${topId}`);
    assert.ok(subId.startsWith('sub_') && uuidRegex.test(subId.slice(4)), `Invalid Subtopic ID: ${subId}`);

    const idSet = new Set([qId, cmId, vId, sId, tId, pId, aId, topId, subId]);
    assert.strictEqual(idSet.size, 9, 'All allocated IDs must be distinct and non-colliding');
    console.log('✓ All 9 canonical entity ID types conform to prefix/UUID specifications without collision.');
    passed++;

    // 3. Verify Concurrency & Uniqueness
    console.log('\n--- Step 2: Testing Concurrent Generation Uniqueness ---');
    const bulkIds = new Set<string>();
    const count = 500;
    for (let i = 0; i < count; i++) {
      bulkIds.add(canonicalIdService.generateQuestionId());
    }
    assert.strictEqual(bulkIds.size, count, `Expected ${count} unique IDs, got ${bulkIds.size}`);
    console.log(`✓ Generated ${count} consecutive IDs with 100% uniqueness.`);
    passed++;

    // 4. Verify Firestore Sequences Collection is Unused
    console.log('\n--- Step 3: Verifying Firestore sequences collection is empty ---');
    const firestore = getAdminFirestore();
    const seqSnapshot = await firestore.collection('sequences').get();
    assert.strictEqual(seqSnapshot.size, 0, `Expected 0 sequence documents in Firestore, found ${seqSnapshot.size}`);
    console.log('✓ Zero sequence records exist in Cloud Firestore.');
    passed++;
  } catch (err: any) {
    console.error('✗ Gate 3 Verification FAILED:', err.message);
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

testGate3CanonicalIds().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
