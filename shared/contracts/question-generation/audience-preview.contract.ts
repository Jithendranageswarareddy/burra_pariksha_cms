/**
 * BURRA PARIKSHA CMS — Audience Preview Contract
 * Specification: S9-T13 Audience-Facing Preview
 *
 * Defines explicit typed contracts for audience-facing preview projections:
 * - Strictly isolates audience-visible presentation copy from internal answers,
 *   reviewer notes, validation diagnostics, and production metadata.
 * - Supports explicit source selection between 'SAVED_RECORD' and 'UNSAVED_EDITS'.
 * - Guarantees sequential presentation ordering in 9:16 vertical short format.
 */

export type AudiencePreviewSourceVersion = 'SAVED_RECORD' | 'UNSAVED_EDITS';

export interface AudienceChoiceItem {
  label: 'A' | 'B' | 'C' | 'D';
  teluguLabel: 'ఎ' | 'బి' | 'సి' | 'డి' | string;
  text: string;
}

export interface AudienceQuestionItemProjection {
  orderIndex: number;
  questionNumber: number;
  questionText: string;
  choices: AudienceChoiceItem[];
  isComplete: boolean;
  incompleteNotice?: string;
}

export interface AudiencePreviewPackageProjection {
  packageType: 'QUESTION_CHALLENGE_SHORT';
  sourceVersion: AudiencePreviewSourceVersion;
  versionNumber?: number;
  draftId?: string;
  hasSavedRecord: boolean;
  channelBranding: string; // "బుర్ర పరీక్ష"
  topicTitle?: string;
  subtopicTitle?: string;
  participationInvitation: string; // "మీ బుర్రకి పరీక్ష! సరైన సమాధానం కామెంట్ చేయండి."
  callToAction: string; // "లైక్ చేయండి, కామెంట్ చేయండి, సబ్‌స్క్రైబ్ చేసుకోండి!"
  pinnedCommentPrompt: string; // "సరైన సమాధానం పిన్ కామెంట్‌లో చూడండి!"
  aspectRatio: '9:16';
  durationSeconds: number; // 58
  questions: AudienceQuestionItemProjection[];
  totalQuestions: number;
  isComplete: boolean;
  incompleteNotice?: string;
}
