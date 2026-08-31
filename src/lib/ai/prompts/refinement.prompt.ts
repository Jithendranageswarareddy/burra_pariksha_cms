/**
 * BURRA PARIKSHA CMS - Refinement Prompt Builder
 * Phase 4: Gemini AI Question Studio
 * 
 * Constructs precision prompts for AI refinement actions based on the current
 * administrator-edited candidate state.
 */

import { DifficultyLevel, QuestionLanguage } from '../../../types';
import { AiRefinementAction, QuestionCandidate, RefineCandidateInput } from '../types';
import { sanitizePromptInput } from './generation.prompt';

export function buildRefinementPrompt(input: RefineCandidateInput): { systemInstruction: string; userPrompt: string } {
  const { action, currentCandidate, promptModifier, targetDifficulty, targetLanguage, targetContext } = input;

  const currentJson = JSON.stringify(
    {
      content: currentCandidate.content,
      option_a: currentCandidate.option_a,
      option_b: currentCandidate.option_b,
      option_c: currentCandidate.option_c,
      option_d: currentCandidate.option_d,
      correct_answer: currentCandidate.correct_answer,
      explanation: currentCandidate.explanation,
      difficulty: currentCandidate.difficulty,
      language: currentCandidate.language,
      real_world_context: currentCandidate.real_world_context || '',
      question_style: currentCandidate.question_style || '',
    },
    null,
    2
  );

  let specificActionInstruction = '';

  switch (action) {
    case AiRefinementAction.IMPROVE_OPTIONS:
      specificActionInstruction = `ACTION: IMPROVE DISTRACTORS & OPTIONS
- Preserve the current question statement (${currentCandidate.content}) and its mathematical meaning.
- Keep the correct answer option value accurate and mathematically sound.
- Re-craft the other 3 distractors so they represent common, plausible student calculation mistakes (e.g. inverted ratios, sign errors, base value omissions) rather than arbitrary random numbers.
- Ensure all 4 options are completely distinct.`;
      break;

    case AiRefinementAction.MAKE_REALISTIC:
      specificActionInstruction = `ACTION: MAKE MORE REALISTIC
- Ground the question statement in a relatable real-world Indian scenario (e.g., Metro commute, festive shopping discounts, train journey, UPI cashback, sports tournament).
- Preserve the exact underlying mathematical relationships and calculate realistic values.
- Update options and explanation to match the refined real-world context smoothly.`;
      break;

    case AiRefinementAction.SIMPLIFY_LANGUAGE:
      specificActionInstruction = `ACTION: SIMPLIFY LANGUAGE & CLARITY
- Make the question statement concise, punchy, and crystal clear.
- Remove redundant words and confusing phrasing.
- Retain the exact mathematical problem, numbers, options, and solution.`;
      break;

    case AiRefinementAction.IMPROVE_TELUGU:
      specificActionInstruction = `ACTION: IMPROVE / TRANSLATE TO TELUGU
- Translate or polish the question, options, and explanation into high-quality, fluent Telugu suitable for AP/TS competitive exam aspirants.
- Ensure natural phrasing and correct terminology (e.g., "లాభం", "సగటు", "కాలం - దూరం", "వడ్డీ").
- Keep numerals in standard Hindu-Arabic digits (10, 25%, 60 km/h).
- Set language to "TELUGU".`;
      break;

    case AiRefinementAction.INCREASE_DIFFICULTY:
      specificActionInstruction = `ACTION: INCREASE DIFFICULTY TO HARD
- Elevate the question complexity (target difficulty: ${targetDifficulty || DifficultyLevel.HARD}).
- Add an additional dependent condition, two-step constraint, or deceptive trap that tests deep understanding.
- Recalculate options, correct answer, and provide a comprehensive step-by-step solution.`;
      break;

    case AiRefinementAction.DECREASE_DIFFICULTY:
      specificActionInstruction = `ACTION: DECREASE DIFFICULTY TO EASY
- Simplify the question to a direct, 1-2 step problem (target difficulty: ${targetDifficulty || DifficultyLevel.EASY}).
- Ensure clear, direct numbers and straightforward logic.
- Update options, correct answer, and explanation accordingly.`;
      break;

    case AiRefinementAction.IMPROVE_EXPLANATION:
      specificActionInstruction = `ACTION: ENHANCE EXPLANATION & SPEED SHORTCUT
- Preserve the exact question text, options, and correct answer choice (${currentCandidate.correct_answer}).
- Enrich the explanation with:
  1. Lucid step-by-step derivation.
  2. "Burra Trick" / Speed math shortcut (mental math formula) ideal for 60-second video retention.`;
      break;

    case AiRefinementAction.REGENERATE:
    default:
      specificActionInstruction = `ACTION: REGENERATE FRESH CANDIDATE
- Create an entirely fresh question candidate on the same topic and difficulty.
- Use an alternative real-world situation or number combination.`;
      break;
  }

  const customNotes = sanitizePromptInput(promptModifier || targetContext || '');

  const userPrompt = `CURRENT CANDIDATE JSON (Source of Truth):
${currentJson}

SPECIFIC REFINEMENT INSTRUCTION:
${specificActionInstruction}
${customNotes ? `\nADDITIONAL INSTRUCTION:\n${customNotes}` : ''}

CRITICAL RULES:
1. Return the complete updated QuestionCandidate JSON matching the schema.
2. All 4 options must be distinct and non-empty.
3. The correct_answer must be verified against your solution.
4. Output valid JSON only.`;

  return {
    systemInstruction:
      'You are the Burra Pariksha Aptitude AI Refiner. You refine and improve aptitude questions with strict mathematical rigor and pedagogical clarity according to the administrator’s instructions.',
    userPrompt,
  };
}
