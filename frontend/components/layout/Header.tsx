import React from 'react';
import { Menu, Sparkles, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { GlobalSearchBar } from '../dashboard/GlobalSearchBar';
import { UserProfileMenu } from './UserProfileMenu';
import { NotificationsMenu } from './NotificationsMenu';
import { SystemHealthIndicator } from './SystemHealthIndicator';
import { useLocation } from 'react-router-dom';
import { inferBreadcrumbs } from '../../design-system/components/AppBreadcrumbs';

export interface HeaderProps {
  onOpenMobileMenu: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const breadcrumbs = inferBreadcrumbs(location.pathname, location.search);
  const currentPageTitle = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Overview';

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200"
    >
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-500 rounded-lg lg:hidden hover:bg-slate-100 hover:text-slate-800 shrink-0 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse / Expand Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shrink-0"
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        )}

        {/* Studio Identity (visible on mobile/tablet when sidebar is collapsed) */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600 text-white font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
            Burra Pariksha
          </span>
        </div>

        {/* Current Hub/Page Indicator on Desktop */}
        <div className="hidden lg:flex items-center gap-2">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            {currentPageTitle}
          </h1>
        </div>

        {/* Clean System Health status */}
        <div className="hidden sm:block">
          <SystemHealthIndicator />
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div id="header-global-search-container" className="flex-1 max-w-md mx-4 hidden sm:block">
        <GlobalSearchBar id="header-global-search" className="relative w-full max-w-md" />
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
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
