import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Save,
  GitBranch,
  History,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  Check,
  XCircle,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Thumbnail, ThumbnailVersion } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';

interface ThumbnailWorkspaceProps {
  videoId: string;
  videoTitle: string;
  onStatusChange?: () => void;
}

export const ThumbnailWorkspace: React.FC<ThumbnailWorkspaceProps> = ({
  videoId,
  videoTitle,
  onStatusChange,
}) => {
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
  const [versions, setVersions] = useState<ThumbnailVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [hookHeadline, setHookHeadline] = useState<string>('');
  const [driveAssetUrl, setDriveAssetUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [status, setStatus] = useState<'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Version modal
  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);
  const [designerNotes, setDesignerNotes] = useState<string>('');

  const fetchThumbnailData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getThumbnail(videoId);
      if (res.thumbnail) {
        setThumbnail(res.thumbnail);
        setHookHeadline(res.thumbnail.hookHeadline || '');
        setDriveAssetUrl(res.thumbnail.driveAssetUrl || '');
        setPreviewUrl(res.thumbnail.previewUrl || '');
        setStatus(res.thumbnail.status || 'PENDING');

        // Fetch version history
        const vers = await apiClient.getThumbnailVersions(res.thumbnail.id);
        setVersions(vers);
      } else if (res.draftProposal) {
        setHookHeadline(res.draftProposal.hookHeadline || videoTitle);
        setStatus(res.draftProposal.status || 'PENDING');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load thumbnail data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchThumbnailData();
  }, [videoId]);

  const handleSave = async (createNewVersion: boolean) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        hookHeadline,
        driveAssetUrl,
        previewUrl,
        status,
        createNewVersion,
        designerNotes: createNewVersion ? designerNotes || 'Thumbnail graphic update' : undefined,
      };

      const res = await apiClient.saveThumbnail(videoId, payload);
      setThumbnail(res.thumbnail);

      if (res.thumbnail) {
        const vers = await apiClient.getThumbnailVersions(res.thumbnail.id);
        setVersions(vers);
      }

      setSuccessMessage(
        createNewVersion
          ? `Thumbnail Version ${res.thumbnail.currentVersion} snapshot committed!`
          : 'Thumbnail details saved successfully.'
      );
      setShowVersionModal(false);
      setDesignerNotes('');
      if (onStatusChange) onStatusChange();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save thumbnail');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: 'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED') => {
    if (!thumbnail) {
      setStatus(newStatus);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const updated = await apiClient.updateThumbnailStatus(
        thumbnail.id,
        newStatus,
        `Status changed to ${newStatus} in Thumbnail Workspace`
      );
      setThumbnail(updated);
      setStatus(updated.status);
      setSuccessMessage(`Thumbnail status updated to ${newStatus}. (Synchronized with PUBLISHING checklist)`);
      if (onStatusChange) onStatusChange();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'APPROVED':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-0.5 rounded text-xs">APPROVED</span>;
      case 'DESIGNED':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 font-bold px-2.5 py-0.5 rounded text-xs">DESIGNED / IN REVIEW</span>;
      case 'REJECTED':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2.5 py-0.5 rounded text-xs">REJECTED</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2.5 py-0.5 rounded text-xs">PENDING DESIGN</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
        <p className="text-xs">Loading thumbnail assets & versions...</p>
      </div>
    );
  }

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
          <div className="w-10 h-10 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 font-bold">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Thumbnail Graphic & Cover Asset</h2>
              {thumbnail && getStatusBadge(thumbnail.status)}
              {thumbnail && (
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  v{thumbnail.currentVersion}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              9:16 Shorts/Reels & 16:9 Landscape Cover assets • Google Drive Asset Linking
            </p>
          </div>
        </div>

        {/* Quick Review Status Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-medium text-slate-500">Review Status:</label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleQuickStatusChange('APPROVED')}
              className={`text-xs px-2.5 py-1 rounded font-medium border flex items-center gap-1 ${
                status === 'APPROVED'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>Approve</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleQuickStatusChange('DESIGNED')}
              className={`text-xs px-2.5 py-1 rounded font-medium border flex items-center gap-1 ${
                status === 'DESIGNED'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>In Review</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleQuickStatusChange('REJECTED')}
              className={`text-xs px-2.5 py-1 rounded font-medium border flex items-center gap-1 ${
                status === 'REJECTED'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>Reject</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Asset Editor & Image Preview */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            {/* Hook Headline */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Thumbnail Bold Text Overlay / Hook Headline
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {hookHeadline.length} characters (Keep under 30 for high CTR)
                </span>
              </div>
              <input
                type="text"
                value={hookHeadline}
                onChange={(e) => setHookHeadline(e.target.value)}
                placeholder="e.g. 99% FAIL THIS 10-SEC TRICK!"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-bold uppercase text-slate-800"
              />
            </div>

            {/* Google Drive Asset URL */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Google Drive Asset / PSD / Figma URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={driveAssetUrl}
                  onChange={(e) => setDriveAssetUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or https://figma.com/file/..."
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700"
                />
                {driveAssetUrl && (
                  <a
                    href={driveAssetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
                    title="Open Drive link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Image Preview URL */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Rendered Preview Image URL (Direct PNG / JPG Link)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or Google Drive direct image link"
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700"
                />
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
                    title="Open direct image"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Visual Canvas Render Preview */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Asset Visual Mockup Preview
              </label>
              <div className="bg-slate-900 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-center gap-6 border border-slate-800">
                {/* 9:16 Shorts Mockup Frame */}
                <div className="w-40 h-72 bg-slate-800 rounded-xl overflow-hidden relative shadow-lg border border-slate-700 flex flex-col justify-between shrink-0">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Thumbnail Preview"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="relative z-10 p-2.5 bg-gradient-to-b from-black/80 to-transparent">
                    <span className="text-[10px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded uppercase">
                      Shorts
                    </span>
                  </div>
                  <div className="relative z-10 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-center">
                    <p className="text-xs font-black text-amber-300 uppercase leading-tight drop-shadow-md">
                      {hookHeadline || 'HOOK TEXT HERE'}
                    </p>
                  </div>
                </div>

                {/* Info summary */}
                <div className="space-y-2 text-xs text-slate-300 flex-1">
                  <div className="p-3 bg-slate-800/80 rounded-lg space-y-1">
                    <p className="text-white font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Burra Pariksha Thumbnail Standards:
                    </p>
                    <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                      <li>High contrast yellow/white typography on dark backdrop</li>
                      <li>Single prominent question number & topic badge</li>
                      <li>Clear visual cue (e.g. countdown timer icon / buzzer)</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-800/80 rounded-lg text-[11px] text-slate-400">
                    <p>
                      <strong>Publishing Readiness:</strong> Marking this thumbnail as <strong>APPROVED</strong> will automatically set the <code>thumbnail_ready</code> flag to true in the PUBLISHING worksheet.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Buttons Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                {thumbnail ? `Worksheet: THUMBNAILS • ID: ${thumbnail.id}` : 'Unsaved Graphic Record'}
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => handleSave(false)}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save In-Place</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => setShowVersionModal(true)}
                  className="text-xs bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-1.5"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Save as New Graphic Version</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Version History */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-pink-600" />
                <h3 className="text-sm font-bold text-slate-900">Graphic Versions</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">THUMBNAIL_VERSIONS</span>
            </div>

            {versions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
                No versions committed yet. Click "Save as New Graphic Version" to record a snapshot.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {versions.map((ver) => {
                  const isCurrent = thumbnail?.currentVersion === ver.versionNumber;

                  return (
                    <div
                      key={ver.id}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        isCurrent
                          ? 'bg-pink-50/70 border-pink-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">Version {ver.versionNumber}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-pink-600 text-white px-1.5 py-0.2 rounded font-semibold">
                              CURRENT
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ver.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-slate-600 text-[11px] line-clamp-2 mb-2">
                        {ver.designerNotes || 'Graphic version snapshot'}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                          {ver.driveAssetUrl}
                        </span>

                        {ver.driveAssetUrl && (
                          <a
                            href={ver.driveAssetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-pink-600 hover:underline font-medium flex items-center gap-1"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-pink-600" />
                <h3 className="text-sm font-bold text-slate-900">Save as New Graphic Version</h3>
              </div>
              <button onClick={() => setShowVersionModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              This will increment the thumbnail asset to <strong>Version {(thumbnail?.currentVersion || 1) + 1}</strong> and write a permanent record into the <code>THUMBNAIL_VERSIONS</code> worksheet.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designer Notes / Revision Details
              </label>
              <textarea
                value={designerNotes}
                onChange={(e) => setDesignerNotes(e.target.value)}
                placeholder="e.g. Enlarged hook text, added yellow border stroke for YouTube Shorts feed..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isSaving}
                onClick={() => handleSave(true)}
                className="text-xs bg-pink-600 text-white"
              >
                {isSaving ? 'Saving...' : 'Commit Version Snapshot'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
