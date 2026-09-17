import React from 'react';
import { Menu, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlobalSearchBar } from '../dashboard/GlobalSearchBar';
import { UserProfileMenu } from './UserProfileMenu';
import { NotificationsMenu } from './NotificationsMenu';
import { SystemHealthIndicator } from './SystemHealthIndicator';
import { Button } from '../../design-system/components/Button';

export interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200"
    >
      {/* Left: Mobile Toggle & Brand Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-500 rounded-lg lg:hidden hover:bg-slate-100 hover:text-slate-800 shrink-0 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Studio Identity (visible on mobile/tablet when sidebar is collapsed) */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600 text-white font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
            Burra Pariksha
          </span>
        </div>

        {/* Clean System Health status */}
        <SystemHealthIndicator />
      </div>

      {/* Center: Global Search Bar */}
      <div id="header-global-search-container" className="flex-1 max-w-md mx-4 hidden sm:block">
        <GlobalSearchBar id="header-global-search" className="relative w-full max-w-md" />
      </div>

      {/* Right: Quick Action, Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action: Step 01 Generate Question */}
        <Link to="/studio" id="header-generate-question-btn" className="hidden sm:inline-flex">
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5 font-semibold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Question</span>
          </Button>
        </Link>

        {/* Notifications */}
        <NotificationsMenu id="top-notifications-menu" />

        {/* User Profile Menu */}
        <div className="pl-1 border-l border-slate-200">
          <UserProfileMenu id="top-user-profile-menu" />
        </div>
      </div>
    </header>
  );
};
