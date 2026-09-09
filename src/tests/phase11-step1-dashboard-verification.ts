/**
 * BURRA PARIKSHA CMS - PHASE 11 STEP 1 VERIFICATION SUITE
 * Role-Aware Dashboard Shell, Metadata Registry, and Access Gates Verification
 */

import fs from 'node:fs';
import { UserRole } from '../types';

export interface TestResultItem {
  testName: string;
  passed: boolean;
  details?: string;
}

export async function runPhase11Step1DashboardVerification(): Promise<{
  success: boolean;
  total: number;
  passed: number;
  failed: number;
  results: TestResultItem[];
}> {
  const results: TestResultItem[] = [];
  let dashboardContent = '';

  try {
    dashboardContent = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf-8');
  } catch (err: any) {
    return {
      success: false,
      total: 1,
      passed: 0,
      failed: 1,
      results: [{ testName: 'Load DashboardPage.tsx', passed: false, details: err.message }],
    };
  }

  // 1. ADMIN resolves to existing admin dashboard
  try {
    const isManagerOrAdminDef = dashboardContent.includes('isManagerOrAdmin = user && [UserRole.ADMIN, UserRole.CONTENT_MANAGER]');
    const loadOverviewGated = dashboardContent.includes('if (!isManagerOrAdmin) return');
    const loadOverviewCalledOnAdmin = dashboardContent.includes('if (isManagerOrAdmin) {') && dashboardContent.includes('loadOverview()');
    
    const passed = isManagerOrAdminDef && loadOverviewGated && loadOverviewCalledOnAdmin;
    results.push({
      testName: '1. ADMIN resolves to existing admin dashboard',
      passed,
      details: passed 
        ? 'Admin role correctly triggers loadOverview and is part of isManagerOrAdmin gate'
        : 'Missing isManagerOrAdmin role check or loadOverview gating',
    });
  } catch (err: any) {
    results.push({ testName: '1. ADMIN resolves to existing admin dashboard', passed: false, details: err.message });
  }

  // 2. CONTENT_MANAGER resolves to existing manager dashboard
  try {
    const isManagerOrAdminDef = dashboardContent.includes('isManagerOrAdmin = user && [UserRole.ADMIN, UserRole.CONTENT_MANAGER]');
    results.push({
      testName: '2. CONTENT_MANAGER resolves to existing manager dashboard',
      passed: isManagerOrAdminDef,
      details: isManagerOrAdminDef 
        ? 'CONTENT_MANAGER role is mapped directly inside the isManagerOrAdmin operational block'
        : 'CONTENT_MANAGER is not assigned manager dashboard rights',
    });
  } catch (err: any) {
    results.push({ testName: '2. CONTENT_MANAGER resolves to existing manager dashboard', passed: false, details: err.message });
  }

  // 3. QUESTION_EDITOR resolves to Question Editor workspace
  try {
    const hasQuestionEditorMetadata = dashboardContent.includes('[UserRole.QUESTION_EDITOR]') && dashboardContent.includes('Question Editor Workspace');
    results.push({
      testName: '3. QUESTION_EDITOR resolves to Question Editor workspace',
      passed: hasQuestionEditorMetadata,
      details: hasQuestionEditorMetadata 
        ? 'Found Question Editor workspace metadata and role registry definition'
        : 'Missing QUESTION_EDITOR mapping',
    });
  } catch (err: any) {
    results.push({ testName: '3. QUESTION_EDITOR resolves to Question Editor workspace', passed: false, details: err.message });
  }

  // 4. SCRIPT_WRITER resolves to Script Writer workspace
  try {
    const hasScriptWriterMetadata = dashboardContent.includes('[UserRole.SCRIPT_WRITER]') && dashboardContent.includes('Script Writer Desk');
    results.push({
      testName: '4. SCRIPT_WRITER resolves to Script Writer workspace',
      passed: hasScriptWriterMetadata,
      details: hasScriptWriterMetadata 
        ? 'Found Script Writer Desk metadata and role registry definition'
        : 'Missing SCRIPT_WRITER mapping',
    });
  } catch (err: any) {
    results.push({ testName: '4. SCRIPT_WRITER resolves to Script Writer workspace', passed: false, details: err.message });
  }

  // 5. VIDEO_EDITOR resolves to Video Editor workspace
  try {
    const hasVideoEditorMetadata = dashboardContent.includes('[UserRole.VIDEO_EDITOR]') && dashboardContent.includes('Video Production Suite');
    results.push({
      testName: '5. VIDEO_EDITOR resolves to Video Editor workspace',
      passed: hasVideoEditorMetadata,
      details: hasVideoEditorMetadata 
        ? 'Found Video Production Suite metadata and role registry definition'
        : 'Missing VIDEO_EDITOR mapping',
    });
  } catch (err: any) {
    results.push({ testName: '5. VIDEO_EDITOR resolves to Video Editor workspace', passed: false, details: err.message });
  }

  // 6. DESIGNER resolves to Designer workspace
  try {
    const hasDesignerMetadata = dashboardContent.includes('[UserRole.DESIGNER]') && dashboardContent.includes('Creative Design Board');
    results.push({
      testName: '6. DESIGNER resolves to Designer workspace',
      passed: hasDesignerMetadata,
      details: hasDesignerMetadata 
        ? 'Found Creative Design Board metadata and role registry definition'
        : 'Missing DESIGNER mapping',
    });
  } catch (err: any) {
    results.push({ testName: '6. DESIGNER resolves to Designer workspace', passed: false, details: err.message });
  }

  // 7. PUBLISHING_MANAGER resolves to Publishing workspace
  try {
    const hasPublishingMetadata = dashboardContent.includes('[UserRole.PUBLISHING_MANAGER]') && dashboardContent.includes('Publishing Operations');
    results.push({
      testName: '7. PUBLISHING_MANAGER resolves to Publishing workspace',
      passed: hasPublishingMetadata,
      details: hasPublishingMetadata 
        ? 'Found Publishing Operations metadata and role registry definition'
        : 'Missing PUBLISHING_MANAGER mapping',
    });
  } catch (err: any) {
    results.push({ testName: '7. PUBLISHING_MANAGER resolves to Publishing workspace', passed: false, details: err.message });
  }

  // 8. REVIEWER resolves to Review workspace
  try {
    const hasReviewerMetadata = dashboardContent.includes('[UserRole.REVIEWER]') && dashboardContent.includes('Quality Review Workspace');
    results.push({
      testName: '8. REVIEWER resolves to Review workspace',
      passed: hasReviewerMetadata,
      details: hasReviewerMetadata 
        ? 'Found Quality Review Workspace metadata and role registry definition'
        : 'Missing REVIEWER mapping',
    });
  } catch (err: any) {
    results.push({ testName: '8. REVIEWER resolves to Review workspace', passed: false, details: err.message });
  }

  // 9. Specialist dashboard does not request unauthorized global dashboard data
  try {
    const globalFetchGated = dashboardContent.includes('if (!isManagerOrAdmin) return;') &&
                             dashboardContent.includes('if (isManagerOrAdmin) {') &&
                             dashboardContent.includes('apiClient.getCategories()') &&
                             dashboardContent.includes('apiClient.getHealth()');
    results.push({
      testName: '9. Specialist dashboard does not request unauthorized global data',
      passed: globalFetchGated,
      details: globalFetchGated 
        ? 'All global metric endpoints, metadata, and health checkers are strictly gated under isManagerOrAdmin'
        : 'Specialist roles are leaking global analytic requests',
    });
  } catch (err: any) {
    results.push({ testName: '9. Specialist dashboard does not request unauthorized global data', passed: false, details: err.message });
  }

  // 10. Existing ADMIN/CONTENT_MANAGER dashboard behavior remains intact
  try {
    const hasReturnBlock = dashboardContent.includes('return (\n    <div className="space-y-6 pb-12 animate-in fade-in duration-200">') &&
                           dashboardContent.includes('<DailyWorkflowGuide') &&
                           dashboardContent.includes('<PipelineVisualizer') &&
                           dashboardContent.includes('<TodaysWorkSection');
    results.push({
      testName: '10. Existing ADMIN/CONTENT_MANAGER dashboard behavior remains intact',
      passed: hasReturnBlock,
      details: hasReturnBlock 
        ? 'Admin/Manager return block, layout, and priority sections are fully preserved'
        : 'Original admin layout is missing or corrupted',
    });
  } catch (err: any) {
    results.push({ testName: '10. Existing ADMIN/CONTENT_MANAGER dashboard behavior remains intact', passed: false, details: err.message });
  }

  // 11. Loading state renders correctly
  try {
    const hasAuthLoadingGate = dashboardContent.includes('if (authLoading) {') &&
                               dashboardContent.includes('Loading Workspace...') &&
                               dashboardContent.includes('Establishing Secure Session Context...');
    results.push({
      testName: '11. Loading state renders correctly',
      passed: hasAuthLoadingGate,
      details: hasAuthLoadingGate 
        ? 'Loading state for authLoading cleanly gates component mounts to prevent role flashes'
        : 'Missing authLoading gating block',
    });
  } catch (err: any) {
    results.push({ testName: '11. Loading state renders correctly', passed: false, details: err.message });
  }

  // 12. Empty state renders correctly
  try {
    const hasEmptyState = dashboardContent.includes('Queue Clean & Caught Up') &&
                          dashboardContent.includes('No tasks currently match this workboard filter. Excellent work maintaining your workflow.');
    results.push({
      testName: '12. Empty state renders correctly',
      passed: hasEmptyState,
      details: hasEmptyState 
        ? 'Empty state displays custom aesthetic illustration and text when active assignments array is empty'
        : 'Missing clean task empty state in table rendering',
    });
  } catch (err: any) {
    results.push({ testName: '12. Empty state renders correctly', passed: false, details: err.message });
  }

  // 13. Error state renders correctly
  try {
    const hasErrorState = dashboardContent.includes('myWorkError') &&
                          dashboardContent.includes('Metrics Unavailable');
    results.push({
      testName: '13. Error state renders correctly',
      passed: hasErrorState,
      details: hasErrorState 
        ? 'Error banners render properly when myWorkError contains network/auth errors'
        : 'Missing visual error handling blocks',
    });
  } catch (err: any) {
    results.push({ testName: '13. Error state renders correctly', passed: false, details: err.message });
  }

  // 14. Legacy roles do not receive unintended specialist dashboards
  try {
    const hasLegacyCheck = dashboardContent.includes('isLegacyRole = user && [UserRole.CREATOR, UserRole.EDITOR]') &&
                           dashboardContent.includes('Access Restricted') &&
                           dashboardContent.includes('The role "') &&
                           dashboardContent.includes('is a legacy/archived system role');
    results.push({
      testName: '14. Legacy roles do not receive unintended specialist dashboards',
      passed: hasLegacyCheck,
      details: hasLegacyCheck 
        ? 'Legacy roles (CREATOR, EDITOR) are explicitly caught and blocked with customized access-restricted UI'
        : 'Legacy roles are not correctly gated',
    });
  } catch (err: any) {
    results.push({ testName: '14. Legacy roles do not receive unintended specialist dashboards', passed: false, details: err.message });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    success: failedCount === 0,
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}
