/**
 * BURRA PARIKSHA CMS - Content Planning & Batch Management Service
 * Phase 9: Content Planning, Batch Management & Question Intelligence
 * 
 * Provides end-to-end content strategic planning, production sprints (batches),
 * taxonomy coverage aggregation, target vs. actual tracking, and gap analytics.
 */

import { contentPlansRepository } from '../repositories/content-plans.repository';
import { contentBatchesRepository } from '../repositories/content-batches.repository';
import { questionsRepository } from '../repositories/questions.repository';
import { videosRepository } from '../repositories/videos.repository';
import { idService } from './id.service';
import { taxonomyService } from './taxonomy.service';
import { auditService } from './audit.service';
import {
  BatchProgressMetrics,
  CategoryCoverage,
  ContentBatch,
  ContentBatchStatus,
  ContentGapAnalysis,
  ContentPlan,
  ContentPlanStatus,
  CoverageOverviewData,
  DifficultyLevel,
  PriorityLevel,
  Question,
  QuestionLanguage,
  QuestionStatus,
  SubtopicCoverage,
  TopicCoverage,
  VideoProductionStatus,
} from '../../types';
import {
  CreateContentBatchInput,
  CreateContentPlanInput,
  UpdateContentBatchInput,
  UpdateContentPlanInput,
} from '../schemas/google-sheets-schema';

export class PlanningService {
  private static instance: PlanningService | null = null;

  private constructor() {}

  public static getInstance(): PlanningService {
    if (!PlanningService.instance) {
      PlanningService.instance = new PlanningService();
    }
    return PlanningService.instance;
  }

  // ============================================================================
  // 1. CONTENT PLANS
  // ============================================================================

  /**
   * Creates a new strategic Content Plan with validated taxonomy relationships.
   */
  public async createContentPlan(
    input: CreateContentPlanInput,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<ContentPlan> {
    // 1. Validate taxonomy hierarchy
    const { category, topic, subtopic } = await taxonomyService.validateTaxonomy(
      input.categoryId,
      input.topicId,
      input.subtopicId
    );

    // 2. Allocate permanent canonical ID
    const planId = await idService.allocateContentPlanId();
    const now = new Date().toISOString();

    const plan: ContentPlan = {
      id: planId,
      categoryId: input.categoryId,
      categoryName: category ? category.name : input.categoryName || input.categoryId,
      topicId: input.topicId,
      topicName: topic ? topic.name : input.topicName || input.topicId,
      subtopicId: input.subtopicId,
      subtopicName: subtopic ? subtopic.name : input.subtopicName || input.subtopicId,
      difficulty: input.difficulty,
      language: input.language || QuestionLanguage.ENGLISH,
      targetQuestionCount: input.targetQuestionCount,
      realWorldContext: input.realWorldContext || '',
      questionStyle: input.questionStyle,
      priority: input.priority || PriorityLevel.NORMAL,
      plannedDate: input.plannedDate,
      status: ContentPlanStatus.DRAFT,
      notes: input.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    // 3. Persist
    await contentPlansRepository.create(plan);

    // 4. Audit Log
    await auditService.log(
      actor.id,
      actor.name,
      'CONTENT_PLAN_CREATED',
      'CONTENT_PLAN',
      planId,
      {
        targetQuestionCount: plan.targetQuestionCount,
        category: plan.categoryName,
        topic: plan.topicName,
        subtopic: plan.subtopicName,
        difficulty: plan.difficulty,
        plannedDate: plan.plannedDate,
      }
    );

    return plan;
  }

  /**
   * Updates an existing Content Plan.
   */
  public async updateContentPlan(
    id: string,
    input: UpdateContentPlanInput,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<ContentPlan> {
    const existing = await contentPlansRepository.findById(id);
    if (!existing) {
      throw new Error(`Content Plan '${id}' not found`);
    }

    const updated: ContentPlan = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await contentPlansRepository.update(id, updated);

    await auditService.log(
      actor.id,
      actor.name,
      'CONTENT_PLAN_UPDATED',
      'CONTENT_PLAN',
      id,
      input as Record<string, unknown>
    );

    return updated;
  }

  /**
   * Approves a Content Plan (Human Administrator Authority).
   */
  public async approveContentPlan(
    id: string,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<ContentPlan> {
    const existing = await contentPlansRepository.findById(id);
    if (!existing) {
      throw new Error(`Content Plan '${id}' not found`);
    }

    const updated: ContentPlan = {
      ...existing,
      status: ContentPlanStatus.APPROVED,
      updatedAt: new Date().toISOString(),
    };

    await contentPlansRepository.update(id, updated);

    await auditService.log(
      actor.id,
      actor.name,
      'CONTENT_PLAN_APPROVED',
      'CONTENT_PLAN',
      id,
      { previousStatus: existing.status, newStatus: ContentPlanStatus.APPROVED }
    );

    return updated;
  }

  /**
   * Transitions a Content Plan status enforcing valid lifecycle workflow rules.
   */
  public async transitionPlanStatus(
    id: string,
    newStatus: ContentPlanStatus,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<ContentPlan> {
    const existing = await contentPlansRepository.findById(id);
    if (!existing) {
      throw new Error(`Content Plan '${id}' not found`);
    }

    if (existing.status === newStatus) {
      return existing;
    }

    const ALLOWED_TRANSITIONS: Record<ContentPlanStatus, ContentPlanStatus[]> = {
      [ContentPlanStatus.DRAFT]: [ContentPlanStatus.APPROVED, ContentPlanStatus.CANCELLED],
      [ContentPlanStatus.APPROVED]: [ContentPlanStatus.IN_PROGRESS, ContentPlanStatus.DRAFT, ContentPlanStatus.CANCELLED],
      [ContentPlanStatus.IN_PROGRESS]: [ContentPlanStatus.COMPLETED, ContentPlanStatus.APPROVED, ContentPlanStatus.CANCELLED],
      [ContentPlanStatus.COMPLETED]: [ContentPlanStatus.IN_PROGRESS, ContentPlanStatus.CANCELLED],
      [ContentPlanStatus.CANCELLED]: [ContentPlanStatus.DRAFT],
    };

    const allowed = ALLOWED_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid status transition from '${existing.status}' to '${newStatus}'. Allowed: ${allowed.join(', ')}`);
    }

    const updated: ContentPlan = {
      ...existing,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    await contentPlansRepository.update(id, updated);

    await auditService.log(
      actor.id,
      actor.name,
      'CONTENT_PLAN_STATUS_CHANGED',
      'CONTENT_PLAN',
      id,
      { previousStatus: existing.status, newStatus }
    );

    return updated;
  }

  /**
   * Deletes a Content Plan if no active batches depend on it.
   */
  public async deleteContentPlan(
    id: string,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<boolean> {
    const existing = await contentPlansRepository.findById(id);
    if (!existing) {
      throw new Error(`Content Plan '${id}' not found`);
    }

    const associatedBatches = await contentBatchesRepository.findByPlanId(id);
    if (associatedBatches.length > 0) {
      throw new Error(`Cannot delete Content Plan '${id}' because ${associatedBatches.length} production batch(es) are linked to it.`);
    }

    await contentPlansRepository.delete(id);

    await auditService.log(
      actor.id,
      actor.name,
      'CONTENT_PLAN_DELETED',
      'CONTENT_PLAN',
      id,
      { deletedPlan: existing }
    );

    return true;
  }

  /**
   * Retrieves all Content Plans enriched with current progress and batch count.
   */
  public async getAllContentPlans(filter?: {
    categoryId?: string;
    topicId?: string;
    status?: ContentPlanStatus;
  }): Promise<ContentPlan[]> {
    let plans = await contentPlansRepository.findAll();
    const allQuestions = await questionsRepository.findAll();
    const allBatches = await contentBatchesRepository.findAll();

    if (filter?.categoryId) {
      plans = plans.filter((p) => p.categoryId === filter.categoryId);
    }
    if (filter?.topicId) {
      plans = plans.filter((p) => p.topicId === filter.topicId);
    }
    if (filter?.status) {
      plans = plans.filter((p) => p.status === filter.status);
    }

    return plans.map((plan) => {
      // Find matching questions created in this subtopic with matching difficulty
      const matchingQuestions = allQuestions.filter(
        (q) =>
          q.subtopicId === plan.subtopicId &&
          (!plan.difficulty || q.difficulty === plan.difficulty) &&
          q.status !== QuestionStatus.REJECTED
      );

      const currentCount = matchingQuestions.length;
      const remainingCount = Math.max(0, plan.targetQuestionCount - currentCount);
      const completionPercentage =
        plan.targetQuestionCount > 0
          ? Math.min(100, Math.round((currentCount / plan.targetQuestionCount) * 100))
          : 0;

      const createdBatchesCount = allBatches.filter((b) => b.planId === plan.id).length;

      return {
        ...plan,
        currentQuestionCount: currentCount,
        remainingQuestionCount: remainingCount,
        completionPercentage,
        createdBatchesCount,
      };
    });
  }

  /**
   * Retrieves single Content Plan by ID with derived progress metrics.
   */
  public async getContentPlanById(id: string): Promise<ContentPlan | null> {
    const plan = await contentPlansRepository.findById(id);
    if (!plan) return null;

    const allQuestions = await questionsRepository.findAll();
    const allBatches = await contentBatchesRepository.findAll();

    const matchingQuestions = allQuestions.filter(
      (q) =>
        q.subtopicId === plan.subtopicId &&
        (!plan.difficulty || q.difficulty === plan.difficulty) &&
        q.status !== QuestionStatus.REJECTED
    );

    const currentCount = matchingQuestions.length;
    const remainingCount = Math.max(0, plan.targetQuestionCount - currentCount);
    const completionPercentage =
      plan.targetQuestionCount > 0
        ? Math.min(100, Math.round((currentCount / plan.targetQuestionCount) * 100))
        : 0;
    const createdBatchesCount = allBatches.filter((b) => b.planId === plan.id).length;

    return {
      ...plan,
      currentQuestionCount: currentCount,
      remainingQuestionCount: remainingCount,
      completionPercentage,
      createdBatchesCount,
    };
  }

  // ============================================================================
  // 2. CONTENT BATCHES
  // ============================================================================

  /**
   * Creates a production batch linked to a Content Plan.
   */
  public async createContentBatch(
    input: CreateContentBatchInput,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<ContentBatch> {
    const plan = await contentPlansRepository.findById(input.planId);
    if (!plan) {
      throw new Error(`Content Plan '${input.planId}' does not exist.`);
    }

    const batchId = await idService.allocateContentBatchId();
    const now = new Date().toISOString();

    const batch: ContentBatch = {
      id: batchId,
      name: input.name,
      description: input.description || '',
      planId: input.planId,
      targetCount: input.targetCount,
      priority: input.priority || PriorityLevel.NORMAL,
      plannedDate: input.plannedDate,
      status: ContentBatchStatus.PLANNED,
      questionIds: input.questionIds || [],
      createdAt: now,
      updatedAt: now,
    };

    await contentBatchesRepository.create(batch);

    // If plan was DRAFT or APPROVED, move plan to IN_PROGRESS
    if (plan.status === ContentPlanStatus.APPROVED || plan.status === ContentPlanStatus.DRAFT) {
      await contentPlansRepository.update(plan.id, {
        ...plan,
        status: ContentPlanStatus.IN_PROGRESS,
        updatedAt: now,
      });
    }

    await auditService.log(
      actor.id,
      actor.name,
      'CONTENT_BATCH_CREATED',
      'CONTENT_BATCH',
      batchId,
      {
        batchName: batch.name,
        planId: batch.planId,
        targetCount: batch.targetCount,
        priority: batch.priority,
      }
    );

    return batch;
  }

  /**
   * Updates an existing batch.
   */
  public async updateContentBatch(
    id: string,
    input: UpdateContentBatchInput,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<ContentBatch> {
    const existing = await contentBatchesRepository.findById(id);
    if (!existing) {
      throw new Error(`Content Batch '${id}' not found.`);
    }

    const updated: ContentBatch = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    await contentBatchesRepository.update(id, updated);

    await auditService.log(
      actor.id,
      actor.name,
      'CONTENT_BATCH_UPDATED',
      'CONTENT_BATCH',
      id,
      input as Record<string, unknown>
    );

    return updated;
  }

  /**
   * Associates or removes questions from a production batch.
   */
  public async linkBatchQuestions(
    batchId: string,
    questionIds: string[],
    action: 'ADD' | 'REMOVE' | 'SET' = 'ADD',
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<ContentBatch> {
    const batch = await contentBatchesRepository.findById(batchId);
    if (!batch) {
      throw new Error(`Content Batch '${batchId}' not found.`);
    }

    let currentIds = Array.isArray(batch.questionIds) ? [...batch.questionIds] : [];

    if (action === 'ADD') {
      const set = new Set(currentIds);
      questionIds.forEach((qid) => set.add(qid));
      currentIds = Array.from(set);
    } else if (action === 'REMOVE') {
      const set = new Set(questionIds);
      currentIds = currentIds.filter((qid) => !set.has(qid));
    } else if (action === 'SET') {
      currentIds = Array.from(new Set(questionIds));
    }

    const updated: ContentBatch = {
      ...batch,
      questionIds: currentIds,
      // If batch was PLANNED and now has questions, auto-mark ACTIVE
      status:
        batch.status === ContentBatchStatus.PLANNED && currentIds.length > 0
          ? ContentBatchStatus.ACTIVE
          : batch.status,
      updatedAt: new Date().toISOString(),
    };

    await contentBatchesRepository.update(batchId, updated);

    await auditService.log(
      actor.id,
      actor.name,
      'CONTENT_BATCH_QUESTIONS_LINKED',
      'CONTENT_BATCH',
      batchId,
      { action, modifiedQuestionIds: questionIds, totalLinked: currentIds.length }
    );

    return updated;
  }

  /**
   * Deletes a Content Batch.
   */
  public async deleteContentBatch(
    id: string,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<boolean> {
    const existing = await contentBatchesRepository.findById(id);
    if (!existing) {
      throw new Error(`Content Batch '${id}' not found`);
    }

    await contentBatchesRepository.delete(id);

    await auditService.log(
      actor.id,
      actor.name,
      'CONTENT_BATCH_DELETED',
      'CONTENT_BATCH',
      id,
      { deletedBatch: existing }
    );

    return true;
  }

  /**
   * Computes lifecycle progress metrics for a batch.
   */
  public async getBatchProgressMetrics(batchId: string): Promise<BatchProgressMetrics> {
    const batch = await contentBatchesRepository.findById(batchId);
    if (!batch) {
      throw new Error(`Content Batch '${batchId}' not found.`);
    }

    const allQuestions = await questionsRepository.findAll();
    const allVideos = await videosRepository.findAll();

    const linkedQuestionIds = Array.isArray(batch.questionIds) ? batch.questionIds : [];
    const questions = allQuestions.filter((q) => linkedQuestionIds.includes(q.id));

    let generated = 0;
    let editing = 0;
    let approved = 0;
    let rejected = 0;
    let queued = 0;
    let inProduction = 0;
    let published = 0;

    for (const q of questions) {
      if (q.status === QuestionStatus.GENERATED) generated++;
      else if (q.status === QuestionStatus.EDITING) editing++;
      else if (q.status === QuestionStatus.APPROVED) approved++;
      else if (q.status === QuestionStatus.REJECTED) rejected++;

      // Check video production status
      const v = allVideos.find((vid) => vid.questionId === q.id);
      if (v) {
        if (v.status === VideoProductionStatus.QUEUED) queued++;
        else if (
          [
            VideoProductionStatus.RECORDING,
            VideoProductionStatus.RECORDED,
            VideoProductionStatus.EDITING,
            VideoProductionStatus.EDITED,
            VideoProductionStatus.FINAL_REVIEW,
            VideoProductionStatus.READY_TO_UPLOAD,
          ].includes(v.status)
        ) {
          inProduction++;
        } else if (v.status === VideoProductionStatus.UPLOADED) {
          published++;
        }
      }
    }

    const remainingToApprove = Math.max(0, batch.targetCount - approved);
    const completionPercentage =
      batch.targetCount > 0
        ? Math.min(100, Math.round((approved / batch.targetCount) * 100))
        : 0;

    const isReadyForProduction = approved >= batch.targetCount && batch.targetCount > 0;

    return {
      batchId: batch.id,
      batchName: batch.name,
      planId: batch.planId,
      status: batch.status,
      targetCount: batch.targetCount,
      totalAssociated: questions.length,
      generated,
      editing,
      approved,
      rejected,
      queued,
      inProduction,
      published,
      remainingToApprove,
      completionPercentage,
      isReadyForProduction,
    };
  }

  /**
   * Retrieves all Content Batches with computed progress metrics.
   */
  public async getAllBatchesWithMetrics(filter?: {
    planId?: string;
    status?: ContentBatchStatus;
  }): Promise<{ batch: ContentBatch; metrics: BatchProgressMetrics }[]> {
    let batches = await contentBatchesRepository.findAll();

    if (filter?.planId) {
      batches = batches.filter((b) => b.planId === filter.planId);
    }
    if (filter?.status) {
      batches = batches.filter((b) => b.status === filter.status);
    }

    const results = [];
    for (const batch of batches) {
      const metrics = await this.getBatchProgressMetrics(batch.id);
      results.push({ batch, metrics });
    }

    return results;
  }

  // ============================================================================
  // 3. COVERAGE INTELLIGENCE & AGGREGATION
  // ============================================================================

  /**
   * Calculates comprehensive hierarchical coverage overview across all taxonomy nodes.
   */
  public async getCoverageOverview(): Promise<CoverageOverviewData> {
    const categories = await taxonomyService.getCategories();
    const topics = await taxonomyService.getTopics();
    const subtopics = await taxonomyService.getSubtopics();
    const questions = await questionsRepository.findAll();
    const videos = await videosRepository.findAll();

    let totalCoveredSubtopics = 0;
    let zeroCoverageSubtopicsCount = 0;
    let lowCoverageSubtopicsCount = 0;

    let easyCount = 0;
    let medCount = 0;
    let hardCount = 0;

    let engCount = 0;
    let telCount = 0;

    let draftCount = 0;
    let genCount = 0;
    let editCount = 0;
    let appCount = 0;
    let rejCount = 0;

    const categoryCoverages: CategoryCoverage[] = [];

    for (const cat of categories) {
      const catTopics = topics.filter((t) => t.categoryId === cat.id);
      const topicCoverages: TopicCoverage[] = [];
      let catQuestionsCount = 0;
      let catSubtopicsCount = 0;
      let catCoveredSubtopicsCount = 0;

      for (const top of catTopics) {
        const topSubtopics = subtopics.filter((s) => s.topicId === top.id);
        const subtopicCoverages: SubtopicCoverage[] = [];
        let topQuestionsCount = 0;
        let topActiveSubtopicsCount = 0;
        let topZeroSubtopicsCount = 0;

        for (const sub of topSubtopics) {
          catSubtopicsCount++;
          const subQuestions = questions.filter((q) => q.subtopicId === sub.id);
          const count = subQuestions.length;
          topQuestionsCount += count;
          catQuestionsCount += count;

          const byStatus = {
            draft: 0,
            generated: 0,
            editing: 0,
            approved: 0,
            rejected: 0,
          };

          const byDifficulty = {
            easy: 0,
            medium: 0,
            hard: 0,
          };

          const byLanguage = {
            english: 0,
            telugu: 0,
          };

          const byProduction = {
            queued: 0,
            inProduction: 0,
            published: 0,
          };

          for (const q of subQuestions) {
            // Status counts
            if (q.status === QuestionStatus.DRAFT) {
              byStatus.draft++;
              draftCount++;
            } else if (q.status === QuestionStatus.GENERATED) {
              byStatus.generated++;
              genCount++;
            } else if (q.status === QuestionStatus.EDITING) {
              byStatus.editing++;
              editCount++;
            } else if (q.status === QuestionStatus.APPROVED) {
              byStatus.approved++;
              appCount++;
            } else if (q.status === QuestionStatus.REJECTED) {
              byStatus.rejected++;
              rejCount++;
            }

            // Difficulty counts
            if (q.difficulty === DifficultyLevel.EASY) {
              byDifficulty.easy++;
              easyCount++;
            } else if (q.difficulty === DifficultyLevel.MEDIUM) {
              byDifficulty.medium++;
              medCount++;
            } else if (q.difficulty === DifficultyLevel.HARD) {
              byDifficulty.hard++;
              hardCount++;
            }

            // Language counts
            if (q.language === QuestionLanguage.TELUGU) {
              byLanguage.telugu++;
              telCount++;
            } else {
              byLanguage.english++;
              engCount++;
            }

            // Video Production
            const v = videos.find((vid) => vid.questionId === q.id);
            if (v) {
              if (v.status === VideoProductionStatus.QUEUED) byProduction.queued++;
              else if (v.status === VideoProductionStatus.UPLOADED) byProduction.published++;
              else byProduction.inProduction++;
            }
          }

          const isZero = count === 0;
          const isLow = count > 0 && count < 3;

          if (isZero) {
            zeroCoverageSubtopicsCount++;
            topZeroSubtopicsCount++;
          } else {
            totalCoveredSubtopics++;
            catCoveredSubtopicsCount++;
            topActiveSubtopicsCount++;
            if (isLow) lowCoverageSubtopicsCount++;
          }

          subtopicCoverages.push({
            subtopicId: sub.id,
            subtopicName: sub.name,
            topicId: top.id,
            topicName: top.name,
            categoryId: cat.id,
            categoryName: cat.name,
            totalQuestions: count,
            byStatus,
            byDifficulty,
            byLanguage,
            byProduction,
            isZeroCoverage: isZero,
            isLowCoverage: isLow,
          });
        }

        const topCoveragePct =
          topSubtopics.length > 0
            ? Math.round((topActiveSubtopicsCount / topSubtopics.length) * 100)
            : 0;

        topicCoverages.push({
          topicId: top.id,
          topicName: top.name,
          categoryId: cat.id,
          categoryName: cat.name,
          totalQuestions: topQuestionsCount,
          subtopicsCount: topSubtopics.length,
          activeSubtopicsCount: topActiveSubtopicsCount,
          zeroSubtopicsCount: topZeroSubtopicsCount,
          coveragePercentage: topCoveragePct,
          subtopics: subtopicCoverages,
        });
      }

      const catCoveragePct =
        catSubtopicsCount > 0
          ? Math.round((catCoveredSubtopicsCount / catSubtopicsCount) * 100)
          : 0;

      categoryCoverages.push({
        categoryId: cat.id,
        categoryName: cat.name,
        colorCode: cat.colorCode,
        totalQuestions: catQuestionsCount,
        totalTopics: catTopics.length,
        totalSubtopics: catSubtopicsCount,
        coveredSubtopics: catCoveredSubtopicsCount,
        coveragePercentage: catCoveragePct,
        topics: topicCoverages,
      });
    }

    const totalQuestionsCount = questions.length;
    const overallTaxonomyCoveragePercentage =
      subtopics.length > 0
        ? Math.round((totalCoveredSubtopics / subtopics.length) * 100)
        : 0;

    return {
      totalQuestions: totalQuestionsCount,
      totalCategories: categories.length,
      totalTopics: topics.length,
      totalSubtopics: subtopics.length,
      coveredSubtopicsCount: totalCoveredSubtopics,
      zeroCoverageSubtopicsCount,
      lowCoverageSubtopicsCount,
      overallTaxonomyCoveragePercentage,
      byDifficulty: {
        easy: easyCount,
        medium: medCount,
        hard: hardCount,
        easyPercentage: totalQuestionsCount > 0 ? Math.round((easyCount / totalQuestionsCount) * 100) : 0,
        mediumPercentage: totalQuestionsCount > 0 ? Math.round((medCount / totalQuestionsCount) * 100) : 0,
        hardPercentage: totalQuestionsCount > 0 ? Math.round((hardCount / totalQuestionsCount) * 100) : 0,
      },
      byLanguage: {
        english: engCount,
        telugu: telCount,
      },
      byStatus: {
        draft: draftCount,
        generated: genCount,
        editing: editCount,
        approved: appCount,
        rejected: rejCount,
      },
      categories: categoryCoverages,
    };
  }

  /**
   * Generates actionable Content Gap Analysis diagnostics across the curriculum.
   */
  public async getGapAnalysis(): Promise<ContentGapAnalysis> {
    const coverage = await this.getCoverageOverview();

    const zeroCoverageSubtopics: {
      subtopicId: string;
      subtopicName: string;
      topicName: string;
      categoryName: string;
    }[] = [];

    const lowCoverageSubtopics: {
      subtopicId: string;
      subtopicName: string;
      topicName: string;
      categoryName: string;
      currentCount: number;
    }[] = [];

    const difficultyGaps: {
      topicId: string;
      topicName: string;
      categoryName: string;
      missingDifficulties: DifficultyLevel[];
      recommendation: string;
    }[] = [];

    const languageGaps: {
      topicId: string;
      topicName: string;
      categoryName: string;
      missingLanguages: QuestionLanguage[];
      recommendation: string;
    }[] = [];

    const concentrationRisks: {
      topicId: string;
      topicName: string;
      categoryName: string;
      questionCount: number;
      percentageOfTotal: number;
      warning: string;
    }[] = [];

    for (const cat of coverage.categories) {
      for (const top of cat.topics) {
        // Check topic concentration
        if (coverage.totalQuestions > 10) {
          const pct = Math.round((top.totalQuestions / coverage.totalQuestions) * 100);
          if (pct > 35) {
            concentrationRisks.push({
              topicId: top.topicId,
              topicName: top.topicName,
              categoryName: cat.categoryName,
              questionCount: top.totalQuestions,
              percentageOfTotal: pct,
              warning: `Topic '${top.topicName}' represents ${pct}% of the entire question repository.`,
            });
          }
        }

        // Aggregate topic level difficulty coverage
        let hasEasy = false;
        let hasMed = false;
        let hasHard = false;
        let hasEng = false;
        let hasTel = false;

        for (const sub of top.subtopics) {
          if (sub.isZeroCoverage) {
            zeroCoverageSubtopics.push({
              subtopicId: sub.subtopicId,
              subtopicName: sub.subtopicName,
              topicName: top.topicName,
              categoryName: cat.categoryName,
            });
          } else if (sub.isLowCoverage) {
            lowCoverageSubtopics.push({
              subtopicId: sub.subtopicId,
              subtopicName: sub.subtopicName,
              topicName: top.topicName,
              categoryName: cat.categoryName,
              currentCount: sub.totalQuestions,
            });
          }

          if (sub.byDifficulty.easy > 0) hasEasy = true;
          if (sub.byDifficulty.medium > 0) hasMed = true;
          if (sub.byDifficulty.hard > 0) hasHard = true;

          if (sub.byLanguage.english > 0) hasEng = true;
          if (sub.byLanguage.telugu > 0) hasTel = true;
        }

        if (top.totalQuestions > 0) {
          const missingDiffs: DifficultyLevel[] = [];
          if (!hasEasy) missingDiffs.push(DifficultyLevel.EASY);
          if (!hasMed) missingDiffs.push(DifficultyLevel.MEDIUM);
          if (!hasHard) missingDiffs.push(DifficultyLevel.HARD);

          if (missingDiffs.length > 0) {
            difficultyGaps.push({
              topicId: top.topicId,
              topicName: top.topicName,
              categoryName: cat.categoryName,
              missingDifficulties: missingDiffs,
              recommendation: `Create ${missingDiffs.join(', ')} questions for balanced syllabus mastery.`,
            });
          }

          const missingLangs: QuestionLanguage[] = [];
          if (!hasTel) missingLangs.push(QuestionLanguage.TELUGU);

          if (missingLangs.length > 0 && top.totalQuestions >= 5) {
            languageGaps.push({
              topicId: top.topicId,
              topicName: top.topicName,
              categoryName: cat.categoryName,
              missingLanguages: missingLangs,
              recommendation: `Translate or author questions in Telugu to support bilingual regional aspirants.`,
            });
          }
        }
      }
    }

    return {
      zeroCoverageSubtopics,
      lowCoverageSubtopics,
      difficultyGaps,
      languageGaps,
      concentrationRisks,
    };
  }
}

export const planningService = PlanningService.getInstance();
