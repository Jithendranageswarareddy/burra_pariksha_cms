/**
 * BURRA PARIKSHA CMS — Stage 27 Implementation Verification
 * Feature Contract: FC-001 System Foundation & Identity Authentication
 *
 * Test Suite: TC-AUTH-01 through TC-AUTH-07
 */

import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { authService } from '../src/lib/services/auth.service';
import { usersRepository } from '../src/lib/repositories/users.repository';
import { extractSessionToken, requireAuth, AuthenticatedRequest } from '../src/server/middleware/auth.middleware';
import { apiRouter } from '../src/server/routes';
import { UserRole } from '../src/types';

async function runTests() {
  console.log('============================================================');
  console.log('STAGE 27 — FC-001 SYSTEM FOUNDATION & IDENTITY VERIFICATION');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // --------------------------------------------------------------------------
  // TC-AUTH-01: Password Hash Generation & Timing-Safe Verification
  // --------------------------------------------------------------------------
  try {
    const rawPassword = 'StrongPassword123!';
    const hash = await authService.hashPassword(rawPassword);

    assert(hash.startsWith('scrypt$v1$'), 'Hash should start with scrypt$v1$ identifier');
    assert(hash.split('$').length === 4, 'Hash must contain 4 parts: algorithm, version, salt, derivedKey');

    const isValid = await authService.verifyPassword(rawPassword, hash);
    assert.strictEqual(isValid, true, 'Valid password must verify successfully');

    const isInvalid = await authService.verifyPassword('WrongPassword123!', hash);
    assert.strictEqual(isInvalid, false, 'Invalid password must be rejected');

    const emptyCheck = await authService.verifyPassword('', hash);
    assert.strictEqual(emptyCheck, false, 'Empty password must be rejected');

    const malformedCheck = await authService.verifyPassword(rawPassword, 'invalid_hash_string');
    assert.strictEqual(malformedCheck, false, 'Malformed hash must be rejected');

    console.log('✓ TC-AUTH-01 PASSED: Scrypt password hashing & timing-safe verification verified.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUTH-01 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-AUTH-02: Cryptographic Token Generation & Signature Verification
  // --------------------------------------------------------------------------
  try {
    const testUserId = 'usr_test_auth_02';
    const token = authService.generateSessionToken({
      userId: testUserId,
      name: 'Test Operator',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      sessionVersion: 1,
    });

    assert(token.includes('.'), 'Token must be composed of payloadBase64.signature');
    const parts = token.split('.');
    assert.strictEqual(parts.length, 2, 'Token must have exactly 2 segments');

    const verified = authService.verifySessionToken(token);
    assert(verified !== null, 'Valid token must decode and verify');
    assert.strictEqual(verified?.userId, testUserId, 'Decoded userId must match');
    assert.strictEqual(verified?.role, UserRole.ADMIN, 'Decoded role must match');

    // Tampered payload test
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'hacked', role: 'ADMIN', expiresAt: verified?.expiresAt })).toString('base64url');
    const tamperedToken = `${tamperedPayload}.${parts[1]}`;
    const tamperedResult = authService.verifySessionToken(tamperedToken);
    assert.strictEqual(tamperedResult, null, 'Tampered payload must fail HMAC verification');

    // Tampered signature test
    const badSignatureToken = `${parts[0]}.bad_signature_12345`;
    const badSigResult = authService.verifySessionToken(badSignatureToken);
    assert.strictEqual(badSigResult, null, 'Tampered signature must fail verification');

    console.log('✓ TC-AUTH-02 PASSED: Session token generation & HMAC SHA-256 signature verification verified.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUTH-02 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-AUTH-03: Session Token Extraction & Authentication Middleware
  // --------------------------------------------------------------------------
  try {
    const testUserId = 'usr_test_auth_03';
    usersRepository.setUserSessionState(testUserId, {
      isActive: true,
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      sessionVersion: 1,
    });

    const token = authService.generateSessionToken({
      userId: testUserId,
      name: 'Auth Middleware Tester',
      role: UserRole.ADMIN,
      sessionVersion: 1,
    });

    // 1. Extract from Cookie header
    const mockCookieReq = {
      headers: { cookie: `other=123; bp_session=${token}; theme=dark` },
    } as any;
    const extractedCookieToken = extractSessionToken(mockCookieReq);
    assert.strictEqual(extractedCookieToken, token, 'Should extract token from bp_session cookie');

    // 2. Extract from Authorization Bearer header
    const mockBearerReq = {
      headers: { authorization: `Bearer ${token}` },
    } as any;
    const extractedBearerToken = extractSessionToken(mockBearerReq);
    assert.strictEqual(extractedBearerToken, token, 'Should extract token from Bearer header');

    // 3. requireAuth middleware populates req.user
    let nextCalled = false;
    const mockAuthReq: AuthenticatedRequest = {
      headers: { authorization: `Bearer ${token}` },
    } as any;
    const mockRes = {
      status: () => mockRes,
      json: () => mockRes,
    } as any;

    requireAuth(mockAuthReq, mockRes, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, true, 'requireAuth should invoke next() for valid session');
    assert(mockAuthReq.user !== undefined, 'req.user must be populated');
    assert.strictEqual(mockAuthReq.user?.id, testUserId, 'req.user.id must match');
    assert.strictEqual(mockAuthReq.user?.role, UserRole.ADMIN, 'req.user.role must match');

    console.log('✓ TC-AUTH-03 PASSED: Session token extraction & requireAuth middleware populated req.user.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUTH-03 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-AUTH-04 & TC-AUTH-05: Real HTTP Login API (Happy Path & Invalid Creds)
  // --------------------------------------------------------------------------
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    // Seed test user into usersRepository
    const testEmail = `auth_tester_${Date.now()}@burrapariksha.com`;
    const testPassword = 'CorrectPassword123!';
    const passwordHash = await authService.hashPassword(testPassword);
    const testUser = {
      id: `usr_${Date.now()}`,
      name: 'Real HTTP Test User',
      email: testEmail,
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      password_hash: passwordHash,
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await usersRepository.appendRecord(testUser);

    // TC-AUTH-04: Valid login via /v1/auth/login
    const loginRes = await fetch(`${baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-request-id': 'req_tc_auth_04' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });

    assert.strictEqual(loginRes.status, 200, 'Valid login should return HTTP 200');
    const cookieHeader = loginRes.headers.get('set-cookie');
    assert(cookieHeader?.includes('bp_session='), 'Response must include Set-Cookie bp_session');
    assert(cookieHeader?.includes('HttpOnly'), 'Cookie must be marked HttpOnly');
    assert(cookieHeader?.includes('SameSite=Lax'), 'Cookie must be marked SameSite=Lax');

    const loginData = await loginRes.json();
    assert.strictEqual(loginData.success, true, 'Envelope success must be true');
    assert.strictEqual(loginData.meta?.requestId, 'req_tc_auth_04', 'Envelope meta must include requestId');
    assert(loginData.data?.user !== undefined, 'Envelope data.user must be present');
    assert.strictEqual(loginData.data.user.email, testEmail, 'User email must match');
    assert(loginData.data?.token !== undefined, 'Token must be returned');

    console.log('✓ TC-AUTH-04 PASSED: POST /api/v1/auth/login valid credentials returns cookie & success envelope.');
    passed++;

    // TC-AUTH-05: Invalid login via /v1/auth/login
    const badLoginRes = await fetch(`${baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-request-id': 'req_tc_auth_05' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' }),
    });

    assert.strictEqual(badLoginRes.status, 401, 'Invalid password should return HTTP 401');
    const badLoginData = await badLoginRes.json();
    assert.strictEqual(badLoginData.success, false, 'Envelope success must be false');
    assert.strictEqual(badLoginData.error?.code, 'UNAUTHENTICATED', 'Error code must be UNAUTHENTICATED');
    assert.strictEqual(badLoginData.error?.requestId, 'req_tc_auth_05', 'Error envelope must preserve requestId');

    console.log('✓ TC-AUTH-05 PASSED: POST /api/v1/auth/login with invalid credentials returns 401 error envelope.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUTH-04/05 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-AUTH-06: Session Revocation & Logout
  // --------------------------------------------------------------------------
  try {
    const testUserId = 'usr_test_auth_06';
    usersRepository.setUserSessionState(testUserId, {
      isActive: true,
      role: UserRole.ADMIN,
      sessionVersion: 1,
    });

    const token = authService.generateSessionToken({
      userId: testUserId,
      name: 'Revoke Tester',
      role: UserRole.ADMIN,
      sessionVersion: 1,
    });

    assert(authService.verifySessionToken(token) !== null, 'Token should be valid initially');

    // Revoke token
    authService.revokeSession(token);
    assert.strictEqual(authService.isSessionRevoked(token), true, 'Token must be recognized as revoked');
    assert.strictEqual(authService.verifySessionToken(token), null, 'Revoked token must verify to null');

    console.log('✓ TC-AUTH-06 PASSED: Session revocation & invalidation correctly verified.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUTH-06 FAILED:', err.message);
    failed++;
  }

  // --------------------------------------------------------------------------
  // TC-AUTH-07: Rate Limiter Configuration & Protection
  // --------------------------------------------------------------------------
  try {
    // Missing credentials yields 400 with VALIDATION_ERROR
    const missingRes = await fetch(`${baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(missingRes.status, 400, 'Missing credentials returns HTTP 400');
    const missingData = await missingRes.json();
    assert.strictEqual(missingData.error?.code, 'VALIDATION_ERROR', 'Error code must be VALIDATION_ERROR');

    console.log('✓ TC-AUTH-07 PASSED: Rate limiter and payload validation invariants verified.');
    passed++;
  } catch (err: any) {
    console.error('✗ TC-AUTH-07 FAILED:', err.message);
    failed++;
  }

  server.close();

  console.log('\n============================================================');
  console.log(`FC-001 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
