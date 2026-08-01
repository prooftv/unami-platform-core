import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardContent, CardHeader, CardTitle } from "../primitives/Card";
import { Badge } from "../primitives/Badge";

type Trend = { value: number; label?: string };
type MetricCardProps = { title: string; value: string | number; description?: string; icon?: LucideIcon; trend?: Trend; className?: string };

export function MetricCard({ title, value, description, icon: Icon, trend, className }: MetricCardProps) {
  const trendPositive = trend && trend.value >= 0;
  return (
    <Card className={clsx("overflow-hidden", className)}>
      <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {trend && <Badge variant={trendPositive ? "success" : "destructive"}>{trendPositive ? "+" : ""}{trend.value}%</Badge>}
        </div>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
