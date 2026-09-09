/**
 * BURRA PARIKSHA CMS - Structural Question Creation Validator
 * Phase 4: Structural creation validation for Manual & AI workflows.
 */

import { ValidationError } from '../google-sheets/errors';
import {
  DIFFICULTY_LEVELS,
  CHALLENGE_TYPES,
  PRESENTATION_TYPES,
  LANGUAGES,
} from '../../config/question-creation.config';
import { QuestionLanguage } from '../../types';

export interface QuestionCreationRequestPayload {
  creationMode: 'manual' | 'ai';
  categoryId?: string;
  topicId: string;
  subtopicId: string;
  difficulty: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  language?: QuestionLanguage | string;
  questionText: string;
  options: {
    a: string;
    b: string;
    c?: string;
    d?: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  contentMasterId?: string;
  tags?: string[];
  source?: string;
  aiPromptUsed?: string;
  aiModel?: string;
  aiPrompt?: string;
  originalityScore?: number;
  idempotencyKey?: string;
}

export class QuestionCreationValidator {
  /**
   * Normalizes difficulty string to canonical 11 difficulty level IDs.
   */
  public static normalizeDifficulty(diff?: string): string {
    if (!diff) return 'Intermediate';
    const trimmed = diff.trim();
    if (trimmed === 'Medium') return 'Intermediate';
    if (trimmed === 'EASY') return 'Easy';
    if (trimmed === 'HARD') return 'Hard';
    const match = DIFFICULTY_LEVELS.find((d) => d.id.toLowerCase() === trimmed.toLowerCase());
    return match ? match.id : trimmed;
  }

  /**
   * Validates structural constraints of a question creation request payload.
   */
  public static validateStructure(payload: QuestionCreationRequestPayload): void {
    if (!payload) {
      throw new ValidationError('Question creation payload is required.');
    }

    if (payload.difficulty) {
      payload.difficulty = this.normalizeDifficulty(payload.difficulty);
    }

    // 1. Creation Mode
    if (payload.creationMode !== 'manual' && payload.creationMode !== 'ai') {
      throw new ValidationError(`Invalid creationMode "${payload.creationMode}". Must be "manual" or "ai".`);
    }

    // 2. Question Text
    if (!payload.questionText || payload.questionText.trim().length < 5) {
      throw new ValidationError('Question text is required and must be at least 5 characters long.');
    }

    // 3. Explanation
    if (!payload.explanation || payload.explanation.trim().length < 5) {
      throw new ValidationError('Explanation is required and must be at least 5 characters long.');
    }

    // 4. Topic & Subtopic Presence
    if (!payload.topicId || payload.topicId.trim().length === 0) {
      throw new ValidationError('Topic ID is required.');
    }
    if (!payload.subtopicId || payload.subtopicId.trim().length === 0) {
      throw new ValidationError('Subtopic ID is required.');
    }

    // 5. Difficulty Validation
    if (payload.difficulty && payload.difficulty.toLowerCase() === 'medium') {
      payload.difficulty = 'Intermediate';
    }
    const allowedDifficulties = [...DIFFICULTY_LEVELS.map((d) => d.id.toLowerCase()), 'medium'];
    if (payload.difficulty && !allowedDifficulties.includes(payload.difficulty.toLowerCase())) {
      throw new ValidationError(
        `Invalid difficulty level "${payload.difficulty}". Allowed: ${DIFFICULTY_LEVELS.map((d) => d.id).join(', ')}.`
      );
    }

    // 6. Language Validation
    if (payload.language) {
      const allowedLangs = Object.values(QuestionLanguage) as string[];
      if (!allowedLangs.includes(payload.language.toUpperCase())) {
        throw new ValidationError(`Invalid language "${payload.language}". Allowed: ${allowedLangs.join(', ')}.`);
      }
    }

    // 7. Presentation Type Validation
    if (payload.presentationType) {
      const allowedPresTypes = PRESENTATION_TYPES.map((p) => p.id.toLowerCase());
      if (!allowedPresTypes.includes(payload.presentationType.toLowerCase())) {
        throw new ValidationError(
          `Invalid presentation type "${payload.presentationType}". Allowed: ${PRESENTATION_TYPES.map((p) => p.id).join(', ')}.`
        );
      }
    }

    // 8. Challenge Type & Options Structural Rules
    const allowedChallengeTypeIds = CHALLENGE_TYPES.map((c) => c.id);
    if (payload.challengeType) {
      const normalizedChallengeType = payload.challengeType.trim().toUpperCase().replace(/\s*\/\s*/g, '_');
      if (!allowedChallengeTypeIds.includes(normalizedChallengeType)) {
        throw new ValidationError(
          `Invalid challenge type "${payload.challengeType}". Allowed types are: ${allowedChallengeTypeIds.join(', ')}.`
        );
      }
    }

    const challengeType = (payload.challengeType || 'ABCD').trim().toUpperCase().replace(/\s*\/\s*/g, '_');
    const options = payload.options;

    if (!options || typeof options !== 'object') {
      throw new ValidationError('Question options object is required.');
    }

    const optA = (options.a || '').trim();
    const optB = (options.b || '').trim();

    if (!optA || !optB) {
      throw new ValidationError('At least Option A and Option B must be provided.');
    }

    // Challenge-type specific answer structure rules
    if (challengeType === 'TRUE_FALSE' || challengeType === 'TRUE / FALSE' || challengeType === 'YES_NO' || challengeType === 'YES / NO') {
      if (payload.correctAnswer !== 'A' && payload.correctAnswer !== 'B') {
        throw new ValidationError(`For challenge type "${payload.challengeType}", correctAnswer must be "A" or "B".`);
      }
    } else {
      // ABCD / Multiple Choice / Arrange / Incorrect
      if (!['A', 'B', 'C', 'D'].includes(payload.correctAnswer)) {
        throw new ValidationError('correctAnswer must be one of "A", "B", "C", or "D".');
      }

      // Check if selected correct option actually has text
      const selectedOptionText = options[payload.correctAnswer.toLowerCase() as keyof typeof options];
      if (!selectedOptionText || selectedOptionText.trim().length === 0) {
        throw new ValidationError(`Option ${payload.correctAnswer} is designated as the correct answer but is empty.`);
      }
    }
  }
}
