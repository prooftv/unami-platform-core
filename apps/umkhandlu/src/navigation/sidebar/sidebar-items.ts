import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  Globe,
  LayoutDashboard,
  Network,
  Server,
  Settings,
  Shield,
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
      { id: 'overview', title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 2,
    label: 'Nodes',
    items: [
      { id: 'nodes', title: 'Registered Nodes', url: '/nodes', icon: Network },
      { id: 'node-health', title: 'Node Health', url: '/nodes/health', icon: Activity, badge: 'soon' },
    ],
  },
  {
    id: 3,
    label: 'Governance Intelligence',
    items: [
      { id: 'records-analytics', title: 'Record Analytics', url: '/intelligence/records', icon: BarChart3, badge: 'soon' },
      { id: 'notices-analytics', title: 'Notice Analytics', url: '/intelligence/notices', icon: Globe, badge: 'soon' },
      { id: 'participation-analytics', title: 'Participation', url: '/intelligence/participation', icon: Shield, badge: 'soon' },
    ],
  },
  {
    id: 4,
    label: 'Commercial Intelligence',
    items: [
      { id: 'projects', title: 'Projects', url: '/intelligence/projects', icon: Building2, badge: 'soon' },
    ],
  },
  {
    id: 5,
    label: 'Institutional Memory',
    items: [
      { id: 'audit', title: 'Audit Trails', url: '/intelligence/audit', icon: BookOpen, badge: 'soon' },
    ],
  },
  {
    id: 6,
    label: 'Platform',
    items: [
      { id: 'api-health', title: 'API Health', url: '/platform/health', icon: Server, badge: 'soon' },
      { id: 'settings', title: 'Settings', url: '/settings', icon: Settings },
    ],
  },
];
