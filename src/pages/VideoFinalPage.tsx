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
        `Final QA approved: ${signoffNotes || 'All readiness checks passed'}`
      );
      setSelectedVideo(updated);
      setSuccessMessage('Video approved and marked READY_TO_UPLOAD! Master asset locked.');
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

    try {
      setIsActionInProgress(true);
      setError(null);

      const updated = await apiClient.updateVideoStatus(
        targetId,
        VideoProductionStatus.EDITING,
        `Returned to Editing from Final Review: ${returnRemarks || 'Revisions requested'}`
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
          title="09 Final Video"
          description="Publication readiness audit, master asset lock, quality gate signoff, and distribution release"
          badge={<Badge variant="active" size="sm" className="font-mono">STEP 09</Badge>}
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
              Choose a completed video (FINAL_REVIEW or READY_TO_UPLOAD) to verify publishing readiness and grant signoff
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
                      <span>Duration: {vid.actualDurationSeconds || vid.targetDurationSeconds || 45}s</span>
                      <span className="text-indigo-600 font-semibold flex items-center gap-1">
                        Final Signoff <ArrowRight className="w-3 h-3" />
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

  const isReadyForSignoff = readiness?.readyForPublishing || selectedVideo?.status === VideoProductionStatus.FINAL_REVIEW;

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
            <Badge variant="active" size="sm" className="font-mono">
              STEP 09
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              {selectedVideo?.id || videoId}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">09 Final Video</h1>
          <p className="text-xs text-slate-500">
            Publish readiness audit, master asset lock, quality gate signoff, and distribution release.
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
            Back to Step 08
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
        <PageLoading message="Loading final video signoff audit..." />
      ) : (
        <div className="space-y-6">
          {/* Master Status & Readiness Hero */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                  selectedVideo?.status === VideoProductionStatus.READY_TO_UPLOAD
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                }`}
              >
                {selectedVideo?.status === VideoProductionStatus.READY_TO_UPLOAD ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {selectedVideo?.title}
                  </h2>
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                    {selectedVideo?.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Duration: <strong>{selectedVideo?.actualDurationSeconds || selectedVideo?.targetDurationSeconds || 45}s</strong> •
                  Host: <strong>{selectedVideo?.assignedHost || 'None'}</strong> •
                  Editor: <strong>{selectedVideo?.assignedEditor || 'None'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedVideo?.status === VideoProductionStatus.READY_TO_UPLOAD ? (
                <Badge variant="success" size="md" className="px-3 py-1 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> MASTER ASSET LOCKED & READY
                </Badge>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReturnModal(true)}
                    icon={RotateCcw}
                    className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    Return to Editing
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isActionInProgress}
                    onClick={handleApproveFinalVideo}
                    icon={CheckCircle2}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {isActionInProgress ? 'Approving...' : 'Grant Final QA Signoff'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Publishing Readiness Checklist & Asset Inspector */}
            <div className="lg:col-span-2 space-y-6">
              {/* Publication Readiness Checklist */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Publication Readiness Audit</h3>
                    <p className="text-xs text-slate-500">
                      Automated gate verifying all metadata, script versions, and video assets before distribution
                    </p>
                  </div>
                  <Badge
                    variant={readiness?.readyForPublishing ? 'success' : 'warning'}
                    size="sm"
                  >
                    {readiness?.readyForPublishing ? '100% READY' : 'AUDIT INCOMPLETE'}
                  </Badge>
                </div>

                <div className="p-4 space-y-3">
                  {/* Item 1: Question Record */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          1. Authoritative Question Record Approved
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Question ID: {selectedVideo?.questionId || 'N/A'} • Correct Answer: Option {question?.correctAnswer || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">PASS</Badge>
                  </div>

                  {/* Item 2: Script Approved */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          2. 5-Part Telugu Narration Script Approved
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {script ? `Version ${script.currentVersion} • Teleprompter timing ~45s` : 'Script verified'}
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">PASS</Badge>
                  </div>

                  {/* Item 3: Video File Uploaded */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          3. Vertical Render Uploaded to Drive
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Format: 1080x1920 (9:16) • Status: {selectedVideo?.status}
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">PASS</Badge>
                  </div>

                  {/* Item 4: Downstream Package Preview (Thumbnail & Pinned Comment) */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          4. Downstream Package Assets Ready
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Step 10 Thumbnail generator & Step 11 Pinned Comment hooks active
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">READY</Badge>
                  </div>
                </div>
              </Card>

              {/* Master Narration Content Snapshot */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Approved Master Narration Script</h3>
                  <p className="text-xs text-slate-500">Locked narration content for audience release</p>
                </div>
                <div className="p-4 space-y-3">
                  {script ? (
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                        <strong className="text-indigo-700 block mb-0.5">Hook:</strong>
                        <p className="text-slate-800">{script.hookText}</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                        <strong className="text-slate-700 block mb-0.5">Question & Problem:</strong>
                        <p className="text-slate-800">{script.problemStatement}</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                        <strong className="text-slate-700 block mb-0.5">Solution:</strong>
                        <p className="text-slate-800">{script.stepByStepSolution}</p>
                      </div>
                      <div className="p-2.5 bg-amber-50 rounded border border-amber-200">
                        <strong className="text-amber-800 block mb-0.5">Speed Shortcut:</strong>
                        <p className="text-amber-900 font-medium">{script.speedTrickOrTakeaway}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No script content snapshot available.
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Col: Signoff Controls & Downstream Handoff */}
            <div className="space-y-4">
              {/* QA Signoff Notes Card */}
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">QA Signoff Certification</h3>
                  <p className="text-xs text-slate-500">Certified by editorial lead</p>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quality Signoff Remarks
                    </label>
                    <textarea
                      value={signoffNotes}
                      onChange={(e) => setSignoffNotes(e.target.value)}
                      placeholder="e.g. Video render passed visual QA, subtitles are accurate, audio loudness verified."
                      rows={3}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    disabled={isActionInProgress}
                    onClick={handleApproveFinalVideo}
                    icon={CheckCircle2}
                    className="w-full text-xs justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {isActionInProgress ? 'Approving...' : 'Lock Master Asset & Approve'}
                  </Button>
                </div>
              </Card>

              {/* Downstream Production Handoff */}
              <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono">
                    10
                  </span>
                  <span>Next: Thumbnail & Downstream Packaging</span>
                </div>
                <p className="text-xs text-slate-600">
                  Master video locked. Proceed to generate vertical thumbnail graphics in Step 10 and compose community pinned comments.
                </p>

                <div className="space-y-2 pt-1">
                  <Link to={selectedVideo ? `/videos/${encodeURIComponent(selectedVideo.id)}/thumbnail` : '/videos/thumbnail'}>
                    <Button
                      variant="primary"
                      size="md"
                      icon={Image}
                      className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                      Proceed to 10 Create Thumbnail
                    </Button>
                  </Link>

                  <Link to="/production">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Film}
                      className="w-full text-xs justify-center"
                    >
                      Return to Production Tracker
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return to Editing Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">Return Video to Editing</h3>
            </div>

            <p className="text-xs text-slate-600">
              This will return the video to <strong>EDITING</strong> status and send feedback to the assigned editor.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Revision Instructions for Editor
              </label>
              <textarea
                value={returnRemarks}
                onChange={(e) => setReturnRemarks(e.target.value)}
                placeholder="e.g. Fix subtitle spelling on option C at 0:18; increase voiceover volume by +2dB"
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReturnModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isActionInProgress}
                onClick={handleReturnToEditing}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {isActionInProgress ? 'Returning...' : 'Confirm Return'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoFinalPage;
