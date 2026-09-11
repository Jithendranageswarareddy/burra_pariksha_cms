/**
 * BURRA PARIKSHA CMS - Mock Data Aggregator & Repository
 * Phase 1: Isolated mock layer to be replaced by Google Sheets API in Phase 2.
 */

export * from './taxonomy';
export * from './questions';
export * from './production';
export * from './queue';
export * from './publishing';
export * from './dashboard';
export * from './content-masters';

import { MOCK_QUESTIONS } from './questions';
import { MOCK_VIDEOS } from './production';
import { MOCK_CATEGORIES, MOCK_TOPICS, MOCK_SUBTOPICS } from './taxonomy';

// Helper query functions to simulate future repository patterns
export function getQuestionById(id: string) {
  return MOCK_QUESTIONS.find((q) => q.id === id) || null;
}

export function getVideoById(id: string) {
  return MOCK_VIDEOS.find((v) => v.id === id) || null;
}

export function getTopicsByCategoryId(categoryId: string) {
  return MOCK_TOPICS.filter((t) => t.categoryId === categoryId);
}

export function getSubtopicsByTopicId(topicId: string) {
  return MOCK_SUBTOPICS.filter((s) => s.topicId === topicId);
}
