/**
 * BURRA PARIKSHA CMS - AI Content Strategy & Adaptive Generation Service
 * Phase 29: AI Content Strategy & Adaptive Generation
 * 
 * Analyzes Phase 27 analytics and Phase 28 performance intelligence to produce evidence-backed
 * future content strategy recommendations. Integrates with Question Studio and preserves full
 * AI provenance and zero-mutation safety boundaries.
 */

import { strategyRecommendationRepository } from '../repositories/strategy-recommendation.repository';
import { socialPerformanceIntelligenceService } from './social-performance-intelligence.service';
import { analyticsService } from './analytics.service';
import { taxonomyService } from './taxonomy.service';
import { contentPlansRepository } from '../repositories/content-plans.repository';
import { auditLogRepository } from '../repositories/audit-log.repository';
import { idService } from './id.service';
import { phase24AIOrchestrator } from '../ai/phase24-orchestrator.service';
import { ContentStrategyRecommendation, ContentPlan, RecommendationStatus, QuestionLanguage, PriorityLevel, ContentPlanStatus } from '../../types';
import { AIProvenance } from '../../types/phase24-ai';

export class ContentStrategyService {
  private static instance: ContentStrategyService | null = null;
  private strategyRepo = strategyRecommendationRepository;
  private planRepo = contentPlansRepository;
  private auditLogRepo = auditLogRepository;

  private constructor() {}

  public static getInstance(): ContentStrategyService {
    if (!ContentStrategyService.instance) {
      ContentStrategyService.instance = new ContentStrategyService();
    }
    return ContentStrategyService.instance;
  }

  /**
   * Generates a new structured strategy recommendation based on Phase 28 Performance Intelligence.
   * Leverages Phase 24 Central AI Orchestrator with an optional deterministic rule fallback.
   */
  public async generateStrategyRecommendation(
    input: { sourceReportId?: string; forceFallback?: boolean },
    actorId: string = 'USER',
    actorName: string = 'User'
  ): Promise<{ success: boolean; recommendation?: ContentStrategyRecommendation; error?: string; auditLogged: boolean }> {
    try {
      // 1. Retrieve the source performance intelligence report
      let reportId = input.sourceReportId;
      let intelligenceReport = null;

      if (reportId) {
        intelligenceReport = await socialPerformanceIntelligenceService.getIntelligenceReportById(reportId);
      } else {
        const reports = await socialPerformanceIntelligenceService.getIntelligenceReports(1);
        if (reports.length > 0) {
          intelligenceReport = reports[0];
          reportId = intelligenceReport.id;
        }
      }

      // Check for low sample/insufficient data across the database
      const rawRecords = await analyticsService.queryAnalytics({});
      const totalSamples = rawRecords.length;
      const isInsufficientData = totalSamples < 3;

      let recTopicId = 'TP-MATH';
      let recSubtopicId = 'STP-ALGEBRA';
      let recDifficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM';
      let recStyle = 'NUMERICAL';
      let recContext = 'Solve standard competitive arithmetic problems.';
      let recHook = 'Can you solve this competitive exam challenge?';
      let recPresentation = 'Vertical Short';
      let recPlatform = 'youtube_shorts';
      let recEvidence = 'No historical metrics available.';
      let recConfidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA' = isInsufficientData ? 'INSUFFICIENT_DATA' : 'LOW';
      let provenance: AIProvenance | undefined = undefined;

      // Determine top performing dimensions from report if available
      if (intelligenceReport && intelligenceReport.dimensionBreakdown) {
        const db = intelligenceReport.dimensionBreakdown;
        if (db.byTopic && db.byTopic.length > 0) {
          const topTopic = [...db.byTopic].sort((a, b) => b.avgViews - a.avgViews)[0];
          if (topTopic) recTopicId = topTopic.value;
        }
        if (db.bySubtopic && db.bySubtopic.length > 0) {
          const topSub = [...db.bySubtopic].sort((a, b) => b.avgViews - a.avgViews)[0];
          if (topSub) recSubtopicId = topSub.value;
        }
        if (db.byDifficulty && db.byDifficulty.length > 0) {
          const topDiff = [...db.byDifficulty].sort((a, b) => b.avgViews - a.avgViews)[0];
          if (topDiff && ['EASY', 'MEDIUM', 'HARD'].includes(topDiff.value.toUpperCase())) {
            recDifficulty = topDiff.value.toUpperCase() as any;
          }
        }
        if (db.byChallengeType && db.byChallengeType.length > 0) {
          const topStyle = [...db.byChallengeType].sort((a, b) => b.avgViews - a.avgViews)[0];
          if (topStyle) recStyle = topStyle.value;
        }
        if (db.byPlatform && db.byPlatform.length > 0) {
          const topPlat = [...db.byPlatform].sort((a, b) => b.avgViews - a.avgViews)[0];
          if (topPlat) recPlatform = topPlat.value;
        }

        recEvidence = `Based on performance intelligence report ${intelligenceReport.id}. Analyzed ${intelligenceReport.recordCount} records. Overall: ${intelligenceReport.aiInsights?.overallVerdict || 'N/A'}`;
        recConfidence = intelligenceReport.recordCount >= 5 ? 'HIGH' : intelligenceReport.recordCount >= 3 ? 'MEDIUM' : 'LOW';
      }

      if (isInsufficientData) {
        recConfidence = 'INSUFFICIENT_DATA';
        recEvidence = `Dataset size is too small (${totalSamples} record(s)). Minimum 3 samples required. Defaulting to safe curriculum topics.`;
      }

      let generatedData: Partial<ContentStrategyRecommendation> | null = null;
      const useAI = input.forceFallback !== true && !isInsufficientData;

      if (useAI) {
        // Build prompt for Phase 24 AI Provider Orchestrator
        const prompt = `Based on the following performance intelligence and raw social analytics, generate a future content strategy recommendation.
Intelligence Report:
- ID: ${reportId || 'N/A'}
- Sample Size: ${totalSamples}
- Evidence Summary: ${recEvidence}

Top Aggregates Found:
- Suggested Topic ID: ${recTopicId}
- Suggested Subtopic ID: ${recSubtopicId}
- Suggested Difficulty: ${recDifficulty}
- Suggested Style/Challenge Type: ${recStyle}
- Preferred Platform: ${recPlatform}

Respond with a strictly formatted JSON object having these fields:
- topicId (string, match suggested topic)
- subtopicId (string, match suggested subtopic)
- difficulty (string, must be "EASY", "MEDIUM", or "HARD")
- questionStyle (string, style recommendation)
- context (string, high-quality real-world presentation context)
- hook (string, high-retention hook question)
- presentation (string, vertical format description)
- platformConsiderations (string, optimized distribution details)
- confidenceLevel (string, "HIGH", "MEDIUM" or "LOW")
- evidence (string, precise evidence linking back to analytics metrics such as views, retention or CTR)`;

        const systemInstruction = 'You are an advanced media content strategist specializing in competitive aptitude micro-learning content for Burra Pariksha. Keep suggestions actionable, grounded in evidence, and strictly structured in JSON format.';

        const aiResponse = await phase24AIOrchestrator.executeTask({
          task: 'ANALYSIS',
          prompt,
          systemInstruction,
          temperature: 0.2,
          responseSchema: {
            type: 'OBJECT',
            properties: {
              topicId: { type: 'STRING' },
              subtopicId: { type: 'STRING' },
              difficulty: { type: 'STRING', enum: ['EASY', 'MEDIUM', 'HARD'] },
              questionStyle: { type: 'STRING' },
              context: { type: 'STRING' },
              hook: { type: 'STRING' },
              presentation: { type: 'STRING' },
              platformConsiderations: { type: 'STRING' },
              confidenceLevel: { type: 'STRING', enum: ['HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT_DATA'] },
              evidence: { type: 'STRING' },
            },
            required: ['topicId', 'subtopicId', 'difficulty', 'questionStyle', 'context', 'hook', 'presentation', 'confidenceLevel', 'evidence'],
          } as any,
        });

        if (aiResponse.status === 'SUCCESS' && aiResponse.data) {
          generatedData = aiResponse.data;
          provenance = aiResponse.provenance;
        } else if (aiResponse.provenance) {
          provenance = aiResponse.provenance;
        }
      }

      // 2. Set fields from either AI generation or Deterministic fallback
      const finalTopicId = generatedData?.topicId || recTopicId;
      const finalSubtopicId = generatedData?.subtopicId || recSubtopicId;
      const finalDifficulty = (generatedData?.difficulty || recDifficulty) as 'EASY' | 'MEDIUM' | 'HARD';
      const finalQuestionStyle = generatedData?.questionStyle || recStyle;
      const finalContext = generatedData?.context || recContext;
      const finalHook = generatedData?.hook || recHook;
      const finalPresentation = generatedData?.presentation || recPresentation;
      const finalPlatform = generatedData?.platformConsiderations || `Optimized for ${recPlatform}`;
      const finalEvidence = generatedData?.evidence || recEvidence;
      const finalConfidence = generatedData?.confidenceLevel || recConfidence;

      // Allocate unique, sequential strategy ID (BP-STR-######)
      const strategyId = await idService.allocateContentStrategyId();

      const recommendation: ContentStrategyRecommendation = {
        id: strategyId,
        createdAt: new Date().toISOString(),
        sourceReportId: reportId,
        topicId: finalTopicId,
        subtopicId: finalSubtopicId,
        difficulty: finalDifficulty,
        questionStyle: finalQuestionStyle,
        context: finalContext,
        hook: finalHook,
        presentation: finalPresentation,
        platformConsiderations: finalPlatform,
        status: 'ACTIVE',
        evidence: finalEvidence,
        sampleSize: totalSamples,
        confidenceLevel: finalConfidence as any,
        provenance,
        version: 1,
      };

      // Persist the recommendation separately
      await this.strategyRepo.appendRecord(recommendation);

      // 3. Log actions to the Audit Log
      try {
        await this.auditLogRepo.logAction(
          actorId,
          actorName,
          'STRATEGY_GENERATION',
          'CONTENT_STRATEGY',
          strategyId,
          { sourceReportId: reportId, isFallback: !useAI }
        );

        await this.auditLogRepo.logAction(
          actorId,
          actorName,
          'RECOMMENDATION_CREATION',
          'CONTENT_STRATEGY',
          strategyId,
          { topicId: finalTopicId, subtopicId: finalSubtopicId, confidenceLevel: finalConfidence }
        );
      } catch {
        // non-blocking
      }

      return {
        success: true,
        recommendation,
        auditLogged: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
        auditLogged: false,
      };
    }
  }

  /**
   * Retrieves all strategy recommendations.
   */
  public async getRecommendations(limit: number = 50): Promise<ContentStrategyRecommendation[]> {
    return this.strategyRepo.getRecentRecommendations(limit);
  }

  /**
   * Retrieves a specific strategy recommendation by ID.
   */
  public async getRecommendationById(id: string): Promise<ContentStrategyRecommendation | null> {
    return this.strategyRepo.findById(id);
  }

  /**
   * Explicitly applies a strategy recommendation to Question Studio.
   * Creates a NEW editable ContentPlan (draft context) for structured planning.
   * DOES NOT silently mutate canonical production questions or automatically approve them.
   */
  public async applyRecommendation(
    recommendationId: string,
    actorId: string,
    actorName: string
  ): Promise<{ success: boolean; plan?: ContentPlan; error?: string; auditLogged: boolean }> {
    try {
      const rec = await this.strategyRepo.findById(recommendationId);
      if (!rec) {
        return { success: false, error: `Strategy recommendation "${recommendationId}" not found.`, auditLogged: false };
      }

      if (rec.status === 'STALE') {
        return { success: false, error: `Strategy recommendation "${recommendationId}" is STALE and cannot be applied.`, auditLogged: false };
      }

      // Strict Taxonomy Validation Gate
      const topicObj = await taxonomyService.getTopicById(rec.topicId);
      if (!topicObj) {
        return { success: false, error: `Taxonomy validation failed: Suggested topic ID "${rec.topicId}" does not exist in taxonomy.`, auditLogged: false };
      }

      const subtopicObj = await taxonomyService.getSubtopicById(rec.subtopicId);
      if (!subtopicObj) {
        return { success: false, error: `Taxonomy validation failed: Suggested subtopic ID "${rec.subtopicId}" does not exist in taxonomy.`, auditLogged: false };
      }

      // Allocate unique Content Plan ID (BP-PLN-####)
      const planId = await idService.allocateContentPlanId();

      const newPlan: ContentPlan = {
        id: planId,
        topicId: rec.topicId,
        topicName: topicObj.name,
        subtopicId: rec.subtopicId,
        subtopicName: subtopicObj.name,
        difficulty: rec.difficulty as any,
        language: QuestionLanguage.TELUGU, // Default language Telugu
        targetQuestionCount: 5, // default targeted sprint count
        realWorldContext: rec.context,
        questionStyle: rec.questionStyle as any,
        priority: PriorityLevel.HIGH,
        plannedDate: new Date().toISOString().split('T')[0],
        status: ContentPlanStatus.DRAFT,
        notes: `Advisory content strategy plan created from recommendation ${rec.id}. Hook: "${rec.hook}". Format: "${rec.presentation}". Platform considerations: "${rec.platformConsiderations || 'none'}". Supporting evidence: "${rec.evidence}"`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create planning context
      await this.planRepo.create(newPlan);

      // Update recommendation status to APPLIED
      await this.strategyRepo.updateRecord(rec.id, {
        status: 'APPLIED',
        appliedAt: new Date().toISOString(),
        appliedBy: actorId,
      });

      // Audit Log
      try {
        await this.auditLogRepo.logAction(
          actorId,
          actorName,
          'APPLY_STRATEGY_RECOMMENDATION',
          'CONTENT_STRATEGY',
          rec.id,
          { contentPlanId: planId, appliedParameters: { topicId: rec.topicId, subtopicId: rec.subtopicId, difficulty: rec.difficulty } }
        );
      } catch {
        // non-blocking
      }

      return {
        success: true,
        plan: newPlan,
        auditLogged: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
        auditLogged: false,
      };
    }
  }

  /**
   * Rejects a strategy recommendation.
   */
  public async rejectRecommendation(
    recommendationId: string,
    actorId: string,
    actorName: string
  ): Promise<{ success: boolean; error?: string; auditLogged: boolean }> {
    try {
      const rec = await this.strategyRepo.findById(recommendationId);
      if (!rec) {
        return { success: false, error: `Strategy recommendation "${recommendationId}" not found.`, auditLogged: false };
      }

      await this.strategyRepo.updateRecord(rec.id, {
        status: 'REJECTED',
        rejectedAt: new Date().toISOString(),
        rejectedBy: actorId,
      });

      try {
        await this.auditLogRepo.logAction(
          actorId,
          actorName,
          'RECOMMENDATION_REJECTION',
          'CONTENT_STRATEGY',
          rec.id,
          { rejectedBy: actorId }
        );
      } catch {
        // non-blocking
      }

      return {
        success: true,
        auditLogged: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
        auditLogged: false,
      };
    }
  }

  /**
   * Explicitly marks a strategy recommendation as STALE.
   * Prevents it from being treated as active/current strategy.
   */
  public async markRecommendationStale(
    recommendationId: string,
    actorId: string,
    actorName: string
  ): Promise<{ success: boolean; error?: string; auditLogged: boolean }> {
    try {
      const rec = await this.strategyRepo.findById(recommendationId);
      if (!rec) {
        return { success: false, error: `Strategy recommendation "${recommendationId}" not found.`, auditLogged: false };
      }

      await this.strategyRepo.updateRecord(rec.id, {
        status: 'STALE',
        staleAt: new Date().toISOString(),
      });

      try {
        await this.auditLogRepo.logAction(
          actorId,
          actorName,
          'RECOMMENDATION_STALE',
          'CONTENT_STRATEGY',
          rec.id,
          { reason: 'Marked stale due to newer analytical reports or manual deprecation' }
        );
      } catch {
        // non-blocking
      }

      return {
        success: true,
        auditLogged: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || String(err),
        auditLogged: false,
      };
    }
  }
}

export const contentStrategyService = ContentStrategyService.getInstance();
