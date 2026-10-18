/**
 * BURRA PARIKSHA CMS — AI Question Studio Workspace
 * Feature Slice: Question Generation (Stage 01)
 *
 * Implements the canonical 8-step user workflow:
 * 1. LOAD OPTIONS
 * 2. SELECT TOPIC
 * 3. SELECT SUBTOPIC
 * 4. SELECT / ACCEPT CONTEXT
 * 5. GENERATE CANDIDATE
 * 6. REVIEW CANDIDATE
 * 7. SAVE DRAFT (In-place persistence only)
 * 8. EXPLICIT SUBMIT TO VERIFICATION (Separate command)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { ProductionJourneyBar } from '../../../components/production/ProductionJourneyBar';
import { useQuestionGeneration } from '../hooks/useQuestionGeneration';
import { GenerationConfigPanel } from '../components/GenerationConfigPanel';
import { CandidateCanvas } from '../components/CandidateCanvas';
import { TopicIntroWorkspace } from '../components/TopicIntroWorkspace';
import { ExplainedQuestionsWorkspace } from '../components/ExplainedQuestionsWorkspace';
import { ActionBar } from '../components/ActionBar';
import { ProductionModeModal } from '../components/ProductionModeModal';
import { ProductionWorkbenchSummary } from '../components/ProductionWorkbenchSummary';

export const QuestionStudioPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    taxonomyTree,
    loadingTaxonomy,
    taxonomyError,
    retryLoadTaxonomy,
    loadingSubtopics,
    subtopicsError,
    retryLoadSubtopics,
    aiStatus,
    selectedTopic,
    selectedSubtopic,
    currentSubtopics,
    difficulty,
    language,
    realLifeContext,
    questionStyle,
    customInstructions,
    handleTopicChange,
    handleSubtopicChange,
    setDifficulty,
    setLanguage,
    setRealLifeContext,
    setQuestionStyle,
    setCustomInstructions,
    productionMode,
    targetQuestionCount,
    aspectRatio,
    isModeModalOpen,
    setIsModeModalOpen,
    setProductionModeConfig,
    isLoadingDraft,
    activeQuestionIndex,
    setActiveQuestionIndex,
    candidate,
    batchAssembly,
    hasCandidate,
    isDirty,
    savedDraftId,
    workflowState,
    updateCandidateField,
    updateExplainedQuestion,
    reorderExplainedQuestion,
    setHasCandidate,
    setIsDirty,
    isGenerating,
    isRefining,
    isSaving,
    isSubmitting,
    duplicateMatches,
    errorMessage,
    saveSuccessMessage,
    submitSuccessResult,
    setErrorMessage,
    setSaveSuccessMessage,
    setSubmitSuccessResult,
    handleGenerate,
    handleRefine,
    handleSaveDraft,
    handleSubmitForVerification,
    handleResetStudio,
  } = useQuestionGeneration();

  const onExplicitSubmit = async () => {
    const result = await handleSubmitForVerification();
    if (result && result.success) {
      // Upon successful explicit submission, prompt user to view in verification workspace
      setTimeout(() => {
        navigate(`/questions/${result.draftId}/verify`);
      }, 1200);
    }
  };

  return (
    <div className="space-y-3 pb-6 animate-in fade-in duration-200">
      {/* 1. PAGE HEADER */}
      <PageHeader
        title="AI Question Studio"
        description="Generate, refine, and draft high-yield bilingual multiple-choice question candidates."
      />

      {/* 2. CANONICAL 15-STAGE TIMELINE ANCHOR */}
      <div id="permanent-timeline-anchor" className="w-full">
        <ProductionJourneyBar activeStage="QUESTION_STUDIO" showDetails />
      </div>

      {/* 3. PRODUCTION MODE SELECTION MODAL */}
      <ProductionModeModal
        isOpen={isModeModalOpen}
        initialMode={productionMode || 'QUESTION_CHALLENGE_SHORT'}
        initialCount={targetQuestionCount}
        initialAspect={aspectRatio}
        onSelectMode={(mode, count, aspect) => {
          setProductionModeConfig(mode, count, aspect);
        }}
        onClose={productionMode ? () => setIsModeModalOpen(false) : undefined}
      />

      {/* DRAFT HYDRATION LOADING STATE */}
      {isLoadingDraft && (
        <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-900 flex items-center gap-3 text-xs shadow-2xs">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <div className="flex-1">
            <h4 className="font-bold">Loading Question Draft</h4>
            <p className="text-indigo-700 mt-0.5">Hydrating candidate fields, taxonomy, and configuration from deep link...</p>
          </div>
        </div>
      )}

      {/* 4. INTEGRATED PRODUCTION WORKBENCH SUMMARY */}
      <ProductionWorkbenchSummary
        selectedTopic={selectedTopic}
        selectedSubtopic={selectedSubtopic}
        taxonomyTree={taxonomyTree}
        currentSubtopics={currentSubtopics}
        loadingTaxonomy={loadingTaxonomy}
        loadingSubtopics={loadingSubtopics}
        taxonomyError={taxonomyError}
        subtopicsError={subtopicsError}
        productionMode={productionMode}
        targetQuestionCount={targetQuestionCount}
        aspectRatio={aspectRatio}
        onOpenModeModal={() => setIsModeModalOpen(true)}
        hasCandidate={hasCandidate}
        isDirty={isDirty}
        savedDraftId={savedDraftId}
        isLoadingDraft={isLoadingDraft}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
        submitSuccessResult={submitSuccessResult}
        onSaveDraft={handleSaveDraft}
        onSubmitForVerification={onExplicitSubmit}
        onGenerate={handleGenerate}
      />

      {/* ERROR ALERT BANNER */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs shadow-2xs">
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

      {/* SAVE DRAFT SUCCESS BANNER (Persisted in-place, not submitted) */}
      {saveSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-xs shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Draft Saved (In-Place)</h4>
            <p className="text-emerald-700 mt-0.5">{saveSuccessMessage}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">
              Note: Saving a draft does not submit it for verification. Use &quot;Submit for Verification →&quot; when ready.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMessage(null)}
            className="text-[11px] text-emerald-600 hover:text-emerald-900 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SUBMISSION SUCCESS BANNER */}
      {submitSuccessResult && (
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-start gap-2.5 text-xs shadow-2xs">
          <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Submitted to Stage 02 Verification</h4>
            <p className="text-indigo-800 mt-0.5">{submitSuccessResult.message}</p>
            <p className="text-[10px] text-indigo-600 mt-1 flex items-center gap-1 font-semibold">
              <span>Transitioning to Stage 02 Verification workspace...</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </div>
      )}

      {/* 3. DUAL-PANE WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* LEFT COLUMN: SYLLABUS & GENERATION CONTROLS (col-span-5) */}
        <div className="lg:col-span-5">
          <GenerationConfigPanel
            taxonomyTree={taxonomyTree}
            loadingTaxonomy={loadingTaxonomy}
            taxonomyError={taxonomyError}
            onRetryTaxonomy={retryLoadTaxonomy}
            loadingSubtopics={loadingSubtopics}
            subtopicsError={subtopicsError}
            onRetrySubtopics={retryLoadSubtopics}
            selectedTopic={selectedTopic}
            selectedSubtopic={selectedSubtopic}
            currentSubtopics={currentSubtopics}
            difficulty={difficulty}
            language={language}
            realLifeContext={realLifeContext}
            questionStyle={questionStyle}
            customInstructions={customInstructions}
            isGenerating={isGenerating}
            aiStatus={aiStatus}
            productionMode={productionMode || 'QUESTION_CHALLENGE_SHORT'}
            targetQuestionCount={targetQuestionCount}
            aspectRatio={aspectRatio}
            batchAssembly={batchAssembly}
            onQuestionCountChange={(cnt) =>
              setProductionModeConfig(productionMode || 'QUESTION_CHALLENGE_SHORT', cnt, aspectRatio)
            }
            onOpenModeModal={() => setIsModeModalOpen(true)}
            onTopicChange={handleTopicChange}
            onSubtopicChange={handleSubtopicChange}
            onDifficultyChange={setDifficulty}
            onLanguageChange={setLanguage}
            onContextChange={setRealLifeContext}
            onStyleChange={setQuestionStyle}
            onCustomInstructionsChange={setCustomInstructions}
            onGenerate={handleGenerate}
          />
        </div>

        {/* RIGHT COLUMN: FOCUSED QUESTION CANVAS & ACTION BAR (col-span-7) */}
        <div className="lg:col-span-7 space-y-3 bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-xl p-3.5 shadow-xs flex flex-col min-h-[480px]">
          {productionMode === 'TOPIC_INTRODUCTION' ? (
            <TopicIntroWorkspace
              candidate={candidate}
              aspectRatio={aspectRatio}
              isDirty={isDirty}
              isSaving={isSaving}
              onUpdateField={updateCandidateField}
              onChangeAspectRatio={(aspect) => setProductionModeConfig('TOPIC_INTRODUCTION', 0, aspect)}
              onManualDraft={() => {
                setHasCandidate(true);
                setIsDirty(true);
              }}
            />
          ) : productionMode === 'EXPLAINED_QUESTIONS_VIDEO' ? (
            <ExplainedQuestionsWorkspace
              candidate={candidate}
              targetQuestionCount={targetQuestionCount}
              activeQuestionIndex={activeQuestionIndex}
              isDirty={isDirty}
              isSaving={isSaving}
              onSelectTab={setActiveQuestionIndex}
              onUpdateField={updateCandidateField}
              onUpdateQuestion={updateExplainedQuestion}
              onReorderQuestion={reorderExplainedQuestion}
              onManualDraft={() => {
                setHasCandidate(true);
                setIsDirty(true);
              }}
            />
          ) : (
            <CandidateCanvas
              candidate={candidate}
              hasCandidate={hasCandidate}
              isDirty={isDirty}
              isGenerating={isGenerating}
              isRefining={isRefining}
              onUpdateField={updateCandidateField}
              onRefine={handleRefine}
              onGenerate={handleGenerate}
              onManualDraft={() => {
                setHasCandidate(true);
                setIsDirty(true);
              }}
            />
          )}

          {/* DUPLICATE DETECTION WARNINGS */}
          {duplicateMatches.length > 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-0.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Potential Duplicate Found ({duplicateMatches.length} match)</span>
              </div>
              {duplicateMatches.slice(0, 2).map((match: any, idx: number) => (
                <p key={idx} className="text-[10px] text-amber-800 pl-4">
                  • Match {match.questionId} ({Math.round((match.similarity || 0) * 100)}%): &quot;
                  {match.questionText || match.content}&quot;
                </p>
              ))}
            </div>
          )}

          {/* ACTION BAR: SAVE DRAFT VS SUBMIT FOR VERIFICATION */}
          <ActionBar
            workflowState={workflowState}
            isSaving={isSaving}
            isSubmitting={isSubmitting}
            isGenerating={isGenerating}
            isRefining={isRefining}
            isDirty={isDirty}
            savedDraftId={savedDraftId}
            saveSuccessMessage={saveSuccessMessage}
            onReset={handleResetStudio}
            onSaveDraft={handleSaveDraft}
            onSubmitForVerification={onExplicitSubmit}
          />
        </div>
      </div>
    </div>
  );
};
