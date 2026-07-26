import { TableBody, TableRow } from "./TablePrimitives";

type EmptyTableProps = {
  colSpan: number;
  message?: string;
};

export function EmptyTable({ colSpan, message = "No results found." }: EmptyTableProps) {
  return (
    <TableBody>
      <TableRow>
        <td colSpan={colSpan} className="h-24 px-4 py-3 text-center text-sm text-muted-foreground">
          {message}
        </td>
      </TableRow>
    </TableBody>
  );
}
