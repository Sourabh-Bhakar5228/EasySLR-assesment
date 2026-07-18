import * as React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { EmptyState } from './empty-state';
import { FileText, LucideIcon } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  data,
  emptyIcon = FileText,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display.',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        className="py-12"
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, index) => (
            <TableHead key={index} className={col.className}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {columns.map((col, colIndex) => {
              const value =
                typeof col.accessor === 'function'
                  ? col.accessor(row)
                  : (row[col.accessor] as React.ReactNode);
              return (
                <TableCell key={colIndex} className={col.className}>
                  {value}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
