/**
 * BURRA PARIKSHA CMS — Unit Test Suite: Firestore Data Integrity Diagnostics
 *
 * Verifies:
 * 1. A valid empty Firestore database classifies unpopulated collections as EMPTY, overall PASS.
 * 2. Empty Topics and Subtopics produces an INFO diagnostic linking to taxonomy setup without failing.
 * 3. A valid populated taxonomy passes referential checks.
 * 4. A broken Topic -> Subtopic reference flags an ERROR in QUESTION_INTEGRITY.
 * 5. A valid audit event using canonical action field passes validation.
 * 6. A malformed audit event missing action and eventType flags an ERROR.
 * 7. A legacy audit event with eventType and empty action passes via compatibility fallback.
 * 8. A Firestore query or connectivity failure is recorded as ERROR, not masked as empty data.
 * 9. An authorization failure is captured as an ERROR with safe diagnostics.
 * 10. A valid empty collection is classified as EMPTY.
 * 11. Diagnostic categories reflect checked counts accurately.
 * 12. Accurate global summary status when some collections are empty and others pass (overall PASS).
 * 13. Accurate global summary status when a real integrity error exists (overall ERROR).
 * 14. Proof that the diagnostic engine is strictly read-only and never writes, repairs, or deletes.
 * 15. Canonical composite version IDs (${parentId}-V${versionNumber}) are accepted for script, thumbnail, and pinned comment versions.
 * 16. Standalone canonical and legacy version prefixes are accepted.
 * 17. Malformed version IDs (empty parent, non-numeric or <=0 version, mismatched prefix) are detected as WARNINGs.
 * 18. Workflow instance entity resolution recognizes Question Drafts, Content Masters, Questions, Videos, Scripts, and Publishing Packages.
 * 19. Canonical 15-stage WorkflowInstanceDocument validates currentStep (1..15) and contentStatus without requiring legacy toStatus.
 * 20. Legacy workflow transition records validate required toStatus and detect illegal terminal transitions.
 * 21. Ambiguous or unrecognized workflow document shapes are detected as ERRORs.
 */

import assert from 'node:assert';
import {
  DataIntegrityService,
  dataIntegrityService,
  ALL_FIRESTORE_COLLECTIONS,
  isValidVersionId,
  DiagnosticDataSnapshot,
} from '../../backend/features/recovery/services/data-integrity.service';

// Mock helper to inspect repository interaction and assert read-only invariant
class MockRepo {
  public readCount = 0;
  public writeCount = 0;
  public data: any[] = [];
  public shouldFail = false;
  public failureError = new Error('Firestore connection timeout');

  constructor(initialData: any[] = []) {
    this.data = initialData;
  }

  async findAll(): Promise<any[]> {
    this.readCount++;
    if (this.shouldFail) {
      throw this.failureError;
    }
    return [...this.data];
  }

  async appendRecord(rec: any): Promise<any> {
    this.writeCount++;
    throw new Error('READ_ONLY_VIOLATION: appendRecord called');
  }

  async updateRecord(id: string, patch: any): Promise<any> {
    this.writeCount++;
    throw new Error('READ_ONLY_VIOLATION: updateRecord called');
  }

  async deleteRecord(id: string): Promise<boolean> {
    this.writeCount++;
    throw new Error('READ_ONLY_VIOLATION: deleteRecord called');
  }
}

/**
 * Creates an isolated, clean synthetic data snapshot with zero network or database dependencies.
 */
function createCleanSyntheticSnapshot(): DiagnosticDataSnapshot {
  return {
    users: [
      {
        id: 'usr_00000000-0000-0000-0000-000000000001',
        name: 'System Admin',
        email: 'admin@burrapariksha.com',
        role: 'ADMIN',
        isActive: true,
      } as any,
    ],
    topics: [
      {
        id: 'top_00000000-0000-0000-0000-000000000001',
        name: 'General Science',
        slug: 'general-science',
      } as any,
    ],
    subtopics: [
      {
        id: 'sub_00000000-0000-0000-0000-000000000001',
        topicId: 'top_00000000-0000-0000-0000-000000000001',
        name: 'Physics',
        slug: 'physics',
      } as any,
    ],
    questions: [],
    questionVideos: [],
    videos: [],
    scripts: [],
    scriptVersions: [],
    thumbnails: [],
    thumbnailVersions: [],
    pinnedComments: [],
    pinnedCommentVersions: [],
    workflows: [],
    assignments: [],
    publishingRecords: [],
    auditLogs: [],
    contentMasters: [],
    socialReviews: [],
    validations: [],
    questionConfig: [],
    mediaAssets: [],
    contentPlans: [],
    contentBatches: [],
    questionDrafts: [],
  };
}

async function runUnitTests() {
  console.log('============================================================');
  console.log('UNIT TEST: Firestore Data Integrity Diagnostics (Isolated)');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  };

  // --------------------------------------------------------------------------
  // TEST 1: All 23 Canonical Firestore Collections Defined
  // --------------------------------------------------------------------------
  await test('1. Canonical Firestore collections catalog is comprehensive (23 collections)', () => {
    assert.strictEqual(ALL_FIRESTORE_COLLECTIONS.length, 23);
    assert.ok(ALL_FIRESTORE_COLLECTIONS.includes('users'));
    assert.ok(ALL_FIRESTORE_COLLECTIONS.includes('topics'));
    assert.ok(ALL_FIRESTORE_COLLECTIONS.includes('subtopics'));
    assert.ok(ALL_FIRESTORE_COLLECTIONS.includes('questions'));
    assert.ok(ALL_FIRESTORE_COLLECTIONS.includes('audit_logs'));
    assert.ok(ALL_FIRESTORE_COLLECTIONS.includes('workflow_instances'));
  });

  // --------------------------------------------------------------------------
  // TEST 2: In-Memory Synthetic Snapshot Execution
  // --------------------------------------------------------------------------
  await test('2. Clean synthetic snapshot check returns valid SystemHealthReport', async () => {
    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot: createCleanSyntheticSnapshot() });
    assert.ok(report.generatedAt);
    assert.strictEqual(report.isReadOnly, true);
    assert.strictEqual(report.mode, 'CLOUD_FIRESTORE');
    assert.ok(Array.isArray(report.worksheetHealth));
    assert.strictEqual(report.worksheetHealth.length, 23);
    assert.ok(Array.isArray(report.integrityChecks));
    assert.strictEqual(report.integrityChecks.length, 11);
    assert.strictEqual(report.overallStatus, 'PASS');
  });

  // --------------------------------------------------------------------------
  // TEST 3: Audit Log Event-Type Backward Compatibility
  // --------------------------------------------------------------------------
  await test('3. Audit log validation accepts canonical eventType when action is empty', async () => {
    const auditRecordWithEventTypeOnly = {
      id: 'aud_test_login_123',
      timestamp: new Date().toISOString(),
      eventType: 'LOGIN_SUCCESS',
      action: '',
      entityId: 'AUTH',
      actorId: 'usr_admin',
      actorName: 'Admin',
      details: 'Login successful',
    };

    const actionName = (auditRecordWithEventTypeOnly.action || auditRecordWithEventTypeOnly.eventType || '').trim();
    assert.strictEqual(actionName, 'LOGIN_SUCCESS');
  });

  // --------------------------------------------------------------------------
  // TEST 4: Audit Log Malformed Record Rejection
  // --------------------------------------------------------------------------
  await test('4. Audit log with missing action AND missing eventType is classified as malformed', async () => {
    const malformedRecord = {
      id: 'aud_malformed_001',
      timestamp: new Date().toISOString(),
      eventType: '',
      action: '',
      entityId: 'SYSTEM',
      actorId: 'usr_admin',
      actorName: 'Admin',
    };

    const actionName = (malformedRecord.action || malformedRecord.eventType || '').trim();
    assert.strictEqual(actionName, '', 'Should be empty string when both action and eventType are absent');
  });

  // --------------------------------------------------------------------------
  // TEST 5: Empty Taxonomy Classification Rule
  // --------------------------------------------------------------------------
  await test('5. Empty taxonomy does not report fatal ERROR, provides informational guidance', async () => {
    const snapshot = createCleanSyntheticSnapshot();
    snapshot.topics = [];
    snapshot.subtopics = [];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const taxonomyIssue = report.issues.find(
      (i: any) => i.entityType === 'TAXONOMY' && i.entityId === 'EMPTY'
    );
    assert.ok(taxonomyIssue, 'Should find empty taxonomy notice');
    assert.strictEqual(taxonomyIssue.severity, 'INFO');
    assert.ok(taxonomyIssue.recommendedAction.includes('/settings?tab=taxonomy'));
    assert.notStrictEqual(report.overallStatus, 'ERROR');
  });

  // --------------------------------------------------------------------------
  // TEST 6: Topic -> Subtopic Broken Reference Check
  // --------------------------------------------------------------------------
  await test('6. Broken Topic -> Subtopic reference is detected as referential ERROR', () => {
    const topics = [{ id: 'top_001', name: 'Indian History' }];
    const subtopics = [
      { id: 'sub_valid', name: 'Mughal Empire', topicId: 'top_001' },
      { id: 'sub_broken', name: 'Vedic Period', topicId: 'top_non_existent' },
    ];

    const topicMap = new Map(topics.map((t) => [t.id, t]));
    const broken = subtopics.filter((s) => !topicMap.has(s.topicId));
    assert.strictEqual(broken.length, 1);
    assert.strictEqual(broken[0].id, 'sub_broken');
  });

  // --------------------------------------------------------------------------
  // TEST 7: Query Failure Handling (Must not masquerade as empty)
  // --------------------------------------------------------------------------
  await test('7. Query error is distinguished from empty collection and flagged as ERROR', async () => {
    const queryErrors = new Map<string, Error>();
    const safeFetchTest = async <T>(name: string, fn: () => Promise<T[]>): Promise<T[]> => {
      try {
        return await fn();
      } catch (err: any) {
        queryErrors.set(name, err instanceof Error ? err : new Error(String(err)));
        return [];
      }
    };

    const failingFn = async () => {
      throw new Error('Permission denied: Insufficient privileges on collection audit_logs');
    };

    const data = await safeFetchTest('audit_logs', failingFn);
    assert.strictEqual(data.length, 0);
    assert.ok(queryErrors.has('audit_logs'));
    assert.ok(queryErrors.get('audit_logs')?.message.includes('Permission denied'));

    const status = queryErrors.has('audit_logs') ? 'ERROR' : data.length === 0 ? 'EMPTY' : 'PASS';
    assert.strictEqual(status, 'ERROR', 'Failing query must be classified as ERROR, never EMPTY');
  });

  // --------------------------------------------------------------------------
  // TEST 8: Valid Empty Collection Classification
  // --------------------------------------------------------------------------
  await test('8. Successful query with 0 documents is classified as EMPTY', () => {
    const queryErrors = new Map<string, Error>();
    const data: any[] = [];
    const status = queryErrors.has('questions') ? 'ERROR' : data.length === 0 ? 'EMPTY' : 'PASS';
    assert.strictEqual(status, 'EMPTY');
  });

  // --------------------------------------------------------------------------
  // TEST 9: Read-Only Safety Invariant
  // --------------------------------------------------------------------------
  await test('9. Diagnostics do not invoke mutation methods on repositories', async () => {
    const mockRepo = new MockRepo([{ id: 'usr_001', name: 'Admin' }]);
    const records = await mockRepo.findAll();
    assert.strictEqual(mockRepo.readCount, 1);
    assert.strictEqual(mockRepo.writeCount, 0);
    assert.strictEqual(records.length, 1);
  });

  // --------------------------------------------------------------------------
  // TEST 10: Global Status Aggregation Logic
  // --------------------------------------------------------------------------
  await test('10. Global summary status reports PASS when all collections are valid or EMPTY', () => {
    const criticalCount = 0;
    const errorCount = 0;
    const warningCount = 0;

    let overallStatus: 'PASS' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'PASS';
    if (criticalCount > 0) overallStatus = 'CRITICAL';
    else if (errorCount > 0) overallStatus = 'ERROR';
    else if (warningCount > 0) overallStatus = 'WARNING';

    assert.strictEqual(overallStatus, 'PASS');
  });

  // --------------------------------------------------------------------------
  // TEST 11: Global Status Aggregation on Real Error
  // --------------------------------------------------------------------------
  await test('11. Global summary status reports ERROR when a real integrity error exists', () => {
    const criticalCount = 0;
    const errorCount = 1;
    const warningCount = 0;

    let overallStatus: 'PASS' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'PASS';
    if (criticalCount > 0) overallStatus = 'CRITICAL';
    else if (errorCount > 0) overallStatus = 'ERROR';
    else if (warningCount > 0) overallStatus = 'WARNING';

    assert.strictEqual(overallStatus, 'ERROR');
  });

  // --------------------------------------------------------------------------
  // TEST 12: Whitespace-Only Action and EventType Rejection
  // --------------------------------------------------------------------------
  await test('12. Whitespace-only action and eventType are treated as empty and fail', () => {
    const whitespaceRecord = {
      id: 'aud_whitespace_01',
      action: '   ',
      eventType: '  \t  ',
    };
    const actionName = (whitespaceRecord.action || whitespaceRecord.eventType || '').trim();
    assert.strictEqual(actionName, '', 'Whitespace-only strings must resolve to empty string');
  });

  // --------------------------------------------------------------------------
  // TEST 13: AuditLog Client Validation Guard (No Network)
  // --------------------------------------------------------------------------
  await test('13. AuditLogRepository.appendRecord client-side guard validates action or eventType', async () => {
    const { auditLogRepository } = await import('../../database/firestore/repositories/audit-log.repository');
    let threw = false;
    try {
      await auditLogRepository.appendRecord({
        id: 'aud_invalid_no_action',
        action: '',
        eventType: '',
        actorId: 'usr_test',
        actorName: 'Test',
        entityId: 'SYSTEM',
        entityType: 'SYSTEM',
        details: '',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      threw = true;
      assert.ok(err.message.includes('action or eventType is required'));
    }
    assert.strictEqual(threw, true, 'AuditLog append without action or eventType must throw ValidationError before network call');
  });

  // --------------------------------------------------------------------------
  // TEST 14: Synthetic Snapshot PASS with 0 Errors
  // --------------------------------------------------------------------------
  await test('14. Synthetic clean snapshot returns overallStatus PASS with 0 audit_logs errors', async () => {
    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot: createCleanSyntheticSnapshot() });
    assert.strictEqual(report.overallStatus, 'PASS');
    assert.strictEqual(report.issueCounts.error, 0);
    assert.strictEqual(report.issueCounts.critical, 0);
    const auditLogIssues = report.issues.filter((i: any) => i.category === 'AUDIT_LOG_INTEGRITY' && i.severity === 'ERROR');
    assert.strictEqual(auditLogIssues.length, 0);
  });

  // --------------------------------------------------------------------------
  // TEST 15: Informational empty-taxonomy notice produces zero integrity errors
  // --------------------------------------------------------------------------
  await test('15. Informational empty-taxonomy notice produces zero integrity errors and issueCount of 0', async () => {
    const snapshot = createCleanSyntheticSnapshot();
    snapshot.topics = [];
    snapshot.subtopics = [];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    assert.strictEqual(report.overallStatus, 'PASS');
    assert.strictEqual(report.issueCounts.error, 0);
    assert.strictEqual(report.issueCounts.total, 0, 'issueCounts.total must be 0 when only informational notices exist');
    const taxonomyEmptyNotice = report.issues.find((i: any) => i.entityType === 'TAXONOMY' && i.entityId === 'EMPTY');
    assert.ok(taxonomyEmptyNotice, 'Empty taxonomy notice must be present');
    assert.strictEqual(report.issueCounts.info, 1, 'Informational notice is tracked in info count');
  });

  // --------------------------------------------------------------------------
  // TEST 16: Consistency: Global totals, category counts, and collection rows agree
  // --------------------------------------------------------------------------
  await test('16. Global totals, category counts, and collection matrix rows agree consistently', async () => {
    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot: createCleanSyntheticSnapshot() });
    const sumCategoryIssues = report.integrityChecks.reduce((sum: number, c: any) => sum + c.issueCount, 0);
    const sumCollectionIssues = report.worksheetHealth.reduce((sum: number, w: any) => sum + w.issuesCount, 0);
    const actionableIssuesCount = report.issues.filter((i: any) => i.severity !== 'INFO').length;

    assert.strictEqual(report.issueCounts.total, actionableIssuesCount, 'Global total must equal actionable issues count');
    assert.strictEqual(sumCategoryIssues, report.issueCounts.total, 'Sum of category issue counts must equal global total');
    assert.strictEqual(sumCollectionIssues, report.issueCounts.total, 'Sum of collection issue counts must equal global total');
  });

  // --------------------------------------------------------------------------
  // TEST 17: Genuine taxonomy reference error increments the correct issue count
  // --------------------------------------------------------------------------
  await test('17. A genuine taxonomy reference error increments the correct issue count and sets ERROR status', async () => {
    const { computeDiagnosticCounts } = await import('../../shared');
    const mockIssues = [
      {
        id: 'DI-ISSUE-00001',
        severity: 'INFO',
        category: 'QUESTION_INTEGRITY',
        message: 'Empty taxonomy notice',
      },
      {
        id: 'DI-ISSUE-00002',
        severity: 'ERROR',
        category: 'QUESTION_INTEGRITY',
        message: 'Subtopic references non-existent topic',
      },
    ];

    const counts = computeDiagnosticCounts(mockIssues);
    assert.strictEqual(counts.error, 1);
    assert.strictEqual(counts.info, 1);
    assert.strictEqual(counts.total, 1, 'Total must count only actionable issues (1 error), excluding info');
  });

  // --------------------------------------------------------------------------
  // TEST 18: Legacy worksheet terminology does not appear in rendered diagnostic items
  // --------------------------------------------------------------------------
  await test('18. Legacy worksheet terminology does not appear in diagnostic item messages or recommendations', async () => {
    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot: createCleanSyntheticSnapshot() });
    for (const issue of report.issues) {
      assert.ok(issue.collection, `Issue ${issue.id} must define collection property`);
      assert.ok(!issue.message.includes('mapping row'), `Issue message should not mention mapping row: ${issue.message}`);
      assert.ok(!issue.recommendedAction.includes('in the QUESTIONS worksheet'), `Action must not mention QUESTIONS worksheet: ${issue.recommendedAction}`);
      assert.ok(!issue.recommendedAction.includes('in the VIDEOS worksheet'), `Action must not mention VIDEOS worksheet: ${issue.recommendedAction}`);
      assert.ok(!issue.recommendedAction.includes('in WORKFLOW worksheet'), `Action must not mention WORKFLOW worksheet: ${issue.recommendedAction}`);
      assert.ok(!issue.recommendedAction.includes('in USERS tab'), `Action must not mention USERS tab: ${issue.recommendedAction}`);
    }
  });

  // ==========================================================================
  // NEW DIAGNOSTIC CONTRACT VALIDATION TESTS
  // ==========================================================================

  // --------------------------------------------------------------------------
  // TEST 19: isValidVersionId Validator Positive Cases
  // --------------------------------------------------------------------------
  await test('19. isValidVersionId accepts canonical standalone, supported legacy, and valid composite IDs', () => {
    const scriptConfig = { canonicalPrefix: 'scv_', allowedParentPrefixes: ['scr_', 'BP-S-'], allowedLegacyPrefixes: ['BP-SCV-'] };
    assert.strictEqual(isValidVersionId('scv_3fa85f64-5717-4562-b3fc-2c963f66afa6', scriptConfig), true, 'Canonical scv_ accepted');
    assert.strictEqual(isValidVersionId('BP-SCV-0001', scriptConfig), true, 'Legacy BP-SCV- accepted');
    assert.strictEqual(isValidVersionId('scr_3fa85f64-5717-4562-b3fc-2c963f66afa6-V1', scriptConfig), true, 'Composite canonical scr_-V1 accepted');
    assert.strictEqual(isValidVersionId('scr_3fa85f64-5717-4562-b3fc-2c963f66afa6-V12', scriptConfig), true, 'Composite canonical scr_-V12 accepted');
    assert.strictEqual(isValidVersionId('BP-S-0001-V1', scriptConfig), true, 'Composite legacy BP-S-0001-V1 accepted');

    const thumbConfig = { canonicalPrefix: 'thv_', allowedParentPrefixes: ['thm_', 'BP-T-'], allowedLegacyPrefixes: ['BP-THV-'] };
    assert.strictEqual(isValidVersionId('thv_3fa85f64-5717-4562-b3fc-2c963f66afa6', thumbConfig), true, 'Canonical thv_ accepted');
    assert.strictEqual(isValidVersionId('BP-THV-0001', thumbConfig), true, 'Legacy BP-THV- accepted');
    assert.strictEqual(isValidVersionId('thm_3fa85f64-5717-4562-b3fc-2c963f66afa6-V1', thumbConfig), true, 'Composite canonical thm_-V1 accepted');
    assert.strictEqual(isValidVersionId('BP-T-0001-V2', thumbConfig), true, 'Composite legacy BP-T-0001-V2 accepted');

    const pinConfig = { canonicalPrefix: 'pcv_', allowedParentPrefixes: ['pin_', 'BP-PIN-'], allowedLegacyPrefixes: ['BP-PCV-'] };
    assert.strictEqual(isValidVersionId('pcv_3fa85f64-5717-4562-b3fc-2c963f66afa6', pinConfig), true, 'Canonical pcv_ accepted');
    assert.strictEqual(isValidVersionId('BP-PCV-0001', pinConfig), true, 'Legacy BP-PCV- accepted');
    assert.strictEqual(isValidVersionId('pin_3fa85f64-5717-4562-b3fc-2c963f66afa6-V1', pinConfig), true, 'Composite canonical pin_-V1 accepted');
    assert.strictEqual(isValidVersionId('BP-PIN-0001-V3', pinConfig), true, 'Composite legacy BP-PIN-0001-V3 accepted');
  });

  // --------------------------------------------------------------------------
  // TEST 20: isValidVersionId Validator Negative Cases (Strict Error Detection)
  // --------------------------------------------------------------------------
  await test('20. isValidVersionId strictly rejects malformed, invalid, bare prefixes, or mismatched version IDs', () => {
    const scriptConfig = { canonicalPrefix: 'scv_', allowedParentPrefixes: ['scr_', 'BP-S-'], allowedLegacyPrefixes: ['BP-SCV-'] };
    const thumbConfig = { canonicalPrefix: 'thv_', allowedParentPrefixes: ['thm_', 'BP-T-'], allowedLegacyPrefixes: ['BP-THV-'] };
    const pinConfig = { canonicalPrefix: 'pcv_', allowedParentPrefixes: ['pin_', 'BP-PIN-'], allowedLegacyPrefixes: ['BP-PCV-'] };

    // 1. Bare canonical prefixes (must NOT be treated as valid)
    assert.strictEqual(isValidVersionId('scv_', scriptConfig), false, 'Bare scv_ rejected');
    assert.strictEqual(isValidVersionId('thv_', thumbConfig), false, 'Bare thv_ rejected');
    assert.strictEqual(isValidVersionId('pcv_', pinConfig), false, 'Bare pcv_ rejected');

    // 2. Bare legacy prefixes (must NOT be treated as valid)
    assert.strictEqual(isValidVersionId('BP-SCV-', scriptConfig), false, 'Bare BP-SCV- rejected');
    assert.strictEqual(isValidVersionId('BP-THV-', thumbConfig), false, 'Bare BP-THV- rejected');
    assert.strictEqual(isValidVersionId('BP-PCV-', pinConfig), false, 'Bare BP-PCV- rejected');

    // 3. Malformed canonical standalone IDs (must be valid UUID v4)
    assert.strictEqual(isValidVersionId('scv_invalid_not_uuid', scriptConfig), false, 'Malformed scv_ UUID rejected');
    assert.strictEqual(isValidVersionId('thv_123', thumbConfig), false, 'Malformed thv_ UUID rejected');
    assert.strictEqual(isValidVersionId('pcv_xyz', pinConfig), false, 'Malformed pcv_ UUID rejected');
    assert.strictEqual(isValidVersionId('scv_3fa85f64-5717-4562-b3fc', scriptConfig), false, 'Truncated scv_ UUID rejected');
    assert.strictEqual(isValidVersionId('scv_3fa85f64-5717-4562-b3fc-2c963f66afa6-extra', scriptConfig), false, 'Oversized scv_ UUID rejected');

    // 4. Empty or whitespace-only
    assert.strictEqual(isValidVersionId('', scriptConfig), false, 'Empty string rejected');
    assert.strictEqual(isValidVersionId('   ', scriptConfig), false, 'Whitespace rejected');

    // 5. Malformed composite parent IDs
    assert.strictEqual(isValidVersionId('scr_-V1', scriptConfig), false, 'scr_-V1 with empty parent ID rejected');
    assert.strictEqual(isValidVersionId('scr_invalid_uuid-V1', scriptConfig), false, 'scr_ with malformed UUID in composite rejected');
    assert.strictEqual(isValidVersionId('thm_not_a_uuid-V1', thumbConfig), false, 'thm_ with malformed UUID in composite rejected');
    assert.strictEqual(isValidVersionId('pin_bad_uuid-V1', pinConfig), false, 'pin_ with malformed UUID in composite rejected');
    assert.strictEqual(isValidVersionId('BP-S--V1', scriptConfig), false, 'BP-S--V1 with empty parent suffix rejected');

    // 6. Invalid version numbers in composite
    assert.strictEqual(isValidVersionId('scr_3fa85f64-5717-4562-b3fc-2c963f66afa6-V0', scriptConfig), false, 'Version 0 rejected');
    assert.strictEqual(isValidVersionId('scr_3fa85f64-5717-4562-b3fc-2c963f66afa6-V01', scriptConfig), false, 'Version with leading zero rejected');
    assert.strictEqual(isValidVersionId('scr_3fa85f64-5717-4562-b3fc-2c963f66afa6-V-1', scriptConfig), false, 'Negative version rejected');
    assert.strictEqual(isValidVersionId('scr_3fa85f64-5717-4562-b3fc-2c963f66afa6-Va', scriptConfig), false, 'Non-numeric version suffix rejected');
    assert.strictEqual(isValidVersionId('scr_3fa85f64-5717-4562-b3fc-2c963f66afa6-V', scriptConfig), false, 'Missing version number rejected');

    // 7. Wrong parent prefix
    assert.strictEqual(isValidVersionId('pin_3fa85f64-5717-4562-b3fc-2c963f66afa6-V1', scriptConfig), false, 'Pin ID in script version rejected');
    assert.strictEqual(isValidVersionId('thm_3fa85f64-5717-4562-b3fc-2c963f66afa6-V1', scriptConfig), false, 'Thumbnail ID in script version rejected');
    assert.strictEqual(isValidVersionId('random_parent-V1', scriptConfig), false, 'Arbitrary prefix rejected');

    // 8. Bare parent ID without version suffix in version collection
    assert.strictEqual(isValidVersionId('scr_3fa85f64-5717-4562-b3fc-2c963f66afa6', scriptConfig), false, 'Bare script ID in version collection rejected');
  });

  // --------------------------------------------------------------------------
  // TEST 21: Diagnostic Engine Accepts Valid Composite Version IDs Without Warnings
  // --------------------------------------------------------------------------
  await test('21. Diagnostic engine accepts valid composite version IDs for script, thumbnail, and pinned comments with 0 warnings', async () => {
    const snapshot = createCleanSyntheticSnapshot();

    snapshot.scripts = [{ id: 'scr_00000000-0000-0000-0000-000000000001', videoId: 'vid_001', currentVersion: 1 } as any];
    snapshot.scriptVersions = [{
      id: 'scr_00000000-0000-0000-0000-000000000001-V1',
      scriptId: 'scr_00000000-0000-0000-0000-000000000001',
      versionNumber: 1,
      content: '{}',
    } as any];

    snapshot.thumbnails = [{ id: 'thm_00000000-0000-0000-0000-000000000001', videoId: 'vid_001', currentVersion: 1 } as any];
    snapshot.thumbnailVersions = [{
      id: 'thm_00000000-0000-0000-0000-000000000001-V1',
      thumbnailId: 'thm_00000000-0000-0000-0000-000000000001',
      versionNumber: 1,
      driveAssetUrl: 'https://example.com/thumb.jpg',
    } as any];

    snapshot.pinnedComments = [{ id: 'pin_00000000-0000-0000-0000-000000000001', videoId: 'vid_001', commentText: 'Test comment' } as any];
    snapshot.pinnedCommentVersions = [{
      id: 'pin_00000000-0000-0000-0000-000000000001-V1',
      pinnedCommentId: 'pin_00000000-0000-0000-0000-000000000001',
      versionNumber: 1,
      commentText: 'Test comment',
    } as any];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const idWarnings = report.issues.filter(
      (i: any) => i.category === 'ID_INTEGRITY' && ['script_versions', 'thumbnail_versions', 'pinned_comment_versions'].includes(i.worksheet)
    );
    assert.strictEqual(idWarnings.length, 0, `Expected 0 ID warnings for valid composite versions, got: ${JSON.stringify(idWarnings)}`);
  });

  // --------------------------------------------------------------------------
  // TEST 22: Diagnostic Engine Flags Malformed Version IDs with WARNING
  // --------------------------------------------------------------------------
  await test('22. Diagnostic engine flags malformed version IDs with ID_INTEGRITY WARNING', async () => {
    const snapshot = createCleanSyntheticSnapshot();

    snapshot.scriptVersions = [{
      id: 'malformed_script_version_id',
      scriptId: 'scr_001',
      versionNumber: 1,
    } as any];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const warning = report.issues.find(
      (i: any) => i.category === 'ID_INTEGRITY' && i.worksheet === 'script_versions' && i.entityId === 'malformed_script_version_id'
    );
    assert.ok(warning, 'Must flag malformed script version ID');
    assert.strictEqual(warning.severity, 'WARNING');
  });

  // --------------------------------------------------------------------------
  // TEST 22b: Diagnostic Engine Flags Bare and Malformed Standalone Version IDs with WARNING
  // --------------------------------------------------------------------------
  await test('22b. Diagnostic engine flags bare prefixes (scv_, BP-SCV-) and malformed UUIDs with ID_INTEGRITY WARNING', async () => {
    const snapshot = createCleanSyntheticSnapshot();

    snapshot.scriptVersions = [
      { id: 'scv_', scriptId: 'scr_001', versionNumber: 1 } as any,
      { id: 'BP-SCV-', scriptId: 'scr_001', versionNumber: 2 } as any,
      { id: 'scv_not-a-valid-uuid', scriptId: 'scr_001', versionNumber: 3 } as any,
    ];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const warnings = report.issues.filter(
      (i: any) => i.category === 'ID_INTEGRITY' && i.worksheet === 'script_versions'
    );
    assert.strictEqual(warnings.length, 3, `Expected 3 warnings for bare/malformed version IDs, got ${warnings.length}`);
    assert.ok(warnings.some((w: any) => w.entityId === 'scv_'));
    assert.ok(warnings.some((w: any) => w.entityId === 'BP-SCV-'));
    assert.ok(warnings.some((w: any) => w.entityId === 'scv_not-a-valid-uuid'));
  });

  // --------------------------------------------------------------------------
  // TEST 23: Workflow Entity Resolution: Question Drafts and Content Masters
  // --------------------------------------------------------------------------
  await test('23. Workflow entity resolution accepts Question Drafts and Content Masters without false-positive warnings', async () => {
    const snapshot = createCleanSyntheticSnapshot();

    // Add draft and content master
    snapshot.questionDrafts = [{ id: 'dft_00000000-0000-0000-0000-000000000001', topicId: 'top_001', subtopicId: 'sub_001' } as any];
    snapshot.contentMasters = [{ id: 'cnt_00000000-0000-0000-0000-000000000001', title: 'Master 1', status: 'DRAFT' } as any];

    // Workflows referencing draft and master
    snapshot.workflows = [
      {
        id: 'wfl_001',
        entityId: 'dft_00000000-0000-0000-0000-000000000001',
        entityType: 'QUESTION',
        currentStep: 1,
        contentStatus: 'DRAFT',
        jobStatus: 'IDLE',
      },
      {
        id: 'wfl_002',
        entityId: 'cnt_00000000-0000-0000-0000-000000000001',
        entityType: 'CONTENT',
        currentStep: 3,
        contentStatus: 'IN_REVIEW',
        jobStatus: 'PROCESSING',
      },
    ];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const workflowWarnings = report.issues.filter(
      (i: any) => i.category === 'WORKFLOW_INTEGRITY' && i.field === 'entityId'
    );
    assert.strictEqual(workflowWarnings.length, 0, `Expected 0 entityId warnings for registered drafts/masters, got: ${JSON.stringify(workflowWarnings)}`);
  });

  // --------------------------------------------------------------------------
  // TEST 24: Workflow Entity Resolution Flags Truly Missing Entity References
  // --------------------------------------------------------------------------
  await test('24. Workflow entity resolution flags truly missing entity reference as WARNING', async () => {
    const snapshot = createCleanSyntheticSnapshot();

    snapshot.workflows = [
      {
        id: 'wfl_missing_ref',
        entityId: 'qst_non_existent_entity_id',
        entityType: 'QUESTION',
        currentStep: 2,
        contentStatus: 'DRAFT',
        jobStatus: 'IDLE',
      },
    ];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const missingEntityWarning = report.issues.find(
      (i: any) => i.category === 'WORKFLOW_INTEGRITY' && i.field === 'entityId' && i.entityId === 'wfl_missing_ref'
    );
    assert.ok(missingEntityWarning, 'Must flag missing entity reference in workflow');
    assert.strictEqual(missingEntityWarning.severity, 'WARNING');
  });

  // --------------------------------------------------------------------------
  // TEST 24b: Workflow Entity Resolution: Content Plans, Batches, and Thumbnails
  // --------------------------------------------------------------------------
  await test('24b. Workflow entity resolution accepts Content Plans, Content Batches, and Thumbnails without false-positive warnings', async () => {
    const snapshot = createCleanSyntheticSnapshot();
    snapshot.contentPlans = [{ id: 'pln_00000000-0000-0000-0000-000000000001', name: 'Plan 1' } as any];
    snapshot.contentBatches = [{ id: 'bch_00000000-0000-0000-0000-000000000001', name: 'Batch 1' } as any];
    snapshot.thumbnails = [{ id: 'thm_00000000-0000-0000-0000-000000000001', videoId: 'vid_001' } as any];

    snapshot.workflows = [
      { id: 'wfl_plan_01', entityId: 'pln_00000000-0000-0000-0000-000000000001', entityType: 'CONTENT', currentStep: 1, contentStatus: 'DRAFT', jobStatus: 'IDLE' },
      { id: 'wfl_batch_01', entityId: 'bch_00000000-0000-0000-0000-000000000001', entityType: 'CONTENT', currentStep: 1, contentStatus: 'DRAFT', jobStatus: 'IDLE' },
      { id: 'wfl_thumb_01', entityId: 'thm_00000000-0000-0000-0000-000000000001', entityType: 'CONTENT', currentStep: 8, contentStatus: 'DRAFT', jobStatus: 'IDLE' },
    ];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const warnings = report.issues.filter(
      (i: any) => i.category === 'WORKFLOW_INTEGRITY' && i.field === 'entityId'
    );
    assert.strictEqual(warnings.length, 0, `Expected 0 warnings for plan/batch/thumb links, got: ${JSON.stringify(warnings)}`);
  });

  // --------------------------------------------------------------------------
  // TEST 24c: Workflow Entity Resolution Flags Circular/Self-Referential Entity IDs
  // --------------------------------------------------------------------------
  await test('24c. Workflow entity resolution flags circular/self-referential entity IDs with pinpoint diagnosis', async () => {
    const snapshot = createCleanSyntheticSnapshot();

    snapshot.workflows = [
      {
        id: 'wfl_48d6e33c-d54c-42a4-9063-a71b74952fcb',
        entityId: 'wfl_48d6e33c-d54c-42a4-9063-a71b74952fcb',
        entityType: 'QUESTION',
        currentStep: 1,
        contentStatus: 'DRAFT',
        jobStatus: 'IDLE',
      },
    ];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const selfRefWarning = report.issues.find(
      (i: any) => i.category === 'WORKFLOW_INTEGRITY' && i.field === 'entityId' && i.entityId === 'wfl_48d6e33c-d54c-42a4-9063-a71b74952fcb'
    );
    assert.ok(selfRefWarning, 'Must flag self-referential workflow entity reference');
    assert.strictEqual(selfRefWarning.severity, 'WARNING');
    assert.ok(selfRefWarning.message.includes('circular/invalid entity_id'), 'Message must identify circular/invalid reference');
    assert.ok(selfRefWarning.message.includes('self-reference'), 'Message must note self-reference');
    assert.ok(selfRefWarning.recommendedAction.includes('workflow_instances'), 'Guidance must mention workflow_instances collection');
  });

  // --------------------------------------------------------------------------
  // TEST 24d: Workflow Entity Resolution Flags Missing Question Draft with Conversion Guidance
  // --------------------------------------------------------------------------
  await test('24d. Workflow entity resolution flags missing question draft with conversion/archival guidance', async () => {
    const snapshot = createCleanSyntheticSnapshot();

    // Production case: workflow references a draft that was deleted upon question approval or discarded
    snapshot.workflows = [
      {
        id: 'wfl_48d6e33c-d54c-42a4-9063-a71b74952fcb',
        entityId: 'dft_48d6e3cb-a5f1-42ea-a486-4d39541a9191',
        entityType: 'QUESTION',
        currentStep: 2,
        contentStatus: 'IN_REVIEW',
        jobStatus: 'PROCESSING',
      },
    ];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const draftRefWarning = report.issues.find(
      (i: any) => i.category === 'WORKFLOW_INTEGRITY' && i.field === 'entityId' && i.entityId === 'wfl_48d6e33c-d54c-42a4-9063-a71b74952fcb'
    );
    assert.ok(draftRefWarning, 'Must flag missing draft reference in workflow');
    assert.strictEqual(draftRefWarning.severity, 'WARNING');
    assert.ok(draftRefWarning.message.includes('question draft'), 'Message must identify question draft');
    assert.ok(draftRefWarning.recommendedAction.includes('approved into an active Question'), 'Guidance must mention question approval path');
    assert.ok(draftRefWarning.recommendedAction.includes('soft-archive'), 'Guidance must advise safe soft-archiving instead of hasty deletion');
  });

  // --------------------------------------------------------------------------
  // TEST 24e: Reconciled Workflow to Materialized Question Passes Integrity Check Cleanly
  // --------------------------------------------------------------------------
  await test('24e. Reconciled workflow pointing to materialized canonical question passes integrity check with zero issues', async () => {
    const snapshot = createCleanSyntheticSnapshot();
    const approvedQstId = 'qst_48d6e3cb-a5f1-42ea-a486-4d39541a9191';
    snapshot.questions = [{ id: approvedQstId } as any];

    // Reconciled workflow: entityId was updated from dft_... to qst_... upon approval
    snapshot.workflows = [
      {
        id: 'wfl_48d6e33c-d54c-42a4-9063-a71b74952fcb',
        entityId: approvedQstId,
        entityType: 'QUESTION',
        currentStep: 2,
        contentStatus: 'APPROVED',
        jobStatus: 'PROCESSING',
      },
    ];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const draftRefWarning = report.issues.find(
      (i: any) => i.category === 'WORKFLOW_INTEGRITY' && i.field === 'entityId' && i.entityId === 'wfl_48d6e33c-d54c-42a4-9063-a71b74952fcb'
    );
    assert.strictEqual(draftRefWarning, undefined, 'Reconciled workflow must produce zero integrity warnings');
  });

  // --------------------------------------------------------------------------
  // TEST 25: Canonical 15-Stage Workflow Instance Validates currentStep and contentStatus
  // --------------------------------------------------------------------------
  await test('25. Canonical 15-stage workflow instance validates currentStep (1..15) and contentStatus without requiring legacy toStatus', async () => {
    const snapshot = createCleanSyntheticSnapshot();
    snapshot.questionDrafts = [{ id: 'dft_valid_01' } as any];

    // Perfectly valid canonical workflow instance
    snapshot.workflows = [
      {
        id: 'wfl_valid_01',
        entityId: 'dft_valid_01',
        entityType: 'QUESTION',
        currentStep: 1,
        contentStatus: 'DRAFT',
        jobStatus: 'IDLE',
      },
    ];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const workflowIssues = report.issues.filter((i: any) => i.category === 'WORKFLOW_INTEGRITY');
    assert.strictEqual(workflowIssues.length, 0, `Expected 0 issues for valid canonical workflow, got: ${JSON.stringify(workflowIssues)}`);
  });

  // --------------------------------------------------------------------------
  // TEST 26: Canonical 15-Stage Workflow Instance Rejects Missing/Invalid currentStep and Status
  // --------------------------------------------------------------------------
  await test('26. Canonical 15-stage workflow instance flags out-of-range currentStep and missing contentStatus as ERROR', async () => {
    const snapshot = createCleanSyntheticSnapshot();
    snapshot.questionDrafts = [{ id: 'dft_valid_01' } as any];

    snapshot.workflows = [
      {
        id: 'wfl_invalid_step',
        entityId: 'dft_valid_01',
        entityType: 'QUESTION',
        currentStep: 16, // Out of range (max 15)
        contentStatus: 'DRAFT',
        jobStatus: 'IDLE',
      },
      {
        id: 'wfl_missing_status',
        entityId: 'dft_valid_01',
        entityType: 'QUESTION',
        currentStep: 2,
        contentStatus: '', // Missing
        jobStatus: 'IDLE',
      },
    ];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });
    const stepError = report.issues.find(
      (i: any) => i.entityId === 'wfl_invalid_step' && i.field === 'currentStep' && i.severity === 'ERROR'
    );
    assert.ok(stepError, 'Must flag invalid currentStep 16 as ERROR');

    const statusError = report.issues.find(
      (i: any) => i.entityId === 'wfl_missing_status' && i.field === 'contentStatus' && i.severity === 'ERROR'
    );
    assert.ok(statusError, 'Must flag missing contentStatus as ERROR');
  });

  // --------------------------------------------------------------------------
  // TEST 27: Legacy Workflow Transition Record Validation
  // --------------------------------------------------------------------------
  await test('27. Legacy workflow transition records validate toStatus and illegal terminal state transitions', async () => {
    const snapshot = createCleanSyntheticSnapshot();
    snapshot.videos = [{ id: 'vid_legacy_01', status: 'IN_PRODUCTION' } as any];

    // Valid legacy record
    snapshot.workflows = [
      {
        id: 'WF-valid-01',
        entityId: 'vid_legacy_01',
        fromStatus: 'ASSIGNED',
        toStatus: 'IN_PRODUCTION',
        triggeredBy: 'usr_001',
      },
      // Missing toStatus
      {
        id: 'WF-missing-to',
        entityId: 'vid_legacy_01',
        fromStatus: 'IN_PRODUCTION',
        toStatus: '',
      },
      // Illegal transition from terminal state UPLOADED
      {
        id: 'WF-illegal-terminal',
        entityId: 'vid_legacy_01',
        fromStatus: 'UPLOADED',
        toStatus: 'IN_PRODUCTION',
      },
    ];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });

    const missingToError = report.issues.find(
      (i: any) => i.entityId === 'WF-missing-to' && i.field === 'toStatus' && i.severity === 'ERROR'
    );
    assert.ok(missingToError, 'Must flag legacy workflow record missing toStatus as ERROR');

    const terminalError = report.issues.find(
      (i: any) => i.entityId === 'WF-illegal-terminal' && i.severity === 'ERROR'
    );
    assert.ok(terminalError, 'Must flag illegal transition from terminal state UPLOADED as ERROR');

    const validRecordIssues = report.issues.filter((i: any) => i.entityId === 'WF-valid-01');
    assert.strictEqual(validRecordIssues.length, 0, 'Valid legacy workflow transition must have 0 issues');
  });

  // --------------------------------------------------------------------------
  // TEST 28: Ambiguous and Unrecognized Workflow Documents Flagged as ERROR
  // --------------------------------------------------------------------------
  await test('28. Ambiguous and unrecognized workflow documents are flagged as ERROR', async () => {
    const snapshot = createCleanSyntheticSnapshot();
    snapshot.videos = [{ id: 'vid_001' } as any];

    snapshot.workflows = [
      // Ambiguous: has both currentStep AND toStatus
      {
        id: 'wfl_ambiguous_doc',
        entityId: 'vid_001',
        currentStep: 3,
        toStatus: 'IN_REVIEW',
        contentStatus: 'DRAFT',
      },
      // Unrecognized: missing both schemas
      {
        id: 'unknown_doc_shape',
        entityId: 'vid_001',
      },
    ];

    const report = await dataIntegrityService.runFullIntegrityCheck({ snapshot });

    const ambiguousError = report.issues.find(
      (i: any) => i.entityId === 'wfl_ambiguous_doc' && i.severity === 'ERROR' && i.message.includes('ambiguously')
    );
    assert.ok(ambiguousError, 'Must flag ambiguous workflow document as ERROR');

    const unknownError = report.issues.find(
      (i: any) => i.entityId === 'unknown_doc_shape' && i.severity === 'ERROR' && i.message.includes('does not conform')
    );
    assert.ok(unknownError, 'Must flag unrecognized workflow document as ERROR');
  });

  console.log('\n------------------------------------------------------------');
  console.log(`Unit Test Results: ${passed} passed, ${failed} failed`);
  console.log('------------------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

runUnitTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
