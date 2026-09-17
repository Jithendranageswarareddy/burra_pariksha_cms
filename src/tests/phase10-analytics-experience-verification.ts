/**
 * BURRA PARIKSHA CMS - Phase 10 Analytics Experience Verification
 * 
 * Validates top-level Analytics Experience UI/UX:
 * 1. Navigation separation (Analytics distinct from Content Studio production workflow 01-15)
 * 2. Navigation items for Overview, Video, Platform, Topic, Subtopic, Difficulty, Engagement, AI Insights, Strategy
 * 3. Non-numbered production step compliance (Analytics is NOT Step 16)
 * 4. API Client methods for Analytics, Intelligence, and Strategy
 */

import { NAVIGATION_SECTIONS } from '../config/navigation';
import { apiClient } from '../lib/api-client';

async function runPhase10Verification() {
  console.log('====================================================');
  console.log('PHASE 10 — ANALYTICS EXPERIENCE VERIFICATION');
  console.log('====================================================\n');

  let totalChecks = 0;
  let passedChecks = 0;

  function assert(condition: boolean, title: string, details?: string) {
    totalChecks++;
    if (condition) {
      passedChecks++;
      console.log(`✅ [PASS] ${title}`);
    } else {
      console.error(`❌ [FAIL] ${title}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // 1. Navigation Structure Checks
  console.log('--- 1. Navigation Structure & Separation Checks ---');

  const analyticsSection = NAVIGATION_SECTIONS.find((s) => s.title === 'ANALYTICS');
  assert(
    !!analyticsSection,
    'Navigation contains top-level "ANALYTICS" section',
    'NAVIGATION_SECTIONS must include an entry with title "ANALYTICS"'
  );

  if (analyticsSection) {
    const itemNames = analyticsSection.items.map((i) => i.name);
    const itemHrefs = analyticsSection.items.map((i) => i.href);

    assert(
      itemNames.includes('Analytics Overview') && itemHrefs.includes('/analytics/overview'),
      'Includes "Analytics Overview" view (/analytics/overview)'
    );

    assert(
      itemNames.includes('Video Performance') && itemHrefs.includes('/analytics/video'),
      'Includes "Video Performance" view (/analytics/video)'
    );

    assert(
      itemNames.includes('Platform Performance') && itemHrefs.includes('/analytics/platform'),
      'Includes "Platform Performance" view (/analytics/platform)'
    );

    assert(
      itemNames.includes('Topic Performance') && itemHrefs.includes('/analytics/topic'),
      'Includes "Topic Performance" view (/analytics/topic)'
    );

    assert(
      itemNames.includes('Subtopic Performance') && itemHrefs.includes('/analytics/subtopic'),
      'Includes "Subtopic Performance" view (/analytics/subtopic)'
    );

    assert(
      itemNames.includes('Difficulty Performance') && itemHrefs.includes('/analytics/difficulty'),
      'Includes "Difficulty Performance" view (/analytics/difficulty)'
    );

    assert(
      itemNames.includes('Engagement') && itemHrefs.includes('/analytics/engagement'),
      'Includes "Engagement" view (/analytics/engagement)'
    );

    assert(
      itemNames.includes('Retention') && itemHrefs.includes('/analytics/retention'),
      'Includes "Retention" view (/analytics/retention)'
    );

    assert(
      itemNames.includes('AI Insights') && itemHrefs.includes('/analytics/intelligence'),
      'Includes "AI Insights" view (/analytics/intelligence)'
    );

    assert(
      itemNames.includes('Content Strategy') && itemHrefs.includes('/analytics/strategy'),
      'Includes "Content Strategy" view (/analytics/strategy)'
    );

    assert(
      itemHrefs.includes('/social-analytics'),
      'Includes "Snapshot Entry & Log" entry point (/social-analytics)'
    );

    // Rule: Analytics is NOT labeled as Step 16
    const hasStep16Label = analyticsSection.items.some(
      (item) => item.name.includes('Step 16') || item.name.startsWith('16 ')
    );
    assert(
      !hasStep16Label,
      'Analytics section is separate from production sequence (NOT labeled Step 16)',
      'Analytics must be top-level experience, not Step 16'
    );
  }

  // 2. Production Steps Check
  console.log('\n--- 2. Production Steps Integrity Check ---');
  const studioSection = NAVIGATION_SECTIONS.find((s) => s.title === 'CONTENT STUDIO');
  if (studioSection) {
    const lastProductionStep = studioSection.items[studioSection.items.length - 1];
    assert(
      lastProductionStep.name.includes('15') || lastProductionStep.name.includes('Publish'),
      'Content Studio workflow ends at Step 15 Publish',
      `Last step found: ${lastProductionStep.name}`
    );
  }

  // 3. API Client Integration Checks
  console.log('\n--- 3. Analytics API Integration Checks ---');
  assert(
    typeof apiClient.getSocialAnalyticsSummary === 'function',
    'apiClient provides getSocialAnalyticsSummary()'
  );
  assert(
    typeof apiClient.querySocialAnalytics === 'function',
    'apiClient provides querySocialAnalytics()'
  );
  assert(
    typeof apiClient.getIntelligenceReports === 'function',
    'apiClient provides getIntelligenceReports()'
  );
  assert(
    typeof apiClient.getStrategyRecommendations === 'function',
    'apiClient provides getStrategyRecommendations()'
  );

  // Summary
  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY: ${passedChecks}/${totalChecks} PASS`);
  console.log('====================================================\n');

  if (passedChecks !== totalChecks) {
    process.exit(1);
  }
}

runPhase10Verification().catch((err) => {
  console.error('Fatal error during Phase 10 verification:', err);
  process.exit(1);
});
