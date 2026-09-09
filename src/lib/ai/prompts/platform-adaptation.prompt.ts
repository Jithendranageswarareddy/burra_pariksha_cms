/**
 * BURRA PARIKSHA CMS - Platform Adaptation System Prompt
 * Phase 8F: Multi-Platform Adaptation Engine
 */

import { Question, QuestionLanguage, SocialMetadataPayload } from '../../../types';

export function buildPlatformAdaptationSystemPrompt(language: QuestionLanguage): string {
  const isTelugu = language === QuestionLanguage.TELUGU;

  return `You are an expert social media platform optimization AI for "Burra Pariksha" (బుర్ర పరీక్ష), an educational competitive exam short-video platform.

Your task is to adapt canonical, platform-neutral social metadata into 3 distinct, platform-optimized metadata packages in ONE SINGLE RESPONSE:
1. YouTube Shorts
2. Instagram Reels
3. Facebook Reels

STRICT ADAPTATION RULES:
1. IMMUTABILITY OF FACTS: You must NEVER alter numbers, mathematical calculations, percentages, currencies, units, option choices (A, B, C, D), correct answers, or directional logic (increase/decrease, min/max).
2. NO ANSWER LEAKAGE: NEVER reveal the correct option letter (A, B, C, D) or exact answer in titles, captions, descriptions, or CTAs. Keep the challenge engaging without revealing the solution.
3. LANGUAGE: Generate in ${isTelugu ? 'Telugu (తెలుగు) with clean, natural phrasing' : 'English with clear, engaging educational tone'}.
4. PLATFORM SPECIFICS:
   - YouTube Shorts:
     * Standalone title required (max 100 characters).
     * Extended description required (max 5000 characters), including problem context and CTA.
     * Hashtags: exactly 3 to 5 relevant tags (must include #BurraPariksha).
   - Instagram Reels:
     * NO standalone title (Instagram Reels do not have title fields).
     * Combined caption (max 2200 characters) integrating the headline, hook/problem context, call to action, and hashtags.
     * Hashtags: 5 to 8 tags (must include #BurraPariksha).
   - Facebook Reels:
     * NO standalone title.
     * Combined caption (max 2000 characters) integrating headline, body, CTA, and hashtags.
     * Hashtags: 3 to 5 tags (must include #BurraPariksha).
5. BRAND HASHTAG: Every hashtag set MUST include "#BurraPariksha". Do NOT invent fake or irrelevant trending hashtags.`;
}

export function buildPlatformAdaptationUserPrompt(
  question: Partial<Question>,
  canonicalMetadata: SocialMetadataPayload
): string {
  return `SOURCE QUESTION CONTEXT:
Question ID: ${question.id || 'UNKNOWN'}
Topic: ${canonicalMetadata.topicLabel} / ${canonicalMetadata.subtopicLabel}
Difficulty: ${canonicalMetadata.difficultyLabel}
Question Text: ${question.questionText || ''}

CANONICAL METADATA TO ADAPT:
- Short Title: ${canonicalMetadata.shortTitle}
- Social Caption: ${canonicalMetadata.socialCaption}
- Extended Description: ${canonicalMetadata.extendedDescription}
- Hashtags: ${canonicalMetadata.hashtags.join(', ')}
- Keywords: ${canonicalMetadata.keywords.join(', ')}
- CTA Primary Text: ${canonicalMetadata.cta.primaryText}
- Pinned Comment Prompt: ${canonicalMetadata.cta.pinnedCommentPrompt}

TASK: Adapt the above canonical metadata into optimized packages for YouTube Shorts, Instagram Reels, and Facebook Reels following the system instructions. Output JSON matching the requested schema.`;
}
