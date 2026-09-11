import 'dotenv/config';
import { groqClient } from '../src/lib/ai/providers/groq.client';
import {
  GROQ_QUESTION_CANDIDATE_SCHEMA,
  extractGroqCompletionText
} from '../src/lib/ai/providers/groq.service';
import {
  BURRA_PARIKSHA_SYSTEM_INSTRUCTION,
  buildGenerationPrompt
} from '../src/lib/ai/prompts/generation.prompt';
import { QuestionCandidateZodSchema } from '../src/lib/ai/schemas/question-candidate.schema';
import { CandidateValidator } from '../src/lib/ai/validators/candidate.validator';
import { DifficultyLevel, QuestionLanguage } from '../src/types';

interface LiveTestReport {
  GROQ_API_KEY_PRESENT: boolean;
  LIVE_GROQ_CALLS: number;
  httpStatus: number | null;
  model: string;
  structuredOutput: 'PASS' | 'FAIL' | 'NOT_REACHED';
  receivedCandidateShape: 'PASS' | 'FAIL' | 'NOT_REACHED';
  zodValidation: 'PASS' | 'FAIL' | 'NOT_REACHED';
  candidateValidator: 'PASS' | 'FAIL' | 'NOT_REACHED';
  persistenceOperations: number;
  googleSheetsCalls: number;
  geminiCalls: number;
  xaiGrokCalls: number;
  otherProviderCalls: number;
  apiQuotaConsumed: string;
  productionProviderChainModified: boolean;
  rawCandidateSnippet?: any;
  validationDetails?: any;
  error?: string;
}

async function runLiveStep3(): Promise<void> {
  const report: LiveTestReport = {
    GROQ_API_KEY_PRESENT: groqClient.isConfigured(),
    LIVE_GROQ_CALLS: 0,
    httpStatus: null,
    model: 'openai/gpt-oss-120b',
    structuredOutput: 'NOT_REACHED',
    receivedCandidateShape: 'NOT_REACHED',
    zodValidation: 'NOT_REACHED',
    candidateValidator: 'NOT_REACHED',
    persistenceOperations: 0,
    googleSheetsCalls: 0,
    geminiCalls: 0,
    xaiGrokCalls: 0,
    otherProviderCalls: 0,
    apiQuotaConsumed: '0',
    productionProviderChainModified: false,
  };

  // PRE-FLIGHT CHECK
  if (!report.GROQ_API_KEY_PRESENT) {
    console.log(JSON.stringify({ ...report, error: 'STOP: GROQ_API_KEY is not configured.' }, null, 2));
    return;
  }

  const userPrompt = buildGenerationPrompt({
    categoryId: 'quantitative-aptitude',
    categoryName: 'Quantitative Aptitude',
    topicId: 'percentages',
    topicName: 'Percentages',
    subtopicId: 'basic-percentages',
    subtopicName: 'Basic Percentage Calculation',
    difficulty: DifficultyLevel.EASY,
    language: QuestionLanguage.ENGLISH,
    questionStyle: 'Real-World Scenario',
    realWorldContext: 'Entry-level percentage calculation for a retail shopping discount scenario',
  });

  const payload = {
    model: report.model,
    messages: [
      {
        role: 'system' as const,
        content: BURRA_PARIKSHA_SYSTEM_INSTRUCTION,
      },
      {
        role: 'user' as const,
        content: userPrompt,
      },
    ],
    response_format: {
      type: 'json_schema' as const,
      json_schema: {
        name: 'question_candidate',
        strict: true,
        schema: GROQ_QUESTION_CANDIDATE_SCHEMA,
      },
    },
    temperature: 0.7,
  };

  // LIVE REQUEST: Exactly ONE request. Zero retries.
  report.LIVE_GROQ_CALLS = 1;

  try {
    const rawResponse = await groqClient.generateChatCompletion(payload, {
      timeoutMs: 30000,
    });

    report.httpStatus = 200;

    if (rawResponse?.usage) {
      report.apiQuotaConsumed = `${rawResponse.usage.total_tokens || 0} tokens (prompt: ${rawResponse.usage.prompt_tokens || 0}, completion: ${rawResponse.usage.completion_tokens || 0})`;
    } else {
      report.apiQuotaConsumed = '1 request (token count not returned)';
    }

    const text = extractGroqCompletionText(rawResponse);
    if (!text || !text.trim()) {
      report.structuredOutput = 'FAIL';
      report.error = 'Groq returned empty text content';
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    let parsedCandidate: any;
    try {
      parsedCandidate = JSON.parse(text);
      report.structuredOutput = 'PASS';
    } catch (parseErr: any) {
      report.structuredOutput = 'FAIL';
      report.error = `JSON parse failure: ${parseErr.message}`;
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    // Evaluate received candidate shape
    const hasRequiredKeys = 
      typeof parsedCandidate.content === 'string' &&
      typeof parsedCandidate.option_a === 'string' &&
      typeof parsedCandidate.option_b === 'string' &&
      typeof parsedCandidate.option_c === 'string' &&
      typeof parsedCandidate.option_d === 'string' &&
      ['A', 'B', 'C', 'D'].includes(parsedCandidate.correct_answer) &&
      typeof parsedCandidate.explanation === 'string' &&
      ['EASY', 'MEDIUM', 'HARD'].includes(parsedCandidate.difficulty) &&
      ['ENGLISH', 'TELUGU'].includes(parsedCandidate.language) &&
      typeof parsedCandidate.real_world_context === 'string' &&
      typeof parsedCandidate.question_style === 'string';

    report.receivedCandidateShape = hasRequiredKeys ? 'PASS' : 'FAIL';

    // Sanitize candidate preview without exposing secrets
    report.rawCandidateSnippet = {
      content: parsedCandidate.content,
      option_a: parsedCandidate.option_a,
      option_b: parsedCandidate.option_b,
      option_c: parsedCandidate.option_c,
      option_d: parsedCandidate.option_d,
      correct_answer: parsedCandidate.correct_answer,
      difficulty: parsedCandidate.difficulty,
      language: parsedCandidate.language,
      real_world_context: parsedCandidate.real_world_context,
      question_style: parsedCandidate.question_style,
    };

    // ZOD VALIDATION
    const zodResult = QuestionCandidateZodSchema.safeParse(parsedCandidate);
    if (zodResult.success) {
      report.zodValidation = 'PASS';
    } else {
      report.zodValidation = 'FAIL';
      report.validationDetails = { zodIssues: zodResult.error.issues };
    }

    // CANDIDATE VALIDATOR
    const validationReport = CandidateValidator.validate(parsedCandidate);
    if (validationReport.isValid) {
      report.candidateValidator = 'PASS';
    } else {
      report.candidateValidator = 'FAIL';
      report.validationDetails = {
        ...(report.validationDetails || {}),
        candidateValidatorErrors: validationReport.errors,
        candidateValidatorWarnings: validationReport.warnings,
      };
    }

    console.log(JSON.stringify(report, null, 2));
  } catch (err: any) {
    report.httpStatus = err.statusCode || 500;
    report.error = err.message || 'Unknown error occurred during live call';
    console.log(JSON.stringify(report, null, 2));
  }
}

runLiveStep3().catch((e) => {
  console.error(JSON.stringify({ error: e.message }, null, 2));
  process.exit(1);
});
