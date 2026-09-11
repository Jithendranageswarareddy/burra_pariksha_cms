/**
 * BURRA PARIKSHA CMS - Gemini AI Question Studio
 * Phase 4: Gemini AI Question Studio
 * 
 * Interactive studio for drafting, refining, validating, duplicate-checking,
 * and saving aptitude questions with strict human-in-the-loop controls.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Wand2,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Sliders,
  FileCheck,
  Zap,
  Info,
  BookmarkPlus,
  ArrowRight,
  HelpCircle,
  Languages,
  Layers,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { apiClient } from '../lib/api-client';
import {
  Category,
  DifficultyLevel,
  QuestionLanguage,
  QuestionStyle,
  QuestionStatus,
  VideoProductionStatus,
} from '../types';
import {
  AiRefinementAction,
  GenerateCandidateInput,
  QuestionCandidate,
  RefineCandidateInput,
} from '../lib/ai/types';
import { CandidateValidator } from '../lib/ai/validators/candidate.validator';

const REAL_WORLD_HOOK_SUGGESTIONS = [
  'Metro escalator commuter rush hour',
  'UPI festive shopping cashback',
  'Cricket run-rate chase in last 5 overs',
  'E-commerce delivery courier speed & battery drain',
  'Monthly salary savings vs inflation bracket',
  'Train overtaking on parallel tracks',
  'Water tank leakage & dual pump refill',
];

export const QuestionGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL Query Parameters for deep-linking from Content Calendar / Plans
  const queryPlanId = searchParams.get('planId') || searchParams.get('plan');
  const queryCategory = searchParams.get('categoryId') || searchParams.get('category') || searchParams.get('cat');
  const queryTopic = searchParams.get('topicId') || searchParams.get('topic');
  const querySubtopic = searchParams.get('subtopicId') || searchParams.get('subtopic');
  const queryDifficulty = searchParams.get('difficulty');
  const queryLanguage = searchParams.get('language') || searchParams.get('lang');
  const queryQuestionStyle = searchParams.get('questionStyle') || searchParams.get('style');
  const queryContext = searchParams.get('realWorldContext') || searchParams.get('context');

  // ----------------------------------------------------
  // 1. Taxonomy & AI System State
  // ----------------------------------------------------
  const [taxonomyTree, setTaxonomyTree] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [aiStatus, setAiStatus] = useState<{ isConfigured: boolean; model: string }>({
    isConfigured: false,
    model: 'gemini-3.1-flash-lite',
  });
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

  // Generation parameters state
  const [selectedCategory, setSelectedCategory] = useState<string>(queryCategory || 'CAT-QA');
  const [selectedTopic, setSelectedTopic] = useState<string>(queryTopic || 'TOP-QA-01');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>(querySubtopic || 'SUB-02');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    (queryDifficulty as DifficultyLevel) || DifficultyLevel.MEDIUM
  );
  const [language, setLanguage] = useState<QuestionLanguage>(
    (queryLanguage as QuestionLanguage) || QuestionLanguage.ENGLISH
  );
  const [questionStyle, setQuestionStyle] = useState<string>(
    queryQuestionStyle || QuestionStyle.REAL_WORLD_SCENARIO
  );
  const [realWorldContext, setRealWorldContext] = useState<string>(
    queryContext || 'Metro escalator commuter rush hour'
  );
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // ----------------------------------------------------
  // 2. Candidate Editor State (Active UI State as Source of Truth)
  // ----------------------------------------------------
  const [candidate, setCandidate] = useState<QuestionCandidate | null>(null);
  const [hasCandidate, setHasCandidate] = useState<boolean>(false);

  // Generation & Refinement UI State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [activeRefinementAction, setActiveRefinementAction] = useState<string | null>(null);
  const [generationDuration, setGenerationDuration] = useState<number | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);

  // Duplicate Check State
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false);

  // Save State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccessInfo, setSavedSuccessInfo] = useState<{ id: string; status: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ----------------------------------------------------
  // 3. Initial Load: Taxonomy & AI Status
  // ----------------------------------------------------
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
        console.error('Failed to initialize AI Studio:', err);
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

  // Update topic & subtopic when category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const cat = taxonomyTree.find((c: any) => c.id === catId);
    if (cat && cat.topics && cat.topics.length > 0) {
      const newTopic = cat.topics[0];
      setSelectedTopic(newTopic.id);
      if (newTopic.subtopics && newTopic.subtopics.length > 0) {
        setSelectedSubtopic(newTopic.subtopics[0].id);
      } else {
        setSelectedSubtopic('SUB-GEN');
      }
    }
  };

  const handleTopicChange = (topId: string) => {
    setSelectedTopic(topId);
    const top = currentTopics.find((t: any) => t.id === topId);
    if (top && top.subtopics && top.subtopics.length > 0) {
      setSelectedSubtopic(top.subtopics[0].id);
    } else {
      setSelectedSubtopic('SUB-GEN');
    }
  };

  // ----------------------------------------------------
  // 4. Duplicate Check (Debounced)
  // ----------------------------------------------------
  const triggerDuplicateCheck = useCallback(async (text: string) => {
    if (!text || text.trim().length < 15) {
      setDuplicateMatches([]);
      return;
    }
    try {
      setIsCheckingDuplicate(true);
      const res = await apiClient.checkDuplicate(text);
      setDuplicateMatches(res.matches || []);
    } catch (err) {
      console.warn('Duplicate check error:', err);
    } finally {
      setIsCheckingDuplicate(false);
    }
  }, []);

  useEffect(() => {
    if (!candidate || !candidate.content) return;
    const timer = setTimeout(() => {
      triggerDuplicateCheck(candidate.content);
    }, 400);
    return () => clearTimeout(timer);
  }, [candidate?.content, triggerDuplicateCheck]);

  // ----------------------------------------------------
  // 5. Generate Candidate Action
  // ----------------------------------------------------
  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      setSavedSuccessInfo(null);

      const categoryName = categories.find((c) => c.id === selectedCategory)?.name || selectedCategory;
      const topicName = currentTopics.find((t: any) => t.id === selectedTopic)?.name || selectedTopic;
      const subtopicName = currentSubtopics.find((s: any) => s.id === selectedSubtopic)?.name || selectedSubtopic;

      const input: GenerateCandidateInput = {
        categoryId: selectedCategory,
        categoryName,
        topicId: selectedTopic,
        topicName,
        subtopicId: selectedSubtopic,
        subtopicName,
        difficulty,
        language,
        questionStyle,
        realWorldContext,
        customInstructions,
      };

      const result = await apiClient.generateAiQuestion(input);
      const isFallback = Boolean(result.metadata.isMockFallback);
      setCandidate(result.candidate);
      setHasCandidate(true);
      setGenerationDuration(result.metadata.generationDurationMs);
      setIsFallbackMode(isFallback);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate question candidate with Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ----------------------------------------------------
  // 6. Refine Candidate Action (Administrator UI state as single source of truth)
  // ----------------------------------------------------
  const handleRefine = async (action: AiRefinementAction, customModifier?: string) => {
    if (!candidate) return;

    try {
      setIsRefining(true);
      setActiveRefinementAction(action);
      setErrorMessage(null);

      const input: RefineCandidateInput = {
        action,
        currentCandidate: candidate,
        promptModifier: customModifier,
        targetDifficulty:
          action === AiRefinementAction.INCREASE_DIFFICULTY
            ? DifficultyLevel.HARD
            : action === AiRefinementAction.DECREASE_DIFFICULTY
            ? DifficultyLevel.EASY
            : undefined,
        targetLanguage: action === AiRefinementAction.IMPROVE_TELUGU ? QuestionLanguage.TELUGU : undefined,
      };

      const result = await apiClient.refineAiQuestion(input);
      setCandidate(result.candidate);
      setGenerationDuration(result.metadata.generationDurationMs);
      setIsFallbackMode(Boolean(result.metadata.isMockFallback));
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to apply refinement "${action}".`);
    } finally {
      setIsRefining(false);
      setActiveRefinementAction(null);
    }
  };

  // ----------------------------------------------------
  // 7. Save Question to Google Sheets Library
  // ----------------------------------------------------
  const handleSaveQuestion = async () => {
    if (!candidate) return;

    const validation = CandidateValidator.validate(candidate);
    if (!validation.isValid) {
      setErrorMessage(`Please fix validation issues before saving: ${validation.errors.join('; ')}`);
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const idempotencyKey = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const created = await apiClient.createQuestionCanonical({
        creationMode: 'ai',
        categoryId: candidate.taxonomy?.categoryId || selectedCategory,
        topicId: candidate.taxonomy?.topicId || selectedTopic,
        subtopicId: candidate.taxonomy?.subtopicId || selectedSubtopic,
        difficulty: candidate.difficulty,
        questionText: candidate.content,
        options: {
          a: candidate.option_a,
          b: candidate.option_b,
          c: candidate.option_c,
          d: candidate.option_d,
        },
        correctAnswer: candidate.correct_answer,
        explanation: candidate.explanation,
        realLifeContext: candidate.real_world_context || realWorldContext,
        language: candidate.language || language,
        tags: [candidate.language, isFallbackMode ? 'FALLBACK_ENGINE' : 'AI_STUDIO'],
        source: isFallbackMode ? 'Pedagogical Fallback Engine' : 'Gemini AI Studio',
        aiPromptUsed: isFallbackMode
          ? `[Pedagogical Fallback] Topic: ${candidate.taxonomy?.topicName || selectedTopic} | Diff: ${candidate.difficulty} | Lang: ${candidate.language}`
          : `[Gemini ${aiStatus.model}] Topic: ${candidate.taxonomy?.topicName || selectedTopic} | Diff: ${candidate.difficulty} | Lang: ${candidate.language}`,
        idempotencyKey,
      });

      setSavedSuccessInfo({
        id: created.id,
        status: created.status,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save question to Google Sheets.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Candidate validation evaluation
  const validationReport = candidate ? CandidateValidator.validate(candidate) : { isValid: true, errors: [], warnings: [] };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <PageHeader
        title="Gemini AI Question Studio"
        description="Craft, calibrate, and refine high-retention aptitude questions for Burra Pariksha with Gemini AI and strict human-in-the-loop review."
        badge={
          <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            {aiStatus.isConfigured ? aiStatus.model : 'Pedagogical Engine Active'}
          </span>
        }
      />

      {/* Content Plan Context Banner (if deep-linked from Content Calendar) */}
      {queryPlanId && (
        <div className="p-4 bg-indigo-950/70 text-indigo-100 rounded-xl border border-indigo-500/40 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-900/60 rounded-lg text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  Plan: {queryPlanId}
                </span>
                <span className="text-xs text-indigo-300 font-semibold">Content Plan Handoff Active</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Parameters pre-calibrated from editorial calendar. Human administrator validation and review is required before saving to the question bank.
              </p>
            </div>
          </div>
          <Link
            to="/planning"
            className="text-xs px-3 py-1.5 bg-indigo-800/60 hover:bg-indigo-700 text-white rounded-lg border border-indigo-500/30 font-medium shrink-0"
          >
            Return to Planning Hub
          </Link>
        </div>
      )}

      {/* Persistent Status & Guardrail Notice */}
      <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-white tracking-wide uppercase">
              Phase 4 Human Authority Guardrail
            </p>
            <p className="text-xs text-slate-300">
              AI-generated candidates remain in memory until explicitly saved. Gemini never auto-approves or auto-queues questions.
              Saving assigns a permanent ID from <code className="text-indigo-300 font-mono">SEQUENCES</code> with status <span className="text-amber-300 font-bold">GENERATED</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300">
            <span className={`w-2 h-2 rounded-full ${aiStatus.isConfigured ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span>{aiStatus.isConfigured ? 'Live Gemini SDK' : 'Fallback Simulator'}</span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-xs text-rose-900 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-950">Action Blocked</p>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 font-bold text-sm px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Save Success Alert */}
      {savedSuccessInfo && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-sm animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-950">
                Successfully Saved Question #{savedSuccessInfo.id} to Google Sheets!
              </p>
              <p className="text-emerald-800 mt-0.5">
                Initial workflow status registered as <span className="font-semibold text-emerald-900 font-mono">GENERATED</span> & video status <span className="font-semibold font-mono">NOT_STARTED</span>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link to={`/questions/${savedSuccessInfo.id}`}>
              <Button variant="primary" size="sm" icon={ArrowRight} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                Open in Library
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSavedSuccessInfo(null)}
              className="w-full sm:w-auto"
            >
              Continue Studio
            </Button>
          </div>
        </div>
      )}

      {/* Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Generation Parameters (5 Cols)                  */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Pedagogical Configuration</h3>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              SHEETS TAXONOMY
            </span>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Aptitude Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={loadingTaxonomy || isGenerating}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Topic Area</label>
            <select
              value={selectedTopic}
              onChange={(e) => handleTopicChange(e.target.value)}
              disabled={loadingTaxonomy || isGenerating}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {currentTopics.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>

          {/* Subtopic */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Subtopic Division</label>
            <select
              value={selectedSubtopic}
              onChange={(e) => setSelectedSubtopic(e.target.value)}
              disabled={loadingTaxonomy || isGenerating}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="RANDOM">🎲 RANDOM (Random Subtopic from Topic)</option>
              {currentSubtopics.length > 0 ? (
                currentSubtopics.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))
              ) : (
                <option value="SUB-GEN">General Concept Division</option>
              )}
            </select>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Target Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { lvl: DifficultyLevel.EASY, label: 'Easy', desc: '1-2 Steps' },
                { lvl: DifficultyLevel.MEDIUM, label: 'Medium', desc: 'Core Exam' },
                { lvl: DifficultyLevel.HARD, label: 'Hard', desc: 'Trap / Multi-step' },
              ].map(({ lvl, label, desc }) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  disabled={isGenerating}
                  className={`py-2 px-2 text-center rounded-lg border transition-all ${
                    difficulty === lvl
                      ? lvl === DifficultyLevel.EASY
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : lvl === DifficultyLevel.MEDIUM
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold">{label}</p>
                  <p className={`text-[10px] ${difficulty === lvl ? 'text-white/80' : 'text-slate-400'}`}>{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Target Language</span>
              <span className="text-[10px] text-slate-500 font-mono">Telugu & English</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { lang: QuestionLanguage.ENGLISH, label: 'English', native: 'Professional Phrasing' },
                { lang: QuestionLanguage.TELUGU, label: 'Telugu', native: 'సహజ తెలుగు (Natural Spoken)' },
              ].map(({ lang, label, native }) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  disabled={isGenerating}
                  className={`py-2 px-3 text-left rounded-lg border transition-all ${
                    language === lang
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold">{label}</p>
                  <p className={`text-[10px] truncate ${language === lang ? 'text-purple-100' : 'text-slate-400'}`}>
                    {native}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Question Style */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Question Style</label>
            <select
              value={questionStyle}
              onChange={(e) => setQuestionStyle(e.target.value)}
              disabled={isGenerating}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {Array.from(new Set(Object.values(QuestionStyle))).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Real-World Context & Quick Suggestions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Real-World Scenario / Hook</label>
            <input
              type="text"
              value={realWorldContext}
              onChange={(e) => setRealWorldContext(e.target.value)}
              placeholder="e.g. Metro escalator rush hour, Cricket run-rate chase..."
              disabled={isGenerating}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            <div className="pt-1">
              <p className="text-[10px] text-slate-400 font-semibold mb-1">Quick Hooks:</p>
              <div className="flex flex-wrap gap-1">
                {REAL_WORLD_HOOK_SUGGESTIONS.slice(0, 4).map((hook) => (
                  <button
                    key={hook}
                    type="button"
                    onClick={() => setRealWorldContext(hook)}
                    disabled={isGenerating}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors border border-slate-200"
                  >
                    {hook}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Prompt Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Specific Instructions (Optional)</span>
              <span className="text-[10px] text-slate-400">Sanitized Prompt</span>
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Include a speed shortcut, avoid fractions..."
              disabled={isGenerating}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={Wand2}
              isLoading={isGenerating}
              onClick={handleGenerate}
              className="w-full shadow-md text-sm font-bold bg-indigo-600 hover:bg-indigo-700"
            >
              {isGenerating ? 'Synthesizing with Gemini...' : 'Generate Question Candidate'}
            </Button>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1 font-mono">
              <span>Model: {aiStatus.model}</span>
              {generationDuration && <span>Last: {generationDuration}ms</span>}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Candidate Workspace & Refinements (7 Cols)     */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Candidate Editor Workspace</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {hasCandidate && (
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold flex items-center gap-1 border ${
                  isFallbackMode
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-purple-50 border-purple-300 text-purple-800'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isFallbackMode ? 'bg-amber-500' : 'bg-purple-600 animate-pulse'}`} />
                  {isFallbackMode ? 'Pedagogical Fallback Engine' : `Live Gemini (${aiStatus.model})`}
                </span>
              )}
              {hasCandidate ? (
                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  UNSAVED DRAFT
                </span>
              ) : (
                <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                  AWAITING GENERATION
                </span>
              )}
            </div>
          </div>

          {/* Empty State when no candidate generated yet */}
          {!hasCandidate && (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900">Ready to Draft Question Candidate</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Configure your subject domain, difficulty tier, and real-world story hook on the left, then click{' '}
                  <strong className="text-slate-700">"Generate Question Candidate"</strong>.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Wand2}
                onClick={handleGenerate}
                isLoading={isGenerating}
                className="mt-2"
              >
                Quick Draft Demo Question
              </Button>
            </div>
          )}

          {/* Active Candidate Editor */}
          {hasCandidate && candidate && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Fallback Mode Transparency Banner */}
              {isFallbackMode && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950 animate-in slide-in-from-top-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900">Generated via Pedagogical Fallback Engine</p>
                    <p className="text-amber-800 mt-0.5">
                      Gemini live API is currently in fallback mode. The draft below has been synthesized with verified arithmetic. Saving will accurately register the source as <strong>"Pedagogical Fallback Engine"</strong>.
                    </p>
                  </div>
                </div>
              )}
              {/* Live Duplicate Warning Banner */}
              {duplicateMatches.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-950 animate-in slide-in-from-top-1">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Potential Duplicate Detected in Question Library ({duplicateMatches.length} Match)</span>
                  </div>
                  <div className="space-y-1 pl-6">
                    {duplicateMatches.map((m: any) => (
                      <div key={m.questionId} className="flex items-start justify-between gap-2 text-[11px] bg-white/70 p-2 rounded border border-amber-200">
                        <div>
                          <p className="font-mono font-semibold text-slate-800">
                            {m.questionId} ({Math.round(m.similarity * 100)}% Similarity)
                          </p>
                          <p className="text-slate-600 line-clamp-1 italic">"{m.questionText}"</p>
                        </div>
                        <Link
                          to={`/questions/${m.questionId}`}
                          target="_blank"
                          className="shrink-0 text-indigo-600 hover:underline font-semibold"
                        >
                          View Question
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border text-xs bg-slate-50 border-slate-200 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {validationReport.isValid ? (
                    <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Passed Sanity Validation
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      {validationReport.errors.length} Validation Errors
                    </span>
                  )}

                  {/* Independent Mathematical Verification Badge */}
                  {validationReport.mathematicalVerification && (
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold flex items-center gap-1 ${
                        validationReport.mathematicalVerification.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : validationReport.mathematicalVerification.status === 'FAILED'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : validationReport.mathematicalVerification.status === 'NOT_APPLICABLE'
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      <span>Math: {validationReport.mathematicalVerification.status}</span>
                      {validationReport.mathematicalVerification.status === 'VERIFIED' && (
                        <span className="text-emerald-700 font-normal">
                          ({validationReport.mathematicalVerification.expectedValue} {validationReport.mathematicalVerification.expectedUnit || ''})
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                  <span>Language: <strong className="text-slate-800">{candidate.language}</strong></span>
                  <span>•</span>
                  <span>Diff: <strong className="text-slate-800">{candidate.difficulty}</strong></span>
                </div>
              </div>

              {/* Validation Error List (if any) */}
              {!validationReport.isValid && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-rose-950">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    Validation Errors ({validationReport.errors.length}):
                  </p>
                  {validationReport.errors.map((err, idx) => (
                    <p key={idx} className="flex items-center gap-1.5 pl-5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Validation Warnings List (if any) */}
              {validationReport.warnings && validationReport.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Pedagogical / Quality Insights ({validationReport.warnings.length}):
                  </p>
                  {validationReport.warnings.map((warn, idx) => (
                    <p key={idx} className="flex items-center gap-1.5 pl-5 text-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      {warn}
                    </p>
                  ))}
                </div>
              )}

              {/* Question Statement Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Question Statement / Problem Definition
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(candidate.content, 'content')}
                    className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-mono"
                  >
                    {copiedField === 'content' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'content' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={candidate.content}
                  onChange={(e) => setCandidate({ ...candidate, content: e.target.value })}
                  placeholder="Enter the complete question text..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed"
                />
              </div>

              {/* Options A, B, C, D Grid with Correct Answer Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Options & Correct Answer Selection
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Click badge to toggle correct answer
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'A', val: candidate.option_a, set: (v: string) => setCandidate({ ...candidate, option_a: v }) },
                    { key: 'B', val: candidate.option_b, set: (v: string) => setCandidate({ ...candidate, option_b: v }) },
                    { key: 'C', val: candidate.option_c, set: (v: string) => setCandidate({ ...candidate, option_c: v }) },
                    { key: 'D', val: candidate.option_d, set: (v: string) => setCandidate({ ...candidate, option_d: v }) },
                  ].map(({ key, val, set }) => {
                    const isSelected = candidate.correct_answer === key;
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setCandidate({ ...candidate, correct_answer: key as any })}
                          className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                          title={`Set option ${key} as correct answer`}
                        >
                          {key}
                        </button>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder={`Option ${key} text...`}
                          className="flex-1 bg-transparent border-0 text-xs text-slate-800 focus:outline-none font-medium"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pedagogical Explanation & Speed Trick */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Step-by-Step Solution & Video Speed Trick
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(candidate.explanation, 'explanation')}
                    className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-mono"
                  >
                    {copiedField === 'explanation' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'explanation' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={candidate.explanation}
                  onChange={(e) => setCandidate({ ...candidate, explanation: e.target.value })}
                  placeholder="Provide step-by-step mathematical reasoning and shortcut formula..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
                />
              </div>

              {/* ============================================================ */}
              {/* AI REFINEMENT ACTIONS TOOLBAR                                */}
              {/* ============================================================ */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    AI Tuning Modifiers (Single Source of Truth)
                  </p>
                  {isRefining && (
                    <span className="text-[10px] text-indigo-600 font-semibold animate-pulse font-mono">
                      Applying AI refinement...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      act: AiRefinementAction.REGENERATE,
                      label: 'Regenerate Fresh',
                      icon: RefreshCw,
                      tip: 'Draft fresh numbers & context',
                    },
                    {
                      act: AiRefinementAction.IMPROVE_OPTIONS,
                      label: 'Improve Options',
                      icon: Sliders,
                      tip: 'Smarter calculation traps',
                    },
                    {
                      act: AiRefinementAction.MAKE_REALISTIC,
                      label: 'More Realistic',
                      icon: Zap,
                      tip: 'Enrich real-world story',
                    },
                    {
                      act: AiRefinementAction.SIMPLIFY_LANGUAGE,
                      label: 'Simplify Text',
                      icon: FileCheck,
                      tip: 'Crisp, concise phrasing',
                    },
                    {
                      act: AiRefinementAction.IMPROVE_TELUGU,
                      label: 'Improve Telugu',
                      icon: Languages,
                      tip: 'Natural Telugu fluency',
                    },
                    {
                      act: AiRefinementAction.INCREASE_DIFFICULTY,
                      label: 'Make Harder',
                      icon: TrendingUp,
                      tip: 'Add multi-step conditions',
                    },
                    {
                      act: AiRefinementAction.DECREASE_DIFFICULTY,
                      label: 'Make Easier',
                      icon: Layers,
                      tip: 'Direct 1-2 step calculation',
                    },
                    {
                      act: AiRefinementAction.IMPROVE_EXPLANATION,
                      label: 'Speed Trick',
                      icon: HelpCircle,
                      tip: 'Add 60s video retention trick',
                    },
                  ].map(({ act, label, icon: Icon, tip }) => {
                    const isCurrentActive = activeRefinementAction === act;
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => handleRefine(act)}
                        disabled={isRefining || isGenerating}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          isCurrentActive
                            ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300'
                            : 'bg-slate-50 border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-200 text-slate-700'
                        }`}
                        title={tip}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isCurrentActive ? 'text-indigo-600 animate-spin' : 'text-slate-500'}`} />
                          <span className="text-xs font-semibold">{label}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{tip}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================ */}
              {/* FOOTER ACTIONS: Discard vs Save Question to Google Sheets    */}
              {/* ============================================================ */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => {
                    if (confirm('Discard current AI candidate? Unsaved edits will be lost.')) {
                      setCandidate(null);
                      setHasCandidate(false);
                      setDuplicateMatches([]);
                      setSavedSuccessInfo(null);
                    }
                  }}
                  disabled={isSaving}
                  className="w-full sm:w-auto text-slate-600"
                >
                  Discard Candidate
                </Button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="md"
                    icon={BookmarkPlus}
                    isLoading={isSaving}
                    disabled={!validationReport.isValid}
                    onClick={handleSaveQuestion}
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-md font-bold px-5"
                  >
                    {isSaving ? 'Saving to Google Sheets...' : 'Save Question to Library'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
