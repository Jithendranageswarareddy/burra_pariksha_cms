import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Edit3,
  CheckCircle2,
  ListOrdered,
  XCircle,
  Video,
  Film,
  Eye,
  UploadCloud,
  CheckCheck,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { DashboardMetrics, QuestionStatus, VideoProductionStatus } from '../../types';

interface PipelineVisualizerProps {
  metrics: DashboardMetrics;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ metrics }) => {
  if (!metrics || !metrics.questions || !metrics.videos || !metrics.publishing) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs text-center text-xs text-slate-500">
        Pipeline metrics unavailable or incomplete.
      </div>
    );
  }
  const videoPipelineStages = [
    {
      status: VideoProductionStatus.QUEUED,
      label: 'Queued',
      count: metrics.videos.queued,
      icon: ListOrdered,
      color: 'blue',
      bgClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400',
    },
    {
      status: VideoProductionStatus.SCRIPT_REQUIRED,
      label: 'Script Req.',
      count: metrics.videos.scriptRequired,
      icon: FileText,
      color: 'orange',
      bgClass: 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400',
    },
    {
      status: VideoProductionStatus.SCRIPT_READY,
      label: 'Script Ready',
      count: metrics.videos.scriptReady,
      icon: CheckCircle2,
      color: 'amber',
      bgClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400',
    },
    {
      status: VideoProductionStatus.RECORDING,
      label: 'Recording',
      count: metrics.videos.recording,
      icon: Video,
      color: 'rose',
      bgClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400',
    },
    {
      status: VideoProductionStatus.RECORDED,
      label: 'Recorded',
      count: metrics.videos.recorded,
      icon: Clock,
      color: 'pink',
      bgClass: 'bg-pink-50 text-pink-700 border-pink-200 hover:border-pink-400',
    },
    {
      status: VideoProductionStatus.EDITING,
      label: 'Editing',
      count: metrics.videos.editing,
      icon: Film,
      color: 'purple',
      bgClass: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400',
    },
    {
      status: VideoProductionStatus.EDITED,
      label: 'Edited',
      count: metrics.videos.edited,
      icon: CheckCircle2,
      color: 'indigo',
      bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400',
    },
    {
      status: VideoProductionStatus.FINAL_REVIEW,
      label: 'Final Review',
      count: metrics.videos.finalReview,
      icon: Eye,
      color: 'cyan',
      bgClass: 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:border-cyan-400',
    },
    {
      status: VideoProductionStatus.READY_TO_UPLOAD,
      label: 'Ready Upload',
      count: metrics.videos.readyToUpload,
      icon: UploadCloud,
      color: 'teal',
      bgClass: 'bg-teal-50 text-teal-800 border-teal-200 hover:border-teal-400 font-semibold',
    },
    {
      status: VideoProductionStatus.UPLOADED,
      label: 'Uploaded',
      count: metrics.videos.uploaded,
      icon: CheckCheck,
      color: 'emerald',
      bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-400',
    },
  ];

  const questionStages = [
    {
      status: QuestionStatus.GENERATED,
      label: 'Generated',
      count: metrics.questions.generated,
      icon: Sparkles,
      bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400',
    },
    {
      status: QuestionStatus.EDITING,
      label: 'Editing',
      count: metrics.questions.editing,
      icon: Edit3,
      bgClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400',
    },
    {
      status: QuestionStatus.APPROVED,
      label: 'Approved',
      count: metrics.questions.approved,
      icon: CheckCircle2,
      bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400',
    },
    {
      status: 'QUEUED',
      label: 'Queued for Video',
      count: metrics.videos.queued,
      icon: ListOrdered,
      bgClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400',
    },
    {
      status: QuestionStatus.REJECTED,
      label: 'Rejected',
      count: metrics.questions.rejected,
      icon: XCircle,
      bgClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Production Pipeline Visualizer */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Video Production Lifecycle Pipeline</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                {metrics.videos.totalActive} Active In-Flight
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative state transitions from queueing to social publication
            </p>
          </div>
          <Link
            to="/production"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Production Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Horizontal Flow Container */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 pt-1">
          {videoPipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <Link
                key={stage.status}
                to={`/production?status=${encodeURIComponent(stage.status)}`}
                className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between items-center text-center group ${stage.bgClass}`}
                title={`Filter Production Tracker by ${stage.label}`}
              >
                <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <span>#{idx + 1}</span>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-extrabold my-0.5 tracking-tight font-mono">
                  {stage.count}
                </div>
                <div className="text-[11px] font-bold leading-tight truncate w-full">
                  {stage.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2. Question Funnel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Question Pedagogy & Review Funnel</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                {metrics.questions.total} Questions in Database
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft question verification, Telugu translation review, and video queue handoff
            </p>
          </div>
          <Link
            to="/questions"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Open Question Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {questionStages.map((stage) => {
            const Icon = stage.icon;
            const targetUrl =
              stage.status === 'QUEUED'
                ? '/queue'
                : `/questions?status=${encodeURIComponent(stage.status)}`;
            return (
              <Link
                key={stage.status}
                to={targetUrl}
                className={`p-3.5 rounded-lg border transition-all flex items-center justify-between group ${stage.bgClass}`}
              >
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    {stage.label}
                  </div>
                  <div className="text-xl font-black font-mono">
                    {stage.count}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-white/60 border border-current/10">
                  <Icon className="w-5 h-5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
