/**
 * BURRA PARIKSHA CMS — Canonical 15-Step Workflow Breadcrumb
 * Stage 27 Feature Contract: FC-005 (Canonical 15-Step Workflow State Machine)
 * Traced to:
 * - docs/features/FC-005-WORKFLOW-STATE-ENGINE.md (Section 7)
 * - docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md
 *
 * Visualizes the sequential 15-step business lifecycle with active step highlighting
 * and verification gate indicators. UX-only component: backend remains sole authority.
 */

import React from 'react';
import {
  CanonicalWorkflowStep,
  CANONICAL_WORKFLOW_STEPS,
  WorkflowStepNumber,
} from '../../types/workflow';

interface WorkflowBreadcrumbProps {
  currentStep: WorkflowStepNumber;
  completedSteps?: number[];
  onSelectStep?: (step: WorkflowStepNumber) => void;
  compact?: boolean;
}

const STEP_NUMBERS: WorkflowStepNumber[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export const WorkflowBreadcrumb: React.FC<WorkflowBreadcrumbProps> = ({
  currentStep,
  onSelectStep,
  compact = false,
}) => {
  if (compact) {
    const currentDef = CANONICAL_WORKFLOW_STEPS[currentStep];
    const pct = Math.round((currentStep / 15) * 100);

    return (
      <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-400">Step {currentStep} of 15:</span>
            <span className="text-white font-medium">{currentDef.name}</span>
            {currentDef.isVerificationStep && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                GAR-02 Gate
              </span>
            )}
          </div>
          <span className="text-slate-400 font-mono">{pct}%</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
      <div className="min-w-[900px] flex items-center justify-between relative py-2">
        {/* Continuous Connecting Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-800 z-0" />

        {STEP_NUMBERS.map((step) => {
          const def = CANONICAL_WORKFLOW_STEPS[step];
          const isDone = step < currentStep;
          const isCurrent = step === currentStep;
          const isPending = step > currentStep;

          return (
            <button
              key={step}
              type="button"
              onClick={() => onSelectStep?.(step)}
              disabled={!onSelectStep}
              className={`relative z-10 flex flex-col items-center group focus:outline-none ${
                onSelectStep ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Step Circle Badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border-2 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-400 ring-4 ring-indigo-500/30 scale-110 shadow-lg shadow-indigo-600/50'
                    : isDone
                    ? 'bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                {isDone ? '✓' : step}
              </div>

              {/* Gate Indicator */}
              {def.isVerificationStep && (
                <span
                  title="GAR-02 Anti-Self-Approval Verification Gate"
                  className="absolute -top-2 -right-1 w-3.5 h-3.5 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center border border-amber-300 shadow"
                >
                  G
                </span>
              )}

              {/* Step Label */}
              <span
                className={`mt-2 text-[11px] font-medium tracking-tight whitespace-nowrap text-center ${
                  isCurrent
                    ? 'text-indigo-300 font-bold'
                    : isDone
                    ? 'text-slate-300'
                    : 'text-slate-500'
                }`}
              >
                {def.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
