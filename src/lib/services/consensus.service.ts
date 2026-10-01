/**
 * BURRA PARIKSHA CMS - Phase 25 Multi-Model Consensus & AI Quality Judge Service
 * Orchestrates multi-model verification, deterministic reconciliation, and quality provenance.
 */

import crypto from 'crypto';
import {
  CandidateVerificationRequest,
  ConsensusProvenance,
  ConsensusStatus,
  ReconciliationResult,
  VerificationOptions,
  VerificationResponse,
  ConsensusVerdict,
  VerifierResult,
} from '../../types/consensus';
import { QuestionCandidate } from '../ai/types';
import { multiAIProviderRegistry } from '../ai/provider-registry';
import { aiOrchestrator } from '../ai/ai-orchestrator.service';
import { AIProviderId, AIRequest } from '../../types/ai';

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ConsensusService {
  private static instance: ConsensusService | null = null;
  private consensusStore: Map<string, ConsensusProvenance> = new Map();

  public static getInstance(): ConsensusService {
    if (!ConsensusService.instance) {
      ConsensusService.instance = new ConsensusService();
    }
    return ConsensusService.instance;
  }

  /**
   * Computes deterministic SHA-256 canonical hash for a question candidate.
   * Lock verification results to exact candidate state.
   */
  public computeCandidateHash(candidate: QuestionCandidate): string {
    const canonicalPayload = {
      content: (candidate.content || '').trim(),
      option_a: (candidate.option_a || '').trim(),
      option_b: (candidate.option_b || '').trim(),
      option_c: (candidate.option_c || '').trim(),
      option_d: (candidate.option_d || '').trim(),
      correct_answer: candidate.correct_answer,
      explanation: (candidate.explanation || '').trim(),
      difficulty: candidate.difficulty,
      language: candidate.language,
    };

    const serialized = JSON.stringify(canonicalPayload, Object.keys(canonicalPayload).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Validates server-side authorization role for triggering consensus verification.
   */
  private checkAuthorization(userRole?: string): void {
    if (!userRole) return; // Unspecified server-side internal calls allowed default, but role-based explicitly checked below
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'REVIEWER', 'EDITOR'];
    if (!allowedRoles.includes(userRole.toUpperCase())) {
      throw new AuthorizationError(
        `Role '${userRole}' is unauthorized to perform multi-model consensus verification.`
      );
    }
  }

  /**
   * Main multi-model verification pipeline.
   * Sends candidate independently to multiple AI providers, aggregates verifiers,
   * performs deterministic reconciliation, and records consensus provenance.
   */
  public async verifyCandidate(
    request: CandidateVerificationRequest
  ): Promise<VerificationResponse> {
    const { candidate, options } = request;
    const contentId = request.contentId || options?.contentId || 'BP-CNT-UNKNOWN';
    const version = request.version || options?.version || 1;

    // 1. RBAC Enforcer
    if (options?.userRole) {
      this.checkAuthorization(options.userRole);
    }

    // 2. Compute canonical candidate hash
    const candidateHash = this.computeCandidateHash(candidate);

    // 3. Retrieve eligible verification providers from Multi AI Provider Registry
    const minCoverage = options?.minVerifierCoverage ?? 2;
    let eligibleProviders = multiAIProviderRegistry.getEligibleProvidersForTask(
      'VERIFICATION',
      options?.customPriorities as string[]
    );

    // Filter by required providers if specified
    if (options?.requiredProviders && options.requiredProviders.length > 0) {
      const requiredSet = new Set(options.requiredProviders.map((p) => p.toUpperCase()));
      eligibleProviders = eligibleProviders.filter((p) => requiredSet.has(p.providerId.toUpperCase()));
    }

    // 4. Run verification on each independent provider
    const verifierResults: VerifierResult[] = [];
    
    if (eligibleProviders.length === 0) {
      // Zero provider scenario (e.g. ₹0 / no configured providers or all degraded)
      const reconciliation = this.reconcileVerifierResults([], minCoverage);
      const provenance: ConsensusProvenance = {
        consensusId: `BP-CNS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        contentId,
        candidateHash,
        version,
        verifierProviders: [],
        verifierModels: [],
        verifierResults: [],
        reconciliation,
        confidence: 0,
        finalStatus: reconciliation.consensusStatus,
        isStale: false,
        verifiedByRole: options?.userRole,
        timestamp: new Date().toISOString(),
      };

      this.consensusStore.set(provenance.consensusId, provenance);

      return {
        consensus: provenance,
        canonicalCandidate: candidate, // Unchanged
        status: reconciliation.consensusStatus,
        message: 'No active AI verifier providers available. Verification routed to manual REVIEW.',
      };
    }

    // Execute independent verification calls
    const timeoutMs = options?.timeoutPerVerifierMs || 8000;

    for (const providerAdapter of eligibleProviders) {
      const verifierResult = await this.executeSingleVerifier(
        providerAdapter,
        candidate,
        timeoutMs
      );
      verifierResults.push(verifierResult);
    }

    // 5. Deterministic Reconciliation
    const reconciliation = this.reconcileVerifierResults(verifierResults, minCoverage);

    // 6. Assemble Consensus Provenance Record
    const consensusId = `BP-CNS-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const provenance: ConsensusProvenance = {
      consensusId,
      contentId,
      candidateHash,
      version,
      verifierProviders: verifierResults.map((v) => v.provider),
      verifierModels: verifierResults.map((v) => v.model),
      verifierResults,
      reconciliation,
      confidence: reconciliation.overallConfidence,
      finalStatus: reconciliation.consensusStatus,
      isStale: false,
      verifiedByRole: options?.userRole,
      timestamp: new Date().toISOString(),
    };

    this.consensusStore.set(consensusId, provenance);

    let message = `Consensus verification completed with status ${reconciliation.consensusStatus}.`;
    if (reconciliation.consensusStatus === 'VERIFIED') {
      message = `High-risk content successfully VERIFIED by ${reconciliation.successfulVerifiers} independent verifiers (confidence: ${(reconciliation.overallConfidence * 100).toFixed(1)}%).`;
    } else if (reconciliation.consensusStatus === 'FAILED') {
      message = `High-risk content FAILED verification. Critical issues or correctness flaws identified by verifiers.`;
    } else if (reconciliation.consensusStatus === 'REVIEW') {
      message = `Content requires manual human REVIEW. Notes: ${reconciliation.reconciliationNotes}`;
    }

    return {
      consensus: provenance,
      canonicalCandidate: candidate, // IMMUTABLE — generator output untouched
      status: reconciliation.consensusStatus,
      message,
    };
  }

  /**
   * Executes verification query against a single AI Provider Adapter.
   */
  private async executeSingleVerifier(
    providerAdapter: any,
    candidate: QuestionCandidate,
    timeoutMs: number
  ): Promise<VerifierResult> {
    const startTime = Date.now();
    const verifierId = `VRF-${providerAdapter.providerId.toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    const prompt = `You are a strict, pedantic competitive exam quality auditor.
Analyze the following multiple-choice question candidate for mathematical accuracy, logical reasoning, single correct answer uniqueness, language naturalness, and clarity.

QUESTION CANDIDATE:
- Problem: ${candidate.content}
- Option A: ${candidate.option_a}
- Option B: ${candidate.option_b}
- Option C: ${candidate.option_c}
- Option D: ${candidate.option_d}
- Stated Correct Answer: ${candidate.correct_answer}
- Explanation: ${candidate.explanation}
- Language: ${candidate.language}
- Difficulty: ${candidate.difficulty}

Respond ONLY in valid JSON matching this exact structure:
{
  "verdict": "CORRECT" | "INCORRECT" | "AMBIGUOUS" | "UNCERTAIN",
  "confidence": 0.0 to 1.0,
  "correctnessAssessment": true | false,
  "identifiedIssues": ["issue 1", "issue 2"],
  "reasoning": "detailed mathematical/pedagogical evidence",
  "mathIsCorrect": true | false,
  "languageIsNatural": true | false
}`;

    const request: AIRequest = {
      task: 'VERIFICATION',
      prompt,
      systemInstruction: 'You are an objective competitive exam verification authority. Evaluate candidates strictly without bias.',
      temperature: 0.1, // Low temp for maximum deterministic evaluation
      timeoutMs,
    };

    try {
      const response = await providerAdapter.executeTask(request);
      const executionTimeMs = Date.now() - startTime;

      if (response.status !== 'SUCCESS') {
        return {
          verifierId,
          provider: providerAdapter.providerId as AIProviderId,
          model: providerAdapter.getMetadata().defaultModelId,
          verdict: 'UNCERTAIN',
          confidence: 0,
          correctnessAssessment: false,
          identifiedIssues: [`Provider execution error: ${response.error || response.status}`],
          reasoning: `Provider execution status ${response.status}`,
          executionTimeMs,
          timestamp: new Date().toISOString(),
          status: response.status === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'FAILED',
          error: response.error,
        };
      }

      // Parse JSON response safely
      const parsed = this.parseVerifierJsonResponse(response.text);

      return {
        verifierId,
        provider: providerAdapter.providerId as AIProviderId,
        model: response.provenance?.model || providerAdapter.getMetadata().defaultModelId,
        verdict: parsed.verdict,
        confidence: parsed.confidence,
        correctnessAssessment: parsed.correctnessAssessment,
        identifiedIssues: parsed.identifiedIssues,
        reasoning: parsed.reasoning,
        mathematicalVerification: {
          isCorrect: parsed.mathIsCorrect,
        },
        languageVerification: {
          isNaturalTelugu: parsed.languageIsNatural,
        },
        executionTimeMs,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
      };
    } catch (err: any) {
      const executionTimeMs = Date.now() - startTime;
      const errorMsg = err?.message || 'Unknown verification error';
      const isTimeout = errorMsg.toLowerCase().includes('timeout');

      return {
        verifierId,
        provider: providerAdapter.providerId as AIProviderId,
        model: providerAdapter.getMetadata().defaultModelId,
        verdict: 'UNCERTAIN',
        confidence: 0,
        correctnessAssessment: false,
        identifiedIssues: [`Verifier exception: ${errorMsg}`],
        reasoning: `Verification call failed: ${errorMsg}`,
        executionTimeMs,
        timestamp: new Date().toISOString(),
        status: isTimeout ? 'TIMEOUT' : 'FAILED',
        error: errorMsg,
      };
    }
  }

  /**
   * Safely parses JSON output from verifier response with fallback.
   */
  private parseVerifierJsonResponse(rawText: string): {
    verdict: ConsensusVerdict;
    confidence: number;
    correctnessAssessment: boolean;
    identifiedIssues: string[];
    reasoning: string;
    mathIsCorrect?: boolean;
    languageIsNatural?: boolean;
  } {
    try {
      let cleanJson = rawText.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const obj = JSON.parse(cleanJson);
      const verdict = ['CORRECT', 'INCORRECT', 'AMBIGUOUS', 'UNCERTAIN'].includes(obj.verdict?.toUpperCase())
        ? (obj.verdict.toUpperCase() as ConsensusVerdict)
        : 'UNCERTAIN';

      const confidence = typeof obj.confidence === 'number' && obj.confidence >= 0 && obj.confidence <= 1
        ? obj.confidence
        : 0.5;

      const correctnessAssessment = typeof obj.correctnessAssessment === 'boolean'
        ? obj.correctnessAssessment
        : verdict === 'CORRECT';

      const identifiedIssues = Array.isArray(obj.identifiedIssues)
        ? obj.identifiedIssues.map((i: any) => String(i))
        : [];

      return {
        verdict,
        confidence,
        correctnessAssessment,
        identifiedIssues,
        reasoning: obj.reasoning || 'No specific reasoning provided.',
        mathIsCorrect: typeof obj.mathIsCorrect === 'boolean' ? obj.mathIsCorrect : true,
        languageIsNatural: typeof obj.languageIsNatural === 'boolean' ? obj.languageIsNatural : true,
      };
    } catch (_e) {
      // Fallback heuristics if model outputs text
      const upper = rawText.toUpperCase();
      let verdict: ConsensusVerdict = 'UNCERTAIN';
      if (upper.includes('INCORRECT') || upper.includes('WRONG') || upper.includes('ERROR')) {
        verdict = 'INCORRECT';
      } else if (upper.includes('AMBIGUOUS') || upper.includes('CONFUSING')) {
        verdict = 'AMBIGUOUS';
      } else if (upper.includes('CORRECT') || upper.includes('VALID')) {
        verdict = 'CORRECT';
      }

      return {
        verdict,
        confidence: 0.5,
        correctnessAssessment: verdict === 'CORRECT',
        identifiedIssues: ['Response required unstructured text parsing fallback'],
        reasoning: rawText.substring(0, 300),
      };
    }
  }

  /**
   * Deterministic Reconciliation Engine
   * Classifies verifier results into VERIFIED, FAILED, or REVIEW status based on explicit rules.
   */
  public reconcileVerifierResults(
    results: VerifierResult[],
    minVerifierCoverage: number = 2
  ): ReconciliationResult {
    const totalVerifiers = results.length;
    const successful = results.filter((r) => r.status === 'SUCCESS');
    const failedVerifiers = totalVerifiers - successful.length;
    const successfulVerifiersCount = successful.length;

    const verdictBreakdown: Record<ConsensusVerdict, number> = {
      CORRECT: 0,
      INCORRECT: 0,
      AMBIGUOUS: 0,
      UNCERTAIN: 0,
    };

    const criticalIssuesFound: string[] = [];

    successful.forEach((v) => {
      verdictBreakdown[v.verdict] = (verdictBreakdown[v.verdict] || 0) + 1;
      if (v.identifiedIssues && v.identifiedIssues.length > 0) {
        v.identifiedIssues.forEach((issue) => {
          if (v.verdict === 'INCORRECT' || v.confidence >= 0.70) {
            criticalIssuesFound.push(`[${v.provider}] ${issue}`);
          }
        });
      }
    });

    const coverageMet = successfulVerifiersCount >= minVerifierCoverage;
    const unanimous = successfulVerifiersCount > 0 && verdictBreakdown.CORRECT === successfulVerifiersCount;

    // Disagreement detection: both CORRECT and (INCORRECT | AMBIGUOUS | UNCERTAIN) votes present
    const disagreementDetected =
      verdictBreakdown.CORRECT > 0 &&
      (verdictBreakdown.INCORRECT > 0 || verdictBreakdown.AMBIGUOUS > 0 || verdictBreakdown.UNCERTAIN > 0);

    // Determine majority verdict
    let majorityVerdict: ConsensusVerdict | null = null;
    let maxVotes = 0;
    (Object.keys(verdictBreakdown) as ConsensusVerdict[]).forEach((v) => {
      if (verdictBreakdown[v] > maxVotes) {
        maxVotes = verdictBreakdown[v];
        majorityVerdict = v;
      }
    });

    // Agreed correctness
    let agreedCorrectness: boolean | null = null;
    if (verdictBreakdown.CORRECT === successfulVerifiersCount && successfulVerifiersCount > 0) {
      agreedCorrectness = true;
    } else if (verdictBreakdown.INCORRECT > 0 || verdictBreakdown.AMBIGUOUS > 0) {
      agreedCorrectness = false;
    }

    // Confidence Calculation
    const avgConfidence = successfulVerifiersCount > 0
      ? successful.reduce((sum, v) => sum + v.confidence, 0) / successfulVerifiersCount
      : 0;

    const agreementRatio = successfulVerifiersCount > 0 ? maxVotes / successfulVerifiersCount : 0;
    const penalty = criticalIssuesFound.length * 0.15;
    const overallConfidence = Math.max(0, Math.min(1.0, (avgConfidence * agreementRatio) - penalty));

    let consensusStatus: ConsensusStatus = 'REVIEW';
    const notes: string[] = [];

    // Deterministic Classification Rules
    if (!coverageMet) {
      consensusStatus = 'REVIEW';
      notes.push(`Insufficient verifier coverage (${successfulVerifiersCount}/${minVerifierCoverage} required independent verifiers responded).`);
    } else if (verdictBreakdown.INCORRECT > 0 && (verdictBreakdown.INCORRECT >= maxVotes || criticalIssuesFound.length > 0)) {
      // Clear incorrect signal or critical correctness flaws
      consensusStatus = 'FAILED';
      notes.push(`Candidate failed verification: ${verdictBreakdown.INCORRECT} verifiers flagged incorrectness.`);
    } else if (disagreementDetected) {
      // Disagreement signal MUST yield REVIEW
      consensusStatus = 'REVIEW';
      notes.push(`Disagreement detected among AI verifiers (CORRECT: ${verdictBreakdown.CORRECT}, INCORRECT: ${verdictBreakdown.INCORRECT}, AMBIGUOUS: ${verdictBreakdown.AMBIGUOUS}).`);
    } else if (unanimous && overallConfidence >= 0.80) {
      // Unanimous agreement with high confidence
      consensusStatus = 'VERIFIED';
      notes.push(`Unanimous AI verifier agreement on CORRECT with high confidence (${(overallConfidence * 100).toFixed(1)}%).`);
    } else if (unanimous && overallConfidence < 0.80) {
      // Anti-Naive Agreement: Verifiers agree, but confidence is below threshold
      consensusStatus = 'REVIEW';
      notes.push(`Verifiers agree on CORRECT, but overall confidence (${(overallConfidence * 100).toFixed(1)}%) is below 80% threshold.`);
    } else {
      consensusStatus = 'REVIEW';
      notes.push(`Defaulting to manual REVIEW due to ambiguous verifier signals.`);
    }

    return {
      consensusStatus,
      overallConfidence,
      totalVerifiers,
      successfulVerifiers: successfulVerifiersCount,
      failedVerifiers,
      verdictBreakdown,
      agreedCorrectness,
      unanimous,
      majorityVerdict,
      disagreementDetected,
      coverageMet,
      criticalIssuesFound,
      reconciliationNotes: notes.join(' '),
    };
  }

  /**
   * Validates consensus record integrity against current candidate state.
   * Lock verification to exact candidate hash. If mutated, returns isStale: true.
   */
  public validateConsensusIntegrity(
    provenance: ConsensusProvenance,
    currentCandidate: QuestionCandidate
  ): { isStale: boolean; currentHash: string; status: ConsensusStatus; message: string } {
    const currentHash = this.computeCandidateHash(currentCandidate);
    if (currentHash !== provenance.candidateHash) {
      return {
        isStale: true,
        currentHash,
        status: 'REVIEW',
        message: 'Candidate content has been mutated since verification. Verification status invalidated (STALE).',
      };
    }

    return {
      isStale: provenance.isStale,
      currentHash,
      status: provenance.finalStatus,
      message: 'Candidate hash matches verified consensus record.',
    };
  }

  /**
   * Retrieves stored consensus record by ID.
   */
  public getConsensus(consensusId: string): ConsensusProvenance | undefined {
    return this.consensusStore.get(consensusId);
  }

  /**
   * Clears in-memory consensus records (testing helper).
   */
  public clearStore(): void {
    this.consensusStore.clear();
  }
}

export const consensusService = ConsensusService.getInstance();
