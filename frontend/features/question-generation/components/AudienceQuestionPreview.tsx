/**
 * BURRA PARIKSHA CMS — Audience-Facing Question Challenge Preview Component
 * Specification: S9-T13 Audience-Facing Preview
 *
 * Renders an audience-visible 9:16 vertical short simulation of the Question Challenge Short package.
 *
 * Critical Data Segregation Invariants:
 * 1. Strictly segregated from internal answers, correct keys, explanations, and reviewer notes.
 * 2. Zero answer leakage in DOM elements, attributes, tooltips, or labels.
 * 3. Shows presentation elements in canonical package order:
 *    - Channel branding & countdown timer
 *    - Participation invitation
 *    - Question statement
 *    - Multiple-choice options (A, B, C, D / ఎ, బి, సి, డి)
 *    - Audience Call to Action (CTA) & pinned comment prompt
 * 4. Explicitly toggles between 'UNSAVED_EDITS' (current working copy) and 'SAVED_RECORD' (persisted draft).
 */

import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  Clock,
  ThumbsUp,
  MessageSquare,
  Share2,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  AudiencePreviewPackageProjection,
  AudiencePreviewSourceVersion,
} from '../../../../shared/contracts/question-generation/audience-preview.contract';

interface AudienceQuestionPreviewProps {
  projection: AudiencePreviewPackageProjection;
  onSourceVersionChange?: (source: AudiencePreviewSourceVersion) => void;
  onClose?: () => void;
}

export const AudienceQuestionPreview: React.FC<AudienceQuestionPreviewProps> = ({
  projection,
  onSourceVersionChange,
  onClose,
}) => {
  const [activeSlotIdx, setActiveSlotIdx] = useState(0);

  const totalQuestions = projection.questions.length;
  const safeIndex = Math.min(Math.max(activeSlotIdx, 0), Math.max(totalQuestions - 1, 0));
  const currentItem = projection.questions[safeIndex];

  return (
    <div
      data-testid="audience-preview-container"
      className="flex flex-col items-center bg-slate-900/95 text-slate-100 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl border border-slate-800"
    >
      {/* 1. TOP CONTROLS & VERSION SELECTOR */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-tight">Audience-Facing Preview</h4>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                9:16 Short
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Live simulation of what viewers see during the video question challenge.
            </p>
          </div>
        </div>

        {/* VERSION SWITCHER PILLS (Saved vs Unsaved) */}
        <div className="flex items-center gap-2">
          <div
            data-testid="preview-source-selector"
            className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-[11px] font-medium"
          >
            <button
              type="button"
              data-testid="source-unsaved-btn"
              onClick={() => onSourceVersionChange?.('UNSAVED_EDITS')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                projection.sourceVersion === 'UNSAVED_EDITS'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Unsaved Edits (Live)</span>
            </button>

            <button
              type="button"
              data-testid="source-saved-btn"
              onClick={() => onSourceVersionChange?.('SAVED_RECORD')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                projection.sourceVersion === 'SAVED_RECORD'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Saved Record {projection.versionNumber ? `(v${projection.versionNumber})` : ''}</span>
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-colors"
            >
              Back to Editor
            </button>
          )}
        </div>
      </div>

      {/* 2. SAVED RECORD NOTICE (If viewing saved version with no saved draft yet) */}
      {projection.sourceVersion === 'SAVED_RECORD' && !projection.hasSavedRecord && (
        <div
          data-testid="no-saved-record-notice"
          className="w-full max-w-sm p-3 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-200 flex items-start gap-2.5 text-xs text-left"
        >
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold">No Persisted Draft Record</h5>
            <p className="text-[11px] text-amber-300/90 mt-0.5 leading-relaxed">
              {projection.incompleteNotice || 'This question candidate has not been saved yet. Click "Save Draft" in the editor to create a persisted record.'}
            </p>
          </div>
        </div>
      )}

      {/* 3. BATCH STEPPER / QUESTION NAVIGATION (When multi-slot package) */}
      {totalQuestions > 1 && (
        <div data-testid="preview-slot-stepper" className="flex items-center gap-2 text-xs text-slate-300">
          <button
            type="button"
            data-testid="preview-prev-btn"
            disabled={safeIndex <= 0}
            onClick={() => setActiveSlotIdx((prev) => Math.max(prev - 1, 0))}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white cursor-pointer"
            title="Previous question in package"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono font-bold text-[11px] text-indigo-300 px-2 py-0.5 bg-indigo-950/80 rounded-md border border-indigo-800/60">
            Question {safeIndex + 1} of {totalQuestions}
          </span>

          <button
            type="button"
            data-testid="preview-next-btn"
            disabled={safeIndex >= totalQuestions - 1}
            onClick={() => setActiveSlotIdx((prev) => Math.min(prev + 1, totalQuestions - 1))}
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white cursor-pointer"
            title="Next question in package"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. REALISTIC 9:16 SMARTPHONE SCREEN CONTAINER */}
      <div className="relative w-full max-w-[340px] rounded-[2.5rem] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl border-4 border-slate-700">
        {/* Top Speaker & Camera Notch */}
        <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          <div className="w-8 h-1 rounded-full bg-slate-800" />
        </div>

        {/* 9:16 Aspect Screen Area */}
        <div
          data-testid="audience-916-screen"
          className="relative aspect-[9/16] w-full rounded-[2rem] overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 flex flex-col justify-between p-3.5 text-white select-none border border-slate-800/80"
        >
          {/* SCREEN HEADER: BRANDING, TOPIC & TIMER */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white shadow-xs">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                </div>
                <span className="text-xs font-black tracking-tight font-telugu text-white">
                  {projection.channelBranding}
                </span>
              </div>

              {/* Countdown / Duration Badge */}
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-xs border border-white/10 text-[10px] font-mono text-emerald-400 font-bold">
                <Clock className="w-2.5 h-2.5" />
                <span>0:{projection.durationSeconds}</span>
              </div>
            </div>

            {/* TOPIC BADGE */}
            {projection.topicTitle && (
              <div className="inline-block px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[9px] font-semibold text-indigo-200">
                {projection.topicTitle} {projection.subtopicTitle ? `• ${projection.subtopicTitle}` : ''}
              </div>
            )}

            {/* PARTICIPATION INVITATION */}
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-400/20 text-center">
              <p className="text-[10px] font-bold text-amber-300 font-telugu leading-tight">
                ⚡ {projection.participationInvitation}
              </p>
            </div>
          </div>

          {/* SCREEN CENTER: QUESTION STATEMENT & OPTIONS */}
          <div className="my-auto space-y-3 py-2">
            {currentItem ? (
              <>
                {/* QUESTION CARD */}
                <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 text-slate-900 shadow-md border border-white/20">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-indigo-700 mb-1">
                    <span>ప్రశ్న #{currentItem.questionNumber}</span>
                    <span className="font-mono text-slate-400">MCQ</span>
                  </div>

                  <p
                    data-testid="audience-question-text"
                    className="text-xs sm:text-[13px] font-bold leading-relaxed font-telugu"
                  >
                    {currentItem.questionText || (
                      <span className="italic text-slate-400 font-normal">
                        [ప్రశ్న ఇంకా నమోదు కాలేదు / Drafting in progress...]
                      </span>
                    )}
                  </p>
                </div>

                {/* MULTIPLE-CHOICE OPTIONS (PRE-REVEAL AUDIENCE VIEW) */}
                <div data-testid="audience-choices-stack" className="space-y-1.5">
                  {currentItem.choices.map((choice) => (
                    <div
                      key={choice.label}
                      data-testid={`audience-choice-${choice.label}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-xs transition-colors"
                    >
                      <div className="w-5 h-5 rounded-md bg-indigo-500/40 border border-indigo-400/50 flex items-center justify-center text-[10px] font-bold text-white shrink-0 font-mono">
                        {choice.teluguLabel}
                      </div>
                      <span className="text-xs font-semibold font-telugu text-slate-100 flex-1 leading-snug">
                        {choice.text || (
                          <span className="italic text-slate-400 font-normal">
                            [ఆప్షన్ {choice.label} ఖాళీగా ఉంది]
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/80 border border-dashed border-slate-600 text-center space-y-1">
                <Layers className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-300">ఖాళీ ప్యాకేజీ / Empty Package</p>
                <p className="text-[10px] text-slate-400">No questions found in this preview source.</p>
              </div>
            )}
          </div>

          {/* SCREEN FOOTER: CALL TO ACTION (CTA) & PINNED COMMENT PROMPT */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <div className="p-1.5 rounded-lg bg-indigo-900/60 border border-indigo-500/30 text-center space-y-0.5">
              <p className="text-[10px] font-bold text-indigo-200 font-telugu">
                {projection.callToAction}
              </p>
              <p className="text-[9px] text-indigo-300/80 font-telugu">
                📌 {projection.pinnedCommentPrompt}
              </p>
            </div>

            {/* Social engagement simulation icons */}
            <div className="flex items-center justify-center gap-4 text-slate-400 text-[10px] py-0.5">
              <span className="flex items-center gap-1 hover:text-white cursor-pointer">
                <ThumbsUp className="w-3 h-3" /> Like
              </span>
              <span className="flex items-center gap-1 hover:text-white cursor-pointer">
                <MessageSquare className="w-3 h-3" /> Comment
              </span>
              <span className="flex items-center gap-1 hover:text-white cursor-pointer">
                <Share2 className="w-3 h-3" /> Share
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
      </div>

      {/* 5. VISUAL APPROXIMATION DISCLOSURE CAPTION */}
      <p className="text-[10px] text-slate-400 text-center max-w-sm leading-relaxed">
        Interactive Video Simulation — Final typography, bilingual voiceover, and audio chime render in Stage 06 Video Assembly.
      </p>
    </div>
  );
};
