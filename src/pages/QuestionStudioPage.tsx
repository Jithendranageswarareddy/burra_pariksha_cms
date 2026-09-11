/**
 * BURRA PARIKSHA CMS - Unified Question Studio Workspace
 * Phase 7 - Task 7B: Unified Question Studio Foundation
 * 
 * Supports both AI Mode (generation + refinement) and Manual Mode (direct authoring)
 * while converging on a single Candidate Editor model and canonical save pipeline.
 * Includes pre-save server-side validation (POST /api/questions/validate-candidate)
 * and stale validation state tracking on material candidate edits.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  PenTool,
  Wand2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Sliders,
  FileCheck,
  ShieldCheck,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { apiClient } from '../lib/api-client';
import {
  Category,
  DifficultyLevel,
  QuestionLanguage,
  QuestionStyle,
  ValidationResult,
  QuestionValidationStatus,
} from '../types';
import {
  AiRefinementAction,
  GenerateCandidateInput,
  QuestionCandidate,
  RefineCandidateInput,
} from '../lib/ai/types';
import { CandidateValidator, CandidateValidationReport } from '../lib/ai/validators/candidate.validator';
import { QUESTION_CREATION_CONFIG } from '../config/question-creation.config';

type StudioMode = 'ai' | 'manual';

const REAL_WORLD_HOOK_SUGGESTIONS = [
  'Metro escalator commuter rush hour',
  'UPI festive shopping cashback',
  'Cricket run-rate chase in last 5 overs',
  'E-commerce delivery courier speed & battery drain',
  'Monthly salary savings vs inflation bracket',
  'Train overtaking on parallel tracks',
  'Water tank leakage & dual pump refill',
];

export interface StudioCandidate {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  categoryId: string;
  topicId: string;
  subtopicId: string;
  difficulty: string;
  challengeType: string;
  presentationType: string;
  language: QuestionLanguage;
  realLifeContext: string;
  tags: string[];
  // AI Metadata
  sourceModel?: string;
  generationLatencyMs?: number;
  isFallback?: boolean;
}

export const QuestionStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode Selection: 'ai' or 'manual'
  const initialMode = (searchParams.get('mode') as StudioMode) || 'ai';
  const [mode, setMode] = useState<StudioMode>(initialMode === 'manual' ? 'manual' : 'ai');

  // Deep-linking URL Parameters
  const queryCategory = searchParams.get('categoryId') || searchParams.get('category') || searchParams.get('cat');
  const queryTopic = searchParams.get('topicId') || searchParams.get('topic');
  const querySubtopic = searchParams.get('subtopicId') || searchParams.get('subtopic');
  const queryDifficulty = searchParams.get('difficulty');
  const queryLanguage = searchParams.get('language') || searchParams.get('lang');
  const queryQuestionStyle = searchParams.get('questionStyle') || searchParams.get('style');
  const queryContext = searchParams.get('realWorldContext') || searchParams.get('context');

  // 1. System & Taxonomy State
  const [taxonomyTree, setTaxonomyTree] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [aiStatus, setAiStatus] = useState<{ isConfigured: boolean; model: string }>({
    isConfigured: false,
    model: 'gemini-3.1-flash-lite',
  });
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

  // Configuration State
  const [selectedCategory, setSelectedCategory] = useState<string>(queryCategory || 'CAT-QA');
  const [selectedTopic, setSelectedTopic] = useState<string>(queryTopic || 'TOP-QA-01');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>(querySubtopic || 'SUB-02');
  const [difficulty, setDifficulty] = useState<string>(queryDifficulty || 'Intermediate');
  const [challengeType, setChallengeType] = useState<string>('ABCD');
  const [presentationType, setPresentationType] = useState<string>('Text');
  const [language, setLanguage] = useState<QuestionLanguage>(
    (queryLanguage as QuestionLanguage) || QuestionLanguage.ENGLISH
  );
  const [questionStyle, setQuestionStyle] = useState<string>(
    queryQuestionStyle || QuestionStyle.REAL_WORLD_SCENARIO
  );
  const [realLifeContext, setRealLifeContext] = useState<string>(
    queryContext || 'Metro escalator commuter rush hour'
  );
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // 2. Candidate Editor State
  const [candidate, setCandidate] = useState<StudioCandidate>({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    categoryId: selectedCategory,
    topicId: selectedTopic,
    subtopicId: selectedSubtopic,
    difficulty: difficulty,
    challengeType: challengeType,
    presentationType: presentationType,
    language: language,
    realLifeContext: realLifeContext,
    tags: ['Aptitude', 'SpeedMath'],
  });
  const [hasCandidate, setHasCandidate] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // AI Operation States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [generationDuration, setGenerationDuration] = useState<number | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);

  // Validation States
  const [clientReport, setClientReport] = useState<CandidateValidationReport | null>(null);
  const [isValidatingServer, setIsValidatingServer] = useState<boolean>(false);
  const [serverValidationResult, setServerValidationResult] = useState<ValidationResult | null>(null);
  const [isValidationStale, setIsValidationStale] = useState<boolean>(false);

  // Duplicate Check States
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false);

  // Save States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccessInfo, setSavedSuccessInfo] = useState<{ id: string; status: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Suppress marking validation stale during initial generation load
  const isInternalUpdateRef = useRef<boolean>(false);

  // Sync search parameter when mode changes
  const handleModeSwitch = (newMode: StudioMode) => {
    if (isDirty && hasCandidate && candidate.questionText.trim().length > 0) {
      if (!window.confirm('You have unsaved changes in your current candidate draft. Do you want to switch modes while keeping your candidate?')) {
        return;
      }
    }
    setMode(newMode);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('mode', newMode);
    setSearchParams(newParams, { replace: true });
  };

  // 3. Initial Load: Taxonomy & AI Status
  useEffect(() => {
    async function initStudio() {
      try {
        setLoadingTaxonomy(true);
        const [tree, cats, aiInfo] = await Promise.all([
          apiClient.getTaxonomyTree().catch(() => []),
          apiClient.getCategories().catch(() => []),
          apiClient.getAiStatus().catch(() => ({ isConfigured: false, model: 'gemini-3.1-flash-lite' })),
        ]);

        setTaxonomyTree(tree);
        setCategories(cats);
        setAiStatus(aiInfo);

        if (queryCategory) {
          setSelectedCategory(queryCategory);
          if (queryTopic) setSelectedTopic(queryTopic);
          if (querySubtopic) setSelectedSubtopic(querySubtopic);
        } else if (cats.length > 0) {
          const firstCat = cats[0];
          setSelectedCategory(firstCat.id);
          const firstTopic = (tree.find((c: any) => c.id === firstCat.id)?.topics || [])[0];
          if (firstTopic) {
            setSelectedTopic(firstTopic.id);
            const firstSub = (firstTopic.subtopics || [])[0];
            if (firstSub) {
              setSelectedSubtopic(firstSub.id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize Question Studio:', err);
      } finally {
        setLoadingTaxonomy(false);
      }
    }
    initStudio();
  }, [queryCategory, queryTopic, querySubtopic]);

  // Derived taxonomy helpers
  const currentCategoryData = taxonomyTree.find((c: any) => c.id === selectedCategory);
  const currentTopics = currentCategoryData?.topics || [];
  const currentTopicData = currentTopics.find((t: any) => t.id === selectedTopic);
  const currentSubtopics = currentTopicData?.subtopics || [];

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setCandidate((prev) => ({ ...prev, categoryId: catId }));
    const cat = taxonomyTree.find((c: any) => c.id === catId);
    if (cat && cat.topics && cat.topics.length > 0) {
      const newTopic = cat.topics[0];
      setSelectedTopic(newTopic.id);
      setCandidate((prev) => ({ ...prev, topicId: newTopic.id }));
      if (newTopic.subtopics && newTopic.subtopics.length > 0) {
        const newSub = newTopic.subtopics[0].id;
        setSelectedSubtopic(newSub);
        setCandidate((prev) => ({ ...prev, subtopicId: newSub }));
      } else {
        setSelectedSubtopic('SUB-GEN');
        setCandidate((prev) => ({ ...prev, subtopicId: 'SUB-GEN' }));
      }
    }
  };

  const handleTopicChange = (topId: string) => {
    setSelectedTopic(topId);
    setCandidate((prev) => ({ ...prev, topicId: topId }));
    const top = currentTopics.find((t: any) => t.id === topId);
    if (top && top.subtopics && top.subtopics.length > 0) {
      const newSub = top.subtopics[0].id;
      setSelectedSubtopic(newSub);
      setCandidate((prev) => ({ ...prev, subtopicId: newSub }));
    } else {
      setSelectedSubtopic('SUB-GEN');
      setCandidate((prev) => ({ ...prev, subtopicId: 'SUB-GEN' }));
    }
  };

  const handleSubtopicChange = (subId: string) => {
    setSelectedSubtopic(subId);
    setCandidate((prev) => ({ ...prev, subtopicId: subId }));
  };

  const handleChallengeTypeChange = (typeId: string) => {
    setChallengeType(typeId);
    setIsDirty(true);
    setCandidate((prev) => {
      let updated = { ...prev, challengeType: typeId };
      if (typeId === 'TRUE_FALSE') {
        updated.optionA = 'True';
        updated.optionB = 'False';
        updated.optionC = 'N/A';
        updated.optionD = 'N/A (True/False Question)';
        if (updated.correctAnswer !== 'A' && updated.correctAnswer !== 'B') {
          updated.correctAnswer = 'A';
        }
      } else if (typeId === 'YES_NO') {
        updated.optionA = 'Yes';
        updated.optionB = 'No';
        updated.optionC = 'N/A';
        updated.optionD = 'N/A (Yes/No Question)';
        if (updated.correctAnswer !== 'A' && updated.correctAnswer !== 'B') {
          updated.correctAnswer = 'A';
        }
      } else if (typeId === 'ABCD') {
        if (updated.optionC === 'N/A') updated.optionC = '';
        if (updated.optionD.startsWith('N/A')) updated.optionD = '';
      }
      return updated;
    });
    if (serverValidationResult) {
      setIsValidationStale(true);
    }
  };

  // 4. Duplicate Check
  const triggerDuplicateCheck = useCallback(async (text: string) => {
    if (!text || text.trim().length < 15) {
      setDuplicateMatches([]);
      return;
    }
    setIsCheckingDuplicate(true);
    try {
      const res = await apiClient.checkDuplicate(text);
      setDuplicateMatches(res.matches || []);
    } catch (err) {
      console.warn('Duplicate check error:', err);
    } finally {
      setIsCheckingDuplicate(false);
    }
  }, []);

  const updateCandidateField = (field: keyof StudioCandidate, value: any) => {
    setIsDirty(true);
    setCandidate((prev) => {
      const updated = { ...prev, [field]: value };

      const candidateForVal: Partial<QuestionCandidate> = {
        content: updated.questionText,
        option_a: updated.optionA,
        option_b: updated.optionB,
        option_c: updated.optionC,
        option_d: updated.optionD,
        correct_answer: updated.correctAnswer,
        explanation: updated.explanation,
        language: updated.language,
        question_style: questionStyle,
        real_world_context: updated.realLifeContext,
      };
      setClientReport(CandidateValidator.validate(candidateForVal));

      if (field === 'questionText') {
        triggerDuplicateCheck(value);
      }

      if (!isInternalUpdateRef.current && serverValidationResult) {
        setIsValidationStale(true);
      }

      return updated;
    });
    setHasCandidate(true);
  };

  // 5. AI Candidate Generation
  const handleGenerate = async () => {
    setErrorMessage(null);
    setSavedSuccessInfo(null);
    setIsGenerating(true);
    setServerValidationResult(null);
    setIsValidationStale(false);

    const startTime = Date.now();
    try {
      const payload: GenerateCandidateInput = {
        categoryId: selectedCategory,
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
        difficulty: difficulty as any,
        language,
        questionStyle: questionStyle as any,
        realWorldContext: realLifeContext,
        customInstructions: customInstructions.trim() || undefined,
      };

      const res = await apiClient.generateAiQuestion(payload);
      const generated = res.candidate;

      isInternalUpdateRef.current = true;
      const newStudioCandidate: StudioCandidate = {
        questionText: generated.content,
        optionA: generated.option_a,
        optionB: generated.option_b,
        optionC: generated.option_c,
        optionD: generated.option_d,
        correctAnswer: generated.correct_answer,
        explanation: generated.explanation,
        categoryId: selectedCategory,
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
        difficulty,
        challengeType,
        presentationType,
        language: generated.language || language,
        realLifeContext: generated.real_world_context || realLifeContext,
        tags: ['AI-Generated', 'Aptitude'],
        sourceModel: res.metadata?.modelUsed || aiStatus.model,
        generationLatencyMs: res.metadata?.generationDurationMs || res.metadata?.latencyMs || Date.now() - startTime,
        isFallback: Boolean(res.metadata?.fallbackUsed || res.metadata?.isMockFallback),
      };

      setCandidate(newStudioCandidate);
      setHasCandidate(true);
      setGenerationDuration(res.metadata?.generationDurationMs || res.metadata?.latencyMs || Date.now() - startTime);
      setIsFallbackMode(Boolean(res.metadata?.fallbackUsed || res.metadata?.isMockFallback));

      setClientReport(CandidateValidator.validate(generated));
      triggerDuplicateCheck(generated.content);
      isInternalUpdateRef.current = false;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate AI question candidate.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 6. AI Refinement Action
  const handleRefine = async (action: AiRefinementAction) => {
    if (!hasCandidate) return;

    setErrorMessage(null);
    setIsRefining(true);

    try {
      const activeAiCandidate: QuestionCandidate = {
        content: candidate.questionText,
        option_a: candidate.optionA,
        option_b: candidate.optionB,
        option_c: candidate.optionC,
        option_d: candidate.optionD,
        correct_answer: candidate.correctAnswer,
        explanation: candidate.explanation,
        difficulty: difficulty as DifficultyLevel,
        language: candidate.language,
        question_style: questionStyle,
        real_world_context: candidate.realLifeContext,
      };

      const payload: RefineCandidateInput = {
        action,
        currentCandidate: activeAiCandidate,
        promptModifier: customInstructions.trim() || undefined,
        targetLanguage: candidate.language,
      };

      const res = await apiClient.refineAiQuestion(payload);
      const refined = res.candidate;

      isInternalUpdateRef.current = true;
      setCandidate((prev) => ({
        ...prev,
        questionText: refined.content,
        optionA: refined.option_a,
        optionB: refined.option_b,
        optionC: refined.option_c,
        optionD: refined.option_d,
        correctAnswer: refined.correct_answer,
        explanation: refined.explanation,
        language: refined.language || prev.language,
        realLifeContext: refined.real_world_context || prev.realLifeContext,
      }));

      setClientReport(CandidateValidator.validate(refined));
      triggerDuplicateCheck(refined.content);

      if (serverValidationResult) {
        setIsValidationStale(true);
      }
      isInternalUpdateRef.current = false;
    } catch (err: any) {
      setErrorMessage(err?.message || `Refinement "${action}" failed.`);
    } finally {
      setIsRefining(false);
    }
  };

  // 7. Pre-Save Server Validation
  const handleServerValidate = async () => {
    if (!hasCandidate || !candidate.questionText.trim()) {
      setErrorMessage('Please enter question text before validating.');
      return;
    }

    setErrorMessage(null);
    setIsValidatingServer(true);

    try {
      const payloadToValidate = {
        questionText: candidate.questionText,
        options: {
          a: candidate.optionA,
          b: candidate.optionB,
          c: candidate.optionC,
          d: candidate.optionD,
        },
        correctAnswer: candidate.correctAnswer,
        explanation: candidate.explanation,
        categoryId: selectedCategory,
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
        difficulty: candidate.difficulty,
        challengeType: candidate.challengeType,
        presentationType: candidate.presentationType,
        language: candidate.language,
        realLifeContext: candidate.realLifeContext,
      };

      const res = await apiClient.validateCandidate(payloadToValidate);
      if (res.success && res.data) {
        setServerValidationResult(res.data);
        setIsValidationStale(false);
      } else {
        setErrorMessage('Server validation failed to return a result.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Server candidate validation failed.');
    } finally {
      setIsValidatingServer(false);
    }
  };

  // 8. Canonical Save
  const handleSaveQuestion = async () => {
    if (!hasCandidate || !candidate.questionText.trim()) {
      setErrorMessage('Cannot save an empty question candidate.');
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const idempotencyKey = `studio-${mode}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const created = await apiClient.createQuestionCanonical({
        creationMode: mode === 'ai' ? 'ai' : 'manual',
        categoryId: selectedCategory,
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
        difficulty: candidate.difficulty,
        challengeType: candidate.challengeType,
        presentationType: candidate.presentationType,
        language: candidate.language,
        realLifeContext: candidate.realLifeContext,
        questionText: candidate.questionText.trim(),
        options: {
          a: candidate.optionA.trim(),
          b: candidate.optionB.trim(),
          c: candidate.optionC.trim(),
          d: candidate.optionD.trim(),
        },
        correctAnswer: candidate.correctAnswer,
        explanation: candidate.explanation.trim(),
        tags: candidate.tags,
        idempotencyKey,
      });

      setSavedSuccessInfo({ id: created.id, status: created.status });
      setIsDirty(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save question to library.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetStudio = () => {
    if (hasCandidate && candidate.questionText.trim().length > 0) {
      if (!window.confirm('Are you sure you want to discard the active candidate?')) {
        return;
      }
    }

    setCandidate({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      categoryId: selectedCategory,
      topicId: selectedTopic,
      subtopicId: selectedSubtopic,
      difficulty,
      challengeType,
      presentationType,
      language,
      realLifeContext,
      tags: ['Aptitude', 'SpeedMath'],
    });
    setHasCandidate(false);
    setIsDirty(false);
    setClientReport(null);
    setServerValidationResult(null);
    setIsValidationStale(false);
    setDuplicateMatches([]);
    setSavedSuccessInfo(null);
    setErrorMessage(null);
  };

  const getSaveGateReason = (): string | null => {
    if (!candidate.questionText.trim()) return 'Question problem statement is required.';
    if (clientReport && !clientReport.isValid) return 'Fix blocking client validation errors before saving.';
    if (isSaving) return 'Save operation in progress...';
    if (isGenerating || isRefining) return 'AI operation in progress...';
    if (isValidatingServer) return 'Server validation in progress...';
    return null;
  };
  const saveGateReason = getSaveGateReason();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <PageHeader
        title="Unified Question Studio"
        description="Single coherent workspace for manual authoring, AI generation, pre-save multi-model validation, and canonical publishing."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetStudio}
              icon={RotateCcw}
            >
              Reset Workspace
            </Button>
            {savedSuccessInfo && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/questions/${savedSuccessInfo.id}`)}
                icon={ArrowRight}
              >
                View Saved Question ({savedSuccessInfo.id})
              </Button>
            )}
          </div>
        }
      />

      {/* Global Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Operation Exception</h4>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-500 hover:text-rose-800 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Global Success Banner */}
      {savedSuccessInfo && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Question Saved to Library</h4>
              <p className="text-xs text-emerald-700">
                Assigned ID: <span className="font-mono font-bold">{savedSuccessInfo.id}</span> | Status:{' '}
                <span className="font-semibold">{savedSuccessInfo.status}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetStudio}
              className="bg-white hover:bg-emerald-100 border-emerald-300 text-emerald-900"
            >
              Create Another
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/questions/${savedSuccessInfo.id}`)}
              icon={ArrowRight}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Open Question
            </Button>
          </div>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleModeSwitch('ai')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'ai'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Generation & Studio Mode</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('manual')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'manual'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Manual Authoring Mode</span>
          </button>
        </div>

        {/* AI Model Indicator Pill */}
        {mode === 'ai' && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Engine: {aiStatus.model}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SHARED PEDAGOGICAL CONFIGURATION */}
        <div className="lg:col-span-5 space-y-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold">Pedagogical Configuration</h3>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
              Shared Model
            </span>
          </div>

          {/* Taxonomy Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Subject Category</span>
              {loadingTaxonomy && <span className="text-[10px] text-slate-400 animate-pulse">Loading taxonomy...</span>}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={loadingTaxonomy}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.id})
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  disabled={loadingTaxonomy || currentTopics.length === 0}
                  className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                >
                  {currentTopics.map((top: any) => (
                    <option key={top.id} value={top.id}>
                      {top.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">Subtopic</label>
                <select
                  value={selectedSubtopic}
                  onChange={(e) => handleSubtopicChange(e.target.value)}
                  disabled={loadingTaxonomy || currentSubtopics.length === 0}
                  className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="RANDOM">🎲 RANDOM (Random Subtopic from Topic)</option>
                  {currentSubtopics.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Core Dimensions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Target Difficulty</label>
              <select
                value={candidate.difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  updateCandidateField('difficulty', e.target.value);
                }}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              >
                {QUESTION_CREATION_CONFIG.difficulties.map((diff) => (
                  <option key={diff.id} value={diff.id}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Challenge Type</label>
              <select
                value={candidate.challengeType}
                onChange={(e) => handleChallengeTypeChange(e.target.value)}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              >
                {QUESTION_CREATION_CONFIG.challengeTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Presentation Type</label>
              <select
                value={candidate.presentationType}
                onChange={(e) => {
                  setPresentationType(e.target.value);
                  updateCandidateField('presentationType', e.target.value);
                }}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              >
                {QUESTION_CREATION_CONFIG.presentationTypes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Language</label>
              <select
                value={candidate.language}
                onChange={(e) => {
                  const lang = e.target.value as QuestionLanguage;
                  setLanguage(lang);
                  updateCandidateField('language', lang);
                }}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              >
                {QUESTION_CREATION_CONFIG.languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Context Hooks */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Real-Life Context Category</span>
              <span className="text-[10px] text-slate-400">12 Catalog Categories</span>
            </label>
            <select
              value={realLifeContext}
              onChange={(e) => {
                setRealLifeContext(e.target.value);
                updateCandidateField('realLifeContext', e.target.value);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
            >
              {QUESTION_CREATION_CONFIG.realLifeContexts.map((ctx) => (
                <option key={ctx.id} value={ctx.name}>
                  {ctx.name}
                </option>
              ))}
            </select>

            <div className="pt-1">
              <label className="text-[11px] font-semibold text-slate-600">Quick Scenario Hooks</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {REAL_WORLD_HOOK_SUGGESTIONS.map((hook) => (
                  <button
                    key={hook}
                    type="button"
                    onClick={() => {
                      setRealLifeContext(hook);
                      updateCandidateField('realLifeContext', hook);
                    }}
                    className={`text-[10px] px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                      realLifeContext === hook
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {hook}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI-Mode Specific Controls */}
          {mode === 'ai' && (
            <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in">
              <div>
                <label className="text-xs font-semibold text-slate-700">Question Style</label>
                <select
                  value={questionStyle}
                  onChange={(e) => setQuestionStyle(e.target.value)}
                  className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value={QuestionStyle.REAL_WORLD_SCENARIO}>Real-World Practical Scenario</option>
                  <option value={QuestionStyle.SPEED_MATH_TRICK}>Speed Math / Burra Trick Probe</option>
                  <option value={QuestionStyle.TRICK_QUESTION}>Misdirection Trap / High-Distractor</option>
                  <option value={QuestionStyle.DATA_INTERPRETATION}>Data Interpretation & Chart Analysis</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Custom AI Generation Guidance</label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={2}
                  placeholder="e.g., Include a trick option for calculating discount stacking on UPI payment..."
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleGenerate}
                isLoading={isGenerating}
                icon={Sparkles}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm mt-2"
              >
                {hasCandidate ? 'Regenerate Fresh Candidate' : 'Generate Question Candidate'}
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: CANDIDATE EDITOR WORKSPACE */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold">Candidate Editor Workspace</h3>
              </div>

              <div className="flex items-center gap-2">
                {isDirty && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Unsaved Edits
                  </span>
                )}

                {generationDuration && (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {generationDuration}ms
                  </span>
                )}

                {isFallbackMode && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Pedagogical Fallback
                  </span>
                )}

                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {mode === 'ai' ? 'AI Candidate' : 'Manual Draft'}
                </span>
              </div>
            </div>

            {/* AI Refinement Modifiers */}
            {mode === 'ai' && hasCandidate && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                  <span className="flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                    AI Refinement Modifiers
                  </span>
                  {isRefining && <span className="text-[10px] text-indigo-600 animate-pulse">Refining candidate...</span>}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.INCREASE_DIFFICULTY)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                  >
                    Make Harder
                  </button>
                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.DECREASE_DIFFICULTY)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                  >
                    Make Easier
                  </button>
                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.IMPROVE_OPTIONS)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                  >
                    Improve Options
                  </button>
                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.MAKE_REALISTIC)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                  >
                    Make Realistic
                  </button>
                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.IMPROVE_EXPLANATION)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                  >
                    Improve Solution
                  </button>
                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.IMPROVE_TELUGU)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                  >
                    Improve Telugu
                  </button>
                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.SIMPLIFY_LANGUAGE)}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                  >
                    Simplify Language
                  </button>
                </div>
              </div>
            )}

            {/* Candidate Form Fields */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">
                    Question Problem Statement <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {candidate.questionText.length} characters
                  </span>
                </div>
                <textarea
                  value={candidate.questionText}
                  onChange={(e) => updateCandidateField('questionText', e.target.value)}
                  rows={4}
                  placeholder="Enter clear, realistic problem statement..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 leading-relaxed placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-medium"
                />
              </div>

              {/* Options A-D */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Options & Declared Answer <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Select radio button for correct answer</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                      candidate.correctAnswer === 'A'
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={candidate.correctAnswer === 'A'}
                      onChange={() => updateCandidateField('correctAnswer', 'A')}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 w-4">A:</span>
                    <input
                      type="text"
                      value={candidate.optionA}
                      onChange={(e) => updateCandidateField('optionA', e.target.value)}
                      placeholder="Option A text"
                      className="w-full text-xs font-medium text-slate-900 bg-transparent border-none focus:outline-hidden"
                    />
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                      candidate.correctAnswer === 'B'
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={candidate.correctAnswer === 'B'}
                      onChange={() => updateCandidateField('correctAnswer', 'B')}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 w-4">B:</span>
                    <input
                      type="text"
                      value={candidate.optionB}
                      onChange={(e) => updateCandidateField('optionB', e.target.value)}
                      placeholder="Option B text"
                      className="w-full text-xs font-medium text-slate-900 bg-transparent border-none focus:outline-hidden"
                    />
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                      candidate.challengeType === 'TRUE_FALSE' || candidate.challengeType === 'YES_NO'
                        ? 'bg-slate-100 border-slate-200 opacity-50'
                        : candidate.correctAnswer === 'C'
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctAnswer"
                      disabled={candidate.challengeType === 'TRUE_FALSE' || candidate.challengeType === 'YES_NO'}
                      checked={candidate.correctAnswer === 'C'}
                      onChange={() => updateCandidateField('correctAnswer', 'C')}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 w-4">C:</span>
                    <input
                      type="text"
                      disabled={candidate.challengeType === 'TRUE_FALSE' || candidate.challengeType === 'YES_NO'}
                      value={candidate.optionC}
                      onChange={(e) => updateCandidateField('optionC', e.target.value)}
                      placeholder={
                        candidate.challengeType === 'TRUE_FALSE' || candidate.challengeType === 'YES_NO'
                          ? 'Not required'
                          : 'Option C text'
                      }
                      className="w-full text-xs font-medium text-slate-900 bg-transparent border-none focus:outline-hidden disabled:bg-transparent"
                    />
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                      candidate.challengeType === 'TRUE_FALSE' || candidate.challengeType === 'YES_NO'
                        ? 'bg-slate-100 border-slate-200 opacity-50'
                        : candidate.correctAnswer === 'D'
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctAnswer"
                      disabled={candidate.challengeType === 'TRUE_FALSE' || candidate.challengeType === 'YES_NO'}
                      checked={candidate.correctAnswer === 'D'}
                      onChange={() => updateCandidateField('correctAnswer', 'D')}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 w-4">D:</span>
                    <input
                      type="text"
                      disabled={candidate.challengeType === 'TRUE_FALSE' || candidate.challengeType === 'YES_NO'}
                      value={candidate.optionD}
                      onChange={(e) => updateCandidateField('optionD', e.target.value)}
                      placeholder={
                        candidate.challengeType === 'TRUE_FALSE' || candidate.challengeType === 'YES_NO'
                          ? 'Not required'
                          : 'Option D text'
                      }
                      className="w-full text-xs font-medium text-slate-900 bg-transparent border-none focus:outline-hidden disabled:bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">
                    Step-by-Step Explanation & Speed Trick <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {candidate.explanation.length} characters
                  </span>
                </div>
                <textarea
                  value={candidate.explanation}
                  onChange={(e) => updateCandidateField('explanation', e.target.value)}
                  rows={4}
                  placeholder="Provide step-by-step math proof and a dedicated Burra Speed Trick..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 leading-relaxed placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Duplicate Matches Box */}
            {duplicateMatches.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Potential Duplicate Question Detected ({duplicateMatches.length} match)</span>
                </div>
                {duplicateMatches.slice(0, 2).map((match: any, idx: number) => (
                  <p key={idx} className="text-[11px] text-amber-800 pl-6">
                    • Match with <span className="font-mono font-semibold">{match.id}</span> (Similarity:{' '}
                    <span className="font-semibold">{Math.round((match.score || 0) * 100)}%</span>): &quot;
                    {match.questionText || match.content}&quot;
                  </p>
                ))}
              </div>
            )}

            {/* VALIDATION PANEL */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900">Validation Engine</h4>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleServerValidate}
                  isLoading={isValidatingServer}
                  icon={FileCheck}
                  className="bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-50"
                >
                  Run Multi-Model Validation
                </Button>
              </div>

              {/* Client-Side Real-Time Report Pills */}
              {clientReport && (
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      clientReport.isValid
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    Client Sanity: {clientReport.isValid ? 'PASS' : 'FAIL'}
                  </span>

                  {clientReport.mathematicalVerification && (
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-full ${
                        clientReport.mathematicalVerification.status === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      Math: {clientReport.mathematicalVerification.status}
                    </span>
                  )}

                  {clientReport.errors.length > 0 && (
                    <span className="text-rose-700 font-medium">
                      {clientReport.errors.length} error(s)
                    </span>
                  )}
                  {clientReport.warnings.length > 0 && (
                    <span className="text-amber-700 font-medium">
                      {clientReport.warnings.length} warning(s)
                    </span>
                  )}
                </div>
              )}

              {/* Client Error Messages */}
              {clientReport && clientReport.errors.length > 0 && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                  {clientReport.errors.map((err, idx) => (
                    <p key={idx} className="text-[11px] text-rose-800 font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* STALE VALIDATION BANNER */}
              {isValidationStale && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900 font-semibold animate-in fade-in">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Changes detected — server validation required again.
                  </span>
                  <button
                    type="button"
                    onClick={handleServerValidate}
                    className="text-[11px] text-amber-900 underline hover:text-amber-950 font-bold cursor-pointer"
                  >
                    Re-Validate
                  </button>
                </div>
              )}

              {/* Server Validation Results */}
              {serverValidationResult && !isValidationStale && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          serverValidationResult.status === QuestionValidationStatus.VALID
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : serverValidationResult.status === QuestionValidationStatus.NEEDS_REVIEW
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        Server Validation: {serverValidationResult.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Score: {Math.round((serverValidationResult.confidenceScore || 0) * 100)}%
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {serverValidationResult.id}
                    </span>
                  </div>

                  {serverValidationResult.errors && serverValidationResult.errors.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-rose-800">Errors:</span>
                      {serverValidationResult.errors.map((e, idx) => (
                        <p key={idx} className="text-[11px] text-rose-700 pl-2">
                          • {e}
                        </p>
                      ))}
                    </div>
                  )}

                  {serverValidationResult.warnings && serverValidationResult.warnings.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-amber-800">Warnings:</span>
                      {serverValidationResult.warnings.map((w, idx) => (
                        <p key={idx} className="text-[11px] text-amber-700 pl-2">
                          • {w}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetStudio}
                  icon={Trash2}
                >
                  Clear / Discard Draft
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerDuplicateCheck(candidate.questionText)}
                  isLoading={isCheckingDuplicate}
                  disabled={!candidate.questionText.trim() || candidate.questionText.trim().length < 15}
                  icon={Search}
                  className="text-xs"
                >
                  Check Duplicates
                </Button>
              </div>

              <div className="flex items-center gap-3">
                {saveGateReason && (
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {saveGateReason}
                  </span>
                )}

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSaveQuestion}
                  isLoading={isSaving}
                  disabled={Boolean(saveGateReason)}
                  icon={Save}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold shadow-xs cursor-pointer"
                >
                  Save Question to Library
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
