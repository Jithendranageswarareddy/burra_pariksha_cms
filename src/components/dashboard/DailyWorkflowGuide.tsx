import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  ListOrdered,
  FileText,
  Video,
  Film,
  Eye,
  UploadCloud,
  Share2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import { DAILY_WORKFLOW_STEPS } from '../../config/constants';

export const DailyWorkflowGuide: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1:
        return Sparkles;
      case 2:
        return FileText;
      case 3:
        return CheckCircle2;
      case 4:
        return ListOrdered;
      case 5:
        return FileText;
      case 6:
        return Video;
      case 7:
        return Film;
      case 8:
        return Eye;
      case 9:
        return UploadCloud;
      case 10:
        return Share2;
      default:
        return ArrowRight;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs">
            10
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Burra Pariksha Daily Production Protocol
            </h3>
            <p className="text-xs text-slate-500">
              Standard 10-step content operations sequence from AI draft to published short
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200"
        >
          <span>{isExpanded ? 'Collapse Steps' : 'View Protocol Steps'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50/50">
          {DAILY_WORKFLOW_STEPS.map((s) => {
            const Icon = getStepIcon(s.step);
            return (
              <Link
                key={s.step}
                to={s.actionUrl}
                className="p-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono">
                      STEP {s.step}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {s.description}
                  </p>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-400 group-hover:text-indigo-600">
                  <span>Open Stage</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
