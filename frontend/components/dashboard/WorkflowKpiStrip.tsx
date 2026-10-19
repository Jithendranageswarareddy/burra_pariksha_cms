import React from 'react';
import {
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

export interface WorkflowKpiData {
  inProductionCount: number;
  awaitingMyActionCount: number;
  blockedCount: number;
  overdueCount: number;
  publishedTodayCount: number;
  publishedThisWeekCount: number;
  weeklyTarget: number;
  approvalQueueCount: number;
}

interface WorkflowKpiStripProps {
  data: WorkflowKpiData;
  isLoading?: boolean;
  activeFilter?: string | null;
  onSelectFilter: (filterKey: string | null) => void;
}

export const WorkflowKpiStrip: React.FC<WorkflowKpiStripProps> = ({
  data,
  isLoading = false,
  activeFilter,
  onSelectFilter,
}) => {
  const cards = [
    {
      id: 'IN_PRODUCTION',
      label: 'In Production',
      value: data.inProductionCount,
      subtext: 'Active pipeline stages (01-10)',
      icon: Layers,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50/70',
      borderColor: 'border-indigo-200/80',
      activeRing: 'ring-2 ring-indigo-500 shadow-md',
      tag: 'Pipeline WIP',
    },
    {
      id: 'AWAITING_MY_ACTION',
      label: 'Awaiting My Action',
      value: data.awaitingMyActionCount,
      subtext: 'Assigned to your role / user',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/70',
      borderColor: 'border-amber-200/80',
      activeRing: 'ring-2 ring-amber-500 shadow-md',
      tag: 'Action Needed',
    },
    {
      id: 'BLOCKED_OVERDUE',
      label: 'Blocked / Overdue',
      value: data.blockedCount + data.overdueCount,
      subtext: `${data.blockedCount} blocked • ${data.overdueCount} overdue (>48h)`,
      icon: AlertTriangle,
      color: data.blockedCount + data.overdueCount > 0 ? 'text-rose-600' : 'text-slate-600',
      bgColor: data.blockedCount + data.overdueCount > 0 ? 'bg-rose-50/70' : 'bg-slate-50/70',
      borderColor: data.blockedCount + data.overdueCount > 0 ? 'border-rose-200/80' : 'border-slate-200/80',
      activeRing: 'ring-2 ring-rose-500 shadow-md',
      tag: data.blockedCount > 0 ? 'Critical' : 'Attention',
    },
    {
      id: 'APPROVAL_QUEUE',
      label: 'Approval Queue',
      value: data.approvalQueueCount,
      subtext: 'Stages 02, 07, 09 Human Gates',
      icon: ShieldAlert,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50/70',
      borderColor: 'border-violet-200/80',
      activeRing: 'ring-2 ring-violet-500 shadow-md',
      tag: 'GAR-02 Gate',
    },
    {
      id: 'PUBLISHED_TODAY',
      label: 'Published Today',
      value: data.publishedTodayCount,
      subtext: 'Confirmed releases today',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50/70',
      borderColor: 'border-emerald-200/80',
      activeRing: 'ring-2 ring-emerald-500 shadow-md',
      tag: 'Live Releases',
    },
    {
      id: 'WEEKLY_OUTPUT',
      label: 'Weekly Output',
      value: data.publishedThisWeekCount,
      subtext: `Cadence target: ${data.weeklyTarget}/wk`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50/70',
      borderColor: 'border-blue-200/80',
      activeRing: 'ring-2 ring-blue-500 shadow-md',
      tag: `${Math.round((data.publishedThisWeekCount / (data.weeklyTarget || 1)) * 100)}% Cadence`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter(isSelected ? null : card.id)}
            className={`flex flex-col justify-between text-left p-3.5 rounded-xl border bg-white transition-all cursor-pointer ${
              isSelected
                ? `${card.borderColor} ${card.activeRing}`
                : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bgColor} ${card.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1">
              {isLoading ? (
                <div className="h-7 w-12 bg-slate-200/70 rounded animate-pulse" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-slate-900 text-white'
                        : `${card.bgColor} ${card.color}`
                    }`}
                  >
                    {card.tag}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-1 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate">{card.subtext}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
