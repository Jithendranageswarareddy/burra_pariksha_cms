import React from 'react';
import { LucideIcon, FolderSearch } from 'lucide-react';
import { COLOR_TOKENS, RADIUS_TOKENS, ICON_TOKENS, TYPOGRAPHY_TOKENS } from '../tokens';
import { Button } from './Button';

export interface EmptyStateProps {
  id?: string;
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id = 'empty-state-view',
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center p-10 sm:p-14 text-center bg-white rounded-xl border border-dashed ${COLOR_TOKENS.border.classes.medium} my-4 ${className}`}
    >
      <div className="p-3.5 bg-slate-50 text-slate-400 rounded-full border border-slate-200 mb-4 shadow-2xs">
        <Icon className={ICON_TOKENS.sizes.xl} aria-hidden="true" />
      </div>

      <h3 className={`${TYPOGRAPHY_TOKENS.scale.cardTitle} text-slate-800 mb-1.5`}>{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">{description}</p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
