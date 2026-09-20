/**
 * BURRA PARIKSHA CMS - Application Root & Routing Setup
 * Phase 1: Foundation & UI Shell
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProductionJourneyProvider } from './contexts/ProductionJourneyContext';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { QuestionLibraryPage } from './pages/QuestionLibraryPage';
import { QuestionDetailPage } from './pages/QuestionDetailPage';
import { QuestionImprovePage } from './pages/QuestionImprovePage';
import { QuestionVerifyApprovePage } from './pages/QuestionVerifyApprovePage';
import { QuestionStudioPage } from './pages/QuestionStudioPage';
import { QueuePage } from './pages/QueuePage';
import { ProductionTrackerPage } from './pages/ProductionTrackerPage';
import { ProductionBoardPage } from './pages/ProductionBoardPage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { VideoCreateScriptPage } from './pages/VideoCreateScriptPage';
import { VideoReviewScriptPage } from './pages/VideoReviewScriptPage';
import { VideoRecordPage } from './pages/VideoRecordPage';
import { VideoEditPage } from './pages/VideoEditPage';
import { VideoFinalPage } from './pages/VideoFinalPage';
import { VideoThumbnailPage } from './pages/VideoThumbnailPage';
import { VideoPinnedCommentPage } from './pages/VideoPinnedCommentPage';
import { PlatformPackagesPage } from './pages/PlatformPackagesPage';
import { PublishingPackagePage } from './pages/PublishingPackagePage';
import { PublishingPage } from './pages/PublishingPage';
import { SocialAnalyticsPage } from './pages/SocialAnalyticsPage';
import { AnalyticsExperiencePage } from './pages/AnalyticsExperiencePage';
import { SettingsPage } from './pages/SettingsPage';
import { RecoveryAdminPage } from './pages/RecoveryAdminPage';
import { PlanningPage } from './pages/PlanningPage';
import { MyWorkPage } from './pages/MyWorkPage';
import { TeamOperationsPage } from './pages/TeamOperationsPage';
import { ContentMasterPage } from './pages/ContentMasterPage';
import { SocialReviewPage } from './pages/SocialReviewPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { getDefaultLandingRoute } from './config/roles';

function VideoTabRedirect({ tab }: { tab?: string }) {
  const { videoId } = useParams<{ videoId: string }>();
  const location = useLocation();
  if (!videoId) {
    return <Navigate to="/production" replace />;
  }
  if (tab) {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', tab);
    const searchStr = searchParams.toString();
    return <Navigate to={`/videos/${videoId}${searchStr ? `?${searchStr}` : ''}`} replace />;
  }
  return <Navigate to={`/videos/${videoId}${location.search}`} replace />;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-slate-400">Verifying team session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const landingRoute = getDefaultLandingRoute(user?.role);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Dynamic Role-Based Landing Route Redirect */}
        <Route index element={<Navigate to={landingRoute} replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Content Routes */}
        <Route path="planning" element={<PlanningPage />} />
        <Route path="questions" element={<QuestionLibraryPage />} />
        <Route path="content-masters" element={<ContentMasterPage />} />
        <Route path="content-masters/:id" element={<ContentMasterPage />} />
        <Route path="social-review" element={<SocialReviewPage />} />
        <Route path="social-review/:reviewId" element={<SocialReviewPage />} />
        <Route path="studio" element={<QuestionStudioPage />} />
        <Route path="questions/new" element={<Navigate to="/studio" replace />} />
        <Route path="questions/improve" element={<QuestionImprovePage />} />
        <Route path="questions/:id/improve" element={<QuestionImprovePage />} />
        <Route path="questions/verify" element={<QuestionVerifyApprovePage />} />
        <Route path="questions/:id/verify" element={<QuestionVerifyApprovePage />} />
        <Route path="questions/:id" element={<QuestionDetailPage />} />
        <Route path="generate" element={<Navigate to="/studio" replace />} />

        {/* Production Routes */}
        <Route path="queue" element={<QueuePage />} />
        <Route path="production" element={<ProductionTrackerPage />} />
        <Route path="production-tracker" element={<Navigate to="/production" replace />} />
        <Route path="production-board" element={<Navigate to="/production?status=EDITING" replace />} />

        {/* Video Production 5-Step Workflow Routes */}
        <Route path="videos/create-script" element={<VideoCreateScriptPage />} />
        <Route path="videos/:videoId/create-script" element={<VideoTabRedirect tab="script" />} />
        <Route path="production/:videoId/create-script" element={<VideoTabRedirect tab="script" />} />

        <Route path="videos/review-script" element={<Navigate to="/production?status=SCRIPT_READY" replace />} />
        <Route path="videos/:videoId/review-script" element={<VideoReviewScriptPage />} />
        <Route path="production/:videoId/review-script" element={<VideoReviewScriptPage />} />

        <Route path="videos/record" element={<Navigate to="/production?status=RECORDING" replace />} />
        <Route path="videos/:videoId/record" element={<VideoTabRedirect tab="recording" />} />
        <Route path="production/:videoId/record" element={<VideoTabRedirect tab="recording" />} />

        <Route path="videos/edit-video" element={<Navigate to="/production?status=EDITING" replace />} />
        <Route path="videos/:videoId/edit-video" element={<VideoTabRedirect tab="editing" />} />
        <Route path="production/:videoId/edit-video" element={<VideoTabRedirect tab="editing" />} />

        <Route path="videos/final-video" element={<Navigate to="/production?status=FINAL_REVIEW" replace />} />
        <Route path="videos/:videoId/final-video" element={<VideoTabRedirect tab="final-review" />} />
        <Route path="production/:videoId/final-video" element={<VideoTabRedirect tab="final-review" />} />

        {/* Asset & Social Review Workflow Routes (Phase 08) */}
        <Route path="videos/thumbnail" element={<Navigate to="/production?status=READY_TO_UPLOAD" replace />} />
        <Route path="videos/:videoId/thumbnail" element={<VideoTabRedirect tab="thumbnail" />} />
        <Route path="production/:videoId/thumbnail" element={<VideoTabRedirect tab="thumbnail" />} />

        <Route path="videos/pinned-comment" element={<Navigate to="/production" replace />} />
        <Route path="videos/:videoId/pinned-comment" element={<VideoTabRedirect tab="social" />} />
        <Route path="production/:videoId/pinned-comment" element={<VideoTabRedirect tab="social" />} />

        <Route path="videos/:videoId/social-review" element={<SocialReviewPage />} />
        <Route path="production/:videoId/social-review" element={<SocialReviewPage />} />

        <Route path="production/:videoId" element={<VideoTabRedirect />} />
        <Route path="videos/:videoId" element={<VideoDetailPage />} />

        {/* Publishing 3-Step Workflow Routes (Phase 09: Steps 13-15) */}
        <Route path="platform-packages" element={<PlatformPackagesPage />} />
        <Route path="videos/platform-packages" element={<PlatformPackagesPage />} />
        <Route path="videos/:videoId/platform-packages" element={<PlatformPackagesPage />} />
        <Route path="production/:videoId/platform-packages" element={<PlatformPackagesPage />} />

        <Route path="publishing-package" element={<Navigate to="/platform-packages" replace />} />
        <Route path="videos/publishing-package" element={<Navigate to="/platform-packages" replace />} />
        <Route path="videos/:videoId/publishing-package" element={<Navigate to="/platform-packages" replace />} />
        <Route path="production/:videoId/publishing-package" element={<Navigate to="/platform-packages" replace />} />

        <Route path="publishing" element={<PublishingPage />} />
        <Route path="videos/:videoId/publish" element={<PublishingPage />} />
        <Route path="production/:videoId/publish" element={<PublishingPage />} />

        {/* Top-Level Analytics Experience Routes (Phase 10) */}
        <Route path="analytics" element={<Navigate to="/analytics/overview" replace />} />
        <Route path="analytics/overview" element={<AnalyticsExperiencePage />} />
        <Route path="analytics/video" element={<AnalyticsExperiencePage />} />
        <Route path="analytics/platform" element={<AnalyticsExperiencePage />} />
        <Route path="analytics/topic" element={<AnalyticsExperiencePage />} />
        <Route path="analytics/subtopic" element={<AnalyticsExperiencePage />} />
        <Route path="analytics/difficulty" element={<AnalyticsExperiencePage />} />
        <Route path="analytics/engagement" element={<AnalyticsExperiencePage />} />
        <Route path="analytics/retention" element={<AnalyticsExperiencePage />} />
        <Route path="analytics/intelligence" element={<AnalyticsExperiencePage />} />
        <Route path="analytics/strategy" element={<AnalyticsExperiencePage />} />
        <Route path="social-analytics" element={<SocialAnalyticsPage />} />
        <Route path="social-analytics/:contentId" element={<SocialAnalyticsPage />} />

        {/* Team Operations Routes (Phase 10 & Task 3E.1) */}
        <Route path="my-work" element={<MyWorkPage />} />
        <Route path="team" element={<TeamOperationsPage />} />
        <Route path="team-work" element={<TeamOperationsPage />} />

        {/* System Settings Route */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="recovery" element={<RecoveryAdminPage />} />
        <Route path="admin" element={<RecoveryAdminPage />} />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProductionJourneyProvider>
          <AppRoutes />
        </ProductionJourneyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}


