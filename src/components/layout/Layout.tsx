import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ErrorBoundary } from './ErrorBoundary';
import { AppBreadcrumbs } from '../../design-system/components/AppBreadcrumbs';

export const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ErrorBoundary>
      <div id="burra-app-shell" className="min-h-screen bg-slate-50 text-slate-900 flex antialiased">
        {/* Skip to Main Content Link for Accessibility */}
        <a
          href="#app-main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 z-50 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-xs"
        >
          Skip to main content
        </a>

        {/* Persistent Desktop Sidebar / Accessible Mobile Drawer */}
        <Sidebar
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          {/* Top Bar Header */}
          <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

          {/* Breadcrumbs Sub-Header Bar (Frozen 6-Hub IA) */}
          <div
            id="shell-breadcrumb-bar"
            className="bg-white/80 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2 sticky top-16 z-20"
          >
            <div className="max-w-7xl mx-auto">
              <AppBreadcrumbs />
            </div>
          </div>

          {/* Main Page Container */}
          <main
            id="app-main-content"
            role="main"
            tabIndex={-1}
            className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8 focus:outline-hidden"
          >
            <ErrorBoundary isPageLevel={true}>
              <Outlet />
            </ErrorBoundary>
          </main>

          {/* Shell Footer */}
          <footer
            id="shell-footer"
            className="px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Burra Pariksha CMS</span>
              <span>•</span>
              <span>Creator Studio</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All systems operational</span>
            </div>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
};
