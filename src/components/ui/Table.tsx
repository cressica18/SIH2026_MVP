import React, { forwardRef } from 'react';
import { EmptyState } from './EmptyState';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  emptyVariant?: 'default' | 'listings' | 'orders' | 'schemes' | 'reports' | 'matches' | 'notifications' | 'pools' | 'finance';
  onRowClick?: (item: T) => void;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage,
  emptyVariant = 'default',
  onRowClick,
  striped = true,
  hoverable = true,
  className = '',
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="w-full">
        <EmptyState variant={emptyVariant} title={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-bg-700 bg-bg-850 ${className}`}>
      <table className="w-full" role="grid">
        <thead className="bg-bg-800 border-b border-bg-700">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-3 py-2.5 text-left text-xs font-semibold text-cream-500 uppercase tracking-wider ${column.headerClassName || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bg-700">
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              className={`
                transition-colors duration-100
                ${striped && index % 2 === 1 ? 'bg-bg-800/50' : ''}
                ${hoverable && onRowClick ? 'hover:bg-bg-750 cursor-pointer' : ''}
              `}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-3 py-2.5 text-sm text-cream-200 ${column.className || ''}`}
                >
                  {column.render ? column.render(item, index) : (item as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface TableActionColumnProps<T> {
  item: T;
  actions: Array<{
    label: string;
    onClick: (item: T, e: React.MouseEvent) => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'harvest' | 'botanical';
    icon?: React.ReactNode;
    disabled?: boolean;
  }>;
}

export function TableActionCell<T>({ item, actions }: TableActionColumnProps<T>) {
  return (
    <td className="px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        {actions.map((action, index) => (
          <Button
            key={index}
            size="sm"
            variant={action.variant || 'ghost'}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(item, e);
            }}
            disabled={action.disabled}
          >
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        ))}
      </div>
    </td>
  );
}