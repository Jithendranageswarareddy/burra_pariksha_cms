import React from 'react';
import { Link } from 'react-router-dom';
import {
  Image as ImageIcon,
  CheckCheck,
  Check,
  Film,
  Share2,
  Calendar,
} from 'lucide-react';
import { Badge } from '../../design-system/components/Badge';
import { CANONICAL_15_STEPS } from '../../lib/workflow/canonical-workflow';

export interface AssetWorkflowHeaderProps {
  currentStep: number;
  videoId?: string;
  videoTitle?: string;
  videoStatus?: string;
  questionId?: string;
  className?: string;
}

export interface AssetStepMeta {
  stepNumber: number;
  stepCode: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

const STEP_ICONS: Record<number, React.ElementType> = {
  8: ImageIcon,
  9: CheckCheck,
  10: Calendar,
};

export const ASSET_STEPS: AssetStepMeta[] = CANONICAL_15_STEPS.filter(
  (s) => s.stepNumber >= 8 && s.stepNumber <= 10
).map((s) => ({
  stepNumber: s.stepNumber,
  stepCode: String(s.stepNumber).padStart(2, '0'),
  label: s.label,
  shortLabel: s.shortLabel,
  icon: STEP_ICONS[s.stepNumber] || CheckCheck,
  path: s.canonicalRoute,
  description: s.responsibility,
}));

export const AssetWorkflowHeader: React.FC<AssetWorkflowHeaderProps> = ({
  currentStep,
  videoId,
  videoTitle,
  videoStatus,
  questionId,
  className = '',
}) => {
  const getStepPath = (step: AssetStepMeta): string => {
    if (videoId) {
      switch (step.stepNumber) {
        case 8:
          return `/videos/${encodeURIComponent(videoId)}?tab=thumbnail`;
        case 9:
          return `/videos/${encodeURIComponent(videoId)}?tab=social`;
        case 10:
          return `/videos/${encodeURIComponent(videoId)}?tab=publishing`;
      }
    }
    if (questionId && step.stepNumber === 9) {
      return `/social-review/${encodeURIComponent(questionId)}`;
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
              Social Asset Packaging
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

            {/* Link back to Final QC */}
            {videoId && (
              <Link
                to={`/videos/${encodeURIComponent(videoId)}?tab=final-review`}
                className="text-[11px] text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
                title="Return to Final QC"
              >
                <Film className="w-3 h-3 text-indigo-400" />
                <span>Final QC</span>
              </Link>
            )}

            {/* Link forward to Publishing */}
            <Link
              to={videoId ? `/videos/${encodeURIComponent(videoId)}?tab=publishing` : '/publishing'}
              className="text-[11px] text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-1 font-medium"
              title="Proceed to Publishing Setup"
            >
              <span>Publishing Setup</span>
              <Share2 className="w-3 h-3 text-indigo-300" />
            </Link>
          </div>
        </div>
      )}

      {/* Steps Flow Bar */}
      <div className="p-3 sm:p-4 bg-slate-50/70">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {ASSET_STEPS.map((step) => {
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
                    ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                    : isPassed
                    ? 'bg-white border-emerald-300 text-slate-800 hover:border-emerald-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600 text-white font-bold'
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

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold truncate ${
                        isCurrent
                          ? 'text-indigo-950 font-bold'
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
                        ? 'text-indigo-700'
                        : isPassed
                        ? 'text-emerald-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssetWorkflowHeader;
