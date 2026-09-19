import React from 'react';
import { ArrowRight, Sparkles, Clock, AlertCircle, PlayCircle, Film, FileText, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../design-system/components/Card';
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
      <Card id="continue-production-loading-card" className="border border-slate-200/80 shadow-xs bg-white animate-pulse">
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-32 bg-slate-200 rounded-full" />
            <div className="h-5 w-24 bg-slate-200 rounded-full" />
          </div>
          <div className="h-7 w-3/4 bg-slate-200 rounded" />
          <div className="flex gap-3 pt-2">
            <div className="h-6 w-28 bg-slate-100 rounded-md" />
            <div className="h-6 w-36 bg-slate-100 rounded-md" />
          </div>
        </div>
      </Card>
    );
  }

  // Empty / All Caught Up state when no urgent tasks are pending
  if (!item) {
    return (
      <Card id="continue-production-empty-card" className="border border-emerald-100 shadow-xs bg-gradient-to-r from-emerald-50/40 via-white to-white overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l" />
        <div className="p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-100/70 text-emerald-700 border border-emerald-200/80 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  All Caught Up!
                </span>
                <span className="text-xs text-slate-400 font-medium">No pending bottlenecks</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                All production pipelines are running smoothly
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                Your assigned queue is completely clear. Generate a fresh batch of Telugu aptitude questions using the AI Generation Studio.
              </p>
            </div>
          </div>
          <Link to="/studio" id="continue-production-start-btn" className="shrink-0 w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Create New Question in Studio</span>
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

  const isTeluguText = (text: string) => /[\u0C00-\u0C7F]/.test(text);

  return (
    <Card id="continue-production-card" className="border border-indigo-200 shadow-sm bg-gradient-to-r from-indigo-50/40 via-white to-white overflow-hidden relative">
      {/* Clean high-contrast indigo accent border */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 rounded-l" />

      <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 min-w-0 flex-1">
          {/* Header Tagline & Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-md border border-indigo-200">
              <Zap className="w-3 h-3 fill-indigo-600 text-indigo-600" />
              Continue Your Work
            </span>

            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Step {item.stepNumber} • {item.stepName}
            </span>

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

          {/* Main Title & Context with Telugu Typography */}
          <div>
            <h3
              className={`text-base sm:text-lg font-bold text-slate-900 tracking-tight line-clamp-2 ${
                isTeluguText(item.title) ? 'font-telugu leading-relaxed text-[17px]' : 'leading-snug'
              }`}
            >
              {item.title}
            </h3>

            {(item.topic || item.subtopic || item.reason) && (
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-1.5 flex-wrap">
                {item.topic && (
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 border border-slate-200/80">
                    {item.topic}
                  </span>
                )}
                {item.subtopic && (
                  <span className="text-slate-600 font-medium">
                    › {item.subtopic}
                  </span>
                )}
                {item.reason && (
                  <span className="text-slate-500 italic">
                    — {item.reason}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="shrink-0 flex items-center gap-3">
          <Link
            to={item.targetUrl}
            id="continue-production-action-btn"
            className="w-full sm:w-auto"
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 shadow-xs hover:shadow-md transition-all"
            >
              <span>Resume Task</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
