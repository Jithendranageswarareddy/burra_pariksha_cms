import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'active'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'draft';

export type BadgeSize = 'sm' | 'md';

export type AlertVariant = 'success' | 'info' | 'warning' | 'error';

export type InputSize = 'sm' | 'md' | 'lg';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type StepState = 'completed' | 'current' | 'upcoming' | 'blocked';

export interface ProductionWorkflowStep {
  stepNumber: number;
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  path: string;
  state?: StepState;
}
