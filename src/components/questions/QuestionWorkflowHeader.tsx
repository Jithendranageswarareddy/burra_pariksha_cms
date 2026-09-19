import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Edit3, ShieldCheck, Check } from 'lucide-react';
import { Badge } from '../../design-system/components/Badge';

export interface QuestionWorkflowHeaderProps {
  currentStep: 1 | 2 | 3 | 4;
  questionId?: string;
  questionTitle?: string;
  className?: string;
}

interface StepMeta {
  stepNumber: 1 | 2 | 3 | 4;
  stepCode: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

const QUESTION_STEPS: StepMeta[] = [
  {
    stepNumber: 1,
    stepCode: 'Generate',
    label: 'Generate',
    shortLabel: 'Generate',
    icon: Sparkles,
    path: '/studio',
    description: 'AI generation from Topic taxonomy',
  },
  {
    stepNumber: 2,
    stepCode: 'Library',
    label: 'Library',
    shortLabel: 'Library',
    icon: BookOpen,
    path: '/questions',
    description: 'Explore, filter & pick questions',
  },
  {
    stepNumber: 3,
    stepCode: 'Improve',
    label: 'Improve',
    shortLabel: 'Improve',
    icon: Edit3,
    path: '/questions/improve',
    description: 'Human editing & optional AI refinement',
  },
  {
    stepNumber: 4,
    stepCode: 'Approve',
    label: 'Approve',
    shortLabel: 'Approve',
    icon: ShieldCheck,
    path: '/questions/verify',
    description: 'Quality gate & validation review',
  },
];

export const QuestionWorkflowHeader: React.FC<QuestionWorkflowHeaderProps> = ({
  currentStep,
  questionId,
  questionTitle,
  className = '',
}) => {
  const navigate = useNavigate();

  const getStepPath = (step: StepMeta): string => {
    if (questionId) {
      if (step.stepNumber === 3) return `/questions/${encodeURIComponent(questionId)}/improve`;
      if (step.stepNumber === 4) return `/questions/${encodeURIComponent(questionId)}/verify`;
    }
    return step.path;
  };

  return (
    <div
      id="question-workflow-stepper"
      className={`bg-white rounded-xl border border-slate-200/90 shadow-xs p-3 sm:p-4 mb-6 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm" className="font-semibold">
            Question Pipeline
          </Badge>
          <span className="text-xs text-slate-500 hidden md:inline">
            From Topic selection to verified and approved question
          </span>
        </div>

        {questionId && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Current Question:</span>
            <Link
              to={`/questions/${encodeURIComponent(questionId)}`}
              className="font-mono font-semibold text-indigo-600 hover:underline max-w-[200px] truncate"
              title={questionTitle || questionId}
            >
              {questionTitle || questionId}
            </Link>
          </div>
        )}
      </div>

      {/* 4-Step Progress Bar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {QUESTION_STEPS.map((step) => {
          const isCurrent = step.stepNumber === currentStep;
          const isCompleted = step.stepNumber < currentStep;
          const isUpcoming = step.stepNumber > currentStep;
          const StepIcon = step.icon;
          const targetUrl = getStepPath(step);

          return (
            <Link
              key={step.stepNumber}
              to={targetUrl}
              id={`question-step-pill-${step.stepCode}`}
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
                <p className="text-[11px] text-slate-500 truncate hidden lg:block">
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
