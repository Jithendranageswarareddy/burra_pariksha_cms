/**
 * BURRA PARIKSHA CMS — User & Assignment Types
 * Team member identities, workloads, and task assignments
 */

import {
  AssignmentEntityType,
  AssignmentRole,
  AssignmentStatus,
  AssignmentTaskType,
  PriorityLevel,
  UserRole,
} from '../constants';

export interface User {
  id: string; // e.g. usr_uuid or USR-001
  name: string;
  email: string;
  role: UserRole | string;
  roles?: (UserRole | string)[];
  avatarUrl?: string;
  isActive: boolean;
  firebaseUid?: string;
  password_hash?: string;
  sessionVersion?: number;
  dataScope?: string;
  last_login_at?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string; // e.g. asn_uuid or BP-ASN-000001
  contentId?: string;
  contentMasterId?: string;
  entityType: AssignmentEntityType | string;
  entityId: string;
  videoId?: string;
  taskType: AssignmentTaskType | string;
  assignmentRole?: AssignmentRole | string;
  platform?: 'youtube' | 'instagram' | 'facebook';
  assigneeId: string;
  assigneeName: string;
  status: AssignmentStatus | string;
  priority: PriorityLevel;
  assignedAt?: string;
  dueDate?: string;
  dueAt?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserWorkload {
  user: User;
  totalActiveAssignments: number;
  inProgressCount?: number;
  overdueCount?: number;
  completedCount?: number;
  urgentAssignments: number;
  highPriorityAssignments: number;
  normalPriorityAssignments: number;
  lowPriorityAssignments: number;
  overdueAssignments: number;
  dueTodayAssignments: number;
  dueTomorrowAssignments: number;
  blockedAssignments: number;
  completedAssignments: number;
  workloadScore: number;
  activeAssignments: Assignment[];
}

export interface TeamWorkloadSummary {
  users: UserWorkload[];
  workloads: UserWorkload[];
  totalMembers: number;
  totalActiveTasks: number;
  totalOverdueTasks: number;
  totalBlockedTasks: number;
  totalDueTodayTasks: number;
  highestWorkloadUser?: { id: string; name: string; score: number; taskCount: number };
  generatedAt: string;
}

export interface UnassignedWorkItem {
  id: string;
  entityType: AssignmentEntityType | string;
  entityId: string;
  title: string;
  currentStage: string;
  currentStatus?: string;
  priority: PriorityLevel;
  ageDays: number;
  recommendedRole: AssignmentTaskType | string;
  recommendedTaskType: AssignmentTaskType | string;
  reason?: string;
  createdAt: string;
  notes?: string;
}

export interface MyWorkSummary {
  user: User;
  overdue: Assignment[];
  dueToday: Assignment[];
  highPriority: Assignment[];
  inProgress: Assignment[];
  blocked: Assignment[];
  upcoming: Assignment[];
  recentlyCompleted: Assignment[];
  completedAssignments: Assignment[];
  waitingForMe?: Assignment[];
  waitingForOtherRole?: Assignment[];
  teamOverview?: any;
  activeAssignments?: Assignment[];
  activeCount?: number;
  overdueCount?: number;
  dueTodayCount?: number;
  completedRecentCount?: number;
  overdueAssignments?: Assignment[];
  dueTodayAssignments?: Assignment[];
  metrics: {
    totalActive: number;
    overdueCount: number;
    dueTodayCount: number;
    blockedCount: number;
    completedCount: number;
    waitingForMeCount?: number;
    waitingForOtherRoleCount?: number;
  };
}
