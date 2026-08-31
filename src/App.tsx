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
import { NewQuestionPage } from './pages/NewQuestionPage';
import { QuestionGeneratorPage } from './pages/QuestionGeneratorPage';
import { QueuePage } from './pages/QueuePage';
import { ProductionTrackerPage } from './pages/ProductionTrackerPage';
import { VideoDetailPage } from './pages/VideoDetailPage';
import { PublishingPage } from './pages/PublishingPage';
import { SettingsPage } from './pages/SettingsPage';
import { PlanningPage } from './pages/PlanningPage';
import { MyWorkPage } from './pages/MyWorkPage';
import { TeamOperationsPage } from './pages/TeamOperationsPage';
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
        <Route path="questions/new" element={<NewQuestionPage />} />
        <Route path="questions/:id" element={<QuestionDetailPage />} />
        <Route path="generate" element={<QuestionGeneratorPage />} />

        {/* Production Routes */}
        <Route path="queue" element={<QueuePage />} />
        <Route path="production" element={<ProductionTrackerPage />} />
        <Route path="production/:videoId" element={<VideoDetailPage />} />

        {/* Publishing Route */}
        <Route path="publishing" element={<PublishingPage />} />

        {/* Team Operations Routes (Phase 10 & Task 3E.1) */}
        <Route path="my-work" element={<MyWorkPage />} />
        <Route path="team" element={<TeamOperationsPage />} />
        <Route path="team-work" element={<TeamOperationsPage />} />

        {/* System Settings Route */}
        <Route path="settings" element={<SettingsPage />} />

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


