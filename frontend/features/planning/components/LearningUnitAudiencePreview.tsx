/**
 * BURRA PARIKSHA CMS — Learning Unit Audience Preview Component
 * Location: frontend/features/planning/components/LearningUnitAudiencePreview.tsx
 *
 * Source of Truth: docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md
 * (Section 6: The Central Asset: A Verified Learning Unit; Section 7: Proposed Content-Planning Model)
 *
 * Invariant Enforcement:
 * Audience-facing projection only. Internal author identities, reviewer notes,
 * audit history, and operational metadata MUST NOT leak into this component.
 */

import React from 'react';
import {
  AudienceContext,
  CanonicalContentMode,
  EditorialPillar,
  PresentationFormat,
  SkillLevel,
  AUDIENCE_CONTEXT_METADATA,
  CANONICAL_CONTENT_MODE_METADATA,
  EDITORIAL_PILLAR_METADATA,
  PRESENTATION_FORMAT_METADATA,
  SKILL_LEVEL_METADATA,
} from '../../../../shared';
import { BookOpen, AlertCircle, CheckCircle2, Lightbulb, Compass, Film } from 'lucide-react';

export interface LearningUnitAudiencePreviewProps {
  title: string;
  topicName?: string;
  subtopicName?: string;
  learningObjective: string;
  verifiedMethod: string;
  correctCalculations?: string;
  prerequisiteSkills?: string[];
  commonMistakes?: string[];
  realLifeApplications?: string[];
  realLifeScenario?: string;
  skillLevel: SkillLevel;
  audienceContext?: AudienceContext;
  editorialPillar?: EditorialPillar;
  primaryFormat?: PresentationFormat;
  suggestedModes?: CanonicalContentMode[];
}

export const LearningUnitAudiencePreview: React.FC<LearningUnitAudiencePreviewProps> = ({
  title,
  topicName,
  subtopicName,
  learningObjective,
  verifiedMethod,
  correctCalculations,
  prerequisiteSkills = [],
  commonMistakes = [],
  realLifeApplications = [],
  realLifeScenario,
  skillLevel,
  audienceContext,
  editorialPillar,
  primaryFormat = 'VIDEO',
  suggestedModes = [],
}) => {
  const skillMeta = SKILL_LEVEL_METADATA[skillLevel];
  const audMeta = audienceContext ? AUDIENCE_CONTEXT_METADATA[audienceContext] : null;
  const pillarMeta = editorialPillar ? EDITORIAL_PILLAR_METADATA[editorialPillar] : null;
  const formatMeta = PRESENTATION_FORMAT_METADATA[primaryFormat];

  return (
    <article
      id="learning-unit-audience-preview"
      className="space-y-4 rounded-xl border border-slate-700/60 bg-slate-900/90 p-5 text-slate-100 shadow-lg"
      aria-label="Audience Lesson Preview"
    >
      {/* Header Badges */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {topicName && (
          <span className="inline-flex items-center rounded-md bg-indigo-950/80 px-2 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-800/60">
            {topicName}
          </span>
        )}
        {subtopicName && (
          <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
            {subtopicName}
          </span>
        )}
        <span className="inline-flex items-center rounded-md bg-emerald-950/80 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-800/50">
          Level: {skillMeta.label}
        </span>
        {audMeta && (
          <span className="inline-flex items-center rounded-md bg-sky-950/80 px-2 py-0.5 text-xs font-medium text-sky-300 border border-sky-800/50">
            Audience: {audMeta.label}
          </span>
        )}
        {pillarMeta && (
          <span className="inline-flex items-center rounded-md bg-amber-950/80 px-2 py-0.5 text-xs font-medium text-amber-300 border border-amber-800/50">
            Pillar: {pillarMeta.title}
          </span>
        )}
        <span className="inline-flex items-center rounded-md bg-purple-950/80 px-2 py-0.5 text-xs font-medium text-purple-300 border border-purple-800/50">
          Format: {formatMeta.displayName}
        </span>
      </div>

      {/* Lesson Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          {title || <span className="italic text-slate-500">Untitled Learning Unit</span>}
        </h2>
      </div>

      {/* Learning Objective */}
      <div className="rounded-lg bg-indigo-950/30 border border-indigo-900/40 p-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
          <BookOpen className="h-4 w-4" />
          <span>Learning Objective</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-indigo-100">
          {learningObjective || <span className="italic text-slate-500">No objective specified yet.</span>}
        </p>
      </div>

      {/* Verified Problem-Solving Method */}
      <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>Verified Method (Step-by-Step Reasoning)</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
          {verifiedMethod || <span className="italic text-slate-500">Step-by-step reasoning not yet entered.</span>}
        </p>
      </div>

      {/* Calculations Breakdown */}
      {correctCalculations && (
        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Compass className="h-4 w-4" />
            <span>Calculation Proof &amp; Reference Values</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap font-mono text-xs leading-relaxed text-amber-200">
            {correctCalculations}
          </p>
        </div>
      )}

      {/* Real-Life Context & Scenarios */}
      {(realLifeScenario || (realLifeApplications && realLifeApplications.length > 0)) && (
        <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400">
            <Lightbulb className="h-4 w-4" />
            <span>Everyday Situations &amp; Applications</span>
          </div>
          {realLifeScenario && (
            <p className="mt-1 text-sm italic text-sky-200">
              &ldquo;{realLifeScenario}&rdquo;
            </p>
          )}
          {realLifeApplications && realLifeApplications.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-300">
              {realLifeApplications.map((app, idx) => (
                <li key={idx}>{app}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Common Mistakes */}
      {commonMistakes && commonMistakes.length > 0 && (
        <div className="rounded-lg bg-rose-950/20 border border-rose-900/30 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400">
            <AlertCircle className="h-4 w-4" />
            <span>Common Cognitive Traps &amp; Mistakes to Avoid</span>
          </div>
          <ul className="mt-1.5 list-inside list-disc space-y-1 text-xs text-rose-200">
            {commonMistakes.map((mistake, idx) => (
              <li key={idx}>{mistake}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Prerequisites */}
      {prerequisiteSkills && prerequisiteSkills.length > 0 && (
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Prerequisites: </span>
          {prerequisiteSkills.join(', ')}
        </div>
      )}

      {/* Suggested Production Modes */}
      {suggestedModes && suggestedModes.length > 0 && (
        <div className="border-t border-slate-800 pt-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Film className="h-4 w-4" />
            <span>Planned Production Artifacts</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedModes.map((m) => {
              const mMeta = CANONICAL_CONTENT_MODE_METADATA[m];
              return (
                <span
                  key={m}
                  className="inline-flex items-center rounded bg-purple-950/60 border border-purple-800/40 px-2.5 py-1 text-xs text-purple-200"
                >
                  {mMeta.displayName}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
};
