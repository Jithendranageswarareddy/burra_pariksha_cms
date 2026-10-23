/**
 * BURRA PARIKSHA CMS — Compact Unified Workflow Header
 * Mode 1: Question Challenge Short (Stage 01: Question Generation)
 *
 * Consolidates the previously separated:
 * 1. Mode Identity Card
 * 2. 15-Stage Production Journey Bar
 * 3. Production Workbench Summary Card
 *
 * Into one compact, unified, high-density workflow header with:
 * - Content Mode: "Question Challenge Short"
 * - Format: "9:16 Vertical • max 58s"
 * - Stage Badge: "Stage 01: Question Generation (Step 01 / 15)"
 * - Save / Draft Status Indicator (Unsaved Changes vs Saved)
 * - Next Stage Guidance ("Next: Stage 02 Question Verification")
 * - 15-Stage Pipeline with current stage highlighted and mandatory gates clearly identified
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Lock,
  Clock,
  Save,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';
import { CANONICAL_15_STEPS } from '../../../../shared/constants/workflow';
import { useProductionJourney, JourneyStage } from '../../../contexts/ProductionJourneyContext';

export interface UnifiedWorkflowHeaderProps {
  hasCandidate: boolean;
  isDirty: boolean;
  savedDraftId: string | null;
  isLoadingDraft?: boolean;
  isSaving?: boolean;
  isSubmitting?: boolean;
  onOpenModeModal: () => void;
  className?: string;
}

// Canonical mandatory quality gates in the 15-stage workflow
const MANDATORY_GATED_STAGES = [2, 7, 9, 11];

export const UnifiedWorkflowHeader: React.FC<UnifiedWorkflowHeaderProps> = ({
  hasCandidate,
  isDirty,
  savedDraftId,
  isLoadingDraft = false,
  isSaving = false,
  isSubmitting = false,
  onOpenModeModal,
  className = '',
}) => {
  const [activeTooltipStage, setActiveTooltipStage] = useState<number | null>(null);

  // Consume journey context if available
  let journeyCurrentStage = 1;
  let journeyStages: JourneyStage[] = [];
  let jumpToStage: ((stageNumber: number) => void) | undefined;
  let reloadJourneyData: (() => void) | undefined;
  let isJourneyLoading = false;

  try {
    const journey = useProductionJourney();
    if (journey) {
      journeyCurrentStage = journey.currentStage;
      journeyStages = journey.stages;
      jumpToStage = journey.jumpToStage;
      reloadJourneyData = journey.reloadJourneyData;
      isJourneyLoading = journey.isLoading;
    }
  } catch {
    // Graceful fallback outside provider
  }

  // Fallback to canonical definitions if stages array is empty
  const stages = journeyStages.length > 0 ? journeyStages : CANONICAL_15_STEPS.map((step) => ({
    stageNumber: step.stepNumber,
    id: step.id,
    label: step.label,
    shortLabel: step.shortLabel,
    description: step.responsibility,
    isCompleted: step.stepNumber < journeyCurrentStage,
    isCurrent: step.stepNumber === journeyCurrentStage,
    isBlocked: step.stepNumber > journeyCurrentStage,
    blockerReason: step.blockedCondition,
    route: step.canonicalRoute,
    tab: step.tab,
  }));

  const currentStage = 1; // Stage 01 Question Generation in Question Studio

  return (
    <div
      id="permanent-timeline-anchor"
      data-testid="unified-challenge-header"
      className={`bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-2 ${className}`}
    >
      {/* TOP ROW: UNIFIED METADATA & STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        {/* Left: Mode Title, Format Badge, Current Stage */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Question Challenge Short</span>
          </div>

          <span
            data-testid="mode-badge"
            className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono"
            title="Question Challenge Short format"
          >
            9:16 Vertical • max 58s
          </span>

          <button
            type="button"
            data-testid="workbench-change-mode-btn"
            onClick={onOpenModeModal}
            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            title="Switch content production mode"
          >
            Change
          </button>

          <span className="text-slate-300 hidden md:inline">•</span>

          <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
            Stage 01: Question Generation (Step 01 / 15)
          </span>
        </div>

        {/* Right: Save State, Next Stage Guidance */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Save / Draft State Indicator */}
          {isDirty ? (
            <span
              data-testid="workbench-content-status"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ring-1 bg-amber-50 text-amber-800 border-amber-300 ring-amber-200"
              title="You have unsaved changes in the question editor"
            >
              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
              <span>Unsaved Changes</span>
            </span>
          ) : savedDraftId ? (
            <span
              data-testid="workbench-content-status"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ring-1 bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-200"
              title={`Draft saved with ID ${savedDraftId}`}
            >
              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
              <span>Saved</span>
              <span className="font-mono text-[9px] opacity-75 hidden xl:inline">({savedDraftId})</span>
            </span>
          ) : hasCandidate ? (
            <span
              data-testid="workbench-content-status"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ring-1 bg-indigo-50 text-indigo-800 border-indigo-300 ring-indigo-200"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Candidate Ready</span>
            </span>
          ) : (
            <span
              data-testid="workbench-content-status"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-slate-50 text-slate-600 border-slate-200"
            >
              <Clock className="w-3 h-3 text-slate-400" />
              <span>New Candidate</span>
            </span>
          )}

          {/* Next Stage Context Indicator */}
          <span className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded font-medium flex items-center gap-1">
            <span className="text-slate-400">Next:</span>
            <span className="text-slate-700 font-semibold">Stage 02 Verification</span>
          </span>

          {reloadJourneyData && (
            <button
              type="button"
              onClick={reloadJourneyData}
              disabled={isJourneyLoading}
              title="Refresh workflow progress"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded border border-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isJourneyLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* BOTTOM ROW: COMPACT HORIZONTAL 15-STAGE PIPELINE TRACK */}
      <div className="relative overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        <div className="flex items-center justify-between min-w-[860px] px-1 py-0.5 gap-1">
          {stages.map((stage, index) => {
            const stageNum = stage.stageNumber;
            const isCurrent = stageNum === currentStage;
            const isNext = stageNum === currentStage + 1;
            const isGated = MANDATORY_GATED_STAGES.includes(stageNum);
            const isTooltipOpen = activeTooltipStage === stageNum;
            const isLast = index === stages.length - 1;

            return (
              <React.Fragment key={stage.id || stageNum}>
                {/* Stage Node */}
                <div
                  className="relative flex flex-col items-center group cursor-pointer flex-1"
                  onMouseEnter={() => setActiveTooltipStage(stageNum)}
                  onMouseLeave={() => setActiveTooltipStage(null)}
                  onClick={() => {
                    if (!stage.isBlocked && jumpToStage) {
                      jumpToStage(stageNum);
                    }
                  }}
                >
                  {/* Circle Indicator with Gate Badge */}
                  <div className="relative">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all select-none ${
                        isCurrent
                          ? 'bg-indigo-600 text-white border-2 border-white ring-2 ring-indigo-300 scale-110 shadow-xs z-10'
                          : isNext
                          ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-400 font-bold hover:bg-indigo-100'
                          : stage.isCompleted
                          ? 'bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-700'
                          : stage.isBlocked
                          ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed opacity-80'
                          : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {stage.isCompleted ? (
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      ) : stage.isBlocked && !isGated ? (
                        <Lock className="w-2.5 h-2.5 text-slate-300" />
                      ) : (
                        String(stageNum).padStart(2, '0')
                      )}
                    </div>

                    {/* Mandatory Gate indicator badge on gated stages */}
                    {isGated && (
                      <span
                        className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full flex items-center justify-center border border-white ${
                          stage.isCompleted
                            ? 'bg-emerald-500 text-white'
                            : isCurrent || isNext
                            ? 'bg-amber-500 text-white'
                            : 'bg-amber-400/80 text-white'
                        }`}
                        title="Mandatory Quality Gate"
                      >
                        <Lock className="w-1.5 h-1.5" />
                      </span>
                    )}
                  </div>

                  {/* Stage Label & Gated Tag */}
                  <div className="mt-1 flex flex-col items-center">
                    <span
                      className={`text-[9px] tracking-tight whitespace-nowrap text-center transition-colors max-w-[65px] leading-tight select-none ${
                        isCurrent
                          ? 'text-indigo-700 font-bold'
                          : isNext
                          ? 'text-indigo-600 font-semibold'
                          : stage.isCompleted
                          ? 'text-slate-600 font-medium'
                          : stage.isBlocked
                          ? 'text-slate-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {stage.shortLabel}
                    </span>
                    {isGated && (
                      <span className="text-[7.5px] uppercase font-bold tracking-tighter text-amber-700 bg-amber-50 border border-amber-200/80 px-1 rounded-sm mt-0.5">
                        Gate
                      </span>
                    )}
                  </div>

                  {/* Hover Prerequisite / Details Tooltip */}
                  {isTooltipOpen && (
                    <div className="absolute bottom-full mb-2 z-40 w-52 p-2 bg-slate-900 text-white rounded-lg shadow-lg text-left pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800 gap-1 text-[10px] font-bold">
                        <div className="flex items-center gap-1.5 text-indigo-300 truncate">
                          {isGated ? (
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          ) : (
                            <Info className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                          )}
                          <span className="truncate">{stage.label}</span>
                        </div>
                        {isGated && (
                          <span className="text-[8px] uppercase bg-amber-950 text-amber-300 border border-amber-700 px-1 py-0.2 rounded shrink-0">
                            Mandatory Gate
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-300 pt-1 leading-relaxed">
                        {stage.description}
                      </p>
                      {isCurrent && (
                        <div className="mt-1 text-[9px] text-indigo-300 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                          <span>Current Stage (Active)</span>
                        </div>
                      )}
                      {stage.isBlocked && stage.blockerReason && (
                        <div className="mt-1 p-1 rounded bg-rose-950/60 border border-rose-800/80 text-[8.5px] text-rose-200">
                          <span className="font-semibold text-rose-300">Prerequisite: </span>
                          {stage.blockerReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Connecting Line between nodes */}
                {!isLast && (
                  <div
                    className={`h-0.5 flex-1 mb-5 transition-colors ${
                      stage.isCompleted
                        ? 'bg-emerald-500'
                        : isCurrent
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
    </div>
  );
};
