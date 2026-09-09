import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Video,
  FileQuestion,
  Filter,
} from 'lucide-react';
import { TodaysWorkItem } from '../../types';

interface TodaysWorkSectionProps {
  items: TodaysWorkItem[];
}

export const TodaysWorkSection: React.FC<TodaysWorkSectionProps> = ({ items }) => {
  const safeItems = Array.isArray(items) ? items : [];
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [selectedType, setSelectedType] = useState<'ALL' | 'VIDEO' | 'QUESTION'>('ALL');

  const toggleComplete = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredItems = safeItems.filter((item) => {
    if (selectedType === 'ALL') return true;
    return item.entityType === selectedType;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border-orange-200 font-bold';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Today's Priority Action Queue</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                {items.length} Pending Actions
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked queue of critical interventions across scripts, recording, editing, and publishing
            </p>
          </div>
        </div>

        {/* Filter Pill */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setSelectedType('ALL')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              selectedType === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('VIDEO')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              selectedType === 'VIDEO'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Videos ({items.filter((i) => i.entityType === 'VIDEO').length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('QUESTION')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              selectedType === 'QUESTION'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Questions ({items.filter((i) => i.entityType === 'QUESTION').length})
          </button>
        </div>
      </div>

      {/* Item List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-500 text-xs">
          No immediate priority actions pending. All active content is on track.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredItems.map((item) => {
            const isCompleted = completedIds.has(item.id);
            return (
              <div
                key={item.id}
                id={`todays-work-${(item.id || '').toLowerCase()}`}
                className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => toggleComplete(item.id)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    title="Mark task done for current session"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {item.id}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border ${getPriorityBadge(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700">
                        {item.category} • {item.topic}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {item.ageDays === 0 ? 'Today' : `${item.ageDays}d waiting`}
                      </span>
                    </div>

                    <h4
                      className={`text-xs font-bold leading-snug line-clamp-1 ${
                        isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center pl-7 sm:pl-0">
                  <div className="text-right hidden md:block">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Recommended Action
                    </div>
                    <div className="text-xs font-bold text-indigo-600 truncate max-w-[200px]">
                      {item.recommendedAction}
                    </div>
                  </div>
                  <Link
                    to={item.actionUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs shrink-0"
                  >
                    <span>Execute</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
