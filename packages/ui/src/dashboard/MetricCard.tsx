import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardContent, CardHeader, CardTitle } from "../primitives/Card";
import { Badge } from "../primitives/Badge";

type Trend = { value: number; label?: string };

type MetricCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: Trend;
  /** compact — smaller value text, tighter padding. Use for KPI grids. Default: false */
  compact?: boolean;
  className?: string;
};

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  compact = false,
  className,
}: MetricCardProps) {
  const trendPositive = trend && trend.value >= 0;

  return (
    <Card className={clsx("overflow-hidden", className)}>
      <CardHeader
        className={clsx(
          "flex-row items-center justify-between gap-3",
          compact ? "pb-1 pt-3 px-4" : "pb-2",
        )}
      >
        <CardTitle
          className={clsx(
            compact
              ? "text-xs font-medium text-muted-foreground"
              : "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
          )}
        >
          {title}
        </CardTitle>
        {Icon && <Icon className={clsx("text-muted-foreground", compact ? "h-3.5 w-3.5" : "size-4")} />}
      </CardHeader>
      <CardContent className={compact ? "px-4 pb-3" : undefined}>
        <div className="flex items-baseline justify-between gap-3">
          <div className={clsx("font-bold tracking-tight", compact ? "text-xl" : "text-3xl")}>
            {value}
          </div>
          {trend && (
            <Badge variant={trendPositive ? "default" : "destructive"}>
              {trendPositive ? "+" : ""}{trend.value}%
            </Badge>
          )}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
