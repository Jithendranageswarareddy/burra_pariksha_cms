import React from 'react';
import { LucideIcon } from 'lucide-react';
import { COLOR_TOKENS, RADIUS_TOKENS, TYPOGRAPHY_TOKENS, ICON_TOKENS } from '../tokens';
import { BadgeVariant, BadgeSize } from '../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: LucideIcon;
}

export const BADGE_CONFIG: Record<
  BadgeVariant,
  { bg: string; text: string; border: string; dot: string; label?: string }
> = {
  success: {
    bg: COLOR_TOKENS.success.classes.badgeBg,
    text: COLOR_TOKENS.success.classes.badgeText,
    border: COLOR_TOKENS.success.classes.badgeBorder,
    dot: 'bg-emerald-500',
  },
  approved: {
    bg: COLOR_TOKENS.success.classes.badgeBg,
    text: COLOR_TOKENS.success.classes.badgeText,
    border: COLOR_TOKENS.success.classes.badgeBorder,
    dot: 'bg-emerald-500',
  },
  active: {
    bg: COLOR_TOKENS.primary.classes.bgSubtle,
    text: 'text-indigo-700',
    border: COLOR_TOKENS.primary.classes.border,
    dot: 'bg-indigo-500',
  },
  warning: {
    bg: COLOR_TOKENS.warning.classes.badgeBg,
    text: COLOR_TOKENS.warning.classes.badgeText,
    border: COLOR_TOKENS.warning.classes.badgeBorder,
    dot: 'bg-amber-500',
  },
  pending: {
    bg: COLOR_TOKENS.warning.classes.badgeBg,
    text: COLOR_TOKENS.warning.classes.badgeText,
    border: COLOR_TOKENS.warning.classes.badgeBorder,
    dot: 'bg-amber-500',
  },
  draft: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  danger: {
    bg: COLOR_TOKENS.danger.classes.badgeBg,
    text: COLOR_TOKENS.danger.classes.badgeText,
    border: COLOR_TOKENS.danger.classes.badgeBorder,
    dot: 'bg-rose-500',
  },
  rejected: {
    bg: COLOR_TOKENS.danger.classes.badgeBg,
    text: COLOR_TOKENS.danger.classes.badgeText,
    border: COLOR_TOKENS.danger.classes.badgeBorder,
    dot: 'bg-rose-500',
  },
  info: {
    bg: COLOR_TOKENS.info.classes.badgeBg,
    text: COLOR_TOKENS.info.classes.badgeText,
    border: COLOR_TOKENS.info.classes.badgeBorder,
    dot: 'bg-sky-500',
  },
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = true,
  icon: Icon,
  className = '',
  id,
  ...props
}) => {
  const config = BADGE_CONFIG[variant] || BADGE_CONFIG.neutral;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-medium tracking-tight',
    md: 'px-2.5 py-1 text-xs font-medium tracking-normal',
  }[size];

  const iconSizeClass = size === 'sm' ? ICON_TOKENS.sizes.xs : ICON_TOKENS.sizes.sm;

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1.5 ${RADIUS_TOKENS.md} border ${config.bg} ${config.text} ${config.border} ${sizeClasses} select-none transition-colors ${className}`}
      {...props}
    >
      {dot && !Icon && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} aria-hidden="true" />
      )}
      {Icon && <Icon className={`${iconSizeClass} shrink-0`} aria-hidden="true" />}
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
};
