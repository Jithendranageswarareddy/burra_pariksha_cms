import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen, Video, ArrowUpRight, Plus } from 'lucide-react';

export interface ModeSummary {
  mode: 'QUESTION_CHALLENGE_SHORT' | 'TOPIC_INTRODUCTION' | 'EXPLAINED_QUESTIONS_VIDEO';
  title: string;
  badge: string;
  aspectRatio: string;
  description: string;
  activeCount: number;
  awaitingReviewCount: number;
  publishedCount: number;
  studioUrl: string;
}

interface ContentModeBreakdownProps {
  modesData: ModeSummary[];
  onSelectModeFilter: (mode: string) => void;
}

export const ContentModeBreakdown: React.FC<ContentModeBreakdownProps> = ({
  modesData,
  onSelectModeFilter,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Content-Mode Production Distribution
          </h3>
          <p className="text-xs text-slate-500">
            Lifecycle monitoring across the 3 canonical BP-CMS content archetypes
          </p>
        </div>
        <Link
          to="/studio"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <span>Open Studio</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modesData.map((m) => {
          let icon = Sparkles;
          let color = 'text-purple-600 bg-purple-50 border-purple-200';
          let borderHover = 'hover:border-purple-300';

          if (m.mode === 'TOPIC_INTRODUCTION') {
            icon = BookOpen;
            color = 'text-amber-600 bg-amber-50 border-amber-200';
            borderHover = 'hover:border-amber-300';
          } else if (m.mode === 'EXPLAINED_QUESTIONS_VIDEO') {
            icon = Video;
            color = 'text-blue-600 bg-blue-50 border-blue-200';
            borderHover = 'hover:border-blue-300';
          }

          const IconComponent = icon;

          return (
            <div
              key={m.mode}
              className={`p-3 rounded-xl border border-slate-200/90 bg-white transition-all flex flex-col justify-between ${borderHover} shadow-2xs`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`p-1 rounded-md border ${color}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {m.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {m.aspectRatio}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                  {m.description}
                </p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-center mb-3">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Active</div>
                    <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                      {m.activeCount}
                    </div>
                  </div>
                  <div className="border-x border-slate-200/60">
                    <div className="text-[10px] text-amber-700 uppercase font-semibold">Review</div>
                    <div className="text-sm font-bold font-mono text-amber-800 mt-0.5">
                      {m.awaitingReviewCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-700 uppercase font-semibold">Live</div>
                    <div className="text-sm font-bold font-mono text-emerald-800 mt-0.5">
                      {m.publishedCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectModeFilter(m.mode)}
                  className="text-slate-600 hover:text-indigo-600 font-medium cursor-pointer"
                >
                  Filter Queue →
                </button>
                <Link
                  to={m.studioUrl}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  <Plus className="w-3 h-3" />
                  <span>Draft</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
