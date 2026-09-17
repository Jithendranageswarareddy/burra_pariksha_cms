import React from 'react';
import { FileCheck, Scissors, Film, CheckSquare, UploadCloud, ArrowUpRight, CheckCircle2 } from 'lucide-react';
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

  const categories = [
    {
      id: 'waiting-questions-review',
      label: 'Questions to Review',
      stepNumber: '04',
      count: counts.questionsToReview,
      icon: FileCheck,
      targetUrl: '/questions?status=GENERATED',
      authorized: true,
      description: 'Candidate verification & approval',
    },
    {
      id: 'waiting-scripts-review',
      label: 'Scripts to Review',
      stepNumber: '06',
      count: counts.scriptsToReview,
      icon: CheckSquare,
      targetUrl: '/production?status=SCRIPT_READY',
      authorized: true,
      description: 'Teleprompter scripts ready for signoff',
    },
    {
      id: 'waiting-videos-edit',
      label: 'Videos to Edit',
      stepNumber: '08',
      count: counts.videosToEdit,
      icon: Scissors,
      targetUrl: '/production?status=EDITING',
      authorized: true,
      description: 'Raw recorded footage requiring edit & cuts',
    },
    {
      id: 'waiting-social-reviews',
      label: 'Social Reviews',
      stepNumber: '12',
      count: counts.socialReviews,
      icon: Film,
      targetUrl: '/social-review',
      authorized: isAuthorizedForSocialReviews(),
      description: 'Pre-publish social package evaluation',
    },
    {
      id: 'waiting-ready-publish',
      label: 'Ready to Publish',
      stepNumber: '15',
      count: counts.readyToPublish,
      icon: UploadCloud,
      targetUrl: '/publishing',
      authorized: true,
      description: 'Complete assets queued for distribution',
    },
  ];

  return (
    <section id="dashboard-whats-waiting-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            What's Waiting
          </h2>
          <p className="text-xs text-slate-500">
            Actionable items across the 15-step production pipeline
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const hasWork = cat.count > 0;

          if (isLoading) {
            return (
              <Card
                key={cat.id}
                id={`${cat.id}-loading`}
                className="p-4 bg-white border border-slate-200 animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-200" />
                  <div className="w-8 h-6 bg-slate-200 rounded" />
                </div>
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </Card>
            );
          }

          const cardContent = (
            <Card
              id={cat.id}
              className={`p-4 h-full flex flex-col justify-between transition-all duration-150 border ${
                hasWork
                  ? 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                  : 'border-slate-200/80 bg-slate-50/70 opacity-90'
              }`}
            >
              <div>
                {/* Card Top: Icon & Count Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`p-2 rounded-lg ${
                      hasWork
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasWork ? (
                      <span className="font-mono text-xl font-bold text-slate-900">
                        {cat.count}
                      </span>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        0
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Card Title & Step Ref */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      Step {cat.stepNumber}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight leading-snug">
                    {cat.label}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {cat.description}
                  </p>
                </div>
              </div>

              {/* Bottom Action Hint */}
              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                {hasWork ? (
                  cat.authorized ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                      <span>View queue</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Restricted</span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Clear</span>
                  </span>
                )}
              </div>
            </Card>
          );

          if (hasWork && cat.authorized) {
            return (
              <Link
                key={cat.id}
                to={cat.targetUrl}
                id={`${cat.id}-link`}
                className="block h-full group focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded-xl"
                aria-label={`${cat.label}: ${cat.count} waiting items. Open queue.`}
              >
                {cardContent}
              </Link>
            );
          }

          return (
            <div key={cat.id} className="h-full">
              {cardContent}
            </div>
          );
        })}
      </div>
    </section>
  );
};
