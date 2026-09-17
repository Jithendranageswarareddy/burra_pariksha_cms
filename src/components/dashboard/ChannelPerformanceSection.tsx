import React from 'react';
import { Eye, Clock, Percent, ThumbsUp, MessageCircle, Share2, UserPlus, BarChart2, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { SocialAnalyticsSummary } from '../../types';

export interface ChannelPerformanceSectionProps {
  summary: SocialAnalyticsSummary | null;
  isLoading?: boolean;
  isUnavailable?: boolean;
  onTimeRangeChange?: (range: string) => void;
  selectedRange?: string;
}

export const ChannelPerformanceSection: React.FC<ChannelPerformanceSectionProps> = ({
  summary,
  isLoading = false,
  isUnavailable = false,
}) => {
  // Format seconds to human-readable watch time (e.g. 14.5 hrs or 45 mins)
  const formatWatchTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0 hrs';
    if (seconds >= 3600) {
      const hours = (seconds / 3600).toFixed(1);
      return `${hours} hrs`;
    }
    const mins = Math.round(seconds / 60);
    return `${mins} mins`;
  };

  // Format compact numbers (e.g. 1.2k, 45k, 1.2M)
  const formatCompact = (num: number): string => {
    if (num === undefined || num === null) return '—';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <section id="dashboard-performance-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              How is the Channel Performing?
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated cross-platform audience engagement
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="p-4 bg-white border border-slate-200 animate-pulse space-y-2">
              <div className="w-5 h-5 bg-slate-200 rounded" />
              <div className="h-6 w-16 bg-slate-200 rounded" />
              <div className="h-3 w-12 bg-slate-100 rounded" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  // Unavailable or zero records state
  const hasData = summary && summary.totalRecords > 0;

  if (isUnavailable || !summary || !hasData) {
    return (
      <section id="dashboard-performance-section" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              How is the Channel Performing?
            </h2>
            <p className="text-xs text-slate-500">
              Cross-platform analytics across YouTube Shorts, Instagram Reels & Facebook
            </p>
          </div>
        </div>

        <Card id="performance-unavailable-card" className="border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start gap-3.5 max-w-xl">
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                  Performance data isn't available yet.
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Analytics will populate as published shorts, reels, and videos collect view snapshots and engagement metrics.
                </p>
              </div>
            </div>

            <Link to="/social-analytics" id="performance-open-dashboard-btn" className="shrink-0 w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto flex items-center justify-center gap-1.5 font-semibold text-xs">
                <span>Open Performance Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  // 7 Required metrics mapped from authoritative summary
  const metrics = [
    {
      id: 'metric-views',
      label: 'Views',
      value: formatCompact(summary.totalViews),
      subtext: 'Total impressions',
      icon: Eye,
      accent: 'text-indigo-600',
    },
    {
      id: 'metric-watch-time',
      label: 'Watch Time',
      value: formatWatchTime(summary.totalWatchTime),
      subtext: 'Total duration',
      icon: Clock,
      accent: 'text-emerald-600',
    },
    {
      id: 'metric-retention',
      label: 'Retention',
      value: summary.averageRetentionRate ? `${summary.averageRetentionRate}%` : '—',
      subtext: 'Average completion',
      icon: Percent,
      accent: 'text-amber-600',
    },
    {
      id: 'metric-likes',
      label: 'Likes',
      value: formatCompact(summary.totalLikes),
      subtext: 'Reactions',
      icon: ThumbsUp,
      accent: 'text-rose-600',
    },
    {
      id: 'metric-comments',
      label: 'Comments',
      value: formatCompact(summary.totalComments),
      subtext: 'Discussions',
      icon: MessageCircle,
      accent: 'text-sky-600',
    },
    {
      id: 'metric-shares',
      label: 'Shares',
      value: formatCompact(summary.totalShares),
      subtext: 'Virality',
      icon: Share2,
      accent: 'text-violet-600',
    },
    {
      id: 'metric-subscribers',
      label: 'Subscribers',
      value: `+${formatCompact(summary.totalSubscribersGained)}`,
      subtext: 'Net gained',
      icon: UserPlus,
      accent: 'text-teal-600',
    },
  ];

  return (
    <section id="dashboard-performance-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            How is the Channel Performing?
          </h2>
          <p className="text-xs text-slate-500">
            Authoritative performance across {summary.totalRecords} logged social snapshot{summary.totalRecords !== 1 ? 's' : ''}
          </p>
        </div>

        <Link
          to="/social-analytics"
          id="view-all-analytics-link"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 shrink-0"
        >
          <span>Deep Analytics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.id}
              id={m.id}
              className="p-3.5 bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 truncate">
                  {m.label}
                </span>
                <Icon className={`w-3.5 h-3.5 ${m.accent}`} />
              </div>

              <div className="space-y-0.5">
                <div className="font-mono text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {m.value}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {m.subtext}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
