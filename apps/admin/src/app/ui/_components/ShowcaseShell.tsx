"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Table2,
  FormInput,
  BarChart2,
  AlertCircle,
  Compass,
  Palette,
} from "lucide-react";
import { AppShell, Sidebar, Header } from "@moments/ui";
import type { NavigationSection } from "@moments/ui";

const NAV: NavigationSection[] = [
  {
    title: "Components",
    items: [
      { label: "Dashboard", href: "/ui/dashboard", icon: LayoutDashboard },
      { label: "Tables", href: "/ui/tables", icon: Table2 },
      { label: "Forms", href: "/ui/forms", icon: FormInput },
      { label: "Charts", href: "/ui/charts", icon: BarChart2 },
      { label: "Feedback", href: "/ui/feedback", icon: AlertCircle },
      { label: "Navigation", href: "/ui/navigation", icon: Compass },
      { label: "Theme", href: "/ui/theme", icon: Palette },
    ],
  },
];

export function ShowcaseShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AppShell
      sidebar={
        <Sidebar
          sections={NAV}
          activePath={pathname}
          header={
            <span className="text-sm font-semibold tracking-tight">UI Showcase</span>
          }
        />
      }
      header={
        <Header
          title="Unami Platform Core — Component Library"
          userArea={
            <span className="text-xs text-muted-foreground px-2 py-1 rounded-md bg-muted">
              packages/ui
            </span>
          }
        />
      }
    >
      {children}
    </AppShell>
  );
}
