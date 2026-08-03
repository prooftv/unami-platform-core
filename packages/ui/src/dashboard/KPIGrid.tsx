import React from "react";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { MetricCard } from "./MetricCard";

export type KPIItem = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
};

type KPIGridProps = {
  children?: React.ReactNode;
  /** Shorthand: pass items array instead of children */
  items?: KPIItem[];
  columns?: 2 | 3 | 4;
  className?: string;
};

export function KPIGrid({ children, items, columns = 4, className }: KPIGridProps) {
  return (
    <div
      className={clsx(
        "grid gap-3",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {items
        ? items.map((item) => (
            <MetricCard key={item.title} compact {...item} />
          ))
        : children}
    </div>
  );
}
