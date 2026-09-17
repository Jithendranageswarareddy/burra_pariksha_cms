import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Edit3,
  ShieldCheck,
  FileText,
  FileCheck,
  Video,
  Scissors,
  Film,
  Image,
  MessageSquare,
  CheckCheck,
  Share2,
  CheckCircle2,
  UploadCloud,
  BarChart2,
  UserCheck,
  Settings,
  RotateCcw,
  Compass,
  Table,
  Layers,
  Users,
  ChevronDown,
  GraduationCap,
  TrendingUp,
  Target,
  Clock,
  Heart,
} from 'lucide-react';
import { NAVIGATION_SECTIONS, NavItem } from '../../config/navigation';
import { APP_CONFIG } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

// Icon map for navigation configuration
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Edit3,
  ShieldCheck,
  FileText,
  FileCheck,
  Video,
  Scissors,
  Film,
  Image,
  MessageSquare,
  CheckCheck,
  Share2,
  CheckCircle2,
  UploadCloud,
  BarChart2,
  UserCheck,
  Settings,
  RotateCcw,
  Compass,
  Table,
  Layers,
  Users,
  TrendingUp,
  Target,
  Clock,
  Heart,
};

export interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenMobile = false, onCloseMobile }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Detect if any secondary route is currently active
  const isSecondaryActive = ['/dashboard', '/planning', '/production-board', '/content-masters', '/team'].some(
    (p) => location.pathname === p || location.pathname.startsWith(`${p}/`)
  );

  const [secondaryOpen, setSecondaryOpen] = useState(isSecondaryActive);

  useEffect(() => {
    if (isSecondaryActive) {
      setSecondaryOpen(true);
    }
  }, [isSecondaryActive]);

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

  const isCurrentActive = (href: string): boolean => {
    const [targetPath, targetQuery] = href.split('?');
    const currentPath = location.pathname;
    const currentQuery = location.search;

    // Special dashboard index handling
    if (href === '/dashboard' && (currentPath === '/' || currentPath === '/dashboard')) {
      return true;
    }

    // Match routes with query parameter constraints (e.g. ?status=..., ?stage=..., ?tab=...)
    if (targetQuery) {
      const targetParams = new URLSearchParams(targetQuery);
      const currentParams = new URLSearchParams(currentQuery);

      if (currentPath !== targetPath) {
        // Handle deep-linked video detail tabs matching their respective production steps
        if (targetPath === '/production' && (currentPath.startsWith('/production/') || currentPath.startsWith('/videos/'))) {
          const status = targetParams.get('status');
          const tab = currentParams.get('tab');
          if ((status === 'SCRIPT_REQUIRED' || status === 'SCRIPT_READY') && (tab === 'script' || currentPath.includes('script'))) return true;
          if (status === 'EDITING' && (tab === 'editing' || currentPath.includes('edit-video'))) return true;
          if (status === 'FINAL_REVIEW' && (tab === 'final-review' || currentPath.includes('final-video'))) return true;
          if (status === 'READY_TO_UPLOAD' && (tab === 'thumbnail' || currentPath.includes('thumbnail'))) return true;
          if (status === 'UPLOADED' && (tab === 'pinned-comment' || currentPath.includes('pinned-comment'))) return true;
        }
        return false;
      }

      for (const [key, val] of targetParams.entries()) {
        if (currentParams.get(key) !== val) return false;
      }
      return true;
    }

    // Handle recording step when viewing a video in recording tab
    if (href === '/queue') {
      if (currentPath === '/queue') return true;
      if (
        (currentPath.startsWith('/production/') || currentPath.startsWith('/videos/')) &&
        new URLSearchParams(currentQuery).get('tab') === 'recording'
      ) {
        return true;
      }
      return false;
    }

    // Step 13: Platform Packages
    if (href === '/platform-packages') {
      if (currentPath === '/platform-packages' || currentPath.includes('/platform-packages')) return true;
      if (currentPath === '/social-review' && new URLSearchParams(currentQuery).get('tab') === 'platforms') return true;
      return false;
    }

    // Step 14: Publishing Package
    if (href === '/publishing-package') {
      if (currentPath === '/publishing-package' || currentPath.includes('/publishing-package')) return true;
      if (currentPath === '/publishing' && new URLSearchParams(currentQuery).get('stage') === 'package') return true;
      return false;
    }

    // Step 15: Publish
    if (href === '/publishing') {
      if (currentPath === '/publishing' && new URLSearchParams(currentQuery).get('stage') !== 'package') return true;
      if (currentPath.endsWith('/publish')) return true;
      return false;
    }

    // If current URL has parameters that match a more specific step on the same base path,
    // don't mark the generic bare route as active.
    if (currentQuery) {
      const currentParams = new URLSearchParams(currentQuery);
      if (targetPath === '/questions' && (currentParams.has('status') || currentParams.has('step'))) {
        return false;
      }
      if (targetPath === '/production' && (currentParams.has('status') || currentParams.has('tab'))) {
        return false;
      }
      if (targetPath === '/social-review' && currentParams.get('tab') === 'platforms') {
        return false;
      }
      if (targetPath === '/publishing' && currentParams.get('stage') === 'package') {
        return false;
      }
    }

    // Standard exact or prefix path matching
    if (currentPath === targetPath) return true;
    if (currentPath.startsWith(`${targetPath}/`)) return true;

    return false;
  };

  const renderNavItem = (item: NavItem) => {
    if (item.href === '/recovery' && user?.role !== UserRole.ADMIN && user?.role !== 'ADMIN') {
      return null;
    }
    if (item.href === '/social-review' || item.href.startsWith('/social-review')) {
      const allowed = [UserRole.ADMIN, 'ADMIN', UserRole.CONTENT_MANAGER, 'CONTENT_MANAGER', UserRole.REVIEWER, 'REVIEWER'];
      if (!user || !allowed.includes(user.role as any)) {
        return null;
      }
    }

    const Icon = iconMap[item.iconName] || Layers;
    const active = isCurrentActive(item.href);
    const navId = item.step
      ? `nav-step-${item.step}`
      : `nav-${item.href.replace('/', '').replace(/[/?=&]/g, '-') || 'home'}`;

    return (
      <NavLink
        key={item.href}
        to={item.href}
        id={navId}
        onClick={onCloseMobile}
        aria-current={active ? 'page' : undefined}
        className={`group flex items-center justify-between px-3 py-1.5 text-xs rounded-lg transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-400 ${
          active
            ? 'bg-indigo-600 text-white shadow-xs font-semibold'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 font-medium'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {item.step ? (
            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 transition-colors ${
                active
                  ? 'bg-white/20 text-white font-extrabold'
                  : 'bg-slate-800 text-indigo-400 group-hover:bg-slate-700/80 group-hover:text-indigo-300 border border-slate-700/60'
              }`}
            >
              {item.step}
            </span>
          ) : (
            <Icon
              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
          )}

          {item.step && (
            <Icon
              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                active ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
              }`}
            />
          )}

          <span className="truncate text-[12px]">{item.name}</span>
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
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white shadow-inner font-bold text-base">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-white tracking-tight uppercase truncate">
              {APP_CONFIG.name}
            </span>
            <span className="text-[11px] text-indigo-400 font-medium tracking-wide">
              {APP_CONFIG.phase}
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {NAVIGATION_SECTIONS.map((section) => {
            if (section.isSecondary) {
              return (
                <div key={section.title} className="space-y-1 pt-2 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setSecondaryOpen(!secondaryOpen)}
                    id="toggle-secondary-nav"
                    aria-expanded={secondaryOpen}
                    aria-controls="secondary-nav-items"
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition-colors rounded-md hover:bg-slate-800/40 focus:outline-hidden focus:ring-2 focus:ring-indigo-400"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{section.title}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 normal-case font-normal">
                        Secondary
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        secondaryOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {secondaryOpen && (
                    <div id="secondary-nav-items" className="space-y-0.5 mt-1">
                      {section.items.map(renderNavItem)}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={section.title} className="space-y-1">
                <div className="px-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {section.title}
                  </p>
                  {section.subtitle && (
                    <p className="text-[10px] text-indigo-400 font-medium tracking-normal mt-0.5">
                      {section.subtitle}
                    </p>
                  )}
                </div>
                <div className="space-y-0.5 mt-1.5">
                  {section.items.map(renderNavItem)}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer Admin Status Badge */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200 text-[11px] leading-tight">
                  {user ? `${user.role} Active` : 'Production System'}
                </span>
                <span className="text-[10px] text-emerald-400/90 font-mono">15-Step Studio</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
