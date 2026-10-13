/**
 * BURRA PARIKSHA CMS - Taxonomy Feature API
 * S7-T11: Canonical Feature-Oriented API Boundary
 *
 * Exposes feature-oriented API functions for the 2-tier taxonomy (Topic -> Subtopic).
 */

import { PureTaxonomyTreeItem, Subtopic, TaxonomyMetrics, Topic } from '../../shared';
import { apiClient } from './api-client';

export const taxonomyApi = {
  /**
   * Retrieves summary of active topics and subtopics.
   */
  async getSummary(): Promise<{ topics: Topic[]; subtopics: Subtopic[] }> {
    return apiClient.getTaxonomySummary();
  },

  /**
   * Retrieves topics matching optional search and filter criteria.
   */
  async getTopics(options?: { search?: string; includeInactive?: boolean }): Promise<Topic[]> {
    return apiClient.getTopics(options);
  },

  /**
   * Retrieves a topic by canonical ID.
   */
  async getTopicById(id: string): Promise<Topic> {
    return apiClient.getTopicById(id);
  },

  /**
   * Creates a new topic.
   */
  async createTopic(data: Partial<Topic>): Promise<Topic> {
    return apiClient.createTopic(data);
  },

  /**
   * Updates an existing topic.
   */
  async updateTopic(id: string, data: Partial<Topic>): Promise<Topic> {
    return apiClient.updateTopic(id, data);
  },

  /**
   * Toggles active state of a topic.
   */
  async toggleTopicActive(id: string, isActive: boolean): Promise<Topic> {
    return apiClient.toggleTopicActive(id, isActive);
  },

  /**
   * Retrieves subtopics for an optional parent topic.
   */
  async getSubtopics(
    topicId?: string,
    options?: { search?: string; includeInactive?: boolean }
  ): Promise<Subtopic[]> {
    return apiClient.getSubtopics(topicId, options);
  },

  /**
   * Retrieves a subtopic by canonical ID.
   */
  async getSubtopicById(id: string): Promise<Subtopic> {
    return apiClient.getSubtopicById(id);
  },

  /**
   * Creates a new subtopic under a parent topic.
   */
  async createSubtopic(data: Partial<Subtopic>): Promise<Subtopic> {
    return apiClient.createSubtopic(data);
  },

  /**
   * Updates an existing subtopic.
   */
  async updateSubtopic(id: string, data: Partial<Subtopic>): Promise<Subtopic> {
    return apiClient.updateSubtopic(id, data);
  },

  /**
   * Toggles active state of a subtopic.
   */
  async toggleSubtopicActive(id: string, isActive: boolean): Promise<Subtopic> {
    return apiClient.toggleSubtopicActive(id, isActive);
  },

  /**
   * Retrieves hierarchical 2-tier pure taxonomy tree.
   */
  async getTree(options?: { includeInactive?: boolean }): Promise<PureTaxonomyTreeItem[]> {
    return apiClient.getPureTaxonomyTree(options);
  },

  /**
   * Retrieves taxonomy metrics and health diagnostics.
   */
  async getMetrics(): Promise<TaxonomyMetrics> {
    return apiClient.getTaxonomyMetrics();
  },
};
