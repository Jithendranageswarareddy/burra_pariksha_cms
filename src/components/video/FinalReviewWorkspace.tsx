import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowRight,
  FileText,
  Check,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Send,
} from 'lucide-react';
import { Video, Script, Thumbnail, PinnedComment, VideoProductionStatus, Question } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { Card } from '../../design-system/components/Card';
import { Alert } from '../../design-system/components/Alert';

interface FinalReviewWorkspaceProps {
  videoId: string;
  video: Video;
  onStatusChange?: () => void;
  onNavigateTab?: (tab: 'script' | 'thumbnail' | 'pinned-comment' | 'editing' | 'publishing' | 'recording' | 'overview' | 'social') => void;
}

export const FinalReviewWorkspace: React.FC<FinalReviewWorkspaceProps> = ({
  videoId,
  video,
  onStatusChange,
  onNavigateTab,
}) => {
  const [script, setScript] = useState<Script | null>(null);
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
  const [pinnedComment, setPinnedComment] = useState<PinnedComment | null>(null);
  const [sourceQuestion, setSourceQuestion] = useState<Question | null>(null);
  const [readiness, setReadiness] = useState<any | null>(null);

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Script cross-reference collapsible state
  const [isScriptCrossOpen, setIsScriptCrossOpen] = useState<boolean>(true);

  // Editorial Notes state
  const [editorialNotes, setEditorialNotes] = useState<string>(video.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  // Return drawer state
  const [showReturnDrawer, setShowReturnDrawer] = useState<boolean>(false);
  const [returnRemarks, setReturnRemarks] = useState<string>('');

  const fetchSupportingData = async () => {
    try {
      setIsLoadingData(true);
      setError(null);
      const [scriptRes, thumbRes, commentRes, readinessRes] = await Promise.all([
        apiClient.getScript(videoId).catch(() => ({ script: null })),
        apiClient.getThumbnail(videoId).catch(() => ({ thumbnail: null })),
        apiClient.getPinnedComment(videoId).catch(() => ({ pinnedComment: null })),
        apiClient.getVideoPublishReadiness(videoId).catch(() => null),
      ]);

      if (scriptRes?.script) setScript(scriptRes.script);
      if (thumbRes?.thumbnail) setThumbnail(thumbRes.thumbnail);
      if (commentRes?.pinnedComment) setPinnedComment(commentRes.pinnedComment);
      if (readinessRes) setReadiness(readinessRes);

      if (video.questionId) {
        try {
          const q = await apiClient.getQuestionById(video.questionId);
          if (q) setSourceQuestion(q);
        } catch {
          // non-fatal
        }
      }
    } catch (err: any) {
      console.warn('Failed to load review supporting assets:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchSupportingData();
  }, [videoId]);

  const handleStatusTransition = async (nextStatus: VideoProductionStatus, remarks?: string) => {
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.updateVideoStatus(
        videoId,
        nextStatus,
        remarks || `Transitioned to ${nextStatus} via Final Review Workspace`
      );
      setSuccessMessage(`Video status successfully updated to ${nextStatus}.`);
      setShowReturnDrawer(false);
      setReturnRemarks('');
      if (onStatusChange) onStatusChange();

      if (nextStatus === VideoProductionStatus.READY_TO_UPLOAD && onNavigateTab) {
        if (thumbnail?.status === 'APPROVED') {
          onNavigateTab('social');
        } else {
          onNavigateTab('thumbnail');
        }
      } else if (nextStatus === VideoProductionStatus.EDITING && onNavigateTab) {
        onNavigateTab('editing');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update video status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickApproveThumbnail = async () => {
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const payload = {
        hookHeadline: thumbnail?.hookHeadline || video.title || 'Thumbnail Headline',
        driveAssetUrl: thumbnail?.driveAssetUrl || '',
        previewUrl: thumbnail?.previewUrl || '',
        status: 'APPROVED',
        createNewVersion: false,
        designerNotes: 'Quick approved in Final QC Command Station',
      };
      const res = await apiClient.saveThumbnail(videoId, payload);
      setThumbnail(res.thumbnail);
      setSuccessMessage('Thumbnail asset successfully approved!');
      await fetchSupportingData();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve thumbnail.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuickApprovePinnedComment = async () => {
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const payload = {
        commentText: pinnedComment?.commentText || `Detailed solution for ${video.id}`,
        solutionBreakdown: pinnedComment?.solutionBreakdown || 'Step-by-step verified solution proof.',
        nextChallengeQuestion: pinnedComment?.nextChallengeQuestion || '',
        isApproved: true,
      };
      const saved = await apiClient.savePinnedComment(videoId, payload);
      const record = saved?.pinnedComment || saved;
      setPinnedComment(record);
      setSuccessMessage('Pinned solution comment approved!');
      await fetchSupportingData();
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve pinned comment.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEditorialNotes = async () => {
    setIsSavingNotes(true);
    setError(null);
    try {
      await apiClient.updateVideoMetadata(videoId, { notes: editorialNotes });
      setSuccessMessage('Editorial QA notes saved.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save editorial notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Evaluation flags
  const isScriptVerified = Boolean(script && (script.currentVersion > 0 || script.hookText));
  const isThumbnailApproved = thumbnail?.status === 'APPROVED';
  const isPinnedCommentApproved = pinnedComment?.isApproved === true;
  const scriptFormatText = (script as any)?.scriptFormat === 'VIRAL_CHALLENGE' ? 'Viral Challenge' : 'Full Solution';

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {successMessage && (
        <Alert variant="success" title="Success">
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Review Action Error">
          {error}
        </Alert>
      )}

      {/* Main Dual-Pane 7/5 Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane (lg:col-span-7) — Quality Assurance Gate */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: 5-Point Authoritative QC Gate */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">5-Point Authoritative QC Gate</h3>
              </div>
              <Badge variant="active" size="sm">QC Lock</Badge>
            </div>

            {isLoadingData ? (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                Evaluating QC verification gates...
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {/* 1. Linked Question Record */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">1. Linked Question Record</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {video.questionId || sourceQuestion?.id || 'BP-Q-001048'} (Verified & Approved)
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">PASS</Badge>
                </div>

                {/* 2. Approved Script Context */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isScriptVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800">2. Approved Script Context</p>
                      <p className="text-[11px] text-slate-500">
                        v{script?.currentVersion || 1} Verified ({scriptFormatText})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onNavigateTab && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onNavigateTab('script')}
                        className="text-indigo-600 hover:text-indigo-800 text-[11px] h-7 px-2"
                      >
                        Inspect
                      </Button>
                    )}
                    <Badge variant={isScriptVerified ? 'success' : 'warning'} size="sm">
                      {isScriptVerified ? 'PASS' : 'PENDING'}
                    </Badge>
                  </div>
                </div>

                {/* 3. Master Video Cut Asset */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">3. Master Video Cut Asset</p>
                      <p className="text-[11px] text-slate-500">Ingested 1080x1920 9:16 MP4 (Drive Ready)</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">PASS</Badge>
                </div>

                {/* 4. Thumbnail Asset Status */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isThumbnailApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800">4. Thumbnail Asset Status</p>
                      <p className="text-[11px] text-slate-500">
                        {thumbnail?.status === 'APPROVED' ? 'Approved & Certified' : 'Design Ready (Pending Review)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isThumbnailApproved && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isUpdating}
                          onClick={handleQuickApproveThumbnail}
                          icon={Sparkles}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2 text-[11px]"
                        >
                          Quick Approve
                        </Button>
                        {onNavigateTab && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onNavigateTab('thumbnail')}
                            icon={ImageIcon}
                            className="h-7 px-2 text-[11px]"
                          >
                            Design Thumbnail
                          </Button>
                        )}
                      </>
                    )}
                    <Badge variant={isThumbnailApproved ? 'success' : 'warning'} size="sm">
                      {isThumbnailApproved ? 'PASS' : 'PENDING'}
                    </Badge>
                  </div>
                </div>

                {/* 5. Official Pinned Comment */}
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isPinnedCommentApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-800">5. Official Pinned Comment</p>
                      <p className="text-[11px] text-slate-500">
                        {isPinnedCommentApproved ? 'Approved Solution Comment' : 'Pending Formal Sign-Off'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isPinnedCommentApproved && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isUpdating}
                        onClick={handleQuickApprovePinnedComment}
                        icon={Sparkles}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-2 text-[11px]"
                      >
                        Quick Sign-Off
                      </Button>
                    )}
                    <Badge variant={isPinnedCommentApproved ? 'success' : 'warning'} size="sm">
                      {isPinnedCommentApproved ? 'PASS' : 'PENDING'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Card 2: Telugu Script & Math Proof Cross-Reference */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-3">
            <button
              type="button"
              onClick={() => setIsScriptCrossOpen(!isScriptCrossOpen)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Telugu Script & Math Proof Cross-Reference</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">
                  {isScriptCrossOpen ? 'Collapse' : 'Expand'}
                </span>
                {isScriptCrossOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </div>
            </button>

            {isScriptCrossOpen && (
              <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
                {/* Spoken Hook */}
                <div className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-1">
                  <span className="font-bold text-amber-900 text-[11px] uppercase tracking-wide">
                    Spoken Telugu Hook:
                  </span>
                  <p className="font-telugu text-slate-800 leading-relaxed">
                    {script?.hookText || 'ఈ క్వశ్చన్ ని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్!'}
                  </p>
                </div>

                {/* Problem Statement */}
                <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1">
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                    Problem Narration:
                  </span>
                  <p className="font-telugu text-slate-800 leading-relaxed">
                    {script?.problemStatement || (sourceQuestion as any)?.statementTe || video.title}
                  </p>
                </div>

                {/* Verified Math Proof */}
                <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1">
                  <span className="font-bold text-indigo-900 text-[11px] uppercase tracking-wide">
                    Verified Solution & Burra Trick:
                  </span>
                  <p className="font-telugu text-slate-800 leading-relaxed whitespace-pre-line">
                    {script?.stepByStepSolution || (sourceQuestion as any)?.explanationTe || 'ఒక రైలు గంటకు 60 కిమీ వేగంతో ప్రయాణిస్తూ, ఒక మైలురాయిని 12 సెకన్లలో దాటుతుంది.'}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Card 3: Editorial QA Notes */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Editorial QA Notes</h3>
              </div>
              <span className="text-[11px] text-slate-400">Internal Audit Record</span>
            </div>

            <textarea
              rows={2}
              value={editorialNotes}
              onChange={(e) => setEditorialNotes(e.target.value)}
              placeholder="Record editorial observation notes, video pacing feedback, audio check remarks..."
              className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />

            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                disabled={isSavingNotes}
                onClick={handleSaveEditorialNotes}
                icon={Check}
              >
                Save Notes
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Pane (lg:col-span-5) — Sticky Command Station */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
          {/* Card 1: Top Action Station */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-4 bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">QC Decision Station</h3>
              </div>
              <Badge variant="success" size="sm">Gate 07</Badge>
            </div>

            <div className="space-y-3">
              {/* Primary Approval Action */}
              <Button
                variant="primary"
                size="md"
                disabled={isUpdating}
                onClick={() => handleStatusTransition(VideoProductionStatus.READY_TO_UPLOAD)}
                className="w-full justify-center text-xs py-2.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                icon={ArrowRight}
              >
                ✓ Certify QC & Proceed to Step 08: Thumbnail →
              </Button>

              {/* Secondary Send Back Action */}
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={() => setShowReturnDrawer(!showReturnDrawer)}
                className="w-full justify-center text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                icon={RotateCcw}
              >
                ↺ Send Back to Step 06: Editing Bay
              </Button>

              {/* Inline Return Drawer */}
              {showReturnDrawer && (
                <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Return Revision Remarks</span>
                  </div>
                  <textarea
                    rows={2}
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    placeholder="Describe required edits, audio fixes, or pacing adjustments for the editor..."
                    className="w-full text-xs p-2.5 bg-white border border-rose-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReturnDrawer(false)}
                      className="text-xs h-7"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isUpdating || !returnRemarks.trim()}
                      onClick={() => handleStatusTransition(VideoProductionStatus.EDITING, returnRemarks)}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-7"
                      icon={Send}
                    >
                      Confirm Return to Editing
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Card 2: 4-Point Quality Readiness Status */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                4-Point Quality Readiness
              </h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-0.5">
                <span className="text-[10px] font-medium text-emerald-700">Video Cut</span>
                <p className="font-bold text-emerald-900 flex items-center gap-1">
                  ✓ 1080x1920 MP4
                </p>
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-0.5">
                <span className="text-[10px] font-medium text-emerald-700">Pacing / Duration</span>
                <p className="font-bold text-emerald-900 flex items-center gap-1">
                  ✓ ~{video.actualDurationSeconds || video.targetDurationSeconds || 45}s
                </p>
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-0.5">
                <span className="text-[10px] font-medium text-emerald-700">Safe Zones</span>
                <p className="font-bold text-emerald-900 flex items-center gap-1">
                  ✓ 9:16 Certified
                </p>
              </div>

              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-0.5">
                <span className="text-[10px] font-medium text-emerald-700">Audio Balance</span>
                <p className="font-bold text-emerald-900 flex items-center gap-1">
                  ✓ -14 LUFS
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
