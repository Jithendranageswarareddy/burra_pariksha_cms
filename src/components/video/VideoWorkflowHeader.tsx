import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Video as VideoIcon,
  UploadCloud,
  Scissors,
  Film,
  Check,
  Share2,
  Image as ImageIcon,
} from 'lucide-react';
import { Badge } from '../../design-system/components/Badge';
import { CANONICAL_15_STEPS } from '../../lib/workflow/canonical-workflow';

export interface VideoWorkflowHeaderProps {
  currentStep: number;
  videoId?: string;
  videoTitle?: string;
  videoStatus?: string;
  className?: string;
  onStepSelect?: (stepNumber: number) => void;
  activeStageTab?: string;
}

export interface VideoStepMeta {
  stepNumber: number;
  stepCode: string;
  label: string;
  shortLabel: string;
  stageKey: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

const STEP_ICONS: Record<number, React.ElementType> = {
  3: FileText,
  4: VideoIcon,
  5: UploadCloud,
  6: Scissors,
  7: Film,
  8: ImageIcon,
  9: Share2,
};

export const VIDEO_STEPS: VideoStepMeta[] = CANONICAL_15_STEPS.filter(
  (s) => s.stepNumber >= 3 && s.stepNumber <= 9
).map((s) => ({
  stepNumber: s.stepNumber,
  stepCode: String(s.stepNumber).padStart(2, '0'),
  label: s.label,
  shortLabel: s.shortLabel,
  stageKey: s.tab || 'script',
  icon: STEP_ICONS[s.stepNumber] || VideoIcon,
  path: s.canonicalRoute,
  description: s.responsibility,
}));

export const VideoWorkflowHeader: React.FC<VideoWorkflowHeaderProps> = ({
  currentStep,
  videoId,
  videoTitle,
  videoStatus,
  className = '',
  onStepSelect,
  activeStageTab,
}) => {
  // Legacy step compatibility mapping (legacy 5->3, 6->4, 7->6, 8->6, 9->7)
  const normalizedStep =
    currentStep === 5 ? 3 :
    currentStep === 6 ? 4 :
    currentStep === 7 ? 6 :
    currentStep === 8 ? 6 :
    currentStep === 9 ? 7 :
    currentStep;

  const getStepPath = (step: VideoStepMeta): string => {
    if (videoId) {
      return `/videos/${encodeURIComponent(videoId)}?tab=${step.stageKey}`;
    }
    return step.path;
  };

  return (
    <div
      id="video-workflow-stepper"
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4 mb-6 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm" className="font-semibold">
            Video Production Stages (03–09)
          </Badge>
          <span className="text-xs text-slate-500 hidden md:inline">
            Canonical script, teleprompter, raw footage, editing bay, QC, thumbnail &amp; social review
          </span>
        </div>

        {videoId && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Video ID:</span>
            <Link
              to={`/videos/${encodeURIComponent(videoId)}`}
              className="font-mono font-bold text-indigo-600 hover:underline max-w-[220px] truncate"
              title={videoTitle || videoId}
            >
              {videoId} {videoTitle ? `• ${videoTitle}` : ''}
            </Link>
            {videoStatus && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {videoStatus}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Canonical Video Production Stepper (Steps 03 to 09) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5">
        {VIDEO_STEPS.map((step) => {
          const isCurrent = activeStageTab
            ? activeStageTab === step.stageKey
            : step.stepNumber === normalizedStep;
          const isCompleted = step.stepNumber < normalizedStep;
          const StepIcon = step.icon;
          const targetUrl = getStepPath(step);

          const handleClick = (e: React.MouseEvent) => {
            if (onStepSelect) {
              e.preventDefault();
              onStepSelect(step.stepNumber);
            }
          };

          return (
            <Link
              key={step.stepNumber}
              to={targetUrl}
              onClick={handleClick}
              className={`relative flex flex-col p-2.5 rounded-xl border transition-all text-left group ${
                isCurrent
                  ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 text-indigo-950 shadow-xs'
                  : isCompleted
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 hover:bg-emerald-50 hover:border-emerald-300'
                  : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100/70 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.stepCode}
                </div>
                <StepIcon
                  className={`w-4 h-4 ${
                    isCurrent
                      ? 'text-indigo-600'
                      : isCompleted
                      ? 'text-emerald-600'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
              </div>

              <span
                className={`text-xs font-bold leading-tight truncate ${
                  isCurrent ? 'text-indigo-950 font-bold' : isCompleted ? 'text-emerald-950' : 'text-slate-800'
                }`}
              >
                {step.shortLabel}
              </span>
              <span className="text-[10px] text-slate-500 truncate mt-0.5 hidden xl:block">
                {step.label.replace(/^\d{2}\s+/, '')}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default VideoWorkflowHeader;
