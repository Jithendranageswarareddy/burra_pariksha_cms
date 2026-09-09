import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Kanban,
  Table,
  Filter,
  ListOrdered,
  Share2,
  Plus,
  Sparkles,
  RefreshCw,
  Search,
  Film,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { ProductionKanban } from '../components/production/ProductionKanban';
import { ProductionTable } from '../components/production/ProductionTable';
import { EmptyState } from '../components/common/EmptyState';
import { apiClient } from '../lib/api-client';
import { PriorityLevel, ProductionStats, Video, VideoProductionStatus } from '../types';

export const ProductionTrackerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL search parameter synchronization (Phase 14.3)
  const urlSearchQuery = searchParams.get('searchQuery') || searchParams.get('search') || searchParams.get('q') || '';
  const selectedStatus = searchParams.get('status') || '';
  const selectedPriority = searchParams.get('priority') || '';
  const selectedAssignee = searchParams.get('assignee') || '';

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search input state with debounced URL synchronization
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
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('searchQuery');
      next.delete('search');
      next.delete('q');
      next.delete('status');
      next.delete('priority');
      next.delete('assignee');
      return next;
    });
  };

  const loadProductionData = async () => {
    setIsLoading(true);
    try {
      const [videosData, statsData] = await Promise.all([
        apiClient.getVideos().catch(() => []),
        apiClient.getProductionStats().catch(() => null),
      ]);
      setVideos(videosData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading production tracker:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProductionData();
  }, []);

  const assigneesList = useMemo(() => {
    const set = new Set<string>();
    videos.forEach((v) => {
      if (v.assignedHost) set.add(v.assignedHost);
      if (v.assignedEditor) set.add(v.assignedEditor);
    });
    return Array.from(set).sort();
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      if (selectedStatus && v.status !== selectedStatus) return false;
      if (selectedPriority) {
        if (selectedPriority === PriorityLevel.NORMAL) {
          if (v.priority !== PriorityLevel.NORMAL && v.priority !== PriorityLevel.MEDIUM) return false;
        } else if (v.priority !== selectedPriority) {
          return false;
        }
      }
      if (selectedAssignee && v.assignedEditor !== selectedAssignee && v.assignedHost !== selectedAssignee) {
        return false;
      }
      const activeSearch = searchInput.trim() || urlSearchQuery.trim();
      if (activeSearch) {
        const q = activeSearch.toLowerCase().trim();
        const matchId = (v.id || '').toLowerCase().includes(q);
        const matchQId = (v.questionId || '').toLowerCase().includes(q);
        const matchTitle = (v.title || '').toLowerCase().includes(q);
        const matchNotes = (v.notes || '').toLowerCase().includes(q);
        if (!matchId && !matchQId && !matchTitle && !matchNotes) return false;
      }
      return true;
    });
  }, [videos, selectedStatus, selectedPriority, selectedAssignee, searchInput, urlSearchQuery]);

  const activeFiltersCount = [
    selectedStatus,
    selectedPriority,
    selectedAssignee,
    searchInput || urlSearchQuery,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <PageHeader
        title="Video Production Tracker"
        description="End-to-end multi-stage video workflow tracking from script drafting to teleprompter recording and 4K shorts master renders."
        badge={
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {videos.length} Total Productions
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadProductionData}
              disabled={isLoading}
              className="text-xs flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <Link to="/queue">
              <Button variant="outline" size="sm" icon={ListOrdered} className="text-xs">
                Intake Queue
              </Button>
            </Link>
          </div>
        }
      />

      {/* Production Pipeline Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <StatCard
          title="In Scripting"
          value={stats?.scriptRequired || videos.filter((v) => v.status === VideoProductionStatus.SCRIPT_REQUIRED || v.status === VideoProductionStatus.QUEUED).length}
          icon={Layers}
          accentColor="blue"
          subtitle="Awaiting Teleprompter"
        />
        <StatCard
          title="Studio Filming"
          value={stats?.recording || videos.filter((v) => v.status === VideoProductionStatus.RECORDING || v.status === VideoProductionStatus.SCRIPT_READY).length}
          icon={Film}
          accentColor="amber"
          subtitle="Host & Studio Active"
        />
        <StatCard
          title="Editing & Post"
          value={
            stats
              ? stats.editing + stats.recorded + stats.edited
              : videos.filter((v) =>
                  [
                    VideoProductionStatus.RECORDED,
                    VideoProductionStatus.EDITING,
                    VideoProductionStatus.EDITED,
                  ].includes(v.status)
                ).length
          }
          icon={Clock}
          accentColor="purple"
          subtitle="Graphics & Audio Cut"
        />
        <StatCard
          title="Final QC Review"
          value={stats?.finalReview || videos.filter((v) => v.status === VideoProductionStatus.FINAL_REVIEW).length}
          icon={Sparkles}
          accentColor="indigo"
          subtitle="Pending Admin Approval"
        />
        <StatCard
          title="Published / Uploaded"
          value={stats?.uploaded || videos.filter((v) => v.status === VideoProductionStatus.UPLOADED).length}
          icon={CheckCircle2}
          accentColor="emerald"
          subtitle="Ready for YouTube"
        />
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Stage Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Pipeline Stages</option>
            {Object.values(VideoProductionStatus).map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Priority Selector */}
          <select
            value={selectedPriority}
            onChange={(e) => updateFilter('priority', e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value={PriorityLevel.URGENT}>Urgent</option>
            <option value={PriorityLevel.HIGH}>High</option>
            <option value={PriorityLevel.NORMAL}>Normal / Medium</option>
            <option value={PriorityLevel.LOW}>Low</option>
          </select>

          {/* Staff Assignee Selector */}
          {assigneesList.length > 0 && (
            <select
              value={selectedAssignee}
              onChange={(e) => updateFilter('assignee', e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Staff Members</option>
              {assigneesList.map((person) => (
                <option key={person} value={person}>
                  {person}
                </option>
              ))}
            </select>
          )}

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Reset Filters
            </Button>
          )}
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          Showing {filteredVideos.length} of {videos.length} videos
        </div>
      </div>

      {/* Main View: Kanban or Table */}
      {isLoading ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-500 font-mono">Loading production pipeline from Google Sheets...</p>
        </div>
      ) : filteredVideos.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No videos match the selected filters"
          description="Try clearing your filters or queue new approved questions from the Question Library."
          actionLabel="View Question Library"
          onAction={() => {
            window.location.href = '/questions';
          }}
        />
      ) : viewMode === 'kanban' ? (
        <ProductionKanban videos={filteredVideos} />
      ) : (
        <ProductionTable videos={filteredVideos} />
      )}
    </div>
  );
};
