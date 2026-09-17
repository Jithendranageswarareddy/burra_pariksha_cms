import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PRODUCTION_WORKFLOW_STEPS } from './StepIndicator';
import { ProductionWorkflowStep } from '../types';
import { Button } from './Button';
import { Badge } from './Badge';

export interface WorkflowStepNavProps {
  id?: string;
  currentStep: number; // 1 to 15
  currentItemId?: string; // e.g. videoId or questionId
  blockedSteps?: number[];
  disabledNext?: boolean;
  disabledNextReason?: string;
  disabledPrev?: boolean;
  disabledPrevReason?: string;
  onNavigate?: (targetStep: ProductionWorkflowStep) => void;
  className?: string;
}

export const WorkflowStepNav: React.FC<WorkflowStepNavProps> = ({
  id = 'workflow-step-nav',
  currentStep,
  currentItemId,
  blockedSteps = [],
  disabledNext = false,
  disabledNextReason,
  disabledPrev = false,
  disabledPrevReason,
  onNavigate,
  className = '',
}) => {
  const navigate = useNavigate();

  const prevStep = currentStep > 1 ? PRODUCTION_WORKFLOW_STEPS[currentStep - 2] : null;
  const currStep = PRODUCTION_WORKFLOW_STEPS[currentStep - 1] || PRODUCTION_WORKFLOW_STEPS[0];
  const nextStep = currentStep < 15 ? PRODUCTION_WORKFLOW_STEPS[currentStep] : null;

  const isNextBlocked = nextStep ? blockedSteps.includes(nextStep.stepNumber) : false;
  const isPrevBlocked = prevStep ? blockedSteps.includes(prevStep.stepNumber) : false;

  const resolveTargetUrl = (step: ProductionWorkflowStep | null): string => {
    if (!step) return '#';
    let url = step.path;
    // Context preservation: if navigating between production steps (5-11) and currentItemId is provided
    if (currentItemId && (step.stepNumber >= 5 && step.stepNumber <= 11)) {
      if (url.includes('/production?status=')) {
        url = `${url}&videoId=${encodeURIComponent(currentItemId)}`;
      } else if (url === '/queue') {
        url = `${url}?videoId=${encodeURIComponent(currentItemId)}`;
      }
    }
    return url;
  };

  const handleStepClick = (step: ProductionWorkflowStep | null) => {
    if (!step) return;
    if (onNavigate) {
      onNavigate(step);
    } else {
      navigate(resolveTargetUrl(step));
    }
  };

  return (
    <nav
      id={id}
      aria-label="Production Workflow Step Navigation"
      className={`w-full bg-white px-4 py-3 sm:px-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
    >
      {/* Previous Step Control */}
      <div className="w-full sm:w-auto flex items-center justify-start">
        {prevStep ? (
          <Button
            id="workflow-nav-prev-btn"
            variant="outline"
            size="sm"
            onClick={() => handleStepClick(prevStep)}
            disabled={disabledPrev || isPrevBlocked}
            title={disabledPrevReason || (isPrevBlocked ? 'Previous step is blocked' : undefined)}
            className="w-full sm:w-auto flex items-center gap-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-medium">
                Step {String(prevStep.stepNumber).padStart(2, '0')}
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-[180px]">
                {prevStep.label}
              </span>
            </div>
          </Button>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium px-3 py-1.5 border border-dashed border-slate-200 rounded-lg">
            <span>First Step (01)</span>
          </div>
        )}
      </div>

      {/* Current Step Status Badge & Indicator */}
      <div className="flex items-center gap-2 text-center py-1">
        <Badge variant="active" size="md">
          <span className="font-mono font-bold mr-1">
            Step {String(currStep.stepNumber).padStart(2, '0')}/15:
          </span>
          <span>{currStep.label}</span>
        </Badge>
      </div>

      {/* Next Step Control */}
      <div className="w-full sm:w-auto flex items-center justify-end">
        {nextStep ? (
          <Button
            id="workflow-nav-next-btn"
            variant="primary"
            size="sm"
            onClick={() => handleStepClick(nextStep)}
            disabled={disabledNext || isNextBlocked}
            title={disabledNextReason || (isNextBlocked ? 'Next step is blocked' : undefined)}
            className="w-full sm:w-auto flex items-center justify-end gap-2 group"
          >
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-indigo-200 uppercase font-mono font-medium">
                Step {String(nextStep.stepNumber).padStart(2, '0')}
              </span>
              <span className="text-xs font-semibold text-white truncate max-w-[140px] sm:max-w-[180px]">
                {nextStep.label}
              </span>
            </div>
            {isNextBlocked ? (
              <Lock className="w-3.5 h-3.5 text-indigo-300" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 text-indigo-200 group-hover:translate-x-0.5 transition-transform" />
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 font-semibold px-3 py-1.5 border border-emerald-200 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Workflow Complete (15)</span>
          </div>
        )}
      </div>
    </nav>
  );
};
