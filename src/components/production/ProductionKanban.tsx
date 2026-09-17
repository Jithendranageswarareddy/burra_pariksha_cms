import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, ArrowRight, ExternalLink, PauseCircle, Film } from 'lucide-react';
import { PriorityLevel, Video, VideoProductionStatus } from '../../types';
import { PRIORITY_CONFIG, VIDEO_STATUS_CONFIG } from '../../config/constants';
import { formatDisplayId } from '../../utils/formatters';

interface ProductionKanbanProps {
  videos: Video[];
  onSelectVideo?: (video: Video) => void;
  onQuickMove?: (videoId: string, nextStatus: VideoProductionStatus) => void;
  targetTab?: string;
}

const KANBAN_COLUMNS: {
  status: VideoProductionStatus;
  label: string;
  subStatuses?: VideoProductionStatus[];
}[] = [
  {
    status: VideoProductionStatus.QUEUED,
    label: 'Intake Queue',
    subStatuses: [VideoProductionStatus.SCRIPT_REQUIRED],
  },
  {
    status: VideoProductionStatus.SCRIPT_READY,
    label: 'Script Ready',
  },
  {
    status: VideoProductionStatus.RECORDING,
    label: 'Filming / Studio',
    subStatuses: [VideoProductionStatus.RECORDED],
  },
  {
    status: VideoProductionStatus.EDITING,
    label: 'Editing / Post',
    subStatuses: [VideoProductionStatus.EDITED],
  },
  {
    status: VideoProductionStatus.FINAL_REVIEW,
    label: 'Final Review / QC',
  },
  {
    status: VideoProductionStatus.READY_TO_UPLOAD,
    label: 'Ready to Upload',
  },
  {
    status: VideoProductionStatus.UPLOADED,
    label: 'Uploaded & Published',
  },
];

export const ProductionKanban: React.FC<ProductionKanbanProps> = ({
  videos,
  onSelectVideo,
  targetTab,
}) => {
  const navigate = useNavigate();

  const getVideosForColumn = (col: typeof KANBAN_COLUMNS[0]) => {
    return videos.filter((v) => {
      if (v.status === col.status) return true;
      if (col.subStatuses && col.subStatuses.includes(v.status)) return true;
      return false;
    });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[580px]">
      {KANBAN_COLUMNS.map((col) => {
        const columnVideos = getVideosForColumn(col);
        const colConfig = VIDEO_STATUS_CONFIG[col.status] || {
          bg: 'bg-slate-100',
          text: 'text-slate-800',
          border: 'border-slate-300',
        };

        return (
          <div
            key={col.status}
            className="flex-shrink-0 w-72 bg-slate-100/95 rounded-xl p-3 border border-slate-200 flex flex-col max-h-[78vh]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1 mb-2.5">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${colConfig.bg} border ${colConfig.border}`} />
                <h4 className="text-xs font-bold text-slate-800 tracking-tight">{col.label}</h4>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold">
                {columnVideos.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {columnVideos.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white/40">
                  No items in stage
                </div>
              ) : (
                columnVideos.map((video) => {
                  const priorityConfig =
                    PRIORITY_CONFIG[video.priority] || PRIORITY_CONFIG[PriorityLevel.NORMAL];

                  return (
                    <div
                      key={video.id}
                      id={`kanban-card-${(video.id || '').toLowerCase()}`}
                      onClick={() => {
                        if (onSelectVideo) {
                          onSelectVideo(video);
                        } else {
                          navigate(targetTab ? `/production/${video.id}?tab=${targetTab}` : `/production/${video.id}`);
                        }
                      }}
                      className="bg-white p-3.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all cursor-pointer space-y-2.5 group"
                    >
                      {/* Top IDs & Priority Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-indigo-600 px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded">
                          {formatDisplayId(video.contentMasterId || video.id, 'video')}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${priorityConfig.bg} ${priorityConfig.text}`}
                        >
                          {priorityConfig.label}
                        </span>
                      </div>

                      {/* Video Title */}
                      <h5 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {video.title}
                      </h5>

                      {video.finalRenderPath && (
                        <div className="flex items-center gap-1">
                          <span className={`px-1 rounded text-[9px] font-mono font-bold border ${
                            video.finalRenderValidationStatus === 'VALID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : video.finalRenderValidationStatus === 'INVALID'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            RENDER: {video.finalRenderValidationStatus || 'NOT_VALIDATED'}
                          </span>
                        </div>
                      )}

                      {/* Sub-status Indicator if different from column */}
                      {video.status !== col.status && (
                        <div className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded inline-block font-medium">
                          Status: {VIDEO_STATUS_CONFIG[video.status]?.label || video.status}
                        </div>
                      )}

                      {/* Metadata Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1 truncate max-w-[120px]">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {video.assignedHost || video.assignedEditor || 'Unassigned'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {video.actualDurationSeconds
                              ? `${video.actualDurationSeconds}s`
                              : `${video.targetDurationSeconds || 45}s`}
                          </span>
                        </div>
                      </div>

                      {/* Question Ref & Direct Open Button */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                        <span>Ref: {video.questionId}</span>
                        <span className="text-indigo-600 group-hover:underline flex items-center gap-0.5 font-sans font-semibold">
                          <span>Workspace</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
