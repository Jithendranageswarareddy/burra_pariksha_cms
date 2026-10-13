/**
 * BURRA PARIKSHA CMS - Publishing Feature API
 * S7-T11: Canonical Feature-Oriented API Boundary
 *
 * Exposes feature-oriented API functions for Multi-Platform Publishing (Stages 11-14).
 */

import { Publishing, Video } from '../../shared';
import { apiClient } from './api-client';

export const publishingApi = {
  /**
   * Retrieves publishing record by ID (or publishing status).
   */
  async getStatus(id: string): Promise<Publishing> {
    return apiClient.getPublishingById(id);
  },

  /**
   * Retrieves all publishing records.
   */
  async getPublishingRecords(): Promise<Publishing[]> {
    return apiClient.getPublishing();
  },

  /**
   * Retrieves publishing record associated with a video.
   */
  async getVideoPublishing(videoId: string): Promise<Publishing> {
    return apiClient.getVideoPublishing(videoId);
  },

  /**
   * Updates publishing record details.
   */
  async updatePublishing(id: string, updates: Partial<Publishing>): Promise<Publishing> {
    return apiClient.updatePublishing(id, updates);
  },

  /**
   * Marks a specific platform published.
   */
  async markPlatformPublished(
    videoId: string,
    platform: 'youtube' | 'instagram' | 'facebook',
    postUrl: string,
    notes?: string
  ): Promise<Publishing> {
    return apiClient.markPlatformPublished(videoId, platform, postUrl, notes);
  },

  /**
   * Records publication across one or more platforms.
   */
  async recordPublication(input: {
    videoId: string;
    platform: 'youtube' | 'instagram' | 'facebook';
    postUrl: string;
    notes?: string;
  }): Promise<Publishing> {
    return apiClient.markPlatformPublished(input.videoId, input.platform, input.postUrl, input.notes);
  },
};
