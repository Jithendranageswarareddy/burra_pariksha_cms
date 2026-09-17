import React from 'react';
import { DIFFICULTY_CONFIG } from '../../config/constants';
import { DifficultyLevel } from '../../types';
import { Badge } from '../../design-system/components/Badge';

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  size?: 'sm' | 'md';
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, size = 'md' }) => {
  const safeDifficulty = difficulty || 'MEDIUM';
  const config = DIFFICULTY_CONFIG[difficulty] || {
    label: difficulty || 'MEDIUM',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
  };

  const variantMap: Record<string, 'success' | 'warning' | 'danger'> = {
    EASY: 'success',
    MEDIUM: 'warning',
    HARD: 'danger',
  };

  return (
    <Badge
      id={`badge-difficulty-${safeDifficulty.toString().toLowerCase()}`}
      variant={variantMap[safeDifficulty] || 'neutral'}
      size={size}
    >
      {config.label}
    </Badge>
  );
};
