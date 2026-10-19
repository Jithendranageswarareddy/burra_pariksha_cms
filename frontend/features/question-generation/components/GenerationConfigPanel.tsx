/**
 * BURRA PARIKSHA CMS — Generation Configuration Panel
 * Feature Slice: Question Generation (Stage 01)
 * Mode: Mode 1 Question Challenge Short Workbench
 *
 * Provides authoritative syllabus and mode-specific generation controls:
 * 1. Topic (Authoritative syllabus root from Cloud Firestore)
 * 2. Subtopic (Authoritative child subtopics with cascade invalidation)
 * 3. Question Count & Fixed 9:16 Aspect Ratio
 * 4. Difficulty (Canonical DifficultyLevel contract: EASY, MEDIUM, HARD)
 * 5. Language (Canonical QuestionLanguage: TELUGU, ENGLISH, TELUGU_ENGLISH)
 * 6. Question Style / Hook Type (Approved Mode 1 styles)
 * 7. Optional Real-World Context Hook (Clean text input without hardcoded chips)
 * 8. Compact Generation Summary (Dynamically derived from form state)
 * 9. Primary Generate Question Action
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Sliders,
  Loader2,
  Languages,
  BookOpen,
  Layers,
  AlertCircle,
  RefreshCw,
  Settings,
  ExternalLink,
} from 'lucide-react';
import {
  QuestionLanguage,
  ContentProductionMode,
  DifficultyLevel,
} from '../../../../shared';
import { QuestionBatchAssembly } from '../../../../shared/contracts/question-generation';

export interface GenerationConfigPanelProps {
  taxonomyTree: any[];
  loadingTaxonomy: boolean;
  taxonomyError?: string | null;
  onRetryTaxonomy?: () => void;
  loadingSubtopics?: boolean;
  subtopicsError?: string | null;
  onRetrySubtopics?: () => void;
  selectedTopic: string;
  selectedSubtopic: string;
  currentSubtopics: any[];
  difficulty: string;
  language: QuestionLanguage;
  realLifeContext: string;
  questionStyle: string;
  customInstructions: string;
  isGenerating: boolean;
  aiStatus: { isConfigured: boolean; model: string };

  // Mode-specific configuration props
  productionMode?: ContentProductionMode | string;
  targetQuestionCount?: number;
  aspectRatio?: '9:16' | '16:9' | string;
  batchAssembly?: QuestionBatchAssembly | null;
  onQuestionCountChange?: (count: number) => void;
  onOpenModeModal?: () => void;

  onTopicChange: (topicId: string) => void;
  onSubtopicChange: (subtopicId: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onLanguageChange: (lang: QuestionLanguage) => void;
  onContextChange: (ctx: string) => void;
  onStyleChange: (style: string) => void;
  onCustomInstructionsChange: (instructions: string) => void;
  onGenerate: () => void;
}

const QUESTION_STYLES = [
  { id: 'SPEED_MATH_TRICK', label: '⚡ Speed Math Shortcut' },
  { id: 'STORY_BASED', label: '📖 Real-World Scenario / Story' },
  { id: 'CONCEPTUAL', label: '💡 Fundamental Concept Challenge' },
  { id: 'TRAP_DISTRACTOR', label: '🎯 Trap & Distractor Challenge' },
];

const APPROVED_MODE_1_COUNTS = [1, 5, 10, 15, 20];

export const GenerationConfigPanel: React.FC<GenerationConfigPanelProps> = ({
  taxonomyTree,
  loadingTaxonomy,
  taxonomyError,
  onRetryTaxonomy,
  loadingSubtopics = false,
  subtopicsError = null,
  onRetrySubtopics,
  selectedTopic,
  selectedSubtopic,
  currentSubtopics,
  difficulty,
  language,
  realLifeContext,
  questionStyle,
  customInstructions,
  isGenerating,
  aiStatus,
  productionMode = 'QUESTION_CHALLENGE_SHORT',
  targetQuestionCount = 1,
  aspectRatio = '9:16',
  batchAssembly = null,
  onQuestionCountChange,
  onOpenModeModal,
  onTopicChange,
  onSubtopicChange,
  onDifficultyChange,
  onLanguageChange,
  onContextChange,
  onStyleChange,
  onCustomInstructionsChange,
  onGenerate,
}) => {
  const isTaxonomyUnavailable = loadingTaxonomy || Boolean(taxonomyError) || taxonomyTree.length === 0;
  const isSubtopicUnavailable =
    isTaxonomyUnavailable ||
    loadingSubtopics ||
    Boolean(subtopicsError) ||
    !selectedTopic ||
    currentSubtopics.length === 0;

  const isMode1 = productionMode === 'QUESTION_CHALLENGE_SHORT';
  const isMode2 = productionMode === 'TOPIC_INTRODUCTION';
  const isMode3 = productionMode === 'EXPLAINED_QUESTIONS_VIDEO';

  const selectedTopicRecord = taxonomyTree.find((t) => t.id === selectedTopic);
  const selectedSubtopicRecord = currentSubtopics.find((s) => s.id === selectedSubtopic);

  // Normalize difficulty for select matching
  const normalizedDifficulty =
    difficulty === 'Basic' || difficulty === DifficultyLevel.EASY
      ? DifficultyLevel.EASY
      : difficulty === 'Advanced' || difficulty === DifficultyLevel.HARD
      ? DifficultyLevel.HARD
      : DifficultyLevel.MEDIUM;

  const handleGenerateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      isGenerating ||
      isTaxonomyUnavailable ||
      isSubtopicUnavailable ||
      !selectedTopic ||
      !selectedSubtopic
    ) {
      return;
    }
    onGenerate();
  };

  return (
    <div
      data-testid="generation-config-panel"
      className="bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-3"
    >
      {/* 1. COMPACT MODE HEADER WITH MODEL & CONTROLS */}
      <div
        data-testid="mode-identity-card"
        className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Sliders className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="font-bold text-xs text-slate-900 truncate">Generation Controls</span>
          <span className="text-slate-300">•</span>
          <span className="font-semibold text-xs text-slate-700 truncate">
            {isMode1
              ? 'Mode 1: Question Challenge Short'
              : isMode2
              ? 'Mode 2: Topic Introduction'
              : 'Mode 3: Explained Questions Video'}
          </span>
          <span
            data-testid="mode-badge"
            className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 uppercase tracking-wider shrink-0"
          >
            {isMode1 ? '≤ 58s Short • 9:16' : isMode2 ? '60-180s Concept' : 'Masterclass • 16:9'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {aiStatus.model}
          </span>
          {onOpenModeModal && (
            <button
              type="button"
              data-testid="switch-mode-btn"
              onClick={onOpenModeModal}
              className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
              title="Switch Content Production Mode"
            >
              <Settings className="w-2.5 h-2.5" />
              <span>Switch</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TAXONOMY ERROR & RETRY BANNER */}
      {taxonomyError && (
        <div
          data-testid="taxonomy-error-banner"
          className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-1.5 flex-1 mr-2 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="text-[11px] font-medium leading-tight truncate">{taxonomyError}</span>
          </div>
          {onRetryTaxonomy && (
            <button
              type="button"
              data-testid="retry-taxonomy-btn"
              onClick={onRetryTaxonomy}
              disabled={loadingTaxonomy}
              className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded flex items-center gap-1 cursor-pointer shrink-0 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loadingTaxonomy ? 'animate-spin' : ''}`} />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* TAXONOMY EMPTY STATE BANNER (WITH AUTHORITATIVE CONFIGURATION LINK) */}
      {!loadingTaxonomy && !taxonomyError && taxonomyTree.length === 0 && (
        <div
          data-testid="taxonomy-empty-banner"
          className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-2 text-xs"
        >
          <div className="flex items-start gap-1.5 flex-1 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block text-[11px] leading-tight">
                No topics available in database
              </span>
              <p className="text-[10px] text-amber-700 leading-snug">
                Configure syllabus topics and subtopics in the taxonomy administration panel.
              </p>
            </div>
          </div>
          <Link
            to="/settings?tab=taxonomy"
            data-testid="configure-taxonomy-link"
            className="px-2 py-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded shrink-0 flex items-center gap-1 transition-colors"
          >
            <span>Configure</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>
      )}

      {/* 3. FIELD 1: TOPIC (SYLLABUS ROOT) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-slate-500" />
            <span>Topic (Syllabus Root)</span>
            <span className="text-rose-500">*</span>
          </label>
          {loadingTaxonomy && (
            <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
              Loading topics...
            </span>
          )}
        </div>
        <select
          data-testid="topic-select"
          value={selectedTopic}
          onChange={(e) => onTopicChange(e.target.value)}
          disabled={isTaxonomyUnavailable || isGenerating}
          className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingTaxonomy && (
            <option value="" disabled>
              Loading topics from server...
            </option>
          )}
          {!loadingTaxonomy && taxonomyTree.length === 0 && (
            <option value="" disabled>
              No topics available
            </option>
          )}
          {!loadingTaxonomy && taxonomyTree.length > 0 && !selectedTopic && (
            <option value="" disabled>
              Select a topic...
            </option>
          )}
          {taxonomyTree.map((top) => (
            <option key={top.id} value={top.id}>
              {top.name} ({top.id})
            </option>
          ))}
        </select>
        {!selectedTopic && !loadingTaxonomy && taxonomyTree.length > 0 && (
          <p className="text-[10px] text-amber-600 mt-0.5">⚠️ Select an authoritative syllabus topic to begin.</p>
        )}
      </div>

      {/* 4. FIELD 2: SUBTOPIC */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-500" />
            <span>2. Subtopic</span>
            <span className="text-rose-500">*</span>
          </label>
          {(loadingTaxonomy || loadingSubtopics) && (
            <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
              Loading subtopics...
            </span>
          )}
        </div>

        {/* SUBTOPICS ERROR & RETRY BANNER */}
        {subtopicsError && (
          <div
            data-testid="subtopics-error-banner"
            className="p-2 mb-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-1.5 flex-1 mr-2 min-w-0">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="text-[11px] font-medium leading-tight truncate">{subtopicsError}</span>
            </div>
            {onRetrySubtopics && (
              <button
                type="button"
                data-testid="retry-subtopics-btn"
                onClick={onRetrySubtopics}
                disabled={loadingSubtopics}
                className="px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded flex items-center gap-1 cursor-pointer shrink-0 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loadingSubtopics ? 'animate-spin' : ''}`} />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* SUBTOPICS EMPTY STATE BANNER */}
        {!loadingTaxonomy && !loadingSubtopics && !subtopicsError && selectedTopic && currentSubtopics.length === 0 && (
          <div
            data-testid="subtopics-empty-banner"
            className="p-2 mb-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5 text-xs"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[11px] font-medium leading-tight">
              No subtopics available for this topic.
            </span>
          </div>
        )}

        <select
          data-testid="subtopic-select"
          value={selectedSubtopic}
          onChange={(e) => onSubtopicChange(e.target.value)}
          disabled={isSubtopicUnavailable || isGenerating}
          className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(loadingTaxonomy || loadingSubtopics) && (
            <option value="" disabled>
              Loading subtopics from server...
            </option>
          )}
          {!loadingTaxonomy && !loadingSubtopics && subtopicsError && (
            <option value="" disabled>
              Failed to load subtopics
            </option>
          )}
          {!loadingTaxonomy && !loadingSubtopics && !subtopicsError && (!selectedTopic || currentSubtopics.length === 0) && (
            <option value="" disabled>
              {selectedTopic ? 'No subtopics available for this topic' : 'Select a topic first'}
            </option>
          )}
          {!loadingTaxonomy && !loadingSubtopics && !subtopicsError && selectedTopic && currentSubtopics.length > 0 && !selectedSubtopic && (
            <option value="" disabled>
              Select a subtopic...
            </option>
          )}
          {currentSubtopics.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name} ({sub.id})
            </option>
          ))}
        </select>
        {selectedTopic && !selectedSubtopic && !loadingSubtopics && currentSubtopics.length > 0 && (
          <p className="text-[10px] text-amber-600 mt-0.5">⚠️ Select a valid subtopic to enable generation.</p>
        )}
      </div>

      {/* 5. FIELD 3: QUESTION COUNT & FIXED 9:16 ASPECT RATIO */}
      {isMode1 && (
        <div data-testid="mode-1-controls" className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-slate-800 block mb-1">
              3. Question Count
            </label>
            <select
              data-testid="question-count-select"
              value={targetQuestionCount}
              onChange={(e) => onQuestionCountChange?.(parseInt(e.target.value, 10))}
              disabled={isGenerating}
              className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-hidden"
            >
              {APPROVED_MODE_1_COUNTS.map((cnt) => (
                <option key={cnt} value={cnt}>
                  {cnt === 1 ? '1 Short (Single)' : `${cnt} Shorts (Batch Series)`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-800 block mb-1">
              Aspect Ratio
            </label>
            <div
              data-testid="aspect-ratio-indicator"
              className="w-full text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg p-2 flex items-center justify-between"
            >
              <span>9:16 Vertical</span>
              <span className="text-[9px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-mono">
                Fixed
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 6. FIELDS 4 & 5: DIFFICULTY & LANGUAGE */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-bold text-slate-800 block mb-1">
            4. Difficulty
          </label>
          <select
            data-testid="difficulty-select"
            value={normalizedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            disabled={isGenerating}
            className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value={DifficultyLevel.EASY}>Basic / Easy</option>
            <option value={DifficultyLevel.MEDIUM}>Intermediate / Medium</option>
            <option value={DifficultyLevel.HARD}>Advanced / Hard</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-800 block mb-1 flex items-center gap-1">
            <Languages className="w-3 h-3 text-slate-500" />
            <span>5. Language</span>
          </label>
          <select
            data-testid="language-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as QuestionLanguage)}
            disabled={isGenerating}
            className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value={QuestionLanguage.TELUGU}>తెలుగు (Telugu)</option>
            <option value={QuestionLanguage.ENGLISH}>English</option>
            <option value={QuestionLanguage.TELUGU_ENGLISH}>Bilingual (Telugu + English)</option>
          </select>
        </div>
      </div>

      {/* 7. FIELD 6: QUESTION STYLE / HOOK TYPE */}
      {isMode1 && (
        <div>
          <label className="text-[11px] font-bold text-slate-800 block mb-1">
            6. Question Style / Hook Type
          </label>
          <select
            data-testid="question-style-select"
            value={questionStyle}
            onChange={(e) => onStyleChange(e.target.value)}
            disabled={isGenerating}
            className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-hidden"
          >
            {QUESTION_STYLES.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 8. FIELD 7: OPTIONAL REAL-WORLD CONTEXT HOOK */}
      <div>
        <label className="text-[11px] font-bold text-slate-800 block mb-1">
          7. Real-World Context Hook <span className="font-normal text-slate-400">(Optional)</span>
        </label>
        <input
          data-testid="real-world-context-input"
          type="text"
          value={realLifeContext}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="e.g. Metro commuter rush hour, festival cashback..."
          disabled={isGenerating}
          className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-hidden"
        />
      </div>

      {/* 9. FIELD 8: COMPACT GENERATION SUMMARY CARD */}
      <div
        data-testid="generation-summary-card"
        className="p-2 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-slate-700 text-[11px]"
      >
        <div className="flex items-center justify-between font-bold text-slate-900">
          <span>8. Generation Summary</span>
          <span className="text-[10px] text-indigo-600 font-semibold">
            {isMode1 ? 'Question Challenge Short' : isMode2 ? 'Topic Intro' : 'Masterclass'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-600">
          <div>
            <span className="font-medium text-slate-500">Output: </span>
            <span className="font-semibold text-slate-800">
              {isMode1
                ? `${targetQuestionCount} × Short (9:16, ≤ 58s)`
                : isMode2
                ? 'Intro Video (60-180s)'
                : `${targetQuestionCount} Practice Questions`}
            </span>
          </div>
          <div>
            <span className="font-medium text-slate-500">Language: </span>
            <span className="font-semibold text-slate-800">
              {language === QuestionLanguage.TELUGU
                ? 'Telugu'
                : language === QuestionLanguage.ENGLISH
                ? 'English'
                : 'Bilingual'}
            </span>
          </div>
          <div className="col-span-2 truncate">
            <span className="font-medium text-slate-500">Syllabus: </span>
            <span className="font-semibold text-slate-800">
              {selectedTopicRecord?.name || 'No Topic'} › {selectedSubtopicRecord?.name || 'No Subtopic'}
            </span>
          </div>
        </div>
      </div>

      {/* BATCH ASSEMBLY STATUS (WHEN BATCH ACTIVE) */}
      {batchAssembly && (
        <div
          data-testid="batch-status-card"
          className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900"
        >
          <div className="flex items-center justify-between font-bold">
            <span>Batch status</span>
            <span>{batchAssembly.batchStatus}</span>
          </div>
          <div className="mt-1 flex gap-3">
            <span>
              Persisted valid: {batchAssembly.persistedValidCount === null
                ? 'Not saved'
                : `${batchAssembly.persistedValidCount}/${batchAssembly.requestedCount}`}
            </span>
            <span>In memory: {batchAssembly.inMemoryValidCount}/{batchAssembly.requestedCount}</span>
            <span>Rejected: {batchAssembly.rejectedCount}</span>
            {batchAssembly.overflowCount > 0 && <span>Overflow: {batchAssembly.overflowCount}</span>}
          </div>
        </div>
      )}

      {/* 10. FIELD 9: PRIMARY GENERATE ACTION */}
      <div>
        <button
          type="button"
          data-testid="generate-candidate-btn"
          onClick={handleGenerateClick}
          disabled={
            isGenerating ||
            isTaxonomyUnavailable ||
            isSubtopicUnavailable ||
            !selectedTopic ||
            !selectedSubtopic
          }
          className="w-full py-2.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Generating Candidate...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {`✦ Generate ${isMode1 ? (targetQuestionCount > 1 ? `${targetQuestionCount} Challenge Shorts` : (language === QuestionLanguage.TELUGU ? 'Telugu Question' : 'Question Candidate')) : 'Candidate'}`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
