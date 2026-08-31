import React from 'react';

interface LoadingStateProps {
  id?: string;
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  id = 'loading-state-view',
  message = 'Loading data...',
}) => {
  return (
    <div id={id} className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
};
