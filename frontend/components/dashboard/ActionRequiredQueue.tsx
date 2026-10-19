import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Clock,
  Sparkles,
  BookOpen,
  Video,
  AlertOctagon,
  ChevronRight,
  Plus,
} from 'lucide-react';

export interface ActionQueueItem {
  id: string;
  title: string;
  contentMode: 'QUESTION_CHALLENGE_SHORT' | 'TOPIC_INTRODUCTION' | 'EXPLAINED_QUESTIONS_VIDEO' | 'STANDARD_SHORT';
  topicId?: string;
  topicName: string;
  subtopicName?: string;
  stageNumber: number;
  stageName: string;
  status: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  isBlocked: boolean;
  isOverdue: boolean;
  needsMyAction: boolean;
  assigneeName?: string;
  assignedRole?: string;
  waitingHours: number;
  updatedAt: string;
  targetUrl: string;
  actionLabel: string;
}

interface ActionRequiredQueueProps {
  items: ActionQueueItem[];
  selectedStageFilter: number | null;
  selectedKpiFilter: string | null;
  onSelectStageFilter: (stage: number | null) => void;
  isLoading?: boolean;
}

export const ActionRequiredQueue: React.FC<ActionRequiredQueueProps> = ({
  items,
  selectedStageFilter,
  selectedKpiFilter,
  onSelectStageFilter,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'PRIORITY' | 'WAITING_TIME' | 'UPDATED'>('PRIORITY');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // KPI filter
        if (selectedKpiFilter === 'IN_PRODUCTION' && item.stageNumber > 10) return false;
        if (selectedKpiFilter === 'AWAITING_MY_ACTION' && !item.needsMyAction) return false;
        if (selectedKpiFilter === 'BLOCKED_OVERDUE' && !item.isBlocked && !item.isOverdue) return false;
        if (selectedKpiFilter === 'APPROVAL_QUEUE' && item.stageNumber !== 2 && item.stageNumber !== 7 && item.stageNumber !== 9) return false;
        if (selectedKpiFilter === 'PUBLISHED_TODAY' && item.stageNumber !== 11) return false;

        // Stage filter
        if (selectedStageFilter !== null && item.stageNumber !== selectedStageFilter) {
          return false;
        }

        // Mode filter
        if (modeFilter !== 'ALL' && item.contentMode !== modeFilter) {
          return false;
        }

        // Priority filter
        if (priorityFilter !== 'ALL') {
          if (priorityFilter === 'CRITICAL' && item.priority !== 'CRITICAL' && !item.isBlocked) return false;
          if (priorityFilter === 'HIGH' && item.priority !== 'HIGH') return false;
          if (priorityFilter === 'MEDIUM' && item.priority !== 'MEDIUM') return false;
          if (priorityFilter === 'LOW' && item.priority !== 'LOW') return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchId = item.id.toLowerCase().includes(q);
          const matchTopic = item.topicName.toLowerCase().includes(q);
          const matchSubtopic = (item.subtopicName || '').toLowerCase().includes(q);
          if (!matchTitle && !matchId && !matchTopic && !matchSubtopic) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'PRIORITY') {
          const pScore: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          const diff = (pScore[b.priority] || 0) - (pScore[a.priority] || 0);
          if (diff !== 0) return diff;
          return b.waitingHours - a.waitingHours;
        }
        if (sortBy === 'WAITING_TIME') {
          return b.waitingHours - a.waitingHours;
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [items, selectedStageFilter, selectedKpiFilter, modeFilter, priorityFilter, searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'QUESTION_CHALLENGE_SHORT':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Sparkles className="w-2.5 h-2.5" />
            Mode 1 (Short)
          </span>
        );
      case 'TOPIC_INTRODUCTION':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <BookOpen className="w-2.5 h-2.5" />
            Mode 2 (Intro)
          </span>
        );
      case 'EXPLAINED_QUESTIONS_VIDEO':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Video className="w-2.5 h-2.5" />
            Mode 3 (Class)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
            Standard
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string, isBlocked: boolean) => {
    if (isBlocked || priority === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <AlertOctagon className="w-3 h-3 text-rose-600" />
          BLOCKED
        </span>
      );
    }
    if (priority === 'HIGH') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          HIGH
        </span>
      );
    }
    if (priority === 'MEDIUM') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
          MEDIUM
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-500">
        LOW
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Action Required Work Queue
            </h3>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {filteredItems.length} active
            </span>
            {(selectedStageFilter !== null || selectedKpiFilter !== null) && (
              <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-medium">
                Filtered: {selectedKpiFilter ? selectedKpiFilter : `Stage ${selectedStageFilter}`}
              </span>
            )}
          </div>

          {/* Quick Clear Filter */}
          {(selectedStageFilter !== null || selectedKpiFilter !== null || modeFilter !== 'ALL' || priorityFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                onSelectStageFilter(null);
                setModeFilter('ALL');
                setPriorityFilter('ALL');
                setSearchQuery('');
                setPage(1);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Dense Controls Strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search content ID, title, topic or subtopic..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Mode Filter */}
          <div className="md:col-span-3">
            <select
              value={modeFilter}
              onChange={(e) => {
                setModeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Content Modes</option>
              <option value="QUESTION_CHALLENGE_SHORT">Mode 1: Question Challenge Short</option>
              <option value="TOPIC_INTRODUCTION">Mode 2: Topic Introduction</option>
              <option value="EXPLAINED_QUESTIONS_VIDEO">Mode 3: Explained Questions Video</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="md:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical / Blocked</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="PRIORITY">Sort: Priority</option>
              <option value="WAITING_TIME">Sort: Oldest Waiting</option>
              <option value="UPDATED">Sort: Recently Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-2.5 px-3 w-24">Priority</th>
              <th className="py-2.5 px-3">Content Item / Title</th>
              <th className="py-2.5 px-3 w-32">Mode</th>
              <th className="py-2.5 px-3 w-40">Topic / Subtopic</th>
              <th className="py-2.5 px-3 w-36">Current Stage</th>
              <th className="py-2.5 px-3 w-28">Waiting</th>
              <th className="py-2.5 px-3 w-32 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-3"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                  <td className="py-3 px-3"><div className="h-4 bg-slate-200 rounded w-48" /></td>
                  <td className="py-3 px-3"><div className="h-4 bg-slate-200 rounded w-20" /></td>
                  <td className="py-3 px-3"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                  <td className="py-3 px-3"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                  <td className="py-3 px-3"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                  <td className="py-3 px-3 text-right"><div className="h-6 bg-slate-200 rounded w-20 ml-auto" /></td>
                </tr>
              ))
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Operational Queue Clear</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Zero items currently match the selected criteria. The pipeline is ready for new production.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Link
                        to="/studio"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Launch New Production in Studio</span>
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Priority */}
                  <td className="py-3 px-3">
                    {getPriorityBadge(item.priority, item.isBlocked)}
                  </td>

                  {/* Title & ID */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900 line-clamp-1">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{item.id}</span>
                      {item.assigneeName && (
                        <span>• Assigned: {item.assigneeName}</span>
                      )}
                    </div>
                  </td>

                  {/* Content Mode */}
                  <td className="py-3 px-3">
                    {getModeBadge(item.contentMode)}
                  </td>

                  {/* Topic / Subtopic */}
                  <td className="py-3 px-3">
                    <div className="text-slate-800 font-medium truncate max-w-[150px]">
                      {item.topicName}
                    </div>
                    {item.subtopicName && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {item.subtopicName}
                      </div>
                    )}
                  </td>

                  {/* Current Stage */}
                  <td className="py-3 px-3">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {String(item.stageNumber).padStart(2, '0')}
                      </span>
                      <span className="font-medium text-slate-700 truncate max-w-[110px]">
                        {item.stageName}
                      </span>
                    </div>
                  </td>

                  {/* Waiting Time */}
                  <td className="py-3 px-3 font-mono text-slate-600">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        item.waitingHours > 48
                          ? 'text-rose-600 font-semibold'
                          : item.waitingHours > 24
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {item.waitingHours < 1
                        ? '<1h'
                        : item.waitingHours < 24
                        ? `${Math.round(item.waitingHours)}h`
                        : `${Math.round(item.waitingHours / 24)}d`}
                    </span>
                  </td>

                  {/* Action Link */}
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={item.targetUrl}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs transition-colors"
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredItems.length > pageSize && (
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {(page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, filteredItems.length)} of {filteredItems.length} items
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-mono">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
