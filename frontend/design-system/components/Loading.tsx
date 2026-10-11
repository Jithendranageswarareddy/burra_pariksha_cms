import React from 'react';
import { COLOR_TOKENS, RADIUS_TOKENS } from '../tokens';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-10 h-10 border-3',
  }[size];

  return (
    <div
      className={`rounded-full animate-spin border-indigo-200 border-t-indigo-600 ${sizeClasses} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export interface PageLoadingProps {
  id?: string;
  message?: string;
  subtitle?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  id = 'page-loading-state',
  message = 'Loading content...',
  subtitle = 'Please wait while we retrieve the latest data.',
}) => {
  return (
    <div
      id={id}
      className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4 animate-in fade-in duration-200"
    >
      <Spinner size="lg" />
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-semibold text-slate-800">{message}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
};

export interface SectionLoadingProps {
  id?: string;
  message?: string;
  className?: string;
}

export const SectionLoading: React.FC<SectionLoadingProps> = ({
  id = 'section-loading-state',
  message = 'Loading data...',
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center p-12 space-y-3 bg-white/60 rounded-xl border border-dashed border-slate-200 ${className}`}
    >
      <Spinner size="md" />
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
};

export const CardLoading: React.FC<{ count?: number; className?: string }> = ({
  count = 1,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3.5 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-16" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-5/6" />
          </div>
          <div className="h-8 bg-slate-100 rounded w-1/3 pt-2" />
        </div>
      ))}
    </div>
  );
};

export const ButtonLoading: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const spinnerSize = size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm';
  return <Spinner size={spinnerSize} className="mr-2 text-current" />;
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantClass = {
    text: 'rounded h-3.5 w-full my-1',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }[variant];

  return (
    <div
      className={`bg-slate-200/80 animate-pulse ${variantClass} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
};
