/**
 * BURRA PARIKSHA CMS - Questions Feature API
 * S7-T11: Canonical Feature-Oriented API Boundary
 *
 * Exposes feature-oriented API functions for Question Studio, Verification,
 * and Question Library.
 */

import {
  Question,
  QuestionDraft,
  QuestionStatus,
  QuestionStudioConfigResponse,
  SaveQuestionDraftInput,
  ValidationResult,
} from '../../shared';
import { CreateQuestionInput, QuestionFilterInput, QuestionSimilarityMatch } from './contracts';
import { apiClient } from './api-client';

export const questionsApi = {
  /**
   * Retrieves approved questions matching optional filters.
   */
  async getQuestions(filter?: QuestionFilterInput): Promise<Question[]> {
    return apiClient.getQuestions(filter);
  },

  /**
   * Retrieves a question by ID.
   */
  async getQuestionById(id: string): Promise<Question> {
    return apiClient.getQuestionById(id);
  },

  /**
   * Creates a canonical question directly.
   */
  async createQuestion(input: CreateQuestionInput): Promise<Question> {
    return apiClient.createQuestion(input);
  },

  /**
   * Updates an existing question.
   */
  async updateQuestion(id: string, updates: Partial<CreateQuestionInput>): Promise<Question> {
    return apiClient.updateQuestion(id, updates);
  },

  /**
   * Updates question lifecycle status.
   */
  async updateQuestionStatus(
    id: string,
    status: QuestionStatus,
    remarks?: string
  ): Promise<Question> {
    return apiClient.updateQuestionStatus(id, status, remarks);
  },

  /**
   * Queues question for video production (Stage 03 transition).
   */
  async queueQuestion(id: string, remarks?: string): Promise<Question> {
    return apiClient.queueQuestion(id, remarks);
  },

  /**
   * Saves a question draft (Stage 01 authoring).
   */
  async saveDraft(payload: SaveQuestionDraftInput | Partial<QuestionDraft>): Promise<QuestionDraft> {
    return apiClient.saveQuestionDraft(payload);
  },

  /**
   * Retrieves a question draft by ID.
   */
  async getDraft(id: string): Promise<QuestionDraft> {
    return apiClient.getQuestionDraft(id);
  },

  /**
   * Retrieves all question drafts.
   */
  async getDrafts(): Promise<QuestionDraft[]>{
    return apiClient.getQuestionDrafts();
  },

  /**
   * Approves a question draft (Stage 02 verification gate).
   */
  async approveDraft(
    id: string,
    overrideReason?: string
  ): Promise<Question> {
    return apiClient.approveQuestionDraft(id, overrideReason);
  },

  /**
   * Checks for duplicate questions across database.
   */
  async checkDuplicate(
    text: string,
    excludeId?: string,
    options?: { signal?: AbortSignal }
  ): Promise<{ isDuplicate: boolean; matches: QuestionSimilarityMatch[] }> {
    return apiClient.checkDuplicate(text, excludeId, options);
  },

  /**
   * Validates an existing question against quality gates.
   */
  async validateQuestion(
    id: string,
    options?: { skipTaxonomyLookup?: boolean; source?: string }
  ): Promise<{ success: boolean; data: ValidationResult }> {
    return apiClient.validateQuestion(id, options);
  },

  /**
   * Validates an in-memory candidate question before saving.
   */
  async validateCandidate(
    question: Partial<Question>,
    options?: { skipTaxonomyLookup?: boolean; skipDuplicateCheck?: boolean; source?: string }
  ): Promise<{ success: boolean; data: ValidationResult }> {
    return apiClient.validateCandidate(question, options);
  },

  /**
   * Retrieves Question Studio configuration and taxonomy presets.
   */
  async getStudioConfig(forceRefresh?: boolean): Promise<QuestionStudioConfigResponse> {
    return apiClient.getQuestionStudioConfig(forceRefresh);
  },
  /**
   * Explicitly submits an eligible saved draft for Stage 02 Verification.
   */
  async submitForVerification(input: { draftId: string; remarks?: string }): Promise<import('../../shared/contracts/question-generation').SubmitForVerificationResult> {
    return apiClient.submitQuestionDraftForVerification(input.draftId, input.remarks);
  },

  /**
   * Generates candidate question using advisory AI service.
   */
  async generateAiQuestion(input: import('../../shared/contracts/question-generation').GenerateCandidateInput): Promise<import('../../shared/contracts/question-generation').GenerationResult> {
    return apiClient.generateAiQuestion(input);
  },

  /**
   * Refines candidate question with advisory AI modifications.
   */
  async refineAiQuestion(input: import('../../shared/contracts/question-generation').RefineCandidateInput): Promise<import('../../shared/contracts/question-generation').GenerationResult> {
    return apiClient.refineAiQuestion(input);
  },

  /**
   * Retrieves current AI service configuration status.
   */
  async getAiStatus(): Promise<{ isConfigured: boolean; model: string }> {
    return apiClient.getAiStatus();
  },
};
