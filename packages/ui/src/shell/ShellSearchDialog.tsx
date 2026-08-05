// Type contract only — search dialog implementation lives in each app
// using app-local shadcn CommandDialog for proper modal behaviour.
import type { LucideIcon } from 'lucide-react';

export interface ShellSearchItem {
  id: string;
  group: string;
  label: string;
  url: string;
  icon?: LucideIcon;
  disabled?: boolean;
  newTab?: boolean;
}
