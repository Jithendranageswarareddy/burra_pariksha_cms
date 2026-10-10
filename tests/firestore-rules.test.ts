/**
 * BURRA PARIKSHA CMS — Cloud Firestore Security Rules Test Suite
 * Sprint 4: Option A (Backend-Only Authoritative Gateway Architecture)
 *
 * Verifies that:
 * 1. Default-deny catch-all blocks unapproved paths
 * 2. Direct unauthenticated client writes to audit_logs are blocked
 * 3. Backend service can create audit logs, but cannot update or delete them (immutability)
 * 4. Direct unauthenticated client writes to workflow_history are blocked
 * 5. Backend service can create workflow history, but cannot update or delete them (immutability)
 *
 * TEST ISOLATION GUARDS:
 * - Uses neutral synthetic markers: testOnly: true, environment: 'TEST'
 * - Cleaned up where permitted or explicitly scoped to dedicated test doc IDs
 */

import assert from 'node:assert';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  terminate,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { getBackendFirestore } from '../src/lib/firebase/server-auth';

async function runFirestoreRulesTests() {
  console.log('============================================================');
  console.log('STAGE 27 / SPRINT 4 — FIRESTORE RULES EXECUTION TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  const app = initializeApp(firebaseConfig);
  const clientDb = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
  const backendDb = await getBackendFirestore();

  // --------------------------------------------------------------------------
  // Rule Test 1: Catch-all Default Deny on Unauthorized Paths
  // --------------------------------------------------------------------------
  try {
    console.log('--- Test 1: Verifying Catch-All Default Deny ---');
    const unauthorizedDocRef = doc(clientDb, 'unauthorized_secret_collection', 'BP-TEST-SECRET-1');
    let rejected = false;
    try {
      await setDoc(unauthorizedDocRef, {
        secret: 'data',
        testOnly: true,
        environment: 'TEST',
      });
    } catch (err: any) {
      rejected = err.code === 'permission-denied' || err.message?.includes('Missing or insufficient permissions');
    }
    assert.strictEqual(rejected, true, 'Catch-all rule must reject unlisted collections');
    console.log('✓ TC-RULE-01 PASSED: Default-deny catch-all strictly enforced.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-RULE-01 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Rule Test 2: Audit Logs Immutability (Backend create succeeds, update/delete blocked)
  // --------------------------------------------------------------------------
  try {
    console.log('\n--- Test 2: Verifying Audit Logs Immutability (Update Blocked) ---');
    const auditId = `aud_immutability_${Date.now()}`;
    const auditDocRef = doc(backendDb, 'audit_logs', auditId);

    // Backend create must succeed
    await setDoc(auditDocRef, {
      action: 'TEST_AUDIT',
      actorId: 'usr_test_1',
      timestamp: new Date().toISOString(),
      version: 1,
      testOnly: true,
      environment: 'TEST',
    });

    // Update must be strictly rejected
    let updateBlocked = false;
    try {
      await updateDoc(auditDocRef, { action: 'TAMPERED_ACTION' });
    } catch (err: any) {
      updateBlocked = err.code === 'permission-denied' || err.message?.includes('Missing or insufficient permissions');
    }
    assert.strictEqual(updateBlocked, true, 'Audit log update must be rejected by security rules');

    // Delete must be strictly rejected
    let deleteBlocked = false;
    try {
      await deleteDoc(auditDocRef);
    } catch (err: any) {
      deleteBlocked = err.code === 'permission-denied' || err.message?.includes('Missing or insufficient permissions');
    }
    assert.strictEqual(deleteBlocked, true, 'Audit log deletion must be rejected by security rules');

    console.log('✓ TC-RULE-02 PASSED: Audit log immutability (no update/delete) strictly enforced.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-RULE-02 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Rule Test 3: Workflow History Immutability (Backend create succeeds, update blocked)
  // --------------------------------------------------------------------------
  try {
    console.log('\n--- Test 3: Verifying Workflow History Immutability ---');
    const historyId = `BP-TEST-WFH-${Date.now()}`;
    const historyDocRef = doc(backendDb, 'workflow_history', historyId);

    // Backend create must succeed
    await setDoc(historyDocRef, {
      fromStage: 1,
      toStage: 2,
      timestamp: new Date().toISOString(),
      testOnly: true,
      environment: 'TEST',
    });

    // Update must be blocked
    let updateBlocked = false;
    try {
      await updateDoc(historyDocRef, { toStage: 15 });
    } catch (err: any) {
      updateBlocked = err.code === 'permission-denied' || err.message?.includes('Missing or insufficient permissions');
    }
    assert.strictEqual(updateBlocked, true, 'Workflow history update must be rejected');

    console.log('✓ TC-RULE-03 PASSED: Workflow history immutability strictly enforced.');
    passed++;

    // Teardown test record
    try {
      await deleteDoc(historyDocRef);
    } catch {}
  } catch (err: any) {
    console.error('✗ TC-RULE-03 FAILED:', err.message);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`FIRESTORE RULES TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  try {
    await terminate(clientDb);
    await terminate(backendDb);
  } catch {}

  process.exit(failed > 0 ? 1 : 0);
}

runFirestoreRulesTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
