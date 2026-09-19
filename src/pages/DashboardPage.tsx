import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import { PageHeader } from '../design-system/components/PageHeader';
import { Button } from '../design-system/components/Button';
import { Alert } from '../design-system/components/Alert';
import { ErrorState } from '../design-system/components/ErrorState';
import { ContinueProductionCard, ActionableProductionItem } from '../components/dashboard/ContinueProductionCard';
import { WhatsWaitingSection, WaitingCounts } from '../components/dashboard/WhatsWaitingSection';
import { ChannelPerformanceSection } from '../components/dashboard/ChannelPerformanceSection';
import {
  DashboardOverviewData,
  SocialAnalyticsSummary,
  Question,
  Video,
  UserRole,
} from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core Presentation Data State
  const [continueItem, setContinueItem] = useState<ActionableProductionItem | null>(null);
  const [waitingCounts, setWaitingCounts] = useState<WaitingCounts>({
    questionsToReview: 0,
    scriptsToReview: 0,
    videosToEdit: 0,
    socialReviews: 0,
    readyToPublish: 0,
  });
  const [analyticsSummary, setAnalyticsSummary] = useState<SocialAnalyticsSummary | null>(null);
  const [analyticsUnavailable, setAnalyticsUnavailable] = useState<boolean>(false);

  /**
   * Deterministic resolution of current actionable production item:
   * Rule 1: Check user's assigned active tasks from getMyWork().
   * Rule 2: Check system-wide todaysWork from getDashboardOverview().
   * Rule 3: Check in-flight videos from getVideos() in stage order.
   * Rule 4: Check in-flight questions from getQuestions().
   * Rule 5: If none, return null (renders "No production in progress").
   */
  const resolveDeterministicContinueItem = (
    overviewData: DashboardOverviewData | null,
    myWorkData: any | null,
    inFlightVideos: Video[],
    inFlightQuestions: Question[]
  ): ActionableProductionItem | null => {
    // 1. Check user personal assignments (highest urgency first)
    if (myWorkData) {
      const activeAssignments = [
        ...(myWorkData.overdue || []),
        ...(myWorkData.dueToday || []),
        ...(myWorkData.highPriority || []),
        ...(myWorkData.inProgress || []),
      ];

      if (activeAssignments.length > 0) {
        const topTask = activeAssignments[0];
        // Resolve target step based on entity and task type
        if (topTask.entityType === 'QUESTION' || topTask.questionId) {
          const qId = topTask.questionId || topTask.entityId;
          const stepInfo = mapQuestionStatusToStep('GENERATED', qId);
          return {
            id: qId,
            title: topTask.title || `Question Task: ${topTask.type || 'Review'}`,
            stepNumber: stepInfo.number,
            stepName: stepInfo.name,
            stageCategory: 'QUESTION',
            priority: topTask.priority || 'HIGH',
            reason: topTask.description || 'Assigned to your queue',
            targetUrl: stepInfo.url,
          };
        } else if (topTask.entityType === 'VIDEO' || topTask.videoId) {
          const vId = topTask.videoId || topTask.entityId;
          const status = topTask.stage || topTask.status || 'EDITING';
          const stepInfo = mapVideoStatusToStep(status, vId);
          return {
            id: vId,
            title: topTask.title || `Video Production: ${stepInfo.name}`,
            stepNumber: stepInfo.number,
            stepName: stepInfo.name,
            stageCategory: 'VIDEO',
            priority: topTask.priority || 'HIGH',
            reason: topTask.description || 'Assigned production item',
            targetUrl: stepInfo.url,
          };
        }
      }
    }

    // 2. Check system-wide todaysWork from overview
    if (overviewData?.todaysWork && overviewData.todaysWork.length > 0) {
      // Deterministically sort by priority weight then age
      const priorityWeights: Record<string, number> = {
        URGENT: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
        NORMAL: 1,
      };

      const sorted = [...overviewData.todaysWork].sort((a, b) => {
        const pDiff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
        return (b.ageDays || 0) - (a.ageDays || 0);
      });

      const topItem = sorted[0];
      const isVideo = topItem.entityType === 'VIDEO';
      const stepInfo = isVideo
        ? mapVideoStatusToStep(topItem.currentStatus, topItem.id)
        : mapQuestionStatusToStep(topItem.currentStatus, topItem.id);

      return {
        id: topItem.id,
        title: topItem.title || 'In-Progress Production Batch',
        stepNumber: stepInfo.number,
        stepName: stepInfo.name,
        stageCategory: isVideo ? 'VIDEO' : 'QUESTION',
        topic: topItem.topic,
        priority: topItem.priority,
        ageDays: topItem.ageDays,
        reason: topItem.reason || topItem.recommendedAction,
        targetUrl: topItem.actionUrl || stepInfo.url,
      };
    }

    // 3. Check active in-flight videos (Stage precedence: Edit > Script > Record > Final Review > Upload)
    const activeVideos = (inFlightVideos || []).filter(
      (v) =>
        v.status &&
        !['PUBLISHED', 'ARCHIVED', 'CANCELLED', 'ON_HOLD'].includes(v.status as string)
    );

    if (activeVideos.length > 0) {
      // Stage ranking priority: items closer to release first
      const stageRank: Record<string, number> = {
        FINAL_REVIEW: 7,
        EDITING: 6,
        RECORDED: 5,
        RECORDING: 4,
        SCRIPT_READY: 3,
        SCRIPT_REQUIRED: 2,
        QUEUED: 1,
        READY_TO_UPLOAD: 8,
        UPLOADED: 9,
      };

      const sortedVideos = [...activeVideos].sort((a, b) => {
        const rDiff = (stageRank[b.status] || 0) - (stageRank[a.status] || 0);
        if (rDiff !== 0) return rDiff;
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      });

      const v = sortedVideos[0];
      const stepInfo = mapVideoStatusToStep(v.status, v.id);
      return {
        id: v.id,
        title: v.title || `Video ${v.id}`,
        stepNumber: stepInfo.number,
        stepName: stepInfo.name,
        stageCategory: 'VIDEO',
        topic: v.question?.topicId || 'Aptitude',
        subtopic: v.question?.subtopicId,
        priority: v.priority || 'HIGH',
        targetUrl: stepInfo.url,
      };
    }

    // 4. Check active in-flight questions
    const pendingQuestions = (inFlightQuestions || []).filter(
      (q) => q.status === 'GENERATED' || q.status === 'DRAFT'
    );

    if (pendingQuestions.length > 0) {
      const q = pendingQuestions[0];
      const stepInfo = mapQuestionStatusToStep(q.status, q.id);
      return {
        id: q.id,
        title: q.questionText || `Question ${q.id}`,
        stepNumber: stepInfo.number,
        stepName: stepInfo.name,
        stageCategory: 'QUESTION',
        topic: q.topicId || 'Aptitude',
        subtopic: q.subtopicId,
        priority: 'MEDIUM',
        targetUrl: stepInfo.url,
      };
    }

    // 5. Zero work in flight
    return null;
  };

  const mapVideoStatusToStep = (status: string, videoId?: string) => {
    switch (status) {
      case 'SCRIPT_REQUIRED':
        return {
          number: '03',
          name: 'Audience Script',
          url: videoId ? `/videos/${videoId}?tab=script` : '/production?status=SCRIPT_REQUIRED',
        };
      case 'SCRIPT_READY':
      case 'RECORDING':
        return {
          number: '04',
          name: 'Teleprompter & Filming',
          url: videoId ? `/videos/${videoId}?tab=recording` : '/production?status=SCRIPT_READY',
        };
      case 'RECORDED':
      case 'EDITING':
        return {
          number: '05',
          name: 'Video Editing Bay',
          url: videoId ? `/videos/${videoId}?tab=editing` : '/production?status=EDITING',
        };
      case 'EDITED':
      case 'FINAL_REVIEW':
        return {
          number: '06',
          name: 'Final QC Lock',
          url: videoId ? `/videos/${videoId}?tab=final-review` : '/production?status=FINAL_REVIEW',
        };
      case 'READY_TO_UPLOAD':
        return {
          number: '07',
          name: 'Social Simulator',
          url: videoId ? `/videos/${videoId}?tab=social` : '/production?status=READY_TO_UPLOAD',
        };
      case 'UPLOADED':
        return {
          number: '08',
          name: 'Release Station',
          url: videoId ? `/videos/${videoId}?tab=publishing` : '/production?status=UPLOADED',
        };
      default:
        return {
          number: '05',
          name: 'Video Editing Bay',
          url: videoId ? `/videos/${videoId}?tab=editing` : '/production',
        };
    }
  };

  const mapQuestionStatusToStep = (status: string, questionId?: string) => {
    switch (status) {
      case 'DRAFT':
        return {
          number: '01',
          name: 'Question Studio',
          url: questionId ? `/questions/${questionId}` : '/studio',
        };
      case 'GENERATED':
      default:
        return {
          number: '02',
          name: 'Review & Approve',
          url: questionId ? `/questions/${questionId}/verify` : '/questions?status=GENERATED',
        };
    }
  };

  // Load authoritative data
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      // 1. Fetch overview metrics & today's work
      let overview: DashboardOverviewData | null = null;
      try {
        overview = await apiClient.getDashboardOverview();
      } catch (err: any) {
        console.warn('Dashboard overview fetch error:', err?.message);
      }

      // 2. Fetch my work assignments for current user
      let myWork: any = null;
      if (user?.id) {
        try {
          myWork = await apiClient.getMyWork(user.id);
        } catch {
          // Graceful fallback if no personal queue
        }
      }

      // 3. Fetch in-flight questions & videos for deterministic item check & counts
      let questions: Question[] = [];
      let videos: Video[] = [];
      try {
        const [qRes, vRes] = await Promise.all([
          apiClient.getQuestions().catch(() => []),
          apiClient.getVideos().catch(() => []),
        ]);
        questions = qRes || [];
        videos = vRes || [];
      } catch {
        // Fallback to empty arrays
      }

      // 4. Fetch social review pending count
      let pendingSocialReviewsCount = 0;
      try {
        const res = await apiClient.getSocialReviewsList().catch(() => ({ success: false, data: [] }));
        const reviews = res?.data || [];
        pendingSocialReviewsCount = reviews.filter(
          (r: any) => r.decision === 'PENDING_REVIEW' || r.status === 'SUBMITTED' || r.decision === 'DRAFT'
        ).length;
      } catch {
        pendingSocialReviewsCount = 0;
      }

      // Compute What's Waiting counts from authoritative data
      const qReviewCount =
        overview?.metrics?.questions?.generated ??
        questions.filter((q) => q.status === 'GENERATED').length;

      const sReviewCount =
        overview?.metrics?.videos?.scriptReady ??
        videos.filter((v) => v.status === 'SCRIPT_READY').length;

      const vEditCount =
        overview?.metrics?.videos?.editing ??
        videos.filter((v) => v.status === 'EDITING').length;

      const readyPublishCount =
        overview?.metrics?.videos?.readyToUpload ??
        overview?.metrics?.publishing?.ready ??
        videos.filter((v) => v.status === 'READY_TO_UPLOAD').length;

      setWaitingCounts({
        questionsToReview: Math.max(0, qReviewCount),
        scriptsToReview: Math.max(0, sReviewCount),
        videosToEdit: Math.max(0, vEditCount),
        socialReviews: Math.max(0, pendingSocialReviewsCount),
        readyToPublish: Math.max(0, readyPublishCount),
      });

      // Compute deterministic continue production item
      const resolvedItem = resolveDeterministicContinueItem(overview, myWork, videos, questions);
      setContinueItem(resolvedItem);

      // 5. Fetch separate Analytics data layer
      try {
        const res = await apiClient.getSocialAnalyticsSummary();
        const analytics = res?.summary;
        if (analytics && analytics.totalRecords > 0) {
          setAnalyticsSummary(analytics);
          setAnalyticsUnavailable(false);
        } else {
          setAnalyticsSummary(null);
          setAnalyticsUnavailable(true);
        }
      } catch {
        setAnalyticsSummary(null);
        setAnalyticsUnavailable(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load dashboard data. Please check connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (errorMessage && !continueItem && !waitingCounts) {
    return (
      <div className="py-8">
        <ErrorState
          title="Dashboard Unavailable"
          message={errorMessage}
          retryLabel="Try Again"
          onRetry={() => loadDashboardData(true)}
        />
      </div>
    );
  }

  return (
    <div id="dashboard-home-container" className="space-y-8 animate-in fade-in-50 duration-150">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Your production control center. Review active work, queues, and channel performance."
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Dashboard' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 font-medium text-xs text-slate-700 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        }
      />

      {/* Optional Warning Banner if non-fatal partial error occurred */}
      {errorMessage && (
        <Alert
          variant="warning"
          title="Notice"
          onDismiss={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Alert>
      )}

      {/* SECTION A: CONTINUE PRODUCTION (What do I need to do?) */}
      <section id="section-continue-production" aria-label="Continue Production">
        <ContinueProductionCard
          item={continueItem}
          isLoading={isLoading}
        />
      </section>

      {/* SECTION B: WHAT'S WAITING (What's waiting?) */}
      <section id="section-whats-waiting" aria-label="What's Waiting">
        <WhatsWaitingSection
          counts={waitingCounts}
          userRole={user?.role}
          isLoading={isLoading}
        />
      </section>

      {/* SECTION C: HOW IS THE CHANNEL PERFORMING? (How is the channel performing?) */}
      <section id="section-channel-performance" aria-label="Channel Performance">
        <ChannelPerformanceSection
          summary={analyticsSummary}
          isLoading={isLoading}
          isUnavailable={analyticsUnavailable}
        />
      </section>

      {/* Subtle Secondary Operations Quicklinks for Managers/Admins */}
      <div
        id="dashboard-secondary-links"
        className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Secondary Management:</span>
          <Link
            to="/planning"
            className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
          >
            Planning & Batches
          </Link>
          <span>•</span>
          <Link
            to="/content-masters"
            className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
          >
            Content Masters
          </Link>
          {user?.role === UserRole.ADMIN && (
            <>
              <span>•</span>
              <Link
                to="/recovery"
                className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
              >
                System Admin & Integrity
              </Link>
            </>
          )}
        </div>

        <span className="text-[11px] text-slate-400 font-mono">
          Authoritative Persistence: Google Sheets DB
        </span>
      </div>
    </div>
  );
};
