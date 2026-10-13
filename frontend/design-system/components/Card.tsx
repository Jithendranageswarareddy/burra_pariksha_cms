import React from 'react';
import { LucideIcon } from 'lucide-react';
import { COLOR_TOKENS, RADIUS_TOKENS, SHADOW_TOKENS, SPACING_TOKENS, TYPOGRAPHY_TOKENS } from '../tokens';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'muted' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'none',
  className = '',
  ...props
}) => {
  const variantClasses = {
    default: `${COLOR_TOKENS.surface.classes.card} border ${COLOR_TOKENS.border.classes.default} ${SHADOW_TOKENS.xs}`,
    elevated: `${COLOR_TOKENS.surface.classes.card} border ${COLOR_TOKENS.border.classes.subtle} ${SHADOW_TOKENS.md}`,
    muted: `bg-slate-50/80 border ${COLOR_TOKENS.border.classes.default}`,
    interactive: `${COLOR_TOKENS.surface.classes.card} border ${COLOR_TOKENS.border.classes.default} ${SHADOW_TOKENS.xs} ${COLOR_TOKENS.surface.classes.cardHover} transition-all duration-150 cursor-pointer hover:border-slate-300 hover:shadow-sm`,
  }[variant];

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: SPACING_TOKENS.container.cardPadding,
    lg: 'p-6 sm:p-8',
  }[padding];

  return (
    <div
      className={`rounded-xl overflow-hidden ${variantClasses} ${paddingClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  action,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${SPACING_TOKENS.container.cardHeaderPadding} border-b ${COLOR_TOKENS.border.classes.subtle} bg-slate-50/40 ${className}`}
      {...props}
    >
      <div className="space-y-0.5">{children}</div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
};

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span';
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  as: Component = 'h3',
  className = '',
  ...props
}) => {
  return (
    <Component
      className={`${TYPOGRAPHY_TOKENS.scale.cardTitle} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p
      className={`${TYPOGRAPHY_TOKENS.scale.secondary} ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`${SPACING_TOKENS.container.cardBodyPadding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${SPACING_TOKENS.container.cardFooterPadding} border-t ${COLOR_TOKENS.border.classes.subtle} bg-slate-50/60 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface StatCardProps {
  id?: string;
  title: string;
  value: number | string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    label: string;
    isPositive?: boolean;
  };
  accentColor?: 'blue' | 'indigo' | 'amber' | 'emerald' | 'rose' | 'purple' | 'cyan' | 'slate';
  onClick?: () => void;
}

const statCardColorMap = {
  blue: 'text-blue-600 bg-blue-50 border-blue-100',
  indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  amber: 'text-amber-600 bg-amber-50 border-amber-100',
  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  rose: 'text-rose-600 bg-rose-50 border-rose-100',
  purple: 'text-purple-600 bg-purple-50 border-purple-100',
  cyan: 'text-cyan-600 bg-cyan-50 border-cyan-100',
  slate: 'text-slate-600 bg-slate-50 border-slate-200',
};

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  accentColor = 'indigo',
  onClick,
}) => {
  return (
    <Card
      id={id || `stat-card-${(title || '').toString().toLowerCase().replace(/\s+/g, '-')}`}
      variant={onClick ? 'interactive' : 'default'}
      padding="none"
      onClick={onClick}
      className="p-5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{title}</p>
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg border ${statCardColorMap[accentColor]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span className={`font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-slate-600'}`}>
              {trend.label}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
