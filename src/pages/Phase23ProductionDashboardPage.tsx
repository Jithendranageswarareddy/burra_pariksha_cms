/**
 * BURRA PARIKSHA CMS - Phase 23 Production Search, Queues & Dashboard Page
 * 
 * Provides unified daily production operations:
 * - Production Search (10+ multi-dimensional filters)
 * - Production Queues (MY WORK, QUESTIONS, SCRIPTS, VIDEOS, REVIEWS, PUBLISHING)
 * - Production Dashboard (aggregated operational metrics & blockers)
 * - Content ID Drilldown Modal
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  FileText,
  Video as VideoIcon,
  MessageSquare,
  Upload,
  XCircle,
  Eye,
  ChevronRight,
  ArrowUpDown,
  ListFilter,
  Shield,
  Activity,
  Calendar,
} from 'lucide-react';
import { phase23ProductionService } from '../lib/services/phase23-production.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { questionConfigService } from '../lib/services/question-config.service';
import {
  Phase23SearchOptions,
  Phase23SearchResult,
  Phase23SearchResultItem,
  Phase23QueueType,
  Phase23QueueResult,
  Phase23QueueItem,
  Phase23DashboardMetrics,
  Phase23ContentIdDetails,
  UserRole,
} from '../types';
import {
  DIFFICULTY_LEVELS,
  CHALLENGE_TYPES,
  PRESENTATION_TYPES,
  LANGUAGES,
} from '../config/question-creation.config';

export const Phase23ProductionDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SEARCH' | 'QUEUES' | 'DASHBOARD'>('DASHBOARD');

  // Simulated authenticated user for current session
  const [currentActor] = useState({
    id: 'USR-001',
    name: 'Admin / Content Lead',
    role: UserRole.ADMIN,
  });

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardMetrics, setDashboardMetrics] = useState<Phase23DashboardMetrics | null>(null);

  // Search State
  const [searchOptions, setSearchOptions] = useState<Phase23SearchOptions>({
    contentId: '',
    search: '',
    topicId: '',
    subtopicId: '',
    difficulty: '',
    language: '',
    challengeType: '',
    presentationType: '',
    questionStyle: '',
    status: '',
    assigneeId: '',
    page: 1,
    limit: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });
  const [searchResults, setSearchResults] = useState<Phase23SearchResult | null>(null);

  // Queues State
  const [selectedQueue, setSelectedQueue] = useState<Phase23QueueType>('MY_WORK');
  const [queueResults, setQueueResults] = useState<Phase23QueueResult | null>(null);

  // Taxonomy & Config Catalog
  const [topics, setTopics] = useState<Array<{ id: string; name: string }>>([]);
  const [subtopics, setSubtopics] = useState<Array<{ id: string; name: string }>>([]);
  const [questionStyles, setQuestionStyles] = useState<Array<{ code: string; displayLabel: string }>>([]);

  // Drilldown Modal
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [drilldownDetails, setDrilldownDetails] = useState<Phase23ContentIdDetails | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState<boolean>(false);

  // Initial Load
  useEffect(() => {
    loadTaxonomyAndConfig();
    loadDashboard();
  }, []);

  // Reload data on search or tab change
  useEffect(() => {
    if (activeTab === 'SEARCH') {
      executeSearch();
    } else if (activeTab === 'QUEUES') {
      loadQueue(selectedQueue);
    } else if (activeTab === 'DASHBOARD') {
      loadDashboard();
    }
  }, [activeTab, selectedQueue]);

  const loadTaxonomyAndConfig = async () => {
    try {
      const [tList, stList, styles] = await Promise.all([
        taxonomyService.getTopics().catch(() => []),
        taxonomyService.getSubtopics().catch(() => []),
        questionConfigService.getQuestionStyles().catch(() => []),
      ]);
      setTopics(tList || []);
      setSubtopics(stList || []);
      setQuestionStyles(styles || []);
    } catch (err) {
      console.error('Failed to load taxonomy/config options:', err);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await phase23ProductionService.getDashboard(currentActor);
      setDashboardMetrics(data);
    } catch (err) {
      console.error('Failed to load production dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeSearch = async (overrides: Partial<Phase23SearchOptions> = {}) => {
    setLoading(true);
    const opts = { ...searchOptions, ...overrides };
    try {
      const res = await phase23ProductionService.search(opts, currentActor);
      setSearchResults(res);
      setSearchOptions(opts);
    } catch (err) {
      console.error('Failed to execute search:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadQueue = async (qType: Phase23QueueType) => {
    setLoading(true);
    try {
      const res = await phase23ProductionService.getQueue(qType, currentActor);
      setQueueResults(res);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    const defaultOpts: Phase23SearchOptions = {
      contentId: '',
      search: '',
      topicId: '',
      subtopicId: '',
      difficulty: '',
      language: '',
      challengeType: '',
      presentationType: '',
      questionStyle: '',
      status: '',
      assigneeId: '',
      page: 1,
      limit: 20,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    };
    executeSearch(defaultOpts);
  };

  const handleOpenDrilldown = async (cid: string) => {
    setSelectedContentId(cid);
    setDrilldownLoading(true);
    try {
      const details = await phase23ProductionService.getContentIdDetails(cid, currentActor);
      setDrilldownDetails(details);
    } catch (err) {
      console.error('Failed to load content ID details:', err);
    } finally {
      setDrilldownLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 md:p-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Phase 23 — Production Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Production Search, Derive-State Queues & Operational Metrics
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
          <button
            id="btn-tab-dashboard"
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'DASHBOARD'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            id="btn-tab-queues"
            onClick={() => setActiveTab('QUEUES')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'QUEUES'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Queues
          </button>
          <button
            id="btn-tab-search"
            onClick={() => setActiveTab('SEARCH')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'SEARCH'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Production Search
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: DASHBOARD */}
      {/* ==================================================================== */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading production dashboard metrics...
            </div>
          ) : dashboardMetrics ? (
            <>
              {/* Primary KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>Active Production Items</span>
                    <Activity className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {dashboardMetrics.totalActiveProductionItems}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>My Assigned Work</span>
                    <UserCheck className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {dashboardMetrics.myAssignedWork}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>Questions Action</span>
                    <FileText className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {dashboardMetrics.questionsNeedingAction}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>Scripts Action</span>
                    <FileText className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {dashboardMetrics.scriptsNeedingAction}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>Videos Action</span>
                    <VideoIcon className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {dashboardMetrics.videosNeedingAction}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>Reviews Pending</span>
                    <MessageSquare className="w-4 h-4 text-pink-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {dashboardMetrics.reviewsPending}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>Publishing Ready</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {dashboardMetrics.publishingReadyItems}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <span>Active Blockers</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                    {dashboardMetrics.publishingBlockersCount}
                  </div>
                </div>
              </div>

              {/* Blockers Breakdown */}
              <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Active Operational Blockers Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="text-xs text-slate-500">Review Pending</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {dashboardMetrics.activeBlockersBreakdown.reviewPending}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="text-xs text-slate-500">Changes Requested</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {dashboardMetrics.activeBlockersBreakdown.changesRequested}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="text-xs text-slate-500">Missing Assets</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {dashboardMetrics.activeBlockersBreakdown.missingAsset}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="text-xs text-slate-500">Stale Adaptations</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {dashboardMetrics.activeBlockersBreakdown.staleAdaptation}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="text-xs text-slate-500">Unready Publishing</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {dashboardMetrics.activeBlockersBreakdown.unreadyPublishing}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="text-xs text-slate-500">Unassigned Work</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {dashboardMetrics.activeBlockersBreakdown.unassignedWork}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recently Updated Feed */}
              <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
                  Recently Updated Production Items
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {dashboardMetrics.recentlyUpdatedItems.map((item) => (
                    <div
                      key={item.contentId}
                      onClick={() => handleOpenDrilldown(item.contentId)}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-semibold px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded">
                          {item.contentId}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{item.topicName || 'General'}</span>
                            <span>•</span>
                            <span>{item.subtopicName || 'Standard'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 font-medium">
                          {item.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: QUEUES */}
      {/* ==================================================================== */}
      {activeTab === 'QUEUES' && (
        <div className="space-y-6">
          {/* Queue Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['MY_WORK', 'QUESTIONS', 'SCRIPTS', 'VIDEOS', 'REVIEWS', 'PUBLISHING'] as Phase23QueueType[]).map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQueue(q)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  selectedQueue === q
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {q.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Queue Result List */}
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading queue items...
            </div>
          ) : queueResults ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Queue: {queueResults.queueType} ({queueResults.totalCount} items)
                </span>
              </div>

              {queueResults.items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No actionable items currently in queue.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {queueResults.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-xs font-semibold px-2 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded">
                          {item.contentId}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.actionRequired}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 font-medium">
                          {item.status}
                        </span>
                        <button
                          onClick={() => handleOpenDrilldown(item.contentId)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PRODUCTION SEARCH */}
      {/* ==================================================================== */}
      {activeTab === 'SEARCH' && (
        <div className="space-y-6">
          {/* Filters Control Panel */}
          <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-500" />
                Production Search Filters
              </span>
              <button
                id="btn-clear-filters"
                onClick={handleClearFilters}
                className="text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                Clear All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              {/* Content ID Exact/Partial */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Content ID</label>
                <input
                  id="input-filter-content-id"
                  type="text"
                  placeholder="e.g. BP-CNT-000001"
                  value={searchOptions.contentId || ''}
                  onChange={(e) => executeSearch({ contentId: e.target.value, page: 1 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              {/* Text Search */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Text Search</label>
                <input
                  id="input-filter-search"
                  type="text"
                  placeholder="Title or question text..."
                  value={searchOptions.search || ''}
                  onChange={(e) => executeSearch({ search: e.target.value, page: 1 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              {/* Topic */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Topic</label>
                <select
                  id="select-filter-topic"
                  value={searchOptions.topicId || ''}
                  onChange={(e) => executeSearch({ topicId: e.target.value, page: 1 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="">All Topics</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtopic */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Subtopic</label>
                <select
                  id="select-filter-subtopic"
                  value={searchOptions.subtopicId || ''}
                  onChange={(e) => executeSearch({ subtopicId: e.target.value, page: 1 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="">All Subtopics</option>
                  {subtopics.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Difficulty</label>
                <select
                  id="select-filter-difficulty"
                  value={searchOptions.difficulty || ''}
                  onChange={(e) => executeSearch({ difficulty: e.target.value, page: 1 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="">All Difficulties</option>
                  {DIFFICULTY_LEVELS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Language</label>
                <select
                  id="select-filter-language"
                  value={searchOptions.language || ''}
                  onChange={(e) => executeSearch({ language: e.target.value, page: 1 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="">All Languages</option>
                  {LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Challenge Type */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Challenge Type</label>
                <select
                  id="select-filter-challenge-type"
                  value={searchOptions.challengeType || ''}
                  onChange={(e) => executeSearch({ challengeType: e.target.value, page: 1 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="">All Challenge Types</option>
                  {CHALLENGE_TYPES.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Presentation Type */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Presentation Type</label>
                <select
                  id="select-filter-presentation-type"
                  value={searchOptions.presentationType || ''}
                  onChange={(e) => executeSearch({ presentationType: e.target.value, page: 1 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="">All Presentation Types</option>
                  {PRESENTATION_TYPES.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Style */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Question Style</label>
                <select
                  id="select-filter-question-style"
                  value={searchOptions.questionStyle || ''}
                  onChange={(e) => executeSearch({ questionStyle: e.target.value, page: 1 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="">All Styles</option>
                  {questionStyles.map((qs) => (
                    <option key={qs.code} value={qs.displayLabel}>
                      {qs.displayLabel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <input
                  id="input-filter-status"
                  type="text"
                  placeholder="e.g. GENERATED, RECORDING"
                  value={searchOptions.status || ''}
                  onChange={(e) => executeSearch({ status: e.target.value, page: 1 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">Assignee</label>
                <input
                  id="input-filter-assignee"
                  type="text"
                  placeholder="User ID or Name..."
                  value={searchOptions.assigneeId || ''}
                  onChange={(e) => executeSearch({ assigneeId: e.target.value, page: 1 })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Results Table */}
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              Searching production database...
            </div>
          ) : searchResults ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Total Matching: {searchResults.totalCount} | Showing {searchResults.returnedCount} items
                  (Page {searchResults.page} of {searchResults.totalPages})
                </span>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  <button
                    disabled={searchResults.page <= 1}
                    onClick={() => executeSearch({ page: searchResults.page - 1 })}
                    className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    disabled={searchResults.page >= searchResults.totalPages}
                    onClick={() => executeSearch({ page: searchResults.page + 1 })}
                    className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>

              {searchResults.items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No production items matched the search criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                        <th className="p-3">Content ID</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Topic / Subtopic</th>
                        <th className="p-3">Difficulty</th>
                        <th className="p-3">Language</th>
                        <th className="p-3">Challenge Type</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Assignee</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {searchResults.items.map((item) => (
                        <tr
                          key={item.contentId}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                        >
                          <td className="p-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                            {item.contentId}
                          </td>
                          <td className="p-3 max-w-xs truncate font-medium text-slate-900 dark:text-white">
                            {item.title}
                          </td>
                          <td className="p-3">
                            <div>{item.topicName || '-'}</div>
                            <div className="text-slate-400 text-[10px]">{item.subtopicName || '-'}</div>
                          </td>
                          <td className="p-3">{item.difficulty}</td>
                          <td className="p-3">{item.language}</td>
                          <td className="p-3">{item.challengeType}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">
                            {item.assigneeName || item.assigneeId || 'Unassigned'}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleOpenDrilldown(item.contentId)}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100"
                            >
                              Drill-Down
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ==================================================================== */}
      {/* CONTENT ID DRILLDOWN MODAL */}
      {/* ==================================================================== */}
      {selectedContentId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Content ID Drilldown: {selectedContentId}
              </h2>
              <button
                onClick={() => setSelectedContentId(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
              >
                &times;
              </button>
            </div>

            {drilldownLoading ? (
              <div className="p-8 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                Loading consolidated lifecycle details...
              </div>
            ) : drilldownDetails ? (
              <div className="space-y-4 text-xs">
                {/* Aggregated Overview */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <div>
                    <span className="text-slate-500">Aggregated Status:</span>
                    <span className="ml-2 font-bold text-indigo-600 dark:text-indigo-400">
                      {drilldownDetails.aggregatedStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Workflow Stage:</span>
                    <span className="ml-2 font-bold text-slate-800 dark:text-slate-200">
                      {drilldownDetails.workflowStage}
                    </span>
                  </div>
                </div>

                {/* Sub-component Cards */}
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Question:</span>
                    <div className="mt-1 text-slate-600 dark:text-slate-400">
                      {drilldownDetails.question ? drilldownDetails.question.questionText : 'No question linked'}
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Video:</span>
                    <div className="mt-1 text-slate-600 dark:text-slate-400">
                      {drilldownDetails.video ? `${drilldownDetails.video.title} (Status: ${drilldownDetails.video.status})` : 'No video linked'}
                    </div>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Script & Pinned Comment:</span>
                    <div className="mt-1 text-slate-600 dark:text-slate-400">
                      Script: {drilldownDetails.script ? 'Available' : 'Missing'} | Pinned Comment: {drilldownDetails.pinnedComment ? 'Available' : 'Missing'}
                    </div>
                  </div>
                </div>

                {/* Active Blockers */}
                {drilldownDetails.blockers.length > 0 && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900">
                    <span className="font-semibold text-rose-700 dark:text-rose-300">Active Blockers:</span>
                    <ul className="list-disc list-inside mt-1 text-rose-600 dark:text-rose-400">
                      {drilldownDetails.blockers.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-slate-500">No details found for Content ID {selectedContentId}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
