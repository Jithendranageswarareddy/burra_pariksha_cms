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
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4 ${className}`}>
      {/* Top Header: Canonical Lineage, Current Stage Badge & Intelligent Next Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Production Journey</span>
          </div>

          <span className="text-slate-300 hidden sm:inline">•</span>

          {/* Active Stage Indicator */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Stage {String(effectiveCurrentStage).padStart(2, '0')} / 15: {activeStageObj.shortLabel}</span>
          </div>

          {/* Canonical correlation identifiers */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
            {contentMasterId && (
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Master: {contentMasterId}
              </span>
            )}
            {questionId && (
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                Q: {questionId}
              </span>
            )}
            {videoId && (
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                V: {videoId}
              </span>
            )}
          </div>
        </div>

        {/* Right Header Actions: Reload & Intelligent Next Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => reloadJourneyData()}
            disabled={isLoading}
            title="Reload Journey State"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Intelligent Next Action Button */}
          {nextAction && (
            <button
              type="button"
              onClick={handleNextActionClick}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all group cursor-pointer"
              title={nextAction.description || `Advance to ${nextAction.label}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>{nextAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>

      {/* 15 UI Stages Horizontal Stepper Track */}
      <div className="relative overflow-x-auto pb-2 pt-1 scrollbar-thin">
        <div className="flex items-center min-w-[1020px] px-1 py-1">
          {stages.map((stage, index) => {
            const isLast = index === stages.length - 1;
            const isTooltipOpen = activeTooltipStage === stage.stageNumber;
            const isNodeCurrent = stage.stageNumber === effectiveCurrentStage;

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
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-mono transition-all select-none ${
                      isNodeCurrent
                        ? 'bg-indigo-600 text-white border-2 border-white ring-4 ring-indigo-100 scale-110 shadow-sm z-10'
                        : stage.isCompleted
                        ? 'bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-700'
                        : stage.isBlocked
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80'
                        : 'bg-white text-slate-600 border border-slate-300 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {stage.isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : stage.isBlocked ? (
                      <Lock className="w-3 h-3 text-slate-400" />
                    ) : (
                      String(stage.stageNumber).padStart(2, '0')
                    )}
                  </div>

                  {/* Stage Label */}
                  <span
                    className={`mt-1.5 text-[10px] tracking-tight whitespace-nowrap text-center transition-colors max-w-[80px] leading-tight select-none ${
                      isNodeCurrent
                        ? 'text-indigo-700 font-bold'
                        : stage.isCompleted
                        ? 'text-slate-700 font-medium'
                        : stage.isBlocked
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {stage.shortLabel}
                  </span>

                  {/* Prerequisite Tooltip on Hover / Focus */}
                  {isTooltipOpen && (
                    <div className="absolute bottom-full mb-2.5 z-40 w-56 p-2.5 bg-slate-900 text-white rounded-lg shadow-xl text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-indigo-300 pb-1 border-b border-slate-800">
                        {stage.isBlocked ? (
                          <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                        ) : stage.isCompleted ? (
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <Info className="w-3 h-3 text-indigo-400 shrink-0" />
                        )}
                        <span>{stage.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-300 pt-1 leading-relaxed">
                        {stage.description}
                      </p>
                      {stage.isBlocked && stage.blockerReason && (
                        <div className="mt-1.5 p-1.5 rounded bg-rose-950/60 border border-rose-800/80 text-[10px] text-rose-200">
                          <span className="font-semibold text-rose-300">Prerequisite required: </span>
                          {stage.blockerReason}
                        </div>
                      )}
                      {stage.isCompleted && (
                        <div className="mt-1.5 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Stage Completed
                        </div>
                      )}
                      {stage.isCurrent && (
                        <div className="mt-1.5 text-[10px] text-indigo-300 font-bold flex items-center gap-1">
                          <ChevronRight className="w-2.5 h-2.5" /> Active Stage
                        </div>
                      )}
                      {/* Arrow caret */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                    </div>
                  )}
                </div>

                {/* Connecting Track Line */}
                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 mx-1 min-w-[20px] transition-colors ${
                      stage.isCompleted && stages[index + 1]?.isCompleted
                        ? 'bg-emerald-500'
                        : stage.isCompleted
                        ? 'bg-indigo-300'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Optional Details footer if requested */}
      {showDetails && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{activeStageObj.label}:</span>
            <span>{activeStageObj.description}</span>
          </div>
          {nextAction?.description && (
            <div className="text-slate-400 text-[11px] italic">
              Next: {nextAction.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
