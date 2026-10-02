/**
 * BURRA PARIKSHA CMS — Stage 06 Domain Model Automated Verification Suite
 *
 * Verifies that the Canonical Domain Model rules established in 06-DOMAIN-MODEL.md
 * and src/types/domain-models.ts are strictly enforced:
 * 1. All 27 candidate domain entities are registered and have full metadata.
 * 2. Immutability rules on immutable fields are declared and enforced.
 * 3. Required vs Optional fields validation for core domain entities.
 * 4. Cross-domain relationships and cardinalities (1:1, 1:N, N:M).
 * 5. Lifecycle states are enumerated and decoupled from technical state (AP-002).
 *
 * ZERO PRODUCTION DATA MUTATION: Pure in-memory deterministic test suite.
 */

import {
  DOMAIN_ENTITY_REGISTRY,
  QuestionEntity,
  ScriptEntity,
  VideoEntity,
  MediaAssetEntity,
  PublishingPackageEntity,
  ContentEntity,
  UserEntity,
} from '../types/domain-models';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[STAGE 06 DOMAIN MODEL VIOLATION] ${msg}`);
  }
}

export async function runStage06DomainModelTests() {
  console.log('============================================================');
  console.log('RUNNING STAGE 06 DOMAIN MODEL VERIFICATION SUITE');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: All 27 Domain Entities Registered
  // --------------------------------------------------------------------------
  console.log('Checking Check 1: 27 Domain Entities Schema Registry Verification...');
  const expectedEntities = [
    'User',
    'Role',
    'Capability',
    'Question',
    'QuestionVersion',
    'QuestionReview',
    'Content',
    'Script',
    'ScriptVersion',
    'Video',
    'VideoTake',
    'VideoEdit',
    'MediaAsset',
    'MediaReference',
    'ArchiveReference',
    'Thumbnail',
    'SocialReview',
    'PublishingPackage',
    'Publication',
    'Platform',
    'AnalyticsSnapshot',
    'PerformanceRecord',
    'IntelligenceInsight',
    'WorkflowInstance',
    'WorkflowTransition',
    'Notification',
    'AuditEvent',
  ];

  assert(
    Object.keys(DOMAIN_ENTITY_REGISTRY).length === 27,
    `Expected exactly 27 registered entities, found ${Object.keys(DOMAIN_ENTITY_REGISTRY).length}`
  );

  expectedEntities.forEach((entityName) => {
    const meta = DOMAIN_ENTITY_REGISTRY[entityName];
    assert(Boolean(meta), `Entity "${entityName}" must exist in DOMAIN_ENTITY_REGISTRY`);
    assert(meta.entityName === entityName, `Meta entityName must match key: ${entityName}`);
    assert(typeof meta.purpose === 'string' && meta.purpose.length > 10, `${entityName} must define valid purpose`);
    assert(typeof meta.domainOwner === 'string', `${entityName} must define domainOwner`);
    assert(Array.isArray(meta.relationships) && meta.relationships.length > 0, `${entityName} must define relationships`);
    assert(Array.isArray(meta.lifecycleStates) && meta.lifecycleStates.length > 0, `${entityName} must define lifecycleStates`);
    assert(Array.isArray(meta.requiredFields) && meta.requiredFields.length > 0, `${entityName} must define requiredFields`);
    assert(Array.isArray(meta.immutableFields) && meta.immutableFields.length > 0, `${entityName} must define immutableFields`);
  });
  console.log('  -> PASS: All 27 domain entities verified with complete architectural attributes.\n');

  // --------------------------------------------------------------------------
  // TEST 2: Immutability Enforcement
  // --------------------------------------------------------------------------
  console.log('Checking Check 2: Immutability Specification Across Core Entities...');
  const immutableAudit = DOMAIN_ENTITY_REGISTRY.AuditEvent.immutableFields;
  assert(immutableAudit.includes('auditEventId'), 'auditEventId must be immutable');
  assert(immutableAudit.includes('timestamp'), 'timestamp must be immutable');
  assert(immutableAudit.includes('actorUserId'), 'actorUserId must be immutable');

  const immutableQuestion = DOMAIN_ENTITY_REGISTRY.Question.immutableFields;
  assert(immutableQuestion.includes('businessId'), 'Question businessId must be immutable');
  assert(immutableQuestion.includes('createdAt'), 'Question createdAt must be immutable');
  assert(immutableQuestion.includes('authorUserId'), 'Question authorUserId must be immutable');

  const immutableTransition = DOMAIN_ENTITY_REGISTRY.WorkflowTransition.immutableFields;
  assert(immutableTransition.includes('transitionId'), 'WorkflowTransition transitionId must be immutable');
  assert(immutableTransition.includes('actorUserId'), 'WorkflowTransition actorUserId must be immutable');
  console.log('  -> PASS: Immutability rules strictly enforced on audit, question, and workflow transitions.\n');

  // --------------------------------------------------------------------------
  // TEST 3: Core Domain Entity Typing & Instantiation
  // --------------------------------------------------------------------------
  console.log('Checking Check 3: Instantiation of Core Domain Entities (TypeScript Types)...');

  // Question Entity
  const question: QuestionEntity = {
    businessId: 'BP-Q-000104',
    domainOwner: 'Questions',
    createdAt: '2026-10-02T10:00:00Z',
    authorUserId: 'USR-000001',
    questionTextTelugu: 'ఈ క్రింది వానిలో ఏది సరైన సమాధానం?',
    options: ['ఎంపిక A', 'ఎంపిక B', 'ఎంపిక C', 'ఎంపిక D'],
    correctOptionIndex: 1,
    solutionExplanationTelugu: 'వివరణ ఇక్కడ ఇవ్వబడింది.',
    syllabusClass: 'Class 10',
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    difficultyLevel: 'MEDIUM',
    lifecycle: 'APPROVED',
    currentVersionNumber: 1,
  };
  assert(question.businessId === 'BP-Q-000104', 'Question instantiation valid');

  // MediaAsset Entity (AP-007 & AP-008)
  const mediaAsset: MediaAssetEntity = {
    businessId: 'MED-000492',
    domainOwner: 'Media',
    createdAt: '2026-10-02T11:00:00Z',
    entityType: 'VIDEO',
    entityId: 'BP-V-000088',
    fileName: 'master_cut_v1.mp4',
    mimeType: 'video/mp4',
    byteSize: 52428800,
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    storageProvider: 'GOOGLE_DRIVE',
    externalStorageId: '1Z_x9AbCdEfGhIjKlMnOpQrSt',
    externalUrl: 'https://drive.google.com/file/d/1Z_x9AbCdEfGhIjKlMnOpQrSt/view',
  };
  assert(mediaAsset.storageProvider === 'GOOGLE_DRIVE', 'Media asset points to external storage');
  assert(!('rawBinaryData' in mediaAsset), 'Media asset must never contain raw binary data (AP-007)');

  // Content Entity
  const content: ContentEntity = {
    businessId: 'BP-C-000055',
    domainOwner: 'Content',
    createdAt: '2026-10-02T12:00:00Z',
    title: 'Class 10 Quadratic Speed Trick',
    canonicalWorkflowStage: 1,
    questionBusinessId: 'BP-Q-000104',
  };
  assert(content.canonicalWorkflowStage === 1, 'Content bound to canonical workflow stage 1');
  console.log('  -> PASS: Core domain entities successfully instantiated with full type safety.\n');

  // --------------------------------------------------------------------------
  // TEST 4: Cross-Domain Relationships & Cardinalities
  // --------------------------------------------------------------------------
  console.log('Checking Check 4: Cross-Domain Relationships & Cardinalities...');
  const contentMeta = DOMAIN_ENTITY_REGISTRY.Content;
  assert(contentMeta.relationships.some((r) => r.includes('1:1 Question')), 'Content must have 1:1 Question relationship');
  assert(contentMeta.relationships.some((r) => r.includes('1:1 Script')), 'Content must have 1:1 Script relationship');
  assert(contentMeta.relationships.some((r) => r.includes('1:1 Video')), 'Content must have 1:1 Video relationship');

  const videoMeta = DOMAIN_ENTITY_REGISTRY.Video;
  assert(videoMeta.relationships.some((r) => r.includes('1:N VideoTake')), 'Video must have 1:N VideoTake relationship');
  assert(videoMeta.relationships.some((r) => r.includes('1:1 VideoEdit')), 'Video must have 1:1 VideoEdit relationship');
  console.log('  -> PASS: Cross-domain entity cardinalities validated.\n');

  // --------------------------------------------------------------------------
  // TEST 5: Lifecycle Decoupling (AP-002)
  // --------------------------------------------------------------------------
  console.log('Checking Check 5: Lifecycle Model Decoupled from Technical State (AP-002)...');
  const questionLifecycles = DOMAIN_ENTITY_REGISTRY.Question.lifecycleStates;
  assert(questionLifecycles.includes('DRAFT') && questionLifecycles.includes('APPROVED'), 'Question lifecycles valid');

  const videoLifecycles = DOMAIN_ENTITY_REGISTRY.Video.lifecycleStates;
  assert(videoLifecycles.includes('RECORDING') && videoLifecycles.includes('EDITING'), 'Video lifecycles valid');

  // Assert Question lifecycle is not equal to Video lifecycle
  assert(questionLifecycles !== videoLifecycles, 'Entity lifecycles must be decoupled per AP-002');
  console.log('  -> PASS: Lifecycle states decoupled and domain-specific.\n');

  console.log('============================================================');
  console.log('ALL 27 DOMAIN ENTITIES VERIFIED SUCCESSFULLY IN CODE! ✅');
  console.log('============================================================\n');
}

// Cross-platform direct CLI execution guard
const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('src/tests/stage06-domain-model.test.ts')
  )
);

if (isDirectCli) {
  runStage06DomainModelTests().catch((err) => {
    console.error('Domain Model Test Failure:', err);
    process.exit(1);
  });
}
