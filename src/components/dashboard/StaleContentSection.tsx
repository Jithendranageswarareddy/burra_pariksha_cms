import React, { useState } from 'react';
import { Clock, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StaleContentItem } from '../../types';

interface StaleContentSectionProps {
  items: StaleContentItem[];
}

export const StaleContentSection: React.FC<StaleContentSectionProps> = ({ items }) => {
  const safeItems = React.useMemo(() => {
    if (!Array.isArray(items)) return [];
    const seen = new Set<string>();
    return items.filter((item) => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [items]);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'STALE' | 'WAITING'>('ALL');

  const filteredItems = safeItems.filter((item) => {
    if (filterCategory === 'ALL') return true;
    return item.statusCategory === filterCategory;
  });

  const staleCount = safeItems.filter((i) => i.statusCategory === 'STALE').length;
  const waitingCount = safeItems.filter((i) => i.statusCategory === 'WAITING').length;

  const getCategoryBadge = (cat: 'FRESH' | 'WAITING' | 'STALE') => {
    switch (cat) {
      case 'STALE':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'WAITING':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'FRESH':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs h-full flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Content Aging & Stale Tracking</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring stage dwell time (&gt;5 days = Stale, 2–5 days = Waiting)
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterCategory('ALL')}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                filterCategory === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              All ({safeItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('STALE')}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                filterCategory === 'STALE'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Stale ({staleCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('WAITING')}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                filterCategory === 'WAITING'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Waiting ({waitingCount})
            </button>
          </div>
        </div>

        {safeItems.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All pipeline items active &amp; healthy</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>No {filterCategory.toLowerCase()} content items detected.</span>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                  item.statusCategory === 'STALE'
                    ? 'bg-rose-50/40 border-rose-200'
                    : item.statusCategory === 'WAITING'
                    ? 'bg-amber-50/30 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {item.id}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${getCategoryBadge(
                        item.statusCategory
                      )}`}
                    >
                      {item.statusCategory} ({item.daysInStage}d)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Stage: {item.currentStatus}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 truncate">
                    {item.title}
                  </h4>

                  <div className="text-[10px] text-slate-500">
                    {item.topic || item.category || 'General'}
                  </div>
                </div>

                <Link
                  to={item.actionUrl}
                  className="p-1.5 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-md border border-slate-200 transition-colors shrink-0"
                  title="Open in editor"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
