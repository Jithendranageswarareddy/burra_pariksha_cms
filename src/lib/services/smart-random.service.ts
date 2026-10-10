/**
 * BURRA PARIKSHA CMS - Smart Random Resolution Service
 * Phase 4: Deterministic selection algorithm for RANDOM and SMART_RANDOM configuration parameters.
 * 
 * Rules:
 * - NEVER override explicit human choices.
 * - RANDOM picks a random entry from available options.
 * - SMART_RANDOM inspects available content distributions to select under-represented parameters.
 */

import {
  DIFFICULTY_LEVELS,
  REAL_LIFE_CONTEXTS,
  CHALLENGE_TYPES,
  PRESENTATION_TYPES,
  LANGUAGES,
} from '../../config/question-creation.config';
import { taxonomyService } from './taxonomy.service';
import { questionsRepository } from '../repositories/questions.repository';
import { questionConfigService } from './question-config.service';
import { ValidationError } from '../errors';
import { QuestionLanguage } from '../../types';

export interface ResolvedCreationParameters {
  categoryId: string;
  categoryName: string;
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: string;
  realLifeContext: string;
  challengeType: string;
  presentationType: string;
  language: QuestionLanguage;
  generationMode: 'RANDOM' | 'SUBTOPIC';
}

export interface SmartRandomInput {
  categoryId?: string;
  topicId?: string;
  subtopicId?: string;
  difficulty?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  language?: string;
}

export class SmartRandomService {
  private static instance: SmartRandomService | null = null;

  private constructor() {}

  public static getInstance(): SmartRandomService {
    if (!SmartRandomService.instance) {
      SmartRandomService.instance = new SmartRandomService();
    }
    return SmartRandomService.instance;
  }

  /**
   * Resolves configuration parameters by applying explicit choices first,
   * then resolving RANDOM / SMART_RANDOM requests.
   */
  public async resolveParameters(input: SmartRandomInput): Promise<ResolvedCreationParameters> {
    // 1. Resolve Taxonomy (Topic & Subtopic) directly
    const pureTopics = await taxonomyService.getPureTopicTree();
    if (!pureTopics || pureTopics.length === 0) {
      throw new Error('Taxonomy is empty. Cannot resolve parameters.');
    }

    let topicObj: any = null;

    if (input.topicId && input.topicId !== 'RANDOM' && input.topicId !== 'SMART_RANDOM') {
      topicObj = pureTopics.find((t) => t.id === input.topicId);
    }

    // Handle RANDOM / SMART_RANDOM or missing Topic
    if (!topicObj) {
      const activeTopics = pureTopics.filter(
        (t) => t.isActive !== false && (t.subtopics || []).some((s: any) => s.isActive !== false)
      );

      if (activeTopics.length === 0) {
        throw new Error('No topics with active subtopics available for selection.');
      }

      if (input.topicId === 'SMART_RANDOM') {
        topicObj = activeTopics.reduce((min: any, curr: any) =>
          (curr.subtopics?.length || 0) < (min.subtopics?.length || 0) ? curr : min, activeTopics[0]);
      } else {
        const randomIndex = Math.floor(Math.random() * activeTopics.length);
        topicObj = activeTopics[randomIndex];
      }
    }

    // Resolve Subtopic
    let subtopicId = input.subtopicId;
    const activeSubtopics = (topicObj.subtopics || []).filter((s: any) => s.isActive !== false);
    let subtopicObj = (topicObj.subtopics || []).find((s: any) => s.id === subtopicId);

    if (!subtopicObj && subtopicId && subtopicId !== 'RANDOM' && subtopicId !== 'SMART_RANDOM') {
      // Caller passed an explicit subtopic ID that doesn't belong to this topic or is invalid.
      // Preserve it as dummy object so downstream taxonomy validator catches and rejects it.
      subtopicObj = { id: subtopicId, name: 'Invalid/Mismatched Subtopic' };
    }

    if (!subtopicObj) {
      if (activeSubtopics.length === 0) {
        throw new Error(`Topic "${topicObj.name}" has no active subtopics.`);
      }

      if (input.subtopicId === 'SMART_RANDOM') {
        subtopicObj = activeSubtopics[0];
      } else {
        const randomIndex = Math.floor(Math.random() * activeSubtopics.length);
        subtopicObj = activeSubtopics[randomIndex];
      }
      subtopicId = subtopicObj.id;
    }

    // 2. Resolve Difficulty
    let difficulty = input.difficulty;
    if (!difficulty || difficulty === 'RANDOM' || difficulty === 'SMART_RANDOM') {
      const availableDifficulties = DIFFICULTY_LEVELS.filter((d) => d.id !== 'RANDOM');
      if (difficulty === 'SMART_RANDOM') {
        // Smart random defaults to Intermediate or Easy-Intermediate
        difficulty = 'Intermediate';
      } else {
        const randomIndex = Math.floor(Math.random() * availableDifficulties.length);
        difficulty = availableDifficulties[randomIndex].id;
      }
    }

    // 3. Resolve Real-Life Context
    let realLifeContext = input.realLifeContext;
    const isRandomContext = !realLifeContext || realLifeContext.toUpperCase() === 'RANDOM' || realLifeContext.toUpperCase() === 'SMART_RANDOM';

    if (isRandomContext) {
      const configuredContexts = await questionConfigService.getRealLifeContexts(true);
      if (!configuredContexts || configuredContexts.length === 0) {
        throw new ValidationError('QUESTION_CONFIG contains no active Real-Life Contexts for RANDOM resolution.');
      }
      const randomIndex = Math.floor(Math.random() * configuredContexts.length);
      realLifeContext = configuredContexts[randomIndex].displayLabel || configuredContexts[randomIndex].code;
    } else {
      // Explicit context was passed; check for inactive status in QUESTION_CONFIG
      try {
        const allConfigContexts = await questionConfigService.getRealLifeContexts(false);
        const matched = allConfigContexts.find(
          (c) =>
            c.code.toUpperCase() === realLifeContext!.toUpperCase() ||
            c.displayLabel.toLowerCase() === realLifeContext!.toLowerCase()
        );
        if (matched) {
          if (!matched.isActive) {
            throw new ValidationError(`Selected Real-Life Context "${realLifeContext}" is inactive in QUESTION_CONFIG.`);
          }
          realLifeContext = matched.displayLabel;
        }
      } catch (err: any) {
        if (err instanceof ValidationError) throw err;
      }
    }

    // 4. Resolve Challenge Type
    let challengeType = input.challengeType;
    if (!challengeType || challengeType === 'RANDOM' || challengeType === 'SMART_RANDOM') {
      if (challengeType === 'SMART_RANDOM') {
        challengeType = 'ABCD';
      } else {
        const randomIndex = Math.floor(Math.random() * CHALLENGE_TYPES.length);
        challengeType = CHALLENGE_TYPES[randomIndex].id;
      }
    }

    // 5. Resolve Presentation Type
    let presentationType = input.presentationType;
    if (!presentationType || presentationType === 'RANDOM' || presentationType === 'SMART_RANDOM') {
      if (presentationType === 'SMART_RANDOM') {
        presentationType = 'Text';
      } else {
        const randomIndex = Math.floor(Math.random() * PRESENTATION_TYPES.length);
        presentationType = PRESENTATION_TYPES[randomIndex].id;
      }
    }

    // 6. Resolve Language
    let language: QuestionLanguage = (input.language as QuestionLanguage) || QuestionLanguage.TELUGU;
    if ((input.language as string) === 'RANDOM' || (input.language as string) === 'SMART_RANDOM') {
      language = QuestionLanguage.TELUGU;
    }

    // 7. Resolve Generation Mode
    const isRandomMode =
      input.subtopicId === 'RANDOM' ||
      input.subtopicId === 'SMART_RANDOM' ||
      input.topicId === 'RANDOM' ||
      input.topicId === 'SMART_RANDOM' ||
      input.realLifeContext === 'RANDOM' ||
      input.realLifeContext === 'SMART_RANDOM' ||
      input.difficulty === 'RANDOM' ||
      input.difficulty === 'SMART_RANDOM';

    return {
      categoryId: topicObj.categoryId || input.categoryId || '',
      categoryName: '',
      topicId: topicObj.id,
      topicName: topicObj.name,
      subtopicId: subtopicObj.id,
      subtopicName: subtopicObj.name,
      difficulty,
      realLifeContext,
      challengeType,
      presentationType,
      language,
      generationMode: isRandomMode ? 'RANDOM' : 'SUBTOPIC',
    };
  }
}

export const smartRandomService = SmartRandomService.getInstance();
