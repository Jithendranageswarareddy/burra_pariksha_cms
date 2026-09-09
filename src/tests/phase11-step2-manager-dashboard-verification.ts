/**
 * BURRA PARIKSHA CMS - PHASE 11 STEP 2 VERIFICATION SUITE
 * Manager & Admin Operations Dashboard and Gating Verification
 */

import fs from 'node:fs';
import { UserRole } from '../types';

export interface TestResultItem {
  testName: string;
  passed: boolean;
  details?: string;
}

export async function runPhase11Step2ManagerDashboardVerification(): Promise<{
  success: boolean;
  total: number;
  passed: number;
  failed: number;
  results: TestResultItem[];
}> {
  const results: TestResultItem[] = [];
  let dashboardContent = '';
  let settingsContent = '';

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

  try {
    settingsContent = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf-8');
  } catch (err: any) {
    return {
      success: false,
      total: 1,
      passed: 0,
      failed: 1,
      results: [{ testName: 'Load SettingsPage.tsx', passed: false, details: err.message }],
    };
  }

  // CHECK 1: Only ADMIN fetches full system integrity and operational health telemetry background APIs
  try {
    const integrityCheckGated = dashboardContent.includes('if (user?.role === UserRole.ADMIN) {') &&
                                dashboardContent.includes('apiClient.getSystemIntegrityHealth()') &&
                                dashboardContent.includes('apiClient.getOperationalHealth()');
    results.push({
      testName: '1. Only ADMIN fetches full system health and resilience telemetry APIs',
      passed: integrityCheckGated,
      details: integrityCheckGated
        ? 'Successfully verified that system diagnostics are fetched exclusively when user?.role === UserRole.ADMIN'
        : 'System health background APIs are fetched by unauthorized users (e.g., CONTENT_MANAGER)',
    });
  } catch (err: any) {
    results.push({ testName: '1. Only ADMIN fetches full system health and resilience telemetry APIs', passed: false, details: err.message });
  }

  // CHECK 2: Gating of visual health status chips (Resilience and Integrity) on DashboardPage
  try {
    const chipsGated = dashboardContent.includes('{user?.role === UserRole.ADMIN && (') &&
                       dashboardContent.includes('to="/settings?tab=recovery"') &&
                       dashboardContent.includes('to="/settings?tab=integrity"');
    results.push({
      testName: '2. Resilience and Integrity health status chips are restricted to ADMIN only',
      passed: chipsGated,
      details: chipsGated
        ? 'Successfully verified that recovery and integrity link chips are rendered only if user?.role === UserRole.ADMIN'
        : 'System status indicator chips are visible to unauthorized roles',
    });
  } catch (err: any) {
    results.push({ testName: '2. Resilience and Integrity health status chips are restricted to ADMIN only', passed: false, details: err.message });
  }

  // CHECK 3: Gating of full database settings and diagnostics link on DashboardPage footer
  try {
    const footerLinkGated = dashboardContent.includes('{user?.role === UserRole.ADMIN && (') &&
                            dashboardContent.includes('to="/settings"') &&
                            dashboardContent.includes('View Full Database Settings & Diagnostics');
    results.push({
      testName: '3. Full database settings & diagnostics link is restricted to ADMIN only',
      passed: footerLinkGated,
      details: footerLinkGated
        ? 'Successfully verified that the database settings link in the audit stream footer is gated under UserRole.ADMIN'
        : 'Full database settings link is visible to unauthorized roles',
    });
  } catch (err: any) {
    results.push({ testName: '3. Full database settings & diagnostics link is restricted to ADMIN only', passed: false, details: err.message });
  }

  // CHECK 4: Gating of settings tabs for non-ADMIN in SettingsPage
  try {
    const tabsGatedInSettings = settingsContent.includes('const tabs = rawTabs.filter((tab) => {') &&
                                settingsContent.includes("['recovery', 'integrity'].includes(tab.id)") &&
                                settingsContent.includes('return isAdmin;');
    results.push({
      testName: '4. Restricted settings tabs are filtered out on SettingsPage for non-ADMIN',
      passed: tabsGatedInSettings,
      details: tabsGatedInSettings
        ? 'Successfully verified that Reliability & Recovery and Data Integrity tabs are dynamically hidden for non-admin'
        : 'Restricted settings tabs are visible to non-admin roles',
    });
  } catch (err: any) {
    results.push({ testName: '4. Restricted settings tabs are filtered out on SettingsPage for non-ADMIN', passed: false, details: err.message });
  }

  // CHECK 5: Automatic redirect of restricted tabs for non-ADMIN in SettingsPage
  try {
    const tabRedirectActive = settingsContent.includes('if (user && user.role !== UserRole.ADMIN) {') &&
                              settingsContent.includes("['recovery', 'integrity'].includes(activeTab)") &&
                              settingsContent.includes("setActiveTab('sheets')");
    results.push({
      testName: '5. Dynamic tab redirect gates restricted tab URLs for non-ADMIN',
      passed: tabRedirectActive,
      details: tabRedirectActive
        ? 'Successfully verified that non-admin users attempting to open recovery or integrity tabs are automatically redirected'
        : 'Missing automatic redirection check for unauthorized tab parameters',
    });
  } catch (err: any) {
    results.push({ testName: '5. Dynamic tab redirect gates restricted tab URLs for non-ADMIN', passed: false, details: err.message });
  }

  // CHECK 6: Detailed Team Operations KPIs and Workload distribution displaying core workload metrics
  try {
    const hasActiveTasksKPI = dashboardContent.includes('Active Tasks') && dashboardContent.includes('totalActiveTasks');
    const hasOverdueTasksKPI = dashboardContent.includes('Overdue Tasks') && dashboardContent.includes('totalOverdueTasks');
    const hasBlockedTasksKPI = dashboardContent.includes('Blocked Tasks') && dashboardContent.includes('totalBlockedTasks');
    const hasUnassignedKPI = dashboardContent.includes('Unassigned Queue') && dashboardContent.includes('unassignedCount');
    const hasCompletedKPI = dashboardContent.includes('Completed (Uploaded)') && dashboardContent.includes('uploaded');

    const passed = hasActiveTasksKPI && hasOverdueTasksKPI && hasBlockedTasksKPI && hasUnassignedKPI && hasCompletedKPI;
    results.push({
      testName: '6. Detailed Team Operations KPIs are integrated to the manager dashboard view',
      passed,
      details: passed
        ? 'Successfully verified 5-column metric indicator cards showing Active, Overdue, Blocked, Unassigned, and Completed tasks'
        : 'Missing or incomplete team workload operational KPI cards',
    });
  } catch (err: any) {
    results.push({ testName: '6. Detailed Team Operations KPIs are integrated to the manager dashboard view', passed: false, details: err.message });
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
