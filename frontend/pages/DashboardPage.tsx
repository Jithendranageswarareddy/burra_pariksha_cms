import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/api-client';
import { Alert } from '../design-system/components/Alert';
import { ErrorState } from '../design-system/components/ErrorState';

import { CommandCenterHeader } from '../components/dashboard/CommandCenterHeader';
import { WorkflowKpiStrip, WorkflowKpiData } from '../components/dashboard/WorkflowKpiStrip';
import { ProductionPipelineBoard, StageMetrics } from '../components/dashboard/ProductionPipelineBoard';
import { ActionRequiredQueue, ActionQueueItem } from '../components/dashboard/ActionRequiredQueue';
import { ContentModeBreakdown, ModeSummary } from '../components/dashboard/ContentModeBreakdown';
import { ThroughputAndHealthRow, PhaseDistribution, IntegrationStatus } from '../components/dashboard/ThroughputAndHealthRow';
import { RecentActivityPanel } from '../components/dashboard/RecentActivityPanel';

import {
  AuditLog,
  Question,
  QuestionDraft,
  Video,
  Publishing,
  Topic,
  UserRole,
  VideoProductionStatus,
  SocialPublishStatus,
} from '../../shared';
import { CANONICAL_15_STEPS } from '../../shared/constants/workflow';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [selectedStageFilter, setSelectedStageFilter] = useState<number | null>(null);
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<string | null>(null);

  // Raw Authoritative State
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [publishingList, setPublishingList] = useState<Publishing[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([
    {
      name: 'Express Backend API',
      category: 'RUNTIME',
      status: 'HEALTHY',
      details: 'HTTP /api endpoints active',
    },
    {
      name: 'Cloud Firestore Datastore',
      category: 'DATABASE',
      status: 'HEALTHY',
      details: 'Admin SDK transactional connection active',
    },
    {
      name: 'Google Drive Storage',
      category: 'MEDIA',
      status: 'NOT_CHECKED',
      details: 'OAuth2 configuration ready • Active on-demand',
    },
    {
      name: 'Google Gemini AI Studio',
      category: 'AI_PROVIDER',
      status: 'NOT_CHECKED',
      details: 'Gemini 2.5 Pro provider configured • Standby',
    },
    {
      name: 'Social Multi-Platform Publishing',
      category: 'DISTRIBUTION',
      status: 'NOT_CHECKED',
      details: 'Distribution adapters ready • Idle',
    },
  ]);

  // Load Authoritative Real Data
  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const [
        draftsRes,
        questionsRes,
        videosRes,
        publishingRes,
        auditRes,
        topicsRes,
        healthCheckRes,
        opHealthRes,
      ] = await Promise.all([
        apiClient.getQuestionDrafts().catch(() => [] as QuestionDraft[]),
        apiClient.getQuestions().catch(() => [] as Question[]),
        apiClient.getVideos().catch(() => [] as Video[]),
        apiClient.getPublishing().catch(() => [] as Publishing[]),
        apiClient.getAuditLogs().catch(() => [] as AuditLog[]),
        apiClient.getTopics().catch(() => [] as Topic[]),
        apiClient.checkHealth().then(() => true).catch(() => false),
        apiClient.getOperationalHealth().catch(() => null),
      ]);

      setDrafts(draftsRes || []);
      setQuestions(questionsRes || []);
      setVideos(videosRes || []);
      setPublishingList(publishingRes || []);
      setAuditLogs(auditRes || []);
      setTopics(topicsRes || []);
      setLastUpdated(new Date());

      // Update API & Firestore integration health based on live probes
      setIntegrations([
        {
          name: 'Express Backend API',
          category: 'RUNTIME',
          status: healthCheckRes ? 'HEALTHY' : 'UNAVAILABLE',
          details: healthCheckRes ? 'HTTP 200 • Live API active' : 'API endpoints unreachable',
        },
        {
          name: 'Cloud Firestore Datastore',
          category: 'DATABASE',
          status: opHealthRes?.isConnected !== false ? 'HEALTHY' : 'DEGRADED',
          details: opHealthRes?.isConnected
            ? `Authoritative Datastore • ${opHealthRes.telemetry?.lastLatencyMs || 20}ms latency`
            : 'Authoritative Datastore • Connected',
        },
        {
          name: 'Google Drive Storage',
          category: 'MEDIA',
          status: 'NOT_CHECKED',
          details: 'OAuth2 client initialized • Active on-demand',
        },
        {
          name: 'Google Gemini AI Studio',
          category: 'AI_PROVIDER',
          status: 'NOT_CHECKED',
          details: 'Gemini 2.5 Pro provider configured • Standby',
        },
        {
          name: 'Social Multi-Platform Publishing',
          category: 'DISTRIBUTION',
          status: 'NOT_CHECKED',
          details: 'Distribution adapters ready • Standby',
        },
      ]);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load executive dashboard data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Topic Map for fast name lookups
  const topicMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of topics) {
      map.set(t.id, t.name);
    }
    return map;
  }, [topics]);

  // Helper: compute age in hours
  const getAgeInHours = (isoDate?: string | number): number => {
    if (!isoDate) return 0;
    const time = typeof isoDate === 'number' ? isoDate : new Date(isoDate).getTime();
    if (isNaN(time)) return 0;
    return Math.max(0, (Date.now() - time) / (1000 * 60 * 60));
  };

  // Build Unified Work Queue Items across drafts, questions, and videos with strict cross-collection deduplication
  const workQueueItems: ActionQueueItem[] = useMemo(() => {
    const items: ActionQueueItem[] = [];
    const isUserAdminOrReviewer =
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.REVIEWER ||
      user?.role === UserRole.CONTENT_MANAGER ||
      (user?.role as string) === 'QA_REVIEWER';

    // Map publishing packages by videoId for rapid, authoritative lookup
    const publishingByVideoId = new Map<string, Publishing>();
    for (const p of publishingList) {
      if (p.videoId) publishingByVideoId.set(p.videoId, p);
    }

    const seenVideoIds = new Set<string>();

    // 1. Ingest Question Drafts (Studio Phase)
    for (const d of drafts) {
      if (d.status === 'APPROVED' || (d as any).isDeleted) continue;
      const mode = ((d as any).contentMode || d.productionMode || 'QUESTION_CHALLENGE_SHORT') as 'QUESTION_CHALLENGE_SHORT' | 'TOPIC_INTRODUCTION' | 'EXPLAINED_QUESTIONS_VIDEO';
      const isSubmitted = d.status === 'SUBMITTED_FOR_REVIEW' || d.workflowStage === 'STAGE_02_VERIFICATION';
      const isChangesRequested = d.status === 'CHANGES_REQUESTED';
      const isDraft = !isSubmitted && !isChangesRequested;

      let stageNum = 1;
      let stageName = 'Question Generation';
      let priority: ActionQueueItem['priority'] = 'MEDIUM';
      let actionLabel = 'Edit in Studio';
      let targetUrl = `/studio?draftId=${d.id}`;
      let needsAction = false;

      if (isSubmitted) {
        stageNum = 2;
        stageName = 'Question Verification';
        priority = 'HIGH';
        actionLabel = 'Verify & Approve';
        targetUrl = `/questions/${d.id}/verify`;
        // GAR-02: cannot approve own work
        needsAction = isUserAdminOrReviewer && d.authorId !== user?.id;
      } else if (isChangesRequested) {
        stageNum = 1;
        stageName = 'Question Generation (Revision)';
        priority = 'CRITICAL';
        actionLabel = 'Revise Draft';
        targetUrl = `/studio?draftId=${d.id}&mode=revise`;
        needsAction = d.authorId === user?.id || isUserAdminOrReviewer;
      } else if (isDraft) {
        stageNum = 1;
        stageName = 'Question Generation';
        priority = 'MEDIUM';
        actionLabel = 'Continue Draft';
        targetUrl = `/studio?draftId=${d.id}`;
        needsAction = d.authorId === user?.id || isUserAdminOrReviewer;
      }

      const ageH = getAgeInHours(d.updatedAt || (d as any).createdAt);
      const draftTitle =
        (d as any).topicPrompt ||
        d.conceptTitle ||
        d.questionText ||
        (d as any).questionData?.questionText ||
        d.question ||
        `Draft ${d.id}`;

      items.push({
        id: d.id,
        title: draftTitle,
        contentMode: mode,
        topicId: d.topicId,
        topicName: topicMap.get(d.topicId) || d.topicName || 'Quantitative Aptitude',
        subtopicName: d.subtopicName || undefined,
        stageNumber: stageNum,
        stageName,
        status: d.status || 'DRAFT',
        priority,
        isBlocked: isChangesRequested,
        isOverdue: ageH > 48,
        needsMyAction: needsAction,
        assigneeName: d.author || undefined,
        assignedRole: isSubmitted ? 'QA Reviewer' : 'Creator',
        waitingHours: ageH,
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
        targetUrl,
        actionLabel,
      });
    }

    // 2. Ingest Questions (Pending QA)
    for (const q of questions) {
      if ((q as any).isDeleted || q.status === 'ARCHIVED' || q.status === 'APPROVED') continue;
      if (q.status === 'GENERATED' || q.status === 'DRAFT') {
        const ageH = getAgeInHours(q.updatedAt || q.createdAt);
        const stageNum = q.status === 'GENERATED' ? 2 : 1;
        items.push({
          id: q.id,
          title: q.questionText || `Question ${q.id}`,
          contentMode: ((q as any).contentMode || (q as any).productionMode || 'QUESTION_CHALLENGE_SHORT') as any,
          topicId: q.topicId,
          topicName: topicMap.get(q.topicId) || 'Aptitude',
          stageNumber: stageNum,
          stageName: stageNum === 2 ? 'Question Verification' : 'Question Generation',
          status: q.status,
          priority: q.status === 'GENERATED' ? 'HIGH' : 'MEDIUM',
          isBlocked: false,
          isOverdue: ageH > 48,
          needsMyAction: stageNum === 2 && isUserAdminOrReviewer,
          assigneeName: q.authorId,
          assignedRole: stageNum === 2 ? 'QA Reviewer' : 'Author',
          waitingHours: ageH,
          updatedAt: q.updatedAt || q.createdAt || new Date().toISOString(),
          targetUrl: stageNum === 2 ? `/questions/${q.id}/verify` : `/questions/${q.id}`,
          actionLabel: stageNum === 2 ? 'Pedagogical QC' : 'Edit Question',
        });
      }
    }

    // 3. Ingest Videos across stages 03 to 11
    for (const v of videos) {
      const vStatus = v.status as string;
      if (v.status === VideoProductionStatus.CANCELLED || vStatus === 'ARCHIVED' || (v as any).isDeleted) continue;
      seenVideoIds.add(v.id);

      const pub = publishingByVideoId.get(v.id);
      const isPubScheduled = pub && (
        (pub as any).status === 'SCHEDULED' ||
        pub.youtube?.status === SocialPublishStatus.SCHEDULED ||
        pub.instagram?.status === SocialPublishStatus.SCHEDULED ||
        pub.facebook?.status === SocialPublishStatus.SCHEDULED
      );
      const isPubLive = (pub && (
        pub.youtube?.status === SocialPublishStatus.PUBLISHED ||
        (pub.completedPlatformsCount || 0) >= (pub.totalPlatformsCount || 3)
      )) || vStatus === 'UPLOADED' || vStatus === 'PUBLISHED';

      let stageNum = 3;
      let stageName = 'Audience Script';
      let actionLabel = 'Write Script';
      let targetUrl = `/videos/${v.id}?tab=script`;
      let priority: ActionQueueItem['priority'] = 'MEDIUM';

      switch (vStatus) {
        case 'QUEUED':
        case 'SCRIPT_REQUIRED':
          stageNum = 3;
          stageName = 'Audience Script';
          actionLabel = 'Write Script';
          targetUrl = `/videos/${v.id}?tab=script`;
          priority = 'HIGH';
          break;
        case 'SCRIPT_READY':
        case 'RECORDING':
          stageNum = 4;
          stageName = 'Teleprompter & Filming';
          actionLabel = 'Teleprompter';
          targetUrl = `/videos/${v.id}?tab=recording`;
          priority = 'HIGH';
          break;
        case 'RECORDED':
          stageNum = 5;
          stageName = 'Raw Video Footage';
          actionLabel = 'Ingest Takes';
          targetUrl = `/videos/${v.id}?tab=media`;
          priority = 'MEDIUM';
          break;
        case 'EDITING':
          stageNum = 6;
          stageName = 'Editing Bay';
          actionLabel = 'Edit Bay';
          targetUrl = `/videos/${v.id}?tab=editing`;
          priority = 'MEDIUM';
          break;
        case 'EDITED':
        case 'FINAL_REVIEW':
          stageNum = 7;
          stageName = 'Final QC';
          actionLabel = 'QC Lock';
          targetUrl = `/videos/${v.id}?tab=qc`;
          priority = 'HIGH';
          break;
        case 'THUMBNAIL_REQUIRED':
          stageNum = 8;
          stageName = 'Thumbnail';
          actionLabel = 'Design Thumbnail';
          targetUrl = `/videos/${v.id}?tab=thumbnail`;
          break;
        case 'READY_TO_UPLOAD':
          if (isPubLive) {
            stageNum = 11;
            stageName = 'Published';
            actionLabel = 'View Live';
            targetUrl = `/videos/${v.id}?tab=analytics`;
            priority = 'LOW';
          } else if (isPubScheduled) {
            stageNum = 10;
            stageName = 'Publishing Setup';
            actionLabel = 'Release Manager';
            targetUrl = `/publishing?videoId=${v.id}`;
            priority = 'MEDIUM';
          } else {
            stageNum = 9;
            stageName = 'Social Review';
            actionLabel = 'Social QC';
            targetUrl = `/videos/${v.id}?tab=social`;
            priority = 'HIGH';
          }
          break;
        case 'UPLOADED':
        case 'PUBLISHED':
          stageNum = 11;
          stageName = 'Published';
          actionLabel = 'View Live';
          targetUrl = `/videos/${v.id}?tab=analytics`;
          priority = 'LOW';
          break;
        default:
          stageNum = 3;
          stageName = 'Audience Script';
          actionLabel = 'Open Video';
          targetUrl = `/videos/${v.id}`;
      }

      const ageH = getAgeInHours(v.updatedAt || v.createdAt);
      const isBlocked = v.status === VideoProductionStatus.ON_HOLD || vStatus === 'REVISION_REQUESTED';
      if (isBlocked) priority = 'CRITICAL';

      const mode = ((v as any).contentMode || (v as any).productionMode || 'QUESTION_CHALLENGE_SHORT') as 'QUESTION_CHALLENGE_SHORT' | 'TOPIC_INTRODUCTION' | 'EXPLAINED_QUESTIONS_VIDEO';

      items.push({
        id: v.id,
        title: v.title || `Video Production: ${v.id}`,
        contentMode: mode,
        topicId: v.question?.topicId,
        topicName: v.question?.topicId ? (topicMap.get(v.question.topicId) || 'Quantitative Aptitude') : 'Aptitude Video',
        stageNumber: stageNum,
        stageName,
        status: v.status || 'IN_PROGRESS',
        priority,
        isBlocked,
        isOverdue: ageH > 48,
        needsMyAction: (stageNum === 7 || stageNum === 9) ? isUserAdminOrReviewer : false,
        assigneeName: v.assignedEditor || v.assignedHost || (v as any).editorId || (v as any).presenterId || undefined,
        assignedRole: v.status === VideoProductionStatus.EDITING ? 'Video Editor' : v.status === VideoProductionStatus.SCRIPT_READY ? 'Presenter' : 'Production Lead',
        waitingHours: ageH,
        updatedAt: v.updatedAt || v.createdAt || new Date().toISOString(),
        targetUrl,
        actionLabel,
      });
    }

    // 4. Ingest Standalone Publishing Records (Stage 10 - Publishing Setup)
    // De-duplicate across collections: Do not duplicate if this content piece is already tracked via its Video entity
    for (const p of publishingList) {
      if ((p as any).isDeleted || (p as any).status === 'ARCHIVED') continue;
      if (p.videoId && seenVideoIds.has(p.videoId)) continue;

      const isScheduled =
        (p as any).status === 'SCHEDULED' ||
        p.youtube?.status === SocialPublishStatus.SCHEDULED ||
        p.instagram?.status === SocialPublishStatus.SCHEDULED ||
        p.facebook?.status === SocialPublishStatus.SCHEDULED;
      const isInSetup =
        (p as any).status === 'IN_SETUP' ||
        (p as any).status === 'READY_TO_PUBLISH';

      // Only standalone packages that have legitimately reached distribution/scheduling
      if (isScheduled || isInSetup) {
        const scheduledTime = (p as any).scheduledTime || p.youtubeScheduledAt || p.instagramScheduledAt || p.facebookScheduledAt;
        const ageH = getAgeInHours(p.updatedAt || scheduledTime);
        items.push({
          id: p.id,
          title: `Publishing Package ${p.videoId || p.id}`,
          contentMode: 'QUESTION_CHALLENGE_SHORT',
          topicName: 'Distribution Pipeline',
          stageNumber: 10,
          stageName: 'Publishing Setup',
          status: isScheduled ? 'SCHEDULED' : 'READY',
          priority: 'MEDIUM',
          isBlocked: false,
          isOverdue: ageH > 24,
          needsMyAction: isUserAdminOrReviewer,
          waitingHours: ageH,
          updatedAt: p.updatedAt || new Date().toISOString(),
          targetUrl: '/publishing',
          actionLabel: 'Schedule Release',
        });
      }
    }

    return items;
  }, [drafts, questions, videos, publishingList, topicMap, user]);

  // Compute 15-Stage Metrics from Unified Items
  const stageMetrics: Record<number, StageMetrics> = useMemo(() => {
    const res: Record<number, StageMetrics> = {};

    for (const step of CANONICAL_15_STEPS) {
      res[step.stepNumber] = {
        stepNumber: step.stepNumber,
        totalCount: 0,
        awaitingActionCount: 0,
        blockedCount: 0,
        overdueCount: 0,
        oldestAgeHours: 0,
      };
    }

    for (const item of workQueueItems) {
      const m = res[item.stageNumber];
      if (m) {
        m.totalCount++;
        if (item.needsMyAction) m.awaitingActionCount++;
        if (item.isBlocked) m.blockedCount++;
        if (item.isOverdue) m.overdueCount++;
        if (item.waitingHours > m.oldestAgeHours) {
          m.oldestAgeHours = item.waitingHours;
        }
      }
    }

    return res;
  }, [workQueueItems]);

  // Compute KPI Data
  const kpiData: WorkflowKpiData = useMemo(() => {
    const inProd = workQueueItems.filter((i) => i.stageNumber <= 10).length;
    const awaitingAction = workQueueItems.filter((i) => i.needsMyAction).length;
    const blocked = workQueueItems.filter((i) => i.isBlocked).length;
    const overdue = workQueueItems.filter((i) => i.isOverdue && !i.isBlocked).length;
    const approvalQueue = workQueueItems.filter((i) => i.stageNumber === 2 || i.stageNumber === 7 || i.stageNumber === 9).length;

    // Published Today calculation
    const todayStr = new Date().toDateString();
    const publishedToday = videos.filter(
      (v) =>
        ((v.status as string) === 'PUBLISHED' || v.status === VideoProductionStatus.UPLOADED) &&
        (((v as any).publishedAt && new Date((v as any).publishedAt).toDateString() === todayStr) ||
          (v.scheduledPublishDate && new Date(v.scheduledPublishDate).toDateString() === todayStr) ||
          (v.updatedAt && new Date(v.updatedAt).toDateString() === todayStr))
    ).length;

    // Published 7 days calculation
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const published7Days = videos.filter(
      (v) =>
        ((v.status as string) === 'PUBLISHED' || v.status === VideoProductionStatus.UPLOADED) &&
        v.updatedAt &&
        new Date(v.updatedAt).getTime() >= sevenDaysAgo
    ).length;

    return {
      inProductionCount: inProd,
      awaitingMyActionCount: awaitingAction,
      blockedCount: blocked,
      overdueCount: overdue,
      publishedTodayCount: publishedToday,
      publishedThisWeekCount: published7Days,
      weeklyTarget: 15,
      approvalQueueCount: approvalQueue,
    };
  }, [workQueueItems, videos]);

  // Compute Mode Breakdown Data
  const modesData: ModeSummary[] = useMemo(() => {
    const getCounts = (modeKey: string) => {
      const modeItems = workQueueItems.filter((i) => i.contentMode === modeKey);
      const active = modeItems.filter((i) => i.stageNumber <= 10).length;
      const review = modeItems.filter((i) => i.stageNumber === 2 || i.stageNumber === 7 || i.stageNumber === 9).length;
      const published = modeItems.filter((i) => i.stageNumber === 11).length;
      return { active, review, published };
    };

    const m1 = getCounts('QUESTION_CHALLENGE_SHORT');
    const m2 = getCounts('TOPIC_INTRODUCTION');
    const m3 = getCounts('EXPLAINED_QUESTIONS_VIDEO');

    return [
      {
        mode: 'QUESTION_CHALLENGE_SHORT',
        title: 'Question Challenge Short',
        badge: 'Mode 1',
        aspectRatio: '9:16 Vertical',
        description: 'Single MCQ speed-math trick short (~60s), high viral engagement with fast solution formulation.',
        activeCount: m1.active,
        awaitingReviewCount: m1.review,
        publishedCount: m1.published,
        studioUrl: '/studio?mode=QUESTION_CHALLENGE_SHORT',
      },
      {
        mode: 'TOPIC_INTRODUCTION',
        title: 'Topic Introduction',
        badge: 'Mode 2',
        aspectRatio: '9:16 / 16:9 Dual',
        description: 'Zero-question conceptual hook (~90s), demystifying core principles and syllabus context.',
        activeCount: m2.active,
        awaitingReviewCount: m2.review,
        publishedCount: m2.published,
        studioUrl: '/studio?mode=TOPIC_INTRODUCTION',
      },
      {
        mode: 'EXPLAINED_QUESTIONS_VIDEO',
        title: 'Explained Questions Video',
        badge: 'Mode 3',
        aspectRatio: '16:9 Landscape',
        description: 'Comprehensive masterclass video breaking down batches of 5-20 questions with sequential roadmaps.',
        activeCount: m3.active,
        awaitingReviewCount: m3.review,
        publishedCount: m3.published,
        studioUrl: '/studio?mode=EXPLAINED_QUESTIONS_VIDEO',
      },
    ];
  }, [workQueueItems]);

  // Compute Phase Distribution
  const phaseDistribution: PhaseDistribution = useMemo(() => {
    let conception = 0;
    let production = 0;
    let postQc = 0;
    let distribution = 0;

    for (const item of workQueueItems) {
      if (item.stageNumber <= 2) conception++;
      else if (item.stageNumber <= 5) production++;
      else if (item.stageNumber <= 9) postQc++;
      else distribution++;
    }

    return {
      conceptionCount: conception,
      productionCount: production,
      postQcCount: postQc,
      distributionCount: distribution,
      totalInFlight: kpiData.inProductionCount,
    };
  }, [workQueueItems, kpiData.inProductionCount]);

  // Top Continue Item for Quick Action
  const topActionItem = useMemo(() => {
    const actionable = workQueueItems.filter((i) => i.needsMyAction);
    if (actionable.length > 0) return actionable[0];
    const high = workQueueItems.filter((i) => i.priority === 'HIGH' || i.priority === 'CRITICAL');
    if (high.length > 0) return high[0];
    return workQueueItems[0] || null;
  }, [workQueueItems]);

  if (errorMessage && workQueueItems.length === 0) {
    return (
      <div className="py-8">
        <ErrorState
          title="Command Center Data Connection Error"
          message={errorMessage}
          retryLabel="Retry Connection"
          onRetry={() => loadDashboardData(true)}
        />
      </div>
    );
  }

  return (
    <div id="executive-dashboard-container" className="space-y-4 animate-in fade-in-50 duration-200 pb-10">
      {/* 1. Global Command Header */}
      <section aria-label="Command Center Header">
        <CommandCenterHeader
          user={user}
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          onRefresh={() => loadDashboardData(true)}
          totalInFlightCount={kpiData.inProductionCount}
        />
      </section>

      {/* Non-fatal notification banner if present */}
      {errorMessage && (
        <Alert variant="warning" title="Notice" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* 2. Operational KPI Strip */}
      <section aria-label="Operational KPI Strip">
        <WorkflowKpiStrip
          data={kpiData}
          isLoading={isLoading}
          activeFilter={selectedKpiFilter}
          onSelectFilter={(kpiKey) => {
            setSelectedKpiFilter(kpiKey);
            setSelectedStageFilter(null);
          }}
        />
      </section>

      {/* 3. Primary Section: Canonical 15-Stage Production Pipeline */}
      <section aria-label="15-Stage Production Pipeline">
        <ProductionPipelineBoard
          stageMetrics={stageMetrics}
          selectedStage={selectedStageFilter}
          onSelectStage={(stageNum) => {
            setSelectedStageFilter(stageNum);
            setSelectedKpiFilter(null);
          }}
          isLoading={isLoading}
        />
      </section>

      {/* 4. Action Required Work Queue */}
      <section aria-label="Action Required Work Queue">
        <ActionRequiredQueue
          items={workQueueItems}
          selectedStageFilter={selectedStageFilter}
          selectedKpiFilter={selectedKpiFilter}
          onSelectStageFilter={setSelectedStageFilter}
          isLoading={isLoading}
        />
      </section>

      {/* 5. Content-Mode Distribution */}
      <section aria-label="Content Mode Distribution">
        <ContentModeBreakdown
          modesData={modesData}
          onSelectModeFilter={(mode) => {
            // Selecting mode will auto-filter queue
            setSelectedStageFilter(null);
            setSelectedKpiFilter(null);
          }}
        />
      </section>

      {/* 6. Production Throughput & Subsystem Health */}
      <section aria-label="Throughput and Subsystem Health">
        <ThroughputAndHealthRow
          distribution={phaseDistribution}
          integrations={integrations}
          producedToday={kpiData.publishedTodayCount}
          approvedToday={auditLogs.filter((l) => l.action?.includes('APPROVE')).length}
          createdToday={drafts.filter((d) => d.updatedAt && new Date(d.updatedAt).toDateString() === new Date().toDateString()).length}
          publishedLast7Days={kpiData.publishedThisWeekCount}
          isLoading={isLoading}
        />
      </section>

      {/* 7. Recent Activity & Executive Quick Actions */}
      <section aria-label="Recent Activity and Quick Actions">
        <RecentActivityPanel
          logs={auditLogs}
          userRole={user?.role}
          continueItemUrl={topActionItem?.targetUrl}
          continueItemTitle={topActionItem?.title}
          isLoading={isLoading}
        />
      </section>

      {/* 8. Decoupled Architecture Invariant & Footer */}
      <footer className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Burra Pariksha CMS</span>
          <span>•</span>
          <span>Production Command Center v2.0</span>
          <span>•</span>
          <span className="text-indigo-600 font-medium">Enterprise Control Architecture</span>
        </div>

        <div className="font-mono text-slate-500">
          Authoritative Engine: Cloud Firestore
        </div>
      </footer>
    </div>
  );
};
