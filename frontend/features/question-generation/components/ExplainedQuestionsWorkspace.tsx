/**
 * BURRA PARIKSHA CMS — Mode 3: Explained Questions Video Workspace
 * Feature Slice: Question Generation (Stage 01)
 *
 * Dedicated masterclass authoring workspace for Content Production Mode 3 (EXPLAINED_QUESTIONS_VIDEO).
 *
 * Enforced Constraints:
 * - Questions count: 5, 10, 15, or 20
 * - Aspect Ratio: 16:9 (Enforced)
 * - Navigation: Horizontal segmented tabs [Intro] [Q1] [Q2] ... [QN] (DD-03)
 * - Per-question fields: Statement, Options A/B/C/D, Correct Answer, Explanation, Trick/Pitfall
 */

import React, { useState } from 'react';
import {
  ListOrdered,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  Ratio,
  Zap,
} from 'lucide-react';
import { StudioCandidate } from '../../../../shared/contracts/question-generation';
import { ExplainedQuestionItem } from '../../../../shared/types/question';

interface ExplainedQuestionsWorkspaceProps {
  candidate: StudioCandidate;
  targetQuestionCount: number;
  activeQuestionIndex: number;
  isDirty: boolean;
  isSaving: boolean;
  onSelectTab: (index: number) => void;
  onUpdateField: (field: keyof StudioCandidate, value: any) => void;
  onUpdateQuestion: (index: number, updatedItem: Partial<ExplainedQuestionItem>) => void;
  onManualDraft: () => void;
}

export const ExplainedQuestionsWorkspace: React.FC<ExplainedQuestionsWorkspaceProps> = ({
  candidate,
  targetQuestionCount,
  activeQuestionIndex,
  isDirty,
  isSaving,
  onSelectTab,
  onUpdateField,
  onUpdateQuestion,
  onManualDraft,
}) => {
  const introText = candidate.introductoryConcept || candidate.questionText || '';
  const conceptTitle = candidate.conceptTitle || '';
  const questions: ExplainedQuestionItem[] = candidate.questions || [];

  // Helper to get or create question item at 1-based index
  const getQuestionAt = (idx: number): ExplainedQuestionItem => {
    const existing = questions.find((q) => q.questionNumber === idx) || questions[idx - 1];
    if (existing) return existing;
    return {
      questionNumber: idx,
      questionText: '',
      options: { a: '', b: '', c: '', d: '' },
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
    };
  };

  const currentQ = activeQuestionIndex > 0 ? getQuestionAt(activeQuestionIndex) : null;

  // Check completion for tab badge
  const isIntroComplete = introText.trim().length >= 15;

  const isQuestionComplete = (idx: number): boolean => {
    const q = getQuestionAt(idx);
    const qText = (q.questionText || '').trim();
    const a = (q.optionA || q.options?.a || '').trim();
    const b = (q.optionB || q.options?.b || '').trim();
    const c = (q.optionC || q.options?.c || '').trim();
    const d = (q.optionD || q.options?.d || '').trim();
    const ans = (q.correctAnswer || '').trim();
    return Boolean(qText.length >= 5 && a && b && c && d && ans && q.explanation?.trim());
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. MODE 3 CONSTRAINTS BADGE BAR */}
      <div className="flex items-center justify-between p-3 bg-indigo-50/80 border border-indigo-200/90 rounded-xl text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold text-indigo-950">Mode 3: Explained Questions Video</span>
            <span className="text-[11px] text-indigo-800 ml-2">
              Comprehensive Masterclass Workspace (Introduction + Practice Set)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-300">
            {targetQuestionCount} Questions
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 border border-slate-200">
            16:9 (Enforced)
          </span>
        </div>
      </div>

      {/* 2. DD-03 HORIZONTAL SEGMENTED PER-QUESTION NAVIGATION */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Segmented Content Navigation
          </span>
          <span className="text-[11px] font-medium text-slate-600">
            {activeQuestionIndex === 0
              ? 'Viewing Intro Segment'
              : `Editing Question ${activeQuestionIndex} of ${targetQuestionCount}`}
          </span>
        </div>

        {/* Scrollable segmented tab bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
          {/* Tab 0: Intro Roadmap */}
          <button
            type="button"
            data-testid="tab-intro"
            onClick={() => onSelectTab(0)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeQuestionIndex === 0
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Intro Roadmap</span>
            {isIntroComplete ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>

          {/* Question Tabs 1..N */}
          {Array.from({ length: targetQuestionCount }).map((_, i) => {
            const qNum = i + 1;
            const complete = isQuestionComplete(qNum);
            const isActive = activeQuestionIndex === qNum;
            return (
              <button
                key={qNum}
                type="button"
                data-testid={`tab-q-${qNum}`}
                onClick={() => onSelectTab(qNum)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>Q{qNum}</span>
                {complete ? (
                  <CheckCircle2 className={`w-3 h-3 ${isActive ? 'text-emerald-200' : 'text-emerald-600'}`} />
                ) : (
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-200' : 'bg-amber-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE TAB CONTENT PANEL */}
      {activeQuestionIndex === 0 ? (
        /* ================= INTRO ROADMAP TAB ================= */
        <div className="space-y-3.5 p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900">
              Masterclass Introduction & Strategic Roadmap
            </h4>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Masterclass Title <span className="text-slate-400 font-normal">(Telugu / English)</span>
            </label>
            <input
              type="text"
              data-testid="mode3-concept-title"
              value={conceptTitle}
              onChange={(e) => {
                onUpdateField('conceptTitle', e.target.value);
                onManualDraft();
              }}
              placeholder="e.g., కాలం — దూరం సంపూర్ణ మాస్టర్‌క్లాస్ (Time & Distance Complete Masterclass — 10 High Yield Questions)"
              className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Introduction Concept & Video Overview <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-mono font-semibold ${
                  isIntroComplete ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {introText.trim().length} / 15 chars min
              </span>
            </div>
            <textarea
              rows={5}
              data-testid="mode3-intro-concept"
              value={introText}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateField('introductoryConcept', val);
                onUpdateField('questionText', val);
                onManualDraft();
              }}
              placeholder="ఈ వీడియోలో మనం కాలం - దూరం విభాగంలోని అన్ని ముఖ్యమైన కాన్సెప్ట్స్ మరియు గత 10 సంవత్సరాల ప్రశ్నపత్రాల నుండి ఎంచుకున్న 10 క్లిష్టమైన సమస్యలను షార్ట్‌కట్ పద్ధతులతో సాధిస్తాం..."
              className="w-full p-3 bg-slate-50/70 border border-slate-200 rounded-lg font-telugu text-xs text-slate-900 leading-relaxed focus:bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Syllabus Scope & Shortcut Strategy
            </label>
            <textarea
              rows={3}
              data-testid="mode3-syllabus-scope"
              value={candidate.syllabusScopeNotes || ''}
              onChange={(e) => {
                onUpdateField('syllabusScopeNotes', e.target.value);
                onManualDraft();
              }}
              placeholder="కీలక సూత్రాలు: వేగం = దూరం / కాలం; km/h ను m/s లోకి మార్చుటకు 5/18 తో గుణించాలి. రైలు స్తంభాన్ని దాటే సమయం = రైలు పొడవు / వేగం."
              className="w-full p-3 bg-slate-50/70 border border-slate-200 rounded-lg font-telugu text-xs text-slate-900 leading-relaxed focus:bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onSelectTab(1)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Proceed to Question 1</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* ================= INDIVIDUAL QUESTION TAB (Q1..QN) ================= */
        <div className="space-y-3.5 p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                #{activeQuestionIndex}
              </span>
              <h4 className="text-xs font-bold text-slate-900">
                Practice Question #{activeQuestionIndex} Authoring
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => onSelectTab(activeQuestionIndex - 1)}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer"
                title="Previous Question"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-slate-500">
                {activeQuestionIndex} / {targetQuestionCount}
              </span>
              <button
                type="button"
                disabled={activeQuestionIndex >= targetQuestionCount}
                onClick={() => onSelectTab(activeQuestionIndex + 1)}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                title="Next Question"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Problem Statement */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Question Statement <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              data-testid={`q-text-${activeQuestionIndex}`}
              value={currentQ?.questionText || ''}
              onChange={(e) => {
                onUpdateQuestion(activeQuestionIndex, { questionText: e.target.value });
                onManualDraft();
              }}
              placeholder={`ప్రశ్న ${activeQuestionIndex}: ఒక రైలు 180 మీటర్ల పొడవు కలిగి 54 కి.మీ/గం వేగంతో ప్రయాణిస్తూ ఒక స్తంభాన్ని ఎన్ని సెకన్లలో దాటుతుంది?`}
              className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg font-telugu text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* 4 Options Grid with Correct Answer Selector */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-slate-800">
              Multiple Choice Options & Answer Key <span className="text-rose-500">*</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                const optKey = opt.toLowerCase() as 'a' | 'b' | 'c' | 'd';
                const optProp = `option${opt}` as 'optionA' | 'optionB' | 'optionC' | 'optionD';
                const optValue = currentQ?.[optProp] || currentQ?.options?.[optKey] || '';
                const isSelected = currentQ?.correctAnswer === opt;

                return (
                  <div
                    key={opt}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-ans-${activeQuestionIndex}`}
                      checked={isSelected}
                      onChange={() => {
                        onUpdateQuestion(activeQuestionIndex, { correctAnswer: opt });
                        onManualDraft();
                      }}
                      className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700 w-4">{opt}</span>
                    <input
                      type="text"
                      data-testid={`q-${activeQuestionIndex}-opt-${optKey}`}
                      value={optValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updatedOptions = {
                          ...(currentQ?.options || { a: '', b: '', c: '', d: '' }),
                          [optKey]: val,
                        };
                        onUpdateQuestion(activeQuestionIndex, {
                          [optProp]: val,
                          options: updatedOptions,
                        });
                        onManualDraft();
                      }}
                      placeholder={`Option ${opt}`}
                      className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-900 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Detailed Mathematical / Pedagogical Explanation <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              data-testid={`q-expl-${activeQuestionIndex}`}
              value={currentQ?.explanation || ''}
              onChange={(e) => {
                onUpdateQuestion(activeQuestionIndex, { explanation: e.target.value });
                onManualDraft();
              }}
              placeholder="వివరణ: వేగం = 54 × (5/18) = 15 మీ/సె. కాలం = దూరం / వేగం = 180 / 15 = 12 సెకన్లు. సరైన సమాధానం A."
              className="w-full p-2.5 bg-slate-50/70 border border-slate-200 rounded-lg font-telugu text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Shortcut / Trap To Avoid */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Speed Trick / Trap to Avoid
            </label>
            <input
              type="text"
              data-testid={`q-trick-${activeQuestionIndex}`}
              value={currentQ?.trickOrPitfall || ''}
              onChange={(e) => {
                onUpdateQuestion(activeQuestionIndex, { trickOrPitfall: e.target.value });
                onManualDraft();
              }}
              placeholder="ట్రిక్: 54 km/h కనిపించగానే 18 మూళ్లు 54, కాబట్టి 3 × 5 = 15 m/s అని నేరుగా గుర్తుంచుకోవచ్చు."
              className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Navigation Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => onSelectTab(activeQuestionIndex - 1)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{activeQuestionIndex === 1 ? 'Back to Intro' : `Question ${activeQuestionIndex - 1}`}</span>
            </button>

            {activeQuestionIndex < targetQuestionCount ? (
              <button
                type="button"
                onClick={() => onSelectTab(activeQuestionIndex + 1)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>Question {activeQuestionIndex + 1}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All {targetQuestionCount} Question Slots Configured</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
