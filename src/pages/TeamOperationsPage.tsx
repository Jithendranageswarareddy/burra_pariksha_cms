import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Assignment,
  AssignmentStatus,
  PriorityLevel,
  TeamWorkloadSummary,
  UnassignedWorkItem,
  User,
  UserRole,
} from '../types';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';
import { AssignmentStatusBadge, AssignmentPriorityBadge } from '../components/assignments/AssignmentBadge';
import { AssignmentModal } from '../components/assignments/AssignmentModal';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
  UserPlus,
  AlertCircle,
  Play,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  X,
  Flame,
} from 'lucide-react';

export const TeamOperationsPage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [teamSummary, setTeamSummary] = useState<TeamWorkloadSummary | null>(null);
  const [unassignedWork, setUnassignedWork] = useState<UnassignedWorkItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'WORKLOAD' | 'UNASSIGNED' | 'ALL_ASSIGNMENTS' | 'DIRECTORY'>('WORKLOAD');

  // Filters for All Assignments
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('ALL');

  // Modal states
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [modalEntityType, setModalEntityType] = useState<string>('VIDEO');
  const [modalEntityId, setModalEntityId] = useState<string>('');
  const [modalDefaultTaskType, setModalDefaultTaskType] = useState<string>('QUESTION_WRITING');
  const [modalExistingAssignment, setModalExistingAssignment] = useState<Assignment | null>(null);

  // User Management Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<string>('CONTENT_WRITER');
  const [userIsActive, setUserIsActive] = useState(true);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);

  const isManagerOrAdmin = authUser
    ? [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(authUser.role as UserRole) || (authUser.role as string) === 'CONTENT_LEAD'
    : true; // Default to true if not strictly logged in for developer preview

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, unassigned, allAsn, userList] = await Promise.all([
        apiClient.getTeamWorkload(),
        apiClient.getUnassignedWork(),
        apiClient.getAssignments(),
        apiClient.getUsers(),
      ]);
      setTeamSummary(summary);
      setUnassignedWork(unassigned);
      setAssignments(allAsn);
      setUsers(userList);
    } catch (err: any) {
      setError(err?.message || 'Failed to load team operations data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAssignModal = (
    entityType: string,
    entityId: string,
    defaultTaskType: string,
    existing?: Assignment
  ) => {
    setModalEntityType(entityType);
    setModalEntityId(entityId);
    setModalDefaultTaskType(defaultTaskType);
    setModalExistingAssignment(existing || null);
    setIsAssignmentModalOpen(true);
  };

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserRole('CONTENT_WRITER');
    setUserIsActive(true);
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserRole(u.role);
    setUserIsActive(u.isActive);
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      setUserModalError('Name and valid email are required');
      return;
    }
    setUserModalLoading(true);
    setUserModalError(null);
    try {
      if (editingUser) {
        await apiClient.updateUser(editingUser.id, {
          name: userName,
          email: userEmail,
          role: userRole,
          isActive: userIsActive,
        });
      } else {
        await apiClient.createUser({
          name: userName,
          email: userEmail,
          role: userRole,
          isActive: userIsActive,
        });
      }
      setIsUserModalOpen(false);
      loadAllData();
    } catch (err: any) {
      setUserModalError(err?.message || 'Failed to save team member');
    } finally {
      setUserModalLoading(false);
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

  // Filtered assignments
  const filteredAssignments = assignments.filter((asn) => {
    if (selectedUserFilter !== 'ALL' && asn.assigneeId !== selectedUserFilter) return false;
    if (selectedStatusFilter !== 'ALL' && asn.status !== selectedStatusFilter) return false;
    if (selectedPriorityFilter !== 'ALL' && asn.priority !== selectedPriorityFilter) return false;
    if (selectedEntityFilter !== 'ALL' && asn.entityType !== selectedEntityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (asn.id || '').toLowerCase().includes(q);
      const matchEntity = (asn.entityId || '').toLowerCase().includes(q);
      const matchName = (asn.assigneeName || '').toLowerCase().includes(q);
      const matchTask = (asn.taskType || '').toLowerCase().includes(q);
      const matchNotes = (asn.notes || '').toLowerCase().includes(q);
      if (!matchId && !matchEntity && !matchName && !matchTask && !matchNotes) return false;
    }
    return true;
  });

  // If user is authenticated but not authorized to view team operations
  if (authUser && !isManagerOrAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Restricted Operational Area</h2>
        <p className="text-sm text-slate-600">
          Team workload management and resource allocation are restricted to Content Leads and Administrators.
          Please visit your personal workbench to manage your assigned tasks.
        </p>
        <div className="pt-2">
          <Link
            to="/my-work"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>Go to My Work</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Team Operations & Workload Control"
          description="Manage team distribution, allocate production assignments, and monitor pipeline operational capacity."
        />

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={loadAllData}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
            title="Refresh team operations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenNewUser}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAssignModal('VIDEO', '', 'QUESTION_WRITING')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Task</span>
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

      {/* Metrics Top Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Team</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{teamSummary?.totalMembers || 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Staff & Specialists</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Tasks</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{teamSummary?.totalActiveTasks || 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">In flight across team</p>
        </div>

        <div
          onClick={() => setActiveTab('UNASSIGNED')}
          className={`p-4 bg-white rounded-xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === 'UNASSIGNED' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Unassigned Backlog</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">{unassignedWork.length}</p>
          <p className="text-xs text-amber-600/80 mt-0.5">Needs staff allocation</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Overdue & Blocked</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-700">
            {(teamSummary?.totalOverdueTasks || 0) + (teamSummary?.totalBlockedTasks || 0)}
          </p>
          <p className="text-xs text-rose-600/80 mt-0.5">
            {teamSummary?.totalOverdueTasks || 0} overdue • {teamSummary?.totalBlockedTasks || 0} blocked
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('WORKLOAD')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'WORKLOAD'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Workload Distribution ({teamSummary?.workloads?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('UNASSIGNED')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'UNASSIGNED'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Unassigned Work Backlog</span>
          {unassignedWork.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {unassignedWork.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALL_ASSIGNMENTS')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'ALL_ASSIGNMENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Assignments ({assignments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DIRECTORY')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DIRECTORY'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Directory ({users.length})</span>
        </button>
      </div>

      {/* Tab 1: WORKLOAD DISTRIBUTION */}
      {activeTab === 'WORKLOAD' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teamSummary?.workloads.map((w) => {
              const score = w.workloadScore;
              let scoreColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
              let capacityLabel = 'Optimal Load';
              if (score >= 12) {
                scoreColor = 'text-rose-700 bg-rose-50 border-rose-200';
                capacityLabel = 'Heavy Overload';
              } else if (score >= 7) {
                scoreColor = 'text-amber-700 bg-amber-50 border-amber-200';
                capacityLabel = 'Moderate Load';
              }

              return (
                <div
                  key={w.user.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{w.user.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                            {w.user.role}
                          </span>
                          <span className="text-xs text-slate-400">{w.user.email}</span>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${scoreColor}`}>
                        Score: {score}
                      </div>
                    </div>

                    {/* Capacity Indicator Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Capacity: {capacityLabel}</span>
                        <span className="font-bold text-slate-800">{w.activeAssignments.length} Active Tasks</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            score >= 12 ? 'bg-rose-500' : score >= 7 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(8, score * 7))}%` }}
                        />
                      </div>
                    </div>

                    {/* Breakdown counts */}
                    <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-50 rounded-lg">
                      <div>
                        <span className="block text-xs text-slate-500">In Progress</span>
                        <span className="text-sm font-bold text-amber-700">{w.inProgressCount}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Overdue</span>
                        <span className="text-sm font-bold text-rose-700">{w.overdueCount}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-slate-500">Completed</span>
                        <span className="text-sm font-bold text-emerald-700">{w.completedCount}</span>
                      </div>
                    </div>

                    {/* Active Tasks List Snippet */}
                    {w.activeAssignments.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Current Tasks ({w.activeAssignments.length})
                        </span>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {w.activeAssignments.map((asn) => (
                            <div
                              key={asn.id}
                              onClick={() => {
                                setModalExistingAssignment(asn);
                                setModalEntityType(asn.entityType);
                                setModalEntityId(asn.entityId);
                                setIsAssignmentModalOpen(true);
                              }}
                              className="p-2 rounded bg-slate-50 hover:bg-slate-100 border border-slate-100 cursor-pointer text-xs flex items-center justify-between gap-2"
                            >
                              <span className="font-medium text-slate-800 truncate">
                                {asn.taskType.replace(/_/g, ' ')} ({asn.entityType} {asn.entityId})
                              </span>
                              <AssignmentPriorityBadge priority={asn.priority} size="sm" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserFilter(w.user.id);
                        setActiveTab('ALL_ASSIGNMENTS');
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      View All Assignments →
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModalExistingAssignment(null);
                        setModalEntityType('VIDEO');
                        setModalEntityId('');
                        setModalDefaultTaskType('QUESTION_WRITING');
                        setIsAssignmentModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                    >
                      Assign Task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: UNASSIGNED WORK BACKLOG */}
      {activeTab === 'UNASSIGNED' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Unassigned Production Pipeline Work</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated detection of questions, videos, and media items requiring specialist assignment.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {unassignedWork.length} Items Backlog
            </span>
          </div>

          {unassignedWork.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-800 text-sm">All pipeline items are assigned</p>
              <p className="text-xs text-slate-500 mt-1">No unassigned backlog items found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {unassignedWork.map((item) => (
                <div
                  key={`${item.entityType}-${item.entityId}-${item.recommendedTaskType}`}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{item.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                        {item.entityType} • {item.entityId}
                      </span>
                      <AssignmentPriorityBadge priority={item.priority} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span>Status: <strong className="text-slate-700">{item.currentStatus}</strong></span>
                      <span>Recommended Task: <strong className="text-slate-700">{item.recommendedTaskType.replace(/_/g, ' ')}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span className="text-amber-700 font-medium">{item.reason}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={getEntityUrl(item.entityType, item.entityId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                    >
                      <span>View Entity</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        handleOpenAssignModal(
                          item.entityType,
                          item.entityId,
                          item.recommendedTaskType
                        )
                      }
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assign Specialist</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: ALL ASSIGNMENTS */}
      {activeTab === 'ALL_ASSIGNMENTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search assignments by ID, entity, assignee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">All Team Members</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value={AssignmentStatus.ASSIGNED}>Assigned</option>
                <option value={AssignmentStatus.IN_PROGRESS}>In Progress</option>
                <option value={AssignmentStatus.BLOCKED}>Blocked</option>
                <option value={AssignmentStatus.COMPLETED}>Completed</option>
                <option value={AssignmentStatus.CANCELLED}>Cancelled</option>
              </select>

              <select
                value={selectedPriorityFilter}
                onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">All Priorities</option>
                <option value={PriorityLevel.URGENT}>Urgent</option>
                <option value={PriorityLevel.HIGH}>High</option>
                <option value={PriorityLevel.NORMAL}>Normal</option>
                <option value={PriorityLevel.LOW}>Low</option>
              </select>

              <select
                value={selectedEntityFilter}
                onChange={(e) => setSelectedEntityFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="ALL">All Entities</option>
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

          {/* Table */}
          {filteredAssignments.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <p className="font-semibold text-slate-800 text-sm">No assignments match current filters</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting or modifying your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Task ID & Type</th>
                    <th className="px-4 py-3">Target Entity</th>
                    <th className="px-4 py-3">Assignee</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map((asn) => (
                    <tr
                      key={asn.id}
                      onClick={() => {
                        setModalExistingAssignment(asn);
                        setModalEntityType(asn.entityType);
                        setModalEntityId(asn.entityId);
                        setIsAssignmentModalOpen(true);
                      }}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span>{asn.taskType.replace(/_/g, ' ')}</span>
                          <span className="text-slate-400 font-mono text-2xs">{asn.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {asn.entityType} • {asn.entityId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        {asn.assigneeName}
                      </td>
                      <td className="px-4 py-3">
                        <AssignmentStatusBadge status={asn.status} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <AssignmentPriorityBadge priority={asn.priority} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {asn.dueDate || '—'}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={getEntityUrl(asn.entityType, asn.entityId)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            title="Open Entity"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setModalExistingAssignment(asn);
                              setModalEntityType(asn.entityType);
                              setModalEntityId(asn.entityId);
                              setIsAssignmentModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: TEAM DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Burra Pariksha Team Directory</h3>
              <p className="text-xs text-slate-500 mt-0.5">Authoritative user directory registered in Google Sheets.</p>
            </div>
            <button
              type="button"
              onClick={handleOpenNewUser}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{u.name}</h4>
                      <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-slate-100 text-slate-700">
                        {u.role}
                      </span>
                      {u.isActive ? (
                        <span className="px-1.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full text-2xs font-bold bg-rose-50 text-rose-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{u.email} • ID: {u.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditUser(u)}
                    className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setModalExistingAssignment(null);
        }}
        onSuccess={() => loadAllData()}
        entityType={modalEntityType}
        entityId={modalEntityId}
        defaultTaskType={modalDefaultTaskType}
        existingAssignment={modalExistingAssignment}
      />

      {/* User Management Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-semibold text-base">
                {editingUser ? `Edit User: ${editingUser.name}` : 'Add New Team Member'}
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {userModalError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {userModalError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="e.g. ramesh@burrapariksha.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CONTENT_WRITER">Content Writer</option>
                  <option value="CONTENT_LEAD">Content Lead</option>
                  <option value="SPEAKER">Speaker (Filming / Voiceover)</option>
                  <option value="VIDEO_EDITOR">Video Editor</option>
                  <option value="GRAPHIC_DESIGNER">Graphic Designer</option>
                  <option value="COMMUNITY_MANAGER">Community Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="user-is-active"
                  checked={userIsActive}
                  onChange={(e) => setUserIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="user-is-active" className="text-xs font-medium text-slate-700">
                  Active Team Member
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userModalLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
                >
                  {userModalLoading ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
