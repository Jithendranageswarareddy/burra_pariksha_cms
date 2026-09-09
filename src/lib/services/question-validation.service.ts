/**
 * BURRA PARIKSHA CMS - Question Validation Service
 * Phase 5: Question Validation Engine Service Layer
 * 
 * Provides:
 * - Single & batch validation of questions
 * - Edit invalidation & audit logging
 * - History & latest validation retrieval
 * - Integration with questionsRepository and validationsRepository
 */

import { questionsRepository } from '../repositories/questions.repository';
import { validationsRepository } from '../repositories/validations.repository';
import { auditService } from './audit.service';
import { QuestionValidationEngine, ValidationPipelineOptions } from '../validation/question-validation.engine';
import {
  Question,
  ValidationResult,
  QuestionValidationStatus,
} from '../../types';

export interface ValidationActor {
  id: string;
  name: string;
}

class QuestionNotFoundError extends Error {
  public statusCode = 404;
  constructor(id: string) {
    super(`Question with ID "${id}" was not found.`);
    this.name = 'NotFoundError';
  }
}

export class QuestionValidationService {
  private static instance: QuestionValidationService | null = null;

  private constructor() {}

  public static getInstance(): QuestionValidationService {
    if (!QuestionValidationService.instance) {
      QuestionValidationService.instance = new QuestionValidationService();
    }
    return QuestionValidationService.instance;
  }

  /**
   * Validates an existing question by ID and persists results.
   */
  public async validateQuestion(
    questionId: string,
    actor?: ValidationActor | string,
    pipelineOptions: ValidationPipelineOptions = {}
  ): Promise<ValidationResult> {
    const question = await questionsRepository.findById(questionId);
    if (!question) {
      throw new QuestionNotFoundError(questionId);
    }

    const actorId = typeof actor === 'object' ? actor.id : actor || 'SYSTEM_VALIDATOR';
    const actorName = typeof actor === 'object' ? actor.name : actor || 'System Validator';

    await auditService.log(
      actorId,
      actorName,
      'QUESTION_VALIDATION_STARTED',
      'QUESTION',
      questionId,
      { statusBefore: question.validationStatus || QuestionValidationStatus.NOT_VALIDATED }
    );

    // Run the full validation engine
    const result = await QuestionValidationEngine.validate(question, {
      ...pipelineOptions,
      actor: actorName,
    });

    // Save validation result
    await validationsRepository.saveValidationResult(result);

    // Update question record
    await questionsRepository.update(questionId, {
      validationStatus: result.status,
      lastValidationId: result.id,
      validationScore: result.confidenceScore,
      updatedAt: new Date().toISOString(),
    });

    await auditService.log(
      actorId,
      actorName,
      'QUESTION_VALIDATION_COMPLETED',
      'QUESTION',
      questionId,
      {
        validationId: result.id,
        status: result.status,
        confidenceScore: result.confidenceScore,
        errorsCount: result.errors.length,
        warningsCount: result.warnings.length,
      }
    );

    return result;
  }

  /**
   * Directly validates a candidate or in-memory question without mutating the database.
   */
  public async validateCandidate(
    candidate: Partial<Question>,
    pipelineOptions: ValidationPipelineOptions = {}
  ): Promise<ValidationResult> {
    const mockQuestion = candidate as Question;
    return QuestionValidationEngine.validate(mockQuestion, pipelineOptions);
  }

  /**
   * Returns latest validation result for a given question.
   */
  public async getLatestValidation(questionId: string): Promise<ValidationResult | null> {
    return validationsRepository.getLatestByQuestionId(questionId);
  }

  /**
   * Returns complete historical audit log of validations for a given question.
   */
  public async getValidationHistory(questionId: string): Promise<ValidationResult[]> {
    return validationsRepository.getHistoryByQuestionId(questionId);
  }

  /**
   * Invalidates validation status when a question undergoes a material edit.
   */
  public async invalidateValidation(
    questionId: string,
    actor?: ValidationActor | string,
    reason: string = 'Material question edits made'
  ): Promise<void> {
    const question = await questionsRepository.findById(questionId);
    if (!question) return;

    const actorId = typeof actor === 'object' ? actor.id : actor || 'SYSTEM';
    const actorName = typeof actor === 'object' ? actor.name : actor || 'System';

    // Mark existing validations as stale
    await validationsRepository.markStaleForQuestion(questionId);

    // Reset status on question
    await questionsRepository.update(questionId, {
      validationStatus: QuestionValidationStatus.NOT_VALIDATED,
      validationScore: 0,
      updatedAt: new Date().toISOString(),
    });

    await auditService.log(
      actorId,
      actorName,
      'QUESTION_VALIDATION_INVALIDATED',
      'QUESTION',
      questionId,
      { reason, previousStatus: question.validationStatus }
    );
  }
}

export const questionValidationService = QuestionValidationService.getInstance();
