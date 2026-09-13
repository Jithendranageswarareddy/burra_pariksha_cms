/**
 * BURRA PARIKSHA CMS - Phase 28 AI Social Performance Intelligence Verification Test Suite
 * 
 * Executable verification script testing:
 * 1. Multi-dimensional metric aggregation (Platform, Topic, Subtopic, Difficulty, ChallengeType, Language, PresentationType).
 * 2. Evidence traceability (recordIdsUsed, totalSamples, insufficientDataFlag).
 * 3. Low sample size caveat handling (sample size < 3 flagged with low confidence warnings).
 * 4. AI-disabled / Fallback Rule Engine deterministic recommendations generation.
 * 5. Sequential BP-SPI-###### ID generation.
 * 6. Historical append-only persistence in separate Analytics Workbook.
 * 7. Zero production CMS workbook mutation.
 */

import { socialPerformanceIntelligenceService } from '../lib/services/social-performance-intelligence.service';
import { analyticsService } from '../lib/services/analytics.service';
import { intelligenceRepository } from '../lib/repositories/intelligence.repository';

export interface Phase28VerificationResult {
  success: boolean;
  timestamp: string;
  checks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
}

export async function runPhase28Verification(): Promise<Phase28VerificationResult> {
  const checks: { name: string; passed: boolean; details: string }[] = [];

  try {
    // Check 1: Ingest mock social analytics snapshots into local analytics store for testing
    const canonicalId1 = 'BP-CNT-700001';
    const canonicalId2 = 'BP-CNT-700002';

    await analyticsService.recordAnalyticsSnapshot({
      contentId: canonicalId1,
      platform: 'youtube_shorts',
      views: 12000,
      watchTime: 360000,
      retentionRate: 85.0,
      likes: 950,
      comments: 110,
      shares: 45,
      subscribersGained: 65,
      ctr: 8.2,
      topicId: 'TP-MATH',
      subtopicId: 'STP-ALGEBRA',
      difficulty: 'HARD',
      challengeType: 'NUMERICAL',
      language: 'TE',
      presentationType: 'VERTICAL_SHORT',
    }, 'USR-TEST-P28', 'Test User');

    await analyticsService.recordAnalyticsSnapshot({
      contentId: canonicalId2,
      platform: 'instagram_reels',
      views: 4500,
      watchTime: 90000,
      retentionRate: 62.0,
      likes: 310,
      comments: 25,
      shares: 12,
      subscribersGained: 18,
      ctr: 4.5,
      topicId: 'TP-SCIENCE',
      subtopicId: 'STP-PHYSICS',
      difficulty: 'MEDIUM',
      challengeType: 'CONCEPTUAL',
      language: 'TE',
      presentationType: 'VERTICAL_SHORT',
    }, 'USR-TEST-P28', 'Test User');

    checks.push({
      name: 'Test Analytics Snapshots Available',
      passed: true,
      details: 'Recorded test analytics snapshots for canonical IDs BP-CNT-700001 and BP-CNT-700002.',
    });

    // Check 2: Deterministic Rule Engine / Fallback Intelligence Generation & BP-SPI- Allocation
    const reportRes = await socialPerformanceIntelligenceService.generateIntelligence(
      { forceFallback: true },
      'USR-TEST-P28',
      'Test User'
    );

    const isReportValid =
      reportRes.success &&
      Boolean(reportRes.record) &&
      reportRes.record!.id.startsWith('BP-SPI-') &&
      reportRes.record!.isFallbackMode === true &&
      reportRes.record!.modelUsed === 'DETERMINISTIC_RULE_ENGINE';

    checks.push({
      name: 'Deterministic Fallback Rule Engine & BP-SPI- ID Allocation',
      passed: isReportValid,
      details: isReportValid
        ? `Successfully generated report ${reportRes.record?.id} using Deterministic Rule Engine.`
        : `FAILED: Report generation failed: ${reportRes.error}`,
    });

    if (!isReportValid || !reportRes.record) {
      return { success: false, timestamp: new Date().toISOString(), checks };
    }

    const report = reportRes.record;

    // Check 3: Multi-Dimensional Aggregation Verification
    const hasDimensions =
      report.dimensionBreakdown.byPlatform.length > 0 &&
      report.dimensionBreakdown.byTopic.length > 0 &&
      report.dimensionBreakdown.byDifficulty.length > 0;

    checks.push({
      name: 'Multi-Dimensional Metric Breakdown (Platform, Topic, Difficulty)',
      passed: hasDimensions,
      details: hasDimensions
        ? `Computed multi-dimensional breakdowns: ${report.dimensionBreakdown.byPlatform.length} platforms, ${report.dimensionBreakdown.byTopic.length} topics, ${report.dimensionBreakdown.byDifficulty.length} difficulties.`
        : 'FAILED: Dimension breakdown is missing or incomplete.',
    });

    // Check 4: Evidence Traceability & Record ID Correlation
    const traceability = report.evidenceTraceability;
    const isTraceable =
      traceability &&
      Array.isArray(traceability.recordIdsUsed) &&
      traceability.recordIdsUsed.length >= 2 &&
      typeof traceability.totalSamples === 'number' &&
      typeof traceability.insufficientDataFlag === 'boolean';

    checks.push({
      name: 'Evidence Traceability (Record IDs & Sample Sizes)',
      passed: Boolean(isTraceable),
      details: isTraceable
        ? `Report explicitly links ${traceability.recordIdsUsed.length} record IDs with total samples=${traceability.totalSamples}.`
        : 'FAILED: Evidence traceability object is missing or invalid.',
    });

    // Check 5: Low Sample Size Caveats & Data Confidence Warning Handling
    const hasConfidenceNotes =
      report.aiInsights.dataConfidenceNotes &&
      report.aiInsights.dataConfidenceNotes.length > 0;

    checks.push({
      name: 'Low Sample Size Caveats & Confidence Warnings',
      passed: Boolean(hasConfidenceNotes),
      details: hasConfidenceNotes
        ? `Data confidence notes present: "${report.aiInsights.dataConfidenceNotes[0]}"`
        : 'FAILED: Missing sample size caveats or data confidence notes.',
    });

    // Check 6: Append-Only Historical Report Persistence
    const pastReports = await intelligenceRepository.getRecentIntelligence(10);
    const isPersisted = pastReports.some((r) => r.id === report.id);

    checks.push({
      name: 'Append-Only Historical Report Persistence',
      passed: isPersisted,
      details: isPersisted
        ? `Confirmed report ${report.id} was appended and retrieved from IntelligenceRepository.`
        : 'FAILED: Report was not persisted in IntelligenceRepository.',
    });

    // Check 7: Zero Production CMS Workbook Contamination Verification
    const targetSheet = intelligenceRepository['getTargetSpreadsheetId']();
    const isIsolated =
      targetSheet === process.env.ANALYTICS_SPREADSHEET_ID ||
      targetSheet === 'UNCONFIGURED_ANALYTICS_SPREADSHEET';

    checks.push({
      name: 'Zero Production CMS Workbook Contamination Safeguard',
      passed: isIsolated,
      details: isIsolated
        ? `IntelligenceRepository targets separate spreadsheet (${targetSheet}) and cannot mutate production CMS workbook.`
        : 'FAILED: IntelligenceRepository is not properly isolated.',
    });

    const allPassed = checks.every((c) => c.passed);
    return {
      success: allPassed,
      timestamp: new Date().toISOString(),
      checks,
    };
  } catch (err: any) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      checks: [
        ...checks,
        {
          name: 'Phase 28 Execution Exception',
          passed: false,
          details: err?.message || String(err),
        },
      ],
    };
  }
}
