import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';
import { Button } from '../design-system/components/Button';
import { Alert } from '../design-system/components/Alert';
import { ErrorState } from '../design-system/components/ErrorState';

import { ExecutiveHeroBanner } from '../components/dashboard/ExecutiveHeroBanner';
import { ExecutiveVitalsBento } from '../components/dashboard/ExecutiveVitalsBento';
import { ConveyorBeltVisualizer, ConveyorStageCounts } from '../components/dashboard/ConveyorBeltVisualizer';
import { OperationalDispatch } from '../components/dashboard/OperationalDispatch';
import { RecentAuditFeed } from '../components/dashboard/RecentAuditFeed';
import { ActionableProductionItem } from '../components/dashboard/ContinueProductionCard';
import { WaitingCounts } from '../components/dashboard/WhatsWaitingSection';

import {
  AuditLog,
  DashboardOverviewData,
  Question,
  Video,
  UserRole,
} from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core Data States
  const [continueItem, setContinueItem] = useState<ActionableProductionItem | null>(null);
  const [waitingCounts, setWaitingCounts] = useState<WaitingCounts>({
    questionsToReview: 0,
    scriptsToReview: 0,
    videosToEdit: 0,
    socialReviews: 0,
    readyToPublish: 0,
  });

  const [conveyorCounts, setConveyorCounts] = useState<ConveyorStageCounts>({
    draftQuestions: 0,
    generatedQuestions: 0,
    scriptRequiredVideos: 0,
    scriptReadyVideos: 0,
    editingVideos: 0,
    qcLockVideos: 0,
    socialSimVideos: 0,
    liveVideos: 0,
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [producedTodayCount, setProducedTodayCount] = useState<number>(0);
  const [totalInFlightCount, setTotalInFlightCount] = useState<number>(0);

  // Deterministic resolution of current actionable production item
  const resolveContinueItem = (
    overviewData: DashboardOverviewData | null,
    myWorkData: any | null,
    inFlightVideos: Video[],
    inFlightQuestions: Question[]
  ): ActionableProductionItem | null => {
    // 1. Check user personal assignments
    if (myWorkData) {
      const activeAssignments = [
        ...(myWorkData.overdue || []),
        ...(myWorkData.dueToday || []),
        ...(myWorkData.highPriority || []),
        ...(myWorkData.inProgress || []),
      ];

      if (activeAssignments.length > 0) {
        const topTask = activeAssignments[0];
        if (topTask.entityType === 'QUESTION' || topTask.questionId) {
          const qId = topTask.questionId || topTask.entityId;
          return {
            id: qId,
            title: topTask.title || `Question Task: ${topTask.type || 'Review'}`,
            stepNumber: '02',
            stepName: 'Review & Approve',
            stageCategory: 'QUESTION',
            priority: topTask.priority || 'HIGH',
            reason: topTask.description || 'Assigned to your queue',
            targetUrl: `/questions/${qId}/verify`,
          };
        } else if (topTask.entityType === 'VIDEO' || topTask.videoId) {
          const vId = topTask.videoId || topTask.entityId;
          const status = topTask.stage || topTask.status || 'EDITING';
          return {
            id: vId,
            title: topTask.title || 'Video Production Item',
            stepNumber: '05',
            stepName: 'Video Editing Bay',
            stageCategory: 'VIDEO',
            priority: topTask.priority || 'HIGH',
            reason: topTask.description || 'Assigned production item',
            targetUrl: `/videos/${vId}?tab=editing`,
          };
        }
      }
    }

    // 2. Check in-flight videos (highest priority first)
    const activeVideos = (inFlightVideos || []).filter(
      (v) => v.status && !['PUBLISHED', 'ARCHIVED', 'CANCELLED', 'ON_HOLD'].includes(v.status as string)
    );

    if (activeVideos.length > 0) {
      const v = activeVideos[0];
      return {
        id: v.id,
        title: v.title || `Video ${v.id}`,
        stepNumber: v.status === 'SCRIPT_READY' ? '04' : '05',
        stepName: v.status === 'SCRIPT_READY' ? 'Teleprompter & Filming' : 'Video Editing Bay',
        stageCategory: 'VIDEO',
        topic: v.question?.topicId || 'Aptitude',
        priority: v.priority || 'HIGH',
        targetUrl: v.status === 'SCRIPT_READY' ? `/videos/${v.id}?tab=recording` : `/videos/${v.id}?tab=editing`,
      };
    }

    // 3. Check in-flight questions
    const pendingQuestions = (inFlightQuestions || []).filter(
      (q) => q.status === 'GENERATED' || q.status === 'DRAFT'
    );

    if (pendingQuestions.length > 0) {
      const q = pendingQuestions[0];
      return {
        id: q.id,
        title: q.questionText || `Question ${q.id}`,
        stepNumber: q.status === 'DRAFT' ? '01' : '02',
        stepName: q.status === 'DRAFT' ? 'Question Studio' : 'Review & Approve',
        stageCategory: 'QUESTION',
        topic: q.topicId || 'Aptitude',
        priority: 'MEDIUM',
        targetUrl: q.status === 'DRAFT' ? `/questions/${q.id}` : `/questions/${q.id}/verify`,
      };
    }

    return null;
  };

  // Load Authoritative Data
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      // 1. Parallel fetch of overview, myWork, questions, videos, audit logs, social reviews
      const [
        overviewRes,
        myWorkRes,
        qRes,
        vRes,
        auditRes,
        socialReviewRes,
      ] = await Promise.all([
        apiClient.getDashboardOverview().catch(() => null),
        user?.id ? apiClient.getMyWork(user.id).catch(() => null) : Promise.resolve(null),
        apiClient.getQuestions().catch(() => []),
        apiClient.getVideos().catch(() => []),
        apiClient.getAuditLogs().catch(() => []),
        apiClient.getSocialReviewsList().catch(() => ({ success: false, data: [] })),
      ]);

      const questions: Question[] = qRes || [];
      const videos: Video[] = vRes || [];
      const logs: AuditLog[] = auditRes || [];
      const reviews = socialReviewRes?.data || [];

      setAuditLogs(logs);

      // Compute Today's Production Count (videos created or updated today)
      const todayStr = new Date().toDateString();
      const producedToday = videos.filter(
        (v) =>
          (v.createdAt && new Date(v.createdAt).toDateString() === todayStr) ||
          (v.status === 'UPLOADED' && v.updatedAt && new Date(v.updatedAt).toDateString() === todayStr)
      ).length;
      setProducedTodayCount(producedToday);

      // Compute Stage Counts for Conveyor Belt
      const draftQ = questions.filter((q) => q.status === 'DRAFT').length;
      const genQ = questions.filter((q) => q.status === 'GENERATED').length;
      const scriptReqV = videos.filter((v) => v.status === 'SCRIPT_REQUIRED').length;
      const scriptReadyV = videos.filter((v) => v.status === 'SCRIPT_READY').length;
      const editingV = videos.filter((v) => v.status === 'EDITING').length;
      const qcLockV = videos.filter((v) => v.status === 'FINAL_REVIEW' || v.status === 'EDITED').length;
      const socialSimV = videos.filter((v) => v.status === 'READY_TO_UPLOAD').length;
      const liveV = videos.filter((v) => v.status === 'UPLOADED').length;

      setConveyorCounts({
        draftQuestions: draftQ,
        generatedQuestions: genQ,
        scriptRequiredVideos: scriptReqV,
        scriptReadyVideos: scriptReadyV,
        editingVideos: editingV,
        qcLockVideos: qcLockV,
        socialSimVideos: socialSimV,
        liveVideos: liveV,
      });

      // Total in-flight count
      const activeQ = questions.filter((q) => q.status === 'DRAFT' || q.status === 'GENERATED' || q.status === 'EDITING').length;
      const activeV = videos.filter((v) => v.status && !['PUBLISHED', 'ARCHIVED', 'CANCELLED', 'ON_HOLD'].includes(v.status as string)).length;
      setTotalInFlightCount(activeQ + activeV);

      // What's Waiting Counts
      const pendingSocialCount = reviews.filter(
        (r: any) => r.decision === 'PENDING_REVIEW' || r.status === 'SUBMITTED' || r.decision === 'DRAFT'
      ).length;

      setWaitingCounts({
        questionsToReview: genQ,
        scriptsToReview: scriptReadyV,
        videosToEdit: editingV,
        socialReviews: pendingSocialCount,
        readyToPublish: socialSimV,
      });

      // Resolve Continue Item
      const resolved = resolveContinueItem(overviewRes, myWorkRes, videos, questions);
      setContinueItem(resolved);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load executive dashboard data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (errorMessage && !conveyorCounts) {
    return (
      <div className="py-8">
        <ErrorState
          title="Executive Dashboard Unavailable"
          message={errorMessage}
          retryLabel="Retry Connection"
          onRetry={() => loadDashboardData(true)}
        />
      </div>
    );
  }

  return (
    <div id="executive-dashboard-container" className="space-y-6 animate-in fade-in-50 duration-200 pb-8">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Burra Pariksha Executive Studio Control
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadDashboardData(true)}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-1.5 font-semibold text-xs text-slate-700 bg-white shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Command Center'}</span>
        </Button>
      </div>

      {/* Optional Warning Banner if non-fatal error */}
      {errorMessage && (
        <Alert variant="warning" title="Notice" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* 1. EXECUTIVE HERO BANNER */}
      <section id="section-executive-hero" aria-label="Executive Hero Banner">
        <ExecutiveHeroBanner
          user={user}
          producedTodayCount={producedTodayCount}
          dailyGoal={3}
        />
      </section>

      {/* 2. EXECUTIVE VITALS BENTO GRID */}
      <section id="section-vitals-bento" aria-label="Executive Vitals Bento Grid">
        <ExecutiveVitalsBento
          totalTopics={100}
          totalSubtopics={100}
          saturationPct={0}
          activeInFlightCount={totalInFlightCount}
          isLoading={isLoading}
        />
      </section>

      {/* 3. LIVE PRODUCTION CONVEYOR BELT */}
      <section id="section-conveyor-belt" aria-label="Live Production Conveyor Belt">
        <ConveyorBeltVisualizer
          counts={conveyorCounts}
          isLoading={isLoading}
        />
      </section>

      {/* 4. TWO-COLUMN OPERATIONAL DISPATCH (65% / 35% Split) */}
      <section id="section-operational-dispatch" aria-label="Operational Dispatch">
        <OperationalDispatch
          continueItem={continueItem}
          waitingCounts={waitingCounts}
          isLoading={isLoading}
        />
      </section>

      {/* 5. RECENT ACTIVITY & AUDIT FEED */}
      <section id="section-recent-audit" aria-label="Recent Audit Feed">
        <RecentAuditFeed
          logs={auditLogs}
          isLoading={isLoading}
        />
      </section>

      {/* 6. SECONDARY MANAGEMENT DISPATCH FOOTER */}
      <div
        id="dashboard-secondary-links"
        className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Quick Operations Jump:</span>
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
          Authoritative Engine: Google Sheets DB & Gemini AI Studio
        </span>
      </div>
    </div>
  );
};
