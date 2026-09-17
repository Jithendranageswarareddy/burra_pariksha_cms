import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  FileCheck,
  Video as VideoIcon,
  Scissors,
  Film,
  Check,
} from 'lucide-react';
import { Badge } from '../../design-system/components/Badge';

export interface VideoWorkflowHeaderProps {
  currentStep: 5 | 6 | 7 | 8 | 9;
  videoId?: string;
  videoTitle?: string;
  videoStatus?: string;
  className?: string;
}

interface StepMeta {
  stepNumber: 5 | 6 | 7 | 8 | 9;
  stepCode: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

export const VIDEO_STEPS: StepMeta[] = [
  {
    stepNumber: 5,
    stepCode: '05',
    label: 'Create Script',
    shortLabel: 'Create Script',
    icon: FileText,
    path: '/videos/create-script',
    description: 'AI generation from question & viral hook',
  },
  {
    stepNumber: 6,
    stepCode: '06',
    label: 'Review Script',
    shortLabel: 'Review Script',
    icon: FileCheck,
    path: '/videos/review-script',
    description: 'Teleprompter pacing, revisions & approval',
  },
  {
    stepNumber: 7,
    stepCode: '07',
    label: 'Record Video',
    shortLabel: 'Record Video',
    icon: VideoIcon,
    path: '/videos/record',
    description: 'Speaker teleprompter & raw footage intake',
  },
  {
    stepNumber: 8,
    stepCode: '08',
    label: 'Edit Video',
    shortLabel: 'Edit Video',
    icon: Scissors,
    path: '/videos/edit-video',
    description: 'Motion graphics, sound mix & asset sync',
  },
  {
    stepNumber: 9,
    stepCode: '09',
    label: 'Final Video',
    shortLabel: 'Final Video',
    icon: Film,
    path: '/videos/final-video',
    description: 'Quality signoff & publishing readiness',
  },
];

export const VideoWorkflowHeader: React.FC<VideoWorkflowHeaderProps> = ({
  currentStep,
  videoId,
  videoTitle,
  videoStatus,
  className = '',
}) => {
  const getStepPath = (step: StepMeta): string => {
    if (videoId) {
      switch (step.stepNumber) {
        case 5:
          return `/videos/${encodeURIComponent(videoId)}/create-script`;
        case 6:
          return `/videos/${encodeURIComponent(videoId)}/review-script`;
        case 7:
          return `/videos/${encodeURIComponent(videoId)}/record`;
        case 8:
          return `/videos/${encodeURIComponent(videoId)}/edit-video`;
        case 9:
          return `/videos/${encodeURIComponent(videoId)}/final-video`;
      }
    }
    return step.path;
  };

  return (
    <div
      id="video-workflow-stepper"
      className={`bg-white rounded-xl border border-slate-200/90 shadow-xs p-3 sm:p-4 mb-6 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm" className="font-mono font-semibold">
            PRODUCTION WORKFLOW: STEPS 05–09
          </Badge>
          <span className="text-xs text-slate-500 hidden md:inline">
            From Script Creation to Final Video Review & Signoff
          </span>
        </div>

        {videoId && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Current Video:</span>
            <Link
              to={`/videos/${encodeURIComponent(videoId)}`}
              className="font-mono font-semibold text-indigo-600 hover:underline max-w-[220px] truncate"
              title={videoTitle || videoId}
            >
              {videoId} {videoTitle ? `• ${videoTitle}` : ''}
            </Link>
            {videoStatus && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {videoStatus}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 5-Step Progress Bar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
        {VIDEO_STEPS.map((step) => {
          const isCurrent = step.stepNumber === currentStep;
          const isCompleted = step.stepNumber < currentStep;
          const isUpcoming = step.stepNumber > currentStep;
          const StepIcon = step.icon;
          const targetUrl = getStepPath(step);

          return (
            <Link
              key={step.stepNumber}
              to={targetUrl}
              id={`video-step-pill-${step.stepCode}`}
              className={`relative flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg border transition-all text-left ${
                isCurrent
                  ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400 text-indigo-950 shadow-xs'
                  : isCompleted
                  ? 'bg-emerald-50/40 border-emerald-200 text-emerald-900 hover:bg-emerald-50'
                  : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100/70'
              }`}
            >
              {/* Step indicator number / check badge */}
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.stepCode}
              </div>

              {/* Step details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? 'text-indigo-900 font-bold' : isCompleted ? 'text-emerald-950' : 'text-slate-800'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate hidden xl:block">
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
