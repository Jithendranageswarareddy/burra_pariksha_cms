import { authService } from '../lib/services/auth.service';
import { usersRepository } from '../lib/repositories/users.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import crypto from 'crypto';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] Test ${passed + failed}: ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] Test ${passed + failed}: ${message}`);
  }
}

export async function runPhase11aVerification() {
  console.log('\n======================================================');
  console.log('BURRA PARIKSHA CMS — PHASE 11A VERIFICATION');
  console.log('Authentication Foundation & Credential Security');
  console.log('======================================================\n');

  // Ensure test user exists
  let testUser = await usersRepository.findById('USR-001');
  if (!testUser) {
    const now = new Date().toISOString();
    testUser = await usersRepository.appendRecord({
      id: 'USR-001',
      name: 'Ravi Kumar',
      email: 'ravi.admin@burrapariksha.org',
      role: 'ADMIN',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Ensure inactive test user exists
  let inactiveUser = await usersRepository.findById('USR-999');
  if (!inactiveUser) {
    const now = new Date().toISOString();
    inactiveUser = await usersRepository.appendRecord({
      id: 'USR-999',
      name: 'Inactive Staff',
      email: 'inactive.staff@burrapariksha.org',
      role: 'REVIEWER',
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await usersRepository.updateRecord('USR-999', { isActive: false });
  }

  // ----------------------------------------------------------------
  // Section 1: Password Hashing & Crypto Verifications
  // ----------------------------------------------------------------
  console.log('\n--- Section 1: Password Hashing & Crypto Integrity ---');

  const password = 'SuperSecurePassword2026!';
  const hash1 = await authService.hashPassword(password);
  const hash2 = await authService.hashPassword(password);

  assert(typeof hash1 === 'string' && hash1.startsWith('scrypt$v1$'), 'Password hash has versioned scrypt$v1$ prefix');
  assert(hash1 !== password, 'Password hash is not plaintext');
  assert(hash1 !== hash2, 'Password hashing generates unique salts for identical passwords');

  const verifySuccess = await authService.verifyPassword(password, hash1);
  assert(verifySuccess === true, 'Correct password verifies successfully against scrypt hash');

  const verifyFailWrong = await authService.verifyPassword('WrongPassword123!', hash1);
  assert(verifyFailWrong === false, 'Incorrect password fails verification safely');

  const verifyFailMalformed = await authService.verifyPassword(password, 'invalid-hash-structure');
  assert(verifyFailMalformed === false, 'Malformed hash structure fails safely without throwing');

  // ----------------------------------------------------------------
  // Section 2: Stateless HMAC-SHA256 Session Token
  // ----------------------------------------------------------------
  console.log('\n--- Section 2: Session Token Security & Invariants ---');

  const token = authService.generateSessionToken({
    userId: 'USR-001',
    name: 'Ravi Kumar',
    role: 'ADMIN',
  });

  assert(typeof token === 'string' && token.includes('.'), 'Session token format is payload.signature');

  const payload = authService.verifySessionToken(token);
  assert(payload !== null && payload.userId === 'USR-001' && payload.role === 'ADMIN', 'Valid session token decodes and verifies signature');

  // Tampered payload
  const parts = token.split('.');
  const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'USR-001', role: 'ADMIN', expiresAt: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  const tamperedToken = `${tamperedPayload}.${parts[1]}`;
  const tamperedResult = authService.verifySessionToken(tamperedToken);
  assert(tamperedResult === null, 'Tampered token payload fails signature verification');

  // Expired token
  const expiredPayloadBase64 = Buffer.from(JSON.stringify({
    userId: 'USR-001',
    name: 'Ravi Kumar',
    role: 'ADMIN',
    issuedAt: Math.floor(Date.now() / 1000) - 7200,
    expiresAt: Math.floor(Date.now() / 1000) - 3600,
  })).toString('base64url');
  
  const secret = process.env.SESSION_SECRET || 'burra-pariksha-dev-session-secret-not-for-production';
  const expiredSig = crypto.createHmac('sha256', secret).update(expiredPayloadBase64).digest('base64url');
  const expiredToken = `${expiredPayloadBase64}.${expiredSig}`;
  const expiredResult = authService.verifySessionToken(expiredToken);
  assert(expiredResult === null, 'Expired session token fails verification');

  // ----------------------------------------------------------------
  // Section 3: User Authentication Workflow
  // ----------------------------------------------------------------
  console.log('\n--- Section 3: User Authentication & Audit Workflow ---');

  // Set explicit hash for USR-001
  const customPass = 'AdminSecret2026!';
  const customHash = await authService.hashPassword(customPass);
  await usersRepository.updateRecord('USR-001', { password_hash: customHash });

  // Successful Login
  const loginSuccess = await authService.login('USR-001', customPass);
  assert(loginSuccess.success === true && !!loginSuccess.token && !!loginSuccess.user, 'Active user authenticates successfully with valid password');
  assert((loginSuccess.user as any)?.password_hash === undefined, 'Authenticated user response excludes password_hash');
  assert(loginSuccess.user?.id === 'USR-001' && loginSuccess.user?.role === 'ADMIN', 'Sanitized user identity matches authenticated record');

  // Invalid Password Login
  const loginBadPass = await authService.login('USR-001', 'BadPassword999!');
  assert(loginBadPass.success === false && !loginBadPass.token, 'Login fails safely for invalid password');

  // Inactive User Login
  const loginInactive = await authService.login('USR-999', 'AnyPassword123!');
  assert(loginInactive.success === false && !loginInactive.token, 'Login fails for inactive user account');

  // Nonexistent User Login
  const loginMissing = await authService.login('USR-NONEXISTENT', 'AnyPassword123!');
  assert(loginMissing.success === false && !loginMissing.token, 'Login fails safely for nonexistent user');

  // Updated last_login_at
  const updatedUser = await usersRepository.findById('USR-001');
  assert(!!updatedUser?.last_login_at, 'User last_login_at timestamp is persisted upon successful login');

  // Logout Workflow
  const logoutResult = await authService.logout('USR-001', 'Ravi Kumar');
  assert(logoutResult.success === true, 'Logout succeeds cleanly');

  // Audit Log Sanitization Check
  const allLogs = await auditLogRepository.findAll();
  const auditLogs = allLogs.filter(l => l.actorId === 'USR-001');
  const loginLogs = auditLogs.filter(l => l.action === 'LOGIN_SUCCESS' || l.action === 'LOGOUT');
  assert(loginLogs.length >= 2, 'Authentication audit events (LOGIN_SUCCESS, LOGOUT) recorded in audit log');

  const rawLogString = JSON.stringify(loginLogs);
  assert(!rawLogString.includes(customPass), 'Audit logs do not contain raw passwords');
  assert(!rawLogString.includes(customHash), 'Audit logs do not contain password hashes');
  assert(!rawLogString.includes(loginSuccess.token || 'non-existent-token-xyz'), 'Audit logs do not contain session tokens');

  // Clean up: Reset USR-001 hash for seamless downstream suite execution
  const defaultHash = await authService.hashPassword('password123');
  await usersRepository.updateRecord('USR-001', { password_hash: defaultHash });

  // ----------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`PHASE 11A VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    throw new Error(`Phase 11A Verification failed with ${failed} assertion errors.`);
  }

  return { passed, total: passed + failed, success: failed === 0 };
}

if (process.argv[1]?.endsWith('phase11a-verification.ts')) {
  runPhase11aVerification().catch((err) => {
    console.error('Execution failure:', err);
    process.exit(1);
  });
}
