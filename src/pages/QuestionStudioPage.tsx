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

export type Step01WorkflowState = 'EMPTY' | 'INCOMPLETE' | 'VALID' | 'INVALID';

export interface Step01StateEvaluation {
  state: Step01WorkflowState;
  canContinue: boolean;
  reason?: string;
  errors: string[];
  warnings: string[];
}

export function getStep01WorkflowState({
  hasCandidate,
  candidate,
  configError,
}: {
  hasCandidate: boolean;
  candidate: StudioCandidate;
  configError: string | null;
}): Step01StateEvaluation {
  if (configError) {
    return {
      state: 'INVALID',
      canContinue: false,
      reason: 'Configuration unavailable. Please resolve QUESTION_CONFIG errors.',
      errors: [configError],
      warnings: [],
    };
  }

  // STATE A — EMPTY: No candidate drafted or generated
  const qText = (candidate.questionText || '').trim();
  if (!hasCandidate || !qText) {
    return {
      state: 'EMPTY',
      canContinue: false,
      reason: 'Question workspace is empty. Generate an AI question or draft manually.',
      errors: [],
      warnings: [],
    };
  }

  const optA = (candidate.optionA || '').trim();
  const optB = (candidate.optionB || '').trim();
  const optC = (candidate.optionC || '').trim();
  const optD = (candidate.optionD || '').trim();
  const declaredAnswer = (candidate.correctAnswer || '').trim().toUpperCase();
  const challengeType = candidate.challengeType || 'ABCD';

  // STATE B — INCOMPLETE: Missing required question text length or required options
  const missingFieldErrors: string[] = [];
  if (qText.length < 5) {
    missingFieldErrors.push('Question problem statement is required.');
  }
  if (!optA) missingFieldErrors.push('Option A is required.');
  if (!optB) missingFieldErrors.push('Option B is required.');
  if (challengeType === 'ABCD') {
    if (!optC) missingFieldErrors.push('Option C is required.');
    if (!optD) missingFieldErrors.push('Option D is required.');
  }

  if (missingFieldErrors.length > 0) {
    return {
      state: 'INCOMPLETE',
      canContinue: false,
      reason: missingFieldErrors[0],
      errors: missingFieldErrors,
      warnings: [],
    };
  }

  // Check correct answer choice
  if (!['A', 'B', 'C', 'D'].includes(declaredAnswer)) {
    return {
      state: 'INVALID',
      canContinue: false,
      reason: `Invalid correct answer choice '${declaredAnswer}'. Must be A, B, C, or D.`,
      errors: [`Invalid correct answer choice '${declaredAnswer}'.`],
      warnings: [],
    };
  }

  // Check for duplicate options (basic draft sanity)
  const rawOptions = [
    { key: 'A', text: optA.toLowerCase() },
    { key: 'B', text: optB.toLowerCase() },
    ...(challengeType === 'ABCD' ? [{ key: 'C', text: optC.toLowerCase() }, { key: 'D', text: optD.toLowerCase() }] : []),
  ];

  for (let i = 0; i < rawOptions.length; i++) {
    for (let j = i + 1; j < rawOptions.length; j++) {
      if (rawOptions[i].text && rawOptions[i].text === rawOptions[j].text) {
        return {
          state: 'INVALID',
          canContinue: false,
          reason: `Duplicate options: Option ${rawOptions[i].key} and Option ${rawOptions[j].key} have identical values.`,
          errors: [`Duplicate options: Option ${rawOptions[i].key} and Option ${rawOptions[j].key} have identical values.`],
          warnings: [],
        };
      }
    }
  }

  // STATE C — VALID DRAFT: Structurally complete draft ready for Step 02 Verification
  return {
    state: 'VALID',
    canContinue: true,
    errors: [],
    warnings: [],
  };
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
      if (
        field === 'questionText' ||
        field === 'optionA' ||
        field === 'optionB' ||
        field === 'optionC' ||
        field === 'optionD' ||
        field === 'correctAnswer'
      ) {
        if (!isInternalUpdateRef.current && serverValidationResult) {
          setIsValidationStale(true);
        }
        if (prev.mathematicalVerification && prev.mathematicalVerification.status !== 'UNVERIFIED') {
          updated.mathematicalVerification = {
            status: 'UNVERIFIED',
            reason: 'Content modified after initial verification',
          };
        }
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
        isFallback: Boolean(res.metadata?.fallbackUsed),
        mathematicalVerification: mathVerification,
      };

      setCandidate(newStudioCandidate);
      setHasCandidate(true);
      setGenerationDuration(res.metadata?.generationDurationMs || res.metadata?.latencyMs || Date.now() - startTime);

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

  // Canonical derived Step 01 workflow state machine
  const workflowState = useMemo(() => {
    return getStep01WorkflowState({
      hasCandidate,
      candidate,
      configError,
    });
  }, [
    hasCandidate,
    candidate,
    configError,
  ]);

  // Stage 01 Draft Save & Seamless Navigation to Step 02 Verification
  const handleSaveAndContinue = async () => {
    setHasAttemptedSave(true);
    if (!workflowState.canContinue) {
      setErrorMessage(workflowState.reason || 'Cannot save draft: please provide required question details.');
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const isRandomMode =
        selectedSubtopic === 'RANDOM' ||
        realLifeContext === 'RANDOM' ||
        candidate.generationMode === 'RANDOM';

      const resolvedContextForSave =
        candidate.realLifeContext && candidate.realLifeContext !== 'RANDOM'
          ? candidate.realLifeContext
          : (realLifeContext && realLifeContext !== 'RANDOM' ? realLifeContext : undefined);

      const savedDraft = await apiClient.saveQuestionDraft({
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
        source: 'AI Question Studio',
        sourceModel: candidate.sourceModel,
        generationLatencyMs: candidate.generationLatencyMs,
        isFallback: candidate.isFallback,
        mathematicalVerification: candidate.mathematicalVerification || clientReport?.mathematicalVerification,
      });

      setIsDirty(false);

      // Direct seamless navigation to Step 02: Verification
      navigate(`/questions/${savedDraft.id}/verify`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to save the draft. Please try again.');
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

  return (
    <div className="space-y-3 pb-6 animate-in fade-in duration-200">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="AI Question Studio"
        description="Generate and refine high-yield Telugu aptitude question drafts, then continue to the next production stage."
      />

      {/* 2. PERMANENT 15-STAGE TIMELINE ANCHOR */}
      <div id="permanent-timeline-anchor" className="w-full">
        <ProductionJourneyBar activeStage="QUESTION_STUDIO" showDetails />
      </div>

      {/* Global Error Alert Banner */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 animate-in slide-in-from-top-2 text-xs shadow-2xs">
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
        <div className="p-3 bg-indigo-50/90 border border-indigo-200 rounded-xl flex items-start gap-3 shadow-2xs">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1 w-full">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Performance Intelligence Directives Loaded</span>
            </h4>
            <p className="text-xs text-indigo-700 leading-relaxed font-medium">
              Generation configuration pre-populated from content strategy. Review directives and generate.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
              {queryPedagogicalTrap && (
                <div className="p-2 bg-white border border-indigo-100 rounded-lg space-y-0.5 shadow-3xs">
                  <span className="font-semibold text-indigo-800 block text-[11px]">Target Pedagogical Trap:</span>
                  <p className="text-slate-600 italic text-[11px] leading-snug">{queryPedagogicalTrap}</p>
                </div>
              )}
              {queryHookDirective && (
                <div className="p-2 bg-white border border-indigo-100 rounded-lg space-y-0.5 shadow-3xs">
                  <span className="font-semibold text-indigo-800 block text-[11px]">Recommended Hook:</span>
                  <p className="text-slate-600 italic text-[11px] leading-snug">{queryHookDirective}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPACT DUAL-PANE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* LEFT COLUMN: AI QUESTION SETUP (col-span-5) */}
        <div className="lg:col-span-5 space-y-3 bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                <Wand2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight">AI Question Setup</h3>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Step 01 / 15
            </span>
          </div>

          {/* Group 1: Topic & Subtopic */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                <span>Curriculum Topic & Subtopic</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                <span>APPSC/TSPSC High-Yield</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Topic {loadingTaxonomy && '...'}
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  disabled={loadingTaxonomy || allTopics.length === 0}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                >
                  {allTopics.map((top: any) => (
                    <option key={top.id} value={top.id}>
                      {top.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                  Subtopic
                </label>
                <select
                  value={selectedSubtopic}
                  onChange={(e) => handleSubtopicChange(e.target.value)}
                  disabled={loadingTaxonomy || currentSubtopics.length === 0}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
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

          {/* Group 2: Real-Life Telugu Context */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-800">
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
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
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
              <div className="flex flex-nowrap overflow-x-auto gap-1 py-0.5 scrollbar-none">
                {REAL_WORLD_HOOK_SUGGESTIONS.map((hook) => (
                  <button
                    key={hook}
                    type="button"
                    onClick={() => {
                      setRealLifeContext(hook);
                      updateCandidateField('realLifeContext', hook);
                    }}
                    className={`shrink-0 py-0.5 px-2 text-[10px] font-medium rounded-full border transition-all cursor-pointer ${
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

          {/* Group 3: Advanced Studio Tuning */}
          <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-slate-50/50">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full p-2 flex items-center justify-between text-[11px] font-bold text-slate-800 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-indigo-600" />
                <span>Advanced Studio Tuning</span>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAdvancedOpen && (
              <div className="p-2.5 border-t border-slate-200/80 space-y-2 bg-white text-xs animate-in fade-in">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Difficulty
                    </label>
                    <select
                      value={formatDifficultyForUi(candidate.difficulty || difficulty)}
                      onChange={(e) => {
                        setDifficulty(e.target.value);
                        updateCandidateField('difficulty', e.target.value);
                      }}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      {QUESTION_CREATION_CONFIG.difficulties.map((diff) => (
                        <option key={diff.id} value={diff.id}>{diff.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Language
                    </label>
                    <select
                      value={candidate.language}
                      onChange={(e) => {
                        const lang = e.target.value as QuestionLanguage;
                        setLanguage(lang);
                        updateCandidateField('language', lang);
                      }}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-950"
                    >
                      {QUESTION_CREATION_CONFIG.languages.map((l) => (
                        <option key={l.id} value={l.id}>{l.nativeName} ({l.name})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Challenge Type
                    </label>
                    <select
                      value={candidate.challengeType}
                      onChange={(e) => handleChallengeTypeChange(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      {QUESTION_CREATION_CONFIG.challengeTypes.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      Presentation Type
                    </label>
                    <select
                      value={candidate.presentationType}
                      onChange={(e) => {
                        setPresentationType(e.target.value);
                        updateCandidateField('presentationType', e.target.value);
                      }}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                    >
                      {QUESTION_CREATION_CONFIG.presentationTypes.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Question Style
                  </label>
                  <select
                    value={questionStyle}
                    onChange={(e) => handleQuestionStyleChange(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                  >
                    {questionStyles.map((style) => (
                      <option key={style.id} value={style.code}>{style.displayLabel}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Group 4: Custom AI Guidance + Generate Button */}
          <div className="space-y-2 pt-1.5 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-800 block">Custom AI Guidance</label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={2}
              placeholder="e.g., Include a trick option for calculating discount stacking on UPI payment..."
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden"
            />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Telugu Question...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>✦ Generate Telugu Question</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: FOCUSED QUESTION CANVAS (col-span-7) */}
        <div className="lg:col-span-7 space-y-3 bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-xl p-3.5 shadow-xs flex flex-col min-h-[480px]">
          {/* Canvas Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-900">
              <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
              <h3 className="text-xs font-bold tracking-tight">Question Canvas</h3>
            </div>

            <div className="flex items-center gap-1.5">
              {isDirty && (
                <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Draft
                </span>
              )}

              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
                {candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
                  ? 'తెలుగు'
                  : 'English'}
              </span>
            </div>
          </div>

          {/* EMPTY CANVAS SKELETON STATE */}
          {!hasCandidate && !candidate.questionText.trim() && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/70 border border-dashed border-slate-300 rounded-xl space-y-4 my-auto text-center relative overflow-hidden">
              <div className="space-y-1 z-10 max-w-sm">
                <h4 className="text-xs font-bold text-slate-900">Question Workspace Ready</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Configure your topic on the left and click{' '}
                  <span className="font-semibold text-indigo-700">&quot;✦ Generate Telugu Question&quot;</span>.
                </p>
              </div>

              <div className="flex items-center gap-2 z-10">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Generate Candidate</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasCandidate(true);
                    setIsDirty(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <PenTool className="w-3 h-3 text-slate-500" />
                  <span>Manual Draft</span>
                </button>
              </div>
            </div>
          )}

          {/* AI GENERATION LOADING SKELETON */}
          {isGenerating && (
            <div className="space-y-3 animate-pulse p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  <span className="text-xs font-bold text-indigo-900">
                    Generating Telugu question candidate...
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="h-2.5 w-28 bg-slate-200 rounded"></div>
                <div className="h-16 bg-slate-200/80 rounded-lg"></div>
              </div>

              <div className="space-y-1.5">
                <div className="h-2.5 w-36 bg-slate-200 rounded"></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 bg-slate-200/70 rounded-lg"></div>
                  <div className="h-10 bg-slate-200/70 rounded-lg"></div>
                  <div className="h-10 bg-slate-200/70 rounded-lg"></div>
                  <div className="h-10 bg-slate-200/70 rounded-lg"></div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE CANDIDATE WORKSPACE */}
          {(hasCandidate || candidate.questionText.trim().length > 0) && !isGenerating && (
            <div className="space-y-3">
              {/* AI REFINEMENT BAR (Focused: Increase Difficulty, Simplify Telugu, Add Trap Distractor) */}
              <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                  <Wand2 className="w-3 h-3 text-indigo-600" />
                  <span>AI Refine:</span>
                </div>

                <div className="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.INCREASE_DIFFICULTY)}
                    className="py-0.5 px-2 text-[10px] font-semibold rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <ArrowUp className="w-2.5 h-2.5 text-indigo-500" />
                    <span>+ Difficulty</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.SIMPLIFY_LANGUAGE)}
                    className="py-0.5 px-2 text-[10px] font-semibold rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <Languages className="w-2.5 h-2.5 text-indigo-500" />
                    <span>Simplify Telugu</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRefining}
                    onClick={() => handleRefine(AiRefinementAction.IMPROVE_OPTIONS)}
                    className="py-0.5 px-2 text-[10px] font-semibold rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <Layers className="w-2.5 h-2.5 text-indigo-500" />
                    <span>Add Trap Distractor</span>
                  </button>
                </div>
              </div>

              {/* QUESTION PROBLEM STATEMENT */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <span>Question Problem Statement</span>
                    <span className="text-rose-500">*</span>
                    <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded font-telugu">
                      తెలుగు
                    </span>
                  </label>
                  <span className="text-[9px] font-mono text-slate-400">
                    {candidate.questionText.length} chars
                  </span>
                </div>
                <textarea
                  value={candidate.questionText}
                  onChange={(e) => updateCandidateField('questionText', e.target.value)}
                  rows={3}
                  placeholder="స్పష్టమైన ప్రశ్న మరియు లెక్క ఇక్కడ రాయండి..."
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-telugu leading-relaxed text-xs"
                />
              </div>

              {/* OPTIONS & CORRECT ANSWER */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-800">
                    Options & Correct Answer <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[9px] text-slate-500">
                    Select correct radio option
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Option A */}
                  <div
                    onClick={() => updateCandidateField('correctAnswer', 'A')}
                    className={`p-2 rounded-lg border transition-all cursor-pointer select-none ${
                      candidate.correctAnswer === 'A'
                        ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={candidate.correctAnswer === 'A'}
                          onChange={() => updateCandidateField('correctAnswer', 'A')}
                          className="w-3 h-3 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-800">Option A / ఎ</span>
                      </div>
                      {candidate.correctAnswer === 'A' && (
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded-full">
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
                      className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Option B */}
                  <div
                    onClick={() => updateCandidateField('correctAnswer', 'B')}
                    className={`p-2 rounded-lg border transition-all cursor-pointer select-none ${
                      candidate.correctAnswer === 'B'
                        ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={candidate.correctAnswer === 'B'}
                          onChange={() => updateCandidateField('correctAnswer', 'B')}
                          className="w-3 h-3 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-800">Option B / బి</span>
                      </div>
                      {candidate.correctAnswer === 'B' && (
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded-full">
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
                      className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Option C */}
                  <div
                    onClick={() => updateCandidateField('correctAnswer', 'C')}
                    className={`p-2 rounded-lg border transition-all cursor-pointer select-none ${
                      candidate.correctAnswer === 'C'
                        ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={candidate.correctAnswer === 'C'}
                          onChange={() => updateCandidateField('correctAnswer', 'C')}
                          className="w-3 h-3 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-800">Option C / సి</span>
                      </div>
                      {candidate.correctAnswer === 'C' && (
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded-full">
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
                      className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Option D */}
                  <div
                    onClick={() => updateCandidateField('correctAnswer', 'D')}
                    className={`p-2 rounded-lg border transition-all cursor-pointer select-none ${
                      candidate.correctAnswer === 'D'
                        ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={candidate.correctAnswer === 'D'}
                          onChange={() => updateCandidateField('correctAnswer', 'D')}
                          className="w-3 h-3 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-800">Option D / డి</span>
                      </div>
                      {candidate.correctAnswer === 'D' && (
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded-full">
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
                      className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DUPLICATE MATCHES BOX */}
          {duplicateMatches.length > 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-0.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Potential Duplicate ({duplicateMatches.length} match)</span>
              </div>
              {duplicateMatches.slice(0, 2).map((match: any, idx: number) => (
                <p key={idx} className="text-[10px] text-amber-800 pl-4">
                  • Match <span className="font-mono font-semibold">{match.questionId}</span> ({Math.round((match.similarity || 0) * 100)}%): &quot;
                  {match.questionText || match.content}&quot;
                </p>
              ))}
            </div>
          )}

          {/* CANVAS FOOTER ACTION BAR */}
          <div className="mt-auto pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetStudio}
              icon={RotateCcw}
              className="text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50 h-8"
            >
              Clear / Start New Question
            </Button>

            <div className="flex items-center gap-2">
              {!workflowState.canContinue && workflowState.state !== 'EMPTY' && workflowState.reason && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 max-w-xs truncate" title={workflowState.reason}>
                  <AlertCircle className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{workflowState.reason}</span>
                </span>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={handleSaveAndContinue}
                isLoading={isSaving}
                disabled={!workflowState.canContinue || isSaving || isGenerating || isRefining}
                icon={ArrowRight}
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold shadow-xs cursor-pointer px-4 text-xs py-2 rounded-lg h-8 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save Draft & Continue →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
