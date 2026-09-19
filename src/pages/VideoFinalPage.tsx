import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Film,
  Image,
  MessageSquare,
  Lock,
  ExternalLink,
  Sliders,
  CheckSquare,
  Square,
  Radio,
  Eye,
  Volume2,
  Subtitles,
  HelpCircle,
  FileCheck,
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

export const VideoFinalPage: React.FC = () => {
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const videoId = routeVideoId || searchParams.get('videoId') || searchParams.get('id') || '';

  // State
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [readiness, setReadiness] = useState<any | null>(null);

  // 4-Dimensional QC Matrix State
  const [qcState, setQcState] = useState({
    audioBalance: true, // -14 LUFS Voiceover / Crisp SFX
    subtitleTelugu: true, // Accurate Telugu Orthography / No font glitches
    frameSafePacing: true, // 9:16 Vertical Safe Area / 50-59s Length
    pedagogicalKey: true, // Correct Answer Option Key Matches Question
  });

  const toggleQc = (key: keyof typeof qcState) => {
    setQcState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allQcPassed = Object.values(qcState).every(Boolean);

  // Approval & Signoff Notes
  const [signoffNotes, setSignoffNotes] = useState<string>('');
  const [returnRemarks, setReturnRemarks] = useState<string>('');
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionInProgress, setIsActionInProgress] = useState<boolean>(false);
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
        const rep = await apiClient.getVideoPublishReadiness(targetId);
        setReadiness(rep);
      } catch (rErr) {
        console.warn('Could not fetch publish readiness report:', rErr);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load final video signoff workspace');
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

  // Approve Video for Upload (Signoff)
  const handleApproveFinalVideo = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsActionInProgress(true);
      setError(null);

      const updated = await apiClient.updateVideoStatus(
        targetId,
        VideoProductionStatus.READY_TO_UPLOAD,
        `Final QA approved: ${signoffNotes || 'All 4 QC pillars verified'}`
      );
      setSelectedVideo(updated);
      setSuccessMessage('Video approved and marked READY_TO_UPLOAD! Master asset locked for distribution.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to approve final video.');
    } finally {
      setIsActionInProgress(false);
    }
  };

  // Return Video to Editing for Revisions
  const handleReturnToEditing = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    if (!returnRemarks.trim()) {
      setError('Please provide specific revision instructions before returning to editing.');
      return;
    }

    try {
      setIsActionInProgress(true);
      setError(null);

      const updated = await apiClient.updateVideoStatus(
        targetId,
        VideoProductionStatus.EDITING,
        `Returned to Editing from Final Review: ${returnRemarks.trim()}`
      );
      setSelectedVideo(updated);
      setShowReturnModal(false);
      setSuccessMessage('Video returned to Step 08 EDITING status with editor feedback.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to return video to editing.');
    } finally {
      setIsActionInProgress(false);
    }
  };

  // If no video is specified, show list
  if (!videoId && !selectedVideo) {
    const filteredVideos = videoList.filter(
      (v) =>
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.questionId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        <VideoWorkflowHeader currentStep={9} />

        <PageHeader
          title="Video Review & Signoff"
          description="Audio-video QC verification matrix, Telugu subtitle check, and publishing gatekeeper"
        />

        {error && (
          <Alert variant="error" title="Error Loading Videos" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card padding="md">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Select Video for Final Signoff</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a completed cut (FINAL_REVIEW or READY_TO_UPLOAD) to verify quality and grant signoff
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
                    onClick={() => navigate(`/videos/${encodeURIComponent(vid.id)}/final-video`)}
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
                      <span>Duration: {vid.actualDurationSeconds || vid.targetDurationSeconds || 54}s</span>
                      <span className="text-indigo-600 font-semibold flex items-center gap-1">
                        Final QC <ArrowRight className="w-3 h-3" />
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

  const isApproved = selectedVideo?.status === VideoProductionStatus.READY_TO_UPLOAD;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <VideoWorkflowHeader
        currentStep={9}
        videoId={videoId || selectedVideo?.id}
        videoTitle={selectedVideo?.title}
        videoStatus={selectedVideo?.status}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-indigo-600 font-mono font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {selectedVideo?.id || videoId}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Video Review & Signoff</h1>
          <p className="text-xs text-slate-500">
            Publish readiness audit, audio-video quality gates, pedagogical answer verification, and release lock.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/videos/${encodeURIComponent(videoId || selectedVideo?.id || '')}/edit-video`)}
            icon={ArrowLeft}
            className="text-xs"
          >
            Back to Video Editor
          </Button>
          <Link to="/production">
            <Button variant="outline" size="sm" icon={Film} className="text-xs">
              Production Tracker
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Signoff Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <PageLoading message="Loading final review workspace..." />
      ) : (
        <div className="space-y-6">
          {/* Top Status & Fast Action Bar */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${isApproved ? 'text-emerald-400' : 'text-indigo-400'}`} />
                <span className="text-xs font-mono text-indigo-400 font-bold tracking-widest uppercase">
                  QUALITY CONTROL GATEKEEPER
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  • STATUS: {selectedVideo?.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                {selectedVideo?.title || 'Telugu Educational Short'}
              </h2>
              <p className="text-xs text-slate-400">
                Host: <strong>{selectedVideo?.assignedHost || 'Host'}</strong> • Editor: <strong>{selectedVideo?.assignedEditor || 'Editor'}</strong> • Duration: <strong>{selectedVideo?.actualDurationSeconds || selectedVideo?.targetDurationSeconds || 54}s</strong>
              </p>
            </div>

            {/* Fast Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowReturnModal(true)}
                disabled={isActionInProgress}
                icon={RotateCcw}
                className="text-xs bg-slate-800 text-rose-300 border-rose-800/80 hover:bg-rose-950/40 hover:text-white"
              >
                Return for Revisions
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleApproveFinalVideo}
                disabled={isActionInProgress || isApproved || !allQcPassed}
                icon={CheckCircle2}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg disabled:opacity-50"
              >
                {isApproved ? 'Master Video Approved' : 'Approve & Release'}
              </Button>
            </div>
          </div>

          {/* Main QC Deck: Dual Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: 4-Dimensional QC Verification Matrix */}
            <div className="space-y-6">
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">4-Dimensional QC Verification Matrix</h3>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    allQcPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {Object.values(qcState).filter(Boolean).length}/4 CHECKS PASSED
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {/* Pillar 1: Audio Balance */}
                  <div
                    onClick={() => toggleQc('audioBalance')}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                      qcState.audioBalance
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {qcState.audioBalance ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>01 Audio Levels & SFX Balancing</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Presenter voiceover normalized to ~ -14 LUFS; sound effects (ticking timer, correct answer chime) do not overpower speech.
                      </p>
                    </div>
                  </div>

                  {/* Pillar 2: Subtitle Orthography */}
                  <div
                    onClick={() => toggleQc('subtitleTelugu')}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                      qcState.subtitleTelugu
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {qcState.subtitleTelugu ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Subtitles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>02 Telugu Typography & Orthography Check</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Telugu text overlays render with correct Unicode conjuncts (ottulu/vattulu), zero font rendering glitches, and accurate spelling.
                      </p>
                    </div>
                  </div>

                  {/* Pillar 3: Vertical Frame & Pacing */}
                  <div
                    onClick={() => toggleQc('frameSafePacing')}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                      qcState.frameSafePacing
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {qcState.frameSafePacing ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>03 9:16 Safe Area Framing & Shorts Duration</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Content is within YouTube Shorts UI safety margin (no titles blocked by bottom caption / right buttons); video duration is 50–59 seconds.
                      </p>
                    </div>
                  </div>

                  {/* Pillar 4: Pedagogical Answer Verification */}
                  <div
                    onClick={() => toggleQc('pedagogicalKey')}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition select-none ${
                      qcState.pedagogicalKey
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {qcState.pedagogicalKey ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>04 Pedagogical Answer Key Match</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Visual green highlight matches canonical answer: Option <strong>{question?.correctAnswer || 'A'}</strong>. Math explanation is 100% sound.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Master Assets & Drive Folder Links */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Google Drive Production Package</h3>
                  <Badge variant="active" size="sm" className="font-mono">
                    MASTER STORAGE
                  </Badge>
                </div>
                <div className="p-4 space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Drive Production Folder</span>
                      <span className="text-[10px] text-slate-500 font-mono">Stores raw camera, project files, and rendered cuts</span>
                    </div>
                    {(selectedVideo?.driveFolderUrl || (selectedVideo as any)?.googleDriveFolderUrl) ? (
                      <a
                        href={selectedVideo?.driveFolderUrl || (selectedVideo as any)?.googleDriveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-xs font-bold flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Open Folder
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Not linked</span>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Question Reference & Publishing Signoff Form */}
            <div className="space-y-6">
              {/* Question Reference & Solution Proof */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Canonical Question Verification</h3>
                  </div>
                  {question && (
                    <Badge variant="active" size="sm" className="font-mono">
                      {question.id}
                    </Badge>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {question ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block mb-1">
                          Telugu Problem Statement
                        </span>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-telugu text-xs leading-relaxed font-medium">
                          {question.questionText}
                        </div>
                      </div>

                      {/* Correct Option Highlight */}
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg">
                        <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block">
                          Declared Correct Answer: Option {question.correctAnswer}
                        </span>
                        <p className="font-telugu text-xs font-bold text-emerald-950 mt-1">
                          {(question.options as any)?.[String(question.correctAnswer).toLowerCase()] ||
                            (question as any)[`option${question.correctAnswer}`] ||
                            'Option text'}
                        </p>
                      </div>

                      {/* Explanation */}
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono font-bold text-amber-800 uppercase block">
                          Speed Trick / Explanation
                        </span>
                        <p className="font-telugu text-xs text-amber-950 leading-relaxed">
                          {script?.speedTrickOrTakeaway || question.explanation}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No question record linked.</p>
                  )}
                </div>
              </Card>

              {/* Signoff Notes & Approver Form */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Publishing Gatekeeper Signoff</h3>
                  <p className="text-xs text-slate-500">Record final approval audit notes</p>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Final Review / QC Notes
                    </label>
                    <textarea
                      value={signoffNotes}
                      onChange={(e) => setSignoffNotes(e.target.value)}
                      placeholder="e.g. Excellent audio sync, verified Telugu fonts and Option C math."
                      rows={3}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleApproveFinalVideo}
                      disabled={isActionInProgress || isApproved || !allQcPassed}
                      icon={CheckCircle2}
                      className="w-full text-xs justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50"
                    >
                      {isApproved ? 'Master Video Signoff Granted' : 'Approve & Release'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Next Step Action Box */}
              <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono">
                    10
                  </span>
                  <span>Next: Social Review & Distribution</span>
                </div>
                <p className="text-xs text-slate-600">
                  Video master approved? Proceed to Phase 8H Human Review to review multi-platform social packages (YouTube Shorts, Instagram Reels, Telegram).
                </p>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const targetId = videoId || selectedVideo?.id;
                    navigate(`/videos/${encodeURIComponent(targetId)}/social-review`);
                  }}
                  icon={ArrowRight}
                  className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Proceed to Social Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return to Editing Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <RotateCcw className="w-5 h-5" />
              <span>Return Video for Revisions</span>
            </div>
            <p className="text-xs text-slate-600">
              Please specify the revisions required by the video editor (e.g. fix spelling in Option B, reduce background music volume).
            </p>

            <textarea
              rows={4}
              value={returnRemarks}
              onChange={(e) => setReturnRemarks(e.target.value)}
              placeholder="Enter specific edit revision notes..."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnRemarks('');
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleReturnToEditing}
                disabled={isActionInProgress || !returnRemarks.trim()}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isActionInProgress ? 'Returning...' : 'Send Back to Editor'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoFinalPage;
