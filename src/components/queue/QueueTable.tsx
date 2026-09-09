import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlayCircle, FileText, ArrowRight, Video as VideoIcon } from 'lucide-react';
import { DifficultyBadge } from '../common/DifficultyBadge';
import { VideoStatusBadge } from '../common/StatusBadge';
import { PRIORITY_CONFIG } from '../../config/constants';
import { DifficultyLevel, PriorityLevel, Video } from '../../types';

interface QueueTableProps {
  videos: Video[];
  onSelectVideo?: (video: Video) => void;
}

export const QueueTable: React.FC<QueueTableProps> = ({ videos, onSelectVideo }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold text-center w-16">#</th>
              <th className="py-3.5 px-4 font-semibold">Video ID</th>
              <th className="py-3.5 px-4 font-semibold min-w-[240px]">Title & Question Reference</th>
              <th className="py-3.5 px-4 font-semibold">Category & Topic</th>
              <th className="py-3.5 px-4 font-semibold">Difficulty</th>
              <th className="py-3.5 px-4 font-semibold">Priority</th>
              <th className="py-3.5 px-4 font-semibold">Production Stage</th>
              <th className="py-3.5 px-4 font-semibold">Host / Editor</th>
              <th className="py-3.5 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {videos.map((item, idx) => {
              const priorityConfig = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG[PriorityLevel.NORMAL];

              return (
                <tr
                  key={item.id}
                  id={`row-queue-${(item.id || '').toLowerCase()}`}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  onClick={() => {
                    if (onSelectVideo) {
                      onSelectVideo(item);
                    } else {
                      navigate(`/production/${item.id}`);
                    }
                  }}
                >
                  {/* Position Index */}
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                    <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-800">
                      {idx + 1}
                    </span>
                  </td>

                  {/* Video ID */}
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600 whitespace-nowrap">
                    <Link
                      to={`/production/${item.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline flex items-center gap-1"
                    >
                      {item.id}
                    </Link>
                  </td>

                  {/* Video Title & Question Reference */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 leading-snug">{item.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>Ref:</span>
                      <Link
                        to={`/questions/${item.questionId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-600 hover:underline font-semibold"
                      >
                        {item.questionId}
                      </Link>
                    </div>
                  </td>

                  {/* Category & Topic */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="text-slate-900 font-medium">{item.question?.categoryName || 'General Aptitude'}</div>
                    <div className="text-[11px] text-slate-500">{item.question?.topicName || 'Speed Math'}</div>
                  </td>

                  {/* Difficulty */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.question?.difficulty ? (
                      <DifficultyBadge difficulty={item.question.difficulty as DifficultyLevel} size="sm" />
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${priorityConfig.bg} ${priorityConfig.text}`}
                    >
                      {priorityConfig.label}
                    </span>
                  </td>

                  {/* Production Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <VideoStatusBadge status={item.status} size="sm" />
                  </td>

                  {/* Host / Editor */}
                  <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                    <div>{item.assignedHost || '—'}</div>
                    {item.assignedEditor && (
                      <div className="text-[10px] text-slate-400">Ed: {item.assignedEditor}</div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/production/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                        title="Open Production Workspace"
                      >
                        <span>Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
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
