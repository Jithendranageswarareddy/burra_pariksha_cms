import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { BreadcrumbItem } from './PageHeader';

export interface AppBreadcrumbsProps {
  id?: string;
  items?: BreadcrumbItem[];
  className?: string;
}

export function inferBreadcrumbs(pathname: string, search: string): BreadcrumbItem[] {
  const params = new URLSearchParams(search);
  const status = params.get('status');
  const tab = params.get('tab');
  const stage = params.get('stage');

  // 1. Studio 01
  if (pathname === '/studio' || pathname === '/generate') {
    return [
      { label: 'Content Studio', href: '/studio' },
      { label: '01 Generate Question' },
    ];
  }

  // 2. Questions 02 - 04
  if (pathname === '/questions') {
    if (status === 'DRAFT') {
      return [
        { label: 'Content Studio', href: '/studio' },
        { label: '03 Improve Question' },
      ];
    }
    if (status === 'GENERATED') {
      return [
        { label: 'Content Studio', href: '/studio' },
        { label: '04 Verify & Approve' },
      ];
    }
    return [
      { label: 'Content Studio', href: '/studio' },
      { label: '02 Question Library' },
    ];
  }

  if (pathname.startsWith('/questions/')) {
    return [
      { label: 'Content Studio', href: '/studio' },
      { label: 'Question Library', href: '/questions' },
      { label: 'Question Details' },
    ];
  }

  // 3. Queue 07
  if (pathname === '/queue') {
    return [
      { label: 'Content Studio', href: '/studio' },
      { label: '07 Record Video' },
    ];
  }

  // 4. Production 05, 06, 08, 09, 10, 11
  if (pathname === '/production') {
    if (status === 'SCRIPT_REQUIRED') {
      return [
        { label: 'Content Studio', href: '/studio' },
        { label: '05 Create Script' },
      ];
    }
    if (status === 'SCRIPT_READY') {
      return [
        { label: 'Content Studio', href: '/studio' },
        { label: '06 Review Script' },
      ];
    }
    if (status === 'EDITING') {
      return [
        { label: 'Content Studio', href: '/studio' },
        { label: '08 Edit Video' },
      ];
    }
    if (status === 'FINAL_REVIEW') {
      return [
        { label: 'Content Studio', href: '/studio' },
        { label: '09 Final Video' },
      ];
    }
    if (status === 'READY_TO_UPLOAD') {
      return [
        { label: 'Content Studio', href: '/studio' },
        { label: '10 Create Thumbnail' },
      ];
    }
    if (status === 'UPLOADED') {
      return [
        { label: 'Content Studio', href: '/studio' },
        { label: '11 Pinned Comment' },
      ];
    }
    return [
      { label: 'Content Studio', href: '/studio' },
      { label: 'Production Workboard' },
    ];
  }

  if (pathname.startsWith('/production/') || pathname.startsWith('/videos/')) {
    return [
      { label: 'Content Studio', href: '/studio' },
      { label: 'Production', href: '/production' },
      { label: 'Current Video' },
    ];
  }

  // 5. Social Review 12, 13
  if (pathname === '/social-review') {
    if (tab === 'platforms') {
      return [
        { label: 'Content Studio', href: '/studio' },
        { label: '13 Platform Packages' },
      ];
    }
    return [
      { label: 'Content Studio', href: '/studio' },
      { label: '12 Social Review' },
    ];
  }

  if (pathname.startsWith('/social-review/')) {
    return [
      { label: 'Content Studio', href: '/studio' },
      { label: 'Social Review', href: '/social-review' },
      { label: 'Review Package' },
    ];
  }

  // 6. Publishing 14, 15
  if (pathname === '/publishing') {
    if (stage === 'package') {
      return [
        { label: 'Content Studio', href: '/studio' },
        { label: '14 Publishing Package' },
      ];
    }
    return [
      { label: 'Content Studio', href: '/studio' },
      { label: '15 Publish' },
    ];
  }

  // 7. Analytics
  if (pathname.startsWith('/analytics') || pathname === '/social-analytics' || pathname.startsWith('/social-analytics/')) {
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
    else if (pathname === '/social-analytics') label = 'Snapshot Entry & Log';

    return [
      { label: 'Analytics', href: '/analytics/overview' },
      { label },
    ];
  }

  // 8. Workspace
  if (pathname === '/my-work') {
    return [
      { label: 'Workspace', href: '/my-work' },
      { label: 'My Work' },
    ];
  }

  // 9. System
  if (pathname === '/settings') {
    return [
      { label: 'System', href: '/settings' },
      { label: 'Settings' },
    ];
  }

  if (pathname === '/recovery' || pathname === '/admin') {
    return [
      { label: 'System', href: '/recovery' },
      { label: 'Admin & Recovery' },
    ];
  }

  // 10. Management Secondary
  if (pathname === '/dashboard' || pathname === '/') {
    return [
      { label: 'Management', href: '/dashboard' },
      { label: 'Pipeline Overview' },
    ];
  }

  if (pathname === '/planning') {
    return [
      { label: 'Management', href: '/planning' },
      { label: 'Planning & Batches' },
    ];
  }

  if (pathname === '/production-board') {
    return [
      { label: 'Management', href: '/production-board' },
      { label: 'Production Board' },
    ];
  }

  if (pathname.startsWith('/content-masters')) {
    return [
      { label: 'Management', href: '/content-masters' },
      { label: 'Content Masters' },
    ];
  }

  if (pathname === '/team' || pathname === '/team-work') {
    return [
      { label: 'Management', href: '/team' },
      { label: 'Team Operations' },
    ];
  }

  return [
    { label: 'Content Studio', href: '/studio' },
    { label: pathname.replace('/', '').replace(/-/g, ' ') || 'Overview' },
  ];
}

export const AppBreadcrumbs: React.FC<AppBreadcrumbsProps> = ({
  id = 'app-breadcrumbs',
  items,
  className = '',
}) => {
  const location = useLocation();
  const breadcrumbList = items && items.length > 0
    ? items
    : inferBreadcrumbs(location.pathname, location.search);

  if (breadcrumbList.length === 0) return null;

  return (
    <nav
      id={id}
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto py-1 whitespace-nowrap scrollbar-none ${className}`}
    >
      <Link
        to="/studio"
        title="Burra Pariksha Studio"
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
