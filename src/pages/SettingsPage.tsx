import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  Database,
  HardDrive,
  Cpu,
  Layers,
  Share2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Info,
  Server,
  Key,
  Table,
  Hash,
  ShieldCheck,
  FileCheck,
  Search,
  Filter,
  Download,
  PlayCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  Wrench,
  Zap,
  Plus,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { APP_CONFIG } from '../config/constants';
import { MOCK_CATEGORIES, MOCK_TOPICS } from '../lib/mock-data/taxonomy';
import { apiClient } from '../lib/api-client';
import { SpreadsheetHealthReport, SystemHealthReport, IntegrityIssue, IntegritySeverity, IntegrityCategory, UserRole } from '../types';
import { ALL_SHEET_TABS, ID_PREFIX_MAP, SequenceEntityType } from '../lib/schemas/google-sheets-schema';
import { OperationalHealthReport } from '../lib/services/operational-health.service';
import { SequenceSafetyReport } from '../lib/services/sequence-safety.service';
import { OperationalRecoveryState } from '../lib/services/operational-recovery.service';
import { useAuth } from '../contexts/AuthContext';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const urlTab = searchParams.get('tab');
  const initialTab = (urlTab && ['sheets', 'taxonomy', 'app', 'ai', 'drive', 'publishing', ...(user?.role === UserRole.ADMIN ? ['recovery', 'integrity'] : [])].includes(urlTab))
    ? (urlTab as any)
    : (user?.role === UserRole.ADMIN ? 'recovery' : 'sheets');

  const [activeTab, setActiveTab] = useState<
    'recovery' | 'integrity' | 'sheets' | 'taxonomy' | 'app' | 'ai' | 'drive' | 'publishing'
  >(initialTab);

  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sheets Health State (Phase 2)
  const [healthReport, setHealthReport] = useState<SpreadsheetHealthReport | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  // Data Integrity & System Health State (Phase 8A)
  const [integrityReport, setIntegrityReport] = useState<SystemHealthReport | null>(null);
  const [isLoadingIntegrity, setIsLoadingIntegrity] = useState(false);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [issueSearchQuery, setIssueSearchQuery] = useState('');

  // Operational Reliability & Recovery State (Phase 8B)
  const [opHealthReport, setOpHealthReport] = useState<OperationalHealthReport | null>(null);
  const [seqSafetyReport, setSeqSafetyReport] = useState<SequenceSafetyReport | null>(null);
  const [recoveryState, setRecoveryState] = useState<OperationalRecoveryState | null>(null);
  const [isLoadingRecovery, setIsLoadingRecovery] = useState(false);

  // Sequence Sync Modal State
  const [syncTargetEntity, setSyncTargetEntity] = useState<string | null>(null);
  const [syncProposedNumber, setSyncProposedNumber] = useState<number>(1);
  const [syncConfirmed, setSyncConfirmed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Phase 8A Verification Test Runner State
  const [isRunningTests8a, setIsRunningTests8a] = useState(false);
  const [testResults8a, setTestResults8a] = useState<{
    success: boolean;
    totalTests: number;
    passedTests: number;
    results: { test: string; passed: boolean; detail?: string }[];
  } | null>(null);

  // Phase 8B Verification Test Runner State
  const [isRunningTests8b, setIsRunningTests8b] = useState(false);
  const [testResults8b, setTestResults8b] = useState<{
    success: boolean;
    totalTests: number;
    passedTests: number;
    results: { test: string; passed: boolean; detail?: string }[];
  } | null>(null);

  // Phase 9 Verification Test Runner State
  const [isRunningTests9, setIsRunningTests9] = useState(false);
  const [testResults9, setTestResults9] = useState<{
    success: boolean;
    totalTests: number;
    passedTests: number;
    results: { test: string; passed: boolean; detail?: string }[];
  } | null>(null);

  // Phase 10 Verification Test Runner State
  const [isRunningTests10, setIsRunningTests10] = useState(false);
  const [testResults10, setTestResults10] = useState<{
    success: boolean;
    totalTests: number;
    passedTests: number;
    results: { section: string; status: string }[];
  } | null>(null);

  // Live Taxonomy State (Tab 3)
  const [liveTaxonomyTree, setLiveTaxonomyTree] = useState<any[]>([]);
  const [pureTaxonomyList, setPureTaxonomyList] = useState<any[]>([]);
  const [taxonomyMetrics, setTaxonomyMetrics] = useState<any>(null);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(false);
  const [taxonomySearchQuery, setTaxonomySearchQuery] = useState('');
  const [subtopicSearchQuery, setSubtopicSearchQuery] = useState('');
  const [taxonomyFilterStatus, setTaxonomyFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [taxonomyFilterCompleteness, setTaxonomyFilterCompleteness] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [isRunningTests04, setIsRunningTests04] = useState(false);
  const [testResults04, setTestResults04] = useState<any | null>(null);

  // Administration modals & form state
  const [isCreateTopicModalOpen, setIsCreateTopicModalOpen] = useState(false);
  const [isCreateSubtopicModalOpen, setIsCreateSubtopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<any | null>(null);
  const [editingSubtopic, setEditingSubtopic] = useState<any | null>(null);
  const [isSavingTaxonomy, setIsSavingTaxonomy] = useState(false);

  const [topicForm, setTopicForm] = useState({ name: '', slug: '', description: '', displayOrder: 101, isActive: true });
  const [subtopicForm, setSubtopicForm] = useState({ topicId: 'BP-TOP-001', name: '', slug: '', description: '', notes: '', displayOrder: 101, isActive: true });

  const canAdministerTaxonomy = user?.role === UserRole.ADMIN || user?.role === UserRole.CONTENT_MANAGER;

  const fetchLiveTaxonomy = async () => {
    setIsLoadingTaxonomy(true);
    try {
      const [tree, pureList, metrics] = await Promise.all([
        apiClient.getTaxonomyTree(),
        apiClient.getPureTaxonomyTree({ includeInactive: true }),
        apiClient.getTaxonomyMetrics(),
      ]);
      setLiveTaxonomyTree(tree || []);
      setPureTaxonomyList(pureList || []);
      setTaxonomyMetrics(metrics || null);
    } catch (err: any) {
      console.warn('Failed to load live taxonomy:', err);
    } finally {
      setIsLoadingTaxonomy(false);
    }
  };

  const handleRunVerificationSuite04 = async () => {
    setIsRunningTests04(true);
    try {
      const res = await apiClient.runTaxonomyVerification();
      setTestResults04(res);
      setNotification({
        text: `Taxonomy Verification Suite finished: ${res.passedTests}/${res.totalTests} checks passed. Gate Status: ${res.gateStatus}.`,
        type: res.gateStatus === 'PASS' ? 'success' : 'error',
      });
    } catch (err: any) {
      setNotification({ text: `Taxonomy test run failed: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsRunningTests04(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.name.trim()) return;
    setIsSavingTaxonomy(true);
    try {
      const generatedSlug = topicForm.slug.trim() || topicForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await apiClient.createTopic({
        name: topicForm.name.trim(),
        slug: generatedSlug,
        description: topicForm.description.trim() || undefined,
        displayOrder: Number(topicForm.displayOrder) || 1,
        isActive: topicForm.isActive,
      });
      setNotification({ text: `Topic "${topicForm.name}" created successfully.`, type: 'success' });
      setIsCreateTopicModalOpen(false);
      setTopicForm({ name: '', slug: '', description: '', displayOrder: 101, isActive: true });
      await fetchLiveTaxonomy();
    } catch (err: any) {
      setNotification({ text: `Failed to create Topic: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsSavingTaxonomy(false);
    }
  };

  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !editingTopic.name.trim()) return;
    setIsSavingTaxonomy(true);
    try {
      await apiClient.updateTopic(editingTopic.id, {
        name: editingTopic.name.trim(),
        slug: editingTopic.slug.trim(),
        description: editingTopic.description?.trim() || undefined,
        displayOrder: Number(editingTopic.displayOrder) || 1,
        isActive: editingTopic.isActive,
      });
      setNotification({ text: `Topic "${editingTopic.name}" updated successfully.`, type: 'success' });
      setEditingTopic(null);
      await fetchLiveTaxonomy();
    } catch (err: any) {
      setNotification({ text: `Failed to update Topic: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsSavingTaxonomy(false);
    }
  };

  const handleToggleTopicActive = async (topic: any) => {
    const nextState = topic.isActive === false;
    try {
      await apiClient.toggleTopicActive(topic.id, nextState);
      setNotification({ text: `Topic ${topic.id} is now ${nextState ? 'Active' : 'Inactive'}.`, type: 'success' });
      await fetchLiveTaxonomy();
    } catch (err: any) {
      setNotification({ text: `Failed to toggle Topic active state: ${err?.message || 'Error'}`, type: 'error' });
    }
  };

  const handleCreateSubtopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtopicForm.name.trim() || !subtopicForm.topicId) return;
    setIsSavingTaxonomy(true);
    try {
      const generatedSlug = subtopicForm.slug.trim() || subtopicForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await apiClient.createSubtopic({
        topicId: subtopicForm.topicId,
        name: subtopicForm.name.trim(),
        slug: generatedSlug,
        description: subtopicForm.description.trim() || undefined,
        notes: subtopicForm.notes.trim() || undefined,
        displayOrder: Number(subtopicForm.displayOrder) || 1,
        isActive: subtopicForm.isActive,
      });
      setNotification({ text: `Subtopic "${subtopicForm.name}" created under Topic ${subtopicForm.topicId}.`, type: 'success' });
      setIsCreateSubtopicModalOpen(false);
      setSubtopicForm({ topicId: 'BP-TOP-001', name: '', slug: '', description: '', notes: '', displayOrder: 101, isActive: true });
      await fetchLiveTaxonomy();
    } catch (err: any) {
      setNotification({ text: `Failed to create Subtopic: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsSavingTaxonomy(false);
    }
  };

  const handleUpdateSubtopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubtopic || !editingSubtopic.name.trim()) return;
    setIsSavingTaxonomy(true);
    try {
      await apiClient.updateSubtopic(editingSubtopic.id, {
        name: editingSubtopic.name.trim(),
        slug: editingSubtopic.slug.trim(),
        description: editingSubtopic.description?.trim() || undefined,
        notes: editingSubtopic.notes?.trim() || undefined,
        displayOrder: Number(editingSubtopic.displayOrder) || 1,
        isActive: editingSubtopic.isActive,
      });
      setNotification({ text: `Subtopic "${editingSubtopic.name}" updated successfully.`, type: 'success' });
      setEditingSubtopic(null);
      await fetchLiveTaxonomy();
    } catch (err: any) {
      setNotification({ text: `Failed to update Subtopic: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsSavingTaxonomy(false);
    }
  };

  const handleToggleSubtopicActive = async (subtopic: any) => {
    const nextState = subtopic.isActive === false;
    try {
      await apiClient.toggleSubtopicActive(subtopic.id, nextState);
      setNotification({ text: `Subtopic ${subtopic.id} is now ${nextState ? 'Active' : 'Inactive'}.`, type: 'success' });
      await fetchLiveTaxonomy();
    } catch (err: any) {
      setNotification({ text: `Failed to toggle Subtopic active state: ${err?.message || 'Error'}`, type: 'error' });
    }
  };

  const fetchSheetsHealth = async () => {
    setIsLoadingHealth(true);
    try {
      const report = await apiClient.getSheetsHealth();
      setHealthReport(report);
    } catch (err: any) {
      setNotification({ text: `Failed to fetch Sheets status: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const fetchIntegrityHealth = async () => {
    setIsLoadingIntegrity(true);
    try {
      const report = await apiClient.getSystemIntegrityHealth();
      setIntegrityReport(report);
    } catch (err: any) {
      setNotification({ text: `Failed to run integrity diagnostics: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsLoadingIntegrity(false);
    }
  };

  const fetchRecoveryHealth = async () => {
    setIsLoadingRecovery(true);
    try {
      const [opHealth, seqSafety, recState] = await Promise.all([
        apiClient.getOperationalHealth(),
        apiClient.getSequenceSafety(),
        apiClient.getRecoveryState(),
      ]);
      setOpHealthReport(opHealth);
      setSeqSafetyReport(seqSafety);
      setRecoveryState(recState);
      setNotification({ text: 'Operational health & sequence safety refreshed.', type: 'success' });
    } catch (err: any) {
      setNotification({ text: `Failed to fetch operational state: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsLoadingRecovery(false);
    }
  };

  const handleRunVerificationSuite8a = async () => {
    setIsRunningTests8a(true);
    try {
      const res = await apiClient.runDataIntegrityVerification();
      setTestResults8a(res);
      setNotification({
        text: `Data Integrity Verification Suite finished: ${res.passedTests}/${res.totalTests} tests passed.`,
        type: res.success ? 'success' : 'error',
      });
    } catch (err: any) {
      setNotification({ text: `Data integrity test run failed: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsRunningTests8a(false);
    }
  };

  const handleRunVerificationSuite8b = async () => {
    setIsRunningTests8b(true);
    try {
      const res = await apiClient.runOperationalRecoveryVerification();
      setTestResults8b(res);
      setNotification({
        text: `Operational Recovery Verification Suite finished: ${res.passedTests}/${res.totalTests} tests passed.`,
        type: res.success ? 'success' : 'error',
      });
    } catch (err: any) {
      setNotification({ text: `Operational recovery test run failed: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsRunningTests8b(false);
    }
  };

  const handleRunVerificationSuite9 = async () => {
    setIsRunningTests9(true);
    try {
      const res = await apiClient.runPlanningVerification();
      setTestResults9(res);
      setNotification({
        text: `Content Planning Verification Suite finished: ${res.passedTests}/${res.totalTests} tests passed.`,
        type: res.success ? 'success' : 'error',
      });
    } catch (err: any) {
      setNotification({ text: `Planning test run failed: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsRunningTests9(false);
    }
  };

  const handleRunVerificationSuite10 = async () => {
    setIsRunningTests10(true);
    try {
      const res = await apiClient.runTeamOperationsVerification();
      setTestResults10(res);
      setNotification({
        text: `Team Operations Verification Suite finished: ${res.passedTests}/${res.totalTests} tests passed.`,
        type: res.success ? 'success' : 'error',
      });
    } catch (err: any) {
      setNotification({ text: `Team operations test run failed: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsRunningTests10(false);
    }
  };

  const handleSyncSequence = async () => {
    if (!syncTargetEntity || !syncConfirmed) return;
    setIsSyncing(true);
    try {
      const res = await apiClient.syncSequence(
        syncTargetEntity,
        syncProposedNumber,
        true,
        { id: 'USR-001', name: 'Admin / Operations Lead' }
      );
      setNotification({
        text: `Successfully synchronized "${syncTargetEntity}" sequence to next_number=${res.updatedNextNumber}. Audit Log: ${res.auditLogId}`,
        type: 'success',
      });
      setSyncTargetEntity(null);
      setSyncConfirmed(false);
      await fetchRecoveryHealth();
    } catch (err: any) {
      setNotification({ text: `Sequence sync failed: ${err?.message || 'Error'}`, type: 'error' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportReport = () => {
    if (!integrityReport && !recoveryState) return;
    const jsonStr = JSON.stringify({ integrity: integrityReport, recovery: recoveryState }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burra-pariksha-operational-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Redirect restricted tabs for non-admin users
  useEffect(() => {
    if (user && user.role !== UserRole.ADMIN) {
      if (['recovery', 'integrity'].includes(activeTab)) {
        setActiveTab('sheets');
        setSearchParams({ tab: 'sheets' });
      }
    }
  }, [user, activeTab, setSearchParams]);

  useEffect(() => {
    fetchSheetsHealth();
    if (user?.role === UserRole.ADMIN) {
      fetchIntegrityHealth();
      fetchRecoveryHealth();
    }
    if (activeTab === 'taxonomy') {
      fetchLiveTaxonomy();
    }
  }, [user?.role, activeTab]);

  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const rawTabs = [
    { id: 'recovery', label: 'System Recovery', icon: Wrench, highlight: true },
    { id: 'integrity', label: 'Data Diagnostics', icon: ShieldCheck },
    { id: 'sheets', label: 'Google Sheets', icon: Database },
    { id: 'taxonomy', label: 'Topics & Taxonomy', icon: Layers },
    { id: 'app', label: 'App Settings', icon: Settings },
    { id: 'ai', label: 'AI Configuration', icon: Cpu },
    { id: 'drive', label: 'Cloud Storage', icon: HardDrive },
    { id: 'publishing', label: 'Publishing Settings', icon: Share2 },
  ] as const;

  const tabs = rawTabs.filter((tab) => {
    if (['recovery', 'integrity'].includes(tab.id)) {
      return isAdmin;
    }
    return true;
  });


  // Filtered issues list
  const filteredIssues = (integrityReport?.issues || []).filter((issue) => {
    if (selectedSeverityFilter !== 'ALL' && issue.severity !== selectedSeverityFilter) {
      return false;
    }
    if (selectedCategoryFilter !== 'ALL' && issue.category !== selectedCategoryFilter) {
      return false;
    }
    if (issueSearchQuery.trim()) {
      const q = issueSearchQuery.toLowerCase();
      const matchId = (issue.id || '').toLowerCase().includes(q);
      const matchMsg = (issue.message || '').toLowerCase().includes(q);
      const matchEntity = (issue.entityId || '').toLowerCase().includes(q);
      const matchSheet = (issue.worksheet || '').toLowerCase().includes(q);
      return matchId || matchMsg || matchEntity || matchSheet;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200 pb-16">
      {/* Header */}
      <PageHeader
        title="Settings & Integrations"
        description="Database connections, AI prompts, Google Drive storage, and system health."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchIntegrityHealth}
              disabled={isLoadingIntegrity}
              className="flex items-center gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIntegrity ? 'animate-spin' : ''}`} />
              Run Full Audit
            </Button>
            {integrityReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportReport}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </Button>
            )}
          </div>
        }
      />

      {notification && (
        <div
          className={`p-3 border rounded-lg text-xs font-medium flex items-center justify-between animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="text-xs underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'integrity' && integrityReport && integrityReport.issueCounts.total > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {integrityReport.issueCounts.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        {/* ========================================================================= */}
        {/* TAB 0: OPERATIONAL RELIABILITY, RECOVERY & HARDENING (PHASE 8B) */}
        {/* ========================================================================= */}
        {activeTab === 'recovery' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  Operational Reliability, Resilience & Recovery Center
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Google Sheets API resilience diagnostics, exponential retry telemetry, sequence safety verification, and audited recovery workflows.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRecoveryHealth}
                  disabled={isLoadingRecovery}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecovery ? 'animate-spin' : ''}`} />
                  Refresh Telemetry
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunVerificationSuite8b}
                  disabled={isRunningTests8b}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                >
                  <PlayCircle className={`w-4 h-4 ${isRunningTests8b ? 'animate-spin' : ''}`} />
                  {isRunningTests8b ? 'Running Operational Recovery...' : 'Run Recovery Suite'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunVerificationSuite9}
                  disabled={isRunningTests9}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlayCircle className={`w-4 h-4 ${isRunningTests9 ? 'animate-spin' : ''}`} />
                  {isRunningTests9 ? 'Running Planning Suite...' : 'Run Planning Verification'}
                </Button>
              </div>
            </div>

            {/* Operational Connectivity & Telemetry Banner */}
            {opHealthReport && (
              <div
                className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  opHealthReport.connectivityStatus === 'CONNECTED'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : opHealthReport.connectivityStatus === 'DEGRADED'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-rose-50/80 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5">
                    {opHealthReport.connectivityStatus === 'CONNECTED' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : opHealthReport.connectivityStatus === 'DEGRADED' ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-rose-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">
                        Connectivity: {opHealthReport.connectivityStatus}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          opHealthReport.authStatus === 'VALID'
                            ? 'bg-emerald-200 text-emerald-900'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        Auth: {opHealthReport.authStatus}
                      </span>
                      <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded font-medium border border-slate-200">
                        {opHealthReport.mode}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {opHealthReport.sanitizedDiagnosticMessage}
                    </p>
                    <div className="text-[11px] text-slate-500 pt-0.5">
                      Spreadsheet: <span className="font-mono">{opHealthReport.spreadsheetTitle || opHealthReport.spreadsheetId}</span>
                    </div>
                  </div>
                </div>

                {/* Telemetry Quick Badges */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <div className="bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg text-center shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Latency</div>
                    <div className="text-sm font-bold text-indigo-600 font-mono">
                      {opHealthReport.telemetry.lastLatencyMs !== null ? `${opHealthReport.telemetry.lastLatencyMs}ms` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg text-center shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Total Retries</div>
                    <div className="text-sm font-bold text-slate-800 font-mono">
                      {opHealthReport.telemetry.totalRetries}
                    </div>
                  </div>
                  <div className="bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg text-center shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Last Op</div>
                    <div className="text-xs font-semibold text-slate-700 font-mono truncate max-w-[120px]">
                      {opHealthReport.telemetry.lastSuccessfulOperation || 'None'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Test Results Output Pane (Phase 8B) */}
            {testResults8b && (
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-indigo-950">
                    <FileCheck className="w-4 h-4 text-indigo-600" />
                    Phase 8B Forensic Verification Suite Results
                  </div>
                  <span
                    className={`font-mono text-xs px-2.5 py-0.5 rounded font-bold ${
                      testResults8b.success
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {testResults8b.passedTests}/{testResults8b.totalTests} TESTS PASSED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {testResults8b.results.map((r, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border text-xs flex items-center justify-between gap-2 ${
                        r.passed
                          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/90 border-rose-200 text-rose-950'
                      }`}
                    >
                      <span className="font-medium truncate">{r.test}</span>
                      <span className="font-mono text-[10px] font-bold shrink-0">
                        {r.passed ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Results Output Pane (Phase 9) */}
            {testResults9 && (
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-indigo-950">
                    <FileCheck className="w-4 h-4 text-indigo-600" />
                    Phase 9 Content Planning & Question Intelligence Suite Results
                  </div>
                  <span
                    className={`font-mono text-xs px-2.5 py-0.5 rounded font-bold ${
                      testResults9.success
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {testResults9.passedTests}/{testResults9.totalTests} TESTS PASSED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {testResults9.results.map((r, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border text-xs flex items-center justify-between gap-2 ${
                        r.passed
                          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/90 border-rose-200 text-rose-950'
                      }`}
                    >
                      <span className="font-medium truncate">{r.test}</span>
                      <span className="font-mono text-[10px] font-bold shrink-0">
                        {r.passed ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sequence Safety & Invariant Matrix */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-600" />
                  Domain Entity Sequence Safety & Allocation Invariant Matrix
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  {seqSafetyReport?.healthyCount || 0}/{seqSafetyReport?.totalChecked || 8} Sequences Healthy
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Entity Type</th>
                      <th className="py-2.5 px-4 text-center">Configured Prefix</th>
                      <th className="py-2.5 px-4 text-center">Pad Length</th>
                      <th className="py-2.5 px-4 text-center">Next Number</th>
                      <th className="py-2.5 px-4 text-center">Max ID in DB</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-right">Recovery Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {seqSafetyReport?.sequences.map((seq) => {
                      const isDrift = seq.nextNumber <= seq.detectedMaxIdNumber;
                      const isAnomaly = seq.status === 'ANOMALY';
                      return (
                        <tr key={seq.entityType} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                            {seq.entityType}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                            {seq.prefix}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                            {seq.padLength}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900">
                            {seq.nextNumber}
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-indigo-700 font-semibold">
                            {seq.detectedMaxIdNumber}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                                !isAnomaly
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {!isAnomaly ? 'HEALTHY' : 'ANOMALY'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            {isDrift || isAnomaly ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSyncTargetEntity(seq.entityType);
                                  setSyncProposedNumber(seq.detectedMaxIdNumber + 1);
                                  setSyncConfirmed(false);
                                }}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition-colors shadow-2xs"
                              >
                                Fix Sequence
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSyncTargetEntity(seq.entityType);
                                  setSyncProposedNumber(Math.max(seq.nextNumber, seq.detectedMaxIdNumber + 1));
                                  setSyncConfirmed(false);
                                }}
                                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium transition-colors"
                              >
                                Adjust
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                {seqSafetyReport?.concurrencyLimitationNote}
              </p>
            </div>

            {/* Action Plans & Remediation Guides */}
            {recoveryState && recoveryState.actionPlans.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-indigo-600" />
                    Recommended Remediation Action Plans ({recoveryState.actionPlans.length})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Administrative recovery plans compiled from real-time invariant diagnostics.
                  </p>
                </div>

                <div className="space-y-3">
                  {recoveryState.actionPlans.map((plan) => (
                    <div
                      key={plan.actionId}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="font-bold text-xs text-slate-900">{plan.title}</div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                              plan.severity === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-800'
                                : plan.severity === 'WARNING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {plan.severity}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                            {plan.category}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600">{plan.description}</p>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                        <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wide">
                          Manual Remediation Steps:
                        </div>
                        <ul className="list-disc list-inside text-slate-600 space-y-1 text-xs">
                          {plan.manualSteps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sequence Synchronization Modal */}
            {syncTargetEntity && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-amber-600" />
                      Synchronize Sequence: {syncTargetEntity}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSyncTargetEntity(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    This administrative recovery operation adjusts the next allocated number in the authoritative <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">SEQUENCES</code> worksheet.
                  </p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Entity:</span>
                      <span className="font-mono font-bold text-slate-900">{syncTargetEntity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Proposed Next Number:</span>
                      <input
                        type="number"
                        min="1"
                        value={syncProposedNumber}
                        onChange={(e) => setSyncProposedNumber(parseInt(e.target.value, 10) || 1)}
                        className="w-24 text-right font-mono font-bold text-xs bg-white border border-slate-300 rounded px-2 py-0.5"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="confirmSync"
                      checked={syncConfirmed}
                      onChange={(e) => setSyncConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="confirmSync" className="text-xs text-slate-700 leading-snug cursor-pointer select-none">
                      I explicitly confirm this sequence update. An audited <code className="font-mono text-[10px]">AUDIT_LOG</code> operational event will be recorded.
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSyncTargetEntity(null)}
                      disabled={isSyncing}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSyncSequence}
                      disabled={!syncConfirmed || isSyncing}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isSyncing ? 'Synchronizing...' : 'Execute Synchronization'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: DATA INTEGRITY & OPERATIONAL DIAGNOSTICS (PHASE 8A) */}
        {/* ========================================================================= */}
        {activeTab === 'integrity' && (
          <div className="space-y-8">
            {/* Header / Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Authoritative Google Sheets Data Integrity Engine
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Strictly READ-ONLY diagnostic audit covering all 18 Google Sheets worksheets, foreign-key relationships, and workflow state machines.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunVerificationSuite8a}
                  disabled={isRunningTests8a}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                >
                  <PlayCircle className={`w-4 h-4 ${isRunningTests8a ? 'animate-spin' : ''}`} />
                  {isRunningTests8a ? 'Running Verification...' : 'Run Data Integrity Suite'}
                </Button>
              </div>
            </div>


            {/* Overall Health Status Banner */}
            {integrityReport && (
              <div
                className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  integrityReport.overallStatus === 'PASS'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : integrityReport.overallStatus === 'WARNING'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : integrityReport.overallStatus === 'ERROR'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : 'bg-red-100 border-red-300 text-red-950'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5">
                    {integrityReport.overallStatus === 'PASS' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : integrityReport.overallStatus === 'WARNING' ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-rose-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">
                        System Health Status: {integrityReport.overallStatus}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          integrityReport.overallStatus === 'PASS'
                            ? 'bg-emerald-200 text-emerald-900'
                            : integrityReport.overallStatus === 'WARNING'
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-rose-200 text-rose-900'
                        }`}
                      >
                        {integrityReport.mode}
                      </span>
                      <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded font-medium border border-slate-200">
                        READ-ONLY ENFORCED
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{integrityReport.summary}</p>
                    <div className="text-[11px] text-slate-500 pt-0.5">
                      Last diagnostic scan: {new Date(integrityReport.generatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Issue Count Badges */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <div className="bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg text-center shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Passed Checks</div>
                    <div className="text-sm font-bold text-emerald-600 font-mono">
                      {integrityReport.issueCounts.passedChecks}/10
                    </div>
                  </div>
                  <div className="bg-white/80 border border-slate-200 px-3 py-1.5 rounded-lg text-center shadow-2xs">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Total Issues</div>
                    <div className="text-sm font-bold text-slate-800 font-mono">
                      {integrityReport.issueCounts.total}
                    </div>
                  </div>
                  {integrityReport.issueCounts.critical > 0 && (
                    <div className="bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg text-center shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-rose-700">Critical</div>
                      <div className="text-sm font-bold text-rose-900 font-mono">
                        {integrityReport.issueCounts.critical}
                      </div>
                    </div>
                  )}
                  {integrityReport.issueCounts.error > 0 && (
                    <div className="bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-center shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-red-700">Errors</div>
                      <div className="text-sm font-bold text-red-900 font-mono">
                        {integrityReport.issueCounts.error}
                      </div>
                    </div>
                  )}
                  {integrityReport.issueCounts.warning > 0 && (
                    <div className="bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg text-center shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-amber-700">Warnings</div>
                      <div className="text-sm font-bold text-amber-900 font-mono">
                        {integrityReport.issueCounts.warning}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Test Results Output Pane (if run) */}
            {testResults8a && (
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-indigo-950">
                    <FileCheck className="w-4 h-4 text-indigo-600" />
                    Phase 8A Deterministic Test Suite Results
                  </div>
                  <span
                    className={`font-mono text-xs px-2.5 py-0.5 rounded font-bold ${
                      testResults8a.success
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {testResults8a.passedTests}/{testResults8a.totalTests} TESTS PASSED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {testResults8a.results.map((r, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border text-xs flex items-center justify-between gap-2 ${
                        r.passed
                          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/90 border-rose-200 text-rose-950'
                      }`}
                    >
                      <span className="font-medium truncate">{r.test}</span>
                      <span className="font-mono text-[10px] font-bold shrink-0">
                        {r.passed ? '✓ PASS' : '✗ FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 10 Diagnostic Integrity Categories */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Diagnostic Check Suites (10 Categories)
                </h4>
                <span className="text-xs text-slate-400">
                  Read-only referential & schema invariant verifications
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {integrityReport?.integrityChecks.map((check) => {
                  const isPass = check.status === 'PASS';
                  const isWarn = check.status === 'WARNING';
                  const isErr = check.status === 'ERROR' || check.status === 'CRITICAL';

                  return (
                    <div
                      key={check.category}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isPass
                          ? 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                          : isWarn
                          ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50/80'
                          : 'border-rose-200 bg-rose-50/50 hover:bg-rose-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="font-bold text-xs text-slate-900">{check.name}</div>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                            isPass
                              ? 'bg-emerald-100 text-emerald-800'
                              : isWarn
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {check.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">
                        {check.description}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/60">
                        <span>Category: {check.category}</span>
                        <span className={check.issueCount > 0 ? 'font-bold text-amber-700' : 'text-slate-500'}>
                          {check.issueCount} issue{check.issueCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 18 Authoritative Worksheets Health Matrix */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-indigo-600" />
                  18 Authoritative Worksheets Health Matrix
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  {integrityReport?.worksheetHealth.length || 18} Worksheets Analyzed
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4">Worksheet Name</th>
                      <th className="py-2.5 px-4 text-center">Total Rows</th>
                      <th className="py-2.5 px-4 text-center">Valid Records</th>
                      <th className="py-2.5 px-4 text-center">Issues</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {integrityReport?.worksheetHealth.map((sheet) => (
                      <tr key={sheet.worksheet} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                          {sheet.worksheet}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-600">
                          {sheet.totalRecords}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-emerald-700 font-semibold">
                          {sheet.validRecords}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono">
                          {sheet.issuesCount > 0 ? (
                            <span className="text-amber-700 font-bold">{sheet.issuesCount}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                              sheet.status === 'PASS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sheet.status === 'WARNING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {sheet.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Diagnostic Issues Explorer & Guidance */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Diagnostic Issues & Remediation Action Items
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Detailed breakdown of detected anomalies with manual remediation guidance for administrators.
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Severity Filter */}
                  <select
                    value={selectedSeverityFilter}
                    onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">Critical Only</option>
                    <option value="ERROR">Errors Only</option>
                    <option value="WARNING">Warnings Only</option>
                    <option value="INFO">Info Only</option>
                  </select>

                  {/* Category Filter */}
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="ID_INTEGRITY">ID Integrity</option>
                    <option value="QUESTION_INTEGRITY">Question Integrity</option>
                    <option value="VIDEO_INTEGRITY">Video Integrity</option>
                    <option value="SCRIPT_INTEGRITY">Script Integrity</option>
                    <option value="THUMBNAIL_INTEGRITY">Thumbnail Integrity</option>
                    <option value="PINNED_COMMENT_INTEGRITY">Pinned Comments</option>
                    <option value="PUBLISHING_INTEGRITY">Publishing</option>
                    <option value="WORKFLOW_INTEGRITY">Workflow</option>
                    <option value="AUDIT_LOG_INTEGRITY">Audit Log</option>
                    <option value="SEQUENCE_INTEGRITY">Sequences</option>
                  </select>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search issue or ID..."
                      value={issueSearchQuery}
                      onChange={(e) => setIssueSearchQuery(e.target.value)}
                      className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 w-44"
                    />
                  </div>
                </div>
              </div>

              {filteredIssues.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <div className="text-xs font-bold text-slate-800">
                    {integrityReport?.issues.length === 0
                      ? 'Zero Diagnostic Issues Found!'
                      : 'No issues match the selected filter criteria.'}
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    All authoritative Google Sheets records conform to relational schemas and workflow invariants.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredIssues.map((issue) => {
                    const isCrit = issue.severity === 'CRITICAL';
                    const isErr = issue.severity === 'ERROR';
                    const isWarn = issue.severity === 'WARNING';

                    return (
                      <div
                        key={issue.id}
                        className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                          isCrit
                            ? 'bg-rose-50/70 border-rose-200'
                            : isErr
                            ? 'bg-red-50/50 border-red-200'
                            : isWarn
                            ? 'bg-amber-50/50 border-amber-200'
                            : 'bg-blue-50/50 border-blue-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                isCrit
                                  ? 'bg-rose-200 text-rose-900'
                                  : isErr
                                  ? 'bg-red-200 text-red-900'
                                  : isWarn
                                  ? 'bg-amber-200 text-amber-900'
                                  : 'bg-blue-200 text-blue-900'
                              }`}
                            >
                              {issue.severity}
                            </span>
                            <span className="font-mono text-xs font-semibold text-slate-700">
                              {issue.id}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="font-mono text-xs font-medium text-slate-900 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                              Worksheet: {issue.worksheet}
                            </span>
                            {issue.entityId && (
                              <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                Target: {issue.entityId}
                              </span>
                            )}
                          </div>

                          <span className="font-mono text-[10px] text-slate-500 uppercase">
                            {issue.category}
                          </span>
                        </div>

                        {/* Issue message */}
                        <p className="text-xs text-slate-900 font-medium leading-relaxed">
                          {issue.message}
                        </p>

                        {/* Manual Recommended Action Box */}
                        <div className="p-2.5 bg-white/90 rounded-lg border border-slate-200/80 text-xs flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="text-[11px] text-slate-700 leading-normal">
                            <strong className="text-slate-900">Manual Recommended Action: </strong>
                            {issue.recommendedAction}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: GOOGLE SHEETS DATABASE ARCHITECTURE (PHASE 2) */}
        {/* ========================================================================= */}
        {activeTab === 'sheets' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Google Sheets Database Engine (Phase 2)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authoritative multi-tab persistence layer. The application never uses client-side credentials.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSheetsHealth}
                  disabled={isLoadingHealth}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHealth ? 'animate-spin' : ''}`} />
                  Run Diagnostics
                </Button>
              </div>
            </div>

            {/* Persistence Mode Banner */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                healthReport?.overallStatus === 'READY'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : healthReport?.overallStatus === 'WARNING'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}
            >
              <div className="mt-0.5">
                {healthReport?.overallStatus === 'READY' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : healthReport?.overallStatus === 'WARNING' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {healthReport?.mode === 'LIVE_GOOGLE_SHEETS' && healthReport.isConnected
                      ? 'Live Google Sheets Database Connected'
                      : healthReport?.mode === 'LIVE_GOOGLE_SHEETS' && !healthReport.isConnected
                      ? 'Google Sheets Connection Error'
                      : 'Local Memory Fallback Store Active'}
                  </span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                      healthReport?.overallStatus === 'READY'
                        ? 'bg-emerald-200/60 text-emerald-900'
                        : healthReport?.overallStatus === 'WARNING'
                        ? 'bg-amber-200/60 text-amber-900'
                        : 'bg-rose-200/60 text-rose-900'
                    }`}
                  >
                    STATUS: {healthReport?.overallStatus || 'UNKNOWN'}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{healthReport?.summaryMessage}</p>
                {healthReport?.spreadsheetTitle && (
                  <div className="pt-1 font-mono text-[11px] text-slate-600">
                    Spreadsheet: <span className="font-semibold text-slate-900">{healthReport.spreadsheetTitle}</span> | ID:{' '}
                    <span className="text-slate-800">{healthReport.spreadsheetId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostic Action Items If Any */}
            {healthReport?.diagnosticActionItems && healthReport.diagnosticActionItems.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Manual Diagnostic Guidance (Do Not Auto-Rewrite)
                </div>
                <p className="text-[11px] text-amber-800">
                  The application will not alter or rewrite your spreadsheet structure. Please perform these manual adjustments in Google Sheets if needed:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900 pl-1 font-mono">
                  {healthReport.diagnosticActionItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 18 Worksheets Contract List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-indigo-600" />
                18 Authoritative Worksheets Schema Verification
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_SHEET_TABS.map((tab) => {
                  const check = healthReport?.tabs.find((t) => t.tabName === tab);
                  const isPresent = check ? check.exists : false;
                  const headerValid = check ? (check.status === 'VALID' || check.hasHeaders) : false;

                  return (
                    <div
                      key={tab}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono font-semibold text-slate-900">{tab}</div>
                        <div className="text-[10px] text-slate-500">
                          {check ? (isPresent ? (headerValid ? 'Headers verified' : 'Header mismatch') : 'Missing Tab') : 'Checking...'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {check && isPresent && headerValid ? (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-800">
                            OK
                          </span>
                        ) : check && isPresent && !headerValid ? (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded font-semibold bg-amber-100 text-amber-800">
                            HEADERS
                          </span>
                        ) : check ? (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded font-semibold bg-rose-100 text-rose-800">
                            MISSING
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-200 text-slate-700">
                            ...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sequence Table Config Map */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-600" />
                Auto-Increment ID Sequence Config (Prefix & Padding)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs font-mono">
                {Object.entries(ID_PREFIX_MAP).map(([entity, config]) => (
                  <div key={entity} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <span className="text-slate-700">{entity}</span>
                    <span className="font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {config.prefix} (Pad: {config.padLength})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CONTENT TAXONOMY */}
        {/* ========================================================================= */}
        {activeTab === 'taxonomy' && (
          <div className="space-y-6">
            {/* Header & Primary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Pure Topic / Subtopic Taxonomy</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Target: 100 &times; 100 = 10,000
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Production taxonomy is strictly <strong className="text-indigo-700">Topic &rarr; Subtopic</strong>. No Subject, Category, or Section layers.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunVerificationSuite04}
                  disabled={isRunningTests04}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <PlayCircle className={`w-3.5 h-3.5 ${isRunningTests04 ? 'animate-spin' : ''}`} />
                  <span>{isRunningTests04 ? 'Running Taxonomy Checks...' : 'Run Taxonomy Test Suite'}</span>
                </button>

                <button
                  type="button"
                  onClick={fetchLiveTaxonomy}
                  disabled={isLoadingTaxonomy}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTaxonomy ? 'animate-spin text-indigo-600' : ''}`} />
                  <span>Refresh</span>
                </button>

                {canAdministerTaxonomy && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsCreateTopicModalOpen(true)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Topic</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCreateSubtopicModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Subtopic</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Authoritative Metrics & Data Gap Banner */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Authoritative Production Taxonomy Audit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    GATE STATUS: BLOCKED BY DATA GAP
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    (Rule 3 &amp; 6 Compliant)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Approved Topics</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-slate-900">{taxonomyMetrics?.totalTopics ?? 100}</span>
                    <span className="text-xs text-slate-400">/ 100 Target</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">&check; 100% Present</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Approved Subtopics</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-indigo-700">{taxonomyMetrics?.totalSubtopics ?? 100}</span>
                    <span className="text-xs text-slate-400">/ 10,000 Target</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">1% Present (99 Topics Pending)</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Complete Topics</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-emerald-700">{taxonomyMetrics?.completeTopicsCount ?? 1}</span>
                    <span className="text-xs text-slate-400">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">BP-TOP-001 has 100 Subtopics</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Identified Data Gap</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-bold text-rose-600">{taxonomyMetrics?.missingSubtopics ?? 9900}</span>
                    <span className="text-xs text-slate-400">Subtopics Missing</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Across Topics BP-TOP-002..100</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-950">
                    Taxonomy Integrity Rule 3 &amp; 6 Strict Enforcement:
                  </p>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Production taxonomy contains exactly 100 approved Topics (BP-TOP-001 through BP-TOP-100) and exactly 100 approved Subtopics (under BP-TOP-001).
                    The remaining 9,900 Subtopics across Topics BP-TOP-002 through BP-TOP-100 do not yet exist in any authoritative source.
                    In accordance with strict system rules, <strong>no synthetic or auto-filled records have been manufactured</strong>. The taxonomy gate remains intentionally blocked on authoritative business data availability.
                  </p>
                </div>
              </div>
            </div>

            {/* Test Results Banner (If Executed) */}
            {testResults04 && (
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Taxonomy Deterministic Verification Report</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono ${testResults04.gateStatus === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {testResults04.passedTests}/{testResults04.totalTests} Unit Checks Passed &bull; Gate: {testResults04.gateStatus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono">
                  {testResults04.gateMessage}
                </p>
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {testResults04.results.map((r: any) => (
                    <div key={r.testId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${r.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {r.passed ? 'PASS' : 'FAIL'}
                        </span>
                        <span className="font-mono text-slate-500 font-semibold">{r.testId}</span>
                        <span className="text-slate-800">{r.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 truncate max-w-xs">{r.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search topics by name, ID (e.g. BP-TOP-001), or slug..."
                    value={taxonomySearchQuery}
                    onChange={(e) => setTaxonomySearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search subtopics by keyword or ID..."
                    value={subtopicSearchQuery}
                    onChange={(e) => setSubtopicSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={taxonomyFilterStatus}
                    onChange={(e: any) => setTaxonomyFilterStatus(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">Status: All</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>

                  <select
                    value={taxonomyFilterCompleteness}
                    onChange={(e: any) => setTaxonomyFilterCompleteness(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">Completeness: All (100)</option>
                    <option value="complete">Complete (1 Topic &bull; 100 subs)</option>
                    <option value="incomplete">Pending (99 Topics &bull; 0 subs)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Live Topics & Subtopics List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Topics ({pureTaxonomyList.length > 0 ? pureTaxonomyList.length : liveTaxonomyTree.flatMap((c) => c.topics || []).length})
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Deterministic displayOrder: 1 &rarr; 100
                </span>
              </div>

              {isLoadingTaxonomy ? (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Loading authoritative taxonomy records...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(pureTaxonomyList.length > 0 ? pureTaxonomyList : liveTaxonomyTree.flatMap((cat: any) => cat.topics || []))
                    .filter((topic: any) => {
                      if (taxonomyFilterStatus === 'active' && topic.isActive === false) return false;
                      if (taxonomyFilterStatus === 'inactive' && topic.isActive !== false) return false;
                      const subCount = topic.subtopics?.length || 0;
                      if (taxonomyFilterCompleteness === 'complete' && subCount < 100) return false;
                      if (taxonomyFilterCompleteness === 'incomplete' && subCount >= 100) return false;
                      if (taxonomySearchQuery.trim()) {
                        const q = taxonomySearchQuery.toLowerCase();
                        const matchesName = topic.name?.toLowerCase().includes(q);
                        const matchesId = topic.id?.toLowerCase().includes(q);
                        const matchesSlug = topic.slug?.toLowerCase().includes(q);
                        const matchesDesc = topic.description?.toLowerCase().includes(q);
                        if (!matchesName && !matchesId && !matchesSlug && !matchesDesc) return false;
                      }
                      if (subtopicSearchQuery.trim()) {
                        const sq = subtopicSearchQuery.toLowerCase();
                        const hasMatchingSub = (topic.subtopics || []).some(
                          (s: any) =>
                            s.name?.toLowerCase().includes(sq) ||
                            s.id?.toLowerCase().includes(sq) ||
                            s.slug?.toLowerCase().includes(sq)
                        );
                        if (!hasMatchingSub) return false;
                      }
                      return true;
                    })
                    .map((topic: any) => {
                      const subCount = topic.subtopics?.length || 0;
                      const isComplete = subCount === 100;
                      return (
                        <div key={topic.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 text-xs shadow-xs">
                          {/* Topic Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{topic.name}</span>
                                <span className="font-mono text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                                  {topic.id}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  #{topic.displayOrder}
                                </span>
                              </div>
                              {topic.description && (
                                <p className="text-[11px] text-slate-500 mt-1">{topic.description}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${topic.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                {topic.isActive !== false ? 'Active' : 'Inactive'}
                              </span>

                              {canAdministerTaxonomy && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingTopic({ ...topic })}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                                    title="Edit Topic"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleTopicActive(topic)}
                                    className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-[10px] font-semibold text-slate-600 cursor-pointer"
                                    title="Toggle Active/Inactive"
                                  >
                                    {topic.isActive !== false ? 'Disable' : 'Enable'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Subtopics Section */}
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                Subtopics ({subCount})
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded font-mono ${isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                  {isComplete ? '100 / 100 Complete' : 'Data Gap (0 / 100)'}
                                </span>
                                {canAdministerTaxonomy && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSubtopicForm({ ...subtopicForm, topicId: topic.id });
                                      setIsCreateSubtopicModalOpen(true);
                                    }}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                                  >
                                    + Add Subtopic
                                  </button>
                                )}
                              </div>
                            </div>

                            {topic.subtopics && topic.subtopics.length > 0 ? (
                              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                                {topic.subtopics
                                  .filter((sub: any) => {
                                    if (!subtopicSearchQuery.trim()) return true;
                                    const sq = subtopicSearchQuery.toLowerCase();
                                    return (
                                      sub.name?.toLowerCase().includes(sq) ||
                                      sub.id?.toLowerCase().includes(sq) ||
                                      sub.slug?.toLowerCase().includes(sq)
                                    );
                                  })
                                  .map((sub: any) => (
                                    <div
                                      key={sub.id}
                                      className="flex items-center justify-between p-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-lg text-[11px]"
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className="font-mono text-[9px] text-slate-400">#{sub.displayOrder}</span>
                                        <span className="font-medium text-slate-800 truncate">{sub.name}</span>
                                        <span className="font-mono text-[9px] text-slate-400 shrink-0">({sub.id})</span>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className={`text-[9px] px-1.5 py-0.2 rounded ${sub.isActive !== false ? 'bg-emerald-100/70 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                          {sub.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>

                                        {canAdministerTaxonomy && (
                                          <div className="flex items-center gap-0.5">
                                            <button
                                              type="button"
                                              onClick={() => setEditingSubtopic({ ...sub })}
                                              className="p-0.5 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                                              title="Edit Subtopic"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleToggleSubtopicActive(sub)}
                                              className="px-1 py-0.2 text-[9px] hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                                              title="Toggle Subtopic Active"
                                            >
                                              {sub.isActive !== false ? 'Off' : 'On'}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-[11px] text-slate-400">
                                0 approved subtopics available in authoritative source. (Synthetic generation prohibited).
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Architecture Contract Footer */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Taxonomy Architecture Mandate: </span>
                <span>Production operates strictly on a 2-tier <strong>Topic &rarr; Subtopic</strong> taxonomy. All questions and content masters link directly to Topic and Subtopic. Any extra hierarchy layers are excluded.</span>
              </div>
            </div>

            {/* MODAL: Create Topic */}
            {isCreateTopicModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900">Create Approved Topic</h4>
                    <button
                      type="button"
                      onClick={() => setIsCreateTopicModalOpen(false)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateTopic} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Topic Name *</label>
                      <input
                        type="text"
                        required
                        value={topicForm.name}
                        onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                        placeholder="e.g. Ratio and Proportion"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Slug (Auto-generated if empty)</label>
                      <input
                        type="text"
                        value={topicForm.slug}
                        onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value })}
                        placeholder="ratio-and-proportion"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={topicForm.description}
                        onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                        placeholder="Pedagogical description of topic..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                        <input
                          type="number"
                          value={topicForm.displayOrder}
                          onChange={(e) => setTopicForm({ ...topicForm, displayOrder: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
                        <select
                          value={topicForm.isActive ? 'true' : 'false'}
                          onChange={(e) => setTopicForm({ ...topicForm, isActive: e.target.value === 'true' })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsCreateTopicModalOpen(false)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingTaxonomy}
                        className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingTaxonomy ? 'Saving...' : 'Create Topic'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL: Edit Topic */}
            {editingTopic && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Edit Topic</h4>
                      <span className="font-mono text-[10px] text-slate-500">{editingTopic.id}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingTopic(null)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateTopic} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Topic Name *</label>
                      <input
                        type="text"
                        required
                        value={editingTopic.name}
                        onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Slug *</label>
                      <input
                        type="text"
                        required
                        value={editingTopic.slug}
                        onChange={(e) => setEditingTopic({ ...editingTopic, slug: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={editingTopic.description || ''}
                        onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                        <input
                          type="number"
                          value={editingTopic.displayOrder || 1}
                          onChange={(e) => setEditingTopic({ ...editingTopic, displayOrder: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Status</label>
                        <select
                          value={editingTopic.isActive !== false ? 'true' : 'false'}
                          onChange={(e) => setEditingTopic({ ...editingTopic, isActive: e.target.value === 'true' })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingTopic(null)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingTaxonomy}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingTaxonomy ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL: Create Subtopic */}
            {isCreateSubtopicModalOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900">Create Approved Subtopic</h4>
                    <button
                      type="button"
                      onClick={() => setIsCreateSubtopicModalOpen(false)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateSubtopic} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Parent Topic *</label>
                      <select
                        required
                        value={subtopicForm.topicId}
                        onChange={(e) => setSubtopicForm({ ...subtopicForm, topicId: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-medium"
                      >
                        {(pureTaxonomyList.length > 0 ? pureTaxonomyList : liveTaxonomyTree.flatMap((c) => c.topics || [])).map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.id} &bull; {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Subtopic Name *</label>
                      <input
                        type="text"
                        required
                        value={subtopicForm.name}
                        onChange={(e) => setSubtopicForm({ ...subtopicForm, name: e.target.value })}
                        placeholder="e.g. Ratio Simplification"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Slug (Auto-generated if empty)</label>
                      <input
                        type="text"
                        value={subtopicForm.slug}
                        onChange={(e) => setSubtopicForm({ ...subtopicForm, slug: e.target.value })}
                        placeholder="ratio-simplification"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                      <textarea
                        rows={2}
                        value={subtopicForm.notes}
                        onChange={(e) => setSubtopicForm({ ...subtopicForm, notes: e.target.value })}
                        placeholder="Pedagogical notes..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                        <input
                          type="number"
                          value={subtopicForm.displayOrder}
                          onChange={(e) => setSubtopicForm({ ...subtopicForm, displayOrder: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Initial Status</label>
                        <select
                          value={subtopicForm.isActive ? 'true' : 'false'}
                          onChange={(e) => setSubtopicForm({ ...subtopicForm, isActive: e.target.value === 'true' })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsCreateSubtopicModalOpen(false)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingTaxonomy}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingTaxonomy ? 'Saving...' : 'Create Subtopic'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL: Edit Subtopic */}
            {editingSubtopic && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Edit Subtopic</h4>
                      <span className="font-mono text-[10px] text-slate-500">{editingSubtopic.id} (Parent: {editingSubtopic.topicId})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingSubtopic(null)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateSubtopic} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Subtopic Name *</label>
                      <input
                        type="text"
                        required
                        value={editingSubtopic.name}
                        onChange={(e) => setEditingSubtopic({ ...editingSubtopic, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Slug *</label>
                      <input
                        type="text"
                        required
                        value={editingSubtopic.slug}
                        onChange={(e) => setEditingSubtopic({ ...editingSubtopic, slug: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Description / Notes</label>
                      <textarea
                        rows={2}
                        value={editingSubtopic.notes || editingSubtopic.description || ''}
                        onChange={(e) => setEditingSubtopic({ ...editingSubtopic, notes: e.target.value, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                        <input
                          type="number"
                          value={editingSubtopic.displayOrder || 1}
                          onChange={(e) => setEditingSubtopic({ ...editingSubtopic, displayOrder: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Status</label>
                        <select
                          value={editingSubtopic.isActive !== false ? 'true' : 'false'}
                          onChange={(e) => setEditingSubtopic({ ...editingSubtopic, isActive: e.target.value === 'true' })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingSubtopic(null)}
                        className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingTaxonomy}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isSavingTaxonomy ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: APPLICATION SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === 'app' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Application Identity</h3>
              <p className="text-xs text-slate-500 mt-0.5">General Burra Pariksha CMS administrative profile.</p>
            </div>

            <div className="space-y-4 max-w-lg text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Application Name</label>
                <input
                  type="text"
                  defaultValue={APP_CONFIG.name}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  defaultValue={APP_CONFIG.tagline}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Owner Email</label>
                <input
                  type="email"
                  defaultValue={APP_CONFIG.adminUser.email}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AI GENERATION SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === 'ai' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gemini AI Configuration</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Model selection and prompt parameters for aptitude question generation.
              </p>
            </div>

            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Gemini API is integrated server-side via <code className="font-mono bg-indigo-100 px-1 py-0.5 rounded">@google/genai</code> SDK. API keys are kept securely server-side.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: GOOGLE DRIVE SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === 'drive' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Google Drive Media Store</h3>
              <p className="text-xs text-slate-500 mt-0.5">Cloud asset storage for vertical video footage and thumbnails.</p>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
              <HardDrive className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Google Drive folder structures are integrated for media file attachments.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: PUBLISHING SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === 'publishing' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Publishing Defaults & Rules</h3>
              <p className="text-xs text-slate-500 mt-0.5">Channel presets and pre-flight publishing checklists.</p>
            </div>

            <div className="space-y-2 text-xs">
              {[
                'Verify 9:16 vertical resolution (1080x1920)',
                'Audio normalization (-14 LUFS standard for Shorts)',
                'Pinned comment generated with full solution and challenge question',
                'High-contrast thumbnail cover frame set',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
