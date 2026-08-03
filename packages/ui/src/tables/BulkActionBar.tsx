import React from "react";

export type BulkAction = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
};

type BulkActionBarProps = {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
  entityLabel?: string;
};

/**
 * Fixed bottom action bar that appears when one or more rows are selected.
 * Consumed by any module that uses DataTable with selection enabled.
 * Lives in packages/ui — no app-specific logic.
 */
export function BulkActionBar({
  selectedCount,
  actions,
  onClear,
  entityLabel = "item",
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const label = selectedCount === 1
    ? `1 ${entityLabel} selected`
    : `${selectedCount} ${entityLabel}s selected`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg ring-1 ring-border animate-in slide-in-from-bottom-4 duration-200">
      <span className="text-sm font-medium text-foreground whitespace-nowrap">{label}</span>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            disabled={action.disabled}
            className={[
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
              action.variant === "destructive"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            ].join(" ")}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
      <div className="h-4 w-px bg-border" />
      <button
        onClick={onClear}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Clear selection"
      >
        Clear
      </button>
    </div>
  );
}
