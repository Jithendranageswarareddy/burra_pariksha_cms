import React from 'react';
import { AuditLog } from '../../types';
import {
  Activity,
  Clock,
  ShieldCheck,
  FileCode2,
  Video,
  Film,
  UploadCloud,
} from 'lucide-react';

interface RecentAuditFeedProps {
  logs: AuditLog[];
  isLoading?: boolean;
}

export const RecentAuditFeed: React.FC<RecentAuditFeedProps> = ({
  logs = [],
  isLoading = false,
}) => {
  // Helper to format time ago
  const formatTimeAgo = (timestamp?: string) => {
    if (!timestamp) return 'recently';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'recently';

    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Map action icon
  const getActionIcon = (action?: string, entityType?: string) => {
    if (entityType === 'QUESTION' || action?.includes('QUESTION')) return FileCode2;
    if (entityType === 'SCRIPT' || action?.includes('SCRIPT')) return Video;
    if (entityType === 'VIDEO' || action?.includes('VIDEO')) return Film;
    if (entityType === 'PUBLISHING' || action?.includes('PUBLISH')) return UploadCloud;
    return ShieldCheck;
  };

  // Display top 5 latest logs
  const displayLogs = (logs || []).slice(0, 5);

  return (
    <div
      id="recent-audit-feed-container"
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Recent Activity & Executive Audit Trail
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-medium">
            Latest 5 Events
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">Immutable Log</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : displayLogs.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {displayLogs.map((log) => {
            const Icon = getActionIcon(log.action, log.entityType);
            const nameToUse = log.actorName || log.actorId || 'System Producer';
            const userInitial = nameToUse.charAt(0).toUpperCase();

            return (
              <div
                key={log.id || log.timestamp}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition-colors text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* User Avatar */}
                  <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 font-extrabold flex items-center justify-center shrink-0">
                    {userInitial}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 font-medium text-slate-900 truncate">
                      <span className="font-bold">{nameToUse}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-indigo-600 font-mono font-semibold">{log.action || 'MUTATION'}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[10px] text-slate-700">
                        {log.entityType || 'ENTITY'}#{log.entityId || 'SYS'}
                      </span>
                      {log.details && (
                        <span className="truncate">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time Ago Badge */}
                <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100/80 px-2 py-1 rounded-md border border-slate-200/60">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{formatTimeAgo(log.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Audit Trail Ready</p>
          <p>Recent operations will log here automatically as you create and approve content.</p>
        </div>
      )}
    </div>
  );
};
