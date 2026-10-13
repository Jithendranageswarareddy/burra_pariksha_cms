/**
 * BURRA PARIKSHA CMS - Videos Feature API
 * S7-T11: Canonical Feature-Oriented API Boundary
 *
 * Exposes feature-oriented API functions for Video Lifecycle Stages (03-10).
 */

import { Assignment, Video, VideoProductionStatus } from '../../shared';
import { apiClient } from './api-client';

export const videosApi = {
  /**
   * Retrieves videos matching optional filters.
   */
  async getVideos(filter?: {
    status?: string;
    topicId?: string;
    assigneeId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Video[]> {
    return apiClient.getVideos(filter);
  },

  /**
   * Retrieves a single video record by ID.
   */
  async getVideoById(id: string): Promise<Video> {
    return apiClient.getVideoById(id);
  },

  /**
   * Queues a video item for production.
   */
  async queueVideo(input: {
    questionId: string;
    targetPlatform?: string;
    notes?: string;
    priority?: string;
  }): Promise<Video> {
    return apiClient.queueVideo(input);
  },

  /**
   * Updates video workflow lifecycle status.
   */
  async updateVideoStatus(
    id: string,
    status: VideoProductionStatus | string,
    remarks?: string
  ): Promise<Video> {
    return apiClient.updateVideoStatus(id, status, remarks);
  },

  /**
   * Assigns video production responsibility.
   */
  async assignVideo(
    id: string,
    assignment: {
      assigneeId: string;
      assigneeName: string;
      taskType?: string;
      dueDate?: string;
      notes?: string;
    }
  ): Promise<Assignment | { assignment: Assignment; video: Video }> {
    return apiClient.assignVideo(id, assignment);
  },

  /**
   * Updates video metadata and production fields.
   */
  async updateVideoMetadata(id: string, updates: Partial<Video>): Promise<Video> {
    return apiClient.updateVideoMetadata(id, updates);
  },

  /**
   * Constructs the canonical download URL for video raw or edited footage.
   */
  getVideoDownloadUrl(videoId: string, assetId?: string): string {
    return apiClient.getVideoDownloadUrl(videoId, assetId);
  },

  /**
   * Constructs the canonical download URL for thumbnail asset.
   */
  getThumbnailDownloadUrl(thumbnailId: string): string {
    return apiClient.getThumbnailDownloadUrl(thumbnailId);
  },
};
