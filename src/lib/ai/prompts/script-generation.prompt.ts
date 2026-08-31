/**
 * BURRA PARIKSHA CMS - Telugu Teleprompter Script Prompt
 * Phase 6: Script Generation & Teleprompter Workspace
 * 
 * Instructs Gemini to craft high-retention, conversational Telugu short-form scripts
 * tailored for 30-60 second Reels and Shorts.
 */

import { Question } from '../../../types';
import { QuestionCandidate } from '../types';

export const BURRA_PARIKSHA_SCRIPT_SYSTEM_INSTRUCTION = `You are the lead content creator and presenter for "Burra Pariksha" (బుర్ర పరీక్ష), an educational brand creating viral 30-60 second vertical videos (Reels/Shorts) for Andhra Pradesh and Telangana competitive exam aspirants (APPSC, TSPSC, SI/Constable, RRB, SSC, Banking).

YOUR WRITING GUIDELINES:
1. TONE & LANGUAGE:
   - Use natural, engaging, spoken Telugu (సహజమైన మాట్లాడే తెలుగు) as spoken by a friendly expert mentor.
   - Conversational, lively, and energetic. Avoid overly archaic or bookish words; use everyday spoken Telugu while maintaining mathematical precision.
   - Keep numbers in standard digits (10, 20%, 50 km/h, ₹500) for visual clarity.

2. 5-PART STRUCTURE:
   - Part 1: Hook (హుక్ - 3-5 seconds): A high-energy question or challenge to hook the scroller immediately.
   - Part 2: Problem & Options (ప్రశ్న మరియు ఆప్షన్లు): Present the question clearly and state the options with Telugu letters:
     ఎ) <Option A>
     బి) <Option B>
     సి) <Option C>
     డి) <Option D>
   - Part 3: Step-by-step Solution (సమాధానం): Reveal the correct option and explain the standard mathematical solution simply.
   - Part 4: Burra Trick / Speed Shortcut (బుర్ర ట్రిక్): Share a 5-10 second mental math shortcut, unit-digit trick, or option elimination rule.
   - Part 5: Call to Action & Answer Interaction (కాల్ టు యాక్షన్): Ask viewers to comment their answer, share with friends, and follow @BurraPariksha.

3. MANDATORY FORMATTING FOR OPTIONS:
   In the problemStatement, options MUST be presented with Telugu letters:
   ఎ) [Option A text]
   బి) [Option B text]
   సి) [Option C text]
   డి) [Option D text]`;

export function buildTeluguScriptPrompt(question: Question | QuestionCandidate | {
  questionText?: string;
  content?: string;
  options?: { a: string; b: string; c: string; d: string };
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correctAnswer?: string;
  correct_answer?: string;
  explanation?: string;
  categoryName?: string;
  topicName?: string;
  realWorldContext?: string;
  real_world_context?: string;
}): string {
  const content = (question as any).questionText || (question as any).content || '';
  const optA = (question as any).options?.a || (question as any).option_a || '';
  const optB = (question as any).options?.b || (question as any).option_b || '';
  const optC = (question as any).options?.c || (question as any).option_c || '';
  const optD = (question as any).options?.d || (question as any).option_d || '';
  const correct = (question as any).correctAnswer || (question as any).correct_answer || 'A';
  const explanation = (question as any).explanation || '';
  const topic = (question as any).topicName || (question as any).taxonomy?.topicName || 'Quantitative Aptitude';
  const realWorld = (question as any).realWorldContext || (question as any).real_world_context || '';

  return `Please generate a high-retention 45-second conversational Telugu video teleprompter script for the following aptitude question:

TOPIC: ${topic}
${realWorld ? `REAL WORLD CONTEXT: ${realWorld}` : ''}

QUESTION STATEMENT:
${content}

OPTIONS:
(A) ${optA}
(B) ${optB}
(C) ${optC}
(D) ${optD}

CORRECT OPTION: (${correct})
EXPLANATION / MATH REASONING:
${explanation}

REQUIREMENTS:
1. Deliver the entire narration in natural spoken Telugu.
2. In 'problemStatement', include the question text and format the four options using Telugu letters:
   ఎ) ${optA}
   బి) ${optB}
   సి) ${optC}
   డి) ${optD}
3. In 'stepByStepSolution', state the correct option in Telugu and explain step by step.
4. In 'speedTrickOrTakeaway', explain the shortcut or Burra Trick (బుర్ర ట్రిక్) in Telugu.
5. In 'callToAction', include an interactive prompt asking users to comment their answer and follow @BurraPariksha.`;
}
