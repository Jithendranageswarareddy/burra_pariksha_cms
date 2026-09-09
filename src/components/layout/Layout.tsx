import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ErrorBoundary } from './ErrorBoundary';

export const Layout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex">
        {/* Sidebar */}
        <Sidebar
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>

          {/* Footer Notice */}
          <footer className="px-6 py-4 border-t border-slate-200 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Burra Pariksha CMS</span>
              <span>•</span>
              <span>Content Operations System</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Authoritative Persistence: Google Sheets DB
            </div>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
};
