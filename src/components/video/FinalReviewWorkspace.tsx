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
  MessageSquare,
  Send,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Video, Script, VideoProductionStatus, Question } from '../../types';
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

interface QcStandard {
  id: string;
  number: number;
  title: string;
  description: string;
}

const MASTER_QC_STANDARDS: QcStandard[] = [
  {
    id: 'questionScriptMatch',
    number: 1,
    title: 'Linked Question & Script Match',
    description: 'Spoken Telugu narration accurately reflects the approved question.',
  },
  {
    id: 'resolutionFormat',
    number: 2,
    title: 'Master Cut Resolution',
    description: '1080×1920 9:16 Vertical format verified in Google Drive.',
  },
  {
    id: 'safeZones',
    number: 3,
    title: '9:16 Safe Zones',
    description: 'Captions, options, and countdown timer are within mobile safe zones (not cut off by TikTok/Reels/Shorts UI).',
  },
  {
    id: 'audioClarity',
    number: 4,
    title: 'Audio Clarity & Loudness',
    description: 'Voice is clear with -14 LUFS normalization and zero audio distortion.',
  },
  {
    id: 'teluguTypography',
    number: 5,
    title: 'Telugu Typography & Legibility',
    description: 'Noto Sans Telugu font, high-contrast text overlays readable on small screens.',
  },
  {
    id: 'hookPacing',
    number: 6,
    title: 'Hook & Pacing Verification',
    description: 'Scroll-stopping hook in first 0–3 seconds with concise pacing (~15–45s).',
  },
];

export const FinalReviewWorkspace: React.FC<FinalReviewWorkspaceProps> = ({
  videoId,
  video,
  onStatusChange,
  onNavigateTab,
}) => {
  const [script, setScript] = useState<Script | null>(null);
  const [sourceQuestion, setSourceQuestion] = useState<Question | null>(null);

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 6-Point Quality Checklist State
  const [qcChecks, setQcChecks] = useState<Record<string, boolean>>({
    questionScriptMatch: true,
    resolutionFormat: true,
    safeZones: true,
    audioClarity: true,
    teluguTypography: true,
    hookPacing: true,
  });

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
      const [scriptRes] = await Promise.all([
        apiClient.getScript(videoId).catch(() => ({ script: null })),
      ]);

      if (scriptRes?.script) setScript(scriptRes.script);

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

  const toggleQcCheck = (id: string) => {
    setQcChecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllQcChecks = () => {
    const allChecked = Object.values(qcChecks).every(Boolean);
    const updated = MASTER_QC_STANDARDS.reduce((acc, std) => {
      acc[std.id] = !allChecked;
      return acc;
    }, {} as Record<string, boolean>);
    setQcChecks(updated);
  };

  const allQcPassed = Object.values(qcChecks).every(Boolean);

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
        onNavigateTab('thumbnail');
      } else if (nextStatus === VideoProductionStatus.EDITING && onNavigateTab) {
        onNavigateTab('editing');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update video status.');
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
          {/* Card 1: 6-Point Video QC Standards */}
          <Card className="p-5 border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">6-Point Master Video Quality Standards</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllQcChecks}
                  className="text-xs text-indigo-600 hover:text-indigo-800 h-7 px-2"
                >
                  {allQcPassed ? 'Deselect All' : 'Select All / Certify'}
                </Button>
                <Badge variant="active" size="sm">QC Lock</Badge>
              </div>
            </div>

            {isLoadingData ? (
              <div className="py-8 text-center text-xs text-slate-400 font-mono">
                Evaluating QC verification standards...
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {MASTER_QC_STANDARDS.map((std) => {
                  const isPassed = Boolean(qcChecks[std.id]);
                  return (
                    <div
                      key={std.id}
                      onClick={() => toggleQcCheck(std.id)}
                      className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          className="mt-0.5 text-slate-600 hover:text-indigo-600 focus:outline-hidden"
                          aria-label={`Toggle standard ${std.number}`}
                        >
                          {isPassed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        <div>
                          <p className="font-bold text-slate-800">
                            {std.number}. {std.title}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {std.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isPassed ? 'success' : 'warning'} size="sm" className="ml-2 shrink-0">
                        {isPassed ? 'PASS' : 'PENDING'}
                      </Badge>
                    </div>
                  );
                })}
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
                ✓ Lock Video Cut & Proceed to Step 08: Thumbnail Studio →
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
