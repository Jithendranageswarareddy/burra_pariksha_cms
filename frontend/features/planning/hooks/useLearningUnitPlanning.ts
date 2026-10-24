/**
 * BURRA PARIKSHA CMS — Learning Unit Planning Hook
 * Location: frontend/features/planning/hooks/useLearningUnitPlanning.ts
 *
 * Source of Truth: docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md
 * Task: S11-T04 Learning Unit Planning Workspace UI
 *
 * Manages:
 * 1. Form state for Layer 1 (Curriculum) and Layer 2 (Learning Design) fields.
 * 2. 2-Tier Taxonomy lookup (Topic -> Subtopic) through typed API clients.
 * 3. Client and server validation with structured error feedback.
 * 4. Separate SAVE_DRAFT and SUBMIT_FOR_VERIFICATION operations.
 * 5. Optimistic Concurrency Control (OCC) conflict detection and recovery.
 * 6. Authorization error translation without treating UI state as the security boundary.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AudienceContext,
  CanonicalContentMode,
  EditorialPillar,
  LearningUnitPlanningDto,
  PresentationFormat,
  SkillLevel,
  Subtopic,
  Topic,
} from '../../../../shared';
import { learningUnitsApi, taxonomyApi, ApiClientError, getApiErrorMessage } from '../../../api';

export interface LearningUnitFormState {
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
  title: string;
  learningObjective: string;
  prerequisiteSkills: string[];
  verifiedMethod: string;
  correctCalculations: string;
  commonMistakes: string[];
  realLifeApplications: string[];
  realLifeScenario: string;
  skillLevel: SkillLevel;
  audienceContext?: AudienceContext;
  editorialPillar?: EditorialPillar;
  primaryFormat: PresentationFormat;
  suggestedModes: CanonicalContentMode[];
}

export const DEFAULT_FORM_STATE: LearningUnitFormState = {
  topicId: '',
  topicName: '',
  subtopicId: '',
  subtopicName: '',
  title: '',
  learningObjective: '',
  prerequisiteSkills: [],
  verifiedMethod: '',
  correctCalculations: '',
  commonMistakes: [],
  realLifeApplications: [],
  realLifeScenario: '',
  skillLevel: 'BEGINNER',
  audienceContext: undefined,
  editorialPillar: undefined,
  primaryFormat: 'VIDEO',
  suggestedModes: ['QUESTION_CHALLENGE_SHORT'],
};

export interface UseLearningUnitPlanningOptions {
  initialUnitId?: string;
  initialUnit?: LearningUnitPlanningDto | null;
}

export function useLearningUnitPlanning(options: UseLearningUnitPlanningOptions = {}) {
  const [learningUnit, setLearningUnit] = useState<LearningUnitPlanningDto | null>(options.initialUnit || null);
  const [form, setForm] = useState<LearningUnitFormState>(() => {
    if (options.initialUnit) {
      return {
        topicId: options.initialUnit.topicId || '',
        topicName: options.initialUnit.topicName || '',
        subtopicId: options.initialUnit.subtopicId || '',
        subtopicName: options.initialUnit.subtopicName || '',
        title: options.initialUnit.title || '',
        learningObjective: options.initialUnit.learningObjective || '',
        prerequisiteSkills: options.initialUnit.prerequisiteSkills || [],
        verifiedMethod: options.initialUnit.verifiedMethod || '',
        correctCalculations: options.initialUnit.correctCalculations || '',
        commonMistakes: options.initialUnit.commonMistakes || [],
        realLifeApplications: options.initialUnit.realLifeApplications || [],
        realLifeScenario: options.initialUnit.realLifeScenario || '',
        skillLevel: options.initialUnit.skillLevel || 'BEGINNER',
        audienceContext: options.initialUnit.audienceContext,
        editorialPillar: options.initialUnit.editorialPillar,
        primaryFormat: options.initialUnit.primaryFormat || 'VIDEO',
        suggestedModes: options.initialUnit.suggestedModes || ['QUESTION_CHALLENGE_SHORT'],
      };
    }
    return DEFAULT_FORM_STATE;
  });

  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(false);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [concurrencyConflict, setConcurrencyConflict] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Load initial taxonomy topics
  useEffect(() => {
    let isSubscribed = true;
    async function loadTopics() {
      try {
        setLoadingTaxonomy(true);
        const data = await taxonomyApi.getTopics();
        if (isSubscribed) {
          setTopics(data || []);
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setErrorMessage(getApiErrorMessage(err, 'Failed to load taxonomy topics.'));
        }
      } finally {
        if (isSubscribed) {
          setLoadingTaxonomy(false);
        }
      }
    }
    loadTopics();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Fetch subtopics when selected topic changes
  useEffect(() => {
    let isSubscribed = true;
    async function loadSubtopics() {
      if (!form.topicId) {
        setSubtopics([]);
        return;
      }
      try {
        const data = await taxonomyApi.getSubtopics(form.topicId);
        if (isSubscribed) {
          setSubtopics(data || []);
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setErrorMessage(getApiErrorMessage(err, 'Failed to load subtopics.'));
        }
      }
    }
    loadSubtopics();
    return () => {
      isSubscribed = false;
    };
  }, [form.topicId]);

  // Load Learning Unit by ID if supplied
  const loadUnitById = useCallback(async (id: string) => {
    try {
      setLoadingUnit(true);
      setErrorMessage(null);
      setConcurrencyConflict(false);
      const unit = await learningUnitsApi.getById(id);
      setLearningUnit(unit);
      setForm({
        topicId: unit.topicId || '',
        topicName: unit.topicName || '',
        subtopicId: unit.subtopicId || '',
        subtopicName: unit.subtopicName || '',
        title: unit.title || '',
        learningObjective: unit.learningObjective || '',
        prerequisiteSkills: unit.prerequisiteSkills || [],
        verifiedMethod: unit.verifiedMethod || '',
        correctCalculations: unit.correctCalculations || '',
        commonMistakes: unit.commonMistakes || [],
        realLifeApplications: unit.realLifeApplications || [],
        realLifeScenario: unit.realLifeScenario || '',
        skillLevel: unit.skillLevel || 'BEGINNER',
        audienceContext: unit.audienceContext,
        editorialPillar: unit.editorialPillar,
        primaryFormat: unit.primaryFormat || 'VIDEO',
        suggestedModes: unit.suggestedModes || ['QUESTION_CHALLENGE_SHORT'],
      });
      setIsDirty(false);
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err, `Failed to load learning unit ${id}.`));
    } finally {
      setLoadingUnit(false);
    }
  }, []);

  useEffect(() => {
    if (options.initialUnitId) {
      loadUnitById(options.initialUnitId);
    }
  }, [options.initialUnitId, loadUnitById]);

  // Form field updater helper
  const updateField = useCallback(<K extends keyof LearningUnitFormState>(field: K, value: LearningUnitFormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Cascade clear subtopic if topic changed
      if (field === 'topicId' && value !== prev.topicId) {
        next.subtopicId = '';
        next.subtopicName = '';
      }
      return next;
    });
    setIsDirty(true);
    setValidationErrors((prev) => {
      if (prev[field]) {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      }
      return prev;
    });
  }, []);

  // Set topic with name
  const setTopic = useCallback((topicId: string) => {
    const topicObj = topics.find((t) => t.id === topicId);
    setForm((prev) => ({
      ...prev,
      topicId,
      topicName: topicObj?.name || '',
      subtopicId: '',
      subtopicName: '',
    }));
    setIsDirty(true);
  }, [topics]);

  // Set subtopic with name
  const setSubtopic = useCallback((subtopicId: string) => {
    const subtopicObj = subtopics.find((s) => s.id === subtopicId);
    setForm((prev) => ({
      ...prev,
      subtopicId,
      subtopicName: subtopicObj?.name || '',
    }));
    setIsDirty(true);
  }, [subtopics]);

  // Client validation
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!form.topicId) errors.topicId = 'Topic is required.';
    if (!form.subtopicId) errors.subtopicId = 'Subtopic is required.';
    if (!form.title || form.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    }
    if (!form.learningObjective || form.learningObjective.trim().length < 10) {
      errors.learningObjective = 'Learning objective must be at least 10 characters.';
    }
    if (!form.verifiedMethod || form.verifiedMethod.trim().length < 10) {
      errors.verifiedMethod = 'Verified method must be at least 10 characters.';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  // SAVE_DRAFT operation
  const saveDraft = useCallback(async (): Promise<LearningUnitPlanningDto | null> => {
    if (!validateForm()) {
      setErrorMessage('Please fix the validation errors before saving.');
      return null;
    }
    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setConcurrencyConflict(false);

      let saved: LearningUnitPlanningDto;

      if (learningUnit?.id) {
        // Update existing draft with expectedVersion
        const response = await learningUnitsApi.updateDraft(learningUnit.id, {
          topicId: form.topicId,
          topicName: form.topicName || undefined,
          subtopicId: form.subtopicId,
          subtopicName: form.subtopicName || undefined,
          title: form.title.trim(),
          learningObjective: form.learningObjective.trim(),
          prerequisiteSkills: form.prerequisiteSkills,
          verifiedMethod: form.verifiedMethod.trim(),
          correctCalculations: form.correctCalculations.trim() || undefined,
          commonMistakes: form.commonMistakes,
          realLifeApplications: form.realLifeApplications,
          realLifeScenario: form.realLifeScenario.trim() || undefined,
          skillLevel: form.skillLevel,
          audienceContext: form.audienceContext,
          editorialPillar: form.editorialPillar,
          primaryFormat: form.primaryFormat,
          suggestedModes: form.suggestedModes,
          expectedVersion: learningUnit.version,
        });
        saved = response.learningUnit;
      } else {
        // Create new draft
        const response = await learningUnitsApi.saveDraft({
          topicId: form.topicId,
          topicName: form.topicName || undefined,
          subtopicId: form.subtopicId,
          subtopicName: form.subtopicName || undefined,
          title: form.title.trim(),
          learningObjective: form.learningObjective.trim(),
          prerequisiteSkills: form.prerequisiteSkills,
          verifiedMethod: form.verifiedMethod.trim(),
          correctCalculations: form.correctCalculations.trim() || undefined,
          commonMistakes: form.commonMistakes,
          realLifeApplications: form.realLifeApplications,
          realLifeScenario: form.realLifeScenario.trim() || undefined,
          skillLevel: form.skillLevel,
          audienceContext: form.audienceContext,
          editorialPillar: form.editorialPillar,
          primaryFormat: form.primaryFormat,
          suggestedModes: form.suggestedModes,
        });
        saved = response.learningUnit;
      }

      setLearningUnit(saved);
      setIsDirty(false);
      setSuccessMessage(`Learning unit draft saved successfully (v${saved.version}).`);
      return saved;
    } catch (err: unknown) {
      if (err instanceof ApiClientError && (err.statusCode === 409 || err.code === 'CONFLICT_OPTIMISTIC_LOCK')) {
        setConcurrencyConflict(true);
        setErrorMessage(
          `Conflict: This Learning Unit was modified in another session. Expected version ${learningUnit?.version}, but the datastore has advanced. Your unsaved edits are preserved. Reload from remote to resolve.`
        );
      } else if (err instanceof ApiClientError && err.statusCode === 403) {
        setErrorMessage('Permission denied: You do not have permission to plan or update learning units.');
      } else {
        setErrorMessage(getApiErrorMessage(err, 'Failed to save learning unit draft.'));
      }
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [form, learningUnit, validateForm]);

  // SUBMIT_FOR_VERIFICATION operation
  const submitForVerification = useCallback(async (): Promise<LearningUnitPlanningDto | null> => {
    if (!validateForm()) {
      setErrorMessage('Please fix the validation errors before submitting for verification.');
      return null;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setConcurrencyConflict(false);

      let targetUnit = learningUnit;

      // If unit is not saved yet or dirty, save it first as draft
      if (!targetUnit?.id || isDirty) {
        const saved = await saveDraft();
        if (!saved) {
          return null;
        }
        targetUnit = saved;
      }

      const response = await learningUnitsApi.submitForVerification(targetUnit.id, targetUnit.version);
      const submitted = response.learningUnit;
      setLearningUnit(submitted);
      setIsDirty(false);
      setSuccessMessage(
        `Learning unit submitted for verification (v${submitted.version}). Planning status: ${submitted.planningStatus}.`
      );
      return submitted;
    } catch (err: unknown) {
      if (err instanceof ApiClientError && (err.statusCode === 409 || err.code === 'CONFLICT_OPTIMISTIC_LOCK')) {
        setConcurrencyConflict(true);
        setErrorMessage(
          `Conflict: Concurrent modification detected during verification submission. Expected version ${learningUnit?.version}. Your unsaved edits are preserved. Reload from remote to resolve.`
        );
      } else if (err instanceof ApiClientError && err.statusCode === 403) {
        setErrorMessage('Permission denied: You do not have permission to submit learning units for verification.');
      } else {
        setErrorMessage(getApiErrorMessage(err, 'Failed to submit learning unit for verification.'));
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [form, learningUnit, isDirty, saveDraft, validateForm]);

  // Reset to fresh blank form
  const resetForm = useCallback(() => {
    setLearningUnit(null);
    setForm(DEFAULT_FORM_STATE);
    setIsDirty(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setValidationErrors({});
    setConcurrencyConflict(false);
  }, []);

  return {
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
  };
}
