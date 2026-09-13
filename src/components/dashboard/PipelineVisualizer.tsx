import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<'VIDEO' | 'QUESTIONS'>('VIDEO');

  if (!metrics || !metrics.questions || !metrics.videos || !metrics.publishing) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs text-center text-xs text-slate-500">
        Pipeline metrics unavailable or incomplete.
      </div>
    );
  }

  // Restrained status accents:
  // Queued/Pending: neutral/slate
  // In Progress: indigo/blue
  // Review/QC: amber
  // Approved/Ready/Uploaded: emerald
  const videoPipelineStages = [
    {
      status: VideoProductionStatus.QUEUED,
      label: 'Queued',
      count: metrics.videos.queued,
      icon: ListOrdered,
      badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
      hoverBorder: 'hover:border-slate-400',
      iconColor: 'text-slate-500',
    },
    {
      status: VideoProductionStatus.SCRIPT_REQUIRED,
      label: 'Script Req.',
      count: metrics.videos.scriptRequired,
      icon: FileText,
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      hoverBorder: 'hover:border-indigo-300',
      iconColor: 'text-indigo-600',
    },
    {
      status: VideoProductionStatus.SCRIPT_READY,
      label: 'Script Ready',
      count: metrics.videos.scriptReady,
      icon: CheckCircle2,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      hoverBorder: 'hover:border-amber-300',
      iconColor: 'text-amber-600',
    },
    {
      status: VideoProductionStatus.RECORDING,
      label: 'Recording',
      count: metrics.videos.recording,
      icon: Video,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      hoverBorder: 'hover:border-blue-300',
      iconColor: 'text-blue-600',
    },
    {
      status: VideoProductionStatus.RECORDED,
      label: 'Recorded',
      count: metrics.videos.recorded,
      icon: Clock,
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      hoverBorder: 'hover:border-indigo-300',
      iconColor: 'text-indigo-600',
    },
    {
      status: VideoProductionStatus.EDITING,
      label: 'Editing',
      count: metrics.videos.editing,
      icon: Film,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
      hoverBorder: 'hover:border-blue-300',
      iconColor: 'text-blue-600',
    },
    {
      status: VideoProductionStatus.EDITED,
      label: 'Edited',
      count: metrics.videos.edited,
      icon: CheckCircle2,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      hoverBorder: 'hover:border-amber-300',
      iconColor: 'text-amber-600',
    },
    {
      status: VideoProductionStatus.FINAL_REVIEW,
      label: 'Final Review',
      count: metrics.videos.finalReview,
      icon: Eye,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      hoverBorder: 'hover:border-amber-300',
      iconColor: 'text-amber-600',
    },
    {
      status: VideoProductionStatus.READY_TO_UPLOAD,
      label: 'Ready Upload',
      count: metrics.videos.readyToUpload,
      icon: UploadCloud,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
      hoverBorder: 'hover:border-emerald-300',
      iconColor: 'text-emerald-600',
    },
    {
      status: VideoProductionStatus.UPLOADED,
      label: 'Uploaded',
      count: metrics.videos.uploaded,
      icon: CheckCheck,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold',
      hoverBorder: 'hover:border-emerald-300',
      iconColor: 'text-emerald-600',
    },
  ];

  const questionStages = [
    {
      status: QuestionStatus.GENERATED,
      label: 'Generated',
      count: metrics.questions.generated,
      icon: Sparkles,
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      hoverBorder: 'hover:border-indigo-300',
      iconColor: 'text-indigo-600',
    },
    {
      status: QuestionStatus.EDITING,
      label: 'Editing',
      count: metrics.questions.editing,
      icon: Edit3,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      hoverBorder: 'hover:border-amber-300',
      iconColor: 'text-amber-600',
    },
    {
      status: QuestionStatus.APPROVED,
      label: 'Approved',
      count: metrics.questions.approved,
      icon: CheckCircle2,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      hoverBorder: 'hover:border-emerald-300',
      iconColor: 'text-emerald-600',
    },
    {
      status: 'QUEUED',
      label: 'Queued for Video',
      count: metrics.videos.queued,
      icon: ListOrdered,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      hoverBorder: 'hover:border-slate-400',
      iconColor: 'text-slate-600',
    },
    {
      status: QuestionStatus.REJECTED,
      label: 'Rejected',
      count: metrics.questions.rejected,
      icon: XCircle,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      hoverBorder: 'hover:border-rose-300',
      iconColor: 'text-rose-600',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
      {/* Header with Segmented Control and Quick Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Toggle */}
          <div
            role="tablist"
            aria-label="Pipeline Selection"
            className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold"
          >
            <button
              type="button"
              role="tab"
              id="tab-video-pipeline"
              aria-selected={activeTab === 'VIDEO'}
              aria-controls="panel-video-pipeline"
              tabIndex={0}
              onClick={() => setActiveTab('VIDEO')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  setActiveTab('QUESTIONS');
                }
              }}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'VIDEO'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Video Pipeline</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                10
              </span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-question-funnel"
              aria-selected={activeTab === 'QUESTIONS'}
              aria-controls="panel-question-funnel"
              tabIndex={0}
              onClick={() => setActiveTab('QUESTIONS')}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  setActiveTab('VIDEO');
                }
              }}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'QUESTIONS'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Question Funnel</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                5
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {activeTab === 'VIDEO'
              ? `${metrics.videos.totalActive} Active In-Flight`
              : `${metrics.questions.total} Questions in Database`}
          </div>
        </div>

        <Link
          to={activeTab === 'VIDEO' ? '/production' : '/questions'}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto"
        >
          <span>{activeTab === 'VIDEO' ? 'Open Production Tracker' : 'Open Question Library'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Pipeline Stage Content (Horizontal scrollable inside container on mobile/tablet) */}
      <div className="overflow-x-auto pb-1 pt-1 -mx-1 px-1">
        {activeTab === 'VIDEO' ? (
          <div
            id="panel-video-pipeline"
            role="tabpanel"
            aria-labelledby="tab-video-pipeline"
            className="grid grid-cols-10 min-w-[760px] lg:min-w-0 gap-2"
          >
            {videoPipelineStages.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <Link
                  key={stage.status}
                  to={`/production?status=${encodeURIComponent(stage.status)}`}
                  className={`bg-white p-2 rounded-lg border border-slate-200 transition-all flex flex-col justify-between items-center text-center group hover:bg-slate-50/70 hover:shadow-2xs ${stage.hoverBorder}`}
                  title={`Filter Production Tracker by ${stage.label}`}
                >
                  <div className="w-full flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>#{idx + 1}</span>
                    <Icon className={`w-3.5 h-3.5 ${stage.iconColor}`} />
                  </div>
                  <div className="my-1">
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-extrabold font-mono border ${stage.badgeClass}`}>
                      {stage.count}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 leading-tight truncate w-full group-hover:text-slate-900">
                    {stage.label}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div
            id="panel-question-funnel"
            role="tabpanel"
            aria-labelledby="tab-question-funnel"
            className="grid grid-cols-5 min-w-[500px] lg:min-w-0 gap-2.5"
          >
            {questionStages.map((stage, idx) => {
              const Icon = stage.icon;
              const targetUrl =
                stage.status === 'QUEUED'
                  ? '/queue'
                  : `/questions?status=${encodeURIComponent(stage.status)}`;
              return (
                <Link
                  key={stage.status}
                  to={targetUrl}
                  className={`bg-white p-2.5 rounded-lg border border-slate-200 transition-all flex items-center justify-between group hover:bg-slate-50/70 hover:shadow-2xs ${stage.hoverBorder}`}
                  title={`Filter Questions by ${stage.label}`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-[10px] text-slate-400 font-mono">
                      #{idx + 1}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700 leading-tight truncate">
                      {stage.label}
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold font-mono border ${stage.badgeClass}`}>
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 shrink-0 ml-1.5">
                    <Icon className={`w-4 h-4 ${stage.iconColor}`} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
