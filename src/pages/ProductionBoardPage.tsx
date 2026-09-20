/**
 * BURRA PARIKSHA CMS - Production Board Page (Task 3E.2.3 & 3E.2.4)
 * Unified Read-Model Production Board Overview & Filtering
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Table as TableIcon,
  RefreshCw,
  Search,
  AlertCircle,
  Film,
  ExternalLink,
  ShieldCheck,
  User,
  Filter,
  X,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { apiClient } from '../lib/api-client';
import { ProductionBoardItem, VideoProductionStatus, DifficultyLevel } from '../types';
import { VIDEO_STATUS_CONFIG } from '../config/constants';

const READINESS_BADGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  RENDER_NOT_STARTED: { label: 'Render Not Started', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
  RENDER_METADATA_INCOMPLETE: { label: 'Metadata Incomplete', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  RENDER_INVALID: { label: 'Render Invalid', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  RENDER_VALID_BUT_EDITING: { label: 'Render Valid (Editing)', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  EDITING_COMPLETE: { label: 'Editing Complete', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  READY_FOR_PUBLISHING: { label: 'Ready for Publishing', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export const ProductionBoardPage: React.FC = () => {
  const [boardItems, setBoardItems] = useState<ProductionBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Readiness inspection modal state
  const [inspectingVideoId, setInspectingVideoId] = useState<string | null>(null);
  const [readinessData, setReadinessData] = useState<any | null>(null);
  const [isReadinessLoading, setIsReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);

  // URL search parameter synchronization (Phase 14.3)
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearchQuery = searchParams.get('searchQuery') || searchParams.get('search') || searchParams.get('q') || '';
  const selectedStatus = searchParams.get('status') || 'ALL';
  const selectedPriority = searchParams.get('priority') || 'ALL';
  const selectedAssignee = searchParams.get('assignee') || 'ALL';
  const selectedDifficulty = searchParams.get('difficulty') || 'ALL';
  const selectedDueDateFilter = searchParams.get('dueDate') || 'ALL'; // ALL, OVERDUE, TODAY, UPCOMING

  const [searchInput, setSearchInput] = useState(urlSearchQuery);

  useEffect(() => {
    setSearchInput(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const current = next.get('searchQuery') || next.get('search') || next.get('q') || '';
        if (searchInput.trim() !== current) {
          if (searchInput.trim()) {
            next.set('searchQuery', searchInput.trim());
            next.delete('search');
            next.delete('q');
          } else {
            next.delete('searchQuery');
            next.delete('search');
            next.delete('q');
          }
          return next;
        }
        return prev;
      }, { replace: true });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchParams]);

  const updateFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'ALL') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('searchQuery');
      next.delete('search');
      next.delete('q');
      next.delete('status');
      next.delete('priority');
      next.delete('assignee');
      next.delete('category');
      next.delete('difficulty');
      next.delete('dueDate');
      return next;
    });
  };

  const isMountedRef = React.useRef(true);

  const loadBoardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getProductionBoard();
      if (isMountedRef.current) {
        setBoardItems(data);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
        return;
      }
      console.error('Failed to load production board:', err);
      setError(err?.message || 'Failed to load production board records.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const openReadinessInspector = async (videoId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInspectingVideoId(videoId);
    setIsReadinessLoading(true);
    setReadinessData(null);
    setReadinessError(null);
    try {
      const data = await apiClient.getVideoPublishReadiness(videoId);
      if (isMountedRef.current) {
        if (data && data.checklist && !Array.isArray(data.checklist)) {
          data.checklistArray = [
            { item: 'Video Status (READY_TO_UPLOAD or UPLOADED)', passed: data.checklist.videoReady },
            { item: 'Thumbnail Status Approved', passed: data.checklist.thumbnailReady },
            { item: 'Pinned Comment Approved', passed: data.checklist.pinnedCommentReady },
            { item: 'Script Ready', passed: data.checklist.scriptReady },
            { item: 'Metadata Ready', passed: data.checklist.metadataReady },
          ];
        } else if (data) {
          data.checklistArray = data.checklist || [];
        }
        setReadinessData(data);
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;
      setReadinessError(err?.message || 'Failed to fetch readiness details.');
    } finally {
      if (isMountedRef.current) {
        setIsReadinessLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadBoardData();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Extract unique filter options from dataset
  const uniqueStatuses = Array.from(new Set(boardItems.map(i => i.videoStatus))).filter(Boolean);
  const uniquePriorities = Array.from(new Set(boardItems.map(i => i.priority))).filter(Boolean);
  const uniqueAssignees = Array.from(new Set(boardItems.map(i => i.assignee?.name))).filter(Boolean);
  const uniqueDifficulties = Array.from(new Set(boardItems.map(i => i.difficulty))).filter(Boolean);

  // Active filter count
  let activeFilterCount = 0;
  if (selectedStatus !== 'ALL') activeFilterCount++;
  if (selectedPriority !== 'ALL') activeFilterCount++;
  if (selectedAssignee !== 'ALL') activeFilterCount++;
  if (selectedDifficulty !== 'ALL') activeFilterCount++;
  if (selectedDueDateFilter !== 'ALL') activeFilterCount++;
  if ((searchInput || urlSearchQuery).trim()) activeFilterCount++;

  const filteredItems = boardItems.filter((item) => {
    // 1. Search Query (Video ID, Question ID, Title, Question text)
    const activeSearch = (searchInput || urlSearchQuery).trim();
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      const matchSearch =
        (item.videoId || '').toLowerCase().includes(q) ||
        (item.questionId || '').toLowerCase().includes(q) ||
        (item.title || '').toLowerCase().includes(q) ||
        (item.questionText && item.questionText.toLowerCase().includes(q)) ||
        (item.topic || '').toLowerCase().includes(q) ||
        (item.subtopic || '').toLowerCase().includes(q) ||
        (item.assignee?.name && item.assignee.name.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    // 2. Status filter
    if (selectedStatus !== 'ALL' && item.videoStatus !== selectedStatus) {
      return false;
    }

    // 3. Priority filter
    if (selectedPriority !== 'ALL' && item.priority !== selectedPriority) {
      return false;
    }

    // 4. Assignee filter
    if (selectedAssignee !== 'ALL') {
      if (selectedAssignee === 'UNASSIGNED') {
        if (item.assignee) return false;
      } else {
        if (item.assignee?.name !== selectedAssignee) return false;
      }
    }

    // 5. Difficulty filter
    if (selectedDifficulty !== 'ALL' && item.difficulty !== selectedDifficulty) {
      return false;
    }

    // 7. Due-date filter
    if (selectedDueDateFilter !== 'ALL') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const itemDate = item.dueDate ? new Date(item.dueDate) : null;
      if (itemDate) itemDate.setHours(0, 0, 0, 0);

      if (selectedDueDateFilter === 'OVERDUE') {
        if (!item.isOverdue) return false;
      } else if (selectedDueDateFilter === 'TODAY') {
        if (!itemDate || itemDate.getTime() !== today.getTime()) return false;
      } else if (selectedDueDateFilter === 'UPCOMING') {
        if (!itemDate || itemDate.getTime() <= today.getTime()) return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Unified Production Board"
        description="Read-only consolidated overview of all active video production pipelines and asset statuses"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadBoardData}
              disabled={isLoading}
              icon={RefreshCw}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Search & Filter Controls Card */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              id="board-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Video ID, Question ID, Title, or Question text..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters ({activeFilterCount})
              </button>
            )}
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredItems.length}</span> of {boardItems.length} records
            </div>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              {uniqueStatuses.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => updateFilter('priority', e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              {uniquePriorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Assignee</label>
            <select
              value={selectedAssignee}
              onChange={(e) => updateFilter('assignee', e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {uniqueAssignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => updateFilter('difficulty', e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Difficulties</option>
              {uniqueDifficulties.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Due Date</label>
            <select
              value={selectedDueDateFilter}
              onChange={(e) => updateFilter('dueDate', e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Dates</option>
              <option value="OVERDUE">Overdue</option>
              <option value="TODAY">Due Today</option>
              <option value="UPCOMING">Upcoming</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-16 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading unified production board records...</span>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-200">Failed to Load Production Board</h3>
            <p className="text-xs text-rose-600 dark:text-rose-400 max-w-md">{error}</p>
          </div>
          <Button variant="primary" size="sm" onClick={loadBoardData} icon={RefreshCw}>
            Try Again
          </Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No Matching Production Records"
          description={
            activeFilterCount > 0
              ? 'No production items match your current search and filter criteria.'
              : 'There are currently no active videos in the production board pipeline.'
          }
          actionLabel={activeFilterCount > 0 ? 'Clear All Filters' : undefined}
          onAction={activeFilterCount > 0 ? clearAllFilters : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Video & Question</th>
                  <th className="py-3 px-4">Topic / Subtopic</th>
                  <th className="py-3 px-4">Status & Assignee</th>
                  <th className="py-3 px-4">Script</th>
                  <th className="py-3 px-4">Thumbnail</th>
                  <th className="py-3 px-4">Pinned Comment</th>
                  <th className="py-3 px-4">Publishing</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredItems.map((item) => {
                  const statusConf = VIDEO_STATUS_CONFIG[item.videoStatus] || {
                    label: item.videoStatus,
                    bg: 'bg-slate-100',
                    text: 'text-slate-800',
                    border: 'border-slate-300',
                  };

                  return (
                    <tr
                      key={item.videoId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Video & Question */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <Link
                            to={`/videos/${item.videoId}`}
                            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                          >
                            <span>{item.title}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-bold">
                              {item.videoId}
                            </span>
                            <span>•</span>
                            <Link
                              to={`/questions/${item.questionId}`}
                              className="text-indigo-500 hover:underline font-medium"
                              title="Open Question Detail"
                            >
                              {item.questionId}
                            </Link>
                            {item.isOverdue && (
                              <span className="text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded">
                                OVERDUE
                              </span>
                            )}
                          </div>
                          {item.finalRenderPath && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-1">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                                item.finalRenderValidationStatus === 'VALID'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : item.finalRenderValidationStatus === 'INVALID'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                              }`}>
                                RENDER: {item.finalRenderValidationStatus || 'NOT_VALIDATED'}
                              </span>
                              {item.finalRenderWidth && item.finalRenderHeight && (
                                <span className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">
                                  {item.finalRenderWidth}x{item.finalRenderHeight}
                                </span>
                              )}
                              {item.finalRenderFormat && (
                                <span className="text-slate-400 font-mono">
                                  • {item.finalRenderFormat}
                                </span>
                              )}
                              {item.actualDurationSeconds !== undefined && item.actualDurationSeconds !== null && (
                                <span className="text-slate-400 font-mono">
                                  • {item.actualDurationSeconds}s
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Topic / Subtopic */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{item.topic || 'General'}</span>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {item.subtopic || '—'}
                          </div>
                        </div>
                      </td>

                      {/* Status & Assignee */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                          >
                            {statusConf.label}
                          </span>
                          {item.canonicalProductionReadiness && READINESS_BADGE_CONFIG[item.canonicalProductionReadiness] && (
                            <div>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${READINESS_BADGE_CONFIG[item.canonicalProductionReadiness].bg} ${READINESS_BADGE_CONFIG[item.canonicalProductionReadiness].text} ${READINESS_BADGE_CONFIG[item.canonicalProductionReadiness].border}`}
                              >
                                {READINESS_BADGE_CONFIG[item.canonicalProductionReadiness].label}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {item.assignee?.name || 'Unassigned'}
                            </span>
                            {item.priority && (
                              <span
                                className={`ml-1 text-[10px] px-1 rounded font-mono ${
                                  item.priority === 'HIGH'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Script */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/videos/${item.videoId}?tab=script`}
                          className="block hover:bg-slate-100 dark:hover:bg-slate-800/80 p-1.5 rounded-lg transition-colors group/script"
                          title="Open Script Workspace"
                        >
                          {item.scriptId ? (
                            <div className="space-y-0.5">
                              <span className="font-medium text-emerald-700 dark:text-emerald-400 group-hover/script:underline">
                                Ready
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono">
                                v{item.scriptVersion || 1}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic group-hover/script:underline">Pending</span>
                          )}
                        </Link>
                      </td>

                      {/* Thumbnail */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/videos/${item.videoId}?tab=thumbnail`}
                          className="block hover:bg-slate-100 dark:hover:bg-slate-800/80 p-1.5 rounded-lg transition-colors group/thumb"
                          title="Open Thumbnail Workspace"
                        >
                          {item.thumbnailId ? (
                            <div className="space-y-0.5">
                              <span
                                className={`font-medium group-hover/thumb:underline ${
                                  item.thumbnailStatus === 'APPROVED'
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-amber-700 dark:text-amber-400'
                                }`}
                              >
                                {item.thumbnailStatus || 'Designed'}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono">
                                v{item.thumbnailVersion || 1}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic group-hover/thumb:underline">Pending</span>
                          )}
                        </Link>
                      </td>

                      {/* Pinned Comment */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/videos/${item.videoId}?tab=pinned-comment`}
                          className="block hover:bg-slate-100 dark:hover:bg-slate-800/80 p-1.5 rounded-lg transition-colors group/comment"
                          title="Open Pinned Comment Workspace"
                        >
                          {item.pinnedCommentId ? (
                            <span
                              className={`font-medium group-hover/comment:underline ${
                                item.pinnedCommentApproval
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {item.pinnedCommentApproval ? 'Approved' : 'Draft'}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic group-hover/comment:underline">Pending</span>
                          )}
                        </Link>
                      </td>

                      {/* Publishing */}
                      <td className="py-3 px-4">
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={(e) => openReadinessInspector(item.videoId, e)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              item.publishingReadiness === 'READY' || item.publishingReadiness?.includes('100')
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                            }`}
                            title="Click to inspect publishing readiness details & blockers"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>{item.publishingReadiness || 'Check Readiness'}</span>
                          </button>
                          <Link
                            to={`/publishing`}
                            className="block text-[11px] font-mono text-slate-500 hover:underline"
                          >
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {item.completedPlatformsCount}/{item.totalPlatformsCount}
                            </span>{' '}
                            Platforms
                          </Link>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/videos/${item.videoId}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Open Video Detail"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Readiness Inspection Modal */}
      {inspectingVideoId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Publishing Readiness: {inspectingVideoId}
                </h3>
              </div>
              <button
                onClick={() => setInspectingVideoId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {isReadinessLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating publishing readiness rules...</span>
                </div>
              ) : readinessError ? (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg text-rose-700 dark:text-rose-300 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Readiness API Error</h4>
                    <p className="mt-1">{readinessError}</p>
                  </div>
                </div>
              ) : readinessData ? (
                <div className="space-y-5">
                  {/* Status Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                      readinessData.isReady
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200'
                    }`}
                  >
                    {readinessData.isReady ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-sm">
                        {readinessData.isReady ? 'READY TO PUBLISH' : 'NOT READY'}
                      </div>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        {readinessData.isReady
                          ? 'All required publishing gates, asset approvals, and metadata validations have passed successfully.'
                          : 'Publishing is blocked until all required validation gates are resolved.'}
                      </p>
                    </div>
                  </div>

                  {/* Blockers */}
                  {readinessData.blockers && readinessData.blockers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Blockers ({readinessData.blockers.length})
                      </h4>
                      <ul className="space-y-2 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-lg p-3">
                        {readinessData.blockers.map((blocker: string, idx: number) => {
                          const lower = (blocker || '').toLowerCase();
                          let navTarget: string | null = null;
                          let navLabel = '';
                          if (lower.includes('script') || lower.includes('version')) {
                            navTarget = `/videos/${inspectingVideoId}?tab=script`;
                            navLabel = 'Open Script Workspace';
                          } else if (lower.includes('thumbnail')) {
                            navTarget = `/videos/${inspectingVideoId}?tab=thumbnail`;
                            navLabel = 'Open Thumbnail Workspace';
                          } else if (lower.includes('pinned comment') || lower.includes('comment')) {
                            navTarget = `/videos/${inspectingVideoId}?tab=pinned-comment`;
                            navLabel = 'Open Pinned Comment Workspace';
                          } else if (lower.includes('publishing') || lower.includes('platform')) {
                            navTarget = '/publishing';
                            navLabel = 'Open Publishing';
                          } else if (lower.includes('question')) {
                            navTarget = `/questions`;
                            navLabel = 'Open Questions';
                          } else if (lower.includes('video') || lower.includes('title')) {
                            navTarget = `/videos/${inspectingVideoId}`;
                            navLabel = 'Open Video Detail';
                          }

                          return (
                            <li key={idx} className="flex flex-col gap-1.5 text-rose-800 dark:text-rose-300 pb-2 last:pb-0 border-b border-rose-100/60 dark:border-rose-900/30 last:border-0">
                              <div className="flex items-start gap-2">
                                <span className="text-rose-500 font-bold mt-0.5">•</span>
                                <span className="flex-1">{blocker}</span>
                              </div>
                              {navTarget && (
                                <div className="pl-4">
                                  <Link
                                    to={navTarget}
                                    onClick={() => setInspectingVideoId(null)}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 hover:underline bg-rose-100/70 dark:bg-rose-900/40 px-2 py-0.5 rounded"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>{navLabel}</span>
                                  </Link>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {readinessData.warnings && readinessData.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Warnings ({readinessData.warnings.length})
                      </h4>
                      <ul className="space-y-1.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-lg p-3">
                        {readinessData.warnings.map((warning: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Checklist */}
                  {readinessData.checklistArray && readinessData.checklistArray.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                        Readiness Checklist
                      </h4>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                        {readinessData.checklistArray.map((chk: any, idx: number) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{chk.item}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                chk.passed
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              {chk.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500">No readiness data available.</div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setInspectingVideoId(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

