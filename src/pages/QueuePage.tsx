import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ListOrdered,
  Filter,
  Video,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Film,
  UserCheck,
  PlayCircle,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { StatCard } from '../components/common/StatCard';
import { QueueTable } from '../components/queue/QueueTable';
import { EmptyState } from '../components/common/EmptyState';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import {
  DifficultyLevel,
  PriorityLevel,
  ProductionStats,
  Video as VideoType,
  VideoProductionStatus,
} from '../types';

export const QueuePage: React.FC = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [quickStage, setQuickStage] = useState<'all' | 'ready_to_film' | 'needs_script'>('all');
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'priority' | 'newest' | 'oldest'>('priority');

  const loadQueueData = async () => {
    setIsLoading(true);
    try {
      const [videosData, statsData] = await Promise.all([
        apiClient.getVideos().catch(() => []),
        apiClient.getProductionStats().catch(() => null),
      ]);
      setVideos(videosData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading video queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueueData();
  }, []);

  const filteredAndSortedVideos = useMemo(() => {
    return videos
      .filter((v) => {
        // Quick Stage Pills
        if (quickStage === 'ready_to_film') {
          if (v.status !== VideoProductionStatus.SCRIPT_READY && v.status !== VideoProductionStatus.RECORDING) {
            return false;
          }
        } else if (quickStage === 'needs_script') {
          if (v.status !== VideoProductionStatus.SCRIPT_REQUIRED && v.status !== VideoProductionStatus.QUEUED) {
            return false;
          }
        }

        // My Assigned Tasks filter (Presenter / Host)
        if (myTasksOnly && user) {
          const isAssigned =
            v.assignedHost === user.name ||
            v.assignedHost === user.id ||
            v.assignedEditor === user.name ||
            v.assignedEditor === user.id;
          if (!isAssigned) return false;
        }

        // Priority filter
        if (priorityFilter) {
          if (priorityFilter === PriorityLevel.NORMAL) {
            if (v.priority !== PriorityLevel.NORMAL && v.priority !== PriorityLevel.MEDIUM) return false;
          } else if (priorityFilter === PriorityLevel.MEDIUM) {
            if (v.priority !== PriorityLevel.MEDIUM && v.priority !== PriorityLevel.NORMAL) return false;
          } else if (v.priority !== priorityFilter) {
            return false;
          }
        }

        // Status filter (dropdown)
        if (statusFilter && v.status !== statusFilter) return false;

        // Difficulty filter
        if (difficultyFilter && v.question?.difficulty !== difficultyFilter) return false;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = (v.id || '').toLowerCase().includes(q);
          const matchQId = (v.questionId || '').toLowerCase().includes(q);
          const matchTitle = (v.title || '').toLowerCase().includes(q);
          const matchText = v.question?.questionText?.toLowerCase().includes(q);
          const matchTopic = v.question?.topicName?.toLowerCase().includes(q);
          const matchSubtopic = v.question?.subtopicName?.toLowerCase().includes(q);
          if (!matchId && !matchQId && !matchTitle && !matchText && !matchTopic && !matchSubtopic) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        // Default: Priority Weight (URGENT > HIGH > NORMAL > LOW) then oldest first
        const pWeight = (p: PriorityLevel) => {
          if (p === PriorityLevel.URGENT) return 4;
          if (p === PriorityLevel.HIGH) return 3;
          if (p === PriorityLevel.NORMAL || p === PriorityLevel.MEDIUM) return 2;
          return 1;
        };
        const diff = pWeight(b.priority) - pWeight(a.priority);
        if (diff !== 0) return diff;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [videos, quickStage, myTasksOnly, user, priorityFilter, statusFilter, difficultyFilter, searchQuery, sortBy]);

  const activeFiltersCount = [
    quickStage !== 'all' ? quickStage : '',
    myTasksOnly ? 'my-tasks' : '',
    priorityFilter,
    statusFilter,
    difficultyFilter,
    searchQuery,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <PageHeader
        title="Video Production Queue"
        description="Prioritized intake and recording queue for all upcoming video assets."
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {filteredAndSortedVideos.length} Active Video Records
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadQueueData}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/production">
              <Button variant="outline" size="sm" icon={Film}>
                Kanban Tracker
              </Button>
            </Link>
            <Link to="/generate">
              <Button variant="primary" size="sm" icon={Sparkles}>
                Create Question
              </Button>
            </Link>
          </div>
        }
      />

      {/* Queue Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total in Queue"
          value={stats ? stats.total - stats.uploaded - stats.cancelled : videos.length}
          icon={ListOrdered}
          accentColor="blue"
          subtitle="Awaiting/In Production"
        />
        <StatCard
          title="Script Ready"
          value={stats?.scriptReady || videos.filter((v) => v.status === VideoProductionStatus.SCRIPT_READY).length}
          icon={Video}
          accentColor="amber"
          subtitle="Teleprompter Ready"
        />
        <StatCard
          title="In Post-Production"
          value={
            stats
              ? stats.recording + stats.recorded + stats.editing + stats.edited
              : videos.filter((v) =>
                  [
                    VideoProductionStatus.RECORDING,
                    VideoProductionStatus.RECORDED,
                    VideoProductionStatus.EDITING,
                    VideoProductionStatus.EDITED,
                  ].includes(v.status)
                ).length
          }
          icon={Clock}
          accentColor="purple"
          subtitle="Recording & Editing"
        />
        <StatCard
          title="Urgent Priority"
          value={
            stats?.byPriority?.urgent ||
            videos.filter((v) => v.priority === PriorityLevel.URGENT && v.status !== VideoProductionStatus.CANCELLED).length
          }
          icon={AlertCircle}
          accentColor="rose"
          subtitle="Top Filming Slot"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Quick Status Pills & My Assigned Tasks Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              Workflow View:
            </span>

            <button
              type="button"
              onClick={() => setQuickStage('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                quickStage === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items ({videos.length})
            </button>

            <button
              type="button"
              onClick={() => setQuickStage('ready_to_film')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                quickStage === 'ready_to_film'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Ready to Film</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                quickStage === 'ready_to_film' ? 'bg-indigo-700 text-white' : 'bg-indigo-200/70 text-indigo-900'
              }`}>
                {videos.filter((v) => v.status === VideoProductionStatus.SCRIPT_READY || v.status === VideoProductionStatus.RECORDING).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickStage('needs_script')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                quickStage === 'needs_script'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Needs Script</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                quickStage === 'needs_script' ? 'bg-amber-700 text-white' : 'bg-amber-200/70 text-amber-900'
              }`}>
                {videos.filter((v) => v.status === VideoProductionStatus.SCRIPT_REQUIRED || v.status === VideoProductionStatus.QUEUED).length}
              </span>
            </button>
          </div>

          {/* My Assigned Tasks Toggle */}
          <button
            type="button"
            onClick={() => setMyTasksOnly(!myTasksOnly)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
              myTasksOnly
                ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-200 shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <UserCheck className={`w-3.5 h-3.5 ${myTasksOnly ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span>My Assigned Tasks</span>
            {myTasksOnly && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Video ID, Question ID, title, topic or subtopic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="priority">Priority First (Urgent &gt; High &gt; Normal &gt; Low)</option>
              <option value="newest">Recently Queued First</option>
              <option value="oldest">Oldest Queued First</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-indigo-500"
            >
              <option value="">All Priorities</option>
              <option value={PriorityLevel.URGENT}>Urgent</option>
              <option value={PriorityLevel.HIGH}>High</option>
              <option value={PriorityLevel.NORMAL}>Normal / Medium</option>
              <option value={PriorityLevel.LOW}>Low</option>
            </select>

            {/* Production Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-indigo-500"
            >
              <option value="">All Production Stages</option>
              {Object.values(VideoProductionStatus).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-indigo-500"
            >
              <option value="">All Difficulties</option>
              <option value={DifficultyLevel.EASY}>Easy</option>
              <option value={DifficultyLevel.MEDIUM}>Medium</option>
              <option value={DifficultyLevel.HARD}>Hard</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuickStage('all');
                setMyTasksOnly(false);
                setPriorityFilter('');
                setStatusFilter('');
                setDifficultyFilter('');
                setSearchQuery('');
              }}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Reset Filters ({activeFiltersCount})
            </Button>
          )}
        </div>
      </div>

      {/* Queue Table Component */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading videos from Google Sheets database...</p>
        </div>
      ) : filteredAndSortedVideos.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No queued videos match your criteria"
          description="Try adjusting your search filters or approve questions in the Question Library to enter them into production."
          actionLabel="View Approved Questions"
          onAction={() => {
            window.location.href = '/questions';
          }}
        />
      ) : (
        <QueueTable videos={filteredAndSortedVideos} />
      )}
    </div>
  );
};
