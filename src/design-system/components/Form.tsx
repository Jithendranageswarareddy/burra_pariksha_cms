import React from 'react';
import { AlertCircle } from 'lucide-react';
import { COLOR_TOKENS, ICON_TOKENS, TYPOGRAPHY_TOKENS } from '../tokens';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-1.5 mb-4 last:mb-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <label
      className={`block ${TYPOGRAPHY_TOKENS.scale.label} ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-rose-500 ml-1 font-bold" aria-hidden="true">*</span>}
    </label>
  );
};

export const FormHelperText: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p
      className={`${TYPOGRAPHY_TOKENS.scale.secondary} text-slate-500 mt-1 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

export interface FormErrorTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  error?: string;
}

export const FormErrorText: React.FC<FormErrorTextProps> = ({
  error,
  children,
  className = '',
  ...props
}) => {
  const content = error || children;
  if (!content) return null;

  return (
    <p
      className={`flex items-center gap-1.5 text-xs font-medium text-rose-600 mt-1.5 animate-in fade-in duration-150 ${className}`}
      role="alert"
      {...props}
    >
      <AlertCircle className={`${ICON_TOKENS.sizes.sm} shrink-0`} aria-hidden="true" />
      <span>{content}</span>
    </p>
  );
};

export const RequiredIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <span className={`text-rose-500 ml-1 font-bold ${className}`} aria-hidden="true">
      *
    </span>
  );
};
