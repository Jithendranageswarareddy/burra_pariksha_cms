/**
 * BURRA PARIKSHA CMS - Question Validations Repository
 * Phase 5: Question Validation Engine Persistence
 */

import { BaseRepository } from './base.repository';
import { ValidationResult, QuestionValidationStatus } from '../../types';

export class ValidationsRepository extends BaseRepository<any> {
  private static instance: ValidationsRepository | null = null;

  private constructor() {
    super('validations');
  }

  public static getInstance(): ValidationsRepository {
    if (!ValidationsRepository.instance) {
      ValidationsRepository.instance = new ValidationsRepository();
    }
    return ValidationsRepository.instance;
  }

  /**
   * Serializes a rich ValidationResult into row-storable format.
   */
  private serializeResult(result: ValidationResult): any {
    return {
      id: result.id,
      questionId: result.questionId,
      status: result.status,
      confidenceScore: result.confidenceScore,
      validatorVersion: result.validatorVersion,
      validationRuleVersion: result.validationRuleVersion,
      source: result.source,
      summary: result.summary,
      checksJson: JSON.stringify(result.checks || []),
      errorsJson: JSON.stringify(result.errors || []),
      warningsJson: JSON.stringify(result.warnings || []),
      recommendationsJson: JSON.stringify(result.recommendations || []),
      detailsJson: JSON.stringify({
        answerVerification: result.answerVerification,
        explanationVerification: result.explanationVerification,
        ambiguityResult: result.ambiguityResult,
        mathematicalLogicalResult: result.mathematicalLogicalResult,
        modelEvidence: result.modelEvidence,
      }),
      isStale: result.isStale || false,
      validatedBy: result.validatedBy || 'SYSTEM',
      createdAt: result.createdAt || result.timestamp || new Date().toISOString(),
      updatedAt: result.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Deserializes a stored row back into a full ValidationResult domain model.
   */
  private deserializeRow(row: any): ValidationResult {
    let checks = [];
    let errors = [];
    let warnings = [];
    let recommendations = [];
    let details: any = {};

    try {
      checks = typeof row.checksJson === 'string' ? JSON.parse(row.checksJson) : (row.checks || []);
    } catch {
      checks = [];
    }

    try {
      errors = typeof row.errorsJson === 'string' ? JSON.parse(row.errorsJson) : (row.errors || []);
    } catch {
      errors = [];
    }

    try {
      warnings = typeof row.warningsJson === 'string' ? JSON.parse(row.warningsJson) : (row.warnings || []);
    } catch {
      warnings = [];
    }

    try {
      recommendations = typeof row.recommendationsJson === 'string' ? JSON.parse(row.recommendationsJson) : (row.recommendations || []);
    } catch {
      recommendations = [];
    }

    try {
      details = typeof row.detailsJson === 'string' ? JSON.parse(row.detailsJson) : (row.details || {});
    } catch {
      details = {};
    }

    return {
      id: row.id,
      questionId: row.questionId,
      status: (row.status as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
      confidenceScore: typeof row.confidenceScore === 'number' ? row.confidenceScore : parseFloat(row.confidenceScore) || 0,
      validatorVersion: row.validatorVersion || '1.0.0',
      validationRuleVersion: row.validationRuleVersion || '2026.09.v1',
      timestamp: row.createdAt || row.timestamp || new Date().toISOString(),
      source: row.source || 'DETERMINISTIC',
      summary: row.summary || '',
      checks,
      errors,
      warnings,
      recommendations,
      answerVerification: details.answerVerification || {
        isConsistent: true,
        declaredAnswer: 'A',
        details: 'Not verified',
        contradictionDetected: false,
      },
      explanationVerification: details.explanationVerification || {
        isValid: true,
        contradictsAnswer: false,
        reachesDeclaredResult: true,
        substantiveLength: true,
        details: 'Not verified',
      },
      ambiguityResult: details.ambiguityResult || {
        isAmbiguous: false,
        ambiguityReasons: [],
        confidence: 1.0,
        details: 'No ambiguity',
      },
      mathematicalLogicalResult: details.mathematicalLogicalResult || {
        status: 'NOT_APPLICABLE',
        details: 'Not applicable',
      },
      modelEvidence: details.modelEvidence || [],
      isStale: Boolean(row.isStale),
      validatedBy: row.validatedBy,
      createdAt: row.createdAt || new Date().toISOString(),
      updatedAt: row.updatedAt || new Date().toISOString(),
    };
  }

  public async saveValidationResult(result: ValidationResult): Promise<ValidationResult> {
    const serialized = this.serializeResult(result);
    const existing = await this.findById(result.id);
    if (existing) {
      await this.update(result.id, serialized);
    } else {
      await this.create(serialized);
    }
    return result;
  }

  public async getLatestByQuestionId(questionId: string): Promise<ValidationResult | null> {
    const all = await this.findAll();
    const matching = all
      .filter((r) => r.questionId === questionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (matching.length === 0) return null;
    return this.deserializeRow(matching[0]);
  }

  public async getHistoryByQuestionId(questionId: string): Promise<ValidationResult[]> {
    const all = await this.findAll();
    return all
      .filter((r) => r.questionId === questionId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => this.deserializeRow(r));
  }

  public async markStaleForQuestion(questionId: string): Promise<number> {
    const all = await this.findAll();
    const matching = all.filter((r) => r.questionId === questionId && !r.isStale);
    let count = 0;
    for (const record of matching) {
      await this.update(record.id, {
        isStale: true,
        updatedAt: new Date().toISOString(),
      });
      count++;
    }
    return count;
  }
}

export const validationsRepository = ValidationsRepository.getInstance();
