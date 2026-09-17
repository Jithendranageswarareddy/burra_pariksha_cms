import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COLOR_TOKENS, TYPOGRAPHY_TOKENS, ICON_TOKENS } from '../tokens';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  id?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: React.ReactNode;
  metadata?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  id = 'page-header',
  title,
  description,
  breadcrumbs,
  badge,
  metadata,
  actions,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col gap-4 mb-6 pb-4 border-b ${COLOR_TOKENS.border.classes.default} ${className}`}
    >
      {/* Optional Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={index}>
                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="hover:text-slate-800 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'font-medium text-slate-800' : ''}>
                    {item.label}
                  </span>
                )}
                {!isLast && (
                  <ChevronRight className={`${ICON_TOKENS.sizes.xs} text-slate-400 shrink-0`} aria-hidden="true" />
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className={TYPOGRAPHY_TOKENS.scale.pageTitle}>{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
          {metadata && (
            <div className="flex items-center gap-3 pt-1 text-xs text-slate-500 flex-wrap">
              {metadata}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap sm:shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
