import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Check, Edit3, BookOpen } from 'lucide-react';
import { Badge } from '../../design-system/components/Badge';
import { CANONICAL_15_STEPS } from '../../lib/workflow/canonical-workflow';

export interface QuestionWorkflowHeaderProps {
  currentStep: number;
  questionId?: string;
  questionTitle?: string;
  className?: string;
}

export interface QuestionStepMeta {
  stepNumber: number;
  stepCode: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  path: string;
  description: string;
}

const STEP_ICONS: Record<number, React.ElementType> = {
  1: Sparkles,
  2: ShieldCheck,
};

export const QUESTION_STEPS: QuestionStepMeta[] = CANONICAL_15_STEPS.slice(0, 2).map((s) => ({
  stepNumber: s.stepNumber,
  stepCode: String(s.stepNumber).padStart(2, '0'),
  label: s.label,
  shortLabel: s.shortLabel,
  icon: STEP_ICONS[s.stepNumber] || Sparkles,
  path: s.canonicalRoute,
  description: s.responsibility,
}));

export const QuestionWorkflowHeader: React.FC<QuestionWorkflowHeaderProps> = ({
  currentStep,
  questionId,
  questionTitle,
  className = '',
}) => {
  const navigate = useNavigate();

  const getStepPath = (step: QuestionStepMeta): string => {
    if (questionId) {
      if (step.stepNumber === 1) return `/studio?id=${encodeURIComponent(questionId)}`;
      if (step.stepNumber === 2) return `/questions/${encodeURIComponent(questionId)}/verify`;
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
            Question Lifecycle
          </Badge>
          <span className="text-xs text-slate-500 hidden md:inline">
            Canonical Step 01 &amp; Step 02 Question Authoring &amp; Verification
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

      {/* Canonical Question Steps (01 & 02) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {QUESTION_STEPS.map((step) => {
          const isCurrent = step.stepNumber === currentStep;
          const isCompleted = step.stepNumber < currentStep;
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

export default QuestionWorkflowHeader;
