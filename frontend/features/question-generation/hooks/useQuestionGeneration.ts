/**
 * BURRA PARIKSHA CMS — Question Generation Feature Hook
 * Feature Slice: Question Generation (Stage 01)
 *
 * Encapsulates Question Generation business state, taxonomy cascades,
 * advisory AI candidate generation, candidate review, decoupled validation,
 * and the strict separation between Save Draft and Submit for Verification.
 */

import { useState, useEffect, useCallback, useRef, useMemo, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AiRefinementAction,
  DifficultyLevel,
  QuestionLanguage,
  ContentProductionMode,
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
import { ProductionJourneyContext } from '../../../contexts/ProductionJourneyContext';

const VALID_MODES: ContentProductionMode[] = [
  'QUESTION_CHALLENGE_SHORT',
  'TOPIC_INTRODUCTION',
  'EXPLAINED_QUESTIONS_VIDEO',
];

export function useQuestionGeneration() {
  const [searchParams] = useSearchParams();

  // Deep-linking query params
  const queryDraftId = searchParams.get('draftId') || searchParams.get('id');
  const queryTopic = searchParams.get('topicId') || searchParams.get('topic');
  const querySubtopic = searchParams.get('subtopicId') || searchParams.get('subtopic');
  const queryDifficulty = searchParams.get('difficulty');
  const queryLanguage = searchParams.get('language') || searchParams.get('lang');
  const queryQuestionStyle = searchParams.get('questionStyle') || searchParams.get('style');
  const queryContext = searchParams.get('realWorldContext') || searchParams.get('context');
  const queryMode = searchParams.get('mode') as ContentProductionMode | null;
  const queryCount = searchParams.get('count') ? Number(searchParams.get('count')) : undefined;
  const queryAspect = searchParams.get('aspect') as '9:16' | '16:9' | null;

  const isValidQueryMode = Boolean(queryMode && VALID_MODES.includes(queryMode));

  // Shared Production Journey Context
  const prodContext = useContext(ProductionJourneyContext);

  // Production Mode Configuration State
  const [productionMode, setProductionMode] = useState<ContentProductionMode | null>(
    isValidQueryMode ? queryMode : null
  );
  const [targetQuestionCount, setTargetQuestionCount] = useState<number>(
    queryCount !== undefined
      ? queryCount
      : (queryMode === 'EXPLAINED_QUESTIONS_VIDEO' ? 10 : (queryMode === 'TOPIC_INTRODUCTION' ? 0 : 1))
  );
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>(
    queryAspect || (queryMode === 'EXPLAINED_QUESTIONS_VIDEO' ? '16:9' : '9:16')
  );
  const [isModeModalOpen, setIsModeModalOpen] = useState<boolean>(
    !isValidQueryMode && !queryDraftId
  );

  // Draft loading state & deduplication ref
  const [isLoadingDraft, setIsLoadingDraft] = useState<boolean>(Boolean(queryDraftId));
  const draftLoadedRef = useRef<string | null>(null);

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

  // Set production mode configuration with authoritative count/aspect ratio constraints
  const setProductionModeConfig = useCallback(
    (mode: ContentProductionMode, count?: number, aspect?: '9:16' | '16:9') => {
      let finalCount = count;
      let finalAspect = aspect;

      if (mode === 'QUESTION_CHALLENGE_SHORT') {
        if (finalCount === undefined || ![1, 5, 10, 15, 20].includes(finalCount)) finalCount = 1;
        finalAspect = '9:16';
      } else if (mode === 'TOPIC_INTRODUCTION') {
        finalCount = 0;
        if (!finalAspect || !['9:16', '16:9'].includes(finalAspect)) finalAspect = '9:16';
      } else if (mode === 'EXPLAINED_QUESTIONS_VIDEO') {
        if (finalCount === undefined || ![5, 10, 15, 20].includes(finalCount)) finalCount = 10;
        finalAspect = '16:9';
      }

      setProductionMode(mode);
      setTargetQuestionCount(finalCount!);
      setAspectRatio(finalAspect!);
      setIsModeModalOpen(false);

      // Persist in URL query parameters without reloading
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('mode', mode);
      currentParams.set('count', String(finalCount));
      currentParams.set('aspect', finalAspect!);
      const newRelativePathQuery = window.location.pathname + '?' + currentParams.toString();
      window.history.replaceState(null, '', newRelativePathQuery);

      // Synchronize with shared production context
      prodContext?.setModeConfig({
        productionMode: mode,
        questionCount: finalCount,
        aspectRatio: finalAspect,
      });
    },
    [prodContext]
  );

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

        // If not reopening a draft, initialize from deep-link or first available topic
        if (!queryDraftId) {
          if (queryTopic) {
            setSelectedTopic(queryTopic);
            if (querySubtopic) setSelectedSubtopic(querySubtopic);
          } else if (topicsList.length > 0) {
            const firstTopic = topicsList[0];
            setSelectedTopic(firstTopic.id);
            const firstSub = (firstTopic.subtopics || [])[0];
            if (firstSub) setSelectedSubtopic(firstSub.id);
          }
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
  }, [queryDraftId, queryTopic, querySubtopic]);

  // Reopen saved draft from deep link parameter
  useEffect(() => {
    if (!queryDraftId) {
      setIsLoadingDraft(false);
      return;
    }

    if (draftLoadedRef.current === queryDraftId) {
      return;
    }

    let isMounted = true;
    setIsLoadingDraft(true);
    setErrorMessage(null);

    async function loadExistingDraft() {
      try {
        const draft = await questionsApi.getDraft(queryDraftId!);
        if (!isMounted) return;

        draftLoadedRef.current = queryDraftId!;

        // 1. Candidate Fields Restoration
        const optionsObj = draft.options || {
          a: draft.optionA || '',
          b: draft.optionB || '',
          c: draft.optionC || '',
          d: draft.optionD || '',
        };

        const loadedCandidate: StudioCandidate = {
          questionText: draft.questionText || draft.question || '',
          optionA: optionsObj.a || draft.optionA || '',
          optionB: optionsObj.b || draft.optionB || '',
          optionC: optionsObj.c || draft.optionC || '',
          optionD: optionsObj.d || draft.optionD || '',
          correctAnswer: draft.correctAnswer || 'A',
          explanation: draft.explanation || '',
          topicId: draft.topicId,
          subtopicId: draft.subtopicId,
          difficulty: draft.difficulty || difficulty,
          challengeType: draft.challengeType || challengeType,
          presentationType: draft.presentationType || presentationType,
          language: (draft.language as QuestionLanguage) || language,
          realLifeContext: draft.realLifeContext || draft.realWorldContext || realLifeContext,
          questionStyle: (draft.questionStyle as string) || questionStyle,
          generationMode: (draft.generationMode as any) || 'SUBTOPIC',
          tags: draft.tags || ['Aptitude', 'Telugu'],
          sourceModel: draft.sourceModel,
          generationLatencyMs: draft.generationLatencyMs,
          isFallback: draft.isFallback,
          mathematicalVerification: draft.mathematicalVerification,
        };

        setCandidate(loadedCandidate);
        setHasCandidate(true);
        setIsDirty(false); // Clean saved state!
        setSavedDraftId(draft.id);

        // 2. Options and Taxonomy Restoration (persisted draft strictly takes precedence over URL defaults)
        if (draft.topicId) setSelectedTopic(draft.topicId);
        if (draft.subtopicId) setSelectedSubtopic(draft.subtopicId);
        if (draft.difficulty) setDifficulty(draft.difficulty);
        if (draft.language) setLanguage(draft.language as QuestionLanguage);
        if (draft.questionStyle) setQuestionStyle(draft.questionStyle as string);
        if (draft.realLifeContext || draft.realWorldContext) {
          setRealLifeContext(draft.realLifeContext || draft.realWorldContext || '');
        }
        if (draft.challengeType) setChallengeType(draft.challengeType);
        if (draft.presentationType) setPresentationType(draft.presentationType);

        // 3. Mode Configuration Restoration
        if (draft.productionMode && VALID_MODES.includes(draft.productionMode as ContentProductionMode)) {
          const loadedMode = draft.productionMode as ContentProductionMode;
          setProductionMode(loadedMode);
          if (draft.targetQuestionCount !== undefined) {
            setTargetQuestionCount(draft.targetQuestionCount);
          }
          if (draft.aspectRatio) {
            setAspectRatio(draft.aspectRatio as '9:16' | '16:9');
          }
          setIsModeModalOpen(false);

          prodContext?.setModeConfig({
            productionMode: loadedMode,
            questionCount: draft.targetQuestionCount,
            aspectRatio: draft.aspectRatio as '9:16' | '16:9',
          });
        } else if (!isValidQueryMode) {
          setIsModeModalOpen(true);
        }

        // 4. Shared Production Context Synchronization
        prodContext?.setEntityIds({ draftId: draft.id });
        if (draft.topicId || draft.subtopicId) {
          prodContext?.setTaxonomy({
            topicId: draft.topicId,
            subtopicId: draft.subtopicId,
          });
        }
        prodContext?.setIsDirty(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to reopen draft:', err);
        const isNotFound = err?.status === 404 || err?.statusCode === 404 || err?.message?.toLowerCase().includes('not found');
        setErrorMessage(
          isNotFound
            ? `Question draft "${queryDraftId}" could not be found or has been removed.`
            : err?.message || `Failed to load question draft "${queryDraftId}".`
        );
        if (!isValidQueryMode) {
          setIsModeModalOpen(true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingDraft(false);
        }
      }
    }

    loadExistingDraft();

    return () => {
      isMounted = false;
    };
  }, [queryDraftId, isValidQueryMode, prodContext]);

  // Synchronize initial URL mode config with ProductionContext
  useEffect(() => {
    if (isValidQueryMode && queryMode) {
      prodContext?.setModeConfig({
        productionMode: queryMode,
        questionCount: queryCount !== undefined
          ? queryCount
          : (queryMode === 'EXPLAINED_QUESTIONS_VIDEO' ? 10 : (queryMode === 'TOPIC_INTRODUCTION' ? 0 : 1)),
        aspectRatio: queryAspect || (queryMode === 'EXPLAINED_QUESTIONS_VIDEO' ? '16:9' : '9:16'),
      });
    }
  }, [isValidQueryMode, queryMode, queryCount, queryAspect, prodContext]);

  // Synchronize active taxonomy selection with ProductionContext
  useEffect(() => {
    if (selectedTopic || selectedSubtopic) {
      prodContext?.setTaxonomy({
        topicId: selectedTopic,
        subtopicId: selectedSubtopic,
      });
    }
  }, [selectedTopic, selectedSubtopic, prodContext]);

  // Synchronize dirty state with ProductionContext
  useEffect(() => {
    prodContext?.setIsDirty(isDirty);
  }, [isDirty, prodContext]);

  // Unsaved-work protection: window beforeunload warning when form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

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
        productionMode: productionMode || undefined,
        targetQuestionCount,
        aspectRatio,
        source: 'AI Question Studio',
        sourceModel: candidate.sourceModel,
        generationLatencyMs: candidate.generationLatencyMs,
        isFallback: candidate.isFallback,
        mathematicalVerification: candidate.mathematicalVerification,
      });

      setSavedDraftId(savedDraft.id);
      setIsDirty(false);
      draftLoadedRef.current = savedDraft.id;

      // Update URL query parameters with draftId without full navigation reload
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('draftId', savedDraft.id);
      const newRelativePathQuery = window.location.pathname + '?' + currentParams.toString();
      window.history.replaceState(null, '', newRelativePathQuery);

      // Synchronize with shared production context
      prodContext?.setEntityIds({ draftId: savedDraft.id });
      prodContext?.setIsDirty(false);

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
    draftLoadedRef.current = null;
    setClientReport(null);
    setServerValidationResult(null);
    setDuplicateMatches([]);
    setErrorMessage(null);
    setSaveSuccessMessage(null);
    setSubmitSuccessResult(null);

    // Clear draftId from deep-link parameters
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete('draftId');
    currentParams.delete('id');
    const paramStr = currentParams.toString();
    const newRelativePathQuery = window.location.pathname + (paramStr ? '?' + paramStr : '');
    window.history.replaceState(null, '', newRelativePathQuery);

    // Sync reset with shared production context
    prodContext?.setEntityIds({ draftId: undefined });
    prodContext?.setIsDirty(false);
  }, [hasCandidate, candidate.questionText, isDirty, selectedTopic, selectedSubtopic, difficulty, challengeType, presentationType, language, realLifeContext, prodContext]);

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

    // Production mode & deep links
    productionMode,
    targetQuestionCount,
    aspectRatio,
    isModeModalOpen,
    setIsModeModalOpen,
    setProductionModeConfig,
    isLoadingDraft,

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
