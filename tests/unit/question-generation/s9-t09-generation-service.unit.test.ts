import assert from 'node:assert';
import {
  GenerateCandidateInput,
  GenerationResult,
  QuestionLanguage,
} from '../../../shared';
import {
  validateGenerationResult,
  questionGenerationService,
} from '../../../backend/domain/question-generation';
import { AIProviderError } from '../../../backend/ai/errors';

const baseInput: GenerateCandidateInput = {
  topicId: 'TOP-QA-01',
  subtopicId: 'SUB-01',
  difficulty: 'Intermediate',
  language: QuestionLanguage.TELUGU,
  productionMode: 'QUESTION_CHALLENGE_SHORT',
  targetQuestionCount: 1,
  aspectRatio: '9:16',
};

const validResult: GenerationResult = {
  candidate: {
    content: 'A valid question',
    option_a: 'One',
    option_b: 'Two',
    option_c: 'Three',
    option_d: 'Four',
    correct_answer: 'A',
    explanation: 'Because the first option is correct.',
    difficulty: 'MEDIUM' as any,
    language: QuestionLanguage.TELUGU,
  },
  metadata: { modelUsed: 'test', generationDurationMs: 1 },
};

async function run(): Promise<void> {
  assert.deepStrictEqual(validateGenerationResult(validResult, baseInput), { isValid: true });

  const duplicateOptions = {
    ...validResult,
    candidate: { ...validResult.candidate, option_d: 'One' },
  };
  assert.strictEqual(validateGenerationResult(duplicateOptions, baseInput).isValid, false);

  const missingAnswer = {
    ...validResult,
    candidate: { ...validResult.candidate, correct_answer: 'E' as any },
  };
  assert.strictEqual(validateGenerationResult(missingAnswer, baseInput).isValid, false);

  const malformedOrchestrator = {
    async generateQuestionCandidate() {
      return {
        ...validResult,
        candidate: { ...validResult.candidate, option_c: '' },
      };
    },
  };
  await assert.rejects(
    () => questionGenerationService.generateCandidate(baseInput, undefined, malformedOrchestrator),
    (error: any) =>
      error.code === 'INVALID_PROVIDER_OUTPUT' &&
      /incomplete question options/i.test(error.message)
  );

  const invalidRequest = await questionGenerationService.validateGenerationRequest({
    ...baseInput,
    subtopicId: 'SUB-05',
  });
  assert.strictEqual(invalidRequest.isValid, false);
  assert.match(invalidRequest.error || '', /does not belong/i);

  const missingConfiguration = await questionGenerationService.validateGenerationRequest({
    ...baseInput,
    language: undefined as any,
  });
  assert.strictEqual(missingConfiguration.isValid, false);
  assert.match(missingConfiguration.error || '', /language is required/i);

  let transientAttempts = 0;
  const retryingOrchestrator = {
    async generateQuestionCandidate() {
      transientAttempts += 1;
      if (transientAttempts < 3) {
        throw new AIProviderError('upstream timeout', 'test', 'test', 'TIMEOUT', true, 504);
      }
      return validResult;
    },
  };
  const retried = await questionGenerationService.generateCandidate(
    baseInput,
    { maxRetries: 2 },
    retryingOrchestrator
  );
  assert.strictEqual(retried.candidate.correct_answer, 'A');
  assert.strictEqual(transientAttempts, 3);

  let validationAttempts = 0;
  const nonRetryingOrchestrator = {
    async generateQuestionCandidate() {
      validationAttempts += 1;
      throw new AIProviderError('invalid request', 'test', 'test', 'INVALID_REQUEST', false, 400);
    },
  };
  await assert.rejects(
    () => questionGenerationService.generateCandidate(baseInput, { maxRetries: 2 }, nonRetryingOrchestrator),
    (error: any) => error.code === 'AI_GENERATION_UNAVAILABLE'
  );
  assert.strictEqual(validationAttempts, 1);

  const secretFailureOrchestrator = {
    async generateQuestionCandidate() {
      throw new Error('provider key sk-test-secret-value leaked');
    },
  };
  await assert.rejects(
    () => questionGenerationService.generateCandidate(baseInput, undefined, secretFailureOrchestrator),
    (error: any) =>
      error.code === 'AI_GENERATION_UNAVAILABLE' &&
      !error.message.includes('sk-test-secret-value')
  );

  console.log('S9-T09 SERVICE TESTS PASSED: request validation, output validation, bounded retry, and secret-safe failure handling');
}

run().catch((error) => {
  console.error('S9-T09 SERVICE TESTS FAILED', error);
  process.exitCode = 1;
});
