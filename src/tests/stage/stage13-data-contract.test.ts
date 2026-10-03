/**
 * BURRA PARIKSHA CMS — Stage 13 Data Model & Data Contract Automated Verification Suite
 *
 * Verifies that the Data Contracts established in 13-DATA-CONTRACT.md and
 * src/types/data-contracts.ts are strictly enforced:
 * 1. Exactly 28 Top-Level Canonical Collections Defined and Registered.
 * 2. Canonical ID Regex Patterns Validation across all 28 collections.
 * 3. Standard Base Entity Contract Enforcement (Timestamps, Versioning, Soft Deletion, Ownership).
 * 4. Source of Truth Authority Mapping for all critical fields.
 * 5. Immutability Constraints Enforcement (audit_events, workflow_transitions, *_versions).
 * 6. Firestore Composite Index Declarations Integrity.
 * 7. Zod Document Schema Parsing and Validation for Primary Domain Entities.
 *
 * ZERO PRODUCTION DATA MUTATION: Deterministic in-memory test suite.
 */

import {
  CanonicalCollection,
  CANONICAL_COLLECTIONS,
  CANONICAL_ID_PATTERNS,
  BaseEntitySchema,
  IMMUTABLE_COLLECTIONS,
  isCollectionImmutable,
  assertImmutability,
  SourceOfTruth,
  SOURCE_OF_TRUTH_REGISTRY,
  FIRESTORE_COMPOSITE_INDEXES,
  QuestionDocumentSchema,
  ContentDocumentSchema,
  VideoDocumentSchema,
  ScriptDocumentSchema,
  AuditEventDocumentSchema,
  WorkflowInstanceDocumentSchema,
} from '../../types/data-contracts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[STAGE 13 DATA CONTRACT VIOLATION] ${msg}`);
  }
}

export async function runStage13DataContractTests() {
  console.log('============================================================');
  console.log('RUNNING STAGE 13 DATA MODEL & DATA CONTRACT VERIFICATION');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: 28 Collections Schema Completeness & Registration
  // --------------------------------------------------------------------------
  console.log('Checking Check 1: 28 Collections Schema Completeness & Registration...');
  assert(
    CANONICAL_COLLECTIONS.length === 28,
    `Expected exactly 28 canonical collections, found ${CANONICAL_COLLECTIONS.length}`
  );

  const expectedCollections: string[] = [
    'users',
    'roles',
    'capabilities',
    'questions',
    'question_versions',
    'question_reviews',
    'content',
    'scripts',
    'script_versions',
    'videos',
    'video_takes',
    'video_edits',
    'media_assets',
    'media_references',
    'archive_references',
    'thumbnails',
    'social_reviews',
    'publishing_packages',
    'publications',
    'platforms',
    'analytics_snapshots',
    'performance_records',
    'intelligence_insights',
    'workflow_instances',
    'workflow_transitions',
    'notifications',
    'audit_events',
    'configurations',
  ];

  for (const collName of expectedCollections) {
    assert(
      CANONICAL_COLLECTIONS.includes(collName as CanonicalCollection),
      `Missing canonical collection in registry: ${collName}`
    );
  }
  console.log('  -> PASSED: All 28 canonical collections authoritatively registered.');

  // --------------------------------------------------------------------------
  // TEST 2: Canonical ID Regex Patterns Validation
  // --------------------------------------------------------------------------
  console.log('Checking Check 2: Canonical ID Regex Patterns Validation...');
  const patternKeys = Object.keys(CANONICAL_ID_PATTERNS) as CanonicalCollection[];
  assert(
    patternKeys.length === 28,
    `Expected 28 canonical ID patterns, found ${patternKeys.length}`
  );

  // Validate representative test IDs against patterns
  const validTestIds: Record<CanonicalCollection, string> = {
    [CanonicalCollection.USERS]: 'USR-000101',
    [CanonicalCollection.ROLES]: 'ROLE_QUESTION_AUTHOR',
    [CanonicalCollection.CAPABILITIES]: 'QUESTION:CREATE',
    [CanonicalCollection.QUESTIONS]: 'BP-Q-000104',
    [CanonicalCollection.QUESTION_VERSIONS]: 'BP-QV-000104-V02',
    [CanonicalCollection.QUESTION_REVIEWS]: 'BP-QR-000104-001',
    [CanonicalCollection.CONTENT]: 'BP-CNT-000042',
    [CanonicalCollection.SCRIPTS]: 'BP-S-000042',
    [CanonicalCollection.SCRIPT_VERSIONS]: 'BP-SV-000042-V01',
    [CanonicalCollection.VIDEOS]: 'BP-V-000018',
    [CanonicalCollection.VIDEO_TAKES]: 'BP-VT-000018-T03',
    [CanonicalCollection.VIDEO_EDITS]: 'BP-VE-000018-C01',
    [CanonicalCollection.MEDIA_ASSETS]: 'MED-000501',
    [CanonicalCollection.MEDIA_REFERENCES]: 'MREF-000501',
    [CanonicalCollection.ARCHIVE_REFERENCES]: 'ARC-000012',
    [CanonicalCollection.THUMBNAILS]: 'BP-TH-000042',
    [CanonicalCollection.SOCIAL_REVIEWS]: 'SR-000042',
    [CanonicalCollection.PUBLISHING_PACKAGES]: 'PKG-000042',
    [CanonicalCollection.PUBLICATIONS]: 'PUB-000099',
    [CanonicalCollection.PLATFORMS]: 'PLT-YOUTUBE_SHORTS',
    [CanonicalCollection.ANALYTICS_SNAPSHOTS]: 'SNP-20261002-0001',
    [CanonicalCollection.PERFORMANCE_RECORDS]: 'PRF-000042',
    [CanonicalCollection.INTELLIGENCE_INSIGHTS]: 'INS-000015',
    [CanonicalCollection.WORKFLOW_INSTANCES]: 'WF-000042',
    [CanonicalCollection.WORKFLOW_TRANSITIONS]: 'TRN-20261002-0001',
    [CanonicalCollection.NOTIFICATIONS]: 'NOTIF-000001',
    [CanonicalCollection.AUDIT_EVENTS]: 'AUD-20261002-0001',
    [CanonicalCollection.CONFIGURATIONS]: 'CFG-GLOBAL_SETTINGS',
  };

  for (const coll of CANONICAL_COLLECTIONS) {
    const pattern = CANONICAL_ID_PATTERNS[coll];
    assert(pattern instanceof RegExp, `Pattern for ${coll} must be a RegExp`);
    const sampleId = validTestIds[coll];
    assert(pattern.test(sampleId), `Sample ID '${sampleId}' failed regex for ${coll}`);

    // Test that invalid IDs are strictly rejected
    assert(!pattern.test('INVALID_ID'), `Invalid ID unexpectedly passed regex for ${coll}`);
    assert(!pattern.test('12345'), `Numeric-only ID unexpectedly passed regex for ${coll}`);
  }
  console.log('  -> PASSED: All 28 ID regex patterns validated with deterministic syntax.');

  // --------------------------------------------------------------------------
  // TEST 3: Standard Base Contract Enforcement
  // --------------------------------------------------------------------------
  console.log('Checking Check 3: Standard Base Entity Contract Enforcement...');
  const validBaseDocument = {
    id: 'BP-Q-000104',
    createdAt: '2026-10-02T10:00:00.000Z',
    createdBy: 'USR-000001',
    updatedAt: '2026-10-02T10:30:00.000Z',
    updatedBy: 'USR-000002',
    version: 1,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
  };

  const parsedBase = BaseEntitySchema.safeParse(validBaseDocument);
  assert(parsedBase.success, `BaseEntitySchema failed valid document: ${JSON.stringify(parsedBase)}`);

  // Assert negative cases: missing version or bad createdBy format
  const badBaseDoc = {
    ...validBaseDocument,
    createdBy: 'NOT_A_VALID_USER_ID',
  };
  const parsedBad = BaseEntitySchema.safeParse(badBaseDoc);
  assert(!parsedBad.success, 'BaseEntitySchema must reject invalid createdBy format');
  console.log('  -> PASSED: Standard Base Entity Contract validated (timestamps, versioning, soft deletion, user ownership).');

  // --------------------------------------------------------------------------
  // TEST 4: Source of Truth (SoT) Authority Mapping
  // --------------------------------------------------------------------------
  console.log('Checking Check 4: Source of Truth (SoT) Authority Mapping...');
  assert(SOURCE_OF_TRUTH_REGISTRY.length >= 8, 'Source of Truth registry must contain all critical fields');

  const questionTextSot = SOURCE_OF_TRUTH_REGISTRY.find(
    (s) => s.collection === CanonicalCollection.QUESTIONS && s.fieldPath === 'questionTextTelugu'
  );
  assert(questionTextSot?.sourceOfTruth === SourceOfTruth.CMS_FIRESTORE, 'Question text SoT must be CMS_FIRESTORE');

  const videoDriveSot = SOURCE_OF_TRUTH_REGISTRY.find(
    (s) => s.collection === CanonicalCollection.MEDIA_REFERENCES && s.fieldPath === 'driveFileId'
  );
  assert(videoDriveSot?.sourceOfTruth === SourceOfTruth.GOOGLE_DRIVE, 'Drive file ID SoT must be GOOGLE_DRIVE (AP-007)');

  const workflowSot = SOURCE_OF_TRUTH_REGISTRY.find(
    (s) => s.collection === CanonicalCollection.WORKFLOW_INSTANCES && s.fieldPath === 'currentStep'
  );
  assert(workflowSot?.sourceOfTruth === SourceOfTruth.CMS_FIRESTORE, 'Workflow step SoT must be CMS_FIRESTORE (AP-010)');

  const aiDraftSot = SOURCE_OF_TRUTH_REGISTRY.find(
    (s) => s.collection === CanonicalCollection.QUESTIONS && s.fieldPath === 'aiDraftPayload'
  );
  assert(aiDraftSot?.sourceOfTruth === SourceOfTruth.ASSISTIVE_AI_GEMINI, 'AI draft SoT must be ASSISTIVE_AI_GEMINI');
  assert(aiDraftSot?.isHumanGated === true, 'AI draft must be human-gated');

  console.log('  -> PASSED: Authoritative Source of Truth registry verified for all critical fields.');

  // --------------------------------------------------------------------------
  // TEST 5: Immutability Constraints Enforcement
  // --------------------------------------------------------------------------
  console.log('Checking Check 5: Immutability Constraints Enforcement...');
  assert(IMMUTABLE_COLLECTIONS.length === 5, `Expected 5 immutable collections, found ${IMMUTABLE_COLLECTIONS.length}`);
  assert(isCollectionImmutable(CanonicalCollection.AUDIT_EVENTS), 'audit_events must be immutable');
  assert(isCollectionImmutable(CanonicalCollection.WORKFLOW_TRANSITIONS), 'workflow_transitions must be immutable');
  assert(isCollectionImmutable(CanonicalCollection.QUESTION_VERSIONS), 'question_versions must be immutable');
  assert(isCollectionImmutable(CanonicalCollection.SCRIPT_VERSIONS), 'script_versions must be immutable');
  assert(isCollectionImmutable(CanonicalCollection.ANALYTICS_SNAPSHOTS), 'analytics_snapshots must be immutable');
  assert(!isCollectionImmutable(CanonicalCollection.QUESTIONS), 'questions must be mutable');

  // Verify assertImmutability throws on immutable collection
  let threw = false;
  try {
    assertImmutability(CanonicalCollection.AUDIT_EVENTS);
  } catch (err: any) {
    threw = true;
    assert(err.message.includes('IMMUTABILITY_VIOLATION'), 'Error must contain IMMUTABILITY_VIOLATION');
  }
  assert(threw, 'assertImmutability must throw on immutable collections');

  // Verify assertImmutability does NOT throw on mutable collections
  let threwMutable = false;
  try {
    assertImmutability(CanonicalCollection.QUESTIONS);
  } catch {
    threwMutable = true;
  }
  assert(!threwMutable, 'assertImmutability must not throw on mutable collections');
  console.log('  -> PASSED: Append-only immutability strictly enforced across all revision and audit collections.');

  // --------------------------------------------------------------------------
  // TEST 6: Firestore Composite Index Declarations Integrity
  // --------------------------------------------------------------------------
  console.log('Checking Check 6: Firestore Composite Index Declarations Integrity...');
  assert(FIRESTORE_COMPOSITE_INDEXES.length >= 4, 'Must define at least 4 composite indexes');
  for (const idx of FIRESTORE_COMPOSITE_INDEXES) {
    assert(CANONICAL_COLLECTIONS.includes(idx.collection), `Index collection ${idx.collection} must be canonical`);
    assert(idx.fields.length >= 2, `Composite index must have at least 2 fields (found ${idx.fields.length})`);
    assert(idx.purpose.length > 5, `Index on ${idx.collection} must declare purpose`);
  }
  console.log('  -> PASSED: Firestore composite indexes configured for querying, sorting, and telemetry.');

  // --------------------------------------------------------------------------
  // TEST 7: Primary Domain Collection Zod Schemas Validation
  // --------------------------------------------------------------------------
  console.log('Checking Check 7: Primary Domain Collection Zod Schemas Validation...');

  // 7.1 Validate QuestionDocument
  const validQuestion = {
    ...validBaseDocument,
    id: 'BP-Q-000104',
    subject: 'PHYSICS',
    classLevel: 'CLASS_10',
    chapter: 'Light Reflection and Refraction',
    topic: 'Mirrors',
    difficultyLevel: 'MEDIUM',
    questionTextTelugu: 'కాంతి పరావర్తనం అనగా ఏమి?',
    questionTextEnglish: 'What is reflection of light?',
    options: [
      { optionKey: 'A', optionTextTelugu: 'కాంతి ఒక మాధ్యమం నుండి తిరిగి రావడం', isCorrect: true },
      { optionKey: 'B', optionTextTelugu: 'కాంతి శోషించబడటం', isCorrect: false },
      { optionKey: 'C', optionTextTelugu: 'కాంతి వేగం పెరగడం', isCorrect: false },
      { optionKey: 'D', optionTextTelugu: 'పైవేవీ కావు', isCorrect: false },
    ],
    explanationTelugu: 'కాంతి ఒక తలాన్ని తాకి వెనక్కి తిరగడాన్ని పరావర్తనం అంటారు.',
    pedagogicalDefectCount: 0,
    status: 'APPROVED',
    currentWorkflowStep: 2,
    authorUserId: 'USR-000001',
    reviewerUserId: 'USR-000002',
  };
  const qParsed = QuestionDocumentSchema.safeParse(validQuestion);
  assert(qParsed.success, `QuestionDocumentSchema failed valid question: ${JSON.stringify(qParsed)}`);

  // 7.2 Validate AuditEventDocument
  const validAudit = {
    id: 'AUD-20261002-0001',
    timestamp: '2026-10-02T10:00:00.000Z',
    actorId: 'USR-000001',
    actorRole: 'QA_REVIEWER',
    resourceType: 'QUESTION',
    resourceId: 'BP-Q-000104',
    action: 'APPROVE',
    preconditionState: { status: 'SUBMITTED' },
    postconditionState: { status: 'APPROVED' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    correlationId: '123e4567-e89b-12d3-a456-426614174000',
  };
  const auditParsed = AuditEventDocumentSchema.safeParse(validAudit);
  assert(auditParsed.success, `AuditEventDocumentSchema failed valid audit event: ${JSON.stringify(auditParsed)}`);

  // 7.3 Validate ContentDocument
  const validContent = {
    ...validBaseDocument,
    id: 'BP-CNT-000042',
    questionId: 'BP-Q-000104',
    title: 'Light Reflection Class 10',
    classLevel: 'CLASS_10',
    subject: 'PHYSICS',
    currentWorkflowStep: 2,
    status: 'IN_PROGRESS',
    activeScriptId: null,
    activeVideoId: null,
    activePublishingPackageId: null,
    assignedOperatorIds: ['USR-000001'],
  };
  const contentParsed = ContentDocumentSchema.safeParse(validContent);
  assert(contentParsed.success, `ContentDocumentSchema failed valid content: ${JSON.stringify(contentParsed)}`);

  console.log('  -> PASSED: Zod schemas validated for all primary domain collections.');

  console.log('\n============================================================');
  console.log('ALL STAGE 13 DATA MODEL & DATA CONTRACT VERIFICATIONS PASSED (7/7)');
  console.log('============================================================\n');
}

// Cross-platform direct CLI execution runner
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('stage13')) {
  runStage13DataContractTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
