import React from 'react';
import { RefreshCw, Shield, User as UserIcon } from 'lucide-react';
import { Button } from '../../design-system/components/Button';
import { User } from '../../../shared';

interface CommandCenterHeaderProps {
  user: User | null;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  totalInFlightCount: number;
}

export const CommandCenterHeader: React.FC<CommandCenterHeaderProps> = ({
  user,
  lastUpdated,
  isRefreshing,
  onRefresh,
  totalInFlightCount,
}) => {
  const formatTime = (d: Date | null) => {
    if (!d) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl border border-slate-800 shadow-md p-3.5 flex flex-wrap items-center justify-between gap-3">
      {/* Title & Pipeline Badge */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
          BP
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold tracking-tight text-white uppercase">
              Production Command Center
            </h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE OPERATIONS
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
            <span>Executive Workflow Orchestrator</span>
            <span>•</span>
            <span className="text-slate-300 font-mono font-medium">
              {totalInFlightCount} in-flight items
            </span>
          </div>
        </div>
      </div>

      {/* Center Operational Indicator: Clear, non-redundant metadata */}
      <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 bg-slate-800/60 px-3.5 py-1.5 rounded-lg border border-slate-700/60">
        <span className="font-semibold text-slate-200">15-Stage Lifecycle</span>
        <span className="text-slate-600">•</span>
        <span>Authoritative Firestore Engine</span>
        <span className="text-slate-600">•</span>
        <span className="text-emerald-400 font-mono text-[11px]">Synchronized</span>
      </div>

      {/* Right Controls: User info & Refresh Button */}
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold border border-slate-700">
            {user?.name?.substring(0, 2).toUpperCase() || 'SA'}
          </div>
          <div className="hidden sm:block text-right">
            <div className="font-semibold text-slate-200 text-xs truncate max-w-[140px]">
              {user?.name || user?.email || 'System Admin'}
            </div>
            <div className="text-[10px] text-indigo-400 font-mono">
              {user?.role || 'ADMIN'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
          <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
            ({formatTime(lastUpdated)})
          </span>
        </button>
      </div>
    </div>
  );
};
