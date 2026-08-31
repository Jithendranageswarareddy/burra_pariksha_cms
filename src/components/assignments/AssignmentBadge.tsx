import React from 'react';
import { AssignmentStatus, PriorityLevel } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, PlayCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: AssignmentStatus | string;
  size?: 'sm' | 'md';
}

export const AssignmentStatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = (status || '').toUpperCase();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  switch (s) {
    case AssignmentStatus.ASSIGNED:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
          <Clock className="w-3 h-3 text-blue-500" />
          <span>Assigned</span>
        </span>
      );
    case AssignmentStatus.IN_PROGRESS:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
          <PlayCircle className="w-3 h-3 text-amber-500" />
          <span>In Progress</span>
        </span>
      );
    case AssignmentStatus.BLOCKED:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <AlertCircle className="w-3 h-3 text-rose-500" />
          <span>Blocked</span>
        </span>
      );
    case AssignmentStatus.COMPLETED:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Completed</span>
        </span>
      );
    case AssignmentStatus.CANCELLED:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
          <XCircle className="w-3 h-3 text-slate-400" />
          <span>Cancelled</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <span>{status}</span>
        </span>
      );
  }
};

interface PriorityBadgeProps {
  priority: PriorityLevel | string;
  size?: 'sm' | 'md';
}

export const AssignmentPriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const p = (priority || 'NORMAL').toUpperCase();
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-xs font-medium';

  switch (p) {
    case 'URGENT':
      return (
        <span className={`inline-flex items-center gap-1 rounded bg-rose-100 text-rose-800 font-semibold border border-rose-200 ${sizeClasses}`}>
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>Urgent</span>
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center gap-1 rounded bg-amber-100 text-amber-800 font-medium border border-amber-200 ${sizeClasses}`}>
          <span>High</span>
        </span>
      );
    case 'NORMAL':
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center gap-1 rounded bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <span>Normal</span>
        </span>
      );
    case 'LOW':
      return (
        <span className={`inline-flex items-center gap-1 rounded bg-slate-50 text-slate-500 border border-slate-200 ${sizeClasses}`}>
          <span>Low</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded bg-slate-100 text-slate-700 ${sizeClasses}`}>
          <span>{priority}</span>
        </span>
      );
  }
};
