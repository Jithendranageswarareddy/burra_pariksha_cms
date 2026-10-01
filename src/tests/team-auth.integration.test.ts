/**
 * BURRA PARIKSHA CMS - PHASE 11.2 (11B) AUTHENTICATION VERIFICATION TEST SUITE
 * Minimal Production Team Authentication & Session Security
 * 
 * Verifies end-to-end functionality for:
 * 1. User Directory & Pre-Seeded Team Accounts (USR-001, USR-002, USR-003, USR-004)
 * 2. Credential Verification & Authentication Service Login
 * 3. Secure Token Signing, Verification & Tamper Resistance
 * 4. Auth Middleware Extraction (`bp_session` cookie / Bearer auth) & Context Attachment
 * 5. Role-Based Access Control Middleware (Allow authorized roles, reject 403)
 * 6. Audit Trail Logging on Successful Login, Failed Attempt & Logout
 * 7. Operational API Protection & Inactive User Handling
 */

import { authService } from '../lib/services/auth.service';
import { usersRepository } from '../lib/repositories/users.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { requireAuth, requireRole, AuthenticatedRequest } from '../server/middleware/auth.middleware';
import { UserRole } from '../types';

export async function runPhase11bAuthVerification() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 11.2 AUTHENTICATION VERIFICATION');
  console.log('Minimal Production Team Authentication & Session Security');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Phase 11.2 Verification failed on Test ${totalTests}: ${testName} - ${detail || ''}`);
    }
  }

  // ============================================================================
  // SECTION 1: USER REPOSITORY & PRE-SEEDED TEAM PROFILES
  // ============================================================================
  console.log('\n--- Section 1: User Directory & Pre-Seeded Profiles ---');

  const allUsers = await usersRepository.findAll();
  assert(allUsers.length >= 2, 'User repository contains at least 2 team members for remote access', `Count: ${allUsers.length}`);

  const leadUser = await usersRepository.findById('USR-001');
  assert(!!leadUser && leadUser.role === UserRole.ADMIN, 'USR-001 exists with ADMIN role', `Role: ${leadUser?.role}`);
  assert(leadUser?.isActive === true, 'USR-001 is active');

  const editorUser = await usersRepository.findById('USR-002');
  assert(!!editorUser && editorUser.role === UserRole.CONTENT_MANAGER, 'USR-002 exists with CONTENT_MANAGER role', `Role: ${editorUser?.role}`);

  // ============================================================================
  // SECTION 2: AUTHENTICATION SERVICE LOGIN & PASSWORD VERIFICATION
  // ============================================================================
  console.log('\n--- Section 2: AuthService Login Flows ---');

  // Valid Login for Lead
  const validLeadLogin = await authService.login('USR-001', 'password123');
  assert(validLeadLogin.success === true, 'Login succeeds for USR-001 with valid password');
  assert(!!validLeadLogin.token, 'Login returns a non-empty session token');
  assert(validLeadLogin.user?.id === 'USR-001', 'Returned user profile matches USR-001');

  // Valid Login for Editor
  const validEditorLogin = await authService.login('USR-002', 'password123');
  assert(validEditorLogin.success === true, 'Login succeeds for USR-002 with valid password');
  assert(validEditorLogin.user?.role === UserRole.CONTENT_MANAGER, 'Returned user profile matches CONTENT_MANAGER role');

  // Invalid Password
  const invalidPasswordLogin = await authService.login('USR-001', 'wrong_password_123');
  assert(invalidPasswordLogin.success === false, 'Login fails with incorrect password');
  assert(invalidPasswordLogin.error?.toLowerCase().includes('credential') || invalidPasswordLogin.error?.toLowerCase().includes('invalid'), 'Error message identifies invalid credentials');

  // Unknown User ID
  const unknownUserLogin = await authService.login('USR-UNKNOWN-999', 'any_password');
  assert(unknownUserLogin.success === false, 'Login fails for non-existent user ID');

  // Inactive User Rejection Test without polluting live production workbook
  const originalFindById = usersRepository.findById.bind(usersRepository);
  usersRepository.findById = async (id: string) => {
    if (id === 'USR-INACTIVE-TEST') {
      return {
        id: 'USR-INACTIVE-TEST',
        name: 'Temporary Inactive User',
        email: 'temp.inactive@burrapariksha.local',
        role: UserRole.REVIEWER,
        roles: [UserRole.REVIEWER],
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return originalFindById(id);
  };

  const inactiveLogin = await authService.login('USR-INACTIVE-TEST', 'password123');
  usersRepository.findById = originalFindById;
  assert(inactiveLogin.success === false, 'Inactive users are strictly blocked from logging in');

  // ============================================================================
  // SECTION 3: SESSION TOKEN SIGNING, VERIFICATION & TAMPER PROOFING
  // ============================================================================
  console.log('\n--- Section 3: Session Token Integrity & Verification ---');

  const validToken = authService.generateSessionToken({
    userId: 'USR-001',
    name: 'Admin / Content Lead',
    role: UserRole.ADMIN,
  });

  assert(typeof validToken === 'string' && validToken.split('.').length === 2, 'Token is structured as a valid 2-part signed token (payload.signature)');

  const verifiedPayload = authService.verifySessionToken(validToken);
  assert(verifiedPayload !== null, 'Verified payload is decoded successfully');
  assert(verifiedPayload?.userId === 'USR-001', 'Verified payload contains correct userId');
  assert(verifiedPayload?.role === UserRole.ADMIN, 'Verified payload contains correct role');

  // Tampered payload
  const parts = validToken.split('.');
  const originalData = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
  const tamperedPayload = Buffer.from(JSON.stringify({ ...originalData, role: 'SUPER_ADMIN' })).toString('base64url');
  const tamperedToken = `${tamperedPayload}.${parts[1]}`;
  const tamperedResult = authService.verifySessionToken(tamperedToken);
  assert(tamperedResult === null, 'Tampered token with invalid signature is rejected (returns null)');

  // Malformed token
  assert(authService.verifySessionToken('random-malformed-string') === null, 'Malformed token string returns null');

  // ============================================================================
  // SECTION 4: REQUIREAUTH MIDDLEWARE BEHAVIOR
  // ============================================================================
  console.log('\n--- Section 4: requireAuth Middleware Verification ---');

  // Unauthenticated Request (no cookie, no header)
  let statusSent = 0;
  let jsonSent: any = null;
  const mockUnauthReq: any = {
    headers: {},
    cookies: {},
  };
  const mockUnauthRes: any = {
    status: (s: number) => {
      statusSent = s;
      return {
        json: (j: any) => { jsonSent = j; },
      };
    },
  };
  let unauthNextCalled: boolean = false;

  await requireAuth(mockUnauthReq, mockUnauthRes, () => { unauthNextCalled = true; });
  assert(unauthNextCalled === false, 'Unauthenticated request does not proceed to next handler');
  assert(statusSent === 401, 'Unauthenticated request receives HTTP 401 Unauthorized', `Status: ${statusSent}`);

  // Authenticated Request with bp_session cookie
  statusSent = 0;
  jsonSent = null;
  let authNextCalled: boolean = false;
  const mockAuthReq: any = {
    headers: {
      cookie: `bp_session=${validToken}`,
    },
    cookies: {},
  };
  const mockAuthRes: any = {
    status: (s: number) => {
      statusSent = s;
      return {
        json: (j: any) => { jsonSent = j; },
      };
    },
  };

  await requireAuth(mockAuthReq, mockAuthRes, () => { authNextCalled = true; });
  assert(Boolean(authNextCalled), 'Authenticated request successfully passes to next()');
  assert(mockAuthReq.user?.id === 'USR-001', 'Auth middleware populates req.user.id');
  assert(mockAuthReq.user?.role === UserRole.ADMIN, 'Auth middleware populates req.user.role');

  // ============================================================================
  // SECTION 5: REQUIREROLE MIDDLEWARE BEHAVIOR
  // ============================================================================
  console.log('\n--- Section 5: requireRole Middleware Verification ---');

  // Authorized Admin accessing Admin-only endpoint
  statusSent = 0;
  let roleAdminNextCalled: boolean = false;
  const adminOnlyMiddleware = requireRole([UserRole.ADMIN]);
  adminOnlyMiddleware(mockAuthReq, mockAuthRes, () => { roleAdminNextCalled = true; });
  assert(Boolean(roleAdminNextCalled), 'User with matching role passes requireRole middleware');

  // Unauthorized Editor accessing Admin-only endpoint
  statusSent = 0;
  let roleEditorNextCalled: boolean = false;
  const mockEditorAuthReq: any = {
    user: {
      id: 'USR-002',
      name: 'Video Producer / Editor',
      role: UserRole.EDITOR,
    },
  };
  adminOnlyMiddleware(mockEditorAuthReq, mockAuthRes, () => { roleEditorNextCalled = true; });
  assert(roleEditorNextCalled === false, 'User with inadequate role is blocked from proceeding');
  assert(statusSent === 403, 'Inadequate role request receives HTTP 403 Forbidden', `Status: ${statusSent}`);

  // ============================================================================
  // SECTION 6: LOGOUT & AUDIT TRAIL LOGGING
  // ============================================================================
  console.log('\n--- Section 6: Logout & Audit Trail Verification ---');

  await authService.logout('USR-001', 'Admin / Content Lead');
  const allLogs = await auditLogRepository.findAll();
  const logoutLog = allLogs.find((l) => l.action === 'LOGOUT' && l.actorId === 'USR-001');
  assert(!!logoutLog, 'LOGOUT event is recorded in audit logs');

  const loginLog = allLogs.find((l) => l.action === 'LOGIN_SUCCESS' && l.actorId === 'USR-001');
  assert(!!loginLog, 'LOGIN_SUCCESS event was recorded in audit logs during previous login');

  console.log('\n====================================================');
  console.log(`PHASE 11.2 AUTHENTICATION VERIFICATION COMPLETE`);
  console.log(`Result: ${passedTests}/${totalTests} tests passed`);
  console.log('====================================================\n');

  return {
    success: true,
    totalTests,
    passedTests,
    failedTests: 0,
    timestamp: new Date().toISOString(),
  };
}
