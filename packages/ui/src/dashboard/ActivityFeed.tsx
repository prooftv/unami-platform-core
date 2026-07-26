import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { Card, CardContent, CardHeader, CardTitle } from "../primitives/Card";

export type ActivityItem = {
  id: string;
  label: string;
  description?: string;
  timestamp: string;
  icon?: LucideIcon;
  iconColor?: string;
};

type ActivityFeedProps = {
  title?: string;
  items: ActivityItem[];
  className?: string;
};

export function ActivityFeed({ title = "Recent Activity", items, className }: ActivityFeedProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="flex items-start gap-3">
                  {Icon && (
                    <div className={clsx("mt-0.5 rounded-full p-1.5 bg-muted", item.iconColor)}>
                      <Icon className="h-3 w-3" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground shrink-0">{item.timestamp}</time>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
