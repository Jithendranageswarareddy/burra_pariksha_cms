import React, { useState } from 'react';
import { AlertCircle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { COLOR_TOKENS, RADIUS_TOKENS, ICON_TOKENS, TYPOGRAPHY_TOKENS } from '../tokens';
import { Button } from './Button';

export interface ErrorStateProps {
  id?: string;
  title?: string;
  message?: string;
  technicalDetails?: string | Error;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  id = 'error-state-view',
  title = 'Something went wrong',
  message = 'We encountered an error while processing your request. Please try again.',
  technicalDetails,
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formattedDetails =
    typeof technicalDetails === 'string'
      ? technicalDetails
      : technicalDetails?.stack || technicalDetails?.message;

  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-rose-200 shadow-xs my-4 ${className}`}
    >
      <div className="p-3 bg-rose-50 text-rose-600 rounded-full border border-rose-100 mb-4">
        <AlertCircle className={ICON_TOKENS.sizes.xl} aria-hidden="true" />
      </div>

      <h3 className={`${TYPOGRAPHY_TOKENS.scale.cardTitle} text-slate-900 mb-1.5`}>{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">{message}</p>

      {onRetry && (
        <Button
          variant="primary"
          size="sm"
          onClick={onRetry}
          icon={RotateCcw}
          className="mb-4"
        >
          {retryLabel}
        </Button>
      )}

      {formattedDetails && (
        <div className="w-full max-w-lg mt-3 text-left border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="flex items-center justify-between w-full text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
          >
            <span>Technical diagnostic details</span>
            {showDetails ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          {showDetails && (
            <div className="mt-2 p-3 bg-slate-900 text-slate-200 text-xs font-mono rounded-lg overflow-x-auto max-h-48 whitespace-pre-wrap leading-relaxed">
              {formattedDetails}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
