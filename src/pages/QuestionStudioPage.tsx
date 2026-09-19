/**
 * BURRA PARIKSHA CMS - AI Question Studio Workspace
 * 
 * Supports AI Generation, AI Refinement, and human candidate editing
 * while converging on a single Candidate Editor model and canonical save pipeline.
 * Includes pre-save server-side validation (POST /api/questions/validate-candidate)
 * and stale validation state tracking on material candidate edits.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
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
  ArrowUp,
  ArrowDown,
  Layers,
  HelpCircle,
  Languages,
  PenTool,
  Loader2,
  Check,
  Sparkle,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { QuestionWorkflowHeader } from '../components/questions/QuestionWorkflowHeader';
import { apiClient } from '../lib/api-client';
import {
  Category,
  DifficultyLevel,
  QuestionLanguage,
  QuestionConfigEntry,
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
import { MathVerificationResult } from '../lib/ai/validators/mathematical.validator';
import { QUESTION_CREATION_CONFIG } from '../config/question-creation.config';

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
  questionStyle?: string;
  generationMode?: string;
  tags: string[];
  // AI Metadata
  sourceModel?: string;
  generationLatencyMs?: number;
  isFallback?: boolean;
  mathematicalVerification?: MathVerificationResult;
}

export const QuestionStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [selectedCategory, setSelectedCategory] = useState<string>(queryCategory || '');
  const [selectedTopic, setSelectedTopic] = useState<string>(queryTopic || 'BP-TOP-001');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>(querySubtopic || 'BP-SUB-0001');
  const [difficulty, setDifficulty] = useState<string>(queryDifficulty || 'Intermediate');
  const [challengeType, setChallengeType] = useState<string>('ABCD');
  const [presentationType, setPresentationType] = useState<string>('Text');
  const [language, setLanguage] = useState<QuestionLanguage>(
    (queryLanguage as QuestionLanguage) || QuestionLanguage.TELUGU
  );
  const [questionStyle, setQuestionStyle] = useState<string>(
    queryQuestionStyle || 'STORY_BASED'
  );
  const [realLifeContext, setRealLifeContext] = useState<string>(
    queryContext || ''
  );
  const [customInstructions, setCustomInstructions] = useState<string>('');

  const formatDifficultyForUi = (diff?: string): string => {
    if (!diff) return 'Intermediate';
    const u = diff.trim().toUpperCase();
    if (u === 'MEDIUM' || u === 'INTERMEDIATE') return 'Intermediate';
    if (u === 'EASY') return 'Easy';
    if (u === 'HARD') return 'Hard';
    const match = QUESTION_CREATION_CONFIG.difficulties.find(
      (d) => d.id.toLowerCase() === diff.toLowerCase() || d.label.toLowerCase() === diff.toLowerCase()
    );
    return match ? match.id : diff;
  };

  // Real-Time QUESTION_CONFIG State (Creator-Managed Studio Configuration)
  const [realLifeContexts, setRealLifeContexts] = useState<QuestionConfigEntry[]>([]);
  const [questionStyles, setQuestionStyles] = useState<QuestionConfigEntry[]>([]);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // 2. Candidate Editor State
  const [candidate, setCandidate] = useState<StudioCandidate>({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    categoryId: selectedCategory || undefined,
    topicId: selectedTopic,
    subtopicId: selectedSubtopic,
    difficulty: difficulty || 'Intermediate',
    challengeType: challengeType,
    presentationType: presentationType,
    language: language,
    realLifeContext: realLifeContext && realLifeContext !== 'RANDOM' ? realLifeContext : '',
    generationMode: (selectedSubtopic === 'RANDOM' || realLifeContext === 'RANDOM') ? 'RANDOM' : 'SUBTOPIC',
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
  const [hasCheckedDuplicate, setHasCheckedDuplicate] = useState<boolean>(false);

  // Save States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccessInfo, setSavedSuccessInfo] = useState<{ id: string; status: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Suppress marking validation stale during initial generation load
  const isInternalUpdateRef = useRef<boolean>(false);

  // FIX-PERF-001: Question Studio duplicate-check debounce refs & sequence tracker
  const duplicateCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const duplicateAbortControllerRef = useRef<AbortController | null>(null);
  const duplicateRequestIdRef = useRef<number>(0);

  // FIX-PERF-002: Question Studio validation decoupling refs & sequence tracker
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const validationRequestIdRef = useRef<number>(0);
  const loadStudioConfig = useCallback(async (isRefresh = false) => {
    try {
      setLoadingConfig(true);
      setConfigError(null);
      const res = await apiClient.getQuestionStudioConfig(isRefresh);

      if (!res || !Array.isArray(res.realLifeContexts) || !Array.isArray(res.questionStyles)) {
        throw new Error('Malformed configuration response received from server.');
      }
      if (res.realLifeContexts.length === 0 || res.questionStyles.length === 0) {
        throw new Error('QUESTION_CONFIG contains no active records.');
      }

      setRealLifeContexts(res.realLifeContexts);
      setQuestionStyles(res.questionStyles);

      // Resolve configured defaults (Story-Based Scenario is default question style)
      const defaultStyleCode =
        res.defaults?.questionStyle ||
        res.defaultQuestionStyle?.code ||
        res.questionStyles.find((s) => s.isDefault)?.code ||
        res.questionStyles[0]?.code ||
        '';

      const defaultContextLabel =
        res.defaults?.realLifeContext ||
        res.defaultRealLifeContext?.displayLabel ||
        res.defaultRealLifeContext?.code ||
        res.realLifeContexts.find((c) => c.isDefault)?.displayLabel ||
        res.realLifeContexts[0]?.displayLabel ||
        '';

      const defaultDifficulty = res.defaults?.difficulty || 'Intermediate';

      const activeStyle = queryQuestionStyle || defaultStyleCode;
      const activeContext = queryContext || defaultContextLabel;
      const activeDifficulty = queryDifficulty || defaultDifficulty;

      setQuestionStyle(activeStyle);
      setRealLifeContext(activeContext);
      setDifficulty(activeDifficulty);

      setCandidate((prev) => ({
        ...prev,
        questionStyle: activeStyle,
        difficulty: prev.difficulty || activeDifficulty,
        realLifeContext:
          prev.realLifeContext && prev.realLifeContext !== 'RANDOM'
            ? prev.realLifeContext
            : (activeContext !== 'RANDOM' ? activeContext : ''),
      }));
    } catch (err: any) {
      console.error('[QuestionStudio] Failed to load QUESTION_CONFIG:', err);
      const errMsg = err?.message || 'Production question configuration is unavailable.';
      setConfigError(errMsg);
      // Strictly do NOT fall back to old hardcoded arrays
      setRealLifeContexts([]);
      setQuestionStyles([]);
    } finally {
      setLoadingConfig(false);
    }
  }, [queryQuestionStyle, queryContext, queryDifficulty]);

  useEffect(() => {
    loadStudioConfig();
  }, [loadStudioConfig]);

  useEffect(() => {
    async function initStudio() {
      try {
        setLoadingTaxonomy(true);
        const [pureTree, aiInfo] = await Promise.all([
          apiClient.getPureTopicTree().catch(() => []),
          apiClient.getAiStatus().catch(() => ({ isConfigured: false, model: 'gemini-3.1-flash-lite' })),
        ]);

        let topicsList: any[] = pureTree;
        if (!topicsList || topicsList.length === 0) {
          const legacyTree = await apiClient.getTaxonomyTree().catch(() => []);
          const flattened: any[] = [];
          legacyTree.forEach((cat: any) => {
            if (cat.topics) {
              cat.topics.forEach((top: any) => {
                flattened.push({ ...top, categoryId: cat.id, categoryName: cat.name });
              });
            }
          });
          topicsList = flattened;
        }

        setTaxonomyTree(topicsList);
        setAiStatus(aiInfo);

        if (queryTopic) {
          setSelectedTopic(queryTopic);
          if (querySubtopic) setSelectedSubtopic(querySubtopic);
        } else if (topicsList && topicsList.length > 0) {
          const firstTopic = topicsList[0];
          setSelectedTopic(firstTopic.id);
          const firstSub = (firstTopic.subtopics || [])[0];
          if (firstSub) {
            setSelectedSubtopic(firstSub.id);
          }
        }
      } catch (err) {
        console.error('Failed to initialize Question Studio:', err);
      } finally {
        setLoadingTaxonomy(false);
      }
    }
    initStudio();
  }, [queryTopic, querySubtopic]);

  // Derived taxonomy helpers (Topic -> Subtopic direct mapping)
  const allTopics = useMemo(() => {
    if (Array.isArray(taxonomyTree)) {
      return taxonomyTree;
    }
    return [];
  }, [taxonomyTree]);

  const currentTopicData = useMemo(() => {
    return allTopics.find((t: any) => t.id === selectedTopic);
  }, [allTopics, selectedTopic]);

  const currentSubtopics = currentTopicData?.subtopics || [];

  const handleTopicChange = (topId: string) => {
    setSelectedTopic(topId);
    setCandidate((prev) => ({ ...prev, topicId: topId }));

    const top = allTopics.find((t: any) => t.id === topId);
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

  const handleQuestionStyleChange = (style: string) => {
    setQuestionStyle(style);
    updateCandidateField('questionStyle', style);
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

  // 4. Duplicate Check (FIX-PERF-001: 400ms debounce with AbortController)
  const triggerDuplicateCheck = useCallback(async (text: string, immediate = false) => {
    // Clear any pending debounced duplicate check timer
    if (duplicateCheckTimerRef.current) {
      clearTimeout(duplicateCheckTimerRef.current);
      duplicateCheckTimerRef.current = null;
    }

    if (!text || text.trim().length < 15) {
      // Abort any ongoing in-flight duplicate check request
      if (duplicateAbortControllerRef.current) {
        duplicateAbortControllerRef.current.abort();
        duplicateAbortControllerRef.current = null;
      }
      setDuplicateMatches([]);
      setHasCheckedDuplicate(false);
      setIsCheckingDuplicate(false);
      return;
    }

    const executeCheck = async () => {
      // Abort previous in-flight request
      if (duplicateAbortControllerRef.current) {
        duplicateAbortControllerRef.current.abort();
      }

      const controller = new AbortController();
      duplicateAbortControllerRef.current = controller;
      const currentRequestId = ++duplicateRequestIdRef.current;

      setIsCheckingDuplicate(true);
      setHasCheckedDuplicate(false);

      try {
        const res = await apiClient.checkDuplicate(text, undefined, { signal: controller.signal });
        // Only update state if this is still the most recent request
        if (currentRequestId === duplicateRequestIdRef.current) {
          setDuplicateMatches(res.matches || []);
          setHasCheckedDuplicate(true);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
          // Request was intentionally cancelled, ignore
          return;
        }
        console.warn('Duplicate check error:', err);
      } finally {
        if (currentRequestId === duplicateRequestIdRef.current) {
          setIsCheckingDuplicate(false);
          duplicateAbortControllerRef.current = null;
        }
      }
    };

    if (immediate) {
      await executeCheck();
    } else {
      duplicateCheckTimerRef.current = setTimeout(executeCheck, 400);
    }
  }, []);

  // FIX-PERF-002: Validation Decoupling Effect (250ms debounce)
  useEffect(() => {
    // If no candidate exists or problem statement is empty, reset validation report
    if (!hasCandidate || !candidate.questionText.trim()) {
      setClientReport(null);
      return;
    }

    const currentRequestId = ++validationRequestIdRef.current;
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }

    validationTimerRef.current = setTimeout(() => {
      const candidateForVal: Partial<QuestionCandidate> & { mathematicalVerification?: MathVerificationResult } = {
        content: candidate.questionText,
        option_a: candidate.optionA,
        option_b: candidate.optionB,
        option_c: candidate.optionC,
        option_d: candidate.optionD,
        correct_answer: candidate.correctAnswer,
        explanation: candidate.explanation,
        language: candidate.language,
        question_style: questionStyle,
        real_world_context: candidate.realLifeContext,
        mathematicalVerification: candidate.mathematicalVerification,
      };

      const report = CandidateValidator.validate(candidateForVal);
      if (currentRequestId === validationRequestIdRef.current) {
        setClientReport(report);
      }
    }, 250);

    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, [
    hasCandidate,
    candidate.questionText,
    candidate.optionA,
    candidate.optionB,
    candidate.optionC,
    candidate.optionD,
    candidate.correctAnswer,
    candidate.explanation,
    candidate.language,
    candidate.realLifeContext,
    candidate.mathematicalVerification,
    questionStyle,
  ]);

  // Clean up duplicate check timers and abort controllers on unmount
  useEffect(() => {
    return () => {
      if (duplicateCheckTimerRef.current) {
        clearTimeout(duplicateCheckTimerRef.current);
      }
      if (duplicateAbortControllerRef.current) {
        duplicateAbortControllerRef.current.abort();
      }
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, []);

  const updateCandidateField = (field: keyof StudioCandidate, value: any) => {
    setIsDirty(true);
    setCandidate((prev) => {
      const updated = { ...prev, [field]: value };

      if (!isInternalUpdateRef.current && serverValidationResult) {
        setIsValidationStale(true);
      }

      return updated;
    });

    if (field === 'questionText') {
      triggerDuplicateCheck(value);
    }

    setHasCandidate(true);
  };

  // 5. AI Candidate Generation
  const handleGenerate = async () => {
    if (configError) {
      setErrorMessage(`Cannot generate question: Production configuration is unavailable (${configError}).`);
      return;
    }
    setErrorMessage(null);
    setSavedSuccessInfo(null);
    setIsGenerating(true);
    setServerValidationResult(null);
    setIsValidationStale(false);

    const startTime = Date.now();
    try {
      const payload: GenerateCandidateInput = {
        categoryId: selectedCategory || undefined,
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
      const mathVerification = res.validation?.mathematicalVerification || (generated as any).mathematicalVerification;

      isInternalUpdateRef.current = true;
      const newStudioCandidate: StudioCandidate = {
        questionText: generated.content || (generated as any).questionText || (generated as any).question || '',
        optionA: generated.option_a,
        optionB: generated.option_b,
        optionC: generated.option_c,
        optionD: generated.option_d,
        correctAnswer: generated.correct_answer,
        explanation: generated.explanation,
        categoryId: selectedCategory || undefined,
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
        difficulty: formatDifficultyForUi(generated.difficulty || difficulty),
        challengeType,
        presentationType,
        language: generated.language || language,
        realLifeContext:
          (generated.real_world_context && generated.real_world_context.toUpperCase() !== 'RANDOM')
            ? generated.real_world_context
            : (realLifeContext === 'RANDOM' ? '' : realLifeContext),
        questionStyle: candidate.questionStyle || questionStyle || 'STORY_BASED',
        generationMode: (selectedSubtopic === 'RANDOM' || realLifeContext === 'RANDOM') ? 'RANDOM' : 'SUBTOPIC',
        tags: ['AI-Generated', 'Aptitude'],
        sourceModel: res.metadata?.modelUsed || aiStatus.model,
        generationLatencyMs: res.metadata?.generationDurationMs || res.metadata?.latencyMs || Date.now() - startTime,
        isFallback: Boolean(res.metadata?.fallbackUsed || res.metadata?.isMockFallback),
        mathematicalVerification: mathVerification,
      };

      setCandidate(newStudioCandidate);
      setHasCandidate(true);
      setGenerationDuration(res.metadata?.generationDurationMs || res.metadata?.latencyMs || Date.now() - startTime);
      setIsFallbackMode(Boolean(res.metadata?.fallbackUsed || res.metadata?.isMockFallback));

      const clientValidation = CandidateValidator.validate({
        ...generated,
        mathematicalVerification: mathVerification,
      });

      if (res.validation?.mathematicalVerification?.status === 'FAILED') {
        const mergedErrors = Array.from(new Set([...clientValidation.errors, ...(res.validation.errors || [])]));
        setClientReport({
          ...clientValidation,
          isValid: false,
          errors: mergedErrors,
          mathematicalVerification: res.validation.mathematicalVerification,
        });
      } else if (res.validation) {
        setClientReport({
          ...clientValidation,
          mathematicalVerification: res.validation.mathematicalVerification || clientValidation.mathematicalVerification,
          isValid: clientValidation.isValid,
        });
      } else {
        setClientReport(clientValidation);
      }

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
        mathematicalVerification: candidate.mathematicalVerification,
      };

      const payload: RefineCandidateInput = {
        action,
        currentCandidate: activeAiCandidate,
        promptModifier: customInstructions.trim() || undefined,
        targetLanguage: candidate.language,
      };

      const res = await apiClient.refineAiQuestion(payload);
      const refined = res.candidate;
      const mathVerification = res.validation?.mathematicalVerification || (refined as any).mathematicalVerification || candidate.mathematicalVerification;

      isInternalUpdateRef.current = true;
      setCandidate((prev) => ({
        ...prev,
        questionText: refined.content || (refined as any).questionText || (refined as any).question || prev.questionText || '',
        optionA: refined.option_a,
        optionB: refined.option_b,
        optionC: refined.option_c,
        optionD: refined.option_d,
        correctAnswer: refined.correct_answer,
        explanation: refined.explanation,
        difficulty: formatDifficultyForUi(refined.difficulty || prev.difficulty),
        language: refined.language || prev.language,
        realLifeContext: refined.real_world_context || prev.realLifeContext,
        mathematicalVerification: mathVerification,
      }));

      const clientValidation = CandidateValidator.validate({
        ...refined,
        mathematicalVerification: mathVerification,
      });

      if (res.validation?.mathematicalVerification?.status === 'FAILED') {
        const mergedErrors = Array.from(new Set([...clientValidation.errors, ...(res.validation.errors || [])]));
        setClientReport({
          ...clientValidation,
          isValid: false,
          errors: mergedErrors,
          mathematicalVerification: res.validation.mathematicalVerification,
        });
      } else if (res.validation) {
        setClientReport({
          ...clientValidation,
          mathematicalVerification: res.validation.mathematicalVerification || clientValidation.mathematicalVerification,
          isValid: clientValidation.isValid,
        });
      } else {
        setClientReport(clientValidation);
      }

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
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
        difficulty: candidate.difficulty,
        challengeType: candidate.challengeType,
        presentationType: candidate.presentationType,
        language: candidate.language,
        realLifeContext: candidate.realLifeContext,
        questionStyle: candidate.questionStyle || questionStyle || 'STORY_BASED',
        mathematicalVerification: candidate.mathematicalVerification || clientReport?.mathematicalVerification,
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
      const idempotencyKey = `studio-ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const isRandomMode =
        selectedSubtopic === 'RANDOM' ||
        realLifeContext === 'RANDOM' ||
        candidate.generationMode === 'RANDOM';

      const resolvedContextForSave =
        candidate.realLifeContext && candidate.realLifeContext !== 'RANDOM'
          ? candidate.realLifeContext
          : (realLifeContext && realLifeContext !== 'RANDOM' ? realLifeContext : undefined);

      const created = await apiClient.createQuestionCanonical({
        creationMode: 'ai',
        ...(candidate.categoryId || selectedCategory ? { categoryId: candidate.categoryId || selectedCategory } : {}),
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
        difficulty: candidate.difficulty,
        challengeType: candidate.challengeType,
        presentationType: candidate.presentationType,
        language: candidate.language,
        realLifeContext: resolvedContextForSave,
        generationMode: isRandomMode ? 'RANDOM' : 'SUBTOPIC',
        questionStyle: candidate.questionStyle || questionStyle || 'STORY_BASED',
        questionText: candidate.questionText.trim(),
        question: candidate.questionText.trim(),
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
        mathematicalVerification: candidate.mathematicalVerification || clientReport?.mathematicalVerification,
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

    if (duplicateCheckTimerRef.current) {
      clearTimeout(duplicateCheckTimerRef.current);
      duplicateCheckTimerRef.current = null;
    }
    if (duplicateAbortControllerRef.current) {
      duplicateAbortControllerRef.current.abort();
      duplicateAbortControllerRef.current = null;
    }
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
      validationTimerRef.current = null;
    }
    duplicateRequestIdRef.current++;
    validationRequestIdRef.current++;

    setCandidate({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      categoryId: selectedCategory || undefined,
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
    setHasCheckedDuplicate(false);
    setSavedSuccessInfo(null);
    setErrorMessage(null);
  };

  const getSaveGateReason = (): string | null => {
    if (configError) return 'Configuration unavailable. Please resolve QUESTION_CONFIG errors.';
    if (!candidate.questionText.trim()) return 'Question problem statement is required.';
    if (clientReport?.mathematicalVerification?.status === 'FAILED') {
      return `Mathematical verification failed: ${clientReport.mathematicalVerification.reason || 'Calculated answer does not match declared options.'}`;
    }
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
        title="Create Question"
        description="Generate new aptitude questions with AI, craft real-world scenarios, and verify math."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
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
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-2">
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
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/questions')}
              className="bg-white hover:bg-emerald-100 border-emerald-300 text-emerald-900"
            >
              Question Library (Step 02)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/questions/${savedSuccessInfo.id}/improve`)}
              className="bg-white hover:bg-emerald-100 border-emerald-300 text-emerald-900"
            >
              Improve Question (Step 03)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/questions/${savedSuccessInfo.id}/verify`)}
              icon={ArrowRight}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Verify & Approve (Step 04)
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN: SHARED PEDAGOGICAL CONFIGURATION */}
        <div className="lg:col-span-5 h-full flex flex-col space-y-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold">Pedagogical Configuration</h3>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
              Shared Model
            </span>
          </div>

          {/* Taxonomy Selection (Topic -> Subtopic Only) */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Topic</span>
                  {loadingTaxonomy && <span className="text-[10px] text-slate-400 animate-pulse">Loading...</span>}
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  disabled={loadingTaxonomy || allTopics.length === 0}
                  className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                >
                  {allTopics.map((top: any) => (
                    <option key={top.id} value={top.id}>
                      {top.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Subtopic</label>
                <select
                  value={selectedSubtopic}
                  onChange={(e) => handleSubtopicChange(e.target.value)}
                  disabled={loadingTaxonomy || currentSubtopics.length === 0}
                  className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="RANDOM">🎲 RANDOM (Subtopic from Topic)</option>
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
              <label className="text-xs font-semibold text-slate-700">Language</label>
              <select
                value={candidate.language}
                onChange={(e) => {
                  const lang = e.target.value as QuestionLanguage;
                  setLanguage(lang);
                  updateCandidateField('language', lang);
                }}
                className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-semibold text-indigo-950"
              >
                {QUESTION_CREATION_CONFIG.languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Target Difficulty</label>
              <select
                value={formatDifficultyForUi(candidate.difficulty || difficulty || 'Intermediate')}
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

            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Question Style</span>
                {loadingConfig && <span className="text-[10px] text-slate-400 animate-pulse">Loading styles...</span>}
              </label>
              {configError ? (
                <div className="mt-1 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Configuration unavailable: {configError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadStudioConfig(true)}
                    className="text-[10px] font-semibold text-rose-800 underline hover:text-rose-950 shrink-0 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <select
                  value={questionStyle}
                  onChange={(e) => handleQuestionStyleChange(e.target.value)}
                  disabled={loadingConfig || questionStyles.length === 0}
                  className="w-full mt-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden disabled:opacity-50"
                >
                  {loadingConfig && <option value="">Loading styles from QUESTION_CONFIG...</option>}
                  {!loadingConfig && questionStyles.length === 0 && <option value="">No active question styles configured</option>}
                  {questionStyles.map((style) => (
                    <option key={style.id} value={style.code}>
                      {style.displayLabel} {style.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Real-Life Context Selection */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Real-Life Context Category</span>
              {loadingConfig ? (
                <span className="text-[10px] text-slate-400 animate-pulse">Loading contexts...</span>
              ) : configError ? (
                <span className="text-[10px] text-rose-500 font-medium">Unavailable</span>
              ) : (
                <span className="text-[10px] text-slate-400">
                  {realLifeContexts.length} Active {realLifeContexts.length === 1 ? 'Category' : 'Categories'} (QUESTION_CONFIG)
                </span>
              )}
            </label>
            {configError ? (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <div className="font-semibold">Configuration Unavailable</div>
                    <div className="text-[10px]">{configError}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => loadStudioConfig(true)}
                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded text-xs font-semibold shrink-0 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : (
              <select
                value={realLifeContext}
                onChange={(e) => {
                  const newCtx = e.target.value;
                  setRealLifeContext(newCtx);
                  if (newCtx !== 'RANDOM') {
                    updateCandidateField('realLifeContext', newCtx);
                  } else {
                    setCandidate((prev) => {
                      const updated = {
                        ...prev,
                        realLifeContext: '',
                        generationMode: 'RANDOM' as const,
                      };
                      if (hasCandidate && updated.questionText.trim()) {
                        const candidateForVal: Partial<QuestionCandidate> & { mathematicalVerification?: MathVerificationResult } = {
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
                          mathematicalVerification: updated.mathematicalVerification,
                        };
                        setClientReport(CandidateValidator.validate(candidateForVal));
                      }
                      return updated;
                    });
                  }
                }}
                disabled={loadingConfig || realLifeContexts.length === 0}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden disabled:opacity-50"
              >
                {loadingConfig && <option value="">Loading contexts from QUESTION_CONFIG...</option>}
                {!loadingConfig && realLifeContexts.length === 0 && <option value="">No active contexts configured</option>}
                {!loadingConfig && realLifeContexts.length > 0 && (
                  <option value="RANDOM">🎲 RANDOM (Any Configured Real-Life Context)</option>
                )}
                {realLifeContexts.map((ctx) => (
                  <option key={ctx.id} value={ctx.displayLabel}>
                    {ctx.displayLabel} {ctx.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            )}

            <div className="pt-1">
              <label className="text-[11px] font-semibold text-slate-600">Quick Scenario Hooks</label>
              <div className="flex flex-nowrap overflow-x-auto gap-2 py-1 scrollbar-none mt-1">
                {REAL_WORLD_HOOK_SUGGESTIONS.map((hook) => (
                  <button
                    key={hook}
                    type="button"
                    onClick={() => {
                      setRealLifeContext(hook);
                      updateCandidateField('realLifeContext', hook);
                    }}
                    className={`shrink-0 py-1 px-2.5 text-xs rounded-md border transition-colors cursor-pointer ${
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

          {/* AI Generation Controls */}
          <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in">
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
        </div>

        {/* RIGHT COLUMN: CANDIDATE EDITOR WORKSPACE */}
        <div className="lg:col-span-7 h-full">
          <div className="h-full flex flex-col bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold">Question Editor Workspace</h3>
              </div>

              <div className="flex items-center gap-2">
                {isDirty && (
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Unsaved Edits
                  </span>
                )}

                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                    ? 'తెలుగు (Telugu)'
                    : 'English'}{' '}
                  • AI Candidate
                </span>
              </div>
            </div>

            {/* AI Refinement Modifiers */}
            {hasCandidate && !isGenerating && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                  <span className="flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                    AI Refinement Modifiers
                  </span>
                  {isRefining && (
                    <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Refining candidate...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Difficulty Group */}
                  <div className="flex items-center gap-1.5 p-1.5 bg-white/80 border border-indigo-100/80 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-1 shrink-0">Diff:</span>
                    <button
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefine(AiRefinementAction.INCREASE_DIFFICULTY)}
                      className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1 px-2 rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                      Make Harder
                    </button>
                    <button
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefine(AiRefinementAction.DECREASE_DIFFICULTY)}
                      className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1 px-2 rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                      Make Easier
                    </button>
                  </div>

                  {/* Content & Language Group */}
                  <div className="flex items-center gap-1.5 flex-wrap p-1.5 bg-white/80 border border-indigo-100/80 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-1 shrink-0">Style:</span>
                    <button
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefine(AiRefinementAction.IMPROVE_TELUGU)}
                      className="text-[10px] font-semibold py-1 px-2 rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                    >
                      <Languages className="w-3 h-3" />
                      Improve Telugu
                    </button>
                    <button
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefine(AiRefinementAction.SIMPLIFY_LANGUAGE)}
                      className="text-[10px] font-semibold py-1 px-2 rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      Simplify Language
                    </button>
                    <button
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefine(AiRefinementAction.IMPROVE_OPTIONS)}
                      className="text-[10px] font-semibold py-1 px-2 rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                    >
                      <Layers className="w-3 h-3" />
                      Improve Options
                    </button>
                    <button
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefine(AiRefinementAction.IMPROVE_EXPLANATION)}
                      className="text-[10px] font-semibold py-1 px-2 rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Improve Solution
                    </button>
                    <button
                      type="button"
                      disabled={isRefining}
                      onClick={() => handleRefine(AiRefinementAction.MAKE_REALISTIC)}
                      className="text-[10px] font-semibold py-1 px-2 rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Make Realistic
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI GENERATION LOADING SKELETON */}
            {isGenerating && (
              <div className="space-y-5 animate-pulse p-4 rounded-xl border border-indigo-100 bg-indigo-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span className="text-xs font-bold text-indigo-900">
                      Gemini is generating high-yield aptitude candidate...
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 font-semibold bg-indigo-100/60 px-2 py-0.5 rounded-full">
                    {candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                      ? 'తెలుగు Prompting'
                      : 'English Prompting'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="h-3 w-36 bg-slate-200 rounded"></div>
                  <div className="h-24 bg-slate-200/80 rounded-xl"></div>
                </div>

                <div className="space-y-2">
                  <div className="h-3 w-48 bg-slate-200 rounded"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="h-14 bg-slate-200/70 rounded-xl"></div>
                    <div className="h-14 bg-slate-200/70 rounded-xl"></div>
                    <div className="h-14 bg-slate-200/70 rounded-xl"></div>
                    <div className="h-14 bg-slate-200/70 rounded-xl"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-3 w-40 bg-slate-200 rounded"></div>
                  <div className="h-20 bg-slate-200/80 rounded-xl"></div>
                </div>
              </div>
            )}

            {/* EMPTY STATE HERO CARD */}
            {!hasCandidate && !candidate.questionText.trim() && !isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/70 border border-dashed border-slate-300 rounded-2xl space-y-4 my-auto">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
                  <Sparkles className="w-7 h-7 animate-pulse" />
                </div>
                <div className="max-w-sm space-y-1.5">
                  <h4 className="text-base font-bold text-slate-900">Ready to Generate Question</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Configure your Topic, Subtopic, and Scenario on the left, then click{' '}
                    <span className="font-semibold text-indigo-700">&quot;Generate Question Candidate&quot;</span> to begin.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasCandidate(true);
                      setIsDirty(true);
                    }}
                    icon={PenTool}
                    className="text-xs font-semibold bg-white border-slate-300 hover:bg-slate-100 text-slate-700"
                  >
                    Or start from blank / manual entry
                  </Button>
                </div>
              </div>
            )}

            {/* Candidate Form Fields */}
            {(hasCandidate || candidate.questionText.trim().length > 0) && !isGenerating && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Question Problem Statement</span>
                      <span className="text-rose-500">*</span>
                      {(candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU') && (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-telugu">
                          తెలుగు
                        </span>
                      )}
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {candidate.questionText.length} characters
                    </span>
                  </div>
                  <textarea
                    value={candidate.questionText}
                    onChange={(e) => updateCandidateField('questionText', e.target.value)}
                    rows={4}
                    placeholder={
                      candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                        ? 'స్పష్టమైన లెక్క మరియు సందర్భం ఇక్కడ రాయండి...'
                        : 'Enter clear, realistic problem statement...'
                    }
                    className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-medium transition-all ${
                      candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                        ? 'font-telugu leading-relaxed text-[13px]'
                        : 'font-sans text-xs leading-normal'
                    }`}
                  />
                </div>

                {/* Options A-D */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Options & Declared Answer <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Click option card or radio button to select correct answer
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Option A */}
                    <div
                      onClick={() => updateCandidateField('correctAnswer', 'A')}
                      className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                        candidate.correctAnswer === 'A'
                          ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200/60 shadow-xs'
                          : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={candidate.correctAnswer === 'A'}
                            onChange={() => updateCandidateField('correctAnswer', 'A')}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span
                            className={`text-xs font-extrabold ${
                              candidate.correctAnswer === 'A' ? 'text-emerald-900' : 'text-slate-700'
                            }`}
                          >
                            Option A
                          </span>
                        </div>
                        {candidate.correctAnswer === 'A' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" /> Correct Answer
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={candidate.optionA}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateCandidateField('optionA', e.target.value)}
                        placeholder="Option A value"
                        className={`w-full font-medium text-slate-900 bg-white px-2.5 py-1.5 rounded-lg border ${
                          candidate.correctAnswer === 'A'
                            ? 'border-emerald-300 focus:border-emerald-500'
                            : 'border-slate-200 focus:border-indigo-500'
                        } focus:outline-hidden transition-all ${
                          candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                            ? 'font-telugu leading-relaxed text-[13px]'
                            : 'font-sans text-xs leading-normal'
                        }`}
                      />
                    </div>

                    {/* Option B */}
                    <div
                      onClick={() => updateCandidateField('correctAnswer', 'B')}
                      className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                        candidate.correctAnswer === 'B'
                          ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200/60 shadow-xs'
                          : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={candidate.correctAnswer === 'B'}
                            onChange={() => updateCandidateField('correctAnswer', 'B')}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span
                            className={`text-xs font-extrabold ${
                              candidate.correctAnswer === 'B' ? 'text-emerald-900' : 'text-slate-700'
                            }`}
                          >
                            Option B
                          </span>
                        </div>
                        {candidate.correctAnswer === 'B' && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" /> Correct Answer
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={candidate.optionB}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateCandidateField('optionB', e.target.value)}
                        placeholder="Option B value"
                        className={`w-full font-medium text-slate-900 bg-white px-2.5 py-1.5 rounded-lg border ${
                          candidate.correctAnswer === 'B'
                            ? 'border-emerald-300 focus:border-emerald-500'
                            : 'border-slate-200 focus:border-indigo-500'
                        } focus:outline-hidden transition-all ${
                          candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                            ? 'font-telugu leading-relaxed text-[13px]'
                            : 'font-sans text-xs leading-normal'
                        }`}
                      />
                    </div>

                    {/* Option C */}
                    {candidate.challengeType === 'TRUE_FALSE' || candidate.challengeType === 'YES_NO' ? (
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-100/60 flex items-center justify-center text-center opacity-60">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Option C: N/A for 2-Option ({candidate.challengeType}) Questions
                        </span>
                      </div>
                    ) : (
                      <div
                        onClick={() => updateCandidateField('correctAnswer', 'C')}
                        className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          candidate.correctAnswer === 'C'
                            ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200/60 shadow-xs'
                            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={candidate.correctAnswer === 'C'}
                              onChange={() => updateCandidateField('correctAnswer', 'C')}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span
                              className={`text-xs font-extrabold ${
                                candidate.correctAnswer === 'C' ? 'text-emerald-900' : 'text-slate-700'
                              }`}
                            >
                              Option C
                            </span>
                          </div>
                          {candidate.correctAnswer === 'C' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                              <Check className="w-3 h-3 stroke-[3]" /> Correct Answer
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={candidate.optionC}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateCandidateField('optionC', e.target.value)}
                          placeholder="Option C value"
                          className={`w-full font-medium text-slate-900 bg-white px-2.5 py-1.5 rounded-lg border ${
                            candidate.correctAnswer === 'C'
                              ? 'border-emerald-300 focus:border-emerald-500'
                            : 'border-slate-200 focus:border-indigo-500'
                          } focus:outline-hidden transition-all ${
                            candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                              ? 'font-telugu leading-relaxed text-[13px]'
                              : 'font-sans text-xs leading-normal'
                          }`}
                        />
                      </div>
                    )}

                    {/* Option D */}
                    {candidate.challengeType === 'TRUE_FALSE' || candidate.challengeType === 'YES_NO' ? (
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-100/60 flex items-center justify-center text-center opacity-60">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Option D: N/A for 2-Option ({candidate.challengeType}) Questions
                        </span>
                      </div>
                    ) : (
                      <div
                        onClick={() => updateCandidateField('correctAnswer', 'D')}
                        className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                          candidate.correctAnswer === 'D'
                            ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200/60 shadow-xs'
                            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={candidate.correctAnswer === 'D'}
                              onChange={() => updateCandidateField('correctAnswer', 'D')}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span
                              className={`text-xs font-extrabold ${
                                candidate.correctAnswer === 'D' ? 'text-emerald-900' : 'text-slate-700'
                              }`}
                            >
                              Option D
                            </span>
                          </div>
                          {candidate.correctAnswer === 'D' && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                              <Check className="w-3 h-3 stroke-[3]" /> Correct Answer
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={candidate.optionD}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateCandidateField('optionD', e.target.value)}
                          placeholder="Option D value"
                          className={`w-full font-medium text-slate-900 bg-white px-2.5 py-1.5 rounded-lg border ${
                            candidate.correctAnswer === 'D'
                              ? 'border-emerald-300 focus:border-emerald-500'
                            : 'border-slate-200 focus:border-indigo-500'
                          } focus:outline-hidden transition-all ${
                            candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                              ? 'font-telugu leading-relaxed text-[13px]'
                              : 'font-sans text-xs leading-normal'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Explanation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Step-by-Step Explanation & Speed Trick</span>
                      <span className="text-rose-500">*</span>
                      {(candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU') && (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-telugu">
                          తెలుగు
                        </span>
                      )}
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {candidate.explanation.length} characters
                    </span>
                  </div>
                  <textarea
                    value={candidate.explanation}
                    onChange={(e) => updateCandidateField('explanation', e.target.value)}
                    rows={4}
                    placeholder={
                      candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                        ? 'దశలవారీగా సాధన విధానం మరియు బుర్ర పరీక్ష స్పీడ్ ట్రిక్ ఇక్కడ రాయండి...'
                        : 'Provide step-by-step math proof and a dedicated Burra Speed Trick...'
                    }
                    className={`w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-medium transition-all ${
                      candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                        ? 'font-telugu leading-relaxed text-[13px]'
                        : 'font-sans text-xs leading-normal'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Duplicate Matches Box */}
            {duplicateMatches.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 animate-in fade-in" id="duplicate-matches-box">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Potential Duplicate Question Detected ({duplicateMatches.length} match)</span>
                </div>
                {duplicateMatches.slice(0, 2).map((match: any, idx: number) => (
                  <p key={idx} className="text-[11px] text-amber-800 pl-6">
                    • Match with <span className="font-mono font-semibold">{match.questionId}</span> (Similarity:{' '}
                    <span className="font-semibold">{Math.round((match.similarity || 0) * 100)}%</span>): &quot;
                    {match.questionText || match.content}&quot;
                  </p>
                ))}
              </div>
            )}

            {hasCheckedDuplicate && duplicateMatches.length === 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 animate-in fade-in" id="no-duplicates-box">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>No duplicate questions found in the library.</span>
                </div>
              </div>
            )}

            {/* UNIFIED VALIDATION STATUS STRIP */}
            {(hasCandidate || candidate.questionText.trim().length > 0) && !isGenerating && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-bold text-slate-900">Validation:</span>

                    {/* Client Sanity Badge */}
                    {clientReport && (
                      <span
                        className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                          clientReport.isValid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        Client: {clientReport.isValid ? 'PASS' : 'FAIL'}
                      </span>
                    )}

                    {/* Mathematical Verification Status Badge */}
                    {clientReport?.mathematicalVerification && (
                      <span
                        className={`font-bold text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          clientReport.mathematicalVerification.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : clientReport.mathematicalVerification.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : clientReport.mathematicalVerification.status === 'UNVERIFIED'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                        title={clientReport.mathematicalVerification.details || clientReport.mathematicalVerification.reason}
                      >
                        {clientReport.mathematicalVerification.status === 'VERIFIED' && 'Math: VERIFIED'}
                        {clientReport.mathematicalVerification.status === 'FAILED' && 'Math: FAILED'}
                        {clientReport.mathematicalVerification.status === 'UNVERIFIED' && (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                            Math: UNVERIFIED (Review Required)
                          </>
                        )}
                        {clientReport.mathematicalVerification.status === 'NOT_APPLICABLE' && 'Math: N/A'}
                      </span>
                    )}

                    {/* Server Validation Badge */}
                    {serverValidationResult && !isValidationStale ? (
                      <span
                        className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${
                          serverValidationResult.status === QuestionValidationStatus.VALID
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : serverValidationResult.status === QuestionValidationStatus.NEEDS_REVIEW
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}
                      >
                        Server: {serverValidationResult.status} ({Math.round((serverValidationResult.confidenceScore || 0) * 100)}%)
                      </span>
                    ) : isValidationStale ? (
                      <span className="font-semibold text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        Re-Validation Required
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">Pending Server Check</span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleServerValidate}
                    isLoading={isValidatingServer}
                    icon={FileCheck}
                    className="bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-50 text-xs py-1 px-2.5"
                  >
                    {isValidationStale ? 'Re-Validate' : 'Run Validation'}
                  </Button>
                </div>

                {/* Client Errors List if any */}
                {clientReport && clientReport.errors.length > 0 && (
                  <div className="pt-1 text-[11px] text-rose-800 font-medium space-y-0.5">
                    {clientReport.errors.map((err, idx) => (
                      <p key={idx} className="flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                        {err}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetStudio}
                  icon={Trash2}
                  className="text-xs"
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
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 max-w-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{saveGateReason}</span>
                  </span>
                )}

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSaveQuestion}
                  isLoading={isSaving}
                  disabled={Boolean(saveGateReason)}
                  icon={Save}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold shadow-xs cursor-pointer px-4"
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
