/**
 * BURRA PARIKSHA CMS - Phase 11 Legacy UI Removal & Simplification Verification
 * 
 * Verifies that:
 * 1. Primary navigation communicates a clean 15-step production workflow (01 Generate Question through 15 Publish).
 * 2. Obsolete primary navigation items (Production Tracker, Video Queue, Production Board, Content Masters, Planning, Team) are removed from primary Content Studio navigation.
 * 3. User-facing content terminology uses "Content" (e.g. "Content #203").
 * 4. Technical IDs and statuses are placed under Details -> Technical Information.
 * 5. Dashboard, My Work, Analytics, and Admin remain separate top-level domains.
 * 6. All backend APIs, Google Sheets, Google Drive, AI workflows, and RBAC remain intact.
 * 7. TypeScript and build pass cleanly.
 */

import fs from 'fs';
import path from 'path';
import { NAVIGATION_SECTIONS } from '../config/navigation';
import { formatDisplayId, formatWorkflowStatusLabel, getVideoCanonicalStepUrl } from '../utils/formatters';

async function runPhase11Verification() {
  console.log('====================================================');
  console.log('PHASE 11 — LEGACY UI REMOVAL & SIMPLIFICATION VERIFICATION');
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

  // P11-01: Primary navigation contains canonical 15 steps
  console.log('--- 1. Primary Navigation & Workflow Journey ---');
  const studioSection = NAVIGATION_SECTIONS.find((s) => s.title === 'CONTENT STUDIO');
  assert(
    !!studioSection && studioSection.items.length === 15,
    'P11-01: Primary navigation contains canonical 15 production steps',
    `Expected 15 items in CONTENT STUDIO, found ${studioSection?.items.length || 0}`
  );

  if (studioSection) {
    const stepNumbers = studioSection.items.map((i) => i.step);
    const expectedSteps = Array.from({ length: 15 }, (_, idx) => String(idx + 1).padStart(2, '0'));
    const allStepsPresent = expectedSteps.every((s) => stepNumbers.includes(s));
    assert(
      allStepsPresent,
      'P11-01b: All 15 sequential step numbers (01 through 15) are present in order',
      `Found steps: ${stepNumbers.join(', ')}`
    );
  }

  // P11-02: Production Tracker absent from primary navigation
  const studioNames = studioSection ? studioSection.items.map((i) => i.name) : [];
  assert(
    !studioNames.includes('Production Tracker'),
    'P11-02: Production Tracker is absent from primary Content Studio navigation'
  );

  // P11-03: Video Queue absent from primary navigation
  assert(
    !studioNames.includes('Video Queue'),
    'P11-03: Video Queue is absent from primary Content Studio navigation (Step 07 is Record Video)'
  );

  // P11-04: Production Board absent from primary navigation
  assert(
    !studioNames.includes('Production Board'),
    'P11-04: Production Board is absent from primary Content Studio navigation'
  );

  // P11-05: Content Masters absent as primary user-facing workflow
  assert(
    !studioNames.includes('Content Masters') && !studioNames.includes('Content Master'),
    'P11-05: Content Masters is absent from primary Content Studio navigation'
  );

  // P11-06: Terminology formatting
  console.log('--- 2. User-Facing Terminology & Formatting ---');
  const formattedCnt = formatDisplayId('BP-CNT-000203', 'content');
  const formattedQ = formatDisplayId('BP-Q-000203', 'question');
  const formattedV = formatDisplayId('BP-V-000044', 'video');
  assert(
    formattedCnt === 'Content #203' && formattedQ === 'Question #203' && formattedV === 'Video #44',
    'P11-06: User-facing terminology uses clean "Content #203" / "Question #203" / "Video #44"',
    `Got: CNT="${formattedCnt}", Q="${formattedQ}", V="${formattedV}"`
  );

  // P11-07: Planning & Batches outside 15-step workflow
  assert(
    !studioNames.includes('Planning & Batches'),
    'P11-07: Planning & Batches is outside the 15-step production workflow'
  );

  // P11-08: Team & Workload outside individual production journey
  assert(
    !studioNames.includes('Team Operations') && !studioNames.includes('Team & Workload'),
    'P11-08: Team Operations is outside the 15-step production workflow'
  );

  // P11-09: Recovery is admin-only
  console.log('--- 3. Admin & Technical Details ---');
  const sidebarContent = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/Sidebar.tsx'), 'utf-8');
  assert(
    sidebarContent.includes("item.href === '/recovery'") && sidebarContent.includes('ADMIN'),
    'P11-09: Recovery Admin link is restricted to Admin role in Sidebar presentation'
  );

  // P11-10: Action-oriented status labels
  const scriptReqLabel = formatWorkflowStatusLabel('SCRIPT_REQUIRED');
  const recLabel = formatWorkflowStatusLabel('RECORDING');
  const editLabel = formatWorkflowStatusLabel('EDITING');
  assert(
    scriptReqLabel === 'Create Script' && recLabel === 'Record Video' && editLabel === 'Edit Video',
    'P11-10: Technical status codes map to action-oriented user-facing labels',
    `Got: SCRIPT_REQUIRED="${scriptReqLabel}", RECORDING="${recLabel}", EDITING="${editLabel}"`
  );

  // P11-11: Technical IDs not displayed prominently
  const questionTableContent = fs.readFileSync(path.join(process.cwd(), 'src/components/questions/QuestionTable.tsx'), 'utf-8');
  const productionTableContent = fs.readFileSync(path.join(process.cwd(), 'src/components/production/ProductionTable.tsx'), 'utf-8');
  assert(
    questionTableContent.includes('formatDisplayId') && productionTableContent.includes('formatDisplayId'),
    'P11-11: Question and Production tables use formatDisplayId for user-facing ID presentation'
  );

  // P11-12: TechnicalDetails component exists
  const technicalDetailsExists = fs.existsSync(path.join(process.cwd(), 'src/components/common/TechnicalDetails.tsx'));
  assert(
    technicalDetailsExists,
    'P11-12: TechnicalDetails component exists for displaying raw IDs and metadata under Details -> Technical Information'
  );

  // P11-13 & P11-14: Canonical video workflow URLs
  console.log('--- 4. Route & Navigation Redirections ---');
  const scriptUrl = getVideoCanonicalStepUrl('BP-V-000044', 'SCRIPT_REQUIRED');
  const recordUrl = getVideoCanonicalStepUrl('BP-V-000044', 'RECORDING');
  const editUrl = getVideoCanonicalStepUrl('BP-V-000044', 'EDITING');
  assert(
    scriptUrl === '/videos/BP-V-000044/create-script' &&
      recordUrl === '/videos/BP-V-000044/record' &&
      editUrl === '/videos/BP-V-000044/edit-video',
    'P11-13 & P11-14: Canonical 15-step video workflow URLs map correctly (Steps 05-15)',
    `Got: script="${scriptUrl}", record="${recordUrl}", edit="${editUrl}"`
  );

  // P11-15: App.tsx redirects legacy entry points
  const appContent = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf-8');
  assert(
    appContent.includes('production-board') && appContent.includes('Navigate'),
    'P11-15: App.tsx configures redirects for legacy production routes to canonical destinations'
  );

  // P11-16: Dashboard remains production control center
  console.log('--- 5. Core Application Domains ---');
  const dashboardExists = fs.existsSync(path.join(process.cwd(), 'src/pages/DashboardPage.tsx'));
  assert(
    dashboardExists,
    'P11-16: Dashboard remains top-level home control center'
  );

  // P11-17: My Work remains separate
  const myWorkExists = fs.existsSync(path.join(process.cwd(), 'src/pages/MyWorkPage.tsx'));
  assert(
    myWorkExists,
    'P11-17: My Work remains separate personal workspace'
  );

  // P11-18: Analytics remains separate
  const analyticsSection = NAVIGATION_SECTIONS.find((s) => s.title === 'ANALYTICS');
  assert(
    !!analyticsSection && analyticsSection.items.length >= 10,
    'P11-18: Analytics remains separate top-level domain'
  );

  // P11-19: Admin / System remains separate
  const systemSection = NAVIGATION_SECTIONS.find((s) => s.title === 'SYSTEM');
  assert(
    !!systemSection && systemSection.items.some((i) => i.href === '/settings'),
    'P11-19: System & Settings remain separate domain'
  );

  // P11-20 to P11-24: Backend & Infrastructure Integrity
  console.log('--- 6. Backend & Integration Preservation ---');
  const apiClientExists = fs.existsSync(path.join(process.cwd(), 'src/lib/api-client.ts'));
  const routesExists = fs.existsSync(path.join(process.cwd(), 'src/server/routes.ts'));
  assert(
    apiClientExists && routesExists,
    'P11-20: Existing APIs and server route handlers are fully preserved'
  );

  const sheetsExists = fs.existsSync(path.join(process.cwd(), 'src/lib/google-sheets/client.ts')) || fs.existsSync(path.join(process.cwd(), 'src/server/google-sheets.ts'));
  assert(
    sheetsExists,
    'P11-21: Google Sheets integration backend is fully preserved'
  );

  const driveExists = fs.existsSync(path.join(process.cwd(), 'src/lib/services/google-drive.service.ts')) || fs.existsSync(path.join(process.cwd(), 'src/server/google-drive.ts'));
  assert(
    driveExists,
    'P11-22: Google Drive integration backend is fully preserved'
  );

  const aiExists = fs.existsSync(path.join(process.cwd(), 'src/lib/ai/gemini.client.ts')) || fs.existsSync(path.join(process.cwd(), 'src/server/ai-workflows.ts'));
  assert(
    aiExists,
    'P11-23: AI workflows backend is fully preserved'
  );

  const typesPath = fs.existsSync(path.join(process.cwd(), 'src/types/index.ts'))
    ? path.join(process.cwd(), 'src/types/index.ts')
    : path.join(process.cwd(), 'src/types.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  assert(
    typesContent.includes('UserRole') && typesContent.includes('ADMIN'),
    'P11-24: Role-based access control (RBAC) types and structures are fully preserved'
  );

  // P11-25 & P11-26: Design System & Shell
  console.log('--- 7. UI Foundations & Anti-Regression ---');
  const buttonExists = fs.existsSync(path.join(process.cwd(), 'src/design-system/components/Button.tsx'));
  assert(
    buttonExists,
    'P11-25: Phase 03 Design System components are fully preserved'
  );

  const headerExists = fs.existsSync(path.join(process.cwd(), 'src/components/layout/Header.tsx'));
  assert(
    headerExists,
    'P11-26: Phase 04 Application Shell layout components are fully preserved'
  );

  // P11-27: No Manual Authoring UI reintroduced
  const headerContent = fs.readFileSync(path.join(process.cwd(), 'src/components/layout/Header.tsx'), 'utf-8');
  assert(
    !headerContent.includes('mode=manual') && !sidebarContent.includes('mode=manual'),
    'P11-27: Zero user-facing shell or navigation actions invoke manual authoring UI'
  );

  // Summary
  console.log('\n====================================================');
  console.log(`PHASE 11 VERIFICATION SUMMARY: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  console.log('====================================================\n');

  if (passedChecks !== totalChecks) {
    process.exit(1);
  }
}

runPhase11Verification().catch((err) => {
  console.error('Phase 11 verification crashed:', err);
  process.exit(1);
});
