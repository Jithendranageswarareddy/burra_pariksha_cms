/**
 * BURRA PARIKSHA CMS - Phase 26 AI Production Copilot Types
 * 
 * Provides strict domain contracts for advisory AI Copilot capabilities,
 * source version locking, provenance tracking, and zero-autonomous-publishing safety.
 */

import { AIProvenance } from './phase24-ai';
import { DifficultyLevel, QuestionLanguage, QuestionStyle } from './index';

export type CopilotCapability =
  | 'NEXT_TASK_RECOMMENDATION'
  | 'QUESTION_IMPROVEMENT'
  | 'DIFFICULTY_RECOMMENDATION'
  | 'CONTEXT_SUGGESTION'
  | 'QUESTION_STYLE_SUGGESTION'
  | 'SCRIPT_GENERATION'
  | 'SCRIPT_IMPROVEMENT'
  | 'THUMBNAIL_SUGGESTION'
  | 'PINNED_COMMENT_SUGGESTION'
  | 'TITLE_SUGGESTION'
  | 'CAPTION_SUGGESTION'
  | 'HASHTAG_SUGGESTION'
  | 'BOTTLENECK_DETECTION'
  | 'REVIEW_FEEDBACK_SUMMARIZATION';

export interface CopilotBaseSuggestion<T = any> {
  id: string;
  capability: CopilotCapability;
  contentId?: string;
  sourceEntityType?: 'QUESTION' | 'SCRIPT' | 'VIDEO' | 'REVIEW' | 'PRODUCTION_SYSTEM' | 'SOCIAL_REVIEW';
  sourceVersionHash: string;
  isStale: boolean;
  isAdvisoryOnly: true; // Hard-coded invariant: Suggestions are NEVER autonomous actions
  provenance: AIProvenance;
  data: T;
  advisoryDisclaimer: string;
  createdAt: string;
}

// 1. Next Task Recommendation
export interface NextTaskRecommendationData {
  recommendedAction: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  targetContentId?: string;
  targetQueue: string;
  workflowStage: string;
  rationale: string;
  blockersDetected: string[];
  assignedActorId?: string;
  publishingReadiness?: string;
}

// 2. Question Improvement
export interface QuestionImprovementData {
  overallQualityRating: 'EXCELLENT' | 'GOOD' | 'NEEDS_WORK' | 'POOR';
  strengths: string[];
  weaknesses: string[];
  improvedContent?: string;
  improvedOptionA?: string;
  improvedOptionB?: string;
  improvedOptionC?: string;
  improvedOptionD?: string;
  improvedExplanation?: string;
  distractorAnalysis: {
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
  };
  pedagogicalTips: string[];
}

// 3. Difficulty Recommendation
export interface DifficultyRecommendationData {
  assessedDifficulty: DifficultyLevel;
  confidenceScore: number;
  cognitiveLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE';
  justification: string;
  complexityFactors: string[];
  recommendedAdjustments?: string;
}

// 4. Context Suggestions
export interface ContextSuggestionItem {
  contextCategory: 'TELUGU_CULTURE' | 'HISTORICAL_EVENT' | 'EXAM_SCENARIO' | 'DAILY_LIFE' | 'CURRENT_AFFAIRS';
  contextTitle: string;
  scenarioDescription: string;
  recommendedHook: string;
  targetAudience: string;
}

export interface ContextSuggestionData {
  topicContext: string;
  contexts: ContextSuggestionItem[];
}

// 5. Question Style Suggestions
export interface QuestionStyleSuggestionItem {
  style: QuestionStyle;
  suitabilityScore: number;
  rationale: string;
  reframedExample: string;
}

export interface QuestionStyleSuggestionData {
  currentStyle?: QuestionStyle;
  recommendedStyles: QuestionStyleSuggestionItem[];
}

// 6. Script Generation
export interface ScriptSection {
  sectionName: 'HOOK' | 'SETUP' | 'QUESTION' | 'OPTIONS' | 'THINKING_PAUSE' | 'REVEAL' | 'EXPLANATION' | 'OUTRO_CTA';
  dialogueTelugu: string;
  dialogueEnglish?: string;
  visualDirection: string;
  durationSeconds: number;
}

export interface ScriptGenerationData {
  title: string;
  targetDurationSeconds: number;
  hookStyle: string;
  sections: ScriptSection[];
  totalEstimatedSeconds: number;
  voiceoverTone: string;
  pacingNotes: string;
}

// 7. Script Improvement
export interface ScriptImprovementData {
  retentionRating: 'HIGH' | 'MODERATE' | 'LOW';
  pacingFeedback: string;
  originalDurationEstimate: number;
  improvedDurationEstimate: number;
  improvedSections: ScriptSection[];
  teluguDictionNotes: string[];
  keyImprovements: string[];
}

// 8. Thumbnail Suggestions
export interface ThumbnailConcept {
  conceptId: string;
  headlineText: string; // Max 3-5 words
  subtext?: string;
  focalElement: string;
  colorScheme: {
    background: string;
    text: string;
    accent: string;
  };
  curiosityTrigger: string;
  compositionNotes: string;
}

export interface ThumbnailSuggestionData {
  concepts: ThumbnailConcept[];
  bestPracticesNotice: string;
}

// 9. Pinned Comment Suggestions
export interface PinnedCommentItem {
  style: 'ENGAGEMENT_QUESTION' | 'DEEP_DIVE_EXPLANATION' | 'COMMUNITY_CHALLENGE' | 'POLL_TRIGGER';
  commentText: string;
  engagementGoal: string;
  suggestedFollowUpReply?: string;
}

export interface PinnedCommentSuggestionData {
  suggestions: PinnedCommentItem[];
}

// 10. Title Suggestions
export interface TitleSuggestionItem {
  titleText: string;
  style: 'CURIOSITY_GAP' | 'DIRECT_CHALLENGE' | 'EXAM_PREP' | 'PROVOCATIVE_QUESTION';
  characterCount: number;
  platformFit: Array<'YOUTUBE_SHORTS' | 'INSTAGRAM_REELS' | 'FACEBOOK'>;
  expectedCTRRating: 'VERY_HIGH' | 'HIGH' | 'MODERATE';
}

export interface TitleSuggestionData {
  titles: TitleSuggestionItem[];
}

// 11. Caption Suggestions
export interface CaptionSuggestionData {
  youtubeShortsCaption: string;
  instagramReelsCaption: string;
  facebookWatchCaption: string;
  seoKeywords: string[];
}

// 12. Hashtag Suggestions
export interface HashtagSuggestionData {
  primaryTags: string[];
  topicTags: string[];
  trendingExamTags: string[];
  allTagsFormatted: string;
  tagCount: number;
}

// 13. Bottleneck Detection
export interface ProductionBottleneckItem {
  bottleneckId: string;
  stage: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  affectedItemCount: number;
  impactDescription: string;
  rootCauseAnalysis: string;
  actionableRemedies: string[];
  affectedContentIds: string[];
}

export interface BottleneckDetectionData {
  systemHealthSummary: string;
  totalActiveItems: number;
  totalBlockersDetected: number;
  bottlenecks: ProductionBottleneckItem[];
  urgentActionRequired: boolean;
  generatedAt: string;
}

// 14. Review Feedback Summarization
export interface ReviewFeedbackSummaryData {
  totalReviewsAnalyzed: number;
  contentId?: string;
  recurringFlaws: string[];
  recurringPraise: string[];
  suggestedActionItems: string[];
  reviewSourceReferences: Array<{
    reviewId: string;
    reviewerName?: string;
    verdict: string;
    keyQuote: string;
    timestamp: string;
  }>;
  executiveSummary: string;
}

export type CopilotNextTaskSuggestion = CopilotBaseSuggestion<NextTaskRecommendationData>;
export type CopilotQuestionImprovementSuggestion = CopilotBaseSuggestion<QuestionImprovementData>;
export type CopilotDifficultySuggestion = CopilotBaseSuggestion<DifficultyRecommendationData>;
export type CopilotContextSuggestion = CopilotBaseSuggestion<ContextSuggestionData>;
export type CopilotQuestionStyleSuggestion = CopilotBaseSuggestion<QuestionStyleSuggestionData>;
export type CopilotScriptGenerationSuggestion = CopilotBaseSuggestion<ScriptGenerationData>;
export type CopilotScriptImprovementSuggestion = CopilotBaseSuggestion<ScriptImprovementData>;
export type CopilotThumbnailSuggestion = CopilotBaseSuggestion<ThumbnailSuggestionData>;
export type CopilotPinnedCommentSuggestion = CopilotBaseSuggestion<PinnedCommentSuggestionData>;
export type CopilotTitleSuggestion = CopilotBaseSuggestion<TitleSuggestionData>;
export type CopilotCaptionSuggestion = CopilotBaseSuggestion<CaptionSuggestionData>;
export type CopilotHashtagSuggestion = CopilotBaseSuggestion<HashtagSuggestionData>;
export type CopilotBottleneckSuggestion = CopilotBaseSuggestion<BottleneckDetectionData>;
export type CopilotReviewSummarySuggestion = CopilotBaseSuggestion<ReviewFeedbackSummaryData>;
