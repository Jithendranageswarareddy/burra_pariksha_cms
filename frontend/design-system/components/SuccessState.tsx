import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { COLOR_TOKENS, RADIUS_TOKENS, ICON_TOKENS, TYPOGRAPHY_TOKENS } from '../tokens';
import { Button } from './Button';

export interface SuccessStateProps {
  id?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  id = 'success-state-view',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-emerald-200 shadow-xs my-4 ${className}`}
    >
      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-4 animate-in zoom-in duration-200">
        <CheckCircle2 className={ICON_TOKENS.sizes.xl} aria-hidden="true" />
      </div>

      <h3 className={`${TYPOGRAPHY_TOKENS.scale.cardTitle} text-slate-900 mb-1.5`}>{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">{message}</p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAction}
              icon={ArrowRight}
              iconPosition="right"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
