import React from 'react';
import { DIFFICULTY_CONFIG } from '../../config/constants';
import { DifficultyLevel } from '../../types';

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  size?: 'sm' | 'md';
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, size = 'md' }) => {
  const config = DIFFICULTY_CONFIG[difficulty] || {
    label: difficulty,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      id={`badge-difficulty-${difficulty.toLowerCase()}`}
      className={`inline-flex items-center rounded border ${config.bg} ${sizeClasses} select-none`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`} />
      {config.label}
    </span>
  );
};
