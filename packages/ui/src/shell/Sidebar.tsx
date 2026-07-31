"use client";

import { clsx } from "clsx";
import type { NavigationSection } from "../navigation/types";

type SidebarProps = {
  sections: NavigationSection[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  collapsed?: boolean;
  className?: string;
  onNavigate?: (href: string) => void;
  activePath?: string;
};

export function Sidebar({ sections, header, footer, collapsed = false, className, onNavigate, activePath }: SidebarProps) {
  return (
    <aside
      data-collapsed={collapsed}
      className={clsx(
        "sticky top-0 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {header && <div className={clsx("flex h-16 shrink-0 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-4")}>{header}</div>}
      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Primary navigation">
        <div className="flex flex-col gap-5">
          {sections.map((section, sectionIndex) => (
            <section key={section.title ?? sectionIndex} className="flex flex-col gap-1">
              {section.title && !collapsed && <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50">{section.title}</p>}
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const isActive = activePath ? activePath === item.href || (!item.exact && activePath.startsWith(`${item.href}/`)) : false;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <a
                        href={item.disabled ? undefined : item.href}
                        title={collapsed ? item.label : undefined}
                        onClick={onNavigate && !item.disabled ? (event) => { event.preventDefault(); onNavigate(item.href); } : undefined}
                        aria-current={isActive ? "page" : undefined}
                        aria-disabled={item.disabled}
                        className={clsx(
                          "group flex h-9 items-center gap-3 rounded-md px-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                          isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          item.disabled && "pointer-events-none opacity-50",
                          collapsed && "justify-center",
                        )}
                      >
                        {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && item.badge !== undefined && <span className="ml-auto rounded-md bg-sidebar-primary px-1.5 py-0.5 text-[10px] text-sidebar-primary-foreground">{item.badge}</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </nav>
      {footer && <div className={clsx("shrink-0 border-t border-sidebar-border", collapsed ? "p-2" : "p-3")}>{footer}</div>}
    </aside>
  );
}
