/**
 * BURRA PARIKSHA CMS — Negative Direct Browser Access Verification Test
 * Requirement 5: Prove direct writes to:
 * - users
 * - questions
 * - videos
 * - assignments
 * - publishing_packages
 * - workflow_instances
 * - social_analytics
 * are DENIED.
 */

import assert from 'node:assert';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, terminate } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

async function runNegativeDirectBrowserWriteTest() {
  console.log('============================================================');
  console.log('SPRINT 4 — NEGATIVE DIRECT BROWSER/CLIENT ACCESS TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

  const testCollections = [
    'users',
    'questions',
    'videos',
    'assignments',
    'publishing_packages',
    'workflow_instances',
    'social_analytics',
  ];

  for (const col of testCollections) {
    try {
      console.log(`--- Testing direct write to collection: ${col} ---`);
      const testDocRef = doc(db, col, `direct_hack_${Date.now()}`);
      let rejected = false;
      try {
        await setDoc(testDocRef, { hacked: true, timestamp: Date.now() });
      } catch (err: any) {
        rejected =
          err.code === 'permission-denied' ||
          err.message?.includes('Missing or insufficient permissions') ||
          err.message?.includes('PERMISSION_DENIED');
      }

      assert.strictEqual(
        rejected,
        true,
        `Direct browser write to ${col} MUST be rejected with PERMISSION_DENIED!`
      );
      console.log(`✓ TC-DIRECT-DENIED: Direct browser write to '${col}' was successfully DENIED.`);
      passed++;
    } catch (err: any) {
      console.error(`✗ TC-DIRECT-DENIED FAILED for '${col}':`, err.message);
      failed++;
    }
  }

  console.log('\n============================================================');
  console.log(`NEGATIVE DIRECT BROWSER TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  try {
    await terminate(db);
  } catch {}

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runNegativeDirectBrowserWriteTest().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
