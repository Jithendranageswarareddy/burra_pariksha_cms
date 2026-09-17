import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Video as VideoIcon,
  Upload,
  User,
  ArrowRight,
  ArrowLeft,
  Film,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Video, Script, Question, VideoProductionStatus } from '../types';
import { apiClient } from '../lib/api-client';
import { VideoWorkflowHeader } from '../components/video/VideoWorkflowHeader';
import { PageHeader } from '../design-system/components/PageHeader';
import { Card } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { Alert } from '../design-system/components/Alert';
import { PageLoading } from '../design-system/components/Loading';
import { EmptyState } from '../design-system/components/EmptyState';

export const VideoRecordPage: React.FC = () => {
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const videoId = routeVideoId || searchParams.get('videoId') || searchParams.get('id') || '';

  // State
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [script, setScript] = useState<Script | null>(null);

  // Recording & Presenter State
  const [assignedHost, setAssignedHost] = useState<string>('');
  const [recordingTake, setRecordingTake] = useState<number>(1);
  const [hostNotes, setHostNotes] = useState<string>('');
  const [teleprompterMode, setTeleprompterMode] = useState<boolean>(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(3); // 1-5
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadVideoList = async () => {
    try {
      setIsLoading(true);
      const videos = await apiClient.getVideos();
      setVideoList(videos);
    } catch (err: any) {
      setError(err?.message || 'Failed to load video list');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVideoAndDetails = async (targetId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const vid = await apiClient.getVideoById(targetId);
      setSelectedVideo(vid);
      setAssignedHost(vid.assignedHost || '');

      if (vid.questionId) {
        try {
          const q = await apiClient.getQuestionById(vid.questionId);
          setQuestion(q);
        } catch (qErr) {
          console.warn('Could not fetch question record:', qErr);
        }
      }

      try {
        const sRes = await apiClient.getScript(targetId);
        if (sRes.script) {
          setScript(sRes.script);
        }
      } catch (sErr) {
        console.warn('Could not fetch script record:', sErr);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load video recording workspace');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      loadVideoAndDetails(videoId);
    } else {
      loadVideoList();
    }
  }, [videoId]);

  // Update Host Assignment & Video Metadata
  const handleSaveHostAssignment = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsUpdatingStatus(true);
      setError(null);

      const updated = await apiClient.updateVideoMetadata(targetId, {
        assignedHost,
      });
      setSelectedVideo(updated);
      setSuccessMessage('Host assignment updated successfully in Google Sheets.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update host assignment.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Upload Raw Recording to Google Drive
  const handleUploadRawFootage = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = videoId || selectedVideo?.id;
    if (!targetId || !uploadFile) return;

    try {
      setIsUploading(true);
      setError(null);
      setSuccessMessage(null);

      const updatedVideo = await apiClient.uploadVideoFile(targetId, uploadFile);
      setSelectedVideo(updatedVideo);
      setUploadFile(null);
      setSuccessMessage('Raw footage successfully uploaded to Google Drive! Status updated to RECORDED.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload raw video file to Google Drive.');
    } finally {
      setIsUploading(false);
    }
  };

  // Manual Status Transition
  const handleUpdateStatus = async (newStatus: VideoProductionStatus) => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsUpdatingStatus(true);
      setError(null);

      const updated = await apiClient.updateVideoStatus(
        targetId,
        newStatus,
        `Stage advanced from Step 07 Recording Studio: ${hostNotes || 'Take completed'}`
      );
      setSelectedVideo(updated);
      setSuccessMessage(`Production status transitioned to ${newStatus}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to transition video status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Teleprompter Full Screen View
  if (teleprompterMode && script) {
    const fontSizes = {
      sm: 'text-xl',
      md: 'text-2xl',
      lg: 'text-4xl',
      xl: 'text-6xl',
    }[fontSize];

    return (
      <div className="fixed inset-0 bg-black text-white z-50 p-8 flex flex-col justify-between overflow-hidden select-none">
        {/* Teleprompter Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <span className="font-mono text-sm font-bold tracking-widest text-red-500 uppercase">
              STUDIO PROMPTER • {selectedVideo?.id || 'PROD'}
            </span>
          </div>

          {/* Prompt Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
              <span className="text-zinc-400 px-2 font-mono">SIZE:</span>
              {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={`px-2 py-0.5 rounded font-mono uppercase ${
                    fontSize === s ? 'bg-red-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setTeleprompterMode(false)}
              className="text-xs bg-zinc-900 text-white border-zinc-700 hover:bg-zinc-800"
            >
              Exit Teleprompter
            </Button>
          </div>
        </div>

        {/* Scrolling Script Text Stream */}
        <div className="flex-1 overflow-y-auto py-12 px-6 max-w-4xl mx-auto space-y-12 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2 border-l-4 border-red-500 pl-6">
            <div className="text-xs font-mono text-red-400 tracking-wider uppercase">01 HOOK (0-5s)</div>
            <p className={`${fontSizes} font-bold text-amber-300 font-sans`}>{script.hookText}</p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 border-l-4 border-indigo-500 pl-6">
            <div className="text-xs font-mono text-indigo-400 tracking-wider uppercase">02 PROBLEM (5-15s)</div>
            <p className={`${fontSizes} text-zinc-100 font-sans`}>{script.problemStatement}</p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 border-l-4 border-emerald-500 pl-6">
            <div className="text-xs font-mono text-emerald-400 tracking-wider uppercase">03 STEP-BY-STEP (15-35s)</div>
            <p className={`${fontSizes} text-zinc-100 font-sans`}>{script.stepByStepSolution}</p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2 border-l-4 border-yellow-500 pl-6">
            <div className="text-xs font-mono text-yellow-400 tracking-wider uppercase">04 SHORTCUT (35-45s)</div>
            <p className={`${fontSizes} font-bold text-yellow-300 font-sans`}>{script.speedTrickOrTakeaway}</p>
          </div>

          {/* Section 5 */}
          <div className="space-y-2 border-l-4 border-purple-500 pl-6">
            <div className="text-xs font-mono text-purple-400 tracking-wider uppercase">05 OUTRO (45-50s)</div>
            <p className={`${fontSizes} text-zinc-300 font-sans`}>{script.callToAction}</p>
          </div>
        </div>

        {/* Teleprompter Footer */}
        <div className="text-center text-xs text-zinc-500 border-t border-zinc-800 pt-3">
          Press <strong>ESC</strong> or click <strong>Exit Teleprompter</strong> to return to video workflow
        </div>
      </div>
    );
  }

  // If no video is specified, show candidate list
  if (!videoId && !selectedVideo) {
    const filteredVideos = videoList.filter(
      (v) =>
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.questionId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <VideoWorkflowHeader currentStep={7} />

        <PageHeader
          title="07 Record Video"
          description="Teleprompter studio view, host assignment, raw footage capture, and Drive intake"
          badge={<Badge variant="active" size="sm" className="font-mono">STEP 07</Badge>}
        />

        {error && (
          <Alert variant="error" title="Error Loading Videos" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card padding="md">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Select Video for Studio Recording</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose an approved script (SCRIPT_READY or IN_PROGRESS) to film in studio
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
              <PageLoading message="Loading production records..." />
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
                    onClick={() => navigate(`/videos/${encodeURIComponent(vid.id)}/record`)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 transition-all cursor-pointer space-y-2.5 shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {vid.id}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {vid.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2">
                      {vid.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span>Host: {vid.assignedHost || 'Unassigned'}</span>
                      <span className="text-indigo-600 font-semibold flex items-center gap-1">
                        Open Studio <ArrowRight className="w-3 h-3" />
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <VideoWorkflowHeader
        currentStep={7}
        videoId={videoId || selectedVideo?.id}
        videoTitle={selectedVideo?.title}
        videoStatus={selectedVideo?.status}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="active" size="sm" className="font-mono">
              STEP 07
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              {selectedVideo?.id || videoId}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">07 Record Video</h1>
          <p className="text-xs text-slate-500">
            Film on-camera presenter delivery with high-readability teleprompter and upload raw recordings.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/videos/${encodeURIComponent(videoId || selectedVideo?.id || '')}/review-script`)}
            icon={ArrowLeft}
            className="text-xs"
          >
            Back to Step 06
          </Button>
          <Link to="/production">
            <Button variant="outline" size="sm" icon={Film} className="text-xs">
              Production Tracker
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Recording Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <PageLoading message="Loading studio recording workspace..." />
      ) : (
        <div className="space-y-6">
          {/* Top Host & Teleprompter Quick Launch Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-red-400 font-bold tracking-widest uppercase">
                  RECORDING STUDIO DECK
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  • STATUS: {selectedVideo?.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {selectedVideo?.title || 'Telugu Educational Short'}
              </h2>
              <p className="text-xs text-slate-400">
                Presenter: <strong>{selectedVideo?.assignedHost || 'Unassigned'}</strong> • Take: <strong>#{recordingTake}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => setTeleprompterMode(true)}
                icon={VideoIcon}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg"
              >
                Launch Studio Teleprompter
              </Button>
            </div>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Script Delivery Cues & Raw Upload */}
            <div className="lg:col-span-2 space-y-6">
              {/* Teleprompter Cue Sheet Preview */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Script Delivery Cue Sheet</h3>
                    <p className="text-xs text-slate-500">Structured 5-stage teleprompter pacing for host recording</p>
                  </div>
                  {script && (
                    <Badge variant="active" size="sm">
                      v{script.currentVersion} APPROVED
                    </Badge>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {script ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50/50 rounded-lg border border-red-100">
                        <span className="text-[10px] font-mono font-bold text-red-700 uppercase block mb-1">
                          01 Hook (0–5s) • Max Energy
                        </span>
                        <p className="text-xs font-bold text-slate-900">{script.hookText}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-600 uppercase block mb-1">
                          02 Problem Statement (5–15s) • Clear Cadence
                        </span>
                        <p className="text-xs text-slate-800">{script.problemStatement}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-600 uppercase block mb-1">
                          03 Step-by-Step Solution (15–35s) • Explanatory Pace
                        </span>
                        <p className="text-xs text-slate-800">{script.stepByStepSolution}</p>
                      </div>

                      <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                        <span className="text-[10px] font-mono font-bold text-amber-800 uppercase block mb-1">
                          04 Speed Shortcut (35–45s) • Exam Trick Hook
                        </span>
                        <p className="text-xs font-bold text-amber-900">{script.speedTrickOrTakeaway}</p>
                      </div>

                      <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block mb-1">
                          05 Outro & CTA (45–50s) • Follow Prompt
                        </span>
                        <p className="text-xs text-emerald-900 font-medium">{script.callToAction}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-slate-100">
                      No script approved yet. Please author and approve in Step 05 & 06 before filming.
                    </div>
                  )}
                </div>
              </Card>

              {/* Raw Footage Upload to Google Drive */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Google Drive Raw Footage Intake</h3>
                  <p className="text-xs text-slate-500">
                    Upload camera video file (.mp4, .mov). File will be placed in the video's Google Drive production folder.
                  </p>
                </div>

                <div className="p-4">
                  <form onSubmit={handleUploadRawFootage} className="space-y-4">
                    <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center bg-slate-50/50">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <label className="cursor-pointer block">
                        <span className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                          Click to browse raw video file
                        </span>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          Supports MP4, MOV, ProRes (Up to 1.5GB)
                        </span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>

                      {uploadFile && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-mono text-indigo-800">
                          <span>{uploadFile.name}</span>
                          <span className="text-slate-400">({(uploadFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Uploading automatically sets status to <strong>RECORDED</strong>
                      </span>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={!uploadFile || isUploading}
                        icon={Upload}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      >
                        {isUploading ? 'Uploading to Drive...' : 'Upload Raw Footage'}
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </div>

            {/* Right Col: Host Assignment & Transition Controls */}
            <div className="space-y-4">
              {/* Host Assignment Card */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Presenter & Take Settings</h3>
                  <p className="text-xs text-slate-500">Record metadata in Google Sheets</p>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      On-Camera Host
                    </label>
                    <input
                      type="text"
                      value={assignedHost}
                      onChange={(e) => setAssignedHost(e.target.value)}
                      placeholder="e.g. Ramesh Kumar / Host A"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Take Number
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRecordingTake((t) => Math.max(1, t - 1))}
                        className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="font-mono text-sm font-bold text-slate-900 px-3">
                        Take #{recordingTake}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRecordingTake((t) => t + 1)}
                        className="px-3 py-1.5 border border-slate-300 rounded text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Host Notes / Retake Remarks
                    </label>
                    <textarea
                      value={hostNotes}
                      onChange={(e) => setHostNotes(e.target.value)}
                      placeholder="e.g. Take 2 has best energy on the hook; slight stumble in take 1"
                      rows={2}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={handleSaveHostAssignment}
                    className="w-full text-xs"
                  >
                    {isUpdatingStatus ? 'Saving...' : 'Save Host Assignment'}
                  </Button>
                </div>
              </Card>

              {/* Status Transition Control Card */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Recording Stage Actions</h3>
                  <p className="text-xs text-slate-500">Advance or re-queue status</p>
                </div>
                <div className="p-4 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(VideoProductionStatus.RECORDED)}
                    className="w-full text-xs justify-between"
                  >
                    <span>Mark as RECORDED</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">RECORDED</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={() => handleUpdateStatus(VideoProductionStatus.EDITING)}
                    className="w-full text-xs justify-between"
                  >
                    <span>Handoff to Editor</span>
                    <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">EDITING</span>
                  </Button>
                </div>
              </Card>

              {/* Next Step Action Card */}
              <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono">
                    08
                  </span>
                  <span>Next: Edit Video</span>
                </div>
                <p className="text-xs text-slate-600">
                  Raw recording captured? Advance to video editing workspace to sync graphics and upload vertical render.
                </p>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const targetId = videoId || selectedVideo?.id;
                    navigate(`/videos/${encodeURIComponent(targetId)}/edit-video`);
                  }}
                  icon={ArrowRight}
                  className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Continue to Edit Video (Step 08)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoRecordPage;
