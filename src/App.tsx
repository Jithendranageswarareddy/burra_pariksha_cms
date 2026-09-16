/**
 * BURRA PARIKSHA CMS - Application Root & Routing Setup
 * Phase 1: Foundation & UI Shell
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { QuestionLibraryPage } from './pages/QuestionLibraryPage';
import { QuestionDetailPage } from './pages/QuestionDetailPage';

import { QuestionStudioPage } from './pages/QuestionStudioPage';
import { QueuePage } from './pages/QueuePage';
import { ProductionTrackerPage } from './pages/ProductionTrackerPage';
import { ProductionBoardPage } from './pages/ProductionBoardPage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { PublishingPage } from './pages/PublishingPage';
import { SocialAnalyticsPage } from './pages/SocialAnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { RecoveryAdminPage } from './pages/RecoveryAdminPage';
import { PlanningPage } from './pages/PlanningPage';
import { MyWorkPage } from './pages/MyWorkPage';
import { TeamOperationsPage } from './pages/TeamOperationsPage';
import { ContentMasterPage } from './pages/ContentMasterPage';
import { SocialReviewPage } from './pages/SocialReviewPage';
import { NotFoundPage } from './pages/NotFoundPage';

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

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Index Redirect to /dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Content Routes */}
        <Route path="planning" element={<PlanningPage />} />
        <Route path="questions" element={<QuestionLibraryPage />} />
        <Route path="content-masters" element={<ContentMasterPage />} />
        <Route path="content-masters/:id" element={<ContentMasterPage />} />
        <Route path="social-review" element={<SocialReviewPage />} />
        <Route path="social-review/:reviewId" element={<SocialReviewPage />} />
        <Route path="studio" element={<QuestionStudioPage />} />
        <Route path="questions/new" element={<Navigate to="/studio?mode=manual" replace />} />
        <Route path="questions/:id" element={<QuestionDetailPage />} />
        <Route path="generate" element={<Navigate to="/studio?mode=ai" replace />} />

        {/* Production Routes */}
        <Route path="queue" element={<QueuePage />} />
        <Route path="production" element={<ProductionTrackerPage />} />
        <Route path="production-board" element={<ProductionBoardPage />} />
        <Route path="production/:videoId" element={<VideoDetailPage />} />
        <Route path="videos/:videoId" element={<VideoDetailPage />} />

        {/* Publishing Route */}
        <Route path="publishing" element={<PublishingPage />} />
        <Route path="social-analytics" element={<SocialAnalyticsPage />} />
        <Route path="social-analytics/:contentId" element={<SocialAnalyticsPage />} />

        {/* Team Operations Routes (Phase 10 & Task 3E.1) */}
        <Route path="my-work" element={<MyWorkPage />} />
        <Route path="team" element={<TeamOperationsPage />} />
        <Route path="team-work" element={<TeamOperationsPage />} />

        {/* System Settings Route */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="recovery" element={<RecoveryAdminPage />} />

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
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}


