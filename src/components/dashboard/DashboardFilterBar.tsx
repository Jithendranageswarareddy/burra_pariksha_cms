import React from 'react';
import { Filter, X, RefreshCw } from 'lucide-react';
import { Category, Topic } from '../../types';

interface DashboardFilterBarProps {
  categories: Category[];
  topics: Topic[];
  selectedCategory: string;
  selectedTopic: string;
  selectedDifficulty: string;
  selectedPriority: string;
  onCategoryChange: (val: string) => void;
  onTopicChange: (val: string) => void;
  onDifficultyChange: (val: string) => void;
  onPriorityChange: (val: string) => void;
  onReset: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  categories,
  topics,
  selectedCategory,
  selectedTopic,
  selectedDifficulty,
  selectedPriority,
  onCategoryChange,
  onTopicChange,
  onDifficultyChange,
  onPriorityChange,
  onReset,
  onRefresh,
  isRefreshing,
}) => {
  const filteredTopics = selectedCategory
    ? topics.filter((t) => t.categoryId === selectedCategory)
    : topics;

  const hasActiveFilters =
    Boolean(selectedCategory) ||
    Boolean(selectedTopic) ||
    Boolean(selectedDifficulty) ||
    Boolean(selectedPriority);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 pr-2 border-r border-slate-200">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filters</span>
        </div>

        {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => {
            onCategoryChange(e.target.value);
            onTopicChange('');
          }}
          className="text-xs bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Topic Dropdown */}
        <select
          value={selectedTopic}
          onChange={(e) => onTopicChange(e.target.value)}
          className="text-xs bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Topics</option>
          {filteredTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        {/* Difficulty Dropdown */}
        <select
          value={selectedDifficulty}
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="text-xs bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Difficulties</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>

        {/* Priority Dropdown */}
        <select
          value={selectedPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="text-xs bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 transition-colors disabled:opacity-50 shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>
    </div>
  );
};
