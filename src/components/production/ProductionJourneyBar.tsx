/**
 * BURRA PARIKSHA CMS - Production Journey Bar
 * Phase 1: Production Journey Orchestration Architecture
 * 
 * Compact 15-stage horizontal stepper with stateful tracking,
 * blocked stage prerequisite tooltips, and an intelligent "Next Action" button.
 */

import React, { useState } from 'react';
import {
  Check,
  Lock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useProductionJourney, JourneyStage } from '../../contexts/ProductionJourneyContext';

export interface ProductionJourneyBarProps {
  className?: string;
  onNavigateTab?: (tab: string) => void;
  showDetails?: boolean;
  activeStage?: string;
}

export const ProductionJourneyBar: React.FC<ProductionJourneyBarProps> = ({
  className = '',
  onNavigateTab,
  showDetails = false,
  activeStage,
}) => {
  const {
    currentStage,
    stages,
    nextAction,
    advanceToNextStage,
    jumpToStage,
    reloadJourneyData,
    isLoading,
    contentMasterId,
    questionId,
    videoId,
  } = useProductionJourney();

  const [activeTooltipStage, setActiveTooltipStage] = useState<number | null>(null);

  const stageCodeToNumber: Record<string, number> = {
    QUESTION: 1,
    VERIFICATION: 2,
    AUDIENCE_SCRIPT: 3,
    SCRIPTING: 3,
    TELEPROMPTER: 4,
    RAW_VIDEO: 5,
    EDITING: 6,
    FINAL_QC: 7,
    THUMBNAIL: 8,
    SOCIAL_REVIEW: 9,
    SOCIAL_SIMULATOR: 9,
    PINNED_COMMENT: 9,
    PUBLISHING_SETUP: 10,
    PUBLISHING: 10,
    PUBLISHED: 11,
    PLATFORM_SYNC: 12,
    ANALYTICS: 13,
    PERFORMANCE_REVIEW: 14,
    INSIGHTS: 15,
  };

  const effectiveCurrentStage =
    activeStage && stageCodeToNumber[activeStage]
      ? stageCodeToNumber[activeStage]
      : currentStage;

  const handleStageClick = (stage: JourneyStage) => {
    if (stage.isBlocked) {
      setActiveTooltipStage(stage.stageNumber);
      return;
    }

    if (onNavigateTab && stage.tab) {
      onNavigateTab(stage.tab);
    } else {
      jumpToStage(stage.stageNumber);
    }
  };

  const handleNextActionClick = () => {
    if (onNavigateTab && nextAction?.tab) {
      onNavigateTab(nextAction.tab);
    }
    advanceToNextStage();
  };

  const activeStageObj = stages.find((s) => s.stageNumber === effectiveCurrentStage) || stages[0];

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2.5 sm:p-3 space-y-2 ${className}`}>
      {/* Top Header: Current Stage Prominence & Context Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
            <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Production Journey</span>
          </div>

          <span className="text-slate-300 hidden sm:inline">•</span>

          {/* Active Stage Indicator */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span>Stage {String(effectiveCurrentStage).padStart(2, '0')} / 15: {activeStageObj.label}</span>
          </div>

          {/* Next Stage Context Pill */}
          {stages.find((s) => s.stageNumber === effectiveCurrentStage + 1) && (
            <span className="text-[11px] text-slate-500 hidden md:inline-flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
              <span className="text-slate-400">Next:</span>
              <span className="text-slate-700 font-semibold">{stages.find((s) => s.stageNumber === effectiveCurrentStage + 1)?.shortLabel}</span>
            </span>
          )}

          {/* Canonical correlation identifiers */}
          <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
            {contentMasterId && (
              <span className="bg-slate-50 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                Master: {contentMasterId}
              </span>
            )}
            {questionId && (
              <span className="bg-slate-50 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                Q: {questionId}
              </span>
            )}
            {videoId && (
              <span className="bg-slate-50 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                V: {videoId}
              </span>
            )}
          </div>
        </div>

        {/* Right Header Actions: Reload Journey Data */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => reloadJourneyData()}
            disabled={isLoading}
            title="Reload Journey State"
            className="p-1 rounded-md border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 15 UI Stages Horizontal Stepper Track */}
      <div className="relative overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        <div className="flex items-center min-w-[900px] px-0.5 py-0.5">
          {stages.map((stage, index) => {
            const isLast = index === stages.length - 1;
            const isTooltipOpen = activeTooltipStage === stage.stageNumber;
            const isNodeCurrent = stage.stageNumber === effectiveCurrentStage;
            const isNodeNext = stage.stageNumber === effectiveCurrentStage + 1;

            return (
              <React.Fragment key={stage.id}>
                {/* Stage Node */}
                <div
                  className="relative flex flex-col items-center group cursor-pointer"
                  onMouseEnter={() => setActiveTooltipStage(stage.stageNumber)}
                  onMouseLeave={() => setActiveTooltipStage(null)}
                  onClick={() => handleStageClick(stage)}
                >
                  {/* Circle Indicator */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all select-none ${
                      isNodeCurrent
                        ? 'bg-indigo-600 text-white border-2 border-white ring-3 ring-indigo-200 scale-110 shadow-xs z-10'
                        : isNodeNext
                        ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-400 font-bold hover:bg-indigo-100'
                        : stage.isCompleted
                        ? 'bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-700'
                        : stage.isBlocked
                        ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-70'
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300 hover:text-slate-600'
                    }`}
                  >
                    {stage.isCompleted ? (
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    ) : stage.isBlocked ? (
                      <Lock className="w-2.5 h-2.5 text-slate-300" />
                    ) : (
                      String(stage.stageNumber).padStart(2, '0')
                    )}
                  </div>

                  {/* Stage Label */}
                  <span
                    className={`mt-1 text-[9px] tracking-tight whitespace-nowrap text-center transition-colors max-w-[70px] leading-tight select-none ${
                      isNodeCurrent
                        ? 'text-indigo-700 font-bold'
                        : isNodeNext
                        ? 'text-indigo-600 font-semibold'
                        : stage.isCompleted
                        ? 'text-slate-600 font-medium'
                        : stage.isBlocked
                        ? 'text-slate-300'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.shortLabel}
                  </span>

                  {/* Prerequisite Tooltip on Hover / Focus */}
                  {isTooltipOpen && (
                    <div className="absolute bottom-full mb-2 z-40 w-52 p-2 bg-slate-900 text-white rounded-lg shadow-lg text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-1.5 font-bold text-[10px] text-indigo-300 pb-1 border-b border-slate-800">
                        {stage.isBlocked ? (
                          <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                        ) : stage.isCompleted ? (
                          <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Info className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                        )}
                        <span>{stage.label}</span>
                      </div>
                      <p className="text-[9px] text-slate-300 pt-1 leading-relaxed">
                        {stage.description}
                      </p>
                      {stage.isBlocked && stage.blockerReason && (
                        <div className="mt-1 p-1 rounded bg-rose-950/60 border border-rose-800/80 text-[9px] text-rose-200">
                          <span className="font-semibold text-rose-300">Prerequisite: </span>
                          {stage.blockerReason}
                        </div>
                      )}
                      {stage.isCompleted && (
                        <div className="mt-1 text-[9px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-2 h-2" /> Completed
                        </div>
                      )}
                      {stage.isCurrent && (
                        <div className="mt-1 text-[9px] text-indigo-300 font-bold flex items-center gap-1">
                          <ChevronRight className="w-2 h-2" /> Active Stage
                        </div>
                      )}
                      {/* Arrow caret */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-3 border-x-transparent border-t-3 border-t-slate-900" />
                    </div>
                  )}
                </div>

                {/* Connecting Track Line */}
                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 mx-0.5 min-w-[14px] transition-colors ${
                      stage.isCompleted && stages[index + 1]?.isCompleted
                        ? 'bg-emerald-500'
                        : stage.isCompleted
                        ? 'bg-indigo-300'
                        : 'bg-slate-200/80'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
