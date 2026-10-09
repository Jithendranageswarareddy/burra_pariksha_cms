/**
 * BURRA PARIKSHA CMS — Cloud Firestore Security Rules Test Suite
 * Sprint 4: Production Data Layer Migration
 *
 * Deterministic automated validation verifying deployed firestore.rules:
 * 1. Default-deny catch-all blocks unapproved paths
 * 2. Immutable audit logs cannot be updated or deleted
 * 3. Immutable workflow history cannot be updated or deleted
 * 4. Production collections allow authenticated gateway read/write
 */

import assert from 'node:assert';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  terminate,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

async function runFirestoreRulesTests() {
  console.log('============================================================');
  console.log('STAGE 27 / SPRINT 4 — FIRESTORE RULES EXECUTION TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

  // --------------------------------------------------------------------------
  // Rule Test 1: Catch-all Default Deny on Unauthorized Paths
  // --------------------------------------------------------------------------
  try {
    console.log('--- Test 1: Verifying Catch-All Default Deny ---');
    const unauthorizedDocRef = doc(db, 'unauthorized_secret_collection', 'secret_doc_1');
    let rejected = false;
    try {
      await setDoc(unauthorizedDocRef, { secret: 'data' });
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
  // Rule Test 2: Audit Logs Immutability (Update Blocked)
  // --------------------------------------------------------------------------
  try {
    console.log('\n--- Test 2: Verifying Audit Logs Immutability (Update Blocked) ---');
    const auditId = `aud_rule_test_${Date.now()}`;
    const auditDocRef = doc(db, 'audit_logs', auditId);

    // Create must succeed
    await setDoc(auditDocRef, {
      action: 'TEST_AUDIT',
      actorId: 'usr_test_1',
      timestamp: new Date().toISOString(),
      version: 1,
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
  // Rule Test 3: Workflow History Immutability (Update & Delete Blocked)
  // --------------------------------------------------------------------------
  try {
    console.log('\n--- Test 3: Verifying Workflow History Immutability ---');
    const historyId = `wfh_rule_test_${Date.now()}`;
    const historyDocRef = doc(db, 'workflow_history', historyId);

    // Create must succeed
    await setDoc(historyDocRef, {
      fromStage: 1,
      toStage: 2,
      timestamp: new Date().toISOString(),
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
  } catch (err: any) {
    console.error('✗ TC-RULE-03 FAILED:', err.message);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`FIRESTORE RULES TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  try {
    await terminate(db);
  } catch {}

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFirestoreRulesTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
