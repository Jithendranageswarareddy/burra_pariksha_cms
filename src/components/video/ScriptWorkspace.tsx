import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  GraduationCap,
  Pin,
  ToggleLeft,
  ToggleRight,
  Wand2,
} from 'lucide-react';
import { Script, ScriptVersion, VideoProductionStatus, Question } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../design-system/components/Button';
import { Badge } from '../../design-system/components/Badge';
import { Card } from '../../design-system/components/Card';
import { Alert } from '../../design-system/components/Alert';

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

  // Core Data
  const [script, setScript] = useState<Script | null>(null);
  const [sourceQuestion, setSourceQuestion] = useState<Question | null>(null);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Format Switcher State
  const [scriptFormat, setScriptFormat] = useState<'VIRAL_CHALLENGE' | 'SOLUTION_BREAKDOWN'>('VIRAL_CHALLENGE');

  // Format 1: Viral Challenge Fields
  const [viralHook, setViralHook] = useState<string>('');
  const [viralQuestion, setViralQuestion] = useState<string>('');
  const [viralOptions, setViralOptions] = useState<string>('');
  const [includeOptionsInVideo, setIncludeOptionsInVideo] = useState<boolean>(true);
  const [viralCta, setViralCta] = useState<string>('');
  const [pinnedCommentText, setPinnedCommentText] = useState<string>('');
  const [pinnedCopied, setPinnedCopied] = useState<boolean>(false);

  // Format 2: Full Solution Breakdown Fields
  const [hookText, setHookText] = useState<string>('');
  const [problemStatement, setProblemStatement] = useState<string>('');
  const [stepByStepSolution, setStepByStepSolution] = useState<string>('');
  const [speedTrickOrTakeaway, setSpeedTrickOrTakeaway] = useState<string>('');
  const [callToAction, setCallToAction] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // AI Prompter & Guidance Controls
  const [showAiPrompter, setShowAiPrompter] = useState<boolean>(false);
  const [tone, setTone] = useState<'ENERGETIC_EXAM_COACH' | 'CLEAR_CONCEPTUAL' | 'EXAM_TRICK_FOCUSED'>('ENERGETIC_EXAM_COACH');
  const [targetDurationSeconds, setTargetDurationSeconds] = useState<number>(20);
  const [customGuidance, setCustomGuidance] = useState<string>('');

  // Versioning state
  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);
  const [changeSummary, setChangeSummary] = useState<string>('');
  const [selectedVersionForDiff, setSelectedVersionForDiff] = useState<ScriptVersion | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showMathProofDrawer, setShowMathProofDrawer] = useState<boolean>(false);

  const customPromptInputRef = useRef<HTMLInputElement>(null);

  const autoResizeTextarea = (element: HTMLTextAreaElement | null) => {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const generateOptionsTextFromQuestion = (q: any): string => {
    if (!q) return '';
    const opts = q.options || q.optionsTe;
    if (opts && typeof opts === 'object') {
      const a = opts.a || opts.A || '';
      const b = opts.b || opts.B || '';
      const c = opts.c || opts.C || '';
      const d = opts.d || opts.D || '';
      return `Option A: ${a}\nOption B: ${b}\nOption C: ${c}\nOption D: ${d}`;
    }
    return 'Option A: ...\nOption B: ...\nOption C: ...\nOption D: ...';
  };

  const generatePinnedCommentFromQuestion = (q: any): string => {
    if (!q) return '📌 Correct Answer & Explanation:\nCheck back for official solution!';
    const correctOpt = String(q.correctAnswer || q.correctOption || 'A').toUpperCase();
    const explanation = q.explanationTe || q.explanation || '';
    const proTip = q.shortcutTe || q.speedTrick || 'Check units digit for rapid zero-elimination!';

    return `📌 [ Official Answer & Burra Trick ]\n✅ Correct Option: ${correctOpt}\n\n💡 Solution:\n${explanation}\n\n⚡ Burra Speed Shortcut:\n${proTip}`;
  };

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
          setViralQuestion((vid.question as any).statementTe || vid.question.questionText || '');
          setViralOptions(generateOptionsTextFromQuestion(vid.question));
          setPinnedCommentText(generatePinnedCommentFromQuestion(vid.question));

          // Set initial viral defaults
          setViralHook('ఈ క్వశ్చన్ ని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్!');
          setViralCta('మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది.');
        } else if (vid?.questionId) {
          const q = await apiClient.getQuestionById(vid.questionId);
          if (q) {
            setSourceQuestion(q);
            setViralQuestion((q as any).statementTe || q.questionText || '');
            setViralOptions(generateOptionsTextFromQuestion(q));
            setPinnedCommentText(generatePinnedCommentFromQuestion(q));
            setViralHook('ఈ క్వశ్చన్ ని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్!');
            setViralCta('మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది.');
          }
        }
      } catch (err) {
        console.warn('Non-fatal: could not load source question for script:', err);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load script workspace data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoId) {
      fetchScriptData();
    }
  }, [videoId]);

  const handleFormatChange = (fmt: 'VIRAL_CHALLENGE' | 'SOLUTION_BREAKDOWN') => {
    setScriptFormat(fmt);
    if (fmt === 'VIRAL_CHALLENGE') {
      setTargetDurationSeconds(20);
    } else {
      setTargetDurationSeconds(45);
    }
  };

  const handleSelectPreset = (presetText: string) => {
    setCustomGuidance(presetText);
    if (customPromptInputRef.current) {
      customPromptInputRef.current.focus();
    }
  };

  const handleGenerateScriptWithAi = async () => {
    try {
      setIsGeneratingAi(true);
      setError(null);
      const res = await apiClient.generateTeluguScript(videoId);
      if (res) {
        const generated = res.script || res;
        if (scriptFormat === 'VIRAL_CHALLENGE') {
          setViralHook(generated.hookText || 'ఈ క్వశ్చన్ ని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్!');
          setViralQuestion(generated.problemStatement || (sourceQuestion as any)?.statementTe || sourceQuestion?.questionText || '');
          setViralCta(generated.callToAction || 'మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి!');
        } else {
          setHookText(generated.hookText || '');
          setProblemStatement(generated.problemStatement || '');
          setStepByStepSolution(generated.stepByStepSolution || '');
          setSpeedTrickOrTakeaway(generated.speedTrickOrTakeaway || '');
          setCallToAction(generated.callToAction || '');
          setNotes(generated.notes || '');
        }
        setSuccessMessage('AI script auto-drafted successfully!');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate AI script draft');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const payload = {
        scriptFormat,
        hookText: scriptFormat === 'VIRAL_CHALLENGE' ? viralHook : hookText,
        problemStatement: scriptFormat === 'VIRAL_CHALLENGE' ? viralQuestion : problemStatement,
        stepByStepSolution: scriptFormat === 'VIRAL_CHALLENGE' ? (includeOptionsInVideo ? viralOptions : '[Options Skipped]') : stepByStepSolution,
        speedTrickOrTakeaway: scriptFormat === 'VIRAL_CHALLENGE' ? pinnedCommentText : speedTrickOrTakeaway,
        callToAction: scriptFormat === 'VIRAL_CHALLENGE' ? viralCta : callToAction,
        notes,
      };

      const res = await apiClient.saveScript(videoId, payload);
      if (res.script) {
        setScript(res.script);
      }
      setSuccessMessage('Script draft saved successfully!');
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Failed to save script draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndProceed = async () => {
    try {
      await handleSaveDraft();
      // Auto-advance script ready if needed or proceed directly
      if (videoStatus === VideoProductionStatus.SCRIPT_REQUIRED || videoStatus === VideoProductionStatus.QUEUED) {
        try {
          await apiClient.markScriptReady(videoId, 'Script finalized via Audience Engagement Script Engine');
        } catch (e) {
          console.warn('Status transition notice:', e);
        }
      }

      if (onNavigateTab) {
        onNavigateTab('recording');
      } else {
        navigate(`/videos/${encodeURIComponent(videoId)}?tab=recording`);
      }
    } catch (err: any) {
      setError(err?.message || 'Error proceeding to Teleprompter stage');
    }
  };

  const handleCopyAll = () => {
    const fullText = scriptFormat === 'VIRAL_CHALLENGE'
      ? `⚡ [VIRAL CHALLENGE SCRIPT]\n1. HOOK: ${viralHook}\n2. QUESTION: ${viralQuestion}\n3. OPTIONS: ${includeOptionsInVideo ? viralOptions : '[Skipped]'}\n4. CTA: ${viralCta}\n\n📌 PINNED COMMENT:\n${pinnedCommentText}`
      : `🎓 [FULL SOLUTION SCRIPT]\n1. HOOK: ${hookText}\n2. PROBLEM: ${problemStatement}\n3. SOLUTION: ${stepByStepSolution}\n4. TRICK: ${speedTrickOrTakeaway}\n5. CTA: ${callToAction}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPinnedComment = () => {
    navigator.clipboard.writeText(pinnedCommentText);
    setPinnedCopied(true);
    setTimeout(() => setPinnedCopied(false), 2000);
  };

  // Word count & duration calculation
  const getFullTextToCount = () => {
    if (scriptFormat === 'VIRAL_CHALLENGE') {
      return `${viralHook} ${viralQuestion} ${includeOptionsInVideo ? viralOptions : ''} ${viralCta}`;
    }
    return `${hookText} ${problemStatement} ${stepByStepSolution} ${speedTrickOrTakeaway} ${callToAction}`;
  };

  const totalWords = getFullTextToCount().trim() ? getFullTextToCount().trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.round(totalWords / 2.5); // ~150 WPM = 2.5 words per sec

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* 1. COMPACT 36PX SEGMENTED FORMAT SWITCHER */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => handleFormatChange('VIRAL_CHALLENGE')}
            className={`h-8 px-3 text-xs flex items-center gap-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              scriptFormat === 'VIRAL_CHALLENGE'
                ? 'bg-white shadow-xs text-indigo-700 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>⚡ Viral Challenge (15–25s) [Default]</span>
          </button>
          <button
            type="button"
            onClick={() => handleFormatChange('SOLUTION_BREAKDOWN')}
            className={`h-8 px-3 text-xs flex items-center gap-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              scriptFormat === 'SOLUTION_BREAKDOWN'
                ? 'bg-white shadow-xs text-indigo-700 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>🎓 Full Solution (45–60s)</span>
          </button>
        </div>

        {/* Quick Version History Modal Button */}
        {versions.length > 0 && (
          <button
            type="button"
            onClick={() => setShowVersionModal(true)}
            className="text-xs text-slate-600 hover:text-indigo-600 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-white shadow-2xs"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Version History ({versions.length})</span>
          </button>
        )}
      </div>

      {error && (
        <Alert variant="error" title="Script Engine Notice" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" title="Success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {isLoading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <Sparkles className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-600 font-medium">Loading Audience Engagement Script Engine...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ========================================================
              LEFT PANE (lg:col-span-7): COMPACT SCRIPT EDITOR + INLINE AI TOOLBAR
              ======================================================== */}
          <div className="lg:col-span-7 space-y-3">
            <Card variant="default" padding="md" className="rounded-2xl border-slate-200/80 shadow-xs space-y-3">
              {/* INLINE AI GENERATOR TOOLBAR + HEADER ACTIONS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      scriptFormat === 'VIRAL_CHALLENGE'
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {scriptFormat === 'VIRAL_CHALLENGE'
                        ? 'Viral Challenge Draft (4-Part)'
                        : '5-Part Deep Dive Draft'}
                    </h3>
                  </div>
                </div>

                {/* Inline AI Controls & Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAiPrompter(!showAiPrompter)}
                    className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                      showAiPrompter || customGuidance
                        ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Wand2 className="w-3 h-3 text-amber-600" />
                    <span>Prompter &amp; Presets</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showAiPrompter ? 'rotate-180' : ''}`} />
                  </button>

                  <select
                    value={tone}
                    onChange={(e: any) => setTone(e.target.value)}
                    className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden"
                  >
                    <option value="ENERGETIC_EXAM_COACH">Energetic</option>
                    <option value="CLEAR_CONCEPTUAL">Conceptual</option>
                    <option value="EXAM_TRICK_FOCUSED">Shortcut</option>
                  </select>

                  <select
                    value={targetDurationSeconds}
                    onChange={(e) => setTargetDurationSeconds(Number(e.target.value))}
                    className="text-[11px] px-2 py-1 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden font-mono"
                  >
                    {scriptFormat === 'VIRAL_CHALLENGE' ? (
                      <>
                        <option value={15}>15s</option>
                        <option value={20}>20s</option>
                        <option value={25}>25s</option>
                      </>
                    ) : (
                      <>
                        <option value={30}>30s</option>
                        <option value={45}>45s</option>
                        <option value={60}>60s</option>
                      </>
                    )}
                  </select>

                  <button
                    type="button"
                    disabled={isGeneratingAi}
                    onClick={handleGenerateScriptWithAi}
                    className={`py-1.5 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer ${
                      isGeneratingAi ? 'opacity-70' : ''
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isGeneratingAi ? 'Drafting...' : '✦ Auto-Draft'}</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAll}
                    icon={copied ? Check : Copy}
                    className="text-[11px] py-1 px-2 h-7"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSaving}
                    onClick={handleSaveDraft}
                    icon={Save}
                    className="text-[11px] py-1 px-2.5 h-7 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>

              {/* COLLAPSIBLE AI PROMPTER & PRESETS RIBBON */}
              {showAiPrompter && (
                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 mb-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      AI Guidance Presets ({scriptFormat === 'VIRAL_CHALLENGE' ? 'Curiosity Challenge' : 'Full Solution'})
                    </span>
                    {customGuidance && (
                      <button
                        type="button"
                        onClick={() => setCustomGuidance('')}
                        className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                      >
                        Clear guidance
                      </button>
                    )}
                  </div>

                  {/* Quick-Click Recommendation Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {scriptFormat === 'VIRAL_CHALLENGE' ? (
                      <>
                        {[
                          { label: '🔥 99% Fail Challenge', text: 'Make the hook a 99% fail challenge to provoke viewers to prove themselves.' },
                          { label: '⏱️ 5-Sec Speed Test', text: 'Challenge viewers to solve mentally in 5 seconds without pen and paper.' },
                          { label: '🧠 Genius IQ Test', text: 'Pose this as a genius-level brain test.' },
                          { label: '🛍️ Real-Life Scenario', text: 'Connect to a relatable everyday Telugu shopping/commute dilemma.' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleSelectPreset(preset.text)}
                            className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-medium ${
                              customGuidance === preset.text
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {[
                          { label: '⚡ Burra Speed Trick Focus', text: 'Emphasize the rapid zero-elimination mental shortcut on camera.' },
                          { label: '📚 Beginner Friendly', text: 'Explain step-by-step from first principles.' },
                          { label: '🎯 Distractor Trap Warning', text: 'Explain why Option A is a trap distractor.' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleSelectPreset(preset.text)}
                            className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-medium ${
                              customGuidance === preset.text
                                ? 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Custom Prompt Input */}
                  <div className="pt-0.5 flex items-center gap-2">
                    <input
                      ref={customPromptInputRef}
                      type="text"
                      value={customGuidance}
                      onChange={(e) => setCustomGuidance(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateScriptWithAi()}
                      placeholder="Custom AI prompt: e.g. Make it energetic and challenge students preparing for APPSC..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      disabled={isGeneratingAi}
                      onClick={handleGenerateScriptWithAi}
                      className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isGeneratingAi ? 'Drafting...' : '✦ Generate Script'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SCRIPT EDITOR FIELDS */}
              {scriptFormat === 'VIRAL_CHALLENGE' ? (
                /* MODE 1: VIRAL CHALLENGE (4 PARTS) */
                <div className="space-y-2.5">
                  {/* Part 1: Scroll-Stopping Hook */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          1
                        </span>
                        1. Scroll-Stopping Hook (0–3s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~8–12 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={viralHook}
                      onChange={(e) => setViralHook(e.target.value)}
                      placeholder="e.g. ఈ లెక్కని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్!"
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-hidden resize-none overflow-hidden min-h-[56px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Part 2: Question Narration */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          2
                        </span>
                        2. Question Narration (3–10s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~15–25 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={viralQuestion}
                      onChange={(e) => setViralQuestion(e.target.value)}
                      placeholder="Clear Telugu problem statement to be read aloud..."
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-hidden resize-none overflow-hidden min-h-[56px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Part 3: Options Delivery with Inline Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          3
                        </span>
                        3. Options Delivery (10–16s)
                      </label>

                      {/* Inline Toggle */}
                      <button
                        type="button"
                        onClick={() => setIncludeOptionsInVideo(!includeOptionsInVideo)}
                        className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer border ${
                          includeOptionsInVideo
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {includeOptionsInVideo ? (
                          <>
                            <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                            <span>✓ Include Options</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
                            <span>Skip Options</span>
                          </>
                        )}
                      </button>
                    </div>

                    {includeOptionsInVideo ? (
                      <textarea
                        ref={autoResizeTextarea}
                        onInput={(e) => autoResizeTextarea(e.currentTarget)}
                        value={viralOptions}
                        onChange={(e) => setViralOptions(e.target.value)}
                        placeholder="Option A: ...&#10;Option B: ...&#10;Option C: ...&#10;Option D: ..."
                        className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-hidden resize-none overflow-hidden min-h-[56px] transition-[height] duration-100"
                      />
                    ) : (
                      <div className="p-2 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>⚡ <strong>Options Skipped</strong> (Direct mental math challenge)</span>
                      </div>
                    )}
                  </div>

                  {/* Part 4: Comment Challenge & Outro */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          4
                        </span>
                        4. Comment Challenge &amp; Outro (16–22s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~10–15 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={viralCta}
                      onChange={(e) => setViralCta(e.target.value)}
                      placeholder="మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది."
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-amber-500 focus:outline-hidden resize-none overflow-hidden min-h-[56px] transition-[height] duration-100"
                    />
                  </div>
                </div>
              ) : (
                /* MODE 2: FULL SOLUTION BREAKDOWN (5 PARTS) */
                <div className="space-y-2.5">
                  {/* Part 1: Hook */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono font-bold">
                          1
                        </span>
                        1. Hook (0–5s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~10-15 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={hookText}
                      onChange={(e) => setHookText(e.target.value)}
                      placeholder="e.g. ఈ క్వశ్చన్ ని 10 సెకన్లలో సాల్వ్ చేయగలరా?"
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden resize-none overflow-hidden min-h-[56px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Part 2: Problem Statement */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono font-bold">
                          2
                        </span>
                        2. Problem Statement (5–15s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~25-35 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={problemStatement}
                      onChange={(e) => setProblemStatement(e.target.value)}
                      placeholder="Telugu problem statement narration..."
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden resize-none overflow-hidden min-h-[56px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Part 3: Spoken Solution & Intuition */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono font-bold">
                          3
                        </span>
                        3. Spoken Solution &amp; Intuition (15–35s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~45-60 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={stepByStepSolution}
                      onChange={(e) => setStepByStepSolution(e.target.value)}
                      placeholder="Spoken Telugu explanation of the intuitive steps..."
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden resize-none overflow-hidden min-h-[56px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Part 4: Burra Speed Shortcut */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          4
                        </span>
                        4. Burra Speed Shortcut (35–45s)
                      </label>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Exam Shortcut
                      </span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={speedTrickOrTakeaway}
                      onChange={(e) => setSpeedTrickOrTakeaway(e.target.value)}
                      placeholder="Pro-Tip: Check the units digit to eliminate Options B and D instantly!"
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-amber-200 bg-amber-50/30 focus:bg-white focus:border-indigo-500 focus:outline-hidden resize-none overflow-hidden min-h-[56px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Part 5: Call to Action */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          5
                        </span>
                        5. Call to Action (45–50s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~10 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      placeholder="e.g. మరిన్ని షార్ట్‌కట్స్ కోసం ఇప్పుడే Burra Pariksha ఛానెల్ ని Follow చేయండి!"
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:outline-hidden resize-none overflow-hidden min-h-[56px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Notes */}
                  <div className="pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Production Cues & Teleprompter Notes..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* ========================================================
              RIGHT PANE (lg:col-span-5): STICKY COMMAND STATION + PINNED COMMENT
              ======================================================== */}
          <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-3">
            {/* CARD 1 (TOP): UNIFIED TELEPROMPTER & PACING COMMAND STATION */}
            <Card variant="elevated" padding="md" className="rounded-2xl border-indigo-100 shadow-xs bg-white space-y-2.5">
              <Button
                variant="primary"
                size="md"
                onClick={handleSaveAndProceed}
                disabled={isSaving}
                icon={ArrowRight}
                className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 text-sm rounded-xl shadow-xs"
              >
                {isSaving ? 'Saving Draft...' : 'Save & Proceed to Step 04: Teleprompter →'}
              </Button>

              {/* INLINE PACING METER */}
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Words: <strong className="text-slate-900 font-mono">{totalWords}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>Duration: <strong className={`font-mono font-bold ${estimatedSeconds <= (scriptFormat === 'VIRAL_CHALLENGE' ? 25 : 50) ? 'text-emerald-600' : 'text-amber-600'}`}>~{estimatedSeconds}s</strong></span>
                </div>
                <Badge
                  variant={estimatedSeconds <= (scriptFormat === 'VIRAL_CHALLENGE' ? 25 : 50) ? 'approved' : 'draft'}
                  size="sm"
                  className="text-[10px] py-0.5 px-2 font-bold shrink-0"
                >
                  {scriptFormat === 'VIRAL_CHALLENGE'
                    ? (estimatedSeconds <= 25 ? 'Viral Sweet Spot (15–25s)' : 'Too Long')
                    : (estimatedSeconds <= 50 ? 'Optimal Pace (45s)' : 'Exceeds 50s')}
                </Badge>
              </div>
            </Card>

            {/* CARD 2: "📌 Official Pinned Comment (Solution & Speed Trick)" */}
            <Card variant="default" padding="md" className="rounded-2xl border-amber-200 bg-amber-50/20 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-700" />
                  <h4 className="text-xs font-bold text-slate-900">📌 Official Pinned Comment</h4>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPinnedComment}
                  className="py-1 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  {pinnedCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{pinnedCopied ? 'Copied!' : '📋 Copy'}</span>
                </button>
              </div>

              <textarea
                ref={autoResizeTextarea}
                onInput={(e) => autoResizeTextarea(e.currentTarget)}
                value={pinnedCommentText}
                onChange={(e) => setPinnedCommentText(e.target.value)}
                className="w-full text-xs font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-amber-300 bg-white focus:outline-hidden focus:border-amber-500 resize-none overflow-hidden min-h-[80px] transition-[height] duration-100"
              />
              <p className="text-[10px] text-slate-500 italic">
                Pin on Shorts/Reels to convert answer checks into high comment engagement.
              </p>
            </Card>

            {/* CARD 3: "Reviewer Math Proof" (Collapsible Drawer) */}
            {sourceQuestion && (
              <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Reviewer Math Proof
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMathProofDrawer(!showMathProofDrawer)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <span>{showMathProofDrawer ? 'Collapse' : 'Expand'}</span>
                    {showMathProofDrawer ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {showMathProofDrawer && (
                  <div className="space-y-2 text-xs pt-2 border-t border-slate-800 animate-in fade-in duration-150">
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-400 block mb-0.5 uppercase tracking-wider">
                        Problem Statement
                      </span>
                      <p className="text-slate-200 text-xs leading-relaxed font-telugu">
                        {(sourceQuestion as any).statementTe || (sourceQuestion as any).statement || sourceQuestion.questionText}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Authoritative Math Proof
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                          Option {String(sourceQuestion.correctAnswer || (sourceQuestion as any).correctOption || '').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-slate-300 font-telugu text-[11px] bg-black/60 p-2 rounded-xl border border-slate-800 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {(sourceQuestion as any).explanationTe || sourceQuestion.explanation || 'No proof text available on record.'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span>ID: <strong className="font-mono text-indigo-300">{sourceQuestion.id}</strong></span>
                      <span>Topic: <strong className="text-slate-300">{sourceQuestion.topicName || (sourceQuestion as any).topic || sourceQuestion.topicId || 'General'}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Script Version History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVersionModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {versions.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">No previous script versions recorded.</p>
              ) : (
                versions.map((ver) => (
                  <div key={ver.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">Version #{ver.versionNumber}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(ver.createdAt).toLocaleString()}</span>
                    </div>
                    {ver.changeSummary && (
                      <p className="text-xs text-slate-600 font-medium">{ver.changeSummary}</p>
                    )}
                    <div className="text-[11px] text-slate-700 font-telugu bg-white p-2 rounded-lg border border-slate-200 line-clamp-3">
                      {(ver as any).hookText || (ver as any).problemStatement || (ver as any).stepByStepSolution || ver.changeSummary || `Version #${ver.versionNumber}`}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowVersionModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptWorkspace;
