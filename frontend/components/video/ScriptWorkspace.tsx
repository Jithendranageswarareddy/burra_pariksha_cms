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
  Plus,
  Trash2,
  BookOpenCheck,
  Video,
} from 'lucide-react';
import {
  Script,
  ScriptVersion,
  VideoProductionStatus,
  Question,
  ContentProductionMode,
  Mode3QuestionBlock,
  ScriptContentPayload,
} from '../../../shared';
import { apiClient } from '../../api/api-client';
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

  // Active Production Mode (ADR-010 / S8-T03 / S8-T08)
  const [productionMode, setProductionMode] = useState<ContentProductionMode>('QUESTION_CHALLENGE_SHORT');

  // Track if authored script was already loaded to prevent overwriting from async question fetch
  const hasLoadedSavedScript = useRef<boolean>(false);

  // Mode 1: Format Switcher State
  const [scriptFormat, setScriptFormat] = useState<'VIRAL_CHALLENGE' | 'SOLUTION_BREAKDOWN'>('VIRAL_CHALLENGE');
  const [viralHook, setViralHook] = useState<string>('');
  const [viralQuestion, setViralQuestion] = useState<string>('');
  const [viralOptions, setViralOptions] = useState<string>('');
  const [includeOptionsInVideo, setIncludeOptionsInVideo] = useState<boolean>(true);
  const [viralCta, setViralCta] = useState<string>('');

  // Mode 1: Full Solution Breakdown Fields
  const [hookText, setHookText] = useState<string>('');
  const [problemStatement, setProblemStatement] = useState<string>('');
  const [stepByStepSolution, setStepByStepSolution] = useState<string>('');
  const [speedTrickOrTakeaway, setSpeedTrickOrTakeaway] = useState<string>('');
  const [callToAction, setCallToAction] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Mode 2: Topic Introduction Fields (ADR-010 Mode 2: Conceptual syllabus overview)
  const [coreTheory, setCoreTheory] = useState<string>('');
  const [realLifeApplication, setRealLifeApplication] = useState<string>('');

  // Mode 3: Explained Questions Video Fields (ADR-010 Mode 3: Masterclass with multi-question blocks)
  const [introOverview, setIntroOverview] = useState<string>('');
  const [questionBlocks, setQuestionBlocks] = useState<Mode3QuestionBlock[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Common Extras: Pinned comment & controls
  const [pinnedCommentText, setPinnedCommentText] = useState<string>('');
  const [pinnedCopied, setPinnedCopied] = useState<boolean>(false);
  const [showAiPrompter, setShowAiPrompter] = useState<boolean>(false);
  const [tone, setTone] = useState<'ENERGETIC_EXAM_COACH' | 'CLEAR_CONCEPTUAL' | 'EXAM_TRICK_FOCUSED'>('ENERGETIC_EXAM_COACH');
  const [targetDurationSeconds, setTargetDurationSeconds] = useState<number>(20);
  const [customGuidance, setCustomGuidance] = useState<string>('');

  // Versioning state
  const [showVersionModal, setShowVersionModal] = useState<boolean>(false);
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

  const generatePinnedCommentForMode = (mode: ContentProductionMode, q: any, blocks?: Mode3QuestionBlock[]): string => {
    if (mode === 'TOPIC_INTRODUCTION') {
      return `📌 [ Official Concept Summary & Key Rules ]\n🎯 Topic: ${q?.conceptTitle || q?.topicName || 'కాన్సెప్ట్ సారాంశం'}\n\n💡 Core Takeaway:\n${q?.introductoryConcept || 'ముఖ్యమైన కాన్సెప్ట్ సూత్రాలు'}\n\n⚡ Exam Relevance:\n${q?.syllabusScopeNotes || 'పోటీ పరీక్షలకు అత్యంత కీలకమైన అంశాలు'}`;
    }
    if (mode === 'EXPLAINED_QUESTIONS_VIDEO') {
      const qLines = (blocks && blocks.length > 0)
        ? blocks.map((b) => `⏱️ Question ${b.questionNumber}: ${b.questionText.slice(0, 45)}...`).join('\n')
        : (q?.questions || []).map((item: any, i: number) => `⏱️ Question ${item.questionNumber || i + 1}: ${(item.questionText || '').slice(0, 45)}... (Ans: ${item.correctAnswer || 'Official'})`).join('\n');
      return `📌 [ Official Masterclass Question Index & Timestamps ]\n${qLines || '00:00 Intro & Concepts'}\n\n⚡ Burra Speed Shortcut:\nపిన్డ్ వివరణ మరియు షార్ట్‌కట్లను రివైజ్ చేసుకోండి!`;
    }
    // Mode 1: QUESTION_CHALLENGE_SHORT
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

      // Fetch existing script from backend
      const res = await apiClient.getScript(videoId);

      // Fetch linked video & question for mode cross-reference
      let vid: any = null;
      let q: Question | null = null;
      try {
        vid = await apiClient.getVideoById(videoId);
        if (vid?.question) {
          q = vid.question;
        } else if (vid?.questionId) {
          q = await apiClient.getQuestionById(vid.questionId);
        }
      } catch (err) {
        console.warn('Non-fatal: could not load source question for script:', err);
      }

      if (q) {
        setSourceQuestion(q);
      }

      // Determine authoritative Production Mode
      const resolvedMode: ContentProductionMode = (
        res?.script?.productionMode ||
        (vid?.question as any)?.productionMode ||
        (q as any)?.productionMode ||
        'QUESTION_CHALLENGE_SHORT'
      ) as ContentProductionMode;

      setProductionMode(resolvedMode);

      if (res?.script) {
        // CASE A: User has a saved script in Firestore - PRESERVE AUTHORED CONTENT
        setScript(res.script);
        hasLoadedSavedScript.current = true;

        if (resolvedMode === 'TOPIC_INTRODUCTION') {
          setHookText(res.script.hookText || '');
          setCoreTheory(res.script.coreTheory || res.script.problemStatement || '');
          setRealLifeApplication(res.script.realLifeApplication || res.script.stepByStepSolution || '');
          setCallToAction(res.script.callToAction || '');
          setNotes(res.script.notes || '');
          setPinnedCommentText(generatePinnedCommentForMode('TOPIC_INTRODUCTION', q));
        } else if (resolvedMode === 'EXPLAINED_QUESTIONS_VIDEO') {
          setIntroOverview(res.script.introOverview || res.script.hookText || '');
          if (res.script.questionBlocks && res.script.questionBlocks.length > 0) {
            setQuestionBlocks(res.script.questionBlocks);
          } else if (res.script.problemStatement || res.script.stepByStepSolution) {
            setQuestionBlocks([
              {
                questionNumber: 1,
                questionText: res.script.problemStatement || '',
                optionsText: '',
                stepByStepSolution: res.script.stepByStepSolution || '',
                speedTrickOrTakeaway: res.script.speedTrickOrTakeaway || '',
              },
            ]);
          } else if (q?.questions && q.questions.length > 0) {
            setQuestionBlocks(
              q.questions.map((item: any, idx: number) => ({
                questionNumber: item.questionNumber || idx + 1,
                questionText: item.questionText || item.statementTe || '',
                optionsText: generateOptionsTextFromQuestion(item),
                stepByStepSolution: item.explanation || item.explanationTe || '',
                speedTrickOrTakeaway: item.trickOrPitfall || item.shortcutTe || item.speedTrick || '',
              }))
            );
          }
          setCallToAction(res.script.callToAction || '');
          setNotes(res.script.notes || '');
          setPinnedCommentText(generatePinnedCommentForMode('EXPLAINED_QUESTIONS_VIDEO', q, res.script.questionBlocks));
        } else {
          // Mode 1: QUESTION_CHALLENGE_SHORT
          setHookText(res.script.hookText || '');
          setProblemStatement(res.script.problemStatement || '');
          setStepByStepSolution(res.script.stepByStepSolution || '');
          setSpeedTrickOrTakeaway(res.script.speedTrickOrTakeaway || '');
          setCallToAction(res.script.callToAction || '');
          setNotes(res.script.notes || '');

          setViralHook(res.script.hookText || '');
          setViralQuestion(res.script.problemStatement || '');
          setViralOptions(res.script.stepByStepSolution || '');
          setViralCta(res.script.callToAction || '');
          setPinnedCommentText(generatePinnedCommentForMode('QUESTION_CHALLENGE_SHORT', q));
        }

        if (res.script.scriptFormat === 'SOLUTION_BREAKDOWN') {
          setScriptFormat('SOLUTION_BREAKDOWN');
          setTargetDurationSeconds(45);
        } else {
          setScriptFormat('VIRAL_CHALLENGE');
          setTargetDurationSeconds(resolvedMode === 'TOPIC_INTRODUCTION' ? 90 : (resolvedMode === 'EXPLAINED_QUESTIONS_VIDEO' ? 720 : 20));
        }

        // Fetch version history
        try {
          const vers = await apiClient.getScriptVersions(res.script.id);
          setVersions(vers);
        } catch (vErr) {
          console.warn('Could not load script versions:', vErr);
        }
      } else if (res?.draftProposal) {
        // CASE B: Backend returned a starter draftProposal
        const p = res.draftProposal;
        if (resolvedMode === 'TOPIC_INTRODUCTION') {
          setHookText(p.hookText || (q?.conceptTitle ? `🔥 ${q.conceptTitle}: కాన్సెప్ట్ క్లియర్‌గా అర్థం చేసుకుందాం!` : 'ఈ కాన్సెప్ట్ పూర్తి విశ్లేషణ'));
          setCoreTheory(p.coreTheory || p.problemStatement || q?.introductoryConcept || q?.questionText || '');
          setRealLifeApplication(p.realLifeApplication || p.stepByStepSolution || q?.realLifeContext || q?.syllabusScopeNotes || '');
          setCallToAction(p.callToAction || 'కాన్సెప్ట్ అర్థమైతే లైక్ చేయండి! తర్వాతి వీడియోలో ఈ టాపిక్ పై మోస్ట్ ఇంపార్టెంట్ ప్రాక్టీస్ ప్రశ్నలను సాల్వ్ చేద్దాం.');
          setNotes(p.notes || '');
          setPinnedCommentText(generatePinnedCommentForMode('TOPIC_INTRODUCTION', q));
        } else if (resolvedMode === 'EXPLAINED_QUESTIONS_VIDEO') {
          setIntroOverview(p.introOverview || p.hookText || q?.introductoryConcept || (q?.conceptTitle ? `${q.conceptTitle} — సంపూర్ణ మాస్టర్‌క్లాస్` : 'ఈ వీడియోలో మనం ముఖ్యమైన ప్రశ్నలను స్టెప్-బై-స్టెప్ షార్ట్‌కట్లతో సాధిస్తాం.'));
          if (p.questionBlocks && p.questionBlocks.length > 0) {
            setQuestionBlocks(p.questionBlocks);
          } else if (q?.questions && q.questions.length > 0) {
            setQuestionBlocks(
              q.questions.map((item: any, idx: number) => ({
                questionNumber: item.questionNumber || idx + 1,
                questionText: item.questionText || item.statementTe || '',
                optionsText: generateOptionsTextFromQuestion(item),
                stepByStepSolution: item.explanation || item.explanationTe || '',
                speedTrickOrTakeaway: item.trickOrPitfall || item.shortcutTe || item.speedTrick || '',
              }))
            );
          }
          setCallToAction(p.callToAction || 'ఈ ప్రశ్నలన్నీ పరీక్షల్లో ఎంతో ముఖ్యం! మరిన్ని మాస్టర్‌క్లాస్ వీడియోల కోసం Burra Pariksha ఛానెల్ ని Follow చేయండి!');
          setNotes(p.notes || '');
          setPinnedCommentText(generatePinnedCommentForMode('EXPLAINED_QUESTIONS_VIDEO', q, p.questionBlocks));
        } else {
          // Mode 1: QUESTION_CHALLENGE_SHORT
          setHookText(p.hookText || '');
          setProblemStatement(p.problemStatement || '');
          setStepByStepSolution(p.stepByStepSolution || '');
          setSpeedTrickOrTakeaway(p.speedTrickOrTakeaway || '');
          setCallToAction(p.callToAction || '');
          setNotes(p.notes || '');

          setViralHook(p.hookText || 'ఈ క్వశ్చన్ ని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్!');
          setViralQuestion(p.problemStatement || (q as any)?.statementTe || q?.questionText || '');
          setViralOptions(p.stepByStepSolution || generateOptionsTextFromQuestion(q));
          setViralCta(p.callToAction || 'మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది.');
          setPinnedCommentText(generatePinnedCommentForMode('QUESTION_CHALLENGE_SHORT', q));
        }
      } else {
        // CASE C: Fresh Initialization directly from linked source question
        if (resolvedMode === 'TOPIC_INTRODUCTION') {
          setHookText(q?.conceptTitle ? `🔥 ${q.conceptTitle}: కాన్సెప్ట్ క్లియర్‌గా అర్థం చేసుకుందాం!` : 'ఈ కాన్సెప్ట్ పూర్తి విశ్లేషణ');
          setCoreTheory(q?.introductoryConcept || q?.questionText || '');
          setRealLifeApplication(q?.realLifeContext || q?.syllabusScopeNotes || 'APPSC/TSPSC పరీక్షల్లో ఈ కాన్సెప్ట్ ప్రాముఖ్యత మరియు నిత్యజీవితంలో దీని ఉపయోగం.');
          setCallToAction('కాన్సెప్ట్ అర్థమైతే లైక్ చేయండి! తర్వాతి వీడియోలో ఈ టాపిక్ పై మోస్ట్ ఇంపార్టెంట్ ప్రాక్టీస్ ప్రశ్నలను సాల్వ్ చేద్దాం.');
          setNotes('Mode 2 Topic Introduction initialized.');
          setPinnedCommentText(generatePinnedCommentForMode('TOPIC_INTRODUCTION', q));
        } else if (resolvedMode === 'EXPLAINED_QUESTIONS_VIDEO') {
          setIntroOverview(q?.introductoryConcept || (q?.conceptTitle ? `${q.conceptTitle} — సంపూర్ణ మాస్టర్‌క్లాస్` : 'ఈ వీడియోలో మనం ముఖ్యమైన ప్రశ్నలను స్టెప్-బై-స్టెప్ షార్ట్‌కట్లతో సాధిస్తాం.'));
          if (q?.questions && q.questions.length > 0) {
            setQuestionBlocks(
              q.questions.map((item: any, idx: number) => ({
                questionNumber: item.questionNumber || idx + 1,
                questionText: item.questionText || item.statementTe || '',
                optionsText: generateOptionsTextFromQuestion(item),
                stepByStepSolution: item.explanation || item.explanationTe || '',
                speedTrickOrTakeaway: item.trickOrPitfall || item.shortcutTe || item.speedTrick || '',
              }))
            );
          } else {
            setQuestionBlocks([
              {
                questionNumber: 1,
                questionText: q?.questionText || (q as any)?.statementTe || '',
                optionsText: generateOptionsTextFromQuestion(q),
                stepByStepSolution: q?.explanation || (q as any)?.explanationTe || '',
                speedTrickOrTakeaway: (q as any)?.speedTrick || (q as any)?.shortcutTe || '',
              },
            ]);
          }
          setCallToAction('ఈ ప్రశ్నలన్నీ పరీక్షల్లో ఎంతో ముఖ్యం! మరిన్ని మాస్టర్‌క్లాస్ వీడియోల కోసం Burra Pariksha ఛానెల్ ని Follow చేయండి!');
          setNotes('Mode 3 Explained Questions Video initialized.');
          setPinnedCommentText(generatePinnedCommentForMode('EXPLAINED_QUESTIONS_VIDEO', q));
        } else {
          // Mode 1: QUESTION_CHALLENGE_SHORT
          setViralHook('ఈ క్వశ్చన్ ని 5 సెకన్లలో సాల్వ్ చేస్తే నువ్వు నిజంగా జీనియస్!');
          setViralQuestion((q as any)?.statementTe || q?.questionText || '');
          setViralOptions(generateOptionsTextFromQuestion(q));
          setViralCta('మీ ఆన్సర్ ఏంటో వెంటనే కామెంట్ చేయండి! సరైన సమాధానం పిన్డ్ కామెంట్లో ఉంది.');

          setHookText('ఈ క్వశ్చన్ ని 10 సెకన్లలో సాల్వ్ చేయగలరా?');
          setProblemStatement((q as any)?.statementTe || q?.questionText || '');
          setStepByStepSolution(q?.explanation || (q as any)?.explanationTe || '');
          setSpeedTrickOrTakeaway((q as any)?.speedTrick || (q as any)?.shortcutTe || '');
          setCallToAction('మరిన్ని షార్ట్‌కట్స్ కోసం ఇప్పుడే Burra Pariksha ఛానెల్ ని Follow చేయండి!');
          setPinnedCommentText(generatePinnedCommentForMode('QUESTION_CHALLENGE_SHORT', q));
        }
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

  // Mode 3 Question Block handlers
  const updateActiveQuestionBlock = (field: keyof Mode3QuestionBlock, value: any) => {
    setQuestionBlocks((prev) => {
      const updated = [...prev];
      if (!updated[activeQuestionIndex]) return prev;
      updated[activeQuestionIndex] = {
        ...updated[activeQuestionIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const handleAddQuestionBlock = () => {
    setQuestionBlocks((prev) => {
      const newNum = prev.length + 1;
      return [
        ...prev,
        {
          questionNumber: newNum,
          questionText: `కొత్త ప్రాక్టీస్ ప్రశ్న #${newNum}...`,
          optionsText: 'Option A: ...\nOption B: ...\nOption C: ...\nOption D: ...',
          stepByStepSolution: 'దశలవారీ గణిత వివరణ...',
          speedTrickOrTakeaway: 'షార్ట్‌కట్ లేదా పరీక్ష ట్రిక్...',
        },
      ];
    });
    setActiveQuestionIndex(questionBlocks.length);
  };

  const handleRemoveQuestionBlock = (idxToRemove: number) => {
    if (questionBlocks.length <= 1) return; // Keep at least 1 question
    setQuestionBlocks((prev) => {
      const filtered = prev.filter((_, i) => i !== idxToRemove);
      return filtered.map((block, i) => ({
        ...block,
        questionNumber: i + 1,
      }));
    });
    if (activeQuestionIndex >= questionBlocks.length - 1) {
      setActiveQuestionIndex(Math.max(0, questionBlocks.length - 2));
    }
  };

  const handleGenerateScriptWithAi = async () => {
    try {
      setIsGeneratingAi(true);
      setError(null);

      if (productionMode === 'TOPIC_INTRODUCTION') {
        if (sourceQuestion) {
          setHookText(sourceQuestion.conceptTitle ? `🔥 ${sourceQuestion.conceptTitle}: కాన్సెప్ట్ క్లియర్‌గా అర్థం చేసుకుందాం!` : 'ఈ కాన్సెప్ట్ పూర్తి విశ్లేషణ');
          setCoreTheory(sourceQuestion.introductoryConcept || sourceQuestion.questionText || '');
          setRealLifeApplication(sourceQuestion.realLifeContext || sourceQuestion.syllabusScopeNotes || 'నిత్యజీవితంలో మరియు పోటీ పరీక్షల్లో ఈ కాన్సెప్ట్ ప్రాముఖ్యత.');
          setCallToAction('కాన్సెప్ట్ అర్థమైతే లైక్ చేయండి! తర్వాతి వీడియోలో ఈ టాపిక్ పై మోస్ట్ ఇంపార్టెంట్ ప్రాక్టీస్ ప్రశ్నలను సాల్వ్ చేద్దాం.');
        }
        setSuccessMessage('AI conceptual script auto-drafted successfully!');
        return;
      }

      if (productionMode === 'EXPLAINED_QUESTIONS_VIDEO') {
        if (sourceQuestion) {
          setIntroOverview(sourceQuestion.introductoryConcept || (sourceQuestion.conceptTitle ? `${sourceQuestion.conceptTitle} — సంపూర్ణ మాస్టర్‌క్లాస్` : 'ఈ వీడియోలో మనం ముఖ్యమైన ప్రశ్నలను స్టెప్-బై-స్టెప్ షార్ట్‌కట్లతో సాధిస్తాం.'));
          if (sourceQuestion.questions && sourceQuestion.questions.length > 0) {
            setQuestionBlocks(
              sourceQuestion.questions.map((item: any, idx: number) => ({
                questionNumber: item.questionNumber || idx + 1,
                questionText: item.questionText || item.statementTe || '',
                optionsText: generateOptionsTextFromQuestion(item),
                stepByStepSolution: item.explanation || item.explanationTe || '',
                speedTrickOrTakeaway: item.trickOrPitfall || item.shortcutTe || item.speedTrick || '',
              }))
            );
          }
          setCallToAction('ఈ ప్రశ్నలన్నీ పరీక్షల్లో ఎంతో ముఖ్యం! మరిన్ని మాస్టర్‌క్లాస్ వీడియోల కోసం Burra Pariksha ఛానెల్ ని Follow చేయండి!');
        }
        setSuccessMessage('AI masterclass script auto-drafted successfully!');
        return;
      }

      // Mode 1: AI generation
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

      let payload: ScriptContentPayload;

      if (productionMode === 'TOPIC_INTRODUCTION') {
        payload = {
          productionMode: 'TOPIC_INTRODUCTION',
          hookText,
          coreTheory,
          problemStatement: coreTheory,
          realLifeApplication,
          stepByStepSolution: realLifeApplication,
          speedTrickOrTakeaway: '',
          callToAction,
          notes,
        };
      } else if (productionMode === 'EXPLAINED_QUESTIONS_VIDEO') {
        payload = {
          productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
          hookText: introOverview,
          introOverview,
          questionBlocks,
          problemStatement: questionBlocks.map((q) => `Q${q.questionNumber}: ${q.questionText}`).join('\n\n'),
          stepByStepSolution: questionBlocks.map((q) => `Q${q.questionNumber} Solution:\n${q.stepByStepSolution}`).join('\n\n'),
          speedTrickOrTakeaway: questionBlocks.map((q) => `Q${q.questionNumber} Trick: ${q.speedTrickOrTakeaway || 'N/A'}`).join('\n'),
          callToAction,
          notes,
        };
      } else {
        // Mode 1: QUESTION_CHALLENGE_SHORT
        payload = {
          productionMode: 'QUESTION_CHALLENGE_SHORT',
          scriptFormat,
          hookText: scriptFormat === 'VIRAL_CHALLENGE' ? viralHook : hookText,
          problemStatement: scriptFormat === 'VIRAL_CHALLENGE' ? viralQuestion : problemStatement,
          stepByStepSolution: scriptFormat === 'VIRAL_CHALLENGE' ? (includeOptionsInVideo ? viralOptions : '[Options Skipped]') : stepByStepSolution,
          speedTrickOrTakeaway,
          callToAction: scriptFormat === 'VIRAL_CHALLENGE' ? viralCta : callToAction,
          notes,
        };
      }

      const savePromises: Promise<any>[] = [apiClient.saveScript(videoId, payload)];

      if (pinnedCommentText && pinnedCommentText.trim()) {
        savePromises.push(
          apiClient.savePinnedComment(videoId, {
            commentText: pinnedCommentText.trim(),
            isApproved: true,
          }).catch((err) => {
            console.warn('Non-fatal: could not auto-sync pinned comment:', err);
          })
        );
      }

      const [res] = await Promise.all(savePromises);
      if (res?.script) {
        setScript(res.script);
        hasLoadedSavedScript.current = true;
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
    let fullText = '';

    if (productionMode === 'TOPIC_INTRODUCTION') {
      fullText = `📘 [TOPIC INTRODUCTION SCRIPT — 60–180s]\n1. HOOK & OVERVIEW: ${hookText}\n2. CORE THEORY & DEFINITION: ${coreTheory}\n3. REAL-LIFE APPLICATION: ${realLifeApplication}\n4. NEXT-STEPS CTA: ${callToAction}\n\n📌 OFFICIAL PINNED SUMMARY:\n${pinnedCommentText}`;
    } else if (productionMode === 'EXPLAINED_QUESTIONS_VIDEO') {
      const blocksFormatted = questionBlocks
        .map(
          (b) =>
            `--- QUESTION ${b.questionNumber} ---\n[QUESTION]: ${b.questionText}\n[OPTIONS]:\n${b.optionsText || 'N/A'}\n[SOLUTION]:\n${b.stepByStepSolution}\n[SPEED TRICK]: ${b.speedTrickOrTakeaway || 'N/A'}`
        )
        .join('\n\n');
      fullText = `🎓 [EXPLAINED QUESTIONS MASTERCLASS SCRIPT]\nROADMAP & OVERVIEW: ${introOverview}\n\n${blocksFormatted}\n\nCLOSING CTA: ${callToAction}\n\n📌 QUESTION INDEX & TIMESTAMPS:\n${pinnedCommentText}`;
    } else {
      fullText =
        scriptFormat === 'VIRAL_CHALLENGE'
          ? `⚡ [VIRAL CHALLENGE SCRIPT]\n1. HOOK: ${viralHook}\n2. QUESTION: ${viralQuestion}\n3. OPTIONS: ${includeOptionsInVideo ? viralOptions : '[Skipped]'}\n4. CTA: ${viralCta}\n\n📌 PINNED COMMENT:\n${pinnedCommentText}`
          : `🎓 [FULL SOLUTION SCRIPT]\n1. HOOK: ${hookText}\n2. PROBLEM: ${problemStatement}\n3. SOLUTION: ${stepByStepSolution}\n4. TRICK: ${speedTrickOrTakeaway}\n5. CTA: ${callToAction}`;
    }

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
  const getFullTextToCount = (): string => {
    if (productionMode === 'TOPIC_INTRODUCTION') {
      return `${hookText} ${coreTheory} ${realLifeApplication} ${callToAction}`;
    }
    if (productionMode === 'EXPLAINED_QUESTIONS_VIDEO') {
      const blocksText = questionBlocks
        .map((b) => `${b.questionText} ${b.optionsText || ''} ${b.stepByStepSolution} ${b.speedTrickOrTakeaway || ''}`)
        .join(' ');
      return `${introOverview} ${blocksText} ${callToAction}`;
    }
    if (scriptFormat === 'VIRAL_CHALLENGE') {
      return `${viralHook} ${viralQuestion} ${includeOptionsInVideo ? viralOptions : ''} ${viralCta}`;
    }
    return `${hookText} ${problemStatement} ${stepByStepSolution} ${speedTrickOrTakeaway} ${callToAction}`;
  };

  const totalWords = getFullTextToCount().trim() ? getFullTextToCount().trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.round(totalWords / 2.5); // ~150 WPM = 2.5 words per sec

  const activeQuestion = questionBlocks[activeQuestionIndex] || questionBlocks[0];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* 1. TOP BAR: MODE BADGE & FORMAT SWITCHER */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Prominent Production Mode Badge */}
          {productionMode === 'TOPIC_INTRODUCTION' && (
            <Badge variant="approved" size="md" className="py-1 px-3 bg-blue-50 text-blue-800 border-blue-200 font-bold flex items-center gap-1.5">
              <BookOpenCheck className="w-4 h-4 text-blue-600" />
              <span>Mode 2: Topic Introduction (Conceptual Syllabus 60–180s)</span>
            </Badge>
          )}

          {productionMode === 'EXPLAINED_QUESTIONS_VIDEO' && (
            <Badge variant="approved" size="md" className="py-1 px-3 bg-purple-50 text-purple-800 border-purple-200 font-bold flex items-center gap-1.5">
              <Video className="w-4 h-4 text-purple-600" />
              <span>Mode 3: Explained Questions Video ({questionBlocks.length} Practice Questions, 16:9 Masterclass)</span>
            </Badge>
          )}

          {productionMode === 'QUESTION_CHALLENGE_SHORT' && (
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
          )}
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
                      productionMode === 'TOPIC_INTRODUCTION'
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : productionMode === 'EXPLAINED_QUESTIONS_VIDEO'
                        ? 'bg-purple-50 border-purple-200 text-purple-600'
                        : scriptFormat === 'VIRAL_CHALLENGE'
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {productionMode === 'TOPIC_INTRODUCTION'
                        ? 'Mode 2: Topic Introduction (4-Part Concept Script)'
                        : productionMode === 'EXPLAINED_QUESTIONS_VIDEO'
                        ? `Mode 3: Masterclass Script (${questionBlocks.length} Practice Questions)`
                        : scriptFormat === 'VIRAL_CHALLENGE'
                        ? 'Mode 1: Viral Challenge Draft (4-Part Short)'
                        : 'Mode 1: Full Solution Breakdown (5-Part)'}
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
                      AI Guidance Presets ({productionMode})
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

                  {/* Preset Recommendation Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {productionMode === 'TOPIC_INTRODUCTION' ? (
                      <>
                        {[
                          { label: '🏛️ First-Principles Theory', text: 'Explain the core definition from first principles with zero jargon.' },
                          { label: '🎯 APPSC Exam Scope', text: 'Emphasize high-yield syllabus traps asked in recent APPSC Group 2 exams.' },
                          { label: '💡 Real-World Dilemma', text: 'Anchor the concept in a relatable Telugu daily life scenario.' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleSelectPreset(preset.text)}
                            className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-medium ${
                              customGuidance === preset.text
                                ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </>
                    ) : productionMode === 'EXPLAINED_QUESTIONS_VIDEO' ? (
                      <>
                        {[
                          { label: '⚡ Rapid Shortcuts Focus', text: 'Highlight 10-second mental math elimination for every question.' },
                          { label: '🪜 Graduated Difficulty', text: 'Structure questions from foundational easy to advanced multi-step.' },
                          { label: '⚠️ Distractor Trap Alerts', text: 'Warn students why common wrong options fool candidates under exam pressure.' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleSelectPreset(preset.text)}
                            className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-medium ${
                              customGuidance === preset.text
                                ? 'bg-purple-100 text-purple-900 border-purple-300 font-bold shadow-2xs'
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
                          { label: '🔥 99% Fail Challenge', text: 'Make the hook a 99% fail challenge to provoke viewers to prove themselves.' },
                          { label: '⏱️ 5-Sec Speed Test', text: 'Challenge viewers to solve mentally in 5 seconds without pen and paper.' },
                          { label: '🧠 Genius IQ Test', text: 'Pose this as a genius-level brain test.' },
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
                      placeholder="Custom AI prompt guidance..."
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

              {/* ========================================================
                  TEMPLATE 2: MODE 2 (TOPIC_INTRODUCTION)
                  Hook/Overview, Core Theory/Definition, Real-Life Application, Next-Steps CTA
                  ======================================================== */}
              {productionMode === 'TOPIC_INTRODUCTION' && (
                <div className="space-y-3">
                  {/* Part 1: Hook / Overview */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          1
                        </span>
                        1. Hook &amp; Topic Overview (0–15s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~20–30 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={hookText}
                      onChange={(e) => setHookText(e.target.value)}
                      placeholder="e.g. 🔥 వయసు సమస్యలు — త్రికాల సూత్రం: కాన్సెప్ట్ క్లియర్‌గా అర్థం చేసుకుందాం!"
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none overflow-hidden min-h-[56px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Part 2: Core Theory / Definition */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          2
                        </span>
                        2. Core Theory &amp; Definition (15–60s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~60–100 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={coreTheory}
                      onChange={(e) => setCoreTheory(e.target.value)}
                      placeholder="కాన్సెప్ట్ యొక్క మూల సూత్రాలు, సమీకరణాలు లేకుండా సాధించే విధానం..."
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none overflow-hidden min-h-[72px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Part 3: Real-Life Application */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          3
                        </span>
                        3. Real-Life Application &amp; Exam Relevance (60–120s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~60–90 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={realLifeApplication}
                      onChange={(e) => setRealLifeApplication(e.target.value)}
                      placeholder="పోటీ పరీక్షల్లో ఈ కాన్సెప్ట్ ఎందుకు అడుగుతారు మరియు నిత్యజీవితంలో దీని ఉపయోగం..."
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none overflow-hidden min-h-[64px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Part 4: Next-Steps CTA */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          4
                        </span>
                        4. Next-Steps Call to Action (120–150s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~15–20 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      placeholder="కాన్సెప్ట్ అర్థమైతే లైక్ చేయండి! తర్వాతి వీడియోలో ఈ టాపిక్ పై మోస్ట్ ఇంపార్టెంట్ ప్రాక్టీస్ ప్రశ్నలను సాల్వ్ చేద్దాం."
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:outline-hidden resize-none overflow-hidden min-h-[52px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Teleprompter Notes */}
                  <div className="pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Presenter Notes & Visual Cue Directions..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* ========================================================
                  TEMPLATE 3: MODE 3 (EXPLAINED_QUESTIONS_VIDEO)
                  Introductory Overview + Script Blocks for Every Practice Question + Speed Trick Callouts + Outro CTA
                  ======================================================== */}
              {productionMode === 'EXPLAINED_QUESTIONS_VIDEO' && (
                <div className="space-y-3.5">
                  {/* Part 1: Introductory Overview & Roadmap */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          1
                        </span>
                        1. Introductory Overview &amp; Question Roadmap (0–30s)
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~35–50 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={introOverview}
                      onChange={(e) => setIntroOverview(e.target.value)}
                      placeholder="ఈ వీడియోలో మనం ముఖ్యమైన ప్రశ్నలను స్టెప్-బై-స్టెప్ షార్ట్‌కట్లతో సాధిస్తాం..."
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-purple-500 focus:outline-hidden resize-none overflow-hidden min-h-[60px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Part 2: Practice Question Script Blocks Multi-Tab Navigator */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          2
                        </span>
                        2. Practice Question Script Blocks ({questionBlocks.length} Questions)
                      </label>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleAddQuestionBlock}
                          className="text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Question</span>
                        </button>
                      </div>
                    </div>

                    {/* Segmented Question Tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-100">
                      {questionBlocks.map((b, i) => (
                        <button
                          key={b.questionNumber}
                          type="button"
                          onClick={() => setActiveQuestionIndex(i)}
                          className={`text-xs px-3 py-1 rounded-lg border font-mono font-semibold transition-all shrink-0 cursor-pointer ${
                            activeQuestionIndex === i
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Q{b.questionNumber}
                        </button>
                      ))}
                    </div>

                    {/* Active Question Script Block Card */}
                    {activeQuestion && (
                      <div className="p-3 bg-purple-50/20 border border-purple-200/60 rounded-xl space-y-2.5 animate-in fade-in duration-100">
                        <div className="flex items-center justify-between text-xs font-bold text-purple-900 border-b border-purple-100 pb-1.5">
                          <span className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px] font-mono">
                              #{activeQuestion.questionNumber}
                            </span>
                            Question {activeQuestion.questionNumber} Teleprompter Script
                          </span>
                          {questionBlocks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestionBlock(activeQuestionIndex)}
                              className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                              title="Delete this question block"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>

                        {/* Question Text */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Question Narration (Telugu)
                          </label>
                          <textarea
                            ref={autoResizeTextarea}
                            onInput={(e) => autoResizeTextarea(e.currentTarget)}
                            value={activeQuestion.questionText}
                            onChange={(e) => updateActiveQuestionBlock('questionText', e.target.value)}
                            placeholder="ప్రశ్న యొక్క తెలుగు పాఠం..."
                            className="w-full text-xs font-telugu text-slate-900 leading-relaxed p-2 rounded-lg border border-slate-200 bg-white focus:border-purple-500 focus:outline-hidden resize-none min-h-[48px]"
                          />
                        </div>

                        {/* Options Text */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Options Delivery
                          </label>
                          <textarea
                            ref={autoResizeTextarea}
                            onInput={(e) => autoResizeTextarea(e.currentTarget)}
                            value={activeQuestion.optionsText || ''}
                            onChange={(e) => updateActiveQuestionBlock('optionsText', e.target.value)}
                            placeholder="Option A: ...&#10;Option B: ...&#10;Option C: ...&#10;Option D: ..."
                            className="w-full text-xs font-telugu text-slate-900 leading-relaxed p-2 rounded-lg border border-slate-200 bg-white focus:border-purple-500 focus:outline-hidden resize-none min-h-[44px]"
                          />
                        </div>

                        {/* Step-by-Step Solution */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                            Step-by-Step Intuitive Solution
                          </label>
                          <textarea
                            ref={autoResizeTextarea}
                            onInput={(e) => autoResizeTextarea(e.currentTarget)}
                            value={activeQuestion.stepByStepSolution}
                            onChange={(e) => updateActiveQuestionBlock('stepByStepSolution', e.target.value)}
                            placeholder="దశలవారీ గణిత వివరణ మరియు కాన్సెప్ట్ వివరణ..."
                            className="w-full text-xs font-telugu text-slate-900 leading-relaxed p-2 rounded-lg border border-slate-200 bg-white focus:border-purple-500 focus:outline-hidden resize-none min-h-[56px]"
                          />
                        </div>

                        {/* Speed Trick Callout */}
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-600" />
                              <span>Burra Speed Shortcut / Exam Takeaway</span>
                            </label>
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                              Key Trick
                            </span>
                          </div>
                          <textarea
                            ref={autoResizeTextarea}
                            onInput={(e) => autoResizeTextarea(e.currentTarget)}
                            value={activeQuestion.speedTrickOrTakeaway || ''}
                            onChange={(e) => updateActiveQuestionBlock('speedTrickOrTakeaway', e.target.value)}
                            placeholder="💡 బుర్ర ట్రిక్: ఆప్షన్ ఎలిమినేషన్ లేదా 10 సెకన్ల షార్ట్‌కట్..."
                            className="w-full text-xs font-telugu text-slate-900 leading-relaxed p-2 rounded-lg border border-amber-300 bg-amber-50/30 focus:bg-white focus:border-purple-500 focus:outline-hidden resize-none min-h-[44px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Part 3: Masterclass Outro & CTA */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-mono font-bold">
                          3
                        </span>
                        3. Masterclass Outro &amp; CTA
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">~15–20 words</span>
                    </div>
                    <textarea
                      ref={autoResizeTextarea}
                      onInput={(e) => autoResizeTextarea(e.currentTarget)}
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      placeholder="ఈ 5 ప్రశ్నలు పరీక్షల్లో ఎంతో ముఖ్యం! మరిన్ని మాస్టర్‌క్లాస్ వీడియోల కోసం Burra Pariksha ఛానెల్ ని Follow చేయండి!"
                      className="w-full text-sm font-telugu text-slate-900 leading-relaxed p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-purple-500 focus:outline-hidden resize-none overflow-hidden min-h-[50px] transition-[height] duration-100"
                    />
                  </div>

                  {/* Notes */}
                  <div className="pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Masterclass Teleprompter & Visual Overlay Notes..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* ========================================================
                  TEMPLATE 1: MODE 1 (QUESTION_CHALLENGE_SHORT)
                  Hook, Question Presentation, Options/Countdown, Engagement CTA
                  ======================================================== */}
              {productionMode === 'QUESTION_CHALLENGE_SHORT' && (
                <>
                  {scriptFormat === 'VIRAL_CHALLENGE' ? (
                    /* FORMAT A: VIRAL CHALLENGE (4 PARTS) */
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
                    /* FORMAT B: FULL SOLUTION BREAKDOWN (5 PARTS) */
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
                </>
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

              {/* INLINE PACING METER (Mode-Aware) */}
              <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 flex-wrap">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Words: <strong className="text-slate-900 font-mono">{totalWords}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Est: <strong className="font-mono font-bold text-slate-900">
                      {productionMode === 'EXPLAINED_QUESTIONS_VIDEO'
                        ? `~${Math.max(1, Math.round(estimatedSeconds / 60))}m`
                        : `~${estimatedSeconds}s`}
                    </strong>
                  </span>
                </div>

                <Badge
                  variant={
                    productionMode === 'TOPIC_INTRODUCTION'
                      ? (estimatedSeconds >= 60 && estimatedSeconds <= 180 ? 'approved' : 'draft')
                      : productionMode === 'EXPLAINED_QUESTIONS_VIDEO'
                      ? 'approved'
                      : estimatedSeconds <= (scriptFormat === 'VIRAL_CHALLENGE' ? 25 : 50) ? 'approved' : 'draft'
                  }
                  size="sm"
                  className="text-[10px] py-0.5 px-2 font-bold shrink-0"
                >
                  {productionMode === 'TOPIC_INTRODUCTION'
                    ? (estimatedSeconds >= 60 && estimatedSeconds <= 180 ? 'Topic Intro (60–180s)' : (estimatedSeconds < 60 ? 'Short (<60s)' : '>180s'))
                    : productionMode === 'EXPLAINED_QUESTIONS_VIDEO'
                    ? `Masterclass (${questionBlocks.length} Qs)`
                    : scriptFormat === 'VIRAL_CHALLENGE'
                    ? (estimatedSeconds <= 25 ? 'Viral Sweet Spot' : 'Too Long')
                    : (estimatedSeconds <= 50 ? 'Optimal (45s)' : 'Exceeds 50s')}
                </Badge>
              </div>
            </Card>

            {/* CARD 2: "📌 Official Pinned Comment / Summary" */}
            <Card variant="default" padding="md" className="rounded-2xl border-amber-200 bg-amber-50/20 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-700" />
                  <h4 className="text-xs font-bold text-slate-900">
                    {productionMode === 'TOPIC_INTRODUCTION'
                      ? '📌 Concept Summary & Key Rules'
                      : productionMode === 'EXPLAINED_QUESTIONS_VIDEO'
                      ? '📌 Question Index & Timestamps'
                      : '📌 Official Pinned Comment (Solution & Trick)'}
                  </h4>
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
                {productionMode === 'TOPIC_INTRODUCTION'
                  ? 'Pinned on video to anchor student comprehension and syllabus scope.'
                  : productionMode === 'EXPLAINED_QUESTIONS_VIDEO'
                  ? 'Pinned on Masterclass to provide click-to-jump question chapter marks.'
                  : 'Pin on Shorts/Reels to convert answer checks into high comment engagement.'}
              </p>
            </Card>

            {/* CARD 3: "Reviewer Math Proof / Source Concept Cross-Reference" (Collapsible Drawer) */}
            {sourceQuestion && (
              <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {productionMode === 'TOPIC_INTRODUCTION'
                        ? 'Topic Syllabus Reference'
                        : 'Reviewer Proof & Question Data'}
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
                        {productionMode === 'TOPIC_INTRODUCTION' ? 'Concept Title & Scope' : 'Problem Statement'}
                      </span>
                      <p className="text-slate-200 text-xs leading-relaxed font-telugu">
                        {sourceQuestion.conceptTitle ||
                          (sourceQuestion as any).statementTe ||
                          (sourceQuestion as any).statement ||
                          sourceQuestion.questionText}
                      </p>
                    </div>

                    {sourceQuestion.introductoryConcept && (
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Introductory Concept Text
                        </span>
                        <div className="text-slate-300 font-telugu text-[11px] bg-black/60 p-2 rounded-xl border border-slate-800 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {sourceQuestion.introductoryConcept}
                        </div>
                      </div>
                    )}

                    {sourceQuestion.explanation && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Authoritative Solution / Notes
                          </span>
                          {sourceQuestion.correctAnswer && (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                              Option {String(sourceQuestion.correctAnswer || (sourceQuestion as any).correctOption || '').toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 font-telugu text-[11px] bg-black/60 p-2 rounded-xl border border-slate-800 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {(sourceQuestion as any).explanationTe || sourceQuestion.explanation}
                        </div>
                      </div>
                    )}

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
