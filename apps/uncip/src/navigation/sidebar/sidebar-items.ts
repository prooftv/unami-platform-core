import {
  AlertTriangle,
  Baby,
  LayoutDashboard,
  School,
  Settings,
  Shield,
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
    label: "Children",
    items: [
      { id: "children", title: "Children", url: "/children", icon: Baby },
      { id: "alerts", title: "Alerts", url: "/alerts", icon: AlertTriangle },
    ],
  },
  {
    id: 3,
    label: "Administration",
    items: [
      { id: "users",    title: "Users",         url: "/users",    icon: Users },
      { id: "schools",  title: "Schools",        url: "/schools",  icon: School },
      { id: "stations", title: "SAPS Stations",  url: "/stations", icon: Shield },
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
