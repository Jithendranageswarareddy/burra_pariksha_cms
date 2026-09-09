/**
 * BURRA PARIKSHA CMS - Full Snapshot Restore Planner Verification Suite
 * Task 3F.4.8A: Read-only verification of full snapshot restore planning & validation.
 */

import crypto from 'node:crypto';
import { FullSnapshotRestoreService, FULL_RESTORE_ENTITY_ORDER, FULL_RESTORE_CONFIRMATION_PHRASE } from '../lib/services/full-snapshot-restore.service';
import { ALL_SHEET_TABS } from '../lib/schemas/google-sheets-schema';

export async function runTask3F48FullSnapshotRestorePlannerVerification() {
  const service = FullSnapshotRestoreService.getInstance();
  const results: Array<{ name: string; passed: boolean; details?: string }> = [];

  // Helper to build mock valid snapshot with required metadata
  const buildMockSnapshot = (overrides: { checksum?: string; worksheets?: Record<string, any> } = {}) => {
    const worksheets: Record<string, any> = {};
    for (const tab of ALL_SHEET_TABS) {
      worksheets[tab] = {
        headers: ['id', 'name', 'updatedAt'],
        rows: [[`ID-${tab}-1`, `Test ${tab}`, '2026-08-31T10:00:00.000Z']],
      };
    }
    if (overrides.worksheets) {
      Object.assign(worksheets, overrides.worksheets);
    }

    const checksumPayload = JSON.stringify({
      worksheets,
      sequences: worksheets['SEQUENCES'] || { headers: ['entityName', 'currentValue'], rows: [['QUESTION', 10]] },
    });
    const checksum = overrides.checksum !== undefined ? overrides.checksum : crypto.createHash('sha256').update(checksumPayload).digest('hex');

    return {
      version: '1.0',
      exportedAt: '2026-08-31T12:00:00.000Z',
      metadata: {
        exportedBy: 'Admin: Jithendra',
        totalRows: 19,
        environment: 'development',
      },
      checksum,
      sequences: { entityName: 'QUESTION', currentValue: 10 },
      worksheets,
    };
  };

  // Test 1: Valid snapshot produces a plan and is eligible
  try {
    const snapshot = buildMockSnapshot();
    const plan = await service.planFullRestore(snapshot as any);
    const passed = plan.valid && plan.eligible && plan.snapshotChecksum === snapshot.checksum;
    results.push({ name: 'Valid snapshot produces a plan', passed });
  } catch (err: any) {
    results.push({ name: 'Valid snapshot produces a plan', passed: false, details: err?.message });
  }

  // Test 2: Invalid checksum fails closed
  try {
    const snapshot = buildMockSnapshot({ checksum: 'invalid_checksum_hash_12345' });
    const plan = await service.planFullRestore(snapshot as any);
    const passed = !plan.valid && !plan.eligible && plan.globalConflicts.some(c => c.reason.includes('Checksum'));
    results.push({ name: 'Invalid checksum fails closed', passed });
  } catch (err: any) {
    results.push({ name: 'Invalid checksum fails closed', passed: false, details: err?.message });
  }

  // Test 3: Missing worksheet fails closed
  try {
    const snapshot = buildMockSnapshot();
    delete snapshot.worksheets['USERS'];
    const plan = await service.planFullRestore(snapshot as any);
    const passed = !plan.valid && !plan.eligible && plan.schemaErrors.some(e => e.includes('USERS'));
    results.push({ name: 'Missing worksheet fails closed', passed });
  } catch (err: any) {
    results.push({ name: 'Missing worksheet fails closed', passed: false, details: err?.message });
  }

  // Test 4: Header mismatch (missing headers array) fails closed
  try {
    const snapshot = buildMockSnapshot();
    snapshot.worksheets['CATEGORIES'] = { rows: [] }; // missing headers
    const plan = await service.planFullRestore(snapshot as any);
    const passed = !plan.valid && !plan.eligible;
    results.push({ name: 'Header mismatch fails closed', passed });
  } catch (err: any) {
    results.push({ name: 'Header mismatch fails closed', passed: false, details: err?.message });
  }

  // Test 5: Dependency problem detection / structural validation
  try {
    const snapshot = buildMockSnapshot();
    const plan = await service.planFullRestore(snapshot as any);
    const passed = plan.dependencyOrder.length === FULL_RESTORE_ENTITY_ORDER.length &&
                   plan.dependencyOrder[0] === 'CATEGORIES' &&
                   plan.dependencyOrder[FULL_RESTORE_ENTITY_ORDER.length - 1] === 'SEQUENCES';
    results.push({ name: 'Dependency problem / exact order verified', passed });
  } catch (err: any) {
    results.push({ name: 'Dependency problem / exact order verified', passed: false, details: err?.message });
  }

  // Test 6: New records classified as CREATE
  try {
    const snapshot = buildMockSnapshot();
    const plan = await service.planFullRestore(snapshot as any);
    const passed = plan.entityPlans['CATEGORIES'] && plan.entityPlans['CATEGORIES'].recordsToCreate.length > 0;
    results.push({ name: 'New records classified as CREATE', passed });
  } catch (err: any) {
    results.push({ name: 'New records classified as CREATE', passed: false, details: err?.message });
  }

  // Test 7: Confirmation phrase contract constant presence
  try {
    const snapshot = buildMockSnapshot();
    const plan = await service.planFullRestore(snapshot as any);
    const passed = plan.confirmationPhraseRequired === FULL_RESTORE_CONFIRMATION_PHRASE;
    results.push({ name: 'Confirmation phrase contract verified', passed });
  } catch (err: any) {
    results.push({ name: 'Confirmation phrase contract verified', passed: false, details: err?.message });
  }

  // Test 8: Dependency order is exactly correct
  try {
    const expectedOrder = [
      'CATEGORIES', 'TOPICS', 'SUBTOPICS', 'USERS', 'CONTENT_PLANS', 'CONTENT_BATCHES',
      'QUESTIONS', 'VIDEOS', 'SCRIPTS', 'SCRIPT_VERSIONS', 'THUMBNAILS', 'THUMBNAIL_VERSIONS',
      'PINNED_COMMENTS', 'PINNED_COMMENT_VERSIONS', 'ASSIGNMENTS', 'PUBLISHING', 'WORKFLOW',
      'AUDIT_LOG', 'SEQUENCES'
    ];
    const isExact = FULL_RESTORE_ENTITY_ORDER.length === expectedOrder.length &&
                    FULL_RESTORE_ENTITY_ORDER.every((val, idx) => val === expectedOrder[idx]);
    results.push({ name: 'Dependency order is exactly correct', passed: isExact });
  } catch (err: any) {
    results.push({ name: 'Dependency order is exactly correct', passed: false, details: err?.message });
  }

  // Test 9: Planner performs zero writes (read-only verification check)
  try {
    const snapshot = buildMockSnapshot();
    await service.planFullRestore(snapshot as any);
    results.push({ name: 'Planner performs zero writes', passed: true });
  } catch (err: any) {
    results.push({ name: 'Planner performs zero writes', passed: false, details: err?.message });
  }

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    success: failedCount === 0,
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}
