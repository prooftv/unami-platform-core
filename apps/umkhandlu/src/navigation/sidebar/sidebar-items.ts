import {
  BookOpen,
  Building2,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Shield,
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
      { id: 'dashboard', title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 2,
    label: 'Governance',
    items: [
      { id: 'records', title: 'Records', url: '/records', icon: FileText },
      { id: 'notices', title: 'Notices', url: '/notices', icon: MessageSquare },
    ],
  },
  {
    id: 3,
    label: 'Community',
    items: [
      { id: 'participation', title: 'Participation', url: '/participation', icon: Users },
      { id: 'evidence', title: 'Evidence', url: '/evidence', icon: Shield },
    ],
  },
  {
    id: 4,
    label: 'Commercial',
    items: [
      { id: 'projects', title: 'Projects', url: '/projects', icon: Building2 },
    ],
  },
  {
    id: 5,
    label: 'Intelligence',
    items: [
      { id: 'intelligence', title: 'Intelligence', url: '/intelligence', icon: BookOpen },
    ],
  },
  {
    id: 6,
    label: 'System',
    items: [
      { id: 'settings', title: 'Settings', url: '/settings', icon: Settings },
    ],
  },
];
