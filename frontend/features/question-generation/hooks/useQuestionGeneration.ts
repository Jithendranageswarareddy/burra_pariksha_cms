/**
 * BURRA PARIKSHA CMS — Question Generation Feature Hook
 * Feature Slice: Question Generation (Stage 01)
 *
 * Encapsulates Question Generation business state, taxonomy cascades,
 * advisory AI candidate generation, candidate review, decoupled validation,
 * and the strict separation between Save Draft and Submit for Verification.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AiRefinementAction,
  DifficultyLevel,
  QuestionLanguage,
} from '../../../../shared';
import {
  GenerateCandidateInput,
  RefineCandidateInput,
  StudioCandidate,
  Step01StateEvaluation,
  evaluateStep01CandidateState,
  SubmitForVerificationResult,
} from '../../../../shared/contracts/question-generation';
import { questionsApi } from '../../../api/questions.api';
import { taxonomyApi } from '../../../api/taxonomy.api';

export function useQuestionGeneration() {
  const [searchParams] = useSearchParams();

  // Deep-linking query params
  const queryTopic = searchParams.get('topicId') || searchParams.get('topic');
  const querySubtopic = searchParams.get('subtopicId') || searchParams.get('subtopic');
  const queryDifficulty = searchParams.get('difficulty');
  const queryLanguage = searchParams.get('language') || searchParams.get('lang');
  const queryQuestionStyle = searchParams.get('questionStyle') || searchParams.get('style');
  const queryContext = searchParams.get('realWorldContext') || searchParams.get('context');

  // 1. Taxonomy & Options State
  const [taxonomyTree, setTaxonomyTree] = useState<any[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);
  const [aiStatus, setAiStatus] = useState<{ isConfigured: boolean; model: string }>({
    isConfigured: false,
    model: 'gemini-3.1-flash-lite',
  });
  const [configError, setConfigError] = useState<string | null>(null);

  // Configuration options selection
  const [selectedTopic, setSelectedTopic] = useState<string>(queryTopic || 'TOP-QA-01');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>(querySubtopic || 'SUB-01');
  const [difficulty, setDifficulty] = useState<string>(queryDifficulty || 'Intermediate');
  const [challengeType, setChallengeType] = useState<string>('ABCD');
  const [presentationType, setPresentationType] = useState<string>('Text');
  const [language, setLanguage] = useState<QuestionLanguage>(
    (queryLanguage as QuestionLanguage) || QuestionLanguage.TELUGU
  );
  const [questionStyle, setQuestionStyle] = useState<string>(
    queryQuestionStyle || 'STORY_BASED'
  );
  const [realLifeContext, setRealLifeContext] = useState<string>(queryContext || '');
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // 2. Candidate & Workspace State
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
    difficulty,
    challengeType,
    presentationType,
    language,
    realLifeContext,
    questionStyle,
    generationMode: 'SUBTOPIC',
    tags: ['Aptitude', 'Telugu'],
  });

  const [hasCandidate, setHasCandidate] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);

  // 3. Operation Lifecycle States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingServer, setIsValidatingServer] = useState(false);
  const [generationDuration, setGenerationDuration] = useState<number | null>(null);

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [submitSuccessResult, setSubmitSuccessResult] = useState<SubmitForVerificationResult | null>(null);

  // Validation & Duplicate tracking
  const [clientReport, setClientReport] = useState<any | null>(null);
  const [serverValidationResult, setServerValidationResult] = useState<any | null>(null);
  const [isValidationStale, setIsValidationStale] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  const duplicateTimerRef = useRef<any>(null);
  const duplicateAbortControllerRef = useRef<AbortController | null>(null);
  const validationTimerRef = useRef<any>(null);

  // Load generation options on mount
  useEffect(() => {
    let isMounted = true;
    async function initOptions() {
      setLoadingTaxonomy(true);
      try {
        const [pureTree, aiInfo] = await Promise.all([
          taxonomyApi.getTree().catch(() => []),
          questionsApi.getAiStatus().catch(() => ({ isConfigured: false, model: 'gemini-3.1-flash-lite' })),
        ]);

        if (!isMounted) return;
        const topicsList = pureTree || [];
        setTaxonomyTree(topicsList);
        setAiStatus(aiInfo);

        if (queryTopic) {
          setSelectedTopic(queryTopic);
          if (querySubtopic) setSelectedSubtopic(querySubtopic);
        } else if (topicsList.length > 0) {
          const firstTopic = topicsList[0];
          setSelectedTopic(firstTopic.id);
          const firstSub = (firstTopic.subtopics || [])[0];
          if (firstSub) setSelectedSubtopic(firstSub.id);
        }
      } catch (err: any) {
        console.error('Failed to load Question Generation options:', err);
        if (isMounted) setConfigError('Failed to load taxonomy tree');
      } finally {
        if (isMounted) setLoadingTaxonomy(false);
      }
    }
    initOptions();
    return () => {
      isMounted = false;
    };
  }, [queryTopic, querySubtopic]);

  // Derived subtopics for selected topic
  const currentTopicData = useMemo(() => {
    return taxonomyTree.find((t: any) => t.id === selectedTopic);
  }, [taxonomyTree, selectedTopic]);

  const currentSubtopics = useMemo(() => {
    return currentTopicData?.subtopics || [];
  }, [currentTopicData]);

  // Topic & Subtopic Cascading Handlers
  const handleTopicChange = useCallback((topId: string) => {
    setSelectedTopic(topId);
    setCandidate((prev) => ({ ...prev, topicId: topId }));

    const top = taxonomyTree.find((t: any) => t.id === topId);
    if (top && top.subtopics && top.subtopics.length > 0) {
      const newSub = top.subtopics[0].id;
      setSelectedSubtopic(newSub);
      setCandidate((prev) => ({ ...prev, subtopicId: newSub }));
    } else {
      setSelectedSubtopic('SUB-GEN');
      setCandidate((prev) => ({ ...prev, subtopicId: 'SUB-GEN' }));
    }
  }, [taxonomyTree]);

  const handleSubtopicChange = useCallback((subId: string) => {
    setSelectedSubtopic(subId);
    setCandidate((prev) => ({ ...prev, subtopicId: subId }));
  }, []);

  // Duplicate Check Debounced
  const triggerDuplicateCheck = useCallback((text: string) => {
    if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current);

    if (!text || text.trim().length < 15) {
      if (duplicateAbortControllerRef.current) {
        duplicateAbortControllerRef.current.abort();
        duplicateAbortControllerRef.current = null;
      }
      setDuplicateMatches([]);
      setIsCheckingDuplicate(false);
      return;
    }

    duplicateTimerRef.current = setTimeout(async () => {
      if (duplicateAbortControllerRef.current) duplicateAbortControllerRef.current.abort();
      const controller = new AbortController();
      duplicateAbortControllerRef.current = controller;
      setIsCheckingDuplicate(true);

      try {
        const res = await questionsApi.checkDuplicate(text, undefined, { signal: controller.signal });
        setDuplicateMatches(res.matches || []);
      } catch (err: any) {
        if (err?.name !== 'AbortError' && !err?.message?.includes('aborted')) {
          console.warn('Duplicate check warning:', err);
        }
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 400);
  }, []);

  // Update candidate field
  const updateCandidateField = useCallback((field: keyof StudioCandidate, value: any) => {
    setIsDirty(true);
    setSaveSuccessMessage(null);
    setSubmitSuccessResult(null);

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
        if (serverValidationResult) setIsValidationStale(true);
      }
      return updated;
    });

    if (field === 'questionText') {
      triggerDuplicateCheck(value);
    }
    setHasCandidate(true);
  }, [serverValidationResult, triggerDuplicateCheck]);

  // Evaluated workflow state
  const workflowState: Step01StateEvaluation = useMemo(() => {
    return evaluateStep01CandidateState({
      hasCandidate,
      candidate,
      configError,
    });
  }, [hasCandidate, candidate, configError]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current);
      if (duplicateAbortControllerRef.current) duplicateAbortControllerRef.current.abort();
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    };
  }, []);

  // 4. GENERATE CANDIDATE ACTION
  const handleGenerate = async () => {
    setErrorMessage(null);
    setSaveSuccessMessage(null);
    setSubmitSuccessResult(null);
    setIsGenerating(true);
    setServerValidationResult(null);
    setIsValidationStale(false);

    const startTime = Date.now();
    try {
      const payload: GenerateCandidateInput = {
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
        difficulty: difficulty as DifficultyLevel,
        language,
        questionStyle: questionStyle as any,
        realWorldContext: realLifeContext,
        customInstructions: customInstructions.trim() || undefined,
        generationMode: selectedSubtopic === 'RANDOM' ? 'RANDOM' : 'SUBTOPIC',
      };

      const res = await questionsApi.generateAiQuestion(payload);
      const generated = res.candidate;
      const mathVerification = res.validation?.mathematicalVerification || (generated as any).mathematicalVerification;

      const newCandidate: StudioCandidate = {
        questionText: generated.content || (generated as any).questionText || '',
        optionA: generated.option_a,
        optionB: generated.option_b,
        optionC: generated.option_c,
        optionD: generated.option_d,
        correctAnswer: generated.correct_answer,
        explanation: generated.explanation,
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
        difficulty,
        challengeType,
        presentationType,
        language: generated.language || language,
        realLifeContext: generated.real_world_context || realLifeContext,
        questionStyle: questionStyle || 'STORY_BASED',
        generationMode: selectedSubtopic === 'RANDOM' ? 'RANDOM' : 'SUBTOPIC',
        tags: ['AI-Generated', 'Aptitude'],
        sourceModel: res.metadata?.modelUsed || aiStatus.model,
        generationLatencyMs: res.metadata?.generationDurationMs || Date.now() - startTime,
        isFallback: Boolean(res.metadata?.fallbackUsed),
        mathematicalVerification: mathVerification,
      };

      setCandidate(newCandidate);
      setHasCandidate(true);
      setIsDirty(true);
      setSavedDraftId(null); // Fresh candidate not yet saved
      setGenerationDuration(res.metadata?.generationDurationMs || Date.now() - startTime);

      triggerDuplicateCheck(generated.content);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate question candidate.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. REFINE CANDIDATE ACTION
  const handleRefine = async (action: AiRefinementAction) => {
    if (!hasCandidate) return;
    setErrorMessage(null);
    setIsRefining(true);

    try {
      const payload: RefineCandidateInput = {
        action,
        currentCandidate: {
          content: candidate.questionText,
          option_a: candidate.optionA,
          option_b: candidate.optionB,
          option_c: candidate.optionC,
          option_d: candidate.optionD,
          correct_answer: candidate.correctAnswer,
          explanation: candidate.explanation,
          difficulty: difficulty as DifficultyLevel,
          language: (candidate.language as QuestionLanguage) || QuestionLanguage.TELUGU,
          question_style: questionStyle,
          real_world_context: candidate.realLifeContext,
        },
        promptModifier: customInstructions.trim() || undefined,
        targetLanguage: (candidate.language as QuestionLanguage) || QuestionLanguage.TELUGU,
      };

      const res = await questionsApi.refineAiQuestion(payload);
      const refined = res.candidate;

      setCandidate((prev) => ({
        ...prev,
        questionText: refined.content || (refined as any).questionText || prev.questionText,
        optionA: refined.option_a,
        optionB: refined.option_b,
        optionC: refined.option_c,
        optionD: refined.option_d,
        correctAnswer: refined.correct_answer,
        explanation: refined.explanation,
      }));

      setIsDirty(true);
      triggerDuplicateCheck(refined.content);
    } catch (err: any) {
      setErrorMessage(err?.message || `Refinement failed: ${action}`);
    } finally {
      setIsRefining(false);
    }
  };

  // 6. SAVE DRAFT ACTION (Isolated from Verify)
  // Persists the candidate as a draft without navigating away or advancing workflow.
  const handleSaveDraft = async (): Promise<string | null> => {
    if (!workflowState.canContinue) {
      setErrorMessage(workflowState.reason || 'Please provide required question details before saving draft.');
      return null;
    }

    setErrorMessage(null);
    setSaveSuccessMessage(null);
    setIsSaving(true);

    try {
      const savedDraft = await questionsApi.saveDraft({
        id: savedDraftId || undefined,
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
        difficulty: candidate.difficulty,
        challengeType: candidate.challengeType,
        presentationType: candidate.presentationType,
        language: candidate.language,
        realLifeContext: candidate.realLifeContext,
        generationMode: candidate.generationMode,
        questionStyle: candidate.questionStyle,
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
        source: 'AI Question Studio',
        sourceModel: candidate.sourceModel,
        generationLatencyMs: candidate.generationLatencyMs,
        isFallback: candidate.isFallback,
        mathematicalVerification: candidate.mathematicalVerification,
      });

      setSavedDraftId(savedDraft.id);
      setIsDirty(false);
      setSaveSuccessMessage(`Draft saved successfully as ${savedDraft.id}. Ready for explicit submission.`);
      return savedDraft.id;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save question draft.');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // 7. SUBMIT FOR VERIFICATION ACTION (Explicit User Command)
  // Submits an eligible saved draft for Stage 02 Verification.
  // Crucial: Truly separate command - NEVER implicitly calls handleSaveDraft().
  const handleSubmitForVerification = async (remarks?: string): Promise<SubmitForVerificationResult | null> => {
    setErrorMessage(null);
    setSubmitSuccessResult(null);

    // 1. Must have an existing, persisted draft ID
    if (!savedDraftId) {
      setErrorMessage('No saved draft found. Please save your draft before submitting for verification.');
      return null;
    }

    // 2. Reject if there are unsaved changes (do not submit stale saved version)
    if (isDirty) {
      setErrorMessage('The candidate has unsaved changes. Please save your draft before submitting for verification.');
      return null;
    }

    // 3. Reject if candidate is structurally incomplete or invalid
    if (!workflowState.canContinue) {
      setErrorMessage(workflowState.reason || 'Candidate has validation issues. Please resolve them and save draft before submitting.');
      return null;
    }

    // Explicit submission confirmation dialog
    if (!window.confirm(`Submit saved draft "${savedDraftId}" for Stage 02 Verification?`)) {
      return null;
    }

    setIsSubmitting(true);
    try {
      const result = await questionsApi.submitForVerification({
        draftId: savedDraftId,
        remarks: remarks || 'Submitted from Question Studio for Stage 02 Verification',
      });

      setSubmitSuccessResult(result);
      setSaveSuccessMessage(null);
      return result;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit draft for verification.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset workspace
  const handleResetStudio = useCallback(() => {
    if (hasCandidate && candidate.questionText.trim().length > 0 && isDirty) {
      if (!window.confirm('Discard active un-saved candidate changes?')) return;
    }

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
      tags: ['Aptitude', 'Telugu'],
    });

    setHasCandidate(false);
    setIsDirty(false);
    setSavedDraftId(null);
    setClientReport(null);
    setServerValidationResult(null);
    setDuplicateMatches([]);
    setErrorMessage(null);
    setSaveSuccessMessage(null);
    setSubmitSuccessResult(null);
  }, [hasCandidate, candidate.questionText, isDirty, selectedTopic, selectedSubtopic, difficulty, challengeType, presentationType, language, realLifeContext]);

  return {
    // Taxonomy & options
    taxonomyTree,
    loadingTaxonomy,
    aiStatus,
    selectedTopic,
    selectedSubtopic,
    currentSubtopics,
    difficulty,
    challengeType,
    presentationType,
    language,
    questionStyle,
    realLifeContext,
    customInstructions,
    handleTopicChange,
    handleSubtopicChange,
    setDifficulty,
    setChallengeType,
    setPresentationType,
    setLanguage,
    setQuestionStyle,
    setRealLifeContext,
    setCustomInstructions,

    // Candidate
    candidate,
    hasCandidate,
    isDirty,
    savedDraftId,
    workflowState,
    updateCandidateField,
    setHasCandidate,
    setIsDirty,

    // Status & execution
    isGenerating,
    isRefining,
    isSaving,
    isSubmitting,
    isValidatingServer,
    generationDuration,
    errorMessage,
    saveSuccessMessage,
    submitSuccessResult,
    setErrorMessage,
    setSaveSuccessMessage,
    setSubmitSuccessResult,

    // Duplicate & validation
    duplicateMatches,
    isCheckingDuplicate,
    clientReport,
    serverValidationResult,
    isValidationStale,

    // Actions
    handleGenerate,
    handleRefine,
    handleSaveDraft,
    handleSubmitForVerification,
    handleResetStudio,
  };
}
