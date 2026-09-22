/**
 * BURRA PARIKSHA CMS - Question Service
 * Phase 3: Question Management System
 * 
 * Manages question lifecycle, validation, taxonomy integrity, duplicate detection,
 * workflow state machine transitions, and video queueing.
 */

import { questionsRepository } from '../repositories/questions.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { validationsRepository } from '../repositories/validations.repository';
import { CreateQuestionInput, CreateQuestionInputSchema, QuestionFilterInput, UpdateQuestionInputSchema } from '../schemas/google-sheets-schema';
import { Question, QuestionStatus, VideoProductionStatus, QuestionValidationStatus, UserRole } from '../../types';
import { idService } from './id.service';
import { taxonomyService } from './taxonomy.service';
import { workflowService } from './workflow.service';
import { auditService } from './audit.service';
import { contentMasterService } from './content-master.service';
import { IdempotencyConflictError, ReferenceIntegrityError, ValidationError } from '../google-sheets/errors';
import { MultiLayerVerificationEngine } from '../validation/multi-layer-verification.engine';
import { createHash } from 'crypto';

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
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  [QuestionStatus.DRAFT]: [QuestionStatus.GENERATED, QuestionStatus.ARCHIVED],
  [QuestionStatus.GENERATED]: [QuestionStatus.EDITING, QuestionStatus.APPROVED, QuestionStatus.REJECTED, QuestionStatus.ARCHIVED],
  [QuestionStatus.EDITING]: [QuestionStatus.APPROVED, QuestionStatus.REJECTED, QuestionStatus.GENERATED, QuestionStatus.ARCHIVED],
  [QuestionStatus.APPROVED]: [QuestionStatus.EDITING, QuestionStatus.ARCHIVED],
  [QuestionStatus.REJECTED]: [QuestionStatus.EDITING, QuestionStatus.DRAFT, QuestionStatus.ARCHIVED],
  [QuestionStatus.ARCHIVED]: [QuestionStatus.DRAFT, QuestionStatus.EDITING],
};

export interface IdempotencyCacheEntry {
  question: Question;
  payloadFingerprint: string;
  createdAt: number;
}

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const IDEMPOTENCY_MAX_ENTRIES = 1000;

import { videoService } from './video.service';
import { QuestionCreationRequestPayload, QuestionCreationValidator } from '../validators/question-creation.validator';
import { smartRandomService } from './smart-random.service';
import { questionConfigService } from './question-config.service';

export class QuestionService {
  private static instance: QuestionService | null = null;
  private idempotencyCache: Map<string, IdempotencyCacheEntry> = new Map();
  private inFlightRegistry: Map<string, { promise: Promise<Question>; payloadFingerprint: string }> = new Map();

  private constructor() {}

  public static getInstance(): QuestionService {
    if (!QuestionService.instance) {
      QuestionService.instance = new QuestionService();
    }
    return QuestionService.instance;
  }

  /**
   * Computes a deterministic SHA-256 fingerprint for a question creation request payload.
   * Excludes metadata like `idempotencyKey` and normalizes whitespace and key ordering.
   */
  public computePayloadFingerprint(payload: QuestionCreationRequestPayload): string {
    const canonicalQuestionText = (
      payload.questionText ||
      payload.question ||
      (payload as any).content ||
      ''
    ).trim();

    const options = payload.options ? {
      a: (payload.options.a || '').trim(),
      b: (payload.options.b || '').trim(),
      c: (payload.options.c || '').trim(),
      d: (payload.options.d || '').trim(),
    } : { a: '', b: '', c: '', d: '' };

    const tags = Array.isArray(payload.tags) ? [...payload.tags].map(t => String(t).trim()).sort() : [];

    const normalizedObject = {
      categoryId: (payload.categoryId || '').trim(),
      challengeType: (payload.challengeType || '').trim(),
      contentMasterId: (payload.contentMasterId || '').trim(),
      correctAnswer: (payload.correctAnswer || '').trim(),
      creationMode: (payload.creationMode || 'manual').trim(),
      difficulty: (payload.difficulty || '').trim().toLowerCase(),
      explanation: (payload.explanation || '').trim(),
      generationMode: (payload.generationMode || '').trim(),
      language: (payload.language || '').trim().toUpperCase(),
      options,
      presentationType: (payload.presentationType || '').trim(),
      questionStyle: (payload.questionStyle || '').trim(),
      questionText: canonicalQuestionText,
      realLifeContext: (payload.realLifeContext || '').trim(),
      source: (payload.source || '').trim(),
      subtopicId: (payload.subtopicId || '').trim(),
      tags,
      topicId: (payload.topicId || '').trim(),
    };

    const serialized = JSON.stringify(normalizedObject, Object.keys(normalizedObject).sort());
    return createHash('sha256').update(serialized, 'utf8').digest('hex');
  }

  /**
   * Stores a completed Question result in the bounded LRU/TTL idempotency cache.
   */
  private cacheIdempotencyResult(key: string, question: Question, payloadFingerprint: string): void {
    const now = Date.now();
    // Evict expired entries
    for (const [k, entry] of this.idempotencyCache.entries()) {
      if (now - entry.createdAt > IDEMPOTENCY_TTL_MS) {
        this.idempotencyCache.delete(k);
      }
    }

    // If key already exists in cache, delete first so insertion order is updated
    if (this.idempotencyCache.has(key)) {
      this.idempotencyCache.delete(key);
    }

    // Evict oldest entry if capacity reached (Map maintains insertion order)
    if (this.idempotencyCache.size >= IDEMPOTENCY_MAX_ENTRIES) {
      const oldestKey = this.idempotencyCache.keys().next().value;
      if (oldestKey) {
        this.idempotencyCache.delete(oldestKey);
      }
    }

    // Set new entry
    this.idempotencyCache.set(key, {
      question,
      payloadFingerprint,
      createdAt: now,
    });
  }

  /**
   * Gets a cached idempotent result if valid, evicting expired entries.
   */
  private getCachedIdempotencyResult(key: string): IdempotencyCacheEntry | null {
    const entry = this.idempotencyCache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.createdAt > IDEMPOTENCY_TTL_MS) {
      this.idempotencyCache.delete(key);
      return null;
    }

    // Refresh LRU order by re-inserting
    this.idempotencyCache.delete(key);
    this.idempotencyCache.set(key, entry);
    return entry;
  }

  /**
   * Clears all idempotency cache entries and in-flight registry (primarily for isolated test reset).
   */
  public clearIdempotencyCache(): void {
    this.idempotencyCache.clear();
    this.inFlightRegistry.clear();
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
   * Delegated directly to canonical createQuestionFromRequest pipeline for convergence (A-02.4).
   */
  public async createQuestion(
    input: CreateQuestionInput,
    actor: { id: string; name: string; role?: string | UserRole } = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN }
  ): Promise<Question> {
    // Extract idempotencyKey and optional fields from raw input before Zod stripping
    const rawInput = (input && typeof input === 'object') ? (input as any) : {};
    const rawIdempotencyKey = rawInput.idempotencyKey;

    // 1. Zod runtime schema validation
    const validatedInput = CreateQuestionInputSchema.parse(input);

    // 2. Map normalized input to QuestionCreationRequestPayload
    const payload: QuestionCreationRequestPayload = {
      creationMode: 'manual',
      categoryId: validatedInput.categoryId,
      topicId: validatedInput.topicId,
      subtopicId: validatedInput.subtopicId,
      difficulty: validatedInput.difficulty,
      realLifeContext: (validatedInput as any).realLifeContext || validatedInput.realWorldContext,
      challengeType: (validatedInput as any).challengeType,
      presentationType: (validatedInput as any).presentationType,
      language: (validatedInput as any).language || 'TELUGU',
      questionStyle: (validatedInput as any).questionStyle,
      questionText: validatedInput.questionText,
      question: validatedInput.questionText,
      content: (validatedInput as any).content,
      options: validatedInput.options,
      correctAnswer: validatedInput.correctAnswer,
      explanation: validatedInput.explanation,
      contentMasterId: (validatedInput as any).contentMasterId || (validatedInput as any).contentId,
      tags: validatedInput.tags,
      source: validatedInput.source || 'AI Generator Studio',
      aiPromptUsed: validatedInput.aiPromptUsed,
      aiModel: (validatedInput as any).aiModel,
      aiPrompt: (validatedInput as any).aiPrompt,
      originalityScore: (validatedInput as any).originalityScore,
      idempotencyKey: rawIdempotencyKey || (validatedInput as any).idempotencyKey,
      generationMode: validatedInput.generationMode,
    };

    // 3. Delegate to canonical pipeline
    return this.createQuestionFromRequest(payload, actor);
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

    // 0. Validate & Normalize Idempotency Key
    const normalizedIdempotencyKey = QuestionCreationValidator.normalizeIdempotencyKey(requestPayload.idempotencyKey);
    requestPayload.idempotencyKey = normalizedIdempotencyKey;

    const payloadFingerprint = this.computePayloadFingerprint(requestPayload);

    // 1. Check Completed Cache
    if (normalizedIdempotencyKey) {
      const cached = this.getCachedIdempotencyResult(normalizedIdempotencyKey);
      if (cached) {
        if (cached.payloadFingerprint !== payloadFingerprint) {
          throw new IdempotencyConflictError(
            `Idempotency key "${normalizedIdempotencyKey}" has already been used with a different request payload.`
          );
        }
        return cached.question;
      }

      // 2. Check In-Flight Registry
      const inFlight = this.inFlightRegistry.get(normalizedIdempotencyKey);
      if (inFlight) {
        if (inFlight.payloadFingerprint !== payloadFingerprint) {
          throw new IdempotencyConflictError(
            `Idempotency key "${normalizedIdempotencyKey}" is currently being processed with a different request payload.`
          );
        }
        return inFlight.promise;
      }
    }

    // 3. Register In-Flight Execution
    const executionPromise = this.executeQuestionCreation(requestPayload, actor, payloadFingerprint);

    if (normalizedIdempotencyKey) {
      this.inFlightRegistry.set(normalizedIdempotencyKey, {
        promise: executionPromise,
        payloadFingerprint,
      });
    }

    try {
      const question = await executionPromise;
      if (normalizedIdempotencyKey) {
        this.cacheIdempotencyResult(normalizedIdempotencyKey, question, payloadFingerprint);
      }
      return question;
    } finally {
      if (normalizedIdempotencyKey) {
        this.inFlightRegistry.delete(normalizedIdempotencyKey);
      }
    }
  }

  /**
   * Internal Core Question Creation Worker.
   */
  private async executeQuestionCreation(
    requestPayload: QuestionCreationRequestPayload,
    actor: { id: string; name: string; role?: string | UserRole },
    payloadFingerprint: string
  ): Promise<Question> {
    // Resolve creationMode default if not explicitly provided
    if (!requestPayload.creationMode) {
      requestPayload.creationMode = 'manual';
    }

    // Resolve canonical questionText across aliases at creation boundary
    const canonicalQuestionText = (
      requestPayload.questionText ||
      requestPayload.question ||
      (requestPayload as any).content ||
      ''
    ).trim();
    requestPayload.questionText = canonicalQuestionText;
    requestPayload.question = canonicalQuestionText;

    // 1. Resolve RANDOM / SMART_RANDOM parameters if needed
    const isRandomContext = requestPayload.realLifeContext?.toUpperCase() === 'RANDOM' || requestPayload.realLifeContext?.toUpperCase() === 'SMART_RANDOM';
    const isRandomSubtopic = requestPayload.subtopicId?.toUpperCase() === 'RANDOM';
    const isRandomMode = requestPayload.generationMode?.toUpperCase() === 'RANDOM';
    const resolvedGenerationMode: 'SUBTOPIC' | 'RANDOM' =
      isRandomContext || isRandomSubtopic || isRandomMode ? 'RANDOM' : 'SUBTOPIC';

    // Validate explicit non-random realLifeContext against inactive entries in QUESTION_CONFIG
    if (requestPayload.realLifeContext && !isRandomContext) {
      const allContexts = await questionConfigService.getRealLifeContexts(false, false);
      const match = allContexts.find(
        (c) =>
          c.code.toUpperCase() === requestPayload.realLifeContext!.toUpperCase() ||
          c.displayLabel.toLowerCase() === requestPayload.realLifeContext!.toLowerCase()
      );
      if (match && !match.isActive) {
        throw new ValidationError(`Selected Real-Life Context "${requestPayload.realLifeContext}" is inactive in QUESTION_CONFIG.`);
      }
    }

    // Validate explicit questionStyle against inactive entries in QUESTION_CONFIG
    if (requestPayload.questionStyle) {
      const allStyles = await questionConfigService.getQuestionStyles(false, false);
      const match = allStyles.find(
        (s) =>
          s.code.toUpperCase() === requestPayload.questionStyle!.toUpperCase() ||
          s.displayLabel.toLowerCase() === requestPayload.questionStyle!.toLowerCase()
      );
      if (match && !match.isActive) {
        throw new ValidationError(`Selected Question Style "${requestPayload.questionStyle}" is inactive in QUESTION_CONFIG.`);
      }
    }

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
    const categoryId = resolvedParams.categoryId || requestPayload.categoryId;
    const difficulty = resolvedParams.difficulty;
    const realLifeContext = resolvedParams.realLifeContext;
    const challengeType = resolvedParams.challengeType;
    const presentationType = resolvedParams.presentationType;
    const language = resolvedParams.language;

    if (realLifeContext && realLifeContext.toUpperCase() === 'RANDOM') {
      throw new ValidationError('Real-life context cannot be persisted as literal "RANDOM". A concrete context must be resolved.');
    }

    // 2. Perform Structural Validation
    const validationPayload: QuestionCreationRequestPayload = {
      ...requestPayload,
      topicId,
      subtopicId,
      difficulty,
      language,
      presentationType,
      challengeType,
      realLifeContext,
      generationMode: resolvedGenerationMode,
    };
    QuestionCreationValidator.validateStructure(validationPayload);
    let questionStyle = validationPayload.questionStyle;
    if (!questionStyle) {
      try {
        const defaultStyle = await questionConfigService.getDefaultQuestionStyle();
        questionStyle = defaultStyle?.code || defaultStyle?.displayLabel || 'STORY_BASED';
      } catch {
        questionStyle = 'STORY_BASED';
      }
    }

    // 3. Validate Taxonomy Integrity
    const { category, topic, subtopic } = await taxonomyService.validateQuestionTaxonomy(
      topicId,
      subtopicId,
      categoryId
    );

    const now = new Date().toISOString();
    const status = QuestionStatus.GENERATED;
    const videoStatus = VideoProductionStatus.NOT_STARTED;

    // Pre-validation check: run MultiLayerVerificationEngine before allocating permanent IDs
    const preSaveQuestion: Question = {
      id: 'PRE-SAVE-CHECK',
      contentId: '',
      contentMasterId: '',
      categoryId: category?.id || categoryId || '',
      categoryName: category?.name || '',
      topicId: topic.id,
      topicName: topic.name,
      subtopicId: subtopic.id,
      subtopicName: subtopic.name,
      difficulty,
      language,
      questionText: requestPayload.questionText.trim(),
      question: requestPayload.questionText.trim(),
      options: {
        a: requestPayload.options.a.trim(),
        b: requestPayload.options.b.trim(),
        c: (requestPayload.options.c || '').trim(),
        d: (requestPayload.options.d || '').trim(),
      },
      optionA: requestPayload.options.a.trim(),
      optionB: requestPayload.options.b.trim(),
      optionC: (requestPayload.options.c || '').trim(),
      optionD: (requestPayload.options.d || '').trim(),
      correctAnswer: requestPayload.correctAnswer,
      explanation: requestPayload.explanation.trim(),
      realWorldContext: realLifeContext,
      realLifeContext: realLifeContext,
      challengeType,
      presentationType,
      questionStyle,
      status: QuestionStatus.GENERATED,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      tags: requestPayload.tags || [],
      source: requestPayload.source || 'AI Generator Studio',
      aiPromptUsed: requestPayload.aiPromptUsed || '',
      aiModel: requestPayload.aiModel || '',
      aiPrompt: requestPayload.aiPrompt || '',
      originalityScore: requestPayload.originalityScore || 0,
      authorId: actor.id,
      author: actor.name || actor.id,
      generationMode: resolvedGenerationMode,
      createdAt: now,
      updatedAt: now,
    };

    const verificationReport = await MultiLayerVerificationEngine.verify(preSaveQuestion, {
      actor: actor.name,
      humanReview: (requestPayload as any).humanReview,
      aiVerifierResult: (requestPayload as any).aiVerifierResult,
    });

    if (verificationReport.aggregatedStatus === 'FAILED' || !verificationReport.canSave) {
      const errDetail = verificationReport.overallErrors.join('; ');
      throw new ValidationError(`Question creation REJECTED at Backend Save Gate due to multi-layer verification failure: ${errDetail}`);
    }

    // Verify contentMasterId existence before ID allocation if provided
    let contentMasterId = requestPayload.contentMasterId;
    if (contentMasterId) {
      const existingMaster = await contentMastersRepository.findById(contentMasterId);
      if (!existingMaster) {
        throw new ReferenceIntegrityError(
          `Referenced contentMasterId "${contentMasterId}" does not exist in CONTENT_MASTERS repository.`
        );
      }
    }

    // Now safely allocate sequence and create Content Master
    const id = await idService.allocateQuestionId();
    let createdContentMaster = false;

    if (!contentMasterId) {
      const master = await contentMasterService.createContentMaster(
        {
          title: requestPayload.questionText
            ? requestPayload.questionText.slice(0, 100)
            : `Content Master for Question ${id}`,
          primaryQuestionId: id,
          categoryId: category?.id || categoryId || '',
          topicId: topic.id,
          subtopicId: subtopic.id,
          createdBy: actor.id,
        },
        actor.id,
        actor.name
      );
      contentMasterId = master.id;
      createdContentMaster = true;
    }

    const newQuestion: Question = {
      ...preSaveQuestion,
      id,
      contentId: contentMasterId,
      contentMasterId,
      validationStatus: verificationReport.canonicalValidationStatus,
      validationScore: verificationReport.confidenceScore,
      lastValidationId: verificationReport.id,
    };

    // Save validation audit record (best-effort)
    try {
      await validationsRepository.saveValidationResult({
        id: verificationReport.id,
        questionId: newQuestion.id,
        status: verificationReport.canonicalValidationStatus,
        confidenceScore: verificationReport.confidenceScore,
        validatorVersion: MultiLayerVerificationEngine.VERSION,
        validationRuleVersion: '2026.09.v1',
        timestamp: verificationReport.timestamp,
        source: 'MULTI_LAYER_PIPELINE',
        summary: verificationReport.overallErrors.length > 0
          ? `Verification failed with ${verificationReport.overallErrors.length} error(s)`
          : `Multi-layer verification ${verificationReport.aggregatedStatus}`,
        checks: verificationReport.layerList.map(l => ({
          checkId: l.layerId,
          checkName: l.layerName,
          passed: l.status === 'VERIFIED' || l.status === 'N/A',
          severity: l.status === 'FAILED' ? 'FATAL' : l.status === 'UNVERIFIED' ? 'WARN' : 'INFO',
          message: l.summary,
        })),
        errors: verificationReport.overallErrors,
        warnings: verificationReport.overallWarnings,
        recommendations: [],
        answerVerification: {
          isConsistent: verificationReport.layers['5']?.status !== 'FAILED',
          declaredAnswer: newQuestion.correctAnswer,
          details: verificationReport.layers['6']?.summary || '',
          contradictionDetected: verificationReport.layers['5']?.status === 'FAILED',
        },
        explanationVerification: {
          isValid: verificationReport.layers['7']?.status === 'VERIFIED',
          contradictsAnswer: verificationReport.layers['5']?.status === 'FAILED',
          reachesDeclaredResult: true,
          substantiveLength: (newQuestion.explanation || '').length >= 5,
          details: verificationReport.layers['7']?.summary || '',
        },
        ambiguityResult: {
          isAmbiguous: false,
          ambiguityReasons: [],
          confidence: verificationReport.confidenceScore,
          details: 'No ambiguity',
        },
        mathematicalLogicalResult: verificationReport.evidence?.mathDerivation || {
          status: verificationReport.layers['3']?.status === 'N/A' ? 'NOT_APPLICABLE' : 'VERIFIED',
          details: verificationReport.layers['3']?.summary || '',
        },
        layers: verificationReport.layers,
        layerList: verificationReport.layerList,
        aggregatedLayerStatus: verificationReport.aggregatedStatus,
        humanReviewState: verificationReport.humanReviewState,
        createdAt: verificationReport.timestamp,
        updatedAt: verificationReport.timestamp,
      } as any);
    } catch {
      // Best-effort audit save
    }

    // 7. Authoritative QUESTION persistence with controlled compensation
    try {
      await questionsRepository.appendRecord(newQuestion);
    } catch (primaryError) {
      if (createdContentMaster && contentMasterId) {
        try {
          await contentMastersRepository.delete(contentMasterId, {
            actor: { id: actor.id, name: actor.name },
            reason: `Compensation: Question ${id} persistence failed`,
          });
        } catch (compensationError) {
          console.warn(
            `[QuestionService] Content Master compensation failed for ${contentMasterId} after Question persistence error:`,
            compensationError instanceof Error ? compensationError.message : compensationError
          );
        }
      }
      throw primaryError;
    }

    // 8. Populate idempotency cache immediately after persistence
    if (requestPayload.idempotencyKey) {
      this.cacheIdempotencyResult(requestPayload.idempotencyKey, newQuestion, payloadFingerprint);
    }

    // 9. Post-save auxiliary: Workflow State Transition (resilient, non-fatal)
    try {
      await workflowService.recordTransition(
        'QUESTION',
        id,
        'DRAFT',
        status,
        actor.name,
        `Question created via ${requestPayload.creationMode.toUpperCase()} creation pipeline`
      );
    } catch (wfErr) {
      console.warn(
        `[QuestionService] Non-fatal workflow transition failure for Question ${id}:`,
        wfErr instanceof Error ? wfErr.message : wfErr
      );
    }

    // 10. Post-save auxiliary: Audit Log (resilient, non-fatal)
    try {
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
          categoryId: category?.id || categoryId || '',
          topicId: topic.id,
          subtopicId: subtopic.id,
          difficulty,
          challengeType,
          presentationType,
          language,
          questionStyle,
          idempotencyKey: requestPayload.idempotencyKey,
        }
      );
    } catch (auditErr) {
      console.warn(
        `[QuestionService] Non-fatal audit log failure for Question ${id}:`,
        auditErr instanceof Error ? auditErr.message : auditErr
      );
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
      const { category, topic, subtopic } = await taxonomyService.validateQuestionTaxonomy(targetTopic, targetSubtopic, targetCat);
      enrichedTaxonomy = {
        categoryId: category?.id || targetCat || '',
        categoryName: category?.name || '',
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

    // 6. Merge record (preserve immutable ID, contentId, contentMasterId, authorId, and createdAt, generate new server updatedAt)
    const updatedRecord: any = {
      ...existing,
      ...updates,
      ...enrichedTaxonomy,
      id: existing.id,
      contentId: existing.contentId || existing.contentMasterId,
      contentMasterId: existing.contentMasterId || existing.contentId,
      createdAt: existing.createdAt,
      status: nextStatus,
      videoStatus: nextVideoStatus,
      validationStatus: nextValidationStatus,
      validationScore: nextValidationScore,
      lastValidationId: isMaterialEdit ? '' : (updates as any).lastValidationId || existing.lastValidationId,
      updatedAt: new Date().toISOString(),
    };

    if (updatedRecord.questionText) {
      updatedRecord.question = updatedRecord.questionText;
    } else if (updatedRecord.question) {
      updatedRecord.questionText = updatedRecord.question;
    }

    if (updatedRecord.options) {
      updatedRecord.optionA = updatedRecord.options.a;
      updatedRecord.optionB = updatedRecord.options.b;
      updatedRecord.optionC = updatedRecord.options.c;
      updatedRecord.optionD = updatedRecord.options.d;
    } else if (updatedRecord.optionA !== undefined || updatedRecord.optionB !== undefined) {
      updatedRecord.options = {
        a: updatedRecord.optionA || '',
        b: updatedRecord.optionB || '',
        c: updatedRecord.optionC || '',
        d: updatedRecord.optionD || '',
      };
    }

    if (existing.authorId) {
      updatedRecord.authorId = existing.authorId;
      updatedRecord.author = existing.author || existing.authorId;
    }

    if (updatedRecord.realLifeContext) {
      updatedRecord.realWorldContext = updatedRecord.realLifeContext;
    } else if (updatedRecord.realWorldContext) {
      updatedRecord.realLifeContext = updatedRecord.realWorldContext;
    }

    // Run multi-layer verification on merged update payload
    const verificationReport = await MultiLayerVerificationEngine.verify(updatedRecord, {
      actor: actor.name,
    });

    if (verificationReport.aggregatedStatus === 'FAILED' || !verificationReport.canSave) {
      const errDetail = verificationReport.overallErrors.join('; ');
      throw new ValidationError(`Question update REJECTED at Backend Save Gate due to multi-layer verification failure: ${errDetail}`);
    }

    if (isMaterialEdit) {
      updatedRecord.validationStatus = verificationReport.canonicalValidationStatus;
      updatedRecord.validationScore = verificationReport.confidenceScore;
      updatedRecord.lastValidationId = verificationReport.id;
    }

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

