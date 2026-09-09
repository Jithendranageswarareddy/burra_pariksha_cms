/**
 * BURRA PARIKSHA CMS - Task 6D Verification Suite
 * Phase 6: Multi-Model Validation Adapters & Consensus Integration
 *
 * Verifies:
 * 1. Gemini adapter implements QuestionValidatorProvider.
 * 2. Provider returns valid ValidationEvidence structure.
 * 3. VALID verdict works.
 * 4. INVALID verdict works.
 * 5. NEEDS_REVIEW verdict works.
 * 6. Provider exception is isolated.
 * 7. ConsensusEngine can consume the adapter.
 * 8. Mock provider works.
 * 9. Multiple mock providers can be evaluated.
 * 10. Conflicting VALID/INVALID providers produce NEEDS_REVIEW.
 * 11. Deterministic contradiction still overrides model consensus.
 * 12. Provider/model metadata is preserved.
 * 13. Provider-neutral interfaces contain no Gemini SDK types.
 * 14. Adding another provider does not require ConsensusEngine changes.
 * 15. Existing validation endpoint authorization remains intact.
 * 16. Existing validation behavior remains compatible.
 *
 * ALL TESTS USE MOCK PROVIDERS OR OFFLINE INSTANCES - NO REAL GEMINI QUOTA IS CONSUMED.
 */

import { GeminiValidationProvider } from '../lib/validation/gemini-validation.provider';
import { MockQuestionValidatorProvider } from '../lib/validation/testing/mock-validation-provider';
import { geminiClient } from '../lib/ai/gemini.client';
import { ConsensusEngine } from '../lib/validation/consensus.engine';
import { QuestionValidationEngine } from '../lib/validation/question-validation.engine';
import { QuestionValidationService } from '../lib/services/question-validation.service';
import { Question, QuestionValidationStatus, QuestionStatus, DifficultyLevel, QuestionLanguage } from '../types';
import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

const dummyValidQuestion: Question = {
  id: 'BP-Q-9901',
  categoryId: 'CAT-MATH-01',
  categoryName: 'Quantitative Aptitude',
  topicId: 'TOP-ARITH-01',
  topicName: 'Arithmetic',
  subtopicId: 'SUB-PERCENT-01',
  subtopicName: 'Percentages',
  difficulty: DifficultyLevel.MEDIUM,
  language: QuestionLanguage.ENGLISH,
  questionText: 'What is 15 * 12?',
  options: {
    a: '180',
    b: '200',
    c: '150',
    d: '160',
  },
  correctAnswer: 'A',
  explanation: '15 multiplied by 12 equals 180. Correct option is A.',
  status: QuestionStatus.DRAFT,
  validationStatus: QuestionValidationStatus.VALID,
  videoStatus: 'NOT_STARTED' as any,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const dummyMathematicalContradictionQuestion: Question = {
  ...dummyValidQuestion,
  id: 'BP-Q-9902',
  questionText: 'What is 5 + 5?',
  options: {
    a: '10',
    b: '20',
    c: '30',
    d: '40',
  },
  correctAnswer: 'B', // Contradiction: 5+5=10 (A), but declared B (20)
  explanation: '5 + 5 equals 10.',
};

export async function runTask6dTests(): Promise<void> {
  console.log('--- TASK 6D VERIFICATION START ---');

  // 1. Verify Gemini Adapter Implements QuestionValidatorProvider
  console.log('1. Verifying Gemini Adapter Implements QuestionValidatorProvider Contract...');
  const geminiAdapter = new GeminiValidationProvider('gemini-3.7-flash');
  assert(geminiAdapter.providerId === 'gemini', 'providerId is "gemini"');
  assert(geminiAdapter.modelId === 'gemini-3.7-flash', 'modelId matches constructor option');
  assert(typeof geminiAdapter.validate === 'function', 'validate method exists');

  // 2. Verify Provider Returns Valid ValidationEvidence Structure
  console.log('2. Verifying Provider Returns Valid ValidationEvidence Structure...');
  const mockValidProvider = new MockQuestionValidatorProvider('mock-a', 'VALID', 0.95);
  const evidence2 = await mockValidProvider.validate(dummyValidQuestion);
  assert(evidence2.providerId === 'mock-a', 'Evidence providerId is preserved');
  assert(evidence2.modelId === 'mock-val-model-v1', 'Evidence modelId is preserved');
  assert(evidence2.verdict === 'VALID', 'Verdict is VALID');
  assert(evidence2.confidence === 0.95, 'Confidence score matches mock');
  assert(typeof evidence2.reasoningSummary === 'string', 'Reasoning summary is present string');
  assert(Array.isArray(evidence2.detectedIssues), 'Detected issues is array');
  assert(typeof evidence2.timestamp === 'string', 'Timestamp is ISO string');

  // 3. Verify VALID Verdict Works
  console.log('3. Verifying VALID Verdict Works...');
  const mockVal = new MockQuestionValidatorProvider('mock-valid', 'VALID', 0.99);
  const res3 = await ConsensusEngine.evaluateProviders(dummyValidQuestion, [mockVal]);
  assert(res3.hasConflict === false, 'No conflict for single VALID provider');
  assert(res3.suggestedStatus === QuestionValidationStatus.VALID, 'Suggested status is VALID');

  // 4. Verify INVALID Verdict Works
  console.log('4. Verifying INVALID Verdict Works...');
  const mockInv = new MockQuestionValidatorProvider('mock-invalid', 'INVALID', 0.85);
  const res4 = await ConsensusEngine.evaluateProviders(dummyValidQuestion, [mockInv]);
  assert(res4.hasConflict === false, 'No conflict for single INVALID provider');
  assert(res4.suggestedStatus === QuestionValidationStatus.INVALID, 'Suggested status is INVALID');

  // 5. Verify NEEDS_REVIEW Verdict Works
  console.log('5. Verifying NEEDS_REVIEW Verdict Works...');
  const mockReview = new MockQuestionValidatorProvider('mock-review', 'NEEDS_REVIEW', 0.50);
  const res5 = await ConsensusEngine.evaluateProviders(dummyValidQuestion, [mockReview]);
  assert(res5.suggestedStatus === QuestionValidationStatus.NEEDS_REVIEW, 'Suggested status is NEEDS_REVIEW');

  // 6. Verify Provider Exception Is Isolated
  console.log('6. Verifying Provider Exception Isolation...');
  const mockThrowing = new MockQuestionValidatorProvider('mock-throwing', 'PROVIDER_EXCEPTION');
  const mockStable = new MockQuestionValidatorProvider('mock-stable', 'VALID', 0.90);
  const res6 = await ConsensusEngine.evaluateProviders(dummyValidQuestion, [mockThrowing, mockStable]);
  assert(res6.evidence.length === 2, 'Evidence collected from both throwing and stable providers');
  const throwingEv = res6.evidence.find((e) => e.providerId === 'mock-throwing');
  assert(throwingEv?.detectedIssues.includes('PROVIDER_EXCEPTION') === true, 'Exception provider recorded exception issue');
  assert(throwingEv?.verdict === 'NEEDS_REVIEW', 'Exception provider converted to NEEDS_REVIEW');
  const stableEv = res6.evidence.find((e) => e.providerId === 'mock-stable');
  assert(stableEv?.verdict === 'VALID', 'Stable provider evaluated successfully despite sibling exception');

  // 7. Verify ConsensusEngine Can Consume Gemini Adapter (Isolated / Stubbed)
  console.log('7. Verifying ConsensusEngine Can Consume Gemini Validation Adapter safely...');
  const origIsConfigured = geminiClient.isConfigured;
  const origGetClient = geminiClient.getClient;

  // Test unconfigured state
  geminiClient.isConfigured = () => false;
  const unconfiguredGemini = new GeminiValidationProvider();
  const res7Unconfigured = await ConsensusEngine.evaluateProviders(dummyValidQuestion, [unconfiguredGemini]);
  assert(res7Unconfigured.evidence.length === 1, 'Evidence recorded for unconfigured Gemini adapter');
  assert(res7Unconfigured.evidence[0].providerId === 'gemini', 'ProviderId is gemini');
  assert(res7Unconfigured.evidence[0].verdict === 'NEEDS_REVIEW', 'Unconfigured provider gracefully returns NEEDS_REVIEW');

  // Test stubbed valid response (Zero Quota)
  geminiClient.isConfigured = () => true;
  geminiClient.getClient = () =>
    ({
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            verdict: 'VALID',
            confidence: 0.98,
            reasoningSummary: 'Stubbed Gemini validation passed.',
            detectedIssues: [],
            declaredAnswerCorrect: true,
            explanationIsClearAndAccurate: true,
          }),
        }),
      },
    } as any);

  const stubbedGemini = new GeminiValidationProvider();
  const res7Stubbed = await ConsensusEngine.evaluateProviders(dummyValidQuestion, [stubbedGemini]);
  assert(res7Stubbed.evidence[0].verdict === 'VALID', 'Stubbed Gemini adapter returns VALID verdict');
  assert(res7Stubbed.evidence[0].confidence === 0.98, 'Stubbed Gemini confidence preserved');

  // Restore geminiClient methods
  geminiClient.isConfigured = origIsConfigured;
  geminiClient.getClient = origGetClient;

  // 8. Verify Mock Provider Works
  console.log('8. Verifying Mock Validation Provider behavior...');
  const mockTestProv = new MockQuestionValidatorProvider('custom-mock', 'VALID', 0.88, 'custom-model-v2');
  const mockEv = await mockTestProv.validate(dummyValidQuestion);
  assert(mockTestProv.callCount === 1, 'Call count tracked correctly');
  assert(mockEv.providerId === 'custom-mock', 'Custom providerId preserved');
  assert(mockEv.modelId === 'custom-model-v2', 'Custom modelId preserved');

  // 9. Verify Multiple Mock Providers Can Be Evaluated Together
  console.log('9. Verifying Multiple Mock Providers Evaluation...');
  const provA = new MockQuestionValidatorProvider('prov-a', 'VALID', 0.90);
  const provB = new MockQuestionValidatorProvider('prov-b', 'VALID', 0.92);
  const res9 = await ConsensusEngine.evaluateProviders(dummyValidQuestion, [provA, provB]);
  assert(res9.evidence.length === 2, 'Collected evidence from both providers');
  assert(res9.suggestedStatus === QuestionValidationStatus.VALID, 'Unanimous VALID yields VALID');

  // 10. Verify Conflicting VALID/INVALID Providers Produce NEEDS_REVIEW
  console.log('10. Verifying Conflicting VALID/INVALID Providers Produce NEEDS_REVIEW...');
  const conflictProvA = new MockQuestionValidatorProvider('prov-valid', 'VALID', 0.90);
  const conflictProvB = new MockQuestionValidatorProvider('prov-invalid', 'INVALID', 0.85);
  const res10 = await ConsensusEngine.evaluateProviders(dummyValidQuestion, [conflictProvA, conflictProvB]);
  assert(res10.hasConflict === true, 'hasConflict flag is true for conflicting verdicts');
  assert(res10.suggestedStatus === QuestionValidationStatus.NEEDS_REVIEW, 'Conflict pushes status to NEEDS_REVIEW');
  assert(res10.conflictDetails?.includes('Model Consensus Conflict') === true, 'Conflict details explained');

  // 11. Verify Deterministic Contradiction Still Overrides Model Consensus
  console.log('11. Verifying Deterministic Contradiction Overrides Unanimous Model Consensus...');
  const provUnanimousA = new MockQuestionValidatorProvider('prov-a', 'VALID', 0.99);
  const provUnanimousB = new MockQuestionValidatorProvider('prov-b', 'VALID', 0.99);
  // Pass deterministicContradiction = true
  const res11 = await ConsensusEngine.evaluateProviders(
    dummyMathematicalContradictionQuestion,
    [provUnanimousA, provUnanimousB],
    true
  );
  assert(res11.suggestedStatus === QuestionValidationStatus.INVALID, 'Deterministic contradiction forced status to INVALID despite models');
  assert(res11.checks.some((c) => c.category === 'MODEL_CONSENSUS' && c.status === 'FAIL'), 'Consensus check records FAIL overrule');

  // Full Pipeline Stage 4+9 Integration Test
  const pipelineMathRes = await QuestionValidationEngine.validate(dummyMathematicalContradictionQuestion, {
    providers: [provUnanimousA, provUnanimousB],
  });
  assert(pipelineMathRes.status === QuestionValidationStatus.INVALID, 'Full validation engine invalidates math contradiction despite models');

  // 12. Verify Provider / Model Metadata Is Preserved
  console.log('12. Verifying Metadata Preservation in Validation Result...');
  const provMetaA = new MockQuestionValidatorProvider('meta-prov-1', 'VALID', 0.95, 'meta-model-v1');
  const valResult12 = await QuestionValidationEngine.validate(dummyValidQuestion, {
    providers: [provMetaA],
    skipTaxonomyLookup: true,
  });
  assert(valResult12.modelEvidence !== undefined, 'modelEvidence present in ValidationResult');
  assert(valResult12.modelEvidence?.[0].providerId === 'meta-prov-1', 'providerId preserved in modelEvidence');
  assert(valResult12.modelEvidence?.[0].modelId === 'meta-model-v1', 'modelId preserved in modelEvidence');

  // 13. Verify Provider-Neutral Interfaces Contain No Gemini SDK Types
  console.log('13. Verifying Provider-Neutral Code SDK Isolation...');
  const interfacesPath = path.join(process.cwd(), 'src/lib/validation/interfaces.ts');
  const interfacesContent = fs.readFileSync(interfacesPath, 'utf-8');
  assert(!interfacesContent.includes('@google/genai'), 'interfaces.ts must not import @google/genai');
  assert(!interfacesContent.includes('GoogleGenAI'), 'interfaces.ts must not reference GoogleGenAI');

  const consensusPath = path.join(process.cwd(), 'src/lib/validation/consensus.engine.ts');
  const consensusContent = fs.readFileSync(consensusPath, 'utf-8');
  assert(!consensusContent.includes('@google/genai'), 'consensus.engine.ts must not import @google/genai');
  assert(!consensusContent.includes('GoogleGenAI'), 'consensus.engine.ts must not reference GoogleGenAI');

  // 14. Verify Adding Another Provider Does Not Require ConsensusEngine Changes
  console.log('14. Verifying Architectural Multi-Provider Extensibility...');
  class FutureProviderB implements MockQuestionValidatorProvider {
    public readonly providerId = 'future-provider-b';
    public readonly modelId = 'future-b-3.0';
    public outcome: any = 'VALID';
    public confidence = 0.93;
    public detectedIssues = [];
    public reasoningSummary = 'Future provider B validated successfully.';
    public callCount = 0;

    public async validate(): Promise<any> {
      this.callCount++;
      return {
        providerId: this.providerId,
        modelId: this.modelId,
        verdict: 'VALID',
        confidence: 0.93,
        reasoningSummary: this.reasoningSummary,
        detectedIssues: [],
        timestamp: new Date().toISOString(),
      };
    }
  }
  const futureB = new FutureProviderB();
  const res14 = await ConsensusEngine.evaluateProviders(dummyValidQuestion, [provA, futureB]);
  assert(res14.evidence.length === 2, 'ConsensusEngine seamlessly evaluated new provider B without code changes');
  assert(futureB.callCount === 1, 'Future provider B called');

  // 15. Verify Existing Validation Endpoint Authorization Remains Intact
  console.log('15. Verifying Route File Authorization for Validation Endpoints...');
  const routesPath = path.join(process.cwd(), 'src/server/routes.ts');
  const routesContent = fs.readFileSync(routesPath, 'utf-8');
  assert(routesContent.includes("apiRouter.post(\n  '/questions/:id/validate'"), 'Validate route endpoint exists');
  assert(routesContent.includes("requireAuth"), 'Validate route uses requireAuth');
  assert(routesContent.includes("requireRole([UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.REVIEWER])"), 'Validate route enforces role permissions');

  // 16. Verify Existing Validation Service Compatibility
  console.log('16. Verifying QuestionValidationService Candidate Validation Compatibility...');
  const serviceCandidateRes = await QuestionValidationService.getInstance().validateCandidate(
    dummyValidQuestion,
    {
      providers: [provA],
      skipTaxonomyLookup: true,
    }
  );
  assert(serviceCandidateRes !== undefined, 'validateCandidate returned result');
  assert(serviceCandidateRes.status === QuestionValidationStatus.VALID, 'Candidate validation status is VALID');
  assert(serviceCandidateRes.modelEvidence?.length === 1, 'Model evidence populated via pipelineOptions');

  console.log('--- TASK 6D VERIFICATION COMPLETED SUCCESSFULLY ---');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTask6dTests()
    .then(() => {
      console.log('TASK 6D TEST RUN PASSED.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('TASK 6D TEST RUN FAILED:', err);
      process.exit(1);
    });
}
