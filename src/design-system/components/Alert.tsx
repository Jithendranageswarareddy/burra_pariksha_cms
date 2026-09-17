import React from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { COLOR_TOKENS, RADIUS_TOKENS, ICON_TOKENS } from '../tokens';
import { AlertVariant } from '../types';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onDismiss?: () => void;
  icon?: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  icon = true,
  className = '',
  ...props
}) => {
  const config = {
    success: {
      bg: COLOR_TOKENS.success.classes.bgSubtle,
      border: COLOR_TOKENS.success.classes.border,
      text: COLOR_TOKENS.success.classes.text,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    info: {
      bg: COLOR_TOKENS.info.classes.bgSubtle,
      border: COLOR_TOKENS.info.classes.border,
      text: COLOR_TOKENS.info.classes.text,
      icon: Info,
      iconColor: 'text-sky-600',
    },
    warning: {
      bg: COLOR_TOKENS.warning.classes.bgSubtle,
      border: COLOR_TOKENS.warning.classes.border,
      text: COLOR_TOKENS.warning.classes.text,
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    error: {
      bg: COLOR_TOKENS.danger.classes.bgSubtle,
      border: COLOR_TOKENS.danger.classes.border,
      text: COLOR_TOKENS.danger.classes.text,
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
  }[variant];

  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg} ${config.border} ${config.text} transition-all duration-150 ${className}`}
      {...props}
    >
      {icon && (
        <div className="shrink-0 pt-0.5" aria-hidden="true">
          <IconComponent className={`${ICON_TOKENS.sizes.lg} ${config.iconColor}`} />
        </div>
      )}

      <div className="flex-1 text-sm leading-relaxed space-y-0.5">
        {title && <h4 className="font-semibold text-slate-900">{title}</h4>}
        <div className="text-slate-700">{children}</div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X className={ICON_TOKENS.sizes.md} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
