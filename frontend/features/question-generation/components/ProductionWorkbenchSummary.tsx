/**
 * BURRA PARIKSHA CMS — Production Entry Workbench Summary
 * Task: S8-T13 Shared Production Workbench
 *
 * Integrated summary card acting as the entry point and control center of the production journey.
 * Displays and synchronizes:
 * - Topic: selected syllabus topic name (with loading, empty, and error states)
 * - Subtopic: selected subtopic name (with loading, empty, and error states)
 * - Production Mode: canonical mode name, question count badge, aspect ratio badge, and change mode action
 * - Content Status: actual current draft/workflow status (EMPTY, UNSAVED, DRAFT_SAVED, SUBMITTED, APPROVED)
 * - Progress: current stage (Step 01 / 15) and completed stages count across canonical 15 steps
 * - Next Action: context-aware action guiding the user to the valid next step without bypassing gates
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Layers,
  Sparkles,
  BookOpen,
  Video,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Save,
  Send,
  FolderTree,
  FileText,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

import {
  ContentProductionMode,
  ResolvedWorkflowState,
} from '../../../../shared';

import {
  useProductionJourney,
  JourneyStage,
  JourneyNextAction,
} from '../../../contexts/ProductionJourneyContext';

export type WorkbenchContentStatus =
  | 'EMPTY'
  | 'UNSAVED'
  | 'DRAFT_SAVED'
  | 'SUBMITTED'
  | 'APPROVED';

export interface ResolveWorkbenchSummaryInput {
  selectedTopic: string;
  selectedSubtopic: string;
  taxonomyTree?: any[];
  currentSubtopics?: any[];
  loadingTaxonomy?: boolean;
  loadingSubtopics?: boolean;
  taxonomyError?: string | null;
  subtopicsError?: string | null;

  productionMode: ContentProductionMode | null;
  targetQuestionCount?: number;
  aspectRatio?: '9:16' | '16:9';

  hasCandidate: boolean;
  isDirty: boolean;
  savedDraftId?: string | null;
  isLoadingDraft?: boolean;
  submitSuccessResult?: any | null;
  isApproved?: boolean;

  currentStage?: number;
  stages?: JourneyStage[];
  journeyNextAction?: JourneyNextAction | null;
  resolvedWorkflow?: ResolvedWorkflowState | null;
}

export interface WorkbenchSummaryResult {
  topic: {
    id: string;
    name: string;
    isLoading: boolean;
    hasError: boolean;
    errorMessage?: string | null;
    isUnselected: boolean;
  };
  subtopic: {
    id: string;
    name: string;
    isLoading: boolean;
    hasError: boolean;
    errorMessage?: string | null;
    isUnselected: boolean;
  };
  mode: {
    id: ContentProductionMode | null;
    readableName: string;
    questionCount: number;
    aspectRatio: '9:16' | '16:9';
    isConfigured: boolean;
  };
  status: {
    code: WorkbenchContentStatus;
    label: string;
    badgeVariant: 'slate' | 'amber' | 'blue' | 'indigo' | 'emerald';
    savedDraftId?: string | null;
    isDirty: boolean;
  };
  progress: {
    currentStageNumber: number;
    currentStageLabel: string;
    completedStagesCount: number;
    totalStagesCount: number;
    percentComplete: number;
  };
  nextAction: {
    label: string;
    description: string;
    actionType: 'SELECT_MODE' | 'SELECT_TOPIC' | 'SELECT_SUBTOPIC' | 'GENERATE' | 'SAVE_DRAFT' | 'SUBMIT_VERIFICATION' | 'NAVIGATE';
    route?: string;
  };
}

export function getReadableProductionMode(mode: ContentProductionMode | null): string {
  switch (mode) {
    case 'QUESTION_CHALLENGE_SHORT':
      return 'Mode 1: Question Challenge Short';
    case 'TOPIC_INTRODUCTION':
      return 'Mode 2: Topic Introduction';
    case 'EXPLAINED_QUESTIONS_VIDEO':
      return 'Mode 3: Explained Questions Video';
    default:
      return 'Not Configured';
  }
}

/**
 * Pure function to resolve workbench summary state from raw parameters.
 * Exhaustively testable without DOM / React dependencies.
 */
export function resolveWorkbenchSummary(input: ResolveWorkbenchSummaryInput): WorkbenchSummaryResult {
  const {
    selectedTopic,
    selectedSubtopic,
    taxonomyTree = [],
    currentSubtopics = [],
    loadingTaxonomy = false,
    loadingSubtopics = false,
    taxonomyError = null,
    subtopicsError = null,
    productionMode,
    targetQuestionCount = 1,
    aspectRatio = '9:16',
    hasCandidate,
    isDirty,
    savedDraftId = null,
    isLoadingDraft = false,
    submitSuccessResult = null,
    isApproved = false,
    currentStage = 1,
    stages = [],
    journeyNextAction = null,
    resolvedWorkflow = null,
  } = input;

  // 1. Topic resolution
  let topicName = 'Not Selected';
  let isTopicUnselected = true;
  if (loadingTaxonomy) {
    topicName = 'Loading Topics...';
    isTopicUnselected = false;
  } else if (taxonomyError) {
    topicName = 'Taxonomy Unavailable';
    isTopicUnselected = false;
  } else if (selectedTopic) {
    const found = taxonomyTree.find((t: any) => t.id === selectedTopic);
    topicName = found?.name || selectedTopic;
    isTopicUnselected = false;
  }

  // 2. Subtopic resolution
  let subtopicName = 'Not Selected';
  let isSubtopicUnselected = true;
  if (loadingSubtopics) {
    subtopicName = 'Loading Subtopics...';
    isSubtopicUnselected = false;
  } else if (subtopicsError) {
    subtopicName = 'Subtopics Unavailable';
    isSubtopicUnselected = false;
  } else if (selectedSubtopic === 'RANDOM') {
    subtopicName = 'Random Subtopic';
    isSubtopicUnselected = false;
  } else if (selectedSubtopic) {
    const found = currentSubtopics.find((s: any) => s.id === selectedSubtopic);
    subtopicName = found?.name || selectedSubtopic;
    isSubtopicUnselected = false;
  }

  // 3. Mode resolution
  const isModeConfigured = Boolean(productionMode);
  const readableModeName = getReadableProductionMode(productionMode);

  // 4. Content status resolution
  let statusCode: WorkbenchContentStatus = 'EMPTY';
  let statusLabel = 'Not Started';
  let badgeVariant: 'slate' | 'amber' | 'blue' | 'indigo' | 'emerald' = 'slate';

  if (isApproved) {
    statusCode = 'APPROVED';
    statusLabel = 'Approved (Locked)';
    badgeVariant = 'emerald';
  } else if (submitSuccessResult || currentStage > 1) {
    statusCode = 'SUBMITTED';
    statusLabel = 'Submitted for Verification';
    badgeVariant = 'indigo';
  } else if (isDirty) {
    statusCode = 'UNSAVED';
    statusLabel = savedDraftId ? 'Unsaved Changes' : 'Unsaved Candidate';
    badgeVariant = 'amber';
  } else if (savedDraftId) {
    statusCode = 'DRAFT_SAVED';
    statusLabel = 'Draft Saved';
    badgeVariant = 'blue';
  } else if (hasCandidate) {
    statusCode = 'UNSAVED';
    statusLabel = 'Unsaved Candidate';
    badgeVariant = 'amber';
  } else if (isLoadingDraft) {
    statusCode = 'EMPTY';
    statusLabel = 'Hydrating Draft...';
    badgeVariant = 'slate';
  }

  // 5. Progress resolution
  let totalStagesCount = 15;
  let completedStagesCount = 0;
  let percentComplete = 0;
  let effectiveStageNumber = currentStage;
  const currentStageObj = stages.find((s) => s.stageNumber === currentStage);
  let currentStageLabel = currentStageObj?.label || `Stage ${String(currentStage).padStart(2, '0')}`;

  if (resolvedWorkflow && resolvedWorkflow.progress) {
    effectiveStageNumber = resolvedWorkflow.progress.currentStage || currentStage;
    totalStagesCount = resolvedWorkflow.progress.totalApplicableSteps || 15;
    completedStagesCount = resolvedWorkflow.progress.completedApplicableSteps || 0;
    percentComplete = resolvedWorkflow.progress.percentage || 0;
    currentStageLabel = resolvedWorkflow.progress.currentStageName || currentStageLabel;
  } else {
    totalStagesCount = 15;
    completedStagesCount = stages.filter((s) => s.isCompleted).length;
    percentComplete = Math.min(100, Math.round((completedStagesCount / totalStagesCount) * 100));
  }

  // 6. Next Action resolution
  let nextAction: WorkbenchSummaryResult['nextAction'] = {
    label: 'Select Production Mode',
    description: 'Configure educational format to initialize workbench',
    actionType: 'SELECT_MODE',
  };

  if (!isModeConfigured) {
    nextAction = {
      label: 'Select Production Mode',
      description: 'Configure educational format to initialize workbench',
      actionType: 'SELECT_MODE',
    };
  } else if (isTopicUnselected) {
    nextAction = {
      label: 'Select Syllabus Topic',
      description: 'Choose syllabus topic in the left configuration panel',
      actionType: 'SELECT_TOPIC',
    };
  } else if (isSubtopicUnselected) {
    nextAction = {
      label: 'Select Subtopic',
      description: 'Select a dependent subtopic or Random Subtopic',
      actionType: 'SELECT_SUBTOPIC',
    };
  } else if (!hasCandidate && statusCode === 'EMPTY') {
    nextAction = {
      label: productionMode === 'TOPIC_INTRODUCTION' ? 'Draft Concept' : 'Generate Question',
      description: productionMode === 'TOPIC_INTRODUCTION'
        ? 'Compose conceptual overview statement in canvas'
        : 'Generate AI candidate or enter manual draft',
      actionType: 'GENERATE',
    };
  } else if (isDirty) {
    nextAction = {
      label: 'Save Draft',
      description: 'Persist your draft in-place before submitting',
      actionType: 'SAVE_DRAFT',
    };
  } else if (statusCode === 'DRAFT_SAVED' && savedDraftId) {
    nextAction = {
      label: 'Submit for Verification →',
      description: 'Lock and submit draft for Stage 02 Pedagogical Review',
      actionType: 'SUBMIT_VERIFICATION',
    };
  } else if (statusCode === 'SUBMITTED') {
    const targetDraftId = submitSuccessResult?.draftId || savedDraftId;
    nextAction = {
      label: 'View in Verification (Stage 02) →',
      description: 'Inspect submitted candidate in verification workspace',
      actionType: 'NAVIGATE',
      route: targetDraftId ? `/questions/${targetDraftId}/verify` : '/questions/verify',
    };
  } else if (statusCode === 'APPROVED' || currentStage > 1) {
    if (journeyNextAction) {
      nextAction = {
        label: journeyNextAction.label,
        description: journeyNextAction.description || 'Proceed to next workflow stage',
        actionType: 'NAVIGATE',
        route: journeyNextAction.route,
      };
    } else {
      nextAction = {
        label: 'Continue Workflow →',
        description: 'Advance to next production milestone',
        actionType: 'NAVIGATE',
        route: '/production',
      };
    }
  }

  return {
    topic: {
      id: selectedTopic,
      name: topicName,
      isLoading: loadingTaxonomy,
      hasError: Boolean(taxonomyError),
      errorMessage: taxonomyError,
      isUnselected: isTopicUnselected,
    },
    subtopic: {
      id: selectedSubtopic,
      name: subtopicName,
      isLoading: loadingSubtopics,
      hasError: Boolean(subtopicsError),
      errorMessage: subtopicsError,
      isUnselected: isSubtopicUnselected,
    },
    mode: {
      id: productionMode,
      readableName: readableModeName,
      questionCount: targetQuestionCount,
      aspectRatio,
      isConfigured: isModeConfigured,
    },
    status: {
      code: statusCode,
      label: statusLabel,
      badgeVariant,
      savedDraftId,
      isDirty,
    },
    progress: {
      currentStageNumber: effectiveStageNumber,
      currentStageLabel,
      completedStagesCount,
      totalStagesCount,
      percentComplete,
    },
    nextAction,
  };
}

export interface ProductionWorkbenchSummaryProps {
  selectedTopic: string;
  selectedSubtopic: string;
  taxonomyTree: any[];
  currentSubtopics: any[];
  loadingTaxonomy: boolean;
  loadingSubtopics: boolean;
  taxonomyError?: string | null;
  subtopicsError?: string | null;

  productionMode: ContentProductionMode | null;
  targetQuestionCount: number;
  aspectRatio: '9:16' | '16:9';
  onOpenModeModal: () => void;

  hasCandidate: boolean;
  isDirty: boolean;
  savedDraftId: string | null;
  isLoadingDraft?: boolean;
  isSaving?: boolean;
  isSubmitting?: boolean;
  submitSuccessResult?: any | null;

  onSaveDraft?: () => Promise<any>;
  onSubmitForVerification?: () => Promise<any>;
  onGenerate?: () => Promise<any>;

  className?: string;
}

export const ProductionWorkbenchSummary: React.FC<ProductionWorkbenchSummaryProps> = ({
  selectedTopic,
  selectedSubtopic,
  taxonomyTree,
  currentSubtopics,
  loadingTaxonomy,
  loadingSubtopics,
  taxonomyError,
  subtopicsError,
  productionMode,
  targetQuestionCount,
  aspectRatio,
  onOpenModeModal,
  hasCandidate,
  isDirty,
  savedDraftId,
  isLoadingDraft = false,
  isSaving = false,
  isSubmitting = false,
  submitSuccessResult,
  onSaveDraft,
  onSubmitForVerification,
  onGenerate,
  className = '',
}) => {
  const navigate = useNavigate();

  // Consume authoritative 15-step journey state from context
  let journeyCurrentStage = 1;
  let journeyStages: JourneyStage[] = [];
  let journeyNextAction: JourneyNextAction | null = null;
  let isQuestionApproved = false;
  let journeyResolvedWorkflow: ResolvedWorkflowState | null = null;

  try {
    const journey = useProductionJourney();
    if (journey) {
      journeyCurrentStage = journey.currentStage;
      journeyStages = journey.stages;
      journeyNextAction = journey.nextAction;
      isQuestionApproved = journey.question?.status === 'APPROVED';
      journeyResolvedWorkflow = journey.resolvedWorkflow || null;
    }
  } catch {
    // Graceful fallback if rendered outside provider in isolated tests
  }

  const summary = useMemo(() => {
    return resolveWorkbenchSummary({
      selectedTopic,
      selectedSubtopic,
      taxonomyTree,
      currentSubtopics,
      loadingTaxonomy,
      loadingSubtopics,
      taxonomyError,
      subtopicsError,
      productionMode,
      targetQuestionCount,
      aspectRatio,
      hasCandidate,
      isDirty,
      savedDraftId,
      isLoadingDraft,
      submitSuccessResult,
      isApproved: isQuestionApproved,
      currentStage: journeyCurrentStage,
      stages: journeyStages,
      journeyNextAction,
      resolvedWorkflow: journeyResolvedWorkflow,
    });
  }, [
    selectedTopic,
    selectedSubtopic,
    taxonomyTree,
    currentSubtopics,
    loadingTaxonomy,
    loadingSubtopics,
    taxonomyError,
    subtopicsError,
    productionMode,
    targetQuestionCount,
    aspectRatio,
    hasCandidate,
    isDirty,
    savedDraftId,
    isLoadingDraft,
    submitSuccessResult,
    isQuestionApproved,
    journeyCurrentStage,
    journeyStages,
    journeyNextAction,
    journeyResolvedWorkflow,
  ]);

  const handleNextActionClick = async () => {
    switch (summary.nextAction.actionType) {
      case 'SELECT_MODE':
        onOpenModeModal();
        break;
      case 'SELECT_TOPIC': {
        const el = document.getElementById('topic-select') || document.querySelector('[data-testid="topic-select"]');
        if (el) {
          (el as HTMLElement).focus();
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
      }
      case 'SELECT_SUBTOPIC': {
        const el = document.getElementById('subtopic-select') || document.querySelector('[data-testid="subtopic-select"]');
        if (el) {
          (el as HTMLElement).focus();
          (el as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
      }
      case 'GENERATE':
        if (onGenerate) {
          await onGenerate();
        } else {
          const el = document.getElementById('question-text') || document.querySelector('[data-testid="question-text-input"]');
          if (el) (el as HTMLElement).focus();
        }
        break;
      case 'SAVE_DRAFT':
        if (onSaveDraft) {
          await onSaveDraft();
        }
        break;
      case 'SUBMIT_VERIFICATION':
        if (onSubmitForVerification) {
          await onSubmitForVerification();
        }
        break;
      case 'NAVIGATE':
        if (summary.nextAction.route) {
          navigate(summary.nextAction.route);
        }
        break;
    }
  };

  const getBadgeClasses = (variant: 'slate' | 'amber' | 'blue' | 'indigo' | 'emerald') => {
    switch (variant) {
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-200';
      case 'blue':
        return 'bg-blue-50 text-blue-800 border-blue-300 ring-blue-200';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300 ring-indigo-200';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-200';
      case 'slate':
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300 ring-slate-200';
    }
  };

  return (
    <div
      data-testid="workbench-summary"
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden ${className}`}
    >
      {/* Top Banner: Control Center Header */}
      <div className="px-4 py-2.5 bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-wide text-xs">PRODUCTION WORKBENCH</span>
              <span className="text-slate-400 text-[10px]">•</span>
              <span className="text-[11px] text-indigo-200 font-semibold">Entry Point</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Correlating Stage 01 creation with the canonical 15-stage production journey
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {summary.status.savedDraftId && (
            <span
              data-testid="workbench-draft-id"
              className="px-2 py-0.5 rounded-md bg-white/10 text-slate-200 text-[10px] font-mono border border-white/10"
              title="Saved Draft ID"
            >
              Draft: {summary.status.savedDraftId}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 text-[10px] font-bold border border-indigo-400/30">
            Stage {String(summary.progress.currentStageNumber).padStart(2, '0')} / 15
          </span>
        </div>
      </div>

      {/* Main Grid: 5 Core Workbench Dimensions */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 divide-y md:divide-y-0 lg:divide-x divide-slate-100 text-xs">
        {/* 1. SYLLABUS TAXONOMY */}
        <div className="flex flex-col justify-between gap-1 pr-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
            <FolderTree className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Syllabus Taxonomy</span>
          </div>

          <div className="mt-1 space-y-1">
            {/* Topic */}
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Topic:</span>
              <span
                data-testid="workbench-topic-name"
                className={`font-bold block truncate text-xs ${
                  summary.topic.isUnselected ? 'text-slate-400 italic' : 'text-slate-900'
                }`}
                title={summary.topic.name}
              >
                {summary.topic.name}
              </span>
            </div>

            {/* Subtopic */}
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Subtopic:</span>
              <span
                data-testid="workbench-subtopic-name"
                className={`font-semibold block truncate text-xs ${
                  summary.subtopic.isUnselected ? 'text-slate-400 italic' : 'text-slate-700'
                }`}
                title={summary.subtopic.name}
              >
                {summary.subtopic.name}
              </span>
            </div>
          </div>

          {(summary.topic.isUnselected || summary.subtopic.isUnselected) && (
            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" /> Requires syllabus selection
            </span>
          )}
        </div>

        {/* 2. PRODUCTION MODE */}
        <div className="flex flex-col justify-between gap-1 pt-3 md:pt-0 lg:pl-3.5 pr-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
              {summary.mode.id === 'TOPIC_INTRODUCTION' ? (
                <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              ) : summary.mode.id === 'EXPLAINED_QUESTIONS_VIDEO' ? (
                <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              )}
              <span>Production Mode</span>
            </div>

            <button
              type="button"
              data-testid="workbench-change-mode-btn"
              onClick={onOpenModeModal}
              className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              {summary.mode.isConfigured ? 'Change' : 'Select'}
            </button>
          </div>

          <div className="mt-1">
            <h4
              data-testid="workbench-mode-name"
              className={`font-bold text-xs leading-snug ${
                summary.mode.isConfigured ? 'text-slate-900' : 'text-slate-400 italic'
              }`}
            >
              {summary.mode.readableName}
            </h4>

            {summary.mode.isConfigured && (
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span
                  data-testid="workbench-mode-count"
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                >
                  {`${summary.mode.questionCount} ${summary.mode.questionCount === 1 ? 'Question' : 'Questions'}`}
                </span>
                <span
                  data-testid="workbench-mode-aspect"
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono"
                >
                  {summary.mode.aspectRatio}
                </span>
              </div>
            )}
          </div>

          {!summary.mode.isConfigured && (
            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 shrink-0" /> Needs mode configuration
            </span>
          )}
        </div>

        {/* 3. CONTENT STATUS */}
        <div className="flex flex-col justify-between gap-1 pt-3 md:pt-0 lg:pl-3.5 pr-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Content Status</span>
          </div>

          <div className="mt-1">
            <div className="flex items-center gap-1.5">
              <span
                data-testid="workbench-content-status"
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ring-1 ${getBadgeClasses(
                  summary.status.badgeVariant
                )}`}
              >
                {summary.status.code === 'APPROVED' && <Check className="w-3 h-3 stroke-[3]" />}
                {summary.status.code === 'SUBMITTED' && <CheckCircle className="w-3 h-3" />}
                {summary.status.code === 'UNSAVED' && <Clock className="w-3 h-3" />}
                {summary.status.code === 'DRAFT_SAVED' && <Save className="w-3 h-3" />}
                <span>{summary.status.label}</span>
              </span>
            </div>

            <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
              {summary.status.code === 'UNSAVED' && 'Changes are in-memory. Save draft to preserve work.'}
              {summary.status.code === 'DRAFT_SAVED' && 'Saved in Firestore. Ready for Stage 02 submission.'}
              {summary.status.code === 'SUBMITTED' && 'Candidate submitted. Stage 02 Verification in progress.'}
              {summary.status.code === 'APPROVED' && 'Question verified and approved for Video Production.'}
              {summary.status.code === 'EMPTY' && 'Workspace initialized. Ready to generate or author.'}
            </p>
          </div>

          {isLoadingDraft && (
            <div className="text-[10px] text-indigo-600 flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Hydrating from deep link...
            </div>
          )}
        </div>

        {/* 4. WORKFLOW PROGRESS (15 Canonical Steps) */}
        <div className="flex flex-col justify-between gap-1 pt-3 md:pt-0 lg:pl-3.5 pr-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>Workflow Position</span>
          </div>

          <div className="mt-1">
            <span
              data-testid="workbench-current-step"
              className="font-bold text-xs text-slate-900 block truncate"
              title={summary.progress.currentStageLabel}
            >
              {summary.progress.currentStageLabel}
            </span>

            <div className="mt-1.5 space-y-1">
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${Math.max(6, summary.progress.percentComplete)}%` }}
                />
              </div>

              <div
                data-testid="workbench-stages-progress"
                className="flex items-center justify-between text-[10px] text-slate-500 font-medium"
              >
                <span>{summary.progress.completedStagesCount} of 15 completed</span>
                <span>{summary.progress.percentComplete}%</span>
              </div>
            </div>
          </div>

          <span className="text-[10px] text-slate-400">
            Step 07 Final QC mandatory
          </span>
        </div>

        {/* 5. CONTEXT-AWARE NEXT ACTION */}
        <div className="flex flex-col justify-between gap-1 pt-3 md:pt-0 lg:pl-3.5">
          <div className="flex items-center gap-1.5 text-indigo-600 font-semibold text-[10px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Recommended Action</span>
          </div>

          <div className="mt-1">
            <button
              type="button"
              data-testid="workbench-next-action-btn"
              onClick={handleNextActionClick}
              disabled={isSaving || isSubmitting}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
                summary.nextAction.actionType === 'SAVE_DRAFT'
                  ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-600/20'
                  : summary.nextAction.actionType === 'SUBMIT_VERIFICATION'
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-600/20'
                  : summary.nextAction.actionType === 'NAVIGATE'
                  ? 'bg-indigo-700 hover:bg-indigo-800 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSaving && <RefreshCw className="w-3 h-3 animate-spin shrink-0" />}
              {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin shrink-0" />}
              {!isSaving && !isSubmitting && (
                <>
                  {summary.nextAction.actionType === 'SAVE_DRAFT' && <Save className="w-3 h-3 shrink-0" />}
                  {summary.nextAction.actionType === 'SUBMIT_VERIFICATION' && <Send className="w-3 h-3 shrink-0" />}
                  {summary.nextAction.actionType === 'NAVIGATE' && <ArrowRight className="w-3 h-3 shrink-0" />}
                </>
              )}
              <span className="truncate">{summary.nextAction.label}</span>
            </button>

            <p
              data-testid="workbench-next-action-desc"
              className="text-[10px] text-slate-500 mt-1.5 leading-snug line-clamp-2"
            >
              {summary.nextAction.description}
            </p>
          </div>

          <span className="text-[10px] text-slate-400">
            Save Draft ≠ Submit Verification
          </span>
        </div>
      </div>
    </div>
  );
};
