import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
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
  Download,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Monitor,
  Eye,
  RefreshCw,
  Film,
  FileCheck,
} from 'lucide-react';
import { Video, Thumbnail, ThumbnailVersion, Question } from '../types';
import { apiClient } from '../lib/api-client';
import { AssetWorkflowHeader } from '../components/social/AssetWorkflowHeader';
import { PageHeader } from '../design-system/components/PageHeader';
import { Card } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { Alert } from '../design-system/components/Alert';
import { PageLoading } from '../design-system/components/Loading';
import { EmptyState } from '../design-system/components/EmptyState';

export const VideoThumbnailPage: React.FC = () => {
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const videoId = routeVideoId || searchParams.get('videoId') || searchParams.get('id') || '';

  // State
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
  const [versions, setVersions] = useState<ThumbnailVersion[]>([]);

  // UI & Loading State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  // Form Fields
  const [hookHeadline, setHookHeadline] = useState<string>('');
  const [driveAssetUrl, setDriveAssetUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [status, setStatus] = useState<'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Preview Mode
  const [previewAspect, setPreviewAspect] = useState<'9:16' | '16:9'>('9:16');

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

  const loadVideoList = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await apiClient.getVideos();
      setVideoList(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load video records');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVideoAndThumbnail = async (targetId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const vid = await apiClient.getVideoById(targetId);
      setSelectedVideo(vid);

      if (vid.questionId) {
        try {
          const q = await apiClient.getQuestionById(vid.questionId);
          setQuestion(q);
        } catch (qErr) {
          console.warn('Could not fetch linked question:', qErr);
        }
      }

      const res = await apiClient.getThumbnail(targetId);
      if (res.thumbnail) {
        setThumbnail(res.thumbnail);
        setHookHeadline(res.thumbnail.hookHeadline || '');
        setDriveAssetUrl(res.thumbnail.driveAssetUrl || '');
        setPreviewUrl(res.thumbnail.previewUrl || '');
        setStatus((res.thumbnail.status as any) || 'PENDING');

        const vers = await apiClient.getThumbnailVersions(res.thumbnail.id);
        setVersions(vers);
      } else if (res.draftProposal) {
        setHookHeadline(res.draftProposal.hookHeadline || vid.title);
        setStatus((res.draftProposal.status as any) || 'PENDING');
      } else {
        setHookHeadline(vid.title);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load thumbnail workspace data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      loadVideoAndThumbnail(videoId);
    } else {
      loadVideoList();
    }
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
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;
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
        targetId,
        selectedFile,
        designerNotes || 'Uploaded via 10 Create Thumbnail Workspace'
      );

      setThumbnail(res.thumbnail);
      setStatus(res.thumbnail.status as any);
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

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload thumbnail file to Google Drive');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleSave = async (createNewVersion: boolean) => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

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
        designerNotes: createNewVersion ? designerNotes || 'Thumbnail graphic revision' : undefined,
      };

      const res = await apiClient.saveThumbnail(targetId, payload);
      setThumbnail(res.thumbnail);

      if (res.thumbnail) {
        const vers = await apiClient.getThumbnailVersions(res.thumbnail.id);
        setVersions(vers);
      }

      setSuccessMessage(
        createNewVersion
          ? `Thumbnail Version ${res.thumbnail.currentVersion} snapshot committed to Drive & Sheets!`
          : 'Thumbnail metadata saved.'
      );
      setShowVersionModal(false);
      setDesignerNotes('');
      setTimeout(() => setSuccessMessage(null), 4000);
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
        `Status changed to ${newStatus} in 10 Create Thumbnail`
      );
      setThumbnail(updated);
      setStatus(updated.status as any);
      setSuccessMessage(`Thumbnail status updated to ${newStatus}. (Synchronized with PUBLISHING checklist)`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update thumbnail status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateHookSuggestions = () => {
    if (question?.questionText) {
      const qText = question.questionText.replace(/[?।.]/g, '').trim();
      const suggestions = [
        `🔥 99% Failed! ${qText}`,
        `⚡ Quick Trick: ${(question as any).topic || question.topicId || 'Aptitude'} in 10 Sec!`,
        `🧠 Can You Solve This? ${qText.substring(0, 35)}...`,
        `🎯 Burra Pariksha Challenge: ${(question as any).subtopic || question.subtopicId || 'Shorts'}`,
      ];
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      setHookHeadline(randomSuggestion);
      setSuccessMessage('AI suggested hook headline applied!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } else if (selectedVideo?.title) {
      setHookHeadline(`🔥 ${selectedVideo.title} — 10-Sec Trick!`);
      setSuccessMessage('Generated hook headline from video title.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Video Selection List View
  if (!videoId && !selectedVideo) {
    const filteredVideos = videoList.filter(
      (v) =>
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.questionId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <AssetWorkflowHeader currentStep={10} />

        <PageHeader
          title="Thumbnail Studio"
          description="Design high-CTR vertical thumbnail graphics, sync with Google Drive, and commit graphic versions"
        />

        {error && (
          <Alert variant="error" title="Error" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card padding="md">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Select Video for Thumbnail Asset Creation</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a video to craft punchy hook headlines, upload 9:16 vertical graphics, and approve thumbnail assets
            </p>
          </div>
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Search by Video ID, Question ID, or Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
            />

            {isLoading ? (
              <PageLoading message="Loading video production records..." />
            ) : filteredVideos.length === 0 ? (
              <EmptyState
                title="No Videos Found"
                description="No video production items matched your search query."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredVideos.map((vid) => (
                  <div
                    key={vid.id}
                    onClick={() => navigate(`/videos/${encodeURIComponent(vid.id)}/thumbnail`)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-pink-400 bg-white hover:bg-pink-50/30 transition-all cursor-pointer space-y-2.5 shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                        {vid.id}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {vid.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-pink-600 line-clamp-2">
                      {vid.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>{vid.questionId || 'Question Asset'}</span>
                      <span className="text-pink-600 font-semibold flex items-center gap-1">
                        Create Thumbnail <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const activeImageSrc = localPreviewUrl || previewUrl || (hasDriveAsset ? `/api/thumbnails/${encodeURIComponent(thumbnail!.id)}/download` : null);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <AssetWorkflowHeader
        currentStep={10}
        videoId={selectedVideo?.id || videoId}
        videoTitle={selectedVideo?.title}
        videoStatus={selectedVideo?.status}
        questionId={selectedVideo?.questionId}
      />

      <PageHeader
        title="Thumbnail Studio"
        description="Craft eye-catching hook text, upload vertical 9:16 graphics to Google Drive, and lock approved thumbnails"
        actions={
          <div className="flex items-center gap-2">
            <Link to={`/videos/${encodeURIComponent(videoId)}/pinned-comment`}>
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                Proceed to Pinned Comment
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <Alert variant="error" title="Thumbnail Notice" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Action Completed" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <PageLoading message="Loading thumbnail assets and version history..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Editor & Upload (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Approval Gate Card */}
            <Card padding="md">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-200 text-pink-600 flex items-center justify-center font-bold">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Thumbnail QA Status & Signoff</h3>
                    <p className="text-xs text-slate-500">
                      Synchronized with Google Sheets <code>THUMBNAILS</code> worksheet
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
                  {(['PENDING', 'DESIGNED', 'APPROVED', 'REJECTED'] as const).map((st) => {
                    const isSelected = status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleQuickStatusChange(st)}
                        className={`text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                          isSelected
                            ? st === 'APPROVED'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : st === 'DESIGNED'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : st === 'REJECTED'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Drive Asset Status:</span>
                  {hasDriveAsset ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <Check className="w-3.5 h-3.5" /> Synchronized with Drive ID
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      No Google Drive binary uploaded yet
                    </span>
                  )}
                </div>

                <div className="font-mono text-[11px] text-slate-500">
                  Version: <strong className="text-slate-800">v{thumbnail?.currentVersion || 1}</strong>
                </div>
              </div>
            </Card>

            {/* Hook Headline & Design Specifications */}
            <Card padding="md">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Hook Headline & Viral Overlay</h3>
                  <p className="text-xs text-slate-500">
                    High-contrast text printed in top 30% of the vertical thumbnail
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateHookSuggestions}
                  icon={Sparkles}
                  className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  AI Suggest Hook
                </Button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Thumbnail Hook Headline (Telugu / English)
                  </label>
                  <input
                    type="text"
                    value={hookHeadline}
                    onChange={(e) => setHookHeadline(e.target.value)}
                    placeholder="e.g. 99% Failed! 10-Second Speed Trick 🔥"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-pink-500 font-medium text-slate-900"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Keep under 45 characters for maximum mobile CTR on YouTube Shorts & Instagram Reels feed.
                  </span>
                </div>

                {/* Best Practice Specs Grid */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Aspect Ratio</span>
                    <span className="font-bold text-slate-800 font-mono">9:16 (1080×1920)</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Contrast Rule</span>
                    <span className="font-bold text-slate-800">Yellow / Red on Dark</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Safe Zone</span>
                    <span className="font-bold text-slate-800">Top 35% Center</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => handleSave(false)}
                    icon={Save}
                    className="text-xs bg-pink-600 hover:bg-pink-700 text-white font-bold"
                  >
                    {isSaving ? 'Saving...' : 'Save Hook Metadata'}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Google Drive Graphic Binary Upload */}
            <Card padding="md">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload Real Thumbnail Graphic</h3>
                  <p className="text-xs text-slate-500">
                    Upload final exported PNG / JPEG graphic directly to Google Drive channel assets folder
                  </p>
                </div>
                <UploadCloud className="w-5 h-5 text-pink-600" />
              </div>

              <div className="p-4 space-y-4">
                <div className="border-2 border-dashed border-slate-300 hover:border-pink-400 rounded-xl p-6 text-center transition-colors bg-slate-50/50">
                  <input
                    type="file"
                    id="thumbnail-file-input"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="thumbnail-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-12 h-12 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {selectedFile ? (
                        <span className="text-pink-600 font-bold">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                      ) : (
                        <span>Click to browse or drop thumbnail image here</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Accepted formats: PNG, JPEG, WebP (Max 15MB)
                    </span>
                  </label>
                </div>

                {uploadProgress && (
                  <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg text-xs text-pink-800 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-pink-600" />
                    <span>{uploadProgress}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">
                    Uploading automatically increments version snapshot in <code>THUMBNAIL_VERSIONS</code>.
                  </span>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!selectedFile || isUploading}
                    onClick={handleUploadFile}
                    icon={UploadCloud}
                    className="text-xs bg-pink-600 hover:bg-pink-700 text-white font-bold"
                  >
                    {isUploading ? 'Uploading to Drive...' : 'Upload to Google Drive'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Live Dual-Aspect Preview & Graphic Versions (1 col) */}
          <div className="space-y-6">
            {/* Live Visual Preview Card */}
            <Card padding="md">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-pink-600" />
                  <h3 className="text-sm font-bold text-slate-900">Live Preview</h3>
                </div>

                {/* Aspect Switcher */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setPreviewAspect('9:16')}
                    className={`px-2 py-1 rounded font-bold flex items-center gap-1 ${
                      previewAspect === '9:16'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" /> 9:16
                  </button>
                  <button
                    onClick={() => setPreviewAspect('16:9')}
                    className={`px-2 py-1 rounded font-bold flex items-center gap-1 ${
                      previewAspect === '16:9'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Monitor className="w-3 h-3" /> 16:9
                  </button>
                </div>
              </div>

              <div className="p-4 flex flex-col items-center">
                {/* 9:16 Vertical Preview Frame */}
                {previewAspect === '9:16' ? (
                  <div className="relative w-56 h-[398px] bg-slate-950 rounded-2xl overflow-hidden shadow-lg border-4 border-slate-800 flex flex-col justify-between p-3 select-none">
                    {/* Background Image if uploaded */}
                    {activeImageSrc ? (
                      <img
                        src={activeImageSrc}
                        alt="Thumbnail Preview"
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-black z-0 flex flex-col items-center justify-center p-4 text-center">
                        <ImageIcon className="w-8 h-8 text-slate-600 mb-2" />
                        <span className="text-[11px] text-slate-400">
                          Upload image to replace draft preview
                        </span>
                      </div>
                    )}

                    {/* Overlay Darkness Layer for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 z-5" />

                    {/* Top Hook Headline Overlay */}
                    <div className="relative z-10 text-center pt-2">
                      <span className="inline-block bg-yellow-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded shadow-md tracking-tight uppercase max-w-full">
                        {hookHeadline || 'BURRA PARIKSHA SHORTS'}
                      </span>
                    </div>

                    {/* Question Teaser in Middle */}
                    <div className="relative z-10 text-center px-1">
                      <p className="text-[11px] font-bold text-white drop-shadow-md line-clamp-3">
                        {question?.questionText || selectedVideo?.title}
                      </p>
                    </div>

                    {/* Bottom Channel Pill */}
                    <div className="relative z-10 flex items-center justify-between text-[9px] text-slate-200 font-mono">
                      <span className="bg-red-600 text-white font-bold px-1.5 py-0.5 rounded">SHORTS</span>
                      <span className="bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">Burra Pariksha</span>
                    </div>
                  </div>
                ) : (
                  /* 16:9 Landscape Frame */
                  <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden shadow-md border-2 border-slate-800 flex flex-col justify-between p-4 select-none">
                    {activeImageSrc ? (
                      <img
                        src={activeImageSrc}
                        alt="Landscape Thumbnail Preview"
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 via-slate-900 to-black z-0 flex flex-col items-center justify-center p-4 text-center">
                        <ImageIcon className="w-8 h-8 text-slate-600 mb-2" />
                        <span className="text-[11px] text-slate-400">
                          16:9 Landscape Mode Preview
                        </span>
                      </div>
                    )}

                    <div className="relative z-10 text-left">
                      <span className="inline-block bg-yellow-400 text-slate-950 font-black text-xs px-2 py-0.5 rounded shadow uppercase">
                        {hookHeadline || '10-SEC TRICK'}
                      </span>
                    </div>

                    <div className="relative z-10 flex items-center justify-between text-[10px] text-white">
                      <span className="font-bold drop-shadow">Burra Pariksha Official</span>
                      <span className="bg-black/70 px-1.5 py-0.5 rounded font-mono">16:9</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Version History Card */}
            <Card padding="md">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-pink-600" />
                  <h3 className="text-sm font-bold text-slate-900">Graphic Versions</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVersionModal(true)}
                  icon={GitBranch}
                  className="text-xs"
                >
                  New Version
                </Button>
              </div>

              <div className="p-4 space-y-3">
                {versions.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
                    No versions recorded yet. Upload a graphic to create Version 1.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
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

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                              {ver.driveFileId ? `ID: ${ver.driveFileId}` : 'Drive Synced'}
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
                                  className="text-[11px] text-pink-600 hover:underline font-medium flex items-center gap-1"
                                >
                                  <span>Drive</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Direct Workflow Handoff Card */}
            <Card padding="md">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono">
                    11
                  </span>
                  <span>Next Step: Pinned Comment</span>
                </div>
                <p className="text-xs text-slate-600">
                  Thumbnail configured. Proceed to Step 11 to author and verify the sticky solution comment.
                </p>
                <Link to={`/videos/${encodeURIComponent(videoId)}/pinned-comment`}>
                  <Button
                    variant="primary"
                    size="md"
                    icon={ArrowRight}
                    className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Proceed to 11 Pinned Comment
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* New Version Commit Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-pink-600" />
                <h3 className="text-sm font-bold text-slate-900">Commit New Thumbnail Version</h3>
              </div>
              <button onClick={() => setShowVersionModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              This will record a permanent snapshot in the <code>THUMBNAIL_VERSIONS</code> worksheet for <strong>Version {(thumbnail?.currentVersion || 1) + 1}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designer Notes / Revision Details
              </label>
              <textarea
                value={designerNotes}
                onChange={(e) => setDesignerNotes(e.target.value)}
                placeholder="e.g. Enlarged yellow hook headline font, added contrast stroke behind text..."
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
                className="text-xs bg-pink-600 hover:bg-pink-700 text-white font-bold"
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
export default VideoThumbnailPage;
