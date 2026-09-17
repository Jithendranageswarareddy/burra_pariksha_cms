import React from 'react';
import { SectionLoading, PageLoading, Spinner, Skeleton } from '../../design-system/components/Loading';

export interface LoadingStateProps {
  id?: string;
  message?: string;
  fullPage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  id = 'loading-state-view',
  message = 'Loading data...',
  fullPage = false,
}) => {
  if (fullPage) {
    return <PageLoading id={id} message={message} />;
  }
  return <SectionLoading id={id} message={message} />;
};

export { Spinner, Skeleton, PageLoading, SectionLoading };
export default LoadingState;
