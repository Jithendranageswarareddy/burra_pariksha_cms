/**
 * BURRA PARIKSHA CMS - Pinned Comment Safety Validator
 * Phase 19: Pinned Comment & Conversation Intelligence
 * 
 * Enforces:
 * - Meaningful engagement quality (rejects generic placeholders like "Comment below!", "Follow for more!")
 * - Source answer & factual consistency
 * - Answer-leakage protection in discussion prompts and follow-up questions
 * - Active encouragement of reasoning, debate, and audience participation
 * - Protection against spam and deceptive engagement bait
 */

import { Question, PinnedCommentPackage, EngagementQualityReport } from '../../types';

export class PinnedCommentSafetyValidator {
  /**
   * Generic banned placeholder patterns that lack educational or conversational depth.
   */
  private static readonly GENERIC_BANNED_PATTERNS = [
    /^\s*comment below[!.]*\s*$/i,
    /^\s*let me know[!.]*\s*$/i,
    /^\s*follow for more[!.]*\s*$/i,
    /^\s*subscribe for more[!.]*\s*$/i,
    /^\s*like and comment[!.]*\s*$/i,
    /^\s*drop your comment[!.]*\s*$/i,
    /^\s*share with friends[!.]*\s*$/i,
  ];

  /**
   * Engagement spam / fake controversy patterns to forbid.
   */
  private static readonly SPAM_BAIT_PATTERNS = [
    /\bfree\s+(?:iphone|money|cash|gift\s*card)\b/i,
    /\bclick\s+(?:the\s+)?link\s+in\s+bio\b/i,
    /\byou\s+won['’]?t\s+believe\s+what\s+happens\b/i,
    /\bdoctors\s+(?:hate|don['’]?t\s+want)\b/i,
    /\bshocking\s+secret\s+revealed\b/i,
  ];

  /**
   * Validates a complete or partial pinned comment package against the source question.
   */
  public static validate(
    pkg: Partial<PinnedCommentPackage>,
    question: Question
  ): EngagementQualityReport {
    const issues: string[] = [];
    const suggestions: string[] = [];

    let hasBannedPlaceholders = false;
    let leaksAnswer = false;
    let isMeaningful = true;
    let encouragesDiscussion = true;
    let encouragesParticipation = true;

    const pinnedComment = (pkg.pinnedComment || '').trim();
    const discussionPrompt = (pkg.answerDiscussionPrompt || '').trim();
    const participationPrompt = (pkg.audienceParticipationPrompt || '').trim();
    const followUps = (pkg.followUpQuestions || []).map((q) => (q || '').trim()).filter(Boolean);

    // 1. Completeness & Substance Check
    if (!pinnedComment) {
      isMeaningful = false;
      issues.push('Pinned comment text cannot be empty.');
      suggestions.push('Provide a structured pinned comment with question context.');
    } else if (pinnedComment.length < 25) {
      isMeaningful = false;
      issues.push('Pinned comment text is too brief to be meaningful (must be at least 25 characters).');
    }

    if (!discussionPrompt) {
      isMeaningful = false;
      issues.push('Answer discussion prompt cannot be empty.');
      suggestions.push('Add a discussion prompt that invites viewers to explain their reasoning or choice.');
    } else if (discussionPrompt.length < 15) {
      isMeaningful = false;
      issues.push('Answer discussion prompt is too short to stimulate debate (must be at least 15 characters).');
    }

    if (!participationPrompt) {
      isMeaningful = false;
      issues.push('Audience participation prompt cannot be empty.');
      suggestions.push('Add an audience participation prompt that triggers natural comments or challenge responses.');
    } else if (participationPrompt.length < 10) {
      isMeaningful = false;
      issues.push('Audience participation prompt is too short (must be at least 10 characters).');
    }

    if (followUps.length === 0) {
      isMeaningful = false;
      issues.push('At least one follow-up question is required in the package.');
      suggestions.push('Add a follow-up question or logical twist on the original problem.');
    }

    // 2. Generic Placeholder Detection
    const fieldsToInspect = [
      { name: 'Pinned comment', text: pinnedComment },
      { name: 'Answer discussion prompt', text: discussionPrompt },
      { name: 'Audience participation prompt', text: participationPrompt },
      ...followUps.map((q, idx) => ({ name: `Follow-up question #${idx + 1}`, text: q })),
    ];

    for (const field of fieldsToInspect) {
      if (!field.text) continue;

      for (const pattern of PinnedCommentSafetyValidator.GENERIC_BANNED_PATTERNS) {
        if (pattern.test(field.text)) {
          hasBannedPlaceholders = true;
          issues.push(`${field.name} contains generic placeholder ("${field.text}"). Reject generic engagement clichés.`);
          suggestions.push(`Connect ${field.name.toLowerCase()} directly to the specific question topic and student reasoning.`);
        }
      }

      // Check for standalone generic phrase without question-related terms
      const lower = field.text.toLowerCase();
      if (
        (lower === 'comment below!' || lower === 'let me know!' || lower === 'follow for more!' || lower === 'subscribe for more!')
      ) {
        hasBannedPlaceholders = true;
        issues.push(`${field.name} is a generic placeholder.`);
      }

      // 3. Spam & Clickbait Bait Inspection
      for (const spamPattern of PinnedCommentSafetyValidator.SPAM_BAIT_PATTERNS) {
        if (spamPattern.test(field.text)) {
          issues.push(`${field.name} contains banned spam or deceptive clickbait patterns.`);
          suggestions.push('Maintain high pedagogical integrity and avoid misleading social gimmicks.');
        }
      }
    }

    // 4. Discussion Encouragement Verification
    // Must invite reasoning, step analysis, alternative methods, or option evaluation
    const discussionKeywords = [
      'why', 'how', 'calculate', 'reason', 'step', 'approach', 'shortcut', 'method',
      'option', 'choice', 'trap', 'mistake', 'think', 'solve', 'which', 'difference',
      'logic', 'formula', 'elimination', 'agree', 'disagree', '?', 'ఎందుకు', 'ఎలా', 'జవాబు'
    ];

    const hasDiscussionKeyword = discussionKeywords.some((kw) => discussionPrompt.toLowerCase().includes(kw));
    if (discussionPrompt && !hasDiscussionKeyword) {
      encouragesDiscussion = false;
      issues.push('Answer discussion prompt does not encourage reasoning, comparing approaches, or explaining options.');
      suggestions.push('Frame prompt around why students pick a specific option or which step was the hardest.');
    }

    // 5. Participation Encouragement Verification
    const participationKeywords = [
      'comment', 'challenge', 'time', 'seconds', 'fast', 'try', 'can you', 'score',
      'share', 'tell', 'type', 'test', 'burra pariksha', 'without pen', 'solve',
      'vote', 'drop', '?', 'మీరు', 'చెప్పండి', 'ప్రయత్నించండి'
    ];

    const hasParticipationKeyword = participationKeywords.some((kw) => participationPrompt.toLowerCase().includes(kw));
    if (participationPrompt && !hasParticipationKeyword) {
      encouragesParticipation = false;
      issues.push('Audience participation prompt lacks active engagement cues or call-to-action triggers.');
      suggestions.push('Prompt viewers to comment their solving time or challenge their friends.');
    }

    // 6. Answer Leakage Protection
    // Discussion prompt & follow-up questions must NOT spoil the correct answer
    const correctLetter = (question.correctAnswer || '').toUpperCase().trim();
    let correctOptionValue = '';
    if (correctLetter === 'A') correctOptionValue = question.optionA || '';
    else if (correctLetter === 'B') correctOptionValue = question.optionB || '';
    else if (correctLetter === 'C') correctOptionValue = question.optionC || '';
    else if (correctLetter === 'D') correctOptionValue = question.optionD || '';

    const cleanOptionValue = correctOptionValue.trim().toLowerCase();

    const explicitLeakagePatterns = [
      /ans(?:wer)?\s*(?:is|:|=)\s*(?:option\s*)?([a-d0-9\w]+)/i,
      /option\s*([a-d])\s*(?:is\s*(?:the\s*)?(?:correct|right|answer))/i,
      /(?:correct|right)\s*(?:answer|option)\s*(?:is|:)?\s*([a-d0-9\w]+)/i,
      /సమాధానం\s*(?:is|:|=)?\s*([a-d0-9\w]+)/i,
      /జవాబు\s*(?:is|:|=)?\s*([a-d0-9\w]+)/i,
    ];

    // Check discussion prompt for spoilers
    for (const pattern of explicitLeakagePatterns) {
      const match = discussionPrompt.match(pattern);
      if (match) {
        leaksAnswer = true;
        issues.push(`Discussion prompt explicitly leaks the answer ("${match[0]}"). Prompts must invite reasoning rather than revealing.`);
        suggestions.push('Ask why one option looks tempting without giving away the final solution in the prompt.');
        break;
      }
    }

    // Check if substantive option value itself is in the discussion prompt as a spoiler
    if (!leaksAnswer && cleanOptionValue.length >= 3 && !['none', 'all', 'both', 'true', 'false'].includes(cleanOptionValue)) {
      const escaped = cleanOptionValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const spoilerRegex = new RegExp(`(?:ans|is|it'?s|=|gives|equals|result|correct|right)\\s*${escaped}\\b`, 'i');
      if (spoilerRegex.test(discussionPrompt.toLowerCase())) {
        leaksAnswer = true;
        issues.push(`Discussion prompt leaks the correct answer value ("${correctOptionValue}").`);
      }
    }

    // Check follow-up questions for base answer spoilers
    for (const [idx, followUp] of followUps.entries()) {
      for (const pattern of explicitLeakagePatterns) {
        const match = followUp.match(pattern);
        if (match) {
          leaksAnswer = true;
          issues.push(`Follow-up question #${idx + 1} leaks the answer ("${match[0]}").`);
          break;
        }
      }
    }

    // 7. Contradiction of Authoritative Answer
    // If discussion prompt claims that an incorrect option is correct
    if (correctLetter) {
      const wrongLetters = ['A', 'B', 'C', 'D'].filter((l) => l !== correctLetter);
      for (const wrong of wrongLetters) {
        const contradictionPattern = new RegExp(
          `(?:option\\s*${wrong}\\s*(?:is|=|:)?\\s*(?:the\\s*)?(?:correct|right)|(?:is|why\\s+is)\\s*option\\s*${wrong}\\s*(?:the\\s*)?(?:correct|right)|(?:is|why\\s+is)\\s*(?:the\\s*)?(?:correct|right)\\s*(?:answer\\s*)?(?:option\\s*)?${wrong}|answer\\s*(?:is|:|=)\\s*${wrong})`,
          'i'
        );
        if (contradictionPattern.test(discussionPrompt) || contradictionPattern.test(pinnedComment)) {
          issues.push(`Engagement text contradicts the authoritative answer (claims Option ${wrong} is correct, but authoritative answer is Option ${correctLetter}).`);
        }
      }
    }

    const isValid = issues.length === 0;

    return {
      isValid,
      isMeaningful,
      hasBannedPlaceholders,
      leaksAnswer,
      encouragesDiscussion,
      encouragesParticipation,
      issues,
      suggestions,
    };
  }
}
