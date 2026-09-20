import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Assignment,
  AssignmentStatus,
  MyWorkSummary,
  PriorityLevel,
  User,
  UserRole,
} from '../types';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { AssignmentStatusBadge, AssignmentPriorityBadge } from '../components/assignments/AssignmentBadge';
import { AssignmentModal } from '../components/assignments/AssignmentModal';
import {
  resolveCanonicalRole,
  getRoleDisplayName,
  CANONICAL_ROLE_DESCRIPTORS,
  CanonicalRole,
} from '../config/roles';
import {
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Play,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle,
  Search,
  Layers,
  PauseCircle,
  X,
  Sparkles,
  Flame,
  ArrowUpDown,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  FileText,
  Video,
  Image,
  Send,
  CalendarDays,
  Check,
} from 'lucide-react';

type WorkBucket = 'ALL' | 'NEEDS_ATTENTION' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
type SortOption = 'URGENCY' | 'PRIORITY' | 'DUE_DATE' | 'RECENT';

export const MyWorkPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>('USR-001');
  const [myWork, setMyWork] = useState<MyWorkSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Status Tab / Bucket
  const [selectedBucket, setSelectedBucket] = useState<WorkBucket>('ALL');

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('URGENCY');

  // Modal State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Quick Action State Dialogs
  const [blockTargetId, setBlockTargetId] = useState<string | null>(null);
  const [blockReasonInput, setBlockReasonInput] = useState('');
  const [completeTargetId, setCompleteTargetId] = useState<string | null>(null);
  const [completeNotesInput, setCompleteNotesInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const isManagerOrAdmin = authUser
    ? [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(authUser.role as UserRole) ||
      (authUser.role as string) === 'CONTENT_LEAD' ||
      (authUser.role as string) === 'ADMIN'
    : true;

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (authUser?.id) {
      setActiveUserId(authUser.id);
    }
  }, [authUser]);

  useEffect(() => {
    if (activeUserId) {
      loadMyWork(activeUserId);
    }
  }, [activeUserId]);

  const loadUsers = async () => {
    try {
      const data = await apiClient.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users', err);
    }
  };

  const loadMyWork = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getMyWork(userId);
      setMyWork(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load personal work queue');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActionLoading(true);
    setError(null);
    try {
      await apiClient.startAssignment(id);
      setActionSuccess(`Task ${id} moved to IN PROGRESS`);
      setTimeout(() => setActionSuccess(null), 3500);
      await loadMyWork(activeUserId);
    } catch (err: any) {
      setError(err?.message || 'Failed to start task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenBlockDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBlockTargetId(id);
    setBlockReasonInput('');
    setCompleteTargetId(null);
  };

  const handleConfirmBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTargetId) return;
    if (!blockReasonInput.trim()) {
      setError('Please provide a reason for blocking this task');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await apiClient.blockAssignment(blockTargetId, blockReasonInput.trim());
      setActionSuccess(`Task ${blockTargetId} marked as BLOCKED`);
      setTimeout(() => setActionSuccess(null), 3500);
      setBlockTargetId(null);
      setBlockReasonInput('');
      await loadMyWork(activeUserId);
    } catch (err: any) {
      setError(err?.message || 'Failed to block task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCompleteDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompleteTargetId(id);
    setCompleteNotesInput('');
    setBlockTargetId(null);
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTargetId) return;

    setActionLoading(true);
    setError(null);
    try {
      await apiClient.completeAssignment(completeTargetId, {
        notes: completeNotesInput.trim() || undefined,
      });
      setActionSuccess(`Task ${completeTargetId} marked as COMPLETED`);
      setTimeout(() => setActionSuccess(null), 3500);
      setCompleteTargetId(null);
      setCompleteNotesInput('');
      await loadMyWork(activeUserId);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete task');
    } finally {
      setActionLoading(false);
    }
  };

  const getEntityUrl = (entityType: string, entityId: string): string => {
    switch (entityType) {
      case 'QUESTION':
        return `/questions/${encodeURIComponent(entityId)}`;
      case 'VIDEO':
      case 'SCRIPT':
      case 'THUMBNAIL':
        return `/videos/${encodeURIComponent(entityId)}`;
      case 'PUBLISHING':
        return `/publishing?videoId=${encodeURIComponent(entityId)}`;
      case 'CONTENT_PLAN':
      case 'CONTENT_BATCH':
        return `/planning`;
      default:
        return `/dashboard`;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'QUESTION':
        return <HelpCircle className="w-3.5 h-3.5 text-purple-500" />;
      case 'SCRIPT':
        return <FileText className="w-3.5 h-3.5 text-emerald-500" />;
      case 'VIDEO':
        return <Video className="w-3.5 h-3.5 text-blue-500" />;
      case 'THUMBNAIL':
        return <Image className="w-3.5 h-3.5 text-pink-500" />;
      case 'PUBLISHING':
        return <Send className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const formatTaskType = (taskType: string) => {
    if (!taskType) return 'Assignment';
    return taskType
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const isOverdue = (task: Assignment): boolean => {
    if (!task.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today && task.status !== AssignmentStatus.COMPLETED && task.status !== AssignmentStatus.CANCELLED;
  };

  const isDueToday = (task: Assignment): boolean => {
    if (!task.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate === today && task.status !== AssignmentStatus.COMPLETED && task.status !== AssignmentStatus.CANCELLED;
  };

  // Raw active and completed assignments
  const activeTasks = myWork?.activeAssignments || [];
  const completedTasks = myWork?.completedAssignments || [];

  // Categorized counts for summary metrics
  const overdueCount = activeTasks.filter((t) => isOverdue(t)).length;
  const dueTodayCount = activeTasks.filter((t) => isDueToday(t)).length;
  const urgentCount = activeTasks.filter((t) => t.priority === PriorityLevel.URGENT || t.priority === PriorityLevel.HIGH).length;
  const needsAttentionTasks = activeTasks.filter((t) => isOverdue(t) || isDueToday(t) || t.priority === PriorityLevel.URGENT);
  const inProgressTasks = activeTasks.filter((t) => t.status === AssignmentStatus.IN_PROGRESS);
  const blockedTasks = activeTasks.filter((t) => t.status === AssignmentStatus.BLOCKED);

  // Determine current active user details & persona
  const viewingUser = users.find((u) => u.id === activeUserId) || myWork?.user;
  const canonicalRole = resolveCanonicalRole(viewingUser?.role || authUser?.role);
  const roleDescriptor = CANONICAL_ROLE_DESCRIPTORS[canonicalRole];
  const roleDisplayName = getRoleDisplayName(viewingUser?.role || authUser?.role);

  // Recommended Next Task: Pick highest priority active task (in progress first, then overdue/urgent assigned)
  const recommendedTask = useMemo(() => {
    if (inProgressTasks.length > 0) {
      // Find highest priority in-progress task
      const urgentInProg = inProgressTasks.find((t) => t.priority === PriorityLevel.URGENT);
      const highInProg = inProgressTasks.find((t) => t.priority === PriorityLevel.HIGH);
      return urgentInProg || highInProg || inProgressTasks[0];
    }
    if (needsAttentionTasks.length > 0) {
      const urgentNeeds = needsAttentionTasks.find((t) => t.priority === PriorityLevel.URGENT);
      return urgentNeeds || needsAttentionTasks[0];
    }
    const assignedTasks = activeTasks.filter((t) => t.status === AssignmentStatus.ASSIGNED);
    if (assignedTasks.length > 0) {
      return assignedTasks[0];
    }
    return null;
  }, [inProgressTasks, needsAttentionTasks, activeTasks]);

  // Determine list based on selected bucket
  const baseBucketTasks = useMemo(() => {
    switch (selectedBucket) {
      case 'ALL':
        return activeTasks;
      case 'NEEDS_ATTENTION':
        return needsAttentionTasks;
      case 'IN_PROGRESS':
        return inProgressTasks;
      case 'BLOCKED':
        return blockedTasks;
      case 'COMPLETED':
        return completedTasks;
      default:
        return activeTasks;
    }
  }, [selectedBucket, activeTasks, needsAttentionTasks, inProgressTasks, blockedTasks, completedTasks]);

  // Filter & Sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let result = baseBucketTasks.filter((t) => {
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (entityFilter !== 'ALL' && t.entityType !== entityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (t.id || '').toLowerCase().includes(q);
        const matchEntity = (t.entityId || '').toLowerCase().includes(q);
        const matchTask = (t.taskType || '').toLowerCase().includes(q);
        const matchNotes = (t.notes || '').toLowerCase().includes(q);
        const matchRole = (t.assignmentRole || '').toLowerCase().includes(q);
        if (!matchId && !matchEntity && !matchTask && !matchNotes && !matchRole) return false;
      }
      return true;
    });

    // Apply Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'URGENCY') {
        // 1. Overdue first
        const aOverdue = isOverdue(a) ? 1 : 0;
        const bOverdue = isOverdue(b) ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;

        // 2. Priority
        const priorityWeight: Record<string, number> = {
          [PriorityLevel.URGENT]: 4,
          [PriorityLevel.HIGH]: 3,
          [PriorityLevel.MEDIUM]: 2,
          [PriorityLevel.NORMAL]: 2,
          [PriorityLevel.LOW]: 1,
        };
        const pA = priorityWeight[a.priority] || 2;
        const pB = priorityWeight[b.priority] || 2;
        if (pA !== pB) return pB - pA;

        // 3. Due Date
        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      }

      if (sortBy === 'PRIORITY') {
        const priorityWeight: Record<string, number> = {
          [PriorityLevel.URGENT]: 4,
          [PriorityLevel.HIGH]: 3,
          [PriorityLevel.MEDIUM]: 2,
          [PriorityLevel.NORMAL]: 2,
          [PriorityLevel.LOW]: 1,
        };
        const pA = priorityWeight[a.priority] || 2;
        const pB = priorityWeight[b.priority] || 2;
        return pB - pA;
      }

      if (sortBy === 'DUE_DATE') {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      }

      if (sortBy === 'RECENT') {
        const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return tB - tA;
      }

      return 0;
    });

    return result;
  }, [baseBucketTasks, priorityFilter, entityFilter, searchQuery, sortBy]);

  return (
    <div id="my-work-workbench" className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Page Header & Role Workbench Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Tasks</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${roleDescriptor?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
              {roleDisplayName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Personal task queue, priority assignments, and current workflow progress.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* User selector for Admin/Content Lead or Profile Badge for Specialist */}
          {isManagerOrAdmin ? (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Viewing member:</span>
              <select
                value={activeUserId}
                onChange={(e) => setActiveUserId(e.target.value)}
                className="text-xs font-semibold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({getRoleDisplayName(u.role)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-800">{viewingUser?.name || authUser?.name || 'My Queue'}</span>
              <span className="text-slate-400">({roleDisplayName})</span>
            </div>
          )}

          <button
            type="button"
            id="refresh-my-work-btn"
            onClick={() => loadMyWork(activeUserId)}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
            title="Refresh workbench"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Alerts & Toast Notifications */}
      {error && (
        <div id="my-work-error-banner" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div id="my-work-success-toast" className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* 1. Summary KPI Cards */}
      <div id="workbench-summary-cards" className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Needs Attention */}
        <button
          type="button"
          onClick={() => setSelectedBucket('NEEDS_ATTENTION')}
          className={`p-4 bg-white rounded-xl border text-left transition-all shadow-2xs relative overflow-hidden ${
            selectedBucket === 'NEEDS_ATTENTION'
              ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50/10'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Needs Attention</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{needsAttentionTasks.length}</p>
          <div className="flex items-center gap-2 mt-1 text-2xs font-medium text-slate-500">
            {overdueCount > 0 && <span className="text-rose-600 font-bold">{overdueCount} Overdue</span>}
            {dueTodayCount > 0 && <span className="text-amber-600">{dueTodayCount} Due Today</span>}
            {overdueCount === 0 && dueTodayCount === 0 && <span>High priority items</span>}
          </div>
        </button>

        {/* Card 2: In Progress */}
        <button
          type="button"
          onClick={() => setSelectedBucket('IN_PROGRESS')}
          className={`p-4 bg-white rounded-xl border text-left transition-all shadow-2xs relative overflow-hidden ${
            selectedBucket === 'IN_PROGRESS'
              ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/10'
              : 'border-slate-200 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">In Progress</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Play className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-indigo-900">{inProgressTasks.length}</p>
          <p className="text-2xs text-slate-500 mt-1">Active execution underway</p>
        </button>

        {/* Card 3: Blocked */}
        <button
          type="button"
          onClick={() => setSelectedBucket('BLOCKED')}
          className={`p-4 bg-white rounded-xl border text-left transition-all shadow-2xs relative overflow-hidden ${
            selectedBucket === 'BLOCKED'
              ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/10'
              : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Blocked</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <PauseCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-700">{blockedTasks.length}</p>
          <p className="text-2xs text-slate-500 mt-1">Awaiting dependencies</p>
        </button>

        {/* Card 4: Completed */}
        <button
          type="button"
          onClick={() => setSelectedBucket('COMPLETED')}
          className={`p-4 bg-white rounded-xl border text-left transition-all shadow-2xs relative overflow-hidden ${
            selectedBucket === 'COMPLETED'
              ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/10'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Completed</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">{completedTasks.length}</p>
          <p className="text-2xs text-slate-500 mt-1">Archived in last 7 days</p>
        </button>
      </div>

      {/* 2. "Work On Next" Recommendation Hero Card */}
      {recommendedTask && selectedBucket !== 'COMPLETED' && (
        <div id="recommended-next-task" className="p-4 sm:p-5 rounded-xl border border-indigo-200 bg-linear-to-r from-indigo-50/80 via-white to-slate-50/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-bold bg-indigo-600 text-white uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Recommended Next Step
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {recommendedTask.status === AssignmentStatus.IN_PROGRESS ? 'Resume In-Progress Work' : 'Ready to Start'}
                </span>
                <AssignmentPriorityBadge priority={recommendedTask.priority} size="sm" />
                {isOverdue(recommendedTask) && (
                  <span className="px-2 py-0.5 rounded text-2xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                    Overdue
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                <span>{formatTaskType(recommendedTask.taskType)}</span>
                <span className="text-slate-400 font-normal">•</span>
                <span className="text-sm font-semibold text-indigo-700">
                  {recommendedTask.entityType} {recommendedTask.entityId}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                {recommendedTask.dueDate && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Due: <strong>{recommendedTask.dueDate}</strong></span>
                  </span>
                )}
                {recommendedTask.notes && (
                  <span className="italic text-slate-500 truncate max-w-lg">
                    "{recommendedTask.notes}"
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {recommendedTask.status === AssignmentStatus.ASSIGNED ? (
                <button
                  type="button"
                  onClick={(e) => handleStartTask(recommendedTask.id, e)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Task Now</span>
                </button>
              ) : (
                <Link
                  to={getEntityUrl(recommendedTask.entityType, recommendedTask.entityId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              <Link
                to={getEntityUrl(recommendedTask.entityType, recommendedTask.entityId)}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <span>View Details</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Primary Work Queue Section */}
      <div className="space-y-4">
        {/* Bucket Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedBucket('ALL')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedBucket === 'ALL'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Active</span>
            <span className="px-1.5 py-0.2 rounded-full text-2xs bg-slate-100 text-slate-700 font-bold">
              {activeTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedBucket('NEEDS_ATTENTION')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedBucket === 'NEEDS_ATTENTION'
                ? 'border-amber-600 text-amber-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Needs Attention</span>
            {needsAttentionTasks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-amber-100 text-amber-800 font-bold">
                {needsAttentionTasks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedBucket('IN_PROGRESS')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedBucket === 'IN_PROGRESS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-indigo-500" />
            <span>In Progress</span>
            <span className="px-1.5 py-0.2 rounded-full text-2xs bg-indigo-50 text-indigo-700 font-bold">
              {inProgressTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedBucket('BLOCKED')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedBucket === 'BLOCKED'
                ? 'border-rose-600 text-rose-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <PauseCircle className="w-4 h-4 text-rose-500" />
            <span>Blocked</span>
            {blockedTasks.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-rose-100 text-rose-800 font-bold">
                {blockedTasks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedBucket('COMPLETED')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedBucket === 'COMPLETED'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Completed Archive</span>
            <span className="px-1.5 py-0.2 rounded-full text-2xs bg-emerald-50 text-emerald-700 font-bold">
              {completedTasks.length}
            </span>
          </button>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="search-my-work-input"
                placeholder="Search tasks, entity ID, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Priority Filter */}
              <select
                id="filter-priority-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value={PriorityLevel.URGENT}>Urgent Only</option>
                <option value={PriorityLevel.HIGH}>High Priority</option>
                <option value={PriorityLevel.NORMAL}>Normal</option>
                <option value={PriorityLevel.LOW}>Low</option>
              </select>

              {/* Entity Filter */}
              <select
                id="filter-entity-select"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Entity Types</option>
                <option value="QUESTION">Questions</option>
                <option value="VIDEO">Videos</option>
                <option value="SCRIPT">Scripts</option>
                <option value="THUMBNAIL">Thumbnails</option>
                <option value="PUBLISHING">Publishing</option>
                <option value="CONTENT_PLAN">Content Plans</option>
                <option value="CONTENT_BATCH">Content Batches</option>
              </select>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  id="sort-tasks-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs font-medium text-slate-700 bg-transparent focus:outline-hidden cursor-pointer"
                >
                  <option value="URGENCY">Sort: Urgency & Deadlines</option>
                  <option value="PRIORITY">Sort: Priority Level</option>
                  <option value="DUE_DATE">Sort: Due Date</option>
                  <option value="RECENT">Sort: Recently Updated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Action Confirmation Dialogs */}
          {blockTargetId && (
            <div id="inline-block-dialog" className="p-4 bg-rose-50 border-b border-rose-200">
              <form onSubmit={handleConfirmBlock} className="space-y-3 max-w-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <PauseCircle className="w-4 h-4 text-rose-600" />
                    Block Task: {blockTargetId}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBlockTargetId(null)}
                    className="text-xs text-rose-600 hover:text-rose-800"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={blockReasonInput}
                  onChange={(e) => setBlockReasonInput(e.target.value)}
                  placeholder="State the blocker reason (e.g. Awaiting video audio master, question edit required)..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-rose-300 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500 shadow-2xs"
                  required
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading || !blockReasonInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Saving...' : 'Confirm Block'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockTargetId(null)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {completeTargetId && (
            <div id="inline-complete-dialog" className="p-4 bg-emerald-50 border-b border-emerald-200">
              <form onSubmit={handleConfirmComplete} className="space-y-3 max-w-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Complete Task: {completeTargetId}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCompleteTargetId(null)}
                    className="text-xs text-emerald-600 hover:text-emerald-800"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={completeNotesInput}
                  onChange={(e) => setCompleteNotesInput(e.target.value)}
                  placeholder="Optional completion notes (e.g. Telugu script recorded, thumbnail version 2 uploaded)..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-emerald-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Completing...' : 'Confirm Completion'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompleteTargetId(null)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Task List / Rows */}
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs font-medium">Loading operational assignments...</p>
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2.5" />
              <p className="font-bold text-slate-800 text-sm">No tasks in this view</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || priorityFilter !== 'ALL' || entityFilter !== 'ALL'
                  ? 'Try clearing active filters to see other tasks in your queue.'
                  : 'You have no pending assignments in this bucket. Great job!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAndSortedTasks.map((task) => {
                const isAssigned = task.status === AssignmentStatus.ASSIGNED;
                const isInProgress = task.status === AssignmentStatus.IN_PROGRESS;
                const isBlocked = task.status === AssignmentStatus.BLOCKED;
                const isCompleted = task.status === AssignmentStatus.COMPLETED;
                const taskOverdue = isOverdue(task);
                const taskDueToday = isDueToday(task);

                return (
                  <div
                    key={task.id}
                    id={`task-row-${task.id}`}
                    onClick={() => {
                      setSelectedAssignment(task);
                      setIsModalOpen(true);
                    }}
                    className={`p-4 hover:bg-slate-50/90 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      taskOverdue ? 'bg-rose-50/30' : taskDueToday ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Left: Task Identity & Context */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 tracking-tight">
                          {formatTaskType(task.taskType)}
                        </span>
                        <AssignmentStatusBadge status={task.status} size="sm" />
                        <AssignmentPriorityBadge priority={task.priority} size="sm" />

                        {/* Entity Link Badge */}
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {getEntityIcon(task.entityType)}
                          <span>{task.entityType}</span>
                          <span className="text-slate-400">/</span>
                          <strong className="text-slate-900">{task.entityId}</strong>
                        </span>

                        {taskOverdue && (
                          <span className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Overdue
                          </span>
                        )}

                        {taskDueToday && !taskOverdue && (
                          <span className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Due Today
                          </span>
                        )}
                      </div>

                      {/* Secondary Meta details */}
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Due: <strong className={taskOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>{task.dueDate}</strong>
                            </span>
                          </span>
                        )}

                        {task.assignmentRole && (
                          <span>
                            Role: <strong className="text-slate-700">{getRoleDisplayName(task.assignmentRole)}</strong>
                          </span>
                        )}

                        {task.notes && (
                          <span className="text-slate-600 truncate max-w-md italic">
                            "{task.notes}"
                          </span>
                        )}
                      </div>

                      {/* Blocked reason banner if currently blocked */}
                      {isBlocked && task.notes && (
                        <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span><strong>Blocker:</strong> {task.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Operational Actions */}
                    <div
                      className="flex items-center gap-2 shrink-0 flex-wrap self-start md:self-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Deep Link to Entity Workspace */}
                      <Link
                        to={getEntityUrl(task.entityType, task.entityId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                        title="Open target workspace"
                      >
                        <span>Open Entity</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>

                      {/* 1. Start Action (for ASSIGNED) */}
                      {isAssigned && (
                        <button
                          type="button"
                          onClick={(e) => handleStartTask(task.id, e)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Task</span>
                        </button>
                      )}

                      {/* 2. Resume Action (for BLOCKED) */}
                      {isBlocked && (
                        <button
                          type="button"
                          onClick={(e) => handleStartTask(task.id, e)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </button>
                      )}

                      {/* 3. Block Action (for ASSIGNED or IN_PROGRESS) */}
                      {(isAssigned || isInProgress) && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenBlockDialog(task.id, e)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Flag task as blocked"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                          <span>Block</span>
                        </button>
                      )}

                      {/* 4. Complete Action (for non-completed) */}
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenCompleteDialog(task.id, e)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                          title="Mark task completed"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal for Detailed Inspection */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAssignment(null);
        }}
        onSuccess={() => loadMyWork(activeUserId)}
        entityType={selectedAssignment?.entityType || 'VIDEO'}
        entityId={selectedAssignment?.entityId || ''}
        existingAssignment={selectedAssignment}
      />
    </div>
  );
};

