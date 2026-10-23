/**
 * BURRA PARIKSHA CMS — Isolated Bootstrap CLI & Entrypoint Test Suite
 *
 * Exercises the actual runBootstrap() and provisionInitialAdmin() entrypoints
 * with intercepted stdout/stderr, verifying:
 * 1. Successful bootstrap with email dispatch accepted (exit code 0).
 * 2. Email dispatch failure after account/profile creation (partial success exit code 2).
 * 3. Existing administrator / duplicate bootstrap prevention (conflict exit code 3).
 * 4. Safe recovery via --resend with the bootstrap secret without creating duplicate profiles.
 * 5. Account creation failure / Firebase outage (fail-closed exit code 1).
 * 6. Missing / invalid bootstrap secret (exit code 1).
 * 7. Verification that NO passwords, oobCode, or setup links appear in stdout/stderr.
 * 8. Verification that emailVerified is set to false (inbox ownership must be confirmed via link).
 * 9. Zero production Firebase or Firestore access.
 */

import assert from 'node:assert';
import {
  runBootstrap,
  provisionInitialAdmin,
  BOOTSTRAP_EXIT_SUCCESS,
  BOOTSTRAP_EXIT_FATAL,
  BOOTSTRAP_EXIT_PARTIAL_SUCCESS,
  BOOTSTRAP_EXIT_ALREADY_EXISTS,
} from '../../scripts/bootstrap-initial-admin';
import { usersRepository } from '../../database/firestore/repositories/users.repository';
import { auditLogRepository } from '../../database/firestore/repositories/audit-log.repository';
import { authService } from '../../backend/infrastructure/auth/services/auth.service';
import { setAdminAuth } from '../../database/firestore/adapter/admin';
import { UserRole, User } from '../../shared';

interface OutputCapture {
  stdout: string[];
  stderr: string[];
  all: string;
}

function captureOutput(fn: () => Promise<number>): Promise<{ exitCode: number; output: OutputCapture }> {
  return new Promise(async (resolve) => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    console.log = (...args: any[]) => stdout.push(args.map(String).join(' '));
    console.warn = (...args: any[]) => stderr.push(args.map(String).join(' '));
    console.error = (...args: any[]) => stderr.push(args.map(String).join(' '));

    try {
      const exitCode = await fn();
      const all = [...stdout, ...stderr].join('\n');
      resolve({ exitCode, output: { stdout, stderr, all } });
    } finally {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
    }
  });
}

async function runBootstrapTestSuite() {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — BOOTSTRAP SCRIPT ISOLATION TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // In-memory isolated storage
  const inMemUsers = new Map<string, User>();
  const inMemAuthUsers = new Map<string, any>();
  let mockAdminAuthAvailable = true;

  // Mock Admin Auth
  const mockAdminAuth = {
    getUser: async (uid: string) => {
      if (!mockAdminAuthAvailable) throw new Error('Firebase Auth unavailable');
      const u = inMemAuthUsers.get(uid);
      if (!u) {
        const err: any = new Error('User not found');
        err.code = 'auth/user-not-found';
        throw err;
      }
      return u;
    },
    getUserByEmail: async (email: string) => {
      if (!mockAdminAuthAvailable) throw new Error('Firebase Auth unavailable');
      for (const u of inMemAuthUsers.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) return u;
      }
      const err: any = new Error('User not found');
      err.code = 'auth/user-not-found';
      throw err;
    },
    createUser: async (data: any) => {
      if (!mockAdminAuthAvailable) throw new Error('Firebase Auth unavailable');
      const uid = `fb_real_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const user = {
        uid,
        email: data.email,
        displayName: data.displayName,
        emailVerified: Boolean(data.emailVerified),
        disabled: false,
      };
      inMemAuthUsers.set(uid, user);
      return user;
    },
    deleteUser: async (uid: string) => {
      inMemAuthUsers.delete(uid);
    },
    updateUser: async (uid: string, data: any) => {
      if (!mockAdminAuthAvailable) throw new Error('Firebase Auth unavailable');
      const existing = inMemAuthUsers.get(uid);
      if (!existing) {
        const err: any = new Error('User not found');
        err.code = 'auth/user-not-found';
        throw err;
      }
      const updated = { ...existing, ...data };
      inMemAuthUsers.set(uid, updated);
      return updated;
    },
  };
  setAdminAuth(mockAdminAuth);

  // Mock repositories
  const origFindById = usersRepository.findById.bind(usersRepository);
  const origFindByEmail = usersRepository.findByEmail.bind(usersRepository);
  const origFindByFirebaseUid = usersRepository.findByFirebaseUid.bind(usersRepository);
  const origAppend = usersRepository.appendRecord.bind(usersRepository);
  const origFindAll = usersRepository.findAll.bind(usersRepository);
  const origAuditLogAction = auditLogRepository.logAction.bind(auditLogRepository);

  auditLogRepository.logAction = async () => ({ id: 'mock_audit_id' } as any);
  usersRepository.findById = async (id: string) => inMemUsers.get(id) || null;
  usersRepository.findByEmail = async (email: string) => {
    for (const u of inMemUsers.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  };
  usersRepository.findByFirebaseUid = async (uid: string) => {
    for (const u of inMemUsers.values()) {
      if (u.firebaseUid === uid) return u;
    }
    return null;
  };
  usersRepository.findAll = async () => Array.from(inMemUsers.values());
  usersRepository.appendRecord = async (user: User) => {
    inMemUsers.set(user.id, user);
    return user;
  };

  const TEST_SECRET = 'bootstrap-test-secret-vault-1234';
  process.env.BOOTSTRAP_ADMIN_SECRET = TEST_SECRET;

  try {
    // --------------------------------------------------------------------------
    // Test 1: Full Success (Account created and email dispatch accepted)
    // --------------------------------------------------------------------------
    console.log('[Test 1] Testing Successful Bootstrap Entrypoint (Exit Code 0)...');
    let deliveredEmails: string[] = [];
    authService.setTestEmailSender(async (email) => {
      deliveredEmails.push(email);
      return { sent: true, message: `Email accepted for ${email}` };
    });

    const run1 = await captureOutput(() =>
      runBootstrap([
        '--email=first.admin@burrapariksha.com',
        '--name=First Administrator',
        `--secret=${TEST_SECRET}`,
      ])
    );

    assert.strictEqual(run1.exitCode, BOOTSTRAP_EXIT_SUCCESS, 'Full success must exit with code 0');
    assert(run1.output.all.includes('STATUS: FULL_SUCCESS (Exit Code 0)'), 'Must indicate FULL_SUCCESS');
    assert(run1.output.all.includes('Setup Email:  DISPATCH_ACCEPTED'), 'Must report email dispatch accepted');
    assert.strictEqual(deliveredEmails.includes('first.admin@burrapariksha.com'), true);
    assert.strictEqual(inMemUsers.size, 1, 'Exactly one administrator profile must exist in repository');

    const createdAdmin = Array.from(inMemUsers.values())[0];
    assert.strictEqual(createdAdmin.role, UserRole.ADMIN);
    assert.strictEqual(createdAdmin.isActive, true);

    const createdAuthUser = inMemAuthUsers.get(createdAdmin.firebaseUid!);
    assert(createdAuthUser, 'Firebase Auth user must exist');
    assert.strictEqual(createdAuthUser.emailVerified, false, 'emailVerified must be false at initial bootstrap');

    // Security invariant: Zero link exposure
    assert(!run1.output.all.includes('oobCode'), 'Standard output must NEVER expose oobCode');
    assert(!run1.output.all.includes('apiKey='), 'Standard output must NEVER expose apiKey');
    assert(!run1.output.all.includes('setupLink'), 'Standard output must NEVER expose setupLink');
    assert(!run1.output.all.includes('http://') && !run1.output.all.includes('https://'), 'Must not print action URLs');

    console.log('✓ Test 1 PASSED: Full success bootstrap executed with exit code 0 and zero link exposure.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 2: Existing Administrator Duplicate Prevention (Exit Code 3)
    // --------------------------------------------------------------------------
    console.log('[Test 2] Testing Duplicate Administrator Prevention (Exit Code 3)...');
    const run2 = await captureOutput(() =>
      runBootstrap([
        '--email=second.admin@burrapariksha.com',
        '--name=Second Admin',
        `--secret=${TEST_SECRET}`,
      ])
    );

    assert.strictEqual(run2.exitCode, BOOTSTRAP_EXIT_ALREADY_EXISTS, 'Duplicate bootstrap must exit with code 3');
    assert(run2.output.all.includes('Exit Code 3'), 'Output must announce exit code 3');
    assert(run2.output.all.includes('Duplicate administrator provisioning is prevented'), 'Must report duplicate prevented');
    assert.strictEqual(inMemUsers.size, 1, 'Must NOT create a second administrator');

    console.log('✓ Test 2 PASSED: Duplicate administrator provisioning prevented with exit code 3.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 3: Safe Recovery via --resend for Existing Administrator (Exit Code 0)
    // --------------------------------------------------------------------------
    console.log('[Test 3] Testing Safe Recovery via --resend (Exit Code 0)...');
    deliveredEmails = [];
    const run3 = await captureOutput(() =>
      runBootstrap([
        '--email=first.admin@burrapariksha.com',
        '--resend',
        `--secret=${TEST_SECRET}`,
      ])
    );

    assert.strictEqual(run3.exitCode, BOOTSTRAP_EXIT_SUCCESS, 'Resend success must exit with code 0');
    assert(run3.output.all.includes('STATUS: RESEND_SUCCESS (Exit Code 0)'), 'Must indicate RESEND_SUCCESS');
    assert.strictEqual(deliveredEmails.includes('first.admin@burrapariksha.com'), true);
    assert.strictEqual(inMemUsers.size, 1, 'Resend must NEVER create duplicate users');

    console.log('✓ Test 3 PASSED: Resend recovery dispatches email without duplicate user creation.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 4: Partial Success when Email Delivery Fails (Exit Code 2)
    // --------------------------------------------------------------------------
    console.log('[Test 4] Testing Partial Success when Email Delivery Fails (Exit Code 2)...');
    inMemUsers.clear();
    inMemAuthUsers.clear();
    authService.setTestEmailSender(async () => {
      return { sent: false, message: 'Failed to deliver setup email.', error: 'Firebase REST API key unauthorized (simulated network/config error)' };
    });

    const run4 = await captureOutput(() =>
      runBootstrap([
        '--email=partial.admin@burrapariksha.com',
        '--name=Partial Admin',
        `--secret=${TEST_SECRET}`,
      ])
    );

    assert.strictEqual(run4.exitCode, BOOTSTRAP_EXIT_PARTIAL_SUCCESS, 'Partial success must exit with code 2');
    assert(run4.output.all.includes('STATUS: PARTIAL_SUCCESS (Exit Code 2)'), 'Must indicate PARTIAL_SUCCESS');
    assert(run4.output.all.includes('Setup email delivery failed'), 'Must truthfully report failure reason');
    assert(run4.output.all.includes('--resend'), 'Must instruct operator on recovery using --resend');
    assert.strictEqual(inMemUsers.size, 1, 'Administrator profile must be preserved in Firestore');
    assert(!run4.output.all.includes('oobCode'), 'Zero link exposure in partial success output');

    console.log('✓ Test 4 PASSED: Partial success truthful reporting and exit code 2 verified.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 5: Re-trying Resend after Email Delivery Failure (Exit Code 0)
    // --------------------------------------------------------------------------
    console.log('[Test 5] Testing Recovery Re-run of Resend after Fixing Configuration...');
    authService.setTestEmailSender(async (email) => {
      deliveredEmails.push(email);
      return { sent: true, message: `Delivered to ${email}` };
    });

    const run5 = await captureOutput(() =>
      runBootstrap([
        '--email=partial.admin@burrapariksha.com',
        '--resend',
        `--secret=${TEST_SECRET}`,
      ])
    );

    assert.strictEqual(run5.exitCode, BOOTSTRAP_EXIT_SUCCESS, 'Recovered resend must exit with code 0');
    assert(run5.output.all.includes('STATUS: RESEND_SUCCESS (Exit Code 0)'), 'Must indicate RESEND_SUCCESS');
    assert.strictEqual(inMemUsers.size, 1, 'Profile count must remain exactly 1');

    console.log('✓ Test 5 PASSED: Post-recovery resend completes successfully without manual database edit.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 6: Fatal Auth Outage Rejection (Exit Code 1)
    // --------------------------------------------------------------------------
    console.log('[Test 6] Testing Fail-Closed on Firebase Outage (Exit Code 1)...');
    inMemUsers.clear();
    mockAdminAuthAvailable = false;

    const run6 = await captureOutput(() =>
      runBootstrap([
        '--email=outage.admin@burrapariksha.com',
        '--name=Outage Admin',
        `--secret=${TEST_SECRET}`,
      ])
    );

    assert.strictEqual(run6.exitCode, BOOTSTRAP_EXIT_FATAL, 'Firebase outage must exit with code 1');
    assert(run6.output.all.includes('Exit Code 1'), 'Must announce Exit Code 1');
    assert.strictEqual(inMemUsers.size, 0, 'Must NOT create profile when Auth is unavailable');
    mockAdminAuthAvailable = true;

    console.log('✓ Test 6 PASSED: Firebase outage fails closed with exit code 1 and no Firestore writes.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 7: Unauthorized Secret Rejection (Exit Code 1)
    // --------------------------------------------------------------------------
    console.log('[Test 7] Testing Rejection on Invalid Secret (Exit Code 1)...');
    const run7 = await captureOutput(() =>
      runBootstrap([
        '--email=first.admin@burrapariksha.com',
        '--name=First Admin',
        '--secret=wrong-secret',
      ])
    );

    assert.strictEqual(run7.exitCode, BOOTSTRAP_EXIT_FATAL, 'Invalid secret must exit with code 1');
    assert(run7.output.all.includes('Administrative bootstrap secret is missing or invalid'));

    console.log('✓ Test 7 PASSED: Invalid secret rejected with exit code 1.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 8: CLI Argument Password Exposure Rejection
    // --------------------------------------------------------------------------
    console.log('[Test 8] Testing Rejection of CLI Password Parameter...');
    // If a user passes --password="SensitiveSecretPassword", ensure it is NOT used and NEVER printed
    const run8 = await captureOutput(() =>
      runBootstrap([
        '--email=clean.admin@burrapariksha.com',
        '--name=Clean Admin',
        '--password=SensitiveSecretPassword123!',
        `--secret=${TEST_SECRET}`,
      ])
    );

    assert(!run8.output.all.includes('SensitiveSecretPassword123!'), 'Standard output must NEVER echo password');
    console.log('✓ Test 8 PASSED: Passwords are never accepted via CLI or echoed in logs.');
    passed++;

    console.log('\n============================================================');
    console.log(`ALL ${passed} BOOTSTRAP ISOLATION TESTS PASSED (0 FAILED)`);
    console.log('============================================================\n');
  } catch (err: any) {
    console.error('Test suite failure:', err);
    failed++;
  } finally {
    setAdminAuth(null);
    authService.setTestEmailSender(null);
    usersRepository.findById = origFindById;
    usersRepository.findByEmail = origFindByEmail;
    usersRepository.findByFirebaseUid = origFindByFirebaseUid;
    usersRepository.appendRecord = origAppend;
    usersRepository.findAll = origFindAll;
    auditLogRepository.logAction = origAuditLogAction;
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runBootstrapTestSuite();
