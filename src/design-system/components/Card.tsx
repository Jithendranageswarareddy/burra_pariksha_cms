import React from 'react';
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
