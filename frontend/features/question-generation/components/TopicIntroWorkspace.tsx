/**
 * BURRA PARIKSHA CMS — Mode 2: Topic Introduction Workspace
 * Feature Slice: Question Generation (Stage 01)
 *
 * Dedicated authoring workspace for Content Production Mode 2 (TOPIC_INTRODUCTION).
 *
 * Enforced Constraints:
 * - Questions count: 0 (Enforced)
 * - Aspect Ratio: 9:16 or 16:9
 * - Authoring focus: Introductory concept, demystification, and syllabus scope
 */

import React from 'react';
import { BookOpen, Sparkles, Layers, Ratio, Info, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { StudioCandidate } from '../../../../shared/contracts/question-generation';

interface TopicIntroWorkspaceProps {
  candidate: StudioCandidate;
  aspectRatio: '9:16' | '16:9';
  isDirty: boolean;
  isSaving: boolean;
  onUpdateField: (field: keyof StudioCandidate, value: any) => void;
  onChangeAspectRatio: (aspect: '9:16' | '16:9') => void;
  onManualDraft: () => void;
}

export const TopicIntroWorkspace: React.FC<TopicIntroWorkspaceProps> = ({
  candidate,
  aspectRatio,
  isDirty,
  isSaving,
  onUpdateField,
  onChangeAspectRatio,
  onManualDraft,
}) => {
  const conceptText = candidate.introductoryConcept || candidate.questionText || '';
  const conceptTitle = candidate.conceptTitle || '';
  const syllabusScope = candidate.syllabusScopeNotes || '';
  const isLengthValid = conceptText.trim().length >= 15;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. MODE 2 CONSTRAINTS BADGE BAR */}
      <div className="flex items-center justify-between p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs shadow-2xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold text-amber-950">Mode 2: Topic Introduction</span>
            <span className="text-[11px] text-amber-800 ml-2">
              Concept Demystification Workspace (Zero-Question Format)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            0 Questions (Enforced)
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-slate-700 border border-slate-200">
            {aspectRatio}
          </span>
        </div>
      </div>

      {/* 2. ASPECT RATIO SELECTOR (9:16 or 16:9) */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Ratio className="w-3.5 h-3.5 text-indigo-600" />
            <span>Aspect Ratio Configuration</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Choose output format for this topic introduction
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            data-testid="aspect-ratio-9-16"
            onClick={() => onChangeAspectRatio('9:16')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
              aspectRatio === '9:16'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs ring-1 ring-indigo-500/30'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="font-mono font-bold">9:16</span>
            <span>Vertical Short (~60s Hook)</span>
          </button>
          <button
            type="button"
            data-testid="aspect-ratio-16-9"
            onClick={() => onChangeAspectRatio('16:9')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
              aspectRatio === '16:9'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs ring-1 ring-indigo-500/30'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="font-mono font-bold">16:9</span>
            <span>Landscape Video (~90s Overview)</span>
          </button>
        </div>
      </div>

      {/* 3. CONCEPT TITLE INPUT */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800">
          Concept Title & Hook Headline <span className="text-slate-400 font-normal">(Telugu / English)</span>
        </label>
        <input
          type="text"
          data-testid="concept-title-input"
          value={conceptTitle}
          onChange={(e) => {
            onUpdateField('conceptTitle', e.target.value);
            onManualDraft();
          }}
          placeholder="e.g., వయసు సమస్యలు — త్రికాల సూత్రం (Ages Problems — The Universal Matrix Method)"
          className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
        />
      </div>

      {/* 4. CORE INTRODUCTORY CONCEPT & EXPLANATION */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-800">
            Introductory Concept & Core Explanation <span className="text-rose-500">*</span>
          </label>
          <span
            className={`text-[10px] font-mono font-semibold ${
              isLengthValid ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            {conceptText.trim().length} / 15 chars min
          </span>
        </div>
        <textarea
          rows={5}
          data-testid="introductory-concept-textarea"
          value={conceptText}
          onChange={(e) => {
            const val = e.target.value;
            onUpdateField('introductoryConcept', val);
            onUpdateField('questionText', val);
            onManualDraft();
          }}
          placeholder="ఈ విభాగంలో మనం వయసు లెక్కలను X మరియు Y సమీకరణాలు లేకుండా, కేవలం నిష్పత్తుల వ్యత్యాసం (Ratio Difference) పద్ధతితో 10 సెకన్లలో ఎలా సాధించవచ్చో నేర్చుకుందాం..."
          className="w-full p-3 bg-slate-50/70 border border-slate-200 rounded-lg font-telugu text-xs text-slate-900 leading-relaxed focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
        />
        {!isLengthValid && conceptText.trim().length > 0 && (
          <p className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3 h-3" />
            <span>Concept statement must be at least 15 characters long.</span>
          </p>
        )}
      </div>

      {/* 5. SYLLABUS SCOPE & CORE FORMULAS / EXAM WEIGHTAGE */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800">
          Syllabus Scope, Key Insights & Weightage Notes
        </label>
        <textarea
          rows={3}
          data-testid="syllabus-scope-textarea"
          value={syllabusScope}
          onChange={(e) => {
            onUpdateField('syllabusScopeNotes', e.target.value);
            onManualDraft();
          }}
          placeholder="APPSC Group 2 & TSPSC ప్రిలిమ్స్‌లో ప్రతి సంవత్సరం 2 మార్కులు వస్తాయి. ముఖ్యమైన సూత్రాలు: ప్రస్తుత వయస్సు P అయితే, T సంవత్సరాల క్రితం (P - T), T సంవత్సరాల తర్వాత (P + T)."
          className="w-full p-3 bg-slate-50/70 border border-slate-200 rounded-lg font-telugu text-xs text-slate-900 leading-relaxed focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
        />
      </div>

      {/* 6. REAL-WORLD HOOK CONTEXT */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800">
          Real-Life Context / Emotional Hook
        </label>
        <input
          type="text"
          data-testid="real-life-context-input"
          value={candidate.realLifeContext || ''}
          onChange={(e) => {
            onUpdateField('realLifeContext', e.target.value);
            onManualDraft();
          }}
          placeholder="e.g., తండ్రి-కొడుకుల వయస్సు పోలిక లేదా కుటుంబ సభ్యుల వయస్సు వివాదాలు"
          className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
        />
      </div>

      {/* 7. SYNCHRONIZED TOPIC INTRO SIMULATION PREVIEW */}
      <div data-testid="topic-intro-preview-card" className="p-3 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Mode 2 Live Simulation Preview</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            {aspectRatio} {aspectRatio === '9:16' ? 'Vertical Short' : 'Landscape Video'}
          </span>
        </div>
        <div className="p-3 bg-slate-800/80 rounded-lg space-y-2 text-xs">
          {conceptTitle ? (
            <h4 className="font-bold text-amber-300 text-sm leading-tight font-telugu">{conceptTitle}</h4>
          ) : (
            <span className="text-slate-500 italic text-[11px]">Headline / Concept Title</span>
          )}
          <p className="font-telugu text-slate-100 leading-relaxed text-xs">
            {conceptText || 'Introductory concept explanation will appear here...'}
          </p>
          {syllabusScope && (
            <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-300 font-telugu">
              <span className="font-bold text-amber-200">Syllabus Scope & Insights: </span>
              <span>{syllabusScope}</span>
            </div>
          )}
          {candidate.realLifeContext && (
            <div className="pt-1 text-[11px] text-slate-400 font-telugu">
              <span className="font-semibold text-slate-300">Hook: </span>
              <span>{candidate.realLifeContext}</span>
            </div>
          )}
        </div>
      </div>

      {/* 8. PEDAGOGICAL GUIDANCE FOOTER */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-800">
          <Info className="w-3.5 h-3.5 text-indigo-600" />
          <span>Stage 02 Verification Note:</span>
        </div>
        <p>
          Mode 2 Topic Introductions skip mathematical MCQ proofs and are verified using the authoritative{' '}
          <strong>5-Point Concept Accuracy Checklist</strong> (Syllabus accuracy, definition clarity, exam relevance, Telugu orthography, and roadmap completeness).
        </p>
      </div>
    </div>
  );
};
