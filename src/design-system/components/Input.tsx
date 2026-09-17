import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { COLOR_TOKENS, RADIUS_TOKENS, ICON_TOKENS, TYPOGRAPHY_TOKENS } from '../tokens';
import { InputSize } from '../types';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  error?: boolean | string;
  success?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      error = false,
      success = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      onRightIconClick,
      className = '',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const isError = Boolean(error);

    // Height & typography sizing
    const sizeClasses = {
      sm: 'h-8 px-2.5 text-xs',
      md: 'h-9.5 px-3 py-2 text-sm',
      lg: 'h-11 px-4 py-2.5 text-base',
    }[size];

    // State styling
    let stateClasses = `border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`;

    if (isError) {
      stateClasses = `border-rose-400 bg-rose-50/20 text-rose-900 placeholder:text-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20`;
    } else if (success) {
      stateClasses = `border-emerald-400 bg-emerald-50/20 text-emerald-900 placeholder:text-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20`;
    }

    if (disabled) {
      stateClasses = `${COLOR_TOKENS.disabled.inputClasses} shadow-none`;
    }

    const paddingLeftClass = LeftIcon
      ? size === 'sm'
        ? 'pl-8'
        : size === 'lg'
        ? 'pl-11'
        : 'pl-9.5'
      : '';

    const paddingRightClass = RightIcon
      ? size === 'sm'
        ? 'pr-8'
        : size === 'lg'
        ? 'pr-11'
        : 'pr-9.5'
      : '';

    const iconSizeClass = size === 'sm' ? ICON_TOKENS.sizes.sm : size === 'lg' ? ICON_TOKENS.sizes.lg : ICON_TOKENS.sizes.md;

    return (
      <div className="relative flex items-center w-full">
        {LeftIcon && (
          <div
            className={`absolute left-3 pointer-events-none text-slate-400 ${
              isError ? 'text-rose-500' : success ? 'text-emerald-500' : ''
            }`}
            aria-hidden="true"
          >
            <LeftIcon className={iconSizeClass} />
          </div>
        )}

        <input
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={isError}
          className={`w-full border ${RADIUS_TOKENS.md} outline-none transition-all duration-150 ${sizeClasses} ${stateClasses} ${paddingLeftClass} ${paddingRightClass} ${className}`}
          {...props}
        />

        {RightIcon && (
          <button
            type="button"
            tabIndex={onRightIconClick ? 0 : -1}
            onClick={onRightIconClick}
            disabled={disabled}
            className={`absolute right-3 text-slate-400 ${
              onRightIconClick ? 'hover:text-slate-600 cursor-pointer' : 'pointer-events-none'
            } ${isError ? 'text-rose-500' : success ? 'text-emerald-500' : ''}`}
            aria-hidden={!onRightIconClick}
          >
            <RightIcon className={iconSizeClass} />
          </button>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
  success?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error = false, success = false, className = '', disabled, id, ...props }, ref) => {
    const isError = Boolean(error);

    let stateClasses = `border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`;

    if (isError) {
      stateClasses = `border-rose-400 bg-rose-50/20 text-rose-900 placeholder:text-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20`;
    } else if (success) {
      stateClasses = `border-emerald-400 bg-emerald-50/20 text-emerald-900 placeholder:text-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20`;
    }

    if (disabled) {
      stateClasses = `${COLOR_TOKENS.disabled.inputClasses} shadow-none`;
    }

    return (
      <textarea
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={isError}
        className={`w-full p-3 text-sm border ${RADIUS_TOKENS.md} outline-none transition-all duration-150 leading-relaxed ${stateClasses} ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
