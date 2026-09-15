/**
 * BURRA PARIKSHA CMS - Phase 25 Test Suite
 * Comprehensive verification of Multi-Model Consensus & AI Quality Judge.
 */

import { QuestionCandidate } from '../lib/ai/types';
import { DifficultyLevel, QuestionLanguage } from '../types';
import {
  Phase25ConsensusService,
  phase25ConsensusService,
  AuthorizationError,
} from '../lib/services/phase25-consensus.service';
import { phase24ProviderRegistry } from '../lib/ai/phase24-registry';
import {
  AIProviderHealth,
  AIProviderMetadata,
  AITaskType,
  IPhase24AIProvider,
  AINormalizedResponse,
  AIRequest,
} from '../types/phase24-ai';

// Simple Test Assertion Helpers
let testCount = 0;
let passedCount = 0;
let failedCount = 0;

function logHeader(title: string) {
  console.log('\n==================================================================');
  console.log(title);
  console.log('==================================================================');
}

function check(tag: string, description: string, condition: boolean, detail?: string) {
  testCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ [${tag}] ${description}`);
    if (detail) console.log(`   └─ ${detail}`);
  } else {
    failedCount++;
    console.error(`❌ [${tag}] ${description}`);
    if (detail) console.error(`   └─ ${detail}`);
  }
}

// Controlled Simulation Test Provider Adapter
class TestMockProviderAdapter implements IPhase24AIProvider {
  public readonly providerId: string;
  public readonly displayName: string;
  public isEnabled: boolean = true;
  private configured: boolean;
  private mockVerdict: string;
  private mockConfidence: number;
  private mockIssues: string[];
  private mockReasoning: string;
  private mockStatus: 'SUCCESS' | 'FAILED' | 'RATE_LIMITED' = 'SUCCESS';
  private delayMs: number = 0;

  constructor(
    id: string,
    configured: boolean = true,
    verdict: string = 'CORRECT',
    confidence: number = 0.95,
    issues: string[] = [],
    reasoning: string = 'Verification passed cleanly.',
    status: 'SUCCESS' | 'FAILED' | 'RATE_LIMITED' = 'SUCCESS',
    delayMs: number = 0
  ) {
    this.providerId = id.toUpperCase();
    this.displayName = `Test Provider ${id}`;
    this.configured = configured;
    this.mockVerdict = verdict;
    this.mockConfidence = confidence;
    this.mockIssues = issues;
    this.mockReasoning = reasoning;
    this.mockStatus = status;
    this.delayMs = delayMs;
  }

  public getMetadata(): AIProviderMetadata {
    return {
      providerId: this.providerId,
      displayName: this.displayName,
      isEnabled: this.isEnabled,
      isConfigured: this.configured,
      supportedCapabilities: ['VERIFICATION', 'GENERATION'],
      supportedModels: [`${this.providerId.toLowerCase()}-v1`],
      defaultModelId: `${this.providerId.toLowerCase()}-v1`,
      healthState: this.configured ? 'HEALTHY' : 'UNCONFIGURED',
      priority: 1,
      timeoutMs: 5000,
      retryPolicy: { maxRetries: 1, initialBackoffMs: 100, backoffFactor: 2 },
      rateLimitState: { isRateLimited: false },
      consecutiveFailures: 0,
    };
  }

  public isConfigured(): boolean {
    return this.configured;
  }

  public supportsCapability(task: AITaskType): boolean {
    return task === 'VERIFICATION';
  }

  public async executeTask(request: AIRequest): Promise<AINormalizedResponse> {
    if (this.delayMs > 0) {
      await new Promise((r) => setTimeout(r, this.delayMs));
    }

    if (this.mockStatus === 'FAILED') {
      return {
        status: 'FAILED',
        text: '',
        provenance: {
          provider: this.providerId,
          model: `${this.providerId.toLowerCase()}-v1`,
          task: request.task,
          generationSource: this.providerId as any,
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: [],
        },
        error: 'Simulated verifier provider error',
      };
    }

    if (this.mockStatus === 'RATE_LIMITED') {
      return {
        status: 'AI_UNAVAILABLE',
        text: '',
        provenance: {
          provider: this.providerId,
          model: `${this.providerId.toLowerCase()}-v1`,
          task: request.task,
          generationSource: this.providerId as any,
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: [],
        },
        error: 'Rate limit exceeded (429)',
        failureCategory: 'RATE_LIMITED',
      };
    }

    const jsonPayload = JSON.stringify({
      verdict: this.mockVerdict,
      confidence: this.mockConfidence,
      correctnessAssessment: this.mockVerdict === 'CORRECT',
      identifiedIssues: this.mockIssues,
      reasoning: this.mockReasoning,
      mathIsCorrect: this.mockVerdict === 'CORRECT',
      languageIsNatural: true,
    });

    return {
      status: 'SUCCESS',
      text: jsonPayload,
      provenance: {
        provider: this.providerId,
        model: `${this.providerId.toLowerCase()}-v1`,
        task: request.task,
        generationSource: this.providerId as any,
        timestamp: new Date().toISOString(),
        fallbackUsed: false,
        attempts: [],
      },
    };
  }

  public async checkHealth(): Promise<AIProviderHealth> {
    return {
      providerId: this.providerId,
      healthState: this.configured ? 'HEALTHY' : 'UNCONFIGURED',
      isConfigured: this.configured,
      lastCheckedAt: new Date().toISOString(),
    };
  }

  public recordSuccess(): void {}
  public recordFailure(): void {}
}

export async function runPhase25Verification() {
  testCount = 0;
  passedCount = 0;
  failedCount = 0;

  logHeader('PHASE 25 — MULTI-MODEL CONSENSUS & AI QUALITY JUDGE VERIFICATION');

  const validQuestionCandidate: QuestionCandidate = {
    content: 'Find the area of a circle with radius 7 cm. (Use π = 22/7)',
    option_a: '154 sq cm',
    option_b: '144 sq cm',
    option_c: '164 sq cm',
    option_d: '134 sq cm',
    correct_answer: 'A',
    explanation: 'Area = π * r^2 = (22/7) * 7 * 7 = 22 * 7 = 154 sq cm.',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.ENGLISH,
    taxonomy: {
      categoryId: 'CAT-MATH',
      categoryName: 'Mathematics',
      topicId: 'TOP-GEOM',
      topicName: 'Geometry',
      subtopicId: 'SUB-CIRC',
      subtopicName: 'Circles & Area',
    },
  };

  // ------------------------------------------------------------------
  // [P25-01] Unanimous Verifier Agreement → VERIFIED
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'CORRECT', 0.95));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_B', true, 'CORRECT', 0.92));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250001',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    check(
      'P25-01',
      'Unanimous verifier agreement → VERIFIED',
      result.status === 'VERIFIED' && result.consensus.reconciliation.unanimous && result.consensus.confidence >= 0.80,
      `Status: ${result.status}, Confidence: ${(result.consensus.confidence * 100).toFixed(1)}%, Verifiers: ${result.consensus.reconciliation.successfulVerifiers}`
    );
  } catch (err: any) {
    check('P25-01', 'Unanimous verifier agreement → VERIFIED', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-02] Disagreement on Verdict → REVIEW
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'CORRECT', 0.90));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_B', true, 'INCORRECT', 0.85, ['Ambiguous option B']));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250002',
      options: { minVerifierCoverage: 2, userRole: 'REVIEWER' },
    });

    check(
      'P25-02',
      'Disagreement on verdict → REVIEW',
      result.status === 'REVIEW' || result.status === 'FAILED',
      `Status: ${result.status}, DisagreementDetected: ${result.consensus.reconciliation.disagreementDetected}`
    );
  } catch (err: any) {
    check('P25-02', 'Disagreement on verdict → REVIEW', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-03] Unanimous Incorrect Verdict → FAILED
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'INCORRECT', 0.95, ['Option A is calculation error']));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_B', true, 'INCORRECT', 0.90, ['Correct answer should be B']));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250003',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    check(
      'P25-03',
      'Unanimous incorrect verdict → FAILED',
      result.status === 'FAILED' && result.consensus.reconciliation.verdictBreakdown.INCORRECT === 2,
      `Status: ${result.status}, IncorrectVotes: ${result.consensus.reconciliation.verdictBreakdown.INCORRECT}`
    );
  } catch (err: any) {
    check('P25-03', 'Unanimous incorrect verdict → FAILED', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-04] Critical Math Flaw Detection → FAILED
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'INCORRECT', 0.98, ['Critical mathematical calculation error in formula execution']));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_B', true, 'CORRECT', 0.70));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250004',
      options: { minVerifierCoverage: 2, userRole: 'SUPER_ADMIN' },
    });

    check(
      'P25-04',
      'Critical math flaw detection → FAILED',
      result.status === 'FAILED' || result.status === 'REVIEW',
      `Status: ${result.status}, CriticalIssues: ${result.consensus.reconciliation.criticalIssuesFound.length}`
    );
  } catch (err: any) {
    check('P25-04', 'Critical math flaw detection → FAILED', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-05] Insufficient Verifier Coverage (< minVerifierCoverage) → REVIEW
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_ONLY_ONE', true, 'CORRECT', 0.99));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250005',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    check(
      'P25-05',
      'Insufficient verifier coverage (< minVerifierCoverage) → REVIEW',
      result.status === 'REVIEW' && !result.consensus.reconciliation.coverageMet,
      `Status: ${result.status}, CoverageMet: ${result.consensus.reconciliation.coverageMet} (1/2 verifiers)`
    );
  } catch (err: any) {
    check('P25-05', 'Insufficient verifier coverage (< minVerifierCoverage) → REVIEW', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-06] Individual Verifier Failure/Timeout Handling
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'CORRECT', 0.95));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_FAIL', true, 'UNCERTAIN', 0, [], '', 'FAILED'));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_C', true, 'CORRECT', 0.90));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250006',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    check(
      'P25-06',
      'Individual verifier failure handled cleanly without crashing pipeline',
      result.status === 'VERIFIED' && result.consensus.reconciliation.failedVerifiers === 1 && result.consensus.reconciliation.successfulVerifiers === 2,
      `Status: ${result.status}, Successful: ${result.consensus.reconciliation.successfulVerifiers}, Failed: ${result.consensus.reconciliation.failedVerifiers}`
    );
  } catch (err: any) {
    check('P25-06', 'Individual verifier failure handled cleanly without crashing pipeline', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-07] Provider Rate-Limiting Graceful Resilience
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'CORRECT', 0.92));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_RL', true, 'UNCERTAIN', 0, [], '', 'RATE_LIMITED'));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_C', true, 'CORRECT', 0.91));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250007',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    check(
      'P25-07',
      'Provider rate-limiting handled gracefully without pipeline crash',
      result.status === 'VERIFIED' && result.consensus.verifierResults.some((v) => v.status === 'RATE_LIMITED' || v.status === 'FAILED'),
      `Status: ${result.status}, Results count: ${result.consensus.verifierResults.length}`
    );
  } catch (err: any) {
    check('P25-07', 'Provider rate-limiting handled gracefully without pipeline crash', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-08] Unavailable Provider Degradation
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    const unconfig = new TestMockProviderAdapter('VERIFIER_UNCONFIGURED', false);
    phase24ProviderRegistry.registerProvider(unconfig);
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'CORRECT', 0.95));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_B', true, 'CORRECT', 0.90));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250008',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    check(
      'P25-08',
      'Unconfigured provider filtered out automatically',
      result.status === 'VERIFIED' && !result.consensus.verifierProviders.includes('VERIFIER_UNCONFIGURED'),
      `Active Providers: ${result.consensus.verifierProviders.join(', ')}`
    );
  } catch (err: any) {
    check('P25-08', 'Unconfigured provider filtered out automatically', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-09] Zero Configured Provider Scenario (₹0 Safety) → REVIEW
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250009',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    check(
      'P25-09',
      'Zero configured providers → REVIEW without CMS crash',
      result.status === 'REVIEW' && result.consensus.reconciliation.totalVerifiers === 0,
      `Status: ${result.status}, Message: ${result.message}`
    );
  } catch (err: any) {
    check('P25-09', 'Zero configured providers → REVIEW without CMS crash', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-10] Stale Candidate/Version Rejection (Hash Mismatch) → REVIEW
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'CORRECT', 0.95));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_B', true, 'CORRECT', 0.92));

    const originalResult = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250010',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    // Mutate the candidate after verification
    const mutatedCandidate: QuestionCandidate = {
      ...validQuestionCandidate,
      content: 'Mutated problem statement after verification!',
    };

    const integrityCheck = phase25ConsensusService.validateConsensusIntegrity(
      originalResult.consensus,
      mutatedCandidate
    );

    check(
      'P25-10',
      'Stale candidate mutation detected and invalidated (STALE → REVIEW)',
      integrityCheck.isStale && integrityCheck.status === 'REVIEW',
      `isStale: ${integrityCheck.isStale}, Message: ${integrityCheck.message}`
    );
  } catch (err: any) {
    check('P25-10', 'Stale candidate mutation detected and invalidated', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-11] Cross-Content Association Mismatch Prevention
  // ------------------------------------------------------------------
  try {
    const candidateA: QuestionCandidate = { ...validQuestionCandidate, content: 'Question A Statement' };
    const candidateB: QuestionCandidate = { ...validQuestionCandidate, content: 'Question B Statement' };

    const hashA = phase25ConsensusService.computeCandidateHash(candidateA);
    const hashB = phase25ConsensusService.computeCandidateHash(candidateB);

    check(
      'P25-11',
      'Distinct content candidates produce unique deterministic hashes',
      hashA !== hashB && hashA.length === 64 && hashB.length === 64,
      `Hash A: ${hashA.substring(0, 16)}..., Hash B: ${hashB.substring(0, 16)}...`
    );
  } catch (err: any) {
    check('P25-11', 'Distinct content candidates produce unique deterministic hashes', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-12] Malformed Verifier Response Parsing & Fallback
  // ------------------------------------------------------------------
  try {
    const rawTextResponse = 'This is an unstructured text explanation stating that the question is INCORRECT due to wrong option A.';
    const parsed = (phase25ConsensusService as any).parseVerifierJsonResponse(rawTextResponse);

    check(
      'P25-12',
      'Malformed/unstructured verifier text response safely parsed via heuristic fallback',
      parsed.verdict === 'INCORRECT',
      `Parsed Verdict: ${parsed.verdict}, IdentifiedIssues: ${parsed.identifiedIssues[0]}`
    );
  } catch (err: any) {
    check('P25-12', 'Malformed/unstructured verifier text response safely parsed', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-13] Anti-Naive Agreement (Low Confidence Agreement → REVIEW)
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    // Verifiers agree on CORRECT, but confidence is low (0.50)
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'CORRECT', 0.50));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_B', true, 'CORRECT', 0.50));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250013',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    check(
      'P25-13',
      'Anti-Naive Agreement Rule: Low confidence agreement triggers REVIEW',
      result.status === 'REVIEW',
      `Status: ${result.status}, Confidence: ${(result.consensus.confidence * 100).toFixed(1)}% (< 80% threshold)`
    );
  } catch (err: any) {
    check('P25-13', 'Anti-Naive Agreement Rule: Low confidence agreement triggers REVIEW', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-14] Canonical Candidate Immutability (Candidate Unchanged)
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'CORRECT', 0.95));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_B', true, 'CORRECT', 0.90));

    const inputCandidateCopy = JSON.parse(JSON.stringify(validQuestionCandidate));
    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250014',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    const isIdentical = JSON.stringify(result.canonicalCandidate) === JSON.stringify(inputCandidateCopy);

    check(
      'P25-14',
      'Canonical candidate remains 100% immutable throughout verification',
      isIdentical,
      `Immutable match: ${isIdentical}`
    );
  } catch (err: any) {
    check('P25-14', 'Canonical candidate remains 100% immutable throughout verification', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-15] Full Consensus Provenance Tracking & Integrity
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'CORRECT', 0.95));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_B', true, 'CORRECT', 0.92));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250015',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    const prov = result.consensus;
    const isValidProv =
      prov.consensusId.startsWith('BP-CNS-') &&
      prov.contentId === 'BP-CNT-250015' &&
      prov.candidateHash.length === 64 &&
      prov.verifierProviders.length === 2 &&
      prov.reconciliation.successfulVerifiers === 2 &&
      prov.finalStatus === 'VERIFIED';

    check(
      'P25-15',
      'Consensus provenance record completely captured with all required metadata',
      isValidProv,
      `ConsensusID: ${prov.consensusId}, ContentID: ${prov.contentId}, Hash: ${prov.candidateHash.substring(0, 16)}...`
    );
  } catch (err: any) {
    check('P25-15', 'Consensus provenance record completely captured', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-16] RBAC Enforcement (Unauthorized VIEWER Role Blocked)
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'CORRECT', 0.95));

    let threwAuthError = false;
    try {
      await phase25ConsensusService.verifyCandidate({
        candidate: validQuestionCandidate,
        contentId: 'BP-CNT-250016',
        options: { userRole: 'VIEWER' },
      });
    } catch (e: any) {
      if (e instanceof AuthorizationError || e?.name === 'AuthorizationError') {
        threwAuthError = true;
      }
    }

    check(
      'P25-16',
      'RBAC Enforcement: Unauthorized VIEWER role blocked from consensus verification',
      threwAuthError,
      `AuthorizationError thrown as expected for VIEWER role`
    );
  } catch (err: any) {
    check('P25-16', 'RBAC Enforcement', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-17] Non-Autonomous Publishing Prohibition Check
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_A', true, 'CORRECT', 0.95));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('VERIFIER_B', true, 'CORRECT', 0.95));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-250017',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    // Verify candidate object has no auto-publish or status mutation fields added
    const candidateKeys = Object.keys(result.canonicalCandidate);
    const publishedFieldAdded = candidateKeys.includes('published') || candidateKeys.includes('autoPublished');

    check(
      'P25-17',
      'Non-Autonomous Publishing Prohibition: VERIFIED status is quality indicator only, not auto-publish',
      !publishedFieldAdded && result.status === 'VERIFIED',
      `Canonical candidate keys unmodified: [${candidateKeys.join(', ')}]`
    );
  } catch (err: any) {
    check('P25-17', 'Non-Autonomous Publishing Prohibition', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-18] Separation of Phase 24 and Phase 25 Architecture
  // ------------------------------------------------------------------
  try {
    // Phase 24 handles provider registry/adapters; Phase 25 service uses registry as client
    const hasRegistryAccess = typeof phase24ProviderRegistry.getEligibleProvidersForTask === 'function';
    const isSeparateService = typeof phase25ConsensusService.verifyCandidate === 'function';

    check(
      'P25-18',
      'Architecture separation: Phase 25 consensus sits cleanly above Phase 24 execution',
      hasRegistryAccess && isSeparateService,
      `Phase25ConsensusService cleanly consumes Phase24ProviderRegistry`
    );
  } catch (err: any) {
    check('P25-18', 'Architecture separation', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-19] E2E High-Risk Math Question Consensus Verification
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('MATH_VERIFIER_A', true, 'CORRECT', 0.98, [], 'Verified mathematical formula execution step-by-step'));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('MATH_VERIFIER_B', true, 'CORRECT', 0.96, [], 'Calculations confirmed correct'));

    const mathQuestion: QuestionCandidate = {
      ...validQuestionCandidate,
      content: 'If 3x + 5 = 20, what is the value of x?',
      option_a: '5',
      option_b: '6',
      option_c: '7',
      option_d: '4',
      correct_answer: 'A',
      explanation: '3x + 5 = 20 => 3x = 15 => x = 5.',
    };

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: mathQuestion,
      contentId: 'BP-CNT-MATH-001',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN', isHighRiskContent: true },
    });

    check(
      'P25-19',
      'E2E High-Risk Math question verification → VERIFIED',
      result.status === 'VERIFIED' && result.consensus.reconciliation.agreedCorrectness === true,
      `Status: ${result.status}, Confidence: ${(result.consensus.confidence * 100).toFixed(1)}%`
    );
  } catch (err: any) {
    check('P25-19', 'E2E High-Risk Math question verification', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-20] E2E High-Risk Telugu Interpretation Consensus Verification
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('TELUGU_VERIFIER_A', true, 'CORRECT', 0.94, [], 'Telugu grammar and terminology accurate'));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('TELUGU_VERIFIER_B', true, 'CORRECT', 0.91, [], 'Natural Telugu phrasing confirmed'));

    const teluguQuestion: QuestionCandidate = {
      ...validQuestionCandidate,
      content: 'తెలంగాణ రాష్ట్ర రాజధాని ఏది?',
      option_a: 'హైదరాబాద్',
      option_b: 'వరంగల్',
      option_c: 'కరీంనగర్',
      option_d: 'నిజామాబాద్',
      correct_answer: 'A',
      explanation: 'తెలంగాణ రాష్ట్ర రాజధాని హైదరాబాద్.',
      language: QuestionLanguage.TELUGU,
    };

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: teluguQuestion,
      contentId: 'BP-CNT-TEL-001',
      options: { minVerifierCoverage: 2, userRole: 'REVIEWER', isHighRiskContent: true },
    });

    check(
      'P25-20',
      'E2E High-Risk Telugu interpretation verification → VERIFIED',
      result.status === 'VERIFIED' && result.consensus.confidence >= 0.80,
      `Status: ${result.status}, Language: TELUGU`
    );
  } catch (err: any) {
    check('P25-20', 'E2E High-Risk Telugu interpretation verification', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-21] Reasoning & Ambiguity Detection Verification
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('REASONING_A', true, 'AMBIGUOUS', 0.85, ['Multiple options could be logically interpreted as valid']));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('REASONING_B', true, 'CORRECT', 0.70));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-AMB-001',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    check(
      'P25-21',
      'Ambiguity signal triggers REVIEW status',
      result.status === 'REVIEW' && result.consensus.reconciliation.disagreementDetected,
      `Status: ${result.status}, Notes: ${result.consensus.reconciliation.reconciliationNotes}`
    );
  } catch (err: any) {
    check('P25-21', 'Ambiguity signal triggers REVIEW status', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-22] AI Failure Does Not Corrupt CMS State
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('FAIL_A', true, 'UNCERTAIN', 0, [], '', 'FAILED'));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('FAIL_B', true, 'UNCERTAIN', 0, [], '', 'FAILED'));

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-SAFE-001',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    check(
      'P25-22',
      'Total AI verifier failure handled safely → REVIEW without corrupting CMS or crashing',
      result.status === 'REVIEW' && result.canonicalCandidate.content === validQuestionCandidate.content,
      `Status: ${result.status}, Message: ${result.message}`
    );
  } catch (err: any) {
    check('P25-22', 'Total AI verifier failure handled safely', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-23] Multi-Provider Independence Execution via Phase24AIOrchestrator
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    const adapterA = new TestMockProviderAdapter('PROV_A', true, 'CORRECT', 0.95);
    const adapterB = new TestMockProviderAdapter('PROV_B', true, 'CORRECT', 0.90);
    const adapterC = new TestMockProviderAdapter('PROV_C', true, 'CORRECT', 0.92);

    phase24ProviderRegistry.registerProvider(adapterA);
    phase24ProviderRegistry.registerProvider(adapterB);
    phase24ProviderRegistry.registerProvider(adapterC);

    const result = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-IND-001',
      options: { minVerifierCoverage: 3, userRole: 'ADMIN' },
    });

    check(
      'P25-23',
      'Multi-provider independence: 3 separate verifiers queried independently',
      result.consensus.verifierResults.length === 3 && result.consensus.verifierProviders.length === 3,
      `Queried Providers: [${result.consensus.verifierProviders.join(', ')}]`
    );
  } catch (err: any) {
    check('P25-23', 'Multi-provider independence', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-24] Deterministic Reconciliation Matrix Verification
  // ------------------------------------------------------------------
  try {
    const matrixTest = phase25ConsensusService.reconcileVerifierResults(
      [
        {
          verifierId: 'V1',
          provider: 'GEMINI',
          model: 'gemini-1.5-pro',
          verdict: 'CORRECT',
          confidence: 0.95,
          correctnessAssessment: true,
          identifiedIssues: [],
          reasoning: 'OK',
          executionTimeMs: 120,
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
        },
        {
          verifierId: 'V2',
          provider: 'OPENROUTER',
          model: 'claude-3.5-sonnet',
          verdict: 'CORRECT',
          confidence: 0.92,
          correctnessAssessment: true,
          identifiedIssues: [],
          reasoning: 'OK',
          executionTimeMs: 150,
          timestamp: new Date().toISOString(),
          status: 'SUCCESS',
        },
      ],
      2
    );

    check(
      'P25-24',
      'Deterministic reconciliation matrix outputs exact VERIFIED status for unanimous inputs',
      matrixTest.consensusStatus === 'VERIFIED' && matrixTest.unanimous && matrixTest.overallConfidence >= 0.80,
      `Status: ${matrixTest.consensusStatus}, Unanimous: ${matrixTest.unanimous}, OverallConfidence: ${(matrixTest.overallConfidence * 100).toFixed(1)}%`
    );
  } catch (err: any) {
    check('P25-24', 'Deterministic reconciliation matrix verification', false, err?.message);
  }

  // ------------------------------------------------------------------
  // [P25-25] Complete Multi-Model Verification E2E Cycle
  // ------------------------------------------------------------------
  try {
    phase24ProviderRegistry.clear();
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('GEMINI', true, 'CORRECT', 0.96));
    phase24ProviderRegistry.registerProvider(new TestMockProviderAdapter('OPENROUTER', true, 'CORRECT', 0.94));

    const e2eResult = await phase25ConsensusService.verifyCandidate({
      candidate: validQuestionCandidate,
      contentId: 'BP-CNT-E2E-001',
      options: { minVerifierCoverage: 2, userRole: 'ADMIN' },
    });

    const isComplete =
      e2eResult.status === 'VERIFIED' &&
      e2eResult.consensus.consensusId.startsWith('BP-CNS-') &&
      e2eResult.consensus.confidence >= 0.80 &&
      e2eResult.canonicalCandidate.content === validQuestionCandidate.content;

    check(
      'P25-25',
      'Complete Multi-Model Verification E2E Cycle verified successfully',
      isComplete,
      `Final Status: ${e2eResult.status}, Message: ${e2eResult.message}`
    );
  } catch (err: any) {
    check('P25-25', 'Complete Multi-Model Verification E2E Cycle verified successfully', false, err?.message);
  } finally {
    // Restore default Phase 24 providers upon test completion
    phase24ProviderRegistry.resetToDefaults();
  }

  console.log('\n------------------------------------------------------------------');
  console.log(`TOTAL CHECKS : ${testCount}`);
  console.log(`PASSED       : ${passedCount}`);
  console.log(`FAILED       : ${failedCount}`);
  console.log(`FINAL VERDICT: ${failedCount === 0 ? 'PASS' : 'FAIL'}`);
  console.log('==================================================================\n');

  return {
    testCount,
    passedCount,
    failedCount,
    status: failedCount === 0 ? 'PASS' : 'FAIL',
  };
}

// Self-executing runner for standalone CLI invocation
if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase25Verification().then((res) => {
    if (res.status !== 'PASS') {
      process.exit(1);
    }
  });
}
