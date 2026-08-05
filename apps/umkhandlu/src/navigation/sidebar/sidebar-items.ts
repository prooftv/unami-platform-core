import {
  Activity,
  LayoutDashboard,
  Network,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type NavBadge = 'new' | 'soon';

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    items: [
      { id: 'overview', title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 2,
    label: 'Nodes',
    items: [
      { id: 'nodes',       title: 'Registered Nodes', url: '/nodes',        icon: Network },
      { id: 'node-health', title: 'Node Health',       url: '/nodes/health', icon: Activity },
    ],
  },
  {
    id: 3,
    label: 'Platform',
    items: [
      { id: 'settings', title: 'Settings', url: '/settings', icon: Settings },
    ],
  },
];
