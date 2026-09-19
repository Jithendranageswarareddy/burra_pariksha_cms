import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  Sparkles,
  Video,
  Film,
  ShieldCheck,
  UploadCloud,
  BarChart2,
  Compass,
  Users,
  Layers,
  Settings,
  RotateCcw,
  GraduationCap,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { AUTHORITATIVE_HUBS, HubNavItem } from '../../config/navigation';
import { APP_CONFIG } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import {
  hasNavigationCapability,
  getRoleDisplayName,
  CANONICAL_ROLE_DESCRIPTORS,
  resolveCanonicalRole,
} from '../../config/roles';

// Accessible Icon Map for Authoritative Navigation
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  UserCheck,
  BookOpen,
  Sparkles,
  Video,
  Film,
  ShieldCheck,
  UploadCloud,
  BarChart2,
  Compass,
  Users,
  Layers,
  Settings,
  RotateCcw,
  LayersIcon: Layers,
};

export interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile = false, onCloseMobile }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Keyboard accessibility for mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenMobile && onCloseMobile) {
        onCloseMobile();
      }
    };
    if (isOpenMobile) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpenMobile, onCloseMobile]);

  /**
   * Deterministic active link calculation.
   * Maps nested contextual routes to their parent authoritative hub link.
   */
  const isCurrentActive = (href: string): boolean => {
    const currentPath = location.pathname;

    // 1. HOME: Overview
    if (href === '/dashboard') {
      return currentPath === '/' || currentPath === '/dashboard';
    }

    // 2. HOME: My Work
    if (href === '/my-work') {
      return currentPath === '/my-work';
    }

    // 3. QUESTIONS: Library
    if (href === '/questions') {
      return (
        currentPath === '/questions' ||
        (currentPath.startsWith('/questions/') &&
          !currentPath.includes('/improve') &&
          !currentPath.includes('/verify') &&
          currentPath !== '/questions/new')
      );
    }

    // 4. QUESTIONS: Question Studio
    if (href === '/studio') {
      return (
        currentPath === '/studio' ||
        currentPath === '/generate' ||
        currentPath === '/questions/new' ||
        currentPath.includes('/improve') ||
        currentPath.includes('/verify')
      );
    }

    // 5. PRODUCTION: Recording Queue
    if (href === '/queue') {
      return (
        currentPath === '/queue' ||
        currentPath.includes('/record')
      );
    }

    // 6. PRODUCTION: Production Pipeline
    if (href === '/production') {
      return (
        currentPath === '/production' ||
        currentPath === '/production-tracker' ||
        currentPath === '/production-board' ||
        currentPath.startsWith('/videos/') ||
        currentPath.startsWith('/production/')
      );
    }

    // 7. PUBLISHING: Quality Signoff
    if (href === '/social-review') {
      return currentPath.startsWith('/social-review');
    }

    // 8. PUBLISHING: Publishing Manager
    if (href === '/publishing') {
      return (
        currentPath === '/publishing' ||
        currentPath === '/publishing-package' ||
        currentPath === '/platform-packages' ||
        currentPath.endsWith('/publish') ||
        currentPath.endsWith('/publishing-package') ||
        currentPath.endsWith('/platform-packages')
      );
    }

    // 9. ANALYTICS: Analytics Hub
    if (href === '/analytics/overview') {
      return currentPath.startsWith('/analytics') || currentPath.startsWith('/social-analytics');
    }

    // 10. MANAGEMENT: Planning & Batches
    if (href === '/planning') {
      return currentPath === '/planning';
    }

    // 11. MANAGEMENT: Team Workload
    if (href === '/team') {
      return currentPath === '/team' || currentPath === '/team-work';
    }

    // 12. MANAGEMENT: Content Explorer
    if (href === '/content-masters') {
      return currentPath.startsWith('/content-masters');
    }

    // 13. SYSTEM: System Health
    if (href === '/settings') {
      return currentPath === '/settings';
    }

    // 14. SYSTEM: Disaster Recovery
    if (href === '/recovery') {
      return currentPath === '/recovery' || currentPath === '/admin';
    }

    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  // User presentation data
  const canonicalRole = resolveCanonicalRole(user?.role);
  const roleDescriptor = CANONICAL_ROLE_DESCRIPTORS[canonicalRole];
  const userRoleDisplayName = getRoleDisplayName(user?.role);

  const renderNavItem = (item: HubNavItem) => {
    // Capability-based visibility check
    if (item.capability && !hasNavigationCapability(user?.role, item.capability)) {
      return null;
    }

    const Icon = iconMap[item.iconName] || Layers;
    const active = isCurrentActive(item.href);

    return (
      <NavLink
        key={item.id}
        to={item.href}
        id={`nav-link-${item.id}`}
        onClick={onCloseMobile}
        aria-current={active ? 'page' : undefined}
        title={item.description}
        className={`group flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-400 ${
          active
            ? 'bg-indigo-600 text-white shadow-xs font-semibold'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 font-medium'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 transition-colors ${
              active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
            }`}
            aria-hidden="true"
          />
          <span className="truncate text-[13px]">{item.name}</span>
        </div>

        {item.badge && (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ml-1.5 ${
              active
                ? 'bg-indigo-700/80 text-indigo-100'
                : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/50'
            }`}
          >
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden animate-in fade-in-50 duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="app-sidebar"
        aria-label="Main Navigation"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-inner font-bold text-base shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white tracking-tight uppercase truncate">
              {APP_CONFIG.name}
            </span>
            <span className="text-[11px] text-indigo-400 font-medium tracking-wide truncate">
              Burra Pariksha CMS
            </span>
          </div>
        </div>

        {/* Six Authoritative Hubs Navigation */}
        <nav
          id="sidebar-hub-navigation"
          className="flex-1 px-3 py-3 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-slate-800"
          aria-label="Application Hubs"
        >
          {AUTHORITATIVE_HUBS.map((hub) => {
            // Filter visible items for this hub based on user capabilities
            const visibleItems = hub.items.filter((item) =>
              item.capability ? hasNavigationCapability(user?.role, item.capability) : true
            );

            // If no items in this hub are visible to the current role, do not render the hub section
            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <div key={hub.id} id={hub.id} className="space-y-1">
                <div className="px-3 pt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {hub.title}
                  </p>
                  {hub.subtitle && (
                    <p className="text-[10px] text-indigo-400 font-medium tracking-normal mt-0.5">
                      {hub.subtitle}
                    </p>
                  )}
                </div>
                <div className="space-y-0.5 mt-1">
                  {visibleItems.map(renderNavItem)}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Identity & Canonical Role Footer */}
        <div
          id="sidebar-user-footer"
          className="p-3 border-t border-slate-800/80 bg-slate-950/40 shrink-0"
        >
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-slate-200 text-[12px] truncate leading-tight">
                  {user?.name || 'Authorized Member'}
                </span>
                <span className="text-[10px] text-indigo-300 font-medium truncate">
                  {userRoleDisplayName}
                </span>
              </div>
            </div>
            {canonicalRole === 'ADMIN' ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-label="System Administrator" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
