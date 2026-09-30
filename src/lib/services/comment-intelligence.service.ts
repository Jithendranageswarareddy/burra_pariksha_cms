/**
 * BURRA PARIKSHA CMS - Comment Intelligence Service
 * Phase 30: AI Social Comment Intelligence Engine
 * 
 * Conducts structured pedagogical and sentiment analysis over captured audience comments
 * using Gemini / Phase 24 AI Orchestrator with deterministic rule-based fallback.
 * 
 * STRICT ARCHITECTURAL CONSTRAINTS:
 * 1. Analytics Isolation: Operates exclusively on ANALYTICS_SPREADSHEET_ID (COMMENT_INTELLIGENCE & SOCIAL_COMMENTS tabs).
 * 2. Zero Production Mutation: Operates read-only against Content Masters / Production sheets. Never mutates production CMS workbook.
 * 3. Evidence Traceability: Every insight and misconception links back to source comment IDs (BP-CMT-######) and verbatim quotes.
 * 4. Resilient Fallback: If AI fails or is unconfigured, transitions seamlessly to deterministic rule engine without throwing errors.
 * 5. Metadata-only Audit Logging: Logs operations without leaking raw audience text into audit tables.
 */

import { socialCommentsRepository, SocialCommentsRepository } from '../repositories/social-comments.repository';
import { commentIntelligenceRepository, CommentIntelligenceRepository } from '../repositories/comment-intelligence.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { idService } from './id.service';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { aiOrchestrator } from '../ai/ai-orchestrator.service';
import { AIProvenance } from '../../types/ai';
import {
  CommentIntelligenceGenAISchema,
  CommentIntelligenceZodSchema,
  CommentIntelligenceAIOutput,
} from '../ai/schemas/comment-intelligence.schema';
import {
  BURRA_PARIKSHA_COMMENT_INTELLIGENCE_SYSTEM_INSTRUCTION,
  buildCommentIntelligencePrompt,
} from '../ai/prompts/comment-intelligence.prompt';
import { GenerateCommentIntelligenceInputSchema } from '../schemas/google-sheets-schema';
import {
  CommentIntelligenceRecord,
  GenerateCommentIntelligenceInput,
  SocialCommentRecord,
} from '../../types';

export class CommentIntelligenceService {
  private static instance: CommentIntelligenceService | null = null;
  private commentsRepo: SocialCommentsRepository;
  private intelligenceRepo: CommentIntelligenceRepository;
  private auditLogRepo: AuditLogRepository;

  private constructor() {
    this.commentsRepo = socialCommentsRepository;
    this.intelligenceRepo = commentIntelligenceRepository;
    this.auditLogRepo = AuditLogRepository.getInstance();
  }

  public static getInstance(): CommentIntelligenceService {
    if (!CommentIntelligenceService.instance) {
      CommentIntelligenceService.instance = new CommentIntelligenceService();
    }
    return CommentIntelligenceService.instance;
  }

  /**
   * Analyzes audience comments for a Content Master or specific batch and generates a structured Comment Intelligence record.
   */
  public async analyzeComments(
    input: GenerateCommentIntelligenceInput,
    actorId: string = 'SYSTEM',
    actorName: string = 'System User'
  ): Promise<{ success: boolean; record?: CommentIntelligenceRecord; error?: string }> {
    try {
      // 1. Validate Input
      const parsedInput = GenerateCommentIntelligenceInputSchema.parse(input);

      // 2. Fetch Relevant Audience Comments (Read-only from Analytics Workbook)
      let candidateComments: SocialCommentRecord[] = [];

      if (parsedInput.commentIds && parsedInput.commentIds.length > 0) {
        const idSet = new Set(parsedInput.commentIds);
        const allComments = await this.commentsRepo.findAll();
        candidateComments = allComments.filter((c) => idSet.has(c.id));
      } else {
        const filters: any = {
          contentId: parsedInput.contentId,
        };
        if (parsedInput.videoId) {
          filters.videoId = parsedInput.videoId;
        }
        if (parsedInput.platform && parsedInput.platform !== 'ALL') {
          filters.platform = parsedInput.platform;
        }
        candidateComments = await this.commentsRepo.query(filters);
      }

      // 3. Filter out comments marked as IGNORED
      const activeComments = candidateComments.filter((c) => c.status !== 'IGNORED');
      const totalComments = activeComments.length;

      // 4. Compute Platform Breakdown and Sample Size Confidence
      const platformBreakdown: Record<string, number> = {};
      for (const c of activeComments) {
        const p = (c.platform || 'unknown').toLowerCase();
        platformBreakdown[p] = (platformBreakdown[p] || 0) + 1;
      }

      let sampleSizeConfidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let confidenceRating: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA' = 'LOW';

      if (totalComments >= 10) {
        sampleSizeConfidence = 'HIGH';
        confidenceRating = 'HIGH';
      } else if (totalComments >= 3) {
        sampleSizeConfidence = 'MEDIUM';
        confidenceRating = 'MEDIUM';
      } else if (totalComments > 0) {
        sampleSizeConfidence = 'LOW';
        confidenceRating = 'LOW';
      } else {
        sampleSizeConfidence = 'LOW';
        confidenceRating = 'INSUFFICIENT_DATA';
      }

      // 5. Read optional content master context for prompt grounding
      let contentTitle: string | undefined;
      let topicName: string | undefined;
      try {
        const master = await contentMastersRepository.findById(parsedInput.contentId);
        if (master) {
          contentTitle = master.title;
          topicName = master.topicId;
        }
      } catch {
        // Non-blocking content context lookup
      }

      // 6. Execute AI Intelligence Analysis (or Deterministic Rule Fallback)
      let aiOutput: CommentIntelligenceAIOutput;
      let isFallbackMode = false;
      let modelUsed = 'gemini-2.5-flash';
      let provenance: AIProvenance | undefined = undefined;

      const canUseAI = parsedInput.forceFallback !== true && totalComments > 0;

      if (canUseAI) {
        try {
          const aiResult = await this.invokeAICommentAnalysis({
            contentId: parsedInput.contentId,
            contentTitle,
            topicName,
            videoId: parsedInput.videoId,
            platform: parsedInput.platform,
            comments: activeComments,
          });
          aiOutput = aiResult.aiOutput;
          provenance = aiResult.provenance;
          modelUsed = provenance.model || 'gemini-2.5-flash';
        } catch (aiErr: any) {
          // AI call failed or timed out — transition to deterministic rule engine safely
          isFallbackMode = true;
          modelUsed = 'DETERMINISTIC_RULE_ENGINE';
          aiOutput = this.generateDeterministicRuleInsights(activeComments, confidenceRating, parsedInput.contentId);
          provenance = {
            provider: 'DETERMINISTIC_FALLBACK',
            model: 'DETERMINISTIC_RULE_ENGINE',
            task: 'ANALYSIS',
            generationSource: 'DETERMINISTIC_FALLBACK',
            timestamp: new Date().toISOString(),
            fallbackUsed: true,
            attempts: [
              {
                providerId: 'DETERMINISTIC_FALLBACK',
                modelId: 'DETERMINISTIC_RULE_ENGINE',
                success: true,
                latencyMs: 0,
                errorMessage: aiErr?.message || 'AI comment analysis failed, fallback executed',
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
      } else {
        isFallbackMode = true;
        modelUsed = 'DETERMINISTIC_RULE_ENGINE';
        aiOutput = this.generateDeterministicRuleInsights(activeComments, confidenceRating, parsedInput.contentId);
        provenance = {
          provider: 'DETERMINISTIC_FALLBACK',
          model: 'DETERMINISTIC_RULE_ENGINE',
          task: 'ANALYSIS',
          generationSource: 'DETERMINISTIC_FALLBACK',
          timestamp: new Date().toISOString(),
          fallbackUsed: true,
          attempts: [],
        };
      }

      // 7. Allocate Centralized Sequential ID: BP-CMI-######
      const id = await idService.allocateCommentIntelligenceId();
      const now = new Date().toISOString();

      // 8. Assemble Full Comment Intelligence Record
      const record: CommentIntelligenceRecord = {
        id,
        contentId: parsedInput.contentId,
        videoId: parsedInput.videoId,
        platform: parsedInput.platform || 'ALL',
        analysisScope: parsedInput.analysisScope || 'CONTENT_MASTER',
        sourceCommentCount: totalComments,
        sourceCommentIds: activeComments.map((c) => c.id),
        analyzedAt: now,
        actorId,
        actorName,
        overallSentiment: aiOutput.overallSentiment,
        misconceptions: aiOutput.misconceptions,
        viewerQuestions: aiOutput.viewerQuestions,
        contentRequests: aiOutput.contentRequests,
        factualCorrections: aiOutput.factualCorrections,
        recommendations: aiOutput.recommendations,
        confidence: aiOutput.confidence || confidenceRating,
        confidenceScore: aiOutput.confidenceScore ?? (confidenceRating === 'HIGH' ? 85 : confidenceRating === 'MEDIUM' ? 65 : 40),
        modelUsed,
        promptVersion: 'v1.0',
        isFallbackMode,
        provenance,
        evidenceTraceability: {
          commentIdsUsed: activeComments.map((c) => c.id),
          totalCommentsAnalyzed: totalComments,
          sampleSizeConfidence,
          platformBreakdown,
        },
      };

      // 9. Persist to Analytics Workbook (COMMENT_INTELLIGENCE sheet tab)
      await this.intelligenceRepo.appendRecord(record);

      // 10. Update Status of Analyzed Comments in Analytics Workbook (UNPROCESSED -> ANALYZED)
      for (const comment of activeComments) {
        if (comment.status === 'UNPROCESSED') {
          try {
            await this.commentsRepo.updateRecord(comment.id, {
              status: 'ANALYZED',
            });
          } catch {
            // Non-blocking update failure handling
          }
        }
      }

      // 11. Audit Logging (Metadata only, strictly zero raw comment text)
      try {
        await this.auditLogRepo.logAction(
          actorId,
          actorName,
          'GENERATE_COMMENT_INTELLIGENCE',
          'COMMENT_INTELLIGENCE',
          id,
          {
            reportId: id,
            contentId: parsedInput.contentId,
            videoId: parsedInput.videoId,
            sourceCommentCount: totalComments,
            isFallbackMode,
            modelUsed,
          }
        );
      } catch {
        // Non-blocking
      }

      return {
        success: true,
        record,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Failed to analyze audience comments: ${err?.message || String(err)}`,
      };
    }
  }

  /**
   * Retrieves all intelligence reports for a Content Master ID.
   */
  public async getIntelligenceByContentId(contentId: string): Promise<CommentIntelligenceRecord[]> {
    return this.intelligenceRepo.findByContentId(contentId);
  }

  /**
   * Retrieves all intelligence reports for a Video ID.
   */
  public async getIntelligenceByVideoId(videoId: string): Promise<CommentIntelligenceRecord[]> {
    return this.intelligenceRepo.findByVideoId(videoId);
  }

  /**
   * Retrieves a single intelligence report by BP-CMI-###### ID.
   */
  public async getIntelligenceById(id: string): Promise<CommentIntelligenceRecord | null> {
    return this.intelligenceRepo.findById(id);
  }

  /**
   * Retrieves recent intelligence reports.
   */
  public async getRecentIntelligence(limit: number = 20): Promise<CommentIntelligenceRecord[]> {
    return this.intelligenceRepo.getRecentIntelligence(limit);
  }

  /**
   * Invokes Gemini GenAI via Phase 24 AI Orchestrator for structured comment intelligence analysis.
   */
  private async invokeAICommentAnalysis(input: {
    contentId: string;
    contentTitle?: string;
    topicName?: string;
    videoId?: string;
    platform?: string;
    comments: SocialCommentRecord[];
  }): Promise<{ aiOutput: CommentIntelligenceAIOutput; provenance: AIProvenance }> {
    const promptText = buildCommentIntelligencePrompt(input);

    const aiResponseResult = await aiOrchestrator.executeTask({
      task: 'ANALYSIS',
      prompt: promptText,
      systemInstruction: BURRA_PARIKSHA_COMMENT_INTELLIGENCE_SYSTEM_INSTRUCTION,
      responseSchema: CommentIntelligenceGenAISchema,
    });

    if (aiResponseResult.status !== 'SUCCESS') {
      throw new Error(aiResponseResult.error || 'AI comment analysis failed via AI Orchestrator');
    }

    const parsed = aiResponseResult.data || JSON.parse(aiResponseResult.text || '{}');
    const result = CommentIntelligenceZodSchema.parse(parsed);

    return {
      aiOutput: result,
      provenance: aiResponseResult.provenance,
    };
  }

  /**
   * Rule-based deterministic insight generator for fallback mode or small samples.
   */
  private generateDeterministicRuleInsights(
    comments: SocialCommentRecord[],
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA',
    contentId: string
  ): CommentIntelligenceAIOutput {
    if (comments.length === 0) {
      return {
        overallSentiment: {
          positivePercentage: 0,
          negativePercentage: 0,
          neutralPercentage: 100,
          overallVerdict: 'MIXED',
          summary: 'No audience comments available for analysis.',
        },
        misconceptions: [],
        viewerQuestions: [],
        contentRequests: [],
        factualCorrections: [],
        recommendations: [
          {
            area: 'PINNED_COMMENT',
            recommendation: 'Encourage audience engagement with an open-ended discussion question in the pinned comment.',
            supportingEvidence: 'Zero comments currently captured for this content.',
            suggestedAction: 'Pin a clarifying question to prompt audience responses.',
            confidenceLevel: 'LOW',
          },
        ],
        confidence: 'INSUFFICIENT_DATA',
        confidenceScore: 0,
      };
    }

    const posWords = ['good', 'great', 'super', 'nice', 'bagundi', 'correct', 'thanks', 'easy', 'helpful', 'awesome', 'best'];
    const negWords = ['wrong', 'mistake', 'error', 'thappu', 'incorrect', 'bad', 'hard', 'waste', 'cheat', 'fake', 'confusing'];
    const questionWords = ['why', 'how', 'what', 'enti', 'ela', 'eppudu', 'why?', 'how?'];
    const requestWords = ['next', 'more', 'part 2', 'please', 'explain', 'cheyandi', 'video on'];

    let posCount = 0;
    let negCount = 0;
    let neuCount = 0;

    const sampleQuotes: string[] = [];
    const questionQuotes: string[] = [];
    const misconceptionQuotes: string[] = [];
    const requestQuotes: string[] = [];
    const correctionQuotes: string[] = [];

    for (const c of comments) {
      const lower = c.commentText.toLowerCase();
      sampleQuotes.push(c.commentText.slice(0, 80));

      const isPos = posWords.some((w) => lower.includes(w));
      const isNeg = negWords.some((w) => lower.includes(w));
      const isQuestion = lower.includes('?') || questionWords.some((w) => lower.includes(w));
      const isRequest = requestWords.some((w) => lower.includes(w));
      const isCorrection = lower.includes('error') || lower.includes('mistake') || lower.includes('thappu') || lower.includes('wrong');

      if (isPos && !isNeg) posCount++;
      else if (isNeg && !isPos) negCount++;
      else neuCount++;

      if (isQuestion && questionQuotes.length < 3) questionQuotes.push(c.commentText);
      if (isCorrection && correctionQuotes.length < 3) correctionQuotes.push(c.commentText);
      if (isRequest && requestQuotes.length < 3) requestQuotes.push(c.commentText);
      if ((isNeg || isQuestion) && misconceptionQuotes.length < 3) misconceptionQuotes.push(c.commentText);
    }

    const total = comments.length;
    const positivePercentage = Math.round((posCount / total) * 100);
    const negativePercentage = Math.round((negCount / total) * 100);
    const neutralPercentage = Math.max(0, 100 - positivePercentage - negativePercentage);

    let overallVerdict: 'OVERWHELMINGLY_POSITIVE' | 'POSITIVE' | 'MIXED' | 'NEGATIVE' | 'CONFUSED' = 'MIXED';
    if (positivePercentage >= 70) overallVerdict = 'OVERWHELMINGLY_POSITIVE';
    else if (positivePercentage >= 50) overallVerdict = 'POSITIVE';
    else if (negativePercentage >= 50) overallVerdict = 'NEGATIVE';
    else if (questionQuotes.length > posCount) overallVerdict = 'CONFUSED';

    const misconceptions = misconceptionQuotes.length > 0 ? [
      {
        misconception: 'Audience expressed confusion or questioned the solution logic.',
        frequencyEstimate: 'MEDIUM' as const,
        sampleCommentQuotes: misconceptionQuotes,
        explanationNeeded: 'Provide explicit step-by-step reasoning in a pinned comment to address the question distractors.',
      },
    ] : [];

    const viewerQuestions = questionQuotes.length > 0 ? [
      {
        question: 'Viewers asked clarifying questions regarding the correct answer or concept.',
        frequencyEstimate: 'MEDIUM' as const,
        sampleCommentQuotes: questionQuotes,
        suggestedAnswer: 'Re-verify the question wording and pin the full derivation for viewer clarity.',
      },
    ] : [];

    const contentRequests = requestQuotes.length > 0 ? [
      {
        requestedTopicOrFormat: 'Additional practice problems or deeper conceptual breakdown',
        frequencyEstimate: 'MEDIUM' as const,
        sampleCommentQuotes: requestQuotes,
      },
    ] : [];

    const factualCorrections = correctionQuotes.length > 0 ? [
      {
        issueReported: 'Potential issue reported in answer calculation or explanation.',
        severity: 'MODERATE' as const,
        sampleCommentQuotes: correctionQuotes,
        verificationNeeded: 'Subject matter expert review recommended to confirm question validity.',
      },
    ] : [];

    const recommendations = [
      {
        area: 'EXPLANATION_CLARITY' as const,
        recommendation: `Ensure step-by-step clarity for ${contentId} in follow-up content or pinned comments.`,
        supportingEvidence: `Analyzed ${total} comments with ${positivePercentage}% positive sentiment.`,
        suggestedAction: 'Pin a detailed solution comment to resolve viewer doubts.',
        confidenceLevel: confidence === 'HIGH' ? 'HIGH' as const : 'MEDIUM' as const,
      },
      {
        area: 'QUESTION_DESIGN' as const,
        recommendation: 'Evaluate distractor options to prevent ambiguous interpretations.',
        supportingEvidence: `Identified ${misconceptions.length} misconception clusters in audience comments.`,
        suggestedAction: 'Review distractor wording during question validation.',
        confidenceLevel: 'MEDIUM' as const,
      },
    ];

    return {
      overallSentiment: {
        positivePercentage,
        negativePercentage,
        neutralPercentage,
        overallVerdict,
        summary: `Analyzed ${total} comments: ${positivePercentage}% positive, ${negativePercentage}% negative, ${neutralPercentage}% neutral/inquisitive.`,
      },
      misconceptions,
      viewerQuestions,
      contentRequests,
      factualCorrections,
      recommendations,
      confidence,
      confidenceScore: confidence === 'HIGH' ? 85 : confidence === 'MEDIUM' ? 65 : 40,
    };
  }
}

export const commentIntelligenceService = CommentIntelligenceService.getInstance();
