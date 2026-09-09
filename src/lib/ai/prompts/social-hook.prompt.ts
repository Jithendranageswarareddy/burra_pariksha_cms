/**
 * BURRA PARIKSHA CMS - Social Hook & Presentation Strategy Prompt
 * Phase 8C: Multi-Hook & Presentation Strategy Engine
 * 
 * Instructs Gemini to generate multiple distinct hook variants and a structured short-form video
 * presentation strategy for validated educational questions.
 */

import { HookStyle, Question, QuestionLanguage } from '../../../types';
import { QuestionCandidate } from '../types';

export const BURRA_PARIKSHA_SOCIAL_HOOK_SYSTEM_INSTRUCTION = `You are the Lead Short-Form Educational Content Strategist for "Burra Pariksha" (బుర్ర పరీక్ష), an educational brand producing high-retention 30-60 second vertical videos (Reels/Shorts) for competitive exam aspirants (APPSC, TSPSC, SI, Constable, RRB, SSC, Banking).

CRITICAL DIRECTIVES FOR SOCIAL HOOKS & PRESENTATION STRATEGY:
1. AUTHORITATIVE SOURCE DATA (STRICT IMMUTABILITY):
   - The source question, options, correct answer, numerical parameters, percentages, currencies, units, and mathematical solution are IMMUTABLE REFERENCE DATA.
   - You MUST NOT change, mutate, or alter any numbers, percentages, currencies, units, option texts, or the correct answer.
   - You MUST NOT introduce false or conflicting mathematical statements.

2. LANGUAGE & SPOKEN RHYTHM:
   - For TELUGU: Use natural, energetic, modern spoken Telugu (సహజమైన మాట్లాడే తెలుగు) as spoken by a friendly expert mentor.
   - Avoid archaic, overly bookish, or stiff textbook Telugu. Use conversational phrasing with modern spoken cadence.
   - For ENGLISH: Use concise, catchy, modern social media language.
   - Numbers and units should be kept in standard digits for clear visual overlay (e.g. 30 km/h, ₹500, 20%).

3. HOOK STYLE SEMANTICS (GENUINE VARIATION):
   - CURIOSITY: Create an information gap or intriguing mystery ("Did you know 90% get this wrong?").
   - BRAIN_CHALLENGE: Directly challenge the viewer's reasoning power ("Can your brain solve this in 10s?").
   - SPEED_CHALLENGE: Emphasize quick calculation or finding the mental shortcut ("Burra speed trick alert!").
   - REAL_WORLD: Connect to practical real-world usage ("Next time you take a metro train...").
   - EXAM_CHALLENGE: Frame as a high-yield exam trap or repeat question ("APPSC / TSPSC repeat model!").

4. ANSWER LEAKAGE PREVENTION:
   - Hooks MUST NOT prematurely reveal the correct answer option letter (A/B/C/D) or the final numerical answer. Keep the curiosity gap intact until the question reveal!`;

export function buildSocialHookPrompt(
  question: Question | QuestionCandidate | {
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
    presentationType?: string;
  },
  requestedStyles: HookStyle[] = [
    HookStyle.CURIOSITY,
    HookStyle.BRAIN_CHALLENGE,
    HookStyle.SPEED_CHALLENGE,
    HookStyle.REAL_WORLD,
    HookStyle.EXAM_CHALLENGE,
  ],
  language: QuestionLanguage = QuestionLanguage.TELUGU
): string {
  const content = (question as any).questionText || (question as any).content || '';
  const optA = (question as any).options?.a || (question as any).option_a || '';
  const optB = (question as any).options?.b || (question as any).option_b || '';
  const optC = (question as any).options?.c || (question as any).option_c || '';
  const optD = (question as any).options?.d || (question as any).option_d || '';
  const correct = (question as any).correctAnswer || (question as any).correct_answer || 'A';
  const explanation = (question as any).explanation || '';
  const topic = (question as any).topicName || 'Quantitative Aptitude';
  const realWorld = (question as any).realWorldContext || '';
  const presentationType = (question as any).presentationType || 'Text';

  const stylesToGenerate = requestedStyles.slice(0, 5);

  return `Generate structured social media hooks and a video presentation strategy for the following validated educational question in a SINGLE response.

LANGUAGE: ${language}
TOPIC: ${topic}
PRESENTATION TYPE: ${presentationType}
${realWorld ? `REAL WORLD CONTEXT: ${realWorld}` : ''}

SOURCE QUESTION STATEMENT (IMMUTABLE):
${content}

OPTIONS:
(A) ${optA}
(B) ${optB}
(C) ${optC}
(D) ${optD}

CORRECT OPTION: (${correct})
EXPLANATION / MATH REASONING:
${explanation}

REQUESTED HOOK STYLES TO GENERATE (${stylesToGenerate.length}):
${stylesToGenerate.map((style, idx) => `${idx + 1}. ${style}`).join('\n')}

REQUIREMENTS:
1. Generate EXACTLY one hook variant for each requested style (${stylesToGenerate.join(', ')}).
2. Ensure each hook contains:
   - Catchy hook text (in ${language})
   - Natural spoken Telugu narration (spokenTeluguText)
   - On-screen bold title overlay (onScreenOverlayText)
   - Estimated duration (5-7 seconds)
3. DO NOT reveal the correct option letter (${correct}) or numerical solution in the hooks.
4. Generate a comprehensive Presentation Strategy matching the question's presentation type (${presentationType}):
   - Visual opening scene description
   - On-screen title overlay text
   - Reveal timings for question, options, answer, and explanation (in milliseconds)
   - Visual emphasis and diagram/chart notes
   - Recommended speaking pace (WPM ~140)`;
}
