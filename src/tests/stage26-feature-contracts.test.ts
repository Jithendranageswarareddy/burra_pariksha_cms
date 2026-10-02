/**
 * BURRA PARIKSHA CMS — Stage 26 Feature Contracts Verification Suite
 *
 * Verifies:
 * 1. Complete coverage of all 8 canonical manufacturing features (FEAT-01 to FEAT-08).
 * 2. Exhaustive 15-dimension schema validation on every feature contract (8 x 15 = 120 checks).
 * 3. Anti-Self-Approval invariant enforcement (GAR-02, AP-009) on SME Review (FEAT-02).
 * 4. Non-Authoritative AI enforcement (AP-009) preventing AI approvals on human gates.
 * 5. Mandatory Optimistic Concurrency Control (OCC) mode across all database dimensions.
 * 6. Instant rollback safety nets, mechanisms, and maximum RTO limits on all contracts.
 * 7. Exact correspondence between contractDocPath and physical documentation files.
 * 8. Deterministic helper functions (getFeatureContractById, getAllFeatureContracts, verifyContractCompleteness).
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  FeatureContractId,
  FeatureStatus,
  CANONICAL_FEATURE_CONTRACTS,
  validateFeatureContract,
  getFeatureContractById,
  getAllFeatureContracts,
  verifyAntiSelfApprovalRule,
  verifyNonAuthoritativeAiRule,
  verifyContractCompleteness,
} from '../types/feature-contracts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runStage26VerificationSuite() {
  console.log('================================================================================');
  console.log('STAGE 26: FEATURE CONTRACTS VERIFICATION SUITE');
  console.log('================================================================================\n');

  let passedTests = 0;

  // Test 1: Feature Contracts Registry Count & Completeness
  console.log('Test 1: Verifying all 8 canonical features exist in registry...');
  const expectedFeatureIds = [
    FeatureContractId.FEAT_01,
    FeatureContractId.FEAT_02,
    FeatureContractId.FEAT_03,
    FeatureContractId.FEAT_04,
    FeatureContractId.FEAT_05,
    FeatureContractId.FEAT_06,
    FeatureContractId.FEAT_07,
    FeatureContractId.FEAT_08,
  ];
  for (const featId of expectedFeatureIds) {
    const contract = CANONICAL_FEATURE_CONTRACTS[featId];
    assert(!!contract, `Missing feature contract for ${featId}`);
    assert(contract.status === FeatureStatus.ACCEPTED, `Feature contract ${featId} must have ACCEPTED status`);
    assert(contract.version === '1.1.0', `Feature contract ${featId} must have version 1.1.0`);
  }
  const allContracts = getAllFeatureContracts();
  assert(allContracts.length === 8, `Expected 8 contracts, got ${allContracts.length}`);
  console.log('  ✔ All 8 feature contracts present and accepted with version 1.1.0');
  passedTests++;

  // Test 2: Exhaustive 15-Dimension Validation on Every Contract (120 Proof Points)
  console.log('\nTest 2: Verifying 15-dimension schema validity on all 8 contracts (120 total dimensions)...');
  const expectedDimensions = [
    'requirement',
    'businessAcceptance',
    'domainEntities',
    'database',
    'api',
    'frontend',
    'rbac',
    'workflow',
    'validation',
    'errors',
    'audit',
    'realtime',
    'tests',
    'deployment',
    'rollback',
  ];

  let totalValidDimensions = 0;
  for (const contract of allContracts) {
    const validated = validateFeatureContract(contract);
    assert(validated.id === contract.id, `ID mismatch on validated contract ${contract.id}`);

    for (const dimKey of expectedDimensions) {
      assert(
        (validated.dimensions as Record<string, unknown>)[dimKey] !== undefined,
        `Missing dimension ${dimKey} on contract ${contract.id}`
      );
      totalValidDimensions++;
    }
  }

  assert(totalValidDimensions === 8 * 15, `Expected 120 valid dimensions, got ${totalValidDimensions}`);
  const completeness = verifyContractCompleteness();
  assert(completeness.isComplete === true, 'verifyContractCompleteness() must return true');
  assert(completeness.totalDimensionsChecked === 120, 'Completeness check must report exactly 120 dimensions');
  console.log(`  ✔ Validated 8 contracts x 15 dimensions = ${totalValidDimensions} proof points successfully`);
  passedTests++;

  // Test 3: Anti-Self-Approval Invariant Enforcement (GAR-02, AP-009)
  console.log('\nTest 3: Enforcing Anti-Self-Approval invariant (GAR-02, AP-009)...');
  const feat02 = getFeatureContractById(FeatureContractId.FEAT_02);
  assert(feat02.dimensions.rbac.antiSelfApprovalEnforced === true, 'FEAT-02 must enforce antiSelfApprovalEnforced = true');
  assert(
    feat02.dimensions.errors.errorCodes.includes('ERR_SELF_APPROVAL_PROHIBITED'),
    'FEAT-02 must include ERR_SELF_APPROVAL_PROHIBITED error code'
  );
  assert(
    feat02.dimensions.errors.httpStatusMappings['ERR_SELF_APPROVAL_PROHIBITED'] === 403,
    'ERR_SELF_APPROVAL_PROHIBITED must map to HTTP 403 Forbidden'
  );

  // Helper check
  assert(verifyAntiSelfApprovalRule('author-123', 'author-123') === false, 'Same author and reviewer must be rejected');
  assert(verifyAntiSelfApprovalRule('author-123', 'reviewer-456') === true, 'Different author and reviewer must be approved');
  assert(verifyAntiSelfApprovalRule('', 'reviewer-456') === false, 'Empty author ID must be rejected');
  console.log('  ✔ Anti-Self-Approval correctly enforced on FEAT-02 and validator functions');
  passedTests++;

  // Test 4: Non-Authoritative AI Invariant (AP-009)
  console.log('\nTest 4: Enforcing Non-Authoritative AI invariant (AP-009)...');
  const feat03 = getFeatureContractById(FeatureContractId.FEAT_03);
  assert(feat03.dimensions.workflow.nonAuthoritativeAiEnforced === true, 'FEAT-03 must enforce nonAuthoritativeAiEnforced');
  assert(feat03.dimensions.workflow.isHumanGated === true, 'FEAT-03 must be human-gated');

  // AI cannot approve human-gated steps
  assert(verifyNonAuthoritativeAiRule(true, 2) === false, 'AI agent cannot approve Step 02 (Question Review)');
  assert(verifyNonAuthoritativeAiRule(true, 4) === false, 'AI agent cannot approve Step 04 (Script Polish)');
  assert(verifyNonAuthoritativeAiRule(true, 6) === false, 'AI agent cannot approve Step 06 (Audio QC)');
  assert(verifyNonAuthoritativeAiRule(true, 8) === false, 'AI agent cannot approve Step 08 (Thumbnail QC)');
  assert(verifyNonAuthoritativeAiRule(true, 10) === false, 'AI agent cannot approve Step 10 (Video QC)');
  assert(verifyNonAuthoritativeAiRule(true, 12) === false, 'AI agent cannot approve Step 12 (Publish Dispatch)');
  assert(verifyNonAuthoritativeAiRule(false, 2) === true, 'Human user can approve Step 02');
  assert(verifyNonAuthoritativeAiRule(true, 3) === true, 'AI agent can generate Step 03 draft');
  console.log('  ✔ Non-Authoritative AI rules verified on all human-gated manufacturing steps');
  passedTests++;

  // Test 5: Optimistic Concurrency Control (OCC) Mode
  console.log('\nTest 5: Verifying Optimistic Concurrency Control (OCC) on all database dimensions...');
  for (const contract of allContracts) {
    assert(
      contract.dimensions.database.concurrencyMode === 'OPTIMISTIC_CONCURRENCY_CONTROL',
      `Contract ${contract.id} must use OPTIMISTIC_CONCURRENCY_CONTROL`
    );
    assert(contract.dimensions.database.collections.length > 0, `Contract ${contract.id} must define collections`);
    assert(contract.dimensions.database.primaryKeys.length > 0, `Contract ${contract.id} must define primary keys`);
  }
  console.log('  ✔ All 8 feature contracts enforce OCC mode in persistence definitions');
  passedTests++;

  // Test 6: Instant Rollback Mechanisms & RTO Limits
  console.log('\nTest 6: Verifying Instant Rollback safety nets and RTO constraints...');
  for (const contract of allContracts) {
    const rb = contract.dimensions.rollback;
    assert(rb.rollbackTrigger.length >= 10, `Contract ${contract.id} rollbackTrigger too short`);
    assert(rb.rollbackMechanism.length >= 10, `Contract ${contract.id} rollbackMechanism too short`);
    assert(rb.dataCompensationPlan.length >= 10, `Contract ${contract.id} dataCompensationPlan too short`);
    assert(rb.maxRtoSeconds > 0 && rb.maxRtoSeconds <= 60, `Contract ${contract.id} maxRtoSeconds must be <= 60s`);
  }
  console.log('  ✔ Instant rollback safety nets, compensation plans, and RTO <= 60s verified');
  passedTests++;

  // Test 7: Documentation File Path Exact Correspondence
  console.log('\nTest 7: Verifying all feature contract markdown documents exist on disk...');
  for (const contract of allContracts) {
    const fullPath = path.resolve(process.cwd(), contract.contractDocPath);
    assert(fs.existsSync(fullPath), `Documentation file does not exist at: ${contract.contractDocPath}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert(content.includes(contract.id), `Document ${contract.contractDocPath} missing Feature ID header ${contract.id}`);
    assert(content.includes('ACCEPTED — COMPLETE — CLOSED'), `Document ${contract.contractDocPath} missing CLOSED status`);
  }
  console.log('  ✔ All 8 feature contract markdown files exist and match registry specifications');
  passedTests++;

  // Test 8: Contract Query Helpers & Idempotency
  console.log('\nTest 8: Verifying query helpers and error handling...');
  const f1 = getFeatureContractById(FeatureContractId.FEAT_01);
  assert(f1.id === FeatureContractId.FEAT_01, 'getFeatureContractById failed for FEAT-01');

  let errorThrown = false;
  try {
    getFeatureContractById('FEAT-99' as FeatureContractId);
  } catch {
    errorThrown = true;
  }
  assert(errorThrown, 'getFeatureContractById must throw for invalid ID');
  console.log('  ✔ Contract query helpers and invalid ID handling verified');
  passedTests++;

  console.log('\n================================================================================');
  console.log(`STAGE 26 VERIFICATION COMPLETE: ${passedTests}/${passedTests} TEST SUITES PASSED`);
  console.log('================================================================================\n');
}

runStage26VerificationSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
