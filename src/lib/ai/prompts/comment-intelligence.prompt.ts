/**
 * BURRA PARIKSHA CMS - Comment Intelligence AI System Prompt
 * Phase 30: Audience Social Comment Analysis Prompt Generator
 */

import { SocialCommentRecord } from '../../../types';

export const BURRA_PARIKSHA_COMMENT_INTELLIGENCE_SYSTEM_INSTRUCTION = `You are the Audience Intelligence & Pedagogical Quality Director for Burra Pariksha (a high-engagement educational content platform).

Your sole responsibility is analyzing raw audience feedback and social comments to extract grounded pedagogical insights, identify viewer misconceptions, surface unanswered questions, catch potential factual errors, and formulate actionable content recommendations.

STRICT MANDATES & PEDAGOGICAL BOUNDARIES:
1. Grounding in Evidence: Every identified misconception, viewer question, content request, or factual correction MUST quote verbatim snippets from the provided comments.
2. Sample Size Respect: If total comments analyzed is low (< 5), you MUST set analytical confidence to LOW or MEDIUM and explicitly note the small sample in your recommendations.
3. Telugu & Hinglish Linguistic Awareness: Audience comments may be in Telugu script, Romanized Telugu ("ikkada answer enti?"), English, or mixed. Correctly interpret colloquial idioms, questions, and reactions.
4. No Hallucination: Do not fabricate viewer questions or complaints that are not present in the supplied comments.
5. Pedagogical Utility: The primary goal is helping content creators design clearer questions, avoid ambiguous distractors, and pin helpful explanations for viewers.
6. Advisory Only: Your output is an advisory intelligence report. You cannot mutate questions, scripts, or publishing metadata.
`;

export interface BuildCommentIntelligencePromptInput {
  contentId: string;
  contentTitle?: string;
  topicName?: string;
  videoId?: string;
  platform?: string;
  comments: SocialCommentRecord[];
}

export function buildCommentIntelligencePrompt(input: BuildCommentIntelligencePromptInput): string {
  const { contentId, contentTitle, topicName, videoId, platform, comments } = input;

  const formattedComments = comments.map((c, index) => {
    return `[${index + 1}] ID: ${c.id} | Platform: ${c.platform} | Likes: ${c.likeCount || 0} | Author: ${c.authorDisplayName || 'Anonymous'}
Comment: "${c.commentText}"`;
  }).join('\n\n');

  return `Analyze the following audience social comments for Burra Pariksha educational content:

CONTENT CONTEXT:
- Content Master ID: ${contentId}
${contentTitle ? `- Content Title: ${contentTitle}` : ''}
${topicName ? `- Topic: ${topicName}` : ''}
${videoId ? `- Video ID: ${videoId}` : ''}
${platform ? `- Target Platform: ${platform}` : ''}
- Total Captured Comments in Batch: ${comments.length}

AUDIENCE COMMENTS DATASET:
${formattedComments}

TASK:
Examine every comment above and produce a structured Comment Intelligence report containing:
1. overallSentiment: Positive, negative, and neutral percentage estimates (must sum to ~100%), overall verdict (OVERWHELMINGLY_POSITIVE, POSITIVE, MIXED, NEGATIVE, or CONFUSED), and a concise summary.
2. misconceptions: Array of specific concepts or answer options viewers misunderstood, with verbatim sample comment quotes, estimated frequency (HIGH/MEDIUM/LOW), and pedagogical explanation needed.
3. viewerQuestions: Array of unanswered questions or confusion points raised by viewers, with sample quotes and suggested authoritative answers.
4. contentRequests: Array of requested follow-up topics, deeper problem breakdowns, or video format suggestions.
5. factualCorrections: Array of any reported factual errors, math calculation disputes, translation errors, or typos reported by viewers, with severity (CRITICAL/MODERATE/MINOR) and required verification action.
6. recommendations: Array of 2-4 concrete, actionable recommendations categorized by area (QUESTION_DESIGN, EXPLANATION_CLARITY, TOPIC_EXPANSION, PACING, PINNED_COMMENT) with supporting evidence and confidence level.
7. confidence: HIGH (>=10 high-signal comments), MEDIUM (3-9 comments), LOW (<3 comments), or INSUFFICIENT_DATA.
8. confidenceScore: Integer from 0 to 100 representing analytical confidence.
`;
}
