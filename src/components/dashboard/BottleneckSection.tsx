import React from 'react';
import { AlertOctagon, TrendingUp, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BottleneckStage } from '../../types';

interface BottleneckSectionProps {
  bottlenecks: BottleneckStage[];
}

export const BottleneckSection: React.FC<BottleneckSectionProps> = ({ bottlenecks }) => {
  const safeBottlenecks = Array.isArray(bottlenecks) ? bottlenecks : [];
  const activeBottleneck = safeBottlenecks.find((b) => b.isBottleneck && b.count > 0);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Pipeline Bottleneck Diagnostics</h3>
          </div>
          {activeBottleneck ? (
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getSeverityBadge(
                activeBottleneck.severity
              )}`}
            >
              Bottleneck: {activeBottleneck.label}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Optimal Flow
            </span>
          )}
        </div>

        {/* Bottleneck Accumulation List */}
        <div className="space-y-2.5">
          {safeBottlenecks.map((stage) => (
            <div
              key={stage.stage}
              className={`p-3 rounded-lg border transition-all ${
                stage.isBottleneck && stage.count > 0
                  ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                  : 'bg-slate-50/50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      stage.isBottleneck && stage.count > 0
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-slate-300'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-800">{stage.label}</span>
                </div>
                <span className="text-xs font-extrabold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {stage.count} items
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                {stage.suggestion}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Link to="/production" className="pt-2">
        <button
          type="button"
          className="w-full py-2 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Unblock in Production Tracker</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </Link>
    </div>
  );
};
