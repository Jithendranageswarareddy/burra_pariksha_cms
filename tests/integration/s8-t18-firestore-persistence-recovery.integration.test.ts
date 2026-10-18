/**
 * BURRA PARIKSHA CMS — S8-T18 Cloud Firestore Persistence, Authorization & Recovery Integration Test
 * Sprint 8: Production Data Layer Persistence, OCC, Concurrency & Recovery
 *
 * Verifies that the persistent Cloud Firestore adapter path for QuestionDrafts & Workflow:
 * 1. Fail Closed on Isolation: Positively verifies that execution target is either the local
 *    Firestore Emulator (FIRESTORE_EMULATOR_HOST) or an explicitly approved non-production test project
 *    (APPROVED_NON_PRODUCTION_PROJECT_ID). Stops and reports BLOCKED if isolation cannot be proven.
 * 2. Repository Round-Trip: Creates, reads, and updates drafts across fresh QuestionDraftsRepository instances.
 * 3. Persisted OCC Versioning: Enforces atomic version increments and rejects stale-version updates with ConcurrencyConflictError.
 * 4. Concurrent Update Coordination: Coordinates racing updates so that exactly one succeeds and concurrent collisions are rejected.
 * 5. Genuine Submission/Workflow Compensation: Exercises real submission & compensation path with controlled failure,
 *    verifying compensation back to Step 1, persisted state integrity, and successful retry.
 * 6. Audit Trail Preservation: Verifies audit records are persisted and immutably preserved (never deleted).
 * 7. Guaranteed Explicit Physical Cleanup: Physically deletes owned test records and verifies physical absence
 *    at the document level (never relying solely on soft-delete filtering findById).
 */

import assert from 'node:assert';
import http from 'node:http';
import { QuestionDraftsRepository } from '../../database/firestore/repositories/question-drafts.repository';
import { auditLogRepository } from '../../database/firestore/repositories/audit-log.repository';
import { workflowInstancesRepository } from '../../backend/domain/workflow';
import { questionDraftService } from '../../backend/features/question-generation/services/question-draft.service';
import { canonicalIdService, QuestionStatus, UserRole } from '../../shared';
import { ConcurrencyConflictError } from '../../src/lib/errors';
import { getAdminFirestore } from '../../database/firestore/adapter/admin';

function pass(name: string) {
  console.log(`  ✓ ${name}`);
}

/**
 * Authoritative registry of independently documented and approved non-production targets.
 * Under AGENTS.md Rule 14, ENVIRONMENT-CONTRACT.md, and S8-T18 data safety contracts:
 * - Persistent integration tests must NEVER execute against the production datastore.
 * - An approved target MUST be independently documented in docs/operations/ENVIRONMENT-CONTRACT.md.
 * - Both projectId AND databaseId must be explicitly approved (reject missing database approval).
 * - Environment variables alone (e.g. APPROVED_NON_PRODUCTION_PROJECT_ID) do NOT grant approval
 *   without matching an independently documented target in this registry.
 * - Safety is NEVER inferred from names (e.g. "ai-studio", "test", "dev", "sandbox").
 */
export interface ApprovedNonProductionTarget {
  readonly projectId: string;
  readonly databaseId: string;
  readonly documentedIn: string;
  readonly description: string;
}

export const INDEPENDENTLY_DOCUMENTED_APPROVED_TARGETS: readonly ApprovedNonProductionTarget[] = [
  // To register a remote non-production target: provision an isolated GCP Firestore database,
  // document it in docs/operations/ENVIRONMENT-CONTRACT.md Section 6, and register it here.
  // Note: Canonical production database 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e'
  // on project 'burra-pariksha-cms' is strictly PROHIBITED from ever being registered here.
];

export const KNOWN_PRODUCTION_TARGETS = [
  {
    projectId: 'burra-pariksha-cms',
    databaseId: 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e',
    reason: 'Production AI Studio applet database (ENVIRONMENT-CONTRACT.md Section 2)',
  },
  {
    projectId: 'burra-pariksha-cms',
    databaseId: '(default)',
    reason: 'Default GCP database for production project burra-pariksha-cms',
  },
];

export const APPROVED_SYNTHETIC_TEST_PROJECTS: readonly string[] = [
  'burra-pariksha-test',
  'burra-pariksha-emulator',
  'demo-burra-pariksha',
];

export interface IsolationVerification {
  isApproved: boolean;
  isolationMode: 'LOCAL_FIRESTORE_EMULATOR' | 'APPROVED_REMOTE_NON_PRODUCTION' | 'NONE';
  projectId: string;
  databaseId: string;
  emulatorHost: string | null;
  rejectionReasons: string[];
  approvalEvidence: string[];
}

export function evaluateDatastoreIsolation(
  activeProjectId: string,
  activeDatabaseId: string,
  env: NodeJS.ProcessEnv = process.env
): IsolationVerification {
  const rejectionReasons: string[] = [];
  const approvalEvidence: string[] = [];

  const emulatorHost = env.FIRESTORE_EMULATOR_HOST?.trim() || null;
  const envApprovedProject = (env.APPROVED_NON_PRODUCTION_PROJECT_ID || env.APPROVED_TEST_PROJECT_ID)?.trim() || null;
  const envApprovedDatabase = (env.APPROVED_NON_PRODUCTION_DATABASE_ID || env.APPROVED_TEST_DATABASE_ID)?.trim() || null;

  // Rule 1: Check known production target match (Immediate disqualification)
  const isProduction = KNOWN_PRODUCTION_TARGETS.some(
    (prod) =>
      prod.projectId === activeProjectId &&
      (prod.databaseId === activeDatabaseId || prod.databaseId === '(default)' || activeDatabaseId === '(default)')
  );
  if (
    isProduction ||
    activeProjectId === 'burra-pariksha-cms' ||
    activeDatabaseId === 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e'
  ) {
    rejectionReasons.push(
      `Active datastore (project="${activeProjectId}", database="${activeDatabaseId}") matches canonical production infrastructure. Under AGENTS.md Rule 14, persistent mutation tests against production are strictly prohibited.`
    );
  }

  // Rule 2: Evaluate local Firestore Emulator
  if (emulatorHost && emulatorHost.length > 0) {
    const hostPortRegex = /^([a-zA-Z0-9.-]+|\[[a-fA-F0-9:]+\]):[0-9]{1,5}$/;
    if (!hostPortRegex.test(emulatorHost)) {
      rejectionReasons.push(
        `Configured FIRESTORE_EMULATOR_HOST ("${emulatorHost}") is malformed. Expected valid host:port format (e.g. 127.0.0.1:8080).`
      );
    }

    // A non-empty emulator-host variable must NOT independently authorize test fixture creation, writes, or cleanup!
    const isApprovedSynthetic = APPROVED_SYNTHETIC_TEST_PROJECTS.includes(activeProjectId);
    if (!isApprovedSynthetic) {
      rejectionReasons.push(
        `Project "${activeProjectId}" is not an approved synthetic test project for emulator execution. Allowed projects: ${APPROVED_SYNTHETIC_TEST_PROJECTS.join(', ')}.`
      );
    }

    if (activeDatabaseId === 'ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e') {
      rejectionReasons.push(
        `Database "${activeDatabaseId}" matches canonical production database and is prohibited for emulator test execution.`
      );
    }

    if (rejectionReasons.length === 0) {
      approvalEvidence.push(
        `Configured for local Firestore Emulator at ${emulatorHost} with approved synthetic project "${activeProjectId}" and database "${activeDatabaseId}"`
      );
      return {
        isApproved: true,
        isolationMode: 'LOCAL_FIRESTORE_EMULATOR',
        projectId: activeProjectId,
        databaseId: activeDatabaseId,
        emulatorHost,
        rejectionReasons: [],
        approvalEvidence,
      };
    }

    return {
      isApproved: false,
      isolationMode: 'LOCAL_FIRESTORE_EMULATOR',
      projectId: activeProjectId,
      databaseId: activeDatabaseId,
      emulatorHost,
      rejectionReasons,
      approvalEvidence: [],
    };
  } else {
    rejectionReasons.push(
      'Missing emulator configuration: FIRESTORE_EMULATOR_HOST is required for local emulator execution.'
    );
  }

  // Rule 3: Reject missing database approval (both project and database are mandatory)
  if (!envApprovedDatabase || envApprovedDatabase.length === 0) {
    rejectionReasons.push(
      'Missing database approval: APPROVED_NON_PRODUCTION_DATABASE_ID is required but not provided. Both project ID and database ID must be explicitly approved.'
    );
  }

  if (!envApprovedProject || envApprovedProject.length === 0) {
    rejectionReasons.push(
      'Missing project approval: APPROVED_NON_PRODUCTION_PROJECT_ID is required but not provided.'
    );
  }

  // Rule 4: Do not accept environment variables alone as proof of approval.
  // Both project ID and database ID must match an independently documented target.
  const documentedMatch = INDEPENDENTLY_DOCUMENTED_APPROVED_TARGETS.find(
    (target) =>
      target.projectId === activeProjectId &&
      target.databaseId === activeDatabaseId &&
      target.projectId === envApprovedProject &&
      target.databaseId === envApprovedDatabase
  );

  if (!documentedMatch) {
    rejectionReasons.push(
      `Target (project="${activeProjectId}", database="${activeDatabaseId}") does not match any entry in INDEPENDENTLY_DOCUMENTED_APPROVED_TARGETS. Environment variables alone cannot grant approval without independent architectural documentation.`
    );
  }

  // Rule 5: Never infer safety from names (e.g. "ai-studio", "test", "dev")
  // (Zero substring matching performed)

  const isRemoteApproved = Boolean(
    !isProduction &&
    envApprovedProject &&
    envApprovedDatabase &&
    documentedMatch
  );

  if (isRemoteApproved && documentedMatch) {
    approvalEvidence.push(
      `Approved remote non-production target verified against ${documentedMatch.documentedIn}: ${documentedMatch.description}`
    );
    return {
      isApproved: true,
      isolationMode: 'APPROVED_REMOTE_NON_PRODUCTION',
      projectId: activeProjectId,
      databaseId: activeDatabaseId,
      emulatorHost: null,
      rejectionReasons: [],
      approvalEvidence,
    };
  }

  return {
    isApproved: false,
    isolationMode: 'NONE',
    projectId: activeProjectId,
    databaseId: activeDatabaseId,
    emulatorHost,
    rejectionReasons,
    approvalEvidence: [],
  };
}

export function verifyFirebaseAdminBinding(
  db: any,
  expected: { projectId: string; databaseId: string; emulatorHost: string }
): void {
  const actualProjectId = db.projectId || db._settings?.projectId;
  const actualDatabaseId = db.databaseId || db._settings?.databaseId;
  const settings = db._settings || {};
  const [expectedHost, expectedPortStr] = expected.emulatorHost.split(':');
  const expectedPort = parseInt(expectedPortStr, 10);

  if (actualProjectId !== expected.projectId) {
    throw new Error(
      `Firebase Admin client misconfigured: bound to project "${actualProjectId}", expected approved synthetic project "${expected.projectId}".`
    );
  }

  if (actualDatabaseId !== expected.databaseId) {
    throw new Error(
      `Firebase Admin client misconfigured: bound to database "${actualDatabaseId}", expected approved test database "${expected.databaseId}".`
    );
  }

  if (settings.servicePath !== expectedHost || settings.port !== expectedPort) {
    throw new Error(
      `Firebase Admin client is not connected to emulator host: bound to "${settings.servicePath}:${settings.port}", expected "${expected.emulatorHost}".`
    );
  }

  if (settings.ssl === true) {
    throw new Error('Firebase Admin client has SSL enabled; local emulator requires plaintext HTTP (ssl: false).');
  }
}

export async function probeFirestoreConnectivity(
  db: any,
  timeoutMs: number = 3000
): Promise<{ reachable: boolean; error?: string }> {
  const settings = db?._settings || {};
  const host = settings.servicePath || '127.0.0.1';
  const port = settings.port || 8080;

  // First check fast TCP reachability via HTTP socket
  const isTcpReachable = await new Promise<boolean>((resolve) => {
    const req = http.get(`http://${host}:${port}`, () => resolve(true));
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });

  if (!isTcpReachable) {
    return {
      reachable: false,
      error: `Connection refused to emulator at ${host}:${port}. Is the local emulator running?`,
    };
  }

  try {
    const probePromise = db.collection('_isolation_probe').limit(1).get();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Connection probe timed out after ${timeoutMs}ms`)), timeoutMs)
    );
    await Promise.race([probePromise, timeoutPromise]);
    return { reachable: true };
  } catch (err: any) {
    return { reachable: false, error: err?.message || String(err) };
  }
}

async function runS8T18FirestorePersistenceIntegrationTest() {
  console.log('========================================================================');
  console.log('S8-T18: CLOUD FIRESTORE PERSISTENCE, CONCURRENCY & RECOVERY TEST');
  console.log('========================================================================\n');

  // --------------------------------------------------------------------------
  // MANDATORY STEP 1: Positively Verify Target Isolation (Fail Closed)
  // --------------------------------------------------------------------------
  console.log('[Step 1] Positively Verifying Target Isolation & Approved Non-Production Datastore...');
  const db = getAdminFirestore();
  const activeDbId = (db as any)._settings?.databaseId || (db as any).databaseId || '(default)';
  const activeProjectId = (db as any)._settings?.projectId || (db as any).projectId || 'burra-pariksha-cms';

  const isolation = evaluateDatastoreIsolation(activeProjectId, activeDbId);

  console.log(`  Configured Emulator Host:       ${isolation.emulatorHost || 'None'}`);
  console.log(`  Active GCP Project ID:          ${activeProjectId}`);
  console.log(`  Active Firestore Database ID:   ${activeDbId}`);
  console.log(`  Target Isolation Mode:          ${isolation.isolationMode}`);
  console.log(`  Approved by Independent Doc:    ${isolation.isApproved ? 'YES' : 'NO'}`);

  if (!isolation.isApproved) {
    console.log('\n========================================================================');
    console.log('STATUS: BLOCKED');
    console.log('REASON: Target isolation could not be established.');
    console.log('------------------------------------------------------------------------');
    console.log('Isolation Rejection Details:');
    isolation.rejectionReasons.forEach((r, idx) => console.log(`  ${idx + 1}. ${r}`));
    console.log('------------------------------------------------------------------------');
    console.log('Under AGENTS.md Rule 14 and S8-T18 data safety contracts, persistent mutation');
    console.log('tests against unverified or production databases are strictly prohibited.');
    console.log('Failing closed: zero writes made to unverified datastore.');
    console.log('========================================================================\n');
    process.exit(2);
  }

  // Probe live connectivity only after isolation is positively verified
  let isFirestoreAvailable = false;
  try {
    await db.collection('question_drafts').limit(1).get();
    isFirestoreAvailable = true;
    console.log('  Live Cloud Firestore / Emulator connection probe: SUCCESS\n');
  } catch (err: any) {
    console.error(`\n❌ [Connection Probe Failed] Cloud Firestore target not reachable: ${err?.message}`);
  }

  if (!isFirestoreAvailable) {
    console.log('\n========================================================================');
    console.log('STATUS: BLOCKED');
    console.log('REASON: Approved Firestore/Emulator target was unreachable.');
    console.log('========================================================================\n');
    process.exit(2);
  }

  pass(`Target isolation & connectivity verified (${isolation.isolationMode}): Operating against approved non-production datastore`);

  // Tracking registry for explicit cleanup ownership
  const testNamespace = `s8_t18_int_${Date.now()}`;
  const trackedRecords = {
    drafts: [] as { id: string; version: number }[],
    workflows: [] as { id: string; version: number }[],
    auditLogs: [] as string[],
  };

  const initialDraftRepo = new QuestionDraftsRepository();
  const persistenceMode = await initialDraftRepo.getPersistenceMode();
  assert.strictEqual(persistenceMode, 'FIRESTORE', 'Persistence mode must be "FIRESTORE"');
  pass('Repository adapter operating in real FIRESTORE mode (not in-memory fallback)');

  try {
    // ------------------------------------------------------------------------
    // STEP 2: Create & Read Across Fresh Repository Instances
    // ------------------------------------------------------------------------
    console.log('\n--- Step 2: Create & Read Across Fresh Repository Instances ---');
    const testDraftId = canonicalIdService.generateDraftId();
    const testTopicId = 'TOP-QA-01'; // Canonical production topic
    const testSubtopicId = 'SUB-01'; // Canonical production subtopic

    const createdDraft = await initialDraftRepo.create({
      id: testDraftId,
      topicId: testTopicId,
      subtopicId: testSubtopicId,
      difficulty: 'Intermediate',
      language: 'TELUGU',
      questionText: `[SYNTHETIC TEST - S8-T18 - ${testNamespace}]`,
      question: `[SYNTHETIC TEST - S8-T18 - ${testNamespace}]`,
      options: { a: '10 km/h', b: '20 km/h', c: '30 km/h', d: '40 km/h' },
      optionA: '10 km/h',
      optionB: '20 km/h',
      optionC: '30 km/h',
      optionD: '40 km/h',
      correctAnswer: 'B',
      explanation: 'Explanation for synthetic test record',
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 1,
      aspectRatio: '9:16',
      status: QuestionStatus.DRAFT,
      workflowStage: 'QUESTION_STUDIO',
      authorId: `usr_${testNamespace}_author`,
      authorName: 'Synthetic Author S8T18',
    } as any);

    assert.strictEqual(createdDraft.id, testDraftId);
    assert.strictEqual(createdDraft.version, 1);
    trackedRecords.drafts.push({ id: testDraftId, version: 1 });
    pass('2.1 Synthetic draft created in Cloud Firestore with version 1');

    // Fresh repository instance simulating brand new session
    const freshSessionRepo = new QuestionDraftsRepository();
    const retrievedDraft = await freshSessionRepo.findById(testDraftId);
    assert(retrievedDraft !== null, 'Draft must be retrievable from fresh repository instance');
    assert.strictEqual(retrievedDraft.id, testDraftId);
    assert.strictEqual(retrievedDraft.questionText, `[SYNTHETIC TEST - S8-T18 - ${testNamespace}]`);
    assert.strictEqual(retrievedDraft.workflowStage, 'QUESTION_STUDIO');
    pass('2.2 Draft successfully re-hydrated from Cloud Firestore across session boundary');

    // ------------------------------------------------------------------------
    // STEP 3: Atomic OCC Version Increment
    // ------------------------------------------------------------------------
    console.log('\n--- Step 3: Atomic OCC Version Increment in Cloud Firestore ---');
    const updatedDraft = await freshSessionRepo.update(
      testDraftId,
      {
        ...retrievedDraft,
        questionText: `[SYNTHETIC TEST - S8-T18 UPDATED - ${testNamespace}]`,
      },
      { expectedVersion: 1 }
    );
    assert.strictEqual(updatedDraft.version, 2, 'Version must atomically increment to 2');
    // Update tracked version for cleanup
    const draftTracked = trackedRecords.drafts.find((d) => d.id === testDraftId);
    if (draftTracked) draftTracked.version = 2;
    pass('3.1 Draft updated in Cloud Firestore with atomic OCC version increment to 2');

    // ------------------------------------------------------------------------
    // STEP 4: Stale-Version Transaction Conflict Rejection
    // ------------------------------------------------------------------------
    console.log('\n--- Step 4: Stale-Version OCC Transaction Conflict Rejection ---');
    let staleConflictCaught = false;
    try {
      await freshSessionRepo.update(
        testDraftId,
        {
          ...retrievedDraft,
          questionText: 'Malicious stale overwrite attempt',
        },
        { expectedVersion: 1 } // Stale! Datastore is already at version 2
      );
    } catch (err: any) {
      staleConflictCaught = err instanceof ConcurrencyConflictError || err.statusCode === 409 || err.code === 'CONFLICT_OPTIMISTIC_LOCK';
    }
    assert.strictEqual(staleConflictCaught, true, 'Stale expectedVersion=1 update MUST throw ConcurrencyConflictError');

    // Verify datastore was NOT modified by stale attempt
    const thirdRepoInstance = new QuestionDraftsRepository();
    const verifyUnchangedDraft = await thirdRepoInstance.findById(testDraftId);
    assert.strictEqual(verifyUnchangedDraft?.version, 2, 'Draft version must remain 2 after rejected stale update');
    assert.strictEqual(verifyUnchangedDraft?.questionText, `[SYNTHETIC TEST - S8-T18 UPDATED - ${testNamespace}]`);
    pass('4.1 Stale OCC update rejected by native Firestore transaction without corrupting persisted state');

    // ------------------------------------------------------------------------
    // STEP 5: Duplicate / Concurrent Submission Protection via OCC
    // ------------------------------------------------------------------------
    console.log('\n--- Step 5: Duplicate / Concurrent Submission Protection via OCC ---');
    const concurrentDraftId = canonicalIdService.generateDraftId();
    trackedRecords.drafts.push({ id: concurrentDraftId, version: 1 });

    const concurrentDraft = await initialDraftRepo.create({
      id: concurrentDraftId,
      topicId: testTopicId,
      subtopicId: testSubtopicId,
      difficulty: 'Easy',
      language: 'TELUGU',
      questionText: `[CONCURRENT TEST - S8-T18 - ${testNamespace}]`,
      options: { a: '1', b: '2', c: '3', d: '4' },
      optionA: '1',
      optionB: '2',
      optionC: '3',
      optionD: '4',
      correctAnswer: 'A',
      explanation: 'Explanation',
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      status: QuestionStatus.DRAFT,
      workflowStage: 'QUESTION_STUDIO',
      authorId: `usr_${testNamespace}_author`,
      authorName: 'Synthetic Author S8T18',
    } as any);
    assert.strictEqual(concurrentDraft.version, 1);

    // Fire two racing updates with expectedVersion: 1 simultaneously against real Cloud Firestore
    const repoA = new QuestionDraftsRepository();
    const repoB = new QuestionDraftsRepository();

    const [resultA, resultB] = await Promise.allSettled([
      repoA.update(
        concurrentDraftId,
        { status: 'SUBMITTED_FOR_REVIEW' as any, workflowStage: 'STAGE_02_VERIFICATION' },
        { expectedVersion: 1 }
      ),
      repoB.update(
        concurrentDraftId,
        { status: 'SUBMITTED_FOR_REVIEW' as any, workflowStage: 'STAGE_02_VERIFICATION' },
        { expectedVersion: 1 }
      ),
    ]);

    const successes = [resultA, resultB].filter((r) => r.status === 'fulfilled');
    const failures = [resultA, resultB].filter((r) => r.status === 'rejected');

    assert.strictEqual(successes.length, 1, 'Exactly one concurrent submission must succeed in Cloud Firestore');
    assert.strictEqual(failures.length, 1, 'Exactly one concurrent submission must fail with OCC conflict');

    const winnerDoc = (successes[0] as PromiseFulfilledResult<any>).value;
    assert.strictEqual(winnerDoc.version, 2, 'Winner must atomically advance version to 2');
    const concurrentTracked = trackedRecords.drafts.find((d) => d.id === concurrentDraftId);
    if (concurrentTracked) concurrentTracked.version = 2;
    pass('5.1 Concurrent submissions against Cloud Firestore safely coordinated via atomic transactions');

    // ------------------------------------------------------------------------
    // STEP 6: Genuine Submission/Workflow Compensation Path with Controlled Failure
    // ------------------------------------------------------------------------
    console.log('\n--- Step 6: Genuine Submission / Workflow Compensation Path ---');
    const recoveryDraftId = canonicalIdService.generateDraftId();
    trackedRecords.drafts.push({ id: recoveryDraftId, version: 1 });

    const recoveryDraft = await initialDraftRepo.create({
      id: recoveryDraftId,
      topicId: testTopicId,
      subtopicId: testSubtopicId,
      difficulty: 'Medium',
      language: 'TELUGU',
      questionText: `[GENUINE RECOVERY TEST - S8-T18 - ${testNamespace}]`,
      options: { a: '10', b: '20', c: '30', d: '40' },
      optionA: '10',
      optionB: '20',
      optionC: '30',
      optionD: '40',
      correctAnswer: 'B',
      explanation: 'Detailed explanation for genuine recovery test',
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      status: QuestionStatus.DRAFT,
      workflowStage: 'QUESTION_STUDIO',
      authorId: `usr_${testNamespace}_author`,
      authorName: 'Synthetic Author S8T18',
    } as any);

    // Create an existing workflow instance at Step 1 (Stage 01 Question Studio) in Cloud Firestore
    const workflowId = `wfl_${testNamespace}_${Date.now()}`;
    trackedRecords.workflows.push({ id: workflowId, version: 1 });
    await workflowInstancesRepository.create({
      id: workflowId,
      entityId: recoveryDraftId,
      entityType: 'QUESTION',
      currentStep: 1,
      contentStatus: 'DRAFT',
      mediaStatus: 'NOT_REQUIRED',
      publicationStatus: 'UNPUBLISHED',
      jobStatus: 'IDLE',
      authorId: `usr_${testNamespace}_author`,
    } as any);

    // Link workflowInstanceId to draft in Cloud Firestore
    const updatedDraftWithWf = await initialDraftRepo.update(
      recoveryDraftId,
      { workflowInstanceId: workflowId },
      { expectedVersion: 1 }
    );
    const recTracked = trackedRecords.drafts.find((d) => d.id === recoveryDraftId);
    if (recTracked) recTracked.version = updatedDraftWithWf.version;

    const actor = {
      id: `usr_${testNamespace}_author`,
      name: 'Synthetic Author S8T18',
      role: UserRole.QUESTION_CREATOR,
    };

    // Exercise real submission/workflow compensation path:
    // Intercept questionDraftsRepository.update once to inject controlled failure during submit
    const originalDraftUpdate = (initialDraftRepo as any).update.bind(initialDraftRepo);
    const singletonDraftRepo = (await import('../../database/firestore/repositories/question-drafts.repository')).questionDraftsRepository;
    const originalSingletonUpdate = singletonDraftRepo.update.bind(singletonDraftRepo);

    let controlledFailureTriggered = false;
    singletonDraftRepo.update = async (recordOrId: any, updates?: any, options?: any) => {
      const targetId = typeof recordOrId === 'string' ? recordOrId : recordOrId?.id;
      if (targetId === recoveryDraftId && !controlledFailureTriggered) {
        controlledFailureTriggered = true;
        // Bump version concurrently in datastore to simulate racing write
        await originalSingletonUpdate(recoveryDraftId, { explanation: 'concurrent collision injected' });
        // Call real repository update with expectedVersion, which detects OCC collision
        return originalSingletonUpdate(recordOrId, updates, options);
      }
      return originalSingletonUpdate(recordOrId, updates, options);
    };

    try {
      let submissionErrorThrown = false;
      try {
        await questionDraftService.submitForVerification(
          {
            draftId: recoveryDraftId,
            remarks: 'Controlled failure test submission',
            expectedVersion: updatedDraftWithWf.version,
          },
          actor
        );
      } catch (err: any) {
        submissionErrorThrown = true;
      }
      assert.strictEqual(submissionErrorThrown, true, 'Submission must fail closed and throw upon datastore error');
      assert.strictEqual(controlledFailureTriggered, true, 'Controlled failure injection was triggered');

      // VERIFY COMPENSATION in real datastore:
      // Workflow instance must be safely reconciled back to Step 1 / DRAFT
      const compensatedWf = await workflowInstancesRepository.findById(workflowId);
      assert(compensatedWf !== null, 'Workflow instance must exist');
      assert.strictEqual(compensatedWf.currentStep, 1, 'Reconciled workflow instance must be restored to Step 1');
      assert.strictEqual(compensatedWf.contentStatus, 'DRAFT', 'Reconciled workflow instance status must remain DRAFT');

      // VERIFY PERSISTED DRAFT STATE INTEGRITY:
      // Draft must NOT be marked SUBMITTED_FOR_REVIEW and must remain in QUESTION_STUDIO stage
      const draftAfterFailure = await freshSessionRepo.findById(recoveryDraftId);
      assert(draftAfterFailure !== null);
      assert.strictEqual(draftAfterFailure.status, 'DRAFT', 'Draft status must remain DRAFT after failure');
      assert.strictEqual(draftAfterFailure.workflowStage, 'QUESTION_STUDIO', 'Draft stage must remain QUESTION_STUDIO');
      pass('6.1 Genuine submission compensation verified: workflow restored to Step 1 / DRAFT, draft uncorrupted');
    } finally {
      // Restore repository methods
      singletonDraftRepo.update = originalSingletonUpdate;
    }

    // VERIFY SUCCESSFUL RETRY on real Cloud Firestore path
    const latestRecoveryDraft = await freshSessionRepo.findById(recoveryDraftId);
    assert(latestRecoveryDraft !== null);
    if (recTracked) recTracked.version = latestRecoveryDraft.version;

    const retryResult = await questionDraftService.submitForVerification(
      {
        draftId: recoveryDraftId,
        remarks: 'Retry submission after recovery',
        expectedVersion: latestRecoveryDraft.version,
      },
      actor
    );
    assert.strictEqual(retryResult.success, true);
    assert.strictEqual(retryResult.workflowStage, 'STAGE_02_VERIFICATION');
    assert.strictEqual(retryResult.currentStep, 2);

    // Verify persisted state in Cloud Firestore
    const finalRecoveryDraft = await freshSessionRepo.findById(recoveryDraftId);
    assert.strictEqual(finalRecoveryDraft?.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(finalRecoveryDraft?.workflowStage, 'STAGE_02_VERIFICATION');
    if (recTracked) recTracked.version = finalRecoveryDraft.version;

    const finalWf = await workflowInstancesRepository.findById(workflowId);
    assert.strictEqual(finalWf?.currentStep, 2);
    if (trackedRecords.workflows[0]) trackedRecords.workflows[0].version = finalWf?.version || 2;
    pass('6.2 Safe retry after recovery successfully advanced draft and workflow to Stage 02');

    // ------------------------------------------------------------------------
    // STEP 7: Audit Trail Preservation
    // ------------------------------------------------------------------------
    console.log('\n--- Step 7: Audit Trail Preservation in Cloud Firestore ---');
    const auditRecord = await auditLogRepository.logAction(
      `usr_${testNamespace}_author`,
      'Synthetic Author S8T18',
      'QUESTION_DRAFT_SUBMITTED_FOR_VERIFICATION',
      'QUESTION_DRAFT',
      recoveryDraftId,
      { remarks: 'Persistent test submission', timestamp: new Date().toISOString() }
    );
    trackedRecords.auditLogs.push(auditRecord.id);

    const fetchedAuditLog = await auditLogRepository.findById(auditRecord.id);
    assert(fetchedAuditLog !== null, 'Audit log must be written to and retrievable from Cloud Firestore');
    assert.strictEqual(fetchedAuditLog.entityId, recoveryDraftId);
    pass('7.1 Authoritative audit record persisted to Cloud Firestore audit_logs collection');

    console.log('\n========================================================================');
    console.log('ALL S8-T18 CLOUD FIRESTORE PERSISTENCE CHECKS PASSED SUCCESSFULLY');
    console.log('========================================================================\n');
  } finally {
    // ------------------------------------------------------------------------
    // STEP 8: Guaranteed Explicit Physical Cleanup of Test-Owned Records
    // ------------------------------------------------------------------------
    console.log('[Step 8] Executing Guaranteed Explicit Physical Cleanup in Cloud Firestore...');
    let draftsPhysicallyDeleted = 0;
    let workflowsPhysicallyDeleted = 0;

    // 1. Physically delete test drafts using repository's physical deletion contract
    const cleanupDraftRepo = new QuestionDraftsRepository();
    const draftFirestoreRepo = await cleanupDraftRepo.getFirestoreRepository();

    for (const draftRecord of trackedRecords.drafts) {
      try {
        const existing = await (draftFirestoreRepo as any).findById(draftRecord.id, { includeDeleted: true });
        if (existing) {
          // Actual physical deletion via underlying FirestoreRepository contract (physical = true)
          await (draftFirestoreRepo as any).delete(draftRecord.id, existing.version, undefined, true);
          draftsPhysicallyDeleted++;
        }
      } catch (err) {
        console.warn(`[CleanupWarning] Failed to physically delete draft ${draftRecord.id}:`, err);
      }
    }

    // VERIFY PHYSICAL ABSENCE AT DOCUMENT LEVEL (do not rely solely on default findById)
    let remainingDraftsPhysicalCount = 0;
    for (const draftRecord of trackedRecords.drafts) {
      const rawDocSnap = await db.collection('question_drafts').doc(draftRecord.id).get();
      if (rawDocSnap.exists) {
        remainingDraftsPhysicalCount++;
      }
      const repoQuery = await (draftFirestoreRepo as any).findById(draftRecord.id, { includeDeleted: true });
      if (repoQuery !== null) {
        remainingDraftsPhysicalCount++;
      }
    }
    assert.strictEqual(remainingDraftsPhysicalCount, 0, 'All test-created drafts must be PHYSICALLY ABSENT from Firestore');

    // 2. Physically delete test workflow instances using actual deletion contract
    for (const wfRecord of trackedRecords.workflows) {
      try {
        const existing = await (workflowInstancesRepository as any).findById(wfRecord.id, { includeDeleted: true });
        if (existing) {
          await (workflowInstancesRepository as any).delete(wfRecord.id, existing.version, undefined, true);
          workflowsPhysicallyDeleted++;
        }
      } catch (err) {
        console.warn(`[CleanupWarning] Failed to physically delete workflow instance ${wfRecord.id}:`, err);
      }
    }

    let remainingWorkflowsPhysicalCount = 0;
    for (const wfRecord of trackedRecords.workflows) {
      const rawDocSnap = await db.collection('workflow_instances').doc(wfRecord.id).get();
      if (rawDocSnap.exists) {
        remainingWorkflowsPhysicalCount++;
      }
      const repoQuery = await (workflowInstancesRepository as any).findById(wfRecord.id, { includeDeleted: true });
      if (repoQuery !== null) {
        remainingWorkflowsPhysicalCount++;
      }
    }
    assert.strictEqual(remainingWorkflowsPhysicalCount, 0, 'All test-created workflows must be PHYSICALLY ABSENT from Firestore');

    // 3. Verify audit events are IMMUTABLY PRESERVED (never deleted during cleanup)
    let retainedAuditCount = 0;
    for (const audId of trackedRecords.auditLogs) {
      const auditDoc = await auditLogRepository.findById(audId);
      if (auditDoc) retainedAuditCount++;
    }
    if (trackedRecords.auditLogs.length > 0) {
      assert.strictEqual(
        retainedAuditCount,
        trackedRecords.auditLogs.length,
        'Audit records must be retained immutably in Cloud Firestore'
      );
    }

    console.log('------------------------------------------------------------------------');
    console.log('CLOUD FIRESTORE CLEANUP & AUDIT RETENTION SUMMARY:');
    console.log(`- Target Project / DB:       ${activeProjectId} / ${activeDbId}`);
    console.log(`- Synthetic Test Namespace:  ${testNamespace}`);
    console.log(`- Created Synthetic Drafts:  ${trackedRecords.drafts.length}`);
    console.log(`- Physically Deleted Drafts: ${draftsPhysicallyDeleted} (Verified physically absent: 0 remaining)`);
    console.log(`- Created Synthetic WFs:     ${trackedRecords.workflows.length}`);
    console.log(`- Physically Deleted WFs:    ${workflowsPhysicallyDeleted} (Verified physically absent: 0 remaining)`);
    console.log(`- Retained Audit Events:     ${retainedAuditCount} (IMMUTABLY PRESERVED IN CLOUD FIRESTORE)`);
    console.log('------------------------------------------------------------------------\n');

    try {
      await db.terminate();
    } catch {}
  }
}

if (process.argv[1] && process.argv[1].includes('s8-t18-firestore-persistence-recovery.integration.test')) {
  runS8T18FirestorePersistenceIntegrationTest().catch((err) => {
    console.error('\n❌ S8-T18 Cloud Firestore Persistence Integration Test Failed:', err);
    process.exit(1);
  });
}
