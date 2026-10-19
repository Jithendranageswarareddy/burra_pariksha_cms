import React from 'react';
import {
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { CANONICAL_15_STEPS } from '../../../shared/constants/workflow';

export interface StageMetrics {
  stepNumber: number;
  totalCount: number;
  awaitingActionCount: number;
  blockedCount: number;
  overdueCount: number;
  oldestAgeHours: number;
}

interface ProductionPipelineBoardProps {
  stageMetrics: Record<number, StageMetrics>;
  selectedStage: number | null;
  onSelectStage: (stageNumber: number | null) => void;
  isLoading?: boolean;
}

export const ProductionPipelineBoard: React.FC<ProductionPipelineBoardProps> = ({
  stageMetrics,
  selectedStage,
  onSelectStage,
  isLoading = false,
}) => {
  // Compute Bottleneck Watchlist: Top 3 stages ranked by (totalCount * 2 + blockedCount * 5 + overdueCount * 3 + oldestAgeHours * 0.1)
  const rankedBottlenecks = Object.values(stageMetrics)
    .filter((m) => m.stepNumber <= 11 && (m.totalCount > 0 || m.blockedCount > 0))
    .sort((a, b) => {
      const scoreA = a.blockedCount * 10 + a.overdueCount * 5 + a.totalCount * 2 + a.oldestAgeHours * 0.2;
      const scoreB = b.blockedCount * 10 + b.overdueCount * 5 + b.totalCount * 2 + b.oldestAgeHours * 0.2;
      return scoreB - scoreA;
    })
    .slice(0, 3);

  const totalActivePipelineVolume = Object.values(stageMetrics)
    .filter((m) => m.stepNumber <= 10)
    .reduce((sum, m) => sum + m.totalCount, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-4">
      {/* Board Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Canonical 15-Stage Production Pipeline
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Total WIP: {totalActivePipelineVolume} item{totalActivePipelineVolume === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {selectedStage !== null ? (
            <button
              type="button"
              onClick={() => onSelectStage(null)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors cursor-pointer"
            >
              <Filter className="w-3 h-3" />
              <span>Clear Stage Filter (Stage {String(selectedStage).padStart(2, '0')})</span>
            </button>
          ) : (
            <span className="text-slate-400 font-medium">Click any stage to filter work queue</span>
          )}
        </div>
      </div>

      {/* 15-Stage Horizontal Board */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {CANONICAL_15_STEPS.map((stepDef) => {
            const num = stepDef.stepNumber;
            const metrics = stageMetrics[num] || {
              stepNumber: num,
              totalCount: 0,
              awaitingActionCount: 0,
              blockedCount: 0,
              overdueCount: 0,
              oldestAgeHours: 0,
            };

            const isSelected = selectedStage === num;
            const hasItems = metrics.totalCount > 0;
            const hasBlocker = metrics.blockedCount > 0;
            const isHumanGate = num === 2 || num === 7 || num === 9;

            let statusBorder = 'border-slate-200 hover:border-slate-300';
            let headerBg = 'bg-slate-50 text-slate-700';

            if (isSelected) {
              statusBorder = 'border-indigo-600 ring-2 ring-indigo-500 shadow-sm';
              headerBg = 'bg-indigo-600 text-white';
            } else if (hasBlocker) {
              statusBorder = 'border-rose-300 hover:border-rose-400 bg-rose-50/20';
              headerBg = 'bg-rose-100 text-rose-800';
            } else if (hasItems) {
              statusBorder = 'border-indigo-200 hover:border-indigo-300 bg-indigo-50/10';
              headerBg = 'bg-indigo-50 text-indigo-800';
            }

            return (
              <button
                key={num}
                type="button"
                onClick={() => onSelectStage(isSelected ? null : num)}
                className={`flex-none w-[138px] flex flex-col justify-between text-left rounded-xl border bg-white p-2.5 transition-all cursor-pointer ${statusBorder}`}
              >
                {/* Stage Header */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${headerBg}`}
                    >
                      {String(num).padStart(2, '0')}
                    </span>
                    {isHumanGate && (
                      <span
                        title="GAR-02 Mandatory Human Verification Gate"
                        className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800 border border-amber-200"
                      >
                        GATE
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">
                    {stepDef.shortLabel}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {stepDef.responsibleRole.split('/')[0]}
                  </div>
                </div>

                {/* Metrics Center */}
                <div className="my-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                      Count
                    </span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        hasItems ? 'text-slate-900' : 'text-slate-300'
                      }`}
                    >
                      {metrics.totalCount}
                    </span>
                  </div>

                  {/* Contextual Badges */}
                  <div className="mt-1 flex flex-col gap-1 text-[10px]">
                    {metrics.awaitingActionCount > 0 && (
                      <span className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded font-medium truncate">
                        {metrics.awaitingActionCount} awaiting
                      </span>
                    )}
                    {metrics.blockedCount > 0 && (
                      <span className="text-rose-700 bg-rose-50 px-1 py-0.5 rounded font-medium truncate">
                        {metrics.blockedCount} blocked
                      </span>
                    )}
                    {metrics.overdueCount > 0 && (
                      <span className="text-orange-700 bg-orange-50 px-1 py-0.5 rounded font-medium truncate">
                        {metrics.overdueCount} overdue
                      </span>
                    )}
                    {metrics.totalCount === 0 && (
                      <span className="text-slate-300 text-[10px] italic">Queue clear</span>
                    )}
                  </div>
                </div>

                {/* Footer age indicator */}
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Age</span>
                  <span>
                    {metrics.oldestAgeHours > 0
                      ? metrics.oldestAgeHours < 24
                        ? `${Math.round(metrics.oldestAgeHours)}h`
                        : `${Math.round(metrics.oldestAgeHours / 24)}d`
                      : '—'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottleneck Watchlist & Operational Guidance */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Bottleneck Watchlist:
          </span>
          {rankedBottlenecks.length > 0 ? (
            <div className="flex items-center gap-2">
              {rankedBottlenecks.map((b) => {
                const step = CANONICAL_15_STEPS.find((s) => s.stepNumber === b.stepNumber);
                return (
                  <button
                    key={b.stepNumber}
                    type="button"
                    onClick={() => onSelectStage(b.stepNumber)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium cursor-pointer"
                  >
                    <span>
                      {String(b.stepNumber).padStart(2, '0')} {step?.shortLabel || 'Stage'}
                    </span>
                    <span className="font-mono font-bold text-amber-700">({b.totalCount})</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="text-slate-500 text-xs italic">
              Zero stage bottlenecks detected. Flow cadence is optimal across all 15 stages.
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Ranking: High volume queue, aging duration &gt; 24h, or blocked status
        </div>
      </div>
    </div>
  );
};
