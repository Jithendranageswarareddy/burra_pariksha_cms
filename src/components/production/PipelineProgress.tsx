import React from 'react';
import { VideoProductionStatus } from '../../types';
import { VIDEO_STATUS_CONFIG } from '../../config/constants';

interface PipelineProgressProps {
  currentStatus: VideoProductionStatus;
  compact?: boolean;
}

const ORDERED_STAGES = [
  VideoProductionStatus.QUEUED,
  VideoProductionStatus.SCRIPT_READY,
  VideoProductionStatus.RECORDING,
  VideoProductionStatus.EDITING,
  VideoProductionStatus.FINAL_REVIEW,
  VideoProductionStatus.READY_TO_UPLOAD,
  VideoProductionStatus.UPLOADED,
];

export const PipelineProgress: React.FC<PipelineProgressProps> = ({
  currentStatus,
  compact = false,
}) => {
  const currentStepNum = VIDEO_STATUS_CONFIG[currentStatus]?.step ?? 0;

  if (compact) {
    return (
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(10, (currentStepNum / 10) * 100))}%` }}
        />
      </div>
    );
  }

  return (
    <div className="w-full py-3">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
        {ORDERED_STAGES.map((stage) => {
          const config = VIDEO_STATUS_CONFIG[stage];
          const isDone = currentStepNum > config.step;
          const isCurrent = currentStatus === stage || (stage === VideoProductionStatus.SCRIPT_READY && currentStatus === VideoProductionStatus.SCRIPT_REQUIRED);

          return (
            <div key={stage} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100 scale-110'
                    : isDone
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-slate-400 border-slate-300'
                }`}
              >
                {isDone ? '✓' : config.step}
              </div>
              <span
                className={`mt-1.5 text-[10px] font-medium tracking-tight whitespace-nowrap text-center ${
                  isCurrent
                    ? 'text-indigo-700 font-bold'
                    : isDone
                    ? 'text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
