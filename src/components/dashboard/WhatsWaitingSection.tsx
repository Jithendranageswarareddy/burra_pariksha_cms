import React from 'react';
import { FileCheck, Scissors, Film, CheckSquare, UploadCloud, ArrowUpRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../design-system/components/Card';
import { Badge } from '../../design-system/components/Badge';
import { UserRole } from '../../types';

export interface WaitingCounts {
  questionsToReview: number;
  scriptsToReview: number;
  videosToEdit: number;
  socialReviews: number;
  readyToPublish: number;
}

export interface WhatsWaitingSectionProps {
  counts: WaitingCounts;
  userRole?: string | UserRole;
  isLoading?: boolean;
}

export const WhatsWaitingSection: React.FC<WhatsWaitingSectionProps> = ({
  counts,
  userRole,
  isLoading = false,
}) => {
  const isAuthorizedForSocialReviews = () => {
    if (!userRole) return false;
    const allowed = [
      UserRole.ADMIN,
      'ADMIN',
      UserRole.CONTENT_MANAGER,
      'CONTENT_MANAGER',
      UserRole.REVIEWER,
      'REVIEWER',
      UserRole.TOPIC_LEAD,
      'TOPIC_LEAD',
    ];
    return allowed.includes(userRole as any);
  };

  const stages = [
    {
      id: 'gauge-questions-review',
      label: 'Questions in Review',
      count: counts.questionsToReview,
      icon: FileCheck,
      targetUrl: '/questions?status=GENERATED',
      authorized: true,
      description: 'Candidate verification & approval',
      colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      pillClass: 'bg-emerald-500 text-white',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      dotColor: 'bg-emerald-500',
    },
    {
      id: 'gauge-scripts-review',
      label: 'Ready for Teleprompter',
      count: counts.scriptsToReview,
      icon: CheckSquare,
      targetUrl: '/production?status=SCRIPT_READY',
      authorized: true,
      description: 'Presenter teleprompter scripts',
      colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
      pillClass: 'bg-amber-500 text-white',
      badgeBg: 'bg-amber-100 text-amber-800',
      dotColor: 'bg-amber-500',
    },
    {
      id: 'gauge-videos-edit',
      label: 'Videos in Editing',
      count: counts.videosToEdit,
      icon: Scissors,
      targetUrl: '/production?status=EDITING',
      authorized: true,
      description: 'Raw recorded footage editing',
      colorClass: 'text-purple-700 bg-purple-50 border-purple-200',
      pillClass: 'bg-purple-500 text-white',
      badgeBg: 'bg-purple-100 text-purple-800',
      dotColor: 'bg-purple-500',
    },
    {
      id: 'gauge-social-reviews',
      label: 'Social Reviews Pending',
      count: counts.socialReviews,
      icon: Film,
      targetUrl: '/social-review',
      authorized: isAuthorizedForSocialReviews(),
      description: 'Preview simulation & copy checks',
      colorClass: 'text-blue-700 bg-blue-50 border-blue-200',
      pillClass: 'bg-blue-500 text-white',
      badgeBg: 'bg-blue-100 text-blue-800',
      dotColor: 'bg-blue-500',
    },
    {
      id: 'gauge-ready-publish',
      label: 'Ready for Publishing',
      count: counts.readyToPublish,
      icon: UploadCloud,
      targetUrl: '/publishing',
      authorized: true,
      description: 'Final packages ready for release',
      colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      pillClass: 'bg-indigo-600 text-white',
      badgeBg: 'bg-indigo-100 text-indigo-800',
      dotColor: 'bg-indigo-600',
    },
  ];

  const totalInPipeline =
    counts.questionsToReview +
    counts.scriptsToReview +
    counts.videosToEdit +
    counts.socialReviews +
    counts.readyToPublish;

  return (
    <section id="dashboard-pipeline-gauge-section" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Content Pipeline Overview</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200">
              {totalInPipeline} Active Items
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time workload tracking across production stages
          </p>
        </div>
      </div>

      {/* Connected 5-Stage Pipeline Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const hasItems = stage.count > 0;

            if (isLoading) {
              return (
                <div
                  key={stage.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 animate-pulse space-y-3"
                >
                  <div className="h-4 w-20 bg-slate-200 rounded" />
                  <div className="h-8 w-12 bg-slate-200 rounded" />
                  <div className="h-3 w-28 bg-slate-100 rounded" />
                </div>
              );
            }

            const itemCard = (
              <div
                className={`p-3.5 sm:p-4 rounded-xl border transition-all h-full flex flex-col justify-between relative group ${
                  hasItems
                    ? `${stage.colorClass} shadow-2xs hover:shadow-xs`
                    : 'bg-slate-50/50 border-slate-200/70 text-slate-400'
                }`}
              >
                <div>
                  {/* Stage Top: Icon & Count */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="p-1.5 rounded-lg bg-white/80 border border-current/20">
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono text-xl font-black ${
                          hasItems ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {stage.count}
                      </span>
                    </div>
                  </div>

                  {/* Stage Label & Details */}
                  <div className="space-y-1">
                    <h3
                      className={`text-xs font-bold leading-tight ${
                        hasItems ? 'text-slate-900' : 'text-slate-600'
                      }`}
                    >
                      {stage.label}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Action / Status */}
                <div className="mt-3 pt-2 border-t border-current/10 flex items-center justify-between text-[11px]">
                  {hasItems ? (
                    stage.authorized ? (
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-700 group-hover:underline">
                        <span>Open Stage</span>
                        <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Restricted</span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>Pipeline Clear</span>
                    </span>
                  )}
                </div>
              </div>
            );

            if (hasItems && stage.authorized) {
              return (
                <Link
                  key={stage.id}
                  to={stage.targetUrl}
                  id={`${stage.id}-link`}
                  className="block h-full group focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded-xl"
                  aria-label={`${stage.label}: ${stage.count} waiting items. Open queue.`}
                >
                  {itemCard}
                </Link>
              );
            }

            return (
              <div key={stage.id} className="h-full">
                {itemCard}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
