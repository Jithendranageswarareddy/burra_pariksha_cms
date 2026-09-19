import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Save,
  GitBranch,
  History,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Edit3,
  BookOpen,
  Calculator,
  Clock,
  Maximize2,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Script, ScriptVersion, VideoProductionStatus, Question } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';

export interface ScriptWorkspaceProps {
  videoId: string;
  videoStatus: VideoProductionStatus;
  onStatusChange?: () => void;
  onNavigateTab?: (tab: 'script' | 'recording' | 'editing' | 'final-review' | 'social') => void;
}

export const ScriptWorkspace: React.FC<ScriptWorkspaceProps> = ({
  videoId,
  videoStatus,
  onStatusChange,
  onNavigateTab,
}) => {
  const navigate = useNavigate();
  const [script, setScript] = useState<Script | null>(null);
  const [sourceQuestion, setSourceQuestion] = useState<Question | null>(null);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedTeleprompter, setCopiedTeleprompter] = useState<boolean>(false);
  const [copiedTelugu, setCopiedTelugu] = useState<boolean>(false);
  const [showMathProofDrawer, setShowMathProofDrawer] = useState<boolean>(false);
  const [isJustMarkedReady, setIsJustMarkedReady] = useState<boolean>(false);

  // Form Fields
  const [hookText, setHookText] = useState<string>('');
  const [problemStatement, setProblemStatement] = useState<string>('');
  const [stepByStepSolution, setStepByStepSolution] = useState<string>('');
  const [speedTrickOrTakeaway, setSpeedTrickOrTakeaway] = useState<string>('');
  const [callToAction, setCallToAction] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Versioning state
  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);
  const [changeSummary, setChangeSummary] = useState<string>('');
  const [selectedVersionForDiff, setSelectedVersionForDiff] = useState<ScriptVersion | null>(null);

  const fetchScriptData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getScript(videoId);
      if (res.script) {
        setScript(res.script);
        setHookText(res.script.hookText || '');
        setProblemStatement(res.script.problemStatement || '');
        setStepByStepSolution(res.script.stepByStepSolution || '');
        setSpeedTrickOrTakeaway(res.script.speedTrickOrTakeaway || '');
        setCallToAction(res.script.callToAction || '');
        setNotes(res.script.notes || '');

        // Fetch version history
        const vers = await apiClient.getScriptVersions(res.script.id);
        setVersions(vers);
      } else if (res.draftProposal) {
        // Populate draft proposal
        setHookText(res.draftProposal.hookText || '');
        setProblemStatement(res.draftProposal.problemStatement || '');
        setStepByStepSolution(res.draftProposal.stepByStepSolution || '');
        setSpeedTrickOrTakeaway(res.draftProposal.speedTrickOrTakeaway || '');
        setCallToAction(res.draftProposal.callToAction || '');
        setNotes(res.draftProposal.notes || '');
      }

      // Fetch linked video & question for math proof cross-reference
      try {
        const vid = await apiClient.getVideoById(videoId);
        if (vid?.question) {
          setSourceQuestion(vid.question);
        } else if (vid?.questionId) {
          const q = await apiClient.getQuestionById(vid.questionId);
          setSourceQuestion(q);
        }
      } catch (vErr) {
        console.warn('Could not load source question for math proof:', vErr);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load script data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScriptData();
  }, [videoId]);

  // Teleprompter / Pacing Calculations (Standard fast short-form pacing: ~140 wpm)
  const combinedScriptText = `${hookText}\n\n${problemStatement}\n\n${stepByStepSolution}\n\n${speedTrickOrTakeaway}\n\n${callToAction}`;
  const pureTeluguNarration = [hookText, problemStatement, stepByStepSolution, speedTrickOrTakeaway, callToAction]
    .filter(Boolean)
    .join('\n\n');
  const totalWords = combinedScriptText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const estimatedSeconds = Math.round((totalWords / 140) * 60);

  // Color-coded pacing: Green (<= 45s), Amber (46-55s), Red (> 55s warning)
  const getPacingConfig = (seconds: number) => {
    if (seconds <= 45) {
      return {
        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        textColor: 'text-emerald-700',
        dotColor: 'bg-emerald-500',
        label: 'Optimal (≤45s)',
        status: 'OPTIMAL',
        tip: 'Snappy & high retention for vertical Reels/Shorts',
      };
    }
    if (seconds <= 55) {
      return {
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
        textColor: 'text-amber-700',
        dotColor: 'bg-amber-500',
        label: 'Acceptable (46–55s)',
        status: 'ACCEPTABLE',
        tip: 'Pacing is fine; trim unnecessary words for maximum retention',
      };
    }
    return {
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-300',
      textColor: 'text-rose-700',
      dotColor: 'bg-rose-500',
      label: 'Pacing Warning (>55s)',
      status: 'WARNING',
      tip: 'Over 55s! Risk of viewer drop-off or exceeding 60s hard ceiling',
    };
  };

  const pacing = getPacingConfig(estimatedSeconds);

  const handleSave = async (createNewVersion: boolean) => {
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
        changeSummary: createNewVersion ? changeSummary || 'Script content revision' : undefined,
      };

      const res = await apiClient.saveScript(videoId, payload);
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
      setTimeout(() => setSuccessMessage(null), 4000);
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
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to rollback version');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkReady = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await apiClient.markScriptReady(videoId, 'Script reviewed, timed, and marked ready for production');
      setIsJustMarkedReady(true);
      setSuccessMessage('Script locked & marked READY! Moving to Stage 04: Teleprompter & Filming.');
      if (onStatusChange) onStatusChange();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err?.message || 'Failed to mark script ready');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProceedToRecording = () => {
    if (onNavigateTab) {
      onNavigateTab('recording');
    } else {
      navigate(`/videos/${encodeURIComponent(videoId)}?tab=recording`);
    }
  };

  const handleLaunchFullscreenPrompter = () => {
    if (onNavigateTab) {
      onNavigateTab('recording');
    } else {
      navigate(`/videos/${encodeURIComponent(videoId)}?tab=recording&teleprompter=true`);
    }
  };

  const handleGenerateTeluguAI = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const res = await apiClient.generateTeluguScript(videoId);
      if (res.scriptPayload) {
        setHookText(res.scriptPayload.hookText || '');
        setProblemStatement(res.scriptPayload.problemStatement || '');
        setStepByStepSolution(res.scriptPayload.stepByStepSolution || '');
        setSpeedTrickOrTakeaway(res.scriptPayload.speedTrickOrTakeaway || '');
        setCallToAction(res.scriptPayload.callToAction || '');
        setNotes(res.scriptPayload.notes || '');
        setSuccessMessage('AI Telugu teleprompter narration generated! Review and save to persist.');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate Telugu script');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReturnToEditing = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await apiClient.returnScriptToEditing(videoId, 'Script returned for revision');
      setIsJustMarkedReady(false);
      setSuccessMessage('Script returned to SCRIPT_REQUIRED for revision.');
      if (onStatusChange) onStatusChange();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to return script');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyTeleprompter = () => {
    const formatted = `=== BURRA PARIKSHA AUDIENCE TELEPROMPTER SCRIPT ===
Target Duration: ~${estimatedSeconds}s (${totalWords} words @ 140 wpm)

[1. HOOK & ATTENTION GRABBER (0–5s)]
${hookText}

[2. QUESTION & PROBLEM STATEMENT (5–15s)]
${problemStatement}

[3. SPOKEN SOLUTION & INTUITION (15–35s) • Conversational Explanation]
${stepByStepSolution}

[4. BURRA SPEED SHORTCUT / TAKEAWAY (35–45s) • High-Retention Exam Trick]
${speedTrickOrTakeaway}

[5. CALL TO ACTION (45–50s)]
${callToAction}
${notes ? `\n[PRODUCTION / PROMPTER NOTES]\n${notes}\n` : ''}`;
    navigator.clipboard.writeText(formatted);
    setCopiedTeleprompter(true);
    setTimeout(() => setCopiedTeleprompter(false), 2000);
  };

  const handleCopyTeluguScript = () => {
    navigator.clipboard.writeText(pureTeluguNarration);
    setCopiedTelugu(true);
    setTimeout(() => setCopiedTelugu(false), 2000);
  };

  const getOptionText = (q: Question | null, key: 'a' | 'b' | 'c' | 'd') => {
    if (!q) return '';
    if (Array.isArray(q.options)) {
      const found = q.options.find(
        (o: any) => o.id?.toLowerCase() === key || o.key?.toLowerCase() === key
      );
      return found ? (found.textTe || found.text || found.label || '') : '';
    }
    if (q.options && typeof q.options === 'object') {
      return (q.options as any)[key] || (q.options as any)[key.toUpperCase()] || '';
    }
    const keyUpper = key.toUpperCase() as 'A' | 'B' | 'C' | 'D';
    return (q as any)[`option${keyUpper}`] || '';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
        <p className="text-xs">Loading script workspace & version history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 font-bold">×</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {/* Celebratory Ready State & Bridge to Filming */}
      {(videoStatus === VideoProductionStatus.SCRIPT_READY || isJustMarkedReady) && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  ✓ AUDIENCE SCRIPT READY & LOCKED
                </span>
                <span className="text-xs text-emerald-800 font-semibold font-mono">Stage 03 Complete</span>
              </div>
              <p className="text-xs text-emerald-950 mt-1 font-medium leading-relaxed max-w-xl">
                Spoken Telugu teleprompter narration is reviewed, paced at ~{estimatedSeconds}s, and verified against the reviewer math proof. Ready for Stage 04 Teleprompter & Host Filming.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={handleProceedToRecording}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 flex items-center gap-2 shadow-xs"
            >
              <span>Open Teleprompter & Filming</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLaunchFullscreenPrompter}
              className="text-xs bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1.5"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Launch Fullscreen Teleprompter</span>
            </Button>
          </div>
        </div>
      )}

      {/* Reviewer Math Proof & Reference Drawer */}
      {showMathProofDrawer && (
        <div className="bg-slate-900 text-slate-100 rounded-xl border border-slate-700 p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Reviewer Mathematical Proof & Reference</h3>
                  {sourceQuestion?.id && (
                    <span className="text-[11px] font-mono bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                      ID: {sourceQuestion.id}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Authoritative mathematical truth, options, and step-by-step proof for script cross-checking
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const q = sourceQuestion as any;
                  const statementText = q?.statementTe || q?.statement || q?.questionText || 'N/A';
                  const proofVal = q?.explanationTe || q?.explanation || 'N/A';
                  const ans = q?.correctAnswer || q?.correctOption || 'N/A';
                  const proofText = `SOURCE QUESTION:\n${statementText}\n\nOPTIONS:\nA: ${getOptionText(sourceQuestion, 'a')}\nB: ${getOptionText(sourceQuestion, 'b')}\nC: ${getOptionText(sourceQuestion, 'c')}\nD: ${getOptionText(sourceQuestion, 'd')}\n\nCORRECT ANSWER: Option ${String(ans).toUpperCase()}\n\nPROOF:\n${proofVal}`;
                  navigator.clipboard.writeText(proofText);
                }}
                className="text-[11px] bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Proof</span>
              </Button>
              <button
                onClick={() => setShowMathProofDrawer(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Reference"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {sourceQuestion ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3 bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
                <div>
                  <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
                    Question Statement (Telugu / English)
                  </span>
                  <p className="text-slate-200 leading-relaxed font-sans text-xs">
                    {(sourceQuestion as any).statementTe || (sourceQuestion as any).statement || sourceQuestion.questionText}
                  </p>
                  {(sourceQuestion as any).statementTe && (sourceQuestion as any).statement && (
                    <p className="text-slate-400 text-[11px] mt-2 italic border-t border-slate-700/50 pt-1.5 font-sans">
                      EN: {(sourceQuestion as any).statement}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Options & Correct Answer
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(['a', 'b', 'c', 'd'] as const).map((optKey) => {
                      const correctChoice = (sourceQuestion.correctAnswer || (sourceQuestion as any).correctOption || '').toLowerCase();
                      const isCorrect = correctChoice === optKey;
                      const text = getOptionText(sourceQuestion, optKey);
                      return (
                        <div
                          key={optKey}
                          className={`p-2 rounded border text-xs flex items-start gap-1.5 ${
                            isCorrect
                              ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-bold shadow-xs'
                              : 'bg-slate-900/70 border-slate-700 text-slate-300'
                          }`}
                        >
                          <span className="uppercase text-[10px] px-1 py-0.5 rounded bg-black/40 text-slate-400 font-mono">
                            {optKey}
                          </span>
                          <span className="font-sans break-words flex-1">{text || `Option ${optKey.toUpperCase()}`}</span>
                          {isCorrect && (
                            <span className="text-[10px] bg-emerald-500 text-black px-1.5 py-0.2 rounded font-bold shrink-0">
                              ✓ CORRECT
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/60">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                      Authoritative Math Proof / Explanation
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/50">
                      Answer: Option {String(sourceQuestion.correctAnswer || (sourceQuestion as any).correctOption || 'Verified').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-black/50 p-3 rounded border border-slate-800 max-h-56 overflow-y-auto">
                    {(sourceQuestion as any).explanationTe || sourceQuestion.explanation || 'No proof text available on record.'}
                  </div>
                </div>

                {(sourceQuestion.topicName || sourceQuestion.topicId || (sourceQuestion as any).topic) && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-medium text-slate-300">Topic:</span> {sourceQuestion.topicName || (sourceQuestion as any).topic || sourceQuestion.topicId}
                    {(sourceQuestion.subtopicName || (sourceQuestion as any).subtopic || sourceQuestion.subtopicId) && (
                      <span>• {sourceQuestion.subtopicName || (sourceQuestion as any).subtopic || sourceQuestion.subtopicId}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-800/40 rounded-lg text-center text-xs text-slate-400">
              Source question mathematical reference loading...
            </div>
          )}
        </div>
      )}

      {/* Script Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Audience Engagement Script Engine</h2>
              {script ? (
                <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                  v{script.currentVersion}
                </span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                  Draft Proposal
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Stage 03 • Spoken Telugu Teleprompter Narration vs. Mathematical Proof
            </p>
          </div>
        </div>

        {/* Real-time Pacing Gauge & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Real-Time Pacing Gauge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="font-medium text-slate-600">
              Words: <strong className="text-slate-900 font-mono">{totalWords}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-bold ${pacing.badgeBg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pacing.dotColor}`} />
              <span>~{estimatedSeconds}s</span>
              <span className="font-medium hidden sm:inline">• {pacing.label}</span>
            </div>
          </div>

          {/* Reviewer Math Proof Reference Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMathProofDrawer(!showMathProofDrawer)}
            className={`text-xs flex items-center gap-1.5 border ${
              showMathProofDrawer
                ? 'bg-slate-900 text-white border-slate-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Reviewer Math Proof</span>
            {showMathProofDrawer ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </Button>

          {/* Copy Teleprompter Formatted */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTeleprompter}
            className="text-xs flex items-center gap-1.5"
            title="Copy formatted with timing milestones and section cues"
          >
            {copiedTeleprompter ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedTeleprompter ? 'Copied Prompter!' : 'Copy Formatted'}</span>
          </Button>

          {/* Copy Pure Telugu Narration */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTeluguScript}
            className="text-xs flex items-center gap-1.5"
            title="Copy pure Telugu speech text without metadata"
          >
            {copiedTelugu ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedTelugu ? 'Copied Telugu!' : 'Copy Telugu Script'}</span>
          </Button>

          {/* AI Telugu Generator */}
          <Button
            variant="outline"
            size="sm"
            disabled={isGenerating || isSaving}
            onClick={handleGenerateTeluguAI}
            className="text-xs text-indigo-700 border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 flex items-center gap-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-indigo-600' : 'text-indigo-600'}`} />
            <span>{isGenerating ? 'Generating...' : 'Generate Telugu (AI)'}</span>
          </Button>

          {/* Stage Progression Buttons */}
          {videoStatus === VideoProductionStatus.SCRIPT_REQUIRED && (
            <Button
              variant="primary"
              size="sm"
              disabled={isSaving}
              onClick={handleMarkReady}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 font-bold shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Script Ready</span>
            </Button>
          )}

          {(videoStatus === VideoProductionStatus.SCRIPT_READY || isJustMarkedReady) && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="primary"
                size="sm"
                onClick={handleProceedToRecording}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 font-bold shadow-xs"
              >
                <span>Open Filming →</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={handleReturnToEditing}
                className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revise</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Editor */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            {/* Part 1: Hook */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px]">1</span>
                  1. Hook & Attention Grabber (0–5s) • High-Retention Opener
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {hookText.length} chars
                </span>
              </div>
              <textarea
                value={hookText}
                onChange={(e) => setHookText(e.target.value)}
                rows={2}
                placeholder="e.g., 90% of students make this mistake in Time & Work! Can you solve it in 20 seconds?"
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Part 2: Problem Statement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px]">2</span>
                  2. Question & Problem Statement (5–15s) • Clear Spoken Delivery
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {problemStatement.length} chars
                </span>
              </div>
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                rows={3}
                placeholder="The exact exam question clearly stated in spoken Telugu with 4 options..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>

            {/* Part 3: Spoken Solution & Intuition */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px]">3</span>
                  3. Spoken Solution & Intuition (15–35s) • Conversational Explanation
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {stepByStepSolution.length} chars
                </span>
              </div>
              <div className="p-2 mb-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 leading-relaxed">
                💡 <strong>Conversational Narration Guidance:</strong> Equations should be spoken naturally with intuitive logic (like explaining to a student in person). Do <em>not</em> recite mechanical textbook formulas!
              </div>
              <textarea
                value={stepByStepSolution}
                onChange={(e) => setStepByStepSolution(e.target.value)}
                rows={4}
                placeholder="Spoken Telugu explanation of the intuitive steps..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>

            {/* Part 4: Speed Trick or Takeaway */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[11px]">4</span>
                  4. Burra Speed Shortcut / Takeaway (35–45s) • High-Retention Exam Trick
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {speedTrickOrTakeaway.length} chars
                </span>
              </div>
              <div className="p-2 mb-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 leading-relaxed">
                ⚡ <strong>High-Retention Exam Trick:</strong> Deliver the core mental math shortcut, unit-digit elimination rule, or ratio trick that saves 40+ seconds on the actual exam.
              </div>
              <textarea
                value={speedTrickOrTakeaway}
                onChange={(e) => setSpeedTrickOrTakeaway(e.target.value)}
                rows={2}
                placeholder="Pro-Tip: In the actual exam, check the units digit to eliminate Options B and D instantly!"
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 font-sans bg-amber-50/20"
              />
            </div>

            {/* Part 5: Call to Action */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[11px]">5</span>
                  5. Call to Action (CTA) (45–50s) • Outro & Follow Hook
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {callToAction.length} chars
                </span>
              </div>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="Save this reel & follow @BurraPariksha for daily shortcuts!"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Internal Notes */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Internal Production Notes (Prompter cues, graphic overlays, audio stingers)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Flash red buzzer on Option B, pop celebratory bell on Option C"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg text-slate-600 bg-slate-50"
              />
            </div>

            {/* Save Buttons Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                {script ? `Last synced with Google Sheets: ${new Date(script.updatedAt).toLocaleTimeString()}` : 'Unsaved Draft'}
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => handleSave(false)}
                  className="text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft In-Place</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => setShowVersionModal(true)}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Save as New Version</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Version History & Comparison */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Version History</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">SCRIPT_VERSIONS</span>
            </div>

            {versions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs bg-slate-50 rounded-lg">
                No versions committed yet. Click "Save as New Version" to snapshot your first revision.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {versions.map((ver) => {
                  const isCurrent = script?.currentVersion === ver.versionNumber;
                  const isSelected = selectedVersionForDiff?.id === ver.id;

                  return (
                    <div
                      key={ver.id}
                      className={`p-3 rounded-lg border text-xs transition-all ${
                        isCurrent
                          ? 'bg-indigo-50/70 border-indigo-300'
                          : isSelected
                          ? 'bg-slate-100 border-slate-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">Version {ver.versionNumber}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-semibold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ver.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-slate-600 text-[11px] line-clamp-2 mb-2">
                        {ver.changeSummary || 'Version commit snapshot'}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                        <span className="text-[10px] text-slate-400 font-mono">By: {ver.editedBy}</span>

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
          </div>

          {/* Selected Version Snapshot Inspector */}
          {selectedVersionForDiff && (
            <div className="bg-slate-900 text-white rounded-xl p-4 text-xs space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold">Snapshot: v{selectedVersionForDiff.versionNumber}</span>
                </div>
                <button
                  onClick={() => setSelectedVersionForDiff(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {(() => {
                const parsed =
                  selectedVersionForDiff.contentJson ||
                  (selectedVersionForDiff.content ? JSON.parse(selectedVersionForDiff.content) : {});
                return (
                  <div className="space-y-2 text-[11px] text-slate-300 max-h-60 overflow-y-auto">
                    <div>
                      <strong className="text-indigo-300 block">Hook:</strong>
                      <p>{parsed.hookText || 'N/A'}</p>
                    </div>
                    <div>
                      <strong className="text-indigo-300 block">Problem:</strong>
                      <p>{parsed.problemStatement || 'N/A'}</p>
                    </div>
                    <div>
                      <strong className="text-indigo-300 block">Solution:</strong>
                      <p>{parsed.stepByStepSolution || 'N/A'}</p>
                    </div>
                    <div>
                      <strong className="text-indigo-300 block">Trick:</strong>
                      <p>{parsed.speedTrickOrTakeaway || 'N/A'}</p>
                    </div>
                  </div>
                );
              })()}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRevert(selectedVersionForDiff.versionNumber)}
                className="w-full text-xs border-indigo-400 text-indigo-200 hover:bg-slate-800"
              >
                Restore this version to editor
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Save as New Version Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Save as New Version</h3>
              </div>
              <button onClick={() => setShowVersionModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              This will increment the script to <strong>Version {(script?.currentVersion || 1) + 1}</strong> and write an immutable snapshot into the <code>SCRIPT_VERSIONS</code> worksheet.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Change Summary / Revision Remarks
              </label>
              <textarea
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="e.g. Shortened hook to 4 seconds, added visual cue for formula trick..."
                rows={3}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
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
                className="text-xs bg-indigo-600 text-white"
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
