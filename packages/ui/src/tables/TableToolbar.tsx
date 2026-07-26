import React from "react";

import { Search } from "lucide-react";

type TableToolbarProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
};

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  actions,
  filters,
}: TableToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 pb-4">
      <div className="flex items-center gap-2 flex-1">
        {onSearchChange !== undefined && (
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        )}
        {filters}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
