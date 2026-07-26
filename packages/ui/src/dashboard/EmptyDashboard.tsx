import React from "react";

import { LayoutDashboard } from "lucide-react";

type EmptyDashboardProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyDashboard({
  title = "Your dashboard is empty",
  description = "Add data sources or configure your workspace to get started.",
  action,
}: EmptyDashboardProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="rounded-full bg-muted p-6">
        <LayoutDashboard className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
