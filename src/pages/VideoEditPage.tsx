import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Scissors,
  Upload,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Film,
  CheckCircle2,
  ExternalLink,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { Video, Script, Question, VideoProductionStatus, MediaAsset } from '../types';
import { apiClient } from '../lib/api-client';
import { VideoWorkflowHeader } from '../components/video/VideoWorkflowHeader';
import { PageHeader } from '../design-system/components/PageHeader';
import { Card } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { Alert } from '../design-system/components/Alert';
import { PageLoading } from '../design-system/components/Loading';
import { EmptyState } from '../design-system/components/EmptyState';

export const VideoEditPage: React.FC = () => {
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const videoId = routeVideoId || searchParams.get('videoId') || searchParams.get('id') || '';

  // State
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);

  // Editor metadata
  const [assignedEditor, setAssignedEditor] = useState<string>('');
  const [renderDurationSeconds, setRenderDurationSeconds] = useState<number>(45);
  const [editorNotes, setEditorNotes] = useState<string>('');
  const [hasSubtitles, setHasSubtitles] = useState<boolean>(true);
  const [hasMotionGraphics, setHasMotionGraphics] = useState<boolean>(true);
  const [hasSoundEffects, setHasSoundEffects] = useState<boolean>(true);

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
      setAssignedEditor(vid.assignedEditor || '');
      setRenderDurationSeconds(vid.actualDurationSeconds || vid.targetDurationSeconds || 45);

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

      try {
        const history = await apiClient.getVideoProductionHistory(targetId);
        if (history?.editedAssets) {
          setAssets(history.editedAssets);
        }
      } catch (mErr) {
        console.warn('Could not fetch video assets:', mErr);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load video editing workspace');
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

  // Update Editor Assignment & Details
  const handleSaveEditorMetadata = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsUpdatingStatus(true);
      setError(null);

      const updated = await apiClient.updateVideoMetadata(targetId, {
        assignedEditor,
        actualDurationSeconds: renderDurationSeconds,
      });
      setSelectedVideo(updated);
      setSuccessMessage('Editor assignments saved in Google Sheets.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update editor metadata.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Upload Edited Final Video Cut to Google Drive
  const handleUploadEditedCut = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = videoId || selectedVideo?.id;
    if (!targetId || !uploadFile) return;

    try {
      setIsUploading(true);
      setError(null);
      setSuccessMessage(null);

      const updatedVideo = await apiClient.uploadEditedVideoFile(
        targetId,
        uploadFile,
        undefined,
        true
      );
      if (updatedVideo?.video) {
        setSelectedVideo(updatedVideo.video);
      } else if (updatedVideo) {
        setSelectedVideo(updatedVideo);
      }
      setUploadFile(null);

      // Refresh media assets
      try {
        const history = await apiClient.getVideoProductionHistory(targetId);
        if (history?.editedAssets) {
          setAssets(history.editedAssets);
        }
      } catch {
        // ignore
      }

      setSuccessMessage('Edited vertical video cut uploaded to Google Drive! Status advanced to FINAL_REVIEW.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload edited video file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Advance Status to Final Review
  const handleAdvanceToFinalReview = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsUpdatingStatus(true);
      setError(null);

      const updated = await apiClient.updateVideoStatus(
        targetId,
        VideoProductionStatus.FINAL_REVIEW,
        `Editing complete. Duration: ${renderDurationSeconds}s. Notes: ${editorNotes || 'None'}`
      );
      setSelectedVideo(updated);
      setSuccessMessage('Video advanced to FINAL_REVIEW status!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to advance video status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
        <VideoWorkflowHeader currentStep={8} />

        <PageHeader
          title="08 Edit Video"
          description="Vertical 9:16 post-production, motion graphics sync, audio mixing, and edited render intake"
          badge={<Badge variant="active" size="sm" className="font-mono">STEP 08</Badge>}
        />

        {error && (
          <Alert variant="error" title="Error Loading Videos" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card padding="md">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Select Video for Post-Production Editing</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a recorded video (RECORDED or EDITING) to review graphics cues and upload final vertical render
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
                    onClick={() => navigate(`/videos/${encodeURIComponent(vid.id)}/edit-video`)}
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
                      <span>Editor: {vid.assignedEditor || 'Unassigned'}</span>
                      <span className="text-indigo-600 font-semibold flex items-center gap-1">
                        Open Edit Bay <ArrowRight className="w-3 h-3" />
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
        currentStep={8}
        videoId={videoId || selectedVideo?.id}
        videoTitle={selectedVideo?.title}
        videoStatus={selectedVideo?.status}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="active" size="sm" className="font-mono">
              STEP 08
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              {selectedVideo?.id || videoId}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">08 Edit Video</h1>
          <p className="text-xs text-slate-500">
            Vertical 9:16 motion graphics, Telugu typography subtitles, SFX mixing, and rendered cut upload.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/videos/${encodeURIComponent(videoId || selectedVideo?.id || '')}/record`)}
            icon={ArrowLeft}
            className="text-xs"
          >
            Back to Step 07
          </Button>
          <Link to="/production">
            <Button variant="outline" size="sm" icon={Film} className="text-xs">
              Production Tracker
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Editing Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <PageLoading message="Loading video editing workspace..." />
      ) : (
        <div className="space-y-6">
          {/* Top Specifications Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider block">
                ASPECT RATIO
              </span>
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <span className="text-lg font-bold font-mono">9:16 Vertical</span>
              </div>
              <span className="text-[11px] text-slate-400 block">1080 × 1920 (Full HD)</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
                TARGET DURATION
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono">30–50 Seconds</span>
              </div>
              <span className="text-[11px] text-slate-400 block">Ideal: ~45s for Shorts</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">
                AUDIO STANDARDS
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono">-14 LUFS / Stereo</span>
              </div>
              <span className="text-[11px] text-slate-400 block">Clear Telugu voiceover</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider block">
                STATUS
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono">{selectedVideo?.status}</span>
              </div>
              <span className="text-[11px] text-slate-400 block">Editor: {assignedEditor || 'Unassigned'}</span>
            </div>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Cue Sheet & Render Upload */}
            <div className="lg:col-span-2 space-y-6">
              {/* Graphic Cue Sync Sheet */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Motion Graphics Cue Sheet</h3>
                    <p className="text-xs text-slate-500">
                      Synchronize on-screen Telugu overlays, formulas, countdown timers, and options
                    </p>
                  </div>
                  <Badge variant="active" size="sm">
                    CUE TIMESTAMPS
                  </Badge>
                </div>

                <div className="p-4 space-y-3">
                  {/* Cue 1 */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                    <div className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded">
                      00:00 - 00:05
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <div className="font-bold text-slate-900">Hook Graphic & Big Question Header</div>
                      <p className="text-slate-600 font-sans">
                        Overlay: {script?.hookText || 'High-energy exam challenge title'}
                      </p>
                      <span className="text-[10px] text-indigo-600 font-medium block">
                        Cue: Zoom cut, bold Telugu title, whoosh sound effect
                      </span>
                    </div>
                  </div>

                  {/* Cue 2 */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                    <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                      00:05 - 00:15
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <div className="font-bold text-slate-900">4 Multiple-Choice Option Cards (A, B, C, D)</div>
                      <p className="text-slate-600 font-sans">
                        {question ? (
                          <span>
                            A: {question.options?.a || question.optionA} | B: {question.options?.b || question.optionB} | C: {question.options?.c || question.optionC} | D: {question.options?.d || question.optionD}
                          </span>
                        ) : (
                          'Pop up 4 option cards with 5s countdown timer animation'
                        )}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Cue: 5-second ticking clock SFX + pulsing timer bar
                      </span>
                    </div>
                  </div>

                  {/* Cue 3 */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                    <div className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                      00:15 - 00:35
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <div className="font-bold text-slate-900">Step-by-Step Math / Logic Highlighting</div>
                      <p className="text-slate-600 font-sans">
                        {script?.stepByStepSolution || 'Stepwise formula calculations appear line by line'}
                      </p>
                      <span className="text-[10px] text-emerald-600 font-medium block">
                        Cue: Glow outline on correct option ({question?.correctAnswer || 'A/B/C/D'}), pop sound on key formula
                      </span>
                    </div>
                  </div>

                  {/* Cue 4 */}
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 flex items-start gap-3">
                    <div className="font-mono text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-1 rounded">
                      00:35 - 00:45
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <div className="font-bold text-amber-900">Exam Shortcut Callout Box (Super Trick)</div>
                      <p className="text-slate-700 font-sans">
                        {script?.speedTrickOrTakeaway || 'Fast formula box with neon highlight'}
                      </p>
                      <span className="text-[10px] text-amber-700 font-medium block">
                        Cue: Ding SFX + golden border animation
                      </span>
                    </div>
                  </div>

                  {/* Cue 5 */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                    <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                      00:45 - 00:50
                    </div>
                    <div className="flex-1 text-xs space-y-1">
                      <div className="font-bold text-slate-900">Outro & Follow Channel Animation</div>
                      <p className="text-slate-600 font-sans">
                        {script?.callToAction || 'Burra Pariksha follow button animation'}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        Cue: Subscribe bell icon animation + next question teaser
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Edited Render Upload to Google Drive */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Google Drive Edited Cut Upload</h3>
                  <p className="text-xs text-slate-500">
                    Upload final vertical video render (MP4, H.264, 1080x1920). File will be uploaded to Drive folder.
                  </p>
                </div>

                <div className="p-4">
                  <form onSubmit={handleUploadEditedCut} className="space-y-4">
                    <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center bg-slate-50/50">
                      <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                      <label className="cursor-pointer block">
                        <span className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                          Click to select edited render (.mp4)
                        </span>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          Format: MP4 (H.264) • 1080x1920 (9:16)
                        </span>
                        <input
                          type="file"
                          accept="video/mp4,video/*"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Exact Render Duration (Seconds)
                        </label>
                        <input
                          type="number"
                          value={renderDurationSeconds}
                          onChange={(e) => setRenderDurationSeconds(Number(e.target.value))}
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Editor Completion Notes
                        </label>
                        <input
                          type="text"
                          value={editorNotes}
                          onChange={(e) => setEditorNotes(e.target.value)}
                          placeholder="e.g. Cut v1 with subtitles and sound effects complete"
                          className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-400">
                        Upload advances video to <strong>FINAL_REVIEW</strong>
                      </span>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={!uploadFile || isUploading}
                        icon={Upload}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      >
                        {isUploading ? 'Uploading Render...' : 'Upload Edited Render'}
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>
            </div>

            {/* Right Col: Quality Checklist & Post Settings */}
            <div className="space-y-4">
              {/* Post-Production Quality Checklist */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Post-Production Checklist</h3>
                  <p className="text-xs text-slate-500">Quality requirements for release</p>
                </div>
                <div className="p-4 space-y-3">
                  <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSubtitles}
                      onChange={(e) => setHasSubtitles(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Telugu Subtitles (Accurate spelling & fonts)</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasMotionGraphics}
                      onChange={(e) => setHasMotionGraphics(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Option Cards & Formula Callouts Animated</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSoundEffects}
                      onChange={(e) => setHasSoundEffects(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Sound Effects & Background Audio Balanced</span>
                  </label>

                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Editor
                    </label>
                    <input
                      type="text"
                      value={assignedEditor}
                      onChange={(e) => setAssignedEditor(e.target.value)}
                      placeholder="e.g. Editor John / Motion Team"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg mb-2"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={handleSaveEditorMetadata}
                      className="w-full text-xs"
                    >
                      Save Editor Info
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Status Transition Control Card */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Editing Stage Gate</h3>
                  <p className="text-xs text-slate-500">Finalize cut or mark ready</p>
                </div>
                <div className="p-4 space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isUpdatingStatus}
                    onClick={handleAdvanceToFinalReview}
                    icon={CheckCircle2}
                    className="w-full text-xs justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Mark Cut Ready for Final Review
                  </Button>
                </div>
              </Card>

              {/* Next Step Action Card */}
              <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono">
                    09
                  </span>
                  <span>Next: Final Video</span>
                </div>
                <p className="text-xs text-slate-600">
                  Cut complete? Move to final signoff to audit publish readiness and lock the master asset.
                </p>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const targetId = videoId || selectedVideo?.id;
                    navigate(`/videos/${encodeURIComponent(targetId)}/final-video`);
                  }}
                  icon={ArrowRight}
                  className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Continue to Final Video (Step 09)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoEditPage;
