import React from 'react';
import { Link } from 'react-router-dom';
import {
  Image as ImageIcon,
  MessageSquare,
  CheckCheck,
  Check,
  Film,
  Share2,
} from 'lucide-react';
import { Badge } from '../../design-system/components/Badge';

export interface AssetWorkflowHeaderProps {
  currentStep: 10 | 11 | 12;
  videoId?: string;
  videoTitle?: string;
  videoStatus?: string;
  questionId?: string;
  className?: string;
}

interface StepMeta {
  stepNumber: 10 | 11 | 12;
  stepCode: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

export const ASSET_STEPS: StepMeta[] = [
  {
    stepNumber: 10,
    stepCode: '10',
    label: 'Create Thumbnail',
    shortLabel: 'Thumbnail',
    icon: ImageIcon,
    path: '/videos/thumbnail',
    description: 'Hook headline, Drive upload & dual-aspect preview',
  },
  {
    stepNumber: 11,
    stepCode: '11',
    label: 'Pinned Comment',
    shortLabel: 'Pinned Comment',
    icon: MessageSquare,
    path: '/videos/pinned-comment',
    description: 'Solution breakdown, challenge question & live preview',
  },
  {
    stepNumber: 12,
    stepCode: '12',
    label: 'Social Review',
    shortLabel: 'Social Review',
    icon: CheckCheck,
    path: '/social-review',
    description: 'Complete social package assembly & editorial signoff',
  },
];

export const AssetWorkflowHeader: React.FC<AssetWorkflowHeaderProps> = ({
  currentStep,
  videoId,
  videoTitle,
  videoStatus,
  questionId,
  className = '',
}) => {
  const getStepPath = (step: StepMeta): string => {
    if (videoId) {
      switch (step.stepNumber) {
        case 10:
          return `/videos/${encodeURIComponent(videoId)}/thumbnail`;
        case 11:
          return `/videos/${encodeURIComponent(videoId)}/pinned-comment`;
        case 12:
          return `/videos/${encodeURIComponent(videoId)}/social-review`;
      }
    }
    if (questionId && step.stepNumber === 12) {
      return `/social-review?questionId=${encodeURIComponent(questionId)}`;
    }
    return step.path;
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      {/* Context Banner if Video/Question is Loaded */}
      {(videoId || videoTitle) && (
        <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/80 font-bold shrink-0">
              SOCIAL ASSET WORKFLOW
            </span>
            {videoId && (
              <span className="text-xs font-mono font-bold text-slate-300 shrink-0">
                {videoId}
              </span>
            )}
            {videoTitle && (
              <span className="text-xs text-slate-200 font-medium truncate max-w-md">
                — {videoTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {videoStatus && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {videoStatus}
              </span>
            )}

            {/* Link back to Step 09 Final Video */}
            {videoId && (
              <Link
                to={`/videos/${encodeURIComponent(videoId)}/final-video`}
                className="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
                title="Return to Step 09 Final Video"
              >
                <Film className="w-3 h-3 text-indigo-400" />
                <span>Step 09 Final Video</span>
              </Link>
            )}

            {/* Link forward to Step 13 Platform Packages */}
            <Link
              to={videoId ? `/videos/${encodeURIComponent(videoId)}/platform-packages` : '/platform-packages'}
              className="text-[11px] text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-1 font-medium"
              title="Proceed to Step 13 Platform Packages"
            >
              <span>Step 13 Platforms</span>
              <Share2 className="w-3 h-3 text-indigo-300" />
            </Link>
          </div>
        </div>
      )}

      {/* Steps Flow Bar */}
      <div className="p-3 sm:p-4 bg-slate-50/70">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {ASSET_STEPS.map((step) => {
            const isCurrent = step.stepNumber === currentStep;
            const isPassed = step.stepNumber < currentStep;
            const Icon = step.icon;
            const targetUrl = getStepPath(step);

            return (
              <Link
                key={step.stepNumber}
                to={targetUrl}
                className={`relative rounded-xl p-2.5 sm:p-3.5 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 border ${
                  isCurrent
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : isPassed
                    ? 'bg-white border-emerald-300 text-slate-800 hover:border-emerald-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Step Number & Icon */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-white/20 text-white font-bold'
                      : isPassed
                      ? 'bg-emerald-100 text-emerald-700 font-bold'
                      : 'bg-slate-100 text-slate-500 font-semibold'
                  }`}
                >
                  {isPassed ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-xs font-mono">{step.stepCode}</span>
                  )}
                </div>

                {/* Step Labels */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold truncate ${
                        isCurrent
                          ? 'text-white'
                          : isPassed
                          ? 'text-emerald-950'
                          : 'text-slate-800'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] hidden sm:block truncate mt-0.5 ${
                      isCurrent
                        ? 'text-indigo-100'
                        : isPassed
                        ? 'text-emerald-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Active Indicator Badge */}
                {isCurrent && (
                  <span className="hidden md:inline-flex text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded uppercase font-mono tracking-wider shrink-0">
                    Active
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default AssetWorkflowHeader;
