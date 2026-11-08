import {
  Activity,
  BarChart3,
  Briefcase,
  CheckSquare,
  Database,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Layers,
  Map,
  Network,
  Settings,
  ShieldAlert,
  ShieldCheck,
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
      { id: 'intel-governance',  title: 'Governance',     url: '/intelligence/governance',  icon: ShieldAlert },
      { id: 'intel-commercial',  title: 'Commercial',     url: '/intelligence/commercial',  icon: Briefcase },
      { id: 'intel-audit',       title: 'Audit & Memory', url: '/intelligence/audit',       icon: GitBranch },
      { id: 'intel-operators',   title: 'Operators',      url: '/intelligence/operators',   icon: Users },
    ],
  },
  {
    id: 4,
    label: 'Spatial',
    items: [
      { id: 'spatial-sources',   title: 'Data Sources',    url: '/spatial/sources',   icon: Database },
      { id: 'spatial-datasets',  title: 'Datasets',        url: '/spatial/datasets',  icon: Layers },
      { id: 'spatial-pipelines', title: 'Pipeline Runs',   url: '/spatial/pipelines', icon: Activity },
      { id: 'spatial-staging',   title: 'Staging Review',  url: '/spatial/staging',   icon: Inbox },
      { id: 'spatial-map',       title: 'Geographic View', url: '/spatial/map',       icon: Map },
    ],
  },
  {
    id: 5,
    label: 'Risk & Compliance',
    items: [
      { id: 'risk',        title: 'Risk Register',  url: '/risk',        icon: ShieldAlert },
      { id: 'compliance',  title: 'Compliance',     url: '/compliance',  icon: ShieldCheck },
      { id: 'findings',    title: 'Findings',       url: '/findings',    icon: CheckSquare },
      { id: 'audit-log',   title: 'Audit Log',      url: '/audit-log',   icon: GitBranch },
    ],
  },
  {
    id: 6,
    label: 'Analytics',
    items: [
      { id: 'intel-nodes', title: 'Cross-Node View', url: '/dashboard', icon: BarChart3 },
    ],
  },
  {
    id: 7,
    label: 'System',
    items: [
      { id: 'settings', title: 'Settings', url: '/settings', icon: Settings },
    ],
  },
];
