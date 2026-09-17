import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ICON_TOKENS } from '../tokens';
import { IconSize } from '../types';

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  'aria-label'?: string;
}

export const Icon: React.FC<IconProps> = ({
  icon: LucideIconComponent,
  size = 'md',
  className = '',
  'aria-label': ariaLabel,
}) => {
  const sizeClass = ICON_TOKENS.sizes[size] || ICON_TOKENS.sizes.md;
  const isAriaHidden = !ariaLabel;

  return (
    <LucideIconComponent
      className={`shrink-0 inline-block align-middle ${sizeClass} ${className}`}
      aria-hidden={isAriaHidden}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    />
  );
};
