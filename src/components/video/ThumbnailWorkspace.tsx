import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Sparkles,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  Flame,
  Timer,
  Brain,
  Zap,
} from 'lucide-react';
import { Thumbnail, ThumbnailVersion, Video } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { Card } from '../../design-system/components/Card';
import { Alert } from '../../design-system/components/Alert';
import { Modal } from '../../design-system/components/Modal';

interface ThumbnailWorkspaceProps {
  videoId: string;
  videoTitle: string;
  video?: Video;
  onStatusChange?: () => void;
  onNavigateTab?: (tab: 'script' | 'thumbnail' | 'pinned-comment' | 'editing' | 'publishing' | 'recording' | 'overview' | 'social') => void;
}

const CURIOSITY_PRESETS = [
  { label: '🔥 99% Fail Challenge', text: '99% FAIL CHALLENGE!' },
  { label: '⏱️ 5-Sec Speed Test', text: '5-SEC SPEED TEST!' },
  { label: '🧠 Genius Brain Test', text: 'GENIUS BRAIN TEST!' },
  { label: '⚡ Burra Shortcut', text: 'BURRA SHORTCUT TRICK!' },
];

export const ThumbnailWorkspace: React.FC<ThumbnailWorkspaceProps> = ({
  videoId,
  videoTitle,
  video,
  onStatusChange,
  onNavigateTab,
}) => {
  const navigate = useNavigate();

  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
  const [versions, setVersions] = useState<ThumbnailVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Form Fields
  const [hookHeadline, setHookHeadline] = useState<string>('');
  const [driveAssetUrl, setDriveAssetUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [status, setStatus] = useState<'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Collapsible drawers
  const [isSourceLinkOpen, setIsSourceLinkOpen] = useState<boolean>(false);
  const [showSafeZoneOverlay, setShowSafeZoneOverlay] = useState<boolean>(true);

  // Version modal
  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);
  const [designerNotes, setDesignerNotes] = useState<string>('');

  const hasDriveAsset = Boolean(thumbnail?.driveFileId && thumbnail.driveFileId.trim());

  useEffect(() => {
    if (selectedFile) {
      const objUrl = URL.createObjectURL(selectedFile);
      setLocalPreviewUrl(objUrl);
      return () => URL.revokeObjectURL(objUrl);
    } else {
      setLocalPreviewUrl(null);
    }
  }, [selectedFile]);

  const fetchThumbnailData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [res, scriptRes] = await Promise.all([
        apiClient.getThumbnail(videoId).catch(() => ({ thumbnail: null, draftProposal: null })),
        apiClient.getScript(videoId).catch(() => ({ script: null })),
      ]);

      const scriptHook = scriptRes?.script?.hookText || '';

      if (res?.thumbnail) {
        setThumbnail(res.thumbnail);
        setHookHeadline(res.thumbnail.hookHeadline || scriptHook || '');
        setDriveAssetUrl(res.thumbnail.driveAssetUrl || '');
        setPreviewUrl(res.thumbnail.previewUrl || '');
        setStatus(res.thumbnail.status || 'PENDING');

        // Fetch version history
        const vers = await apiClient.getThumbnailVersions(res.thumbnail.id).catch(() => []);
        setVersions(vers);
      } else if (res?.draftProposal) {
        setHookHeadline(res.draftProposal.hookHeadline || scriptHook || videoTitle);
        setStatus(res.draftProposal.status || 'PENDING');
      } else if (scriptHook) {
        setHookHeadline(scriptHook);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (PNG, JPEG, or WebP).');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      setError('Please select an image file first.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setSuccessMessage(null);
      setUploadProgress('Uploading thumbnail binary to Google Drive...');

      const res = await apiClient.uploadThumbnailFile(
        videoId,
        selectedFile,
        designerNotes || 'Uploaded via Thumbnail Workspace'
      );

      setThumbnail(res.thumbnail);
      setStatus(res.thumbnail.status);
      setDriveAssetUrl(res.thumbnail.driveAssetUrl || '');
      setPreviewUrl(res.thumbnail.previewUrl || '');

      const vers = await apiClient.getThumbnailVersions(res.thumbnail.id);
      setVersions(vers);

      setSuccessMessage(
        `Thumbnail "${res.thumbnail.fileName || selectedFile.name}" successfully uploaded to Google Drive (v${res.thumbnail.currentVersion})!`
      );
      setSelectedFile(null);
      const fileInput = document.getElementById('thumbnail-file-input') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';

      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Failed to upload thumbnail file to Google Drive');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

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
    } catch (err: any) {
      setError(err?.message || 'Failed to save thumbnail');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStatusChange = async (newStatus: 'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED') => {
    if (!thumbnail) {
      if (newStatus === 'APPROVED') {
        setError('Cannot approve thumbnail: A real thumbnail image must be uploaded to Google Drive first.');
        return;
      }
      setStatus(newStatus);
      return;
    }

    if (newStatus === 'APPROVED' && !hasDriveAsset) {
      setError('Cannot approve thumbnail: A real thumbnail image must be uploaded to Google Drive first (driveFileId is missing).');
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
      setSuccessMessage(`Thumbnail status updated to ${newStatus}.`);
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveAndProceed = async () => {
    if (!hasDriveAsset || !thumbnail) {
      setError('Cannot approve thumbnail: A real thumbnail image must be uploaded to Google Drive first before proceeding to Step 09.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Save latest hookHeadline & driveAssetUrl details with APPROVED status
      await apiClient.saveThumbnail(videoId, {
        hookHeadline,
        driveAssetUrl,
        previewUrl,
        status: 'APPROVED',
        createNewVersion: false,
      });

      const updated = await apiClient.updateThumbnailStatus(
        thumbnail.id,
        'APPROVED',
        'Certified and approved in Step 08 Thumbnail Studio'
      );

      setThumbnail(updated);
      setStatus('APPROVED');
      setSuccessMessage('Thumbnail approved and certified! Navigating to Step 09: Social Review...');

      if (onStatusChange) onStatusChange();

      // Seamless navigation to Step 09: Social Review
      if (onNavigateTab) {
        onNavigateTab('social');
      } else {
        navigate(`/videos/${videoId}?tab=social`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to approve thumbnail.');
    } finally {
      setIsSaving(false);
    }
  };

  const effectivePreviewSrc =
    localPreviewUrl ||
    (hasDriveAsset && thumbnail?.id ? `/api/thumbnails/${encodeURIComponent(thumbnail.id)}/download` : (previewUrl || null));

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 font-mono">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
        Loading thumbnail assets & graphic versions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {error && (
        <Alert variant="error" title="Thumbnail Workspace Error">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 ml-3"
            >
              Dismiss
            </button>
          </div>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Success">
          <div className="flex items-center justify-between">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 ml-3"
            >
              Dismiss
            </button>
          </div>
        </Alert>
      )}

      {/* Main Dual-Pane 7/5 Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane (lg:col-span-7) — Thumbnail Design & Upload Studio */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Image Upload & Google Drive Ingestion */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Thumbnail Graphic & Google Drive Ingestion</h3>
              </div>
              <Badge variant={hasDriveAsset ? 'success' : 'warning'} size="sm">
                {hasDriveAsset ? `Drive Ready (v${thumbnail?.currentVersion || 1})` : 'Asset Missing'}
              </Badge>
            </div>

            {/* File Picker & Upload Progress */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  id="thumbnail-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="flex-1 text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg p-1.5 focus:outline-hidden"
                />

                <Button
                  variant="primary"
                  size="sm"
                  disabled={!selectedFile || isUploading}
                  onClick={handleUploadFile}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                  icon={UploadCloud}
                >
                  {isUploading ? (uploadProgress || 'Uploading...') : 'Upload to Google Drive'}
                </Button>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between text-[11px] text-indigo-900 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100 font-mono">
                  <span className="truncate max-w-xs">
                    <strong>Selected:</strong> {selectedFile.name}
                  </span>
                  <span>
                    <strong>Size:</strong> {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
            </div>

            {/* Uploaded Drive Details OR Missing Asset Warning */}
            {hasDriveAsset && thumbnail ? (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-xs text-emerald-900">
                      ✓ Google Drive Asset Ready (v{thumbnail.currentVersion})
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-300">
                    ID: {thumbnail.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-emerald-900 bg-white/90 p-3 rounded-lg border border-emerald-100">
                  <div>
                    <span className="text-slate-500 font-sans font-medium text-[11px]">Filename:</span>
                    <p className="font-semibold truncate">{thumbnail.fileName || 'thumbnail.png'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans font-medium text-[11px]">Drive File ID:</span>
                    <p className="font-semibold truncate">{thumbnail.driveFileId}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans font-medium text-[11px]">File Size:</span>
                    <p className="font-semibold">
                      {thumbnail.fileSize
                        ? `${(thumbnail.fileSize / 1024).toFixed(1)} KB (${thumbnail.fileSize.toLocaleString()} bytes)`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans font-medium text-[11px]">MIME Type:</span>
                    <p className="font-semibold">{thumbnail.mimeType || 'image/png'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <a
                    href={`/api/thumbnails/${encodeURIComponent(thumbnail.id)}/download`}
                    download={thumbnail.fileName || `thumbnail-${thumbnail.id}.png`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Thumbnail</span>
                  </a>

                  {thumbnail.driveAssetUrl && (
                    <a
                      href={thumbnail.driveAssetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium text-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>Open in Drive</span>
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">No Google Drive Thumbnail Asset</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Select and upload a production PNG, JPEG, or WebP graphic. A verified Google Drive asset is required to certify thumbnail readiness.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Card 2: High-CTR Hook Headline & Presets */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">High-CTR Hook Headline</h3>
              </div>
              <span className={`text-[11px] font-mono ${hookHeadline.length > 30 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                {hookHeadline.length}/30 chars (<span className="hidden sm:inline">&lt; 30 chars for high CTR</span>)
              </span>
            </div>

            <input
              type="text"
              value={hookHeadline}
              onChange={(e) => setHookHeadline(e.target.value)}
              placeholder="e.g. 99% FAIL CHALLENGE!"
              className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold uppercase text-slate-800"
            />

            {/* Curiosity Preset Chips */}
            <div className="pt-1">
              <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
                Quick Curiosity Preset Chips:
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {CURIOSITY_PRESETS.map((preset) => (
                  <button
                    key={preset.text}
                    type="button"
                    onClick={() => setHookHeadline(preset.text)}
                    className="px-2.5 py-1 text-xs rounded-lg font-semibold border transition-all bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-900 border-slate-200/80 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Card 3: 9:16 Shorts Visual Mockup Preview */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">9:16 Shorts Visual Mockup Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSafeZoneOverlay(!showSafeZoneOverlay)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showSafeZoneOverlay ? 'Hide Safe Zones' : 'Show Safe Zones'}
              </button>
            </div>

            <div className="bg-slate-950 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-center gap-6 border border-slate-800">
              {/* 9:16 Shorts Phone Frame */}
              <div className="w-44 h-[312px] bg-slate-900 rounded-2xl overflow-hidden relative shadow-2xl border-2 border-slate-700/80 flex flex-col justify-between shrink-0 select-none">
                {/* Visual Background: Uploaded image or dark grid placeholder */}
                {effectivePreviewSrc ? (
                  <img
                    src={effectivePreviewSrc}
                    alt="Thumbnail Mockup Preview"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-radial from-slate-800 to-slate-950 flex items-center justify-center p-4">
                    <div className="text-center text-slate-600 space-y-1">
                      <Smartphone className="w-8 h-8 mx-auto stroke-1" />
                      <p className="text-[10px] font-mono">No Image Asset</p>
                    </div>
                  </div>
                )}

                {/* Mobile UI Overlay: Top Header */}
                <div className="relative z-10 p-2.5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
                  <span className="text-[9px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded tracking-wide uppercase">
                    Shorts
                  </span>
                  <span className="text-[9px] text-slate-300 font-mono">1080×1920</span>
                </div>

                {/* Safe Zone Central Guideline Box */}
                {showSafeZoneOverlay && (
                  <div className="absolute inset-x-3 top-10 bottom-16 border border-dashed border-amber-400/50 rounded-lg pointer-events-none z-20 flex flex-col justify-between p-1.5">
                    <div className="text-[8px] font-mono text-amber-300/80 uppercase">
                      Safe Zone (80%)
                    </div>
                  </div>
                )}

                {/* Mobile Right Side Action Icons Mockup */}
                <div className="absolute right-2 bottom-16 z-10 space-y-2 text-white/80 text-center pointer-events-none">
                  <div className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-[10px]">❤️</div>
                  <div className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-[10px]">💬</div>
                  <div className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center text-[10px]">↗️</div>
                </div>

                {/* Bottom Hook Headline Overlay & Pacing */}
                <div className="relative z-10 p-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-center">
                  <p className="text-xs font-black text-amber-300 uppercase leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-tight">
                    {hookHeadline || 'HOOK HEADLINE HERE'}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1 font-mono">
                    @burrapariksha
                  </p>
                </div>
              </div>

              {/* Design Standards Info */}
              <div className="space-y-3 text-xs text-slate-300 flex-1">
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1.5">
                  <p className="text-white font-bold flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    9:16 Mobile Safe Zone Standards
                  </p>
                  <ul className="text-[11px] text-slate-400 space-y-1">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Top 15% clear of TikTok/Reels/Shorts search headers.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Bottom 20% clear of description &amp; sound attribution.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>Right 15% margin clear of interactive social icons.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>High contrast yellow/white text readable on mobile.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Publishing Note:</span> Approving this thumbnail synchronizes <code className="text-amber-300">thumbnail_ready: true</code> into the master publishing checklist.
                </div>
              </div>
            </div>
          </Card>

          {/* Card 4: Collapsible Design Source Link (Figma/PSD) */}
          <Card className="p-4 border-slate-200/80 shadow-xs space-y-3">
            <button
              type="button"
              onClick={() => setIsSourceLinkOpen(!isSourceLinkOpen)}
              className="w-full flex items-center justify-between text-left focus:outline-hidden"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Design Source Project Link (Figma / PSD URL)
                </h3>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span>{isSourceLinkOpen ? 'Collapse' : 'Expand'}</span>
                {isSourceLinkOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {isSourceLinkOpen && (
              <div className="pt-2 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
                <p className="text-[11px] text-slate-500">
                  Optional direct link to the editable cloud Figma artboard or Google Drive PSD design template.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={driveAssetUrl}
                    onChange={(e) => setDriveAssetUrl(e.target.value)}
                    placeholder="https://figma.com/file/... or https://drive.google.com/..."
                    className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700"
                  />
                  {driveAssetUrl && (
                    <a
                      href={driveAssetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                      title="Open source URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Pane (lg:col-span-5) — Sticky Command Station */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
          {/* Card 1: Top Action Station (Sticky) */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-4 bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Thumbnail Decision Station</h3>
              </div>
              <Badge variant={status === 'APPROVED' ? 'success' : status === 'DESIGNED' ? 'info' : 'warning'} size="sm">
                Gate 08
              </Badge>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2.5">
              <Button
                variant="primary"
                size="md"
                disabled={isSaving || !hasDriveAsset}
                onClick={handleApproveAndProceed}
                className={`w-full justify-center text-xs py-2.5 font-bold shadow-xs transition-all ${
                  !hasDriveAsset
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                icon={ArrowRight}
              >
                ✓ Approve Thumbnail &amp; Proceed to Step 09: Social Review →
              </Button>

              {!hasDriveAsset && (
                <p className="text-[11px] text-amber-700 text-center">
                  ⚠️ Upload a Google Drive image asset in Card 1 to unlock approval.
                </p>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => handleSave(false)}
                className="justify-center text-xs"
                icon={Save}
              >
                Save Details
              </Button>

              <Button
                variant="secondary"
                size="sm"
                disabled={isSaving}
                onClick={() => setShowVersionModal(true)}
                className="justify-center text-xs bg-slate-100 hover:bg-slate-200 text-slate-800"
                icon={GitBranch}
              >
                + New Version
              </Button>
            </div>

            {/* Quick Review Status Actions for Editors */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Review Status:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isSaving || !hasDriveAsset}
                  onClick={() => handleQuickStatusChange('APPROVED')}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium border transition-colors ${
                    status === 'APPROVED'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                  }`}
                >
                  Approved
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleQuickStatusChange('DESIGNED')}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium border transition-colors ${
                    status === 'DESIGNED'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  In Review
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleQuickStatusChange('REJECTED')}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium border transition-colors ${
                    status === 'REJECTED'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>
          </Card>

          {/* Card 2: 4-Point Thumbnail Compliance */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                4-Point Thumbnail Compliance
              </h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-0.5">
                <span className="text-[10px] font-medium text-emerald-700">Aspect Ratio</span>
                <p className="font-bold text-emerald-900">✓ 9:16 Vertical</p>
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-0.5">
                <span className="text-[10px] font-medium text-emerald-700">Text Contrast</span>
                <p className="font-bold text-emerald-900">✓ High (Yellow/Dark)</p>
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-0.5">
                <span className="text-[10px] font-medium text-emerald-700">Safe Zones</span>
                <p className="font-bold text-emerald-900">✓ 80% Safe Area</p>
              </div>

              <div className={`p-2.5 rounded-xl border space-y-0.5 ${
                hasDriveAsset
                  ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
                  : 'bg-amber-50/70 border-amber-200/80 text-amber-900'
              }`}>
                <span className="text-[10px] font-medium text-slate-600">Drive Asset</span>
                <p className="font-bold">
                  {hasDriveAsset ? '✓ Drive Ready' : '⚠️ Pending Upload'}
                </p>
              </div>
            </div>
          </Card>

          {/* Card 3: Graphic Version History */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Graphic Version History</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {versions.length} {versions.length === 1 ? 'version' : 'versions'}
              </span>
            </div>

            {versions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-100">
                No versions committed yet. Upload a thumbnail image or save a version snapshot.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {versions.map((ver) => {
                  const isCurrent = thumbnail?.currentVersion === ver.versionNumber;

                  return (
                    <div
                      key={ver.id}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        isCurrent
                          ? 'bg-indigo-50/50 border-indigo-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">Version {ver.versionNumber}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-semibold">
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

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                          {ver.driveFileId ? `ID: ${ver.driveFileId}` : 'Drive Linked'}
                        </span>

                        <div className="flex items-center gap-2">
                          {thumbnail?.id && (
                            <a
                              href={`/api/thumbnails/${encodeURIComponent(thumbnail.id)}/download`}
                              download={`thumbnail-v${ver.versionNumber}.png`}
                              className="text-[11px] text-indigo-600 hover:underline font-medium flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </a>
                          )}
                          {ver.driveAssetUrl && (
                            <a
                              href={ver.driveAssetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-slate-600 hover:underline font-medium flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Drive</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* New Version Modal */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        title={
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            <span>Save as New Graphic Version</span>
          </div>
        }
        subtitle={`This will increment the thumbnail asset to Version ${(thumbnail?.currentVersion || 1) + 1} and write a permanent record into the THUMBNAIL_VERSIONS database.`}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersionModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSaving ? 'Committing...' : 'Commit Version Snapshot'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <label className="block font-semibold text-slate-700">
            Designer Notes / Revision Details
          </label>
          <textarea
            value={designerNotes}
            onChange={(e) => setDesignerNotes(e.target.value)}
            placeholder="e.g. Enlarged hook text, added yellow border stroke for YouTube Shorts feed..."
            rows={3}
            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </Modal>
    </div>
  );
};
