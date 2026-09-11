/**
 * BURRA PARIKSHA CMS - Question Service
 * Phase 3: Question Management System
 * 
 * Manages question lifecycle, validation, taxonomy integrity, duplicate detection,
 * workflow state machine transitions, and video queueing.
 */

import { questionsRepository } from '../repositories/questions.repository';
import { validationsRepository } from '../repositories/validations.repository';
import { CreateQuestionInput, CreateQuestionInputSchema, QuestionFilterInput, UpdateQuestionInputSchema } from '../schemas/google-sheets-schema';
import { Question, QuestionStatus, VideoProductionStatus, QuestionValidationStatus, UserRole } from '../../types';
import { idService } from './id.service';
import { taxonomyService } from './taxonomy.service';
import { workflowService } from './workflow.service';
import { auditService } from './audit.service';
import { contentMasterService } from './content-master.service';
import { ReferenceIntegrityError, ValidationError } from '../google-sheets/errors';

export interface DuplicateMatch {
  questionId: string;
  questionText: string;
  categoryName: string;
  topicName: string;
  status: QuestionStatus;
  videoStatus: VideoProductionStatus;
  similarity: number; // 0 to 1
  isExact: boolean;
}

/**
 * Normalizes question text for robust duplicate comparison.
 * - Converts to lowercase
 * - Trims whitespace
 * - Strips punctuation marks
 * - Normalizes repeated internal whitespace
 */
export function normalizeQuestionText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' '); // collapse repeated whitespace
}

/**
 * Calculates word-level Jaccard similarity between two strings.
 */
function calculateJaccardSimilarity(textA: string, textB: string): number {
  const normA = normalizeQuestionText(textA);
  const normB = normalizeQuestionText(textB);

  if (normA === normB) return 1.0;
  if (!normA || !normB) return 0.0;

  const wordsA = new Set(normA.split(' ').filter((w) => w.length > 2));
  const wordsB = new Set(normB.split(' ').filter((w) => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) {
      intersectionCount++;
    }
  }

  const unionCount = wordsA.size + wordsB.size - intersectionCount;
  return unionCount === 0 ? 0.0 : intersectionCount / unionCount;
}

/**
 * Valid QuestionStatus State Transitions:
 * DRAFT -> GENERATED
 * GENERATED -> EDITING, APPROVED, REJECTED
 * EDITING -> APPROVED, REJECTED, GENERATED
 * APPROVED -> EDITING
 * REJECTED -> EDITING, DRAFT
 */
const VALID_QUESTION_TRANSITIONS: Record<QuestionStatus, QuestionStatus[]> = {
  [QuestionStatus.DRAFT]: [QuestionStatus.GENERATED],
  [QuestionStatus.GENERATED]: [QuestionStatus.EDITING, QuestionStatus.APPROVED, QuestionStatus.REJECTED],
  [QuestionStatus.EDITING]: [QuestionStatus.APPROVED, QuestionStatus.REJECTED, QuestionStatus.GENERATED],
  [QuestionStatus.APPROVED]: [QuestionStatus.EDITING],
  [QuestionStatus.REJECTED]: [QuestionStatus.EDITING, QuestionStatus.DRAFT],
};

import { videoService } from './video.service';
import { QuestionCreationRequestPayload, QuestionCreationValidator } from '../validators/question-creation.validator';
import { smartRandomService } from './smart-random.service';

export class QuestionService {
  private static instance: QuestionService | null = null;
  private idempotencyCache: Map<string, Question> = new Map();

  private constructor() {}

  public static getInstance(): QuestionService {
    if (!QuestionService.instance) {
      QuestionService.instance = new QuestionService();
    }
    return QuestionService.instance;
  }

  /**
   * Retrieves filtered questions from the authoritative QUESTIONS worksheet.
   */
  public async getQuestions(filter?: QuestionFilterInput): Promise<Question[]> {
    return questionsRepository.query(filter);
  }

  /**
   * Retrieves a single question by its permanent ID (e.g. BP-Q-000001).
   */
  public async getQuestionById(id: string): Promise<Question | null> {
    if (!id) return null;
    return questionsRepository.findById(id);
  }

  /**
   * Detects likely duplicate questions against existing records in the QUESTIONS sheet.
   * Duplicate detection is a warning tool and does not reject creation.
   */
  public async detectDuplicates(questionText: string, excludeId?: string): Promise<DuplicateMatch[]> {
    if (!questionText || questionText.trim().length < 5) {
      return [];
    }

    const allQuestions = await questionsRepository.findAll();
    const normalizedInput = normalizeQuestionText(questionText);
    const matches: DuplicateMatch[] = [];

    for (const existing of allQuestions) {
      if (excludeId && existing.id === excludeId) continue;
      const normalizedExisting = normalizeQuestionText(existing.questionText);

      const isExact = normalizedInput === normalizedExisting;
      const similarity = isExact ? 1.0 : calculateJaccardSimilarity(questionText, existing.questionText);

      // Flag matches with high text overlap (>= 70%) or exact match
      if (isExact || similarity >= 0.7) {
        matches.push({
          questionId: existing.id,
          questionText: existing.questionText,
          categoryName: existing.categoryName,
          topicName: existing.topicName,
          status: existing.status,
          videoStatus: existing.videoStatus,
          similarity: Number(similarity.toFixed(2)),
          isExact,
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Validates whether a Question status transition is allowed by the workflow state machine.
   */
  public validateStatusTransition(fromStatus: QuestionStatus, toStatus: QuestionStatus): void {
    if (fromStatus === toStatus) return;

    const allowed = VALID_QUESTION_TRANSITIONS[fromStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new ValidationError(
        `Invalid status transition from "${fromStatus}" to "${toStatus}". Allowed next statuses: ${
          allowed.length > 0 ? allowed.join(', ') : 'None'
        }`
      );
    }
  }

  /**
   * Creates a new question with schema & taxonomy validation, permanent sequence ID allocation,
   * enforced default statuses (status=GENERATED, video_status=NOT_STARTED), and audit/workflow tracking.
   */
  public async createQuestion(
    input: CreateQuestionInput,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN }
  ): Promise<Question> {
    if (actor.role) {
      const r = String(actor.role).toUpperCase();
      const allowed = [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.CONTENT_WRITER];
      if (!allowed.includes(r as any)) {
        throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to create questions.`);
      }
    }

    // 1. Zod runtime schema validation
    const validatedInput = CreateQuestionInputSchema.parse(input);

    // Validate distinct options and correct answer choice
    const optValues = [
      validatedInput.options.a.trim().toLowerCase(),
      validatedInput.options.b.trim().toLowerCase(),
      validatedInput.options.c.trim().toLowerCase(),
      validatedInput.options.d.trim().toLowerCase(),
    ];
    if (new Set(optValues).size < 4) {
      throw new ValidationError('Question options must contain 4 distinct choices.');
    }

    const correctKey = validatedInput.correctAnswer.toLowerCase() as 'a' | 'b' | 'c' | 'd';
    if (!validatedInput.options[correctKey] || !validatedInput.options[correctKey].trim()) {
      throw new ValidationError(`Selected correct answer (${validatedInput.correctAnswer}) corresponds to an empty option choice.`);
    }

    // Handle RANDOM mode or subtopicId = 'RANDOM'
    let resolvedSubtopicId = validatedInput.subtopicId;
    let resolvedGenerationMode: 'SUBTOPIC' | 'RANDOM' =
      validatedInput.generationMode?.toUpperCase() === 'RANDOM' ||
      validatedInput.subtopicId?.toUpperCase() === 'RANDOM'
        ? 'RANDOM'
        : 'SUBTOPIC';

    if (resolvedGenerationMode === 'RANDOM' || resolvedSubtopicId?.toUpperCase() === 'RANDOM') {
      const resolved = await taxonomyService.resolveSubtopicSelection(validatedInput.topicId, 'RANDOM');
      resolvedSubtopicId = resolved.subtopicId;
      resolvedGenerationMode = 'RANDOM';
    }

    // 2. Validate Taxonomy Integrity (Topic -> Subtopic primary, optional legacy category)
    const { category, topic, subtopic } = await taxonomyService.validateQuestionTaxonomy(
      validatedInput.topicId,
      resolvedSubtopicId,
      validatedInput.categoryId
    );

    // 3. Permanent ID Allocation via SEQUENCES tab
    const id = await idService.allocateQuestionId();

    // 3B. Canonical Content ID / Content Master allocation & correlation
    let contentId = (validatedInput as any).contentId || (validatedInput as any).contentMasterId;
    let contentMasterId = (validatedInput as any).contentMasterId || (validatedInput as any).contentId;
    if (!contentMasterId) {
      const master = await contentMasterService.createContentMaster(
        {
          title: validatedInput.questionText ? validatedInput.questionText.slice(0, 100) : `Content Master for Question ${id}`,
          primaryQuestionId: id,
          categoryId: category?.id || '',
          topicId: topic.id,
          subtopicId: subtopic.id,
          createdBy: actor.id,
        },
        actor.id,
        actor.name
      );
      contentMasterId = master.id;
      contentId = master.id;
    }

    const now = new Date().toISOString();
    // Enforce Phase 3 mandatory creation defaults: status = GENERATED, video_status = NOT_STARTED
    const status = QuestionStatus.GENERATED;
    const videoStatus = VideoProductionStatus.NOT_STARTED;

    const newQuestion: Question = {
      id,
      contentId,
      contentMasterId,
      categoryId: category?.id || '',
      categoryName: category?.name || '',
      topicId: topic.id,
      topicName: topic.name,
      subtopicId: subtopic.id,
      subtopicName: subtopic.name,
      difficulty: validatedInput.difficulty,
      language: (validatedInput as any).language || 'ENGLISH',
      questionText: validatedInput.questionText,
      options: validatedInput.options,
      correctAnswer: validatedInput.correctAnswer,
      explanation: validatedInput.explanation,
      realWorldContext: validatedInput.realWorldContext || (validatedInput as any).realLifeContext || '',
      realLifeContext: (validatedInput as any).realLifeContext || validatedInput.realWorldContext || '',
      challengeType: (validatedInput as any).challengeType || '',
      presentationType: (validatedInput as any).presentationType || '',
      originalityScore: (validatedInput as any).originalityScore || 0,
      aiModel: (validatedInput as any).aiModel || '',
      aiPrompt: (validatedInput as any).aiPrompt || '',
      questionStyle: validatedInput.questionStyle as any,
      status,
      videoStatus,
      tags: validatedInput.tags || [],
      source: validatedInput.source || 'Manual Authoring',
      aiPromptUsed: validatedInput.aiPromptUsed || '',
      authorId: actor.id,
      generationMode: resolvedGenerationMode,
      createdAt: now,
      updatedAt: now,
    };

    // 4. Persist to authoritative QUESTIONS sheet
    await questionsRepository.appendRecord(newQuestion);

    // 5. Record initial Workflow state transition (DRAFT -> GENERATED)
    await workflowService.recordTransition(
      'QUESTION',
      id,
      'DRAFT',
      status,
      actor.name,
      'Initial question authoring and registration'
    );

    // 6. Record Audit Log
    await auditService.log(
      actor.id,
      actor.name,
      'QUESTION_CREATED',
      'QUESTION',
      id,
      {
        questionId: id,
        categoryId: category?.id || '',
        topicId: topic.id,
        subtopicId: subtopic.id,
        difficulty: validatedInput.difficulty,
      }
    );

    return newQuestion;
  }

  /**
   * Canonical Question Creation Pipeline for both Manual and AI requests.
   */
  public async createQuestionFromRequest(
    requestPayload: QuestionCreationRequestPayload,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN }
  ): Promise<Question> {
    if (actor.role) {
      const r = String(actor.role).toUpperCase();
      const allowed = [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.CONTENT_WRITER];
      if (!allowed.includes(r as any)) {
        throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to create questions.`);
      }
    }

    // 0. Idempotency Check
    if (requestPayload.idempotencyKey && this.idempotencyCache.has(requestPayload.idempotencyKey)) {
      return this.idempotencyCache.get(requestPayload.idempotencyKey)!;
    }

    // 1. Resolve RANDOM / SMART_RANDOM parameters if needed
    const resolvedParams = await smartRandomService.resolveParameters({
      categoryId: requestPayload.categoryId,
      topicId: requestPayload.topicId,
      subtopicId: requestPayload.subtopicId,
      difficulty: requestPayload.difficulty,
      realLifeContext: requestPayload.realLifeContext,
      challengeType: requestPayload.challengeType,
      presentationType: requestPayload.presentationType,
      language: requestPayload.language as string,
    });

    const topicId = resolvedParams.topicId;
    const subtopicId = resolvedParams.subtopicId;
    const categoryId = resolvedParams.categoryId || requestPayload.categoryId || 'CAT-QA';
    const difficulty = resolvedParams.difficulty;
    const realLifeContext = resolvedParams.realLifeContext;
    const challengeType = resolvedParams.challengeType;
    const presentationType = resolvedParams.presentationType;
    const language = resolvedParams.language;

    // 2. Perform Structural Validation
    QuestionCreationValidator.validateStructure({
      ...requestPayload,
      topicId,
      subtopicId,
      difficulty,
      language,
      presentationType,
      challengeType,
    });

    // 3. Validate Taxonomy Integrity
    const { category, topic, subtopic } = await taxonomyService.validateTaxonomy(
      categoryId,
      topicId,
      subtopicId
    );

    // 4. Allocate Permanent Sequence Question ID
    const id = await idService.allocateQuestionId();

    // 5. Content Master Integration (Phase 2 & Phase 4 rule: Content Master -> Question -> Video)
    let contentMasterId = requestPayload.contentMasterId;
    if (!contentMasterId) {
      const master = await contentMasterService.createContentMaster(
        {
          title: requestPayload.questionText
            ? requestPayload.questionText.slice(0, 100)
            : `Content Master for Question ${id}`,
          primaryQuestionId: id,
          categoryId: category.id,
          topicId: topic.id,
          subtopicId: subtopic.id,
          createdBy: actor.id,
        },
        actor.id,
        actor.name
      );
      contentMasterId = master.id;
    }

    const now = new Date().toISOString();
    const status = QuestionStatus.GENERATED;
    const videoStatus = VideoProductionStatus.NOT_STARTED;

    const newQuestion: Question = {
      id,
      contentMasterId,
      categoryId: category.id,
      categoryName: category.name,
      topicId: topic.id,
      topicName: topic.name,
      subtopicId: subtopic.id,
      subtopicName: subtopic.name,
      difficulty,
      language,
      questionText: requestPayload.questionText.trim(),
      options: {
        a: requestPayload.options.a.trim(),
        b: requestPayload.options.b.trim(),
        c: (requestPayload.options.c || '').trim(),
        d: (requestPayload.options.d || '').trim(),
      },
      correctAnswer: requestPayload.correctAnswer,
      explanation: requestPayload.explanation.trim(),
      realWorldContext: realLifeContext,
      realLifeContext: realLifeContext,
      challengeType: challengeType,
      presentationType: presentationType,
      status,
      videoStatus,
      tags: requestPayload.tags || [],
      source: requestPayload.source || (requestPayload.creationMode === 'ai' ? 'AI Generator Studio' : 'Manual Authoring'),
      aiPromptUsed: requestPayload.aiPromptUsed || '',
      aiModel: requestPayload.aiModel || '',
      aiPrompt: requestPayload.aiPrompt || '',
      originalityScore: requestPayload.originalityScore || 0,
      authorId: actor.id,
      createdAt: now,
      updatedAt: now,
    };

    // 6. Append to authoritative QUESTIONS sheet
    await questionsRepository.appendRecord(newQuestion);

    // 7. Workflow State Transition
    await workflowService.recordTransition(
      'QUESTION',
      id,
      'DRAFT',
      status,
      actor.name,
      `Question created via ${requestPayload.creationMode.toUpperCase()} creation pipeline`
    );

    // 8. Audit Log
    await auditService.log(
      actor.id,
      actor.name,
      'QUESTION_CREATED',
      'QUESTION',
      id,
      {
        creationMode: requestPayload.creationMode,
        questionId: id,
        contentMasterId,
        categoryId: category.id,
        topicId: topic.id,
        subtopicId: subtopic.id,
        difficulty,
        challengeType,
        presentationType,
        language,
        idempotencyKey: requestPayload.idempotencyKey,
      }
    );

    // Cache by idempotency key if provided
    if (requestPayload.idempotencyKey) {
      this.idempotencyCache.set(requestPayload.idempotencyKey, newQuestion);
    }

    return newQuestion;
  }

  /**
   * Updates an existing question with validation, status transition enforcement, and audit logging.
   */
  public async updateQuestion(
    id: string,
    updates: Partial<CreateQuestionInput>,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN }
  ): Promise<Question> {
    if (actor.role) {
      const r = String(actor.role).toUpperCase();
      const allowed = [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.CONTENT_WRITER];
      if (!allowed.includes(r as any)) {
        throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to edit questions.`);
      }
    }

    const existing = await questionsRepository.findById(id);
    if (!existing) {
      throw new ReferenceIntegrityError(`Question with ID "${id}" does not exist in the QUESTIONS sheet.`);
    }

    // 1. Zod update validation
    UpdateQuestionInputSchema.parse({ id, ...updates });

    // 1B. Enforce Content ID Immutability
    const currentCanonicalId = existing.contentId || existing.contentMasterId;
    if ((updates as any).contentId && currentCanonicalId && (updates as any).contentId !== currentCanonicalId) {
      throw new ValidationError(`Cannot modify immutable Content ID "${currentCanonicalId}" to "${(updates as any).contentId}".`);
    }
    if ((updates as any).contentMasterId && currentCanonicalId && (updates as any).contentMasterId !== currentCanonicalId) {
      throw new ValidationError(`Cannot modify immutable Content Master ID "${currentCanonicalId}" to "${(updates as any).contentMasterId}".`);
    }

    // 2. Validate taxonomy if any taxonomy field changed
    const targetCat = updates.categoryId || existing.categoryId;
    const targetTopic = updates.topicId || existing.topicId;
    const targetSubtopic = updates.subtopicId || existing.subtopicId;

    let enrichedTaxonomy = {
      categoryId: existing.categoryId,
      categoryName: existing.categoryName,
      topicId: existing.topicId,
      topicName: existing.topicName,
      subtopicId: existing.subtopicId,
      subtopicName: existing.subtopicName,
    };

    if (updates.categoryId || updates.topicId || updates.subtopicId) {
      const { category, topic, subtopic } = await taxonomyService.validateTaxonomy(targetCat, targetTopic, targetSubtopic);
      enrichedTaxonomy = {
        categoryId: category.id,
        categoryName: category.name,
        topicId: topic.id,
        topicName: topic.name,
        subtopicId: subtopic.id,
        subtopicName: subtopic.name,
      };
    }

    // 3. Status workflow validation
    const previousStatus = existing.status;
    let nextStatus = updates.status || existing.status;
    const statusChanged = previousStatus !== nextStatus;

    if (statusChanged) {
      this.validateStatusTransition(previousStatus, nextStatus);
    }

    // 4. Video status validation (if moving to QUEUED, question must be APPROVED)
    const previousVideoStatus = existing.videoStatus;
    const nextVideoStatus = updates.videoStatus || existing.videoStatus;
    const videoStatusChanged = previousVideoStatus !== nextVideoStatus;

    if (nextVideoStatus === VideoProductionStatus.QUEUED && nextStatus !== QuestionStatus.APPROVED) {
      throw new ValidationError(
        `Cannot set video production status to QUEUED unless the question is APPROVED. (Current status: ${nextStatus})`
      );
    }

    // 5. Detect material changes that invalidate validation results
    const isMaterialEdit = Boolean(
      (updates.questionText !== undefined && updates.questionText !== existing.questionText) ||
      (updates.options !== undefined && JSON.stringify(updates.options) !== JSON.stringify(existing.options)) ||
      (updates.correctAnswer !== undefined && updates.correctAnswer !== existing.correctAnswer) ||
      (updates.explanation !== undefined && updates.explanation !== existing.explanation) ||
      (updates.topicId !== undefined && updates.topicId !== existing.topicId) ||
      (updates.subtopicId !== undefined && updates.subtopicId !== existing.subtopicId) ||
      (updates.difficulty !== undefined && updates.difficulty !== existing.difficulty) ||
      (updates.challengeType !== undefined && updates.challengeType !== existing.challengeType) ||
      (updates.presentationType !== undefined && updates.presentationType !== existing.presentationType) ||
      ((updates as any).language !== undefined && (updates as any).language !== existing.language) ||
      ((updates as any).realLifeContext !== undefined && (updates as any).realLifeContext !== existing.realLifeContext)
    );

    let nextValidationStatus = existing.validationStatus;
    let nextValidationScore = existing.validationScore;

    if (isMaterialEdit) {
      await validationsRepository.markStaleForQuestion(id);
      nextValidationStatus = QuestionValidationStatus.NOT_VALIDATED;
      nextValidationScore = 0;

      // If status is APPROVED (either existing or requested in updates), revert to EDITING on material edit
      if (nextStatus === QuestionStatus.APPROVED) {
        nextStatus = QuestionStatus.EDITING;
      }

      await auditService.log(
        actor.id,
        actor.name,
        'QUESTION_VALIDATION_INVALIDATED',
        'QUESTION',
        id,
        {
          reason: 'Material question properties were edited; previous validation invalidated',
          previousValidationStatus: existing.validationStatus,
          previousValidationId: existing.lastValidationId,
        }
      );
    }

    // 6. Merge record (preserve immutable ID, contentId, contentMasterId, and createdAt, generate new server updatedAt)
    const updatedRecord: any = {
      ...updates,
      ...enrichedTaxonomy,
      id: existing.id,
      contentId: existing.contentId,
      contentMasterId: existing.contentMasterId,
      createdAt: existing.createdAt,
      status: nextStatus,
      videoStatus: nextVideoStatus,
      validationStatus: nextValidationStatus,
      validationScore: nextValidationScore,
      lastValidationId: isMaterialEdit ? '' : (updates as any).lastValidationId || existing.lastValidationId,
      updatedAt: new Date().toISOString(),
    };

    const result = await questionsRepository.updateRecord(id, updatedRecord);
    if (!result) {
      throw new Error(`Failed to update question with ID "${id}".`);
    }

    // 6. Record Workflow transition if question status changed
    if (statusChanged) {
      await workflowService.recordTransition(
        'QUESTION',
        id,
        previousStatus,
        nextStatus,
        actor.name,
        'Question status updated via Question Editor'
      );
    }

    // 7. Record Workflow transition if video status changed
    if (videoStatusChanged) {
      await workflowService.recordTransition(
        'VIDEO',
        id,
        previousVideoStatus,
        nextVideoStatus,
        actor.name,
        'Video production status updated'
      );
    }

    // 8. Record Audit Log
    const auditAction = statusChanged ? 'QUESTION_STATUS_CHANGED' : videoStatusChanged ? 'VIDEO_STATUS_CHANGED' : 'QUESTION_UPDATED';
    await auditService.log(
      actor.id,
      actor.name,
      auditAction,
      'QUESTION',
      id,
      {
        questionId: id,
        previousStatus: statusChanged ? previousStatus : undefined,
        nextStatus: statusChanged ? nextStatus : undefined,
        previousVideoStatus: videoStatusChanged ? previousVideoStatus : undefined,
        nextVideoStatus: videoStatusChanged ? nextVideoStatus : undefined,
      }
    );

    return result;
  }

  /**
   * Updates question lifecycle status with transition tracking.
   */
  public async updateStatus(
    id: string,
    newStatus: QuestionStatus,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN },
    remarks?: string
  ): Promise<Question> {
    if (actor.role) {
      const r = String(actor.role).toUpperCase();
      if (newStatus === QuestionStatus.APPROVED) {
        if (r !== UserRole.ADMIN && r !== UserRole.CONTENT_MANAGER) {
          throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to approve questions.`);
        }
      } else {
        const allowed = [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.QUESTION_EDITOR, UserRole.CONTENT_WRITER];
        if (!allowed.includes(r as any)) {
          throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to modify question status.`);
        }
      }
    }

    const existing = await questionsRepository.findById(id);
    if (!existing) {
      throw new ReferenceIntegrityError(`Question with ID "${id}" does not exist in the QUESTIONS sheet.`);
    }

    const previousStatus = existing.status;
    if (previousStatus === newStatus) {
      return existing;
    }

    // Validate transition
    this.validateStatusTransition(previousStatus, newStatus);

    const updated = await questionsRepository.updateRecord(id, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw new Error(`Failed to update status for question "${id}".`);
    }

    await workflowService.recordTransition(
      'QUESTION',
      id,
      previousStatus,
      newStatus,
      actor.name,
      remarks || `Status transitioned from ${previousStatus} to ${newStatus}`
    );

    await auditService.log(
      actor.id,
      actor.name,
      'QUESTION_STATUS_CHANGED',
      'QUESTION',
      id,
      { from: previousStatus, to: newStatus, remarks }
    );

    return updated;
  }

  /**
   * Adds an APPROVED question to the Video Production Queue.
   * Leverages VideoService to allocate Video ID from SEQUENCES, create VIDEOS record,
   * create QUESTION_VIDEOS join record, update question video_status to QUEUED, and record logs.
   */
  public async queueQuestion(
    id: string,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN },
    remarks?: string
  ): Promise<Question> {
    if (actor.role) {
      const r = String(actor.role).toUpperCase();
      if (r !== UserRole.ADMIN && r !== UserRole.CONTENT_MANAGER) {
        throw new Error(`Unauthorized: Role "${actor.role}" is not allowed to queue questions.`);
      }
    }

    // 1. Delegate full validation and video entity creation to VideoService
    await videoService.queueApprovedQuestion(
      {
        questionId: id,
        notes: remarks || 'Approved question added to Video Production Queue',
      },
      actor
    );

    // 2. Return the freshly updated question
    const updated = await questionsRepository.findById(id);
    if (!updated) {
      throw new ReferenceIntegrityError(`Question with ID "${id}" was not found after queueing.`);
    }

    return updated;
  }
}

export const questionService = QuestionService.getInstance();

