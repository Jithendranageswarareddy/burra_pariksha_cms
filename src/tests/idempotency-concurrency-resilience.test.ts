/**
 * A-02.3.2b: QUESTION CREATION IDEMPOTENCY — CONCURRENCY, PAYLOAD BINDING & BOUNDED CACHE
 * REGRESSION SUITE
 * 
 * Verifies all 31 specific idempotency, concurrency, payload binding, and bounded cache guarantees:
 * - Deterministic payload hashing / fingerprinting
 * - Normalization of valid keys
 * - In-flight concurrency deduplication (single allocation, shared resolution)
 * - Cached replay after completion
 * - Payload conflict detection (during in-flight and post-completion)
 * - Non-fatal auxiliary failure caching & resolution
 * - Cache bounds (LRU eviction and TTL expiry)
 * - Safe exemption of idempotencyKey in audit payload sanitization
 * - Strict preservation of A-02.3.2a compensation guarantees
 */

import { questionService, QuestionService } from '../lib/services/question.service';
import { contentMasterService } from '../lib/services/content-master.service';
import { idService } from '../lib/services/id.service';
import { MultiLayerVerificationEngine } from '../lib/validation/multi-layer-verification.engine';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { smartRandomService } from '../lib/services/smart-random.service';
import { questionConfigService } from '../lib/services/question-config.service';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { workflowService, auditService } from '../lib/services/audit.service';
import { validationsRepository } from '../lib/repositories/validations.repository';
import { QuestionCreationValidator } from '../lib/validators/question-creation.validator';
import { IdempotencyConflictError, ValidationError } from '../lib/google-sheets/errors';
import { UserRole, Question, QuestionLanguage } from '../types';

export async function runIdempotencyConcurrencyResilienceTests() {
  console.log('========================================================================');
  console.log('A-02.3.2b: IDEMPOTENCY CONCURRENCY & BOUNDED CACHE REGRESSION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total.toString().padStart(2, ' ')}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total.toString().padStart(2, ' ')}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // Ensure test mode isolation is active
  process.env.NODE_ENV = 'test';
  delete process.env.ALLOW_LIVE_TEST_WRITES;

  // Track repository and sequence calls
  let allocatedQuestionCount = 0;
  let allocatedContentMasterCount = 0;
  let persistedQuestions: Question[] = [];
  let persistedContentMasters: any[] = [];
  let deletedContentMasterIds: string[] = [];

  // Base Valid Payload Template
  const basePayload = {
    creationMode: 'manual' as const,
    categoryId: 'CAT-001',
    topicId: 'TOPIC-001',
    subtopicId: 'SUBTOPIC-001',
    difficulty: 'Easy',
    language: 'TELUGU',
    presentationType: 'Text',
    challengeType: 'ABCD',
    realLifeContext: 'DAILY_LIFE',
    questionStyle: 'STORY_BASED',
    questionText: 'Which planet is known as the Red Planet in our solar system?',
    options: {
      a: 'Venus',
      b: 'Mars',
      c: 'Jupiter',
      d: 'Saturn',
    },
    correctAnswer: 'B' as const,
    explanation: 'Mars is commonly referred to as the Red Planet due to iron oxide on its surface.',
  };

  // Setup standard mocks
  idService.allocateQuestionId = async () => {
    allocatedQuestionCount++;
    return `BP-Q-${allocatedQuestionCount.toString().padStart(6, '0')}`;
  };

  idService.allocateContentMasterId = async () => {
    allocatedContentMasterCount++;
    return `BP-CM-${allocatedContentMasterCount.toString().padStart(6, '0')}`;
  };

  taxonomyService.validateQuestionTaxonomy = async (topicId, subtopicId, categoryId) => {
    return {
      category: { id: categoryId || 'CAT-001', name: 'General Science', code: 'GS' } as any,
      topic: { id: topicId || 'TOPIC-001', name: 'Astronomy', categoryId: 'CAT-001' } as any,
      subtopic: { id: subtopicId || 'SUBTOPIC-001', name: 'Planets', topicId: 'TOPIC-001' } as any,
    };
  };

  smartRandomService.resolveParameters = async (params) => {
    return {
      categoryId: params.categoryId || 'CAT-001',
      categoryName: 'General Science',
      topicId: params.topicId || 'TOPIC-001',
      topicName: 'Astronomy',
      subtopicId: params.subtopicId || 'SUBTOPIC-001',
      subtopicName: 'Planets',
      difficulty: params.difficulty || 'MEDIUM',
      realLifeContext: params.realLifeContext || 'Daily Life',
      challengeType: params.challengeType || 'CONCEPTUAL',
      presentationType: params.presentationType || 'TEXT_ONLY',
      language: (params.language as QuestionLanguage) || QuestionLanguage.TELUGU,
      generationMode: 'SUBTOPIC',
    };
  };

  MultiLayerVerificationEngine.verify = async (q) => {
    return {
      id: `VER-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      aggregatedStatus: 'VERIFIED',
      canSave: true,
      canonicalValidationStatus: 'VERIFIED',
      confidenceScore: 98,
      overallErrors: [],
      overallWarnings: [],
      layers: {
        '1': { status: 'VERIFIED', summary: 'Taxonomy valid' },
        '2': { status: 'VERIFIED', summary: 'Schema valid' },
        '3': { status: 'N/A', summary: 'No math needed' },
        '4': { status: 'VERIFIED', summary: 'Language correct' },
        '5': { status: 'VERIFIED', summary: 'Answer consistent' },
        '6': { status: 'VERIFIED', summary: 'Options valid' },
        '7': { status: 'VERIFIED', summary: 'Explanation sound' },
        '8': { status: 'VERIFIED', summary: 'No sensitive content' },
      },
      layerList: [
        { layerId: '1', layerName: 'Taxonomy', status: 'VERIFIED', summary: 'Taxonomy valid' },
        { layerId: '2', layerName: 'Schema', status: 'VERIFIED', summary: 'Schema valid' },
      ],
      humanReviewState: 'NOT_REQUIRED',
    } as any;
  };

  validationsRepository.saveValidationResult = async (res: any) => {
    return res;
  };

  questionConfigService.getRealLifeContexts = async () => {
    return [
      { code: 'DAILY_LIFE', displayLabel: 'Daily Life', isActive: true } as any,
    ];
  };

  questionConfigService.getQuestionStyles = async () => {
    return [
      { code: 'STORY_BASED', displayLabel: 'Story Based', isActive: true } as any,
    ];
  };

  questionConfigService.getDefaultQuestionStyle = async () => {
    return { code: 'STORY_BASED', displayLabel: 'Story Based', isActive: true } as any;
  };

  questionsRepository.appendRecord = async (q) => {
    persistedQuestions.push(q);
    return q;
  };

  contentMastersRepository.create = async (cm) => {
    persistedContentMasters.push(cm);
    return cm;
  };

  contentMastersRepository.delete = async (id) => {
    deletedContentMasterIds.push(id);
    return true;
  };

  auditLogRepository.appendRecord = async (entry: any) => {
    return entry;
  };

  // Reset before test suite
  questionService.clearIdempotencyCache();

  // ------------------------------------------------------------------------------------------------
  // GROUP 1: IDEMPOTENCY KEY VALIDATION & NORMALIZATION (Tests 1 - 7)
  // ------------------------------------------------------------------------------------------------
  
  // Test 1: Normalizes key by trimming whitespace
  const norm1 = QuestionCreationValidator.normalizeIdempotencyKey('  abc-123  ');
  assert(norm1 === 'abc-123', 'Key Normalization trims surrounding whitespace');

  // Test 2: Throws ValidationError for empty string or whitespace-only
  let whitespaceRejected = false;
  try {
    QuestionCreationValidator.normalizeIdempotencyKey('   ');
  } catch (err) {
    whitespaceRejected = err instanceof ValidationError;
  }
  assert(whitespaceRejected, 'Key Normalization throws ValidationError for empty/whitespace-only');

  // Test 3: Returns undefined for null/undefined input
  const norm3 = QuestionCreationValidator.normalizeIdempotencyKey(undefined);
  assert(norm3 === undefined, 'Key Normalization returns undefined for null/undefined');

  // Test 4: Rejects non-string types with ValidationError
  let nonStringRejected = false;
  try {
    QuestionCreationValidator.normalizeIdempotencyKey(12345 as any);
  } catch (err) {
    nonStringRejected = err instanceof ValidationError;
  }
  assert(nonStringRejected, 'Key Normalization throws ValidationError for non-string types');

  // Test 5: Rejects keys exceeding 255 characters
  let tooLongRejected = false;
  try {
    QuestionCreationValidator.normalizeIdempotencyKey('a'.repeat(256));
  } catch (err) {
    tooLongRejected = err instanceof ValidationError;
  }
  assert(tooLongRejected, 'Key Normalization throws ValidationError for keys > 255 chars');

  // Test 6: Accepts valid UUID / custom string keys
  const normUUID = QuestionCreationValidator.normalizeIdempotencyKey('f592ca42-39af-4d83-aff2-6870ba939b0e');
  assert(normUUID === 'f592ca42-39af-4d83-aff2-6870ba939b0e', 'Key Normalization accepts UUID keys');

  // Test 7: Integration in validateStructure retains valid idempotencyKey
  let valStructurePassed = false;
  try {
    QuestionCreationValidator.validateStructure({
      ...basePayload,
      idempotencyKey: '  test-key-01  ',
    });
    valStructurePassed = true;
  } catch {}
  assert(valStructurePassed, 'validateStructure allows and validates normalized idempotencyKey');

  // ------------------------------------------------------------------------------------------------
  // GROUP 2: PAYLOAD FINGERPRINTING & HASHING (Tests 8 - 12)
  // ------------------------------------------------------------------------------------------------

  // Test 8: Deterministic SHA-256 fingerprint generation
  const fp1 = questionService.computePayloadFingerprint({ ...basePayload, idempotencyKey: 'key-1' });
  const fp2 = questionService.computePayloadFingerprint({ ...basePayload, idempotencyKey: 'key-2' });
  assert(fp1 === fp2, 'Fingerprint is identical regardless of idempotencyKey value');

  // Test 9: Whitespace in questionText or options is normalized in fingerprint
  const fpWhitespace1 = questionService.computePayloadFingerprint({
    ...basePayload,
    questionText: '  Which planet is known as the Red Planet in our solar system?  ',
  });
  assert(fpWhitespace1 === fp1, 'Fingerprint normalizes surrounding whitespace in text');

  // Test 10: Modifying payload content produces a different fingerprint
  const fpDifferent = questionService.computePayloadFingerprint({
    ...basePayload,
    correctAnswer: 'A',
  });
  assert(fp1 !== fpDifferent, 'Different payload produces distinct fingerprint');

  // Test 11: Key ordering in object properties does not alter fingerprint
  const fpAlias = questionService.computePayloadFingerprint({
    ...basePayload,
    question: 'Which planet is known as the Red Planet in our solar system?',
  });
  assert(fpAlias === fp1, 'Fingerprint handles alias question/questionText deterministically');

  // Test 12: Tags order does not alter fingerprint
  const fpTags1 = questionService.computePayloadFingerprint({ ...basePayload, tags: ['space', 'astronomy'] });
  const fpTags2 = questionService.computePayloadFingerprint({ ...basePayload, tags: ['astronomy', 'space'] });
  assert(fpTags1 === fpTags2, 'Fingerprint normalizes tags array ordering');

  // ------------------------------------------------------------------------------------------------
  // GROUP 3: CONCURRENT IN-FLIGHT DEDUPLICATION (Tests 13 - 17)
  // ------------------------------------------------------------------------------------------------

  questionService.clearIdempotencyCache();
  allocatedQuestionCount = 0;
  persistedQuestions = [];

  // Test 13: 5 simultaneous concurrent requests with the SAME idempotencyKey & payload
  const concurrentKey = 'concurrent-key-01';
  const concurrentPromises = [1, 2, 3, 4, 5].map(() =>
    questionService.createQuestionFromRequest({
      ...basePayload,
      idempotencyKey: concurrentKey,
    })
  );

  const concurrentResults = await Promise.all(concurrentPromises);
  const firstId = concurrentResults[0].id;
  const allSameId = concurrentResults.every(r => r.id === firstId);
  assert(allSameId, 'All concurrent requests resolve to the EXACT SAME Question object and ID');

  // Test 14: Exactly one Question allocated and persisted across 5 concurrent requests
  assert(allocatedQuestionCount === 1, 'Only ONE sequence ID allocated during 5 concurrent requests');
  assert(persistedQuestions.length === 1, 'Only ONE question record persisted during 5 concurrent requests');

  // Test 15: Post-completion replay from cache returns identical question
  const replayResult = await questionService.createQuestionFromRequest({
    ...basePayload,
    idempotencyKey: concurrentKey,
  });
  assert(replayResult.id === firstId, 'Post-completion replay returns cached Question immediately');
  assert(allocatedQuestionCount === 1, 'No additional sequence allocation for replay');

  // Test 16: Concurrent request with DIFFERENT payload during in-flight throws IdempotencyConflictError
  questionService.clearIdempotencyCache();
  const slowKey = 'in-flight-conflict-key';
  
  // Artificially delay verify to hold in-flight
  const origVerify = MultiLayerVerificationEngine.verify;
  MultiLayerVerificationEngine.verify = async (q, ctx) => {
    await new Promise(res => setTimeout(res, 50));
    return origVerify(q, ctx);
  };

  const slowPromise1 = questionService.createQuestionFromRequest({
    ...basePayload,
    idempotencyKey: slowKey,
    questionText: 'First Payload for slow promise',
  });

  let inFlightConflictCaught = false;
  try {
    await questionService.createQuestionFromRequest({
      ...basePayload,
      idempotencyKey: slowKey,
      questionText: 'Conflicting Payload while first is in-flight',
    });
  } catch (err) {
    inFlightConflictCaught = err instanceof IdempotencyConflictError;
  }

  await slowPromise1; // wait for completion
  MultiLayerVerificationEngine.verify = origVerify; // restore

  assert(inFlightConflictCaught, 'In-flight request with different payload throws IdempotencyConflictError');

  // Test 17: Post-completion request with DIFFERENT payload throws IdempotencyConflictError
  let postCompletionConflictCaught = false;
  try {
    await questionService.createQuestionFromRequest({
      ...basePayload,
      idempotencyKey: slowKey,
      questionText: 'Different payload after completion',
    });
  } catch (err) {
    postCompletionConflictCaught = err instanceof IdempotencyConflictError;
  }
  assert(postCompletionConflictCaught, 'Post-completion replay with different payload throws IdempotencyConflictError');

  // ------------------------------------------------------------------------------------------------
  // GROUP 4: ERROR & AUXILIARY RESILIENCE WITH IDEMPOTENCY (Tests 18 - 22)
  // ------------------------------------------------------------------------------------------------

  // Test 18: Non-fatal workflow transition failure still caches and returns question
  questionService.clearIdempotencyCache();
  const origWorkflow = workflowService.recordTransition;
  workflowService.recordTransition = async () => {
    throw new Error('Workflow service temporary outage');
  };

  const wfFailKey = 'wf-fail-idempotency-key';
  const wfQuestion = await questionService.createQuestionFromRequest({
    ...basePayload,
    idempotencyKey: wfFailKey,
  });

  assert(wfQuestion.id.startsWith('BP-Q-'), 'Question created successfully despite workflow failure');

  // Test 19: Cached replay succeeds even if workflow failed during primary creation
  const wfReplay = await questionService.createQuestionFromRequest({
    ...basePayload,
    idempotencyKey: wfFailKey,
  });
  assert(wfReplay.id === wfQuestion.id, 'Idempotent replay succeeds for question with non-fatal workflow error');
  workflowService.recordTransition = origWorkflow;

  // Test 20: Non-fatal audit log failure still caches and returns question
  const origAudit = auditService.log;
  auditService.log = async () => {
    throw new Error('Audit log service temporary outage');
  };

  const auditFailKey = 'audit-fail-idempotency-key';
  const auditQuestion = await questionService.createQuestionFromRequest({
    ...basePayload,
    idempotencyKey: auditFailKey,
  });
  assert(auditQuestion.id.startsWith('BP-Q-'), 'Question created successfully despite audit failure');

  // Test 21: Cached replay succeeds even if audit failed during primary creation
  const auditReplay = await questionService.createQuestionFromRequest({
    ...basePayload,
    idempotencyKey: auditFailKey,
  });
  assert(auditReplay.id === auditQuestion.id, 'Idempotent replay succeeds for question with non-fatal audit error');
  auditService.log = origAudit;

  // Test 22: Primary persistence failure cleans up inFlightRegistry so future attempt with same key can retry
  questionService.clearIdempotencyCache();
  const origAppend = questionsRepository.appendRecord;
  questionsRepository.appendRecord = async () => {
    throw new Error('Disk / Sheets write failed');
  };

  const failedKey = 'retryable-failed-key';
  let primaryFailed = false;
  try {
    await questionService.createQuestionFromRequest({
      ...basePayload,
      idempotencyKey: failedKey,
    });
  } catch {
    primaryFailed = true;
  }
  assert(primaryFailed, 'Primary failure occurred as simulated');

  // Now restore appendRecord and retry with the same idempotencyKey
  questionsRepository.appendRecord = origAppend;
  const retryQuestion = await questionService.createQuestionFromRequest({
    ...basePayload,
    idempotencyKey: failedKey,
  });
  assert(retryQuestion.id.startsWith('BP-Q-'), 'Retry with same key succeeds after previous primary failure without deadlock');

  // ------------------------------------------------------------------------------------------------
  // GROUP 5: BOUNDED LRU / TTL CACHE MECHANICS (Tests 23 - 26)
  // ------------------------------------------------------------------------------------------------

  questionService.clearIdempotencyCache();

  // Test 23: Cache retains entries within capacity
  const keyAlpha = 'key-alpha';
  const qAlpha = await questionService.createQuestionFromRequest({
    ...basePayload,
    idempotencyKey: keyAlpha,
  });
  const cachedAlpha = await questionService.createQuestionFromRequest({
    ...basePayload,
    idempotencyKey: keyAlpha,
  });
  assert(cachedAlpha.id === qAlpha.id, 'Cache retains and returns entries within capacity');

  // Test 24: LRU Eviction when max capacity reached (testing with simulated entries)
  const qsAny = questionService as any;
  qsAny.clearIdempotencyCache();

  // Populate up to 1000 entries
  for (let i = 0; i < 1000; i++) {
    qsAny.idempotencyCache.set(`mock-key-${i}`, {
      question: { id: `BP-Q-MOCK-${i}` } as any,
      payloadFingerprint: `fp-${i}`,
      createdAt: Date.now(),
    });
  }
  assert(qsAny.idempotencyCache.size === 1000, 'Cache reached max size 1000');

  // Insert 1001st entry
  await questionService.createQuestionFromRequest({
    ...basePayload,
    idempotencyKey: 'new-key-1001',
  });
  assert(qsAny.idempotencyCache.size === 1000, 'Cache capped at 1000 entries after LRU eviction');
  assert(!qsAny.idempotencyCache.has('mock-key-0'), 'Oldest entry mock-key-0 was evicted');
  assert(qsAny.idempotencyCache.has('new-key-1001'), 'New entry new-key-1001 exists in cache');

  // Test 25: Expired TTL entry is evicted and allows fresh creation
  qsAny.idempotencyCache.set('expired-key', {
    question: { id: 'BP-Q-OLD' } as any,
    payloadFingerprint: questionService.computePayloadFingerprint(basePayload),
    createdAt: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago (> 24h TTL)
  });

  const freshCreated = await questionService.createQuestionFromRequest({
    ...basePayload,
    idempotencyKey: 'expired-key',
  });
  assert(freshCreated.id !== 'BP-Q-OLD', 'Expired TTL entry is ignored and new question is created');

  // Test 26: clearIdempotencyCache resets both completed and inFlight maps
  questionService.clearIdempotencyCache();
  assert(qsAny.idempotencyCache.size === 0, 'Completed idempotency cache cleared');
  assert(qsAny.inFlightRegistry.size === 0, 'In-flight registry cleared');

  // ------------------------------------------------------------------------------------------------
  // GROUP 6: AUDIT SERVICE SANITIZATION EXEMPTION (Tests 27 - 28)
  // ------------------------------------------------------------------------------------------------

  // Test 27: auditService.sanitizePayload preserves idempotencyKey without redaction
  const sanitized = (auditService as any).sanitizePayload({
    idempotencyKey: 'bp-idemp-123456',
    idempotency_key: 'bp-idemp-654321',
    primaryKey: 'PK-100',
    title: 'Valid Question',
    apiKey: 'SECRET_API_KEY_VALUE',
    password: 'SUPER_SECRET_PASSWORD',
    secretKey: 'TOP_SECRET',
  });

  assert(sanitized.idempotencyKey === 'bp-idemp-123456', 'idempotencyKey is NOT redacted by audit sanitization');
  assert(sanitized.idempotency_key === 'bp-idemp-654321', 'idempotency_key is NOT redacted by audit sanitization');
  assert(sanitized.primaryKey === 'PK-100', 'primaryKey is NOT redacted by audit sanitization');

  // Test 28: Actual secrets remain safely redacted
  assert(sanitized.apiKey === '[REDACTED]', 'apiKey is correctly redacted');
  assert(sanitized.password === '[REDACTED]', 'password is correctly redacted');
  assert(sanitized.secretKey === '[REDACTED]', 'secretKey is correctly redacted');

  // ------------------------------------------------------------------------------------------------
  // GROUP 7: PRESERVATION OF A-02.3.2a CREATION GUARANTEES (Tests 29 - 31)
  // ------------------------------------------------------------------------------------------------

  // Test 29: Pre-save verification failure rejects before any Question ID or Content Master allocation
  allocatedQuestionCount = 0;
  allocatedContentMasterCount = 0;
  MultiLayerVerificationEngine.verify = async () => {
    return {
      aggregatedStatus: 'FAILED',
      canSave: false,
      overallErrors: ['Verification engine found critical contradiction'],
      layerList: [],
    } as any;
  };

  let preSaveFailed = false;
  try {
    await questionService.createQuestionFromRequest({
      ...basePayload,
      idempotencyKey: 'pre-save-failed-key',
    });
  } catch (err) {
    preSaveFailed = err instanceof ValidationError;
  }
  assert(preSaveFailed, 'Pre-save verification failure throws ValidationError');
  assert(allocatedQuestionCount === 0, 'No Question ID allocated when pre-save verification fails');
  assert(allocatedContentMasterCount === 0, 'No Content Master allocated when pre-save verification fails');

  // Test 30: Question persistence failure compensates newly created Content Master
  MultiLayerVerificationEngine.verify = origVerify;
  deletedContentMasterIds = [];
  questionsRepository.appendRecord = async () => {
    throw new Error('Sheets append network error');
  };

  let compFailed = false;
  try {
    await questionService.createQuestionFromRequest({
      ...basePayload,
      idempotencyKey: 'compensation-check-key',
    });
  } catch {
    compFailed = true;
  }
  assert(compFailed, 'Question persistence failed');
  assert(deletedContentMasterIds.length === 1, 'Content Master created for failed request was compensated/deleted');

  // Test 31: Pre-existing contentMasterId is NEVER deleted on Question persistence failure
  deletedContentMasterIds = [];
  let preExistingFailed = false;
  try {
    await questionService.createQuestionFromRequest({
      ...basePayload,
      contentMasterId: 'BP-CM-PRE-EXISTING',
      idempotencyKey: 'pre-existing-check-key',
    });
  } catch {
    preExistingFailed = true;
  }
  assert(preExistingFailed, 'Question persistence failed with pre-existing Content Master');
  assert(!deletedContentMasterIds.includes('BP-CM-PRE-EXISTING'), 'Pre-existing Content Master is NOT deleted');

  // Restore repository mocks
  questionsRepository.appendRecord = origAppend;

  console.log('\n========================================================================');
  console.log(`A-02.3.2b REGRESSION SUITE COMPLETED: ${passed} / ${total} TESTS PASSED`);
  console.log('========================================================================\n');

  return {
    success: passed === total,
    passed,
    total,
  };
}

runIdempotencyConcurrencyResilienceTests()
  .then((res) => {
    if (!res.success) {
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
  });

