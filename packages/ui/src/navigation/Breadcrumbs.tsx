import { ChevronRight } from "lucide-react";

import type { BreadcrumbItem } from "./types";

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              {item.href && !isLast ? (
                <a href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </a>
              ) : (
                <span className={isLast ? "text-foreground font-medium" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
