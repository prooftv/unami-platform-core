import React from "react";

import {
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "./TablePrimitives";
import { EmptyTable } from "./EmptyTable";

export type ColumnDef<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  emptyMessage,
  className,
}: DataTableProps<T>) {
  return (
    <TableContainer className={className}>
      <TableHead>
        <TableRow>
          {columns.map((col) => (
            <TableHeaderCell key={col.key} className={col.className}>
              {col.header}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      {data.length === 0 ? (
        <EmptyTable colSpan={columns.length} message={emptyMessage} />
      ) : (
        <TableBody>
          {data.map((row) => (
            <TableRow key={getRowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      )}
    </TableContainer>
  );
}
