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
  // Selection — all optional, omit to render without checkboxes
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: () => void;
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  onRowClick,
  emptyMessage,
  className,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: DataTableProps<T>) {
  const selectable = selectedIds !== undefined && onToggleRow !== undefined;
  const allSelected = selectable && data.length > 0 && data.every((r) => selectedIds.has(getRowKey(r)));
  const someSelected = selectable && data.some((r) => selectedIds.has(getRowKey(r)));
  const effectiveColCount = columns.length + (selectable ? 1 : 0);

  return (
    <TableContainer className={className}>
      <TableHead>
        <TableRow>
          {selectable && (
            <TableHeaderCell className="w-10 pr-0">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                onChange={onToggleAll}
                className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                aria-label="Select all"
              />
            </TableHeaderCell>
          )}
          {columns.map((col) => (
            <TableHeaderCell key={col.key} className={col.className}>
              {col.header}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      {data.length === 0 ? (
        <EmptyTable colSpan={effectiveColCount} message={emptyMessage} />
      ) : (
        <TableBody>
          {data.map((row) => {
            const id = getRowKey(row);
            const isSelected = selectable && selectedIds.has(id);
            return (
              <TableRow
                key={id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={isSelected ? "bg-muted/60" : undefined}
              >
                {selectable && (
                  <TableCell className="w-10 pr-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => { e.stopPropagation(); onToggleRow(id); }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-input accent-primary cursor-pointer"
                      aria-label="Select row"
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      )}
    </TableContainer>
  );
}
