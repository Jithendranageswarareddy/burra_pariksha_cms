/**
 * BURRA PARIKSHA CMS - Mock Question Validation Provider for Testing
 * Phase 6: Multi-Model Validation Adapters & Consensus Integration
 */

import { Question, QuestionValidatorProvider, ValidationEvidence } from '../../../types';

export type MockValidationOutcome = 'VALID' | 'INVALID' | 'NEEDS_REVIEW' | 'PROVIDER_EXCEPTION';

export class MockQuestionValidatorProvider implements QuestionValidatorProvider {
  public readonly providerId: string;
  public readonly modelId: string;
  public outcome: MockValidationOutcome;
  public confidence: number;
  public detectedIssues: string[];
  public reasoningSummary: string;
  public callCount: number = 0;

  constructor(
    providerId: string = 'mock-validator',
    outcome: MockValidationOutcome = 'VALID',
    confidence: number = 0.9,
    modelId: string = 'mock-val-model-v1',
    detectedIssues: string[] = [],
    reasoningSummary: string = 'Mock validation completed successfully.'
  ) {
    this.providerId = providerId;
    this.outcome = outcome;
    this.confidence = confidence;
    this.modelId = modelId;
    this.detectedIssues = detectedIssues;
    this.reasoningSummary = reasoningSummary;
  }

  public async validate(question: Question): Promise<ValidationEvidence> {
    this.callCount++;

    if (this.outcome === 'PROVIDER_EXCEPTION') {
      throw new Error(`Simulated exception in validation provider ${this.providerId}`);
    }

    return {
      providerId: this.providerId,
      modelId: this.modelId,
      verdict: this.outcome,
      confidence: this.confidence,
      reasoningSummary: this.reasoningSummary,
      detectedIssues: this.detectedIssues,
      answerAssessment: {
        declaredAnswerCorrect: this.outcome === 'VALID',
        confidence: this.confidence,
        notes: this.reasoningSummary,
      },
      explanationAssessment: {
        isClearAndAccurate: this.outcome === 'VALID',
        notes: this.reasoningSummary,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
