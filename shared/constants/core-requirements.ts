/**
 * BURRA PARIKSHA CMS — Authoritative Core Requirements Constants & Compatibility
 * Location: shared/constants/core-requirements.ts
 *
 * Source of Truth: docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md
 * Architectural Decision: ADR-015 (docs/architecture/DECISION-LOG.md)
 *
 * Defines canonical constants, enums, metadata, and compatibility mappings for:
 * 1. Three Canonical Content Modes (Section 2) & Legacy Compatibility Mapping (Section 8)
 * 2. Five Presentation Formats (Section 3)
 * 3. Initial Editorial Pillars A–F (Section 4)
 * 4. Seven Audience Contexts (Section 5)
 * 5. Four Skill Levels (Section 5)
 */

import { DifficultyLevel } from './enums';

// ============================================================================
// 1. THREE CANONICAL CONTENT MODES (bp_cms_core_requirements1.md Section 2 & 8)
// ============================================================================

/**
 * Three canonical content modes defined by educational purpose:
 * - Mode 1: TOPIC_INTRODUCTION (Topic Introduction Video, 0 questions)
 * - Mode 2: WORKED_EXAMPLES (Worked Examples Video, problem-solving demonstration)
 * - Mode 3: QUESTION_CHALLENGE_SHORT (Question Challenge Short, retrieval practice)
 */
export type CanonicalContentMode =
  | 'TOPIC_INTRODUCTION'
  | 'WORKED_EXAMPLES'
  | 'QUESTION_CHALLENGE_SHORT';

export const CANONICAL_CONTENT_MODES: readonly CanonicalContentMode[] = [
  'TOPIC_INTRODUCTION',
  'WORKED_EXAMPLES',
  'QUESTION_CHALLENGE_SHORT',
] as const;

/**
 * Legacy runtime identifier retained for 100% backward compatibility
 * with existing Firestore documents, persisted drafts, and routes.
 * (bp_cms_core_requirements1.md Section 8 Priority 1).
 */
export const LEGACY_WORKED_EXAMPLES_MODE = 'EXPLAINED_QUESTIONS_VIDEO' as const;
export type LegacyWorkedExamplesMode = typeof LEGACY_WORKED_EXAMPLES_MODE;

export type SupportedContentMode = CanonicalContentMode | LegacyWorkedExamplesMode;

export const SUPPORTED_CONTENT_MODES: readonly SupportedContentMode[] = [
  'TOPIC_INTRODUCTION',
  'WORKED_EXAMPLES',
  'QUESTION_CHALLENGE_SHORT',
  LEGACY_WORKED_EXAMPLES_MODE,
] as const;

export interface ContentModeMetadata {
  readonly id: CanonicalContentMode;
  readonly code: 'MODE_1' | 'MODE_2' | 'MODE_3';
  readonly displayName: string;
  readonly shortLabel: string;
  readonly pedagogicalObjective: string;
  readonly defaultQuestionCount: number;
  readonly legacyAlias?: LegacyWorkedExamplesMode;
}

export const CANONICAL_CONTENT_MODE_METADATA: Record<CanonicalContentMode, ContentModeMetadata> = {
  TOPIC_INTRODUCTION: {
    id: 'TOPIC_INTRODUCTION',
    code: 'MODE_1',
    displayName: 'Topic Introduction Video',
    shortLabel: 'Topic Intro',
    pedagogicalObjective: 'Introduce a concept, explain why it matters in accessible Telugu, connect to familiar situation (0 questions).',
    defaultQuestionCount: 0,
  },
  WORKED_EXAMPLES: {
    id: 'WORKED_EXAMPLES',
    code: 'MODE_2',
    displayName: 'Worked Examples Video',
    shortLabel: 'Worked Examples',
    pedagogicalObjective: 'Demonstrate how to solve a problem, explain reasoning behind each step, compare methods, and identify common mistakes.',
    defaultQuestionCount: 10,
    legacyAlias: LEGACY_WORKED_EXAMPLES_MODE,
  },
  QUESTION_CHALLENGE_SHORT: {
    id: 'QUESTION_CHALLENGE_SHORT',
    code: 'MODE_3',
    displayName: 'Question Challenge Short',
    shortLabel: 'Challenge Short',
    pedagogicalObjective: 'Invite viewers to solve a problem independently, encourage retrieval practice, reveal answer and Telugu explanation.',
    defaultQuestionCount: 1,
  },
};

/**
 * Resolves any supported content mode string (canonical or legacy alias)
 * to its authoritative CanonicalContentMode.
 */
export function resolveCanonicalContentMode(mode: string): CanonicalContentMode {
  if (mode === LEGACY_WORKED_EXAMPLES_MODE || mode === 'WORKED_EXAMPLES') {
    return 'WORKED_EXAMPLES';
  }
  if (mode === 'TOPIC_INTRODUCTION') {
    return 'TOPIC_INTRODUCTION';
  }
  if (mode === 'QUESTION_CHALLENGE_SHORT') {
    return 'QUESTION_CHALLENGE_SHORT';
  }
  throw new Error(`Unrecognized content production mode: '${mode}'. Expected one of: ${SUPPORTED_CONTENT_MODES.join(', ')}`);
}

/**
 * Converts a canonical content mode to the legacy identifier if compatibility is requested.
 */
export function toLegacyContentMode(mode: CanonicalContentMode | string): string {
  if (mode === 'WORKED_EXAMPLES') {
    return LEGACY_WORKED_EXAMPLES_MODE;
  }
  return mode;
}

export function isCanonicalContentMode(val: unknown): val is CanonicalContentMode {
  return typeof val === 'string' && (CANONICAL_CONTENT_MODES as readonly string[]).includes(val);
}

export function isSupportedContentMode(val: unknown): val is SupportedContentMode {
  return typeof val === 'string' && (SUPPORTED_CONTENT_MODES as readonly string[]).includes(val);
}

// ============================================================================
// 2. FIVE PRESENTATION FORMATS (bp_cms_core_requirements1.md Section 3)
// ============================================================================

/**
 * Five canonical presentation formats orthogonal to content mode:
 * Text-based, Video, Audio, Image, Animation.
 */
export type PresentationFormat = 'TEXT' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'ANIMATION';

export const PRESENTATION_FORMATS: readonly PresentationFormat[] = [
  'TEXT',
  'VIDEO',
  'AUDIO',
  'IMAGE',
  'ANIMATION',
] as const;

export interface PresentationFormatMetadata {
  readonly id: PresentationFormat;
  readonly displayName: string;
  readonly description: string;
}

export const PRESENTATION_FORMAT_METADATA: Record<PresentationFormat, PresentationFormatMetadata> = {
  TEXT: {
    id: 'TEXT',
    displayName: 'Text-based',
    description: 'Short calculation with structured explanation, table, or written breakdown.',
  },
  VIDEO: {
    id: 'VIDEO',
    displayName: 'Video',
    description: 'Produced spoken video delivery with teleprompter, visual graphics, or live presenter.',
  },
  AUDIO: {
    id: 'AUDIO',
    displayName: 'Audio',
    description: 'Spoken question or narrative lesson followed by thoughtful pause and spoken explanation.',
  },
  IMAGE: {
    id: 'IMAGE',
    displayName: 'Image',
    description: 'Visual breakdown, infographic, diagram sequence, or illustrated step-by-step calculation.',
  },
  ANIMATION: {
    id: 'ANIMATION',
    displayName: 'Animation',
    description: 'Motion visual demonstration where movement materially improves mathematical understanding.',
  },
};

export function isPresentationFormat(val: unknown): val is PresentationFormat {
  return typeof val === 'string' && (PRESENTATION_FORMATS as readonly string[]).includes(val);
}

// ============================================================================
// 3. INITIAL EDITORIAL PILLARS A–F (bp_cms_core_requirements1.md Section 4)
// ============================================================================

export type EditorialPillar =
  | 'PILLAR_A' // Numerical foundations
  | 'PILLAR_B' // Logical thinking
  | 'PILLAR_C' // Everyday money and mathematics
  | 'PILLAR_D' // Practical understanding
  | 'PILLAR_E' // Data and smarter decisions
  | 'PILLAR_F'; // Learning and thinking strategies

export const EDITORIAL_PILLARS: readonly EditorialPillar[] = [
  'PILLAR_A',
  'PILLAR_B',
  'PILLAR_C',
  'PILLAR_D',
  'PILLAR_E',
  'PILLAR_F',
] as const;

export interface EditorialPillarMetadata {
  readonly id: EditorialPillar;
  readonly code: string;
  readonly title: string;
  readonly topicsSummary: string;
}

export const EDITORIAL_PILLAR_METADATA: Record<EditorialPillar, EditorialPillarMetadata> = {
  PILLAR_A: {
    id: 'PILLAR_A',
    code: 'PILLAR_A',
    title: 'Numerical Foundations',
    topicsSummary: 'Arithmetic, fractions, decimals, percentages, ratios, averages, estimation, profit and loss, interest, time, speed, measurement.',
  },
  PILLAR_B: {
    id: 'PILLAR_B',
    code: 'PILLAR_B',
    title: 'Logical Thinking',
    topicsSummary: 'Patterns, sequences, classification, relationships, deductions, observation, analytical reasoning, problem-solving methods.',
  },
  PILLAR_C: {
    id: 'PILLAR_C',
    code: 'PILLAR_C',
    title: 'Everyday Money and Mathematics',
    topicsSummary: 'Discounts, price comparisons, bills, change, budgets, quantities, unit prices, understanding numerical claims.',
  },
  PILLAR_D: {
    id: 'PILLAR_D',
    code: 'PILLAR_D',
    title: 'Practical Understanding',
    topicsSummary: 'Time calculations, schedules, measurements, instructions, tables, charts, interpreting everyday information.',
  },
  PILLAR_E: {
    id: 'PILLAR_E',
    code: 'PILLAR_E',
    title: 'Data and Smarter Decisions',
    topicsSummary: 'Comparing alternatives, distinguishing facts from assumptions, checking conclusions, recognizing misleading percentages, evaluating evidence.',
  },
  PILLAR_F: {
    id: 'PILLAR_F',
    code: 'PILLAR_F',
    title: 'Learning and Thinking Strategies',
    topicsSummary: 'Mental shortcuts, estimation before calculation, checking answers, breaking down problems, recognizing common errors, choosing solution methods.',
  },
};

export function isEditorialPillar(val: unknown): val is EditorialPillar {
  return typeof val === 'string' && (EDITORIAL_PILLARS as readonly string[]).includes(val);
}

// ============================================================================
// 4. SEVEN AUDIENCE CONTEXTS (bp_cms_core_requirements1.md Section 5)
// ============================================================================

export type AudienceContext =
  | 'CHILDREN'
  | 'STUDENTS'
  | 'COMPETITIVE_EXAM'
  | 'WORKING_ADULTS'
  | 'HOUSEHOLDS'
  | 'BUSINESS_OPERATORS'
  | 'OLDER_LEARNERS';

export const AUDIENCE_CONTEXTS: readonly AudienceContext[] = [
  'CHILDREN',
  'STUDENTS',
  'COMPETITIVE_EXAM',
  'WORKING_ADULTS',
  'HOUSEHOLDS',
  'BUSINESS_OPERATORS',
  'OLDER_LEARNERS',
] as const;

export interface AudienceContextMetadata {
  readonly id: AudienceContext;
  readonly label: string;
  readonly description: string;
}

export const AUDIENCE_CONTEXT_METADATA: Record<AudienceContext, AudienceContextMetadata> = {
  CHILDREN: {
    id: 'CHILDREN',
    label: 'Children',
    description: 'Young learners requiring visual intuition, playful scenarios, and foundational numeracy.',
  },
  STUDENTS: {
    id: 'STUDENTS',
    label: 'School and College Students',
    description: 'Academic syllabus support, structured concepts, homework shortcuts, and conceptual clarity.',
  },
  COMPETITIVE_EXAM: {
    id: 'COMPETITIVE_EXAM',
    label: 'Competitive-Exam Learners',
    description: 'APPSC, TSPSC, SSC, Banking aspirants requiring high-speed calculation, accuracy, and syllabus edge cases.',
  },
  WORKING_ADULTS: {
    id: 'WORKING_ADULTS',
    label: 'Working Adults',
    description: 'Professionals needing rapid mental estimation, data comprehension, and decision evaluation.',
  },
  HOUSEHOLDS: {
    id: 'HOUSEHOLDS',
    label: 'Parents and Households',
    description: 'Everyday budgeting, bill calculations, household expenses, and grocery unit pricing.',
  },
  BUSINESS_OPERATORS: {
    id: 'BUSINESS_OPERATORS',
    label: 'Shopkeepers and Small-Business Operators',
    description: 'Cash-flow estimation, margin calculations, wholesale discounts, and inventory counting.',
  },
  OLDER_LEARNERS: {
    id: 'OLDER_LEARNERS',
    label: 'Older Learners',
    description: 'Lifelong learners seeking everyday practical numeracy, mental sharpness, and health/finance data clarity.',
  },
};

export function isAudienceContext(val: unknown): val is AudienceContext {
  return typeof val === 'string' && (AUDIENCE_CONTEXTS as readonly string[]).includes(val);
}

// ============================================================================
// 5. FOUR CANONICAL SKILL LEVELS (bp_cms_core_requirements1.md Section 5)
// ============================================================================

export type SkillLevel =
  | 'FOUNDATION'
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED';

export const SKILL_LEVELS: readonly SkillLevel[] = [
  'FOUNDATION',
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
] as const;

export interface SkillLevelMetadata {
  readonly id: SkillLevel;
  readonly label: string;
  readonly rank: number;
  readonly description: string;
}

export const SKILL_LEVEL_METADATA: Record<SkillLevel, SkillLevelMetadata> = {
  FOUNDATION: {
    id: 'FOUNDATION',
    label: 'Foundation',
    rank: 1,
    description: 'Basic number sense, counting, intuitive comparison without formal formulas.',
  },
  BEGINNER: {
    id: 'BEGINNER',
    label: 'Beginner',
    rank: 2,
    description: 'Simple one-step calculations, core definitions, and straightforward applications.',
  },
  INTERMEDIATE: {
    id: 'INTERMEDIATE',
    label: 'Intermediate',
    rank: 3,
    description: 'Two-step problem solving, percentages, unit rates, and practical comparisons.',
  },
  ADVANCED: {
    id: 'ADVANCED',
    label: 'Advanced',
    rank: 4,
    description: 'Multi-step reasoning, optimization, compound estimation, and abstract pattern deduction.',
  },
};

export function isSkillLevel(val: unknown): val is SkillLevel {
  return typeof val === 'string' && (SKILL_LEVELS as readonly string[]).includes(val);
}

/**
 * Maps legacy 3-tier DifficultyLevel (EASY, MEDIUM, HARD) to the 4-tier SkillLevel standard.
 */
export function mapDifficultyToSkillLevel(difficulty?: DifficultyLevel | string): SkillLevel {
  if (!difficulty) return 'BEGINNER';
  const norm = String(difficulty).toUpperCase().trim();
  if (norm === 'FOUNDATION') return 'FOUNDATION';
  if (norm === 'EASY' || norm === 'BEGINNER') return 'BEGINNER';
  if (norm === 'MEDIUM' || norm === 'INTERMEDIATE') return 'INTERMEDIATE';
  if (norm === 'HARD' || norm === 'ADVANCED' || norm === 'EXPERT' || norm === 'MASTER') return 'ADVANCED';
  return 'BEGINNER';
}
