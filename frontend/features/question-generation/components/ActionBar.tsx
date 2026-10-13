/**
 * BURRA PARIKSHA CMS — Question Generation Action Bar
 * Feature Slice: Question Generation (Stage 01)
 *
 * Implements the mandatory architectural separation:
 * SAVE DRAFT != VERIFY
 *
 * 1. SAVE DRAFT:
 *    - Persists working state to question_drafts collection
 *    - Remains on Question Studio workspace
 *    - Retains draft ID and clears dirty state
 *    - Does NOT invoke verification gates or auto-navigate
 *
 * 2. SUBMIT FOR VERIFICATION:
 *    - Separate, explicit user command
 *    - Requires valid, persisted draft
 *    - Dispatches to Stage 02 Question Verification
 */

import React from 'react';
import { RotateCcw, Save, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Step01StateEvaluation } from '../../../../shared/contracts/question-generation';

interface ActionBarProps {
  workflowState: Step01StateEvaluation;
  isSaving: boolean;
  isSubmitting: boolean;
  isGenerating: boolean;
  isRefining: boolean;
  isDirty: boolean;
  savedDraftId: string | null;
  saveSuccessMessage: string | null;
  onReset: () => void;
  onSaveDraft: () => void;
  onSubmitForVerification: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  workflowState,
  isSaving,
  isSubmitting,
  isGenerating,
  isRefining,
  isDirty,
  savedDraftId,
  saveSuccessMessage,
  onReset,
  onSaveDraft,
  onSubmitForVerification,
}) => {
  const isBusy = isSaving || isSubmitting || isGenerating || isRefining;

  return (
    <div className="mt-auto pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
      {/* RESET / CLEAR BUTTON */}
      <button
        type="button"
        onClick={onReset}
        disabled={isBusy}
        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
      >
        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
        <span>Clear / Start New</span>
      </button>

      {/* STATUS CALLOUT & ACTIONS */}
      <div className="flex items-center gap-2 flex-wrap">
        {!workflowState.canContinue && workflowState.state !== 'EMPTY' && workflowState.reason && (
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 max-w-xs truncate"
            title={workflowState.reason}
          >
            <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
            <span className="truncate">{workflowState.reason}</span>
          </span>
        )}

        {savedDraftId && !isDirty && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Draft: {savedDraftId}</span>
          </span>
        )}

        {/* 1. SAVE DRAFT (Persist only, no verification, no navigation) */}
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={!workflowState.canContinue || isBusy}
          className="px-3.5 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Save draft to Firestore without advancing workflow"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Saving Draft...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-indigo-600" />
              <span>Save Draft</span>
            </>
          )}
        </button>

        {/* 2. SUBMIT FOR VERIFICATION (Explicit Separate Command) */}
        <button
          type="button"
          onClick={onSubmitForVerification}
          disabled={!workflowState.canContinue || isBusy}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Explicitly submit this draft for Stage 02 Verification"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5 text-amber-300" />
              <span>Submit for Verification →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
