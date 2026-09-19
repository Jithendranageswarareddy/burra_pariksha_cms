import React from 'react';
import {
  BookOpen,
  Zap,
  Workflow,
  Server,
  CheckCircle2,
  Database,
  HardDrive,
  Cpu,
  ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExecutiveVitalsBentoProps {
  totalTopics?: number;
  totalSubtopics?: number;
  saturationPct?: number;
  activeInFlightCount?: number;
  isLoading?: boolean;
}

export const ExecutiveVitalsBento: React.FC<ExecutiveVitalsBentoProps> = ({
  totalTopics = 100,
  totalSubtopics = 100,
  saturationPct = 0,
  activeInFlightCount = 0,
  isLoading = false,
}) => {
  return (
    <div
      id="executive-vitals-bento"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* CARD 1: Curriculum Pool */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Curriculum Pool
            </span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isLoading ? (
                <span className="inline-block w-24 h-7 bg-slate-200 animate-pulse rounded" />
              ) : (
                `${totalTopics} Topics / ${totalSubtopics} Subtopics`
              )}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100">
            <span>{saturationPct}% Saturation</span>
          </span>
          <span className="text-slate-500 font-medium">Ready for Filming</span>
        </div>
      </div>

      {/* CARD 2: Production Velocity */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Production Velocity
            </span>
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Target: &lt; 4 hrs
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Optimal Cadence</span>
          </span>
          <span className="text-slate-500 font-medium">3 Shorts / Day Goal</span>
        </div>
      </div>

      {/* CARD 3: Active Pipeline Items */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Pipeline Items
            </span>
            <div className="text-2xl font-extrabold text-indigo-600 tracking-tight flex items-baseline gap-2">
              {isLoading ? (
                <span className="inline-block w-12 h-7 bg-slate-200 animate-pulse rounded" />
              ) : (
                <span>{activeInFlightCount} Items</span>
              )}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 shrink-0 group-hover:scale-105 transition-transform">
            <Workflow className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">In-Flight Production Queue</span>
          <Link
            to="/production"
            className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5"
          >
            <span>View Tracker</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* CARD 4: Cloud Infrastructure Status */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cloud Infrastructure
            </span>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-emerald-700">All Systems Operational</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 shrink-0 group-hover:scale-105 transition-transform">
            <Server className="w-5 h-5 text-slate-700" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-[11px]">
          <div className="flex items-center gap-1 text-slate-600" title="Google Sheets DB">
            <Database className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate font-medium">Sheets DB</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600" title="Drive Media Storage">
            <HardDrive className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate font-medium">Drive Sync</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600" title="Gemini AI Studio Engine">
            <Cpu className="w-3 h-3 text-emerald-600 shrink-0" />
            <span className="truncate font-medium">Gemini AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
