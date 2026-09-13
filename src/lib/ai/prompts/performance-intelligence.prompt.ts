/**
 * BURRA PARIKSHA CMS - Performance Intelligence AI System Prompt
 * Phase 28: AI Social Performance Intelligence Prompt Generator
 */

export const BURRA_PARIKSHA_PERFORMANCE_INTELLIGENCE_SYSTEM_INSTRUCTION = `You are the Social Media Performance Intelligence Director for Burra Pariksha (a high-engagement educational content platform).

Your sole responsibility is analyzing multi-dimensional social analytics performance data to provide grounded, actionable content strategy recommendations.

STRICT MANDATES & SAFETY BOUNDARIES:
1. Grounding in Evidence: Every insight and recommendation MUST reference specific sample sizes, average metrics (views, retention %, CTR %), and specific dimension values from the provided summary data.
2. Sample Size Respect: If sample size (count of videos) for a dimension or platform is less than 5, you MUST explicitly flag it as LOW CONFIDENCE / SMALL SAMPLE. Do NOT make definitive strategic claims based on tiny sample sizes.
3. No Auto-Mutation: Your recommendations are ADVISORY ONLY. You have no ability or authority to modify production questions, scripts, videos, thumbnails, or publishing schedules.
4. Professional Tone: Concise, analytical, evidence-based, clear. Avoid vague buzzwords like "supercharge" or "empower". Focus on metrics and clear cause-and-effect content strategies.
`;

export function buildPerformanceIntelligencePrompt(data: {
  totalRecords: number;
  totalViews: number;
  averageRetentionRate: number;
  averageCtr: number;
  dimensionBreakdown: {
    byPlatform: Array<{ dimension: string; value: string; sampleSize: number; avgViews: number; avgRetentionRate: number; avgCtr: number }>;
    byTopic: Array<{ dimension: string; value: string; sampleSize: number; avgViews: number; avgRetentionRate: number; avgCtr: number }>;
    bySubtopic: Array<{ dimension: string; value: string; sampleSize: number; avgViews: number; avgRetentionRate: number; avgCtr: number }>;
    byDifficulty: Array<{ dimension: string; value: string; sampleSize: number; avgViews: number; avgRetentionRate: number; avgCtr: number }>;
    byChallengeType: Array<{ dimension: string; value: string; sampleSize: number; avgViews: number; avgRetentionRate: number; avgCtr: number }>;
    byLanguage: Array<{ dimension: string; value: string; sampleSize: number; avgViews: number; avgRetentionRate: number; avgCtr: number }>;
    byPresentationType: Array<{ dimension: string; value: string; sampleSize: number; avgViews: number; avgRetentionRate: number; avgCtr: number }>;
    postingTimeAnalysis?: {
      byHourOfDay: Array<any>;
      byDayOfWeek: Array<any>;
      byPlatformTimeWindow: Array<any>;
    };
  };
}): string {
  const postingTimeSection = data.dimensionBreakdown.postingTimeAnalysis
    ? `
8. Posting Time Analysis:
- By Hour of Day:
${JSON.stringify(data.dimensionBreakdown.postingTimeAnalysis.byHourOfDay, null, 2)}
- By Day of Week:
${JSON.stringify(data.dimensionBreakdown.postingTimeAnalysis.byDayOfWeek, null, 2)}
- By Platform & Time Window:
${JSON.stringify(data.dimensionBreakdown.postingTimeAnalysis.byPlatformTimeWindow, null, 2)}
`
    : '';

  return `Analyze the following social analytics performance dataset for Burra Pariksha content across social platforms:

DATASET OVERVIEW:
- Total Analyzed Videos: ${data.totalRecords}
- Total Cumulative Views: ${data.totalViews}
- Overall Avg Retention Rate: ${data.averageRetentionRate}%
- Overall Avg CTR: ${data.averageCtr}%

DIMENSION BREAKDOWN AGGREGATES:
1. By Platform:
${JSON.stringify(data.dimensionBreakdown.byPlatform, null, 2)}

2. By Topic:
${JSON.stringify(data.dimensionBreakdown.byTopic, null, 2)}

3. By Subtopic:
${JSON.stringify(data.dimensionBreakdown.bySubtopic, null, 2)}

4. By Difficulty:
${JSON.stringify(data.dimensionBreakdown.byDifficulty, null, 2)}

5. By Challenge Type:
${JSON.stringify(data.dimensionBreakdown.byChallengeType, null, 2)}

6. By Language:
${JSON.stringify(data.dimensionBreakdown.byLanguage, null, 2)}

7. By Presentation Type:
${JSON.stringify(data.dimensionBreakdown.byPresentationType, null, 2)}
${postingTimeSection}

TASK:
Evaluate the data above and produce a structured performance intelligence report containing:
1. Overall Verdict (concise summary of general performance trend).
2. Top Performing Dimensions (top 2-3 dimensions/values by views, retention, or CTR with evidence and sample sizes).
3. Underperforming Dimensions (bottom 2-3 dimensions/values needing strategy refinement).
4. Platform Specific Recommendations (tailored recommendations per platform based on key metrics).
5. Content Strategy Recommendations (3-5 concrete action items with supporting evidence, sample size, and confidence level HIGH/MEDIUM/LOW).
6. Posting Time Recommendations (1-3 optimal posting time window recommendations based on hour of day, day of week, platform with sample size and confidence level HIGH/MEDIUM/LOW).
7. Data Confidence Notes (explicit statements highlighting small sample sizes or missing dimensions).
`;
}
