/**
 * BURRA PARIKSHA CMS - Planning Feature API
 * S7-T11: Canonical Feature-Oriented API Boundary
 *
 * Exposes feature-oriented API functions for Phase 9 Content Planning,
 * batches, coverage, gap analysis, and diversity radar.
 */

import {
  AiContentPlanRecommendation,
  BatchProgressMetrics,
  ContentBatch,
  ContentGapAnalysis,
  ContentPlan,
  CoverageOverviewData,
} from '../../shared';
import { DiversityRadarReport, QuestionSimilarityMatch } from './contracts';
import { apiClient } from './api-client';

export const planningApi = {
  /**
   * Retrieves strategic content plans matching optional filters.
   */
  async getPlans(filter?: { topicId?: string; status?: string }): Promise<ContentPlan[]> {
    return apiClient.getContentPlans(filter);
  },

  /**
   * Retrieves a single content plan by ID.
   */
  async getPlanById(id: string): Promise<ContentPlan> {
    return apiClient.getContentPlanById(id);
  },

  /**
   * Creates a new strategic content plan.
   */
  async createPlan(input: any): Promise<ContentPlan> {
    return apiClient.createContentPlan(input);
  },

  /**
   * Updates an existing content plan.
   */
  async updatePlan(id: string, input: any): Promise<ContentPlan> {
    return apiClient.updateContentPlan(id, input);
  },

  /**
   * Approves a content plan for production batching.
   */
  async approvePlan(
    id: string,
    input?: { actor?: { id: string; name: string } } | { id: string; name: string }
  ): Promise<ContentPlan> {
    const actor = input && 'actor' in input ? input.actor : (input as { id: string; name: string } | undefined);
    return apiClient.approveContentPlan(id, actor);
  },

  /**
   * Transitions a content plan to a new status.
   */
  async transitionPlanStatus(id: string, status: string): Promise<ContentPlan> {
    return apiClient.transitionPlanStatus(id, status);
  },

  /**
   * Deletes a content plan by ID.
   */
  async deletePlan(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.deleteContentPlan(id);
  },

  /**
   * Retrieves production batches with metrics matching optional filters.
   */
  async getBatches(filter?: {
    planId?: string;
    status?: string;
  }): Promise<{ batch: ContentBatch; metrics: BatchProgressMetrics }[]> {
    return apiClient.getContentBatches(filter);
  },

  /**
   * Creates a new production batch.
   */
  async createBatch(
    input: any
  ): Promise<{ batch: ContentBatch; metrics: BatchProgressMetrics }> {
    return apiClient.createContentBatch(input);
  },

  /**
   * Updates an existing production batch.
   */
  async updateBatch(
    id: string,
    input: any
  ): Promise<{ batch: ContentBatch; metrics: BatchProgressMetrics }> {
    return apiClient.updateContentBatch(id, input);
  },

  /**
   * Deletes a production batch by ID.
   */
  async deleteBatch(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.deleteContentBatch(id);
  },

  /**
   * Links or unlinks questions in a production batch.
   */
  async linkBatchQuestions(
    batchId: string,
    questionIds: string[],
    action: 'ADD' | 'REMOVE' | 'SET' = 'SET'
  ): Promise<{ batch: ContentBatch; metrics: BatchProgressMetrics }> {
    return apiClient.linkBatchQuestions(batchId, questionIds, action);
  },

  /**
   * Retrieves curriculum coverage overview intelligence.
   */
  async getCoverage(): Promise<CoverageOverviewData> {
    return apiClient.getCoverageOverview();
  },

  /**
   * Retrieves content gap analysis.
   */
  async getGaps(): Promise<ContentGapAnalysis> {
    return apiClient.getGapAnalysis();
  },

  /**
   * Retrieves diversity & pattern radar report.
   */
  async getSimilarityRadar(): Promise<DiversityRadarReport> {
    return apiClient.getSimilarityRadar();
  },

  /**
   * Runs duplicate and similarity checks against existing questions.
   */
  async checkSimilarity(
    text: string,
    excludeQuestionId?: string,
    threshold?: number
  ): Promise<{ matches: QuestionSimilarityMatch[]; isDuplicate: boolean }> {
    return apiClient.checkPlanSimilarity(text, excludeQuestionId, threshold);
  },

  /**
   * Generates AI-assisted content plan recommendation.
   */
  async generateAiRecommendation(input: any): Promise<AiContentPlanRecommendation> {
    return apiClient.generateAiContentPlanRecommendation(input);
  },
};
