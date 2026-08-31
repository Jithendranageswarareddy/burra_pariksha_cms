/**
 * BURRA PARIKSHA CMS - Question Service
 * Phase 3: Question Management System
 * 
 * Manages question lifecycle, validation, taxonomy integrity, duplicate detection,
 * workflow state machine transitions, and video queueing.
 */

import { questionsRepository } from '../repositories/questions.repository';
import { CreateQuestionInput, CreateQuestionInputSchema, QuestionFilterInput, UpdateQuestionInputSchema } from '../schemas/google-sheets-schema';
import { Question, QuestionStatus, VideoProductionStatus } from '../../types';
import { idService } from './id.service';
import { taxonomyService } from './taxonomy.service';
import { workflowService } from './workflow.service';
import { auditService } from './audit.service';
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

export class QuestionService {
  private static instance: QuestionService | null = null;

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
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<Question> {
    // 1. Zod runtime schema validation
    const validatedInput = CreateQuestionInputSchema.parse(input);

    // 2. Validate Taxonomy Integrity (Category -> Topic -> Subtopic)
    const { category, topic, subtopic } = await taxonomyService.validateTaxonomy(
      validatedInput.categoryId,
      validatedInput.topicId,
      validatedInput.subtopicId
    );

    // 3. Permanent ID Allocation via SEQUENCES tab
    const id = await idService.allocateQuestionId();

    const now = new Date().toISOString();
    // Enforce Phase 3 mandatory creation defaults: status = GENERATED, video_status = NOT_STARTED
    const status = QuestionStatus.GENERATED;
    const videoStatus = VideoProductionStatus.NOT_STARTED;

    const newQuestion: Question = {
      id,
      categoryId: category.id,
      categoryName: category.name,
      topicId: topic.id,
      topicName: topic.name,
      subtopicId: subtopic.id,
      subtopicName: subtopic.name,
      difficulty: validatedInput.difficulty,
      questionText: validatedInput.questionText,
      options: validatedInput.options,
      correctAnswer: validatedInput.correctAnswer,
      explanation: validatedInput.explanation,
      realWorldContext: validatedInput.realWorldContext || '',
      questionStyle: validatedInput.questionStyle,
      status,
      videoStatus,
      tags: validatedInput.tags || [],
      source: validatedInput.source || 'Manual Authoring',
      aiPromptUsed: validatedInput.aiPromptUsed || '',
      authorId: actor.id,
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
        categoryId: category.id,
        topicId: topic.id,
        subtopicId: subtopic.id,
        difficulty: validatedInput.difficulty,
      }
    );

    return newQuestion;
  }

  /**
   * Updates an existing question with validation, status transition enforcement, and audit logging.
   */
  public async updateQuestion(
    id: string,
    updates: Partial<CreateQuestionInput>,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<Question> {
    const existing = await questionsRepository.findById(id);
    if (!existing) {
      throw new ReferenceIntegrityError(`Question with ID "${id}" does not exist in the QUESTIONS sheet.`);
    }

    // 1. Zod update validation
    UpdateQuestionInputSchema.parse({ id, ...updates });

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
    const nextStatus = updates.status || existing.status;
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

    // 5. Merge record (preserve immutable ID and createdAt, generate new server updatedAt)
    const updatedRecord: Partial<Question> = {
      ...updates,
      ...enrichedTaxonomy,
      id: existing.id,
      createdAt: existing.createdAt,
      status: nextStatus,
      videoStatus: nextVideoStatus,
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
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' },
    remarks?: string
  ): Promise<Question> {
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
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' },
    remarks?: string
  ): Promise<Question> {
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

