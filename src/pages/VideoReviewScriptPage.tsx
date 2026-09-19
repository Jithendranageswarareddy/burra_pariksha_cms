import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FileCheck,
  Save,
  GitBranch,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Film,
} from 'lucide-react';
import { Video, Script, ScriptVersion, Question, VideoProductionStatus } from '../types';
import { apiClient } from '../lib/api-client';
import { VideoWorkflowHeader } from '../components/video/VideoWorkflowHeader';
import { PageHeader } from '../design-system/components/PageHeader';
import { Card } from '../design-system/components/Card';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';
import { Alert } from '../design-system/components/Alert';
import { PageLoading } from '../design-system/components/Loading';
import { EmptyState } from '../design-system/components/EmptyState';

export const VideoReviewScriptPage: React.FC = () => {
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const videoId = routeVideoId || searchParams.get('videoId') || searchParams.get('id') || '';

  // State
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);

  // Form Fields
  const [hookText, setHookText] = useState<string>('');
  const [problemStatement, setProblemStatement] = useState<string>('');
  const [stepByStepSolution, setStepByStepSolution] = useState<string>('');
  const [speedTrickOrTakeaway, setSpeedTrickOrTakeaway] = useState<string>('');
  const [callToAction, setCallToAction] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Versioning & UI state
  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);
  const [changeSummary, setChangeSummary] = useState<string>('');
  const [selectedVersionForDiff, setSelectedVersionForDiff] = useState<ScriptVersion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
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

  const loadVideoAndScript = async (targetId: string) => {
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

      const res = await apiClient.getScript(targetId);
      if (res.script) {
        setScript(res.script);
        setHookText(res.script.hookText || '');
        setProblemStatement(res.script.problemStatement || '');
        setStepByStepSolution(res.script.stepByStepSolution || '');
        setSpeedTrickOrTakeaway(res.script.speedTrickOrTakeaway || '');
        setCallToAction(res.script.callToAction || '');
        setNotes(res.script.notes || '');

        const vers = await apiClient.getScriptVersions(res.script.id);
        setVersions(vers);
      } else if (res.draftProposal) {
        setHookText(res.draftProposal.hookText || '');
        setProblemStatement(res.draftProposal.problemStatement || '');
        setStepByStepSolution(res.draftProposal.stepByStepSolution || '');
        setSpeedTrickOrTakeaway(res.draftProposal.speedTrickOrTakeaway || '');
        setCallToAction(res.draftProposal.callToAction || '');
        setNotes(res.draftProposal.notes || '');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load script review workspace');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      loadVideoAndScript(videoId);
    } else {
      loadVideoList();
    }
  }, [videoId]);

  const combinedScriptText = `${hookText}\n\n${problemStatement}\n\n${stepByStepSolution}\n\n${speedTrickOrTakeaway}\n\n${callToAction}`;
  const totalWords = combinedScriptText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const estimatedSeconds = Math.round((totalWords / 140) * 60);

  const handleSave = async (createNewVersion: boolean) => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        hookText,
        problemStatement,
        stepByStepSolution,
        speedTrickOrTakeaway,
        callToAction,
        notes,
        createNewVersion,
        changeSummary: createNewVersion ? changeSummary || 'Script editorial revision' : undefined,
      };

      const res = await apiClient.saveScript(targetId, payload);
      setScript(res.script);

      if (res.script) {
        const vers = await apiClient.getScriptVersions(res.script.id);
        setVersions(vers);
      }

      setSuccessMessage(
        createNewVersion
          ? `Successfully saved as new Version ${res.script.currentVersion}!`
          : 'Script draft saved successfully in-place.'
      );
      setShowVersionModal(false);
      setChangeSummary('');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to save script');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = async (versionNumber: number) => {
    if (!script) return;
    if (!window.confirm(`Are you sure you want to revert active script content to Version ${versionNumber}?`)) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const reverted = await apiClient.revertScript(script.id, versionNumber);
      setScript(reverted);
      setHookText(reverted.hookText || '');
      setProblemStatement(reverted.problemStatement || '');
      setStepByStepSolution(reverted.stepByStepSolution || '');
      setSpeedTrickOrTakeaway(reverted.speedTrickOrTakeaway || '');
      setCallToAction(reverted.callToAction || '');
      setNotes(reverted.notes || '');

      setSuccessMessage(`Active script reverted to content from Version ${versionNumber}.`);
      setSelectedVersionForDiff(null);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to rollback version');
    } finally {
      setIsSaving(false);
    }
  };

  // Mark Script Approved & Ready
  const handleMarkScriptReady = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsSaving(true);
      setError(null);
      await apiClient.markScriptReady(targetId, 'Script reviewed, timed, and approved for video production');
      setSuccessMessage('Script marked READY & APPROVED! Production status updated to SCRIPT_READY.');
      
      // Update local status
      if (selectedVideo) {
        setSelectedVideo({ ...selectedVideo, status: VideoProductionStatus.SCRIPT_READY });
      }
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to approve script');
    } finally {
      setIsSaving(false);
    }
  };

  // Return to Step 05
  const handleReturnToCreate = async () => {
    const targetId = videoId || selectedVideo?.id;
    if (!targetId) return;

    try {
      setIsSaving(true);
      setError(null);
      await apiClient.returnScriptToEditing(targetId, 'Script returned to Step 05 for revision');
      setSuccessMessage('Script returned to SCRIPT_REQUIRED.');
      if (selectedVideo) {
        setSelectedVideo({ ...selectedVideo, status: VideoProductionStatus.SCRIPT_REQUIRED });
      }
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Failed to return script');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyTeleprompter = () => {
    const formatted = `=== BURRA PARIKSHA TELEPROMPTER SCRIPT ===\n\n[HOOK (0-5s)]\n${hookText}\n\n[PROBLEM (5-15s)]\n${problemStatement}\n\n[STEP-BY-STEP SOLUTION (15-35s)]\n${stepByStepSolution}\n\n[SPEED SHORTCUT (35-45s)]\n${speedTrickOrTakeaway}\n\n[CALL TO ACTION (45-50s)]\n${callToAction}\n`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <VideoWorkflowHeader currentStep={6} />

        <PageHeader
          title="Review Script"
          description="Quality review, teleprompter timing verification, version comparison, and production approval"
        />

        {error && (
          <Alert variant="error" title="Error Loading Videos" onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card padding="md">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Select Video for Script Review</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a script ready for review or revision
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
                    onClick={() => navigate(`/videos/${encodeURIComponent(vid.id)}/review-script`)}
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
                      <span>Ref: {vid.questionId || 'N/A'}</span>
                      <span className="text-indigo-600 font-semibold flex items-center gap-1">
                        Review Script <ArrowRight className="w-3 h-3" />
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-indigo-600 font-mono font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {selectedVideo?.id || videoId}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Review Script</h1>
          <p className="text-xs text-slate-500">
            Verify teleprompter reading pace, review version history, and grant production signoff.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/videos/${encodeURIComponent(videoId || selectedVideo?.id || '')}/create-script`)}
            icon={ArrowLeft}
            className="text-xs"
          >
            Back to Script Drafting
          </Button>
          <Link to="/production">
            <Button variant="outline" size="sm" icon={Film} className="text-xs">
              Production Tracker
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Review Error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <PageLoading message="Loading script review workspace..." />
      ) : (
        <div className="space-y-6">
          {/* Script Review Top Control Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Script Editorial Review</h2>
                  {script ? (
                    <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      Version {script.currentVersion}
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                      Draft Proposal
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Total Words: <strong>{totalWords}</strong> • Est. Duration: <strong>~{estimatedSeconds}s</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyTeleprompter}
                icon={copied ? Check : Copy}
                className="text-xs"
              >
                {copied ? 'Copied!' : 'Copy Teleprompter'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => handleSave(false)}
                icon={Save}
                className="text-xs"
              >
                Save Draft
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => setShowVersionModal(true)}
                icon={GitBranch}
                className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              >
                Save New Version
              </Button>

              {selectedVideo?.status === VideoProductionStatus.SCRIPT_REQUIRED && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleMarkScriptReady}
                  icon={CheckCircle2}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Mark Script Ready & Approved
                </Button>
              )}

              {selectedVideo?.status === VideoProductionStatus.SCRIPT_READY && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleReturnToCreate}
                  icon={RotateCcw}
                  className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  Return to Step 05
                </Button>
              )}
            </div>
          </div>

          {/* Main Grid: Form Editor & Version History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Editor */}
            <div className="lg:col-span-2 space-y-4">
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Teleprompter Script Review</h3>
                  <p className="text-xs text-slate-500">Fine-tune and verify Telugu wording, math accuracy, and exam hooks</p>
                </div>
                <div className="p-4 space-y-4">
                  {/* Part 1: Hook */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-mono font-bold">1</span>
                      Hook (0–5s)
                    </label>
                    <textarea
                      value={hookText}
                      onChange={(e) => setHookText(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  {/* Part 2: Problem */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-mono font-bold">2</span>
                      Problem Statement (5–15s)
                    </label>
                    <textarea
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>

                  {/* Part 3: Solution */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-mono font-bold">3</span>
                      Step-by-Step Solution (15–35s)
                    </label>
                    <textarea
                      value={stepByStepSolution}
                      onChange={(e) => setStepByStepSolution(e.target.value)}
                      rows={4}
                      className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans"
                    />
                  </div>

                  {/* Part 4: Speed Shortcut */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px] font-mono font-bold">4</span>
                      Speed Shortcut / Takeaway (35–45s)
                    </label>
                    <textarea
                      value={speedTrickOrTakeaway}
                      onChange={(e) => setSpeedTrickOrTakeaway(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans bg-amber-50/30"
                    />
                  </div>

                  {/* Part 5: CTA */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px] font-mono font-bold">5</span>
                      Call to Action (CTA) (45–50s)
                    </label>
                    <input
                      type="text"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Internal Notes */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Host & Teleprompter Cue Notes
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Pause 1s after hook, point right on option C"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-600 bg-slate-50"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Col: Version History & Next Action */}
            <div className="space-y-4">
              <Card padding="md">
                <div className="p-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Version History</h3>
                  <p className="text-xs text-slate-500">Tracked revisions from Google Sheets</p>
                </div>
                <div className="p-4 space-y-3">
                  {versions.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
                      No versions saved yet. Click "Save New Version" to create snapshot.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {versions.map((ver) => {
                        const isCurrent = script?.currentVersion === ver.versionNumber;
                        const isSelected = selectedVersionForDiff?.id === ver.id;

                        return (
                          <div
                            key={ver.id}
                            className={`p-2.5 rounded-lg border text-xs transition-all ${
                              isCurrent
                                ? 'bg-indigo-50/70 border-indigo-300'
                                : isSelected
                                ? 'bg-slate-100 border-slate-400'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-900">Version {ver.versionNumber}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-semibold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-slate-600 text-[11px] line-clamp-2 mb-1.5">
                              {ver.changeSummary || 'Revision snapshot'}
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-[10px] text-slate-400">{ver.editedBy}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedVersionForDiff(isSelected ? null : ver)}
                                  className="text-[11px] text-indigo-600 hover:underline font-medium"
                                >
                                  {isSelected ? 'Close' : 'View'}
                                </button>
                                {!isCurrent && (
                                  <button
                                    type="button"
                                    onClick={() => handleRevert(ver.versionNumber)}
                                    className="text-[11px] text-rose-600 hover:underline font-medium"
                                  >
                                    Revert
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selected Snapshot Inspector */}
                  {selectedVersionForDiff && (
                    <div className="p-3 bg-slate-900 text-white rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span className="font-bold text-indigo-400">
                          Snapshot: v{selectedVersionForDiff.versionNumber}
                        </span>
                        <button
                          onClick={() => setSelectedVersionForDiff(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-3">
                        {selectedVersionForDiff.changeSummary}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Next Step Action Card */}
              <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono">
                    07
                  </span>
                  <span>Next: Record Video</span>
                </div>
                <p className="text-xs text-slate-600">
                  Script approved? Proceed to the recording studio workspace for teleprompter filming and raw footage upload.
                </p>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const targetId = videoId || selectedVideo?.id;
                    navigate(`/videos/${encodeURIComponent(targetId)}/record`);
                  }}
                  icon={ArrowRight}
                  className="w-full text-xs justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Continue to Record Video (Step 07)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Commit Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <GitBranch className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Commit New Script Version</h3>
            </div>

            <p className="text-xs text-slate-600">
              This will increment the script version counter in Google Sheets and snapshot the current 5-part script content.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Change Summary / Revision Notes
              </label>
              <textarea
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="e.g., Shortened hook by 3 words for faster pacing; clarified explanation in Step 2"
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSaving ? 'Committing...' : 'Commit Version'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoReviewScriptPage;
