/**
 * BURRA PARIKSHA CMS - Social Performance Intelligence Service
 * Phase 28: AI Social Performance Intelligence Engine
 * 
 * Conducts multi-dimensional analytics analysis using deterministic aggregation
 * followed by structured advisory AI analysis via Gemini / AIOrchestrator.
 * 
 * STRICT MANDATES:
 * 1. ₹0 Architecture: Built using available Gemini SDK / deterministic fallback rule engine.
 * 2. Zero Production Mutation: Operates strictly read-only against CMS tables. Writes ONLY to Analytics Workbook (ANALYTICS_INTELLIGENCE tab).
 * 3. Evidence Traceability: Every insight references explicit sample sizes, averages, and record IDs.
 * 4. Advisory Only: Outputs recommendations only. Cannot approve, publish, delete, or modify production records.
 */

import { analyticsService } from './analytics.service';
import { intelligenceRepository, IntelligenceRepository } from '../repositories/intelligence.repository';
import { idService } from './id.service';
import { taxonomyService } from './taxonomy.service';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { geminiClient } from '../ai/gemini.client';
import { aiOrchestrator } from '../ai/ai-orchestrator.service';
import { AIProvenance } from '../../types/ai';
import { PerformanceIntelligenceGenAISchema, PerformanceIntelligenceZodSchema, PerformanceIntelligenceAIOutput } from '../ai/schemas/performance-intelligence.schema';
import { BURRA_PARIKSHA_PERFORMANCE_INTELLIGENCE_SYSTEM_INSTRUCTION, buildPerformanceIntelligencePrompt } from '../ai/prompts/performance-intelligence.prompt';
import {
  ApplyStrategyRecommendationInput,
  ApplyStrategyRecommendationResult,
  DimensionMetricAggregate,
  GeneratePerformanceIntelligenceInput,
  PostingTimeMetricAggregate,
  PostingTimeRecommendation,
  QuestionStudioStrategyRecommendation,
  SocialAnalyticsQueryFilters,
  SocialAnalyticsRecord,
  SocialAnalyticsSummary,
  SocialPerformanceIntelligenceRecord,
} from '../../types';

export class SocialPerformanceIntelligenceService {
  private static instance: SocialPerformanceIntelligenceService | null = null;
  private intelligenceRepo: IntelligenceRepository;
  private auditLogRepo: AuditLogRepository;

  private constructor() {
    this.intelligenceRepo = intelligenceRepository;
    this.auditLogRepo = AuditLogRepository.getInstance();
  }

  public static getInstance(): SocialPerformanceIntelligenceService {
    if (!SocialPerformanceIntelligenceService.instance) {
      SocialPerformanceIntelligenceService.instance = new SocialPerformanceIntelligenceService();
    }
    return SocialPerformanceIntelligenceService.instance;
  }

  /**
   * Generates and persists an AI Social Performance Intelligence analysis based on analytics snapshots.
   */
  public async generateIntelligence(
    input: GeneratePerformanceIntelligenceInput = {},
    actorId: string = 'SYSTEM',
    actorName: string = 'System User'
  ): Promise<{ success: boolean; record?: SocialPerformanceIntelligenceRecord; error?: string }> {
    try {
      const filters: SocialAnalyticsQueryFilters = {
        contentId: input.contentId,
        platform: input.platform,
        startDate: input.startDate,
        endDate: input.endDate,
        topicId: input.topicId,
        subtopicId: input.subtopicId,
      };

      // 1. Fetch relevant analytics snapshots (read-only)
      const records = await analyticsService.queryAnalytics(filters);

      // 2. Compute overall deterministic summary
      const deterministicSummary = await analyticsService.getAnalyticsSummary(filters);

      // 3. Compute multi-dimensional aggregations
      const dimensionBreakdown = this.computeMultiDimensionalBreakdowns(records);

      // 4. Evidence Traceability & Sample Size Checks
      const recordIdsUsed = records.map((r) => r.id);
      const totalSamples = records.length;
      const insufficientDataFlag = totalSamples < 3;
      const insufficientDimensions = this.findInsufficientDimensions(dimensionBreakdown);

      if (totalSamples === 0) {
        return {
          success: false,
          error: 'No analytics records found for the specified filters.',
        };
      }

      // 5. Execute AI Performance Analysis
      const aiResult = await this.invokeAIPerformanceAnalysis(deterministicSummary, dimensionBreakdown);
      const aiOutput: PerformanceIntelligenceAIOutput = aiResult.aiOutput;
      const provenance = aiResult.provenance;
      const modelUsed = provenance.model || 'gemini-3.8-flash';

      // 6. Generate sequential ID: BP-SPI-######
      const id = await idService.allocateIntelligenceId();
      const now = new Date().toISOString();

      // 7. Construct complete intelligence record
      const intelligenceRecord: SocialPerformanceIntelligenceRecord = {
        id,
        analyzedAt: now,
        actorId,
        actorName,
        recordCount: totalSamples,
        dataSnapshotFilters: filters,
        deterministicSummary,
        dimensionBreakdown,
        aiInsights: aiOutput,
        isFallbackMode: false,
        modelUsed,
        provenance,
        evidenceTraceability: {
          recordIdsUsed,
          totalSamples,
          insufficientDataFlag,
          insufficientDimensions,
        },
      };

      // 8. Persist to Analytics Workbook (ANALYTICS_INTELLIGENCE tab, append-only)
      await this.intelligenceRepo.appendRecord(intelligenceRecord);

      // 9. Audit Logging (non-blocking)
      try {
        await this.auditLogRepo.logAction(
          actorId,
          actorName,
          'CREATE_INTELLIGENCE_REPORT',
          'SOCIAL_PERFORMANCE_INTELLIGENCE',
          id,
          {
            reportId: id,
            recordCount: totalSamples,
            isFallbackMode: false,
            modelUsed,
          }
        );
      } catch {
        // Non-blocking
      }

      return {
        success: true,
        record: intelligenceRecord,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Failed to generate Social Performance Intelligence: ${err?.message || String(err)}`,
      };
    }
  }

  /**
   * Retrieves past performance intelligence reports.
   */
  public async getIntelligenceReports(limit: number = 20): Promise<SocialPerformanceIntelligenceRecord[]> {
    return this.intelligenceRepo.getRecentIntelligence(limit);
  }

  /**
   * Retrieves a specific intelligence report by BP-SPI-###### ID.
   */
  public async getIntelligenceReportById(id: string): Promise<SocialPerformanceIntelligenceRecord | null> {
    return this.intelligenceRepo.findById(id);
  }

  /**
   * Deterministically aggregates metrics by dimensions (Platform, Topic, Subtopic, Difficulty, ChallengeType, Language, PresentationType).
   */
  private computeMultiDimensionalBreakdowns(records: SocialAnalyticsRecord[]): SocialPerformanceIntelligenceRecord['dimensionBreakdown'] {
    const aggregateByDimension = (
      extractValue: (r: SocialAnalyticsRecord) => string | undefined,
      dimensionName: string
    ): DimensionMetricAggregate[] => {
      const map: Record<string, SocialAnalyticsRecord[]> = {};

      for (const r of records) {
        const val = extractValue(r);
        if (val && val.trim().length > 0) {
          const key = val.trim();
          if (!map[key]) map[key] = [];
          map[key].push(r);
        }
      }

      return Object.entries(map).map(([val, items]) => {
        const count = items.length;
        const sumViews = items.reduce((acc, i) => acc + (i.views || 0), 0);
        const sumWatchTime = items.reduce((acc, i) => acc + (i.watchTime || 0), 0);
        const sumRetention = items.reduce((acc, i) => acc + (i.retentionRate || 0), 0);
        const sumLikes = items.reduce((acc, i) => acc + (i.likes || 0), 0);
        const sumComments = items.reduce((acc, i) => acc + (i.comments || 0), 0);
        const sumShares = items.reduce((acc, i) => acc + (i.shares || 0), 0);
        const sumSubs = items.reduce((acc, i) => acc + (i.subscribersGained || 0), 0);
        const sumCtr = items.reduce((acc, i) => acc + (i.ctr || 0), 0);

        return {
          dimension: dimensionName,
          value: val,
          sampleSize: count,
          avgViews: Number((sumViews / count).toFixed(2)),
          avgWatchTime: Number((sumWatchTime / count).toFixed(2)),
          avgRetentionRate: Number((sumRetention / count).toFixed(2)),
          avgLikes: Number((sumLikes / count).toFixed(2)),
          avgComments: Number((sumComments / count).toFixed(2)),
          avgShares: Number((sumShares / count).toFixed(2)),
          avgSubscribersGained: Number((sumSubs / count).toFixed(2)),
          avgCtr: Number((sumCtr / count).toFixed(2)),
          insufficientData: count < 3,
        };
      });
    };

    return {
      byPlatform: aggregateByDimension((r) => r.platform, 'Platform'),
      byTopic: aggregateByDimension((r) => r.topicId, 'Topic'),
      bySubtopic: aggregateByDimension((r) => r.subtopicId, 'Subtopic'),
      byDifficulty: aggregateByDimension((r) => r.difficulty, 'Difficulty'),
      byChallengeType: aggregateByDimension((r) => r.challengeType, 'ChallengeType'),
      byLanguage: aggregateByDimension((r) => r.language, 'Language'),
      byPresentationType: aggregateByDimension((r) => r.presentationType, 'PresentationType'),
      postingTimeAnalysis: this.computePostingTimeBreakdowns(records),
    };
  }

  /**
   * Phase 29B: Deterministically aggregates posting performance metrics by useful time dimensions:
   * - hour of day (0-23 and 3-hour windows)
   * - day of week (SUNDAY through SATURDAY)
   * - platform time window combinations
   */
  public computePostingTimeBreakdowns(records: SocialAnalyticsRecord[]): {
    byHourOfDay: PostingTimeMetricAggregate[];
    byDayOfWeek: PostingTimeMetricAggregate[];
    byPlatformTimeWindow: PostingTimeMetricAggregate[];
  } {
    const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    const get3HourWindow = (hour: number): string => {
      const start = Math.floor(hour / 3) * 3;
      const end = start + 3;
      const startStr = start.toString().padStart(2, '0') + ':00';
      const endStr = end.toString().padStart(2, '0') + ':00';
      return `${startStr} - ${endStr} UTC`;
    };

    const hourMap: Record<number, SocialAnalyticsRecord[]> = {};
    const dayMap: Record<string, SocialAnalyticsRecord[]> = {};
    const platformWindowMap: Record<string, SocialAnalyticsRecord[]> = {};

    for (const r of records) {
      const ts = r.postingTimestamp || r.capturedAt;
      if (!ts) continue;
      const date = new Date(ts);
      if (isNaN(date.getTime())) continue;

      const hour = date.getUTCHours();
      const day = DAYS[date.getUTCDay()];
      const windowStr = get3HourWindow(hour);
      const platform = (r.platform || 'ALL').toLowerCase();

      if (!hourMap[hour]) hourMap[hour] = [];
      hourMap[hour].push(r);

      if (!dayMap[day]) dayMap[day] = [];
      dayMap[day].push(r);

      const pwKey = `${platform} | ${day} ${windowStr}`;
      if (!platformWindowMap[pwKey]) platformWindowMap[pwKey] = [];
      platformWindowMap[pwKey].push(r);
    }

    const calcAggregate = (
      items: SocialAnalyticsRecord[],
      platform: string,
      timeWindow: string,
      dayOfWeek?: string,
      hourOfDay?: number
    ): PostingTimeMetricAggregate => {
      const count = items.length;
      const sumViews = items.reduce((acc, i) => acc + (i.views || 0), 0);
      const sumWatchTime = items.reduce((acc, i) => acc + (i.watchTime || 0), 0);
      const sumRetention = items.reduce((acc, i) => acc + (i.retentionRate || 0), 0);
      const sumLikes = items.reduce((acc, i) => acc + (i.likes || 0), 0);
      const sumComments = items.reduce((acc, i) => acc + (i.comments || 0), 0);
      const sumShares = items.reduce((acc, i) => acc + (i.shares || 0), 0);
      const sumSubs = items.reduce((acc, i) => acc + (i.subscribersGained || 0), 0);
      const sumCtr = items.reduce((acc, i) => acc + (i.ctr || 0), 0);

      return {
        timeWindow,
        dayOfWeek,
        hourOfDay,
        platform,
        sampleSize: count,
        avgViews: Number((sumViews / count).toFixed(2)),
        avgWatchTime: Number((sumWatchTime / count).toFixed(2)),
        avgRetentionRate: Number((sumRetention / count).toFixed(2)),
        avgLikes: Number((sumLikes / count).toFixed(2)),
        avgComments: Number((sumComments / count).toFixed(2)),
        avgShares: Number((sumShares / count).toFixed(2)),
        avgSubscribersGained: Number((sumSubs / count).toFixed(2)),
        avgCtr: Number((sumCtr / count).toFixed(2)),
        insufficientData: count < 3,
      };
    };

    const byHourOfDay = Object.entries(hourMap).map(([hStr, items]) => {
      const h = Number(hStr);
      return calcAggregate(items, 'ALL', get3HourWindow(h), undefined, h);
    });

    const byDayOfWeek = Object.entries(dayMap).map(([day, items]) => {
      return calcAggregate(items, 'ALL', `${day} UTC`, day, undefined);
    });

    const byPlatformTimeWindow = Object.entries(platformWindowMap).map(([pwKey, items]) => {
      const [plat, windowStr] = pwKey.split(' | ');
      return calcAggregate(items, plat, windowStr);
    });

    return {
      byHourOfDay,
      byDayOfWeek,
      byPlatformTimeWindow,
    };
  }

  /**
   * Phase 29B: Generates deterministic advisory posting-time recommendations with sample-size safeguards.
   */
  public generateDeterministicPostingTimeRecommendations(
    postingTimeAnalysis?: {
      byHourOfDay: PostingTimeMetricAggregate[];
      byDayOfWeek: PostingTimeMetricAggregate[];
      byPlatformTimeWindow: PostingTimeMetricAggregate[];
    },
    totalRecords: number = 0
  ): PostingTimeRecommendation[] {
    if (!postingTimeAnalysis) {
      return [
        {
          recommendedWindow: '18:00 - 21:00 UTC (Default Baseline)',
          platform: 'ALL',
          sampleSize: 0,
          supportingEvidence: 'No historical posting-time analytics available. Standard evening peak baseline suggested pending data collection.',
          confidenceLevel: 'LOW',
        },
      ];
    }

    const candidates = [
      ...postingTimeAnalysis.byPlatformTimeWindow,
      ...postingTimeAnalysis.byHourOfDay,
      ...postingTimeAnalysis.byDayOfWeek,
    ];

    if (candidates.length === 0 || totalRecords === 0) {
      return [
        {
          recommendedWindow: '18:00 - 21:00 UTC (Default Baseline)',
          platform: 'ALL',
          sampleSize: 0,
          supportingEvidence: 'No historical posting-time analytics available. Standard evening peak baseline suggested pending data collection.',
          confidenceLevel: 'LOW',
        },
      ];
    }

    // Rank candidates deterministically: prefer candidates with sufficient sample size (sampleSize >= 3), then by avgViews descending
    const sorted = [...candidates].sort((a, b) => {
      const aSuff = a.sampleSize >= 3 ? 1 : 0;
      const bSuff = b.sampleSize >= 3 ? 1 : 0;
      if (aSuff !== bSuff) {
        return bSuff - aSuff;
      }
      return b.avgViews - a.avgViews;
    });
    const recs: PostingTimeRecommendation[] = [];

    for (const c of sorted.slice(0, 3)) {
      const sampleSize = c.sampleSize;
      const confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' =
        sampleSize >= 5 ? 'HIGH' : sampleSize >= 3 ? 'MEDIUM' : 'LOW';

      let evidence = `Avg Views: ${c.avgViews}, Retention: ${c.avgRetentionRate}%, CTR: ${c.avgCtr}%, Likes: ${c.avgLikes}, Comments: ${c.avgComments}, Shares: ${c.avgShares}, Subs Gained: ${c.avgSubscribersGained} across ${sampleSize} post(s).`;
      if (sampleSize < 3) {
        evidence += ' (LOW SAMPLE SIZE WARNING: Sample size < 3 requires caution before acting).';
      }

      recs.push({
        recommendedWindow: c.timeWindow,
        platform: c.platform,
        sampleSize,
        supportingEvidence: evidence,
        confidenceLevel,
        dayOfWeek: c.dayOfWeek,
        bestHourWindow: c.hourOfDay !== undefined ? `${c.hourOfDay.toString().padStart(2, '0')}:00 UTC` : undefined,
      });
    }

    return recs;
  }

  /**
   * Identifies dimension categories with insufficient data (sample size < 3).
   */
  private findInsufficientDimensions(breakdown: SocialPerformanceIntelligenceRecord['dimensionBreakdown']): string[] {
    const insufficient: string[] = [];
    for (const [key, items] of Object.entries(breakdown)) {
      if (Array.isArray(items)) {
        if (items.length === 0 || items.some((i) => i.sampleSize < 3)) {
          insufficient.push(key);
        }
      }
    }
    return insufficient;
  }

  /**
   * Invokes Gemini GenAI for performance intelligence analysis.
   */
  private async invokeAIPerformanceAnalysis(
    summary: SocialAnalyticsSummary,
    breakdown: SocialPerformanceIntelligenceRecord['dimensionBreakdown']
  ): Promise<{ aiOutput: PerformanceIntelligenceAIOutput; provenance: AIProvenance }> {
    const promptText = buildPerformanceIntelligencePrompt({
      totalRecords: summary.totalRecords,
      totalViews: summary.totalViews,
      averageRetentionRate: summary.averageRetentionRate,
      averageCtr: summary.averageCtr,
      dimensionBreakdown: breakdown,
    });

    const aiResponseResult = await aiOrchestrator.executeTask({
      task: 'ANALYSIS',
      prompt: promptText,
      systemInstruction: BURRA_PARIKSHA_PERFORMANCE_INTELLIGENCE_SYSTEM_INSTRUCTION,
      responseSchema: PerformanceIntelligenceGenAISchema,
    });

    if (aiResponseResult.status !== 'SUCCESS') {
      throw new Error(aiResponseResult.error || 'AI performance analysis failed via Orchestrator');
    }

    // Since Gemini adapter returns parsed JSON in data:
    const parsed = aiResponseResult.data || JSON.parse(aiResponseResult.text || '{}');
    const result = PerformanceIntelligenceZodSchema.parse(parsed);

    // Ensure postingTimeRecommendations are populated
    if (!result.postingTimeRecommendations || result.postingTimeRecommendations.length === 0) {
      result.postingTimeRecommendations = this.generateDeterministicPostingTimeRecommendations(
        breakdown.postingTimeAnalysis,
        summary.totalRecords
      );
    }

    return {
      aiOutput: result,
      provenance: aiResponseResult.provenance,
    };
  }

  /**
   * Phase 29A: Retrieves Question Studio strategy recommendations from ANALYTICS_INTELLIGENCE.
   * Parses advisory insights, validates suggested Topic/Subtopic with TaxonomyService,
   * and provides controlled generation parameters for Question Studio.
   * If analytics or intelligence is unavailable or empty, returns an empty array gracefully.
   */
  public async getQuestionStudioRecommendations(
    reportId?: string,
    filterTopicId?: string
  ): Promise<QuestionStudioStrategyRecommendation[]> {
    try {
      let report: SocialPerformanceIntelligenceRecord | null = null;
      if (reportId) {
        report = await this.getIntelligenceReportById(reportId);
      } else {
        const reports = await this.getIntelligenceReports(1);
        if (reports.length > 0) {
          report = reports[0];
        }
      }

      if (!report || !report.aiInsights) {
        return [];
      }

      const recommendations: QuestionStudioStrategyRecommendation[] = [];
      const reportRefId = report.id;

      // 1. Convert content strategy recommendations
      if (Array.isArray(report.aiInsights.contentStrategyRecommendations)) {
        for (let i = 0; i < report.aiInsights.contentStrategyRecommendations.length; i++) {
          const rec = report.aiInsights.contentStrategyRecommendations[i];
          const recId = `REC-${reportRefId}-${(i + 1).toString().padStart(2, '0')}`;

          const suggestedParams: QuestionStudioStrategyRecommendation['suggestedParameters'] = {};

          if (filterTopicId) {
            suggestedParams.topicId = filterTopicId;
          } else if (report.dimensionBreakdown?.byTopic?.length > 0) {
            const topTopic = [...report.dimensionBreakdown.byTopic].sort((a, b) => b.avgViews - a.avgViews)[0];
            if (topTopic) suggestedParams.topicId = topTopic.value;
          }

          if (report.dimensionBreakdown?.bySubtopic?.length > 0) {
            const topSubtopic = [...report.dimensionBreakdown.bySubtopic].sort((a, b) => b.avgViews - a.avgViews)[0];
            if (topSubtopic) suggestedParams.subtopicId = topSubtopic.value;
          }

          if (report.dimensionBreakdown?.byDifficulty?.length > 0) {
            const topDiff = [...report.dimensionBreakdown.byDifficulty].sort((a, b) => b.avgViews - a.avgViews)[0];
            if (topDiff && ['EASY', 'MEDIUM', 'HARD'].includes(topDiff.value.toUpperCase())) {
              suggestedParams.difficulty = topDiff.value.toUpperCase() as any;
            }
          }

          let isValidTaxonomy = true;
          let taxonomyValidationMessage = 'Valid taxonomy parameters';

          if (suggestedParams.topicId) {
            const topicObj = await taxonomyService.getTopicById(suggestedParams.topicId);
            if (!topicObj) {
              isValidTaxonomy = false;
              taxonomyValidationMessage = `Suggested topicId "${suggestedParams.topicId}" does not exist in taxonomy.`;
            }
          }

          if (suggestedParams.subtopicId && isValidTaxonomy) {
            const subtopicObj = await taxonomyService.getSubtopicById(suggestedParams.subtopicId);
            if (!subtopicObj) {
              isValidTaxonomy = false;
              taxonomyValidationMessage = `Suggested subtopicId "${suggestedParams.subtopicId}" does not exist in taxonomy.`;
            }
          }

          recommendations.push({
            id: recId,
            reportId: reportRefId,
            type: 'TOPIC_OPPORTUNITY',
            title: rec.area || 'Content Strategy Recommendation',
            description: rec.recommendation,
            suggestedParameters: suggestedParams,
            supportingEvidence: rec.supportingEvidence,
            sampleSize: rec.sampleSize,
            confidenceLevel: rec.confidenceLevel || 'MEDIUM',
            isValidTaxonomy,
            taxonomyValidationMessage,
          });
        }
      }

      // 2. Convert top performing dimensions into specific opportunity recommendations
      if (Array.isArray(report.aiInsights.topPerformingDimensions)) {
        for (let i = 0; i < report.aiInsights.topPerformingDimensions.length; i++) {
          const dim = report.aiInsights.topPerformingDimensions[i];
          const recId = `REC-${reportRefId}-TOP-${(i + 1).toString().padStart(2, '0')}`;

          const suggestedParams: QuestionStudioStrategyRecommendation['suggestedParameters'] = {};
          let recType: QuestionStudioStrategyRecommendation['type'] = 'FORMAT_OPTIMIZATION';

          if (dim.dimension.toUpperCase() === 'TOPIC') {
            suggestedParams.topicId = dim.value;
            recType = 'TOPIC_OPPORTUNITY';
          } else if (dim.dimension.toUpperCase() === 'SUBTOPIC') {
            suggestedParams.subtopicId = dim.value;
            recType = 'SUBTOPIC_OPPORTUNITY';
          } else if (dim.dimension.toUpperCase() === 'DIFFICULTY') {
            if (['EASY', 'MEDIUM', 'HARD'].includes(dim.value.toUpperCase())) {
              suggestedParams.difficulty = dim.value.toUpperCase() as any;
            }
            recType = 'DIFFICULTY_ADJUSTMENT';
          } else if (dim.dimension.toUpperCase() === 'CHALLENGETYPE') {
            suggestedParams.challengeType = dim.value;
            recType = 'CHALLENGE_TYPE_RECOMMENDATION';
          } else if (dim.dimension.toUpperCase() === 'PLATFORM') {
            suggestedParams.targetPlatform = dim.value;
          } else if (dim.dimension.toUpperCase() === 'PRESENTATIONTYPE') {
            suggestedParams.presentationType = dim.value;
          }

          let isValidTaxonomy = true;
          let taxonomyValidationMessage = 'Valid taxonomy parameters';

          if (suggestedParams.topicId) {
            const topicObj = await taxonomyService.getTopicById(suggestedParams.topicId);
            if (!topicObj) {
              isValidTaxonomy = false;
              taxonomyValidationMessage = `Topic "${suggestedParams.topicId}" does not exist in taxonomy.`;
            }
          }

          if (suggestedParams.subtopicId) {
            const subtopicObj = await taxonomyService.getSubtopicById(suggestedParams.subtopicId);
            if (!subtopicObj) {
              isValidTaxonomy = false;
              taxonomyValidationMessage = `Subtopic "${suggestedParams.subtopicId}" does not exist in taxonomy.`;
            }
          }

          recommendations.push({
            id: recId,
            reportId: reportRefId,
            type: recType,
            title: `High Engagement ${dim.dimension}: ${dim.value}`,
            description: dim.reason,
            suggestedParameters: suggestedParams,
            supportingEvidence: `Avg Views: ${dim.avgViews}, Retention: ${dim.avgRetention}%, CTR: ${dim.avgCtr}%`,
            sampleSize: dim.sampleSize,
            confidenceLevel: dim.sampleSize >= 5 ? 'HIGH' : dim.sampleSize >= 3 ? 'MEDIUM' : 'LOW',
            isValidTaxonomy,
            taxonomyValidationMessage,
          });
        }
      }

      // 3. Convert posting time recommendations (Phase 29B)
      if (Array.isArray(report.aiInsights.postingTimeRecommendations)) {
        for (let i = 0; i < report.aiInsights.postingTimeRecommendations.length; i++) {
          const pt = report.aiInsights.postingTimeRecommendations[i];
          const recId = `REC-${reportRefId}-PT-${(i + 1).toString().padStart(2, '0')}`;

          recommendations.push({
            id: recId,
            reportId: reportRefId,
            type: 'POSTING_TIME_OPTIMIZATION',
            title: `Optimal Posting Window: ${pt.recommendedWindow} (${pt.platform})`,
            description: `Target ${pt.platform} during window ${pt.recommendedWindow} based on ${pt.sampleSize} analyzed post(s).`,
            suggestedParameters: {
              targetPlatform: pt.platform,
              recommendedPostingWindow: pt.recommendedWindow,
            },
            supportingEvidence: pt.supportingEvidence,
            sampleSize: pt.sampleSize,
            confidenceLevel: pt.confidenceLevel || (pt.sampleSize >= 5 ? 'HIGH' : pt.sampleSize >= 3 ? 'MEDIUM' : 'LOW'),
            isValidTaxonomy: true,
            taxonomyValidationMessage: 'Valid posting time parameter',
          });
        }
      }

      return recommendations;
    } catch {
      // Graceful fallback if intelligence is unconfigured or unavailable
      return [];
    }
  }

  /**
   * Phase 29A: Allows an authenticated user to explicitly select/apply a strategy recommendation.
   * Populates Question Studio generation parameters ONLY.
   * Writes audit log entry. DOES NOT mutate questions or create production records.
   */
  public async applyStrategyRecommendation(
    input: ApplyStrategyRecommendationInput,
    actorId: string = 'USER',
    actorName: string = 'User'
  ): Promise<ApplyStrategyRecommendationResult> {
    try {
      if (!input.reportId || !input.recommendationId) {
        return {
          success: false,
          auditLogged: false,
          error: 'reportId and recommendationId are required parameters',
        };
      }

      const recs = await this.getQuestionStudioRecommendations(input.reportId);
      const rec = recs.find((r) => r.id === input.recommendationId);

      if (!rec) {
        return {
          success: false,
          auditLogged: false,
          error: `Strategy recommendation "${input.recommendationId}" not found in report "${input.reportId}"`,
        };
      }

      const appliedParameters = {
        ...rec.suggestedParameters,
        ...(input.customOverrides || {}),
      };

      if (appliedParameters.topicId) {
        const t = await taxonomyService.getTopicById(appliedParameters.topicId);
        if (!t) {
          return {
            success: false,
            auditLogged: false,
            error: `Taxonomy validation failed: Topic "${appliedParameters.topicId}" does not exist`,
          };
        }
      }

      if (appliedParameters.subtopicId) {
        const s = await taxonomyService.getSubtopicById(appliedParameters.subtopicId);
        if (!s) {
          return {
            success: false,
            auditLogged: false,
            error: `Taxonomy validation failed: Subtopic "${appliedParameters.subtopicId}" does not exist`,
          };
        }
      }

      // Audit Log
      try {
        await this.auditLogRepo.logAction(
          actorId,
          actorName,
          'APPLY_STRATEGY_RECOMMENDATION',
          'SOCIAL_PERFORMANCE_INTELLIGENCE',
          input.reportId,
          {
            recommendationId: input.recommendationId,
            appliedParameters,
          }
        );
      } catch {
        // non-blocking
      }

      return {
        success: true,
        appliedParameters,
        recommendation: rec,
        auditLogged: true,
      };
    } catch (err: any) {
      return {
        success: false,
        auditLogged: false,
        error: `Failed to apply strategy recommendation: ${err?.message || String(err)}`,
      };
    }
  }
}

export const socialPerformanceIntelligenceService = SocialPerformanceIntelligenceService.getInstance();
