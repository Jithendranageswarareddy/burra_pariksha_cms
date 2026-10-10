/**
 * BURRA PARIKSHA CMS — Cloud Firestore Security Rules Test Suite
 * Sprint 4 / Admin SDK Architecture
 *
 * Verifies that:
 * 1. Default-deny catch-all blocks unapproved paths for unauthenticated clients
 * 2. Direct unauthenticated client writes / updates to audit_logs are blocked by rules
 * 3. Direct unauthenticated client writes / updates to workflow_history are blocked by rules
 * 4. Backend Admin SDK operates authoritatively server-side
 *
 * TEST ISOLATION GUARDS:
 * - Uses neutral synthetic markers: testOnly: true, environment: 'TEST'
 * - Cleaned up immediately via Admin SDK
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
import { getAdminFirestore } from '../src/lib/firebase/admin';

async function runFirestoreRulesTests() {
  console.log('============================================================');
  console.log('STAGE 27 / SPRINT 4 — FIRESTORE RULES EXECUTION TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  const app = initializeApp(firebaseConfig);
  const clientDb = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
  const adminDb = getAdminFirestore();

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
  // Rule Test 2: Audit Logs Immutability (Client update/delete blocked)
  // --------------------------------------------------------------------------
  try {
    console.log('\n--- Test 2: Verifying Audit Logs Immutability (Client Update/Delete Blocked) ---');
    const auditId = `aud_immutability_${Date.now()}`;

    // Backend create via Admin SDK
    await adminDb.collection('audit_logs').doc(auditId).set({
      action: 'TEST_AUDIT',
      actorId: 'usr_test_1',
      timestamp: new Date().toISOString(),
      version: 1,
      testOnly: true,
      environment: 'TEST',
    });

    const clientAuditDocRef = doc(clientDb, 'audit_logs', auditId);

    // Client update must be strictly rejected
    let updateBlocked = false;
    try {
      await updateDoc(clientAuditDocRef, { action: 'TAMPERED_ACTION' });
    } catch (err: any) {
      updateBlocked = err.code === 'permission-denied' || err.message?.includes('Missing or insufficient permissions');
    }
    assert.strictEqual(updateBlocked, true, 'Audit log update must be rejected by security rules');

    // Client delete must be strictly rejected
    let deleteBlocked = false;
    try {
      await deleteDoc(clientAuditDocRef);
    } catch (err: any) {
      deleteBlocked = err.code === 'permission-denied' || err.message?.includes('Missing or insufficient permissions');
    }
    assert.strictEqual(deleteBlocked, true, 'Audit log deletion must be rejected by security rules');

    // Clean up via Admin SDK
    await adminDb.collection('audit_logs').doc(auditId).delete();

    console.log('✓ TC-RULE-02 PASSED: Audit log immutability against client tampering strictly enforced.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-RULE-02 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // Rule Test 3: Workflow History Immutability (Client update blocked)
  // --------------------------------------------------------------------------
  try {
    console.log('\n--- Test 3: Verifying Workflow History Immutability (Client Update Blocked) ---');
    const historyId = `BP-TEST-WFH-${Date.now()}`;

    // Backend create via Admin SDK
    await adminDb.collection('workflow_history').doc(historyId).set({
      fromStage: 1,
      toStage: 2,
      timestamp: new Date().toISOString(),
      testOnly: true,
      environment: 'TEST',
    });

    const clientHistoryDocRef = doc(clientDb, 'workflow_history', historyId);

    // Client update must be blocked
    let updateBlocked = false;
    try {
      await updateDoc(clientHistoryDocRef, { toStage: 15 });
    } catch (err: any) {
      updateBlocked = err.code === 'permission-denied' || err.message?.includes('Missing or insufficient permissions');
    }
    assert.strictEqual(updateBlocked, true, 'Workflow history update must be rejected');

    // Clean up via Admin SDK
    await adminDb.collection('workflow_history').doc(historyId).delete();

    console.log('✓ TC-RULE-03 PASSED: Workflow history immutability strictly enforced.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-RULE-03 FAILED:', err.message);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`FIRESTORE RULES TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  try {
    await terminate(clientDb);
    await adminDb.terminate();
  } catch {}

  process.exit(failed > 0 ? 1 : 0);
}

runFirestoreRulesTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
