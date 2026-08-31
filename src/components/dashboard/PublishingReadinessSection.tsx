import React from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Youtube,
  Instagram,
  Facebook,
  Share2,
} from 'lucide-react';
import { PublishingReadinessItem, SocialPublishStatus } from '../../types';

interface PublishingReadinessSectionProps {
  items: PublishingReadinessItem[];
}

export const PublishingReadinessSection: React.FC<PublishingReadinessSectionProps> = ({ items }) => {
  const getStatusBadge = (status: 'READY' | 'BLOCKED' | 'INCOMPLETE') => {
    switch (status) {
      case 'READY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      case 'INCOMPLETE':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      case 'BLOCKED':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
    }
  };

  const getPlatformIconColor = (status: SocialPublishStatus) => {
    switch (status) {
      case SocialPublishStatus.PUBLISHED:
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case SocialPublishStatus.UPLOADED:
      case SocialPublishStatus.SCHEDULED:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case SocialPublishStatus.DRAFT:
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-slate-400 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-100">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Publishing Readiness & Multi-Platform Matrix</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-100">
                {items.filter((i) => i.status === 'READY').length} Ready for Upload
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verifying 9:16 vertical render, thumbnail sign-off, pinned Telugu explanation, and platform URLs
            </p>
          </div>
        </div>

        <Link
          to="/publishing"
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Open Publishing Manager</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 text-slate-500 text-xs">
          No videos currently in final review or ready-to-upload state.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {items.map((item) => (
            <div
              key={item.videoId}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                item.status === 'READY'
                  ? 'bg-emerald-50/20 border-emerald-200 hover:border-emerald-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                    {item.videoId}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">
                  {item.title}
                </h4>

                {/* Pre-flight Checklist */}
                <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
                  <div
                    className={`p-1.5 rounded border text-center font-medium ${
                      item.videoRenderReady
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    Render
                  </div>
                  <div
                    className={`p-1.5 rounded border text-center font-medium ${
                      item.thumbnailApproved
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    Thumbnail
                  </div>
                  <div
                    className={`p-1.5 rounded border text-center font-medium ${
                      item.pinnedCommentReady
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    Pinned Post
                  </div>
                </div>

                {item.missingItems.length > 0 && (
                  <div className="text-[10px] text-amber-700 bg-amber-50/80 p-2 rounded border border-amber-200 space-y-0.5">
                    <div className="font-semibold">Missing pre-flight items:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {item.missingItems.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Platform Status Bar */}
              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Platforms:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getPlatformIconColor(
                        item.platforms.youtube
                      )}`}
                      title={`YouTube Shorts: ${item.platforms.youtube}`}
                    >
                      YT: {item.platforms.youtube}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getPlatformIconColor(
                        item.platforms.instagram
                      )}`}
                      title={`Instagram Reels: ${item.platforms.instagram}`}
                    >
                      IG: {item.platforms.instagram}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getPlatformIconColor(
                        item.platforms.facebook
                      )}`}
                      title={`Facebook: ${item.platforms.facebook}`}
                    >
                      FB: {item.platforms.facebook}
                    </span>
                  </div>
                </div>

                <Link
                  to={item.actionUrl}
                  className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  <span>Open Publishing Record</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
