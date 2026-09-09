/**
 * BURRA PARIKSHA CMS - Task 6C Orchestrator Verification
 * Phase 6: Multi-Provider Question Generation Orchestrator
 *
 * Verifies:
 * 1. Successful primary provider returns candidate.
 * 2. Successful primary provider prevents fallback calls.
 * 3. Quota exhaustion moves to fallback provider.
 * 4. Rate-limit behavior is bounded.
 * 5. Permanent authentication error does not cause repeated retries.
 * 6. Invalid request does not cause repeated retries.
 * 7. Timeout is handled safely.
 * 8. Transient failure can use bounded fallback.
 * 9. All providers failing returns structured failure.
 * 10. Same provider is never retried indefinitely.
 * 11. Exactly one candidate is accepted.
 * 12. Multiple candidates are rejected.
 * 13. Provider-neutral orchestrator contains no Gemini SDK dependency.
 * 14. Registry controls provider selection.
 * 15. Metadata records fallback usage.
 * 16. Existing QuestionService remains provider-neutral.
 * 17. Existing API response shape remains compatible.
 *
 * ALL TESTS USE FAKE/MOCK PROVIDERS - NO REAL GEMINI QUOTA IS CONSUMED.
 */

import { AIProviderRegistry } from '../lib/ai/registry';
import { AIOrchestrator } from '../lib/ai/orchestrator';
import { MockAIProvider } from '../lib/ai/testing/mock-provider';
import { DifficultyLevel, QuestionLanguage } from '../types';
import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

export async function runTask6cTests(): Promise<void> {
  console.log('--- TASK 6C VERIFICATION START ---');

  const dummyInput = {
    categoryId: 'CAT-MATH-01',
    topicId: 'TOP-ARITH-01',
    subtopicId: 'SUB-PERCENT-01',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.ENGLISH,
  };

  // 1. Verify Successful Primary Provider Returns Candidate
  console.log('1. Verifying Successful Primary Provider Returns Candidate...');
  const registry1 = new AIProviderRegistry();
  const primaryProv1 = new MockAIProvider('primary-prov', 'SUCCESS');
  registry1.registerProvider(primaryProv1);

  const orchestrator1 = new AIOrchestrator(registry1);
  const res1 = await orchestrator1.generateQuestionCandidate(dummyInput, {
    primaryProviderId: 'primary-prov',
  });

  assert(res1 !== undefined, 'Result must be returned');
  assert(res1.candidate.content.includes('Mock generated question'), 'Candidate content generated');
  assert(res1.metadata.providerId === 'primary-prov', 'Metadata identifies primary provider');
  assert(res1.metadata.fallbackUsed === false, 'Fallback used is false');
  assert(primaryProv1.callCount === 1, 'Primary provider called exactly once');

  // 2. Verify Successful Primary Provider Prevents Fallback Calls
  console.log('2. Verifying Primary Success Prevents Fallback Calls...');
  const registry2 = new AIProviderRegistry();
  const primaryProv2 = new MockAIProvider('primary-prov', 'SUCCESS');
  const fallbackProv2 = new MockAIProvider('fallback-prov', 'SUCCESS');
  registry2.registerProvider(primaryProv2);
  registry2.registerProvider(fallbackProv2);

  const orchestrator2 = new AIOrchestrator(registry2);
  const res2 = await orchestrator2.generateQuestionCandidate(dummyInput, {
    primaryProviderId: 'primary-prov',
    fallbackProviderIds: ['fallback-prov'],
  });

  assert(res2.metadata.providerId === 'primary-prov', 'Primary provider used');
  assert(primaryProv2.callCount === 1, 'Primary provider called once');
  assert(fallbackProv2.callCount === 0, 'Fallback provider NEVER called when primary succeeds');

  // 3. Verify Quota Exhaustion Moves To Fallback Provider
  console.log('3. Verifying Quota Exhaustion Moves To Fallback Provider...');
  const registry3 = new AIProviderRegistry();
  const primaryQuotaExhausted = new MockAIProvider('primary-quota', 'QUOTA_EXHAUSTED');
  const fallbackSuccess = new MockAIProvider('fallback-success', 'SUCCESS');
  registry3.registerProvider(primaryQuotaExhausted);
  registry3.registerProvider(fallbackSuccess);

  const orchestrator3 = new AIOrchestrator(registry3);
  const res3 = await orchestrator3.generateQuestionCandidate(dummyInput, {
    primaryProviderId: 'primary-quota',
    fallbackProviderIds: ['fallback-success'],
  });

  assert(primaryQuotaExhausted.callCount === 1, 'Primary called once and failed with quota exhaustion');
  assert(fallbackSuccess.callCount === 1, 'Fallback provider called');
  assert(res3.metadata.providerId === 'fallback-success', 'Fallback provider produced result');
  assert(res3.metadata.fallbackUsed === true, 'fallbackUsed flag recorded as true');

  // 4. Verify Rate-Limit Behavior Is Bounded
  console.log('4. Verifying Rate-Limit Behavior Is Bounded...');
  const registry4 = new AIProviderRegistry();
  const primaryRateLimit = new MockAIProvider('primary-rate-limit', 'RATE_LIMIT');
  const fallbackRateLimit = new MockAIProvider('fallback-rate-limit', 'SUCCESS');
  registry4.registerProvider(primaryRateLimit);
  registry4.registerProvider(fallbackRateLimit);

  const orchestrator4 = new AIOrchestrator(registry4);
  const res4 = await orchestrator4.generateQuestionCandidate(dummyInput, {
    primaryProviderId: 'primary-rate-limit',
    fallbackProviderIds: ['fallback-rate-limit'],
  });

  assert(primaryRateLimit.callCount === 1, 'Primary rate-limited called once without looping');
  assert(res4.metadata.providerId === 'fallback-rate-limit', 'Fallback executed');

  // 5. Verify Permanent Auth Error Moves To Fallback or Fails Without Endless Retries
  console.log('5. Verifying Permanent Authentication Error Handling...');
  const registry5 = new AIProviderRegistry();
  const primaryAuthErr = new MockAIProvider('primary-auth', 'AUTH_ERROR');
  const fallbackAuthSuccess = new MockAIProvider('fallback-auth', 'SUCCESS');
  registry5.registerProvider(primaryAuthErr);
  registry5.registerProvider(fallbackAuthSuccess);

  const orchestrator5 = new AIOrchestrator(registry5);
  const res5 = await orchestrator5.generateQuestionCandidate(dummyInput, {
    primaryProviderId: 'primary-auth',
    fallbackProviderIds: ['fallback-auth'],
  });

  assert(primaryAuthErr.callCount === 1, 'Auth error provider called once');
  assert(res5.metadata.providerId === 'fallback-auth', 'Fallback provider used');

  // 6. Verify Invalid Request Does Not Cause Repeated Retries On Same Provider
  console.log('6. Verifying Invalid Request Handling...');
  const registry6 = new AIProviderRegistry();
  const primaryInvalid = new MockAIProvider('primary-invalid', 'INVALID_REQUEST');
  registry6.registerProvider(primaryInvalid);

  const orchestrator6 = new AIOrchestrator(registry6);
  let invalidFailed = false;
  try {
    await orchestrator6.generateQuestionCandidate(dummyInput, {
      primaryProviderId: 'primary-invalid',
    });
  } catch (err: any) {
    invalidFailed = true;
    assert(err.message.includes('All AI question generation providers failed'), 'Error reported clearly');
  }
  assert(invalidFailed, 'Invalid request throws expected failure');
  assert(primaryInvalid.callCount === 1, 'Invalid request provider called exactly once');

  // 7. Verify Timeout Is Handled Safely
  console.log('7. Verifying Timeout Is Handled Safely...');
  const registry7 = new AIProviderRegistry();
  const primaryTimeout = new MockAIProvider('primary-timeout', 'TIMEOUT');
  const fallbackTimeoutSuccess = new MockAIProvider('fallback-timeout-success', 'SUCCESS');
  registry7.registerProvider(primaryTimeout);
  registry7.registerProvider(fallbackTimeoutSuccess);

  const orchestrator7 = new AIOrchestrator(registry7);
  const res7 = await orchestrator7.generateQuestionCandidate(dummyInput, {
    primaryProviderId: 'primary-timeout',
    fallbackProviderIds: ['fallback-timeout-success'],
  });

  assert(primaryTimeout.callCount === 1, 'Timed out primary provider called once');
  assert(res7.metadata.providerId === 'fallback-timeout-success', 'Fallback succeeded');

  // 8. Verify Transient Failure Uses Bounded Fallback
  console.log('8. Verifying Transient Failure Bounded Fallback...');
  const registry8 = new AIProviderRegistry();
  const primaryTransient = new MockAIProvider('primary-transient', 'TRANSIENT_ERROR');
  const fallbackTransientSuccess = new MockAIProvider('fallback-transient-success', 'SUCCESS');
  registry8.registerProvider(primaryTransient);
  registry8.registerProvider(fallbackTransientSuccess);

  const orchestrator8 = new AIOrchestrator(registry8);
  const res8 = await orchestrator8.generateQuestionCandidate(dummyInput, {
    primaryProviderId: 'primary-transient',
    fallbackProviderIds: ['fallback-transient-success'],
  });

  assert(primaryTransient.callCount === 1, 'Transient primary provider called once');
  assert(res8.metadata.providerId === 'fallback-transient-success', 'Fallback succeeded');

  // 9. Verify All Providers Failing Returns Structured Failure
  console.log('9. Verifying All Providers Failing Returns Structured Failure...');
  const registry9 = new AIProviderRegistry();
  registry9.registerProvider(new MockAIProvider('prov-1', 'QUOTA_EXHAUSTED'));
  registry9.registerProvider(new MockAIProvider('prov-2', 'RATE_LIMIT'));
  registry9.registerProvider(new MockAIProvider('prov-3', 'TRANSIENT_ERROR'));

  const orchestrator9 = new AIOrchestrator(registry9);
  let allFailed = false;
  try {
    await orchestrator9.generateQuestionCandidate(dummyInput, {
      primaryProviderId: 'prov-1',
      fallbackProviderIds: ['prov-2', 'prov-3'],
    });
  } catch (err: any) {
    allFailed = true;
    assert(err.message.includes('All AI question generation providers failed'), 'Error message describes total failure');
    assert(err.message.includes('Attempted: [prov-1, prov-2, prov-3]'), 'Error message lists attempted providers');
  }
  assert(allFailed, 'Orchestrator throws structured failure when all providers fail');

  // 10. Verify Same Provider Is Never Retried Indefinitely
  console.log('10. Verifying Bounded Execution Across Chain...');
  const registry10 = new AIProviderRegistry();
  const provCountTest = new MockAIProvider('single-prov-quota', 'QUOTA_EXHAUSTED');
  registry10.registerProvider(provCountTest);

  const orchestrator10 = new AIOrchestrator(registry10);
  try {
    await orchestrator10.generateQuestionCandidate(dummyInput, {
      primaryProviderId: 'single-prov-quota',
    });
  } catch (err) {
    // Expected
  }
  assert(provCountTest.callCount === 1, 'Single failed provider is called exactly once without endless loops');

  // 11. Verify Exactly One Candidate Accepted
  console.log('11. Verifying Single Candidate Is Accepted...');
  const registry11 = new AIProviderRegistry();
  const validSingleProv = new MockAIProvider('single-candidate-prov', 'SUCCESS');
  registry11.registerProvider(validSingleProv);

  const orchestrator11 = new AIOrchestrator(registry11);
  const res11 = await orchestrator11.generateQuestionCandidate(dummyInput, {
    primaryProviderId: 'single-candidate-prov',
  });
  assert(typeof res11.candidate.content === 'string', 'Single valid string content accepted');

  // 12. Verify Multiple Candidates Are Rejected
  console.log('12. Verifying Multiple Candidates Are Rejected...');
  const registry12 = new AIProviderRegistry();
  const multiCandidateProv = new MockAIProvider('multi-prov', 'MULTIPLE_CANDIDATES');
  registry12.registerProvider(multiCandidateProv);

  const orchestrator12 = new AIOrchestrator(registry12);
  let multiRejected = false;
  try {
    await orchestrator12.generateQuestionCandidate(dummyInput, {
      primaryProviderId: 'multi-prov',
    });
  } catch (err: any) {
    multiRejected = true;
    assert(err.message.includes('multiple question candidates'), 'Error identifies multiple candidates rejection');
  }
  assert(multiRejected, 'Orchestrator rejects response containing multiple candidates');

  // 13. Verify Orchestrator Has No Gemini SDK Dependency
  console.log('13. Verifying Orchestrator Code SDK Isolation...');
  const orchestratorFilePath = path.join(process.cwd(), 'src/lib/ai/orchestrator.ts');
  const orchestratorContent = fs.readFileSync(orchestratorFilePath, 'utf-8');
  assert(!orchestratorContent.includes('@google/genai'), 'orchestrator.ts must not import @google/genai');
  assert(!orchestratorContent.includes('GoogleGenAI'), 'orchestrator.ts must not reference GoogleGenAI');

  // 14. Verify Registry Controls Provider Selection
  console.log('14. Verifying Registry Controls Provider Selection...');
  const registry14 = new AIProviderRegistry();
  const provA = new MockAIProvider('alpha-provider', 'SUCCESS');
  const provB = new MockAIProvider('beta-provider', 'SUCCESS');
  registry14.registerProvider(provA);
  registry14.registerProvider(provB);

  const orchestrator14 = new AIOrchestrator(registry14);
  const res14 = await orchestrator14.generateQuestionCandidate(dummyInput, {
    primaryProviderId: 'beta-provider',
  });
  assert(res14.metadata.providerId === 'beta-provider', 'Selected provider from registry executed');
  assert(provB.callCount === 1, 'Beta provider called');
  assert(provA.callCount === 0, 'Alpha provider not called');

  // 15. Verify Metadata Records Fallback Usage
  console.log('15. Verifying Metadata Telemetry Records Fallback Usage...');
  const registry15 = new AIProviderRegistry();
  registry15.registerProvider(new MockAIProvider('prov-fail', 'QUOTA_EXHAUSTED'));
  registry15.registerProvider(new MockAIProvider('prov-fallback-ok', 'SUCCESS'));

  const orchestrator15 = new AIOrchestrator(registry15);
  const res15 = await orchestrator15.generateQuestionCandidate(dummyInput, {
    primaryProviderId: 'prov-fail',
    fallbackProviderIds: ['prov-fallback-ok'],
  });

  assert(res15.metadata.fallbackUsed === true, 'fallbackUsed is true');
  assert(res15.metadata.providerId === 'prov-fallback-ok', 'Result providerId matches fallback');
  assert(res15.metadata.attemptedProviders?.includes('prov-fail'), 'Attempted providers includes primary');
  assert(res15.metadata.attemptedProviders?.includes('prov-fallback-ok'), 'Attempted providers includes fallback');

  // 16. Verify QuestionService Provider-Neutral Status
  console.log('16. Verifying QuestionService Provider-Neutral Status...');
  const questionServicePath = path.join(process.cwd(), 'src/lib/services/question.service.ts');
  const questionServiceContent = fs.readFileSync(questionServicePath, 'utf-8');
  assert(!questionServiceContent.includes('@google/genai'), 'QuestionService must not import @google/genai');
  assert(!questionServiceContent.includes('GoogleGenAI'), 'QuestionService must not reference GoogleGenAI');

  // 17. Verify API Response Shape Remains Compatible
  console.log('17. Verifying API Response Shape Compatibility...');
  assert(res1.candidate !== undefined, 'Candidate object present');
  assert(res1.candidate.content !== undefined, 'Candidate content present');
  assert(res1.candidate.option_a !== undefined, 'Option A present');
  assert(res1.candidate.correct_answer !== undefined, 'Correct answer present');
  assert(res1.metadata !== undefined, 'Metadata present');
  assert(res1.validation !== undefined, 'Validation report present');

  console.log('--- TASK 6C VERIFICATION COMPLETED SUCCESSFULLY ---');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTask6cTests()
    .then(() => {
      console.log('TASK 6C TEST RUN PASSED.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('TASK 6C TEST RUN FAILED:', err);
      process.exit(1);
    });
}
