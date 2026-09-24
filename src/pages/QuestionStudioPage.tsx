/**
 * BURRA PARIKSHA CMS - AI Question Studio Workspace
 * Refactored Dual-Pane Architecture with Permanent Timeline Anchor
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
  Search,
  Trash2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Layers,
  HelpCircle,
  Languages,
  PenTool,
  Loader2,
  Check,
  CheckCircle2,
  PlusCircle,
  ChevronDown,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { ProductionJourneyBar } from '../components/production/ProductionJourneyBar';
import { useProductionJourney } from '../contexts/ProductionJourneyContext';
import { apiClient } from '../lib/api-client';
import {
  DifficultyLevel,
  Question,
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
  'E-commerce delivery courier speed',
  'Monthly salary savings vs inflation',
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
  categoryId?: string;
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
  const [searchParams] = useSearchParams();
  const { loadJourneyForQuestion } = useProductionJourney();

  // Deep-linking URL Parameters
  const queryTopic = searchParams.get('topicId') || searchParams.get('topic');
  const querySubtopic = searchParams.get('subtopicId') || searchParams.get('subtopic');
  const queryDifficulty = searchParams.get('difficulty');
  const queryLanguage = searchParams.get('language') || searchParams.get('lang');
  const queryQuestionStyle = searchParams.get('questionStyle') || searchParams.get('style');
  const queryContext = searchParams.get('realWorldContext') || searchParams.get('context');
  const queryPedagogicalTrap = searchParams.get('pedagogicalTrapPattern');
  const queryHookDirective = searchParams.get('hookDirective');
  const isFromIntelligence = Boolean(queryPedagogicalTrap || queryHookDirective);

  // 1. System & Taxonomy State
  const [taxonomyTree, setTaxonomyTree] = useState<any[]>([]);
  const [aiStatus, setAiStatus] = useState<{ isConfigured: boolean; model: string }>({
    isConfigured: false,
    model: 'gemini-3.1-flash-lite',
  });
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

  // Configuration State
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
  const [customInstructions, setCustomInstructions] = useState<string>(() => {
    const parts: string[] = [];
    const pTrap = searchParams.get('pedagogicalTrapPattern');
    const hDirective = searchParams.get('hookDirective');
    if (pTrap) {
      parts.push(`Target Pedagogical Trap / Misconception: ${pTrap}`);
    }
    if (hDirective) {
      parts.push(`Recommended Hook Directive: ${hDirective}`);
    }
    return parts.join('\n');
  });

  // UI Accordion & Validation Trigger States
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState<boolean>(false);

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

  // Real-Time QUESTION_CONFIG State
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
  const [savedQuestion, setSavedQuestion] = useState<Question | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Suppress marking validation stale during initial generation load
  const isInternalUpdateRef = useRef<boolean>(false);

  // Duplicate check & validation refs
  const duplicateCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const duplicateAbortControllerRef = useRef<AbortController | null>(null);
  const duplicateRequestIdRef = useRef<number>(0);
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

        const topicsList: any[] = pureTree || [];

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

  // Duplicate Check Debounced
  const triggerDuplicateCheck = useCallback(async (text: string, immediate = false) => {
    if (duplicateCheckTimerRef.current) {
      clearTimeout(duplicateCheckTimerRef.current);
      duplicateCheckTimerRef.current = null;
    }

    if (!text || text.trim().length < 15) {
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
        if (currentRequestId === duplicateRequestIdRef.current) {
          setDuplicateMatches(res.matches || []);
          setHasCheckedDuplicate(true);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
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

  // Validation Decoupling Effect
  useEffect(() => {
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

  useEffect(() => {
    return () => {
      if (duplicateCheckTimerRef.current) clearTimeout(duplicateCheckTimerRef.current);
      if (duplicateAbortControllerRef.current) duplicateAbortControllerRef.current.abort();
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
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

  // AI Candidate Generation
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
    setHasAttemptedSave(false);

    const startTime = Date.now();
    try {
      const payload: GenerateCandidateInput = {
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

  // AI Refinement
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

  // Server Validation
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

  // Canonical Save & Direct Navigation to Step 02 Verification
  const handleSaveAndContinue = async () => {
    setHasAttemptedSave(true);
    if (!hasCandidate || !candidate.questionText.trim()) {
      setErrorMessage('Cannot save an empty question candidate.');
      return;
    }

    if (clientReport?.mathematicalVerification?.status === 'FAILED') {
      setErrorMessage('Mathematical verification failed. Please correct calculation error before proceeding.');
      return;
    }

    if (clientReport && !clientReport.isValid) {
      setErrorMessage('Please resolve client validation issues before saving.');
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

      setSavedQuestion(created);
      setSavedSuccessInfo({ id: created.id, status: created.status });
      setIsDirty(false);
      loadJourneyForQuestion(created.id, created);

      // Direct seamless navigation to Step 02: Verification
      navigate(`/questions/${created.id}/verify`);
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

    if (duplicateCheckTimerRef.current) clearTimeout(duplicateCheckTimerRef.current);
    if (duplicateAbortControllerRef.current) duplicateAbortControllerRef.current.abort();
    if (validationTimerRef.current) clearTimeout(validationTimerRef.current);

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
    setHasAttemptedSave(false);
    setClientReport(null);
    setServerValidationResult(null);
    setIsValidationStale(false);
    setDuplicateMatches([]);
    setHasCheckedDuplicate(false);
    setSavedSuccessInfo(null);
    setSavedQuestion(null);
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
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="AI Question Studio"
        description="Generate high-yield Telugu aptitude questions with AI, craft real-world scenarios, and verify math accuracy."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetStudio}
              icon={RotateCcw}
              className="text-xs bg-white border-slate-200 shadow-2xs hover:bg-slate-50 text-slate-700 font-medium"
            >
              + Draft Another Question
            </Button>
          </div>
        }
      />

      {/* 2. PERMANENT 15-STAGE TIMELINE ANCHOR (ALWAYS VISIBLE BELOW PAGE HEADER) */}
      <div id="permanent-timeline-anchor" className="w-full">
        <ProductionJourneyBar activeStage="QUESTION_STUDIO" showDetails />
      </div>

      {/* Global Error Alert Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-in slide-in-from-top-2 text-xs shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Notice</h4>
            <p className="text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[11px] text-rose-500 hover:text-rose-800 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {isFromIntelligence && (
        <div className="p-4 bg-indigo-50/90 border border-indigo-200 rounded-2xl flex items-start gap-3.5 mb-2 shadow-2xs">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1 w-full">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Performance Intelligence Strategy Directives Loaded</span>
            </h4>
            <p className="text-xs text-indigo-700 leading-relaxed font-medium">
              The generation configuration has been pre-populated from your performance intelligence content strategy. Review the recommended pedagogical trap patterns and hook directives below, edit if desired, and confirm generation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              {queryPedagogicalTrap && (
                <div className="p-3 bg-white border border-indigo-100 rounded-xl space-y-1 shadow-3xs">
                  <span className="font-semibold text-indigo-800 block">Target Pedagogical Trap:</span>
                  <p className="text-slate-600 italic leading-relaxed">{queryPedagogicalTrap}</p>
                </div>
              )}
              {queryHookDirective && (
                <div className="p-3 bg-white border border-indigo-100 rounded-xl space-y-1 shadow-3xs">
                  <span className="font-semibold text-indigo-800 block">Recommended Hook Directive:</span>
                  <p className="text-slate-600 italic leading-relaxed">{queryHookDirective}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPACT DUAL-PANE WORKSPACE (40% Left / 60% Right on lg:) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: AI QUESTION SETUP (40% width on lg: -> col-span-5) */}
        <div className="lg:col-span-5 space-y-4 bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">AI Question Setup</h3>
                <p className="text-[11px] text-slate-500">Target curriculum & scenario setup</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Step 01 / 15
            </span>
          </div>

          {/* Group 1 (Primary): Topic & Subtopic with Live APPSC/TSPSC High-Yield Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>Curriculum Topic & Subtopic</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>APPSC/TSPSC High-Yield</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Topic {loadingTaxonomy && '...'}
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  disabled={loadingTaxonomy || allTopics.length === 0}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                >
                  {allTopics.map((top: any) => (
                    <option key={top.id} value={top.id}>
                      {top.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Subtopic
                </label>
                <select
                  value={selectedSubtopic}
                  onChange={(e) => handleSubtopicChange(e.target.value)}
                  disabled={loadingTaxonomy || currentSubtopics.length === 0}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="RANDOM">🎲 RANDOM Subtopic</option>
                  {currentSubtopics.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Group 2 (Context): Real-Life Telugu Context Dropdown + Horizontal Chip Scroller */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Real-Life Telugu Context
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Exam Scenarios</span>
            </div>

            <select
              value={realLifeContext}
              onChange={(e) => {
                const newCtx = e.target.value;
                setRealLifeContext(newCtx);
                updateCandidateField('realLifeContext', newCtx);
              }}
              disabled={loadingConfig || realLifeContexts.length === 0}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
            >
              {loadingConfig && <option value="">Loading contexts from config...</option>}
              {!loadingConfig && realLifeContexts.length > 0 && (
                <option value="RANDOM">🎲 RANDOM Context Hook</option>
              )}
              {realLifeContexts.map((ctx) => (
                <option key={ctx.id} value={ctx.displayLabel}>
                  {ctx.displayLabel}
                </option>
              ))}
            </select>

            {/* Quick Scenario Hooks Horizontal Chip Scroller */}
            <div className="pt-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Quick Scenario Hooks:
              </span>
              <div className="flex flex-nowrap overflow-x-auto gap-1.5 py-1 scrollbar-none">
                {REAL_WORLD_HOOK_SUGGESTIONS.map((hook) => (
                  <button
                    key={hook}
                    type="button"
                    onClick={() => {
                      setRealLifeContext(hook);
                      updateCandidateField('realLifeContext', hook);
                    }}
                    className={`shrink-0 py-1 px-2.5 text-[11px] font-medium rounded-full border transition-all cursor-pointer ${
                      realLifeContext === hook
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {hook}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group 3 (Collapsible Contextual Disclosure): "Advanced Studio Tuning" */}
          <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full p-2.5 flex items-center justify-between text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                <span>Advanced Studio Tuning</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAdvancedOpen && (
              <div className="p-3 border-t border-slate-200/80 space-y-2.5 bg-white text-xs animate-in fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Difficulty
                    </label>
                    <select
                      value={formatDifficultyForUi(candidate.difficulty || difficulty)}
                      onChange={(e) => {
                        setDifficulty(e.target.value);
                        updateCandidateField('difficulty', e.target.value);
                      }}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      {QUESTION_CREATION_CONFIG.difficulties.map((diff) => (
                        <option key={diff.id} value={diff.id}>{diff.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Language
                    </label>
                    <select
                      value={candidate.language}
                      onChange={(e) => {
                        const lang = e.target.value as QuestionLanguage;
                        setLanguage(lang);
                        updateCandidateField('language', lang);
                      }}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-950"
                    >
                      {QUESTION_CREATION_CONFIG.languages.map((l) => (
                        <option key={l.id} value={l.id}>{l.nativeName} ({l.name})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Challenge Type
                    </label>
                    <select
                      value={candidate.challengeType}
                      onChange={(e) => handleChallengeTypeChange(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      {QUESTION_CREATION_CONFIG.challengeTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Presentation Type
                    </label>
                    <select
                      value={candidate.presentationType}
                      onChange={(e) => {
                        setPresentationType(e.target.value);
                        updateCandidateField('presentationType', e.target.value);
                      }}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      {QUESTION_CREATION_CONFIG.presentationTypes.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Question Style
                  </label>
                  <select
                    value={questionStyle}
                    onChange={(e) => handleQuestionStyleChange(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                  >
                    {questionStyles.map((style) => (
                      <option key={style.id} value={style.code}>{style.displayLabel}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Group 4: Custom AI Guidance + Elevated Primary Button (Always above laptop fold) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 block">Custom AI Guidance</label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={2}
              placeholder="e.g., Include a trick option for calculating discount stacking on UPI payment..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
            />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Telugu Question...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>✦ Generate Telugu Question</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE QUESTION CANVAS (60% width on lg: -> col-span-7) */}
        <div className="lg:col-span-7 space-y-4 bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col min-h-[520px]">
          {/* Canvas Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-900">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold tracking-tight">Interactive Question Canvas</h3>
            </div>

            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Unsaved Edits
                </span>
              )}

              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                {candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                  ? 'తెలుగు (Telugu)'
                  : 'English'}{' '}
                • AI Candidate
              </span>
            </div>
          </div>

          {/* EMPTY CANVAS SKELETON STATE */}
          {!hasCandidate && !candidate.questionText.trim() && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/70 border border-dashed border-slate-300 rounded-2xl space-y-5 my-auto text-center relative overflow-hidden">
              {/* Glassmorphic Animated Skeleton Preview */}
              <div className="w-full max-w-md bg-white/80 backdrop-blur-xs rounded-xl border border-slate-200/80 p-4 space-y-3 shadow-2xs pointer-events-none opacity-85">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="h-3.5 w-28 bg-slate-200 rounded animate-pulse"></div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-telugu">
                    తెలుగు కాన్వాస్
                  </span>
                </div>
                <div className="space-y-1.5 py-1">
                  <div className="h-3 w-11/12 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-3 w-3/4 bg-slate-200/80 rounded animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="h-9 rounded-lg bg-slate-100 border border-slate-200/60 p-2 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center font-telugu">ఎ</span>
                    <div className="h-2 w-14 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-9 rounded-lg bg-slate-100 border border-slate-200/60 p-2 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center font-telugu">బి</span>
                    <div className="h-2 w-16 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-9 rounded-lg bg-slate-100 border border-slate-200/60 p-2 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center font-telugu">సి</span>
                    <div className="h-2 w-12 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-9 rounded-lg bg-slate-100 border border-slate-200/60 p-2 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-[10px] font-bold flex items-center justify-center font-telugu">డి</span>
                    <div className="h-2 w-18 bg-slate-200 rounded"></div>
                  </div>
                </div>
                <div className="h-8 rounded-lg bg-indigo-50/60 border border-indigo-100/80 p-2 flex items-center justify-between">
                  <div className="h-2 w-28 bg-indigo-200 rounded"></div>
                  <div className="h-2 w-10 bg-indigo-200 rounded"></div>
                </div>
              </div>

              {/* Invitation Heading */}
              <div className="space-y-1.5 z-10 max-w-sm">
                <h4 className="text-sm font-bold text-slate-900">Interactive Question Canvas</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Configure your Topic, Subtopic, and Scenario on the left, then click{' '}
                  <span className="font-semibold text-indigo-700">&quot;✦ Generate Telugu Question&quot;</span>.
                </p>
              </div>

              <div className="flex items-center gap-3 z-10">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Generate Candidate</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasCandidate(true);
                    setIsDirty(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <PenTool className="w-3.5 h-3.5 text-slate-500" />
                  <span>Manual Draft</span>
                </button>
              </div>
            </div>
          )}

          {/* AI GENERATION LOADING SKELETON */}
          {isGenerating && (
            <div className="space-y-4 animate-pulse p-4 rounded-xl border border-indigo-100 bg-indigo-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  <span className="text-xs font-bold text-indigo-900">
                    Gemini AI is generating high-yield Telugu question candidate...
                  </span>
                </div>
                <span className="text-[10px] font-mono text-indigo-600 font-semibold bg-indigo-100/60 px-2 py-0.5 rounded-full">
                  తెలుగు Prompting
                </span>
              </div>

              <div className="space-y-2">
                <div className="h-3 w-36 bg-slate-200 rounded"></div>
                <div className="h-20 bg-slate-200/80 rounded-xl"></div>
              </div>

              <div className="space-y-2">
                <div className="h-3 w-48 bg-slate-200 rounded"></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 bg-slate-200/70 rounded-xl"></div>
                  <div className="h-12 bg-slate-200/70 rounded-xl"></div>
                  <div className="h-12 bg-slate-200/70 rounded-xl"></div>
                  <div className="h-12 bg-slate-200/70 rounded-xl"></div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE CANDIDATE WORKSPACE */}
          {(hasCandidate || candidate.questionText.trim().length > 0) && !isGenerating && (
            <div className="space-y-4">
              {/* AI REFINEMENT BAR */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                    AI Refinement Bar
                  </span>
                  {isRefining && (
                    <span className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Refining candidate...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.INCREASE_DIFFICULTY)}
                    className="py-1 px-2.5 text-[11px] font-semibold rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <ArrowUp className="w-3 h-3 text-indigo-500" />
                    <span>+ Increase Difficulty</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.SIMPLIFY_LANGUAGE)}
                    className="py-1 px-2.5 text-[11px] font-semibold rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <Languages className="w-3 h-3 text-indigo-500" />
                    <span>Simplify Telugu</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.IMPROVE_OPTIONS)}
                    className="py-1 px-2.5 text-[11px] font-semibold rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <Layers className="w-3 h-3 text-indigo-500" />
                    <span>Add Trap Distractor</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.IMPROVE_EXPLANATION)}
                    className="py-1 px-2.5 text-[11px] font-semibold rounded-lg bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <HelpCircle className="w-3 h-3 text-indigo-500" />
                    <span>Speed Trick Focus</span>
                  </button>
                </div>
              </div>

              {/* TELUGU QUESTION PROBLEM STATEMENT */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Question Problem Statement</span>
                    <span className="text-rose-500">*</span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-telugu">
                      తెలుగు
                    </span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {candidate.questionText.length} chars
                  </span>
                </div>
                <textarea
                  value={candidate.questionText}
                  onChange={(e) => updateCandidateField('questionText', e.target.value)}
                  rows={3}
                  placeholder="స్పష్టమైన లెక్క మరియు సందర్భం ఇక్కడ రాయండి..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-telugu leading-relaxed text-sm"
                />
              </div>

              {/* HIGH-CONTRAST 2X2 OPTION GRID */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Options & Correct Answer <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Click option card to toggle correct answer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option A / ఎ */}
                  <div
                    onClick={() => updateCandidateField('correctAnswer', 'A')}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      candidate.correctAnswer === 'A'
                        ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-200/60'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={candidate.correctAnswer === 'A'}
                          onChange={() => updateCandidateField('correctAnswer', 'A')}
                          className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">Option A / ఎ</span>
                      </div>
                      {candidate.correctAnswer === 'A' && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                          Correct
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={candidate.optionA}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateCandidateField('optionA', e.target.value)}
                      placeholder="Option A value"
                      className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Option B / బి */}
                  <div
                    onClick={() => updateCandidateField('correctAnswer', 'B')}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      candidate.correctAnswer === 'B'
                        ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-200/60'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={candidate.correctAnswer === 'B'}
                          onChange={() => updateCandidateField('correctAnswer', 'B')}
                          className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">Option B / బి</span>
                      </div>
                      {candidate.correctAnswer === 'B' && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                          Correct
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={candidate.optionB}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateCandidateField('optionB', e.target.value)}
                      placeholder="Option B value"
                      className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Option C / సి */}
                  <div
                    onClick={() => updateCandidateField('correctAnswer', 'C')}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      candidate.correctAnswer === 'C'
                        ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-200/60'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={candidate.correctAnswer === 'C'}
                          onChange={() => updateCandidateField('correctAnswer', 'C')}
                          className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">Option C / సి</span>
                      </div>
                      {candidate.correctAnswer === 'C' && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                          Correct
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={candidate.optionC}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateCandidateField('optionC', e.target.value)}
                      placeholder="Option C value"
                      className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Option D / డి */}
                  <div
                    onClick={() => updateCandidateField('correctAnswer', 'D')}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                      candidate.correctAnswer === 'D'
                        ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-200/60'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={candidate.correctAnswer === 'D'}
                          onChange={() => updateCandidateField('correctAnswer', 'D')}
                          className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">Option D / డి</span>
                      </div>
                      {candidate.correctAnswer === 'D' && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                          Correct
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={candidate.optionD}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateCandidateField('optionD', e.target.value)}
                      placeholder="Option D value"
                      className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* BURRA SPEED TRICK & STEP-BY-STEP SOLUTION */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Burra Speed Trick & Math Proof</span>
                    <span className="text-rose-500">*</span>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded font-telugu">
                      తెలుగు
                    </span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {candidate.explanation.length} chars
                  </span>
                </div>
                <textarea
                  value={candidate.explanation}
                  onChange={(e) => updateCandidateField('explanation', e.target.value)}
                  rows={3}
                  placeholder="సాధన విధానం మరియు బుర్ర పరీక్ష స్పీడ్ ట్రిక్ ఇక్కడ రాయండి..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-telugu leading-relaxed text-xs"
                />
              </div>
            </div>
          )}

          {/* DUPLICATE MATCHES BOX */}
          {duplicateMatches.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Potential Duplicate Question Detected ({duplicateMatches.length} match)</span>
              </div>
              {duplicateMatches.slice(0, 2).map((match: any, idx: number) => (
                <p key={idx} className="text-[11px] text-amber-800 pl-5">
                  • Match <span className="font-mono font-semibold">{match.questionId}</span> ({Math.round((match.similarity || 0) * 100)}% similarity): &quot;
                  {match.questionText || match.content}&quot;
                </p>
              ))}
            </div>
          )}

          {/* UNIFIED VALIDATION STRIP */}
          {(hasCandidate || candidate.questionText.trim().length > 0) && !isGenerating && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-900">Validation:</span>

                  {clientReport && (
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        clientReport.isValid
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      Client: {clientReport.isValid ? 'PASS' : 'FAIL'}
                    </span>
                  )}

                  {clientReport?.mathematicalVerification && (
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        clientReport.mathematicalVerification.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : clientReport.mathematicalVerification.status === 'FAILED'
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      Math: {clientReport.mathematicalVerification.status}
                    </span>
                  )}

                  {serverValidationResult && !isValidationStale ? (
                    <span
                      className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        serverValidationResult.status === QuestionValidationStatus.VALID
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      Server: {serverValidationResult.status}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">Pending Server Verification</span>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleServerValidate}
                  isLoading={isValidatingServer}
                  icon={FileCheck}
                  className="bg-white border-indigo-200 text-indigo-900 hover:bg-indigo-50 text-[11px] py-0.5 px-2.5 h-7"
                >
                  Run Validation
                </Button>
              </div>

              {/* Show errors ONLY when attempted save or math failed */}
              {hasAttemptedSave && clientReport && clientReport.errors.length > 0 && (
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

          {/* CANVAS FOOTER ACTION BAR */}
          <div className="mt-auto pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetStudio}
                icon={RotateCcw}
                className="text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              >
                Clear / Discard Draft
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {hasAttemptedSave && saveGateReason && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 max-w-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{saveGateReason}</span>
                </span>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={handleSaveAndContinue}
                isLoading={isSaving}
                disabled={Boolean(hasAttemptedSave && saveGateReason)}
                icon={ArrowRight}
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold shadow-md cursor-pointer px-5 text-xs py-2.5 rounded-xl"
              >
                Continue to Step 02: Verification →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
