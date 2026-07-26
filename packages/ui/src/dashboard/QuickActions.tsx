import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../primitives/Card";

export type QuickAction = {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
};

type QuickActionsProps = {
  title?: string;
  actions: QuickAction[];
  className?: string;
};

export function QuickActions({ title = "Quick Actions", actions, className }: QuickActionsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className="flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{action.label}</span>
                {action.description && (
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
