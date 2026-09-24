import React from 'react';
import { Check, Lock, ChevronRight } from 'lucide-react';
import { COLOR_TOKENS, RADIUS_TOKENS, TYPOGRAPHY_TOKENS, ICON_TOKENS } from '../tokens';
import { ProductionWorkflowStep, StepState } from '../types';
import { CANONICAL_15_STEPS } from '../../lib/workflow/canonical-workflow';

export const PRODUCTION_WORKFLOW_STEPS: ProductionWorkflowStep[] = CANONICAL_15_STEPS.map((step) => ({
  stepNumber: step.stepNumber,
  id: step.id,
  label: step.label.replace(/^\d{2}\s+/, ''),
  shortLabel: step.shortLabel,
  path: step.canonicalRoute.replace('/:id', '').replace('/:reviewId', '').replace('/:contentId', ''),
}));

export interface StepIndicatorProps {
  id?: string;
  currentStep: number; // 1 to 15
  completedSteps?: number[];
  blockedSteps?: number[];
  onStepClick?: (stepNumber: number, step: ProductionWorkflowStep) => void;
  variant?: 'compact' | 'full' | 'pills';
  className?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  id = 'production-step-indicator',
  currentStep,
  completedSteps = [],
  blockedSteps = [],
  onStepClick,
  variant = 'full',
  className = '',
}) => {
  const getStepState = (stepNumber: number): StepState => {
    if (blockedSteps.includes(stepNumber)) return 'blocked';
    if (stepNumber === currentStep) return 'current';
    if (completedSteps.includes(stepNumber) || stepNumber < currentStep) return 'completed';
    return 'upcoming';
  };

  const currentStepData = PRODUCTION_WORKFLOW_STEPS.find((s) => s.stepNumber === currentStep) || PRODUCTION_WORKFLOW_STEPS[0];

  // Compact variant: displays current step highlighted with progress bar
  if (variant === 'compact') {
    return (
      <div id={id} className={`bg-white p-3 rounded-xl border border-slate-200 shadow-xs ${className}`}>
        <div className="flex items-center justify-between gap-2 text-xs mb-2">
          <span className="font-mono font-semibold text-indigo-600">
            Step {String(currentStep).padStart(2, '0')} / 15
          </span>
          <span className="font-medium text-slate-800 truncate">
            {currentStepData.label}
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            {Math.round((currentStep / 15) * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 15) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // Horizontal scrollable pills or full timeline
  return (
    <div
      id={id}
      className={`w-full bg-white p-4 rounded-xl border border-slate-200 shadow-xs overflow-x-auto no-scrollbar ${className}`}
    >
      <div className="flex items-center min-w-max gap-2 py-1">
        {PRODUCTION_WORKFLOW_STEPS.map((step, index) => {
          const state = getStepState(step.stepNumber);
          const isClickable = Boolean(onStepClick) && state !== 'blocked';
          const isLast = index === PRODUCTION_WORKFLOW_STEPS.length - 1;

          // State visual tokens
          const stateStyles = {
            current: 'bg-indigo-600 text-white font-semibold shadow-xs ring-2 ring-indigo-500/30',
            completed: 'bg-emerald-50 text-emerald-700 border border-emerald-300 font-medium',
            upcoming: 'bg-slate-50 text-slate-600 border border-slate-200 font-normal',
            blocked: 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60',
          }[state];

          const badgeNumberStyles = {
            current: 'bg-white/20 text-white',
            completed: 'bg-emerald-600 text-white',
            upcoming: 'bg-slate-200 text-slate-600',
            blocked: 'bg-slate-200 text-slate-400',
          }[state];

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => isClickable && onStepClick!(step.stepNumber, step)}
                disabled={state === 'blocked' || !isClickable}
                title={state === 'blocked' ? 'Step currently blocked' : step.label}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap select-none ${stateStyles} ${
                  isClickable ? 'cursor-pointer hover:opacity-90 active:scale-95' : 'cursor-default'
                }`}
              >
                {/* Step Icon or Number */}
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[11px] shrink-0 ${badgeNumberStyles}`}
                >
                  {state === 'completed' ? (
                    <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
                  ) : state === 'blocked' ? (
                    <Lock className="w-3 h-3" aria-hidden="true" />
                  ) : (
                    String(step.stepNumber).padStart(2, '0')
                  )}
                </span>

                <span>{step.label}</span>
              </button>

              {!isLast && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-slate-300 shrink-0 mx-0.5"
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
