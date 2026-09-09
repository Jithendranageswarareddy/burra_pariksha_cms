import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Share2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Check,
  Clock,
  Youtube,
  Instagram,
  Facebook,
  FileCheck,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Publishing, SocialPublishStatus, Video, VideoProductionStatus } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';

interface PublishingWorkspaceProps {
  video: Video;
  onStatusChange?: () => void;
}

export const PublishingWorkspace: React.FC<PublishingWorkspaceProps> = ({
  video,
  onStatusChange,
}) => {
  const [publishing, setPublishing] = useState<Publishing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Platform form state
  const [ytStatus, setYtStatus] = useState<SocialPublishStatus>(SocialPublishStatus.NOT_STARTED);
  const [ytUrl, setYtUrl] = useState<string>('');
  const [ytNotes, setYtNotes] = useState<string>('');

  const [igStatus, setIgStatus] = useState<SocialPublishStatus>(SocialPublishStatus.NOT_STARTED);
  const [igUrl, setIgUrl] = useState<string>('');
  const [igNotes, setIgNotes] = useState<string>('');

  const [fbStatus, setFbStatus] = useState<SocialPublishStatus>(SocialPublishStatus.NOT_STARTED);
  const [fbUrl, setFbUrl] = useState<string>('');
  const [fbNotes, setFbNotes] = useState<string>('');

  const [uploadPath, setUploadPath] = useState<string>(video.finalRenderPath || '');
  const [uploadRemarks, setUploadRemarks] = useState<string>('');

  const fetchPublishingData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getVideoPublishing(video.id);
      if (res) {
        setPublishing(res);
        setYtStatus(res.youtube?.status || SocialPublishStatus.NOT_STARTED);
        setYtUrl(res.youtube?.videoUrl || '');
        setYtNotes(res.youtube?.notes || '');

        setIgStatus(res.instagram?.status || SocialPublishStatus.NOT_STARTED);
        setIgUrl(res.instagram?.postUrl || '');
        setIgNotes(res.instagram?.notes || '');

        setFbStatus(res.facebook?.status || SocialPublishStatus.NOT_STARTED);
        setFbUrl(res.facebook?.postUrl || '');
        setFbNotes(res.facebook?.notes || '');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load publishing distribution data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublishingData();
  }, [video.id]);

  const handleSavePublishing = async () => {
    if (!publishing) return;
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updates: Partial<Publishing> = {
        youtube: {
          status: ytStatus,
          videoUrl: ytUrl,
          notes: ytNotes,
          publishedAt: ytStatus === SocialPublishStatus.PUBLISHED ? publishing.youtube?.publishedAt || new Date().toISOString() : undefined,
        },
        instagram: {
          status: igStatus,
          postUrl: igUrl,
          notes: igNotes,
          publishedAt: igStatus === SocialPublishStatus.PUBLISHED ? publishing.instagram?.publishedAt || new Date().toISOString() : undefined,
        },
        facebook: {
          status: fbStatus,
          postUrl: fbUrl,
          notes: fbNotes,
          publishedAt: fbStatus === SocialPublishStatus.PUBLISHED ? publishing.facebook?.publishedAt || new Date().toISOString() : undefined,
        },
      };

      const updated = await apiClient.updatePublishing(publishing.id, updates);
      setPublishing(updated);
      setSuccessMessage('Publishing distribution tracking records saved successfully to Google Sheets!');
      if (onStatusChange) onStatusChange();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update publishing record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickPublishPlatform = async (platform: 'youtube' | 'instagram' | 'facebook', url: string) => {
    if (!url) {
      setError(`Please enter a valid URL for ${platform} before marking as published.`);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const updated = await apiClient.markPlatformPublished(video.id, platform, url);
      setPublishing(updated);
      if (platform === 'youtube') setYtStatus(SocialPublishStatus.PUBLISHED);
      if (platform === 'instagram') setIgStatus(SocialPublishStatus.PUBLISHED);
      if (platform === 'facebook') setFbStatus(SocialPublishStatus.PUBLISHED);

      setSuccessMessage(`Marked ${platform.toUpperCase()} as PUBLISHED with live URL.`);
      if (onStatusChange) onStatusChange();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to record publish');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkVideoUploaded = async () => {
    try {
      setIsSaving(true);
      setError(null);
      if (uploadPath) {
        await apiClient.updateVideoMetadata(video.id, { finalRenderPath: uploadPath });
      }
      await apiClient.updateVideoStatus(
        video.id,
        VideoProductionStatus.UPLOADED,
        uploadRemarks || 'Manual upload recorded and verified'
      );
      setSuccessMessage('Video production state advanced to terminal UPLOADED state!');
      if (onStatusChange) onStatusChange();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to mark video uploaded');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
        <p className="text-xs">Loading manual publishing distribution records...</p>
      </div>
    );
  }

  const completedCount = publishing?.completedPlatformsCount || 0;
  const isAllPublished = completedCount >= 3;

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Manual Multi-Platform Publishing Management</h2>
              <span className="font-mono text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                {completedCount} / 3 Live
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Manual administrative upload tracking • Direct URLs • Live timestamp recording
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            disabled={isSaving}
            onClick={handleSavePublishing}
            className="text-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Distribution Records</span>
          </Button>

          {video.status === VideoProductionStatus.READY_TO_UPLOAD && (
            <Button
              variant="primary"
              size="sm"
              disabled={isSaving}
              onClick={handleMarkVideoUploaded}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Production Complete (UPLOADED)</span>
            </Button>
          )}
        </div>
      </div>

      {video.status === VideoProductionStatus.READY_TO_UPLOAD && (
        <div className="bg-emerald-50/60 rounded-xl border border-emerald-200 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            <span>Manual Upload Recording (Ready for UPLOADED State Transition)</span>
          </div>
          <p className="text-xs text-emerald-800">
            Record the final uploaded asset path or master file reference and optional upload notes before marking the production status as UPLOADED. This does not automatically publish to social platforms.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-emerald-900 mb-1">Uploaded Asset URL / Final Render Path</label>
              <input
                type="text"
                value={uploadPath}
                onChange={(e) => setUploadPath(e.target.value)}
                placeholder="e.g. s3://bucket/videos/BP-V-000001-final.mp4 or Drive Link"
                className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-emerald-900 mb-1">Upload Notes / Verification Remarks</label>
              <input
                type="text"
                value={uploadRemarks}
                onChange={(e) => setUploadRemarks(e.target.value)}
                placeholder="e.g. Verified 1080p master exported and uploaded"
                className="w-full bg-white border border-emerald-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              disabled={isSaving}
              onClick={handleMarkVideoUploaded}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              icon={CheckCircle2}
            >
              Confirm Manual Upload & Transition to UPLOADED
            </Button>
          </div>
        </div>
      )}

      {/* Readiness Pre-Flight Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Pre-Publishing Asset Checklist
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Item 1: Thumbnail */}
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              publishing?.thumbnailReady
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/70 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {publishing?.thumbnailReady ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="font-semibold">Thumbnail Graphic</span>
            </div>
            <span className="text-[11px] font-bold">
              {publishing?.thumbnailReady ? 'APPROVED' : 'PENDING'}
            </span>
          </div>

          {/* Item 2: Pinned Comment */}
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              publishing?.pinnedCommentReady
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/70 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2">
              {publishing?.pinnedCommentReady ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span className="font-semibold">Pinned Comment</span>
            </div>
            <span className="text-[11px] font-bold">
              {publishing?.pinnedCommentReady ? 'READY' : 'DRAFT'}
            </span>
          </div>

          {/* Item 3: Render Duration */}
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              video.actualDurationSeconds
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-slate-50 border-slate-300 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {video.actualDurationSeconds ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="font-semibold">Rendered Video File</span>
            </div>
            <span className="text-[11px] font-mono font-bold">
              {video.actualDurationSeconds ? `${video.actualDurationSeconds}s verified` : 'Pending render'}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Platform Channel Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. YouTube Shorts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Youtube className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">YouTube Shorts</h4>
            </div>
            <select
              value={ytStatus}
              onChange={(e) => setYtStatus(e.target.value as SocialPublishStatus)}
              className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white font-medium"
            >
              <option value={SocialPublishStatus.NOT_STARTED}>Not Started</option>
              <option value={SocialPublishStatus.DRAFT}>Draft</option>
              <option value={SocialPublishStatus.SCHEDULED}>Scheduled</option>
              <option value={SocialPublishStatus.PUBLISHED}>Published</option>
              <option value={SocialPublishStatus.FAILED}>Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Shorts Video Link / URL
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={ytUrl}
                onChange={(e) => setYtUrl(e.target.value)}
                placeholder="https://youtube.com/shorts/..."
                className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-red-500 font-mono text-slate-800"
              />
              {ytUrl && (
                <a
                  href={ytUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Publishing Remarks / Scheduled Time
            </label>
            <input
              type="text"
              value={ytNotes}
              onChange={(e) => setYtNotes(e.target.value)}
              placeholder="e.g. Scheduled for 7:00 PM IST"
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
            />
          </div>

          {publishing?.youtube?.publishedAt && (
            <p className="text-[10px] text-slate-400 font-mono">
              Published: {new Date(publishing.youtube.publishedAt).toLocaleString()}
            </p>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={isSaving || !ytUrl}
            onClick={() => handleQuickPublishPlatform('youtube', ytUrl)}
            className="w-full text-xs text-red-600 border-red-200 hover:bg-red-50"
          >
            Mark YouTube Published
          </Button>
        </div>

        {/* 2. Instagram Reels */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                <Instagram className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Instagram Reels</h4>
            </div>
            <select
              value={igStatus}
              onChange={(e) => setIgStatus(e.target.value as SocialPublishStatus)}
              className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white font-medium"
            >
              <option value={SocialPublishStatus.NOT_STARTED}>Not Started</option>
              <option value={SocialPublishStatus.DRAFT}>Draft</option>
              <option value={SocialPublishStatus.SCHEDULED}>Scheduled</option>
              <option value={SocialPublishStatus.PUBLISHED}>Published</option>
              <option value={SocialPublishStatus.FAILED}>Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Reels Post Link / URL
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={igUrl}
                onChange={(e) => setIgUrl(e.target.value)}
                placeholder="https://instagram.com/reel/..."
                className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-pink-500 font-mono text-slate-800"
              />
              {igUrl && (
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Audio Track / Caption Notes
            </label>
            <input
              type="text"
              value={igNotes}
              onChange={(e) => setIgNotes(e.target.value)}
              placeholder="e.g. Trending audio added, pinned comment attached"
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
            />
          </div>

          {publishing?.instagram?.publishedAt && (
            <p className="text-[10px] text-slate-400 font-mono">
              Published: {new Date(publishing.instagram.publishedAt).toLocaleString()}
            </p>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={isSaving || !igUrl}
            onClick={() => handleQuickPublishPlatform('instagram', igUrl)}
            className="w-full text-xs text-pink-600 border-pink-200 hover:bg-pink-50"
          >
            Mark Instagram Published
          </Button>
        </div>

        {/* 3. Facebook Video */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Facebook className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Facebook Video</h4>
            </div>
            <select
              value={fbStatus}
              onChange={(e) => setFbStatus(e.target.value as SocialPublishStatus)}
              className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white font-medium"
            >
              <option value={SocialPublishStatus.NOT_STARTED}>Not Started</option>
              <option value={SocialPublishStatus.DRAFT}>Draft</option>
              <option value={SocialPublishStatus.SCHEDULED}>Scheduled</option>
              <option value={SocialPublishStatus.PUBLISHED}>Published</option>
              <option value={SocialPublishStatus.FAILED}>Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Facebook Video Link / URL
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={fbUrl}
                onChange={(e) => setFbUrl(e.target.value)}
                placeholder="https://facebook.com/watch/..."
                className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-slate-800"
              />
              {fbUrl && (
                <a
                  href={fbUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              Page / Group Notes
            </label>
            <input
              type="text"
              value={fbNotes}
              onChange={(e) => setFbNotes(e.target.value)}
              placeholder="e.g. Cross-posted to Burra Pariksha Group"
              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
            />
          </div>

          {publishing?.facebook?.publishedAt && (
            <p className="text-[10px] text-slate-400 font-mono">
              Published: {new Date(publishing.facebook.publishedAt).toLocaleString()}
            </p>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={isSaving || !fbUrl}
            onClick={() => handleQuickPublishPlatform('facebook', fbUrl)}
            className="w-full text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            Mark Facebook Published
          </Button>
        </div>
      </div>
    </div>
  );
};
