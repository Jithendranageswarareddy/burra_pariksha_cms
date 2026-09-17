import React from 'react';
import { ArrowRight, Sparkles, Clock, AlertCircle, PlayCircle, Film, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../design-system/components/Card';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';

export interface ActionableProductionItem {
  id: string;
  title: string;
  stepNumber: string; // e.g. "05", "08", "12"
  stepName: string;   // e.g. "Create Script", "Edit Video", "Social Review"
  stageCategory: string; // e.g. "SCRIPT", "VIDEO", "REVIEW", "PUBLISHING"
  topic?: string;
  subtopic?: string;
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';
  ageDays?: number;
  reason?: string;
  targetUrl: string;
  assignedRole?: string;
}

export interface ContinueProductionCardProps {
  item: ActionableProductionItem | null;
  isLoading?: boolean;
}

export const ContinueProductionCard: React.FC<ContinueProductionCardProps> = ({ item, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card id="continue-production-loading-card" className="border border-slate-200 shadow-xs bg-white animate-pulse">
        <div className="p-6 sm:p-8 space-y-4">
          <div className="h-4 w-44 bg-slate-200 rounded" />
          <div className="h-8 w-3/4 bg-slate-200 rounded" />
          <div className="flex gap-3 pt-2">
            <div className="h-6 w-24 bg-slate-100 rounded-full" />
            <div className="h-6 w-32 bg-slate-100 rounded-full" />
          </div>
        </div>
      </Card>
    );
  }

  // Empty state when no production is in progress
  if (!item) {
    return (
      <Card id="continue-production-empty-card" className="border border-slate-200 shadow-xs bg-white overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                No production in progress
              </h3>
              <p className="text-sm text-slate-500 max-w-xl">
                All production pipelines are currently clear. Generate a fresh batch of Telugu aptitude questions using the approved AI generation studio.
              </p>
            </div>
          </div>
          <Link to="/studio" id="continue-production-start-btn" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Start New Question</span>
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Active production item view
  const priorityVariant =
    item.priority === 'URGENT' || item.priority === 'HIGH'
      ? 'danger'
      : item.priority === 'MEDIUM'
      ? 'warning'
      : 'info';

  const getStepIcon = (stepNum: string) => {
    const num = parseInt(stepNum, 10);
    if (num <= 4) return Sparkles;
    if (num <= 6) return FileText;
    if (num <= 11) return Film;
    return CheckCircle2;
  };

  const StepIcon = getStepIcon(item.stepNumber);

  return (
    <Card id="continue-production-card" className="border border-indigo-100 shadow-sm bg-gradient-to-r from-white via-indigo-50/20 to-white overflow-hidden relative">
      {/* Visual left accent border using pure Tailwind */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />

      <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 min-w-0 flex-1">
          {/* Section Eyebrow & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              Continue Production
            </span>

            <Badge variant="active" size="sm" dot>
              Step {item.stepNumber} — {item.stepName}
            </Badge>

            {item.priority && (
              <Badge variant={priorityVariant} size="sm">
                {item.priority}
              </Badge>
            )}

            {item.ageDays !== undefined && item.ageDays > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium ml-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {item.ageDays}d in stage
              </span>
            )}
          </div>

          {/* Main Title & Context */}
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
              {item.title}
            </h3>

            {(item.topic || item.subtopic || item.reason) && (
              <p className="text-sm text-slate-600 mt-1 line-clamp-1">
                {item.topic && <span className="font-semibold text-slate-700">{item.topic}</span>}
                {item.subtopic && <span className="text-slate-500"> › {item.subtopic}</span>}
                {item.reason && <span className="text-slate-500 italic"> — {item.reason}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center gap-3">
          <Link
            to={item.targetUrl}
            id="continue-production-action-btn"
            className="w-full sm:w-auto"
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto flex items-center justify-center gap-2 font-semibold shadow-xs hover:shadow-md transition-shadow"
            >
              <span>Continue Step {item.stepNumber}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
