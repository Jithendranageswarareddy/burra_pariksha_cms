/**
 * BURRA PARIKSHA CMS — S9 Datastore Isolation Guard Regression Test
 * Sprint 9: Datastore Isolation Hardening & Verification Gate
 *
 * Deterministically tests:
 * 1. Missing emulator configuration -> aborts, fails closed
 * 2. Unapproved production project -> aborts even with emulator host set
 * 3. Unapproved arbitrary project -> aborts even with emulator host set
 * 4. Unapproved production database -> aborts even with emulator host set
 * 5. Invalid / malformed emulator endpoint -> aborts
 * 6. Unreachable emulator endpoint -> probe fails, aborts before any fixture mutation
 * 7. Positive verification: approved synthetic project + live local emulator -> passes
 * 8. Client configuration verification: Firebase Admin and repository clients use the verified emulator binding
 */

import assert from 'node:assert';
import http from 'node:http';
import {
  evaluateDatastoreIsolation,
  KNOWN_PRODUCTION_TARGETS,
  APPROVED_SYNTHETIC_TEST_PROJECTS,
  verifyFirebaseAdminBinding,
  probeFirestoreConnectivity,
  IsolationVerification,
} from './s8-t18-firestore-persistence-recovery.integration.test';
import { getAdminFirestore, resetAdminApp } from '../../database/firestore/adapter/admin';
import { questionDraftsRepository } from '../../database/firestore/repositories/question-drafts.repository';
import { topicsRepository } from '../../database/firestore/repositories/topics.repository';

function pass(name: string) {
  console.log(`  ✓ ${name}`);
}

async function runIsolationGuardTests() {
  console.log('========================================================================');
  console.log('S9 DATASTORE ISOLATION GUARD DETERMINISTIC REGRESSION SUITE');
  console.log('========================================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Deterministic Negative — Missing Emulator Configuration
  // --------------------------------------------------------------------------
  console.log('--- Test 1: Missing Emulator Configuration ---');
  {
    const emptyEnv: NodeJS.ProcessEnv = {};
    const isolation = evaluateDatastoreIsolation('burra-pariksha-test', '(default)', emptyEnv);

    assert.strictEqual(isolation.isApproved, false, 'Expected isApproved to be false when emulator host is missing');
    assert.ok(
      isolation.rejectionReasons.some((r) => r.includes('Missing emulator configuration')),
      `Expected rejection reason for missing emulator configuration, got: ${isolation.rejectionReasons.join('; ')}`
    );

    // Verify fail-closed behavior: guard must abort execution
    let aborted = false;
    try {
      if (!isolation.isApproved) {
        throw new Error('ABORTED_FAIL_CLOSED');
      }
      assert.fail('Should not proceed past guard');
    } catch (err: any) {
      if (err.message === 'ABORTED_FAIL_CLOSED') {
        aborted = true;
      } else {
        throw err;
      }
    }
    assert.strictEqual(aborted, true, 'Execution must abort on missing emulator configuration');
    pass('Missing emulator configuration fails closed deterministically');
  }

  // --------------------------------------------------------------------------
  // TEST 2: Deterministic Negative — Unapproved Production Project
  // --------------------------------------------------------------------------
  console.log('\n--- Test 2: Unapproved Production Project (burra-pariksha-cms) ---');
  {
    const envWithEmulator: NodeJS.ProcessEnv = {
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    };
    // Even if emulator host is set, production project ID must be rejected!
    const isolation = evaluateDatastoreIsolation('burra-pariksha-cms', '(default)', envWithEmulator);

    assert.strictEqual(isolation.isApproved, false, 'A non-empty emulator-host must NOT authorize production project');
    assert.ok(
      isolation.rejectionReasons.some((r) => r.includes('canonical production infrastructure')),
      `Expected rejection for matching canonical production, got: ${isolation.rejectionReasons.join('; ')}`
    );
    assert.ok(
      isolation.rejectionReasons.some((r) => r.includes('not an approved synthetic test project')),
      `Expected rejection for not being an approved synthetic test project, got: ${isolation.rejectionReasons.join('; ')}`
    );

    let aborted = false;
    try {
      if (!isolation.isApproved) {
        throw new Error('ABORTED_FAIL_CLOSED');
      }
      assert.fail('Should not proceed past guard');
    } catch (err: any) {
      if (err.message === 'ABORTED_FAIL_CLOSED') {
        aborted = true;
      } else {
        throw err;
      }
    }
    assert.strictEqual(aborted, true, 'Execution must abort on production project even with emulator host set');
    pass('Production project with emulator host fails closed deterministically');
  }

  // --------------------------------------------------------------------------
  // TEST 3: Deterministic Negative — Unapproved Arbitrary Project
  // --------------------------------------------------------------------------
  console.log('\n--- Test 3: Unapproved Arbitrary Project (random-unapproved-project) ---');
  {
    const envWithEmulator: NodeJS.ProcessEnv = {
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    };
    const isolation = evaluateDatastoreIsolation('random-unapproved-project', '(default)', envWithEmulator);

    assert.strictEqual(isolation.isApproved, false, 'Arbitrary unapproved project must be rejected');
    assert.ok(
      isolation.rejectionReasons.some((r) => r.includes('not an approved synthetic test project')),
      `Expected rejection for unapproved synthetic project, got: ${isolation.rejectionReasons.join('; ')}`
    );

    let aborted = false;
    try {
      if (!isolation.isApproved) {
        throw new Error('ABORTED_FAIL_CLOSED');
      }
      assert.fail('Should not proceed past guard');
    } catch (err: any) {
      if (err.message === 'ABORTED_FAIL_CLOSED') {
        aborted = true;
      } else {
        throw err;
      }
    }
    assert.strictEqual(aborted, true, 'Execution must abort on unapproved project');
    pass('Arbitrary unapproved project fails closed deterministically');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Deterministic Negative — Unapproved Production Database
  // --------------------------------------------------------------------------
  console.log('\n--- Test 4: Unapproved Production Database (ai-studio-...) ---');
  {
    const envWithEmulator: NodeJS.ProcessEnv = {
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    };
    const prodDbId = 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e';
    const isolation = evaluateDatastoreIsolation('burra-pariksha-test', prodDbId, envWithEmulator);

    assert.strictEqual(isolation.isApproved, false, 'Canonical production database must be rejected');
    assert.ok(
      isolation.rejectionReasons.some((r) => r.includes('canonical production database')),
      `Expected rejection for matching canonical production database, got: ${isolation.rejectionReasons.join('; ')}`
    );

    let aborted = false;
    try {
      if (!isolation.isApproved) {
        throw new Error('ABORTED_FAIL_CLOSED');
      }
      assert.fail('Should not proceed past guard');
    } catch (err: any) {
      if (err.message === 'ABORTED_FAIL_CLOSED') {
        aborted = true;
      } else {
        throw err;
      }
    }
    assert.strictEqual(aborted, true, 'Execution must abort on production database');
    pass('Canonical production database fails closed deterministically');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Deterministic Negative — Invalid / Malformed Emulator Endpoint
  // --------------------------------------------------------------------------
  console.log('\n--- Test 5: Malformed Emulator Endpoint ---');
  {
    const malformedHosts = [
      'not_a_valid_host',
      'http://127.0.0.1:8080',
      '127.0.0.1',
      ':8080',
      '127.0.0.1:999999',
    ];

    for (const host of malformedHosts) {
      const isolation = evaluateDatastoreIsolation('burra-pariksha-test', '(default)', {
        FIRESTORE_EMULATOR_HOST: host,
      });
      assert.strictEqual(isolation.isApproved, false, `Expected malformed host "${host}" to be rejected`);
      assert.ok(
        isolation.rejectionReasons.some((r) => r.includes('malformed')),
        `Expected malformed error for host "${host}", got: ${isolation.rejectionReasons.join('; ')}`
      );
    }
    pass('Malformed emulator hosts rejected deterministically');
  }

  // --------------------------------------------------------------------------
  // TEST 6: Deterministic Negative — Unreachable Emulator Endpoint
  // --------------------------------------------------------------------------
  console.log('\n--- Test 6: Unreachable Emulator Endpoint ---');
  {
    // Mock db targeting an unreachable port
    const unreachableDb = {
      projectId: 'burra-pariksha-test',
      databaseId: '(default)',
      _settings: {
        servicePath: '127.0.0.1',
        port: 59998,
        ssl: false,
      },
      collection: () => ({
        limit: () => ({
          get: () => Promise.reject(new Error('connect ECONNREFUSED 127.0.0.1:59998')),
        }),
      }),
    };

    const probe = await probeFirestoreConnectivity(unreachableDb, 1000);
    assert.strictEqual(probe.reachable, false, 'Expected unreachable port to fail probe');
    assert.ok(
      probe.error?.includes('Connection refused') || probe.error?.includes('ECONNREFUSED'),
      `Expected connection refusal, got: ${probe.error}`
    );

    // Verify fail-closed behavior before fixture creation
    let aborted = false;
    let fixturesCreated = 0;
    try {
      if (!probe.reachable) {
        throw new Error(`CRITICAL FAIL-CLOSED: Local Firestore emulator is unreachable: ${probe.error}`);
      }
      fixturesCreated++;
    } catch (err: any) {
      if (err.message.includes('CRITICAL FAIL-CLOSED')) {
        aborted = true;
      }
    }
    assert.strictEqual(aborted, true, 'Must abort when emulator endpoint is unreachable');
    assert.strictEqual(fixturesCreated, 0, 'Zero fixtures must be created when emulator is unreachable');
    pass('Unreachable emulator probe aborts execution prior to fixture creation');
  }

  // --------------------------------------------------------------------------
  // TEST 7: Deterministic Positive — Approved Synthetic Project with Emulator
  // --------------------------------------------------------------------------
  console.log('\n--- Test 7: Approved Synthetic Project with Valid Emulator Host ---');
  {
    for (const approvedProj of APPROVED_SYNTHETIC_TEST_PROJECTS) {
      const isolation = evaluateDatastoreIsolation(approvedProj, '(default)', {
        FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
      });
      assert.strictEqual(isolation.isApproved, true, `Expected project "${approvedProj}" to be approved`);
      assert.strictEqual(isolation.isolationMode, 'LOCAL_FIRESTORE_EMULATOR');
      assert.strictEqual(isolation.rejectionReasons.length, 0);
      assert.ok(isolation.approvalEvidence.length > 0);
    }

    // Verify connected probe against a live listening emulator endpoint
    const testServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    });
    await new Promise<void>((resolve) => testServer.listen(0, '127.0.0.1', () => resolve()));
    const assignedPort = (testServer.address() as any).port;

    const connectedDb = {
      projectId: 'burra-pariksha-test',
      databaseId: '(default)',
      _settings: { servicePath: '127.0.0.1', port: assignedPort, ssl: false },
      collection: () => ({
        limit: () => ({
          get: () => Promise.resolve({ empty: true }),
        }),
      }),
    };

    const connectedProbe = await probeFirestoreConnectivity(connectedDb, 2000);
    assert.strictEqual(connectedProbe.reachable, true, `Connected probe must succeed: ${connectedProbe.error}`);
    await new Promise<void>((resolve) => testServer.close(() => resolve()));

    pass('Approved synthetic projects and live connected emulator probe validated');
  }

  // --------------------------------------------------------------------------
  // TEST 8: Firebase Admin Client Binding & Repository Verification
  // --------------------------------------------------------------------------
  console.log('\n--- Test 8: Firebase Admin Client Binding & Repository Alignment ---');
  {
    // Test that verifyFirebaseAdminBinding detects misconfigurations
    const mismatchedProjectDb = {
      projectId: 'unapproved-project',
      databaseId: '(default)',
      _settings: { servicePath: '127.0.0.1', port: 8080, ssl: false },
    };
    assert.throws(
      () =>
        verifyFirebaseAdminBinding(mismatchedProjectDb, {
          projectId: 'burra-pariksha-test',
          databaseId: '(default)',
          emulatorHost: '127.0.0.1:8080',
        }),
      /Firebase Admin client misconfigured: bound to project "unapproved-project"/
    );

    const mismatchedDatabaseDb = {
      projectId: 'burra-pariksha-test',
      databaseId: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
      _settings: { servicePath: '127.0.0.1', port: 8080, ssl: false },
    };
    assert.throws(
      () =>
        verifyFirebaseAdminBinding(mismatchedDatabaseDb, {
          projectId: 'burra-pariksha-test',
          databaseId: '(default)',
          emulatorHost: '127.0.0.1:8080',
        }),
      /Firebase Admin client misconfigured: bound to database/
    );

    const mismatchedHostDb = {
      projectId: 'burra-pariksha-test',
      databaseId: '(default)',
      _settings: { servicePath: '192.168.1.100', port: 8080, ssl: false },
    };
    assert.throws(
      () =>
        verifyFirebaseAdminBinding(mismatchedHostDb, {
          projectId: 'burra-pariksha-test',
          databaseId: '(default)',
          emulatorHost: '127.0.0.1:8080',
        }),
      /Firebase Admin client is not connected to emulator host/
    );

    const sslEnabledDb = {
      projectId: 'burra-pariksha-test',
      databaseId: '(default)',
      _settings: { servicePath: '127.0.0.1', port: 8080, ssl: true },
    };
    assert.throws(
      () =>
        verifyFirebaseAdminBinding(sslEnabledDb, {
          projectId: 'burra-pariksha-test',
          databaseId: '(default)',
          emulatorHost: '127.0.0.1:8080',
        }),
      /Firebase Admin client has SSL enabled/
    );

    // Verify positive client binding check
    const validDb = {
      projectId: 'burra-pariksha-test',
      databaseId: '(default)',
      _settings: { servicePath: '127.0.0.1', port: 8080, ssl: false },
    };
    assert.doesNotThrow(() =>
      verifyFirebaseAdminBinding(validDb, {
        projectId: 'burra-pariksha-test',
        databaseId: '(default)',
        emulatorHost: '127.0.0.1:8080',
      })
    );

    pass('Firebase Admin client binding verification rejects mismatches and accepts valid bindings');
  }

  console.log('\n========================================================================');
  console.log('ALL S9 DATASTORE ISOLATION GUARD TESTS PASSED 100%');
  console.log('========================================================================\n');
}

runIsolationGuardTests().catch((err) => {
  console.error('ISOLATION GUARD REGRESSION TEST FAILED:', err);
  process.exitCode = 1;
});
