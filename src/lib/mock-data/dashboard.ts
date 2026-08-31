/**
 * BURRA PARIKSHA CMS - Dashboard Mock Data
 * High-level production metrics, today's schedule, pipeline stats, and alerts.
 */

import { DashboardMetrics } from '../../types';

export const MOCK_DASHBOARD_METRICS: DashboardMetrics = {
  questions: {
    generated: 24,
    editing: 5,
    approved: 18,
    rejected: 2,
    total: 49,
  },
  videos: {
    queued: 7,
    scriptRequired: 3,
    scriptReady: 4,
    recording: 3,
    recorded: 2,
    editing: 4,
    edited: 3,
    finalReview: 2,
    readyToUpload: 2,
    uploaded: 15,
    onHold: 1,
    cancelled: 0,
    totalActive: 28,
  },
  publishing: {
    notStarted: 10,
    ready: 2,
    published: 15,
    incomplete: 3,
    total: 30,
  },
  questionsGenerated: 24,
  questionsApproved: 18,
  questionsQueued: 7,
  videosInRecording: 3,
  videosInEditing: 4,
  finalReviewCount: 2,
  readyToUploadCount: 2,
  uploadedCount: 15,
};

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  taskType: 'RECORDING' | 'EDIT_REVIEW' | 'SCRIPT_APPROVAL' | 'MANUAL_PUBLISH';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueTime: string;
  relatedEntityId: string;
  actionUrl: string;
  completed: boolean;
}

export const MOCK_TODAYS_WORK: TaskItem[] = [
  {
    id: 'TASK-01',
    title: 'Film Studio Session: Dishonest Merchant False Weights (BP-VID-102)',
    category: 'Quantitative Aptitude',
    taskType: 'RECORDING',
    priority: 'HIGH',
    dueTime: '11:30 AM',
    relatedEntityId: 'BP-VID-102',
    actionUrl: '/production',
    completed: false,
  },
  {
    id: 'TASK-02',
    title: 'Review Motion Graphics Cut: Clock Reflex Angle 318° (BP-VID-103)',
    category: 'Logical Reasoning',
    taskType: 'EDIT_REVIEW',
    priority: 'URGENT',
    dueTime: '02:00 PM',
    relatedEntityId: 'BP-VID-103',
    actionUrl: '/production',
    completed: false,
  },
  {
    id: 'TASK-03',
    title: 'Manual Upload to Instagram & Facebook: Seating Shortcut (BP-VID-104)',
    category: 'Quantitative Aptitude',
    taskType: 'MANUAL_PUBLISH',
    priority: 'HIGH',
    dueTime: '05:30 PM',
    relatedEntityId: 'PUB-104',
    actionUrl: '/publishing',
    completed: false,
  },
  {
    id: 'TASK-04',
    title: 'Review & Approve AI Draft: Pipes & Leakage Problem (BP-Q-1006)',
    category: 'Quantitative Aptitude',
    taskType: 'SCRIPT_APPROVAL',
    priority: 'MEDIUM',
    dueTime: '06:45 PM',
    relatedEntityId: 'BP-Q-1006',
    actionUrl: '/questions/BP-Q-1006',
    completed: false,
  },
];

export interface ActivityLogItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'QUESTION' | 'PRODUCTION' | 'PUBLISHING' | 'SYSTEM';
}

export const MOCK_RECENT_ACTIVITY: ActivityLogItem[] = [
  {
    id: 'ACT-01',
    user: 'Jithendra (Admin)',
    action: 'Approved & queued question',
    target: 'BP-Q-1004 (Circular Table Seating)',
    timestamp: '25 mins ago',
    type: 'QUESTION',
  },
  {
    id: 'ACT-02',
    user: 'Video Lab Team',
    action: 'Uploaded 4K Final Render',
    target: 'BP-VID-104 (Master File)',
    timestamp: '1 hour ago',
    type: 'PRODUCTION',
  },
  {
    id: 'ACT-03',
    user: 'Jithendra (Admin)',
    action: 'Marked Published on YouTube Shorts',
    target: 'BP-VID-105 (Pie Chart Shortcut)',
    timestamp: '3 hours ago',
    type: 'PUBLISHING',
  },
  {
    id: 'ACT-04',
    user: 'System (AI Studio Engine)',
    action: 'Generated draft questions batch',
    target: 'Quantitative Aptitude (Pipes & Cisterns)',
    timestamp: 'Yesterday at 5:20 PM',
    type: 'QUESTION',
  },
];

export interface DelayedContentAlert {
  id: string;
  title: string;
  stage: string;
  daysInStage: number;
  reason: string;
  videoId: string;
  severity: 'WARNING' | 'CRITICAL';
}

export const MOCK_DELAYED_CONTENT: DelayedContentAlert[] = [
  {
    id: 'DELAY-01',
    title: 'Family Tree Blood Relations Coded Trick',
    stage: 'SCRIPT_REQUIRED',
    daysInStage: 4,
    reason: 'Waiting for custom hook rewrite to improve first 3-sec retention',
    videoId: 'BP-VID-107',
    severity: 'WARNING',
  },
  {
    id: 'DELAY-02',
    title: 'GMAT Critical Reasoning: Weakening Arguments in 60s',
    stage: 'FINAL_REVIEW',
    daysInStage: 3,
    reason: 'Audio clipping on CTA outro voiceover — needs re-render',
    videoId: 'BP-VID-108',
    severity: 'CRITICAL',
  },
];
