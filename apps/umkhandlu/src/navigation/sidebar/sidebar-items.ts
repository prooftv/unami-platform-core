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
} from 'lucide-react';
import type { NavGroup } from '@unami/ui';

export type { NavBadge, NavSubItem, NavMainLinkItem, NavMainParentItem, NavMainItem, NavGroup } from '@unami/ui';

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
