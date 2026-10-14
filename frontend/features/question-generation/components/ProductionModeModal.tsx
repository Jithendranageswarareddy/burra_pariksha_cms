/**
 * BURRA PARIKSHA CMS — Production Mode Selection Modal
 * Feature Slice: Question Generation (Stage 01)
 *
 * Enforces authoritative Sprint 8 Mode Rules (ADR-010, ADR-011):
 * - Mode 1: QUESTION_CHALLENGE_SHORT (count: 1 or {5,10,15,20}, aspect: 9:16)
 * - Mode 2: TOPIC_INTRODUCTION (count: 0, aspect: 9:16 or 16:9)
 * - Mode 3: EXPLAINED_QUESTIONS_VIDEO (count: {5,10,15,20}, aspect: 16:9)
 */

import React, { useState } from 'react';
import { Sparkles, Video, BookOpen, Check, AlertCircle } from 'lucide-react';
import {
  ContentProductionMode,
  validateProductionModeConfig,
} from '../../../../shared';

export interface ProductionModeModalProps {
  isOpen: boolean;
  initialMode?: ContentProductionMode;
  initialCount?: number;
  initialAspect?: '9:16' | '16:9';
  onSelectMode: (
    mode: ContentProductionMode,
    questionCount: number,
    aspectRatio: '9:16' | '16:9'
  ) => void;
  onClose?: () => void;
}

interface ModeCardOption {
  id: ContentProductionMode;
  title: string;
  badge: string;
  description: string;
  allowedCounts: number[];
  defaultCount: number;
  allowedAspects: ('9:16' | '16:9')[];
  defaultAspect: '9:16' | '16:9';
  icon: React.ElementType;
}

const MODE_OPTIONS: ModeCardOption[] = [
  {
    id: 'QUESTION_CHALLENGE_SHORT',
    title: 'Mode 1: Question Challenge Short',
    badge: '< 58s Short',
    description: 'Bilingual mobile challenge with high-contrast hook, 4-option question solve, distraction traps, and fast mental trick.',
    allowedCounts: [1, 5, 10, 15, 20],
    defaultCount: 1,
    allowedAspects: ['9:16'],
    defaultAspect: '9:16',
    icon: Sparkles,
  },
  {
    id: 'TOPIC_INTRODUCTION',
    title: 'Mode 2: Topic Introduction',
    badge: '60-180s Concept',
    description: 'Pure conceptual syllabus overview and fundamental principles introduction. Zero multiple-choice questions.',
    allowedCounts: [0],
    defaultCount: 0,
    allowedAspects: ['9:16', '16:9'],
    defaultAspect: '9:16',
    icon: BookOpen,
  },
  {
    id: 'EXPLAINED_QUESTIONS_VIDEO',
    title: 'Mode 3: Explained Questions Video',
    badge: '12-52min Masterclass',
    description: 'Long-form landscape masterclass featuring 1 introductory concept brief followed by progressive practice problems.',
    allowedCounts: [5, 10, 15, 20],
    defaultCount: 10,
    allowedAspects: ['16:9'],
    defaultAspect: '16:9',
    icon: Video,
  },
];

export const ProductionModeModal: React.FC<ProductionModeModalProps> = ({
  isOpen,
  initialMode = 'QUESTION_CHALLENGE_SHORT',
  initialCount,
  initialAspect,
  onSelectMode,
  onClose,
}) => {
  const [selectedMode, setSelectedMode] = useState<ContentProductionMode>(initialMode);

  // Initialize count and aspect based on chosen mode
  const currentOption = MODE_OPTIONS.find((m) => m.id === selectedMode) || MODE_OPTIONS[0];

  const [questionCount, setQuestionCount] = useState<number>(
    initialCount !== undefined && currentOption.allowedCounts.includes(initialCount)
      ? initialCount
      : currentOption.defaultCount
  );

  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>(
    initialAspect && currentOption.allowedAspects.includes(initialAspect)
      ? initialAspect
      : currentOption.defaultAspect
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleModeChange = (modeId: ContentProductionMode) => {
    setSelectedMode(modeId);
    const opt = MODE_OPTIONS.find((m) => m.id === modeId);
    if (opt) {
      setQuestionCount(opt.defaultCount);
      setAspectRatio(opt.defaultAspect);
      setValidationError(null);
    }
  };

  const handleConfirm = () => {
    const valResult = validateProductionModeConfig(selectedMode, questionCount, aspectRatio);
    if (!valResult.isValid) {
      setValidationError(valResult.error || 'Invalid mode configuration.');
      return;
    }
    setValidationError(null);
    onSelectMode(selectedMode, questionCount, aspectRatio);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 via-white to-indigo-50/30">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Sprint 8 Production Foundation (ADR-010)</span>
          </div>
          <h2 id="mode-modal-title" className="text-xl font-bold text-slate-900 mt-1">
            Select Content Production Mode
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose the target educational format to initialize your Question Studio workbench.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {MODE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedMode === opt.id;

              return (
                <div
                  key={opt.id}
                  data-testid={`mode-card-${opt.id}`}
                  onClick={() => handleModeChange(opt.id)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col gap-2 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{opt.title}</h3>
                        <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {opt.badge}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed pl-10">
                    {opt.description}
                  </p>

                  {/* Mode-specific configuration parameters when selected */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-indigo-100/80 pl-10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Question Count selector */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Question Count:
                        </label>
                        {opt.allowedCounts.length === 1 ? (
                          <div className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                            {opt.allowedCounts[0]} {opt.allowedCounts[0] === 1 ? 'Question' : 'Questions (Concept Only)'}
                          </div>
                        ) : (
                          <select
                            data-testid="mode-question-count-select"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          >
                            {opt.allowedCounts.map((cnt) => (
                              <option key={cnt} value={cnt}>
                                {cnt} {cnt === 1 ? 'Question (Standalone Short)' : `Questions (Series Batch)`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Aspect Ratio selector */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Aspect Ratio:
                        </label>
                        {opt.allowedAspects.length === 1 ? (
                          <div className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                            {opt.allowedAspects[0]} ({opt.allowedAspects[0] === '9:16' ? 'Vertical Short' : 'Landscape Masterclass'})
                          </div>
                        ) : (
                          <select
                            data-testid="mode-aspect-ratio-select"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as '9:16' | '16:9')}
                            className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                          >
                            {opt.allowedAspects.map((asp) => (
                              <option key={asp} value={asp}>
                                {asp} ({asp === '9:16' ? 'Vertical Short' : 'Horizontal Video'})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Current mode: <span className="font-semibold text-slate-700">{selectedMode}</span>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              data-testid="confirm-mode-btn"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Initialize Studio</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
