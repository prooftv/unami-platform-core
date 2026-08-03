import { Skeleton } from "./Skeleton";
import { Card, CardContent, CardHeader } from "../primitives/Card";

export function LoadingCard() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
  );
}

/**
 * Column-aware table skeleton. Pass the same column count as the real table.
 * Optionally pass columnWidths to vary column proportions.
 */
export function TableSkeleton({
  rows = 8,
  columns = 4,
  columnWidths,
}: {
  rows?: number;
  columns?: number;
  columnWidths?: string[];
}) {
  const widths = columnWidths ?? Array.from({ length: columns }, (_, i) =>
    i === 0 ? "w-2/5" : i === columns - 1 ? "w-16" : "w-24"
  );

  return (
    <div className="w-full space-y-0 rounded-md border overflow-hidden">
      {/* header row */}
      <div className="flex items-center gap-4 border-b bg-muted/40 px-4 h-10">
        {widths.map((w, i) => (
          <Skeleton key={i} className={`h-3 ${w}`} />
        ))}
      </div>
      {/* data rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b last:border-0 px-4 h-14">
          {widths.map((w, i) => (
            <Skeleton key={i} className={`h-4 ${w}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** KPI card grid skeleton — matches the 4-col KPI pattern used across modules */
export function KPICardsSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-${columns}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3.5 w-3.5 rounded" />
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <Skeleton className="h-7 w-14 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Full page skeleton: optional KPI row + table */
export function PageSkeleton({
  kpis = 0,
  tableRows = 8,
  tableColumns = 4,
  tableColumnWidths,
}: {
  kpis?: number;
  tableRows?: number;
  tableColumns?: number;
  tableColumnWidths?: string[];
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      {kpis > 0 && <KPICardsSkeleton columns={kpis} />}
      <TableSkeleton rows={tableRows} columns={tableColumns} columnWidths={tableColumnWidths} />
    </div>
  );
}

/** @deprecated Use TableSkeleton instead */
export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return <TableSkeleton rows={rows} columns={1} columnWidths={["w-full"]} />;
}
