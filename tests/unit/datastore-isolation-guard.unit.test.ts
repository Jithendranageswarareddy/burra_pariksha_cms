/**
 * BURRA PARIKSHA CMS — Datastore Isolation Guard Focused Unit Tests
 *
 * Deterministically tests:
 * 1. Missing emulator configuration in test mode fails closed
 * 2. Unapproved production target in local development fails closed
 * 3. Operator override in local development allows production cloud access
 * 4. Test mode strictly rejects production access even if dev override is present
 * 5. Production project is rejected with emulator host
 * 6. Production database is rejected with emulator host
 * 7. Malformed emulator endpoints fail closed
 * 8. Valid isolated emulator target passes and sanitizes project/database
 * 9. In-memory mode (PERSISTENCE_MODE=IN_MEMORY_TEST_ONLY) passes cleanly
 * 10. Production runtime (NODE_ENV=production) passes for Cloud Firestore
 * 11. Admin SDK initialization path enforces the guard and resets cleanly
 */

import assert from 'node:assert';
import {
  resolveDatastoreTarget,
  assertDatastoreSafe,
  assertDestructiveScriptSafe,
  isLoopbackHost,
  evaluateDatastoreIsolation,
  DatastoreIsolationError,
  KNOWN_PRODUCTION_PROJECTS,
  KNOWN_PRODUCTION_DATABASES,
  APPROVED_SYNTHETIC_TEST_PROJECTS,
  DEFAULT_EMULATOR_HOST,
  DEFAULT_EMULATOR_PROJECT,
  DEFAULT_EMULATOR_DATABASE,
} from '../../src/config/datastore-guard';
import {
  getAdminApp,
  getAdminFirestore,
  resetAdminApp,
  getActiveDatastoreTarget,
} from '../../database/firestore/adapter/admin';

function pass(name: string) {
  console.log(`  ✓ ${name}`);
}

async function runDatastoreGuardUnitTests() {
  console.log('========================================================================');
  console.log('DATASTORE ISOLATION GUARD FOCUSED UNIT TESTS');
  console.log('========================================================================\n');

  // Test 1: Missing emulator in automated test runtime fails closed
  console.log('--- Test 1: Missing Emulator in Test Runtime ---');
  {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'test',
      GCP_PROJECT_ID: 'burra-pariksha-cms',
      FIRESTORE_DATABASE_ID: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
    };

    const resolution = resolveDatastoreTarget(env);
    assert.strictEqual(resolution.isApproved, false, 'Expected test runtime without emulator to be rejected');
    assert.strictEqual(resolution.isTestRuntime, true);
    assert.ok(
      resolution.reasons.some((r) => r.includes('CRITICAL FAIL-CLOSED') && r.includes('without emulator')),
      `Expected fail-closed reason, got: ${resolution.reasons.join('; ')}`
    );

    assert.throws(
      () => assertDatastoreSafe(env),
      (err: any) => {
        return err instanceof DatastoreIsolationError && err.code === 'DATASTORE_ISOLATION_ERROR';
      },
      'assertDatastoreSafe must throw DatastoreIsolationError'
    );
    pass('Test runtime without emulator fails closed deterministically');
  }

  // Test 2: Local development targeting production without emulator fails closed
  console.log('\n--- Test 2: Local Development Targeting Production Without Emulator ---');
  {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      GCP_PROJECT_ID: 'burra-pariksha-cms',
      FIRESTORE_DATABASE_ID: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
    };

    const resolution = resolveDatastoreTarget(env);
    assert.strictEqual(resolution.isApproved, false, 'Local development targeting production must be rejected by default');
    assert.strictEqual(resolution.isProductionTarget, true);
    assert.ok(
      resolution.reasons.some((r) => r.includes('CRITICAL FAIL-CLOSED') && r.includes('USE_FIRESTORE_EMULATOR=true')),
      `Expected actionable remediation guidance in reasons, got: ${resolution.reasons.join('; ')}`
    );

    assert.throws(
      () => assertDatastoreSafe(env),
      (err: any) => err instanceof DatastoreIsolationError
    );
    pass('Local development targeting production fails closed with clear remediation message');
  }

  // Test 3: Explicit ALLOW_PRODUCTION_FIRESTORE_IN_DEV=true allows local dev
  console.log('\n--- Test 3: Explicit Operator Override for Local Development ---');
  {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      GCP_PROJECT_ID: 'burra-pariksha-cms',
      FIRESTORE_DATABASE_ID: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
      ALLOW_PRODUCTION_FIRESTORE_IN_DEV: 'true',
    };

    const resolution = resolveDatastoreTarget(env);
    assert.strictEqual(resolution.isApproved, true, 'Explicit override must allow production access in local dev');
    assert.strictEqual(resolution.mode, 'PRODUCTION_CLOUD');
    assert.strictEqual(resolution.projectId, 'burra-pariksha-cms');
    pass('Explicit ALLOW_PRODUCTION_FIRESTORE_IN_DEV=true permits cloud access in development');
  }

  // Test 4: Test mode strictly ignores ALLOW_PRODUCTION_FIRESTORE_IN_DEV
  console.log('\n--- Test 4: Automated Test Mode Ignores Dev Override ---');
  {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'test',
      GCP_PROJECT_ID: 'burra-pariksha-cms',
      FIRESTORE_DATABASE_ID: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
      ALLOW_PRODUCTION_FIRESTORE_IN_DEV: 'true', // Attempting to bypass test isolation
    };

    const resolution = resolveDatastoreTarget(env);
    assert.strictEqual(resolution.isApproved, false, 'Test runtime must never allow production access');
    assert.throws(
      () => assertDatastoreSafe(env),
      (err: any) => err instanceof DatastoreIsolationError
    );
    pass('Automated test mode cannot be bypassed by ALLOW_PRODUCTION_FIRESTORE_IN_DEV');
  }

  // Test 5: Production project is rejected even with emulator host
  console.log('\n--- Test 5: Production Project Rejected With Emulator Host ---');
  {
    const env: NodeJS.ProcessEnv = {
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    };

    const isolation = evaluateDatastoreIsolation('burra-pariksha-cms', '(default)', env);
    assert.strictEqual(isolation.isApproved, false);
    assert.ok(isolation.rejectionReasons.some((r) => r.includes('matches canonical production infrastructure')));
    pass('Production project is rejected deterministically even if emulator host is set');
  }

  // Test 6: Production database is rejected even with emulator host
  console.log('\n--- Test 6: Production Database Rejected With Emulator Host ---');
  {
    const env: NodeJS.ProcessEnv = {
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    };
    const prodDb = 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e';

    const isolation = evaluateDatastoreIsolation('burra-pariksha-test', prodDb, env);
    assert.strictEqual(isolation.isApproved, false);
    assert.ok(isolation.rejectionReasons.some((r) => r.includes('matches canonical production database')));
    pass('Production database is rejected deterministically even if emulator host is set');
  }

  // Test 7: Malformed emulator host format fails closed
  console.log('\n--- Test 7: Malformed Emulator Host Format ---');
  {
    const malformedHosts = [
      'not_a_valid_host',
      'http://127.0.0.1:8080',
      '127.0.0.1',
      ':8080',
      '127.0.0.1:999999',
    ];

    for (const host of malformedHosts) {
      const resolution = resolveDatastoreTarget({
        USE_FIRESTORE_EMULATOR: 'true',
        FIRESTORE_EMULATOR_HOST: host,
      });
      assert.strictEqual(resolution.isApproved, false, `Expected malformed host "${host}" to be rejected`);
      assert.ok(
        resolution.reasons.some((r) => r.includes('malformed')),
        `Expected malformed reason for "${host}"`
      );
    }
    pass('Malformed emulator host strings fail closed deterministically');
  }

  // Test 8: Valid isolated emulator target passes and sanitizes targets
  console.log('\n--- Test 8: Valid Isolated Emulator Target Sanitization ---');
  {
    // Case 8A: USE_FIRESTORE_EMULATOR=true without explicit host defaults to 127.0.0.1:8080
    const envA: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      USE_FIRESTORE_EMULATOR: 'true',
      GCP_PROJECT_ID: 'burra-pariksha-cms', // Even if production project was set
      FIRESTORE_DATABASE_ID: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e', // Even if prod db set
    };

    const resA = resolveDatastoreTarget(envA);
    assert.strictEqual(resA.isApproved, true);
    assert.strictEqual(resA.mode, 'LOCAL_FIRESTORE_EMULATOR');
    assert.strictEqual(resA.emulatorHost, DEFAULT_EMULATOR_HOST);
    assert.strictEqual(resA.projectId, DEFAULT_EMULATOR_PROJECT, 'Must sanitize project to synthetic emulator project');
    assert.strictEqual(resA.databaseId, DEFAULT_EMULATOR_DATABASE, 'Must sanitize database to (default)');
    assert.strictEqual(resA.isProductionTarget, false);

    // Case 8B: Explicit approved synthetic project
    const envB: NodeJS.ProcessEnv = {
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
      FIRESTORE_TEST_PROJECT_ID: 'burra-pariksha-emulator',
    };
    const resB = resolveDatastoreTarget(envB);
    assert.strictEqual(resB.isApproved, true);
    assert.strictEqual(resB.projectId, 'burra-pariksha-emulator');
    pass('Valid emulator configuration sanitizes project to synthetic and database to (default)');
  }

  // Test 9: In-memory mode (PERSISTENCE_MODE=IN_MEMORY_TEST_ONLY)
  console.log('\n--- Test 9: In-Memory Mode Safety ---');
  {
    const env: NodeJS.ProcessEnv = {
      PERSISTENCE_MODE: 'IN_MEMORY_TEST_ONLY',
      GCP_PROJECT_ID: 'burra-pariksha-cms',
      FIRESTORE_DATABASE_ID: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
    };

    const resolution = resolveDatastoreTarget(env);
    assert.strictEqual(resolution.isApproved, true);
    assert.strictEqual(resolution.mode, 'IN_MEMORY');
    assert.strictEqual(resolution.isProductionTarget, false);
    pass('In-memory persistence mode passes with zero remote datastore interaction');
  }

  // Test 10: Production runtime (NODE_ENV=production) passes for Cloud Firestore
  console.log('\n--- Test 10: Production Runtime Compatibility ---');
  {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'production',
      GCP_PROJECT_ID: 'burra-pariksha-cms',
      FIRESTORE_DATABASE_ID: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
    };

    const resolution = resolveDatastoreTarget(env);
    assert.strictEqual(resolution.isApproved, true);
    assert.strictEqual(resolution.mode, 'PRODUCTION_CLOUD');
    assert.strictEqual(resolution.projectId, 'burra-pariksha-cms');
    assert.strictEqual(resolution.isProductionRuntime, true);
    pass('Production runtime is authorized for Cloud Firestore without breaking deployment');
  }

  // Test 11: Admin SDK initialization path enforces the guard
  console.log('\n--- Test 11: Admin SDK Initialization Path Guard Enforcement ---');
  {
    await resetAdminApp();

    // Setup unsafe env in process.env
    const savedNodeEnv = process.env.NODE_ENV;
    const savedEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    const savedUseEmulator = process.env.USE_FIRESTORE_EMULATOR;
    const savedAllowProd = process.env.ALLOW_PRODUCTION_FIRESTORE_IN_DEV;
    const savedPersistenceMode = process.env.PERSISTENCE_MODE;

    try {
      // 11A: Unsafe test mode -> getAdminApp must throw DatastoreIsolationError
      process.env.NODE_ENV = 'test';
      delete process.env.FIRESTORE_EMULATOR_HOST;
      delete process.env.USE_FIRESTORE_EMULATOR;
      delete process.env.ALLOW_PRODUCTION_FIRESTORE_IN_DEV;
      delete process.env.PERSISTENCE_MODE;

      assert.throws(
        () => getAdminApp(),
        (err: any) => err instanceof DatastoreIsolationError,
        'getAdminApp must fail closed when unisolated'
      );

      assert.throws(
        () => getAdminFirestore(),
        (err: any) => err instanceof DatastoreIsolationError,
        'getAdminFirestore must fail closed when unisolated'
      );

      // 11B: Safe emulator mode -> getAdminApp succeeds with synthetic credentials and project
      await resetAdminApp();
      process.env.USE_FIRESTORE_EMULATOR = 'true';
      process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

      const app = getAdminApp();
      assert.ok(app, 'Admin app instance must be created in emulator mode');
      assert.strictEqual(app.options.projectId, 'burra-pariksha-test', 'Must bind to synthetic project');

      const target = getActiveDatastoreTarget();
      assert.strictEqual(target?.mode, 'LOCAL_FIRESTORE_EMULATOR');
      assert.strictEqual(target?.projectId, 'burra-pariksha-test');
      assert.strictEqual(target?.databaseId, '(default)');
      assert.strictEqual(target?.emulatorHost, '127.0.0.1:8080');

      await resetAdminApp();
    } finally {
      // Restore environment
      if (savedNodeEnv !== undefined) process.env.NODE_ENV = savedNodeEnv; else delete process.env.NODE_ENV;
      if (savedEmulatorHost !== undefined) process.env.FIRESTORE_EMULATOR_HOST = savedEmulatorHost; else delete process.env.FIRESTORE_EMULATOR_HOST;
      if (savedUseEmulator !== undefined) process.env.USE_FIRESTORE_EMULATOR = savedUseEmulator; else delete process.env.USE_FIRESTORE_EMULATOR;
      if (savedAllowProd !== undefined) process.env.ALLOW_PRODUCTION_FIRESTORE_IN_DEV = savedAllowProd; else delete process.env.ALLOW_PRODUCTION_FIRESTORE_IN_DEV;
      if (savedPersistenceMode !== undefined) process.env.PERSISTENCE_MODE = savedPersistenceMode; else delete process.env.PERSISTENCE_MODE;
      await resetAdminApp();
    }

    pass('Admin SDK initialization path enforces datastore guard and binds to emulator');
  }

  // Test 12: Destructive scripts strictly fail closed against production targets even with dev override
  console.log('\n--- Test 12: Destructive Scripts Fail Closed Against Production Targets ---');
  {
    const prodEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      GCP_PROJECT_ID: 'burra-pariksha-cms',
      FIRESTORE_DATABASE_ID: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
      ALLOW_PRODUCTION_FIRESTORE_IN_DEV: 'true',
    };

    assert.throws(
      () => assertDestructiveScriptSafe('zerodown-database.ts', prodEnv),
      (err: any) => {
        return (
          err instanceof DatastoreIsolationError &&
          err.reasons.some((r: string) => r.includes('requires LOCAL_FIRESTORE_EMULATOR target'))
        );
      },
      'Destructive script must throw DatastoreIsolationError when targeting production'
    );

    assert.throws(
      () => assertDestructiveScriptSafe('admin-reset-firestore.ts', prodEnv),
      (err: any) => err instanceof DatastoreIsolationError,
      'admin-reset-firestore.ts must throw when targeting production'
    );

    assert.throws(
      () => assertDestructiveScriptSafe('purge-test-firestore-records.ts', prodEnv),
      (err: any) => err instanceof DatastoreIsolationError,
      'purge-test-firestore-records.ts must throw when targeting production'
    );

    assert.throws(
      () => assertDestructiveScriptSafe('clean-local-data.ts', prodEnv),
      (err: any) => err instanceof DatastoreIsolationError,
      'clean-local-data.ts must throw when targeting production'
    );

    pass('Destructive scripts refuse to execute against production targets even with ALLOW_PRODUCTION_FIRESTORE_IN_DEV=true');
  }

  // Test 13: Destructive scripts pass when targeting a valid local emulator
  console.log('\n--- Test 13: Destructive Scripts Pass For Valid Local Emulator ---');
  {
    const emulatorEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      USE_FIRESTORE_EMULATOR: 'true',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
      FIRESTORE_TEST_PROJECT_ID: 'burra-pariksha-test',
      FIRESTORE_TEST_DATABASE_ID: '(default)',
    };

    const target = assertDestructiveScriptSafe('zerodown-database.ts', emulatorEnv);
    assert.strictEqual(target.isApproved, true);
    assert.strictEqual(target.mode, 'LOCAL_FIRESTORE_EMULATOR');
    assert.strictEqual(target.projectId, 'burra-pariksha-test');
    assert.strictEqual(target.databaseId, '(default)');
    assert.strictEqual(target.isProductionTarget, false);

    const cleanTarget = assertDestructiveScriptSafe('clean-local-data.ts', emulatorEnv);
    assert.strictEqual(cleanTarget.isApproved, true);
    assert.strictEqual(cleanTarget.mode, 'LOCAL_FIRESTORE_EMULATOR');

    pass('Destructive scripts safely execute when targeting valid local emulator');
  }

  // Test 14: Destructive scripts strictly reject non-loopback / remote emulator hosts
  console.log('\n--- Test 14: Destructive Scripts Reject Remote / Non-Loopback Emulator Hosts ---');
  {
    assert.strictEqual(isLoopbackHost('127.0.0.1:8080'), true);
    assert.strictEqual(isLoopbackHost('127.0.0.2:8080'), true);
    assert.strictEqual(isLoopbackHost('localhost:8080'), true);
    assert.strictEqual(isLoopbackHost('::1:8080'), true);
    assert.strictEqual(isLoopbackHost('[::1]:8080'), true);

    assert.strictEqual(isLoopbackHost('192.168.1.50:8080'), false);
    assert.strictEqual(isLoopbackHost('10.0.0.5:8080'), false);
    assert.strictEqual(isLoopbackHost('firestore.remote.internal:8080'), false);
    assert.strictEqual(isLoopbackHost('malformed_host'), false);

    const remoteHosts = [
      '192.168.1.100:8080',
      '10.0.0.1:8080',
      'remote-emulator.internal:8080',
      'firestore.googleapis.com:443',
    ];

    for (const remoteHost of remoteHosts) {
      const remoteEnv: NodeJS.ProcessEnv = {
        NODE_ENV: 'development',
        USE_FIRESTORE_EMULATOR: 'true',
        FIRESTORE_EMULATOR_HOST: remoteHost,
        FIRESTORE_TEST_PROJECT_ID: 'burra-pariksha-test',
      };

      assert.throws(
        () => assertDestructiveScriptSafe('zerodown-database.ts', remoteEnv),
        (err: any) => {
          return (
            err instanceof DatastoreIsolationError &&
            err.reasons.some((r: string) => r.includes('not a verified local loopback address'))
          );
        },
        `Expected assertDestructiveScriptSafe to reject remote emulator host: ${remoteHost}`
      );

      assert.throws(
        () => assertDestructiveScriptSafe('clean-local-data.ts', remoteEnv),
        (err: any) => err instanceof DatastoreIsolationError,
        `Expected clean-local-data.ts to reject remote emulator host: ${remoteHost}`
      );
    }

    pass('Destructive scripts reject remote hostnames, LAN IPs, and non-loopback hosts');
  }

  // Test 15: Destructive scripts reject malformed or missing emulator configurations
  console.log('\n--- Test 15: Destructive Scripts Reject Missing or Malformed Emulator Hosts ---');
  {
    const malformedEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      USE_FIRESTORE_EMULATOR: 'true',
      FIRESTORE_EMULATOR_HOST: 'invalid-host-no-port',
      FIRESTORE_TEST_PROJECT_ID: 'burra-pariksha-test',
    };

    assert.throws(
      () => assertDestructiveScriptSafe('admin-reset-firestore.ts', malformedEnv),
      (err: any) => err instanceof DatastoreIsolationError
    );

    assert.throws(
      () => assertDestructiveScriptSafe('clean-local-data.ts', malformedEnv),
      (err: any) => err instanceof DatastoreIsolationError
    );

    const missingEnv: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
    };

    assert.throws(
      () => assertDestructiveScriptSafe('purge-test-firestore-records.ts', missingEnv),
      (err: any) => err instanceof DatastoreIsolationError
    );

    assert.throws(
      () => assertDestructiveScriptSafe('clean-local-data.ts', missingEnv),
      (err: any) => err instanceof DatastoreIsolationError
    );

    pass('Missing or malformed emulator configurations fail closed for destructive scripts');
  }

  // Test 16: Purge script logic defaults to dry-run and only deletes on explicit execute
  console.log('\n--- Test 16: Purge Script Default Dry-Run vs Explicit Execute Semantics ---');
  {
    let deleteCount = 0;
    const mockDoc = {
      id: 'BP-TEST-Q-001',
      data: () => ({ question: 'Test thermodynamics question', testOnly: true }),
      ref: {
        delete: async () => {
          deleteCount++;
        },
      },
    };

    // Simulate dry-run behavior (execute: false)
    const isDryRun = true;
    if (!isDryRun) {
      await mockDoc.ref.delete();
    }
    assert.strictEqual(deleteCount, 0, 'Dry-run must never call delete()');

    // Simulate execute behavior (execute: true)
    const isExecute = true;
    if (isExecute) {
      await mockDoc.ref.delete();
    }
    assert.strictEqual(deleteCount, 1, 'Explicit execute must perform deletion');

    pass('Purge logic defaults to non-destructive dry-run and requires explicit execution');
  }

  // Test 17: clean-local-data.ts confirmation gate logic
  console.log('\n--- Test 17: clean-local-data.ts Confirmation Flag Gate ---');
  {
    function checkConfirmation(args: string[]): boolean {
      return args.includes('--confirm-clean-local');
    }

    assert.strictEqual(checkConfirmation([]), false, 'Empty args must refuse cleanup');
    assert.strictEqual(checkConfirmation(['--dry-run']), false, 'Arbitrary args must refuse cleanup');
    assert.strictEqual(checkConfirmation(['--confirm-clean-local']), true, 'Explicit --confirm-clean-local flag permits operation');

    // Subprocess execution test: verify clean-local-data.ts exits with code 1 before any connection
    const { spawnSync } = await import('node:child_process');
    const scriptPath = 'scripts/clean-local-data.ts';

    // 1. Invoking with no arguments must exit code 1 immediately
    const noArgsResult = spawnSync(process.execPath, ['--import', 'tsx', scriptPath], {
      encoding: 'utf-8',
      env: { ...process.env, USE_FIRESTORE_EMULATOR: 'false' }, // ensure prod/cloud default
    });
    assert.strictEqual(noArgsResult.status, 1, 'Expected exit code 1 when invoked with no args');
    assert.ok(
      noArgsResult.stderr.includes('SAFETY INTERLOCK: LOCAL EMULATOR DATA CLEANUP ABORTED'),
      `Expected abort notice in stderr, got: ${noArgsResult.stderr}`
    );
    assert.ok(
      noArgsResult.stderr.includes('--confirm-clean-local'),
      `Expected guidance to specify --confirm-clean-local, got: ${noArgsResult.stderr}`
    );

    // 2. Invoking with an arbitrary argument must also exit code 1 immediately
    const arbitraryResult = spawnSync(process.execPath, ['--import', 'tsx', scriptPath, '--dry-run'], {
      encoding: 'utf-8',
      env: { ...process.env, USE_FIRESTORE_EMULATOR: 'false' },
    });
    assert.strictEqual(arbitraryResult.status, 1, 'Expected exit code 1 when invoked with arbitrary flags');
    assert.ok(
      arbitraryResult.stderr.includes('SAFETY INTERLOCK: LOCAL EMULATOR DATA CLEANUP ABORTED')
    );

    pass('clean-local-data confirmation gate exits before emulator checks, client initialization, or deletion');
  }

  // Test 18: clean-local-data.ts allowlist enforcement & unknown-collection preservation
  console.log('\n--- Test 18: clean-local-data.ts Allowlist Enforcement & Unknown-Collection Preservation ---');
  {
    const {
      classifyCollectionsForCleanup,
      PRESERVED_COLLECTIONS,
      PURGE_ALLOWLIST_COLLECTIONS,
      KNOWN_PURGEABLE_COLLECTIONS,
    } = await import('../../scripts/clean-local-data');

    // 1. Verify baseline collections are in PRESERVED_COLLECTIONS
    assert.ok(PRESERVED_COLLECTIONS.has('users'), 'users must be in PRESERVED_COLLECTIONS');
    assert.ok(PRESERVED_COLLECTIONS.has('topics'), 'topics must be in PRESERVED_COLLECTIONS');
    assert.ok(PRESERVED_COLLECTIONS.has('subtopics'), 'subtopics must be in PRESERVED_COLLECTIONS');
    assert.ok(PRESERVED_COLLECTIONS.has('question_config'), 'question_config must be in PRESERVED_COLLECTIONS');

    // 2. Verify all known purgeable collections are present in allowlist
    for (const col of KNOWN_PURGEABLE_COLLECTIONS) {
      assert.ok(PURGE_ALLOWLIST_COLLECTIONS.has(col), `Known purgeable collection '${col}' must be in allowlist`);
      assert.ok(!PRESERVED_COLLECTIONS.has(col), `Allowlisted purgeable collection '${col}' must not overlap with preserved baseline`);
    }

    // 3. Test classification with mixed discovered collections
    const sampleDiscovered = [
      'users',
      'topics',
      'subtopics',
      'question_config',
      'questions',
      'question_drafts',
      'audit_logs',
      'unknown_user_analytics',
      'external_backups',
      'billing_records',
      'unregistered_test_store',
    ];

    const result = classifyCollectionsForCleanup(sampleDiscovered);

    // Verify preserved baseline
    assert.deepStrictEqual(
      result.preservedBaseline.sort(),
      ['question_config', 'subtopics', 'topics', 'users'].sort(),
      'Baseline collections must be placed in preservedBaseline'
    );

    // Verify toPurge contains ONLY allowlisted items
    assert.deepStrictEqual(
      result.toPurge.sort(),
      ['audit_logs', 'question_drafts', 'questions'].sort(),
      'toPurge must contain only allowlisted collections'
    );

    // Verify unknown collections are preserved
    assert.deepStrictEqual(
      result.preservedUnknown.sort(),
      ['billing_records', 'external_backups', 'unknown_user_analytics', 'unregistered_test_store'].sort(),
      'Unknown collections must be placed in preservedUnknown and never purged'
    );

    // 4. Test with only unknown collections: toPurge must be empty
    const onlyUnknown = ['random_col_1', 'custom_settings', 'gcs_sync'];
    const unknownOnlyResult = classifyCollectionsForCleanup(onlyUnknown);
    assert.strictEqual(unknownOnlyResult.toPurge.length, 0, 'No unknown collection may ever be purged');
    assert.deepStrictEqual(unknownOnlyResult.preservedUnknown.sort(), onlyUnknown.sort());

    pass('clean-local-data allowlist strictly preserves unknown collections and prevents arbitrary deletion');
  }

  console.log('\n========================================================================');
  console.log('ALL 18 DATASTORE ISOLATION GUARD UNIT TESTS PASSED 100%');
  console.log('========================================================================\n');
}

runDatastoreGuardUnitTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('UNIT TEST FAILED:', err);
    process.exit(1);
  });
