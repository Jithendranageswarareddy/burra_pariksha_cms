/**
 * BURRA PARIKSHA CMS — Generation Configuration Panel
 * Feature Slice: Question Generation (Stage 01)
 *
 * Provides authoritative syllabus and generation controls:
 * - Two-Tier Taxonomy: Dynamic Topic -> Subtopic selection (S8-T10)
 * - Loading, empty, error, and retry states
 * - Pedagogical difficulty constraint
 * - Telugu / English language constraint
 * - Real-world context prompt suggestions
 * - Generation trigger action
 */

import React from 'react';
import { Sparkles, Sliders, Loader2, Languages, BookOpen, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { QuestionLanguage } from '../../../../shared';

interface GenerationConfigPanelProps {
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
  onTopicChange: (topicId: string) => void;
  onSubtopicChange: (subtopicId: string) => void;
  onDifficultyChange: (difficulty: string) => void;
  onLanguageChange: (lang: QuestionLanguage) => void;
  onContextChange: (ctx: string) => void;
  onStyleChange: (style: string) => void;
  onCustomInstructionsChange: (instructions: string) => void;
  onGenerate: () => void;
}

const CONTEXT_SUGGESTIONS = [
  'Metro escalator commuter rush hour',
  'UPI festive shopping cashback',
  'Cricket run-rate chase in last 5 overs',
  'E-commerce delivery courier speed',
  'Monthly salary savings vs inflation',
  'Train overtaking on parallel tracks',
  'Water tank leakage & dual pump refill',
];

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

  return (
    <div className="bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-xl p-3.5 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-900">
          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
          <h3 className="text-xs font-bold tracking-tight">Generation Controls</h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
          {aiStatus.model}
        </span>
      </div>

      {/* TAXONOMY ERROR & RETRY BANNER */}
      {taxonomyError && (
        <div
          data-testid="taxonomy-error-banner"
          className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs"
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

      {/* TAXONOMY EMPTY STATE BANNER */}
      {!loadingTaxonomy && !taxonomyError && taxonomyTree.length === 0 && (
        <div
          data-testid="taxonomy-empty-banner"
          className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5 text-xs"
        >
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-[11px] font-medium leading-tight">
            No topics available. Please configure syllabus taxonomy in Admin Settings.
          </span>
        </div>
      )}

      {/* TWO-TIER TAXONOMY: TOPIC -> SUBTOPIC */}
      <div className="space-y-2">
        <div>
          <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1 mb-1">
            <BookOpen className="w-3 h-3 text-slate-500" />
            <span>Topic (Syllabus Root)</span>
            <span className="text-rose-500">*</span>
            {loadingTaxonomy && (
              <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1 ml-auto">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                Loading topics...
              </span>
            )}
          </label>
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
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1 mb-1">
            <Layers className="w-3 h-3 text-slate-500" />
            <span>Subtopic</span>
            <span className="text-rose-500">*</span>
            {(loadingTaxonomy || loadingSubtopics) && (
              <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1 ml-auto">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                Loading subtopics...
              </span>
            )}
          </label>

          {/* SUBTOPICS ERROR & RETRY BANNER */}
          {subtopicsError && (
            <div
              data-testid="subtopics-error-banner"
              className="p-2 mb-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs"
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
              className="p-2 mb-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1.5 text-xs"
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
            disabled={
              isSubtopicUnavailable ||
              isGenerating
            }
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
        </div>
      </div>

      {/* DIFFICULTY & LANGUAGE */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-bold text-slate-800 block mb-1">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            disabled={isGenerating}
            className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="Basic">Basic / Easy</option>
            <option value="Intermediate">Intermediate / Medium</option>
            <option value="Advanced">Advanced / Hard</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-800 block mb-1 flex items-center gap-1">
            <Languages className="w-3 h-3 text-slate-500" />
            <span>Language</span>
          </label>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as QuestionLanguage)}
            disabled={isGenerating}
            className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value={QuestionLanguage.TELUGU}>తెలుగు (Telugu)</option>
            <option value={QuestionLanguage.ENGLISH}>English</option>
          </select>
        </div>
      </div>

      {/* REAL-WORLD CONTEXT HOOK */}
      <div>
        <label className="text-[11px] font-bold text-slate-800 block mb-1">
          Real-World Context Hook
        </label>
        <input
          type="text"
          value={realLifeContext}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="e.g. Metro train commuter rush..."
          disabled={isGenerating}
          className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:border-indigo-500 focus:outline-hidden"
        />

        <div className="flex flex-wrap gap-1 mt-1.5">
          {CONTEXT_SUGGESTIONS.slice(0, 4).map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onContextChange(suggestion)}
              className="text-[9px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* GENERATE ACTION BUTTON */}
      <div className="pt-2">
        <button
          type="button"
          data-testid="generate-candidate-btn"
          onClick={onGenerate}
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
              <span>✦ Generate Telugu Question</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
