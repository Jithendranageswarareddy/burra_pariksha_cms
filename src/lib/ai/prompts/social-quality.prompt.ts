/**
 * BURRA PARIKSHA CMS - Social Quality & Engagement Intelligence System Prompt
 * Phase 8G: Quality & Engagement Intelligence Engine
 */

import {
  MultiPlatformAdaptationPayload,
  Question,
  QuestionLanguage,
  SocialEnhancementPayload,
} from '../../../types';

export function buildSocialQualitySystemPrompt(language: QuestionLanguage): string {
  const isTelugu = language === QuestionLanguage.TELUGU;

  return `You are a senior social content quality auditor and engagement intelligence AI for "Burra Pariksha" (బుర్ర పరీక్ష), an educational short-video platform for competitive exams.

Your task is to evaluate a complete social content package (Question, Hooks, Teleprompter Script, Canonical Metadata, and Multi-Platform Adaptations) across 12 semantic quality dimensions (0-100 score each):

1. CLARITY (clarity, 0-100): Clear, unambiguous, concise phrasing. Options easily distinguishable.
2. CURIOSITY (curiosity, 0-100): Strong information gap, compelling intrigue, urge to solve, non-revealing premise.
3. DIFFICULTY & CHALLENGE (challengeQuality, 0-100): Appropriate difficulty calibration, non-trivial, and fair distractors/trick factor.
4. COMMENT_POTENTIAL (commentability, 0-100): High audience discussion trigger, direct prompt encouraging viewers to comment options or logic.
5. RETENTION_POTENTIAL (retentionPotential, 0-100): Narrative tension, effective teleprompter pacing/pauses, visual reveal momentum.
6. REAL_LIFE_RELEVANCE (realLifeRelevance, 0-100): Relatable real-world scenario context (speed, money, daily logic).
7. SHORTS_SUITABILITY & SOCIAL_PRESENTATION (socialPresentation, 0-100): Clean title, formatted caption, platform-appropriate structure, hashtag quality.
8. LANGUAGE_QUALITY (languageQuality, 0-100): ${
    isTelugu
      ? 'Natural spoken Telugu (తెలుగు) in modern conversational register. Avoid overly formal/bookish GranThika phrasing.'
      : 'Natural, clear, conversational English suitable for social video narration.'
  }
9. AUDIENCE_SUITABILITY (audienceSuitability, 0-100): Broad student/aspirant appeal, accessible context, 100% safe and appropriate.
10. REPETITION_RISK (repetitionRisk, 0-100): Low risk of repetition or redundancy across syllabus.
11. AUDIENCE_APPEAL (audienceAppeal, 0-100): Student and viewer visual, conceptual, and cognitive appeal.
12. TRICK_FACTOR & ANSWERABILITY (evaluated under challengeQuality & audienceSuitability, 0-100): Presence of clever misdirection traps, while remaining provably valid and answerable.

STRICT EVALUATION RULES:
1. NO ANSWER LEAKAGE: If there is any hint revealing the correct option letter (A, B, C, D) or solution in hooks, captions, titles, or teleprompter before the reveal segment, flag a BLOCKING finding with code "ANSWER_LEAKAGE".
2. INVARIANCE RESPECT: Do not suggest changing numbers, equations, options, or correct answers. Suggestions must be purely stylistic, narrative, or presentation-focused.
3. ADVISORY VS BLOCKING FINDINGS:
   - BLOCKING findings: Critical safety/truth failures (answer leakage, option duplicates, missing mandatory branding).
   - ADVISORY findings: Recommendations for improvement (e.g. "Hook could be more intriguing", "Spoken Telugu is slightly formal").
4. CONFIDENCE: Provide a model confidence score between 0.0 and 1.0.`;
}

export function buildSocialQualityUserPrompt(
  question: Partial<Question>,
  enhancementPackage: Partial<SocialEnhancementPayload>,
  platformAdaptations?: Partial<MultiPlatformAdaptationPayload>
): string {
  const hooksText = enhancementPackage.hooks
    ? enhancementPackage.hooks.map((h) => `[${h.style}] ${h.text} (Spoken: ${h.spokenTeluguText})`).join('\n')
    : 'N/A';

  const scriptText = enhancementPackage.teleprompterScript
    ? enhancementPackage.teleprompterScript.segments
        .map((s) => `[${s.section}] ${s.spokenText} (Teleprompter: ${s.teleprompterText})`)
        .join('\n')
    : 'N/A';

  const metadataText = enhancementPackage.metadata
    ? `Title: ${enhancementPackage.metadata.shortTitle}\nCaption: ${enhancementPackage.metadata.socialCaption}\nHashtags: ${enhancementPackage.metadata.hashtags?.join(', ')}\nCTA: ${enhancementPackage.metadata.cta?.primaryText}`
    : 'N/A';

  const adaptationsText = platformAdaptations
    ? `YouTube Shorts Title: ${platformAdaptations.variants?.YOUTUBE_SHORTS?.title || 'N/A'}\nInstagram Reels Caption: ${platformAdaptations.variants?.INSTAGRAM_REELS?.caption || 'N/A'}\nFacebook Reels Caption: ${platformAdaptations.variants?.FACEBOOK_REELS?.caption || 'N/A'}`
    : 'N/A';

  return `CONTENT PACKAGE FOR QUALITY ASSESSMENT:

1. SOURCE QUESTION:
ID: ${question.id || 'UNKNOWN'}
Language: ${question.language || 'ENGLISH'}
Difficulty: ${question.difficulty || 'MEDIUM'}
Text: ${question.questionText || ''}
Options: ${
  Array.isArray(question.options)
    ? question.options.map((o) => `${o.identifier}: ${o.text}`).join(' | ')
    : typeof question.options === 'object' && question.options !== null
    ? Object.entries(question.options).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' | ')
    : ''
}
Correct Answer: ${question.correctAnswer || ''}

2. HOOK VARIANTS (8C):
${hooksText}

3. TELEPROMPTER SCRIPT (8D):
${scriptText}

4. CANONICAL SOCIAL METADATA (8E):
${metadataText}

5. MULTI-PLATFORM ADAPTATIONS (8F):
${adaptationsText}

TASK: Evaluate the above social content package across all requested dimensions. Generate scores (0-100), findings (BLOCKING or ADVISORY), top recommendations, and confidence score matching the output JSON schema.`;
}
