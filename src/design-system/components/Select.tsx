import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { COLOR_TOKENS, RADIUS_TOKENS, ICON_TOKENS } from '../tokens';
import { InputSize } from '../types';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: InputSize;
  error?: boolean | string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      error = false,
      options,
      placeholder,
      children,
      className = '',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const isError = Boolean(error);

    const sizeClasses = {
      sm: 'h-8 pl-2.5 pr-8 text-xs',
      md: 'h-9.5 pl-3 pr-9 text-sm',
      lg: 'h-11 pl-4 pr-10 text-base',
    }[size];

    let stateClasses = `border-slate-300 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`;

    if (isError) {
      stateClasses = `border-rose-400 bg-rose-50/20 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20`;
    }

    if (disabled) {
      stateClasses = `${COLOR_TOKENS.disabled.inputClasses} shadow-none`;
    }

    const iconSizeClass = size === 'sm' ? ICON_TOKENS.sizes.sm : ICON_TOKENS.sizes.md;

    return (
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={id}
          disabled={disabled}
          aria-invalid={isError}
          className={`w-full appearance-none border ${RADIUS_TOKENS.md} outline-none cursor-pointer transition-all duration-150 ${sizeClasses} ${stateClasses} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <div
          className={`absolute right-3 pointer-events-none text-slate-400 ${
            isError ? 'text-rose-500' : ''
          }`}
          aria-hidden="true"
        >
          <ChevronDown className={iconSizeClass} />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
