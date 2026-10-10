/**
 * BURRA PARIKSHA CMS - Centralized Constants & Configurations
 * Phase 1: Application Foundation
 */

import {
  DifficultyLevel,
  PriorityLevel,
  QuestionStatus,
  QuestionStyle,
  SocialPublishStatus,
  VideoProductionStatus,
} from '../types';

export const APP_CONFIG = {
  name: 'BURRA PARIKSHA CMS',
  shortName: 'Burra Pariksha',
  tagline: 'Content Database & Video Production Workflow System',
  version: '0.1.0-alpha',
  phase: 'Content Operations System',
  adminUser: {
    name: 'System Admin',
    email: 'jithendrareddy629@gmail.com',
    role: 'ADMIN',
  },
} as const;

export const QUESTION_STATUS_CONFIG: Record<
  QuestionStatus,
  { label: string; bg: string; text: string; border: string; description: string }
> = {
  [QuestionStatus.DRAFT]: {
    label: 'Draft',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    description: 'Initial draft, undergoing composition or revision',
  },
  [QuestionStatus.GENERATED]: {
    label: 'Generated',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    description: 'AI-generated question awaiting human review',
  },
  [QuestionStatus.EDITING]: {
    label: 'Editing',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    description: 'Under active human editorial enhancement',
  },
  [QuestionStatus.APPROVED]: {
    label: 'Approved',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    description: 'Verified for accuracy and pedagogy',
  },
  [QuestionStatus.REJECTED]: {
    label: 'Rejected',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    description: 'Does not meet channel quality standards',
  },
  [QuestionStatus.ARCHIVED]: {
    label: 'Archived',
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-700',
    description: 'Archived and removed from active rotation',
  },
};

export const VIDEO_STATUS_CONFIG: Record<
  VideoProductionStatus,
  { label: string; bg: string; text: string; border: string; step: number; isFinal?: boolean }
> = {
  [VideoProductionStatus.NOT_STARTED]: {
    label: 'Not Started',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    step: 0,
  },
  [VideoProductionStatus.QUEUED]: {
    label: 'Queued',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    step: 1,
  },
  [VideoProductionStatus.SCRIPT_REQUIRED]: {
    label: 'Script Required',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    step: 2,
  },
  [VideoProductionStatus.SCRIPT_READY]: {
    label: 'Script Ready',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    step: 3,
  },
  [VideoProductionStatus.RECORDING]: {
    label: 'Recording',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    step: 4,
  },
  [VideoProductionStatus.RECORDED]: {
    label: 'Recorded',
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    step: 5,
  },
  [VideoProductionStatus.EDITING]: {
    label: 'Editing',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    step: 6,
  },
  [VideoProductionStatus.EDITED]: {
    label: 'Edited',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    step: 7,
  },
  [VideoProductionStatus.FINAL_REVIEW]: {
    label: 'Final Review',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    step: 8,
  },
  [VideoProductionStatus.READY_TO_UPLOAD]: {
    label: 'Ready to Upload',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    step: 9,
  },
  [VideoProductionStatus.UPLOADED]: {
    label: 'Uploaded',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    step: 10,
    isFinal: true,
  },
  [VideoProductionStatus.ON_HOLD]: {
    label: 'On Hold',
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    step: -1,
  },
  [VideoProductionStatus.CANCELLED]: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    step: -2,
  },
};

export const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { label: string; bg: string; text: string; dot: string }
> = {
  [DifficultyLevel.EASY]: {
    label: 'Easy',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  [DifficultyLevel.MEDIUM]: {
    label: 'Medium',
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  [DifficultyLevel.HARD]: {
    label: 'Hard',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
};

export const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; bg: string; text: string }
> = {
  [PriorityLevel.LOW]: { label: 'Low', bg: 'bg-slate-100', text: 'text-slate-600' },
  [PriorityLevel.NORMAL]: { label: 'Normal', bg: 'bg-blue-50', text: 'text-blue-700' },
  [PriorityLevel.MEDIUM]: { label: 'Medium', bg: 'bg-blue-50', text: 'text-blue-700' },
  [PriorityLevel.HIGH]: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700' },
  [PriorityLevel.URGENT]: { label: 'Urgent', bg: 'bg-red-50', text: 'text-red-700 font-semibold' },
};

export const SOCIAL_STATUS_CONFIG: Record<
  SocialPublishStatus,
  { label: string; bg: string; text: string }
> = {
  [SocialPublishStatus.NOT_STARTED]: { label: 'Pending', bg: 'bg-slate-100', text: 'text-slate-600' },
  [SocialPublishStatus.DRAFT]: { label: 'Draft', bg: 'bg-amber-50', text: 'text-amber-700' },
  [SocialPublishStatus.SCHEDULED]: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-blue-700' },
  [SocialPublishStatus.UPLOADED]: { label: 'Uploaded', bg: 'bg-amber-50', text: 'text-amber-700' },
  [SocialPublishStatus.PUBLISHED]: { label: 'Published', bg: 'bg-emerald-50', text: 'text-emerald-700 font-medium' },
  [SocialPublishStatus.FAILED]: { label: 'Failed', bg: 'bg-rose-50', text: 'text-rose-700' },
};

export const PIPELINE_STEPS = [
  VideoProductionStatus.QUEUED,
  VideoProductionStatus.SCRIPT_READY,
  VideoProductionStatus.RECORDING,
  VideoProductionStatus.EDITING,
  VideoProductionStatus.FINAL_REVIEW,
  VideoProductionStatus.READY_TO_UPLOAD,
  VideoProductionStatus.UPLOADED,
] as const;

export const VALID_VIDEO_TRANSITIONS: Record<VideoProductionStatus, VideoProductionStatus[]> = {
  [VideoProductionStatus.NOT_STARTED]: [VideoProductionStatus.QUEUED],
  [VideoProductionStatus.QUEUED]: [
    VideoProductionStatus.SCRIPT_REQUIRED,
    VideoProductionStatus.SCRIPT_READY,
    VideoProductionStatus.RECORDED,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.SCRIPT_REQUIRED]: [
    VideoProductionStatus.SCRIPT_READY,
    VideoProductionStatus.RECORDED,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.SCRIPT_READY]: [
    VideoProductionStatus.RECORDING,
    VideoProductionStatus.RECORDED,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.RECORDING]: [
    VideoProductionStatus.RECORDED,
    VideoProductionStatus.EDITING,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.RECORDED]: [
    VideoProductionStatus.EDITING,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.EDITING]: [
    VideoProductionStatus.EDITED,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.EDITED]: [
    VideoProductionStatus.FINAL_REVIEW,
    VideoProductionStatus.EDITING,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.FINAL_REVIEW]: [
    VideoProductionStatus.READY_TO_UPLOAD,
    VideoProductionStatus.EDITING,
    VideoProductionStatus.RECORDING,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.READY_TO_UPLOAD]: [
    VideoProductionStatus.UPLOADED,
    VideoProductionStatus.FINAL_REVIEW,
    VideoProductionStatus.ON_HOLD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.UPLOADED]: [], // Terminal state
  [VideoProductionStatus.ON_HOLD]: [
    VideoProductionStatus.QUEUED,
    VideoProductionStatus.SCRIPT_REQUIRED,
    VideoProductionStatus.SCRIPT_READY,
    VideoProductionStatus.RECORDING,
    VideoProductionStatus.RECORDED,
    VideoProductionStatus.EDITING,
    VideoProductionStatus.EDITED,
    VideoProductionStatus.FINAL_REVIEW,
    VideoProductionStatus.READY_TO_UPLOAD,
    VideoProductionStatus.CANCELLED,
  ],
  [VideoProductionStatus.CANCELLED]: [], // Terminal state
};

export const QUESTION_STYLES = Object.values(QuestionStyle);

// Phase 7: Workflow Stale Content Thresholds (in days)
export const AGING_THRESHOLDS = {
  FRESH_MAX_DAYS: 2,
  WAITING_MAX_DAYS: 5,
  STALE_MIN_DAYS: 5,
} as const;

// Phase 7: Bottleneck accumulation threshold
export const BOTTLENECK_CONFIG = {
  STAGE_ACCUMULATION_THRESHOLD: 4, // 4+ items in a single non-terminal stage indicates a bottleneck
} as const;

// Phase 7: Daily 10-Step Workflow Guide
export const DAILY_WORKFLOW_STEPS = [
  { step: 1, title: 'Generate Questions', description: 'Draft questions using Gemini AI Studio', actionUrl: '/generate', category: 'QUESTION' },
  { step: 2, title: 'Review & Edit', description: 'Refine pedagogy, options, and explanations', actionUrl: '/questions?status=GENERATED', category: 'QUESTION' },
  { step: 3, title: 'Approve Questions', description: 'Mark verified questions as Approved', actionUrl: '/questions?status=EDITING', category: 'QUESTION' },
  { step: 4, title: 'Queue for Video', description: 'Add approved questions to video queue', actionUrl: '/queue', category: 'VIDEO' },
  { step: 5, title: 'Prepare Telugu Script', description: 'Refine hook, timing, and speed trick', actionUrl: '/production?status=SCRIPT_REQUIRED', category: 'VIDEO' },
  { step: 6, title: 'Record Video Manually', description: 'Film short in studio using Teleprompter', actionUrl: '/production?status=RECORDING', category: 'VIDEO' },
  { step: 7, title: 'Edit Video Manually', description: 'Edit 9:16 vertical render and captions', actionUrl: '/production?status=EDITING', category: 'VIDEO' },
  { step: 8, title: 'Final QC Review', description: 'Approve final cut, thumbnail & pinned comment', actionUrl: '/production?status=FINAL_REVIEW', category: 'VIDEO' },
  { step: 9, title: 'Upload Manually', description: 'Upload to YouTube Shorts, Reels, Facebook', actionUrl: '/publishing', category: 'PUBLISHING' },
  { step: 10, title: 'Record Publishing URLs', description: 'Save live URLs and complete CMS distribution', actionUrl: '/publishing', category: 'PUBLISHING' },
] as const;
