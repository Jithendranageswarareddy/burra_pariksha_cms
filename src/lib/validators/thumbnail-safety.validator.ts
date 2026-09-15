/**
 * BURRA PARIKSHA CMS - Thumbnail Safety Validator
 * Phase 18: AI Thumbnail Intelligence
 * 
 * Enforces editorial and pedagogical safety:
 * - Prevents revealing the correct answer in curiosity/hook text
 * - Enforces mobile brevity (short punchy text for YouTube Shorts / mobile feeds)
 * - Validates domain relevance to question topic / context
 * - Prevents deceptive or misleading claims
 */

import { Question, ThumbnailSafetyReport } from '../../types';

export class ThumbnailSafetyValidator {
  /**
   * Validates a candidate thumbnail hook text against the source question.
   */
  public static validate(text: string, question: Question): ThumbnailSafetyReport {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let leaksAnswer = false;
    let isConcise = true;
    let isRelevant = true;

    const trimmedText = (text || '').trim();

    // 1. Emptiness check
    if (!trimmedText) {
      issues.push('Thumbnail hook text cannot be empty.');
      return {
        isValid: false,
        leaksAnswer: false,
        isConcise: false,
        isRelevant: false,
        issues,
        suggestions: ['Provide a punchy 3-6 word curiosity hook.'],
      };
    }

    // 2. Length / Brevity check (Mobile screen readability)
    const words = trimmedText.split(/\s+/).filter(Boolean);
    if (words.length > 9) {
      isConcise = false;
      issues.push(`Thumbnail text is too long (${words.length} words). Max recommended for mobile thumbnails is 7 words.`);
      suggestions.push('Shorten hook text so it is instantly legible on small mobile screens.');
    }
    if (trimmedText.length > 65) {
      isConcise = false;
      issues.push(`Thumbnail text exceeds 65 characters (${trimmedText.length} chars).`);
      suggestions.push('Keep thumbnail text under 50 characters.');
    }

    // 3. Answer Leakage Detection
    const normalizedText = trimmedText.toLowerCase();

    // Determine correct option text and letter
    const correctLetter = (question.correctAnswer || '').toUpperCase().trim();
    let correctOptionValue = '';
    if (correctLetter === 'A') correctOptionValue = question.optionA || '';
    else if (correctLetter === 'B') correctOptionValue = question.optionB || '';
    else if (correctLetter === 'C') correctOptionValue = question.optionC || '';
    else if (correctLetter === 'D') correctOptionValue = question.optionD || '';

    const cleanOptionValue = correctOptionValue.trim().toLowerCase();

    // A. Check explicit answer revealing patterns: e.g. "Answer: X", "Ans: X", "Answer is X", "Right option is B"
    const explicitAnswerPatterns = [
      /ans(?:wer)?\s*(?:is|:|=)\s*([a-d0-9\w]+)/i,
      /option\s*([a-d])\s*(?:is\s*(?:correct|right))/i,
      /(?:correct|right)\s*(?:answer|option)\s*(?:is|:)?\s*([a-d0-9\w]+)/i,
      /సమాధానం\s*(?:is|:|=)?\s*([a-d0-9\w]+)/i,
      /జవాబు\s*(?:is|:|=)?\s*([a-d0-9\w]+)/i,
    ];

    for (const pattern of explicitAnswerPatterns) {
      const match = trimmedText.match(pattern);
      if (match) {
        leaksAnswer = true;
        issues.push(`Thumbnail text explicitly reveals the answer ("${match[0]}").`);
        suggestions.push('Frame thumbnail as an unsolved question or high-stakes challenge rather than stating the answer.');
        break;
      }
    }

    // B. Check if substantive option value itself is in the hook text as a spoiler
    // If the answer is a specific number (e.g. "42", "120") or distinct substantive word (> 3 chars)
    if (!leaksAnswer && cleanOptionValue.length > 0) {
      // Check if text is just the answer
      if (normalizedText === cleanOptionValue) {
        leaksAnswer = true;
        issues.push(`Thumbnail text is identical to the correct answer ("${correctOptionValue}").`);
      } else if (
        cleanOptionValue.length >= 3 &&
        !['none', 'all', 'both', 'true', 'false'].includes(cleanOptionValue)
      ) {
        // Look for answer phrase surrounded by boundary or giveaway markers
        const escaped = cleanOptionValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const spoilerRegex = new RegExp(`(?:ans|is|it'?s|=|gives|equals|result)\\s*${escaped}\\b`, 'i');
        if (spoilerRegex.test(normalizedText)) {
          leaksAnswer = true;
          issues.push(`Thumbnail text spoils the solution value ("${correctOptionValue}").`);
          suggestions.push('Withhold the numeric/factual answer to drive viewer curiosity and watch-through.');
        }
      }
    }

    // 4. Misleading / Deceptive Claims Check
    const deceptiveKeywords = [
      'win 1 crore',
      'get free money',
      'secret leaked',
      'modi declared',
      'exam cancelled',
      'paytm cash',
    ];
    for (const badKw of deceptiveKeywords) {
      if (normalizedText.includes(badKw)) {
        issues.push(`Thumbnail text contains prohibited deceptive claim: "${badKw}".`);
        suggestions.push('Avoid clickbait that violates educational credibility or platform terms.');
      }
    }

    // 5. Educational Relevance Check
    // Should relate to mathematics, reasoning, science, puzzle, challenge, or question context
    const educationalTerms = [
      'solve', 'math', 'trick', 'puzzle', 'challenge', 'seconds', 'fast', '99%', 'wrong',
      'logic', 'exam', 'test', 'brain', 'can you', 'error', 'burra', 'pariksha',
      'లెక్క', 'ప్రశ్న', 'సవాల్', 'ట్రిక్', 'లాజిక్', 'పరీక్ష'
    ];

    const questionKeywords = [
      question.topicName?.toLowerCase(),
      question.subtopicName?.toLowerCase(),
    ].filter(Boolean) as string[];

    const hasCommonTerms = educationalTerms.some((term) => normalizedText.includes(term));
    const hasQuestionTerms = questionKeywords.some((kw) => normalizedText.includes(kw));

    if (!hasCommonTerms && !hasQuestionTerms && trimmedText.length > 0) {
      // If it has question marks or challenge numbers, it is still relevant
      const hasChallengePattern = /\?|!|\d+s|\d+%|\d+\s*sec/i.test(trimmedText);
      if (!hasChallengePattern) {
        isRelevant = false;
        issues.push('Thumbnail text lacks clear relevance to Burra Pariksha educational challenge or question topic.');
        suggestions.push('Include a challenge hook, timer cue, or topic reference (e.g. "Can you solve in 10s?", "99% Did This Mistake!").');
      }
    }

    const isValid = issues.length === 0 && !leaksAnswer;

    return {
      isValid,
      leaksAnswer,
      isConcise,
      isRelevant,
      issues,
      suggestions,
    };
  }
}
