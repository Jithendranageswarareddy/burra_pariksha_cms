import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  UploadCloud,
  CheckCircle2,
  CheckCheck,
  Check,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { CANONICAL_15_STEPS } from '../../lib/workflow/canonical-workflow';

export interface PublishingWorkflowHeaderProps {
  currentStep: number;
  videoId?: string;
  videoTitle?: string;
  videoStatus?: string;
  questionId?: string;
  className?: string;
}

export interface PublishingStepMeta {
  stepNumber: number;
  stepCode: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

const STEP_ICONS: Record<number, React.ElementType> = {
  10: Calendar,
  11: UploadCloud,
  12: Share2,
};

export const PUBLISHING_STEPS: PublishingStepMeta[] = CANONICAL_15_STEPS.filter(
  (s) => s.stepNumber >= 10 && s.stepNumber <= 12
).map((s) => ({
  stepNumber: s.stepNumber,
  stepCode: String(s.stepNumber).padStart(2, '0'),
  label: s.label,
  shortLabel: s.shortLabel,
  icon: STEP_ICONS[s.stepNumber] || UploadCloud,
  path: s.canonicalRoute,
  description: s.responsibility,
}));

export const PublishingWorkflowHeader: React.FC<PublishingWorkflowHeaderProps> = ({
  currentStep,
  videoId,
  videoTitle,
  videoStatus,
  questionId,
  className = '',
}) => {
  const getStepPath = (step: PublishingStepMeta): string => {
    if (videoId) {
      if (step.stepNumber === 10 || step.stepNumber === 11) {
        return `/videos/${encodeURIComponent(videoId)}?tab=publishing`;
      }
    }
    return step.path;
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ${className}`}>
      {/* Context Banner if Video/Question is Loaded */}
      {(videoId || videoTitle) && (
        <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold shrink-0">
              Distribution Station
            </span>
            {videoId && (
              <span className="text-xs font-mono font-bold text-slate-300 shrink-0">
                {videoId}
              </span>
            )}
            {questionId && (
              <span className="text-xs font-mono text-slate-400 shrink-0">
                [{questionId}]
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

            {/* Link back to Social Review */}
            <Link
              to={videoId ? `/videos/${encodeURIComponent(videoId)}?tab=social` : '/social-review'}
              className="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
              title="Return to Social Review"
            >
              <CheckCheck className="w-3 h-3 text-violet-400" />
              <span>Social Review</span>
            </Link>

            {/* Next Step Shortcut */}
            {currentStep === 10 && (
              <Link
                to={videoId ? `/videos/${encodeURIComponent(videoId)}?tab=publishing` : '/publishing'}
                className="text-[11px] text-emerald-300 hover:text-emerald-200 transition-colors flex items-center gap-1 font-medium"
              >
                <span>Live Release</span>
                <ArrowRight className="w-3 h-3 text-emerald-300" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Steps Flow Bar */}
      <div className="p-3 sm:p-4 bg-slate-50/70">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {PUBLISHING_STEPS.map((step) => {
            const isCurrent = step.stepNumber === currentStep;
            const isPassed = step.stepNumber < currentStep;
            const targetUrl = getStepPath(step);
            const StepIcon = step.icon;

            return (
              <Link
                key={step.stepNumber}
                to={targetUrl}
                className={`relative rounded-xl p-2.5 sm:p-3.5 transition-all flex items-center gap-2 sm:gap-3 border ${
                  isCurrent
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
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
                    <StepIcon className="w-4 h-4" />
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
                        ? 'text-emerald-100'
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

export default PublishingWorkflowHeader;
