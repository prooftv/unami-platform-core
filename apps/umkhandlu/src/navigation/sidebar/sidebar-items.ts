import {
  Activity,
  BarChart3,
  Briefcase,
  GitBranch,
  LayoutDashboard,
  Network,
  Settings,
  ShieldAlert,
  Users,
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
    label: 'Intelligence',
    items: [
      { id: 'intel-governance',  title: 'Governance',          url: '/intelligence/governance',  icon: ShieldAlert },
      { id: 'intel-commercial',  title: 'Commercial',          url: '/intelligence/commercial',  icon: Briefcase },
      { id: 'intel-audit',       title: 'Audit & Memory',      url: '/intelligence/audit',       icon: GitBranch },
      { id: 'intel-operators',   title: 'Operators',           url: '/intelligence/operators',   icon: Users },
    ],
  },
  {
    id: 4,
    label: 'Analytics',
    items: [
      { id: 'intel-nodes', title: 'Cross-Node View', url: '/dashboard', icon: BarChart3 },
    ],
  },
  {
    id: 5,
    label: 'System',
    items: [
      { id: 'settings', title: 'Settings', url: '/settings', icon: Settings },
    ],
  },
];
