import type { LucideIcon } from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
  exact?: boolean;
};

export type NavigationSection = {
  title?: string;
  items: NavigationItem[];
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};
