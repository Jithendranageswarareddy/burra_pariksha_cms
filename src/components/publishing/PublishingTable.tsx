import React, { useState } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Link as LinkIcon,
  Youtube,
  Instagram,
  Facebook,
  Copy,
  RotateCcw,
  UserCheck,
  UserX,
  Share2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Check,
} from 'lucide-react';
import {
  Publishing,
  SocialPublishStatus,
  PlatformType,
  Video,
  Assignment,
  PublishingReadinessItem,
  CanonicalProductionReadiness,
  VideoProductionStatus,
} from '../../types';
import { SocialStatusBadge, VideoStatusBadge } from '../common/StatusBadge';
import { ProductionAssetValidationService } from '../../lib/services/production-asset-validation.service';

export interface PublishingTableProps {
  records: Publishing[];
  videoMap: Record<string, Video>;
  readinessMap: Record<string, PublishingReadinessItem>;
  assignmentsMap: Record<string, Assignment[]>;
  onOpenRecord?: (record: Publishing) => void;
  onCopyPackage?: (record: Publishing, platform?: PlatformType) => void;
  onSchedulePlatform?: (record: Publishing, platform: PlatformType, isReschedule?: boolean) => void;
  onRetryPlatform?: (record: Publishing, platform: PlatformType) => void;
  onPublishPlatform?: (record: Publishing, platform: PlatformType) => void;
  onAssignVideo?: (record: Publishing, platform?: PlatformType, currentAssignment?: Assignment) => void;
  onFinalizePublishing?: (record: Publishing) => void;
  onMarkFailed?: (record: Publishing, platform: PlatformType) => void;
}

export const PublishingTable: React.FC<PublishingTableProps> = ({
  records,
  videoMap,
  readinessMap,
  assignmentsMap,
  onOpenRecord,
  onCopyPackage,
  onSchedulePlatform,
  onRetryPlatform,
  onPublishPlatform,
  onAssignVideo,
  onFinalizePublishing,
}) => {
  const [expandedBlockerVideoId, setExpandedBlockerVideoId] = useState<string | null>(null);

  const getCanonicalReadinessBadge = (readinessStatus?: CanonicalProductionReadiness) => {
    switch (readinessStatus) {
      case CanonicalProductionReadiness.READY_FOR_PUBLISHING:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            F: Ready For Publishing
          </span>
        );
      case CanonicalProductionReadiness.EDITING_COMPLETE:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            E: Editing Complete
          </span>
        );
      case CanonicalProductionReadiness.RENDER_VALID_BUT_EDITING:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            D: Render Valid (Editing)
          </span>
        );
      case CanonicalProductionReadiness.RENDER_INVALID:
      case CanonicalProductionReadiness.RENDER_METADATA_INCOMPLETE:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Render Incomplete
          </span>
        );
      case CanonicalProductionReadiness.RENDER_NOT_STARTED:
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Render Not Started
          </span>
        );
    }
  };

  const formatLocalTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const renderPlatformCell = (
    rec: Publishing,
    platform: PlatformType,
    platformName: string,
    Icon: React.FC<{ className?: string }>
  ) => {
    const platformInfo = rec[platform];
    const status = platformInfo?.status || SocialPublishStatus.NOT_STARTED;
    const isPublished = status === SocialPublishStatus.PUBLISHED;
    const isScheduled = status === SocialPublishStatus.SCHEDULED;
    const isFailed = status === SocialPublishStatus.FAILED;

    const publicUrl =
      platform === 'youtube'
        ? platformInfo?.videoUrl
        : platformInfo?.postUrl;

    const scheduledAt = platformInfo?.scheduledAt || (rec as any)[`${platform}ScheduledAt`];
    const lastFailureReason = platformInfo?.lastFailureReason || (rec as any)[`${platform}LastFailureReason`];
    const retryCount = platformInfo?.retryCount ?? (rec as any)[`${platform}RetryCount`] ?? 0;

    return (
      <td className="py-3 px-3.5 align-top">
        <div className="flex flex-col gap-1.5">
          {/* Status Badge */}
          <div className="flex items-center justify-between gap-1">
            <SocialStatusBadge status={status} />
            {isPublished && publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => e.stopPropagation()}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                title={`Open published ${platformName} link`}
              >
                <span>Live</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* Scheduled Info */}
          {isScheduled && scheduledAt && (
            <div
              className="text-[10px] text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono"
              title={`Server UTC: ${scheduledAt}`}
            >
              <Clock className="w-3 h-3 text-blue-600 shrink-0" />
              <span className="truncate">{formatLocalTime(scheduledAt)}</span>
            </div>
          )}

          {/* Failure Info */}
          {isFailed && (
            <div
              className="text-[10px] text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-1 rounded space-y-0.5 max-w-[170px]"
              title={lastFailureReason || 'Publishing attempt failed'}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1 text-rose-700">
                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Failed</span>
                </span>
                {retryCount > 0 && (
                  <span className="font-mono bg-rose-200/80 text-rose-900 px-1 rounded text-[9px]">
                    #{retryCount}
                  </span>
                )}
              </div>
              <div className="truncate text-slate-700 font-mono text-[9.5px]">
                {lastFailureReason || 'Publishing error'}
              </div>
            </div>
          )}

          {/* Context-Sensitive Actions */}
          <div className="flex flex-wrap items-center gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
            {/* Copy Package: available for all non-published states */}
            {!isPublished && (
              <button
                type="button"
                onClick={() => onCopyPackage?.(rec, platform)}
                className="px-1.5 py-0.5 text-[10px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-0.5 border border-slate-200"
                title={`Copy approved social package for ${platformName}`}
              >
                <Copy className="w-2.5 h-2.5 text-slate-500" />
                <span>Package</span>
              </button>
            )}

            {/* If Not Published & Not Failed: Schedule */}
            {!isPublished && !isFailed && (
              <button
                type="button"
                onClick={() => onSchedulePlatform?.(rec, platform, isScheduled)}
                className="px-1.5 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors flex items-center gap-0.5 border border-blue-200"
                title={isScheduled ? `Reschedule ${platformName}` : `Schedule ${platformName}`}
              >
                <Clock className="w-2.5 h-2.5 text-blue-600" />
                <span>{isScheduled ? 'Reschedule' : 'Schedule'}</span>
              </button>
            )}

            {/* If Failed: Retry or Reschedule */}
            {isFailed && (
              <button
                type="button"
                onClick={() => onRetryPlatform?.(rec, platform)}
                className="px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition-colors flex items-center gap-0.5 border border-rose-200"
                title={`Retry failed ${platformName} publishing`}
              >
                <RotateCcw className="w-2.5 h-2.5 text-rose-600" />
                <span>Retry</span>
              </button>
            )}

            {/* Record Live URL: only if not published */}
            {!isPublished && (
              <button
                type="button"
                onClick={() => onPublishPlatform?.(rec, platform)}
                className="px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors flex items-center gap-0.5 border border-emerald-200"
                title={`Record verified live public URL for ${platformName}`}
              >
                <LinkIcon className="w-2.5 h-2.5 text-emerald-600" />
                <span>Record URL</span>
              </button>
            )}

            {/* If Published: show view link indicator (No Retry, No Schedule) */}
            {isPublished && publicUrl && (
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                <Check className="w-3 h-3 text-emerald-600" /> Verified Live
              </span>
            )}
          </div>
        </div>
      </td>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 min-w-[200px]">Video Reference</th>
              <th className="py-3 px-3.5 min-w-[150px]">Production Status</th>
              <th className="py-3 px-3.5 min-w-[140px]">Gate D Readiness</th>
              <th className="py-3 px-3.5 min-w-[150px]">Publishing Owner</th>
              <th className="py-3 px-3.5 min-w-[170px]">
                <span className="inline-flex items-center gap-1 text-red-700">
                  <Youtube className="w-3.5 h-3.5" /> YouTube Shorts
                </span>
              </th>
              <th className="py-3 px-3.5 min-w-[170px]">
                <span className="inline-flex items-center gap-1 text-pink-700">
                  <Instagram className="w-3.5 h-3.5" /> Instagram Reels
                </span>
              </th>
              <th className="py-3 px-3.5 min-w-[170px]">
                <span className="inline-flex items-center gap-1 text-blue-700">
                  <Facebook className="w-3.5 h-3.5" /> Facebook Video
                </span>
              </th>
              <th className="py-3 px-4 text-right min-w-[130px]">Finalize / Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {records.map((rec) => {
              const video = videoMap[rec.videoId];
              const readiness = readinessMap[rec.videoId];
              const videoAssignments = assignmentsMap[rec.videoId] || [];
              const activeAssignment = videoAssignments.find(
                (a) => a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS'
              );

              // Readiness evaluation
              const isGateDReady = readiness?.status === 'READY' || rec.finalVideoStatus === 'VERIFIED';
              const blockers = readiness?.missingItems || [];
              const hasBlockers = blockers.length > 0;
              const isBlockerExpanded = expandedBlockerVideoId === rec.videoId;

              // Finalize readiness: ALL configured platforms published and video not yet UPLOADED
              const ytPub = rec.youtube?.status === SocialPublishStatus.PUBLISHED;
              const igPub = rec.instagram?.status === SocialPublishStatus.PUBLISHED;
              const fbPub = rec.facebook?.status === SocialPublishStatus.PUBLISHED;
              const liveCount = (ytPub ? 1 : 0) + (igPub ? 1 : 0) + (fbPub ? 1 : 0);
              const totalConfigured = rec.totalPlatformsCount || 3;
              const isAlreadyUploaded = video?.status === VideoProductionStatus.UPLOADED;
              const canFinalize = liveCount === totalConfigured && ytPub && igPub && fbPub && !isAlreadyUploaded;

              return (
                <tr
                  key={rec.id}
                  id={`row-publishing-${(rec.id || '').toLowerCase()}`}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {/* Video Reference */}
                  <td className="py-3 px-4 align-top">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-700 text-xs">
                          {rec.videoId}
                        </span>
                        {video?.priority && (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                            video.priority === 'URGENT'
                              ? 'bg-red-100 text-red-800'
                              : video.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {video.priority}
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-slate-900 leading-snug line-clamp-2">
                        {rec.videoTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Question: {rec.questionId}
                      </div>
                    </div>
                  </td>

                  {/* Production Status & Canonical Readiness */}
                  <td className="py-3 px-3.5 align-top">
                    <div className="space-y-1.5">
                      <VideoStatusBadge status={video?.status || (rec.finalVideoStatus as any)} size="sm" />
                      <div>
                        {getCanonicalReadinessBadge(
                          video
                            ? ProductionAssetValidationService.determineReadiness(video, { isReady: isGateDReady })
                            : undefined
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Gate D Readiness */}
                  <td className="py-3 px-3.5 align-top">
                    <div className="space-y-1">
                      {isGateDReady ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Gate D Ready</span>
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedBlockerVideoId(isBlockerExpanded ? null : rec.videoId)
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors text-left"
                            title="Click to view Gate D publish blockers"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Gate D Blocked</span>
                            {hasBlockers && (
                              isBlockerExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />
                            )}
                          </button>

                          {isBlockerExpanded && hasBlockers && (
                            <div className="p-2 bg-rose-50/90 rounded border border-rose-200 text-[10px] text-rose-900 space-y-1 animate-in fade-in max-w-[200px]">
                              <div className="font-semibold text-rose-950">Missing Pre-requisites:</div>
                              <ul className="list-disc list-inside space-y-0.5 font-mono text-[9.5px]">
                                {blockers.map((b, idx) => (
                                  <li key={idx} className="leading-tight break-words">{b}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Checklist badges */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${rec.thumbnailReady ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span>Thumbnail</span>
                        <span className="text-slate-300">•</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${rec.pinnedCommentReady ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span>Pinned</span>
                      </div>
                    </div>
                  </td>

                  {/* Publishing Owner / Assignee */}
                  <td className="py-3 px-3.5 align-top">
                    <div className="space-y-1.5">
                      {activeAssignment ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-slate-900 font-semibold text-xs">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{activeAssignment.assigneeName}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                            <span className="px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {activeAssignment.status}
                            </span>
                            {activeAssignment.platform && (
                              <span className="uppercase text-slate-600">
                                [{activeAssignment.platform}]
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onAssignVideo?.(rec, activeAssignment.platform, activeAssignment)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium underline"
                          >
                            Reassign
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <UserX className="w-3 h-3 text-slate-400" />
                            <span>Unassigned</span>
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => onAssignVideo?.(rec)}
                              className="px-2 py-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                            >
                              Assign Work
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* YouTube Platform Cell */}
                  {renderPlatformCell(rec, 'youtube', 'YouTube Shorts', Youtube)}

                  {/* Instagram Platform Cell */}
                  {renderPlatformCell(rec, 'instagram', 'Instagram Reels', Instagram)}

                  {/* Facebook Platform Cell */}
                  {renderPlatformCell(rec, 'facebook', 'Facebook Video', Facebook)}

                  {/* Overall Actions / Finalize */}
                  <td className="py-3 px-4 align-top text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end gap-1.5">
                      {isAlreadyUploaded ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>UPLOADED</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onFinalizePublishing?.(rec)}
                          disabled={!canFinalize}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 border ${
                            canFinalize
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                          }`}
                          title={
                            canFinalize
                              ? 'Finalize publishing workflow (moves video to UPLOADED)'
                              : `Requires all ${totalConfigured} configured target platforms to be PUBLISHED (${liveCount}/${totalConfigured} published)`
                          }
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Finalize</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenRecord?.(rec)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        Manage Links
                      </button>
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
