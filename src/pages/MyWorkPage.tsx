import React, { useState, useEffect } from 'react';
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
  RotateCcw,
  Search,
  Layers,
  PauseCircle,
  X,
  Sparkles,
  Flame,
} from 'lucide-react';

export const MyWorkPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>('USR-001');
  const [myWork, setMyWork] = useState<MyWorkSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Status Tab / Bucket
  const [selectedBucket, setSelectedBucket] = useState<'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED'>('ALL');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

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
    ? [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(authUser.role as UserRole) || (authUser.role as string) === 'CONTENT_LEAD'
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
      setTimeout(() => setActionSuccess(null), 3000);
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
      setTimeout(() => setActionSuccess(null), 3000);
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
      setTimeout(() => setActionSuccess(null), 3000);
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
        return `/production/${encodeURIComponent(entityId)}`;
      case 'PUBLISHING':
        return `/publishing?videoId=${encodeURIComponent(entityId)}`;
      case 'CONTENT_PLAN':
      case 'CONTENT_BATCH':
        return `/planning`;
      default:
        return `/dashboard`;
    }
  };

  // Raw active and completed assignments
  const activeTasks = myWork?.activeAssignments || [];
  const completedTasks = myWork?.completedAssignments || [];

  // Determine list based on bucket
  let displayedTasks: Assignment[] = [];
  if (selectedBucket === 'ALL') {
    displayedTasks = activeTasks;
  } else if (selectedBucket === 'COMPLETED') {
    displayedTasks = completedTasks;
  } else {
    displayedTasks = activeTasks.filter((t) => t.status === selectedBucket);
  }

  // Apply filters (search, priority, entity)
  const filteredTasks = displayedTasks.filter((t) => {
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (entityFilter !== 'ALL' && t.entityType !== entityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (t.id || '').toLowerCase().includes(q);
      const matchEntity = (t.entityId || '').toLowerCase().includes(q);
      const matchTask = (t.taskType || '').toLowerCase().includes(q);
      const matchNotes = (t.notes || '').toLowerCase().includes(q);
      if (!matchId && !matchEntity && !matchTask && !matchNotes) return false;
    }
    return true;
  });

  const currentUser = users.find((u) => u.id === activeUserId);
  const urgentCount = activeTasks.filter((t) => t.priority === PriorityLevel.URGENT || t.priority === PriorityLevel.HIGH).length;
  const blockedCount = activeTasks.filter((t) => t.status === AssignmentStatus.BLOCKED).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & User Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="My Work & Personal Workbench"
          description="Track your active operational assignments, deadlines, and workflow transitions in real time."
        />

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* User selector for lead oversight or current profile badge */}
          {isManagerOrAdmin ? (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
              <span className="text-xs text-slate-500 font-medium">Viewing workbench:</span>
              <select
                value={activeUserId}
                onChange={(e) => setActiveUserId(e.target.value)}
                className="text-xs font-semibold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-800">{currentUser?.name || authUser?.name || 'My Queue'}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-2xs font-medium">
                {currentUser?.role || authUser?.role}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => loadMyWork(activeUserId)}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
            title="Refresh workbench"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {/* Active Tasks */}
        <div
          onClick={() => setSelectedBucket('ALL')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-2xs ${
            selectedBucket === 'ALL' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Tasks</span>
            <UserCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{myWork?.activeCount || 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Assigned to you</p>
        </div>

        {/* High & Urgent Priority */}
        <div className="p-4 bg-white rounded-xl border border-indigo-100 bg-indigo-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">High / Urgent</span>
            <Flame className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-900">{urgentCount}</p>
          <p className="text-xs text-indigo-600/80 mt-0.5">Priority focus</p>
        </div>

        {/* Overdue */}
        <div className="p-4 bg-white rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-700">{myWork?.overdueCount || 0}</p>
          <p className="text-xs text-rose-600/80 mt-0.5">Needs action</p>
        </div>

        {/* Due Today */}
        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Due Today</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">{myWork?.dueTodayCount || 0}</p>
          <p className="text-xs text-amber-600/80 mt-0.5">Today's target</p>
        </div>

        {/* Completed */}
        <div
          onClick={() => setSelectedBucket('COMPLETED')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-2xs ${
            selectedBucket === 'COMPLETED' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{completedTasks.length}</p>
          <p className="text-xs text-emerald-600/80 mt-0.5">Finished items</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Overdue / Due Today Alert Banner */}
        {((myWork?.overdueAssignments?.length || 0) > 0 || (myWork?.dueTodayAssignments?.length || 0) > 0) && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 shadow-xs">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Priority Attention: {myWork?.overdueCount || 0} Overdue • {myWork?.dueTodayCount || 0} Due Today</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...(myWork?.overdueAssignments || []), ...(myWork?.dueTodayAssignments || [])].map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedAssignment(item);
                    setIsModalOpen(true);
                  }}
                  className="p-3 bg-white rounded-lg border border-amber-200 shadow-2xs hover:border-amber-400 cursor-pointer transition-colors flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.taskType.replace(/_/g, ' ')}</span>
                      <AssignmentPriorityBadge priority={item.priority} size="sm" />
                    </div>
                    <p className="text-xs text-slate-600">
                      Target: <span className="font-semibold">{item.entityType} {item.entityId}</span>
                    </p>
                    <p className="text-xs font-medium text-rose-600">Due: {item.dueDate || 'Immediate'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bucket Tabs */}
        <div className="flex border-b border-slate-200 gap-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedBucket('ALL')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedBucket === 'ALL'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Active ({activeTasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedBucket('ASSIGNED')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedBucket === 'ASSIGNED'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Assigned</span>
            <span className="px-1.5 py-0.2 rounded text-2xs bg-slate-100 text-slate-600 font-bold">
              {activeTasks.filter((t) => t.status === AssignmentStatus.ASSIGNED).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedBucket('IN_PROGRESS')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedBucket === 'IN_PROGRESS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>In Progress</span>
            <span className="px-1.5 py-0.2 rounded text-2xs bg-amber-100 text-amber-800 font-bold">
              {activeTasks.filter((t) => t.status === AssignmentStatus.IN_PROGRESS).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedBucket('BLOCKED')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedBucket === 'BLOCKED'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Blocked</span>
            {blockedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-2xs bg-rose-100 text-rose-800 font-bold">
                {blockedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedBucket('COMPLETED')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              selectedBucket === 'COMPLETED'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed Archive ({completedTasks.length})</span>
          </button>
        </div>

        {/* Filter Bar & Task List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks, entity ID, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">All Priorities</option>
                <option value={PriorityLevel.URGENT}>Urgent</option>
                <option value={PriorityLevel.HIGH}>High</option>
                <option value={PriorityLevel.NORMAL}>Normal</option>
                <option value={PriorityLevel.LOW}>Low</option>
              </select>

              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">All Target Entities</option>
                <option value="QUESTION">Questions</option>
                <option value="VIDEO">Videos</option>
                <option value="SCRIPT">Scripts</option>
                <option value="THUMBNAIL">Thumbnails</option>
                <option value="PUBLISHING">Publishing</option>
                <option value="CONTENT_PLAN">Content Plans</option>
                <option value="CONTENT_BATCH">Content Batches</option>
              </select>
            </div>
          </div>

          {/* Quick Action Confirmation Modals / Inline Banners */}
          {blockTargetId && (
            <div className="p-4 bg-rose-50 border-b border-rose-200">
              <form onSubmit={handleConfirmBlock} className="space-y-3 max-w-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900">
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
                  placeholder="State the blocker reason (e.g. Missing audio reference, awaiting question review)..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-rose-300 bg-white text-slate-900 focus:ring-2 focus:ring-rose-500"
                  required
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading || !blockReasonInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {actionLoading ? 'Blocking...' : 'Confirm Block'}
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
            <div className="p-4 bg-emerald-50 border-b border-emerald-200">
              <form onSubmit={handleConfirmComplete} className="space-y-3 max-w-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900">
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
                  placeholder="Optional notes regarding completion (e.g. Script v2 recorded, published render uploaded)..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-emerald-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
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

          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-800 text-sm">No tasks found in this bucket</p>
              <p className="text-xs text-slate-500 mt-1">All assignments matching current filters are up to date.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const isAssigned = task.status === AssignmentStatus.ASSIGNED;
                const isInProgress = task.status === AssignmentStatus.IN_PROGRESS;
                const isBlocked = task.status === AssignmentStatus.BLOCKED;
                const isCompleted = task.status === AssignmentStatus.COMPLETED;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      setSelectedAssignment(task);
                      setIsModalOpen(true);
                    }}
                    className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900">
                          {task.taskType.replace(/_/g, ' ')}
                        </span>
                        <AssignmentStatusBadge status={task.status} size="sm" />
                        <AssignmentPriorityBadge priority={task.priority} size="sm" />
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {task.entityType} • {task.entityId}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Due: <strong className="text-slate-700">{task.dueDate}</strong></span>
                          </span>
                        )}
                        <span>Role: <strong className="text-slate-700">{task.assignmentRole || 'ASSIGNED'}</strong></span>
                        {task.notes && (
                          <span className="text-slate-500 truncate max-w-md italic">"{task.notes}"</span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={getEntityUrl(task.entityType, task.entityId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                      >
                        <span>Open Entity</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>

                      {isAssigned && (
                        <button
                          type="button"
                          onClick={(e) => handleStartTask(task.id, e)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start</span>
                        </button>
                      )}

                      {isBlocked && (
                        <button
                          type="button"
                          onClick={(e) => handleStartTask(task.id, e)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-800 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </button>
                      )}

                      {(isAssigned || isInProgress) && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenBlockDialog(task.id, e)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                          <span>Block</span>
                        </button>
                      )}

                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenCompleteDialog(task.id, e)}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
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

      {/* Assignment Modal */}
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
