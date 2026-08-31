import React from 'react';
import { ExternalLink, CheckCircle, Clock, AlertCircle, Link as LinkIcon, Youtube, Instagram, Facebook } from 'lucide-react';
import { Publishing, SocialPublishStatus } from '../../types';
import { SocialStatusBadge } from '../common/StatusBadge';

interface PublishingTableProps {
  records: Publishing[];
  onOpenRecord?: (record: Publishing) => void;
}

export const PublishingTable: React.FC<PublishingTableProps> = ({ records, onOpenRecord }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Video ID</th>
              <th className="py-3.5 px-4 font-semibold min-w-[220px]">Video Title & Ref</th>
              <th className="py-3.5 px-4 font-semibold">Master Asset</th>
              <th className="py-3.5 px-4 font-semibold text-center">
                <span className="inline-flex items-center gap-1">
                  <Youtube className="w-3.5 h-3.5 text-red-600" /> YouTube
                </span>
              </th>
              <th className="py-3.5 px-4 font-semibold text-center">
                <span className="inline-flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" /> Instagram
                </span>
              </th>
              <th className="py-3.5 px-4 font-semibold text-center">
                <span className="inline-flex items-center gap-1">
                  <Facebook className="w-3.5 h-3.5 text-blue-600" /> Facebook
                </span>
              </th>
              <th className="py-3.5 px-4 font-semibold">Checklist</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {records.map((rec) => (
              <tr
                key={rec.id}
                id={`row-publishing-${rec.id.toLowerCase()}`}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => onOpenRecord?.(rec)}
              >
                {/* Video ID */}
                <td className="py-3 px-4 font-mono font-medium text-indigo-600 whitespace-nowrap">
                  {rec.videoId}
                </td>

                {/* Title */}
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 leading-snug">{rec.videoTitle}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Ref: {rec.questionId}
                  </div>
                </td>

                {/* Master Render Status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />
                    {rec.finalVideoStatus}
                  </span>
                </td>

                {/* YouTube */}
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <div className="inline-flex flex-col items-center gap-1">
                    <SocialStatusBadge status={rec.youtube.status} />
                    {rec.youtube.videoUrl && (
                      <span className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5">
                        <LinkIcon className="w-2.5 h-2.5" /> URL Saved
                      </span>
                    )}
                  </div>
                </td>

                {/* Instagram */}
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <div className="inline-flex flex-col items-center gap-1">
                    <SocialStatusBadge status={rec.instagram.status} />
                    {rec.instagram.postUrl && (
                      <span className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5">
                        <LinkIcon className="w-2.5 h-2.5" /> URL Saved
                      </span>
                    )}
                  </div>
                </td>

                {/* Facebook */}
                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <div className="inline-flex flex-col items-center gap-1">
                    <SocialStatusBadge status={rec.facebook.status} />
                    {rec.facebook.postUrl && (
                      <span className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5">
                        <LinkIcon className="w-2.5 h-2.5" /> URL Saved
                      </span>
                    )}
                  </div>
                </td>

                {/* Pre-Publish Checklist */}
                <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          rec.thumbnailReady ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      <span>Thumbnail</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          rec.pinnedCommentReady ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                      <span>Pinned Comment</span>
                    </div>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onOpenRecord?.(rec)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    Manage Links
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
