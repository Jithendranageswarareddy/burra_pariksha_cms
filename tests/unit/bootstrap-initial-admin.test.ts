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
      ])
    );

    assert.strictEqual(run3.exitCode, BOOTSTRAP_EXIT_SUCCESS, 'Resend success must exit with code 0');
    assert(run3.output.all.includes('STATUS: RESEND_SUCCESS (Exit Code 0)'), 'Must indicate RESEND_SUCCESS');
    assert.strictEqual(deliveredEmails.includes('first.admin@burrapariksha.com'), true);
    assert.strictEqual(inMemUsers.size, 1, 'Resend must NEVER create duplicate users');

    console.log('✓ Test 3 PASSED: Resend recovery dispatches email without duplicate user creation.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 4: Resend Cannot Target Mismatched Email (Exit Code 1)
    // --------------------------------------------------------------------------
    console.log('[Test 4] Testing Resend Target Email Mismatch Rejection (Exit Code 1)...');
    deliveredEmails = [];
    const run4 = await captureOutput(() =>
      runBootstrap([
        '--email=different.user@burrapariksha.com',
        '--resend',
      ])
    );

    assert.strictEqual(run4.exitCode, BOOTSTRAP_EXIT_FATAL, 'Resend with mismatched email must exit with code 1');
    assert(run4.output.all.includes('does not match existing administrator'));
    assert.strictEqual(deliveredEmails.length, 0, 'No email must be dispatched for mismatched resend');
    assert.strictEqual(inMemUsers.size, 1, 'User count must remain strictly 1');

    console.log('✓ Test 4 PASSED: Resend targeting different email rejected with exit code 1.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 5: Partial Success when Email Delivery Fails (Exit Code 2)
    // --------------------------------------------------------------------------
    console.log('[Test 5] Testing Partial Success when Email Delivery Fails (Exit Code 2)...');
    inMemUsers.clear();
    inMemAuthUsers.clear();
    authService.setTestEmailSender(async () => {
      return { sent: false, message: 'Failed to deliver setup email.', error: 'Firebase REST API key unauthorized (simulated network/config error)' };
    });

    const run5 = await captureOutput(() =>
      runBootstrap([
        '--email=partial.admin@burrapariksha.com',
        '--name=Partial Admin',
      ])
    );

    assert.strictEqual(run5.exitCode, BOOTSTRAP_EXIT_PARTIAL_SUCCESS, 'Partial success must exit with code 2');
    assert(run5.output.all.includes('STATUS: PARTIAL_SUCCESS (Exit Code 2)'), 'Must indicate PARTIAL_SUCCESS');
    assert(run5.output.all.includes('Setup email delivery failed'), 'Must truthfully report failure reason');
    assert(run5.output.all.includes('--resend'), 'Must instruct operator on recovery using --resend');
    assert.strictEqual(inMemUsers.size, 1, 'Administrator profile must be preserved in Firestore');
    assert(!run5.output.all.includes('oobCode'), 'Zero link exposure in partial success output');

    console.log('✓ Test 5 PASSED: Partial success truthful reporting and exit code 2 verified.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 6: Re-trying Resend after Email Delivery Failure (Exit Code 0)
    // --------------------------------------------------------------------------
    console.log('[Test 6] Testing Recovery Re-run of Resend after Fixing Configuration...');
    authService.setTestEmailSender(async (email) => {
      deliveredEmails.push(email);
      return { sent: true, message: `Delivered to ${email}` };
    });

    const run6 = await captureOutput(() =>
      runBootstrap([
        '--email=partial.admin@burrapariksha.com',
        '--resend',
      ])
    );

    assert.strictEqual(run6.exitCode, BOOTSTRAP_EXIT_SUCCESS, 'Recovered resend must exit with code 0');
    assert(run6.output.all.includes('STATUS: RESEND_SUCCESS (Exit Code 0)'), 'Must indicate RESEND_SUCCESS');
    assert.strictEqual(inMemUsers.size, 1, 'Profile count must remain exactly 1');

    console.log('✓ Test 6 PASSED: Post-recovery resend completes successfully without manual database edit.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 7: Fatal Auth Outage Rejection (Exit Code 1)
    // --------------------------------------------------------------------------
    console.log('[Test 7] Testing Fail-Closed on Firebase Outage (Exit Code 1)...');
    inMemUsers.clear();
    mockAdminAuthAvailable = false;

    const run7 = await captureOutput(() =>
      runBootstrap([
        '--email=outage.admin@burrapariksha.com',
        '--name=Outage Admin',
      ])
    );

    assert.strictEqual(run7.exitCode, BOOTSTRAP_EXIT_FATAL, 'Firebase outage must exit with code 1');
    assert(run7.output.all.includes('Exit Code 1'), 'Must announce Exit Code 1');
    assert.strictEqual(inMemUsers.size, 0, 'Must NOT create profile when Auth is unavailable');
    mockAdminAuthAvailable = true;

    console.log('✓ Test 7 PASSED: Firebase outage fails closed with exit code 1 and no Firestore writes.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 8: Missing Environment Secret Fail-Closed (Exit Code 1)
    // --------------------------------------------------------------------------
    console.log('[Test 8] Testing Rejection when BOOTSTRAP_ADMIN_SECRET is Missing (Exit Code 1)...');
    const savedSecret = process.env.BOOTSTRAP_ADMIN_SECRET;
    delete process.env.BOOTSTRAP_ADMIN_SECRET;

    const run8 = await captureOutput(() =>
      runBootstrap([
        '--email=first.admin@burrapariksha.com',
        '--name=First Admin',
      ])
    );

    assert.strictEqual(run8.exitCode, BOOTSTRAP_EXIT_FATAL, 'Missing secret must exit with code 1');
    assert(run8.output.all.includes('Administrative bootstrap secret is missing, unconfigured, or insufficient'));
    assert.strictEqual(inMemUsers.size, 0, 'Zero users must be created when secret is missing');
    process.env.BOOTSTRAP_ADMIN_SECRET = savedSecret;

    console.log('✓ Test 8 PASSED: Missing environment secret rejected with exit code 1.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 9: CLI Secret Flag Rejection (--secret=value) (Exit Code 1)
    // --------------------------------------------------------------------------
    console.log('[Test 9] Testing Rejection of CLI --secret=value Argument...');
    const sensitiveSecretValue1 = 'super-secret-vault-token-xyz';
    const preCount9 = inMemUsers.size;

    const run9 = await captureOutput(() =>
      runBootstrap([
        '--email=secret.test@burrapariksha.com',
        '--name=Secret Test',
        `--secret=${sensitiveSecretValue1}`,
      ])
    );

    assert.strictEqual(run9.exitCode, BOOTSTRAP_EXIT_FATAL, '--secret=value must exit with code 1');
    assert(!run9.output.all.includes(sensitiveSecretValue1), 'Output must NEVER echo the secret value');
    assert(run9.output.all.includes('Disallowed argument "--secret" detected'), 'Must state disallowed argument');
    assert.strictEqual(inMemUsers.size, preCount9, 'No profile must be created');

    console.log('✓ Test 9 PASSED: --secret=value explicitly rejected with exit code 1 without echoing value.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 10: CLI Secret Flag Rejection (--secret value) (Exit Code 1)
    // --------------------------------------------------------------------------
    console.log('[Test 10] Testing Rejection of CLI --secret value Argument...');
    const sensitiveSecretValue2 = 'another-sensitive-secret-arg';
    const preCount10 = inMemUsers.size;

    const run10 = await captureOutput(() =>
      runBootstrap([
        '--email=secret.test2@burrapariksha.com',
        '--name=Secret Test 2',
        '--secret',
        sensitiveSecretValue2,
      ])
    );

    assert.strictEqual(run10.exitCode, BOOTSTRAP_EXIT_FATAL, '--secret value must exit with code 1');
    assert(!run10.output.all.includes(sensitiveSecretValue2), 'Output must NEVER echo the secret value');
    assert(run10.output.all.includes('Disallowed argument "--secret" detected'), 'Must state disallowed argument');
    assert.strictEqual(inMemUsers.size, preCount10, 'No profile must be created');

    console.log('✓ Test 10 PASSED: --secret value explicitly rejected with exit code 1 without echoing value.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 11: CLI Password Parameter Rejection (--password=value) (Exit Code 1)
    // --------------------------------------------------------------------------
    console.log('[Test 11] Testing Rejection of CLI --password=value Argument...');
    const sensitivePassword1 = 'SuperSecretPlainPassword987!#';
    const preCount11 = inMemUsers.size;
    deliveredEmails = [];

    const run11 = await captureOutput(() =>
      runBootstrap([
        '--email=pwd.test1@burrapariksha.com',
        '--name=Password Test 1',
        `--password=${sensitivePassword1}`,
      ])
    );

    assert.strictEqual(run11.exitCode, BOOTSTRAP_EXIT_FATAL, '--password=value must exit with code 1');
    assert(!run11.output.all.includes(sensitivePassword1), 'Output must NEVER echo the password value');
    assert(run11.output.all.includes('Disallowed argument "--password" detected'), 'Must state disallowed argument');
    assert.strictEqual(inMemUsers.size, preCount11, 'No profile must be created');
    assert.strictEqual(deliveredEmails.length, 0, 'No email must be dispatched');

    console.log('✓ Test 11 PASSED: --password=value explicitly rejected with exit code 1 without echoing value.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 12: CLI Password Parameter Rejection (--password value) (Exit Code 1)
    // --------------------------------------------------------------------------
    console.log('[Test 12] Testing Rejection of CLI --password value Argument...');
    const sensitivePassword2 = 'AnotherSensitivePlainPassword456!#';
    const preCount12 = inMemUsers.size;
    deliveredEmails = [];

    const run12 = await captureOutput(() =>
      runBootstrap([
        '--email=pwd.test2@burrapariksha.com',
        '--name=Password Test 2',
        '--password',
        sensitivePassword2,
      ])
    );

    assert.strictEqual(run12.exitCode, BOOTSTRAP_EXIT_FATAL, '--password value must exit with code 1');
    assert(!run12.output.all.includes(sensitivePassword2), 'Output must NEVER echo the password value');
    assert(run12.output.all.includes('Disallowed argument "--password" detected'), 'Must state disallowed argument');
    assert.strictEqual(inMemUsers.size, preCount12, 'No profile must be created');
    assert.strictEqual(deliveredEmails.length, 0, 'No email must be dispatched');

    console.log('✓ Test 12 PASSED: --password value explicitly rejected with exit code 1 without echoing value.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 13: Unsupported Arguments Rejection (Exit Code 1)
    // --------------------------------------------------------------------------
    console.log('[Test 13] Testing Rejection of Unsupported Arguments...');
    const preCount13 = inMemUsers.size;

    const run13a = await captureOutput(() =>
      runBootstrap([
        '--email=unsupported@burrapariksha.com',
        '--role=SUPERADMIN_INJECTION',
      ])
    );
    assert.strictEqual(run13a.exitCode, BOOTSTRAP_EXIT_FATAL);
    assert(!run13a.output.all.includes('SUPERADMIN_INJECTION'), 'Must not echo unsupported argument value');
    assert(run13a.output.all.includes('Unsupported argument "--role" detected'));
    assert.strictEqual(inMemUsers.size, preCount13, 'No profile must be created');

    const run13b = await captureOutput(() =>
      runBootstrap([
        '--email=unsupported@burrapariksha.com',
        'unexpected_positional_token',
      ])
    );
    assert.strictEqual(run13b.exitCode, BOOTSTRAP_EXIT_FATAL);
    assert(run13b.output.all.includes('Unsupported argument "unexpected_positional_token" detected'));
    assert.strictEqual(inMemUsers.size, preCount13, 'No profile must be created');

    console.log('✓ Test 13 PASSED: Unsupported and malformed arguments fail closed with exit code 1.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 14: UID Collision Fail-Safe (Exit Code 1)
    // --------------------------------------------------------------------------
    console.log('[Test 14] Testing UID Collision Prevention in CLI Bootstrap...');
    inMemUsers.clear();
    const collidedUid = 'fb_collided_existing_employee_uid';
    inMemAuthUsers.set(collidedUid, { uid: collidedUid, email: 'collision.candidate@burrapariksha.com' });
    inMemUsers.set('usr_existing_employee', {
      id: 'usr_existing_employee',
      name: 'Existing Employee',
      email: 'employee@burrapariksha.com',
      role: UserRole.VIDEO_EDITOR,
      roles: [UserRole.VIDEO_EDITOR],
      firebaseUid: collidedUid,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const run14 = await captureOutput(() =>
      runBootstrap([
        '--email=collision.candidate@burrapariksha.com',
        '--name=Collision Candidate',
      ])
    );

    assert.strictEqual(run14.exitCode, BOOTSTRAP_EXIT_FATAL, 'UID collision must exit with code 1');
    assert(run14.output.all.includes('already linked to user profile'));
    assert.strictEqual(inMemUsers.size, 1, 'No new profile must be created on UID collision');
    const untouchedEmployee = inMemUsers.get('usr_existing_employee');
    assert.strictEqual(untouchedEmployee?.role, UserRole.VIDEO_EDITOR, 'Existing employee role must remain untouched');

    console.log('✓ Test 14 PASSED: UID collision fails closed with exit code 1 and preserves existing identities.');
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
  process.exit(0);
}

runBootstrapTestSuite();
