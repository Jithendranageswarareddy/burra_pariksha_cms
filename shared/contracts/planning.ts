/**
 * BURRA PARIKSHA CMS — Planning & Similarity Contracts
 * Cross-asset relationships and pedagogical diversity telemetry
 */

import {
  ContentMaster,
  MediaAsset,
  PinnedComment,
  Publishing,
  Script,
  SocialReviewRecord,
  Thumbnail,
  Video,
} from '../types/content';
import { Question } from '../types/question';
import { Assignment } from '../types/user';
import { AuditLog, Workflow } from '../types/audit';
import {
  DifficultyLevel,
  PriorityLevel,
  QuestionLanguage,
  QuestionStyle,
  ContentPlanStatus,
  ContentBatchStatus,
} from '../constants/enums';

export interface CreateContentPlanInput {
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;
  difficulty: DifficultyLevel;
  language?: QuestionLanguage;
  targetQuestionCount: number;
  realWorldContext?: string;
  questionStyle?: QuestionStyle;
  priority?: PriorityLevel;
  plannedDate: string;
  notes?: string;
}

export interface UpdateContentPlanInput {
  targetQuestionCount?: number;
  difficulty?: DifficultyLevel;
  language?: QuestionLanguage;
  realWorldContext?: string;
  questionStyle?: QuestionStyle;
  priority?: PriorityLevel;
  plannedDate?: string;
  status?: ContentPlanStatus;
  notes?: string;
}

export interface CreateContentBatchInput {
  name: string;
  description?: string;
  planId: string;
  targetCount: number;
  priority?: PriorityLevel;
  plannedDate: string;
  questionIds?: string[];
}

export interface UpdateContentBatchInput {
  name?: string;
  description?: string;
  targetCount?: number;
  priority?: PriorityLevel;
  plannedDate?: string;
  status?: ContentBatchStatus;
  questionIds?: string[];
}

export interface GenerateContentPlanRecommendationInput {
  topicId?: string;
  targetTotalCount?: number;
  language?: QuestionLanguage;
  preferredDifficulties?: DifficultyLevel[];
  focusContext?: string;
}

export interface ContentMasterDetails {
  contentMaster: ContentMaster;
  primaryQuestion?: Question;
  questions: Question[];
  videos: Video[];
  scripts: Script[];
  thumbnails: Thumbnail[];
  pinnedComments: PinnedComment[];
  publishingRecords: Publishing[];
  socialReviews?: SocialReviewRecord[];
  assignments: Assignment[];
  auditLogs: AuditLog[];
  workflows: Workflow[];
  mediaAssets?: MediaAsset[];
}

export interface QuestionSimilarityMatch {
  sourceQuestionId: string;
  sourceText: string;
  matchedQuestionId: string;
  matchedText: string;
  similarityScore: number;
  type: 'EXACT_DUPLICATE' | 'HIGH_SIMILARITY' | 'STRUCTURAL_PATTERN';
  reason: string;
}

export interface ContentDiversityWarning {
  type: 'SIMILARITY_CLUSTER' | 'STRUCTURAL_PATTERN' | 'SUBTOPIC_CONCENTRATION' | 'DIFFICULTY_SKEW' | 'STYLE_OVERUSE' | string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | 'WARNING' | 'CRITICAL' | string;
  title?: string;
  description?: string;
  message?: string;
  affectedEntities?: string[];
  affectedQuestionIds?: string[];
  recommendation?: string;
  suggestedAction?: string;
}

export interface DiversityRadarReport {
  scannedQuestionsCount: number;
  exactDuplicatesCount: number;
  highSimilarityMatchesCount: number;
  similarityMatches: QuestionSimilarityMatch[];
  diversityWarnings: ContentDiversityWarning[];
  taxonomyConcentrations: {
    topicId: string;
    topicName: string;
    questionCount: number;
    shareOfTotal: number;
  }[];
  healthScore: number; // 0 to 100
  generatedAt: string;
}
