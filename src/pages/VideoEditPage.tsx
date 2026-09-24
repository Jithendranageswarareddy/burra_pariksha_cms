import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Film,
  Upload,
  Scissors,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  HelpCircle,
  FileText,
  AlertTriangle,
  Info,
  CheckSquare,
  Square,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Video, Script, Question, VideoProductionStatus, MediaAsset } from '../types';
import { apiClient } from '../lib/api-client';
import { VideoWorkflowHeader } from '../components/video/VideoWorkflowHeader';
import { ProductionJourneyBar } from '../components/production/ProductionJourneyBar';
import { useProductionJourney } from '../contexts/ProductionJourneyContext';
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

  const { loadJourneyForVideo } = useProductionJourney();

  // State
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);

  // Video Editing & Render Form State
  const [assignedEditor, setAssignedEditor] = useState<string>('');
  const [renderDurationSeconds, setRenderDurationSeconds] = useState<number>(54);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [editorNotes, setEditorNotes] = useState<string>('');

  // Shorts Master Pacing Checklist State
  const [checklist, setChecklist] = useState({
    hookOverlay: true,
    timerSync: true,
    teluguFonts: true,
    soundSfx: true,
    verticalFrame: true,
    durationChecked: true,
  });

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Upload Edited Cut State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [driveCutUrl, setDriveCutUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
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
      setError(err?.message || 'Failed to load video records');
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
      loadJourneyForVideo(targetId, vid);
      setAssignedEditor(vid.assignedEditor || '');
      if (vid.actualDurationSeconds || vid.targetDurationSeconds) {
        setRenderDurationSeconds(Number(vid.actualDurationSeconds || vid.targetDurationSeconds) || 54);
      }

      if (vid.questionId) {
        try {
          const q = await apiClient.getQuestionById(vid.questionId);
          setQuestion(q);
        } catch (qErr) {
          console.warn('Could not fetch question:', qErr);
        }
      }

      try {
        const sRes = await apiClient.getScript(targetId);
        if (sRes.script) {
          setScript(sRes.script);
        }
      } catch (sErr) {
        console.warn('Could not fetch script:', sErr);
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

  // Duration compliance evaluation (Optimal Shorts: 50–59s)
  const getDurationStatus = (dur: number) => {
    if (dur >= 50 && dur <= 59) {
      return {
        variant: 'optimal',
        label: 'Optimal Shorts Length (50–59s)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
        badgeColor: 'bg-emerald-600 text-white',
      };
    } else if ((dur >= 40 && dur < 50) || (dur > 59 && dur <= 60)) {
      return {
        variant: 'acceptable',
        label: 'Acceptable (40–49s / 60s Max)',
        color: 'text-amber-700 bg-amber-50 border-amber-300',
        badgeColor: 'bg-amber-600 text-white',
      };
    } else {
      return {
        variant: 'non-compliant',
        label: dur > 60 ? 'Exceeds 60s Shorts Limit (Will fail Shorts feed)' : 'Too short (<40s)',
        color: 'text-rose-700 bg-rose-50 border-rose-300',
        badgeColor: 'bg-rose-600 text-white',
      };
    }
  };

  const durationStatus = getDurationStatus(renderDurationSeconds);

  // Update Editor & Render Metadata
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
      setSuccessMessage('Editor assignment and duration updated in Google Sheets.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update editor metadata.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Upload Edited Final Cut to Google Drive
  const handleUploadEditedCut = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    if (!uploadFile && !driveCutUrl.trim()) {
      setError('Please select an MP4 file or provide a Google Drive URL for the edited cut.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setSuccessMessage(null);
      setUploadProgress(15);

      if (uploadFile) {
        const interval = setInterval(() => {
          setUploadProgress((p) => (p < 85 ? p + 15 : p));
        }, 300);

        const updatedVideo = await apiClient.uploadEditedVideoFile(
          targetId,
          uploadFile,
          undefined,
          true
        );
        clearInterval(interval);
        setUploadProgress(100);
        if (updatedVideo?.video) {
          setSelectedVideo(updatedVideo.video);
        } else if (updatedVideo) {
          setSelectedVideo(updatedVideo);
        }
        setUploadFile(null);
      } else if (driveCutUrl.trim()) {
        const updated = await apiClient.updateVideoMetadata(targetId, {
          notes: `${selectedVideo?.notes || ''}\nEdited Render Drive URL: ${driveCutUrl.trim()}`.trim(),
          actualDurationSeconds: renderDurationSeconds,
        });
        const statusUpdated = await apiClient.updateVideoStatus(
          targetId,
          VideoProductionStatus.FINAL_REVIEW,
          `Rendered cut linked via Drive (${renderDurationSeconds}s): ${driveCutUrl.trim()}`
        );
        setSelectedVideo(statusUpdated);
        setDriveCutUrl('');
      }

      setSuccessMessage('Rendered video cut uploaded successfully! Status advanced to FINAL_REVIEW.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit edited video file.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Status Transitions
  const handleAdvanceToFinalReview = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsUpdatingStatus(true);
      setError(null);

      const updated = await apiClient.updateVideoStatus(
        targetId,
        VideoProductionStatus.FINAL_REVIEW,
        `Stage advanced from Stage 05 Video Editing: ${editorNotes || 'Cut finalized'}`
      );
      setSelectedVideo(updated);
      setSuccessMessage('Production status transitioned to FINAL_REVIEW.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to update video status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // If no video is selected, show candidate selection list
  if (!videoId && !selectedVideo) {
    const filteredVideos = videoList.filter(
      (v) =>
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.questionId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <VideoWorkflowHeader currentStep={6} />

        <PageHeader
          title="Video Editor"
          description="Sync Telugu on-screen graphics, add countdown timer, trim pacing, and render vertical 9:16 Shorts"
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
              Choose recorded footage (RECORDED or EDITING) to edit graphics and upload vertical cut
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
        currentStep={6}
        videoId={videoId || selectedVideo?.id}
        videoTitle={selectedVideo?.title}
        videoStatus={selectedVideo?.status}
      />

      {/* Unified Production Journey Architecture Stage Bar */}
      <ProductionJourneyBar
        onNavigateTab={(tab) => {
          const targetId = videoId || selectedVideo?.id;
          if (targetId) {
            navigate(`/videos/${encodeURIComponent(targetId)}?tab=${tab}`);
          }
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-indigo-600 font-mono font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {selectedVideo?.id || videoId}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Video Editor</h1>
          <p className="text-xs text-slate-500">
            Sync Telugu typography overlays, 10s countdown sound cue, and verify 50–59s pacing compliance.
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
            Back to Recording
          </Button>
          <Link to="/production">
            <Button variant="outline" size="sm" icon={Film} className="text-xs">
              Production Tracker
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Editor Workspace Notice" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <PageLoading message="Loading post-production editing suite..." />
      ) : (
        <div className="space-y-6">
          {/* Editor Header Banner with Raw Assets Link */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono text-indigo-400 font-bold tracking-widest uppercase">
                  POST-PRODUCTION SUITE • 9:16 VERTICAL SHORTS
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  • STATUS: {selectedVideo?.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {selectedVideo?.title || 'Telugu Educational Short'}
              </h2>
              <p className="text-xs text-slate-400">
                Host Footage: <strong>{selectedVideo?.assignedHost || 'Host'}</strong> • Editor: <strong>{selectedVideo?.assignedEditor || assignedEditor || 'Unassigned'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {(selectedVideo?.driveFolderUrl || (selectedVideo as any)?.googleDriveFolderUrl) && (
                <a
                  href={selectedVideo?.driveFolderUrl || (selectedVideo as any)?.googleDriveFolderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-2 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Drive Raw Assets</span>
                </a>
              )}
            </div>
          </div>

          {/* Main Dual-Column Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Graphics Asset Sync & Pacing Cue Sheet */}
            <div className="space-y-6">
              {/* Telugu On-Screen Graphics Reference Card */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Telugu On-Screen Graphics Overlays</h3>
                  </div>
                  <Badge variant="active" size="sm" className="font-mono">
                    9:16 VERTICAL
                  </Badge>
                </div>

                <div className="p-4 space-y-4">
                  {/* Hook Motion Graphic */}
                  <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-red-700 uppercase">
                        Hook Graphic Overlay (00:00 – 00:05)
                      </span>
                      <span className="text-[10px] bg-red-200 text-red-900 px-1.5 py-0.2 rounded font-mono">
                        Bold Center Pop
                      </span>
                    </div>
                    <p className="font-telugu text-sm font-bold text-red-950 leading-relaxed">
                      {script?.hookText || 'Hook Title Graphic'}
                    </p>
                  </div>

                  {/* Question & Options Graphic Overlay */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">
                        Question &amp; 4-Box Options (00:05 – 00:15)
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded font-mono">
                        Lower-Third Grid
                      </span>
                    </div>

                    {question ? (
                      <>
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-telugu text-slate-900 font-medium leading-relaxed">
                          {(question as any).statementTe || (question as any).statement || question.questionText}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                            const optText =
                              (question.options as any)?.[opt.toLowerCase()] ||
                              (question as any)[`option${opt}Te`] ||
                              (question as any)[`option${opt}`] ||
                              '';
                            const correctAns = String((question as any).correctOption || question.correctAnswer || '').toUpperCase();
                            const isCorrect = correctAns === opt;
                            return (
                              <div
                                key={opt}
                                className={`p-2 rounded border text-[11px] font-telugu ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className="font-mono font-bold uppercase mr-1">[{opt}]</span>
                                {optText}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400">No question metadata available.</p>
                    )}
                  </div>

                  {/* 10-Second Timer Cue & Sound Cue */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-amber-800 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        10-Second Radial Countdown Cue (00:15 – 00:25)
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono">
                        SFX: Ticking Clock
                      </span>
                    </div>
                    <p className="text-xs text-amber-950">
                      Sync circular countdown animation with subtle audio ticking. Highlight Option <strong>{String((question as any)?.correctOption || question?.correctAnswer || 'A').toUpperCase()}</strong> at 00:25.
                    </p>
                  </div>

                  {/* Burra Speed Shortcut Overlay */}
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-indigo-800 uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        Burra Speed Formula Graphic (00:35 – 00:45)
                      </span>
                      <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 py-0.2 rounded font-mono">
                        Gold Highlight Box
                      </span>
                    </div>
                    <p className="font-telugu text-xs font-bold text-indigo-950 leading-relaxed">
                      {script?.speedTrickOrTakeaway || 'Exam Shortcut Trick Graphic'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Shorts Master Pacing Checklist */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Shorts Master Pacing Checklist</h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {Object.values(checklist).filter(Boolean).length}/6 COMPLETE
                  </span>
                </div>

                <div className="p-4 space-y-2.5">
                  {[
                    { key: 'hookOverlay', label: 'Hook on-screen title text appears in first 0.5s' },
                    { key: 'timerSync', label: '10s visual countdown & ticking SFX synced at 00:15' },
                    { key: 'teluguFonts', label: 'Telugu font rendered without missing glyphs (Gautami/Noto)' },
                    { key: 'soundSfx', label: 'Correct answer pop sound effect & green border flash' },
                    { key: 'verticalFrame', label: 'Presenter framed in center 9:16 safe area (no UI cut-off)' },
                    { key: 'durationChecked', label: 'Final cut strictly between 50s and 59s total length' },
                  ].map((item) => {
                    const checked = checklist[item.key as keyof typeof checklist];
                    return (
                      <div
                        key={item.key}
                        onClick={() => toggleChecklistItem(item.key as keyof typeof checklist)}
                        className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition select-none ${
                          checked
                            ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="text-xs font-medium">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right Column: Duration Compliance Gauge & Render Intake */}
            <div className="space-y-6">
              {/* Duration Compliance & Pacing Gauge */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Duration & Pacing Compliance</h3>
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${durationStatus.badgeColor}`}>
                    {renderDurationSeconds}s TOTAL
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Render Duration (Seconds)</span>
                      <span className="font-mono text-indigo-600 font-bold">{renderDurationSeconds} seconds</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="75"
                      value={renderDurationSeconds}
                      onChange={(e) => setRenderDurationSeconds(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                      <span>30s (Min)</span>
                      <span className="text-emerald-600 font-bold">50s – 59s (Optimal Shorts)</span>
                      <span>75s (Long)</span>
                    </div>
                  </div>

                  {/* Duration Compliance Status Box */}
                  <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${durationStatus.color}`}>
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">{durationStatus.label}</div>
                      <p className="text-[11px] mt-0.5 leading-relaxed opacity-90">
                        {renderDurationSeconds >= 50 && renderDurationSeconds <= 59
                          ? 'Perfect pacing for YouTube Shorts and Instagram Reels algorithm retention.'
                          : renderDurationSeconds > 60
                          ? 'Videos over 60 seconds are disqualified from the YouTube Shorts feed and will render as regular landscape video.'
                          : 'Short videos (<50s) have reduced ad revenue and watch-time scoring.'}
                      </p>
                    </div>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '9:16', label: '9:16 Vertical', sub: 'Shorts & Reels' },
                      { id: '1:1', label: '1:1 Square', sub: 'Post / Feed' },
                      { id: '16:9', label: '16:9 Landscape', sub: 'Long Form' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setAspectRatio(item.id as any)}
                        className={`p-2.5 rounded-lg border text-left transition ${
                          aspectRatio === item.id
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-200'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-mono text-xs font-bold">{item.id}</div>
                        <div className="text-[10px] text-slate-500">{item.sub}</div>
                      </button>
                    ))}
                  </div>

                  {/* Assigned Editor & Notes */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Video Editor Assigned
                      </label>
                      <input
                        type="text"
                        value={assignedEditor}
                        onChange={(e) => setAssignedEditor(e.target.value)}
                        placeholder="e.g. Anand Varma / Lead Editor"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Editor Cutting Notes
                      </label>
                      <textarea
                        value={editorNotes}
                        onChange={(e) => setEditorNotes(e.target.value)}
                        placeholder="e.g. Added zoom-in on Option C, audio normalized to -14 LUFS"
                        rows={2}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={handleSaveEditorMetadata}
                      className="w-full text-xs"
                    >
                      {isUpdatingStatus ? 'Saving in Sheets...' : 'Save Editor & Duration Settings'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Upload Rendered Video File to Google Drive */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Upload Rendered Video (Google Drive)</h3>
                  <p className="text-xs text-slate-500">
                    Upload final vertical MP4 render or link Google Drive export URL
                  </p>
                </div>

                <div className="p-4 space-y-4">
                  <form onSubmit={handleUploadEditedCut} className="space-y-4">
                    {/* Drag & Drop File Upload */}
                    <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 text-center bg-slate-50/50 transition">
                      <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                      <label className="cursor-pointer block">
                        <span className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                          Click to browse rendered video file (.mp4)
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          1080x1920 60fps Vertical MP4
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

                    {/* Or Google Drive URL Input */}
                    <div className="relative">
                      <div className="text-[10px] font-mono text-slate-400 uppercase text-center mb-2">
                        — OR LINK DRIVE FILE —
                      </div>
                      <input
                        type="url"
                        value={driveCutUrl}
                        onChange={(e) => setDriveCutUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/.../view"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {isUploading && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono text-indigo-700">
                          <span>Uploading cut to Google Drive...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        Advances video to <strong>FINAL_REVIEW</strong>
                      </span>
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={(!uploadFile && !driveCutUrl.trim()) || isUploading}
                        icon={Upload}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                      >
                        {isUploading ? 'Uploading...' : 'Submit Edited Cut'}
                      </Button>
                    </div>
                  </form>
                </div>
              </Card>

              {/* Next Step Action Box */}
              <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <span>Next: Video Review & Signoff</span>
                </div>
                <p className="text-xs text-slate-600">
                  Render complete? Pass video to the Publishing Manager for final audio-video QC, Telugu subtitle check, and one-click approval.
                </p>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const targetId = videoId || selectedVideo?.id;
                    navigate(`/videos/${encodeURIComponent(targetId)}?tab=final-review`);
                  }}
                  icon={ArrowRight}
                  className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Proceed to Final Review
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
