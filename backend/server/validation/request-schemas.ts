/**
 * BURRA PARIKSHA CMS — Authoritative HTTP Request Validation Schemas
 *
 * Generic request-validation Zod schemas and input types for all API endpoints.
 * Cloud Firestore is the authoritative transactional datastore.
 */

import { z } from 'zod';
import {
  AssignmentEntityType,
  ContentBatchStatus,
  ContentMasterStatus,
  ContentPlanStatus,
  DifficultyLevel,
  PriorityLevel,
  QuestionLanguage,
  QuestionStatus,
  QuestionStyle,
  SocialPublishStatus,
  VideoProductionStatus,
} from '../../../shared';

export {
  CreateLearningUnitPlanningRequestSchema,
  UpdateLearningUnitPlanningRequestSchema,
  SubmitLearningUnitForVerificationRequestSchema,
  LearningUnitPlanningFilterSchema,
  EditorialCalendarFilterSchema,
} from '../../../shared/contracts/learning-unit-planning.contract';

// ============================================================================
// 1. QUESTION STUDIO CONFIG SCHEMAS
// ============================================================================

export const QuestionConfigEntryZodSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  dimension: z.enum(['REAL_LIFE_CONTEXT', 'QUESTION_STYLE']),
  code: z.string().min(1, 'Code is required'),
  displayLabel: z.string().min(1, 'Display label is required'),
  description: z.string().optional(),
  aiPromptGuidance: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  updatedAt: z.string().optional(),
});

export type QuestionConfigEntryZodInput = z.infer<typeof QuestionConfigEntryZodSchema>;

// ============================================================================
// 2. QUESTION INPUT SCHEMAS
// ============================================================================

const QuestionInputBaseSchema = z.object({
  id: z.string().optional(),
  learningUnitId: z.string().optional(),
  contentId: z.string().optional(),
  contentMasterId: z.string().optional(),
  topicId: z.string().min(1, 'Topic ID is required'),
  topicName: z.string().optional(),
  subtopicId: z.string().min(1, 'Subtopic ID is required'),
  subtopicName: z.string().optional(),
  difficulty: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const u = val.toUpperCase().trim();
        if (u === 'INTERMEDIATE' || u === 'MEDIUM') return DifficultyLevel.MEDIUM;
        if (u === 'EASY') return DifficultyLevel.EASY;
        if (u === 'HARD') return DifficultyLevel.HARD;
      }
      return val;
    },
    z.nativeEnum(DifficultyLevel)
  ),
  language: z.string().optional().default('TELUGU'),
  questionText: z.string().min(5, 'Question text must be at least 5 characters'),
  question: z.string().optional(),
  options: z.object({
    a: z.string().min(1, 'Option A is required'),
    b: z.string().min(1, 'Option B is required'),
    c: z.string().min(1, 'Option C is required'),
    d: z.string().min(1, 'Option D is required'),
  }),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(5, 'Explanation must be at least 5 characters'),
  realWorldContext: z.string().optional(),
  realLifeContext: z.string().optional(),
  challengeType: z.string().optional(),
  presentationType: z.string().optional(),
  questionStyle: z.union([z.nativeEnum(QuestionStyle), z.string()]).optional(),
  status: z.nativeEnum(QuestionStatus).optional().default(QuestionStatus.GENERATED),
  videoStatus: z.nativeEnum(VideoProductionStatus).optional().default(VideoProductionStatus.NOT_STARTED),
  tags: z.array(z.string()).optional().default([]),
  source: z.string().optional(),
  aiPromptUsed: z.string().optional(),
  aiModel: z.string().optional(),
  aiPrompt: z.string().optional(),
  originalityScore: z.number().optional(),
  authorId: z.string().optional(),
  author: z.string().optional(),
  generationMode: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  validationStatus: z.string().optional(),
  validationScore: z.number().optional(),
  lastValidationId: z.string().optional(),
});

function normalizeQuestionInput(val: any) {
  if (val && typeof val === 'object') {
    const copy = { ...val };
    if (copy.content && !copy.questionText && !copy.question) {
      copy.questionText = copy.content;
      copy.question = copy.content;
    }
    if (copy.question && !copy.questionText) {
      copy.questionText = copy.question;
    }
    if (copy.questionText && !copy.question) {
      copy.question = copy.questionText;
    }
    if (!copy.options && (copy.optionA !== undefined || copy.optionB !== undefined)) {
      copy.options = {
        a: copy.optionA || '',
        b: copy.optionB || '',
        c: copy.optionC || '',
        d: copy.optionD || '',
      };
    } else if (copy.options && typeof copy.options === 'object') {
      if (copy.optionA === undefined && copy.options.a !== undefined) copy.optionA = copy.options.a;
      if (copy.optionB === undefined && copy.options.b !== undefined) copy.optionB = copy.options.b;
      if (copy.optionC === undefined && copy.options.c !== undefined) copy.optionC = copy.options.c;
      if (copy.optionD === undefined && copy.options.d !== undefined) copy.optionD = copy.options.d;
    }
    if (copy.realLifeContext && !copy.realWorldContext) {
      copy.realWorldContext = copy.realLifeContext;
    } else if (copy.realWorldContext && !copy.realLifeContext) {
      copy.realLifeContext = copy.realWorldContext;
    }
    if (copy.contentId && !copy.contentMasterId) {
      copy.contentMasterId = copy.contentId;
    } else if (copy.contentMasterId && !copy.contentId) {
      copy.contentId = copy.contentMasterId;
    }
    if (copy.author && !copy.authorId) {
      copy.authorId = copy.author;
    } else if (copy.authorId && !copy.author) {
      copy.author = copy.authorId;
    }
    return copy;
  }
  return val;
}

export const CreateQuestionInputSchema = z.preprocess(normalizeQuestionInput, QuestionInputBaseSchema);
export type CreateQuestionInput = z.input<typeof CreateQuestionInputSchema>;
export type CreateQuestionOutput = z.infer<typeof CreateQuestionInputSchema>;

export const UpdateQuestionInputSchema = z.preprocess(
  normalizeQuestionInput,
  QuestionInputBaseSchema.partial().extend({
    id: z.string().min(1, 'Question ID is required for updates'),
  })
);
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionInputSchema>;

export const QuestionFilterSchema = z.object({
  search: z.string().optional(),
  topicId: z.string().optional(),
  subtopicId: z.string().optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  status: z.nativeEnum(QuestionStatus).optional(),
  videoStatus: z.nativeEnum(VideoProductionStatus).optional(),
});
export type QuestionFilterInput = z.infer<typeof QuestionFilterSchema>;

// ============================================================================
// 3. VIDEO VALIDATION SCHEMAS
// ============================================================================

export const QueueVideoInputSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  learningUnitId: z.string().optional(),
  title: z.string().optional(),
  priority: z.nativeEnum(PriorityLevel).optional().default(PriorityLevel.NORMAL),
  assignedHost: z.string().optional(),
  assignedEditor: z.string().optional(),
  notes: z.string().optional(),
  targetDurationSeconds: z.number().positive().optional().default(45),
});
export type QueueVideoInput = z.infer<typeof QueueVideoInputSchema>;

export const UpdateVideoStatusInputSchema = z.object({
  status: z.nativeEnum(VideoProductionStatus),
  remarks: z.string().optional(),
  actualDurationSeconds: z.number().positive().optional(),
});
export type UpdateVideoStatusInput = z.infer<typeof UpdateVideoStatusInputSchema>;

export const UpdateVideoPriorityInputSchema = z.object({
  priority: z.nativeEnum(PriorityLevel),
  remarks: z.string().optional(),
});
export type UpdateVideoPriorityInput = z.infer<typeof UpdateVideoPriorityInputSchema>;

export const AssignVideoInputSchema = z.object({
  assigneeId: z.string().min(1, 'Assignee ID is required'),
  assigneeName: z.string().min(1, 'Assignee Name is required'),
  taskType: z.enum(['SCRIPTING', 'RECORDING', 'EDITING', 'THUMBNAIL', 'REVIEW']).optional().default('RECORDING'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});
export type AssignVideoInput = z.infer<typeof AssignVideoInputSchema>;

export const UpdateVideoMetadataInputSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  targetDurationSeconds: z.number().positive().optional(),
  actualDurationSeconds: z.number().positive().optional(),
  assignedHost: z.string().optional(),
  assignedEditor: z.string().optional(),
  driveFolderUrl: z.string().optional(),
  rawFootagePath: z.string().optional(),
  finalRenderPath: z.string().optional(),
  finalRenderWidth: z.number().positive().optional(),
  finalRenderHeight: z.number().positive().optional(),
  finalRenderFormat: z.string().optional(),
  finalRenderAspectRatio: z.string().optional(),
  finalRenderValidationStatus: z.enum(['NOT_VALIDATED', 'VALID', 'INVALID', 'NEEDS_REVIEW']).optional(),
  youtubeId: z.string().optional(),
  scheduledRecordingDate: z.string().optional(),
  scheduledPublishDate: z.string().optional(),
});
export type UpdateVideoMetadataInput = z.infer<typeof UpdateVideoMetadataInputSchema>;

export const VideoFilterSchema = z.object({
  search: z.string().optional(),
  topicId: z.string().optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  status: z.nativeEnum(VideoProductionStatus).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  assignedHost: z.string().optional(),
  assignedEditor: z.string().optional(),
});
export type VideoFilterInput = z.infer<typeof VideoFilterSchema>;

// ============================================================================
// 4. SCRIPT, THUMBNAIL, PINNED COMMENT, PUBLISHING SCHEMAS
// ============================================================================

export const SaveScriptInputSchema = z.object({
  hookText: z.string().default(''),
  problemStatement: z.string().default(''),
  stepByStepSolution: z.string().default(''),
  speedTrickOrTakeaway: z.string().default(''),
  callToAction: z.string().default(''),
  notes: z.string().optional(),
  createNewVersion: z.boolean().optional().default(false),
  changeSummary: z.string().optional(),
  editedBy: z.string().optional(),
});
export type SaveScriptInput = z.infer<typeof SaveScriptInputSchema>;

export const SaveThumbnailInputSchema = z.object({
  hookHeadline: z.string().min(1, 'Hook headline is required'),
  driveAssetUrl: z.string().optional(),
  previewUrl: z.string().optional(),
  status: z.enum(['PENDING', 'DESIGNED', 'APPROVED', 'REJECTED']).optional().default('PENDING'),
  createNewVersion: z.boolean().optional().default(false),
  designerNotes: z.string().optional(),
});
export type SaveThumbnailInput = z.infer<typeof SaveThumbnailInputSchema>;

export const SavePinnedCommentInputSchema = z.object({
  commentText: z.string().min(1, 'Comment text is required'),
  solutionBreakdown: z.string().min(1, 'Solution breakdown is required'),
  nextChallengeQuestion: z.string().optional(),
  isApproved: z.boolean().optional().default(false),
});
export type SavePinnedCommentInput = z.infer<typeof SavePinnedCommentInputSchema>;

export const UpdatePublishingInputSchema = z.object({
  youtube: z.object({
    status: z.nativeEnum(SocialPublishStatus).optional(),
    videoUrl: z.string().optional(),
    publishedAt: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  instagram: z.object({
    status: z.nativeEnum(SocialPublishStatus).optional(),
    postUrl: z.string().optional(),
    publishedAt: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  facebook: z.object({
    status: z.nativeEnum(SocialPublishStatus).optional(),
    postUrl: z.string().optional(),
    publishedAt: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  pinnedCommentReady: z.boolean().optional(),
  thumbnailReady: z.boolean().optional(),
});
export type UpdatePublishingInput = z.infer<typeof UpdatePublishingInputSchema>;

// ============================================================================
// 5. PLANNING & BATCH SCHEMAS
// ============================================================================

export const CreateContentPlanInputSchema = z.object({
  topicId: z.string().min(1, 'Topic ID is required'),
  topicName: z.string().optional(),
  subtopicId: z.string().min(1, 'Subtopic ID is required'),
  subtopicName: z.string().optional(),
  difficulty: z.nativeEnum(DifficultyLevel),
  language: z.nativeEnum(QuestionLanguage).optional().default(QuestionLanguage.TELUGU),
  targetQuestionCount: z.number().int().min(1, 'Target question count must be at least 1').max(500, 'Target question count cannot exceed 500'),
  realWorldContext: z.string().optional(),
  questionStyle: z.nativeEnum(QuestionStyle).optional(),
  priority: z.nativeEnum(PriorityLevel).optional().default(PriorityLevel.NORMAL),
  plannedDate: z.string().min(1, 'Planned date is required'),
  notes: z.string().optional(),
});
export type CreateContentPlanInput = z.infer<typeof CreateContentPlanInputSchema>;

export const UpdateContentPlanInputSchema = z.object({
  targetQuestionCount: z.number().int().min(1).max(500).optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  language: z.nativeEnum(QuestionLanguage).optional(),
  realWorldContext: z.string().optional(),
  questionStyle: z.nativeEnum(QuestionStyle).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  plannedDate: z.string().optional(),
  status: z.nativeEnum(ContentPlanStatus).optional(),
  notes: z.string().optional(),
});
export type UpdateContentPlanInput = z.infer<typeof UpdateContentPlanInputSchema>;

export const CreateContentBatchInputSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
  description: z.string().optional(),
  planId: z.string().min(1, 'Linked content plan ID is required'),
  targetCount: z.number().int().min(1, 'Target count must be at least 1').max(200, 'Target count cannot exceed 200'),
  priority: z.nativeEnum(PriorityLevel).optional().default(PriorityLevel.NORMAL),
  plannedDate: z.string().min(1, 'Planned date is required'),
  questionIds: z.array(z.string()).optional().default([]),
});
export type CreateContentBatchInput = z.infer<typeof CreateContentBatchInputSchema>;

export const UpdateContentBatchInputSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetCount: z.number().int().min(1).max(200).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  plannedDate: z.string().optional(),
  status: z.nativeEnum(ContentBatchStatus).optional(),
  questionIds: z.array(z.string()).optional(),
});
export type UpdateContentBatchInput = z.infer<typeof UpdateContentBatchInputSchema>;

export const LinkBatchQuestionsInputSchema = z.object({
  questionIds: z.array(z.string()).min(1, 'At least one Question ID is required'),
  action: z.enum(['ADD', 'REMOVE', 'SET']).optional().default('ADD'),
});
export type LinkBatchQuestionsInput = z.infer<typeof LinkBatchQuestionsInputSchema>;

export const AiContentPlanRequestSchema = z.object({
  topicId: z.string().optional(),
  targetTotalCount: z.number().int().min(5, 'Target total count must be at least 5').max(100, 'Target count capped at 100 per recommendation').default(20),
  language: z.nativeEnum(QuestionLanguage).optional().default(QuestionLanguage.TELUGU),
  preferredDifficulties: z.array(z.nativeEnum(DifficultyLevel)).optional(),
  focusContext: z.string().optional(),
});
export type AiContentPlanRequest = z.infer<typeof AiContentPlanRequestSchema>;

// ============================================================================
// 6. ASSIGNMENTS & USERS SCHEMAS
// ============================================================================

export const AssignmentEntityTypeSchema = z.enum([
  'QUESTION',
  'VIDEO',
  'SCRIPT',
  'THUMBNAIL',
  'PUBLISHING',
  'CONTENT_PLAN',
  'CONTENT_BATCH',
]);

export const CreateAssignmentInputSchema = z.object({
  entityType: z.union([z.nativeEnum(AssignmentEntityType), AssignmentEntityTypeSchema, z.string()]),
  entityId: z.string().min(1, 'Entity ID is required'),
  assigneeId: z.string().min(1, 'Assignee ID is required'),
  assignmentRole: z.string().optional(),
  taskType: z.string().min(1, 'Task type is required'),
  priority: z.nativeEnum(PriorityLevel).optional().default(PriorityLevel.NORMAL),
  dueDate: z.string().optional(),
  dueAt: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentInputSchema>;

export const UpdateAssignmentInputSchema = z.object({
  taskType: z.string().optional(),
  status: z.string().optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  dueDate: z.string().optional(),
  dueAt: z.string().optional(),
  notes: z.string().optional(),
});
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentInputSchema>;

export const ReassignAssignmentInputSchema = z.object({
  newAssigneeId: z.string().min(1, 'New assignee ID is required'),
  notes: z.string().optional(),
});
export type ReassignAssignmentInput = z.infer<typeof ReassignAssignmentInputSchema>;

export const CompleteAssignmentInputSchema = z.object({
  notes: z.string().optional(),
});
export type CompleteAssignmentInput = z.infer<typeof CompleteAssignmentInputSchema>;

export const CancelAssignmentInputSchema = z.object({
  reason: z.string().optional(),
});
export type CancelAssignmentInput = z.infer<typeof CancelAssignmentInputSchema>;

export const CreateUserInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.string().optional(),
  roles: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  password_hash: z.string().optional(),
  last_login_at: z.string().optional(),
}).refine((data) => data.role || (data.roles && data.roles.length > 0), {
  message: 'At least one role or roles array is required',
  path: ['roles'],
});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdateUserInputSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  roles: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  password_hash: z.string().optional(),
  last_login_at: z.string().optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export const CreateContentMasterInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  status: z.union([z.nativeEnum(ContentMasterStatus), z.string()]).optional().default(ContentMasterStatus.ACTIVE),
  primaryQuestionId: z.string().optional(),
  topicId: z.string().optional(),
  subtopicId: z.string().optional(),
  createdBy: z.string().optional(),
});
export type CreateContentMasterInput = z.input<typeof CreateContentMasterInputSchema>;

export const UpdateContentMasterInputSchema = CreateContentMasterInputSchema.partial().extend({
  id: z.string().min(1, 'Content Master ID is required for update'),
  archivedAt: z.string().optional(),
});
export type UpdateContentMasterInput = z.infer<typeof UpdateContentMasterInputSchema>;

// ============================================================================
// 7. TAXONOMY INPUT SCHEMAS
// ============================================================================

export const CreateTopicInputSchema = z.object({
  name: z.string().min(1, 'Topic name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional().default(true),
});
export type CreateTopicInput = z.input<typeof CreateTopicInputSchema>;

export const UpdateTopicInputSchema = z.object({
  id: z.string().min(1, 'Topic ID is required for update'),
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateTopicInput = z.infer<typeof UpdateTopicInputSchema>;

export const CreateSubtopicInputSchema = z.object({
  topicId: z.string().min(1, 'Parent Topic ID is required'),
  name: z.string().min(1, 'Subtopic name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional().default(true),
});
export type CreateSubtopicInput = z.input<typeof CreateSubtopicInputSchema>;

export const UpdateSubtopicInputSchema = z.object({
  id: z.string().min(1, 'Subtopic ID is required for update'),
  topicId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateSubtopicInput = z.infer<typeof UpdateSubtopicInputSchema>;

export const BulkImportTaxonomyItemSchema = z.object({
  name: z.string().min(1, 'Topic name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
  subtopics: z.array(
    z.object({
      name: z.string().min(1, 'Subtopic name is required'),
      slug: z.string().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
      displayOrder: z.number().optional(),
    })
  ).optional().default([]),
});

export const BulkImportTaxonomyInputSchema = z.object({
  topics: z.array(BulkImportTaxonomyItemSchema).min(1, 'At least one topic must be provided for import'),
});
export type BulkImportTaxonomyInput = z.infer<typeof BulkImportTaxonomyInputSchema>;

// ============================================================================
// 8. SOCIAL ANALYTICS & COMMENTS INPUT SCHEMAS
// ============================================================================

export const CreateSocialAnalyticsInputSchema = z.object({
  contentId: z.string().regex(/^BP-CNT-\d{6}$/, 'Invalid content ID format (must be BP-CNT-######)'),
  videoId: z.string().regex(/^BP-V-\d{6}$/, 'Invalid video ID format (must be BP-V-######)').optional(),
  publishingId: z.string().regex(/^PUB-\d{6}$/, 'Invalid publishing ID format (must be PUB-######)').optional(),
  platformPostId: z.string().min(1, 'Platform post ID must be non-empty').optional(),
  platform: z.string().min(1, 'Platform is required'),
  postingTimestamp: z.string().optional(),
  views: z.number().min(0, 'Views must be non-negative').optional().default(0),
  watchTime: z.number().min(0, 'Watch time must be non-negative').optional().default(0),
  retentionRate: z.number().min(0).max(100, 'Retention rate must be between 0 and 100').optional().default(0),
  likes: z.number().min(0).optional().default(0),
  comments: z.number().min(0).optional().default(0),
  shares: z.number().min(0).optional().default(0),
  subscribersGained: z.number().optional().default(0),
  ctr: z.number().min(0).max(100, 'CTR must be between 0 and 100').optional().default(0),
  capturedAt: z.string().optional(),
  topicId: z.string().optional(),
  subtopicId: z.string().optional(),
  difficulty: z.string().optional(),
  challengeType: z.string().optional(),
  language: z.string().optional(),
  presentationType: z.string().optional(),
  notes: z.string().optional(),
});
export type CreateSocialAnalyticsInput = z.infer<typeof CreateSocialAnalyticsInputSchema>;

export const ImportSocialAnalyticsInputSchema = z.object({
  records: z.array(CreateSocialAnalyticsInputSchema).min(1, 'At least one analytics record is required'),
});
export type ImportSocialAnalyticsInput = z.infer<typeof ImportSocialAnalyticsInputSchema>;

export const SocialCommentSourceSchema = z.enum([
  'MANUAL_PASTE',
  'CSV_IMPORT',
  'JSON_IMPORT',
  'API_SYNC',
]);

export const SocialCommentStatusSchema = z.enum([
  'UNPROCESSED',
  'ANALYZED',
  'FLAGGED',
  'IGNORED',
]);

export const CreateSocialCommentInputSchema = z.object({
  contentId: z.string().regex(/^BP-CNT-\d{6}$/, 'Invalid content ID format (must be BP-CNT-######)'),
  videoId: z.string().regex(/^BP-V-\d{6}$/, 'Invalid video ID format (must be BP-V-######)').optional(),
  publishingId: z.string().regex(/^(PUB|BP-PUB)-\d{6}$|^pub_[0-9a-f-]{36}$/i, 'Invalid publishing ID format (must be PUB-######, BP-PUB-######, or pub_<uuid>)').optional(),
  platform: z.enum(['youtube', 'instagram', 'facebook']),
  platformPostId: z.string().min(1, 'Platform post ID must be non-empty when supplied').optional(),
  platformCommentId: z.string().min(1, 'Platform comment ID must be non-empty when supplied').optional(),
  commentText: z.string().min(1, 'Comment text is required'),
  authorDisplayName: z.string().optional(),
  commentCreatedAt: z.string().optional(),
  capturedAt: z.string().optional(),
  likeCount: z.number().int().min(0, 'Like count must be non-negative').optional().default(0),
  replyCount: z.number().int().min(0, 'Reply count must be non-negative').optional().default(0),
  parentCommentId: z.string().optional(),
  isReply: z.boolean().optional().default(false),
  source: z.union([SocialCommentSourceSchema, z.string()]).default('MANUAL_PASTE'),
  status: z.union([SocialCommentStatusSchema, z.string()]).default('UNPROCESSED'),
});
export type CreateSocialCommentInput = z.infer<typeof CreateSocialCommentInputSchema>;

export const ImportSocialCommentsInputSchema = z.object({
  defaultContentId: z.string().regex(/^BP-CNT-\d{6}$/, 'Invalid default content ID format (must be BP-CNT-######)').optional(),
  defaultPlatform: z.enum(['youtube', 'instagram', 'facebook']).optional(),
  defaultSource: z.union([SocialCommentSourceSchema, z.string()]).optional(),
  comments: z.array(z.object({
    contentId: z.string().optional(),
    videoId: z.string().optional(),
    publishingId: z.string().optional(),
    platform: z.string().optional(),
    platformPostId: z.string().optional(),
    platformCommentId: z.string().optional(),
    commentText: z.string().optional(),
    authorDisplayName: z.string().optional(),
    commentCreatedAt: z.string().optional(),
    capturedAt: z.string().optional(),
    likeCount: z.number().optional(),
    replyCount: z.number().optional(),
    parentCommentId: z.string().optional(),
    isReply: z.boolean().optional(),
    source: z.string().optional(),
    status: z.string().optional(),
  })).min(1, 'At least one comment must be provided for import'),
});
export type ImportSocialCommentsInput = z.infer<typeof ImportSocialCommentsInputSchema>;

export const CommentIntelligenceScopeSchema = z.enum([
  'CONTENT_MASTER',
  'VIDEO',
  'BATCH',
  'PLATFORM',
]);

export const GenerateCommentIntelligenceInputSchema = z.object({
  contentId: z.string().regex(/^BP-CNT-\d{6}$/, 'Invalid content ID format (must be BP-CNT-######)'),
  videoId: z.string().regex(/^BP-V-\d{6}$/, 'Invalid video ID format (must be BP-V-######)').optional(),
  platform: z.enum(['youtube', 'instagram', 'facebook', 'ALL']).optional(),
  analysisScope: z.union([CommentIntelligenceScopeSchema, z.string()]).optional().default('CONTENT_MASTER'),
  commentIds: z.array(z.string().regex(/^BP-CMT-\d{6}$/, 'Invalid comment ID format (must be BP-CMT-######)')).optional(),
});
export type GenerateCommentIntelligenceInput = z.infer<typeof GenerateCommentIntelligenceInputSchema>;
