import React from 'react';
import { EmptyState as DSEmptyState, EmptyStateProps as DSEmptyStateProps } from '../../design-system/components/EmptyState';

export interface EmptyStateProps extends DSEmptyStateProps {}

export const EmptyState: React.FC<EmptyStateProps> = (props) => {
  return <DSEmptyState {...props} />;
};

export default EmptyState;
