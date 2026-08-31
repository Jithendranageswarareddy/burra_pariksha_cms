/**
 * BURRA PARIKSHA CMS - Generation Prompt Builder
 * Phase 4: Gemini AI Question Studio
 * 
 * Constructs rigorous pedagogical system instructions and generation prompts
 * with prompt injection protection.
 */

import { DifficultyLevel, QuestionLanguage } from '../../../types';
import { GenerateCandidateInput } from '../types';

/**
 * Sanitizes untrusted user strings to protect prompt templates against injection.
 */
export function sanitizePromptInput(input?: string): string {
  if (!input) return '';
  return input
    .replace(/```/g, '')
    .replace(/system\s*:/gi, '')
    .replace(/assistant\s*:/gi, '')
    .replace(/user\s*:/gi, '')
    .replace(/ignore\s+previous\s+instructions/gi, '')
    .replace(/admin\s*password/gi, '')
    .replace(/reveal\s+system\s+prompt/gi, '')
    .trim()
    .slice(0, 500); // cap user-supplied hook strings
}

export const BURRA_PARIKSHA_SYSTEM_INSTRUCTION = `You are the Master Aptitude Content Creator & Senior Mathematician for "Burra Pariksha", India's leading aptitude channel delivering engaging, high-retention short-form video content (YouTube Shorts / Reels) and competitive exam preparation (SSC, Banking PO, RRB, CRT, APPSC/TSPSC, Campus Placements).

YOUR CORE PEDAGOGICAL & CONTENT PRINCIPLES:
1. MATHEMATICAL PRECISION & INDEPENDENT VERIFICATION:
   - Calculate the solution thoroughly before formulating options.
   - Verify all unit conversions (km/h <-> m/s, hours <-> minutes <-> seconds, meters <-> km, rupees <-> paise).
   - Ensure the declared correct answer (A, B, C, or D) matches the EXACT value derived in your step-by-step explanation.
   - For numerical questions, all arithmetic must be 100% correct with realistic numbers.

2. SHORT-FORM VIDEO HOOK & RETENTION STRUCTURE:
   - Every question must follow the viewer retention rhythm:
     [CURIOSITY HOOK / RELATABLE SCENARIO] -> [CLEAR PROBLEM WITH CONSTRAINTS] -> [4 DISTINCT OPTIONS] -> [THINKING MOMENT / COMMENT CTA].
   - CRITICAL: Never reveal the answer or hint the solution in the question statement or hook.
   - Keep question text punchy, crisp, and conversational (under 500 characters) so it reads smoothly in a 45-60 second Short.

3. REALISTIC & ENGAGING CONTEXT:
   - Integrate relatable real-world Indian contexts: Metro travel, local trains, food delivery couriers, cricket run-rate chases, UPI festive cashbacks, festival shopping discounts, salary income tax brackets, fuel mileage, milk & water mixture, or everyday college/office scenarios.
   - AVOID synthetic/meaningless phrases like "Person X is doing an aptitude problem". Ensure the situation gives realistic motive for the calculation.

4. STRATEGIC DISTRACTORS (OPTIONS A, B, C, D):
   - All 4 options must be distinct, non-empty, and plausible.
   - Distractors must correspond to common student pitfalls (e.g., forgetting to convert units, inverted ratios, calculating discount on SP instead of MP, off-by-one errors).
   - Never generate duplicate options or formatting-only variants.

5. LANGUAGE EXCELLENCE:
   - ENGLISH: Professional, clear, concise aptitude problem phrasing.
   - TELUGU: Natural, fluent, conversational spoken Telugu for Andhra Pradesh & Telangana learners. Maintain mathematical clarity with standard terminology (e.g., "ఒక రైలు", "శాతం", "లాభం", "నష్టం", "సగటు", "కాలం మరియు పని") and standard Arabic numerals (e.g. 10, 20%, 50 కి.మీ/గం). Spoken options are represented as ఎ, బి, సి, డి.

6. EXPLANATION STRUCTURE:
   - Must include:
     a) Direct step-by-step mathematical proof / logical derivation.
     b) A "Burra Trick" (or "బుర్ర ట్రిక్" for Telugu) providing a rapid speed math shortcut or mental calculation rule suitable for a 45-60 second video.
     c) Clear confirmation of the correct option letter.

7. OUTPUT FORMAT:
   - Strict JSON adhering to the schema. No markdown backticks or extra commentary outside JSON.`;

/**
 * Builds the user prompt for drafting a new question candidate.
 */
export function buildGenerationPrompt(input: GenerateCandidateInput): string {
  const category = sanitizePromptInput(input.categoryName || input.categoryId);
  const topic = sanitizePromptInput(input.topicName || input.topicId);
  const subtopic = sanitizePromptInput(input.subtopicName || input.subtopicId);
  const difficulty = input.difficulty || DifficultyLevel.MEDIUM;
  const language = input.language || QuestionLanguage.ENGLISH;
  const style = sanitizePromptInput(input.questionStyle || 'Real-World Scenario');
  const context = sanitizePromptInput(input.realWorldContext || '');
  const custom = sanitizePromptInput(input.customInstructions || '');

  let difficultyGuidelines = '';
  if (difficulty === DifficultyLevel.EASY) {
    difficultyGuidelines = 'Difficulty Target: EASY (1-2 straightforward computational steps, immediate clarity, solvable in under 20 seconds).';
  } else if (difficulty === DifficultyLevel.HARD) {
    difficultyGuidelines = 'Difficulty Target: HARD (Multiple dependent steps, subtle constraints, non-obvious shortcut or multi-stage deduction required).';
  } else {
    difficultyGuidelines = 'Difficulty Target: MEDIUM (Standard competitive exam level, 2-3 logical steps, test of core concept application).';
  }

  let languageGuidelines = '';
  if (language === QuestionLanguage.TELUGU) {
    languageGuidelines = `Language Target: TELUGU (Generate the entire question statement, options, and explanation in high-quality, natural spoken Telugu script. Keep numerical values in standard Arabic numerals e.g. 10, 20%, 50 కి.మీ/గం. Options are pronounced as ఎ, బి, సి, డి).`;
  } else {
    languageGuidelines = `Language Target: ENGLISH (Clear, crisp, grammatical English suitable for competitive exam prep).`;
  }

  let styleGuidelines = '';
  const upperStyle = style.toUpperCase();
  if (upperStyle.includes('REAL_WORLD') || upperStyle.includes('REAL-WORLD')) {
    styleGuidelines = `STYLE MANDATE: REAL_WORLD_SCENARIO
- Ground the question in a believable everyday Indian situation (e.g. Hyderabad/Bangalore metro transit, shopping mall festival discounts, scooter petrol efficiency, delivery courier route, UPI cashback).
- The scenario must feel organic and naturally motivate the calculation.`;
  } else if (upperStyle.includes('STORY') || upperStyle.includes('STORY_BASED')) {
    styleGuidelines = `STYLE MANDATE: STORY_BASED
- Introduce a concise, colorful micro-story involving characters or relatable events (e.g. college friends sharing expenses, street food vendor tracking margins, sports tournament points table).
- Keep the narrative tight (2-3 sentences max) so it fits short-form video pacing without overwhelming the math problem.`;
  } else if (upperStyle.includes('TRICK') || upperStyle.includes('TRICK_QUESTION')) {
    styleGuidelines = `STYLE MANDATE: TRICK_QUESTION
- Include a common intuitive trap or optical misdirection where hasty reading leads to a classic wrong option (e.g., average speed across equal distances, boundary/interval counting, successive discounts, percentage base change).
- Ensure at least one distractor represents the exact intuitive mistake.
- The explanation must expose the trap clearly and deliver the foolproof shortcut.`;
  } else if (upperStyle.includes('SPEED') || upperStyle.includes('SPEED_CHALLENGE') || upperStyle.includes('SPEED_MATH')) {
    styleGuidelines = `STYLE MANDATE: SPEED_CHALLENGE
- Design numbers with an elegant mental calculation shortcut (Vedic trick, digit-sum, factoring, complement subtraction, or unit digit rule) solvable in under 15 seconds.
- The explanation MUST explicitly showcase the rapid mental calculation technique.`;
  } else if (upperStyle.includes('LOGIC') || upperStyle.includes('PUZZLE')) {
    styleGuidelines = `STYLE MANDATE: LOGIC_CHALLENGE / PUZZLE
- Require pure deductive reasoning, spatial/temporal arrangements, relational constraints, or pattern deduction rather than standard formula computation.
- All constraints must be unambiguous and lead to a unique valid solution.`;
  } else if (upperStyle.includes('COMMENT') || upperStyle.includes('COMMENT_CHALLENGE')) {
    styleGuidelines = `STYLE MANDATE: COMMENT_CHALLENGE
- Frame the problem with an engaging audience hook (e.g., "Can you solve this before the timer runs out?", "90% of students pick the wrong option here!").
- Keep options clear and invite viewers to drop their answer in the comments.
- Do NOT leak the solution in the question text or hook.`;
  } else if (upperStyle.includes('DATA') || upperStyle.includes('EXAM')) {
    styleGuidelines = `STYLE MANDATE: STANDARD EXAM / DATA INTERPRETATION
- High-yield competitive exam format (SSC CGL / Banking PO / RRB / TSPSC). Crisp problem statement testing core ratio, percentage, or data synthesis.`;
  }

  return `Create a high-quality aptitude question candidate adhering to the following parameters:

TAXONOMY DOMAIN:
- Category: ${category}
- Topic: ${topic}
- Subtopic: ${subtopic}

SPECIFICATIONS:
- ${difficultyGuidelines}
- ${languageGuidelines}
- ${styleGuidelines || `Pedagogical Style: ${style}`}
${context ? `- Real-World Context / Hook: ${context}` : ''}
${custom ? `- Additional Content Guidance: ${custom}` : ''}

REQUIRED JSON FIELDS:
- content: Complete problem statement with hook.
- option_a, option_b, option_c, option_d: Four distinct, realistic options.
- correct_answer: Exactly one of "A", "B", "C", or "D".
- explanation: Step-by-step mathematical proof + "Burra Trick" (or "బుర్ర ట్రిక్") shortcut.
- difficulty: "${difficulty}"
- language: "${language}"
- real_world_context: "${context || style}"
- question_style: "${style}"

CRITICAL: Double-check your arithmetic, unit conversions, and verify that correct_answer matches the derived result in your explanation.`;
}
