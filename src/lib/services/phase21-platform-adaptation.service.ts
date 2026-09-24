/**
 * BURRA PARIKSHA CMS - Phase 21 Multi-Platform Content Adaptation Service (Compatibility Layer)
 * 
 * @deprecated Use canonical `platformAdaptationService` from `src/lib/services/platform-adaptation.service.ts`.
 * This file is retained as a thin compatibility wrapper forwarding directly to the canonical service.
 */

import {
  PlatformType,
  PlatformAdaptationRecord,
  PlatformAdaptationVersion,
  PlatformAdaptationSearchFilters,
  CreatePlatformAdaptationInput,
  UpdatePlatformAdaptationInput,
  AiAdaptationRecommendation,
  WorkflowActor,
} from '../../types';
import {
  PlatformAdaptationService,
  platformAdaptationService,
} from './platform-adaptation.service';

export class Phase21PlatformAdaptationService {
  private static instance: Phase21PlatformAdaptationService | null = null;

  private constructor() {}

  public static getInstance(): Phase21PlatformAdaptationService {
    if (!Phase21PlatformAdaptationService.instance) {
      Phase21PlatformAdaptationService.instance = new Phase21PlatformAdaptationService();
    }
    return Phase21PlatformAdaptationService.instance;
  }

  public async getCanonicalSourceLock(contentId: string) {
    return platformAdaptationService.getCanonicalSourceLock(contentId);
  }

  public async generateAiAdaptationRecommendation(
    contentId: string,
    rawPlatform: string,
    actor: WorkflowActor,
    options?: { forceFallback?: boolean }
  ): Promise<AiAdaptationRecommendation> {
    return platformAdaptationService.generateAiAdaptationRecommendation(contentId, rawPlatform, actor, options);
  }

  public async createAdaptation(
    input: CreatePlatformAdaptationInput,
    actor: WorkflowActor
  ): Promise<PlatformAdaptationRecord> {
    return platformAdaptationService.createAdaptation(input, actor);
  }

  public async updateAdaptation(
    adaptationId: string,
    updates: UpdatePlatformAdaptationInput,
    actor: WorkflowActor
  ): Promise<PlatformAdaptationRecord> {
    return platformAdaptationService.updateAdaptation(adaptationId, updates, actor);
  }

  public async submitForReview(adaptationId: string, actor: WorkflowActor): Promise<PlatformAdaptationRecord> {
    return platformAdaptationService.submitForReview(adaptationId, actor);
  }

  public async approveAdaptation(
    adaptationId: string,
    actor: WorkflowActor,
    options?: { reason?: string }
  ): Promise<PlatformAdaptationRecord> {
    return platformAdaptationService.approveAdaptation(adaptationId, actor, options);
  }

  public async rejectAdaptation(
    adaptationId: string,
    reason: string,
    actor: WorkflowActor
  ): Promise<PlatformAdaptationRecord> {
    return platformAdaptationService.rejectAdaptation(adaptationId, reason, actor);
  }

  public async requestChanges(
    adaptationId: string,
    reason: string,
    actor: WorkflowActor
  ): Promise<PlatformAdaptationRecord> {
    return platformAdaptationService.requestChanges(adaptationId, reason, actor);
  }

  public async checkStaleness(adaptationId: string) {
    return platformAdaptationService.checkStaleness(adaptationId);
  }

  public async getAdaptationById(adaptationId: string): Promise<PlatformAdaptationRecord | null> {
    return platformAdaptationService.getAdaptationById(adaptationId);
  }

  public async getAdaptationsByContentId(contentId: string): Promise<PlatformAdaptationRecord[]> {
    return platformAdaptationService.getAdaptationsByContentId(contentId);
  }

  public async searchAdaptations(filters: PlatformAdaptationSearchFilters): Promise<PlatformAdaptationRecord[]> {
    return platformAdaptationService.searchAdaptations(filters);
  }

  public async getAdaptationVersions(adaptationId: string): Promise<PlatformAdaptationVersion[]> {
    return platformAdaptationService.getAdaptationVersions(adaptationId);
  }

  public async getAdaptationVersion(adaptationId: string, versionNumber: number): Promise<PlatformAdaptationVersion | null> {
    return platformAdaptationService.getAdaptationVersion(adaptationId, versionNumber);
  }

  public async getAdaptationByContentIdAndPlatform(
    contentId: string,
    platform: PlatformType
  ): Promise<PlatformAdaptationRecord | null> {
    return platformAdaptationService.getAdaptationByContentIdAndPlatform(contentId, platform);
  }

  public async getMultiPlatformPackage(contentId: string) {
    return platformAdaptationService.getMultiPlatformPackage(contentId);
  }
}

export const phase21PlatformAdaptationService = Phase21PlatformAdaptationService.getInstance();
