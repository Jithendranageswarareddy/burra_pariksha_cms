/**
 * BURRA PARIKSHA CMS — Learning Unit Planning Workspace Component
 * Location: frontend/features/planning/components/LearningUnitWorkspace.tsx
 *
 * Source of Truth: docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md
 * (Section 6: The Central Asset: A Verified Learning Unit; Section 7: Proposed Content-Planning Model)
 * Architectural Decision: ADR-015 (docs/architecture/DECISION-LOG.md)
 * Task: S11-T04 Learning Unit Planning Workspace UI
 *
 * Key Invariants:
 * 1. Strictly 2-tier Taxonomy (Topic -> Subtopic). Category is obsolete.
 * 2. Save Draft and Submit for Verification remain distinct, independent operations.
 * 3. Optimistic Concurrency Control (OCC) with explicit expectedVersion handling.
 * 4. Audience preview strictly excludes reviewer notes, author identities, and operational metadata.
 * 5. Permissions are enforced by the backend; disabled UI elements are UX cues, not boundaries.
 */

import React, { useState } from 'react';
import {
  Save,
  Send,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  Info,
  Clock,
  Layers,
  FileCheck,
} from 'lucide-react';
import { useLearningUnitPlanning, UseLearningUnitPlanningOptions } from '../hooks/useLearningUnitPlanning';
import { LearningDesignSelectors } from './LearningDesignSelectors';
import { LearningUnitAudiencePreview } from './LearningUnitAudiencePreview';

export interface LearningUnitWorkspaceProps extends UseLearningUnitPlanningOptions {
  onSuccess?: (unitId: string) => void;
}

export const LearningUnitWorkspace: React.FC<LearningUnitWorkspaceProps> = (props) => {
  const {
    learningUnit,
    form,
    topics,
    subtopics,
    loadingTaxonomy,
    loadingUnit,
    isSaving,
    isSubmitting,
    errorMessage,
    successMessage,
    validationErrors,
    concurrencyConflict,
    isDirty,
    updateField,
    setTopic,
    setSubtopic,
    saveDraft,
    submitForVerification,
    loadUnitById,
    resetForm,
  } = useLearningUnitPlanning(props);

  const [activeRightTab, setActiveRightTab] = useState<'preview' | 'metadata'>('preview');

  // Helpers for list string conversion
  const handleCommaListChange = (
    field: 'prerequisiteSkills' | 'commonMistakes' | 'realLifeApplications',
    rawText: string
  ) => {
    const items = rawText
      .split('\n')
      .flatMap((line) => line.split(','))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    updateField(field, items);
  };

  if (loadingUnit) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <span className="text-sm">Loading learning unit workspace...</span>
        </div>
      </div>
    );
  }

  const isSubmitted = learningUnit?.planningStatus === 'SUBMITTED_FOR_VERIFICATION';

  return (
    <div id="learning-unit-workspace" className="space-y-6">
      {/* Workspace Header & Action Bar */}
      <header className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white sm:text-xl">
              Learning Unit Planning Workspace
            </h1>
            {learningUnit && (
              <div className="flex items-center gap-2">
                <span
                  id="badge-planning-status"
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isSubmitted
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                      : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                  }`}
                >
                  {isSubmitted ? 'Submitted for Verification' : 'Planning Draft'}
                </span>
                <span
                  id="badge-occ-version"
                  className="rounded bg-slate-800 px-2 py-0.5 text-xs font-mono font-medium text-slate-300"
                >
                  v{learningUnit.version}
                </span>
              </div>
            )}
            {isDirty && (
              <span className="text-xs text-amber-400 font-medium animate-pulse">
                • Unsaved edits
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Define verified curriculum concepts (Layer 1) and pedagogical design (Layer 2) before publication.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {learningUnit && (
            <button
              type="button"
              id="btn-new-unit"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Unit</span>
            </button>
          )}

          {/* SAVE DRAFT Button (distinct operation) */}
          <button
            type="button"
            id="btn-save-draft"
            disabled={isSaving || isSubmitting}
            onClick={() => saveDraft()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>Save Draft</span>
          </button>

          {/* SUBMIT FOR VERIFICATION Button (distinct operation) */}
          <button
            type="button"
            id="btn-submit-verification"
            disabled={isSaving || isSubmitting}
            onClick={() => submitForVerification()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
          >
            {isSubmitting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>Submit for Verification</span>
          </button>
        </div>
      </header>

      {/* Optimistic Concurrency Control (OCC 409) Conflict Banner */}
      {concurrencyConflict && (
        <div
          id="banner-concurrency-conflict"
          className="rounded-lg border border-rose-800/80 bg-rose-950/60 p-4 text-rose-200 shadow-md"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-rose-100">
                Optimistic Concurrency Conflict (Stale Version)
              </h3>
              <p className="mt-1 text-xs text-rose-300">
                {errorMessage ||
                  'This Learning Unit was modified in another session. Your local edits are preserved in the form.'}
              </p>
              {learningUnit?.id && (
                <div className="mt-3">
                  <button
                    type="button"
                    id="btn-reload-remote"
                    onClick={() => loadUnitById(learningUnit.id)}
                    className="inline-flex items-center gap-1.5 rounded bg-rose-900 px-3 py-1 text-xs font-medium text-rose-100 hover:bg-rose-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Reload Latest from Server</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div
          id="banner-success"
          className="flex items-center gap-2 rounded-lg border border-emerald-800/60 bg-emerald-950/50 p-3 text-xs font-medium text-emerald-200"
        >
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* General Error Notification */}
      {errorMessage && !concurrencyConflict && (
        <div
          id="banner-error"
          className="flex items-center gap-2 rounded-lg border border-rose-800/60 bg-rose-950/50 p-3 text-xs font-medium text-rose-200"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Panel (Form) + Right Panel (Audience Preview) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Form: 7 Columns */}
        <div className="space-y-6 lg:col-span-7">
          {/* Section 1: 2-Tier Taxonomy */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-sm font-semibold text-slate-200">
                1. Curriculum Taxonomy (Topic → Subtopic)
              </h2>
              <p className="text-xs text-slate-400">
                Authoritative 2-tier hierarchy (Category is obsolete).
              </p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Topic Dropdown */}
              <div>
                <label htmlFor="input-topic" className="block text-xs font-medium text-slate-300">
                  Topic <span className="text-rose-400">*</span>
                </label>
                <select
                  id="input-topic"
                  value={form.topicId}
                  disabled={loadingTaxonomy}
                  onChange={(e) => setTopic(e.target.value)}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 text-xs text-slate-100 shadow-sm focus:outline-none focus:ring-1 bg-slate-950 ${
                    validationErrors.topicId
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                >
                  <option value="">-- Select Curriculum Topic --</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {validationErrors.topicId && (
                  <p className="mt-1 text-[11px] text-rose-400">{validationErrors.topicId}</p>
                )}
              </div>

              {/* Subtopic Dropdown */}
              <div>
                <label htmlFor="input-subtopic" className="block text-xs font-medium text-slate-300">
                  Subtopic <span className="text-rose-400">*</span>
                </label>
                <select
                  id="input-subtopic"
                  value={form.subtopicId}
                  disabled={!form.topicId || subtopics.length === 0}
                  onChange={(e) => setSubtopic(e.target.value)}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 text-xs text-slate-100 shadow-sm focus:outline-none focus:ring-1 bg-slate-950 disabled:opacity-50 ${
                    validationErrors.subtopicId
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                >
                  <option value="">
                    {!form.topicId ? '-- Select Topic first --' : '-- Select Subtopic --'}
                  </option>
                  {subtopics.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {validationErrors.subtopicId && (
                  <p className="mt-1 text-[11px] text-rose-400">{validationErrors.subtopicId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Lesson Core (Title, Objective, Verified Method) */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-sm font-semibold text-slate-200">
                2. Core Educational Content (Layer 1)
              </h2>
              <p className="text-xs text-slate-400">
                Verified reasoning method and clear learning outcomes.
              </p>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="input-title" className="block text-xs font-medium text-slate-300">
                  Lesson Title <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500">Min 3 chars</span>
              </div>
              <input
                id="input-title"
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Calculate percentage discounts and compare final prices"
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-xs text-slate-100 shadow-sm focus:outline-none focus:ring-1 bg-slate-950 ${
                  validationErrors.title
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {validationErrors.title && (
                <p className="mt-1 text-[11px] text-rose-400">{validationErrors.title}</p>
              )}
            </div>

            {/* Learning Objective */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="input-learning-objective" className="block text-xs font-medium text-slate-300">
                  Learning Objective <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500">{form.learningObjective.length}/10 min chars</span>
              </div>
              <textarea
                id="input-learning-objective"
                rows={2}
                value={form.learningObjective}
                onChange={(e) => updateField('learningObjective', e.target.value)}
                placeholder="What the viewer should understand or be able to do after this lesson..."
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-xs text-slate-100 shadow-sm focus:outline-none focus:ring-1 bg-slate-950 leading-relaxed ${
                  validationErrors.learningObjective
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {validationErrors.learningObjective && (
                <p className="mt-1 text-[11px] text-rose-400">{validationErrors.learningObjective}</p>
              )}
            </div>

            {/* Verified Method */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="input-verified-method" className="block text-xs font-medium text-slate-300">
                  Verified Method (Step-by-Step Reasoning) <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500">{form.verifiedMethod.length}/10 min chars</span>
              </div>
              <textarea
                id="input-verified-method"
                rows={4}
                value={form.verifiedMethod}
                onChange={(e) => updateField('verifiedMethod', e.target.value)}
                placeholder="Step 1: Identify original price and discount percentage&#10;Step 2: Multiply price by discount rate to find savings&#10;Step 3: Subtract savings from original price..."
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-xs text-slate-100 shadow-sm focus:outline-none focus:ring-1 bg-slate-950 font-sans leading-relaxed ${
                  validationErrors.verifiedMethod
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {validationErrors.verifiedMethod && (
                <p className="mt-1 text-[11px] text-rose-400">{validationErrors.verifiedMethod}</p>
              )}
            </div>

            {/* Correct Calculations */}
            <div>
              <label htmlFor="input-correct-calculations" className="block text-xs font-medium text-slate-300">
                Correct Calculations &amp; Proof (Optional)
              </label>
              <textarea
                id="input-correct-calculations"
                rows={2}
                value={form.correctCalculations}
                onChange={(e) => updateField('correctCalculations', e.target.value)}
                placeholder="e.g. ₹1000 - 20% = ₹800; Flat ₹150 off = ₹850; Difference = ₹50."
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section 3: Everyday Relevance & Traps */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h2 className="text-sm font-semibold text-slate-200">
                3. Real-Life Relevance &amp; Common Traps
              </h2>
              <p className="text-xs text-slate-400">
                Ground math in everyday situations to improve retention.
              </p>
            </div>

            {/* Real Life Scenario */}
            <div>
              <label htmlFor="input-real-life-scenario" className="block text-xs font-medium text-slate-300">
                Everyday Scenario Example
              </label>
              <input
                id="input-real-life-scenario"
                type="text"
                value={form.realLifeScenario}
                onChange={(e) => updateField('realLifeScenario', e.target.value)}
                placeholder="e.g. Buying a shirt priced at ₹800 during a 25% off festival sale"
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Common Mistakes */}
            <div>
              <label htmlFor="input-common-mistakes" className="block text-xs font-medium text-slate-300">
                Common Mistakes to Warn Against (one per line)
              </label>
              <textarea
                id="input-common-mistakes"
                rows={2}
                value={form.commonMistakes.join('\n')}
                onChange={(e) => handleCommaListChange('commonMistakes', e.target.value)}
                placeholder="Subtracting percentage value directly from rupee price (e.g. 100 - 20 = 80 without checking base)&#10;Confusing markup with discount"
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Prerequisites */}
            <div>
              <label htmlFor="input-prerequisites" className="block text-xs font-medium text-slate-300">
                Prerequisite Skills (comma-separated)
              </label>
              <input
                id="input-prerequisites"
                type="text"
                value={form.prerequisiteSkills.join(', ')}
                onChange={(e) => handleCommaListChange('prerequisiteSkills', e.target.value)}
                placeholder="Basic multiplication, Fraction-to-percentage conversion"
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section 4: Learning Design Selectors (Layer 2) */}
          <LearningDesignSelectors
            skillLevel={form.skillLevel}
            audienceContext={form.audienceContext}
            editorialPillar={form.editorialPillar}
            primaryFormat={form.primaryFormat}
            suggestedModes={form.suggestedModes}
            onSkillLevelChange={(lvl) => updateField('skillLevel', lvl)}
            onAudienceContextChange={(aud) => updateField('audienceContext', aud)}
            onEditorialPillarChange={(pil) => updateField('editorialPillar', pil)}
            onPrimaryFormatChange={(fmt) => updateField('primaryFormat', fmt)}
            onSuggestedModesChange={(modes) => updateField('suggestedModes', modes)}
          />
        </div>

        {/* Right Panel: 5 Columns (Audience Preview & Metadata) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                id="tab-audience-preview"
                onClick={() => setActiveRightTab('preview')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeRightTab === 'preview'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Audience Preview</span>
              </button>
              <button
                type="button"
                id="tab-planning-metadata"
                onClick={() => setActiveRightTab('metadata')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeRightTab === 'metadata'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Info className="h-3.5 w-3.5" />
                <span>Planning Metadata</span>
              </button>
            </div>
          </div>

          {activeRightTab === 'preview' ? (
            <LearningUnitAudiencePreview
              title={form.title}
              topicName={form.topicName}
              subtopicName={form.subtopicName}
              learningObjective={form.learningObjective}
              verifiedMethod={form.verifiedMethod}
              correctCalculations={form.correctCalculations}
              prerequisiteSkills={form.prerequisiteSkills}
              commonMistakes={form.commonMistakes}
              realLifeApplications={form.realLifeApplications}
              realLifeScenario={form.realLifeScenario}
              skillLevel={form.skillLevel}
              audienceContext={form.audienceContext}
              editorialPillar={form.editorialPillar}
              primaryFormat={form.primaryFormat}
              suggestedModes={form.suggestedModes}
            />
          ) : (
            <div
              id="learning-unit-metadata-panel"
              className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300"
            >
              <h3 className="font-semibold text-slate-200">Datastore &amp; Planning Lifecycle</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-slate-500">Unit ID</dt>
                  <dd className="font-mono text-slate-200">{learningUnit?.id || 'Pending initial draft creation'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Planning Status</dt>
                  <dd className="font-semibold text-indigo-300">
                    {learningUnit?.planningStatus || 'DRAFT (Local)'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Optimistic Concurrency Version (OCC)</dt>
                  <dd className="font-mono text-slate-200">{learningUnit?.version ?? 1}</dd>
                </div>
                {learningUnit?.createdAt && (
                  <div>
                    <dt className="text-slate-500">Created At</dt>
                    <dd className="text-slate-300">{new Date(learningUnit.createdAt).toLocaleString()}</dd>
                  </div>
                )}
                {learningUnit?.updatedAt && (
                  <div>
                    <dt className="text-slate-500">Last Modified</dt>
                    <dd className="text-slate-300">{new Date(learningUnit.updatedAt).toLocaleString()}</dd>
                  </div>
                )}
              </dl>
              <div className="rounded bg-slate-950 p-2 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Invariant: </span>
                Planning operations do not trigger or advance canonical 15-stage question/video workflow.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
