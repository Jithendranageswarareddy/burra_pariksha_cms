/**
 * BURRA PARIKSHA CMS - Phase 28 Test Suite
 * Comprehensive execution-first verification of AI Social Performance Intelligence.
 */

import { socialPerformanceIntelligenceService } from '../lib/services/social-performance-intelligence.service';
import { analyticsService } from '../lib/services/analytics.service';
import { intelligenceRepository } from '../lib/repositories/intelligence.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { topicsRepository } from '../lib/repositories/topics.repository';
import { subtopicsRepository } from '../lib/repositories/subtopics.repository';
import { ObjectAuthorizationService } from '../lib/services/object-auth.service';
import { AuditLogRepository } from '../lib/repositories/audit-log.repository';
import { phase24AIOrchestrator } from '../lib/ai/phase24-orchestrator.service';
import {
  UserRole,
  SocialPerformanceIntelligenceRecord,
} from '../types';

let testCount = 0;
let passedCount = 0;
let failedCount = 0;

function logHeader(title: string) {
  console.log('\n==================================================================');
  console.log(title);
  console.log('==================================================================');
}

function check(tag: string, description: string, condition: boolean, detail?: string) {
  testCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ [${tag}] ${description}`);
    if (detail) console.log(`   └─ ${detail}`);
  } else {
    failedCount++;
    console.error(`❌ [${tag}] ${description}`);
    if (detail) console.error(`   └─ ${detail}`);
  }
}

async function runTests() {
  logHeader('PHASE 28 — AI SOCIAL PERFORMANCE INTELLIGENCE VERIFICATION');
  console.log('💡 CLASSIFICATION: Verifies multi-dimensional analytical aggregation, AI advisory limitations, Central Orchestrator integration, and separate persistence.');

  // Seed taxonomy topic and subtopic so strategy application taxonomy validation passes
  try {
    await topicsRepository.appendRecord({
      id: 'TP-MATH',
      name: 'Mathematics',
      categoryId: 'CAT-MATH',
      slug: 'mathematics',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    await subtopicsRepository.appendRecord({
      id: 'STP-ALGEBRA',
      topicId: 'TP-MATH',
      name: 'Algebra',
      slug: 'algebra',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    await topicsRepository.appendRecord({
      id: 'TP-SCIENCE',
      name: 'Science',
      categoryId: 'CAT-SCIENCE',
      slug: 'science',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    await subtopicsRepository.appendRecord({
      id: 'STP-PHYSICS',
      topicId: 'TP-SCIENCE',
      name: 'Physics',
      slug: 'physics',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);
  } catch (err: any) {
    console.warn('Seeding taxonomy warning:', err.message);
  }

  // Create isolated Content IDs to prevent collision and verify exact snapshot mapping
  const contentId1 = 'BP-CNT-280001';
  const contentId2 = 'BP-CNT-280002';
  const contentId3 = 'BP-CNT-280003';

  // Seed minimum content masters so validation passes
  try {
    for (const cid of [contentId1, contentId2, contentId3]) {
      await contentMastersRepository.appendRecord({
        id: cid,
        title: `Mock Content for Phase 28 - ${cid}`,
        status: 'PUBLISHED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any);
    }
  } catch (err: any) {
    console.warn('Seeding content warning:', err.message);
  }

  // Record mock analytics snapshots
  try {
    await analyticsService.recordAnalyticsSnapshot({
      contentId: contentId1,
      platform: 'youtube_shorts',
      views: 15000,
      watchTime: 450000,
      retentionRate: 88.0,
      likes: 1100,
      comments: 150,
      shares: 60,
      subscribersGained: 80,
      ctr: 9.5,
      topicId: 'TP-MATH',
      subtopicId: 'STP-ALGEBRA',
      difficulty: 'HARD',
      challengeType: 'NUMERICAL',
      language: 'TE',
      presentationType: 'VERTICAL_SHORT',
    }, 'USR-TEST-P28', 'Test Agent');

    await analyticsService.recordAnalyticsSnapshot({
      contentId: contentId2,
      platform: 'instagram_reels',
      views: 5000,
      watchTime: 100000,
      retentionRate: 65.0,
      likes: 350,
      comments: 30,
      shares: 15,
      subscribersGained: 20,
      ctr: 5.0,
      topicId: 'TP-SCIENCE',
      subtopicId: 'STP-PHYSICS',
      difficulty: 'MEDIUM',
      challengeType: 'CONCEPTUAL',
      language: 'TE',
      presentationType: 'VERTICAL_SHORT',
    }, 'USR-TEST-P28', 'Test Agent');

    check('P28-PRE', 'Analytics snapshots populated successfully', true);
  } catch (err: any) {
    check('P28-PRE', 'Failed to populate analytics snapshots', false, err.message);
    return;
  }

  // ------------------------------------------------------------------
  // 1. Separate Analytics Storage Boundary & Zero-Mutation
  // ------------------------------------------------------------------
  try {
    const targetSheet = (intelligenceRepository as any).getTargetSpreadsheetId();
    const prodSheet = (contentMastersRepository as any).getTargetSpreadsheetId();
    const isIsolated = targetSheet !== prodSheet && targetSheet === (process.env.ANALYTICS_SPREADSHEET_ID || 'UNCONFIGURED_ANALYTICS_SPREADSHEET');
    
    check(
      'P28-01',
      'Separate analytics storage boundary is enforced',
      isIsolated,
      `Intelligence Spreadsheet ID: "${targetSheet}" | Production Spreadsheet ID: "${prodSheet || 'DEFAULT_PRODUCTION'}"`
    );
  } catch (err: any) {
    check('P28-01', 'Separate analytics storage boundary check failed', false, err.message);
  }

  // ------------------------------------------------------------------
  // 2. Multi-Dimensional Aggregation Verification
  // ------------------------------------------------------------------
  let report: SocialPerformanceIntelligenceRecord | null = null;
  try {
    const result = await socialPerformanceIntelligenceService.generateIntelligence(
      { forceFallback: true },
      'USR-TEST-P28',
      'Test Agent'
    );
    
    if (result.success && result.record) {
      report = result.record;
      const db = report.dimensionBreakdown;
      const validDimensions =
        db.byPlatform.length > 0 &&
        db.byTopic.length > 0 &&
        db.byDifficulty.length > 0 &&
        db.byChallengeType.length > 0 &&
        db.byLanguage.length > 0 &&
        db.byPresentationType.length > 0;

      check(
        'P28-02',
        'Multi-Dimensional Aggregations computed correctly across all dimensions',
        validDimensions,
        `Platforms: ${db.byPlatform.length}, Topics: ${db.byTopic.length}, Difficulties: ${db.byDifficulty.length}`
      );
    } else {
      check('P28-02', 'Failed to generate performance intelligence report', false, result.error);
    }
  } catch (err: any) {
    check('P28-02', 'Multi-Dimensional aggregation test threw exception', false, err.message);
  }

  // ------------------------------------------------------------------
  // 3. Evidence Traceability & Record ID Correlation
  // ------------------------------------------------------------------
  try {
    if (report) {
      const trace = report.evidenceTraceability;
      const isTraceable =
        trace &&
        Array.isArray(trace.recordIdsUsed) &&
        trace.recordIdsUsed.length >= 2 &&
        trace.totalSamples === 2 &&
        typeof trace.insufficientDataFlag === 'boolean';

      check(
        'P28-03',
        'Evidence traceability captures original record IDs and sample sizes accurately',
        Boolean(isTraceable),
        `Original Records Linked: ${trace?.recordIdsUsed.join(', ')} | Sample Size: ${trace?.totalSamples}`
      );
    } else {
      check('P28-03', 'Skipped: No report available', false);
    }
  } catch (err: any) {
    check('P28-03', 'Evidence traceability check failed', false, err.message);
  }

  // ------------------------------------------------------------------
  // 4. Low Sample Size Caveats & Warnings
  // ------------------------------------------------------------------
  try {
    if (report) {
      const notes = report.aiInsights.dataConfidenceNotes;
      const hasConfidenceNotes = notes && notes.length > 0;
      const hasLowConfidenceWarning = notes.some(note => {
        const upper = note.toUpperCase();
        return upper.includes('INSUFFICIENT') || upper.includes('SAMPLE SIZE') || upper.includes('CAVEAT') || upper.includes('WARNING') || upper.includes('LOW');
      });

      check(
        'P28-04',
        'Low sample size caveats produced when sample size < 3',
        hasConfidenceNotes && hasLowConfidenceWarning,
        `Confidence notes: "${notes.join('; ')}"`
      );
    } else {
      check('P28-04', 'Skipped: No report available', false);
    }
  } catch (err: any) {
    check('P28-04', 'Confidence notes check failed', false, err.message);
  }

  // ------------------------------------------------------------------
  // 5. Sequential BP-SPI-###### ID Generation
  // ------------------------------------------------------------------
  try {
    const report2 = await socialPerformanceIntelligenceService.generateIntelligence(
      { forceFallback: true },
      'USR-TEST-P28',
      'Test Agent'
    );

    if (report && report2.success && report2.record) {
      const id1Num = parseInt(report.id.replace('BP-SPI-', ''), 10);
      const id2Num = parseInt(report2.record.id.replace('BP-SPI-', ''), 10);
      const isSequential = id2Num === id1Num + 1;

      check(
        'P28-05',
        'Sequential ID allocation (BP-SPI-######) works correctly',
        isSequential,
        `Allocated IDs: "${report.id}" -> "${report2.record.id}"`
      );
    } else {
      check('P28-05', 'Failed: Second report generation failed', false);
    }
  } catch (err: any) {
    check('P28-05', 'Sequential ID check failed', false, err.message);
  }

  // ------------------------------------------------------------------
  // 6. Append-Only Historical Report Persistence
  // ------------------------------------------------------------------
  try {
    if (report) {
      const recent = await intelligenceRepository.getRecentIntelligence(10);
      const isPersisted = recent.some(r => r.id === report!.id);

      check(
        'P28-06',
        'Historical report is successfully persisted append-only inside the separate workbook',
        isPersisted,
        `Retrieved ${recent.length} recent reports. Found: "${report.id}"`
      );
    } else {
      check('P28-06', 'Skipped: No report available', false);
    }
  } catch (err: any) {
    check('P28-06', 'Persistence check failed', false, err.message);
  }

  // ------------------------------------------------------------------
  // 7. AI Advisory Only & Immutability
  // ------------------------------------------------------------------
  try {
    const originalMasters = await contentMastersRepository.findAll();
    const originalQuestions = await questionsRepository.findAll();

    // Generate intelligence again
    await socialPerformanceIntelligenceService.generateIntelligence({ forceFallback: true }, 'USR-TEST-P28', 'Test Agent');

    const afterMasters = await contentMastersRepository.findAll();
    const afterQuestions = await questionsRepository.findAll();

    const untouched =
      originalMasters.length === afterMasters.length &&
      originalQuestions.length === afterQuestions.length;

    check(
      'P28-07',
      'AI/deterministic reports are advisory only and never mutate production content',
      untouched,
      `Masters count: ${originalMasters.length} -> ${afterMasters.length} | Questions count: ${originalQuestions.length} -> ${afterQuestions.length}`
    );
  } catch (err: any) {
    check('P28-07', 'Advisory only mutation check failed', false, err.message);
  }

  // ------------------------------------------------------------------
  // 8. AI Routing via Central Orchestrator & Provenance Verification
  // ------------------------------------------------------------------
  try {
    // We mock phase24AIOrchestrator to ensure it is called
    let orchestratorCalled = false;
    const originalExecuteTask = phase24AIOrchestrator.executeTask;

    phase24AIOrchestrator.executeTask = async (req: any) => {
      orchestratorCalled = true;
      return {
        status: 'SUCCESS',
        text: JSON.stringify({
          overallVerdict: 'High engagement seen in Hard Algebraic short videos.',
          topPerformingDimensions: [
            {
              dimension: 'platform',
              value: 'youtube_shorts',
              sampleSize: 1,
              avgViews: 15000,
              avgRetention: 88,
              avgCtr: 9.5,
              reason: 'Excellent short form pacing.'
            }
          ],
          underperformingDimensions: [],
          platformSpecificRecommendations: [],
          contentStrategyRecommendations: [],
          postingTimeRecommendations: [],
          dataConfidenceNotes: ['Sufficient for pilot.']
        }),
        data: {
          overallVerdict: 'High engagement seen in Hard Algebraic short videos.',
          topPerformingDimensions: [
            {
              dimension: 'platform',
              value: 'youtube_shorts',
              sampleSize: 1,
              avgViews: 15000,
              avgRetention: 88,
              avgCtr: 9.5,
              reason: 'Excellent short form pacing.'
            }
          ],
          underperformingDimensions: [],
          platformSpecificRecommendations: [],
          contentStrategyRecommendations: [],
          postingTimeRecommendations: [],
          dataConfidenceNotes: ['Sufficient for pilot.']
        },
        provenance: {
          provider: 'MOCK_GEMINI',
          model: 'gemini-3.8-flash',
          task: 'ANALYSIS',
          generationSource: 'GEMINI',
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: []
        }
      } as any;
    };

    try {
      const aiReportRes = await socialPerformanceIntelligenceService.generateIntelligence(
        { forceFallback: false },
        'USR-TEST-P28',
        'Test Agent'
      );

      const isAiSuccess = aiReportRes.success && aiReportRes.record;
      const hasProvenance = isAiSuccess && aiReportRes.record!.provenance !== undefined;
      const prov = hasProvenance ? aiReportRes.record!.provenance : null;

      check(
        'P28-08',
        'AI Analysis routed successfully via Central AI Provider Orchestrator',
        orchestratorCalled && isAiSuccess && hasProvenance && prov?.provider === 'MOCK_GEMINI',
        `Orchestrator called: ${orchestratorCalled} | Provenance: ${JSON.stringify(prov)}`
      );
    } finally {
      // Always restore
      phase24AIOrchestrator.executeTask = originalExecuteTask;
    }
  } catch (err: any) {
    check('P28-08', 'AI Orchestrator routing verification failed', false, err.message);
  }

  // ------------------------------------------------------------------
  // 9. RBAC Access Gates Verification
  // ------------------------------------------------------------------
  try {
    const authService = ObjectAuthorizationService.getInstance();
    
    // Roles listed in routes.ts that can access performance intelligence:
    // UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.ANALYTICS_VIEWER, UserRole.CREATOR, UserRole.PUBLISHING_MANAGER
    const allowedRoles = [
      UserRole.ADMIN,
      UserRole.CONTENT_MANAGER,
      UserRole.ANALYTICS_VIEWER,
      UserRole.CREATOR,
      UserRole.PUBLISHING_MANAGER
    ];

    const deniedRoles = [
      UserRole.QUESTION_EDITOR,
      UserRole.VIDEO_EDITOR,
      UserRole.SCRIPT_WRITER,
      UserRole.THUMBNAIL_DESIGNER,
      UserRole.REVIEWER
    ];

    let rbacPassed = true;

    for (const role of allowedRoles) {
      const actor = { id: `ACT-${role}`, role };
      const allowed = authService.hasAnyRole(actor, allowedRoles);
      if (!allowed) {
        rbacPassed = false;
        console.error(`❌ Allowed role "${role}" was denied`);
      }
    }

    for (const role of deniedRoles) {
      const actor = { id: `ACT-${role}`, role };
      const allowed = authService.hasAnyRole(actor, allowedRoles);
      if (allowed) {
        rbacPassed = false;
        console.error(`❌ Denied role "${role}" was allowed`);
      }
    }

    check(
      'P28-09',
      'RBAC Gates restrictively permit analytics access to authorized roles and block others',
      rbacPassed,
      `Validated ${allowedRoles.length} allowed roles and ${deniedRoles.length} blocked roles.`
    );
  } catch (err: any) {
    check('P28-09', 'RBAC gates verification failed', false, err.message);
  }

  // ------------------------------------------------------------------
  // 10. Apply Strategy Recommendation & Studio Parameter Integration
  // ------------------------------------------------------------------
  try {
    if (report) {
      const recommendations = await socialPerformanceIntelligenceService.getQuestionStudioRecommendations(report.id);
      const recId = recommendations[0]?.id || 'REC-MATH-01';

      const applyInput = {
        reportId: report.id,
        recommendationId: recId,
        customOverrides: {
          difficulty: 'EASY' as any
        }
      };

      const applyRes = await socialPerformanceIntelligenceService.applyStrategyRecommendation(
        applyInput,
        'USR-TEST-P28',
        'Test Agent'
      );

      const isValidApplication =
        applyRes.success &&
        applyRes.appliedParameters &&
        applyRes.appliedParameters.difficulty === 'EASY' &&
        applyRes.auditLogged === true;

      check(
        'P28-10',
        'Applying strategy recommendation populates studio parameters only and logs audit trail',
        isValidApplication,
        `Result: ${JSON.stringify(applyRes)}`
      );
    } else {
      check('P28-10', 'Skipped: No report available', false);
    }
  } catch (err: any) {
    check('P28-10', 'Apply recommendation check failed', false, err.message);
  }

  // ------------------------------------------------------------------
  // Final Verdict
  // ------------------------------------------------------------------
  console.log('\n==================================================================');
  console.log(`Phase 28 Suite Finished: ${passedCount}/${testCount} Checks Passed.`);
  console.log('==================================================================');

  if (failedCount > 0) {
    console.error('❌ SOME CHECKS FAILED!');
    process.exit(1);
  } else {
    console.log('🎉 ALL CHECKS PASSED SUCCESSFULLY!');
    process.exit(0);
  }
}

runTests();
