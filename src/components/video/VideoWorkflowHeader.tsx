import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Video as VideoIcon,
  Scissors,
  Film,
  Check,
  Share2,
} from 'lucide-react';
import { Badge } from '../../design-system/components/Badge';

export interface VideoWorkflowHeaderProps {
  currentStep: 5 | 6 | 7 | 8 | 9;
  videoId?: string;
  videoTitle?: string;
  videoStatus?: string;
  className?: string;
  onStepSelect?: (stepNumber: 5 | 6 | 7 | 8 | 9) => void;
  activeStageTab?: string;
}

export interface StepMeta {
  stepNumber: 5 | 6 | 7 | 8 | 9;
  stepCode: string;
  label: string;
  shortLabel: string;
  stageKey: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

export const VIDEO_STEPS: StepMeta[] = [
  {
    stepNumber: 5,
    stepCode: '01',
    label: '1. Scripting',
    shortLabel: 'Scripting',
    stageKey: 'script',
    icon: FileText,
    path: '/videos/create-script',
    description: 'AI generation from question & viral hook',
  },
  {
    stepNumber: 6,
    stepCode: '02',
    label: '2. Teleprompter & Filming',
    shortLabel: 'Filming',
    stageKey: 'recording',
    icon: VideoIcon,
    path: '/videos/record',
    description: 'Speaker teleprompter & raw footage intake',
  },
  {
    stepNumber: 7,
    stepCode: '03',
    label: '3. Editing Bay',
    shortLabel: 'Editing',
    stageKey: 'editing',
    icon: Scissors,
    path: '/videos/edit-video',
    description: 'Motion graphics, audio mix & drive link sync',
  },
  {
    stepNumber: 8,
    stepCode: '04',
    label: '4. Final QC Lock',
    shortLabel: 'QC Lock',
    stageKey: 'final-review',
    icon: Film,
    path: '/videos/final-video',
    description: 'Quality signoff & compliance checklist',
  },
  {
    stepNumber: 9,
    stepCode: '05',
    label: '5. Social Packaging & Simulator',
    shortLabel: 'Social & Sim',
    stageKey: 'social',
    icon: Share2,
    path: '/videos/social-packaging',
    description: '9:16 smartphone simulator & one-click copy',
  },
];

export const VideoWorkflowHeader: React.FC<VideoWorkflowHeaderProps> = ({
  currentStep,
  videoId,
  videoTitle,
  videoStatus,
  className = '',
  onStepSelect,
  activeStageTab,
}) => {
  const getStepPath = (step: StepMeta): string => {
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
          <Badge variant="neutral" size="sm" className="font-mono font-semibold">
            BURRA 5-STAGE VIDEO WORKSPACE
          </Badge>
          <span className="text-xs text-slate-500 hidden md:inline">
            End-to-End Shorts Production, Final Review & Social Simulation
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

      {/* Modern 5-Step Pipeline Stepper Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
        {VIDEO_STEPS.map((step) => {
          const isCurrent = activeStageTab
            ? activeStageTab === step.stageKey
            : step.stepNumber === currentStep;
          const isCompleted = step.stepNumber < currentStep;
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
              id={`video-step-pill-${step.stepCode}`}
              className={`relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-all text-left cursor-pointer ${
                isCurrent
                  ? 'bg-indigo-600 border-indigo-600 text-white font-bold ring-2 ring-indigo-300 shadow-sm'
                  : isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/70'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/60'
              }`}
            >
              {/* Step indicator number / check badge */}
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                  isCurrent
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : (
                  step.stepCode
                )}
              </div>

              {/* Step details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <StepIcon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isCurrent
                        ? 'text-indigo-100'
                        : isCompleted
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  />
                  <span
                    className={`text-xs truncate ${
                      isCurrent
                        ? 'text-white font-bold'
                        : isCompleted
                        ? 'text-emerald-900 font-semibold'
                        : 'text-slate-700 font-medium'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                <p
                  className={`text-[10px] truncate hidden xl:block mt-0.5 ${
                    isCurrent ? 'text-indigo-100/90' : 'text-slate-400'
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
  );
};
export default VideoWorkflowHeader;
