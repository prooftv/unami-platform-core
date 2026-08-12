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

type UNCIPRole = "admin" | "parent" | "school" | "authority" | "community";

const ALL_ITEMS = {
  dashboard: { id: "dashboard", title: "Dashboard",     url: "/dashboard", icon: LayoutDashboard },
  children:  { id: "children",  title: "Children",      url: "/children",  icon: Baby },
  alerts:    { id: "alerts",    title: "Alerts",         url: "/alerts",    icon: AlertTriangle },
  users:     { id: "users",     title: "Users",          url: "/users",     icon: Users },
  schools:   { id: "schools",   title: "Schools",        url: "/schools",   icon: School },
  stations:  { id: "stations",  title: "SAPS Stations",  url: "/stations",  icon: Shield },
  settings:  { id: "settings",  title: "Settings",       url: "/settings",  icon: Settings },
} as const;

const ROLE_ITEMS: Record<UNCIPRole, (keyof typeof ALL_ITEMS)[]> = {
  admin:     ["dashboard", "children", "alerts", "users", "schools", "stations", "settings"],
  parent:    ["dashboard", "children", "alerts", "settings"],
  school:    ["dashboard", "children", "alerts", "schools", "settings"],
  authority: ["dashboard", "children", "alerts", "schools", "stations", "settings"],
  community: ["dashboard", "alerts", "settings"],
};

export function getSidebarItems(role: string): NavGroup[] {
  const keys = ROLE_ITEMS[role as UNCIPRole] ?? ROLE_ITEMS.community;
  const items = keys.map((k) => ALL_ITEMS[k]);

  const dashboard = items.filter((i) => i.id === "dashboard");
  const children  = items.filter((i) => i.id === "children" || i.id === "alerts");
  const admin     = items.filter((i) => i.id === "users" || i.id === "schools" || i.id === "stations");
  const system    = items.filter((i) => i.id === "settings");

  const groups: NavGroup[] = [];
  if (dashboard.length) groups.push({ id: 1, items: dashboard });
  if (children.length)  groups.push({ id: 2, label: "Children", items: children });
  if (admin.length)     groups.push({ id: 3, label: "Administration", items: admin });
  if (system.length)    groups.push({ id: 4, label: "System", items: system });
  return groups;
}

/** @deprecated use getSidebarItems(role) */
export const sidebarItems: NavGroup[] = getSidebarItems("admin");
