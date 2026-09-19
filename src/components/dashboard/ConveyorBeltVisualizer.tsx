import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileCode2,
  CheckCircle2,
  FileText,
  Video,
  Film,
  ShieldCheck,
  Smartphone,
  CheckCheck,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export interface ConveyorStageCounts {
  draftQuestions: number;
  generatedQuestions: number;
  scriptRequiredVideos: number;
  scriptReadyVideos: number;
  editingVideos: number;
  qcLockVideos: number;
  socialSimVideos: number;
  liveVideos: number;
}

interface ConveyorBeltVisualizerProps {
  counts: ConveyorStageCounts;
  isLoading?: boolean;
}

export const ConveyorBeltVisualizer: React.FC<ConveyorBeltVisualizerProps> = ({
  counts,
  isLoading = false,
}) => {
  const buckets = [
    {
      step: '01',
      label: 'Draft',
      count: counts.draftQuestions,
      icon: FileCode2,
      url: '/studio',
      colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      activeRing: 'ring-indigo-400/30',
    },
    {
      step: '02',
      label: 'Review',
      count: counts.generatedQuestions,
      icon: CheckCircle2,
      url: '/questions?status=GENERATED',
      colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
      activeRing: 'ring-amber-400/30',
    },
    {
      step: '03',
      label: 'Script',
      count: counts.scriptRequiredVideos,
      icon: FileText,
      url: '/production?status=SCRIPT_REQUIRED',
      colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
      activeRing: 'ring-blue-400/30',
    },
    {
      step: '04',
      label: 'Teleprompter',
      count: counts.scriptReadyVideos,
      icon: Video,
      url: '/production?status=SCRIPT_READY',
      colorClass: 'text-purple-600 bg-purple-50 border-purple-200',
      activeRing: 'ring-purple-400/30',
    },
    {
      step: '05',
      label: 'Edit Bay',
      count: counts.editingVideos,
      icon: Film,
      url: '/production?status=EDITING',
      colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      activeRing: 'ring-indigo-400/30',
    },
    {
      step: '06',
      label: 'QC Lock',
      count: counts.qcLockVideos,
      icon: ShieldCheck,
      url: '/production?status=FINAL_REVIEW',
      colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
      activeRing: 'ring-amber-400/30',
    },
    {
      step: '07',
      label: 'Social Sim',
      count: counts.socialSimVideos,
      icon: Smartphone,
      url: '/production?status=READY_TO_UPLOAD',
      colorClass: 'text-teal-600 bg-teal-50 border-teal-200',
      activeRing: 'ring-teal-400/30',
    },
    {
      step: '08',
      label: 'Live',
      count: counts.liveVideos,
      icon: CheckCheck,
      url: '/publishing',
      colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold',
      activeRing: 'ring-emerald-400/30',
    },
  ];

  const totalInPipeline = Object.values(counts).reduce((acc, c) => acc + c, 0);

  return (
    <div
      id="conveyor-belt-visualizer"
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
    >
      {/* Conveyor Belt Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Live Production Conveyor Belt
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono font-semibold">
              8 Stages
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stage tracking for Telugu shorts. Click any bucket to view waiting items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
            Total Pipeline Volume: <strong className="text-slate-900 font-bold">{totalInPipeline}</strong>
          </span>
          <Link
            to="/production"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
          >
            <span>Full Pipeline Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 8-Bucket Pipeline Horizontal Conveyor Belt */}
      <div className="overflow-x-auto pb-2 pt-1 -mx-2 px-2 scrollbar-thin">
        <div className="grid grid-cols-8 min-w-[880px] gap-2 items-stretch">
          {buckets.map((b, idx) => {
            const Icon = b.icon;
            const hasItems = b.count > 0;

            return (
              <React.Fragment key={b.step}>
                <Link
                  to={b.url}
                  className={`relative group bg-slate-50/70 hover:bg-white p-3 rounded-xl border transition-all flex flex-col justify-between items-center text-center cursor-pointer ${
                    hasItems
                      ? `border-slate-300 shadow-2xs hover:shadow-md hover:border-indigo-400 ${b.activeRing}`
                      : 'border-slate-200/80 opacity-80 hover:opacity-100'
                  }`}
                  title={`Navigate to ${b.label} stage (${b.count} items)`}
                >
                  {/* Step Header */}
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span className="font-bold">{b.step}</span>
                    <Icon className={`w-3.5 h-3.5 ${hasItems ? 'text-indigo-600' : 'text-slate-400'}`} />
                  </div>

                  {/* Bucket Count Badge */}
                  <div className="my-1.5">
                    {isLoading ? (
                      <span className="inline-block w-8 h-6 bg-slate-200 animate-pulse rounded-md" />
                    ) : (
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg text-xs font-extrabold font-mono border transition-transform group-hover:scale-110 ${
                          hasItems
                            ? b.colorClass
                            : 'bg-slate-100 text-slate-500 border-slate-200 font-normal'
                        }`}
                      >
                        {b.count}
                      </span>
                    )}
                  </div>

                  {/* Bucket Stage Label */}
                  <div className="text-[11px] font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors w-full truncate">
                    {b.label}
                  </div>

                  {/* Active Indicator Bar at Bottom */}
                  {hasItems && (
                    <div className="w-full h-1 bg-indigo-500 rounded-full mt-2 animate-pulse" />
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
