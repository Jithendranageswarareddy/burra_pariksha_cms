/**
 * BURRA PARIKSHA CMS - AI Pinned Comment & Conversation Intelligence Prompts
 * Phase 19: Pinned Comment & Conversation Intelligence
 */

import { Question, Script } from '../../../types';

export const BURRA_PARIKSHA_PINNED_COMMENT_SYSTEM_INSTRUCTION = `
You are the Lead Community Engagement & Conversation Strategist for "Burra Pariksha" (బుర్ర పరీక్ష), an elite Telugu educational challenge channel delivering bite-sized mathematics, logical reasoning, and brain-teasers for YouTube Shorts, Instagram Reels, and social media.

Your goal is to produce a structured, high-conversion Pinned Comment & Conversation Intelligence Package for a given question.

CRITICAL ENGAGEMENT MANDATES:
1. OPTIMIZE FOR MEANINGFUL CONVERSATION:
   - Encourage viewers to comment their chosen option (A, B, C, or D), explain their calculation steps, or debate alternative mental math shortcuts.
   - Stimulate curiosity, replies, and healthy debate without generic clichés.
2. REJECT GENERIC PLACEHOLDERS:
   - NEVER output standalone generic phrases like "Comment below!", "Let me know!", "Follow for more!", or "Subscribe for more!".
   - All prompts must be directly anchored to the specific mathematical/logical dilemma and numbers in the question.
3. SOURCE TRUTH & FACTUAL CONSISTENCY:
   - Respect the question's authoritative answer and mathematical facts.
   - Do NOT contradict the authoritative answer or invent false facts.
4. ANSWER-LEAKAGE SAFETY IN DISCUSSION PROMPTS:
   - The discussion prompt and follow-up questions MUST NOT reveal the answer upfront. They should ask "Why did 80% pick Option B?", "Which step was the trickiest?", or "Did you use elimination?".
   - The pinned comment itself can feature a spoiler-guarded breakdown (e.g. "👇 Check your answer breakdown below!") encouraging viewers to solve first before checking.
5. AUDIENCE & BILINGUAL TONE:
   - Tailor for Telugu students and competitive exam aspirants (AP/TS SI, Constable, DSC, RRB) as well as general brain-teaser fans.
   - Natural English-Telugu bilingual conversational tone (e.g. "మీరు Pen లేకుండా Calculate చేశారా? Comment below!").
`;

export function buildPinnedCommentUserPrompt(
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
Analyze the following Burra Pariksha question and generate a structured Pinned Comment & Conversation Intelligence package:

QUESTION DETAILS:
- ID: ${question.id}
- Topic: ${question.topicName || 'General Mathematics'}
- Subtopic: ${question.subtopicName || 'Logical Challenge'}
- Difficulty: ${question.difficulty}
- Statement: "${question.questionText || question.question || ''}"
- Options: ${optionsSummary}
- Correct Answer: [AUTHORITATIVE ANSWER - DO NOT SPOIL IN DISCUSSION PROMPT OR FOLLOW-UPS]
${script ? `- Approved Script Hook: "${script.hookText}"` : ''}

REQUIRED PACKAGE OUTPUT:
1. pinnedComment: A formatted YouTube pinned comment with emojis, question recap, spoiler-separated solution hint/steps, and a call to action.
2. answerDiscussionPrompt: A discussion prompt encouraging viewers to explain why they picked a specific option or compare methods (must NOT leak the answer).
3. followUpQuestions: 1 to 2 follow-up challenge questions with a new twist or harder numbers.
4. audienceParticipationPrompt: An interactive call-to-action (e.g. asking solving speed, mental math vs paper, or tagging friends).

Strictly output valid JSON matching the schema.
`;
}
