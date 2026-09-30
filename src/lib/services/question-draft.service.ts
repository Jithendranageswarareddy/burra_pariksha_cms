/**
 * BURRA PARIKSHA CMS - Question Draft Service
 * Stage 01: Question Generation & Draft Handoff Pipeline
 * 
 * Manages transient/editable question drafts. Allows Stage 01 to persist
 * and hand off candidates to Stage 02 without executing permanent Question ID
 * allocation, Content Master creation, or multi-layer verification blocking save gates.
 */

import { QuestionDraft, QuestionStatus, UserRole } from '../../types';
import { questionDraftsRepository } from '../repositories/question-drafts.repository';
import { taxonomyService } from './taxonomy.service';
import { questionService } from './question.service';

export interface SaveDraftInput {
  id?: string;
  topicId: string;
  subtopicId: string;
  categoryId?: string;
  difficulty: string;
  language?: string;
  questionText: string;
  question?: string;
  options: {
    a: string;
    b: string;
    c?: string;
    d?: string;
  };
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  questionStyle?: string;
  generationMode?: 'SUBTOPIC' | 'RANDOM' | string;
  tags?: string[];
  source?: string;
  sourceModel?: string;
  generationLatencyMs?: number;
  isFallback?: boolean;
  mathematicalVerification?: any;
}

export class QuestionDraftService {
  private static instance: QuestionDraftService | null = null;

  private constructor() {}

  public static getInstance(): QuestionDraftService {
    if (!QuestionDraftService.instance) {
      QuestionDraftService.instance = new QuestionDraftService();
    }
    return QuestionDraftService.instance;
  }

  /**
   * Persists a question draft without executing multi-layer verification
   * or permanent sequence ID allocation.
   */
  public async saveDraft(
    input: SaveDraftInput,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<QuestionDraft> {
    const rawText = (input.questionText || input.question || '').trim();
    if (!rawText) {
      throw new Error('Question statement cannot be empty in draft.');
    }

    const optA = (input.options?.a || input.optionA || '').trim();
    const optB = (input.options?.b || input.optionB || '').trim();
    const optC = (input.options?.c || input.optionC || '').trim();
    const optD = (input.options?.d || input.optionD || '').trim();

    const draftId = input.id && input.id.startsWith('BP-DFT-')
      ? input.id
      : `BP-DFT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const now = new Date().toISOString();

    const draft: QuestionDraft = {
      id: draftId,
      topicId: input.topicId,
      subtopicId: input.subtopicId,
      categoryId: input.categoryId,
      difficulty: input.difficulty || 'Intermediate',
      language: input.language || 'TELUGU',
      questionText: rawText,
      question: rawText,
      options: {
        a: optA,
        b: optB,
        c: optC,
        d: optD,
      },
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: input.correctAnswer || 'A',
      explanation: (input.explanation || '').trim(),
      realWorldContext: input.realLifeContext || input.realWorldContext,
      realLifeContext: input.realLifeContext || input.realWorldContext,
      challengeType: input.challengeType || 'ABCD',
      presentationType: input.presentationType || 'Text',
      questionStyle: input.questionStyle || 'STORY_BASED',
      generationMode: input.generationMode || 'SUBTOPIC',
      tags: input.tags || ['Aptitude', 'Draft'],
      source: input.source || 'AI Question Studio',
      sourceModel: input.sourceModel,
      generationLatencyMs: input.generationLatencyMs,
      isFallback: input.isFallback,
      mathematicalVerification: input.mathematicalVerification,
      authorId: actor.id,
      authorName: actor.name,
      author: actor.name,
      workflowStage: 'QUESTION_STUDIO',
      status: QuestionStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
    };

    return questionDraftsRepository.create(draft);
  }

  public async getDraftById(id: string): Promise<QuestionDraft | null> {
    return questionDraftsRepository.findById(id);
  }

  public async getAllDrafts(): Promise<QuestionDraft[]> {
    return questionDraftsRepository.findAll();
  }

  public async deleteDraft(id: string): Promise<boolean> {
    return questionDraftsRepository.delete(id);
  }

  /**
   * Materializes a verified Draft into a permanent production Question.
   * Invoked ONLY at Stage 02 approval gate.
   */
  public async approveDraft(
    draftId: string,
    actor: { id: string; name: string; role?: any } = { id: 'USR-001', name: 'Reviewer / Admin' },
    approvalNotes?: string
  ) {
    const draft = await questionDraftsRepository.findById(draftId);
    if (!draft) {
      throw new Error(`Draft with ID "${draftId}" not found for approval.`);
    }

    // Call canonical question creation with verified payload
    const createdQuestion = await questionService.createQuestionFromRequest(
      {
        creationMode: 'ai',
        topicId: draft.topicId,
        subtopicId: draft.subtopicId,
        categoryId: draft.categoryId,
        difficulty: draft.difficulty as any,
        language: draft.language as any,
        questionText: draft.questionText,
        question: draft.questionText,
        options: draft.options,
        correctAnswer: draft.correctAnswer,
        explanation: draft.explanation,
        realLifeContext: draft.realLifeContext,
        challengeType: draft.challengeType,
        presentationType: draft.presentationType,
        questionStyle: draft.questionStyle as any,
        tags: draft.tags,
        source: draft.source || 'AI Question Studio',
        mathematicalVerification: draft.mathematicalVerification,
        skipDuplicateCheck: true, // reviewed by human verifier
      },
      actor
    );

    // Mark question as APPROVED upon draft approval
    const approvedQuestion = await questionService.updateStatus(
      createdQuestion.id,
      QuestionStatus.APPROVED,
      { id: actor.id, name: actor.name, role: actor.role || UserRole.ADMIN },
      approvalNotes || 'Approved from draft in Stage 02'
    );

    // Remove draft once materialized
    await questionDraftsRepository.delete(draftId);

    return approvedQuestion;
  }
}

export const questionDraftService = QuestionDraftService.getInstance();
