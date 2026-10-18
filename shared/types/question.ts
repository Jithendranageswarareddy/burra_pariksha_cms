/**
 * BURRA PARIKSHA CMS — Question Types
 * Canonical question and draft entity contracts
 */

import {
  DifficultyLevel,
  QuestionLanguage,
  QuestionStatus,
  QuestionStyle,
  QuestionValidationStatus,
  VideoProductionStatus,
} from '../constants/enums';
import {
  QuestionBatchRejectedItem,
  QuestionBatchSlot,
  QuestionBatchStatus,
} from '../contracts/question-generation/question-generation.contract';

export interface ExplainedQuestionItem {
  slotId?: string;
  questionNumber: number;
  questionText: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  trickOrPitfall?: string;
  difficulty?: DifficultyLevel | string;
}

export interface Question {
  id: string; // e.g. qst_uuid or BP-Q-1042
  contentId?: string; // Canonical correlation identity BP-CNT-######
  contentMasterId?: string; // Reference to ContentMaster.id
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: DifficultyLevel | string;
  language?: QuestionLanguage | string;
  questionText: string;
  question?: string; // Production question contract alias
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  questionStyle?: QuestionStyle | string;
  status: QuestionStatus;
  videoStatus: VideoProductionStatus;
  tags?: string[];
  source?: string;
  aiPromptUsed?: string;
  aiModel?: string;
  aiPrompt?: string;
  originalityScore?: number;
  validationStatus?: QuestionValidationStatus | string;
  lastValidationId?: string;
  validationScore?: number;
  authorId?: string;
  author?: string; // Production question contract alias
  generationMode?: 'SUBTOPIC' | 'RANDOM' | string;
  productionMode?: string;
  targetQuestionCount?: number;
  aspectRatio?: string;
  introductoryConcept?: string;
  conceptTitle?: string;
  syllabusScopeNotes?: string;
  questions?: ExplainedQuestionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionDraft {
  id: string; // e.g. dft_uuid or BP-DFT-1042
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;
  difficulty: DifficultyLevel | string;
  language?: QuestionLanguage | string;
  questionText: string;
  question?: string; // Compatibility alias
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  questionStyle?: QuestionStyle | string;
  generationMode?: 'SUBTOPIC' | 'RANDOM' | string;
  productionMode?: string;
  targetQuestionCount?: number;
  aspectRatio?: string;
  introductoryConcept?: string;
  conceptTitle?: string;
  syllabusScopeNotes?: string;
  questions?: ExplainedQuestionItem[];
  tags?: string[];
  source?: string;
  sourceModel?: string;
  generationLatencyMs?: number;
  isFallback?: boolean;
  mathematicalVerification?: any;
  authorId?: string;
  authorName?: string;
  author?: string;
  workflowStage?: string;
  workflowInstanceId?: string;
  status: QuestionStatus | string;
  createdAt: string;
  updatedAt: string;
  version?: number;
  isDeleted?: boolean;
  batchStatus?: QuestionBatchStatus;
  persistedValidCount?: number;
  rejectedCount?: number;
  overflowCount?: number;
  slots?: QuestionBatchSlot[];
  rejectedItems?: QuestionBatchRejectedItem[];
  reviewerFeedback?: string;
  reviewerId?: string;
  reviewerName?: string;
  returnedAt?: string;
  returnReason?: string;
  revisionCount?: number;
}

export interface QuestionCandidate {
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: DifficultyLevel;
  language: QuestionLanguage;
  real_world_context?: string;
  question_style?: string;
  challenge_type?: string;
  presentation_type?: string;
  taxonomy?: {
    topicId: string;
    topicName?: string;
    subtopicId: string;
    subtopicName?: string;
  };
  mathematicalVerification?: any;
}

export type QuestionConfigDimension = 'REAL_LIFE_CONTEXT' | 'QUESTION_STYLE';

export interface QuestionConfigEntry {
  id: string;
  dimension: QuestionConfigDimension | string;
  code: string;
  displayLabel: string;
  description?: string;
  aiPromptGuidance?: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  updatedAt: string;
}

export interface GroupedQuestionConfig {
  realLifeContexts: QuestionConfigEntry[];
  questionStyles: QuestionConfigEntry[];
  defaultRealLifeContext: QuestionConfigEntry | null;
  defaultQuestionStyle: QuestionConfigEntry | null;
}

export interface QuestionStudioConfigResponse {
  realLifeContexts: QuestionConfigEntry[];
  questionStyles: QuestionConfigEntry[];
  defaults: {
    realLifeContext: string;
    questionStyle: string;
    difficulty?: string;
    language?: string;
    defaultRealLifeContext: QuestionConfigEntry | null;
    defaultQuestionStyle: QuestionConfigEntry | null;
  };
  defaultRealLifeContext: QuestionConfigEntry | null;
  defaultQuestionStyle: QuestionConfigEntry | null;
  difficulties?: Array<{ id: string; name: string; description?: string }>;
  challengeTypes?: Array<{ id: string; name: string; description?: string }>;
  presentationTypes?: Array<{ id: string; name: string; description?: string }>;
  languages?: Array<{ id: string; name: string; code: string }>;
}

export interface QuestionFilterInput {
  search?: string;
  topicId?: string;
  subtopicId?: string;
  difficulty?: DifficultyLevel;
  status?: QuestionStatus;
  videoStatus?: VideoProductionStatus;
}
