import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, PriorityLevel } from '../../types';
import { VideoStatusBadge } from '../common/StatusBadge';
import { PRIORITY_CONFIG } from '../../config/constants';
import { PipelineProgress } from './PipelineProgress';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { formatDisplayId } from '../../utils/formatters';

interface ProductionTableProps {
  videos: Video[];
  onSelectVideo?: (video: Video) => void;
  targetTab?: string;
}

export const ProductionTable: React.FC<ProductionTableProps> = ({ videos, onSelectVideo, targetTab }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Video ID</th>
              <th className="py-3.5 px-4 font-semibold min-w-[240px]">Title & Question Ref</th>
              <th className="py-3.5 px-4 font-semibold">Stage / Status</th>
              <th className="py-3.5 px-4 font-semibold min-w-[140px]">Pipeline Flow</th>
              <th className="py-3.5 px-4 font-semibold">Priority</th>
              <th className="py-3.5 px-4 font-semibold">Assigned Staff</th>
              <th className="py-3.5 px-4 font-semibold">Duration</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {videos.map((v) => {
              const priorityConfig = PRIORITY_CONFIG[v.priority] || PRIORITY_CONFIG[PriorityLevel.NORMAL];
              const videoDetailUrl = targetTab ? `/videos/${v.id}?tab=${targetTab}` : `/videos/${v.id}`;

              return (
                <tr
                  key={v.id}
                  id={`row-video-${(v.id || '').toLowerCase()}`}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => {
                    if (onSelectVideo) {
                      onSelectVideo(v);
                    } else {
                      navigate(videoDetailUrl);
                    }
                  }}
                >
                  {/* Video ID */}
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                    <Link
                      to={videoDetailUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline"
                    >
                      {formatDisplayId(v.contentMasterId || v.id, 'video')}
                    </Link>
                  </td>

                  {/* Title & Question Ref */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {v.title}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                      <span>Ref:</span>
                      <Link
                        to={`/questions/${v.questionId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-600 hover:underline font-semibold"
                      >
                        {formatDisplayId(v.questionId, 'question')}
                      </Link>
                      {v.question?.topicName && (
                        <span>• {v.question.topicName}</span>
                      )}
                    </div>
                    {v.finalRenderPath && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                          v.finalRenderValidationStatus === 'VALID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : v.finalRenderValidationStatus === 'INVALID'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          RENDER: {v.finalRenderValidationStatus || 'NOT_VALIDATED'}
                        </span>
                        {v.finalRenderWidth && v.finalRenderHeight && (
                          <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">
                            {v.finalRenderWidth}x{v.finalRenderHeight}
                          </span>
                        )}
                        {v.finalRenderFormat && (
                          <span className="text-slate-400 font-mono">
                            {v.finalRenderFormat}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Stage / Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <VideoStatusBadge status={v.status} size="sm" />
                  </td>

                  {/* Pipeline Flow Bar */}
                  <td className="py-3 px-4">
                    <PipelineProgress currentStatus={v.status} compact />
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${priorityConfig.bg} ${priorityConfig.text}`}
                    >
                      {priorityConfig.label}
                    </span>
                  </td>

                  {/* Assigned Staff */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                    <div>{v.assignedHost || '—'}</div>
                    {v.assignedEditor && (
                      <div className="text-[10px] text-slate-400">Ed: {v.assignedEditor}</div>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                    {v.actualDurationSeconds
                      ? `${v.actualDurationSeconds}s (actual)`
                      : `${v.targetDurationSeconds || 45}s target`}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <Link
                      to={`/production/${v.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                    >
                      <span>Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
