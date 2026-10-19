import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Shield,
  Plus,
  CheckCircle2,
  ListTodo,
  FolderGit2,
  Database,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AuditLog, UserRole } from '../../../shared';

interface RecentActivityPanelProps {
  logs: AuditLog[];
  userRole?: UserRole | string;
  continueItemUrl?: string;
  continueItemTitle?: string;
  isLoading?: boolean;
}

export const RecentActivityPanel: React.FC<RecentActivityPanelProps> = ({
  logs,
  userRole,
  continueItemUrl,
  continueItemTitle,
  isLoading = false,
}) => {
  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      const now = Date.now();
      const diffMs = now - d.getTime();
      const diffMins = Math.round(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.round(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString();
    } catch {
      return ts;
    }
  };

  const formatAction = (action: string) => {
    if (!action) return 'Action';
    const clean = action.replace(/_/g, ' ').toLowerCase();
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const getActionBadgeClass = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('APPROVE') || act.includes('VERIFIED')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('TRANSITION') || act.includes('ADVANCE') || act.includes('STAGE')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (act.includes('REJECT') || act.includes('CHANGE')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (act.includes('CREATE') || act.includes('GENERATE')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatDetails = (rawDetails?: string) => {
    if (!rawDetails) return '—';
    if (rawDetails.startsWith('{') || rawDetails.startsWith('[')) {
      try {
        const parsed = JSON.parse(rawDetails);
        if (parsed.message) return parsed.message;
        if (parsed.reason) return parsed.reason;
        if (parsed.note) return parsed.note;
        if (parsed.stage) return `Stage updated to ${parsed.stage}`;
        return 'Workflow mutation logged';
      } catch {
        return rawDetails;
      }
    }
    return rawDetails;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left 8 cols: Recent Activity & Audit Trail Table */}
      <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Recent Activity &amp; Authoritative Audit Trail
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Immutable Ledger
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2 px-2.5 w-24">Time</th>
                  <th className="py-2 px-2.5 w-32">Action</th>
                  <th className="py-2 px-2.5 w-32">Entity</th>
                  <th className="py-2 px-2.5 w-36">Actor</th>
                  <th className="py-2 px-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-2.5 px-2.5"><div className="h-3.5 bg-slate-200 rounded w-16" /></td>
                      <td className="py-2.5 px-2.5"><div className="h-3.5 bg-slate-200 rounded w-20" /></td>
                      <td className="py-2.5 px-2.5"><div className="h-3.5 bg-slate-200 rounded w-24" /></td>
                      <td className="py-2.5 px-2.5"><div className="h-3.5 bg-slate-200 rounded w-20" /></td>
                      <td className="py-2.5 px-2.5"><div className="h-3.5 bg-slate-200 rounded w-32" /></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No recent audit events recorded. Operational mutations and workflow transitions will appear here in real time.
                    </td>
                  </tr>
                ) : (
                  logs.slice(0, 6).map((log) => {
                    const actorDisplay = log.actorName || log.actorId || (log as any).actor?.name || 'System';
                    const displayDetails = formatDetails(log.details);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors text-xs">
                        <td className="py-2 px-2.5 text-slate-500 font-mono whitespace-nowrap">
                          {formatTime(log.timestamp)}
                        </td>
                        <td className="py-2 px-2.5 font-semibold text-slate-800">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getActionBadgeClass(log.action)}`}>
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 font-mono text-[11px] truncate max-w-[120px]">
                          {log.entityType ? `${log.entityType}:${log.entityId?.substring(0, 8) || ''}` : log.entityId || '—'}
                        </td>
                        <td className="py-2 px-2.5 text-slate-600 truncate max-w-[130px]">
                          {actorDisplay}
                        </td>
                        <td className="py-2 px-2.5 text-slate-500 truncate max-w-[200px]" title={log.details}>
                          {displayDetails}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Authoritative source: Firestore `audit_logs` collection</span>
          <Link to="/audit-logs" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Full Audit Logs →
          </Link>
        </div>
      </div>

      {/* Right 4 cols: Executive Quick Actions Bar */}
      <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Executive Quick Actions
            </h3>
            <span className="text-xs text-slate-400 font-medium">Role: {userRole || 'ADMIN'}</span>
          </div>

          <div className="space-y-2">
            <Link
              to="/studio"
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-xs shadow-2xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Create New Production Draft</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 opacity-80" />
            </Link>

            {continueItemUrl && (
              <Link
                to={continueItemUrl}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 text-xs font-semibold transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Clock className="w-3.5 h-3.5 text-amber-700 flex-none" />
                  <span className="truncate">Resume: {continueItemTitle || 'Active Task'}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-amber-700 flex-none" />
              </Link>
            )}

            <Link
              to="/questions"
              className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Verification Queue (Stage 02)</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">→</span>
            </Link>

            <Link
              to="/videos"
              className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <ListTodo className="w-3.5 h-3.5 text-blue-600" />
                <span>Production Workflows &amp; Studio</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">→</span>
            </Link>

            <Link
              to="/publishing"
              className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Multi-Platform Publishing Setup</span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">→</span>
            </Link>

            {userRole === UserRole.ADMIN && (
              <Link
                to="/recovery"
                className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-purple-600" />
                  <span>System Administration &amp; Recovery</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">→</span>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          All routes backed by canonical backend authorization
        </div>
      </div>
    </div>
  );
};
