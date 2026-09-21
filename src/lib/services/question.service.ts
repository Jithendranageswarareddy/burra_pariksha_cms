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
import { MultiLayerVerificationEngine } from '../validation/multi-layer-verification.engine';

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

import { videoService } from './video.service';
import { QuestionCreationRequestPayload, QuestionCreationValidator } from '../validators/question-creation.validator';
import { smartRandomService } from './smart-random.service';
import { questionConfigService } from './question-config.service';

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

    // Validate non-empty and distinct options and correct answer choice
    const optValues = [
      validatedInput.options.a.trim().toLowerCase(),
      validatedInput.options.b.trim().toLowerCase(),
      validatedInput.options.c.trim().toLowerCase(),
      validatedInput.options.d.trim().toLowerCase(),
    ];
    if (optValues.some((v) => v.length === 0)) {
      throw new ValidationError('Question options must not contain empty choices.');
    }
    if (new Set(optValues).size < 4) {
      throw new ValidationError('Question options must contain 4 distinct choices.');
    }

    const correctKey = validatedInput.correctAnswer.toLowerCase() as 'a' | 'b' | 'c' | 'd';
    if (!validatedInput.options[correctKey] || !validatedInput.options[correctKey].trim()) {
      throw new ValidationError(`Selected correct answer (${validatedInput.correctAnswer}) corresponds to an empty option choice.`);
    }

    // Handle RANDOM mode, subtopicId = 'RANDOM', or realLifeContext = 'RANDOM'
    let resolvedSubtopicId = validatedInput.subtopicId;
    const inputContext = ((validatedInput as any).realLifeContext || validatedInput.realWorldContext || '').trim();
    const isRandomContext = inputContext.toUpperCase() === 'RANDOM' || inputContext.toUpperCase() === 'SMART_RANDOM';

    // Validate explicit non-random realLifeContext against inactive entries in QUESTION_CONFIG
    if (inputContext && !isRandomContext) {
      const allContexts = await questionConfigService.getRealLifeContexts(false, true);
      const match = allContexts.find(
        (c) =>
          c.code.toUpperCase() === inputContext.toUpperCase() ||
          c.displayLabel.toLowerCase() === inputContext.toLowerCase()
      );
      if (match && !match.isActive) {
        throw new ValidationError(`Selected Real-Life Context "${inputContext}" is inactive in QUESTION_CONFIG.`);
      }
    }

    // Validate explicit questionStyle against inactive entries in QUESTION_CONFIG
    const inputStyle = ((validatedInput as any).questionStyle || '').trim();
    if (inputStyle) {
      const allStyles = await questionConfigService.getQuestionStyles(false, true);
      const match = allStyles.find(
        (s) =>
          s.code.toUpperCase() === inputStyle.toUpperCase() ||
          s.displayLabel.toLowerCase() === inputStyle.toLowerCase()
      );
      if (match && !match.isActive) {
        throw new ValidationError(`Selected Question Style "${inputStyle}" is inactive in QUESTION_CONFIG.`);
      }
    }

    let resolvedGenerationMode: 'SUBTOPIC' | 'RANDOM' =
      validatedInput.generationMode?.toUpperCase() === 'RANDOM' ||
      validatedInput.subtopicId?.toUpperCase() === 'RANDOM' ||
      isRandomContext
        ? 'RANDOM'
        : 'SUBTOPIC';

    if (resolvedGenerationMode === 'RANDOM' || resolvedSubtopicId?.toUpperCase() === 'RANDOM') {
      const resolved = await taxonomyService.resolveSubtopicSelection(validatedInput.topicId, 'RANDOM');
      resolvedSubtopicId = resolved.subtopicId;
      resolvedGenerationMode = 'RANDOM';
    }

    // Resolve context if RANDOM so literal "RANDOM" is never persisted
    let resolvedRealLifeContext = inputContext;
    if (isRandomContext) {
      const resolvedContextParams = await smartRandomService.resolveParameters({
        topicId: validatedInput.topicId,
        subtopicId: resolvedSubtopicId,
        realLifeContext: 'RANDOM',
      });
      resolvedRealLifeContext = resolvedContextParams.realLifeContext;
      resolvedGenerationMode = 'RANDOM';
    }
    if (resolvedRealLifeContext.toUpperCase() === 'RANDOM') {
      throw new ValidationError('Real-life context cannot be persisted as literal "RANDOM". A concrete context must be resolved.');
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
      language: (validatedInput as any).language || 'TELUGU',
      questionText: validatedInput.questionText,
      question: validatedInput.questionText,
      options: validatedInput.options,
      optionA: validatedInput.options.a,
      optionB: validatedInput.options.b,
      optionC: validatedInput.options.c,
      optionD: validatedInput.options.d,
      correctAnswer: validatedInput.correctAnswer,
      explanation: validatedInput.explanation,
      realWorldContext: resolvedRealLifeContext,
      realLifeContext: resolvedRealLifeContext,
      challengeType: (validatedInput as any).challengeType || '',
      presentationType: (validatedInput as any).presentationType || '',
      originalityScore: (validatedInput as any).originalityScore || 0,
      aiModel: (validatedInput as any).aiModel || '',
      aiPrompt: (validatedInput as any).aiPrompt || '',
      questionStyle: QuestionCreationValidator.normalizeQuestionStyle(validatedInput.questionStyle),
      status,
      videoStatus,
      tags: validatedInput.tags || [],
      source: validatedInput.source || 'AI Generator Studio',
      aiPromptUsed: validatedInput.aiPromptUsed || '',
      authorId: actor.id,
      author: actor.name || actor.id,
      generationMode: resolvedGenerationMode,
      createdAt: now,
      updatedAt: now,
    };

    // 4. Enforce Multi-Layer Verification Pipeline & Backend Save Gate
    const verificationReport = await MultiLayerVerificationEngine.verify(newQuestion, {
      actor: actor.name,
    });

    if (verificationReport.aggregatedStatus === 'FAILED' || !verificationReport.canSave) {
      const errDetail = verificationReport.overallErrors.join('; ');
      throw new ValidationError(`Question creation REJECTED at Backend Save Gate due to multi-layer verification failure: ${errDetail}`);
    }

    // Assign server-authoritative verification status (overriding any client spoofing)
    newQuestion.validationStatus = verificationReport.canonicalValidationStatus;
    newQuestion.validationScore = verificationReport.confidenceScore;
    newQuestion.lastValidationId = verificationReport.id;

    // Save validation audit record
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

    // 5. Persist to authoritative QUESTIONS sheet
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

    // Now safely allocate sequence and create Content Master
    const id = await idService.allocateQuestionId();
    let contentMasterId = requestPayload.contentMasterId;
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

    // Save validation audit record
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

    // 7. Append to authoritative QUESTIONS sheet
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

