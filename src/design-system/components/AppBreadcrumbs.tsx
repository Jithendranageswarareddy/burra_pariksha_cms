import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { BreadcrumbItem } from './PageHeader';

export interface AppBreadcrumbsProps {
  id?: string;
  items?: BreadcrumbItem[];
  className?: string;
}

/**
 * Infer authoritative breadcrumbs matching the frozen 6-Hub IA:
 * 1. HOME
 * 2. QUESTIONS
 * 3. PRODUCTION
 * 4. PUBLISHING
 * 5. ANALYTICS
 * 6. MANAGEMENT & SYSTEM
 */
export function inferBreadcrumbs(pathname: string, search: string): BreadcrumbItem[] {
  const params = new URLSearchParams(search);
  const status = params.get('status');
  const tab = params.get('tab');

  // ==========================================
  // 1. HOME HUB
  // ==========================================
  if (pathname === '/dashboard' || pathname === '/') {
    return [
      { label: 'Home', href: '/dashboard' },
      { label: 'Overview' },
    ];
  }

  if (pathname === '/my-work') {
    return [
      { label: 'Home', href: '/dashboard' },
      { label: 'My Work' },
    ];
  }

  // ==========================================
  // 2. QUESTIONS HUB
  // ==========================================
  if (pathname === '/questions') {
    return [
      { label: 'Questions', href: '/questions' },
      { label: 'Question Library' },
    ];
  }

  if (pathname === '/studio' || pathname === '/generate' || pathname === '/questions/new') {
    return [
      { label: 'Questions', href: '/questions' },
      { label: 'Question Studio' },
    ];
  }

  if (pathname.includes('/improve')) {
    return [
      { label: 'Questions', href: '/questions' },
      { label: 'Question Studio', href: '/studio' },
      { label: 'Improve Question' },
    ];
  }

  if (pathname.includes('/verify')) {
    return [
      { label: 'Questions', href: '/questions' },
      { label: 'Question Studio', href: '/studio' },
      { label: 'Verify & Approve' },
    ];
  }

  if (pathname.startsWith('/questions/')) {
    return [
      { label: 'Questions', href: '/questions' },
      { label: 'Question Details' },
    ];
  }

  // ==========================================
  // 3. PRODUCTION HUB
  // ==========================================
  if (pathname === '/queue') {
    return [
      { label: 'Production', href: '/production' },
      { label: 'Recording Queue' },
    ];
  }

  if (pathname === '/production' || pathname === '/production-tracker' || pathname === '/production-board') {
    return [
      { label: 'Production', href: '/production' },
      { label: 'Production Pipeline' },
    ];
  }

  // Video Production contextual sub-workspaces
  if (pathname.includes('/create-script')) {
    return [
      { label: 'Production', href: '/production' },
      { label: 'Video Production', href: '/production' },
      { label: 'Scriptwriting' },
    ];
  }

  if (pathname.includes('/review-script')) {
    return [
      { label: 'Production', href: '/production' },
      { label: 'Video Production', href: '/production' },
      { label: 'Script Review' },
    ];
  }

  if (pathname.includes('/record')) {
    return [
      { label: 'Production', href: '/production' },
      { label: 'Recording Queue', href: '/queue' },
      { label: 'Studio Recording' },
    ];
  }

  if (pathname.includes('/edit-video')) {
    return [
      { label: 'Production', href: '/production' },
      { label: 'Video Production', href: '/production' },
      { label: 'Editing' },
    ];
  }

  if (pathname.includes('/final-video')) {
    return [
      { label: 'Production', href: '/production' },
      { label: 'Video Production', href: '/production' },
      { label: 'Final QC Review' },
    ];
  }

  if (pathname.includes('/thumbnail')) {
    return [
      { label: 'Production', href: '/production' },
      { label: 'Video Production', href: '/production' },
      { label: 'Thumbnail Design' },
    ];
  }

  if (pathname.includes('/pinned-comment')) {
    return [
      { label: 'Production', href: '/production' },
      { label: 'Video Production', href: '/production' },
      { label: 'Pinned Comment' },
    ];
  }

  if (pathname.startsWith('/videos/') || pathname.startsWith('/production/')) {
    let sublabel = 'Video Details';
    if (tab === 'script') sublabel = 'Script Workspace';
    else if (tab === 'recording') sublabel = 'Recording Workspace';
    else if (tab === 'editing') sublabel = 'Editing Workspace';
    else if (tab === 'final-review') sublabel = 'Final QC Review';
    else if (tab === 'thumbnail') sublabel = 'Thumbnail Studio';
    else if (tab === 'social') sublabel = 'Social Review Simulator';
    else if (tab === 'pinned-comment') sublabel = 'Pinned Comment';
    else if (tab === 'publishing') sublabel = 'Publishing Dispatcher';
    return [
      { label: 'Production', href: '/production' },
      { label: sublabel },
    ];
  }

  // ==========================================
  // 4. PUBLISHING HUB
  // ==========================================
  if (pathname.startsWith('/social-review')) {
    return [
      { label: 'Publishing', href: '/publishing' },
      { label: 'Quality Signoff' },
    ];
  }

  if (pathname.startsWith('/platform-packages')) {
    return [
      { label: 'Publishing', href: '/publishing' },
      { label: 'Platform Packages' },
    ];
  }

  if (pathname.startsWith('/publishing-package')) {
    return [
      { label: 'Publishing', href: '/publishing' },
      { label: 'Publishing Package' },
    ];
  }

  if (pathname.startsWith('/publishing')) {
    return [
      { label: 'Publishing', href: '/publishing' },
      { label: 'Publishing Manager' },
    ];
  }

  // ==========================================
  // 5. ANALYTICS HUB
  // ==========================================
  if (pathname.startsWith('/analytics') || pathname.startsWith('/social-analytics')) {
    const sub = pathname.replace('/analytics/', '').replace('/social-analytics/', '');
    let label = 'Analytics Overview';
    if (sub === 'video') label = 'Video Performance';
    else if (sub === 'platform') label = 'Platform Performance';
    else if (sub === 'topic') label = 'Topic Performance';
    else if (sub === 'subtopic') label = 'Subtopic Performance';
    else if (sub === 'difficulty') label = 'Difficulty Performance';
    else if (sub === 'engagement') label = 'Engagement';
    else if (sub === 'retention') label = 'Retention';
    else if (sub === 'intelligence') label = 'AI Insights';
    else if (sub === 'strategy') label = 'Content Strategy';
    else if (pathname.includes('social-analytics')) label = 'Snapshot Entry & Log';

    return [
      { label: 'Analytics', href: '/analytics/overview' },
      { label },
    ];
  }

  // ==========================================
  // 6. MANAGEMENT & SYSTEM HUB
  // ==========================================
  if (pathname === '/planning') {
    return [
      { label: 'Management & System', href: '/planning' },
      { label: 'Planning & Batches' },
    ];
  }

  if (pathname === '/team' || pathname === '/team-work') {
    return [
      { label: 'Management & System', href: '/team' },
      { label: 'Team Workload' },
    ];
  }

  if (pathname.startsWith('/content-masters')) {
    return [
      { label: 'Management & System', href: '/content-masters' },
      { label: 'Content Explorer' },
    ];
  }

  if (pathname === '/settings') {
    return [
      { label: 'Management & System', href: '/settings' },
      { label: 'System Health' },
    ];
  }

  if (pathname === '/recovery' || pathname === '/admin') {
    return [
      { label: 'Management & System', href: '/recovery' },
      { label: 'Disaster Recovery' },
    ];
  }

  // Clean fallback
  return [
    { label: 'Home', href: '/dashboard' },
    { label: pathname.replace('/', '').replace(/-/g, ' ') || 'Overview' },
  ];
}

export const AppBreadcrumbs: React.FC<AppBreadcrumbsProps> = ({
  id = 'app-breadcrumbs',
  items,
  className = '',
}) => {
  const location = useLocation();
  const breadcrumbList =
    items && items.length > 0 ? items : inferBreadcrumbs(location.pathname, location.search);

  if (breadcrumbList.length === 0) return null;

  return (
    <nav
      id={id}
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto py-1 whitespace-nowrap scrollbar-none ${className}`}
    >
      <Link
        to="/dashboard"
        title="Burra Pariksha Home"
        className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 rounded focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />

      {breadcrumbList.map((item, index) => {
        const isLast = index === breadcrumbList.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-indigo-600 text-slate-500 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded px-1"
              >
                {item.label}
              </Link>
            ) : (
              <span className={`px-1 font-semibold ${isLast ? 'text-slate-900' : 'text-slate-500'}`}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
