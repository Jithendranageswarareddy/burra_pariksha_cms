import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ListOrdered,
  Database,
  RefreshCw,
  Activity,
  FileQuestion,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Users,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { QuestionTable } from '../components/questions/QuestionTable';
import { apiClient } from '../lib/api-client';
import {
  AuditLog,
  DashboardMetrics,
  DashboardOverviewData,
  Question,
  SpreadsheetHealthReport,
  SystemHealthReport,
  Topic,
  UserRole,
  MyWorkSummary,
  Assignment,
} from '../types';
import { ShieldCheck, AlertCircle, CheckCircle2, Play, AlertTriangle, CheckSquare, Pause, CheckCircle, Eye, Award, Check, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AssignmentStatusBadge, AssignmentPriorityBadge } from '../components/assignments/AssignmentBadge';

import { DAILY_WORKFLOW_STEPS } from '../config/constants';
import { DailyWorkflowGuide } from '../components/dashboard/DailyWorkflowGuide';
import { PipelineVisualizer } from '../components/dashboard/PipelineVisualizer';
import { TodaysWorkSection } from '../components/dashboard/TodaysWorkSection';
import { BottleneckSection } from '../components/dashboard/BottleneckSection';
import { StaleContentSection } from '../components/dashboard/StaleContentSection';
import { PublishingReadinessSection } from '../components/dashboard/PublishingReadinessSection';
import { DashboardFilterBar } from '../components/dashboard/DashboardFilterBar';

interface SpecialistRoleMetadata {
  title: string;
  description: string;
  primaryMetricLabel: string;
  infoMessage: string;
}

const SPECIALIST_ROLES_METADATA: Record<string, SpecialistRoleMetadata> = {
  [UserRole.QUESTION_EDITOR]: {
    title: 'Question Editor Workspace',
    description: 'Review validation problems, author, edit, and curate Telugu translation and logic-trap questions.',
    primaryMetricLabel: 'Questions to Curate',
    infoMessage: 'Your primary focus is Telugu validation and editing. Complete assigned questions with pristine formatting and accurate context.',
  },
  [UserRole.SCRIPT_WRITER]: {
    title: 'Script Writer Desk',
    description: 'Draft compelling teleprompter scripts with precise timing constraints and custom hook variants.',
    primaryMetricLabel: 'Scripts to Write',
    infoMessage: 'Ensure all Telugu video scripts adhere to timing standards and contain both logical hooks and clear explanations.',
  },
  [UserRole.VIDEO_EDITOR]: {
    title: 'Video Production Suite',
    description: 'Process raw video files, manage production status updates, and align creative assets.',
    primaryMetricLabel: 'Videos to Produce',
    infoMessage: 'Coordinate video timeline statuses (RECORDING -> EDITING -> FINAL_REVIEW) with priority overrides.',
  },
  [UserRole.DESIGNER]: {
    title: 'Creative Design Board',
    description: 'Create eye-catching, high-impact custom thumbnails and iterate on design feedback.',
    primaryMetricLabel: 'Thumbnails to Design',
    infoMessage: 'Draft and log new creative assets. Avoid dark gradient borders, keeping visual components highly distinct.',
  },
  [UserRole.PUBLISHING_MANAGER]: {
    title: 'Publishing Operations',
    description: 'Verify publishing readiness, platform metadata, release checklists, and final scheduling.',
    primaryMetricLabel: 'Items to Release',
    infoMessage: 'Finalize platforms checkoff grids (YouTube, Instagram, Facebook) before triggering platform uploads.',
  },
  [UserRole.REVIEWER]: {
    title: 'Quality Review Workspace',
    description: 'Conduct thorough peer audits of content bundles, check consistency, and approve release readiness.',
    primaryMetricLabel: 'Reviews Awaiting Audit',
    infoMessage: 'Validate generated questions, script timings, and thumbnail selections. Self-approval is strictly prevented.',
  },
};

export const DashboardPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [quickHealth, setQuickHealth] = useState<{ isConfigured: boolean } | null>(null);
  const [healthReport, setHealthReport] = useState<SpreadsheetHealthReport | null>(null);
  const [integrityReport, setIntegrityReport] = useState<SystemHealthReport | null>(null);
  const [opHealthReport, setOpHealthReport] = useState<{ connectivityStatus: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Specialist workbench state
  const [myWork, setMyWork] = useState<MyWorkSummary | null>(null);
  const [myWorkLoading, setMyWorkLoading] = useState(true);
  const [myWorkError, setMyWorkError] = useState<string | null>(null);
  const [activeWorkboardTab, setActiveWorkboardTab] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [activeActionAssignmentId, setActiveActionAssignmentId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'BLOCK' | 'COMPLETE' | null>(null);
  const [inlineInputText, setInlineInputText] = useState('');

  // Filters
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showProtocolModal, setShowProtocolModal] = useState(false);

  const isManagerOrAdmin = user && [UserRole.ADMIN, UserRole.CONTENT_MANAGER].includes(user.role as UserRole);
  const isSpecialist = user && [
    UserRole.QUESTION_EDITOR,
    UserRole.SCRIPT_WRITER,
    UserRole.VIDEO_EDITOR,
    UserRole.DESIGNER,
    UserRole.PUBLISHING_MANAGER,
    UserRole.REVIEWER,
  ].includes(user.role as UserRole);

  // 1. Critical Path: Fast Overview Fetching
  const loadOverview = useCallback(async (isExplicitRefresh = false) => {
    if (!isManagerOrAdmin) return;
    setIsRefreshing(true);
    setOverviewError(null);
    try {
      const filter = {
        topicId: selectedTopic || undefined,
        difficulty: selectedDifficulty || undefined,
        priority: selectedPriority || undefined,
      };

      const overviewData = await apiClient.getDashboardOverview(filter, isExplicitRefresh);
      if (overviewData && overviewData.metrics) {
        setOverview(overviewData);
        setOverviewError(null);
      } else {
        throw new Error('Dashboard operations dataset is incomplete or missing metrics contract.');
      }
    } catch (err: any) {
      console.warn('Dashboard overview loading notice:', err?.message || err);
      setOverviewError(err?.message || 'Failed to fetch dashboard overview');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTopic, selectedDifficulty, selectedPriority, isManagerOrAdmin]);

  useEffect(() => {
    if (isManagerOrAdmin) {
      loadOverview();
    }
  }, [loadOverview, isManagerOrAdmin]);

  // 2. Filter Metadata (Topics) — Decoupled & Non-blocking
  useEffect(() => {
    if (isManagerOrAdmin) {
      apiClient.getTopics().then((tops) => {
        if (Array.isArray(tops) && tops.length > 0) setTopics(tops);
      }).catch(() => []);
    }
  }, [isManagerOrAdmin]);

  // 3. Instant Connection Health Check (1ms lightweight check)
  useEffect(() => {
    if (isManagerOrAdmin) {
      apiClient.getHealth().then((h) => {
        setQuickHealth({ isConfigured: Boolean(h.databaseConfigured) });
      }).catch(() => null);

      // 4. Background Diagnostics — Completely Independent & Non-blocking
      // Only ADMIN is authorized to view system integrity and operational health telemetry
      if (user?.role === UserRole.ADMIN) {
        apiClient.getSystemIntegrityHealth().then(setIntegrityReport).catch(() => null);
        apiClient.getOperationalHealth().then(setOpHealthReport).catch(() => null);
      }
      apiClient.getSheetsHealth().then(setHealthReport).catch(() => null);
    }
  }, [isManagerOrAdmin, user?.role]);

  // 5. Specialist Personal Work Queue Loading
  const loadMyWork = useCallback(async () => {
    if (!user?.id) return;
    setMyWorkLoading(true);
    setMyWorkError(null);
    try {
      const data = await apiClient.getMyWork(user.id);
      setMyWork(data);
    } catch (err: any) {
      setMyWorkError(err?.message || 'Failed to load personal work queue.');
    } finally {
      setMyWorkLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isSpecialist) {
      loadMyWork();
    }
  }, [isSpecialist, loadMyWork]);

  const handleStartAssignment = async (id: string) => {
    setActionLoadingId(id);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);
    try {
      await apiClient.startAssignment(id);
      setActionSuccessMessage(`Task ${id} has been started.`);
      await loadMyWork();
    } catch (err: any) {
      setActionErrorMessage(err?.message || 'Failed to start task.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenInlineAction = (id: string, type: 'BLOCK' | 'COMPLETE') => {
    setActiveActionAssignmentId(id);
    setActionType(type);
    setInlineInputText('');
    setActionErrorMessage(null);
    setActionSuccessMessage(null);
  };

  const handleCancelInlineAction = () => {
    setActiveActionAssignmentId(null);
    setActionType(null);
    setInlineInputText('');
  };

  const handleConfirmInlineAction = async (id: string) => {
    setActionLoadingId(id);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);
    try {
      if (actionType === 'BLOCK') {
        if (!inlineInputText.trim()) {
          setActionErrorMessage('A block reason is required.');
          setActionLoadingId(null);
          return;
        }
        await apiClient.blockAssignment(id, inlineInputText.trim());
        setActionSuccessMessage(`Task ${id} marked as BLOCKED.`);
      } else if (actionType === 'COMPLETE') {
        await apiClient.completeAssignment(id, { notes: inlineInputText.trim() || undefined });
        setActionSuccessMessage(`Task ${id} completed successfully.`);
      }
      setActiveActionAssignmentId(null);
      setActionType(null);
      setInlineInputText('');
      await loadMyWork();
    } catch (err: any) {
      setActionErrorMessage(err?.message || 'Action failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetFilters = () => {
    setSelectedTopic('');
    setSelectedDifficulty('');
    setSelectedPriority('');
  };

  // Auth Loading Gate
  if (authLoading) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <PageHeader
          title="Loading Workspace..."
          description="Authenticating and preparing your secure operational dashboard workspace..."
        />
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Establishing Secure Session Context...
          </p>
        </div>
      </div>
    );
  }

  // Render Specialist Dashboard Shell
  if (isSpecialist) {
    const roleMeta = SPECIALIST_ROLES_METADATA[user.role] || {
      title: 'Operations Desk',
      description: 'Your assigned operational workspace.',
      primaryMetricLabel: 'Active Tasks',
      infoMessage: 'Adhere to your team assignment schedules and ensure complete data entry validation.'
    };

    const ROLE_TABS: Record<string, { id: string; label: string }[]> = {
      [UserRole.QUESTION_EDITOR]: [
        { id: 'ALL', label: 'All Questions' },
        { id: 'EDIT', label: 'Editing Needed' },
        { id: 'REVIEW', label: 'Validation & Review' },
        { id: 'REVISION', label: 'Revisions / Blocked' },
        { id: 'COMPLETED', label: 'Approved & Done' },
      ],
      [UserRole.SCRIPT_WRITER]: [
        { id: 'ALL', label: 'All Scripts' },
        { id: 'WRITE', label: 'Writing & Creation' },
        { id: 'REVISION', label: 'Revisions Needed' },
        { id: 'COMPLETED', label: 'Approved & Done' },
      ],
      [UserRole.VIDEO_EDITOR]: [
        { id: 'ALL', label: 'All Production' },
        { id: 'QUEUE', label: 'Queued Production' },
        { id: 'EDITING', label: 'Recording & Editing' },
        { id: 'REVIEW', label: 'Final Review' },
        { id: 'COMPLETED', label: 'Done / Upload Ready' },
      ],
      [UserRole.DESIGNER]: [
        { id: 'ALL', label: 'All Designs' },
        { id: 'CREATE', label: 'Thumbnail Creation' },
        { id: 'REVISION', label: 'Revisions' },
        { id: 'COMPLETED', label: 'Approved & Done' },
      ],
      [UserRole.PUBLISHING_MANAGER]: [
        { id: 'ALL', label: 'All Publishing' },
        { id: 'READINESS', label: 'Readiness Check' },
        { id: 'ACTIVE', label: 'Active & Scheduled' },
        { id: 'BLOCKED', label: 'Blocked Releases' },
        { id: 'COMPLETED', label: 'Released' },
      ],
      [UserRole.REVIEWER]: [
        { id: 'ALL', label: 'All Reviews' },
        { id: 'PENDING', label: 'Pending Review' },
        { id: 'CHANGES', label: 'Changes Requested' },
        { id: 'COMPLETED', label: 'Approved' },
      ],
    };

    const currentTabs = ROLE_TABS[user.role] || [{ id: 'ALL', label: 'All Assignments' }];

    const allMyAssignments = [
      ...(myWork?.activeAssignments || []),
      ...(myWork?.completedAssignments || [])
    ];

    const getFilteredAssignments = () => {
      if (user?.role === UserRole.QUESTION_EDITOR) {
        return allMyAssignments.filter(a => {
          if (a.entityType !== 'QUESTION') return false;
          
          switch (activeWorkboardTab) {
            case 'EDIT':
              return (a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS') && !a.taskType.toLowerCase().includes('review') && !a.taskType.toLowerCase().includes('validation');
            case 'REVIEW':
              return a.taskType.toLowerCase().includes('review') || a.taskType.toLowerCase().includes('validation');
            case 'REVISION':
              return a.status === 'BLOCKED';
            case 'COMPLETED':
              return a.status === 'COMPLETED';
            case 'ALL':
            default:
              return true;
          }
        });
      }
      
      if (user?.role === UserRole.SCRIPT_WRITER) {
        return allMyAssignments.filter(a => {
          if (a.entityType !== 'SCRIPT') return false;
          
          switch (activeWorkboardTab) {
            case 'WRITE':
              return (a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS') && !a.taskType.toLowerCase().includes('review') && !a.taskType.toLowerCase().includes('revision');
            case 'REVISION':
              return a.status === 'BLOCKED' || a.taskType.toLowerCase().includes('revision') || (a.notes && a.notes.toLowerCase().includes('revision'));
            case 'COMPLETED':
              return a.status === 'COMPLETED';
            case 'ALL':
            default:
              return true;
          }
        });
      }
      
      if (user?.role === UserRole.VIDEO_EDITOR) {
        return allMyAssignments.filter(a => {
          if (a.entityType !== 'VIDEO') return false;
          
          switch (activeWorkboardTab) {
            case 'QUEUE':
              return a.status === 'ASSIGNED';
            case 'EDITING':
              return a.status === 'IN_PROGRESS';
            case 'REVIEW':
              return a.taskType.toLowerCase().includes('review') || a.taskType.toLowerCase().includes('audit');
            case 'COMPLETED':
              return a.status === 'COMPLETED';
            case 'ALL':
            default:
              return true;
          }
        });
      }
      
      if (user?.role === UserRole.DESIGNER) {
        return allMyAssignments.filter(a => {
          if (a.entityType !== 'THUMBNAIL' && a.taskType !== 'THUMBNAIL_DESIGN') return false;
          
          switch (activeWorkboardTab) {
            case 'CREATE':
              return (a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS');
            case 'REVISION':
              return a.status === 'BLOCKED' || (a.notes && a.notes.toLowerCase().includes('revision'));
            case 'COMPLETED':
              return a.status === 'COMPLETED';
            case 'ALL':
            default:
              return true;
          }
        });
      }
      
      if (user?.role === UserRole.PUBLISHING_MANAGER) {
        return allMyAssignments.filter(a => {
          if (a.entityType !== 'PUBLISHING' && a.taskType !== 'PUBLISHING') return false;
          
          switch (activeWorkboardTab) {
            case 'READINESS':
              return a.status === 'ASSIGNED';
            case 'ACTIVE':
              return a.status === 'IN_PROGRESS';
            case 'BLOCKED':
              return a.status === 'BLOCKED';
            case 'COMPLETED':
              return a.status === 'COMPLETED';
            case 'ALL':
            default:
              return true;
          }
        });
      }
      
      if (user?.role === UserRole.REVIEWER) {
        return allMyAssignments.filter(a => {
          if (a.taskType !== 'QUALITY_REVIEW' && !a.taskType.toLowerCase().includes('review')) return false;
          
          switch (activeWorkboardTab) {
            case 'PENDING':
              return a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS';
            case 'CHANGES':
              return a.status === 'BLOCKED' || (a.notes && a.notes.toLowerCase().includes('change'));
            case 'COMPLETED':
              return a.status === 'COMPLETED';
            case 'ALL':
            default:
              return true;
          }
        });
      }
      
      return allMyAssignments;
    };

    const getTabCount = (tabId: string) => {
      if (user?.role === UserRole.QUESTION_EDITOR) {
        return allMyAssignments.filter(a => {
          if (a.entityType !== 'QUESTION') return false;
          if (tabId === 'ALL') return true;
          if (tabId === 'EDIT') return (a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS') && !a.taskType.toLowerCase().includes('review') && !a.taskType.toLowerCase().includes('validation');
          if (tabId === 'REVIEW') return a.taskType.toLowerCase().includes('review') || a.taskType.toLowerCase().includes('validation');
          if (tabId === 'REVISION') return a.status === 'BLOCKED';
          if (tabId === 'COMPLETED') return a.status === 'COMPLETED';
          return false;
        }).length;
      }
      
      if (user?.role === UserRole.SCRIPT_WRITER) {
        return allMyAssignments.filter(a => {
          if (a.entityType !== 'SCRIPT') return false;
          if (tabId === 'ALL') return true;
          if (tabId === 'WRITE') return (a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS') && !a.taskType.toLowerCase().includes('review') && !a.taskType.toLowerCase().includes('revision');
          if (tabId === 'REVISION') return a.status === 'BLOCKED' || a.taskType.toLowerCase().includes('revision') || (a.notes && a.notes.toLowerCase().includes('revision'));
          if (tabId === 'COMPLETED') return a.status === 'COMPLETED';
          return false;
        }).length;
      }
      
      if (user?.role === UserRole.VIDEO_EDITOR) {
        return allMyAssignments.filter(a => {
          if (a.entityType !== 'VIDEO') return false;
          if (tabId === 'ALL') return true;
          if (tabId === 'QUEUE') return a.status === 'ASSIGNED';
          if (tabId === 'EDITING') return a.status === 'IN_PROGRESS';
          if (tabId === 'REVIEW') return a.taskType.toLowerCase().includes('review') || a.taskType.toLowerCase().includes('audit');
          if (tabId === 'COMPLETED') return a.status === 'COMPLETED';
          return false;
        }).length;
      }
      
      if (user?.role === UserRole.DESIGNER) {
        return allMyAssignments.filter(a => {
          if (a.entityType !== 'THUMBNAIL' && a.taskType !== 'THUMBNAIL_DESIGN') return false;
          if (tabId === 'ALL') return true;
          if (tabId === 'CREATE') return (a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS');
          if (tabId === 'REVISION') return a.status === 'BLOCKED' || (a.notes && a.notes.toLowerCase().includes('revision'));
          if (tabId === 'COMPLETED') return a.status === 'COMPLETED';
          return false;
        }).length;
      }
      
      if (user?.role === UserRole.PUBLISHING_MANAGER) {
        return allMyAssignments.filter(a => {
          if (a.entityType !== 'PUBLISHING' && a.taskType !== 'PUBLISHING') return false;
          if (tabId === 'ALL') return true;
          if (tabId === 'READINESS') return a.status === 'ASSIGNED';
          if (tabId === 'ACTIVE') return a.status === 'IN_PROGRESS';
          if (tabId === 'BLOCKED') return a.status === 'BLOCKED';
          if (tabId === 'COMPLETED') return a.status === 'COMPLETED';
          return false;
        }).length;
      }
      
      if (user?.role === UserRole.REVIEWER) {
        return allMyAssignments.filter(a => {
          if (a.taskType !== 'QUALITY_REVIEW' && !a.taskType.toLowerCase().includes('review')) return false;
          if (tabId === 'ALL') return true;
          if (tabId === 'PENDING') return a.status === 'ASSIGNED' || a.status === 'IN_PROGRESS';
          if (tabId === 'CHANGES') return a.status === 'BLOCKED' || (a.notes && a.notes.toLowerCase().includes('change'));
          if (tabId === 'COMPLETED') return a.status === 'COMPLETED';
          return false;
        }).length;
      }
      
      return tabId === 'ALL' ? allMyAssignments.length : 0;
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

    const filteredAssignments = getFilteredAssignments();

    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <PageHeader
          title={roleMeta.title}
          description={roleMeta.description}
          actions={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadMyWork()}
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
                title="Refresh workboard"
              >
                <RefreshCw className={`w-4 h-4 ${myWorkLoading ? 'animate-spin' : ''}`} />
              </button>
              <Link to="/my-work">
                <Button variant="primary" size="sm" icon={UserCheck}>
                  Personal Workbench
                </Button>
              </Link>
            </div>
          }
        />

        {/* Summary Area */}
        {myWorkLoading ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Loading workspace summary metrics...</p>
          </div>
        ) : myWorkError ? (
          <div className="p-8 text-center bg-white rounded-xl border border-rose-200 shadow-xs space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Metrics Unavailable</p>
            <p className="text-xs text-slate-500">{myWorkError}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Active Queue Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-1.5 hover:border-slate-300 transition-all">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active Assigned Queue</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {myWork?.activeCount ?? 0}
                </span>
                <span className="text-xs text-slate-400 font-medium">pending items</span>
              </div>
              <p className="text-2xs text-slate-500">Tasks assigned or in-progress</p>
            </div>

            {/* Completed Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-1.5 hover:border-slate-300 transition-all">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Completed Work</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {myWork?.completedAssignments?.length ?? myWork?.metrics?.completedCount ?? 0}
                </span>
                <span className="text-xs text-emerald-600 font-bold">finished</span>
              </div>
              <p className="text-2xs text-slate-500">Resolved during current cycle</p>
            </div>

            {/* Allocation Status Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-1.5 hover:border-slate-300 transition-all">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Workload Capacity</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                  (myWork?.activeCount ?? 0) >= 5
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : (myWork?.activeCount ?? 0) >= 3
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {(myWork?.activeCount ?? 0) >= 5 ? 'High' : (myWork?.activeCount ?? 0) >= 3 ? 'Optimal' : 'Light'}
                </span>
              </div>
              <p className="text-2xs text-slate-500">Based on active task distribution metrics</p>
            </div>
          </div>
        )}

        {/* Workflow Guide Info Message Box */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 shadow-3xs flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-indigo-900">Workspace Focus Guideline</h4>
            <p className="text-xs text-indigo-800 leading-relaxed">{roleMeta.infoMessage}</p>
          </div>
        </div>

        {/* Action Feedbacks */}
        {actionSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{actionSuccessMessage}</span>
          </div>
        )}

        {actionErrorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{actionErrorMessage}</span>
          </div>
        )}

        {/* Primary Workboard Area */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          {/* Workboard Tabs Header */}
          <div className="border-b border-slate-100 px-6 pt-4">
            <div className="flex flex-wrap -mb-px gap-2">
              {currentTabs.map((tab) => {
                const count = getTabCount(tab.id);
                const isActive = activeWorkboardTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveWorkboardTab(tab.id);
                      handleCancelInlineAction();
                    }}
                    className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      isActive
                        ? 'border-indigo-600 text-indigo-600 font-extrabold'
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
                    }`}
                  >
                    {tab.label} <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 pt-2 space-y-4">
            {myWorkLoading ? (
              <div className="p-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-sm text-slate-500">Retrieving assigned tasks...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="p-16 text-center border border-dashed border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 font-semibold">Queue Clean & Caught Up</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    No tasks currently match this workboard filter. Excellent work maintaining your workflow.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                      <th className="py-2.5 pb-2">Task / ID</th>
                      <th className="py-2.5 pb-2">Entity Context</th>
                      <th className="py-2.5 pb-2 text-center">Priority</th>
                      <th className="py-2.5 pb-2 text-center">Status</th>
                      <th className="py-2.5 pb-2 text-right">Operations & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssignments.map((assignment: Assignment) => {
                      const isActionActive = activeActionAssignmentId === assignment.id;
                      return (
                        <React.Fragment key={assignment.id}>
                          <tr className={`hover:bg-slate-50/50 transition-colors ${isActionActive ? 'bg-indigo-50/10' : ''}`}>
                            <td className="py-3.5">
                              <div className="font-semibold text-slate-900">{assignment.id}</div>
                              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wide mt-0.5">
                                {assignment.taskType.replace(/_/g, ' ')}
                              </div>
                            </td>
                            <td className="py-3.5">
                              <div className="font-medium text-slate-700 flex items-center gap-1.5">
                                <span>{assignment.entityType} ({assignment.entityId})</span>
                                <a
                                  href={getEntityUrl(assignment.entityType, assignment.entityId)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                  title="Navigate to entity context"
                                >
                                  <ExternalLink className="w-3 h-3 inline" />
                                </a>
                              </div>
                              {assignment.notes && (
                                <div className="text-slate-400 truncate max-w-[250px] text-[10px] mt-0.5" title={assignment.notes}>
                                  {assignment.notes}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 text-center">
                              <AssignmentPriorityBadge priority={assignment.priority} size="sm" />
                            </td>
                            <td className="py-3.5 text-center">
                              <AssignmentStatusBadge status={assignment.status} size="sm" />
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {assignment.status === 'ASSIGNED' && (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleStartAssignment(assignment.id)}
                                    disabled={actionLoadingId === assignment.id}
                                    icon={Play}
                                  >
                                    Start
                                  </Button>
                                )}

                                {assignment.status === 'IN_PROGRESS' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenInlineAction(assignment.id, 'COMPLETE')}
                                      disabled={actionLoadingId === assignment.id}
                                      icon={Check}
                                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    >
                                      Complete
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleOpenInlineAction(assignment.id, 'BLOCK')}
                                      disabled={actionLoadingId === assignment.id}
                                      icon={AlertTriangle}
                                      className="border-rose-200 text-rose-700 hover:bg-rose-50"
                                    >
                                      Block
                                    </Button>
                                  </>
                                )}

                                {assignment.status === 'BLOCKED' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStartAssignment(assignment.id)}
                                    disabled={actionLoadingId === assignment.id}
                                    icon={Play}
                                  >
                                    Resume
                                  </Button>
                                )}

                                <Link to="/my-work">
                                  <Button variant="outline" size="sm">
                                    Detail
                                  </Button>
                                </Link>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded inline prompt form */}
                          {isActionActive && (
                            <tr className="bg-indigo-50/20">
                              <td colSpan={5} className="p-4 border-b border-indigo-100">
                                <div className="flex flex-col gap-3 max-w-lg ml-auto">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                                      {actionType === 'BLOCK' ? (
                                        <>
                                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                          <span>Block Task reason required:</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                          <span>Complete Task feedback (optional):</span>
                                        </>
                                      )}
                                    </span>
                                    <button
                                      onClick={handleCancelInlineAction}
                                      className="text-slate-400 hover:text-slate-600"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <textarea
                                    value={inlineInputText}
                                    onChange={(e) => setInlineInputText(e.target.value)}
                                    placeholder={actionType === 'BLOCK' ? 'Specify the blocker detail...' : 'Record any completion notes or files context...'}
                                    className="text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full"
                                    rows={2}
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCancelInlineAction}
                                      disabled={actionLoadingId === assignment.id}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handleConfirmInlineAction(assignment.id)}
                                      disabled={actionLoadingId === assignment.id}
                                    >
                                      {actionLoadingId === assignment.id ? 'Submitting...' : 'Confirm'}
                                    </Button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Unauthorized / Restricted fallback for non-operational or legacy roles
  const isLegacyRole = user && [UserRole.CREATOR, UserRole.EDITOR].includes(user.role as UserRole);
  const isAllowedOperational = isManagerOrAdmin || isSpecialist;

  if (user && !isAllowedOperational) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <PageHeader
          title="Access Restricted"
          description="Workspace is unavailable for your system credentials."
        />

        <div className="p-16 text-center border border-slate-200 bg-white rounded-xl shadow-xs max-w-lg mx-auto space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Operational Workspace Restricted</h3>
            <p className="text-sm text-slate-500">
              {isLegacyRole
                ? `The role "${user.role}" is a legacy/archived system role maintained exclusively for historical read-only purposes. New operational task allocations or specialized dashboards are blocked.`
                : `Your active role "${user.role}" is not authorized to access operational dashboard pipelines. Please contact your system administrator to adjust your permissions.`}
            </p>
          </div>
          <Link to="/settings">
            <Button variant="outline" size="sm">
              View Your Profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Dashboard Heading + Primary Action Buttons (Studio / Queue) + Protocol link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Content Operations Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowProtocolModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Production Protocol</span>
          </button>
          <Link to="/generate">
            <Button variant="primary" size="sm" icon={Sparkles}>
              AI Question Studio
            </Button>
          </Link>
          <Link to="/queue">
            <Button variant="outline" size="sm" icon={ListOrdered}>
              Video Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Production Protocol Modal (Requirement 3) */}
      {showProtocolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Burra Pariksha Daily Production Protocol</span>
              <button
                type="button"
                onClick={() => setShowProtocolModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                aria-label="Close protocol modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <DailyWorkflowGuide defaultExpanded={true} />
            </div>
          </div>
        </div>
      )}

      {/* 2. Filter Bar */}
      <DashboardFilterBar
        topics={topics}
        selectedTopic={selectedTopic}
        selectedDifficulty={selectedDifficulty}
        selectedPriority={selectedPriority}
        onTopicChange={setSelectedTopic}
        onDifficultyChange={setSelectedDifficulty}
        onPriorityChange={setSelectedPriority}
        onReset={handleResetFilters}
        onRefresh={() => loadOverview(true)}
        isRefreshing={isRefreshing}
      />

      {/* Loading State, Error State, or Render Dashboard Sections */}
      {isLoading && !overview ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">
            Aggregating Content Operations Intelligence...
          </p>
          <p className="text-xs text-slate-400">
            Querying authoritative Google Sheets repositories for pipeline states
          </p>
        </div>
      ) : overviewError && !overview ? (
        <div className="p-12 text-center bg-white rounded-xl border border-rose-200 shadow-xs space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Dashboard Intelligence Unavailable</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">{overviewError}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadOverview(true)}>
            Retry Loading Operations Data
          </Button>
        </div>
      ) : overview ? (
        <div className="space-y-5">
          {/* 3. Production Lifecycle & Question Funnel Visualizer (Consolidated Toggle) */}
          <PipelineVisualizer metrics={overview.metrics} />

          {/* 4. Today's Priority Work Section */}
          <TodaysWorkSection items={overview.todaysWork} />

          {/* 5. Operational Split: Bottleneck Diagnostics & Stale Content Tracking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <BottleneckSection bottlenecks={overview.bottlenecks} />
            <StaleContentSection items={overview.staleContent} />
          </div>

          {/* 6. Team Operations & Workload Intelligence */}
          {overview.teamOperations && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 animate-pulse">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Team Operations & Workload Distribution
                    </h3>
                    <p className="text-xs text-slate-500">
                      {overview.teamOperations.workloadSummary?.totalMembers || 0} active specialists •{' '}
                      {overview.teamOperations.workloadSummary?.totalActiveTasks || 0} tasks in progress •{' '}
                      {overview.teamOperations.unassignedCount} unassigned queue items
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/my-work"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Personal Workbench</span>
                  </Link>

                  <Link
                    to="/team"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <span>Manage Team</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Operational Assignment Metrics KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-1">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">Active Tasks</p>
                  <p className="text-lg font-extrabold text-blue-900 font-mono">
                    {overview.teamOperations.workloadSummary?.totalActiveTasks || overview.teamOperations.totalActiveTasks || 0}
                  </p>
                </div>
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg space-y-1">
                  <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Overdue Tasks</p>
                  <p className="text-lg font-extrabold text-amber-900 font-mono">
                    {overview.teamOperations.workloadSummary?.totalOverdueTasks || overview.teamOperations.totalOverdueTasks || 0}
                  </p>
                </div>
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg space-y-1">
                  <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Blocked Tasks</p>
                  <p className="text-lg font-extrabold text-rose-900 font-mono">
                    {overview.teamOperations.workloadSummary?.totalBlockedTasks || overview.teamOperations.totalBlockedTasks || 0}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Unassigned Queue</p>
                  <p className="text-lg font-extrabold text-slate-900 font-mono">
                    {overview.teamOperations.unassignedCount ?? overview.teamOperations.totalUnassignedTasks ?? 0}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg space-y-1">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Completed (Uploaded)</p>
                  <p className="text-lg font-extrabold text-emerald-900 font-mono">
                    {overview.metrics?.videos?.uploaded || 0}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Workload Distribution by Representative (Top Active)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {overview.teamOperations.workloadSummary?.workloads.slice(0, 4).map((w) => (
                    <div
                      key={w.user.id}
                      className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 space-y-2 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate">{w.user.name}</span>
                        <span className="text-2xs px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-semibold">
                          {w.user.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Active Tasks: <strong>{w.activeAssignments.length}</strong></span>
                        <span className="font-semibold text-slate-700">Score: {w.workloadScore}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            w.workloadScore >= 12
                              ? 'bg-rose-500'
                              : w.workloadScore >= 7
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, w.workloadScore * 7))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. Publishing Readiness Matrix */}
          <PublishingReadinessSection items={overview.publishingReadiness} />

          {/* 6. Recent Questions and Audit Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent Questions Table (2 cols on lg, 1 on mobile) */}
            <div className="lg:col-span-2 space-y-2.5 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Recent Questions in Repository</h3>
                </div>
                <Link
                  to="/questions"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                >
                  <span>View Question Library</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <QuestionTable questions={overview.recentQuestions} />
            </div>

            {/* Audit Log Stream (1 col on lg) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col h-full">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Audit Stream</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {overview.recentAuditLogs.length} events
                </span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 text-xs divide-y divide-slate-100">
                {overview.recentAuditLogs.length > 0 ? (
                  overview.recentAuditLogs.map((act) => (
                    <div key={act.id} className="pt-2 first:pt-0 flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="font-semibold text-slate-900 truncate">
                            {act.actorName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-tight">
                          <span className="capitalize font-medium">{act.action?.toLowerCase()}</span>{' '}
                          <span className="font-mono text-slate-700 font-medium">{act.entityType}</span>{' '}
                          <span className="font-mono text-slate-500 text-[10px]">({act.entityId})</span>
                        </p>
                        {act.details && (
                          <p className="text-[10px] text-slate-400 truncate font-mono">
                            {act.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 py-6 text-center">
                    No recent audit log entries.
                  </div>
                )}
              </div>

              {user?.role === UserRole.ADMIN && (
                <div className="pt-2.5 border-t border-slate-100 text-center mt-auto">
                  <Link
                    to="/settings"
                    className="text-xs text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                  >
                    View Full Database Settings & Diagnostics &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
