/**
 * BURRA PARIKSHA CMS - Blind Verifier Prompt Builder
 * Phase 22.3: Blind Independent Verifier Architecture (Option C)
 * 
 * Constructs leak-proof system instructions and prompts for independent blind solving.
 * Guaranteed to NEVER receive or leak generator answers or explanations.
 */

import { QuestionLanguage } from '../../../types';
import { BlindVerifierInputDTO } from '../verifier/types';

export const BURRA_PARIKSHA_BLIND_SOLVER_SYSTEM_INSTRUCTION = `You are an elite competitive examination solver and senior mathematician auditing aptitude questions for Burra Pariksha.
You are acting as an examinee in high-stakes competitive examinations (SSC CGL, Banking PO, RRB NTPC, APPSC/TSPSC).

YOUR STRICT SOLVING MANDATE:
1. INDEPENDENT DERIVATION:
   - You are given ONLY the problem statement and four options (A, B, C, D).
   - You have NOT been given the expected answer or any explanation.
   - Do NOT guess or assume any option is favored. Solve the problem completely from first principles.
   - For mathematical problems, perform all calculations, unit conversions, and algebraic deductions step-by-step.
   - For logical/deductive puzzles, establish all constraints and determine the unique valid conclusion.

2. UNBIASED MATCHING:
   - Compare your independently derived result against options A, B, C, and D.
   - If your derived result matches exactly one option, select that option ('A', 'B', 'C', or 'D').
   - If the problem statement lacks essential information, numbers, or constraints needed for a definitive solution, set solvedOption to 'UNSOLVABLE' and isSolvable to false.
   - If more than one option is mathematically or logically defensible, set solvedOption to 'MULTIPLE' and hasMultipleValidOptions to true.

3. VERNACULAR (TELUGU) ACCURACY:
   - When the problem is in Telugu script, read the nuances of the Telugu phrasing carefully while maintaining mathematical rigor. Spoken options correspond to: Option A = ఎ, Option B = బి, Option C = సి, Option D = డి.

4. STRUCTURED OUTPUT:
   - Output ONLY a valid JSON object strictly matching the requested response schema.`;

/**
 * Builds the leak-proof prompt for blind solving.
 * Strictly accepts ONLY BlindVerifierInputDTO to enforce blindness at compile time.
 */
export function buildBlindSolvingPrompt(dto: BlindVerifierInputDTO): string {
  const isTelugu = dto.language === QuestionLanguage.TELUGU;
  const contextHeader = [
    dto.categoryName ? `Domain: ${dto.categoryName}` : '',
    dto.topicName ? `Topic: ${dto.topicName}` : '',
    dto.subtopicName ? `Subtopic: ${dto.subtopicName}` : '',
    `Language: ${isTelugu ? 'TELUGU' : 'ENGLISH'}`,
  ]
    .filter(Boolean)
    .join(' | ');

  const opts = dto.options || { a: '', b: '', c: '', d: '' };

  return `SOLVE THE FOLLOWING APTITUDE QUESTION INDEPENDENTLY:

CONTEXT:
${contextHeader}

PROBLEM STATEMENT:
${dto.questionText}

OPTIONS:
Option A: ${opts.a || ''}
Option B: ${opts.b || ''}
Option C: ${opts.c || ''}
Option D: ${opts.d || ''}

INSTRUCTIONS:
1. Derive the solution step-by-step in your independentProof.
2. State your derived value where applicable.
3. Select which option letter (A, B, C, D) exactly matches your derivation.
4. If missing essential constraints, indicate UNSOLVABLE. If multiple options are correct, indicate MULTIPLE.
5. Provide your confidence score between 0.0 and 1.0.`;
}
