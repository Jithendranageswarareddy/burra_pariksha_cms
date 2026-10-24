import {
  CreateLearningUnitInput,
  LearningUnitPlanningDto,
  LearningUnitPlanningResponse,
  UpdateLearningUnitInput,
} from '../../shared';
import { apiClient } from './api-client';

export const learningUnitsApi = {
  async list(filter?: Record<string, string>): Promise<LearningUnitPlanningDto[]> {
    return apiClient.getLearningUnits(filter);
  },

  async getById(id: string): Promise<LearningUnitPlanningDto> {
    return apiClient.getLearningUnitById(id);
  },

  async saveDraft(input: Omit<CreateLearningUnitInput, 'authorId' | 'authorName'>): Promise<LearningUnitPlanningResponse> {
    return apiClient.saveLearningUnitDraft(input as Record<string, unknown>);
  },

  async updateDraft(
    id: string,
    input: UpdateLearningUnitInput & { expectedVersion: number }
  ): Promise<LearningUnitPlanningResponse> {
    return apiClient.updateLearningUnitDraft(id, input as Record<string, unknown> & { expectedVersion: number });
  },

  async submitForVerification(id: string, expectedVersion: number): Promise<LearningUnitPlanningResponse> {
    return apiClient.submitLearningUnitForVerification(id, expectedVersion);
  },
};
