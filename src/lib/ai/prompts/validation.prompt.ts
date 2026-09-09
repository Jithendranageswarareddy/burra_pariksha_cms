/**
 * BURRA PARIKSHA CMS - Validation Prompt
 * Phase 6: Multi-Model Validation Adapters & Consensus Integration
 */

export const BURRA_PARIKSHA_VALIDATION_SYSTEM_INSTRUCTION = `You are an expert Subject Matter Expert and QA Auditor for competitive exam questions (Burra Pariksha CMS).
Your task is to thoroughly audit and validate a multiple-choice question across the following core dimensions:
1. Mathematical and Logical Correctness: Is the problem solvable? Is the declared correct answer provably right?
2. Option Quality: Are there 4 distinct, non-overlapping options? Is exactly one option correct? Are distractors plausible?
3. Answer & Explanation Alignment: Does the step-by-step explanation logically arrive at the declared correct answer?
4. Clarity & Ambiguity: Is the wording clear, unambiguous, and grammatically correct?
5. Context & Fairness: Is any real-life context plausible and relevant? Is the question fair and free from answer leakage?

Respond ONLY with a JSON object matching the requested schema.
Verdict MUST be 'VALID', 'NEEDS_REVIEW', or 'INVALID'.
- 'VALID': Question is entirely correct, unambiguous, and publication-ready.
- 'NEEDS_REVIEW': Minor phrasing, clarity, or explanation issues that a human editor should review.
- 'INVALID': Factually wrong answer, mathematically/logically flawed, duplicate/invalid options, or severe contradiction.`;

export function buildQuestionValidationPrompt(question: {
  questionText: string;
  options: { a: string; b: string; c: string; d: string };
  correctAnswer: string;
  explanation: string;
  categoryName?: string;
  topicName?: string;
  subtopicName?: string;
  difficulty?: string;
  language?: string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
}): string {
  const opts = question.options || { a: '', b: '', c: '', d: '' };
  return `Please audit and validate the following competitive examination question:

Question Text: ${question.questionText}

Options:
Option A: ${opts.a || ''}
Option B: ${opts.b || ''}
Option C: ${opts.c || ''}
Option D: ${opts.d || ''}

Declared Correct Answer: Option ${question.correctAnswer}

Explanation / Solution: ${question.explanation}

Metadata Context:
- Topic: ${question.topicName || 'N/A'}
- Subtopic: ${question.subtopicName || 'N/A'}
- Difficulty: ${question.difficulty || 'N/A'}
- Language: ${question.language || 'ENGLISH'}
- Context: ${question.realLifeContext || question.realWorldContext || 'N/A'}
- Challenge Type: ${question.challengeType || 'ABCD'}
- Presentation Type: ${question.presentationType || 'TEXT_ONLY'}

Evaluate this question rigorously and return your structured validation evidence JSON.`;
}
