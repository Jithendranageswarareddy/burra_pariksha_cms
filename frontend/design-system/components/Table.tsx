import React from 'react';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { COLOR_TOKENS, RADIUS_TOKENS, SPACING_TOKENS, TYPOGRAPHY_TOKENS, ICON_TOKENS } from '../tokens';
import { Button } from './Button';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export const Table: React.FC<TableProps> = ({
  children,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div
      className={`w-full overflow-x-auto rounded-xl border ${COLOR_TOKENS.border.classes.default} bg-white shadow-xs ${containerClassName}`}
    >
      <table className={`w-full text-left border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead
      className={`bg-slate-50/80 border-b ${COLOR_TOKENS.border.classes.default} ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
};

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  align = 'left',
  className = '',
  ...props
}) => {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <th
      className={`px-4 py-3 ${TYPOGRAPHY_TOKENS.scale.tableHeader} select-none ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody className={`divide-y ${COLOR_TOKENS.border.classes.subtle} text-slate-700 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  isSelected?: boolean;
  isClickable?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  isSelected = false,
  isClickable = false,
  className = '',
  ...props
}) => {
  const selectedClasses = isSelected
    ? 'bg-indigo-50/70 hover:bg-indigo-50/90'
    : 'hover:bg-slate-50/75';

  const clickableClasses = isClickable ? 'cursor-pointer' : '';

  return (
    <tr
      className={`transition-colors duration-100 ${selectedClasses} ${clickableClasses} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  align = 'left',
  className = '',
  ...props
}) => {
  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  return (
    <td
      className={`px-4 py-3.5 text-sm leading-normal text-slate-700 ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};

export interface TableEmptyProps {
  colSpan: number;
  message?: string;
  description?: string;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({
  colSpan,
  message = 'No records found',
  description = 'There are no items matching your current criteria.',
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 px-4 text-center">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-2.5 rounded-full bg-slate-100 text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">{message}</p>
          <p className="text-xs text-slate-500 max-w-sm">{description}</p>
        </div>
      </td>
    </tr>
  );
};

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t ${COLOR_TOKENS.border.classes.default} bg-slate-50/50 text-xs text-slate-600 ${className}`}
    >
      <div>
        {totalItems !== undefined ? (
          <span>
            Showing <strong className="font-semibold text-slate-800">{Math.min(totalItems, (currentPage - 1) * (itemsPerPage || 10) + 1)}</strong> to{' '}
            <strong className="font-semibold text-slate-800">
              {Math.min(totalItems, currentPage * (itemsPerPage || 10))}
            </strong>{' '}
            of <strong className="font-semibold text-slate-800">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-slate-800">{currentPage}</strong> of{' '}
            <strong className="font-semibold text-slate-800">{totalPages || 1}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous Page"
          icon={ChevronLeft}
        >
          Previous
        </Button>
        <span className="px-2 font-mono font-medium text-slate-700">
          {currentPage} / {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next Page"
          icon={ChevronRight}
          iconPosition="right"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
