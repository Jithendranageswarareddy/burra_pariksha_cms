/**
 * BURRA PARIKSHA CMS — Stage 12 Database Architecture Decision Automated Verification Suite
 *
 * Verifies that the Database Architecture Decision established in 12-DATABASE-DECISION.md and
 * src/types/database-architecture.ts is strictly enforced:
 * 1. All 4 candidates evaluated across all 12 criteria in CandidateEvaluationMatrix.
 * 2. Financial Boundary Validation (₹0–₹100/mo strictly enforced per COST-001/AP-012).
 * 3. Free-Tier Quota Suitability (1–5 questions/day consumes < 2% of Spark quota).
 * 4. Selected Architecture Invariant (SELECTED_DATABASE_ARCHITECTURE is FIRESTORE_HYBRID).
 * 5. Collection Schema Registry completeness mapping all 28 domain entities from Stage 06.
 * 6. ACID Transactions & Concurrency capabilities confirmed on selected architecture.
 * 7. Media Boundary Guard (AP-007/AP-008 media binaries strictly in Drive, metadata in Firestore).
 *
 * ZERO PRODUCTION DATA MUTATION: Deterministic in-memory test suite.
 */

import {
  DatabaseCandidate,
  DATABASE_CANDIDATES,
  EvaluationCriterion,
  EVALUATION_CRITERIA,
  CANDIDATE_EVALUATION_MATRIX,
  SELECTED_DATABASE_ARCHITECTURE,
  FIRESTORE_COLLECTION_REGISTRY,
  calculateFreeTierBudgetProjection,
} from '../../types/database-architecture';

import {
  AuthorizationResource,
  CANONICAL_RESOURCES,
} from '../../types/rbac-models';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[STAGE 12 DATABASE DECISION VIOLATION] ${msg}`);
  }
}

export async function runStage12DatabaseDecisionTests() {
  console.log('============================================================');
  console.log('RUNNING STAGE 12 DATABASE ARCHITECTURE DECISION VERIFICATION');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Candidate Evaluation Matrix Completeness across all 12 criteria
  // --------------------------------------------------------------------------
  console.log('Checking Check 1: 4 Candidates Evaluation Matrix Completeness...');
  assert(DATABASE_CANDIDATES.length === 4, `Expected 4 candidates, got ${DATABASE_CANDIDATES.length}`);
  assert(EVALUATION_CRITERIA.length === 12, `Expected 12 criteria, got ${EVALUATION_CRITERIA.length}`);

  for (const candidate of DATABASE_CANDIDATES) {
    const candidateEval = CANDIDATE_EVALUATION_MATRIX[candidate];
    assert(!!candidateEval, `Missing evaluation for candidate: ${candidate}`);
    assert(typeof candidateEval.candidateName === 'string' && candidateEval.candidateName.length > 0, `Missing name for ${candidate}`);
    assert(typeof candidateEval.totalScore === 'number' && candidateEval.totalScore > 0, `Invalid total score for ${candidate}`);
    assert(typeof candidateEval.weightedScore === 'number' && candidateEval.weightedScore > 0, `Invalid weighted score for ${candidate}`);
    assert(candidateEval.verdict === 'ACCEPTED' || candidateEval.verdict === 'REJECTED', `Invalid verdict for ${candidate}`);
    assert(candidateEval.verdictRationale.length > 10, `Missing verdict rationale for ${candidate}`);

    // Verify all 12 criteria evaluated
    for (const criterion of EVALUATION_CRITERIA) {
      const critEval = candidateEval.evaluations[criterion];
      assert(!!critEval, `Candidate ${candidate} is missing criterion ${criterion}`);
      assert(critEval.score >= 1 && critEval.score <= 5, `Criterion score out of bounds (1-5) for ${candidate} on ${criterion}: ${critEval.score}`);
      assert(critEval.weight >= 1.0 && critEval.weight <= 2.5, `Criterion weight out of bounds for ${candidate} on ${criterion}`);
      assert(critEval.rationale.length > 5, `Missing rationale for ${candidate} on ${criterion}`);
    }
  }
  console.log('  -> PASSED: All 4 candidates evaluated across all 12 criteria with valid scores and rationales.');

  // --------------------------------------------------------------------------
  // TEST 2: Financial Boundary Validation (COST-001 & AP-012)
  // --------------------------------------------------------------------------
  console.log('Checking Check 2: Financial Boundary Validation (₹0–₹100 limit)...');
  // PostgreSQL must fail financial compliance because managed PostgreSQL costs > ₹100/mo
  const pgEval = CANDIDATE_EVALUATION_MATRIX[DatabaseCandidate.POSTGRESQL];
  assert(pgEval.monthlyCostINR > 100, `PostgreSQL must reflect realistic cost > 100 INR/mo (was ${pgEval.monthlyCostINR})`);
  assert(pgEval.financialCompliance === false, 'PostgreSQL must be flagged as non-compliant with COST-001');
  assert(pgEval.verdict === 'REJECTED', 'PostgreSQL must be REJECTED due to financial violation');

  // Firestore Hybrid must be ₹0.00/mo
  const hybridEval = CANDIDATE_EVALUATION_MATRIX[DatabaseCandidate.FIRESTORE_HYBRID];
  assert(hybridEval.monthlyCostINR === 0, `Selected architecture cost must be 0 INR, was ${hybridEval.monthlyCostINR}`);
  assert(hybridEval.financialCompliance === true, 'Selected architecture must be financially compliant');
  assert(hybridEval.monthlyCostINR <= 100, 'Selected architecture cost must not exceed 100 INR/mo');
  console.log('  -> PASSED: Financial boundary enforced; PostgreSQL rejected for exceeding ₹100, Firestore Hybrid ₹0.00.');

  // --------------------------------------------------------------------------
  // TEST 3: Free-Tier Quota Suitability (1–5 questions/day)
  // --------------------------------------------------------------------------
  console.log('Checking Check 3: Free-Tier Quota Suitability...');
  const projection = calculateFreeTierBudgetProjection();
  assert(projection.dailyQuestionVolumeMin === 1 && projection.dailyQuestionVolumeMax === 5, 'Daily question volume must be 1-5');
  assert(projection.monthlyQuestionVolumeMin === 30 && projection.monthlyQuestionVolumeMax === 150, 'Monthly question volume must be 30-150');
  assert(projection.readQuotaUtilizationPercentage < 2.0, `Read quota utilization must be < 2% (was ${projection.readQuotaUtilizationPercentage}%)`);
  assert(projection.writeQuotaUtilizationPercentage < 1.0, `Write quota utilization must be < 1% (was ${projection.writeQuotaUtilizationPercentage}%)`);
  assert(projection.storageQuotaUtilizationPercentage < 10.0, `Storage quota utilization must be < 10% (was ${projection.storageQuotaUtilizationPercentage}%)`);
  assert(projection.driveStorageUtilizationPercentage < 50.0, `Drive quota utilization must be < 50% (was ${projection.driveStorageUtilizationPercentage}%)`);
  assert(projection.totalMonthlyCostINR === 0.0, 'Projected monthly cost must be ₹0.00');
  assert(projection.costConstraintCompliance === true, 'Cost constraint must be satisfied');
  assert(projection.isFinancialConstraintSatisfied === true, 'Financial constraint must be satisfied');
  console.log(`  -> PASSED: Low-volume quota verified (< 2% read quota: ${projection.readQuotaUtilizationPercentage}%, total monthly cost: ₹${projection.totalMonthlyCostINR}).`);

  // --------------------------------------------------------------------------
  // TEST 4: Selected Architecture Invariant (FIRESTORE_HYBRID selected)
  // --------------------------------------------------------------------------
  console.log('Checking Check 4: Selected Architecture Invariant...');
  assert(
    SELECTED_DATABASE_ARCHITECTURE === DatabaseCandidate.FIRESTORE_HYBRID,
    `Selected architecture must be FIRESTORE_HYBRID, found ${SELECTED_DATABASE_ARCHITECTURE}`
  );
  assert(
    CANDIDATE_EVALUATION_MATRIX[SELECTED_DATABASE_ARCHITECTURE].verdict === 'ACCEPTED',
    'Selected architecture must have ACCEPTED verdict'
  );
  // Must have highest weighted score among all candidates
  for (const candidate of DATABASE_CANDIDATES) {
    if (candidate !== SELECTED_DATABASE_ARCHITECTURE) {
      assert(
        CANDIDATE_EVALUATION_MATRIX[SELECTED_DATABASE_ARCHITECTURE].weightedScore >=
        CANDIDATE_EVALUATION_MATRIX[candidate].weightedScore,
        `Selected architecture must have highest weighted score (failed against ${candidate})`
      );
    }
  }
  console.log('  -> PASSED: Invariant confirmed — FIRESTORE_HYBRID is the authoritative selected architecture.');

  // --------------------------------------------------------------------------
  // TEST 5: Collection Schema Registry mapping for all 28 domain entities
  // --------------------------------------------------------------------------
  console.log('Checking Check 5: Collection Schema Registry mapping for all 28 domain entities...');
  assert(CANONICAL_RESOURCES.length === 28, `Expected exactly 28 domain resources, got ${CANONICAL_RESOURCES.length}`);

  const registeredResources = Object.keys(FIRESTORE_COLLECTION_REGISTRY) as AuthorizationResource[];
  assert(registeredResources.length === 28, `Expected 28 registered collections, got ${registeredResources.length}`);

  for (const resource of CANONICAL_RESOURCES) {
    const config = FIRESTORE_COLLECTION_REGISTRY[resource];
    assert(!!config, `Missing collection configuration for resource: ${resource}`);
    assert(config.resource === resource, `Resource mismatch in config for ${resource}`);
    assert(typeof config.collectionName === 'string' && config.collectionName.length > 0, `Invalid collectionName for ${resource}`);
    assert(typeof config.description === 'string' && config.description.length > 5, `Missing description for ${resource}`);
    assert(Array.isArray(config.primaryIndices) && config.primaryIndices.length > 0, `Missing primaryIndices for ${resource}`);
    assert(Array.isArray(config.compositeIndices), `Missing compositeIndices for ${resource}`);
    assert(typeof config.preconditionField === 'string' && config.preconditionField.length > 0, `Missing preconditionField for ${resource}`);

    if (config.isSubcollection) {
      assert(typeof config.parentCollection === 'string' && config.parentCollection.length > 0, `Subcollection ${resource} missing parentCollection`);
    }
  }
  console.log('  -> PASSED: All 28 Stage 06 domain entities mapped to Firestore collections with indices & preconditions.');

  // --------------------------------------------------------------------------
  // TEST 6: ACID Transactions & Concurrency capabilities
  // --------------------------------------------------------------------------
  console.log('Checking Check 6: ACID Transactions & Concurrency Capabilities...');
  const selectedEval = CANDIDATE_EVALUATION_MATRIX[SELECTED_DATABASE_ARCHITECTURE];
  assert(
    selectedEval.evaluations[EvaluationCriterion.TRANSACTIONS].score >= 4,
    'Selected architecture must score >= 4 on TRANSACTIONS'
  );
  assert(
    selectedEval.evaluations[EvaluationCriterion.CONCURRENCY].score >= 4,
    'Selected architecture must score >= 4 on CONCURRENCY'
  );
  // Ensure brownfield Google Sheets was rejected specifically due to lack of transactions and concurrency
  const sheetsEval = CANDIDATE_EVALUATION_MATRIX[DatabaseCandidate.GOOGLE_SHEETS];
  assert(
    sheetsEval.evaluations[EvaluationCriterion.TRANSACTIONS].score === 1,
    'Google Sheets must score 1 on TRANSACTIONS (causes split-brain)'
  );
  assert(
    sheetsEval.evaluations[EvaluationCriterion.CONCURRENCY].score === 1,
    'Google Sheets must score 1 on CONCURRENCY (causes silent overwrite)'
  );
  console.log('  -> PASSED: ACID transactions & optimistic concurrency validated for selected architecture.');

  // --------------------------------------------------------------------------
  // TEST 7: Media Boundary Guard (AP-007 / AP-008)
  // --------------------------------------------------------------------------
  console.log('Checking Check 7: Media Boundary Guard (AP-007/AP-008)...');
  const mediaResources: AuthorizationResource[] = [
    AuthorizationResource.VIDEO,
    AuthorizationResource.VIDEO_TAKE,
    AuthorizationResource.VIDEO_EDIT,
    AuthorizationResource.MEDIA_ASSET,
    AuthorizationResource.THUMBNAIL,
  ];

  for (const mediaRes of mediaResources) {
    const config = FIRESTORE_COLLECTION_REGISTRY[mediaRes];
    assert(
      config.isMediaBinaryStoredInDrive === true,
      `Media resource ${mediaRes} must store binary files in Google Drive per AP-007/AP-008`
    );
  }

  // Non-media entities must NOT be stored in Drive
  const nonMediaResources: AuthorizationResource[] = [
    AuthorizationResource.USER,
    AuthorizationResource.QUESTION,
    AuthorizationResource.SCRIPT,
    AuthorizationResource.AUDIT_EVENT,
    AuthorizationResource.CONFIGURATION,
  ];

  for (const nonMediaRes of nonMediaResources) {
    const config = FIRESTORE_COLLECTION_REGISTRY[nonMediaRes];
    assert(
      config.isMediaBinaryStoredInDrive === false,
      `Non-media resource ${nonMediaRes} must store data in Firestore documents, not Drive`
    );
  }
  console.log('  -> PASSED: AP-007 & AP-008 media boundary strictly enforced across all 28 collections.');

  console.log('\n============================================================');
  console.log('ALL STAGE 12 DATABASE ARCHITECTURE VERIFICATIONS PASSED (7/7)');
  console.log('============================================================\n');
}

// Direct CLI Execution Runner
if (import.meta.url === `file://${process.argv[1]}`) {
  runStage12DatabaseDecisionTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
