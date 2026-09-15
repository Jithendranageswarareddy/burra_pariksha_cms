import React from 'react';
import { Filter, X, RefreshCw } from 'lucide-react';
import { Topic } from '../../types';

interface DashboardFilterBarProps {
  topics: Topic[];
  selectedTopic: string;
  selectedDifficulty: string;
  selectedPriority: string;
  onTopicChange: (val: string) => void;
  onDifficultyChange: (val: string) => void;
  onPriorityChange: (val: string) => void;
  onReset: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  topics,
  selectedTopic,
  selectedDifficulty,
  selectedPriority,
  onTopicChange,
  onDifficultyChange,
  onPriorityChange,
  onReset,
  onRefresh,
  isRefreshing,
}) => {
  const hasActiveFilters =
    Boolean(selectedTopic) ||
    Boolean(selectedDifficulty) ||
    Boolean(selectedPriority);

  return (
    <div
      id="dashboard-filter-bar"
      className="bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-xs flex flex-wrap items-center justify-between gap-2"
    >
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 pr-2 border-r border-slate-200 h-8">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filters</span>
        </div>

        {/* Topic Dropdown */}
        <select
          id="dashboard-filter-topic"
          value={selectedTopic}
          aria-label="Filter by Topic"
          onChange={(e) => onTopicChange(e.target.value)}
          className="h-8 text-xs bg-slate-50 hover:bg-slate-100/80 text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors min-w-[130px] max-w-[200px]"
        >
          <option value="">All Topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Difficulty Dropdown */}
        <select
          id="dashboard-filter-difficulty"
          value={selectedDifficulty}
          aria-label="Filter by Difficulty"
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="h-8 text-xs bg-slate-50 hover:bg-slate-100/80 text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
        >
          <option value="">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        {/* Priority Dropdown */}
        <select
          id="dashboard-filter-priority"
          value={selectedPriority}
          aria-label="Filter by Priority"
          onChange={(e) => onPriorityChange(e.target.value)}
          className="h-8 text-xs bg-slate-50 hover:bg-slate-100/80 text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {hasActiveFilters && (
          <button
            id="dashboard-filter-reset-btn"
            type="button"
            onClick={onReset}
            className="h-8 flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/80 px-2.5 rounded-lg border border-rose-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          id="dashboard-refresh-btn"
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 rounded-lg border border-slate-300 transition-colors disabled:opacity-50 shadow-2xs cursor-pointer disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>
    </div>
  );
};
