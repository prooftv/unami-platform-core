import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardContent, CardHeader, CardTitle } from "../primitives/Card";

type Trend = { value: number; label?: string };

type MetricCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: Trend;
  className?: string;
};

export function MetricCard({ title, value, description, icon: Icon, trend, className }: MetricCardProps) {
  const trendPositive = trend && trend.value >= 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend && (
              <span className={clsx("font-medium mr-1", trendPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                {trendPositive ? "+" : ""}{trend.value}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
