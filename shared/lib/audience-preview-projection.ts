/**
 * BURRA PARIKSHA CMS — Audience Preview Projection Utility
 * Specification: S9-T13 Audience-Facing Preview
 *
 * Pure, deterministic projection that maps authoring candidate/draft records into
 * strictly audience-facing preview view models:
 * - Excludes all internal-only fields: correctAnswer, explanations, reviewer notes,
 *   validation diagnostics, UUIDs, author IDs, and workflow state.
 * - Supports explicit switching between 'UNSAVED_EDITS' (current working copy)
 *   and 'SAVED_RECORD' (persisted Firestore record).
 * - Enforces sequential presentation ordering for Question Challenge Short (9:16).
 * - Handles empty or incomplete slots without fabricating artificial audience content.
 */

import {
  AudienceChoiceItem,
  AudiencePreviewPackageProjection,
  AudiencePreviewSourceVersion,
  AudienceQuestionItemProjection,
} from '../contracts/question-generation/audience-preview.contract';
import {
  QuestionBatchAssembly,
  QuestionBatchSlot,
  StudioCandidate,
} from '../contracts/question-generation/question-generation.contract';
import { QuestionDraft } from '../types/question';

const TELUGU_CHOICE_LABELS: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'ఎ',
  B: 'బి',
  C: 'సి',
  D: 'డి',
};

function formatChoices(options?: any): AudienceChoiceItem[] {
  const keys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  return keys.map((key) => {
    const lowerKey = key.toLowerCase() as 'a' | 'b' | 'c' | 'd';
    const text = String(
      options?.[lowerKey] ||
      options?.[`option${key}`] ||
      options?.[`option_${lowerKey}`] ||
      ''
    ).trim();
    return {
      label: key,
      teluguLabel: TELUGU_CHOICE_LABELS[key],
      text,
    };
  });
}

function projectSlotToAudienceItem(slot: QuestionBatchSlot, index: number): AudienceQuestionItemProjection {
  const qText = String(slot.questionText || (slot as any).content || '').trim();
  const rawOptions = slot.options || {
    a: (slot as any).optionA,
    b: (slot as any).optionB,
    c: (slot as any).optionC,
    d: (slot as any).optionD,
  };
  const choices = formatChoices(rawOptions);
  const hasPrompt = qText.length >= 5;
  const hasAllChoices = choices.every((c) => c.text.length > 0);
  const isComplete = hasPrompt && hasAllChoices;

  let incompleteNotice: string | undefined = undefined;
  if (!hasPrompt && !choices.some((c) => c.text.length > 0)) {
    incompleteNotice = `Slot #${slot.slotNumber || index + 1} is empty in the editor.`;
  } else if (!hasPrompt) {
    incompleteNotice = `Slot #${slot.slotNumber || index + 1}: Question statement is incomplete.`;
  } else if (!hasAllChoices) {
    incompleteNotice = `Slot #${slot.slotNumber || index + 1}: One or more multiple-choice options are missing.`;
  }

  return {
    orderIndex: index,
    questionNumber: slot.slotNumber || index + 1,
    questionText: qText,
    choices,
    isComplete,
    incompleteNotice,
  };
}

/**
 * Projects working candidate state or saved draft into a strictly segregated audience preview package.
 */
export function projectToAudiencePreview({
  candidate,
  batchAssembly,
  savedDraft,
  sourceVersion,
  topicName,
  subtopicName,
}: {
  candidate: Partial<StudioCandidate>;
  batchAssembly?: QuestionBatchAssembly | null;
  savedDraft?: QuestionDraft | null;
  sourceVersion: AudiencePreviewSourceVersion;
  topicName?: string;
  subtopicName?: string;
}): AudiencePreviewPackageProjection {
  const hasSavedRecord = Boolean(savedDraft && savedDraft.id);
  const versionNumber = savedDraft?.version;
  const draftId = savedDraft?.id;

  const topicTitle = topicName || candidate.topicId || savedDraft?.topicName || savedDraft?.topicId;
  const subtopicTitle = subtopicName || candidate.subtopicId || savedDraft?.subtopicName || savedDraft?.subtopicId;

  // --------------------------------------------------------------------------
  // SOURCE: SAVED_RECORD
  // --------------------------------------------------------------------------
  if (sourceVersion === 'SAVED_RECORD') {
    if (!savedDraft) {
      return {
        packageType: 'QUESTION_CHALLENGE_SHORT',
        sourceVersion: 'SAVED_RECORD',
        hasSavedRecord: false,
        versionNumber: undefined,
        draftId: undefined,
        channelBranding: 'బుర్ర పరీక్ష',
        topicTitle,
        subtopicTitle,
        participationInvitation: 'మీ బుర్రకి పరీక్ష! సరైన సమాధానం కామెంట్ చేయండి.',
        callToAction: 'లైక్ చేయండి, కామెంట్ చేయండి, సబ్‌స్క్రైబ్ చేసుకోండి!',
        pinnedCommentPrompt: 'సరైన సమాధానం పిన్ కామెంట్‌లో చూడండి!',
        aspectRatio: '9:16',
        durationSeconds: 58,
        questions: [],
        totalQuestions: 0,
        isComplete: false,
        incompleteNotice: 'No saved draft record available yet. Save draft in the editor to view the persisted preview.',
      };
    }

    const savedSlots = Array.isArray(savedDraft.slots) ? savedDraft.slots : [];
    let questions: AudienceQuestionItemProjection[] = [];

    if (savedSlots.length > 0) {
      // Sort slots by slotNumber to reflect canonical package presentation order
      const sortedSlots = [...savedSlots].sort((a, b) => (a.slotNumber || 0) - (b.slotNumber || 0));
      questions = sortedSlots.map((slot, index) => projectSlotToAudienceItem(slot, index));
    } else {
      // Single question draft
      const qText = String(savedDraft.questionText || savedDraft.question || '').trim();
      const choices = formatChoices(
        savedDraft.options || {
          a: savedDraft.optionA,
          b: savedDraft.optionB,
          c: savedDraft.optionC,
          d: savedDraft.optionD,
        }
      );
      const isComplete = qText.length >= 5 && choices.every((c) => c.text.length > 0);
      questions = [
        {
          orderIndex: 0,
          questionNumber: 1,
          questionText: qText,
          choices,
          isComplete,
          incompleteNotice: isComplete ? undefined : 'Saved draft question statement or options are incomplete.',
        },
      ];
    }

    const isAllComplete = questions.length > 0 && questions.every((q) => q.isComplete);
    return {
      packageType: 'QUESTION_CHALLENGE_SHORT',
      sourceVersion: 'SAVED_RECORD',
      hasSavedRecord: true,
      versionNumber,
      draftId,
      channelBranding: 'బుర్ర పరీక్ష',
      topicTitle,
      subtopicTitle,
      participationInvitation: 'మీ బుర్రకి పరీక్ష! సరైన సమాధానం కామెంట్ చేయండి.',
      callToAction: 'లైక్ చేయండి, కామెంట్ చేయండి, సబ్‌స్క్రైబ్ చేసుకోండి!',
      pinnedCommentPrompt: 'సరైన సమాధానం పిన్ కామెంట్‌లో చూడండి!',
      aspectRatio: '9:16',
      durationSeconds: 58,
      questions,
      totalQuestions: questions.length,
      isComplete: isAllComplete,
      incompleteNotice: isAllComplete ? undefined : 'One or more slots in the saved record require completion.',
    };
  }

  // --------------------------------------------------------------------------
  // SOURCE: UNSAVED_EDITS (Current Working Copy)
  // --------------------------------------------------------------------------
  const activeSlots = batchAssembly?.slots || (candidate as any)?.slots;
  let questions: AudienceQuestionItemProjection[] = [];

  if (Array.isArray(activeSlots) && activeSlots.length > 0) {
    // Current in-memory order of batch slots
    questions = activeSlots.map((slot, index) => projectSlotToAudienceItem(slot, index));
  } else {
    // Single candidate in editor
    const qText = String(candidate.questionText || '').trim();
    const candAny = candidate as any;
    const choices = formatChoices({
      a: candidate.optionA || candAny?.options?.a,
      b: candidate.optionB || candAny?.options?.b,
      c: candidate.optionC || candAny?.options?.c,
      d: candidate.optionD || candAny?.options?.d,
    });
    const hasPrompt = qText.length >= 5;
    const hasAllChoices = choices.every((c) => c.text.length > 0);
    const isComplete = hasPrompt && hasAllChoices;

    let incompleteNotice: string | undefined = undefined;
    if (!hasPrompt && !choices.some((c) => c.text.length > 0)) {
      incompleteNotice = 'Question workspace is empty. Enter question statement and choices in editor.';
    } else if (!hasPrompt) {
      incompleteNotice = 'Question statement must contain at least 5 characters.';
    } else if (!hasAllChoices) {
      incompleteNotice = 'All 4 options (A, B, C, D) are required.';
    }

    questions = [
      {
        orderIndex: 0,
        questionNumber: 1,
        questionText: qText,
        choices,
        isComplete,
        incompleteNotice,
      },
    ];
  }

  const isAllComplete = questions.length > 0 && questions.every((q) => q.isComplete);
  return {
    packageType: 'QUESTION_CHALLENGE_SHORT',
    sourceVersion: 'UNSAVED_EDITS',
    hasSavedRecord,
    versionNumber,
    draftId,
    channelBranding: 'బుర్ర పరీక్ష',
    topicTitle,
    subtopicTitle,
    participationInvitation: 'మీ బుర్రకి పరీక్ష! సరైన సమాధానం కామెంట్ చేయండి.',
    callToAction: 'లైక్ చేయండి, కామెంట్ చేయండి, సబ్‌స్క్రైబ్ చేసుకోండి!',
    pinnedCommentPrompt: 'సరైన సమాధానం పిన్ కామెంట్‌లో చూడండి!',
    aspectRatio: '9:16',
    durationSeconds: 58,
    questions,
    totalQuestions: questions.length,
    isComplete: isAllComplete,
    incompleteNotice: isAllComplete ? undefined : 'Unsaved edits contain incomplete slots. Continue editing in canvas.',
  };
}
