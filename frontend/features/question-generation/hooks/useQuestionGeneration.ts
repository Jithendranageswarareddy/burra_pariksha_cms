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
  validateProductionModeConfig,
} from '../../../../shared';
import {
  GenerateCandidateInput,
  RefineCandidateInput,
  StudioCandidate,
  Step01StateEvaluation,
  evaluateStep01CandidateState,
  SubmitForVerificationResult,
  QuestionBatchAssembly,
} from '../../../../shared/contracts/question-generation';
import { ExplainedQuestionItem } from '../../../../shared/types/question';
import { assembleQuestionBatch, recalculateQuestionBatchState } from '../../../../shared';
import { questionsApi } from '../../../api/questions.api';
import { taxonomyApi } from '../../../api/taxonomy.api';
import { ProductionJourneyContext } from '../../../contexts/ProductionJourneyContext';

const VALID_MODES: ContentProductionMode[] = [
  'QUESTION_CHALLENGE_SHORT',
  'TOPIC_INTRODUCTION',
  'EXPLAINED_QUESTIONS_VIDEO',
];

/**
 * Resolves replacement subtopic on topic change:
 * If current subtopic belongs to the new topic, preserves it.
 * Otherwise, selects the first available subtopic of the new topic, or '' if none exist.
 */
export function resolveCascadingSubtopic(
  newTopicId: string,
  currentSubtopicId: string,
  taxonomyTree: any[],
  fetchedSubtopics?: any[]
): {
  nextSubtopicId: string;
  targetTopic: any | undefined;
  targetSubtopic: any | undefined;
} {
  const top = taxonomyTree.find((t) => t.id === newTopicId);
  const availableSubtopics = Array.isArray(fetchedSubtopics)
    ? fetchedSubtopics
    : (top?.subtopics || []);

  let nextSubtopicId = '';
  const currentSubBelongs = availableSubtopics.some((s: any) => s.id === currentSubtopicId);

  if (currentSubBelongs) {
    nextSubtopicId = currentSubtopicId;
  } else if (availableSubtopics.length > 0) {
    nextSubtopicId = availableSubtopics[0].id;
  } else {
    nextSubtopicId = '';
  }

  const targetSubtopic = availableSubtopics.find((s: any) => s.id === nextSubtopicId);
  return { nextSubtopicId, targetTopic: top, targetSubtopic };
}

/**
 * Authoritative guard against generation with invalid, incomplete, or mismatched taxonomy.
 */
export function validateGenerationTaxonomy(
  selectedTopic: string,
  selectedSubtopic: string,
  taxonomyTree: any[],
  loadingTaxonomy: boolean,
  taxonomyError: string | null,
  loadingSubtopics = false,
  subtopicsError: string | null = null,
  currentSubtopics?: any[]
): { canGenerate: boolean; error?: string } {
  if (loadingTaxonomy) {
    return { canGenerate: false, error: 'Taxonomy is still loading. Please wait.' };
  }
  if (taxonomyError) {
    return { canGenerate: false, error: `Cannot generate questions: ${taxonomyError}. Please retry loading taxonomy.` };
  }
  if (taxonomyTree.length === 0) {
    return { canGenerate: false, error: 'Cannot generate questions: No topics available in taxonomy.' };
  }
  if (!selectedTopic) {
    return { canGenerate: false, error: 'Please select a valid Topic before generating a question.' };
  }
  if (loadingSubtopics) {
    return { canGenerate: false, error: 'Subtopics are still loading. Please wait.' };
  }
  if (subtopicsError) {
    return { canGenerate: false, error: `Cannot generate questions: ${subtopicsError}. Please retry loading subtopics.` };
  }
  if (!selectedSubtopic) {
    return { canGenerate: false, error: 'Please select a valid Subtopic before generating a question.' };
  }

  const matchedTop = taxonomyTree.find((t) => t.id === selectedTopic);
  if (!matchedTop) {
    return { canGenerate: false, error: `Selected topic "${selectedTopic}" does not exist in authoritative taxonomy.` };
  }
  if (selectedSubtopic !== 'RANDOM') {
    const subList = Array.isArray(currentSubtopics) ? currentSubtopics : (matchedTop.subtopics || []);
    if (subList.length === 0) {
      return { canGenerate: false, error: `No subtopics available for topic "${matchedTop.name}".` };
    }
    const matchedSub = subList.find((s: any) => s.id === selectedSubtopic);
    if (!matchedSub) {
      return { canGenerate: false, error: `Selected subtopic "${selectedSubtopic}" does not belong to topic "${matchedTop.name}".` };
    }
  }

  return { canGenerate: true };
}

/**
 * Validates the complete canonical generation configuration before the API call.
 */
export function validateGenerationSettings(
  productionMode: ContentProductionMode | null,
  targetQuestionCount: number | undefined,
  aspectRatio: '9:16' | '16:9' | undefined,
  language: string | undefined,
  difficulty: string | undefined
): { canGenerate: boolean; error?: string } {
  if (!productionMode || !VALID_MODES.includes(productionMode)) {
    return { canGenerate: false, error: 'Please select a valid production mode before generating.' };
  }

  const modeValidation = validateProductionModeConfig(
    productionMode,
    targetQuestionCount,
    aspectRatio
  );
  if (!modeValidation.isValid) {
    return { canGenerate: false, error: modeValidation.error || 'Invalid production mode configuration.' };
  }

  const validLanguages = Object.values(QuestionLanguage) as string[];
  if (!language || !validLanguages.includes(language)) {
    return { canGenerate: false, error: 'Please select a valid language before generating.' };
  }

  const validDifficulties = [
    DifficultyLevel.EASY,
    DifficultyLevel.MEDIUM,
    DifficultyLevel.HARD,
    'Basic',
    'Intermediate',
    'Advanced',
  ];
  if (!difficulty || !validDifficulties.includes(difficulty)) {
    return { canGenerate: false, error: 'Please select a valid difficulty before generating.' };
  }

  return { canGenerate: true };
}

export interface SubtopicSelectionCallbacks {
  setSelectedTopic: (topicId: string) => void;
  setSelectedSubtopic: (subtopicId: string) => void;
  setCurrentSubtopics: (subtopics: any[]) => void;
  setLoadingSubtopics: (loading: boolean) => void;
  setSubtopicsError: (error: string | null) => void;
  setCandidateTaxonomy: (topicId: string, subtopicId: string) => void;
  setIsValidationStale?: (stale: boolean) => void;
  setServerValidationResult?: (res: any) => void;
  setContextTaxonomy?: (tax: { topicId: string; topicName: string; subtopicId: string; subtopicName: string }) => void;
  getTaxonomyTree: () => any[];
  getSelectedTopic: () => string;
}

export class SubtopicSelectionController {
  private requestId = 0;
  private activeTopicId = '';
  private callbacks: SubtopicSelectionCallbacks;

  constructor(callbacks: SubtopicSelectionCallbacks) {
    this.callbacks = callbacks;
  }

  public updateCallbacks(callbacks: SubtopicSelectionCallbacks): void {
    this.callbacks = callbacks;
  }

  public getActiveRequestId(): number {
    return this.requestId;
  }

  public getActiveTopicId(): string {
    return this.activeTopicId;
  }

  public invalidateOutstandingRequests(clearedTopicId = ''): void {
    this.requestId++;
    this.activeTopicId = clearedTopicId;
  }

  public async handleTopicChange(newTopicId: string): Promise<void> {
    // 1. Immediately invalidate any outstanding in-flight subtopic requests
    this.invalidateOutstandingRequests(newTopicId);

    // 2. Immediately update topic selection and clear invalid subtopic selection
    this.callbacks.setSelectedTopic(newTopicId);
    this.callbacks.setSelectedSubtopic('');
    this.callbacks.setCurrentSubtopics([]);
    this.callbacks.setSubtopicsError(null);

    // 3. Invalidate candidate validation and clear server validation
    this.callbacks.setCandidateTaxonomy(newTopicId, '');
    this.callbacks.setIsValidationStale?.(true);
    this.callbacks.setServerValidationResult?.(null);

    // 4. Immediately update production context with cleared subtopic
    const targetTopic = this.callbacks.getTaxonomyTree().find((t: any) => t.id === newTopicId);
    this.callbacks.setContextTaxonomy?.({
      topicId: newTopicId,
      topicName: targetTopic?.name || '',
      subtopicId: '',
      subtopicName: '',
    });

    // 5. Fetch subtopics for the new topic (if non-empty)
    if (newTopicId) {
      await this.loadSubtopicsForTopic(newTopicId);
    } else {
      this.callbacks.setLoadingSubtopics(false);
    }
  }

  public async loadSubtopicsForTopic(
    topicId: string,
    preferredSubtopicId?: string,
    isRetry = false
  ): Promise<void> {
    if (!topicId) {
      this.invalidateOutstandingRequests('');
      this.callbacks.setCurrentSubtopics([]);
      this.callbacks.setSelectedSubtopic('');
      this.callbacks.setCandidateTaxonomy('', '');
      this.callbacks.setLoadingSubtopics(false);
      this.callbacks.setSubtopicsError(null);
      this.callbacks.setContextTaxonomy?.({
        topicId: '',
        topicName: '',
        subtopicId: '',
        subtopicName: '',
      });
      return;
    }

    const currentReqId = ++this.requestId;
    this.activeTopicId = topicId;
    this.callbacks.setLoadingSubtopics(true);
    this.callbacks.setSubtopicsError(null);

    try {
      // Authoritative API call: NO fallback to taxonomyTree embedded subtopics!
      const fetchedSubs = await taxonomyApi.getSubtopics(topicId, { includeInactive: false });

      // Stale response guard: discard if request sequence advanced or topic is obsolete
      if (
        this.requestId !== currentReqId ||
        this.activeTopicId !== topicId ||
        this.callbacks.getSelectedTopic() !== topicId
      ) {
        return;
      }

      const activeSubs = (fetchedSubs || []).filter((s: any) => s.isActive !== false);
      this.callbacks.setCurrentSubtopics(activeSubs);

      // Select replacement only if valid for the new topic, otherwise clear selection
      const candidateSub = preferredSubtopicId !== undefined ? preferredSubtopicId : '';
      const existsInNew = activeSubs.some((s: any) => s.id === candidateSub);
      let nextSub = '';
      if (candidateSub === 'RANDOM') {
        nextSub = 'RANDOM';
      } else if (existsInNew) {
        nextSub = candidateSub;
      } else if (activeSubs.length > 0) {
        nextSub = activeSubs[0].id;
      } else {
        nextSub = '';
      }

      this.callbacks.setSelectedSubtopic(nextSub);
      this.callbacks.setCandidateTaxonomy(topicId, nextSub);

      const matchedTopic = this.callbacks.getTaxonomyTree().find((t: any) => t.id === topicId);
      const matchedSub = activeSubs.find((s: any) => s.id === nextSub);
      this.callbacks.setContextTaxonomy?.({
        topicId,
        topicName: matchedTopic?.name || '',
        subtopicId: nextSub,
        subtopicName: matchedSub?.name || '',
      });
    } catch (err: any) {
      // Stale response guard for errors: obsolete topic error must not overwrite state
      if (
        this.requestId !== currentReqId ||
        this.activeTopicId !== topicId ||
        this.callbacks.getSelectedTopic() !== topicId
      ) {
        return;
      }

      console.error(`Failed to load subtopics for topic "${topicId}":`, err);
      const msg = err?.message || 'Failed to load subtopics for topic';
      this.callbacks.setSubtopicsError(msg);
      this.callbacks.setCurrentSubtopics([]);
      this.callbacks.setSelectedSubtopic('');
      this.callbacks.setCandidateTaxonomy(topicId, '');

      const matchedTopic = this.callbacks.getTaxonomyTree().find((t: any) => t.id === topicId);
      this.callbacks.setContextTaxonomy?.({
        topicId,
        topicName: matchedTopic?.name || '',
        subtopicId: '',
        subtopicName: '',
      });
    } finally {
      if (
        this.requestId === currentReqId &&
        this.activeTopicId === topicId &&
        this.callbacks.getSelectedTopic() === topicId
      ) {
        this.callbacks.setLoadingSubtopics(false);
      }
    }
  }

  public async retryLoadSubtopics(): Promise<void> {
    const currentTopic = this.callbacks.getSelectedTopic();
    if (currentTopic) {
      await this.loadSubtopicsForTopic(currentTopic, undefined, true);
    }
  }
}

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
  const queryCountStr = searchParams.get('count');
  const queryCount = queryCountStr ? parseInt(queryCountStr, 10) : undefined;
  const queryAspect = searchParams.get('aspect') as '9:16' | '16:9' | null;

  const isValidQueryMode = Boolean(queryMode && VALID_MODES.includes(queryMode));

  // Shared Production Journey Context
  const prodContext = useContext(ProductionJourneyContext);

  const contextMode = prodContext?.modeConfig?.productionMode;
  const hasValidContextMode = Boolean(contextMode && VALID_MODES.includes(contextMode));

  const effectiveMode: ContentProductionMode | null = isValidQueryMode
    ? queryMode!
    : (hasValidContextMode ? contextMode! : null);

  const effectiveCount = isValidQueryMode
    ? (queryCount !== undefined
        ? queryCount
        : (queryMode === 'EXPLAINED_QUESTIONS_VIDEO' ? 10 : (queryMode === 'TOPIC_INTRODUCTION' ? 0 : 1)))
    : (hasValidContextMode && prodContext?.modeConfig?.questionCount !== undefined
        ? prodContext.modeConfig.questionCount
        : (effectiveMode === 'EXPLAINED_QUESTIONS_VIDEO' ? 10 : (effectiveMode === 'TOPIC_INTRODUCTION' ? 0 : 1)));

  const effectiveAspect: '9:16' | '16:9' = isValidQueryMode
    ? (queryAspect || (queryMode === 'EXPLAINED_QUESTIONS_VIDEO' ? '16:9' : '9:16'))
    : (hasValidContextMode && prodContext?.modeConfig?.aspectRatio
        ? prodContext.modeConfig.aspectRatio
        : (effectiveMode === 'EXPLAINED_QUESTIONS_VIDEO' ? '16:9' : '9:16'));

  // Production Mode Configuration State
  const [productionMode, setProductionMode] = useState<ContentProductionMode | null>(
    effectiveMode
  );
  const [targetQuestionCount, setTargetQuestionCount] = useState<number>(
    effectiveCount
  );
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>(
    effectiveAspect
  );
  const [isModeModalOpen, setIsModeModalOpen] = useState<boolean>(
    !effectiveMode && !queryDraftId
  );
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Draft loading state & deduplication ref
  const [isLoadingDraft, setIsLoadingDraft] = useState<boolean>(Boolean(queryDraftId));
  const draftLoadedRef = useRef<string | null>(null);

  // 1. Taxonomy & Options State
  const [taxonomyTree, setTaxonomyTree] = useState<any[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);

  // S8-T11: Dependent Subtopic Loading State
  const [currentSubtopics, setCurrentSubtopics] = useState<any[]>([]);
  const [loadingSubtopics, setLoadingSubtopics] = useState<boolean>(false);
  const [subtopicsError, setSubtopicsError] = useState<string | null>(null);
  const subtopicsRequestIdRef = useRef<number>(0);
    const [aiStatus, setAiStatus] = useState<{ isConfigured: boolean; model: string }>({
      isConfigured: false,
      model: 'gemini-3.1-flash-lite',
    });
    const [configError, setConfigError] = useState<string | null>(null);

    // Configuration options selection: derive from deep link or shared production context
    const [selectedTopic, setSelectedTopic] = useState<string>(
      queryTopic || prodContext?.taxonomy?.topicId || ''
    );
    const [selectedSubtopic, setSelectedSubtopic] = useState<string>(
      querySubtopic || prodContext?.taxonomy?.subtopicId || ''
    );
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
      topicId: queryTopic || prodContext?.taxonomy?.topicId || '',
      subtopicId: querySubtopic || prodContext?.taxonomy?.subtopicId || '',
      difficulty,
      challengeType,
      presentationType,
      language,
      realLifeContext,
      questionStyle,
      generationMode: 'SUBTOPIC',
      productionMode: effectiveMode || 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: effectiveCount,
      aspectRatio: effectiveAspect,
      tags: ['Aptitude', 'Telugu'],
    });

    const [hasCandidate, setHasCandidate] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
    const [batchAssembly, setBatchAssembly] = useState<QuestionBatchAssembly | null>(null);


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
  const [draftVersion, setDraftVersion] = useState<number | undefined>(undefined);

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

      // Mode-specific defaults and reconciliation of invalid parameters across mode switches
      if (mode === 'QUESTION_CHALLENGE_SHORT') {
        const allowedCounts = [1, 5, 10, 15, 20];
        if (finalCount === undefined || !allowedCounts.includes(finalCount)) {
          finalCount = 1;
        }
        finalAspect = '9:16';
      } else if (mode === 'TOPIC_INTRODUCTION') {
        finalCount = 0;
        if (!finalAspect || (finalAspect !== '9:16' && finalAspect !== '16:9')) {
          finalAspect = '9:16';
        }
      } else if (mode === 'EXPLAINED_QUESTIONS_VIDEO') {
        const allowedCounts = [5, 10, 15, 20];
        if (finalCount === undefined || !allowedCounts.includes(finalCount)) {
          finalCount = 10;
        }
        finalAspect = '16:9';
      } else {
        finalCount = 1;
        finalAspect = '9:16';
      }

      // Enforce validation before accepting
      const val = validateProductionModeConfig(mode, finalCount, finalAspect);
      if (!val.isValid) {
        setErrorMessage(val.error || 'Invalid production mode configuration');
        return;
      }

      setErrorMessage(null);
      setProductionMode(mode);
      setTargetQuestionCount(finalCount);
      setAspectRatio(finalAspect);
      setIsModeModalOpen(false);

      // Reconcile candidate fields on mode change
      setCandidate((prev) => ({
        ...prev,
        productionMode: mode,
        targetQuestionCount: finalCount,
        aspectRatio: finalAspect,
      }));

      // Persist in URL query parameters without reloading
      if (typeof window !== 'undefined') {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.set('mode', mode);
        currentParams.set('count', String(finalCount));
        currentParams.set('aspect', finalAspect!);
        const newRelativePathQuery = window.location.pathname + '?' + currentParams.toString();
        window.history.replaceState(null, '', newRelativePathQuery);
      }

      // Synchronize with shared production context
      prodContext?.setModeConfig({
        productionMode: mode,
        questionCount: finalCount,
        aspectRatio: finalAspect,
      });
    },
    [prodContext]
  );

  // Selected topic ref to avoid stale closures and prevent topic selection changes from retriggering taxonomy fetch
  const selectedTopicRef = useRef(selectedTopic);
  useEffect(() => {
    selectedTopicRef.current = selectedTopic;
  }, [selectedTopic]);

  const taxonomyTreeRef = useRef(taxonomyTree);
  useEffect(() => {
    taxonomyTreeRef.current = taxonomyTree;
  }, [taxonomyTree]);

  // Instantiate SubtopicSelectionController once and keep callbacks updated
  const controllerRef = useRef<SubtopicSelectionController | null>(null);
  const getControllerCallbacks = (): SubtopicSelectionCallbacks => ({
    setSelectedTopic: (t) => {
      selectedTopicRef.current = t;
      setSelectedTopic(t);
    },
    setSelectedSubtopic: (s) => setSelectedSubtopic(s),
    setCurrentSubtopics: (subs) => setCurrentSubtopics(subs),
    setLoadingSubtopics: (l) => setLoadingSubtopics(l),
    setSubtopicsError: (e) => setSubtopicsError(e),
    setCandidateTaxonomy: (topId, subId) => {
      setCandidate((c) => ({ ...c, topicId: topId, subtopicId: subId }));
    },
    setIsValidationStale: (stale) => setIsValidationStale(stale),
    setServerValidationResult: (res) => setServerValidationResult(res),
    setContextTaxonomy: (tax) => prodContext?.setTaxonomy(tax),
    getTaxonomyTree: () => taxonomyTreeRef.current,
    getSelectedTopic: () => selectedTopicRef.current,
  });

  if (!controllerRef.current) {
    controllerRef.current = new SubtopicSelectionController(getControllerCallbacks());
  } else {
    controllerRef.current.updateCallbacks(getControllerCallbacks());
  }

  // S8-T11: Load dependent subtopics only for the currently selected topic
  const loadSubtopicsForTopic = useCallback(
    async (topicId: string, preferredSubtopicId?: string, isRetry = false) => {
      await controllerRef.current?.loadSubtopicsForTopic(topicId, preferredSubtopicId, isRetry);
    },
    []
  );

  // Load generation options from authoritative taxonomy API
  const loadTaxonomyOptions = useCallback(async (isRetry = false) => {
    setLoadingTaxonomy(true);
    setTaxonomyError(null);
    setConfigError(null);

    try {
      const [pureTree, aiInfo] = await Promise.all([
        taxonomyApi.getTree(),
        questionsApi.getAiStatus().catch(() => ({ isConfigured: false, model: 'gemini-3.1-flash-lite' })),
      ]);

      const topicsList = pureTree || [];
      setTaxonomyTree(topicsList);
      setAiStatus(aiInfo);

      if (topicsList.length === 0) {
        // Empty taxonomy state: no hardcoded defaults
        controllerRef.current?.invalidateOutstandingRequests('');
        setSelectedTopic('');
        setSelectedSubtopic('');
        setCurrentSubtopics([]);
        setCandidate((prev) => ({ ...prev, topicId: '', subtopicId: '' }));
        return;
      }

      // If not reopening a draft, initialize from deep-link, shared production context, or first available topic
      if (!queryDraftId) {
        const initialTopicId = queryTopic || prodContext?.taxonomy?.topicId;
        const initialSubtopicId = querySubtopic || prodContext?.taxonomy?.subtopicId;
        if (initialTopicId) {
          const matchedTopic = topicsList.find((t) => t.id === initialTopicId);
          if (matchedTopic) {
            setSelectedTopic(matchedTopic.id);
            setCandidate((prev) => ({ ...prev, topicId: matchedTopic.id }));
            loadSubtopicsForTopic(matchedTopic.id, initialSubtopicId || undefined, isRetry);
          } else {
            // Invalid topic! Fall back to first valid persisted topic
            const firstTopic = topicsList[0];
            setSelectedTopic(firstTopic.id);
            setCandidate((prev) => ({ ...prev, topicId: firstTopic.id }));
            loadSubtopicsForTopic(firstTopic.id, undefined, isRetry);
          }
        } else if (!selectedTopicRef.current || isRetry) {
          const firstTopic = topicsList[0];
          setSelectedTopic(firstTopic.id);
          setCandidate((prev) => ({ ...prev, topicId: firstTopic.id }));
          loadSubtopicsForTopic(firstTopic.id, undefined, isRetry);
        }
      }
    } catch (err: any) {
      console.error('Failed to load Question Generation options:', err);
      const msg = err?.message || 'Failed to load taxonomy tree';
      controllerRef.current?.invalidateOutstandingRequests('');
      setTaxonomyError(msg);
      setConfigError(msg);
      setTaxonomyTree([]);
      setSelectedTopic('');
      setSelectedSubtopic('');
      setCurrentSubtopics([]);
    } finally {
      setLoadingTaxonomy(false);
    }
  }, [queryDraftId, queryTopic, querySubtopic, loadSubtopicsForTopic]);

  useEffect(() => {
    loadTaxonomyOptions();
  }, [loadTaxonomyOptions]);

  const retryLoadTaxonomy = useCallback(async () => {
    await loadTaxonomyOptions(true);
  }, [loadTaxonomyOptions]);

  const retryLoadSubtopics = useCallback(async () => {
    await controllerRef.current?.retryLoadSubtopics();
  }, []);


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
          questionText: draft.questionText || draft.question || draft.introductoryConcept || '',
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
          productionMode: draft.productionMode,
          targetQuestionCount: draft.targetQuestionCount,
          aspectRatio: draft.aspectRatio,
          introductoryConcept: draft.introductoryConcept || (draft.productionMode === 'TOPIC_INTRODUCTION' ? draft.questionText : ''),
          conceptTitle: draft.conceptTitle || '',
          syllabusScopeNotes: draft.syllabusScopeNotes || '',
          questions: draft.questions || [],
          tags: draft.tags || ['Aptitude', 'Telugu'],
          sourceModel: draft.sourceModel,
          generationLatencyMs: draft.generationLatencyMs,
          isFallback: draft.isFallback,
          mathematicalVerification: draft.mathematicalVerification,
        };

        setCandidate(loadedCandidate);
        if (draft.batchStatus && draft.slots) {
          setBatchAssembly({
            requestedCount: (draft.targetQuestionCount || 5) as 5 | 10 | 15 | 20,
            inMemoryValidCount: draft.persistedValidCount || 0,
            persistedValidCount: draft.persistedValidCount || 0,
            rejectedCount: draft.rejectedCount || 0,
            overflowCount: draft.overflowCount || 0,
            batchStatus: draft.batchStatus,
            slots: draft.slots,
            rejectedItems: draft.rejectedItems || [],
          });
        }
        setHasCandidate(true);
        setIsDirty(false); // Clean saved state!
        setSavedDraftId(draft.id);
        setDraftVersion(draft.version);

        // If the draft is in submitted stage, restore submission state
        if (draft.status === 'SUBMITTED_FOR_REVIEW' || draft.workflowStage === 'STAGE_02_VERIFICATION') {
          setSubmitSuccessResult({
            success: true,
            draftId: draft.id,
            status: 'SUBMITTED_FOR_REVIEW',
            workflowStage: 'STAGE_02_VERIFICATION',
            workflowInstanceId: draft.workflowInstanceId,
            currentStep: 2,
            message: 'Draft has been submitted for Stage 02 Verification.',
            submittedAt: draft.updatedAt || new Date().toISOString(),
          });
        }

        // 2. Options and Taxonomy Restoration (persisted draft strictly takes precedence over URL defaults)
        if (draft.topicId) {
          setSelectedTopic(draft.topicId);
          loadSubtopicsForTopic(draft.topicId, draft.subtopicId);
        }
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
  }, [isValidQueryMode, queryMode, queryCount, queryAspect, prodContext]);  // Synchronize active taxonomy selection with ProductionContext
  useEffect(() => {
    if (selectedTopic || selectedSubtopic) {
      const top = taxonomyTree.find((t: any) => t.id === selectedTopic);
      const sub =
        (currentSubtopics || []).find((s: any) => s.id === selectedSubtopic) ||
        (top?.subtopics || []).find((s: any) => s.id === selectedSubtopic);
      prodContext?.setTaxonomy({
        topicId: selectedTopic,
        topicName: top?.name || '',
        subtopicId: selectedSubtopic,
        subtopicName: sub?.name || '',
      });
    }
  }, [selectedTopic, selectedSubtopic, taxonomyTree, currentSubtopics, prodContext]);

  // Synchronize dirty state with ProductionContext
  useEffect(() => {
    prodContext?.setIsDirty(isDirty);
  }, [isDirty, prodContext]);

  // Unsaved-work protection: window beforeunload warning when form is dirty
  useEffect(() => {
    if (typeof window === 'undefined') return;

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

  // Topic & Subtopic Cascading Handlers (S8-T11 dependent subtopic selection)
  const handleTopicChange = useCallback(
    async (topId: string) => {
      await controllerRef.current?.handleTopicChange(topId);
    },
    []
  );

  const handleSubtopicChange = useCallback(
    (subId: string) => {
      setSelectedSubtopic(subId);
      setCandidate((prev) => ({ ...prev, subtopicId: subId }));

      setIsValidationStale(true);
      setServerValidationResult(null);

      const currentSubtopic = currentSubtopics.find((s) => s.id === subId);
      prodContext?.setTaxonomy({
        subtopicId: subId,
        subtopicName: currentSubtopic?.name || '',
      });
    },
    [currentSubtopics, prodContext]
  );


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

    if (
      batchAssembly &&
      productionMode === 'QUESTION_CHALLENGE_SHORT' &&
      ['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'explanation'].includes(field)
    ) {
      setBatchAssembly((current) => {
        if (!current || current.slots.length === 0) return current;
        const slots = current.slots.map((slot, index) => {
          if (index !== 0) return slot;
          const updated = { ...slot, isManuallyEdited: true, status: 'MANUALLY_EDITED' as const };
          if (field === 'questionText') updated.questionText = String(value);
          if (field === 'optionA') updated.options = { ...updated.options, a: String(value) };
          if (field === 'optionB') updated.options = { ...updated.options, b: String(value) };
          if (field === 'optionC') updated.options = { ...updated.options, c: String(value) };
          if (field === 'optionD') updated.options = { ...updated.options, d: String(value) };
          if (field === 'correctAnswer') updated.correctAnswer = value;
          if (field === 'explanation') updated.explanation = String(value);
          return updated;
        });
        const counts = recalculateQuestionBatchState(
          current.requestedCount,
          slots,
          current.rejectedItems,
          current.overflowCount
        );
        return { ...current, slots, ...counts, persistedValidCount: current.persistedValidCount };
      });
    }

    if (field === 'questionText') {
      triggerDuplicateCheck(value);
    }
    setHasCandidate(true);
  }, [batchAssembly, productionMode, serverValidationResult, triggerDuplicateCheck]);

  // Update an individual question in Mode 3 (EXPLAINED_QUESTIONS_VIDEO)
  const updateExplainedQuestion = useCallback(
    (index: number, updatedFields: Partial<ExplainedQuestionItem>) => {
      setIsDirty(true);
      setSaveSuccessMessage(null);
      setSubmitSuccessResult(null);

      setCandidate((prev) => {
        const currentList = [...(prev.questions || [])];
        const existingIdx = currentList.findIndex((q) => q.questionNumber === index);

        if (existingIdx >= 0) {
          currentList[existingIdx] = {
            ...currentList[existingIdx],
            ...updatedFields,
            questionNumber: index,
          };
        } else {
          currentList.push({
            questionNumber: index,
            questionText: '',
            options: { a: '', b: '', c: '', d: '' },
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctAnswer: 'A',
            explanation: '',
            ...updatedFields,
          });
        }

        return {
          ...prev,
          questions: currentList,
        };
      });

      setHasCandidate(true);
    },
    []
  );

  // Evaluated workflow state
  const workflowState: Step01StateEvaluation = useMemo(() => {
    return evaluateStep01CandidateState({
      hasCandidate,
      candidate: {
        ...candidate,
        productionMode: productionMode || undefined,
        targetQuestionCount,
        aspectRatio,
      },
      configError,
    });
  }, [hasCandidate, candidate, productionMode, targetQuestionCount, aspectRatio, configError]);

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

    // Guard: Prevent generation if taxonomy is not loaded, has errors, or lacks valid selection
    const validation = validateGenerationTaxonomy(
      selectedTopic,
      selectedSubtopic,
      taxonomyTree,
      loadingTaxonomy,
      taxonomyError,
      loadingSubtopics,
      subtopicsError,
      currentSubtopics
    );
    if (!validation.canGenerate) {
      setErrorMessage(validation.error || 'Invalid taxonomy configuration');
      return;
    }

    const settingsValidation = validateGenerationSettings(
      productionMode,
      targetQuestionCount,
      aspectRatio,
      language,
      difficulty
    );
    if (!settingsValidation.canGenerate) {
      setErrorMessage(settingsValidation.error || 'Invalid generation configuration');
      return;
    }

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
        productionMode: productionMode || 'QUESTION_CHALLENGE_SHORT',
        targetQuestionCount,
        questionCount: targetQuestionCount,
        aspectRatio,
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
        productionMode: productionMode || 'QUESTION_CHALLENGE_SHORT',
        targetQuestionCount,
        aspectRatio,
        tags: ['AI-Generated', 'Aptitude'],
        sourceModel: res.metadata?.modelUsed || aiStatus.model,
        generationLatencyMs: res.metadata?.generationDurationMs || Date.now() - startTime,
        isFallback: Boolean(res.metadata?.fallbackUsed),
        mathematicalVerification: mathVerification,
      };

      setCandidate(newCandidate);
      if (productionMode === 'QUESTION_CHALLENGE_SHORT' && targetQuestionCount > 1) {
        setBatchAssembly((current) => assembleQuestionBatch(
          targetQuestionCount as 5 | 10 | 15 | 20,
          [generated],
          current?.slots || []
        ));
      } else {
        setBatchAssembly(null);
      }
      setHasCandidate(true);
      setIsDirty(true);
      if (!batchAssembly || productionMode !== 'QUESTION_CHALLENGE_SHORT' || targetQuestionCount <= 1) {
        setSavedDraftId(null); // Fresh single candidate is not yet saved
      }
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
      const isMode2 = productionMode === 'TOPIC_INTRODUCTION';
      const isMode3 = productionMode === 'EXPLAINED_QUESTIONS_VIDEO';

      const qText = isMode2
        ? (candidate.introductoryConcept || candidate.questionText || '').trim()
        : (candidate.questionText || candidate.introductoryConcept || '').trim();

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
        questionText: qText,
        options: isMode2
          ? undefined
          : {
              a: (candidate.optionA || '').trim(),
              b: (candidate.optionB || '').trim(),
              c: (candidate.optionC || '').trim(),
              d: (candidate.optionD || '').trim(),
            },
        optionA: isMode2 ? undefined : (candidate.optionA || '').trim(),
        optionB: isMode2 ? undefined : (candidate.optionB || '').trim(),
        optionC: isMode2 ? undefined : (candidate.optionC || '').trim(),
        optionD: isMode2 ? undefined : (candidate.optionD || '').trim(),
        correctAnswer: isMode2 ? undefined : candidate.correctAnswer,
        explanation: (candidate.explanation || '').trim(),
        tags: candidate.tags,
        productionMode: productionMode || undefined,
        targetQuestionCount,
        aspectRatio,
        introductoryConcept: candidate.introductoryConcept || (isMode2 ? qText : undefined),
        conceptTitle: candidate.conceptTitle,
        syllabusScopeNotes: candidate.syllabusScopeNotes,
        questions: isMode3 ? (candidate.questions || []) : [],
        source: 'AI Question Studio',
        sourceModel: candidate.sourceModel,
        generationLatencyMs: candidate.generationLatencyMs,
        isFallback: candidate.isFallback,
        mathematicalVerification: candidate.mathematicalVerification,
        batchStatus: batchAssembly?.batchStatus,
        persistedValidCount: batchAssembly?.persistedValidCount ?? undefined,
        rejectedCount: batchAssembly?.rejectedCount,
        overflowCount: batchAssembly?.overflowCount,
        slots: batchAssembly?.slots,
        rejectedItems: batchAssembly?.rejectedItems,
      });

      setSavedDraftId(savedDraft.id);
      if (batchAssembly) {
        setBatchAssembly((current) => current ? {
          ...current,
          persistedValidCount: savedDraft.persistedValidCount ?? current.inMemoryValidCount,
          inMemoryValidCount: savedDraft.persistedValidCount ?? current.inMemoryValidCount,
          batchStatus: savedDraft.batchStatus ?? current.batchStatus,
          rejectedCount: savedDraft.rejectedCount ?? current.rejectedCount,
        } : current);
      }
      setDraftVersion(savedDraft.version);
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

    // 3. Reject if mode configuration is invalid or missing
    if (!productionMode) {
      setErrorMessage('Production mode is required before submitting for verification.');
      return null;
    }
    const modeValidation = validateProductionModeConfig(productionMode, targetQuestionCount, aspectRatio);
    if (!modeValidation.isValid) {
      setErrorMessage(modeValidation.error || 'Invalid production mode configuration.');
      return null;
    }

    // 4. Reject if candidate is structurally incomplete or invalid
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
        expectedVersion: draftVersion || 1,
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
    setBatchAssembly(null);

    setHasCandidate(false);
    setIsDirty(false);
    setSavedDraftId(null);
    setDraftVersion(undefined);
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
    taxonomyError,
    retryLoadTaxonomy,
    loadingSubtopics,
    subtopicsError,
    retryLoadSubtopics,
    loadSubtopicsForTopic,
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
    activeQuestionIndex,
    setActiveQuestionIndex,

    // Candidate
    candidate,
    batchAssembly,
    hasCandidate,
    isDirty,
    savedDraftId,
    workflowState,
    updateCandidateField,
    updateExplainedQuestion,
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
    subtopicController: controllerRef.current,
  };
}
