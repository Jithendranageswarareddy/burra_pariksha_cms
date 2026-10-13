/**
 * BURRA PARIKSHA CMS — Two-Tier Taxonomy Types
 * Authoritative Architecture: TOPIC -> SUBTOPIC (Zero Category)
 */

export interface Topic {
  id: string; // e.g. top_uuid or TOP-101
  name: string;
  slug: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  subtopicsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Subtopic {
  id: string; // e.g. sub_uuid or SUB-1001
  topicId: string; // Mandatory link to parent Topic.id
  name: string;
  slug: string;
  description?: string;
  notes?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PureTaxonomyTreeItem extends Topic {
  subtopics: Subtopic[];
}

export interface TaxonomyMetrics {
  totalTopics: number;
  totalSubtopics: number;
  activeTopics: number;
  activeSubtopics: number;
  targetTopics?: number;
  targetSubtopicsPerTopic?: number;
  targetTotalSubtopics?: number;
  missingSubtopics?: number;
  completeTopicsCount?: number;
  incompleteTopicsCount?: number;
  completeTopicIds?: string[];
  incompleteTopicIds?: string[];
  subtopicsByTopic?: Record<string, number>;
  hasDataGap?: boolean;
  dataGapMessage?: string;
}
