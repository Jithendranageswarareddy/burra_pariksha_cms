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
