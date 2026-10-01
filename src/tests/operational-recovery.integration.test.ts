/**
 * BURRA PARIKSHA CMS - Phase 8B Forensic Verification Suite
 * Phase 8B: Operational Reliability, Recovery & Production Hardening
 * 
 * Verifies:
 * 1. Error classification (Transient vs. Non-Transient)
 * 2. Exponential backoff and bounded jitter calculation
 * 3. executeWithRetry handling transient retries, non-transient aborts, and retry exhaustion
 * 4. Request timeout mechanics
 * 5. Sequence safety anomaly detection (missing rows, invalid next_number, sequence drift)
 * 6. Strictly read-only invariant of sequence safety audit
 * 7. Operational health and connectivity reporting
 * 8. Administrative sequence synchronization with explicit confirmation & safety checks
 * 9. Audit log operational event recording with strict payload sanitization
 */

import {
  classifyError,
  GoogleAuthError,
  GoogleSheetsApiError,
  RateLimitError,
  RequestTimeoutError,
  SpreadsheetNotFoundError,
  TransientGoogleSheetsError,
  ValidationError,
  sanitizeErrorMessage,
} from '../lib/google-sheets/errors';
import { calculateBackoffDelay, GoogleSheetsClient } from '../lib/google-sheets/client';
import { sequenceSafetyService } from '../lib/services/sequence-safety.service';
import { operationalHealthService } from '../lib/services/operational-health.service';
import { operationalRecoveryService } from '../lib/services/operational-recovery.service';
import { auditService } from '../lib/services/audit.service';
import { sequencesRepository, questionsRepository } from '../lib/repositories';
import { SEQUENCE_ENTITIES } from '../lib/schemas/google-sheets-schema';

export interface TestAssertionResult {
  test: string;
  category: string;
  passed: boolean;
  detail?: string;
}

export interface Phase8bVerificationReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  success: boolean;
  results: TestAssertionResult[];
}

export async function runPhase8bVerification(): Promise<Phase8bVerificationReport> {
  const results: TestAssertionResult[] = [];

  function assert(test: string, category: string, condition: boolean, detail?: string) {
    results.push({
      test,
      category,
      passed: Boolean(condition),
      detail: condition ? undefined : detail || 'Assertion evaluated to false',
    });
  }

  // =========================================================================
  // 1. ERROR CLASSIFICATION (TRANSIENT VS. NON-TRANSIENT)
  // =========================================================================

  // Test 1: 429 Rate Limit classified as TRANSIENT
  const rateLimitErr = new RateLimitError();
  assert(
    'Error 429 (Rate Limit) is classified as TRANSIENT',
    'ERROR_CLASSIFICATION',
    classifyError(rateLimitErr) === 'TRANSIENT'
  );

  // Test 2: HTTP 500/503 status classified as TRANSIENT
  const http503Err = new GoogleSheetsApiError('Service Unavailable', 503);
  assert(
    'HTTP 503 status code is classified as TRANSIENT',
    'ERROR_CLASSIFICATION',
    classifyError(http503Err) === 'TRANSIENT'
  );

  // Test 3: Network timeouts and ECONNRESET classified as TRANSIENT
  const netErr = new Error('read ECONNRESET at TCP.onStreamRead');
  assert(
    'Network ECONNRESET error is classified as TRANSIENT',
    'ERROR_CLASSIFICATION',
    classifyError(netErr) === 'TRANSIENT'
  );

  // Test 4: RequestTimeoutError is classified as TRANSIENT
  const timeoutErr = new RequestTimeoutError(5000, 'getRows');
  assert(
    'RequestTimeoutError is classified as TRANSIENT',
    'ERROR_CLASSIFICATION',
    classifyError(timeoutErr) === 'TRANSIENT'
  );

  // Test 5: 400 Bad Request / Validation is classified as NON_TRANSIENT
  const valErr = new ValidationError('Invalid row format');
  assert(
    'ValidationError / HTTP 400 is classified as NON_TRANSIENT',
    'ERROR_CLASSIFICATION',
    classifyError(valErr) === 'NON_TRANSIENT'
  );

  // Test 6: 401 / 403 GoogleAuthError is classified as NON_TRANSIENT
  const authErr = new GoogleAuthError('Caller lacks permission to edit sheet');
  assert(
    'GoogleAuthError (401/403) is classified as NON_TRANSIENT',
    'ERROR_CLASSIFICATION',
    classifyError(authErr) === 'NON_TRANSIENT'
  );

  // Test 7: 404 SpreadsheetNotFoundError is classified as NON_TRANSIENT
  const notFoundErr = new SpreadsheetNotFoundError('test-sheet-id');
  assert(
    'SpreadsheetNotFoundError (404) is classified as NON_TRANSIENT',
    'ERROR_CLASSIFICATION',
    classifyError(notFoundErr) === 'NON_TRANSIENT'
  );

  // =========================================================================
  // 2. EXPONENTIAL BACKOFF & JITTER CALCULATION
  // =========================================================================

  // Test 8: Exponential backoff delay progression
  const delay0 = calculateBackoffDelay(0, { initialDelayMs: 100, maxDelayMs: 2000, backoffMultiplier: 2, jitter: false });
  const delay1 = calculateBackoffDelay(1, { initialDelayMs: 100, maxDelayMs: 2000, backoffMultiplier: 2, jitter: false });
  const delay2 = calculateBackoffDelay(2, { initialDelayMs: 100, maxDelayMs: 2000, backoffMultiplier: 2, jitter: false });
  assert(
    'Backoff delays scale exponentially without jitter (100ms, 200ms, 400ms)',
    'RETRY_ENGINE',
    delay0 === 100 && delay1 === 200 && delay2 === 400
  );

  // Test 9: Max delay capping
  const delayHuge = calculateBackoffDelay(10, { initialDelayMs: 100, maxDelayMs: 1500, backoffMultiplier: 2, jitter: false });
  assert(
    'Backoff delay is strictly capped at maxDelayMs',
    'RETRY_ENGINE',
    delayHuge === 1500
  );

  // Test 10: Jitter adds bounded non-negative offset
  const delayJitter = calculateBackoffDelay(0, { initialDelayMs: 100, maxDelayMs: 2000, backoffMultiplier: 2, jitter: true });
  assert(
    'Jitter produces a bounded delay within expected range (100ms <= delay <= 150ms)',
    'RETRY_ENGINE',
    delayJitter >= 100 && delayJitter <= 150
  );

  // =========================================================================
  // 3. EXECUTE WITH RETRY RESILIENCE ENGINE
  // =========================================================================

  const client = GoogleSheetsClient.getInstance();

  // Test 11: Retries on transient error and succeeds
  let transientAttempts = 0;
  const retrySuccessResult = await client.executeWithRetry(
    async () => {
      transientAttempts++;
      if (transientAttempts < 2) {
        throw new TransientGoogleSheetsError('Temporary 503 Unavailable', 503);
      }
      return 'recovered-data';
    },
    'testTransientRecovery',
    { maxRetries: 3, initialDelayMs: 10, jitter: false }
  );
  assert(
    'executeWithRetry successfully recovers from transient failure after retrying',
    'RETRY_ENGINE',
    retrySuccessResult === 'recovered-data' && transientAttempts === 2
  );

  // Test 12: Aborts immediately on non-transient error without retrying
  let nonTransientAttempts = 0;
  let caughtNonTransient: any = null;
  try {
    await client.executeWithRetry(
      async () => {
        nonTransientAttempts++;
        throw new ValidationError('Schema validation failure');
      },
      'testNonTransientAbort',
      { maxRetries: 3, initialDelayMs: 10, jitter: false }
    );
  } catch (err: any) {
    caughtNonTransient = err;
  }
  assert(
    'executeWithRetry immediately aborts on non-transient error without retrying (attempts === 1)',
    'RETRY_ENGINE',
    nonTransientAttempts === 1 && caughtNonTransient instanceof ValidationError
  );

  // Test 13: Exhausts retries on persistent transient error and throws bounded error
  let persistentAttempts = 0;
  let caughtExhausted: any = null;
  try {
    await client.executeWithRetry(
      async () => {
        persistentAttempts++;
        throw new TransientGoogleSheetsError('Persistent 500 error', 500);
      },
      'testRetryExhaustion',
      { maxRetries: 2, initialDelayMs: 10, jitter: false }
    );
  } catch (err: any) {
    caughtExhausted = err;
  }
  assert(
    'executeWithRetry honors maxRetries bound and throws TransientGoogleSheetsError on exhaustion',
    'RETRY_ENGINE',
    persistentAttempts === 3 && caughtExhausted instanceof TransientGoogleSheetsError
  );

  // =========================================================================
  // 4. SEQUENCE SAFETY & DRIFT DETECTION
  // =========================================================================

  // Test 14: Sequence safety audit executes without throwing
  const seqReport = await sequenceSafetyService.auditSequences();
  assert(
    'SequenceSafetyService generates structured safety audit report',
    'SEQUENCE_SAFETY',
    Boolean(seqReport && seqReport.generatedAt && Array.isArray(seqReport.sequences))
  );

  // Test 15: Sequence safety audit is strictly read-only
  assert(
    'SequenceSafetyService enforces isReadOnly: true invariant',
    'SEQUENCE_SAFETY',
    seqReport.isReadOnly === true
  );

  // Test 16: Detects max allocated ID for existing domain entities
  const maxQuestionIdNum = await sequenceSafetyService.getMaxAllocatedIdForEntity(SEQUENCE_ENTITIES.QUESTION);
  assert(
    'Discovers highest allocated ID number for Question entity without errors',
    'SEQUENCE_SAFETY',
    typeof maxQuestionIdNum === 'number' && maxQuestionIdNum >= 0
  );

  // Test 17: Checks all standard domain entities in SEQUENCES
  const checkedEntities = seqReport.sequences.map((s) => s.entityType);
  const expectedEntities = Object.values(SEQUENCE_ENTITIES);
  const coversAll = expectedEntities.every((e) => checkedEntities.includes(e));
  assert(
    'SequenceSafetyService inspects all 8 domain entity sequences',
    'SEQUENCE_SAFETY',
    coversAll
  );

  // =========================================================================
  // 5. OPERATIONAL HEALTH & TELEMETRY
  // =========================================================================

  // Test 18: Operational health service returns structured diagnostic report
  const opHealth = await operationalHealthService.getOperationalHealth();
  assert(
    'OperationalHealthService returns comprehensive health report',
    'OPERATIONAL_HEALTH',
    Boolean(opHealth && opHealth.connectivityStatus && opHealth.telemetry)
  );

  // Test 19: Operational health enforces read-only invariant
  assert(
    'OperationalHealthService enforces isReadOnly: true invariant',
    'OPERATIONAL_HEALTH',
    opHealth.isReadOnly === true
  );

  // Test 20: Telemetry tracks execution metrics
  assert(
    'OperationalTelemetry contains tracked latency and operation counters',
    'OPERATIONAL_HEALTH',
    typeof opHealth.telemetry.totalRetries === 'number'
  );

  // =========================================================================
  // 6. OPERATIONAL RECOVERY & ADMINISTRATIVE RECOVERY
  // =========================================================================

  // Test 21: Recovery service compiles structured action plans
  const recoveryState = await operationalRecoveryService.getRecoveryState();
  assert(
    'OperationalRecoveryService generates recovery state and structured action plans',
    'OPERATIONAL_RECOVERY',
    Boolean(recoveryState && Array.isArray(recoveryState.actionPlans))
  );

  // Test 22: Sequence synchronization rejects unconfirmed requests
  let rejectedUnconfirmed = false;
  try {
    await operationalRecoveryService.synchronizeSequence(
      SEQUENCE_ENTITIES.QUESTION,
      9999,
      { id: 'USR-TEST', name: 'Test Actor' },
      false // confirmed = false
    );
  } catch (err: any) {
    if (err instanceof ValidationError) {
      rejectedUnconfirmed = true;
    }
  }
  assert(
    'Administrative sequence sync strictly rejects unconfirmed execution (confirmed: false)',
    'OPERATIONAL_RECOVERY',
    rejectedUnconfirmed
  );

  // Test 23: Sequence synchronization rejects next_number <= max allocated ID
  let rejectedLaggingSync = false;
  try {
    await operationalRecoveryService.synchronizeSequence(
      SEQUENCE_ENTITIES.QUESTION,
      1, // 1 is <= max allocated question
      { id: 'USR-TEST', name: 'Test Actor' },
      true
    );
  } catch (err: any) {
    rejectedLaggingSync = true;
  }
  assert(
    'Administrative sequence sync rejects unsafe next_number lower than existing allocated IDs',
    'OPERATIONAL_RECOVERY',
    rejectedLaggingSync
  );

  // =========================================================================
  // 7. AUDIT LOG SANITIZATION & REDACTION
  // =========================================================================

  // Test 24: sanitizeErrorMessage masks private keys and secrets
  const rawSecretMsg = 'Google API error: private_key=-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...-----END PRIVATE KEY----- token=ya29.a0AfH6';
  const sanitized = sanitizeErrorMessage(rawSecretMsg);
  assert(
    'sanitizeErrorMessage strictly redacts private keys and bearer tokens',
    'SECURITY_SANITIZATION',
    !sanitized.includes('MIIEvgIB') && !sanitized.includes('ya29.a0AfH6') && sanitized.includes('[REDACTED]')
  );

  // Test 25: logOperationalEvent records sanitized audit entry
  const opLog = await auditService.logOperationalEvent(
    'TEST_OPERATIONAL_VERIFICATION',
    'RECOVERY',
    {
      secretKey: 'my-ultra-secret-key-12345',
      privateKey: '-----BEGIN PRIVATE KEY-----secret',
      safeMetric: 42,
    }
  );
  let parsedDetails: any = {};
  try {
    parsedDetails = typeof opLog.details === 'string' ? JSON.parse(opLog.details) : opLog.details;
  } catch {
    parsedDetails = {};
  }
  assert(
    'AuditService.logOperationalEvent sanitizes payload and masks secret fields with [REDACTED]',
    'SECURITY_SANITIZATION',
    Boolean(opLog && opLog.id && (parsedDetails?.secretKey === '[REDACTED]' || opLog.details?.includes('[REDACTED]')))
  );

  // Aggregate results
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;
  const success = failedTests === 0;

  return {
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests,
    success,
    results,
  };
}
