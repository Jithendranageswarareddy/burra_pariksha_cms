/**
 * BURRA PARIKSHA CMS — Candidate Question Canvas
 * Feature Slice: Question Generation (Stage 01)
 *
 * Workspace for reviewing and refining candidate questions:
 * - Bilingual Telugu/English rendering
 * - Problem statement editor
 * - 4 mutually exclusive options with single correct key
 * - Step-by-step mathematical proof / Burra Speed Trick
 * - Advisory AI refinement bar
 */

import React from 'react';
import {
  FileCheck,
  Wand2,
  ArrowUp,
  Languages,
  Layers,
  Sparkles,
  PenTool,
  Loader2,
  CheckCircle2,
  Check,
  Trash2,
  Eye,
} from 'lucide-react';
import { AiRefinementAction, QuestionLanguage, validateStudioCandidate } from '../../../../shared';
import { StudioCandidate, QuestionBatchAssembly } from '../../../../shared/contracts/question-generation';

interface CandidateCanvasProps {
  candidate: StudioCandidate;
  hasCandidate: boolean;
  isDirty: boolean;
  isGenerating: boolean;
  isRefining: boolean;
  batchAssembly?: QuestionBatchAssembly | null;
  activeSlotIndex?: number;
  onSelectSlot?: (index: number) => void;
  onAcceptSlot?: (index: number) => void;
  onClearSlot?: (index: number) => void;
  onUpdateField: (field: keyof StudioCandidate, value: any) => void;
  onRefine: (action: AiRefinementAction) => void;
  onGenerate: () => void;
  onManualDraft: () => void;
}

export const CandidateCanvas: React.FC<CandidateCanvasProps> = ({
  candidate,
  hasCandidate,
  isDirty,
  isGenerating,
  isRefining,
  batchAssembly,
  activeSlotIndex = 0,
  onSelectSlot,
  onAcceptSlot,
  onClearSlot,
  onUpdateField,
  onRefine,
  onGenerate,
  onManualDraft,
}) => {
  const validationErrors = validateStudioCandidate(candidate);

  return (
    <div className="space-y-3">
      {/* CANVAS HEADER */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-900">
          <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
          <h3 className="text-xs font-bold tracking-tight">Question Canvas</h3>
        </div>

        <div className="flex items-center gap-1.5">
          {isDirty && (
            <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Draft
            </span>
          )}

          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
            {candidate.language === QuestionLanguage.TELUGU || (candidate.language as string) === 'TELUGU'
              ? 'తెలుగు'
              : 'English'}
          </span>
        </div>
      </div>

      {/* BATCH SLOTS TABS (when multi-question batch is active) */}
      {batchAssembly && batchAssembly.slots.length > 1 && (
        <div data-testid="batch-slots-nav" className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Batch Slots ({batchAssembly.slots.length})</span>
            <div className="flex items-center gap-2">
              {onAcceptSlot && (
                <button
                  type="button"
                  data-testid="accept-slot-btn"
                  onClick={() => onAcceptSlot(activeSlotIndex)}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>Accept Slot #{activeSlotIndex + 1}</span>
                </button>
              )}
              {onClearSlot && (
                <button
                  type="button"
                  data-testid="clear-slot-btn"
                  onClick={() => onClearSlot(activeSlotIndex)}
                  className="px-2 py-0.5 text-[10px] font-semibold bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Slot</span>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {batchAssembly.slots.map((slot, idx) => {
              const isSelected = activeSlotIndex === idx;
              const statusColor =
                slot.status === 'ACCEPTED'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : slot.status === 'MANUALLY_EDITED'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : slot.status === 'VALID'
                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                  : slot.status === 'INVALID'
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-slate-100 text-slate-500 border-slate-300';
              return (
                <button
                  key={slot.slotId || idx}
                  type="button"
                  data-testid={`slot-tab-${idx + 1}`}
                  onClick={() => onSelectSlot && onSelectSlot(idx)}
                  className={`px-2 py-1 rounded text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 shadow-xs ' + statusColor
                      : 'hover:bg-slate-100 ' + statusColor
                  }`}
                >
                  <span>Slot {slot.slotNumber}</span>
                  <span className="text-[9px] font-medium opacity-80">
                    {slot.status === 'ACCEPTED'
                      ? '✓'
                      : slot.status === 'MANUALLY_EDITED'
                      ? '✎'
                      : slot.status === 'VALID'
                      ? '●'
                      : slot.status === 'INVALID'
                      ? '✕'
                      : '○'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!hasCandidate && !candidate.questionText.trim() && !isGenerating && (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50/70 border border-dashed border-slate-300 rounded-xl space-y-4 text-center">
          <div className="space-y-1 max-w-sm">
            <h4 className="text-xs font-bold text-slate-900">Question Workspace Ready</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Configure syllabus controls on the left and generate an AI candidate, or begin drafting manually.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGenerate}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Generate Candidate</span>
            </button>
            <button
              type="button"
              onClick={onManualDraft}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <PenTool className="w-3 h-3 text-slate-500" />
              <span>Manual Draft</span>
            </button>
          </div>
        </div>
      )}

      {/* LOADING SKELETON */}
      {isGenerating && (
        <div className="space-y-3 animate-pulse p-4 rounded-xl border border-indigo-100 bg-indigo-50/30">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            <span className="text-xs font-bold text-indigo-900">
              Generating Telugu question candidate...
            </span>
          </div>
          <div className="h-16 bg-slate-200/80 rounded-lg"></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 bg-slate-200/70 rounded-lg"></div>
            <div className="h-10 bg-slate-200/70 rounded-lg"></div>
            <div className="h-10 bg-slate-200/70 rounded-lg"></div>
            <div className="h-10 bg-slate-200/70 rounded-lg"></div>
          </div>
        </div>
      )}

      {/* ACTIVE WORKSPACE */}
      {(hasCandidate || candidate.questionText.trim().length > 0) && !isGenerating && (
        <div className="space-y-3">
          {/* AI REFINEMENT BAR */}
          <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <Wand2 className="w-3 h-3 text-indigo-600" />
              <span>AI Refine:</span>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                disabled={isRefining}
                onClick={() => onRefine(AiRefinementAction.INCREASE_DIFFICULTY)}
                className="py-0.5 px-2 text-[10px] font-semibold rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <ArrowUp className="w-2.5 h-2.5 text-indigo-500" />
                <span>+ Difficulty</span>
              </button>

              <button
                type="button"
                disabled={isRefining}
                onClick={() => onRefine(AiRefinementAction.SIMPLIFY_LANGUAGE)}
                className="py-0.5 px-2 text-[10px] font-semibold rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <Languages className="w-2.5 h-2.5 text-indigo-500" />
                <span>Simplify Telugu</span>
              </button>

              <button
                type="button"
                disabled={isRefining}
                onClick={() => onRefine(AiRefinementAction.IMPROVE_OPTIONS)}
                className="py-0.5 px-2 text-[10px] font-semibold rounded-md bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <Layers className="w-2.5 h-2.5 text-indigo-500" />
                <span>Add Trap Distractor</span>
              </button>
            </div>
          </div>

          {/* PROBLEM STATEMENT */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                <span>Question Problem Statement</span>
                <span className="text-rose-500">*</span>
                <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.5 rounded font-telugu">
                  తెలుగు
                </span>
              </label>
              <span className="text-[9px] font-mono text-slate-400">
                {candidate.questionText.length} chars
              </span>
            </div>
            <textarea
              value={candidate.questionText}
              onChange={(e) => onUpdateField('questionText', e.target.value)}
              rows={3}
              placeholder="స్పష్టమైన ప్రశ్న మరియు లెక్క ఇక్కడ రాయండి..."
              className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-hidden font-telugu"
            />
            {validationErrors.questionText && (
              <p role="alert" className="mt-1 text-[10px] text-rose-600">{validationErrors.questionText}</p>
            )}
          </div>

          {/* 4 OPTIONS WITH CORRECT ANSWER RADIO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-800">
                Multiple-Choice Options & Correct Key
              </label>
              <span className="text-[10px] text-slate-500">
                Selected: <span className="font-bold text-emerald-700 font-mono">Option {candidate.correctAnswer}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Option A */}
              <div
                onClick={() => onUpdateField('correctAnswer', 'A')}
                className={`p-2 rounded-lg border transition-all cursor-pointer select-none ${
                  candidate.correctAnswer === 'A'
                    ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-200'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={candidate.correctAnswer === 'A'}
                      onChange={() => onUpdateField('correctAnswer', 'A')}
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
                  onChange={(e) => onUpdateField('optionA', e.target.value)}
                  placeholder="Option A value"
                  className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                />
                {validationErrors.optionA && (
                  <p role="alert" className="mt-1 text-[10px] text-rose-600">{validationErrors.optionA}</p>
                )}
              </div>

              {/* Option B */}
              <div
                onClick={() => onUpdateField('correctAnswer', 'B')}
                className={`p-2 rounded-lg border transition-all cursor-pointer select-none ${
                  candidate.correctAnswer === 'B'
                    ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-200'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={candidate.correctAnswer === 'B'}
                      onChange={() => onUpdateField('correctAnswer', 'B')}
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
                  onChange={(e) => onUpdateField('optionB', e.target.value)}
                  placeholder="Option B value"
                  className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                />
                {validationErrors.optionB && (
                  <p role="alert" className="mt-1 text-[10px] text-rose-600">{validationErrors.optionB}</p>
                )}
              </div>

              {/* Option C */}
              <div
                onClick={() => onUpdateField('correctAnswer', 'C')}
                className={`p-2 rounded-lg border transition-all cursor-pointer select-none ${
                  candidate.correctAnswer === 'C'
                    ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-200'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={candidate.correctAnswer === 'C'}
                      onChange={() => onUpdateField('correctAnswer', 'C')}
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
                  onChange={(e) => onUpdateField('optionC', e.target.value)}
                  placeholder="Option C value"
                  className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                />
                {validationErrors.optionC && (
                  <p role="alert" className="mt-1 text-[10px] text-rose-600">{validationErrors.optionC}</p>
                )}
              </div>

              {/* Option D */}
              <div
                onClick={() => onUpdateField('correctAnswer', 'D')}
                className={`p-2 rounded-lg border transition-all cursor-pointer select-none ${
                  candidate.correctAnswer === 'D'
                    ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-200'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={candidate.correctAnswer === 'D'}
                      onChange={() => onUpdateField('correctAnswer', 'D')}
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
                  onChange={(e) => onUpdateField('optionD', e.target.value)}
                  placeholder="Option D value"
                  className="w-full font-telugu text-xs font-medium text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 focus:border-indigo-500 focus:outline-hidden"
                />
                {validationErrors.optionD && (
                  <p role="alert" className="mt-1 text-[10px] text-rose-600">{validationErrors.optionD}</p>
                )}
              </div>
            </div>
            {validationErrors.options && (
              <p role="alert" className="text-[10px] text-rose-600">{validationErrors.options}</p>
            )}
          </div>

          {/* EXPLANATION / SPEED TRICK */}
          <div>
            <label className="text-[11px] font-bold text-slate-800 block mb-1">
              Step-by-Step Proof & Burra Speed Trick
            </label>
            <textarea
              value={candidate.explanation}
              onChange={(e) => onUpdateField('explanation', e.target.value)}
              rows={2}
              placeholder="వివరణ మరియు బుర్ర ట్రిక్ ఇక్కడ రాయండి..."
              className="w-full text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:border-indigo-500 focus:outline-hidden font-telugu"
            />
            {validationErrors.explanation && (
              <p role="alert" className="mt-1 text-[10px] text-rose-600">{validationErrors.explanation}</p>
            )}
          </div>

          {/* MATH VERIFICATION BADGE */}
          {candidate.mathematicalVerification && (
            <div className="p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deterministic Verification: {candidate.mathematicalVerification.status}</span>
              </div>
              {candidate.mathematicalVerification.calculatedValue && (
                <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                  Value: {candidate.mathematicalVerification.calculatedValue}
                </span>
              )}
            </div>
          )}

          {/* SYNCHRONIZED 9:16 VERTICAL SHORT SIMULATION PREVIEW */}
          <div data-testid="short-preview-card" className="p-3 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>9:16 Vertical Short Live Simulation</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">9:16 Vertical</span>
            </div>
            <div className="p-2.5 bg-slate-800/80 rounded-lg space-y-2 text-xs">
              <p className="font-telugu font-semibold text-slate-100 leading-snug">
                {candidate.questionText || 'Question statement will appear here...'}
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                  const optVal = candidate[`option${optKey}` as keyof StudioCandidate] as string;
                  const isCorrect = candidate.correctAnswer === optKey;
                  return (
                    <div
                      key={optKey}
                      className={`p-1.5 rounded border text-left font-telugu flex items-start gap-1.5 ${
                        isCorrect
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                          : 'bg-slate-700/60 border-slate-600 text-slate-200'
                      }`}
                    >
                      <span className="font-mono text-[10px] font-bold opacity-75">{optKey}:</span>
                      <span className="truncate">{optVal || `Option ${optKey}`}</span>
                    </div>
                  );
                })}
              </div>
              {candidate.explanation && (
                <div className="pt-1 border-t border-slate-700/70 text-[10px] text-slate-300 font-telugu">
                  <span className="font-bold text-indigo-300">Speed Trick / Proof: </span>
                  <span>{candidate.explanation}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
