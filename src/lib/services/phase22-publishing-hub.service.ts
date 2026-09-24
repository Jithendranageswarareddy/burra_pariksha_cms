/**
 * BURRA PARIKSHA CMS - Phase 22 Publishing Hub Service (Compatibility Layer)
 * 
 * @deprecated Use canonical `publishingService` from `src/lib/services/publishing.service.ts`.
 * This file is retained as a thin compatibility wrapper forwarding directly to the canonical service.
 */

import {
  PublisherPackage,
  PublishingReadinessEvaluation,
  Phase22PublishingRecord,
  PlatformType,
  WorkflowActor,
  PublisherPackageSearchFilters,
  MarkManuallyPublishedInput,
  MarkPublishingFailedInput,
} from '../../types';
import {
  PublishingService,
  publishingService,
} from './publishing.service';

export class Phase22PublishingHubService {
  private static instance: Phase22PublishingHubService | null = null;

  private constructor() {}

  public static getInstance(): Phase22PublishingHubService {
    if (!Phase22PublishingHubService.instance) {
      Phase22PublishingHubService.instance = new Phase22PublishingHubService();
    }
    return Phase22PublishingHubService.instance;
  }

  public normalizePlatform(platformInput: string | PlatformType): PlatformType {
    return publishingService.normalizePlatform(platformInput);
  }

  public async evaluateReadiness(
    contentId: string,
    platformInput: string | PlatformType
  ): Promise<PublishingReadinessEvaluation> {
    return publishingService.evaluateReadiness(contentId, platformInput);
  }

  public async getPublisherPackage(
    contentId: string,
    platformInput: string | PlatformType
  ): Promise<PublisherPackage> {
    return publishingService.getPublisherPackage(contentId, platformInput);
  }

  public async getAllPublisherPackagesForContent(
    contentId: string
  ): Promise<Record<PlatformType, PublisherPackage>> {
    return publishingService.getAllPublisherPackagesForContent(contentId);
  }

  public async searchPublisherPackages(
    filters: PublisherPackageSearchFilters
  ): Promise<PublisherPackage[]> {
    return publishingService.searchPublisherPackages(filters);
  }

  public async markManuallyPublished(
    input: MarkManuallyPublishedInput,
    actor: WorkflowActor
  ): Promise<Phase22PublishingRecord> {
    return publishingService.markManuallyPublished(input, actor);
  }

  public async markPublishingFailed(
    input: MarkPublishingFailedInput,
    actor: WorkflowActor
  ): Promise<Phase22PublishingRecord> {
    return publishingService.markContentPublishingFailed(input, actor);
  }

  public async retryPublishing(
    contentId: string,
    platformInput: string | PlatformType,
    actor: WorkflowActor,
    notes?: string
  ): Promise<Phase22PublishingRecord> {
    return publishingService.retryContentPublishing(contentId, platformInput, actor, notes);
  }

  public async getPublishingRecord(
    contentId: string,
    platformInput: string | PlatformType
  ): Promise<Phase22PublishingRecord | null> {
    return publishingService.getPublishingRecord(contentId, platformInput);
  }
}

export const phase22PublishingHubService = Phase22PublishingHubService.getInstance();
