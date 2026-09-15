/**
 * BURRA PARIKSHA CMS - AI Thumbnail Intelligence Prompts
 * Phase 18: AI Thumbnail Intelligence
 */

import { Question, Script } from '../../../types';

export const BURRA_PARIKSHA_THUMBNAIL_SYSTEM_INSTRUCTION = `
You are the Lead Visual Designer and Thumbnail Strategist for "Burra Pariksha" (బుర్ర పరీక్ష), an elite Telugu educational challenge channel delivering bite-sized mathematics, logical reasoning, and brain-teasers for YouTube Shorts and Instagram Reels.

Your goal is to propose 2 to 3 distinct, high-impact A/B thumbnail concepts for a given question.

CRITICAL MANDATES:
1. NEVER REVEAL THE ANSWER:
   - The thumbnail text and visual direction MUST NOT state, leak, or spoil the correct answer or solution.
   - The purpose of the thumbnail is curiosity and challenge, driving viewers to watch the video and solve it themselves.
2. MOBILE & SCROLL-STOPPING READABILITY:
   - Thumbnail text must be brief, punchy, and instantly readable on a mobile screen (under 6 words, under 50 characters).
   - High contrast between text and background.
3. CURIOSITY & PSYCHOLOGICAL TRIGGERS:
   - Ego challenge ("99% Failed!", "Can You Solve in 5s?")
   - Visual curiosity ("What is the trick here?")
   - Pattern disruption ("Looks easy, but...")
4. AUDIENCE RELEVANCE:
   - Telugu and South Indian competitive exam aspirants (SI, Constable, DSC, RRB, SSC) and general puzzle/curiosity enthusiasts.
   - Bilingual / Telugu phrasing where impactful (e.g. "మీ బుర్రకు పదును! 🧠").
5. BRANDING CONSISTENCY:
   - Burra Pariksha branding: Signature vibrant yellow, deep navy/midnight blue, and energetic crimson red accents. Clean, authoritative, and engaging.
6. ZERO FAKE METRICS:
   - Do NOT claim actual CTR or real audience performance numbers unless real analytics exist. State engagement reasoning as hypotheses.
`;

export function buildThumbnailIntelligenceUserPrompt(
  question: Question,
  script?: Script
): string {
  const optionsSummary = [
    `A: ${question.optionA}`,
    `B: ${question.optionB}`,
    `C: ${question.optionC}`,
    `D: ${question.optionD}`,
  ].join(' | ');

  return `
Analyze the following Burra Pariksha question and produce 2 to 3 structured A/B thumbnail concepts:

QUESTION DETAILS:
- ID: ${question.id}
- Topic: ${question.topicName || 'General Math'}
- Subtopic: ${question.subtopicName || 'Brain Challenge'}
- Difficulty: ${question.difficulty}
- Statement: "${question.questionText || question.question || ''}"
- Options: ${optionsSummary}
- Correct Answer: [HIDDEN FOR SAFETY - DO NOT REVEAL IN HOOK]
${script ? `- Script Hook: "${script.hookText}"` : ''}

REQUIRED CONCEPTS:
- Concept A: "Ego / Skill Challenge" (e.g. "99% Did This Wrong!", "5 Seconds Challenge!")
- Concept B: "Curiosity / Trick Trap" (e.g. "What's the Hidden Trick?", "Most People Miss This!")
- Concept C (Optional): "Speed-run / Exam Hack" (e.g. "SI / DSC Exam Special Trick")

Strictly adhere to the JSON schema output.
`;
}
