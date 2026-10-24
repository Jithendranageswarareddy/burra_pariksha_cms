/**
 * BURRA PARIKSHA CMS — Learning Design Selectors Component
 * Location: frontend/features/planning/components/LearningDesignSelectors.tsx
 *
 * Source of Truth: docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md
 * (Section 4: Editorial Pillars; Section 5: Audiences & Skill Levels; Section 3: Presentation Formats)
 * Task: S11-T04 Learning Unit Planning Workspace UI
 *
 * Renders orthogonal Layer 2 Learning Design selectors:
 * 1. Skill Level (Foundation, Beginner, Intermediate, Advanced)
 * 2. Audience Context (Children, Students, Competitive Exam, Working Adults, Households, Business Operators, Older Learners)
 * 3. Editorial Pillar (Pillars A through F)
 * 4. Primary Presentation Format (Video, Text, Audio, Image, Animation)
 * 5. Suggested Canonical Content Modes (Topic Intro, Worked Examples, Challenge Short)
 */

import React from 'react';
import {
  AudienceContext,
  CanonicalContentMode,
  EditorialPillar,
  PresentationFormat,
  SkillLevel,
  AUDIENCE_CONTEXTS,
  AUDIENCE_CONTEXT_METADATA,
  CANONICAL_CONTENT_MODES,
  CANONICAL_CONTENT_MODE_METADATA,
  EDITORIAL_PILLARS,
  EDITORIAL_PILLAR_METADATA,
  PRESENTATION_FORMATS,
  PRESENTATION_FORMAT_METADATA,
  SKILL_LEVELS,
  SKILL_LEVEL_METADATA,
} from '../../../../shared';

export interface LearningDesignSelectorsProps {
  skillLevel: SkillLevel;
  audienceContext?: AudienceContext;
  editorialPillar?: EditorialPillar;
  primaryFormat?: PresentationFormat;
  suggestedModes?: CanonicalContentMode[];
  disabled?: boolean;
  onSkillLevelChange: (level: SkillLevel) => void;
  onAudienceContextChange: (audience?: AudienceContext) => void;
  onEditorialPillarChange: (pillar?: EditorialPillar) => void;
  onPrimaryFormatChange: (format: PresentationFormat) => void;
  onSuggestedModesChange: (modes: CanonicalContentMode[]) => void;
}

export const LearningDesignSelectors: React.FC<LearningDesignSelectorsProps> = ({
  skillLevel,
  audienceContext,
  editorialPillar,
  primaryFormat = 'VIDEO',
  suggestedModes = [],
  disabled = false,
  onSkillLevelChange,
  onAudienceContextChange,
  onEditorialPillarChange,
  onPrimaryFormatChange,
  onSuggestedModesChange,
}) => {
  const toggleMode = (mode: CanonicalContentMode) => {
    if (suggestedModes.includes(mode)) {
      onSuggestedModesChange(suggestedModes.filter((m) => m !== mode));
    } else {
      onSuggestedModesChange([...suggestedModes, mode]);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <div className="border-b border-slate-800 pb-2">
        <h3 className="text-sm font-semibold text-slate-200">Layer 2: Learning Design Dimensions</h3>
        <p className="text-xs text-slate-400">
          Pedagogical context orthogonal to curriculum topics (bp_cms_core_requirements Section 4 &amp; 5).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 1. Skill Level Selector */}
        <div>
          <label htmlFor="selector-skill-level" className="block text-xs font-medium text-slate-300">
            Skill Level <span className="text-rose-400">*</span>
          </label>
          <select
            id="selector-skill-level"
            value={skillLevel}
            disabled={disabled}
            onChange={(e) => onSkillLevelChange(e.target.value as SkillLevel)}
            className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          >
            {SKILL_LEVELS.map((lvl) => {
              const meta = SKILL_LEVEL_METADATA[lvl];
              return (
                <option key={lvl} value={lvl}>
                  {meta.label} (Level {meta.rank}) — {meta.description}
                </option>
              );
            })}
          </select>
        </div>

        {/* 2. Audience Context Selector */}
        <div>
          <label htmlFor="selector-audience-context" className="block text-xs font-medium text-slate-300">
            Audience Context
          </label>
          <select
            id="selector-audience-context"
            value={audienceContext || ''}
            disabled={disabled}
            onChange={(e) => onAudienceContextChange((e.target.value as AudienceContext) || undefined)}
            className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="">General / Unspecified Audience</option>
            {AUDIENCE_CONTEXTS.map((aud) => {
              const meta = AUDIENCE_CONTEXT_METADATA[aud];
              return (
                <option key={aud} value={aud}>
                  {meta.label} — {meta.description}
                </option>
              );
            })}
          </select>
        </div>

        {/* 3. Editorial Pillar Selector */}
        <div>
          <label htmlFor="selector-editorial-pillar" className="block text-xs font-medium text-slate-300">
            Editorial Pillar
          </label>
          <select
            id="selector-editorial-pillar"
            value={editorialPillar || ''}
            disabled={disabled}
            onChange={(e) => onEditorialPillarChange((e.target.value as EditorialPillar) || undefined)}
            className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="">None / Unassigned Pillar</option>
            {EDITORIAL_PILLARS.map((pillar) => {
              const meta = EDITORIAL_PILLAR_METADATA[pillar];
              return (
                <option key={pillar} value={pillar}>
                  {meta.code}: {meta.title}
                </option>
              );
            })}
          </select>
        </div>

        {/* 4. Primary Presentation Format */}
        <div>
          <label htmlFor="selector-primary-format" className="block text-xs font-medium text-slate-300">
            Primary Presentation Format
          </label>
          <select
            id="selector-primary-format"
            value={primaryFormat}
            disabled={disabled}
            onChange={(e) => onPrimaryFormatChange(e.target.value as PresentationFormat)}
            className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          >
            {PRESENTATION_FORMATS.map((fmt) => {
              const meta = PRESENTATION_FORMAT_METADATA[fmt];
              return (
                <option key={fmt} value={fmt}>
                  {meta.displayName} — {meta.description}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* 5. Suggested Content Modes */}
      <div className="pt-2">
        <label className="block text-xs font-medium text-slate-300">
          Suggested Content Modes (Select all applicable)
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CANONICAL_CONTENT_MODES.map((mode) => {
            const meta = CANONICAL_CONTENT_MODE_METADATA[mode];
            const isSelected = suggestedModes.includes(mode);
            return (
              <button
                key={mode}
                type="button"
                id={`btn-mode-${mode}`}
                disabled={disabled}
                onClick={() => toggleMode(mode)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                } disabled:opacity-50`}
              >
                <span>{meta.displayName}</span>
                <span className="text-[10px] opacity-75">({meta.code})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
