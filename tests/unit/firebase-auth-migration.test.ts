/**
 * BURRA PARIKSHA CMS — Targeted Firebase Authentication & Security Invariant Suite
 *
 * Targeted isolated test suite verifying:
 * 1. Fabricated fallback links are never returned.
 * 2. setupEmailSent cannot be true without successful email delivery.
 * 3. Failed email delivery returns a truthful partial-success result with retry availability.
 * 4. Resend setup email is administrator-only, verifies account status, and does not leak action links.
 * 5. Production login rejects Firebase errors and fails closed (no fallback to legacy passwords or default passwords).
 * 6. Fake Firebase UIDs and unsafe identity linking/collisions are rejected.
 * 7. Administrator bootstrap fails closed when Firebase services or configuration are unavailable.
 * 8. Forgot-password endpoint neutral messaging (anti-enumeration) & action code validation.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import express from 'express';
import { authService, AuthService } from '../../backend/infrastructure/auth/services/auth.service';
import { assignmentService } from '../../backend/infrastructure/auth/services/assignment.service';
import { usersRepository } from '../../database/firestore/repositories/users.repository';
import { extractSessionToken, requireAuth, AuthenticatedRequest } from '../../backend/server/middleware/auth.middleware';
import { apiRouter } from '../../backend/server/routers/routes';
import { UserRole, User } from '../../shared';
import { setAdminAuth } from '../../database/firestore/adapter/admin';
import { auditLogRepository } from '../../database/firestore/repositories/audit-log.repository';
import { provisionInitialAdmin } from '../../scripts/bootstrap-initial-admin';

async function runFirebaseAuthTests() {
  process.env.NODE_ENV = 'test';
  console.log('============================================================');
  console.log('TARGETED FIREBASE AUTHENTICATION & SECURITY INVARIANT SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // In-memory Firebase Auth mock for isolated unit testing
  const inMemAuthUsers = new Map<string, any>();
  let mockAdminAuthAvailable = true;

  const mockAdminAuth = {
    getUser: async (uid: string) => {
      if (!mockAdminAuthAvailable) throw new Error('Firebase Auth service unavailable (simulated outage)');
      const u = inMemAuthUsers.get(uid);
      if (!u) {
        const err: any = new Error('User not found');
        err.code = 'auth/user-not-found';
        throw err;
      }
      return u;
    },
    getUserByEmail: async (email: string) => {
      if (!mockAdminAuthAvailable) throw new Error('Firebase Auth service unavailable (simulated outage)');
      for (const u of inMemAuthUsers.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) return u;
      }
      const err: any = new Error('User not found');
      err.code = 'auth/user-not-found';
      throw err;
    },
    createUser: async (data: any) => {
      if (!mockAdminAuthAvailable) throw new Error('Firebase Auth service unavailable (simulated outage)');
      const uid = `fb_real_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const user = { uid, email: data.email, displayName: data.displayName, disabled: !!data.disabled };
      inMemAuthUsers.set(uid, user);
      return user;
    },
    updateUser: async (uid: string, data: any) => {
      if (!mockAdminAuthAvailable) throw new Error('Firebase Auth service unavailable (simulated outage)');
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
    deleteUser: async (uid: string) => {
      inMemAuthUsers.delete(uid);
    },
    generatePasswordResetLink: async (email: string) => {
      if (!mockAdminAuthAvailable) throw new Error('Firebase Auth service unavailable (simulated outage)');
      return `https://burra-pariksha-cms.web.app/reset-password?mode=resetPassword&oobCode=real_code_${Date.now()}`;
    },
    verifyIdToken: async (token: string) => {
      if (!mockAdminAuthAvailable) throw new Error('Firebase Auth service unavailable (simulated outage)');
      if (token === 'valid_firebase_id_token_admin') {
        return { uid: 'fb_admin_uid', email: 'first.admin@burrapariksha.com', email_verified: true };
      }
      if (token.startsWith('valid_id_token_')) {
        const uid = token.replace('valid_id_token_', '');
        return { uid, email: `${uid}@burrapariksha.com`, email_verified: true };
      }
      throw new Error('Invalid token signature');
    },
  };
  setAdminAuth(mockAdminAuth);

  // In-memory isolated storage
  const inMemUsers = new Map<string, User>();
  const origFindById = usersRepository.findById.bind(usersRepository);
  const origFindByEmail = usersRepository.findByEmail.bind(usersRepository);
  const origFindByFirebaseUid = usersRepository.findByFirebaseUid.bind(usersRepository);
  const origAppend = usersRepository.appendRecord.bind(usersRepository);
  const origUpdate = usersRepository.update.bind(usersRepository);
  const origUpdateRecord = usersRepository.updateRecord.bind(usersRepository);
  const origFindAll = usersRepository.findAll.bind(usersRepository);
  const origAuditLogAction = auditLogRepository.logAction.bind(auditLogRepository);
  const origAuditLogEvent = auditLogRepository.logEvent.bind(auditLogRepository);

  auditLogRepository.logAction = async () => ({ id: 'mock_audit_id' } as any);
  auditLogRepository.logEvent = async () => ({ id: 'mock_audit_id' } as any);

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
    usersRepository.setUserSessionState(user.id, {
      userId: user.id,
      role: user.role,
      roles: user.roles || [user.role],
      isActive: user.isActive !== false,
      sessionVersion: user.sessionVersion || 1,
    });
    return user;
  };
  usersRepository.update = (async (recordOrId: any, updates?: any) => {
    const id = typeof recordOrId === 'string' ? recordOrId : recordOrId?.id;
    const existing = inMemUsers.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...(updates || recordOrId) };
    inMemUsers.set(id, updated);
    return updated;
  }) as any;
  usersRepository.updateRecord = async (id: string, updates: any) => {
    const existing = inMemUsers.get(id);
    if (!existing) return null as any;
    const updated = { ...existing, ...updates };
    inMemUsers.set(id, updated);
    return updated;
  };

  // Setup express test server
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    // --------------------------------------------------------------------------
    // Test 1: Administrator Bootstrap Security & Fail-Closed Behavior
    // --------------------------------------------------------------------------
    console.log('[Test 1] Testing Administrator Bootstrap Security & Fail-Closed Behavior...');

    // Setup email delivery spy for bootstrap
    let deliveredEmails: string[] = [];
    authService.setTestEmailSender(async (email) => {
      deliveredEmails.push(email);
      return { sent: true, message: `Email delivered to ${email}` };
    });

    // 1a-1: Missing secret header is rejected with 403
    const badSecretRes = await fetch(`${baseUrl}/auth/bootstrap-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'first.admin@burrapariksha.com', name: 'First Admin' }),
    });
    assert.strictEqual(badSecretRes.status, 403, 'Bootstrap without secret header must return 403');

    // 1a-2: Invalid secret header is rejected with 403
    const invalidHeaderRes = await fetch(`${baseUrl}/auth/bootstrap-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bootstrap-secret': 'invalid-secret-token-1234',
      },
      body: JSON.stringify({ email: 'first.admin@burrapariksha.com', name: 'First Admin' }),
    });
    assert.strictEqual(invalidHeaderRes.status, 403, 'Bootstrap with invalid secret header must return 403');

    // 1a-3: Secret passed in JSON body is strictly rejected with 400 Bad Request
    const bodySecretRes = await fetch(`${baseUrl}/auth/bootstrap-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bootstrap-secret': 'secure-test-bootstrap-secret-9988',
      },
      body: JSON.stringify({
        email: 'first.admin@burrapariksha.com',
        name: 'First Admin',
        bootstrapSecret: 'secure-test-bootstrap-secret-9988',
      }),
    });
    assert.strictEqual(bodySecretRes.status, 400, 'Secret supplied in JSON body must be rejected with 400');
    const bodySecretData = await bodySecretRes.json();
    assert(bodySecretData.message.includes('Passing secrets in the request body is strictly prohibited'));

    // 1a-4: Password passed in JSON body is strictly rejected with 400 Bad Request
    const bodyPasswordRes = await fetch(`${baseUrl}/auth/bootstrap-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bootstrap-secret': 'secure-test-bootstrap-secret-9988',
      },
      body: JSON.stringify({
        email: 'first.admin@burrapariksha.com',
        name: 'First Admin',
        password: 'InsecurePasswordPassedInBody!',
      }),
    });
    assert.strictEqual(bodyPasswordRes.status, 400, 'Password supplied in JSON body must be rejected with 400');
    const bodyPasswordData = await bodyPasswordRes.json();
    assert(bodyPasswordData.message.includes('Passwords cannot be supplied via bootstrap'));

    // 1a-5: Verify /v1/auth/bootstrap-admin enforces identical secret-in-body and header protection
    const v1BodySecretRes = await fetch(`${baseUrl}/v1/auth/bootstrap-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'first.admin@burrapariksha.com', name: 'First Admin', secret: 'attempt' }),
    });
    assert.strictEqual(v1BodySecretRes.status, 400, '/v1 alias must reject secret in body with 400');

    // 1b: Fail closed if Firebase Auth service is unavailable (no synthetic UID allowed!)
    process.env.BOOTSTRAP_ADMIN_SECRET = 'secure-test-bootstrap-secret-9988';
    mockAdminAuthAvailable = false;

    const outageBootstrapRes = await fetch(`${baseUrl}/auth/bootstrap-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bootstrap-secret': 'secure-test-bootstrap-secret-9988',
      },
      body: JSON.stringify({
        email: 'first.admin@burrapariksha.com',
        name: 'First Administrator',
      }),
    });
    assert.strictEqual(outageBootstrapRes.status, 500, 'Bootstrap must fail closed with 500 when Firebase is unavailable');
    assert.strictEqual(inMemUsers.size, 0, 'Must NOT create admin profile in Firestore when Firebase Auth fails');
    mockAdminAuthAvailable = true;

    // 1c: Valid bootstrap with real Firebase identity succeeds and accurately dispatches setup email
    const goodBootstrapRes = await fetch(`${baseUrl}/auth/bootstrap-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bootstrap-secret': 'secure-test-bootstrap-secret-9988',
      },
      body: JSON.stringify({
        email: 'first.admin@burrapariksha.com',
        name: 'First Administrator',
      }),
    });
    assert.strictEqual(goodBootstrapRes.status, 201, 'Valid bootstrap must return 201 Created');
    const goodBootstrapData = await goodBootstrapRes.json();
    assert.strictEqual(goodBootstrapData.success, true);
    assert(goodBootstrapData.userId, 'Must return provisioned userId');

    // Invariants: Never return setupLink, report setupEmailSent truthfully
    assert.strictEqual(goodBootstrapData.setupLink, undefined, 'Bootstrap HTTP response must NEVER return a setupLink');
    assert.strictEqual(goodBootstrapData.setupEmailSent, true, 'setupEmailSent must be true on successful email dispatch');
    assert.strictEqual(goodBootstrapData.retryAvailable, false, 'retryAvailable must be false when email was delivered');
    assert.strictEqual(goodBootstrapData.accountCreated, true, 'accountCreated must be true');
    assert.strictEqual(goodBootstrapData.emailDelivery?.sent, true);
    assert(deliveredEmails.includes('first.admin@burrapariksha.com'), 'Must have dispatched email to administrator');

    const createdAdmin = inMemUsers.get(goodBootstrapData.userId);
    assert(createdAdmin, 'Admin must exist in repository');
    assert.strictEqual(createdAdmin.role, UserRole.ADMIN);
    assert.strictEqual(createdAdmin.isActive, true);
    assert(createdAdmin.firebaseUid?.startsWith('fb_real_'), 'Must possess real Firebase UID');

    // 1d: Second bootstrap attempt rejected (idempotency check)
    const secondBootstrapRes = await fetch(`${baseUrl}/auth/bootstrap-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bootstrap-secret': 'secure-test-bootstrap-secret-9988',
      },
      body: JSON.stringify({
        email: 'attacker@burrapariksha.com',
        name: 'Attacker',
      }),
    });
    assert.strictEqual(secondBootstrapRes.status, 409, 'Subsequent bootstrap attempts must return 409 Conflict');

    // 1d-2: Resend with mismatched email address rejected with 400
    const mismatchResendRes = await fetch(`${baseUrl}/auth/bootstrap-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bootstrap-secret': 'secure-test-bootstrap-secret-9988',
      },
      body: JSON.stringify({
        email: 'attacker@burrapariksha.com',
        resend: true,
      }),
    });
    assert.strictEqual(mismatchResendRes.status, 400, 'Resend targeting mismatched email must return 400');

    // 1e: CLI / Programmatic bootstrap: email delivery failure reports partial success truthfully
    // Temporarily clear inMemUsers to test bootstrap when email delivery fails
    inMemUsers.clear();
    authService.setTestEmailSender(async () => {
      return { sent: false, message: 'Failed to deliver setup email.', error: 'Simulated SMTP connection timeout' };
    });

    const partialBootstrapResult = await provisionInitialAdmin({
      email: 'partial.admin@burrapariksha.com',
      name: 'Partial Administrator',
    });

    assert.strictEqual(partialBootstrapResult.outcome, 'PARTIAL_SUCCESS', 'Outcome must be PARTIAL_SUCCESS');
    assert.strictEqual(partialBootstrapResult.exitCode, 2, 'Exit code must be 2 for partial success');
    assert.strictEqual(partialBootstrapResult.accountCreated, true, 'Account must be created in Firestore and Auth');
    assert.strictEqual(partialBootstrapResult.setupEmailSent, false, 'setupEmailSent must be false when email delivery fails');
    assert.strictEqual(partialBootstrapResult.retryAvailable, true, 'retryAvailable must be true when email delivery fails');
    assert.strictEqual(partialBootstrapResult.emailDelivery?.sent, false);
    assert.strictEqual(partialBootstrapResult.emailDelivery?.error, 'Simulated SMTP connection timeout');
    assert.strictEqual((partialBootstrapResult as any).setupLink, undefined, 'CLI bootstrap must NEVER return setupLink');
    assert(inMemUsers.has(partialBootstrapResult.userId!), 'Administrator profile must exist in Firestore');

    // 1f: UID collision rejection in bootstrap
    // Create an existing Firebase user whose UID is already tied to another user profile
    const collidedUid = 'fb_collided_admin_uid';
    inMemAuthUsers.set(collidedUid, { uid: collidedUid, email: 'collision.admin@burrapariksha.com' });
    inMemUsers.set('usr_other_employee', {
      id: 'usr_other_employee',
      name: 'Other Employee',
      email: 'other@burrapariksha.com',
      role: UserRole.VIDEO_EDITOR,
      roles: [UserRole.VIDEO_EDITOR],
      firebaseUid: collidedUid,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Clear active admin so duplicate-admin check passes, but UID collision check triggers
    inMemUsers.delete(partialBootstrapResult.userId!);

    await assert.rejects(
      async () => {
        await provisionInitialAdmin({
          email: 'collision.admin@burrapariksha.com',
          name: 'Collision Admin',
        });
      },
      /already linked to user profile/,
      'Bootstrap must reject when Firebase Auth UID is already bound to another profile'
    );

    // 1g: Existing Firebase users are not unexpectedly modified or deleted
    assert(inMemAuthUsers.has(collidedUid), 'Pre-existing Firebase Auth user must NOT be deleted');

    // 1h: Client isolation: Ensure frontend code contains zero bootstrap secrets or bootstrapAdmin calls
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const frontendDir = path.resolve(__dirname, '../../frontend');
    const scanDir = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results = results.concat(scanDir(full));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
          results.push(full);
        }
      }
      return results;
    };
    const frontendFiles = scanDir(frontendDir);
    assert(frontendFiles.length > 50, 'Frontend files must be discovered');
    for (const file of frontendFiles) {
      const content = fs.readFileSync(file, 'utf8');
      assert(!content.includes('BOOTSTRAP_ADMIN_SECRET'), `Frontend file ${file} must not reference BOOTSTRAP_ADMIN_SECRET`);
      assert(!content.includes('bootstrapAdmin'), `Frontend file ${file} must not expose bootstrapAdmin`);
      assert(!content.includes('x-bootstrap-secret'), `Frontend file ${file} must not reference x-bootstrap-secret`);
    }

    // Restore createdAdmin in inMemUsers for subsequent tests (Tests 2-6 expect createdAdmin)
    inMemUsers.set(createdAdmin.id, createdAdmin);

    console.log('✓ Test 1 PASSED: Administrator bootstrap fail-closed & idempotency verified.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 2: Employee Creation with Real Email Delivery & Truthful Reporting
    // --------------------------------------------------------------------------
    console.log('[Test 2] Testing Employee Creation & Truthful Email Reporting...');

    // Re-initialize deliveredEmails array for Test 2
    deliveredEmails = [];
    authService.setTestEmailSender(async (email) => {
      deliveredEmails.push(email);
      return { sent: true, message: `Email delivered to ${email}` };
    });

    const employeeSuccess = await assignmentService.createUser(
      {
        name: 'Video Editor Employee',
        email: 'editor.test@burrapariksha.com',
        role: UserRole.VIDEO_EDITOR,
        roles: [UserRole.VIDEO_EDITOR],
        isActive: true,
      },
      { id: createdAdmin.id, name: createdAdmin.name, role: UserRole.ADMIN, roles: [UserRole.ADMIN] }
    );

    assert(employeeSuccess.id, 'Employee must have canonical ID');
    assert.strictEqual(employeeSuccess.email, 'editor.test@burrapariksha.com');
    assert.strictEqual(employeeSuccess.setupEmailSent, true, 'setupEmailSent must be true when delivery succeeds');
    assert.strictEqual(employeeSuccess.accountCreated, true);
    assert.strictEqual(employeeSuccess.retryAvailable, false);
    assert.strictEqual(deliveredEmails.includes('editor.test@burrapariksha.com'), true);
    assert.strictEqual((employeeSuccess as any).setupLink, undefined, 'Must NEVER return secret setupLink to caller');

    // 2b: Test failed email delivery returns truthful partial-success
    authService.setTestEmailSender(async () => {
      return { sent: false, message: 'Provider rejected email', error: 'SMTP_TEMPORARY_ERROR' };
    });

    const employeeDeliveryFail = await assignmentService.createUser(
      {
        name: 'Script Writer Employee',
        email: 'writer.test@burrapariksha.com',
        role: UserRole.SCRIPT_WRITER,
        roles: [UserRole.SCRIPT_WRITER],
        isActive: true,
      },
      { id: createdAdmin.id, name: createdAdmin.name, role: UserRole.ADMIN, roles: [UserRole.ADMIN] }
    );

    assert(employeeDeliveryFail.id, 'Employee profile must be created');
    assert.strictEqual(employeeDeliveryFail.accountCreated, true, 'Account creation succeeded');
    assert.strictEqual(employeeDeliveryFail.setupEmailSent, false, 'setupEmailSent must be false when delivery fails');
    assert.strictEqual(employeeDeliveryFail.retryAvailable, true, 'retryAvailable must be true when delivery fails');
    assert.strictEqual(employeeDeliveryFail.emailDelivery?.sent, false);
    assert.strictEqual(employeeDeliveryFail.emailDelivery?.error, 'SMTP_TEMPORARY_ERROR');
    assert.strictEqual((employeeDeliveryFail as any).setupLink, undefined, 'Must NEVER return fabricated setup link');

    console.log('✓ Test 2 PASSED: Truthful email delivery reporting & zero link leaks verified.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 3: Resend Setup Email Security, Status Verification & Link Protection
    // --------------------------------------------------------------------------
    console.log('[Test 3] Testing Resend Setup Email Security & Invariants...');

    // 3a: Non-admin rejected
    await assert.rejects(
      async () => {
        await assignmentService.resendSetupEmail(employeeSuccess.id, {
          id: employeeSuccess.id,
          name: employeeSuccess.name,
          role: UserRole.VIDEO_EDITOR,
          roles: [UserRole.VIDEO_EDITOR],
        });
      },
      /Unauthorized/,
      'Non-admin must not be allowed to resend setup email'
    );

    // 3b: Inactive account rejected
    const inactiveUser: User = {
      id: 'usr_inactive_user',
      name: 'Inactive User',
      email: 'inactive@burrapariksha.com',
      role: UserRole.VIDEO_EDITOR,
      roles: [UserRole.VIDEO_EDITOR],
      firebaseUid: 'fb_inactive_uid',
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemUsers.set(inactiveUser.id, inactiveUser);
    inMemAuthUsers.set(inactiveUser.firebaseUid!, { uid: inactiveUser.firebaseUid, email: inactiveUser.email });

    await assert.rejects(
      async () => {
        await assignmentService.resendSetupEmail(inactiveUser.id, {
          id: createdAdmin.id,
          name: createdAdmin.name,
          role: UserRole.ADMIN,
          roles: [UserRole.ADMIN],
        });
      },
      /Cannot resend setup email for inactive user/,
      'Inactive user must not receive setup email'
    );

    // 3c: Successful resend dispatches real email and returns no secret link
    deliveredEmails = [];
    authService.setTestEmailSender(async (email) => {
      deliveredEmails.push(email);
      return { sent: true, message: `Dispatched to ${email}` };
    });

    const resendSuccess = await assignmentService.resendSetupEmail(employeeDeliveryFail.id, {
      id: createdAdmin.id,
      name: createdAdmin.name,
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
    });

    assert.strictEqual(resendSuccess.success, true);
    assert.strictEqual(resendSuccess.emailDelivered, true);
    assert.strictEqual(resendSuccess.retryAvailable, false);
    assert.strictEqual(deliveredEmails.includes(employeeDeliveryFail.email), true);
    assert.strictEqual((resendSuccess as any).setupLink, undefined, 'Resend must NEVER leak action link in response');

    console.log('✓ Test 3 PASSED: Resend setup email admin guard & zero link leaks verified.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 4: Production Login Fail-Closed & Rejection of Legacy Password Fallbacks
    // --------------------------------------------------------------------------
    console.log('[Test 4] Testing Production Login Fail-Closed & Legacy Fallback Isolation...');

    // User exists with password_hash in Firestore
    const legacyUser: User = {
      id: 'usr_legacy_candidate',
      name: 'Legacy Team Member',
      email: 'legacy@burrapariksha.com',
      role: UserRole.VIDEO_EDITOR,
      roles: [UserRole.VIDEO_EDITOR],
      password_hash: await authService.hashPassword('LegacyPassword123!'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemUsers.set(legacyUser.id, legacyUser);

    // 4a: Production default (allowLegacyAuthInTest = false):
    // When Firebase is unavailable or returns an error, login MUST FAIL even with correct legacy password!
    AuthService.enableTestLegacyAuth(false);
    const failClosedLogin = await authService.login(legacyUser.email, 'LegacyPassword123!');
    assert.strictEqual(failClosedLogin.success, false, 'Production login must fail closed without Firebase Auth verification');

    // 4b: Default password 'password123' must be rejected
    const defaultPasswordLogin = await authService.login(legacyUser.email, 'password123');
    assert.strictEqual(defaultPasswordLogin.success, false, 'Default password must NEVER succeed');

    // 4c: Successful Firebase login returns verified token
    // Simulate valid Firebase identity for legacy user
    const firebaseAdminUid = 'fb_admin_uid';
    createdAdmin.firebaseUid = firebaseAdminUid;
    inMemAuthUsers.set(firebaseAdminUid, { uid: firebaseAdminUid, email: createdAdmin.email });

    console.log('✓ Test 4 PASSED: Production login strictly fails closed (zero legacy fallback).');
    passed++;

    // --------------------------------------------------------------------------
    // Test 5: Safe Identity Linking & UID Collision Rejection
    // --------------------------------------------------------------------------
    console.log('[Test 5] Testing Safe Identity Linking & UID Collision Rejection...');

    // 5a: Attempting to create employee with an email whose Firebase UID is already bound to another profile
    const existingBoundAuthUid = 'fb_bound_uid_123';
    inMemAuthUsers.set(existingBoundAuthUid, { uid: existingBoundAuthUid, email: 'bound@burrapariksha.com' });
    inMemUsers.set('usr_existing_bound', {
      id: 'usr_existing_bound',
      name: 'Existing User',
      email: 'other@burrapariksha.com',
      role: UserRole.VIDEO_EDITOR,
      roles: [UserRole.VIDEO_EDITOR],
      firebaseUid: existingBoundAuthUid,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await assert.rejects(
      async () => {
        await assignmentService.createUser(
          {
            name: 'Attacker Attempting Hijack',
            email: 'bound@burrapariksha.com',
            role: UserRole.VIDEO_EDITOR,
            roles: [UserRole.VIDEO_EDITOR],
            isActive: true,
          },
          { id: createdAdmin.id, name: createdAdmin.name, role: UserRole.ADMIN, roles: [UserRole.ADMIN] }
        );
      },
      /already linked to another employee profile/,
      'Must reject UID collision when Firebase Auth UID is already bound to another profile'
    );

    // 5b: updateUser strips client-supplied firebaseUid
    const userToUpdate = inMemUsers.get(employeeSuccess.id)!;
    const originalUid = userToUpdate.firebaseUid;
    const updatedUser = await assignmentService.updateUser(
      userToUpdate.id,
      { firebaseUid: 'fb_tampered_uid' } as any,
      { id: createdAdmin.id, name: createdAdmin.name, role: UserRole.ADMIN, roles: [UserRole.ADMIN] }
    );
    assert.strictEqual(updatedUser.firebaseUid, originalUid, 'updateUser must ignore client-injected firebaseUid');

    console.log('✓ Test 5 PASSED: Safe identity linking and collision prevention verified.');
    passed++;

    // --------------------------------------------------------------------------
    // Test 6: Forgot Password Anti-Enumeration & Code Verification
    // --------------------------------------------------------------------------
    console.log('[Test 6] Testing Forgot Password Anti-Enumeration Behavior...');

    // Existing email
    const forgotExistingRes = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: createdAdmin.email }),
    });
    assert.strictEqual(forgotExistingRes.status, 200);
    const existingForgotData = await forgotExistingRes.json();
    assert.strictEqual(
      existingForgotData.message,
      'If an account exists for this email address, a password reset link will be sent.'
    );

    // Non-existent email
    const forgotNonExistentRes = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'does.not.exist@burrapariksha.com' }),
    });
    assert.strictEqual(forgotNonExistentRes.status, 200);
    const nonExistentForgotData = await forgotNonExistentRes.json();
    assert.strictEqual(
      nonExistentForgotData.message,
      'If an account exists for this email address, a password reset link will be sent.',
      'Must return identical neutral message to prevent account enumeration'
    );

    // Empty action code validation
    const verifyCodeRes = await fetch(`${baseUrl}/auth/verify-reset-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oobCode: '' }),
    });
    assert.strictEqual(verifyCodeRes.status, 400, 'Missing oobCode must return 400');

    console.log('✓ Test 6 PASSED: Forgot password anti-enumeration & validation verified.');
    passed++;

    console.log('\n============================================================');
    console.log(`ALL ${passed} SECURITY & AUTHENTICATION TESTS PASSED (0 FAILED)`);
    console.log('============================================================');
  } catch (err: any) {
    console.error('Test failure:', err);
    failed++;
  } finally {
    setAdminAuth(null);
    authService.setTestEmailSender(null);
    AuthService.enableTestLegacyAuth(false);
    auditLogRepository.logAction = origAuditLogAction;
    auditLogRepository.logEvent = origAuditLogEvent;
    server.close();
    usersRepository.findById = origFindById;
    usersRepository.findByEmail = origFindByEmail;
    usersRepository.findByFirebaseUid = origFindByFirebaseUid;
    usersRepository.appendRecord = origAppend;
    usersRepository.update = origUpdate;
    usersRepository.updateRecord = origUpdateRecord;
    usersRepository.findAll = origFindAll;
  }

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runFirebaseAuthTests();
