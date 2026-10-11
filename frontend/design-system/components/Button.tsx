import React from 'react';
import { LucideIcon } from 'lucide-react';
import { COLOR_TOKENS, SPACING_TOKENS, TYPOGRAPHY_TOKENS, RADIUS_TOKENS, SHADOW_TOKENS, ICON_TOKENS } from '../tokens';
import { ButtonVariant, ButtonSize } from '../types';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  loadingText?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  loadingText,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  // Base layout, accessibility, and focus styling
  const baseClasses = `inline-flex items-center justify-center font-semibold ${RADIUS_TOKENS.md} transition-all duration-150 select-none ${COLOR_TOKENS.focus.ring}`;

  // Dimensions & typography scales strictly abiding by the 2:1 horizontal-to-vertical padding scale
  const sizeClasses = {
    sm: `${SPACING_TOKENS.buttonPadding.sm} ${TYPOGRAPHY_TOKENS.scale.buttonSm} h-8 ${ICON_TOKENS.spacing.tight}`,
    md: `${SPACING_TOKENS.buttonPadding.md} ${TYPOGRAPHY_TOKENS.scale.buttonMd} h-9.5 ${ICON_TOKENS.spacing.normal}`,
    lg: `${SPACING_TOKENS.buttonPadding.lg} ${TYPOGRAPHY_TOKENS.scale.buttonLg} h-11 ${ICON_TOKENS.spacing.relaxed}`,
  }[size];

  // Variant classes using centralized color tokens
  const variantClasses = {
    primary: `${COLOR_TOKENS.primary.classes.bg} ${COLOR_TOKENS.primary.classes.textOnPrimary} ${COLOR_TOKENS.primary.classes.bgHover} ${COLOR_TOKENS.primary.classes.bgActive} ${SHADOW_TOKENS.xs}`,
    secondary: `${COLOR_TOKENS.secondary.classes.bg} ${COLOR_TOKENS.secondary.classes.textOnSecondary} ${COLOR_TOKENS.secondary.classes.bgHover} ${COLOR_TOKENS.secondary.classes.bgActive} ${SHADOW_TOKENS.xs}`,
    danger: `${COLOR_TOKENS.danger.classes.bg} text-white ${COLOR_TOKENS.danger.classes.bgHover} active:bg-rose-800 ${SHADOW_TOKENS.xs}`,
    ghost: `bg-transparent ${COLOR_TOKENS.text.classes.secondary} hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200`,
    outline: `bg-white ${COLOR_TOKENS.border.classes.medium} border ${COLOR_TOKENS.text.classes.secondary} hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 active:bg-slate-100 ${SHADOW_TOKENS.xs}`,
    icon: `p-2 bg-transparent ${COLOR_TOKENS.text.classes.muted} hover:bg-slate-100 hover:text-slate-900 rounded-lg`,
  }[variant];

  // Disabled and loading styling
  const stateClasses = isDisabled
    ? `${COLOR_TOKENS.disabled.classes} shadow-none`
    : 'cursor-pointer active:scale-[0.98]';

  const iconSizeClass = size === 'sm' ? ICON_TOKENS.sizes.sm : size === 'lg' ? ICON_TOKENS.sizes.lg : ICON_TOKENS.sizes.md;

  return (
    <button
      type={type}
      className={`${baseClasses} ${variant !== 'icon' ? sizeClasses : ''} ${variantClasses} ${stateClasses} ${className}`}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className={`animate-spin ${iconSizeClass} text-current ${loadingText || children ? 'mr-2' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText || children}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className={`${iconSizeClass} shrink-0`} aria-hidden="true" />
          )}
          {children && <span>{children}</span>}
          {Icon && iconPosition === 'right' && (
            <Icon className={`${iconSizeClass} shrink-0`} aria-hidden="true" />
          )}
        </>
      )}
    </button>
  );
};
