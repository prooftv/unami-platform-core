import {
  Briefcase,
  ImageIcon,
  LayoutDashboard,
  Megaphone,
  Network,
  Radio,
  Settings,
  ShieldAlert,
  Tag,
  UserCircle,
  Users,
} from "lucide-react";
import type { NavGroup } from "@unami/ui";

export type { NavBadge, NavSubItem, NavMainLinkItem, NavMainParentItem, NavMainItem, NavGroup } from "@unami/ui";

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    items: [
      { id: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    id: 2,
    label: "Publishing",
    items: [
      { id: "moments", title: "Moments", url: "/moments", icon: Radio },
      { id: "broadcasts", title: "Broadcasts", url: "/broadcasts", icon: Megaphone },
      { id: "campaigns", title: "Campaigns", url: "/campaigns", icon: Briefcase },
      { id: "subscribers", title: "Subscribers", url: "/subscribers", icon: Users },
    ],
  },
  {
    id: 3,
    label: "Community",
    items: [
      { id: "moderation", title: "Moderation", url: "/moderation", icon: ShieldAlert },
      { id: "authority", title: "Authority", url: "/authority", icon: Network },
      { id: "community-profiles", title: "Community Profiles", url: "/community-profiles", icon: UserCircle },
      { id: "sponsors", title: "Sponsors", url: "/sponsors", icon: Tag },
      { id: "media", title: "Media", url: "/media", icon: ImageIcon },
    ],
  },
  {
    id: 4,
    label: "System",
    items: [
      { id: "settings", title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];
