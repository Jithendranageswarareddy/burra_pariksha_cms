import React from 'react';
import { PageHeader as DSPageHeader, PageHeaderProps as DSPageHeaderProps, BreadcrumbItem } from '../../design-system/components/PageHeader';

export interface PageHeaderProps extends DSPageHeaderProps {}
export type { BreadcrumbItem };

export const PageHeader: React.FC<PageHeaderProps> = (props) => {
  return <DSPageHeader {...props} />;
};

export default PageHeader;
