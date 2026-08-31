import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ListOrdered,
  Database,
  RefreshCw,
  Activity,
  FileQuestion,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { QuestionTable } from '../components/questions/QuestionTable';
import { apiClient } from '../lib/api-client';
import {
  AuditLog,
  Category,
  DashboardMetrics,
  DashboardOverviewData,
  Question,
  SpreadsheetHealthReport,
  SystemHealthReport,
  Topic,
} from '../types';
import { ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

import { DailyWorkflowGuide } from '../components/dashboard/DailyWorkflowGuide';
import { PipelineVisualizer } from '../components/dashboard/PipelineVisualizer';
import { TodaysWorkSection } from '../components/dashboard/TodaysWorkSection';
import { BottleneckSection } from '../components/dashboard/BottleneckSection';
import { StaleContentSection } from '../components/dashboard/StaleContentSection';
import { PublishingReadinessSection } from '../components/dashboard/PublishingReadinessSection';
import { DashboardFilterBar } from '../components/dashboard/DashboardFilterBar';
import { GlobalSearchBar } from '../components/dashboard/GlobalSearchBar';

export const DashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [healthReport, setHealthReport] = useState<SpreadsheetHealthReport | null>(null);
  const [integrityReport, setIntegrityReport] = useState<SystemHealthReport | null>(null);
  const [opHealthReport, setOpHealthReport] = useState<{ connectivityStatus: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const filter = {
        categoryId: selectedCategory || undefined,
        topicId: selectedTopic || undefined,
        difficulty: selectedDifficulty || undefined,
        priority: selectedPriority || undefined,
      };

      const [overviewData, cats, tops, health, integrity, opHealth] = await Promise.all([
        apiClient.getDashboardOverview(filter).catch((err) => {
          console.warn('Notice loading dashboard overview:', err?.message || err);
          return null;
        }),
        apiClient.getCategories().catch(() => []),
        apiClient.getTopics().catch(() => []),
        apiClient.getSheetsHealth().catch(() => null),
        apiClient.getSystemIntegrityHealth().catch(() => null),
        apiClient.getOperationalHealth().catch(() => null),
      ]);

      if (overviewData) {
        setOverview(overviewData);
      }
      setCategories(cats);
      setTopics(tops);
      setHealthReport(health);
      setIntegrityReport(integrity);
      setOpHealthReport(opHealth);
    } catch (err: any) {
      console.warn('Dashboard data refresh notice:', err?.message || err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, selectedTopic, selectedDifficulty, selectedPriority]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedTopic('');
    setSelectedDifficulty('');
    setSelectedPriority('');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Page Header */}
      <PageHeader
        title="Content Operations Dashboard"
        description="Operations intelligence, workflow control, and multi-stage lifecycle monitoring — backed by Google Sheets database."
        actions={
          <div className="flex items-center gap-2">
            <Link to="/generate">
              <Button variant="primary" size="sm" icon={Sparkles}>
                AI Question Studio
              </Button>
            </Link>
            <Link to="/queue">
              <Button variant="outline" size="sm" icon={ListOrdered}>
                Video Queue
              </Button>
            </Link>
          </div>
        }
      />

      {/* Global Search & Google Sheets Persistence Banner */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Global Search Bar */}
        <GlobalSearchBar />

        {/* Persistence & Integrity Status Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Persistence Status Chip */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl border border-slate-800 text-xs shrink-0 shadow-xs">
            <Database className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="font-bold">Sheets DB: </span>
              <span
                className={`font-mono font-semibold ${
                  healthReport?.isConfigured && healthReport?.isConnected
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {healthReport?.isConfigured ? 'CONNECTED' : 'LOCAL FALLBACK'}
              </span>
            </div>
          </div>

          {/* Operational Resilience / Recovery Chip */}
          <Link
            to="/settings?tab=recovery"
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-900 rounded-xl border border-slate-200 text-xs shrink-0 shadow-xs transition-colors group"
            title="Click to open Operational Reliability & Recovery Center"
          >
            <Activity
              className={`w-4 h-4 ${
                opHealthReport?.connectivityStatus === 'CONNECTED'
                  ? 'text-emerald-600'
                  : opHealthReport?.connectivityStatus === 'DEGRADED'
                  ? 'text-amber-600'
                  : 'text-indigo-600'
              }`}
            />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Resilience:</span>
              <span
                className={`font-mono font-bold text-[11px] px-1.5 py-0.2 rounded ${
                  opHealthReport?.connectivityStatus === 'CONNECTED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : opHealthReport?.connectivityStatus === 'DEGRADED'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                {opHealthReport?.connectivityStatus || 'ACTIVE'}
              </span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </Link>

          {/* System Integrity Health Chip */}
          <Link
            to="/settings?tab=integrity"
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-900 rounded-xl border border-slate-200 text-xs shrink-0 shadow-xs transition-colors group"
            title="Click to open Data Integrity & Diagnostics center"
          >
            <ShieldCheck
              className={`w-4 h-4 ${
                integrityReport?.overallStatus === 'PASS'
                  ? 'text-emerald-600'
                  : integrityReport?.overallStatus === 'WARNING'
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Integrity:</span>
              <span
                className={`font-mono font-bold text-[11px] px-1.5 py-0.2 rounded ${
                  integrityReport?.overallStatus === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : integrityReport?.overallStatus === 'WARNING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {integrityReport?.overallStatus || 'CHECKING...'}
              </span>
              {integrityReport && integrityReport.issueCounts.total > 0 && (
                <span className="text-[10px] text-slate-500 font-mono">
                  ({integrityReport.issueCounts.total} issues)
                </span>
              )}
            </div>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>

      {/* Dashboard Filter Bar */}
      <DashboardFilterBar
        categories={categories}
        topics={topics}
        selectedCategory={selectedCategory}
        selectedTopic={selectedTopic}
        selectedDifficulty={selectedDifficulty}
        selectedPriority={selectedPriority}
        onCategoryChange={setSelectedCategory}
        onTopicChange={setSelectedTopic}
        onDifficultyChange={setSelectedDifficulty}
        onPriorityChange={setSelectedPriority}
        onReset={handleResetFilters}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      {/* 10-Step Daily Protocol Accordion Guide */}
      <DailyWorkflowGuide />

      {/* Loading State or Render Dashboard Sections */}
      {isLoading || !overview ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Aggregating Content Operations Intelligence...
          </p>
          <p className="text-xs text-slate-400">
            Querying authoritative Google Sheets repositories for pipeline states
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Production Lifecycle & Question Funnel Visualizer */}
          <PipelineVisualizer metrics={overview.metrics} />

          {/* 2. Today's Priority Work Section */}
          <TodaysWorkSection items={overview.todaysWork} />

          {/* 3. Operational Split: Bottleneck Diagnostics & Stale Content Tracking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BottleneckSection bottlenecks={overview.bottlenecks} />
            <StaleContentSection items={overview.staleContent} />
          </div>

          {/* 4. Phase 10: Team Operations & Workload Intelligence */}
          {overview.teamOperations && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Team Operations & Workload Distribution
                    </h3>
                    <p className="text-xs text-slate-500">
                      {overview.teamOperations.workloadSummary?.totalMembers || 0} active specialists •{' '}
                      {overview.teamOperations.workloadSummary?.totalActiveTasks || 0} tasks in progress •{' '}
                      {overview.teamOperations.unassignedCount} unassigned queue items
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/my-work"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Personal Workbench</span>
                  </Link>

                  <Link
                    to="/team"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <span>Manage Team</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                {overview.teamOperations.workloadSummary?.workloads.slice(0, 4).map((w) => (
                  <div
                    key={w.user.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-2 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate">{w.user.name}</span>
                      <span className="text-2xs px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-semibold">
                        {w.user.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Active Tasks: <strong>{w.activeAssignments.length}</strong></span>
                      <span className="font-semibold text-slate-700">Score: {w.workloadScore}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          w.workloadScore >= 12
                            ? 'bg-rose-500'
                            : w.workloadScore >= 7
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, w.workloadScore * 7))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Publishing Readiness Matrix */}
          <PublishingReadinessSection items={overview.publishingReadiness} />

          {/* 6. Recent Questions and Audit Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Questions Table (2 cols) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Questions in Repository</h3>
                </div>
                <Link
                  to="/questions"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                >
                  <span>View Question Library</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <QuestionTable questions={overview.recentQuestions} />
            </div>

            {/* Audit Log Stream (1 col) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Audit Stream</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">AUDIT_LOG</span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {overview.recentAuditLogs.length > 0 ? (
                  overview.recentAuditLogs.map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5 text-xs">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="text-slate-800 font-medium truncate">
                          <span className="font-semibold text-slate-900">{act.actorName}</span>{' '}
                          {act.action.toLowerCase()}
                        </p>
                        <p className="text-slate-600 font-mono text-[11px] truncate">
                          {act.entityType} ({act.entityId})
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(act.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 py-4 text-center">
                    No recent audit log entries.
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-center">
                <Link
                  to="/settings"
                  className="text-xs text-slate-500 hover:text-slate-900 font-medium"
                >
                  View Full Database Settings & Diagnostics &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
